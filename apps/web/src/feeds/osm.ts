import type { RoadPolyline } from "@/types/osm";

/**
 * Fetch highway polylines from Overpass for an arbitrary bbox.
 *
 * PNW-wide queries time out (Overpass 504s past ~5° tiles), so callers
 * pass the current viewport. Class set widens as the bbox shrinks so a
 * city-level view shows arterials and a regional view stays light.
 *
 * Overpass uses (south, west, north, east) ordering.
 */
// overpass-api.de rejects POSTs from non-browser-shaped clients with 406.
// kumi.systems is the standard alternative and accepts the same payload.
const OVERPASS_URL = "https://overpass.kumi.systems/api/interpreter";

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

function buildQuery(bbox: BBox, classes: string[]): string {
  const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const ways = classes.map((c) => `  way["highway"="${c}"](${b});`).join("\n");
  return `[out:json][timeout:60];\n(\n${ways}\n);\nout geom;`;
}

/** Pick highway classes by bbox span (deg). Smaller view, more detail. */
function classesFor(bbox: BBox): string[] {
  const span = Math.max(bbox.north - bbox.south, bbox.east - bbox.west);
  if (span > 6) return ["motorway"];
  if (span > 2) return ["motorway", "trunk"];
  if (span > 0.6) return ["motorway", "trunk", "primary"];
  return ["motorway", "trunk", "primary", "secondary"];
}

interface OverpassWay {
  type: "way";
  id: number;
  tags?: { highway?: string };
  geometry?: { lat: number; lon: number }[];
}
interface OverpassResponse {
  elements: OverpassWay[];
}

export async function fetchRoadPolylines(bbox: BBox): Promise<RoadPolyline[]> {
  const classes = classesFor(bbox);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(buildQuery(bbox, classes)),
    });
    if (!res.ok) {
      console.warn("Overpass error:", res.status);
      return [];
    }
    const data = (await res.json()) as OverpassResponse;
    const out: RoadPolyline[] = [];
    for (const w of data.elements) {
      if (w.type !== "way" || !w.geometry || w.geometry.length < 2) continue;
      const points: (readonly [number, number])[] = w.geometry.map(
        (g) => [g.lon, g.lat] as const,
      );
      const cls = (w.tags?.highway ?? "primary") as RoadPolyline["classification"];
      const { cumulative, totalLength } = arcLengths(points);
      out.push({
        id: `way-${w.id}`,
        classification: cls,
        points,
        cumulative,
        totalLength,
      });
    }
    return out;
  } catch (err) {
    console.warn("OSM fetch failed:", err);
    return [];
  }
}

/** Great-circle distance in meters (haversine). */
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
