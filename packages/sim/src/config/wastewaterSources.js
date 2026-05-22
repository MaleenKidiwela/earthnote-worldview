// ═══════════════════════════════════════════════════════════
// WASTEWATER TREATMENT PLANTS — 5 major point sources
// ═══════════════════════════════════════════════════════════
// Sources:
//   King County WTD Annual Reports 2023
//   Metro Vancouver Liquid Waste Management Plan 2022
//   WA Ecology National Pollutant Discharge Elimination System (NPDES) permits
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

export const WASTEWATER_PLANTS = [
  {
    id: 'west_point',
    name: 'West Point',
    operator: 'King County',
    subBasin: 'main_north',
    parentBasin: 'mainBasin',
    lat: 47.661, lon: -122.431,
    capacityMGD: 133,
    treatmentLevel: 'secondary',
    nutrientRemoval: 0.85,     // fraction N removed
    pharmRemoval: 0.40,        // fraction pharmaceuticals removed
    csoRisk: 0.15,             // baseline annual CSO probability (2017 catastrophic failure)
    yearBuilt: 1966,
    note: 'Catastrophic flooding 2017. Combined sewer overflow history. Serves 700K.',
    // Tian et al. 2021 — tire-derived 6PPD-q detected in West Point influent
  },
  {
    id: 'south_plant',
    name: 'South Plant',
    operator: 'King County',
    subBasin: 'main_central',
    parentBasin: 'mainBasin',
    lat: 47.494, lon: -122.192,
    capacityMGD: 115,
    treatmentLevel: 'secondary',
    nutrientRemoval: 0.85,
    pharmRemoval: 0.45,
    csoRisk: 0.05,
    yearBuilt: 1965,
    note: 'Upgraded membrane bioreactor. Serves southern King County.',
  },
  {
    id: 'brightwater',
    name: 'Brightwater',
    operator: 'King County',
    subBasin: 'whidbey_south',
    parentBasin: 'whidbey',
    lat: 47.777, lon: -122.204,
    capacityMGD: 36,
    treatmentLevel: 'tertiary',
    nutrientRemoval: 0.95,
    pharmRemoval: 0.60,
    csoRisk: 0.01,
    yearBuilt: 2012,
    note: 'Newest facility. MBR with UV. Outfall to Puget Sound via 12-mile tunnel.',
  },
  {
    id: 'lions_gate',
    name: 'Lions Gate',
    operator: 'Metro Vancouver',
    subBasin: 'georgia_central',
    parentBasin: 'georgia',
    lat: 49.314, lon: -123.147,
    capacityMGD: 80,
    treatmentLevel: 'primary',    // PRIMARY only — upgrade planned
    nutrientRemoval: 0.30,
    pharmRemoval: 0.10,
    csoRisk: 0.08,
    yearBuilt: 1961,
    note: 'Primary treatment only. Tertiary upgrade planned by 2030. Discharges to Burrard Inlet.',
  },
  {
    id: 'iona_island',
    name: 'Iona Island',
    operator: 'Metro Vancouver',
    subBasin: 'georgia_central',
    parentBasin: 'georgia',
    lat: 49.224, lon: -123.213,
    capacityMGD: 180,
    treatmentLevel: 'secondary',  // Secondary upgrade completed 2024
    nutrientRemoval: 0.80,
    pharmRemoval: 0.35,
    csoRisk: 0.06,
    yearBuilt: 1963,
    note: 'Largest single discharge to Salish Sea. Secondary upgrade 2024. Fraser River influence zone.',
  },
];

// Total baseline discharge: 544 MGD = ~24 m³/s
export const TOTAL_CAPACITY_MGD = WASTEWATER_PLANTS.reduce((s, p) => s + p.capacityMGD, 0);

// Aggregate by parent basin for engine coupling
export const WASTEWATER_BY_BASIN = {};
for (const p of WASTEWATER_PLANTS) {
  if (!WASTEWATER_BY_BASIN[p.parentBasin]) WASTEWATER_BY_BASIN[p.parentBasin] = [];
  WASTEWATER_BY_BASIN[p.parentBasin].push(p);
}
