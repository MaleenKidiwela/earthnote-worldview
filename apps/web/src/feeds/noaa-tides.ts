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
  name: string;
  lon: number;
  lat: number;
}

// Stations matched to engine's basin map keys.
export const NOAA_STATIONS: Station[] = [
  { id: "9447130", station: "seattle", name: "Seattle", lon: -122.339, lat: 47.602 },
  { id: "9446484", station: "tacoma", name: "Tacoma", lon: -122.413, lat: 47.270 },
  { id: "9449880", station: "fridayharbor", name: "Friday Harbor", lon: -123.013, lat: 48.546 },
  { id: "9444090", station: "portangeles", name: "Port Angeles", lon: -123.440, lat: 48.125 },
  { id: "9449424", station: "cherrypoint", name: "Cherry Point", lon: -122.758, lat: 48.863 },
  { id: "9444900", station: "porttownsend", name: "Port Townsend", lon: -122.760, lat: 48.112 },
];

/** Last observed SST per station id (degC). Updated by fetchSstObservations. */
export const NOAA_LATEST = new Map<string, number>();

/** Fetch latest water-temp for all stations. Returns SST observations. */
export async function fetchSstObservations(): Promise<Observation[]> {
  const out: Observation[] = [];
  await Promise.all(
    NOAA_STATIONS.map(async (s) => {
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
        NOAA_LATEST.set(s.id, v);
        out.push({ variable: "sst", value: v, station: s.station });
      } catch {
        // ignore per-station failures; assimilation handles missing obs.
      }
    }),
  );
  return out;
}
