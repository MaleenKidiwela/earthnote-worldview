/**
 * Sub-basin polygons clipped against the actual coastline.
 *
 * The raw SUB_BASIN_WATER_POLYGONS are simplified at ~330 m tolerance and
 * sometimes spill onto land. We use turf.js to subtract the mainland and
 * Vancouver Island + smaller islands from each basin so the renderer
 * gets clean water-only polygons that hug the real shore.
 *
 * Result is computed once on first access and cached. Each entry is the
 * Cesium-ready coord set for that basin: a list of rings where ring 0 is
 * the exterior and the rest are interior holes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as turf from "@turf/turf";
// turf types are strict about Polygon vs MultiPolygon; we treat the result
// generically since Cesium only needs the coords.
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SUB_BASIN_WATER_POLYGONS,
  GEN_MAINLAND,
  GEN_VANC_ISLAND,
  GEN_ISLANDS,
} from "./subBasinPolygonsGenerated.js";

export type Ring = [number, number][];
export interface ClippedBasin {
  /** First entry is the exterior; rest are holes. */
  rings: Ring[];
}

let cache: Record<string, ClippedBasin[]> | null = null;

/** Get the clipped basin polygons. Each basin maps to ≥1 polygon (clipping
 * can split a basin into multiple pieces if a landmass cuts through). */
export function getClippedBasins(): Record<string, ClippedBasin[]> {
  if (cache) return cache;
  cache = computeClipped();
  return cache;
}

function computeClipped(): Record<string, ClippedBasin[]> {
  const out: Record<string, ClippedBasin[]> = {};
  const landPolys: any[] = [];
  if (GEN_MAINLAND.length > 2) landPolys.push(turf.polygon([closeRing(GEN_MAINLAND)]));
  if (GEN_VANC_ISLAND.length > 2) landPolys.push(turf.polygon([closeRing(GEN_VANC_ISLAND)]));
  for (const island of GEN_ISLANDS) {
    if (island.length > 2) landPolys.push(turf.polygon([closeRing(island)]));
  }
  let land: any = null;
  for (const p of landPolys) {
    if (!land) land = p;
    else {
      const u = turf.union(turf.featureCollection([land, p]) as any);
      if (u) land = u;
    }
  }
  // Buffer the land outward by ~150m before subtracting. This keeps each
  // basin polygon safely offshore so the simplified-coastline sloppiness
  // never shows polygon spilling onto dry land.
  if (land) {
    try {
      const buffered = turf.buffer(land, 0.15, { units: "kilometers" });
      if (buffered) land = buffered;
    } catch {
      // turf.buffer is finicky on self-intersecting geometry; fall back.
    }
  }

  for (const [basinId, coords] of Object.entries(SUB_BASIN_WATER_POLYGONS)) {
    if (coords.length < 3) continue;
    const basinFeat: any = turf.polygon([closeRing(coords)]);
    let clipped: any = basinFeat;
    if (land) {
      const diff = turf.difference(turf.featureCollection([basinFeat, land]) as any);
      if (diff) clipped = diff;
    }
    out[basinId] = featureToRings(clipped);
  }

  return out;
}

function closeRing(ring: [number, number][]): [number, number][] {
  if (ring.length === 0) return ring;
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function featureToRings(feat: any): ClippedBasin[] {
  const geom = feat?.geometry;
  if (!geom) return [];
  if (geom.type === "Polygon") {
    return [{ rings: geom.coordinates as Ring[] }];
  }
  if (geom.type === "MultiPolygon") {
    return (geom.coordinates as Ring[][]).map((polyRings) => ({ rings: polyRings }));
  }
  return [];
}
