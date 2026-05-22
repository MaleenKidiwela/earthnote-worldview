// ═══════════════════════════════════════════════════════════
// FISHERIES MANAGEMENT PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════

export const FISHERIES_PARAMS = {

  stockAssessment: {
    name: "Stock Assessment",
    baseError: { value: 0.30, unit: "fraction", description: "Baseline assessment error (±30%) at zero funding", source: "Holt & Ogden 2013 — DFO stock assessment uncertainty ranges", sensitivity: "medium" },
    fundingErrorReduction: { value: 0.15, unit: "fraction", description: "Maximum error reduction from full assessment funding", source: "Calibrated — better monitoring reduces uncertainty to ±15%", sensitivity: "medium" },
  },

  harvestRules: {
    name: "Harvest Rules",
    healthyRate: { value: 0.30, unit: "fraction", description: "Maximum harvest rate for healthy stocks (>Smsy)", source: "DFO Wild Salmon Policy benchmarks; NOAA harvest guidelines", sensitivity: "high" },
    concernRate: { value: 0.15, unit: "fraction", description: "Maximum harvest rate for stocks of concern (Sgen-Smsy)", source: "DFO/NOAA — precautionary approach reduces harvest to 10-20%", sensitivity: "high" },
    criticalRate: { value: 0.03, unit: "fraction", description: "Maximum harvest rate for critical stocks (<Sgen)", source: "DFO/NOAA — severe restrictions, directed fishery closures", sensitivity: "high" },
    endangeredBycatch: { value: 0.02, unit: "fraction", description: "Unavoidable bycatch mortality for endangered stocks", source: "NOAA ESA incidental take permits — ~2-3% bycatch mortality", sensitivity: "medium" },
  },

  srkwProtection: {
    name: "SRKW Prey Protection",
    bcThreshold: { value: 0.50, unit: "body condition index", description: "Orca body condition below which prey protection triggers", source: "NOAA 2019 ESA biological opinion; Chasco et al. 2017", sensitivity: "high" },
    popThreshold: { value: 70, unit: "individuals", description: "Orca population below which prey protection triggers", source: "NOAA 2019 — 73 individuals triggered emergency action", sensitivity: "high" },
    maxChinookReduction: { value: 0.50, unit: "fraction", description: "Maximum Chinook harvest reduction under prey protection", source: "NOAA 2019 — up to 50% Chinook fishery reduction for orca recovery", sensitivity: "high" },
  },

  sectorAllocation: {
    name: "Fishing Sector Allocation",
    boldtAllocation: { value: 0.50, unit: "fraction", description: "Treaty tribal allocation of harvestable surplus (Boldt Decision)", source: "U.S. v. Washington 1974 (Boldt Decision) — tribes entitled to 50% of harvestable fish", sensitivity: "high" },
    commercialShare: { value: 0.60, unit: "fraction of non-tribal", description: "Commercial sector share of non-tribal allocation", source: "Calibrated — commercial is ~60% of non-tribal catch by volume", sensitivity: "medium" },
    recTripValue: { value: 200, unit: "$/trip", description: "Average economic value per recreational fishing trip", source: "NOAA Fisheries Economics of the United States — PNW recreational value", sensitivity: "low" },
  },

  economics: {
    name: "Fisheries Economics",
    chinookPrice: { value: 75, unit: "$/fish", description: "Average commercial Chinook price", source: "NOAA Fisheries landings data — Chinook $50-100/fish depending on size", sensitivity: "low" },
    sockeyePrice: { value: 25, unit: "$/fish", description: "Average commercial sockeye price", source: "NOAA Fisheries landings data", sensitivity: "low" },
    pinkPrice: { value: 8, unit: "$/fish", description: "Average commercial pink price", source: "NOAA Fisheries landings data — pink/chum lowest value per fish", sensitivity: "low" },
    jobsPerThousandFish: { value: 1, unit: "jobs per 1000 fish", description: "Commercial fishing employment per unit catch", source: "Calibrated — ~3000 PS commercial fishing jobs at ~3M fish catch", sensitivity: "low" },
  },

  treaty: {
    name: "Pacific Salmon Treaty",
    baseCompliance: { value: 0.70, unit: "fraction", description: "Baseline treaty compliance level (US-Canada)", source: "Pacific Salmon Treaty 1985, renewed 2019 — allocation compliance varies", sensitivity: "medium" },
  },
};
