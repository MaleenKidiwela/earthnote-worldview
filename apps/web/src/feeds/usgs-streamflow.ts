/**
 * USGS NWIS → engine discharge observations.
 *
 * One bbox call returns every active discharge gauge (parameter 00060,
 * cfs) in the region with its latest reading. We get hundreds of
 * stations across the Cascades + Olympics + BC without hand-maintaining
 * a site list.
 *
 * Each station's parent-basin is inferred by simple longitude/latitude
 * bucketing (good enough for nudging; the engine has 7 parent basins
 * across the Salish Sea + outer coast).
 */
import type { Observation } from "@pnw/sim";

export interface StreamSite {
  id: string;
  name: string;
  basin: string;
  lon: number;
  lat: number;
}

// Cascades + Salish Sea + Olympic + lower BC. Trim or widen as needed.
const BBOX = { south: 45.5, west: -124.5, north: 49.5, east: -120.0 };
const CFS_TO_CMS = 0.0283168;

/** All sites we've ever seen from the bbox query. */
export const USGS_SITES: StreamSite[] = [];
/** Latest discharge per site id (m³/s). */
export const USGS_LATEST = new Map<string, number>();

export async function fetchDischargeObservations(): Promise<Observation[]> {
  const out: Observation[] = [];
  const url =
    "https://waterservices.usgs.gov/nwis/iv/" +
    `?format=json&bBox=${BBOX.west},${BBOX.south},${BBOX.east},${BBOX.north}` +
    "&parameterCd=00060&siteStatus=active";
  try {
    const r = await fetch(url);
    if (!r.ok) return out;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j: any = await r.json();
    const series: unknown[] = j?.value?.timeSeries ?? [];
    const seen = new Map<string, StreamSite>(USGS_SITES.map((s) => [s.id, s]));

    for (const s of series) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ts = s as any;
      const id: string | undefined = ts.sourceInfo?.siteCode?.[0]?.value;
      const name: string | undefined = ts.sourceInfo?.siteName;
      const geo = ts.sourceInfo?.geoLocation?.geogLocation;
      const lat = Number(geo?.latitude);
      const lon = Number(geo?.longitude);
      const latest = ts.values?.[0]?.value?.[0]?.value;
      if (!id || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const v = Number(latest);
      if (!Number.isFinite(v) || v < 0) continue;
      const basin = basinForLonLat(lon, lat);
      const cms = v * CFS_TO_CMS;
      USGS_LATEST.set(id, cms);
      if (!seen.has(id)) {
        const site = { id, name: name ?? id, basin, lon, lat };
        seen.set(id, site);
        USGS_SITES.push(site);
      }
      out.push({ variable: "discharge", value: cms, basin, station: id });
    }
  } catch {
    // soft-fail
  }
  return out;
}

/**
 * Cheap point-in-bucket basin classifier — refine later if the engine
 * starts caring about per-sub-basin discharge instead of per-parent.
 */
function basinForLonLat(lon: number, lat: number): string {
  // Hood Canal (east of Olympics, narrow finger). Approximate.
  if (lon > -123.3 && lon < -122.7 && lat > 47.3 && lat < 47.9) return "hoodCanal";
  // Strait of Georgia / BC mainland coast.
  if (lat > 48.9) return "georgia";
  // San Juans + north Whidbey + Skagit corridor.
  if (lat > 48.2 && lon > -123.2) return "whidbey";
  // Juan de Fuca (Olympic Peninsula coast, Quillayute, Hoh).
  if (lon < -123.5 || (lat < 48.4 && lon < -123.0)) return "juanDeFuca";
  // Default to mainBasin (Snohomish/Snoqualmie/Cedar/Green/Puyallup).
  return "mainBasin";
}
