/**
 * PNW region clip helpers. The bbox is the single source of truth in
 * @pnw/contracts; we re-export it and provide convenience filters used at
 * every feed boundary so global feeds never leak into the PNW twin.
 */
import { PNW, inPNW as inPNWImpl } from "@pnw/contracts";

export const BBOX = PNW.bbox;
export const JURISDICTIONS = PNW.jurisdictions;

export const inPNW = inPNWImpl;

export function clipFeatures<T>(
  items: readonly T[],
  getLonLat: (item: T) => readonly [number, number] | null | undefined,
): T[] {
  const out: T[] = [];
  for (const item of items) {
    const ll = getLonLat(item);
    if (!ll) continue;
    if (inPNW(ll[0], ll[1])) out.push(item);
  }
  return out;
}

/**
 * Tight bbox string for APIs that accept "minLon,minLat,maxLon,maxLat".
 * USGS FDSN events, NWS active alerts within bbox, FIRMS area, etc.
 */
export const BBOX_QUERY = `${BBOX.west},${BBOX.south},${BBOX.east},${BBOX.north}`;

/** USGS FDSN events query params for PNW only. */
export const USGS_PNW_PARAMS = new URLSearchParams({
  format: "geojson",
  minlatitude: String(BBOX.south),
  maxlatitude: String(BBOX.north),
  minlongitude: String(BBOX.west),
  maxlongitude: String(BBOX.east),
  minmagnitude: "1.0",
  orderby: "time",
}).toString();
