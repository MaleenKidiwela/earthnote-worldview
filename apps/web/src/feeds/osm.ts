import type { RoadPolyline } from "@/types/osm";
import { BBOX } from "@/lib/region";

/**
 * Fetch highway polylines from Overpass within the PNW bbox. Limited to
 * motorway/trunk/primary so we don't pull every neighborhood street.
 *
 * Note: Overpass uses (south, west, north, east) order.
 */
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function buildQuery(): string {
  const bbox = `${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east}`;
  return `[out:json][timeout:60];
(
  way["highway"="motorway"](${bbox});
  way["highway"="trunk"](${bbox});
  way["highway"="primary"](${bbox});
);
out geom;`;
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

export async function fetchRoadPolylines(): Promise<RoadPolyline[]> {
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: buildQuery(),
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
