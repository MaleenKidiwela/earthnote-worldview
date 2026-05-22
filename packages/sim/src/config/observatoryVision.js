// ═══════════════════════════════════════════════════════════
// OBSERVATORY VISION — Fully Instrumented Salish Sea
// ═══════════════════════════════════════════════════════════
// What it would look like if we extended OOI/ONC cabling to
// the entire Salish Sea basin system. The Digital Cousin as
// the interpretive layer for a real-time cabled observatory.
//
// Context: The OOI Regional Cabled Array cost ~$385M to
// instrument one volcanic ridge off Oregon. For 20-25% of
// that cost (~$75-100M), we could continuously monitor the
// ecosystem that 9 million people depend on.
//
// "The Salish Sea is the most ecologically significant body
//  of water on the Pacific coast of North America. We know
//  more about the seafloor at Juan de Fuca Ridge than we do
//  about the waters in our own backyard." — John Delaney
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

// ── INSTRUMENT TYPES ──
// Standard sensor packages for cabled observatory nodes
export const INSTRUMENT_CATALOG = {
  ctd_profiler: {
    name: 'CTD Profiler',
    variables: ['temperature', 'salinity', 'density', 'pressure'],
    frequency: 'continuous',
    cost: 250000,
    maintenancePerYear: 15000,
    depth: 'full water column',
    description: 'Conductivity-Temperature-Depth profiler. Autonomous winched or fixed-depth array.',
    reference: 'Sea-Bird SBE 52-MP or equivalent',
  },
  do_sensor: {
    name: 'Dissolved Oxygen Sensor',
    variables: ['dissolved_oxygen'],
    frequency: '10 min',
    cost: 80000,
    maintenancePerYear: 8000,
    depth: 'near-bottom + surface',
    description: 'Optical DO sensor. Critical for hypoxia detection.',
    reference: 'Aanderaa 4831 or Sea-Bird SBE 63',
  },
  ph_pco2: {
    name: 'pH/pCO2 Sensor',
    variables: ['pH', 'pCO2', 'omega_aragonite'],
    frequency: 'hourly',
    cost: 120000,
    maintenancePerYear: 20000,
    depth: '5m, 50m',
    description: 'Spectrophotometric pH + membrane pCO2. OA monitoring.',
    reference: 'Sunburst SAMI-pH/CO2',
  },
  hydrophone: {
    name: 'Broadband Hydrophone',
    variables: ['noise_SPL', 'whale_detections', 'vessel_presence'],
    frequency: 'continuous',
    cost: 50000,
    maintenancePerYear: 5000,
    depth: '30m',
    description: 'Broadband hydrophone with real-time cetacean detection. Enables continuous SRKW habitat monitoring.',
    reference: 'Ocean Sonics icListen or Orcasound design',
  },
  current_meter: {
    name: 'Acoustic Current Meter',
    variables: ['current_u', 'current_v', 'current_w'],
    frequency: '10 min',
    cost: 150000,
    maintenancePerYear: 12000,
    depth: '10m, 50m, 100m',
    description: 'ADCP for current profiles. Tracks exchange flows, upwelling, plume dynamics.',
    reference: 'Teledyne RDI Workhorse or Sentinel V',
  },
  nutrient_analyzer: {
    name: 'In-Situ Nutrient Analyzer',
    variables: ['nitrate', 'phosphate', 'silicate', 'ammonium'],
    frequency: 'hourly',
    cost: 300000,
    maintenancePerYear: 30000,
    depth: '5m',
    description: 'Wet-chemistry nutrient analyzer. Early warning for HAB-favorable conditions.',
    reference: 'SubChem Systems or WET Labs ISUS (nitrate)',
  },
  turbidity_sensor: {
    name: 'Turbidity/Sediment Sensor',
    variables: ['turbidity', 'sediment_flux', 'backscatter'],
    frequency: '10 min',
    cost: 40000,
    maintenancePerYear: 4000,
    depth: '5m, near-bottom',
    description: 'Optical backscatter sensor. Tracks sediment transport, plume extent, dredge impacts.',
    reference: 'WET Labs ECO-NTU or OBS-3+',
  },
  fluorometer: {
    name: 'Chlorophyll Fluorometer',
    variables: ['chlorophyll_a', 'CDOM', 'phycoerythrin'],
    frequency: '10 min',
    cost: 60000,
    maintenancePerYear: 6000,
    depth: '5m',
    description: 'Multi-channel fluorometer. Detects bloom initiation, HAB species (phycoerythrin).',
    reference: 'WET Labs ECO Triplet',
  },
  camera: {
    name: 'Seafloor Camera',
    variables: ['benthic_imagery', 'species_counts'],
    frequency: 'hourly stills, event-triggered video',
    cost: 75000,
    maintenancePerYear: 8000,
    depth: 'bottom',
    description: 'HD camera with LED illumination. Benthic community monitoring, fish counts.',
    reference: 'ONC NEPTUNE seafloor cameras',
  },
};

// ── PER SUB-BASIN INSTRUMENTATION PLAN ──
// Each sub-basin gets a tailored sensor package based on its ecological priority
export const PROPOSED_NETWORK = [
  // ──── HOOD CANAL — HIGHEST PRIORITY (chronic hypoxia) ────
  {
    subBasin: 'hood_south',
    priorityRank: 1,
    rationale: 'Chronic deep hypoxia with recurring fish kills. Only has Twanoh DO sensor. Most ecologically critical sub-basin with LEAST monitoring.',
    instruments: ['ctd_profiler', 'do_sensor', 'do_sensor', 'ph_pco2', 'hydrophone', 'nutrient_analyzer', 'turbidity_sensor', 'fluorometer'],
    cableRoute: 'From main_central hub through Hood Canal sill to backbone along western shore',
    existingStations: ['NANOOS_twanoh'],
    coverageGap: 'No real-time deep DO, no currents, no nutrients — flying blind in hypoxic basin',
  },
  {
    subBasin: 'hood_north',
    priorityRank: 2,
    rationale: 'Dabob Bay — deep basin with intermittent hypoxia. Naval submarine testing area. Sill controls deep water renewal.',
    instruments: ['ctd_profiler', 'do_sensor', 'ph_pco2', 'current_meter', 'hydrophone', 'fluorometer'],
    cableRoute: 'Branch from hood_south backbone',
    existingStations: ['NANOOS_dabob'],
    coverageGap: 'No continuous current measurements through sill — cannot observe deep water renewal events',
  },

  // ──── MAIN BASIN — HIGH PRIORITY (urban impacts + ports) ────
  {
    subBasin: 'main_north',
    priorityRank: 3,
    rationale: 'Elliott Bay / Duwamish — most urbanized sub-basin. Superfund contamination. Major port. SRKW sometimes feed here.',
    instruments: ['ctd_profiler', 'do_sensor', 'ph_pco2', 'hydrophone', 'nutrient_analyzer', 'turbidity_sensor', 'fluorometer', 'camera'],
    cableRoute: 'Shore station at NOAA WRC (Sand Point). Cable to Elliott Bay bottom.',
    existingStations: ['NOAA_9447130'],
    coverageGap: 'No subsurface monitoring at all — contamination from Duwamish untracked in real time',
  },
  {
    subBasin: 'main_south',
    priorityRank: 4,
    rationale: 'Commencement Bay — Puyallup River input, Superfund site, Tribal Terminal. Second major port.',
    instruments: ['ctd_profiler', 'do_sensor', 'ph_pco2', 'hydrophone', 'turbidity_sensor', 'fluorometer'],
    cableRoute: 'Branch from main_north backbone',
    existingStations: ['NOAA_9446484', 'USGS_12101500'],
    coverageGap: 'No real-time water quality in Commencement Bay itself',
  },
  {
    subBasin: 'main_central',
    priorityRank: 8,
    rationale: 'Central Puget Sound. Deep basin connects north and south. Naval Base Kitsap.',
    instruments: ['ctd_profiler', 'do_sensor', 'current_meter', 'hydrophone'],
    cableRoute: 'Backbone hub connecting north, south, and Hood Canal branches',
    existingStations: [],
    coverageGap: 'Zero real-time stations in central Main Basin',
  },

  // ──── HARO STRAIT / SAN JUAN — HIGH PRIORITY (SRKW critical habitat) ────
  {
    subBasin: 'sj_haro',
    priorityRank: 5,
    rationale: 'SRKW critical habitat. All Vancouver-bound shipping transits here. ECHO slowdown zone. 3,758 vessel transits/year.',
    instruments: ['ctd_profiler', 'do_sensor', 'hydrophone', 'hydrophone', 'current_meter', 'fluorometer'],
    cableRoute: 'From Victoria shore station. Cable through Haro Strait (challenging currents).',
    existingStations: ['NOAA_9449880', 'Orcasound_lab'],
    coverageGap: 'Need continuous noise monitoring across full strait width, not just one shoreline hydrophone',
  },
  {
    subBasin: 'sj_rosario',
    priorityRank: 10,
    rationale: 'Rosario Strait — secondary passage. Deception Pass tidal rapids.',
    instruments: ['ctd_profiler', 'hydrophone', 'current_meter'],
    cableRoute: 'Branch from whidbey_north',
    existingStations: [],
    coverageGap: 'No monitoring infrastructure at all',
  },

  // ──── GEORGIA STRAIT — HIGH PRIORITY (Fraser plume + Canadian ports) ────
  {
    subBasin: 'georgia_central',
    priorityRank: 6,
    rationale: 'Fraser plume zone. Strongest stratification. Vancouver port terminals. 4 First Nations territories. Trans Mountain tanker route.',
    instruments: ['ctd_profiler', 'do_sensor', 'ph_pco2', 'nutrient_analyzer', 'turbidity_sensor', 'fluorometer', 'current_meter', 'camera'],
    cableRoute: 'From ONC VENUS backbone. Extension to Fraser plume monitoring array.',
    existingStations: ['ONC_VENUS_DDL'],
    coverageGap: 'ONC covers Saanich Inlet but NOT the Fraser plume itself — the single most dynamic feature',
  },
  {
    subBasin: 'georgia_south',
    priorityRank: 7,
    rationale: 'Boundary Bay / Roberts Bank. Deltaport. Cherry Point refineries. Lummi Nation herring grounds.',
    instruments: ['ctd_profiler', 'do_sensor', 'ph_pco2', 'hydrophone', 'turbidity_sensor', 'fluorometer'],
    cableRoute: 'Branch from georgia_central backbone',
    existingStations: ['NOAA_9449424', 'USGS_12213100'],
    coverageGap: 'No marine water quality monitoring despite refineries and port',
  },
  {
    subBasin: 'georgia_north',
    priorityRank: 14,
    rationale: 'Northern Georgia Strait. Less urbanized. Important for juvenile salmon migration corridor.',
    instruments: ['ctd_profiler', 'do_sensor', 'fluorometer'],
    cableRoute: 'Extension from georgia_central northward',
    existingStations: [],
    coverageGap: 'No real-time stations in northern Georgia Strait',
  },

  // ──── JUAN DE FUCA — MEDIUM PRIORITY (already some coverage) ────
  {
    subBasin: 'jdf_west',
    priorityRank: 11,
    rationale: 'Pacific entrance. Upwelling gateway. Makah territory. Cape Flattery oceanographic transition.',
    instruments: ['ctd_profiler', 'do_sensor', 'current_meter', 'hydrophone', 'nutrient_analyzer'],
    cableRoute: 'From OOI Regional Cabled Array extension. Challenging open-ocean environment.',
    existingStations: ['NOAA_9443090', 'NDBC_46087'],
    coverageGap: 'Good surface stations but no subsurface — cannot observe upwelling injection',
  },
  {
    subBasin: 'jdf_central',
    priorityRank: 12,
    rationale: 'Central strait. Elwha River recovery zone. S\'Klallam territory.',
    instruments: ['ctd_profiler', 'do_sensor', 'current_meter', 'turbidity_sensor'],
    cableRoute: 'From jdf_west backbone eastward',
    existingStations: ['NOAA_9444090'],
    coverageGap: 'No subsurface monitoring of estuarine exchange flow — the engine of Puget Sound flushing',
  },
  {
    subBasin: 'jdf_east',
    priorityRank: 13,
    rationale: 'Admiralty Inlet — the gateway. All tidal exchange with Puget Sound funnels through here.',
    instruments: ['ctd_profiler', 'do_sensor', 'current_meter', 'current_meter', 'hydrophone'],
    cableRoute: 'Critical node connecting JdF branch to Main Basin backbone',
    existingStations: ['NOAA_9444900', 'Orcasound_pt'],
    coverageGap: 'Need continuous current monitoring at this chokepoint — controls all of Puget Sound flushing',
  },

  // ──── WHIDBEY BASIN — MEDIUM PRIORITY ────
  {
    subBasin: 'whidbey_north',
    priorityRank: 9,
    rationale: 'Skagit Delta — largest river. Swinomish/Upper Skagit treaty fisheries. March Point refineries nearby.',
    instruments: ['ctd_profiler', 'do_sensor', 'turbidity_sensor', 'fluorometer', 'nutrient_analyzer'],
    cableRoute: 'From sj_rosario branch or separate shore station at La Conner',
    existingStations: ['USGS_12200500'],
    coverageGap: 'USGS measures river but not the estuary/delta marine interface',
  },
  {
    subBasin: 'whidbey_central',
    priorityRank: 15,
    rationale: 'Saratoga Passage. Stillaguamish input. Moderate hypoxia risk.',
    instruments: ['ctd_profiler', 'do_sensor', 'fluorometer'],
    cableRoute: 'Branch from whidbey_north',
    existingStations: ['USGS_12167000'],
    coverageGap: 'River gauge only — no marine monitoring',
  },
  {
    subBasin: 'whidbey_south',
    priorityRank: 16,
    rationale: 'Possession Sound. Everett waterfront. Snohomish estuary. Tulalip treaty area.',
    instruments: ['ctd_profiler', 'do_sensor', 'turbidity_sensor'],
    cableRoute: 'Branch from whidbey_central to Everett shore station',
    existingStations: ['USGS_12150800'],
    coverageGap: 'River gauge only — critical estuary unmonitored',
  },

  // ──── SOUTH SOUND — LOWER PRIORITY ────
  {
    subBasin: 'ssound_north',
    priorityRank: 17,
    rationale: 'Nisqually Reach / Delta. Nisqually tribe. Model restoration success story.',
    instruments: ['ctd_profiler', 'do_sensor', 'turbidity_sensor', 'camera'],
    cableRoute: 'From main_south backbone through Tacoma Narrows',
    existingStations: ['USGS_12089500'],
    coverageGap: 'Restored delta has no marine monitoring to validate success',
  },
  {
    subBasin: 'ssound_south',
    priorityRank: 18,
    rationale: 'Budd Inlet / Olympia. Most restricted flushing. State capitol.',
    instruments: ['ctd_profiler', 'do_sensor', 'nutrient_analyzer'],
    cableRoute: 'Extension from ssound_north',
    existingStations: [],
    coverageGap: 'Zero real-time monitoring in South Sound — potential eutrophication hotspot',
  },
];

// ── NETWORK COST SUMMARY ──
function computeNetworkCost() {
  let totalInstrumentCost = 0;
  let totalMaintenancePerYear = 0;
  let instrumentCount = 0;

  for (const node of PROPOSED_NETWORK) {
    for (const instType of node.instruments) {
      const spec = INSTRUMENT_CATALOG[instType];
      if (spec) {
        totalInstrumentCost += spec.cost;
        totalMaintenancePerYear += spec.maintenancePerYear;
        instrumentCount++;
      }
    }
  }

  return {
    instrumentCost: totalInstrumentCost,
    cablingCost: 25000000,         // ~$25M for submarine cables (based on OOI/ONC per-km costs)
    shoreStations: 8000000,        // ~$8M for 4-5 shore stations with power/data infrastructure
    dataCenter: 5000000,           // ~$5M for data management, processing, archival
    totalCapital: totalInstrumentCost + 25000000 + 8000000 + 5000000,
    annualMaintenance: totalMaintenancePerYear + 2000000, // +$2M for cable maintenance, staff
    instrumentCount: instrumentCount,
    subBasinsCovered: PROPOSED_NETWORK.length,
    comparisons: {
      ooiCabledArray: { cost: 385000000, description: 'OOI Regional Cabled Array — one volcanic ridge' },
      salishSeaNetwork: { cost: totalInstrumentCost + 38000000, description: 'Full Salish Sea observatory — ecosystem 9M people depend on' },
      ratio: (totalInstrumentCost + 38000000) / 385000000,
      message: 'For ' + Math.round((totalInstrumentCost + 38000000) / 385000000 * 100) + '% of the OOI Regional Cabled Array cost, we could monitor the entire Salish Sea.',
    },
  };
}

export const NETWORK_COST = computeNetworkCost();

// ── COVERAGE GAP ANALYSIS ──
export const COVERAGE_GAPS = {
  noRealTimeMonitoring: ['main_central', 'sj_rosario', 'georgia_north', 'whidbey_central', 'whidbey_south', 'ssound_south'],
  riverOnlyNoMarine: ['whidbey_north', 'ssound_north'],
  criticalGaps: [
    { basin: 'hood_south', issue: 'Chronic hypoxia with no deep DO monitoring', impact: 'Fish kills go undetected until dead fish float' },
    { basin: 'sj_haro', issue: 'SRKW critical habitat with one shoreline hydrophone', impact: 'Cannot assess noise exposure across whale habitat' },
    { basin: 'georgia_central', issue: 'Fraser plume — most dynamic feature — unmonitored', impact: 'Cannot track sediment, nutrients, or contaminants in real time' },
    { basin: 'jdf_east', issue: 'Admiralty Inlet — gateway to Puget Sound — no current meter', impact: 'Cannot observe deep water renewal events that control basin-wide oxygen' },
    { basin: 'main_north', issue: 'Most urbanized basin with Superfund contamination — no subsurface sensors', impact: 'Cannot track contamination transport in real time' },
  ],
};

// ── WHAT FULL INSTRUMENTATION ENABLES ──
export const OBSERVATORY_CAPABILITIES = {
  nowcast: 'Data assimilation in ALL 18 sub-basins (currently only where stations exist)',
  hypoxiaAlert: 'Real-time detection of hypoxia events — hours, not months after fish kills',
  srkwMonitoring: 'Continuous acoustic monitoring across ALL SRKW critical habitat',
  habEarlyWarning: 'Nutrient spike detection 3-7 days before HAB bloom initiation',
  modelValidation: 'Continuous validation of every model prediction, every timestep',
  forecastSystem: 'The Digital Cousin becomes a NOWCAST + FORECAST system, not just a scenario tool',
  climateBaseline: 'Continuous long-term records for climate change detection in every sub-basin',
  emergencyResponse: 'Real-time environmental assessment during disasters (earthquakes, spills, tsunamis)',
};

// ── EXISTING vs PROPOSED STATION COUNTS ──
export const STATION_COMPARISON = {
  existing: {
    ocean: 6,     // NOAA CO-OPS SST
    waterLevel: 2,
    river: 7,     // USGS + EC
    waterQuality: 4,
    bioacoustics: 3,  // Orcasound (static baselines)
    ooi: 6,       // OOI Endurance + Cabled Array
    onc: 2,       // ONC VENUS
    total: 30,    // approximate real-time marine/aquatic
  },
  proposed: {
    ctd: 18,
    do: 20,       // some basins get 2
    phPco2: 10,
    hydrophone: 10,
    currentMeter: 8,
    nutrient: 7,
    turbidity: 10,
    fluorometer: 14,
    camera: 3,
    total: 100,   // approximate
  },
  improvementFactor: 'Current: ~30 real-time stations across 18 sub-basins (1.7 per sub-basin average). Proposed: ~100 additional sensors = ~7 per sub-basin. 4x improvement in observing density.',
};
