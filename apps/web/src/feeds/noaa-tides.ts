/**
 * NOAA CO-OPS Tides & Currents → engine SST observations.
 *
 * Pulls latest hourly water-temperature for the key Salish Sea stations
 * the engine's STATION_BASIN_MAP knows about, returning a flat list of
 * { variable: 'sst', value, station, basin } observations ready to feed
 * assimilateObservations on each sim tick.
 *
 * NOAA CO-OPS exposes CORS-friendly JSON, no proxy required.
 */
import type { Observation } from "@pnw/sim";

interface Station {
  id: string; // NOAA station id
  station: string; // engine STATION_BASIN_MAP key
}

// Stations matched to engine's basin map keys.
const STATIONS: Station[] = [
  { id: "9447130", station: "seattle" },
  { id: "9446484", station: "tacoma" },
  { id: "9449880", station: "fridayharbor" },
  { id: "9444090", station: "portangeles" },
  { id: "9449424", station: "cherrypoint" },
  { id: "9444900", station: "porttownsend" },
];

/** Fetch latest water-temp for all stations. Returns SST observations. */
export async function fetchSstObservations(): Promise<Observation[]> {
  const out: Observation[] = [];
  await Promise.all(
    STATIONS.map(async (s) => {
      try {
        const url =
          "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter" +
          `?product=water_temperature&station=${s.id}` +
          "&date=latest&units=metric&time_zone=gmt&format=json&application=pnw-twin";
        const r = await fetch(url);
        if (!r.ok) return;
        const j = (await r.json()) as { data?: Array<{ v?: string; t?: string }> };
        const sample = j.data?.[0];
        if (!sample?.v) return;
        const v = Number(sample.v);
        if (!Number.isFinite(v)) return;
        out.push({ variable: "sst", value: v, station: s.station });
      } catch {
        // ignore per-station failures; assimilation handles missing obs.
      }
    }),
  );
  return out;
}
