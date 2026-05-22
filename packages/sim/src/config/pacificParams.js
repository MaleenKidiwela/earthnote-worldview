// ═══════════════════════════════════════════════════════════
// PACIFIC OCEAN BOUNDARY PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════

export const PACIFIC_PARAMS = {

  californiaCurrents: {
    name: "California Current Upwelling",
    baseUpwelling: { value: 0.15, unit: "index", description: "Year-round minimum upwelling baseline", source: "Hickey & Banas 2003; Thomson 1981", sensitivity: "medium" },
    seasonalPeak: { value: 0.70, unit: "index", description: "Seasonal upwelling peak amplitude (summer)", source: "Connolly et al. 2010 — Ekman transport peaks Jun-Aug", sensitivity: "high" },
    pdoModulation: { value: 0.15, unit: "index", description: "PDO modulation of upwelling intensity", source: "Mantua et al. 1997 — PDO controls pressure gradients", sensitivity: "medium" },
    ensoModulation: { value: 0.20, unit: "index", description: "ENSO modulation (La Niña enhances, El Niño suppresses)", source: "Schwing et al. 2002 — ENSO-upwelling teleconnection", sensitivity: "high" },
  },

  sourceWater: {
    name: "Pacific Source Water Properties",
    baselineTemp: { value: 7.5, unit: "°C", description: "Sub-thermocline temperature at shelf depth (~200m)", source: "Thomson 1994; DFO Station P time series", sensitivity: "medium" },
    baselineDO: { value: 2.0, unit: "ml/L", description: "Dissolved oxygen at shelf depth (declining)", source: "Whitney et al. 2007 (Prog. Oceanogr. 75:179-199) — O2 loss in NE Pacific", sensitivity: "high" },
    o2DeclineRate: { value: 0.05, unit: "ml/L per year", description: "Rate of O2 decline in NE Pacific intermediate water", source: "Crawford & Peña 2013 — ~0.5 ml/L per decade at 200m depth", sensitivity: "high" },
    baselineDIC: { value: 2100, unit: "µmol/kg", description: "Dissolved inorganic carbon at shelf depth", source: "Feely et al. 2008 (Science 320:1490-1492)", sensitivity: "medium" },
    dicIncreaseRate: { value: 1.0, unit: "µmol/kg per year", description: "Annual DIC increase from ocean CO2 uptake", source: "Feely et al. 2016 — anthropogenic CO2 penetration", sensitivity: "high" },
    baselineTA: { value: 2250, unit: "µmol/kg", description: "Total alkalinity (relatively stable)", source: "Feely et al. 2008", sensitivity: "low" },
    baselinepH: { value: 7.65, unit: "pH", description: "Source water pH (sub-thermocline)", source: "Feely et al. 2008", sensitivity: "medium" },
    baselineNO3: { value: 25, unit: "µmol/L", description: "Nitrate in upwelled water", source: "Hickey & Banas 2003", sensitivity: "medium" },
  },

  omz: {
    name: "Oxygen Minimum Zone",
    baseDepth: { value: 400, unit: "m", description: "Baseline upper OMZ boundary depth", source: "Stramma et al. 2008 (Science 320:655-658)", sensitivity: "medium" },
    shoalingRate: { value: 7, unit: "m/decade", description: "OMZ upper boundary shoaling rate", source: "Stramma et al. 2010 — observed expansion of tropical/subtropical OMZ", sensitivity: "high" },
    shelfDepth: { value: 200, unit: "m", description: "Continental shelf edge depth", source: "Standard bathymetry — WA/OR continental shelf", sensitivity: "low" },
  },

  mhw: {
    name: "Marine Heat Waves",
    baseProbability: { value: 0.02, unit: "per quarter", description: "Baseline MHW trigger probability", source: "Oliver et al. 2018 (Nature Communications 9:1324) — MHW frequency", sensitivity: "medium" },
    doublingPerC: { value: 1.0, unit: "°C", description: "Temperature increase per probability doubling", source: "Oliver et al. 2018 — MHW frequency roughly doubles per °C", sensitivity: "high" },
    durationRange: { value: "4-12", unit: "quarters", description: "MHW duration range (1-3 years)", source: "Cavole et al. 2016 (Oceanography 29(2):62-71) — 2013-2015 Blob duration retrospective; Bond et al. 2015 initial detection", sensitivity: "medium" },
    sstAnomalyRange: { value: "1.5-4.0", unit: "°C", description: "SST anomaly range during MHW events", source: "Bond et al. 2015 — Blob anomaly +2-3°C", sensitivity: "high" },
  },

  copepods: {
    name: "Copepod Community Indicator",
    upwellingWeight: { value: 0.25, unit: "dimensionless", description: "Weight of upwelling intensity on copepod quality", source: "Peterson et al. 2014 — cold upwelled water favors boreal copepods", sensitivity: "medium" },
    sstWeight: { value: 0.15, unit: "dimensionless", description: "Weight of SST anomaly on copepod community shift", source: "Peterson et al. 2014; Fisher et al. 2015", sensitivity: "medium" },
    mhwWeight: { value: 0.20, unit: "dimensionless", description: "MHW impact on copepod community", source: "Suryan et al. 2021 — Blob crashed boreal copepod community", sensitivity: "high" },
  },

  marineSurvival: {
    name: "Salmon Marine Survival",
    modernBaseline: { value: 0.5, unit: "fraction of historical peak", description: "Current marine survival relative to 1960s peak", source: "Peterman & Dorner 2012 — declined from ~8% to ~4% smolt-to-adult", sensitivity: "high" },
    alaskaCompetitionPenalty: { value: 0.05, unit: "fraction", description: "Marine survival reduction from Alaska hatchery pink competition in odd years", source: "Ruggerone & Irvine 2018 (Can. J. Fish. Aquat. Sci.) — competition with 1B+ hatchery pinks", sensitivity: "medium" },
  },

  jdfInflow: {
    name: "Juan de Fuca Estuarine Inflow",
    baseVolume: { value: 120000, unit: "m³/s", description: "Baseline deep estuarine inflow through Juan de Fuca", source: "Thomson 1994 — 100,000-150,000 m³/s, dwarfs river inputs", sensitivity: "high" },
  },
};
