/**
 * Default camera: centered on the Salish Sea, framed so OR, WA, and BC are visible.
 * Region bound is enforced from @pnw/contracts (PNW.bbox).
 */
export const DEFAULT_CAMERA = {
  longitude: -122.3321,
  latitude: 47.6062,
  height: 40_000,
} as const;

// Prefix same-origin API paths with Vite's base. Under JupyterHub the SPA
// is served at /user/<x>/proxy/absolute/5173/, so a bare "/api/ais" would
// resolve to the hub root and 404. BASE_URL ends with "/" so we strip the
// leading slash from the path.
const B = import.meta.env.BASE_URL;
const p = (path: string) => `${B}${path.replace(/^\//, "")}`;

/** Proxy API paths (Vite proxy in dev, Express proxy in prod) */
export const API = {
  FLIGHTS: p("/api/flights"),
  OPENSKY_STATES: "https://opensky-network.org/api/states/all",
  CELESTRAK_GP: "https://celestrak.org/NORAD/elements/gp.php",
  EARTHQUAKES: p("/api/quakes"),
  AIS: p("/api/ais"),
  FIRES: p("/api/fires"),
  WEATHER: p("/api/weather"),
  // Methods ingest: external pipelines (dv/v, HVSR, RF) POST here.
  METHODS_SAMPLE: p("/api/methods/sample"),
  METHODS_GEOPRODUCT: p("/api/methods/geoproduct"),
  METHODS_EVENT: p("/api/methods/event"),
} as const;

/** Refresh intervals (ms) */
export const INTERVALS = {
  FLIGHTS: 15_000,
  SATELLITES: 1_000,
  EARTHQUAKES: 300_000,
  AIS: 30_000,
  FIRES: 1_800_000,
  WEATHER: 600_000,
} as const;

/**
 * Performance caps, scoped to a PNW viewport.
 * Lower than the original WorldView limits because we're regional, not global.
 */
export const LIMITS = {
  MAX_SATELLITES: 200,
  MAX_FLIGHTS: 200,
  MAX_SHIPS: 300,
  MAX_QUAKES: 100,
  MAX_FIRES: 200,
} as const;

/** Filter modes (Cesium post-process visual modes) */
export type FilterMode = "none" | "crt" | "nvg" | "flir" | "cel";

export const FILTER_LABELS: Record<FilterMode, string> = {
  none: "STANDARD",
  crt: "CRT SCANLINES",
  nvg: "NIGHT VISION",
  flir: "THERMAL FLIR",
  cel: "CEL SHADING",
};

export const FILTER_KEYS: Record<string, FilterMode> = {
  "0": "none",
  "1": "crt",
  "2": "nvg",
  "3": "flir",
  "4": "cel",
};

/** Alert thresholds */
export const ALERT_THRESHOLDS = {
  EARTHQUAKE_MIN_MAG: 4.0,
  WEATHER_SEVERITY: "Extreme",
} as const;
