/**
 * Static PNW roads bundle.
 *
 * The whole motorway+trunk+primary geometry of the Pacific Northwest is
 * pre-fetched into /data/pnw-roads.json by scripts/build-roads.mjs and
 * shipped with the app. Runtime loads it once, filters by viewport for
 * each pan/zoom, and never touches Overpass.
 *
 * A periodic refresh checks the bundle's built_at timestamp; if a newer
 * build is on disk the client swaps in the fresh data without a reload.
 */
import type { RoadPolyline } from "@/types/osm";

interface Way {
  id: number;
  classification: RoadPolyline["classification"];
  geometry: [number, number][];
}

export interface RoadBundle {
  built_at: string;
  source: string;
  bbox: { south: number; west: number; north: number; east: number };
  classes: string[];
  way_count: number;
  ways: Way[];
}

const BUNDLE_URL = `${import.meta.env.BASE_URL}data/pnw-roads.json`;

export async function fetchRoadBundle(
  cacheBust = false,
  onProgress?: (loaded: number, total: number | null) => void,
): Promise<RoadBundle | null> {
  try {
    const url = cacheBust ? `${BUNDLE_URL}?t=${Date.now()}` : BUNDLE_URL;
    const r = await fetch(url);
    if (!r.ok) {
      console.warn(`[roads] bundle fetch ${r.status}`);
      return null;
    }
    // Stream the body so we can show download progress. Content-Length is
    // the gzipped size; perfectly fine for a percentage indicator.
    const totalHeader = r.headers.get("content-length");
    const total = totalHeader ? Number(totalHeader) : null;
    if (!r.body || !onProgress) {
      return (await r.json()) as RoadBundle;
    }
    const reader = r.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    onProgress(0, total);
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        onProgress(loaded, total);
      }
    }
    const buf = new Uint8Array(loaded);
    let offset = 0;
    for (const c of chunks) {
      buf.set(c, offset);
      offset += c.length;
    }
    const text = new TextDecoder("utf-8").decode(buf);
    return JSON.parse(text) as RoadBundle;
  } catch (err) {
    console.warn("[roads] bundle fetch failed:", err);
    return null;
  }
}

/** Convert a bundle Way to the renderer's RoadPolyline (with arc lengths). */
export function waysToPolylines(ways: Way[]): RoadPolyline[] {
  const out: RoadPolyline[] = [];
  for (const w of ways) {
    if (w.geometry.length < 2) continue;
    const points = w.geometry.map((g) => [g[0], g[1]] as const);
    const { cumulative, totalLength } = arcLengths(points);
    out.push({
      id: `way-${w.id}`,
      classification: w.classification,
      points,
      cumulative,
      totalLength,
    });
  }
  return out;
}

/** Filter ways whose geometry intersects the given bbox. */
export function filterWaysToBbox(
  ways: Way[],
  bbox: { south: number; west: number; north: number; east: number },
): Way[] {
  return ways.filter((w) => {
    for (const [lon, lat] of w.geometry) {
      if (lon >= bbox.west && lon <= bbox.east && lat >= bbox.south && lat <= bbox.north) {
        return true;
      }
    }
    return false;
  });
}

function haversine(a: readonly [number, number], b: readonly [number, number]): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function arcLengths(points: readonly (readonly [number, number])[]) {
  const cumulative: number[] = [0];
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    acc += haversine(points[i - 1]!, points[i]!);
    cumulative.push(acc);
  }
  return { cumulative, totalLength: acc };
}
