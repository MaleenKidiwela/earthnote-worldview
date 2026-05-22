// ═══════════════════════════════════════════════════════════
// PORT SYSTEM — Terminal-level maritime facility registry
// ═══════════════════════════════════════════════════════════
// Every significant maritime terminal in the Salish Sea.
//
// Sources:
//   NWSA — Northwest Seaport Alliance 2024 Annual Report + Terminal Fact Sheets
//   VFPA — Vancouver Fraser Port Authority 2024 Statistics Overview + Land Use Plan
//   DOD  — Department of Defense Base Structure Report FY2024
//   CER  — Canada Energy Regulator, Trans Mountain Conditions Compliance Report 2024
//   EIA  — US Energy Information Administration, Refinery Capacity Report 2024
//   WSF  — Washington State Ferries 2023 Annual Traffic Statistics
//   USGS — National Seismic Hazard Model 2023 (liquefaction susceptibility)
//   PNSN — Pacific Northwest Seismic Network, site amplification data
//   Port of Seattle — 2025 Cruise Season Summary (1.35M passengers)
//   JOC/IHS Markit — PNW Gateway Market Share Analysis 2023

export const TERMINALS = [
  // ──── NWSA SEATTLE (North Harbor) ────
  // Source: NWSA Terminal Fact Sheets 2024 (capacity, cranes, acreage)
  // Seismic: USGS NSHM 2023 + PNSN Vs30 soil maps (liquefaction scores)
  { id: 'nwsa_t5', name: 'Terminal 5', port: 'NWSA-Seattle', subBasin: 'main_north',
    type: 'container', acres: 185, capacity: { teu: 1200000, maxVesselTEU: 16000 }, // NWSA 2024 modernization announcement
    shorePower: true, craneCount: 6, railAccess: 'near-dock', labor: 'ILWU-US',
    currentUtil: 0.80, tenant: 'SSA Marine', modernized: 2024,
    latlon: { lat: 47.580, lon: -122.355 },
    soilType: 'fill', liquefactionSusceptibility: 0.85, seismicUpgrade: 0.30, fireRisk: 0.05,
    notes: 'Modernized 2024, largest cranes on US West Coast, big-ship ready' },
  { id: 'nwsa_t18', name: 'Terminal 18', port: 'NWSA-Seattle', subBasin: 'main_north',
    type: 'container', acres: 198, capacity: { teu: 800000, maxVesselTEU: 12000 },
    shorePower: false, craneCount: 4, railAccess: 'near-dock', labor: 'ILWU-US',
    currentUtil: 0.75, tenant: 'Total Terminals International',
    latlon: { lat: 47.577, lon: -122.352 },
    soilType: 'fill', liquefactionSusceptibility: 0.80, seismicUpgrade: 0.20, fireRisk: 0.05 },
  { id: 'nwsa_t46', name: 'Terminal 46', port: 'NWSA-Seattle', subBasin: 'main_north',
    type: 'breakbulk', acres: 72, capacity: { teu: 200000, maxVesselTEU: 8000 },
    shorePower: false, craneCount: 2, railAccess: 'none', labor: 'ILWU-US',
    currentUtil: 0.60, latlon: { lat: 47.592, lon: -122.341 },
    soilType: 'fill', liquefactionSusceptibility: 0.75, seismicUpgrade: 0.20, fireRisk: 0.03 },
  { id: 'sea_cruise_91', name: 'Pier 91 Cruise', port: 'NWSA-Seattle', subBasin: 'main_north',
    type: 'cruise', acres: 30, capacity: { cruiseCalls: 200 },
    shorePower: false, latlon: { lat: 47.633, lon: -122.387 },
    soilType: 'fill', liquefactionSusceptibility: 0.60, seismicUpgrade: 0.25, fireRisk: 0.02,
    notes: 'Smith Cove Cruise Terminal — record 1.35M passengers 2025 (Port of Seattle 2025 Cruise Season Summary)' },
  { id: 'sea_cruise_66', name: 'Pier 66 Cruise', port: 'NWSA-Seattle', subBasin: 'main_north',
    type: 'cruise', acres: 20, capacity: { cruiseCalls: 100 },
    latlon: { lat: 47.612, lon: -122.353 },
    soilType: 'fill', liquefactionSusceptibility: 0.70, seismicUpgrade: 0.25, fireRisk: 0.02 },
  { id: 'sea_fishing', name: 'Fishermen\'s Terminal', port: 'NWSA-Seattle', subBasin: 'main_north',
    type: 'fishing', acres: 15, capacity: { vessels: 400 },
    latlon: { lat: 47.655, lon: -122.388 },
    soilType: 'fill', liquefactionSusceptibility: 0.50, seismicUpgrade: 0.15, fireRisk: 0.05,
    notes: 'Homeport of North Pacific fishing fleet' },

  // ──── NWSA TACOMA (South Harbor) ────
  // Source: NWSA 2024 Annual Report — Tacoma harbor terminals
  { id: 'nwsa_husky', name: 'Husky Terminal', port: 'NWSA-Tacoma', subBasin: 'main_south',
    type: 'container', acres: 133, capacity: { teu: 900000, maxVesselTEU: 14000 },
    shorePower: true, craneCount: 5, railAccess: 'on-dock', labor: 'ILWU-US',
    currentUtil: 0.82, tenant: 'Husky Terminal',
    latlon: { lat: 47.265, lon: -122.415 },
    soilType: 'fill', liquefactionSusceptibility: 0.80, seismicUpgrade: 0.40, fireRisk: 0.05 },
  { id: 'nwsa_wut', name: 'WUT', port: 'NWSA-Tacoma', subBasin: 'main_south',
    type: 'container', acres: 132, capacity: { teu: 700000, maxVesselTEU: 12000 },
    shorePower: false, craneCount: 4, railAccess: 'on-dock', labor: 'ILWU-US',
    currentUtil: 0.78, latlon: { lat: 47.272, lon: -122.412 },
    soilType: 'fill', liquefactionSusceptibility: 0.75, seismicUpgrade: 0.20, fireRisk: 0.05 },
  { id: 'nwsa_pct', name: 'Pierce County Terminal', port: 'NWSA-Tacoma', subBasin: 'main_south',
    type: 'container', acres: 60, capacity: { teu: 400000, maxVesselTEU: 10000 },
    shorePower: false, craneCount: 3, railAccess: 'near-dock', labor: 'ILWU-US',
    currentUtil: 0.65, latlon: { lat: 47.278, lon: -122.408 },
    soilType: 'fill', liquefactionSusceptibility: 0.70, seismicUpgrade: 0.20, fireRisk: 0.04 },
  { id: 'nwsa_tote', name: 'TOTE Alaska', port: 'NWSA-Tacoma', subBasin: 'main_south',
    type: 'container', acres: 40, capacity: { teu: 200000 },
    shorePower: true, notes: 'LNG-powered Alaska service',
    latlon: { lat: 47.260, lon: -122.420 },
    soilType: 'fill', liquefactionSusceptibility: 0.65, seismicUpgrade: 0.30, fireRisk: 0.10 },

  // ──── VANCOUVER FRASER PORT AUTHORITY ────
  // Source: VFPA 2024 Statistics Overview (capacity, utilization)
  // Deltaport seismic: Fraser Delta geotechnical surveys (alluvial foreslope)
  { id: 'van_deltaport', name: 'Deltaport', port: 'Vancouver', subBasin: 'georgia_south',
    type: 'container', acres: 140, capacity: { teu: 2000000, maxVesselTEU: 14000 },
    shorePower: false, craneCount: 8, railAccess: 'on-dock', labor: 'ILWU-CA',
    currentUtil: 0.85, tenant: 'GCT',
    latlon: { lat: 49.020, lon: -123.230 },
    soilType: 'alluvium', liquefactionSusceptibility: 0.90, seismicUpgrade: 0.20, fireRisk: 0.05,
    notes: 'Roberts Bank — Canada\'s largest container terminal. ON the Fraser Delta foreslope. T2 expansion controversial.' },
  { id: 'van_centerm', name: 'Centerm', port: 'Vancouver', subBasin: 'georgia_central',
    type: 'container', acres: 77, capacity: { teu: 900000, maxVesselTEU: 12000 },
    shorePower: true, craneCount: 5, railAccess: 'on-dock', labor: 'ILWU-CA',
    currentUtil: 0.80, tenant: 'DP World',
    latlon: { lat: 49.285, lon: -123.075 },
    soilType: 'mixed', liquefactionSusceptibility: 0.40, seismicUpgrade: 0.50, fireRisk: 0.05 },
  { id: 'van_vanterm', name: 'Vanterm', port: 'Vancouver', subBasin: 'georgia_central',
    type: 'container', acres: 54, capacity: { teu: 600000, maxVesselTEU: 10000 },
    shorePower: false, craneCount: 4, railAccess: 'near-dock', labor: 'ILWU-CA',
    currentUtil: 0.75, latlon: { lat: 49.290, lon: -123.080 },
    soilType: 'mixed', liquefactionSusceptibility: 0.35, seismicUpgrade: 0.50, fireRisk: 0.05 },
  { id: 'van_transmtn', name: 'Trans Mountain Terminal', port: 'Vancouver', subBasin: 'georgia_central',
    type: 'tanker', acres: 30, capacity: { bblPerDay: 890000 },
    shorePower: false,
    latlon: { lat: 49.288, lon: -122.950 },
    soilType: 'alluvium', liquefactionSusceptibility: 0.65, seismicUpgrade: 0.30, fireRisk: 0.40,
    notes: 'TMX pipeline terminus — expanded to 890K bbl/day 2024. ~34 tankers/month (Aframax). CER, Tsleil-Waututh/Musqueam/Squamish Nations opposed.' },
  { id: 'van_neptune', name: 'Neptune Bulk', port: 'Vancouver', subBasin: 'georgia_central',
    type: 'bulk', acres: 60, capacity: { mtPerYear: 25 },
    notes: 'Coal + potash export', latlon: { lat: 49.292, lon: -123.058 },
    soilType: 'mixed', liquefactionSusceptibility: 0.30, seismicUpgrade: 0.40, fireRisk: 0.10 },
  { id: 'van_westshore', name: 'Westshore Terminals', port: 'Vancouver', subBasin: 'georgia_south',
    type: 'bulk', acres: 50, capacity: { mtPerYear: 33 },
    notes: 'Coal export (Roberts Bank) — controversial', latlon: { lat: 49.025, lon: -123.225 },
    soilType: 'alluvium', liquefactionSusceptibility: 0.85, seismicUpgrade: 0.20, fireRisk: 0.15 },
  { id: 'van_cruise', name: 'Canada Place', port: 'Vancouver', subBasin: 'georgia_central',
    type: 'cruise', acres: 25, capacity: { cruiseCalls: 350 },
    latlon: { lat: 49.288, lon: -123.111 },
    soilType: 'bedrock', liquefactionSusceptibility: 0.15, seismicUpgrade: 0.50, fireRisk: 0.02 },

  // ──── REFINERIES ────
  // Source: EIA Refinery Capacity Report 2024 (bbl/day), WDOE permits (employment)
  { id: 'cherry_bp', name: 'Cherry Point (BP)', port: 'Bellingham', subBasin: 'georgia_south',
    type: 'refinery', acres: 200, capacity: { bblPerDay: 225000 },
    latlon: { lat: 48.863, lon: -122.760 },
    soilType: 'bedrock_fill', liquefactionSusceptibility: 0.30, seismicUpgrade: 0.30, fireRisk: 0.60,
    notes: '225K bbl/day. Crude import by tanker + pipeline. 800+ jobs.' },
  { id: 'cherry_p66', name: 'Cherry Point (Phillips 66)', port: 'Bellingham', subBasin: 'georgia_south',
    type: 'refinery', acres: 100, capacity: { bblPerDay: 105000 },
    latlon: { lat: 48.858, lon: -122.755 },
    soilType: 'bedrock_fill', liquefactionSusceptibility: 0.30, seismicUpgrade: 0.30, fireRisk: 0.55 },
  { id: 'march_marathon', name: 'March Point (Marathon)', port: 'Anacortes', subBasin: 'whidbey_north',
    type: 'refinery', acres: 100, capacity: { bblPerDay: 119000 },
    latlon: { lat: 48.495, lon: -122.553 },
    soilType: 'mixed', liquefactionSusceptibility: 0.35, seismicUpgrade: 0.25, fireRisk: 0.50 },
  { id: 'march_holly', name: 'March Point (HollyFrontier)', port: 'Anacortes', subBasin: 'whidbey_north',
    type: 'refinery', acres: 50, capacity: { bblPerDay: 60000 },
    latlon: { lat: 48.490, lon: -122.558 },
    soilType: 'mixed', liquefactionSusceptibility: 0.35, seismicUpgrade: 0.25, fireRisk: 0.45 },

  // ──── MILITARY ────
  // Source: DOD Base Structure Report FY2024, Navy Region NW public affairs
  { id: 'psns', name: 'Puget Sound Naval Shipyard', port: 'Bremerton', subBasin: 'main_central',
    type: 'military', acres: 300, capacity: { docks: 6 },
    latlon: { lat: 47.553, lon: -122.646 },
    soilType: 'bedrock', liquefactionSusceptibility: 0.10, seismicUpgrade: 0.90, fireRisk: 0.08,
    notes: 'Nuclear shipyard, aircraft carrier maintenance. 14,500 civilian jobs. DOD 2024.' },
  { id: 'bangor', name: 'Naval Base Kitsap-Bangor', port: 'Bremerton', subBasin: 'hood_north',
    type: 'military', acres: 7000, capacity: { submarines: 8 },
    latlon: { lat: 47.720, lon: -122.727 },
    soilType: 'bedrock', liquefactionSusceptibility: 0.08, seismicUpgrade: 0.95, fireRisk: 0.05,
    notes: 'Nuclear submarine base (Trident fleet). 3rd largest nuclear arsenal in US.' },

  // ──── PUYALLUP TRIBAL ────
  { id: 'puyallup_tribal', name: 'Puyallup Tribal Terminal', port: 'NWSA-Tacoma', subBasin: 'main_south',
    type: 'breakbulk', acres: 120, capacity: { breakbulkTons: 500000 },
    shorePower: false, railAccess: 'near-dock', labor: 'tribal',
    currentUtil: 0.0, // under development
    latlon: { lat: 47.258, lon: -122.418 },
    soilType: 'fill', liquefactionSusceptibility: 0.70, seismicUpgrade: 0.80, fireRisk: 0.03,
    notes: 'First tribally-owned terminal at a major US port (Puyallup Tribe MOU March 2025). East Blair Waterway. 50/50 revenue sharing with NWSA. Precedent-setting for tribal maritime economic sovereignty.' },

  // ──── VICTORIA ────
  { id: 'vic_ogden', name: 'Ogden Point', port: 'Victoria', subBasin: 'jdf_east',
    type: 'cruise', acres: 15, capacity: { cruiseCalls: 320 },
    latlon: { lat: 48.413, lon: -123.388 },
    soilType: 'bedrock', liquefactionSusceptibility: 0.12, seismicUpgrade: 0.40, fireRisk: 0.02,
    notes: 'Victoria cruise terminal — 900K+ passengers/yr' },
];

// Terminal IDs grouped by parent port
export const PORT_TERMINALS = {
  'NWSA-Seattle': ['nwsa_t5', 'nwsa_t18', 'nwsa_t46', 'sea_cruise_91', 'sea_cruise_66', 'sea_fishing'],
  'NWSA-Tacoma': ['nwsa_husky', 'nwsa_wut', 'nwsa_pct', 'nwsa_tote'],
  'Vancouver': ['van_deltaport', 'van_centerm', 'van_vanterm', 'van_transmtn', 'van_neptune', 'van_westshore', 'van_cruise'],
  'Bellingham': ['cherry_bp', 'cherry_p66'],
  'Anacortes': ['march_marathon', 'march_holly'],
  'Bremerton': ['psns', 'bangor'],
  'Victoria': ['vic_ogden'],
};

// Vessel transits through Haro Strait (SJ West) per year at baseline
// ALL Vancouver-bound container ships plus tankers transit Haro Strait
export const HARO_STRAIT_TRANSITS_BASELINE = {
  containerToVancouver: 2200,   // ~6/day avg — VFPA vessel call data
  tankerTransMountain: 408,     // ~34/month post-TMX expansion — CER conditions
  bulkToVancouver: 800,         // coal, grain, potash
  cruiseToVancouver: 350,       // seasonal
  total: 3758,
};

// Trans Mountain tanker route: Burrard Inlet → Georgia Central → Haro Strait → JdF → Pacific
export const TMX_TANKER_ROUTE = ['georgia_central', 'sj_haro', 'jdf_central', 'jdf_west'];

// Competitive routing fractions (baseline)
// Source: JOC/IHS Markit PNW gateway market share analysis
export const ROUTE_SHARES_BASELINE = {
  nwsa: 0.30,           // NWSA (Seattle + Tacoma combined)
  vancouver: 0.35,      // Vancouver Fraser Port
  princeRupert: 0.15,   // Prince Rupert (outside Salish Sea but competes)
  laLongBeach: 0.20,    // Diverted south
};

// Refinery summary
export const REFINERY_CAPACITY = {
  totalBblPerDay: 509000 + 890000, // 4 refineries + TMX pipeline
  refineries: 4,
  directJobs: 2500,
  economicOutput: 9000, // $M/yr
};

export const TERMINAL_COUNT = TERMINALS.length;
