#!/usr/bin/env node
/**
 * Build the static PNW roads bundle.
 *
 * Tile-fetches motorway + trunk + primary across the PNW bbox from the
 * kumi.systems Overpass mirror and concatenates into one JSON. Output
 * carries a built_at timestamp so the client can decide when to refresh.
 *
 *   pnpm run roads:build
 *
 * Re-run when you feel like it — OSM highway centerlines change ~once a
 * year. The client checks built_at periodically; if it's stale the
 * client refetches.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OVERPASS = "https://overpass.kumi.systems/api/interpreter";
// Seattle metro: Tacoma south up to North Seattle / Edmonds, Olympic
// Peninsula east edge to Sammamish/Bellevue. One small bbox keeps the
// Overpass request well under the kumi 504 threshold.
const PNW = { south: 47.10, west: -122.65, north: 47.85, east: -121.95 };
const CLASSES = ["motorway", "trunk", "primary", "secondary"];
// Single tile — small enough not to need splitting.
const NX = 1;
const NY = 1;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../apps/web/public/data/pnw-roads.json");

function tiles() {
  const out = [];
  const dLat = (PNW.north - PNW.south) / NY;
  const dLon = (PNW.east - PNW.west) / NX;
  for (let i = 0; i < NY; i++) {
    for (let j = 0; j < NX; j++) {
      out.push({
        south: PNW.south + i * dLat,
        north: PNW.south + (i + 1) * dLat,
        west: PNW.west + j * dLon,
        east: PNW.west + (j + 1) * dLon,
      });
    }
  }
  return out;
}

function query(bbox) {
  const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const ways = CLASSES.map((c) => `  way["highway"="${c}"](${b});`).join("\n");
  return `[out:json][timeout:90];\n(\n${ways}\n);\nout geom;`;
}

async function fetchTile(bbox, attempt = 1) {
  const body = "data=" + encodeURIComponent(query(bbox));
  const t0 = Date.now();
  const r = await fetch(OVERPASS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "pnw-twin/0.0 build-roads" },
    body,
  });
  if (!r.ok) {
    if (attempt < 3) {
      console.warn(`tile ${JSON.stringify(bbox)} → ${r.status}, retry ${attempt}/2`);
      await new Promise((res) => setTimeout(res, 5000 * attempt));
      return fetchTile(bbox, attempt + 1);
    }
    throw new Error(`tile failed after retries: ${r.status}`);
  }
  const j = await r.json();
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`tile ${bbox.south.toFixed(1)},${bbox.west.toFixed(1)} → ${j.elements?.length ?? 0} ways in ${dt}s`);
  return j.elements ?? [];
}

async function main() {
  const allTiles = tiles();
  const ways = new Map(); // id → way
  for (const tile of allTiles) {
    try {
      const els = await fetchTile(tile);
      for (const w of els) {
        if (w.type !== "way" || !w.geometry || w.geometry.length < 2) continue;
        if (ways.has(w.id)) continue;
        ways.set(w.id, {
          id: w.id,
          classification: w.tags?.highway ?? "primary",
          geometry: w.geometry.map((g) => [Number(g.lon.toFixed(5)), Number(g.lat.toFixed(5))]),
        });
      }
    } catch (err) {
      console.error("tile error:", err.message);
    }
  }
  const bundle = {
    built_at: new Date().toISOString(),
    source: "overpass.kumi.systems",
    bbox: PNW,
    classes: CLASSES,
    way_count: ways.size,
    ways: [...ways.values()],
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(bundle));
  const sizeMB = ((JSON.stringify(bundle).length / 1024 / 1024)).toFixed(2);
  console.log(`\nWrote ${OUT}`);
  console.log(`${ways.size} ways, ${sizeMB} MB raw (vite serves gzipped)`);
  console.log(`built_at: ${bundle.built_at}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
