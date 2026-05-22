// ═══════════════════════════════════════════════════════════
// PUBLIC HEALTH PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════

export const PUBLIC_HEALTH_PARAMS = {

  habClosures: {
    name: "HAB Shellfish Closures",
    pspThreshold: { value: 0.3, unit: "HAB intensity index", description: "Alexandrium intensity above which PSP closure triggers", source: "WDOH Biotoxin Monitoring Program — 80 µg saxitoxin/100g tissue regulatory limit", sensitivity: "high" },
    aspThreshold: { value: 0.25, unit: "HAB intensity index", description: "Pseudo-nitzschia intensity above which ASP closure triggers", source: "FDA standard — 20 ppm domoic acid closure threshold", sensitivity: "high" },
    closureCostPerHaDay: { value: 0.50, unit: "$/ha/day", description: "Economic cost per hectare of closed shellfish bed per day", source: "Calibrated — harvest revenue + recreational clamming + tribal access", sensitivity: "low" },
  },

  drinkingWater: {
    name: "Drinking Water Quality",
    cyanoThreshold: { value: 18, unit: "°C", description: "Reservoir temperature above which cyanobacteria bloom risk increases", source: "Paerl & Huisman 2008 — warming favors cyanobacterial dominance", sensitivity: "medium" },
    boilWaterThreshold: { value: 0.5, unit: "risk index", description: "Drinking water risk above which boil-water advisory probability > 0", source: "EPA Safe Drinking Water Act turbidity standards", sensitivity: "medium" },
  },

  smokeHealth: {
    name: "Wildfire Smoke Health",
    erVisitRate: { value: 0.8, unit: "per 100k per smoke day", description: "Respiratory ER visit rate per smoke day (AQI > 100)", source: "Liu et al. 2015 (Epidemiology) — wildfire smoke health impacts meta-analysis", sensitivity: "medium" },
    erVisitCost: { value: 4000, unit: "$/visit", description: "Average respiratory ER visit cost", source: "CMS Medicare cost data — respiratory emergency department visits", sensitivity: "low" },
    asthmaCost: { value: 800, unit: "$/exacerbation", description: "Average asthma exacerbation cost (medication + lost work)", source: "CDC asthma burden estimates", sensitivity: "low" },
  },

  waterborne: {
    name: "Waterborne Pathogens",
    vibrioSSTThreshold: { value: 15, unit: "°C", description: "SST above which Vibrio risk increases significantly", source: "Baker-Austin et al. 2013 (Nature Clim. Change) — Vibrio range expansion above 15°C", sensitivity: "high" },
    fecalColiformSwimLimit: { value: 200, unit: "CFU/100mL", description: "Fecal coliform concentration triggering beach swimming advisory", source: "EPA recreational water quality criteria", sensitivity: "medium" },
  },

  fishAdvisories: {
    name: "Fish Consumption Advisories",
    psChinookPCBMultiplier: { value: 3.5, unit: "×", description: "PS resident Chinook PCB levels relative to Fraser Chinook", source: "O'Neill & West 2009 (Marine Poll. Bull.) — PS Chinook PCBs 3-5× Fraser levels", sensitivity: "high" },
  },

  healthDisparities: {
    name: "Environmental Health Disparities",
    ehdMethodology: { value: "composite", unit: "index", description: "Based on WA DOH Environmental Health Disparities Map methodology", source: "Min et al. 2019 (WA DOH) — cumulative exposure × demographic vulnerability", sensitivity: "medium" },
  },

  healthSystem: {
    name: "Health System Capacity",
    urbanBedsPerCapita: { value: 4.0, unit: "beds per 100k", description: "Hospital bed capacity in urban basins (Main Basin)", source: "AHA Hospital Statistics — Seattle metro area", sensitivity: "low" },
    ruralBedsPerCapita: { value: 0.5, unit: "beds per 100k", description: "Hospital bed capacity in rural basins (San Juan Islands)", source: "AHA — critical access hospitals in island/rural communities", sensitivity: "medium" },
  },
};
