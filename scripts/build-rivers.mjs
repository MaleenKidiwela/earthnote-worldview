#!/usr/bin/env node
/**
 * Build the static PNW rivers bundle from USGS NHDPlus HR.
 *
 * Pulls NetworkNHDFlowline + NHDPlusGage for the Cascades / Salish bbox
 * via the National Map ArcGIS REST service. Saved as
 * apps/web/public/data/pnw-rivers.json with built_at, flowlines, gauges.
 *
 *   pnpm run rivers:build
 *
 * Tunable knobs at top of file: BBOX (geographic extent), MIN_ORDER
 * (Strahler stream order floor — 4 keeps major tribs, 5 cuts to main
 * stems), and TILE size for pagination.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FLOWLINE_LAYER = "https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/3/query";
const GAGE_LAYER = "https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/0/query";

// Cascades + Salish Sea + Olympics. Wide enough to cover all the gauges
// we already pull from USGS NWIS.
const BBOX = { south: 45.5, west: -124.5, north: 49.5, east: -120.0 };
// Strahler stream order floor. 4 = sizable tribs; 5 = major rivers only.
// Salmon/sockeye-relevant rivers (Skagit, Sauk, Snoqualmie, Snohomish,
// Cedar, Green, Puyallup, Nooksack, Stillaguamish) are all order ≥4.
const MIN_ORDER = 4;
// Tile the bbox so each query stays under the 2000-record cap.
const NX = 3;
const NY = 3;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../apps/web/public/data/pnw-rivers.json");

function tiles() {
  const out = [];
  const dLat = (BBOX.north - BBOX.south) / NY;
  const dLon = (BBOX.east - BBOX.west) / NX;
  for (let i = 0; i < NY; i++) {
    for (let j = 0; j < NX; j++) {
      out.push({
        south: BBOX.south + i * dLat,
        north: BBOX.south + (i + 1) * dLat,
        west: BBOX.west + j * dLon,
        east: BBOX.west + (j + 1) * dLon,
      });
    }
  }
  return out;
}

async function queryPaged(baseUrl, params) {
  const features = [];
  let offset = 0;
  const max = 2000;
  for (let page = 0; page < 10; page++) {
    const qp = new URLSearchParams({
      ...params,
      resultOffset: String(offset),
      resultRecordCount: String(max),
      f: "geojson",
    });
    const url = `${baseUrl}?${qp}`;
    const r = await fetch(url);
    if (!r.ok) {
      console.warn(`  page ${page} → HTTP ${r.status}`);
      break;
    }
    const j = await r.json();
    const got = j.features ?? [];
    features.push(...got);
    if (got.length < max) break;
    offset += max;
  }
  return features;
}

async function fetchFlowlinesTile(bbox) {
  const params = {
    where: `streamorde>=${MIN_ORDER}`,
    geometry: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "permanent_identifier,fromnode,tonode,streamorde,lengthkm,qama,reachcode",
    returnGeometry: "true",
    outSR: "4326",
  };
  return queryPaged(FLOWLINE_LAYER, params);
}

async function fetchGaugesTile(bbox) {
  const params = {
    where: "sourceagency='USGS'",
    geometry: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "sourceid,station_nm,reachcode,nhdplusid,latsite,lonsite",
    returnGeometry: "true",
    outSR: "4326",
  };
  return queryPaged(GAGE_LAYER, params);
}

function roundCoords(coords, dp = 5) {
  const f = Math.pow(10, dp);
  return coords.map((seg) => seg.map(([x, y]) => [Math.round(x * f) / f, Math.round(y * f) / f]));
}

async function main() {
  const flowMap = new Map(); // permanent_identifier → flowline
  const gageMap = new Map(); // sourceid → gauge
  const all = tiles();

  for (let i = 0; i < all.length; i++) {
    const t = all[i];
    const t0 = Date.now();
    try {
      const fls = await fetchFlowlinesTile(t);
      for (const f of fls) {
        const p = f.properties;
        const id = p.permanent_identifier;
        if (!id || flowMap.has(id)) continue;
        const g = f.geometry;
        if (!g) continue;
        const coords = g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : [];
        if (!coords.length) continue;
        flowMap.set(id, {
          id,
          fromNode: p.fromnode,
          toNode: p.tonode,
          order: p.streamorde,
          lengthKm: p.lengthkm,
          qama: p.qama, // mean annual flow (cfs)
          reach: p.reachcode,
          geom: roundCoords(coords),
        });
      }
      const gs = await fetchGaugesTile(t);
      for (const g of gs) {
        const p = g.properties;
        const sid = p.sourceid;
        if (!sid || gageMap.has(sid)) continue;
        gageMap.set(sid, {
          siteNo: sid,
          name: p.station_nm,
          reach: p.reachcode,
          nhdplusId: p.nhdplusid,
          lon: Number(p.lonsite),
          lat: Number(p.latsite),
        });
      }
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(
        `tile ${i + 1}/${all.length} (${t.south.toFixed(1)},${t.west.toFixed(1)}) → ` +
          `${flowMap.size} flowlines, ${gageMap.size} gauges (+${dt}s)`,
      );
    } catch (err) {
      console.error("tile error:", err.message);
    }
  }

  const bundle = {
    built_at: new Date().toISOString(),
    source: "USGS NHDPlus HR (ArcGIS REST)",
    bbox: BBOX,
    min_order: MIN_ORDER,
    flowlines: [...flowMap.values()],
    gauges: [...gageMap.values()],
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(bundle));
  const sizeMB = (JSON.stringify(bundle).length / 1024 / 1024).toFixed(2);
  console.log(`\nWrote ${OUT}`);
  console.log(
    `${bundle.flowlines.length} flowlines, ${bundle.gauges.length} gauges, ${sizeMB} MB`,
  );
  console.log(`built_at: ${bundle.built_at}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
