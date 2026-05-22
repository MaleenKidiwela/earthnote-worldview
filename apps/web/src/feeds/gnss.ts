import type { GnssStation } from "@/types/gnss";
import { clipFeatures } from "@/lib/region";

/**
 * Seed list of PNW GNSS stations with first-order interseismic velocity
 * estimates (mm/yr) in a NA-fixed reference frame. Values reflect the
 * documented Cascadia interseismic field: stations west of the locked
 * megathrust move eastward at ~5–15 mm/yr, vertical signal small inland,
 * subsidence on the outer coast.
 *
 * These are layout estimates only; calibrated: false. Replace by fetching
 * Nevada Geodetic Lab tenv3 or EarthScope GAGE velocities for each site.
 */
const SEED_STATIONS: GnssStation[] = [
  // NOTA / PBO sites across PNW
  { id: "ALBH", name: "Albert Head, BC", network: "NOTA", latitude: 48.39, longitude: -123.49, vEast: 8.5, vNorth: 2.1, vUp: -1.0, sigma: 0.4, calibrated: false },
  { id: "P404", name: "Quinault, WA",     network: "NOTA", latitude: 47.35, longitude: -124.16, vEast: 13.2, vNorth: 4.0, vUp: -1.8, sigma: 0.5, calibrated: false },
  { id: "P403", name: "Forks, WA",        network: "NOTA", latitude: 47.95, longitude: -124.39, vEast: 12.4, vNorth: 4.8, vUp: -1.5, sigma: 0.5, calibrated: false },
  { id: "P435", name: "Astoria, OR",      network: "NOTA", latitude: 46.19, longitude: -123.83, vEast: 9.7,  vNorth: 4.6, vUp: -0.8, sigma: 0.5, calibrated: false },
  { id: "P434", name: "Tillamook, OR",    network: "NOTA", latitude: 45.45, longitude: -123.84, vEast: 10.2, vNorth: 5.1, vUp: -0.6, sigma: 0.5, calibrated: false },
  { id: "P438", name: "Newport, OR",      network: "NOTA", latitude: 44.65, longitude: -124.07, vEast: 11.0, vNorth: 5.6, vUp: -0.7, sigma: 0.5, calibrated: false },
  { id: "P446", name: "Coos Bay, OR",     network: "NOTA", latitude: 43.36, longitude: -124.22, vEast: 11.8, vNorth: 6.4, vUp: -0.4, sigma: 0.5, calibrated: false },
  { id: "P396", name: "Seattle, WA",      network: "NOTA", latitude: 47.66, longitude: -122.31, vEast: 5.4,  vNorth: 3.2, vUp: -0.3, sigma: 0.4, calibrated: false },
  { id: "P417", name: "Olympia, WA",      network: "NOTA", latitude: 47.04, longitude: -122.89, vEast: 6.7,  vNorth: 3.9, vUp: -0.6, sigma: 0.4, calibrated: false },
  { id: "P407", name: "Port Angeles, WA", network: "NOTA", latitude: 48.12, longitude: -123.50, vEast: 9.1,  vNorth: 3.3, vUp: -1.1, sigma: 0.4, calibrated: false },
  { id: "P425", name: "Spokane, WA",      network: "NOTA", latitude: 47.66, longitude: -117.41, vEast: 0.4,  vNorth: 0.6, vUp: 0.1,  sigma: 0.3, calibrated: false },
  { id: "P421", name: "Yakima, WA",       network: "NOTA", latitude: 46.60, longitude: -120.51, vEast: 2.9,  vNorth: 1.7, vUp: 0.0,  sigma: 0.3, calibrated: false },
  { id: "P398", name: "Centralia, WA",    network: "NOTA", latitude: 46.72, longitude: -122.96, vEast: 7.2,  vNorth: 4.0, vUp: -0.5, sigma: 0.4, calibrated: false },
  { id: "P376", name: "Mt. St. Helens",   network: "NOTA", latitude: 46.21, longitude: -122.18, vEast: 5.0,  vNorth: 3.2, vUp: -0.2, sigma: 0.4, calibrated: false },
  { id: "P693", name: "Mt. Hood, OR",     network: "NOTA", latitude: 45.37, longitude: -121.70, vEast: 5.4,  vNorth: 3.5, vUp: 0.0,  sigma: 0.4, calibrated: false },

  // Western Canada Deformation Array (Geological Survey of Canada)
  { id: "BAMF", name: "Bamfield, BC",     network: "WCDA", latitude: 48.84, longitude: -125.13, vEast: 11.4, vNorth: 4.3, vUp: -1.5, sigma: 0.5, calibrated: false },
  { id: "NEAH", name: "Neah Bay, WA",     network: "NOTA", latitude: 48.30, longitude: -124.62, vEast: 12.1, vNorth: 4.0, vUp: -1.7, sigma: 0.5, calibrated: false },
  { id: "UCLU", name: "Ucluelet, BC",     network: "WCDA", latitude: 48.93, longitude: -125.54, vEast: 11.8, vNorth: 4.5, vUp: -1.6, sigma: 0.5, calibrated: false },
  { id: "HOLB", name: "Holberg, BC",      network: "WCDA", latitude: 50.64, longitude: -128.13, vEast: 13.5, vNorth: 6.0, vUp: -1.0, sigma: 0.5, calibrated: false },
  { id: "WSLR", name: "Whistler, BC",     network: "WCDA", latitude: 50.13, longitude: -122.92, vEast: 6.3,  vNorth: 3.5, vUp: 0.5,  sigma: 0.5, calibrated: false },
];

export async function fetchGnssStations(): Promise<GnssStation[]> {
  // Phase 1: seed list. Phase 2 will hit /api/gnss (a proxy to Nevada
  // Geodetic Lab) and merge live velocities into the seed positions.
  return clipFeatures(SEED_STATIONS, (s) => [s.longitude, s.latitude] as const);
}
