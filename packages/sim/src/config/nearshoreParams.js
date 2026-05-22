// ═══════════════════════════════════════════════════════════
// NEARSHORE & ESTUARINE PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════

export const NEARSHORE_PARAMS = {

  saltMarsh: {
    name: "Salt Marsh Habitat",
    historicLoss: { value: 0.75, unit: "fraction", description: "Fraction of historic Puget Sound salt marsh lost", source: "Thom et al. 2018 — PS has lost ~75% of historic salt marsh to development/fill", sensitivity: "medium" },
    squeezeLossCoeff: { value: 0.002, unit: "fraction per mm/yr SLR per quarter", description: "Marsh loss rate from SLR squeeze when armored", source: "Thom et al. 2018; Coastal Geologic Services — marsh can't migrate if upland is armored", sensitivity: "high" },
    devLossCoeff: { value: 0.001, unit: "fraction per quarter", description: "Ongoing marsh loss rate from development pressure", source: "Calibrated — slow ongoing conversion", sensitivity: "low" },
  },

  eelgrass: {
    name: "Eelgrass Spatial Distribution",
    wastingDiseaseThreshold: { value: 20, unit: "°C", description: "SST above which Labyrinthula wasting disease increases", source: "Groner et al. 2021 (Glob. Change Biol.) — eelgrass wasting disease correlates with warm SST", sensitivity: "high" },
    convergenceRate: { value: 0.1, unit: "per quarter", description: "Rate at which eelgrass area converges toward target", source: "Thom et al. 2014 — eelgrass recovery takes 5-20 years for establishment", sensitivity: "medium" },
  },

  kelpCanopy: {
    name: "Kelp Canopy",
    tempStressThreshold: { value: 16, unit: "°C", description: "SST above which bull kelp experiences thermal stress", source: "Berry et al. 2021 (WA DNR Kelp Recovery Plan) — Nereocystis stressed above 16°C", sensitivity: "high" },
    otterTrophicCascade: { value: 0.4, unit: "recovery per unit otter pop", description: "Kelp recovery from otter reintroduction (urchin predation)", source: "Estes & Palmisano 1974 — classic trophic cascade; WA reintro studies", sensitivity: "medium" },
    recoveryRate: { value: 0.08, unit: "per quarter", description: "Kelp area convergence toward target (very slow — annual canopy)", source: "Berry et al. 2021 — bull kelp is annual, but bed persistence is multi-year", sensitivity: "medium" },
  },

  forageFishBeaches: {
    name: "Forage Fish Spawning Beaches",
    armorHabitatLoss: { value: 0.80, unit: "fraction", description: "Fraction of spawning habitat lost on armored shoreline", source: "Penttila 2007; Rice 2006 — armoring destroys upper beach spawning substrate", sensitivity: "high" },
    // pocketEstuaryCapacity 500 is a Path 4 model-construction magnitude
    //   within the Beamer et al. 2005 pocket-estuary-rearing-capacity
    //   framework. Framework qualitatively supports pocket estuaries as
    //   critical rearing habitat at 10x-100x density vs offshore; specific
    //   500/estuary value not paper-direct from the cited source. Path 4
    //   per Amendment 6 §5.24(b). See docs/citation-audit-followups.md
    //   sub-12E Entry 19.
    pocketEstuaryCapacity: { value: 500, unit: "juvenile Chinook", description: "Juvenile salmon capacity per functional pocket estuary", source: "Beamer et al. 2005 — pocket estuaries provide critical rearing habitat", sensitivity: "medium" },
  },

  contaminants: {
    name: "Contaminant Hotspots",
    superfundDecayRate: { value: 50, unit: "years (e-folding)", description: "Superfund remediation timescale", source: "West et al. 2017 (NOAA); EPA RODs for Commencement Bay, Duwamish, Eagle Harbor", sensitivity: "medium" },
    mainBasinOngoing: { value: 0.10, unit: "index", description: "Ongoing contaminant loading to Main Basin from urban/industrial sources", source: "Meador et al. 2002 — Puget Sound Chinook among most contaminated salmon globally", sensitivity: "medium" },
  },

  shoreline: {
    name: "Shoreline Armoring",
    pugetSoundArmorFrac: { value: 0.27, unit: "fraction", description: "Overall PS shoreline armor fraction", source: "Schlenger et al. 2011 (PSNERP) — ~27% of PS shoreline is hardened", sensitivity: "high" },
  },
};
