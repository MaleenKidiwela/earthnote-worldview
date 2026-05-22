// ═══════════════════════════════════════════════════════════
// FRASER RIVER PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════
// Every hardcoded coefficient from computeFraser.js, extracted with
// citations. Structure matches speciesParams.js format.

export const FRASER_PARAMS = {

  // ─────────────────────────────────────────────────────────
  // HYDROLOGY
  // ─────────────────────────────────────────────────────────
  hydrology: {
    name: "Fraser Basin Hydrology",

    basinArea: { value: 233000, unit: "km²", description: "Fraser River drainage basin area", source: "Environment Canada — 4th largest river in North America by discharge", sensitivity: "low" },
    meanDischarge: { value: 2700, unit: "m³/s", description: "Mean annual discharge at Hope gauging station (WSC 08MF005)", source: "Morrison et al. 2002; Water Survey of Canada records 1912-present", sensitivity: "high" },
    maxFloodDischarge: { value: 15000, unit: "m³/s", description: "Physical upper bound on quarterly mean discharge (1894 flood peak ~17,000 m³/s)", source: "NRC historical flood records; Fraser Basin Council 2014", sensitivity: "low" },
    routingAlpha: { value: 0.6, unit: "dimensionless", description: "Exponential smoothing coefficient for routing delay. 0.6 = ~60% of interior flow arrives at Hope within the quarter", source: "Calibrated — consistent with 1-2 week travel time from interior (Déry et al. 2012)", sensitivity: "medium" },
    minEcoFlow: { value: 1000, unit: "m³/s", description: "Minimum ecological flow threshold at Hope. Below this, salmon thermal stress increases rapidly", source: "Shrestha et al. 2012; DFO water temperature monitoring", sensitivity: "high" },
    gwBaseflow: { value: 800, unit: "m³/s", description: "Maximum groundwater baseflow contribution at full aquifer level", source: "Calibrated — Fraser Basin aquifer system supports ~30% of winter low flow (Wei et al. 2013)", sensitivity: "medium" },
    gwRechargeCoeff: { value: 0.003, unit: "dimensionless", description: "Groundwater recharge coefficient from rainfall infiltration", source: "Calibrated — equilibrium GW level ~0.7 under baseline precip", sensitivity: "low" },
    gwDischargeRate: { value: 0.06, unit: "per quarter", description: "Groundwater discharge rate (Darcy-like proportional flow)", source: "Calibrated — balances recharge at equilibrium", sensitivity: "low" },
  },

  // ─────────────────────────────────────────────────────────
  // SNOWPACK (3-band model)
  // ─────────────────────────────────────────────────────────
  snowpack: {
    name: "Elevation-Band Snowpack",

    lowBandAreaFrac: { value: 0.35, unit: "fraction", description: "Fraction of basin area below 1000m (Fraser Valley, Thompson lowlands)", source: "Fraser Basin hypsometry (Shrestha et al. 2012)", sensitivity: "low" },
    midBandAreaFrac: { value: 0.40, unit: "fraction", description: "Fraction of basin area 1000-2000m (Interior Plateau, pine beetle zone)", source: "Fraser Basin hypsometry", sensitivity: "low" },
    highBandAreaFrac: { value: 0.25, unit: "fraction", description: "Fraction of basin area above 2000m (Rockies, Cariboo, Coast Mountains)", source: "Fraser Basin hypsometry", sensitivity: "low" },
    meltRateLow: { value: 4.0, unit: "mm SWE/degree-day", description: "Degree-day melt factor for low-elevation band", source: "Hock 2003 (J. Hydrol. 282:104-115) — temperature-index models", sensitivity: "medium" },
    meltRateMid: { value: 3.5, unit: "mm SWE/degree-day", description: "Degree-day melt factor for mid-elevation band (less energy at elevation)", source: "Hock 2003; reduced by ~12% per 1000m elevation", sensitivity: "medium" },
    meltRateHigh: { value: 3.0, unit: "mm SWE/degree-day", description: "Degree-day melt factor for high-elevation band (high albedo, short days)", source: "Hock 2003; Shrestha et al. 2012", sensitivity: "medium" },
    mmToDischarge: { value: 29.5, unit: "m³/s per mm", description: "Conversion: 1mm SWE melt over 233,000 km² basin → m³/s per quarter", source: "Unit conversion: 233e9 m² × 1e-3 m / (91.25 × 86400 s) ≈ 29.5", sensitivity: "low" },
  },

  // ─────────────────────────────────────────────────────────
  // GLACIERS
  // ─────────────────────────────────────────────────────────
  glaciers: {
    name: "Fraser Basin Glaciers",

    peakSummerContrib: { value: 400, unit: "m³/s", description: "Peak summer glacier melt contribution at full (year 2000) glacier mass", source: "Déry et al. 2012 — glaciers provide 10-15% of August flow (~400 m³/s)", sensitivity: "high" },
    peakWaterThreshold: { value: 0.3, unit: "fraction of 2000 mass", description: "Below this glacier mass, summer discharge collapses (peak water passed)", source: "Huss & Hock 2018 (Nature 562:49-55); Baraer et al. 2012", sensitivity: "high" },
    lossRate0_1C: { value: 0.005, unit: "per year", description: "Glacier mass loss rate at 0-1°C warming", source: "Bolch et al. 2010 — ~0.5%/yr baseline loss in BC", sensitivity: "medium" },
    lossRate1_2C: { value: 0.015, unit: "per year", description: "Glacier mass loss rate at 1-2°C warming", source: "Clarke et al. 2015 (Science 348:169-172) — accelerating loss above 1°C", sensitivity: "high" },
    lossRate2_3C: { value: 0.025, unit: "per year", description: "Glacier mass loss rate at 2-3°C warming (rapid small glacier disintegration)", source: "Clarke et al. 2015 — committed loss of most small glaciers", sensitivity: "high" },
    lossRateAbove3C: { value: 0.037, unit: "per year", description: "Glacier mass loss rate above 3°C warming", source: "Clarke et al. 2015 — near-complete deglaciation projected", sensitivity: "high" },
  },

  // ─────────────────────────────────────────────────────────
  // FRESHET
  // ─────────────────────────────────────────────────────────
  freshet: {
    name: "Annual Freshet",

    baselinePeakQ: { value: 1.5, unit: "quarter", description: "Historical freshet peak timing (Q1.5 = mid-June)", source: "Morrison et al. 2002; WSC 08MF005 long-term hydrograph", sensitivity: "medium" },
    shiftPerDegree: { value: 0.08, unit: "quarters/°C", description: "Freshet peak advances ~8 days per °C warming", source: "Stewart et al. 2005 (J. Climate 18:1136-1155) — 5-10 days earlier per °C in Pacific NW", sensitivity: "high" },
    peakWidth: { value: 0.6, unit: "quarters (Gaussian σ)", description: "Freshet duration as Gaussian width parameter", source: "Calibrated — typical freshet 6-8 weeks above double base flow", sensitivity: "medium" },
    referenceSWE: { value: 300, unit: "mm", description: "Reference peak SWE that produces baseline freshet magnitude (1.0×)", source: "Calibrated — 300mm basin-average SWE → ~8,500 m³/s peak at Hope", sensitivity: "medium" },
  },

  // ─────────────────────────────────────────────────────────
  // NECHAKO DIVERSION
  // ─────────────────────────────────────────────────────────
  nechako: {
    name: "Nechako River Diversion",

    diversionVolume: { value: 200, unit: "m³/s", description: "Flow diverted from Nechako to Kitimat via Kenney Dam", source: "Ferrari et al. 2007; Rio Tinto Alcan power generation requirement", sensitivity: "high" },
    tempWarmingEffect: { value: 0.5, unit: "°C", description: "Mainstem warming from removing cold Nechako tributary water", source: "Ferrari et al. 2007 — Nechako is snowmelt-fed, significantly colder than mainstem", sensitivity: "medium" },
  },

  // ─────────────────────────────────────────────────────────
  // PINE BEETLE
  // ─────────────────────────────────────────────────────────
  pineBeetle: {
    name: "Mountain Pine Beetle Legacy",

    epidemicOnsetYear: { value: 2005, unit: "year", description: "Approximate onset of major pine beetle epidemic in interior BC", source: "BC Ministry of Forests — epidemic peaked 2005-2010, ~730M m³ timber killed", sensitivity: "low" },
    peakEffectLag: { value: 15, unit: "years", description: "Years after onset for maximum hydrological effect (trees dead but not fallen/regrown)", source: "Wei & Zhang 2010 (J. Hydrol. 392:127-135); Winkler et al. 2014", sensitivity: "medium" },
    recoveryHalfLife: { value: 50, unit: "years", description: "Exponential recovery half-life as forest regrows", source: "Winkler et al. 2014 (Water Resour. Res.) — 40-60 year recovery", sensitivity: "medium" },
    snowBoost: { value: 0.15, unit: "fraction", description: "Maximum increase in mid-elevation snowpack from dead canopy (less interception)", source: "Wei & Zhang 2010 — 10-20% more snow reaches ground in killed stands", sensitivity: "medium" },
    runoffBoost: { value: 0.20, unit: "fraction", description: "Maximum increase in runoff from dead forest (no transpiration)", source: "Wei & Zhang 2010 — 10-25% streamflow increase in affected watersheds", sensitivity: "medium" },
    etReduction: { value: 0.15, unit: "fraction", description: "Maximum ET reduction in beetle-killed stands", source: "Wei & Zhang 2010; Winkler et al. 2014", sensitivity: "medium" },
  },

  // ─────────────────────────────────────────────────────────
  // WILDFIRE
  // ─────────────────────────────────────────────────────────
  wildfire: {
    name: "Interior BC Wildfire",

    baseProbability: { value: 0.06, unit: "per quarter", description: "Baseline probability of significant fire per quarter (~24%/yr)", source: "BC Wildfire Service 30-year average; Flannigan et al. 2009", sensitivity: "medium" },
    climateDoubling: { value: 1.0, unit: "°C", description: "Temperature increase for fire probability to double", source: "Flannigan et al. 2009 (Nat. Rev. Earth Environ.) — roughly 2× per °C", sensitivity: "high" },
    burnRecoveryTime: { value: 80, unit: "quarters", description: "Exponential recovery time constant for burn scar revegetation (~20 years)", source: "Shakesby & Doerr 2006 (Earth-Sci. Rev. 74:269-307) — 15-30 year recovery", sensitivity: "medium" },
    erosionRate: { value: 8000, unit: "tonnes/day", description: "Sediment yield from active burn scar (per unit fractional area)", source: "Moody & Martin 2001 — sediment yield 10-100× post-fire baseline", sensitivity: "medium" },
    arOnBurnErosion: { value: 15000, unit: "tonnes/day", description: "Additional sediment when atmospheric river hits burn scar", source: "Cannon et al. 2008 — debris flow risk greatly elevated post-fire", sensitivity: "high" },
  },

  // ─────────────────────────────────────────────────────────
  // MINING
  // ─────────────────────────────────────────────────────────
  mining: {
    name: "Mining and Industrial",

    baseContam: { value: 0.15, unit: "index per unit intensity", description: "Chronic contaminant load from mining operations per unit intensity", source: "Calibrated — copper, gold, coal operations in Fraser interior", sensitivity: "medium" },
    tailingsFailureBaseProb: { value: 0.003, unit: "per quarter per unit intensity", description: "Baseline probability of tailings dam failure per unit mining intensity", source: "Calibrated — informed by Mount Polley 2014 (Petticrew et al. 2015, Geomorphology 227:11-21)", sensitivity: "high" },
    tailingsDecayRate: { value: 0.10, unit: "per quarter", description: "Tailings contamination decay rate (~10%/quarter, 3-5 year persistence)", source: "Petticrew et al. 2015 — Quesnel Lake contamination persisted 3-5 years", sensitivity: "medium" },
    mercuryLegacyCoeff: { value: 0.05, unit: "index per unit intensity", description: "Chronic mercury from historic placer gold mining", source: "Calibrated — Cariboo/Barkerville placer mining legacy (1860s-1940s)", sensitivity: "low" },
  },

  // ─────────────────────────────────────────────────────────
  // FORESTRY
  // ─────────────────────────────────────────────────────────
  forestry: {
    name: "Interior BC Forestry",

    runoffBoost: { value: 0.15, unit: "fraction per unit intensity", description: "Streamflow increase from clearcutting (reduced canopy interception)", source: "Winkler et al. 2014 — 10-20% streamflow increase from clearcutting in BC", sensitivity: "medium" },
    roadSediment: { value: 2000, unit: "tonnes/day per unit intensity", description: "Sediment from forest road network", source: "Reid & Dunne 1984 — road erosion dominates managed watershed sediment budgets", sensitivity: "medium" },
    riparianTempEffect: { value: 0.4, unit: "°C per unit intensity", description: "Tributary warming from riparian harvest (diluted at mainstem)", source: "Moore et al. 2005 (JAWRA 41:813-831) — up to 2°C in clearcut reaches", sensitivity: "medium" },
  },

  // ─────────────────────────────────────────────────────────
  // FRASER SALMON STOCKS
  // ─────────────────────────────────────────────────────────
  salmonGeneral: {
    name: "Fraser Salmon — General",

    marineSurvBase: { value: 0.04, unit: "fraction", description: "Baseline smolt-to-adult marine survival rate (modern degraded)", source: "Peterman & Dorner 2012 (Can. J. Fish. Aquat. Sci.) — declining from ~8% in 1960s to ~4% now", sensitivity: "high" },
    marineSurvDeclinePerC: { value: 0.12, unit: "fraction per °C", description: "Marine survival decline per degree of ocean warming", source: "Peterman & Dorner 2012; Irvine & Fukuwaka 2011 — marine survival negatively correlated with SST", sensitivity: "high" },
    enRouteMortThreshold: { value: 18, unit: "°C", description: "Water temperature above which en-route mortality begins", source: "Patterson et al. 2007; Hinch et al. 2012 (Fish & Fisheries 13:1-22) — pre-spawn mortality accelerates above 18°C", sensitivity: "high" },
    enRouteMortScale: { value: 4, unit: "°C", description: "Temperature range over which en-route mortality scales 0→80%", source: "Hinch et al. 2012 — near 100% mortality at 21-22°C", sensitivity: "high" },
  },

  sockeye: {
    name: "Fraser Sockeye (O. nerka)",

    baseReturn: { value: 500000, unit: "fish", description: "Average modern return across all cycle years (depleted from historic 8-10M average)", source: "Cohen Commission 2012; DFO pre-season forecasts 2015-2024", sensitivity: "high" },
    dominantAmplitude: { value: 8.0, unit: "×", description: "Dominant cycle year multiplier (4-year cycle)", source: "Cohen 2012 — Adams/Shuswap dominant runs historically 5-20× off years", sensitivity: "high" },
    subDominantAmplitude: { value: 2.5, unit: "×", description: "Sub-dominant year multiplier", source: "DFO long-term cycle data", sensitivity: "medium" },
    subOffAmplitude: { value: 1.2, unit: "×", description: "Sub-off year multiplier", source: "DFO long-term cycle data", sensitivity: "low" },
    offAmplitude: { value: 0.5, unit: "×", description: "Off-year multiplier", source: "DFO long-term cycle data", sensitivity: "low" },
    enRouteSensitivity: { value: 1.0, unit: "×", description: "En-route mortality sensitivity relative to baseline (most vulnerable species)", source: "Patterson et al. 2007 — sockeye most temperature-sensitive Pacific salmon", sensitivity: "high" },
    bigBarExposure: { value: 0.6, unit: "fraction", description: "Fraction of sockeye that must pass Big Bar (upper Fraser stocks)", source: "DFO 2019 — ~60% of sockeye stocks migrate above Big Bar", sensitivity: "medium" },
    eggsPerFemale: { value: 2500, unit: "eggs", description: "Average fecundity (assuming 50% female)", source: "Quinn 2018 (Pacific Salmon Ecology and Conservation)", sensitivity: "low" },
  },

  chinook: {
    name: "Fraser Chinook (O. tshawytscha)",

    baseReturn: { value: 150000, unit: "fish", description: "Modern depleted baseline return", source: "DFO; many populations COSEWIC-listed (Threatened/Endangered)", sensitivity: "high" },
    enRouteSensitivity: { value: 0.7, unit: "×", description: "En-route mortality sensitivity (more tolerant than sockeye, lethal ~22°C)", source: "Hinch et al. 2012 — Chinook tolerate 2-3°C warmer than sockeye", sensitivity: "medium" },
    bigBarExposure: { value: 0.4, unit: "fraction", description: "Fraction of Chinook above Big Bar (Upper/South Thompson stocks)", source: "DFO stock assessment", sensitivity: "medium" },
    orcaPreyWeight: { value: 0.3, unit: "dimensionless", description: "Chinook availability index weight for orca prey coupling", source: "Ford et al. 2010 (DFO Can. Sci. Advis. Sec. Res. Doc.) — ~90% Chinook July-August in critical habitat; Hanson et al. 2010 (Endang. Species Res. 11:69-82) — fecal DNA ~98% salmon July-August diet; Ford & Ellis 2006 (Mar. Ecol. Prog. Ser. 316:185-199) — selective foraging mechanism framework; Ford et al. 1998 (Can. J. Zool. 76:1456-1471) — dietary specialization", sensitivity: "high" },
  },

  pink: {
    name: "Fraser Pink (O. gorbuscha)",

    baseReturn: { value: 5000000, unit: "fish", description: "Modern baseline average return", source: "DFO — odd-year dominant Fraser pink runs", sensitivity: "medium" },
    oddYearAmplitude: { value: 6.0, unit: "×", description: "Odd-year (dominant) cycle multiplier", source: "Heard 1991 — obligate 2-year cycle with 10:1-20:1 odd:even ratio", sensitivity: "medium" },
    evenYearAmplitude: { value: 0.3, unit: "×", description: "Even-year cycle multiplier", source: "DFO long-term cycle data", sensitivity: "low" },
    enRouteSensitivity: { value: 0.4, unit: "×", description: "En-route mortality sensitivity (low — spawn low in watershed, minimal migration)", source: "Hinch et al. 2012 — pink salmon spend least time in river", sensitivity: "low" },
  },

  chum: {
    name: "Fraser Chum (O. keta)",

    baseReturn: { value: 2000000, unit: "fish", description: "Modern baseline return (Harrison + lower tributary stocks)", source: "DFO; Harrison chum is one of largest populations in BC", sensitivity: "medium" },
    hatcheryFrac: { value: 0.25, unit: "fraction", description: "Fraction of chum returns from hatchery origin", source: "DFO hatchery contribution estimates; significant SEP investment", sensitivity: "medium" },
    enRouteSensitivity: { value: 0.3, unit: "×", description: "En-route mortality sensitivity (lowest — spawn in lower tributaries)", source: "Hinch et al. 2012 — late-fall spawning timing avoids peak temperatures", sensitivity: "low" },
  },

  coho: {
    name: "Fraser Coho (O. kisutch)",

    baseReturn: { value: 400000, unit: "fish", description: "Modern baseline return", source: "DFO; Interior Fraser coho COSEWIC Endangered", sensitivity: "high" },
    rearingDependence: { value: 0.8, unit: "dimensionless", description: "Weight of freshwater habitat quality on rearing survival (highest of all species)", source: "Bradford & Irvine 2000 — coho spend 1+ years rearing in freshwater", sensitivity: "high" },
    bigBarExposure: { value: 0.2, unit: "fraction", description: "Fraction of coho above Big Bar (fewer interior populations)", source: "DFO stock assessment", sensitivity: "low" },
    seaLiceVulnerability: { value: 1.2, unit: "×", description: "Sea lice mortality multiplier relative to other species (smolts smaller, more vulnerable)", source: "Krkosek et al. 2011 (PLoS ONE) — coho smolts smaller than Chinook", sensitivity: "medium" },
  },

  // ─────────────────────────────────────────────────────────
  // WATER TEMPERATURE
  // ─────────────────────────────────────────────────────────
  waterTemperature: {
    name: "Fraser Water Temperature at Hope",

    sockeyelLethalThreshold: { value: 21, unit: "°C", description: "Water temperature at which sockeye pre-spawn mortality approaches 100%", source: "Patterson et al. 2007 (Can. J. Fish. Aquat. Sci.); Hinch et al. 2012", sensitivity: "high" },
    coldCoolingMax: { value: 4, unit: "°C", description: "Maximum cooling from snowmelt/glacier fraction in discharge", source: "Calibrated — cold tributary input reduces mainstem temp by up to 4°C during freshet", sensitivity: "medium" },
    warmingPerDegreeSST: { value: 0.6, unit: "°C/°C", description: "Fraser water temperature increase per °C of global SST warming", source: "Patterson et al. 2007 — Fraser summer temps track ~60% of regional air temp change", sensitivity: "high" },
  },
};
