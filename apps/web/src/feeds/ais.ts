import type { Vessel } from "@/types/ais";
import { API } from "@/lib/constants";
import { clipFeatures } from "@/lib/region";

/**
 * Vessels from the backend AIS collector (AISStream global, falls back to
 * Digitraffic Baltic). Clipped to PNW at fetch time so the globe only sees
 * Salish Sea / outer coast traffic.
 */
export async function fetchVessels(): Promise<Vessel[]> {
  const res = await fetch(API.AIS);
  if (!res.ok) throw new Error(`AIS fetch failed: ${res.status}`);
  const data: Vessel[] = await res.json();
  return clipFeatures(data, (v) =>
    typeof v.longitude === "number" && typeof v.latitude === "number"
      ? ([v.longitude, v.latitude] as const)
      : null,
  );
}
