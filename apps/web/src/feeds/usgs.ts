import { USGSResponseSchema } from "@/types/usgs";
import type { Earthquake } from "@/types/usgs";
import { LIMITS } from "@/lib/constants";
import { clipFeatures, USGS_PNW_PARAMS } from "@/lib/region";

/**
 * PNW earthquakes via USGS FDSN events API, server-side proxy in vite.config.
 * The original WorldView used the 2.5_day global summary feed; we instead hit
 * /api/quakes-fdsn so the upstream query is bbox-scoped and we don't pay to
 * download the global catalog.
 */
const FDSN_URL = `${import.meta.env.BASE_URL}api/quakes-fdsn?${USGS_PNW_PARAMS}`;

export async function fetchEarthquakes(): Promise<Earthquake[]> {
  try {
    const res = await fetch(FDSN_URL);
    if (!res.ok) return [];

    const json: unknown = await res.json();
    const parsed = USGSResponseSchema.safeParse(json);
    if (!parsed.success) return [];

    const quakes: Earthquake[] = [];
    for (const f of parsed.data.features) {
      if (quakes.length >= LIMITS.MAX_QUAKES) break;
      const [lon, lat, depth] = f.geometry.coordinates;
      quakes.push({
        id: f.id,
        magnitude: f.properties.mag ?? 0,
        place: f.properties.place ?? "Unknown",
        time: f.properties.time,
        longitude: lon,
        latitude: lat,
        depth,
        tsunami: f.properties.tsunami === 1,
        significance: f.properties.sig ?? 0,
        title: f.properties.title,
      });
    }
    // Defense in depth: re-clip in case the upstream returns a stray point.
    return clipFeatures(quakes, (q) => [q.longitude, q.latitude] as const);
  } catch (err) {
    console.warn("USGS FDSN fetch failed:", err);
    return [];
  }
}
