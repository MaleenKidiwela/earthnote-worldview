import { NWSResponseSchema } from "@/types/nws";
import type { WeatherAlert } from "@/types/nws";
import { API } from "@/lib/constants";
import { clipFeatures } from "@/lib/region";

/**
 * NWS active alerts, clipped to PNW. The upstream proxy in vite.config.ts
 * hits /alerts/active; we filter to OR/WA + Pacific NW coastal/offshore
 * marine zones, then re-clip by computed centroid.
 *
 * Per the project's two-contract rule: NWS *alerts* (issued warnings) are
 * HazardEvents with officialSource set. NWS *forecasts* would be Forecast
 * records; this feed only returns alerts.
 */

/** OR/WA + Pacific NW marine UGC centroid fallbacks. */
const UGC_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  OR: { lat: 44.0, lon: -120.5 },
  WA: { lat: 47.4, lon: -120.7 },
  PZ: { lat: 35.0, lon: -130.0 }, // Pacific offshore
  PM: { lat: 45.0, lon: -125.0 }, // Pacific NW coastal
};

function centroid(
  geometry: { type: string; coordinates?: unknown } | null,
  ugcCodes?: string[],
): { lat: number; lon: number } | null {
  if (geometry?.coordinates) {
    try {
      if (geometry.type === "Polygon") {
        const ring = (geometry.coordinates as number[][][])[0];
        if (ring && ring.length > 0) {
          let latSum = 0;
          let lonSum = 0;
          for (const [lon, lat] of ring) {
            latSum += lat!;
            lonSum += lon!;
          }
          return { lat: latSum / ring.length, lon: lonSum / ring.length };
        }
      }
      if (geometry.type === "MultiPolygon") {
        const ring = (geometry.coordinates as number[][][][])[0]?.[0];
        if (ring && ring.length > 0) {
          let latSum = 0;
          let lonSum = 0;
          for (const [lon, lat] of ring) {
            latSum += lat!;
            lonSum += lon!;
          }
          return { lat: latSum / ring.length, lon: lonSum / ring.length };
        }
      }
    } catch {
      /* fall through */
    }
  }
  if (ugcCodes && ugcCodes.length > 0 && ugcCodes[0]) {
    const stateCode = ugcCodes[0].substring(0, 2);
    const entry = UGC_CENTROIDS[stateCode];
    if (entry) return entry;
  }
  return null;
}

export async function fetchWeatherAlerts(): Promise<WeatherAlert[]> {
  try {
    const res = await fetch(API.WEATHER);
    if (!res.ok) return [];

    const json: unknown = await res.json();
    const parsed = NWSResponseSchema.safeParse(json);
    if (!parsed.success) return [];

    const alerts = parsed.data.features.map((f) => {
      const ugcCodes = f.properties.geocode?.UGC;
      const center = centroid(f.geometry, ugcCodes);
      return {
        id: f.id,
        event: f.properties.event,
        severity: f.properties.severity,
        headline: f.properties.headline ?? f.properties.event,
        description: f.properties.description,
        areaDesc: f.properties.areaDesc,
        effective: f.properties.effective,
        expires: f.properties.expires,
        latitude: center?.lat ?? null,
        longitude: center?.lon ?? null,
      };
    });

    return clipFeatures(alerts, (a) =>
      a.latitude != null && a.longitude != null
        ? ([a.longitude, a.latitude] as const)
        : null,
    );
  } catch (err) {
    console.warn("NWS fetch failed:", err);
    return [];
  }
}
