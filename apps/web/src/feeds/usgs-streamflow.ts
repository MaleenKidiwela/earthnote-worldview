/**
 * USGS NWIS → engine discharge observations.
 *
 * Pulls latest streamflow (parameter 00060, cfs) for the major rivers in
 * the Salish Sea watershed and returns Observations against the engine's
 * `discharge` nudge variable (m³/s, converted from cfs).
 */
import type { Observation } from "@pnw/sim";

interface Site {
  id: string;
  name: string;
  basin: string;
  lon: number;
  lat: number;
}

export const USGS_SITES: Site[] = [
  { id: "12200500", name: "Skagit nr Mt Vernon", basin: "whidbey", lon: -122.336, lat: 48.445 },
  { id: "12189500", name: "Sauk nr Sauk", basin: "whidbey", lon: -121.567, lat: 48.426 },
  { id: "12134500", name: "Snoqualmie nr Carnation", basin: "mainBasin", lon: -121.926, lat: 47.665 },
  { id: "12150800", name: "Snohomish nr Monroe", basin: "whidbey", lon: -121.972, lat: 47.829 },
  { id: "12054000", name: "Duckabush nr Brinnon", basin: "hoodCanal", lon: -123.012, lat: 47.682 },
  { id: "12039500", name: "Quinault at Quinault", basin: "juanDeFuca", lon: -123.860, lat: 47.460 },
];

/** Last observed discharge per site id (m³/s). Updated by fetchDischargeObservations. */
export const USGS_LATEST = new Map<string, number>();

const CFS_TO_CMS = 0.0283168;

export async function fetchDischargeObservations(): Promise<Observation[]> {
  const out: Observation[] = [];
  const sites = USGS_SITES.map((s) => s.id).join(",");
  try {
    const url =
      "https://waterservices.usgs.gov/nwis/iv/" +
      `?format=json&sites=${sites}&parameterCd=00060&siteStatus=active`;
    const r = await fetch(url);
    if (!r.ok) return out;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j: any = await r.json();
    const series: unknown[] = j?.value?.timeSeries ?? [];
    for (const s of series) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ts = s as any;
      const siteCode = ts.sourceInfo?.siteCode?.[0]?.value as string | undefined;
      const latest = ts.values?.[0]?.value?.[0]?.value as string | undefined;
      if (!siteCode || !latest) continue;
      const meta = USGS_SITES.find((x) => x.id === siteCode);
      if (!meta) continue;
      const v = Number(latest);
      if (!Number.isFinite(v) || v < 0) continue;
      const cms = v * CFS_TO_CMS;
      USGS_LATEST.set(meta.id, cms);
      out.push({
        variable: "discharge",
        value: cms,
        basin: meta.basin,
        station: meta.id,
      });
    }
  } catch {
    // Soft-fail; engine handles missing obs.
  }
  return out;
}
