/**
 * WSDOT Traveler Info — live traffic flow sensors.
 *
 * Each FlowStation reports a FlowReadingValue 0..5:
 *   0 Unknown · 1 WideOpen · 2 Moderate · 3 Heavy · 4 StopAndGo · 5 NoData
 *
 * Free API key from https://wsdot.wa.gov/traffic/api/. Stored as
 * VITE_WSDOT_API_KEY in apps/web/.env.local (or exported in the dev
 * shell). Refresh cadence ~1 min upstream, we pull every 2 min.
 */

export type FlowReading = 0 | 1 | 2 | 3 | 4 | 5;

export interface FlowStation {
  id: number;
  region: string;
  description: string;
  stationName: string;
  lon: number;
  lat: number;
  direction: string;
  milepost: number;
  reading: FlowReading;
  time: number; // unix ms
}

const KEY = (import.meta.env.VITE_WSDOT_API_KEY as string | undefined) ?? "";
const URL_BASE =
  "https://wsdot.wa.gov/Traffic/api/TrafficFlow/TrafficFlowREST.svc/GetTrafficFlowsAsJson";

export async function fetchTrafficFlows(): Promise<FlowStation[]> {
  if (!KEY) {
    console.warn("[wsdot] VITE_WSDOT_API_KEY not set — traffic layer disabled");
    return [];
  }
  try {
    const r = await fetch(`${URL_BASE}?AccessCode=${KEY}`);
    if (!r.ok) {
      console.warn(`[wsdot] HTTP ${r.status}`);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j: any[] = await r.json();
    const out: FlowStation[] = [];
    for (const f of j) {
      const loc = f.FlowDataValue ?? f;
      const station = f.FlowStationLocation ?? f.StationLocation ?? f.Location;
      if (!station) continue;
      const lat = Number(station.Latitude);
      const lon = Number(station.Longitude);
      const reading = Number(f.FlowReadingValue ?? f.Reading);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      out.push({
        id: Number(f.FlowDataID ?? f.StationID ?? station.StationID ?? 0),
        region: String(f.Region ?? ""),
        description: String(station.Description ?? ""),
        stationName: String(f.StationName ?? station.Description ?? ""),
        lon,
        lat,
        direction: String(station.Direction ?? ""),
        milepost: Number(station.MilePost ?? 0),
        reading: (reading >= 0 && reading <= 5 ? reading : 0) as FlowReading,
        time: parseWsdotDate(f.Time ?? f.LastUpdated),
      });
      void loc;
    }
    return out;
  } catch (err) {
    console.warn("[wsdot] fetch failed:", err);
    return [];
  }
}

/** WSDOT timestamps are "/Date(1234567890000-0700)/" — extract ms. */
function parseWsdotDate(s: string | undefined): number {
  if (!s) return Date.now();
  const m = /\/Date\((\d+)/.exec(s);
  if (m) return Number(m[1]);
  const d = Date.parse(s);
  return Number.isFinite(d) ? d : Date.now();
}
