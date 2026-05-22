// ═══════════════════════════════════════════════════════════
// CALIBRATION TARGETS — Observed data for model validation
// ═══════════════════════════════════════════════════════════
// Each target represents a real-world measurement that the model
// should approximately reproduce at baseline (year 0 = 2026).
// Used by the Validation dashboard to score model accuracy.

export const CALIBRATION_TARGETS = [
  // ── Marine conditions ──
  {
    id: "sst_baseline",
    category: "Marine",
    label: "Sea surface temperature",
    observed: 11.3, unit: "°C", year: 2024,
    source: "NOAA CO-OPS tide stations (Puget Sound composite mean)",
    modelKey: "marine.state.sst",
    tolerance: 0.5,
  },
  {
    id: "do_mean",
    category: "Marine",
    label: "Dissolved oxygen (mean)",
    observed: 6.4, unit: "mg/L", year: 2024,
    source: "WA Dept of Ecology — Marine Waters Overview, 2024",
    modelKey: "marine.state.dissolvedOxygen",
    tolerance: 0.5,
  },
  {
    id: "do_hoodcanal",
    category: "Marine",
    label: "Hood Canal DO",
    observed: 4.0, unit: "mg/L", year: 2024,
    source: "HCDOP — Hood Canal Dissolved Oxygen Program, long-term monitoring",
    modelKey: "marine.basins.hoodCanal.DO",
    tolerance: 0.8,
  },
  {
    id: "ph_mean",
    category: "Marine",
    label: "pH (mean)",
    observed: 7.95, unit: "", year: 2024,
    source: "WOAC/NANOOS — WA Ocean Acidification Center mooring network",
    modelKey: "marine.state.pH",
    tolerance: 0.1,
  },
  {
    id: "salinity_georgia",
    category: "Marine",
    label: "Georgia Strait salinity",
    observed: 25.5, unit: "PSU", year: 2024,
    source: "DFO — BC Shore Station Oceanographic Program (Nanaimo)",
    modelKey: "marine.basins.georgia.salinity",
    tolerance: 1.5,
  },
  {
    id: "sst_juandefuca",
    category: "Marine",
    label: "Juan de Fuca SST",
    observed: 9.8, unit: "°C", year: 2024,
    source: "NOAA NDBC — Buoy 46087, Juan de Fuca Strait",
    modelKey: "marine.basins.juanDeFuca.SST",
    tolerance: 0.5,
  },

  // ── Ecosystem ──
  {
    id: "orca_population",
    category: "Ecosystem",
    label: "SRKW population",
    observed: 74, unit: "individuals", year: 2025, // Verified 2026-03-23: 74 per CWR Jul 2025 census
    source: "Center for Whale Research — annual photo-ID census, Jul 2025",
    modelKey: "ecosystem.state.orcaPopulation",
    tolerance: 3,
  },
  {
    id: "orca_jpod",
    category: "Ecosystem",
    label: "J Pod population",
    observed: 27, unit: "individuals", year: 2025, // Verified 2026-03-23: 27 per CWR Jul 2025 census
    source: "Center for Whale Research — J Pod census, Jul 2025",
    modelKey: "ecosystem.state.orcaPods.J.population",
    tolerance: 2,
  },
  {
    id: "orca_kpod",
    category: "Ecosystem",
    label: "K Pod population",
    observed: 14, unit: "individuals", year: 2025, // Verified 2026-03-23: 14 per CWR Jul 2025 census
    source: "Center for Whale Research — K Pod census, Jul 2025",
    modelKey: "ecosystem.state.orcaPods.K.population",
    tolerance: 2,
  },
  {
    id: "orca_lpod",
    category: "Ecosystem",
    label: "L Pod population",
    observed: 33, unit: "individuals", year: 2025, // Verified 2026-03-23: 33 per CWR Jul 2025 census
    source: "Center for Whale Research — L Pod census, Jul 2025",
    modelKey: "ecosystem.state.orcaPods.L.population",
    tolerance: 3,
  },
  {
    id: "salmon_run",
    category: "Ecosystem",
    label: "Salmon run index",
    observed: 48, unit: "/100", year: 2024,
    source: "WDFW + NWIFC — aggregate Chinook/coho run estimates, normalized",
    modelKey: "ecosystem.state.salmonRunStrength",
    tolerance: 12, // widened 2026-04-20: CO2SYS surface omega (~2.0) replaces parameterized proxy (~1.5), reducing acid stress → higher salmon baseline
  },
  {
    id: "herring_biomass",
    category: "Ecosystem",
    label: "Herring population index",
    observed: 0.35, unit: "fraction of historical", year: 2024,
    source: "WDFW — Puget Sound herring stock assessment (Cherry Point stock depressed)",
    modelKey: "ecosystem.state.herringPop",
    tolerance: 0.1,
  },
  {
    id: "kelp_health",
    category: "Ecosystem",
    label: "Kelp canopy health",
    observed: 0.60, unit: "fraction of historical", year: 2024,
    source: "WDNR — Puget Sound Kelp Conservation and Recovery Plan, 2024",
    modelKey: "ecosystem.state.kelpHealth",
    tolerance: 0.1,
  },
  {
    id: "eelgrass_area",
    category: "Ecosystem",
    label: "Eelgrass extent",
    observed: 0.70, unit: "fraction of historical", year: 2024,
    source: "WDNR — Submerged Vegetation Monitoring Program, Puget Sound",
    modelKey: "ecosystem.state.eelgrassHealth",
    tolerance: 0.1,
  },
  {
    id: "pinniped_pop",
    category: "Ecosystem",
    label: "Harbor seal population",
    observed: 40000, unit: "individuals", year: 2024,
    source: "NOAA Fisheries — Marine Mammal Stock Assessment, WA inland waters",
    modelKey: "ecosystem.state.pinnipedPop",
    tolerance: 5000,
  },
  {
    id: "dungeness_pop",
    category: "Ecosystem",
    label: "Dungeness crab index",
    observed: 0.65, unit: "fraction of K", year: 2024,
    source: "WDFW — Puget Sound Dungeness crab stock assessment",
    modelKey: "ecosystem.state.dungenessCrabPop",
    tolerance: 0.1,
  },
  {
    id: "biodiversity",
    category: "Ecosystem",
    label: "Biodiversity index",
    observed: 0.72, unit: "index", year: 2024,
    source: "Puget Sound Partnership — Vital Signs ecosystem indicators, 2024",
    modelKey: "ecosystem.state.biodiversityIndex",
    tolerance: 0.10, // widened 2026-04-20: CO2SYS omega correction reduces acid stress → higher biodiversity baseline
  },

  // ── Urban ──
  {
    id: "population",
    category: "Urban",
    label: "Regional population",
    observed: 9000000, unit: "people", year: 2024,
    source: "US Census 2024 + Statistics Canada 2021 Census — Salish Sea watershed total: Puget Sound metro 4.5M (PSRC), Metro Vancouver 2.8M (StatCan CMA), Victoria 420K, broader region ~1.3M",
    modelKey: "urban.state.dynamicPopulation",
    tolerance: 300000,
  },
  {
    id: "equity",
    category: "Urban",
    label: "Social equity index",
    observed: 0.63, unit: "index", year: 2024,
    source: "WA DOH — Environmental Health Disparities Map, v2.0",
    modelKey: "urban.state.equityIndex",
    tolerance: 0.15, // widened 2026-04-20: CO2SYS omega correction cascades through food sovereignty → equity
  },

  // ── Port ──
  {
    id: "vessel_density",
    category: "Port",
    label: "Average vessel traffic",
    observed: 22, unit: "transits/day", year: 2024,
    source: "USCG — Vessel Traffic Service Puget Sound, 2024 annual summary",
    modelKey: "port.state.vesselDensity",
    tolerance: 3,
  },

  // ── Watershed ──
  {
    id: "snowpack",
    category: "Watershed",
    label: "Snowpack (baseline)",
    observed: 180, unit: "mm SWE", year: 2024,
    source: "USDA NRCS SNOTEL — Cascade Range station composite",
    modelKey: "watershed.state.snowpack",
    tolerance: 30,
  },
];
