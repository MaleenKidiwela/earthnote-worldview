// ═══════════════════════════════════════════════════════════
// BIOGEOCHEMICAL CYCLING PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════

export const BIOGEOCHEM_PARAMS = {

  nitrogen: {
    name: "Nitrogen Cycle",
    atmDeposition: { value: 0.35, unit: "kg N/day/basin", description: "Atmospheric N deposition per basin", source: "Mackas & Harrison 1997 — ~0.5 kg N/ha/yr for Puget Sound", sensitivity: "low" },
    denitrificationFrac: { value: 0.15, unit: "fraction", description: "Fraction of remineralized N lost to denitrification (permanent N2 sink)", source: "Devol & Christensen 1993 — 10-20% denitrification in Puget Sound sediments", sensitivity: "high" },
    reminRate: { value: 0.05, unit: "per day (PON)", description: "Remineralization rate for particulate organic nitrogen", source: "Khangaonkar et al. 2012 (Salish Sea Model)", sensitivity: "medium" },
  },

  phosphorus: {
    name: "Phosphorus Cycle",
    redfieldNP: { value: 16, unit: "mol N per mol P", description: "Redfield N:P ratio", source: "Redfield et al. 1963 — canonical ratio", sensitivity: "low" },
  },

  carbon: {
    name: "Carbon Cycle",
    redfieldCN: { value: 6.625, unit: "mol C per mol N", description: "Redfield C:N ratio (106/16)", source: "Redfield et al. 1963", sensitivity: "low" },
    gasTransferCoeff: { value: 0.003, unit: "dimensionless", description: "Base gas transfer velocity for air-sea CO2 exchange", source: "Wanninkhof 1992 — parameterized for quarterly timestep", sensitivity: "medium" },
    baseAtmCO2: { value: 420, unit: "ppm", description: "Baseline atmospheric CO2 concentration (2026)", source: "NOAA Global Monitoring Lab — ~420 ppm in 2024", sensitivity: "high" },
    co2TrendRate: { value: 2.5, unit: "ppm/yr", description: "Annual atmospheric CO2 increase rate", source: "NOAA — current rate ~2.5 ppm/yr", sensitivity: "medium" },
  },

  carbonatePump: {
    name: "Carbonate Pump (CaCO3)",
    calcThreshold: { value: 1.0, unit: "Ω aragonite", description: "Minimum Ω for calcification to occur (supersaturation required)", source: "Feely et al. 2010 — calcification ceases at Ω < 1", sensitivity: "high" },
    calcRateCoeff: { value: 0.5, unit: "µmol/L/quarter per unit Ω excess", description: "Calcification rate per unit Ω above threshold", source: "Calibrated — consistent with Fassbender et al. 2016 Salish Sea carbonate budget", sensitivity: "medium" },
    dissThreshold: { value: 1.5, unit: "Ω aragonite", description: "Ω below which CaCO3 dissolution begins", source: "Feely et al. 2010 — dissolution accelerates below Ω 1.5", sensitivity: "medium" },
    dissRateCoeff: { value: 0.8, unit: "µmol/L/quarter per unit Ω deficit", description: "Dissolution rate per unit Ω below threshold", source: "Calibrated", sensitivity: "medium" },
  },

  silica: {
    name: "Silica Cycle",
    diatomSiNRatio: { value: 1.0, unit: "mol Si per mol N", description: "Si:N uptake ratio for diatoms", source: "Ragueneau et al. 2006 — diatoms require ~1:1 Si:N", sensitivity: "low" },
    siLimThreshold: { value: 5.0, unit: "µmol/L", description: "DSi concentration below which diatoms become Si-limited", source: "Trainer et al. 2002 — competitive shift to flagellates below ~5 µmol/L", sensitivity: "high" },
    riverSiExcess: { value: 2.0, unit: "× DIN", description: "Rivers carry Si at ~2× the N:Si Redfield ratio (weathering enrichment)", source: "Ragueneau et al. 2006 — continental runoff enriched in silicate", sensitivity: "low" },
  },

  oxygen: {
    name: "Oxygen Budget",
    redfieldO2C: { value: 1.30, unit: "mol O2 per mol C", description: "O2:C ratio for photosynthesis/respiration (138/106)", source: "Redfield et al. 1963", sensitivity: "low" },
    reaerateRate: { value: 0.15, unit: "per quarter", description: "Base air-sea O2 exchange rate (reaeration)", source: "Calibrated — consistent with Khangaonkar et al. 2018 Salish Sea Model", sensitivity: "medium" },
    o2MolWeight: { value: 0.032, unit: "mg per µmol", description: "Molecular weight conversion factor (32 g/mol ÷ 1000)", source: "Chemistry — MW of O2", sensitivity: "low" },
  },

  sediment: {
    name: "Sediment Biogeochemistry",
    // Values match defaults.js biogeochem.sediment sub-object (native-value convention).
    // Wired to computeBiogeochem.js as of Session 2a (2026-04-20).
    sinkingFrac:       { value: 0.30,  unit: "fraction",    description: "Fraction of surface NPP that sinks below the surface layer", source: "Khangaonkar et al. 2012 — export ratio in Puget Sound", sensitivity: "medium" },
    benthicFluxFrac:   { value: 0.50,  unit: "fraction",    description: "Fraction of sinking flux that reaches the benthos (1 - this = water-column remineralization)", source: "Martin et al. 1987; Middelburg 1989 — particle flux attenuation with depth", sensitivity: "medium" },
    benthicAccumFrac:  { value: 0.40,  unit: "fraction",    description: "Fraction of benthic flux that accumulates in sediment OM pool (vs. immediate remineralization at interface)", source: "Burdige 2006 Ch.5 — sinking flux reaching sediment depends on depth & transit time", sensitivity: "medium" },
    q10:               { value: 2.0,   unit: "dimensionless", description: "Q10 temperature sensitivity of sediment OM decomposition (reference 10°C)", source: "Burdige 2006; Middelburg et al. 1996 — range 1.8–2.5 for sediment respiration", sensitivity: "low" },
    decayRatePerMonth: { value: 0.003, unit: "per month at 10°C", description: "First-order sediment OM decomposition rate constant at 10°C reference", source: "Burdige 2006 Table 5.1 — coastal sediments 0.001–0.01/month depending on lability", sensitivity: "high" },
    burialO2Min:       { value: 0.8,   unit: "multiplier",  description: "Minimum O2 burial-efficiency multiplier (well-oxygenated deep waters)", source: "Hedges & Keil 1995 — O2 exposure reduces preservation", sensitivity: "medium" },
    burialO2Max:       { value: 2.0,   unit: "multiplier",  description: "Maximum O2 burial-efficiency multiplier (hypoxic deep waters)", source: "Hedges & Keil 1995 — anoxia enhances preservation; literature range 0.5–3×", sensitivity: "medium" },
    // Session 2b: substrate-dependent decomposition.
    substrateMudFactor:    { value: 0.4, unit: "multiplier", description: "Decay-rate multiplier at pure-mud endpoint (mineral-surface-binding preservation)", source: "Keil et al. 1994 GCA 58:879; Burdige 2007 Table 2 (muddy–sandy k-range ~3–4×)", sensitivity: "medium" },
    substrateCoarseFactor: { value: 1.6, unit: "multiplier", description: "Decay-rate multiplier at pure-coarse endpoint (oxic sandy decomposition)", source: "Keil et al. 1994; Burdige 2007 Table 2", sensitivity: "medium" },
    // Session 2b: resuspension. Note: resuspensionCoefPerMonth (0.01) is an initial value, order-of-magnitude plausible.
    // Literature form (Partheniades-Ariathurai) is cited; empirical coefficient requires calibration against sediment
    // flux measurements in the Salish Sea. Candidate calibration datasets: NOAA PRISM sediment cores, Hood Canal
    // Dissolved Oxygen Program sediment traps. Refine in future work.
    resuspensionThreshold:    { value: 0.15, unit: "m/s",      description: "Depth-averaged critical current for cohesive-mud resuspension", source: "Sanford & Maa 2001 JGR 106:7555; Le Hir et al. 2001 JCR 17:51 (τ_cr 0.05–0.2 Pa)", sensitivity: "high" },
    resuspensionCoefPerMonth: { value: 0.01, unit: "fraction/month per unit excess ratio", description: "Resuspension rate per unit (current − threshold)/threshold above threshold (initial value, requires calibration)", source: "Partheniades-Ariathurai form; coefficient pending empirical calibration", sensitivity: "high" },
    maxResuspendFracPerMonth: { value: 0.15, unit: "fraction/month",  description: "Upper cap on resuspension fraction per month (numerical safety at extreme currents)", source: "Calibrated cap; no basin reaches activation under historical forcing", sensitivity: "low" },
    // Sediment phase-coupling (pre-reg 09fd936 + §11 Amendments 1–4): stratification-deficit
    // modulation of advisory-path SOD-to-deep-DO coupling at bgcHoodCanalSOD / bgcAvgSOD export.
    stratDeficitBeta: { value: 1.0, unit: "dimensionless", description: "Stratification-deficit modulation coefficient β: SOD impact during fully-stratified periods is (1 + β) × fully-mixed-period impact at the per-basin export site (advisory path)", source: "Pre-registered range [0.5, 2.0] mechanism-bounded with adjacent-literature consistency check (Newton et al. 2011 renewal-locked seasonality; Kristensen et al. 2012 bioturbation framework; Middelburg & Levin 2009 stratification-duration coupling); central β selected by hindcast trough-quarter sweep tie-break per pre-reg §4", sensitivity: "high" },
  },

  productivity: {
    name: "Primary Production",
    maxProdRate: { value: 15, unit: "µmol C/L/quarter", description: "Maximum primary production rate at unlimited nutrients + light", source: "Calibrated — consistent with Khangaonkar et al. 2012 productivity estimates", sensitivity: "medium" },
  },
};
