// ═══════════════════════════════════════════════════════════
// REGIONAL CLIMATE PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════
// Every hardcoded coefficient from computeClimate.js, extracted with
// citations. Structure matches speciesParams.js / fraserParams.js format.

export const CLIMATE_PARAMS = {

  ensoPdo: {
    name: "ENSO / PDO Ocean Oscillations",
    // ensoAmplificationPerC 0.2/°C is a Path 4 model-construction choice
    //   within the Cai et al. 2014 ENSO-under-warming framework. Cai 2014
    //   establishes frequency-doubling of extreme El Niño qualitatively
    //   (and Cai 2023 reports ~10% post-1960 amplitude); the 40%/2°C →
    //   0.2/°C derivation is not paper-direct from either source. Path 4
    //   per Amendment 6 §5.24(b). See docs/citation-audit-followups.md
    //   Scout #3 entry.
    ensoAmplificationPerC: { value: 0.2, unit: "×/°C", description: "ENSO amplitude increase per degree of warming", source: "Cai et al. 2014 (Nature Clim. Change 4:111-116) — ~40% ENSO intensification per 2°C", sensitivity: "high" },
    pdoCyclePeriod: { value: 25, unit: "years", description: "PDO oscillation period", source: "Mantua et al. 1997 (Bull. AMS) — 20-30 year cycle", sensitivity: "medium" },
    sstAnomalyEnsoWeight: { value: 0.6, unit: "dimensionless", description: "ENSO weight in combined SST anomaly", source: "Calibrated — ENSO is primary driver of interannual SST variability in PNW", sensitivity: "medium" },
    sstAnomalyPdoWeight: { value: 0.4, unit: "dimensionless", description: "PDO weight in combined SST anomaly", source: "Calibrated — PDO is secondary, decadal-scale modulator", sensitivity: "medium" },
  },

  temperature: {
    name: "Temperature Regimes",
    urbanHeatIslandSeattle: { value: 2.0, unit: "°C", description: "Urban heat island effect for Seattle metro in summer", source: "Oke 1973; Boustead 2015 — UHI in PNW cities 1-3°C", sensitivity: "low" },
    urbanHeatIslandVancouver: { value: 1.5, unit: "°C", description: "Urban heat island for Metro Vancouver", source: "Oke 1973", sensitivity: "low" },
    coastalWarmingDamping: { value: 0.5, unit: "fraction of SST delta", description: "Coastal basins warm at 50% of regional rate (Pacific moderation)", source: "Mote et al. 2018 (Climatic Change) — maritime buffering", sensitivity: "medium" },
    inlandWarmingFraction: { value: 0.7, unit: "fraction of SST delta", description: "Inland basins warm at 70% of regional rate", source: "Mote et al. 2018", sensitivity: "medium" },
    frostFreeBaseline: { value: 200, unit: "days", description: "Baseline frost-free season length in lowlands", source: "Mote et al. 2018 — PNW frost-free season ~200 days at coast", sensitivity: "low" },
    frostFreeChangePerC: { value: 5, unit: "days/°C", description: "Frost-free season lengthening per degree warming", source: "Mote et al. 2018", sensitivity: "low" },
  },

  rainShadow: {
    name: "Orographic Precipitation",
    jdfFactor: { value: 1.0, unit: "×", description: "Juan de Fuca precipitation factor (Pacific-exposed baseline)", source: "Mass 2008 (Weather of the Pacific Northwest) — exposed coast receives full precipitation", sensitivity: "low" },
    georgiaFactor: { value: 0.70, unit: "×", description: "Georgia Strait precipitation factor (partial Vancouver Island shadow)", source: "Mass 2008 — partial rain shadow from Vancouver Island", sensitivity: "low" },
    sanjuanFactor: { value: 0.40, unit: "×", description: "San Juan Islands precipitation factor (deep rain shadow)", source: "Mass 2008 — driest part of western WA, ~450mm/yr at Sequim vs 4000mm at Quinault", sensitivity: "medium" },
    hoodCanalFactor: { value: 1.20, unit: "×", description: "Hood Canal precipitation factor (Olympic east slope enhancement)", source: "Mass 2008 — orographic enhancement on east-facing Olympic slopes", sensitivity: "low" },
  },

  convergenceZone: {
    name: "Puget Sound Convergence Zone",
    activationProbability: { value: 0.30, unit: "fraction", description: "Probability of PSCZ activation per winter quarter", source: "Mass 2008, ch. 8 — ~30% of winter days with west-northwest flow", sensitivity: "medium" },
    enhancementRange: { value: "1.5-2.5", unit: "×", description: "Precipitation enhancement factor in convergence band", source: "Mass 2008 — localized heavy precip over N King/S Snohomish", sensitivity: "medium" },
  },

  atmosphericRivers: {
    name: "Atmospheric River Physics",
    ivtCCScaling: { value: 0.07, unit: "fraction/°C", description: "IVT increase per degree warming (Clausius-Clapeyron)", source: "Payne & Magnusdottir 2015 — ~7% moisture increase per °C", sensitivity: "high" },
    baselineMeanEvents: { value: 1.5, unit: "events/quarter", description: "Mean AR events per active quarter at baseline", source: "Ralph et al. 2019 (BAMS 100:269-289) — 3-6 events per season", sensitivity: "medium" },
    ar1IVTThreshold: { value: 350, unit: "kg/m/s", description: "IVT threshold for AR1 classification", source: "Ralph et al. 2019 — AR scale based on IVT and duration", sensitivity: "low" },
    ar5IVTThreshold: { value: 900, unit: "kg/m/s", description: "IVT threshold for AR5 classification", source: "Ralph et al. 2019", sensitivity: "low" },
  },

  smoke: {
    name: "Wildfire Smoke Transport",
    baseTransportEfficiency: { value: 0.60, unit: "fraction", description: "Probability that BC interior smoke reaches Salish Sea when fires are active", source: "McKendry et al. 2019 (Atmos. Environ.) — synoptic patterns favor SW transport ~60% of fire-season days", sensitivity: "medium" },
    maxSolarReduction: { value: 0.30, unit: "fraction", description: "Maximum solar radiation reduction during heavy smoke", source: "Jaffe et al. 2020 (Bull. AMS) — 2017/2018 smoke events reduced PAR by 20-30%", sensitivity: "high" },
    smokeCarryForward: { value: 0.30, unit: "fraction", description: "Smoke haze persistence between quarters", source: "Calibrated — fine particulates can linger 1-3 weeks after source abates", sensitivity: "low" },
  },

  fog: {
    name: "Marine Fog",
    baselineFrequency: { value: 0.40, unit: "fraction", description: "Summer fog frequency at coast (fraction of days)", source: "Mass 2008 — summer stratus common along Pacific coast, ~40% of days at outer coast", sensitivity: "medium" },
    declineRate: { value: 0.02, unit: "fraction/decade", description: "Fog frequency decline under warming", source: "Johnstone & Dawson 2010 (PNAS 107:4533-4538) — ~33% fog decline since 1901, ~2%/decade", sensitivity: "high" },
    solarReduction: { value: 0.20, unit: "fraction", description: "Solar radiation reduction when fog is present", source: "Calibrated — stratus reduces PAR by ~20% (diffuse light maintains some photosynthesis)", sensitivity: "medium" },
  },
};
