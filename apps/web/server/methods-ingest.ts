/**
 * Methods ingest. The seam for externally-developed seismic methods (dv/v,
 * HVSR, receiver functions, etc.) to push results into the twin without
 * being part of this codebase.
 *
 * Three POST endpoints:
 *   POST /api/methods/sample      → contracts/Sample      (continuous values)
 *   POST /api/methods/geoproduct  → contracts/GeoProduct  (heavy artifacts)
 *   POST /api/methods/event       → contracts/HazardEvent (threshold crossings)
 *
 * One GET for the frontend:
 *   GET  /api/methods/recent     → last N items of each kind
 *
 * Storage is in-memory for dev. Production swaps to D1 (samples, events) + R2
 * (geoproduct artifact URIs). The contract surface does not change.
 *
 * Auth: a shared token via METHODS_INGEST_TOKEN env var. If unset (dev),
 * POSTs are accepted without auth — never run that in production.
 */
import type { IncomingMessage, ServerResponse } from "node:http";

interface Sample {
  metricId: string;
  t: number;
  v: number;
  quality?: number;
}
interface GeoProduct {
  id: string;
  kind: string;
  uri: string;
  t0: number;
  t1: number;
  entityId?: string;
  uncertainty?: Record<string, number>;
  method: string;
}
interface HazardEvent {
  id: string;
  kind: string;
  t0: number;
  status: "open" | "ack" | "resolved";
  entityIds: string[];
  metricIds: string[];
  characterization?: Record<string, unknown>;
  isPrediction: false;
  officialSource?: string;
}

const RING_SIZE = 5_000;

class Ring<T> {
  private buf: T[] = [];
  push(item: T) {
    this.buf.push(item);
    if (this.buf.length > RING_SIZE) this.buf.shift();
  }
  recent(n: number) {
    return this.buf.slice(-n);
  }
  get size() {
    return this.buf.length;
  }
}

const samples = new Ring<Sample>();
const products = new Ring<GeoProduct>();
const events = new Ring<HazardEvent>();

async function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function authOk(req: IncomingMessage): boolean {
  const required = process.env.METHODS_INGEST_TOKEN;
  if (!required) return true;
  const header = req.headers["authorization"];
  return header === `Bearer ${required}`;
}

function isSample(x: any): x is Sample {
  return (
    x &&
    typeof x.metricId === "string" &&
    typeof x.t === "number" &&
    typeof x.v === "number"
  );
}
function isGeoProduct(x: any): x is GeoProduct {
  return (
    x &&
    typeof x.id === "string" &&
    typeof x.kind === "string" &&
    typeof x.uri === "string" &&
    typeof x.t0 === "number" &&
    typeof x.t1 === "number" &&
    typeof x.method === "string"
  );
}
function isHazardEvent(x: any): x is HazardEvent {
  return (
    x &&
    typeof x.id === "string" &&
    typeof x.kind === "string" &&
    typeof x.t0 === "number" &&
    (x.status === "open" || x.status === "ack" || x.status === "resolved") &&
    Array.isArray(x.entityIds) &&
    Array.isArray(x.metricIds) &&
    x.isPrediction === false
  );
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export async function handleMethodsIngest(
  req: IncomingMessage,
  res: ServerResponse,
  kind: "sample" | "geoproduct" | "event",
) {
  if (req.method !== "POST") {
    send(res, 405, { error: "POST only" });
    return;
  }
  if (!authOk(req)) {
    send(res, 401, { error: "missing or wrong bearer token" });
    return;
  }
  try {
    const body = await readJson(req);
    const items = Array.isArray(body) ? body : [body];
    let accepted = 0;
    for (const item of items) {
      if (kind === "sample" && isSample(item)) {
        samples.push(item);
        accepted++;
      } else if (kind === "geoproduct" && isGeoProduct(item)) {
        products.push(item);
        accepted++;
      } else if (kind === "event" && isHazardEvent(item)) {
        events.push(item);
        accepted++;
      }
    }
    send(res, 200, { accepted, rejected: items.length - accepted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad request";
    send(res, 400, { error: msg });
  }
}

export function handleMethodsRecent(_req: IncomingMessage, res: ServerResponse) {
  send(res, 200, {
    samples: samples.recent(200),
    geoproducts: products.recent(50),
    events: events.recent(50),
    counts: { samples: samples.size, geoproducts: products.size, events: events.size },
  });
}
