// ═══════════════════════════════════════════════════════════════════════════════
// SPECIES PARAMETER REGISTRY — Salish Sea Digital Cousin
// ═══════════════════════════════════════════════════════════════════════════════
// Every hardcoded numerical coefficient from computeEcosystem.js, extracted
// line-by-line. This file is documentation only — it does NOT drive the engine.
// To change a coefficient, edit computeEcosystem.js and update this registry.
//
// Structure: SPECIES_PARAMS.<group>.<paramName> = {
//   value, unit, description, source, sensitivity
// }
//
// Sensitivity ratings:
//   "high"   — directly affects orca prey, orca demographics, salmon cohorts,
//              or controls a regime-shift threshold
//   "medium" — affects species feeding into the food web but not endpoint KPIs
//   "low"    — minor interaction term or single-species effect with weak downstream
// ═══════════════════════════════════════════════════════════════════════════════

export const SPECIES_PARAMS = {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. STRESSORS (lines 31-43)
  // ─────────────────────────────────────────────────────────────────────────────
  stressors: {
    name: "Environmental Stressors",

    doThreshold: {
      value: 5,
      unit: "mg/L",
      description: "Dissolved oxygen threshold below which oxygen stress begins",
      source: "WDOE 2002; Encyclopedia of Puget Sound — DO <5 mg/L reduces fish growth and feeding",
      sensitivity: "high"
    },
    doStressExponent: {
      value: 1.5,
      unit: "dimensionless",
      description: "Exponent for nonlinear DO stress response: ((5 - DO) / 5)^1.5",
      source: "Calibrated — nonlinear DO-mortality response consistent with WDOE 2002 review of salmonid oxygen requirements",
      sensitivity: "medium"
    },
    sstThreshold: {
      value: 13,
      unit: "deg C",
      description: "SST threshold above which thermal stress begins",
      source: "Thermal stress onset ~13°C for cold-water species; consistent with Nereocystis tolerance in Schiel et al. 2004 (J. Exp. Mar. Biol. Ecol. 306:83-101)",
      sensitivity: "high"
    },
    sstStressDivisor: {
      value: 7,
      unit: "deg C",
      description: "Divisor normalizing SST excess: (SST - 13) / 7",
      source: "Calibrated — maps 13-20°C range to 0-1 stress; upper bound from Blob/MHW SST anomalies (Bond et al. 2015, Geophys. Res. Lett. 42:3414-3420)",
      sensitivity: "medium"
    },
    sstStressExponent: {
      value: 1.3,
      unit: "dimensionless",
      description: "Exponent for nonlinear thermal stress: ((SST - 13) / 7)^1.3",
      source: "Calibrated — nonlinear thermal response consistent with dose-response curves in Pörtner & Farrell 2008 (Science 322:690-692)",
      sensitivity: "medium"
    },
    mhwThermalStressBoost: {
      value: 0.25,
      unit: "fraction",
      description: "Additional acute thermal stress per unit MHW intensity",
      source: "Calibrated — MHW acute thermal stress; informed by Bond et al. 2015 (Geophys. Res. Lett. 42:3414-3420) Blob anomaly magnitudes",
      sensitivity: "medium"
    },
    phThreshold: {
      value: 7.75,
      unit: "pH",
      description: "pH threshold below which acid stress begins",
      source: "Barton et al. 2012 (Limnol. Oceanogr. 57:698-710); Feely et al. 2010 (Estuarine Coastal Shelf Sci. 88:442-449) — PNW corrosive waters",
      sensitivity: "high"
    },
    phStressDivisor: {
      value: 0.75,
      unit: "pH",
      description: "Divisor normalizing pH departure: (7.75 - pH) / 0.75",
      source: "Calibrated — scales pH range 7.0-7.75 to stress 0-1; based on Feely et al. 2010 observed PNW pH ranges",
      sensitivity: "medium"
    },
    phStressExponent: {
      value: 1.4,
      unit: "dimensionless",
      description: "Exponent for nonlinear acid stress: ((7.75 - pH) / 0.75)^1.4",
      source: "Calibrated — nonlinear acid stress response consistent with Waldbusser et al. 2015 (Nature Clim. Change 5:273-280) dose-response data",
      sensitivity: "medium"
    },
    omegaThreshold: {
      value: 1.5,
      unit: "omega_aragonite",
      description: "Aragonite saturation threshold below which calcifier stress begins",
      source: "Barton et al. 2012; Waldbusser et al. 2015 — shell formation failure",
      sensitivity: "high"
    },
    omegaStressDivisor: {
      value: 1.2,
      unit: "omega_aragonite",
      description: "Divisor normalizing omega departure: (1.5 - omega) / 1.2",
      source: "Calibrated — omega range 0.3-1.5 scaled to stress; Waldbusser et al. 2015 (Nature Clim. Change 5:273-280)",
      sensitivity: "medium"
    },
    omegaStressMax: {
      value: 0.4,
      unit: "fraction",
      description: "Maximum omega stress contribution to acid stress",
      source: "Calibrated — caps omega contribution; Barton et al. 2012 shows aragonite is secondary to pH for many taxa",
      sensitivity: "medium"
    },
    noiseThreshold: {
      value: 0.4,
      unit: "index (0-1)",
      description: "Noise index threshold above which noise stress begins",
      source: "Williams et al. 2014 (Mar. Pollut. Bull. 86:170-178); Erbe et al. 2012 — vessel noise behavioral thresholds for cetaceans",
      sensitivity: "high"
    },
    noiseStressScale: {
      value: 1.5,
      unit: "dimensionless",
      description: "Multiplier for noise excess above threshold: (noise - 0.4) * 1.5",
      source: "Calibrated — scales noise above threshold; informed by Williams R. et al. 2006 (Biol. Conserv. 133:301-311) disturbance-response data",
      sensitivity: "medium"
    },
    noiseStressWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of noise stress in totalStress aggregation",
      source: "Calibrated — noise weighted 0.5x vs physical stressors; consistent with cumulative risk frameworks in Lacy et al. 2017 (Sci. Rep. 7:14119)",
      sensitivity: "medium"
    },
    oilSpillFactor: {
      value: 0.9,
      unit: "dimensionless",
      description: "Multiplier for oil spill contribution to total stress",
      source: "Calibrated — near-maximum impact; Exxon Valdez and Deepwater Horizon reviews (Peterson et al. 2003, Science 302:2082-2086)",
      sensitivity: "medium"
    },
    volcanoFactor: {
      value: 0.2,
      unit: "dimensionless",
      description: "Multiplier for volcanic eruption contribution to total stress",
      source: "Calibrated — moderate volcanic stress; based on Mt. St. Helens 1980 marine impact literature",
      sensitivity: "low"
    },
    stressMultExponent: {
      value: 1.5,
      unit: "dimensionless",
      description: "Exponent converting totalStress to stressMult: (1 - totalStress)^1.5",
      source: "Calibrated — nonlinear cumulative stress response; consistent with Halpern et al. 2008 (Science 319:948-952) cumulative impact framework",
      sensitivity: "high"
    },
    protectedAreaBonus: {
      value: 0.3,
      unit: "dimensionless",
      description: "Scaling of PA fraction to biodiversity bonus: PA/100 * 0.3",
      source: "Calibrated — MPA effectiveness; Lester et al. 2009 (Mar. Ecol. Prog. Ser. 384:33-46) biodiversity benefits of marine reserves",
      sensitivity: "medium"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. GREEN CRAB (lines 45-67)
  // ─────────────────────────────────────────────────────────────────────────────
  greenCrab: {
    name: "European Green Crab (Carcinus maenas)",

    initialPop: {
      value: 0.05,
      unit: "index (0-1)",
      description: "Default initial population density if no prior state",
      source: "Yamada et al. 2017 (J. Shellfish Res. 36:1-8) — first Salish Sea detections 2016; WDFW 2019-2022 trapping surveys",
      sensitivity: "low"
    },
    thermalMinimum: {
      value: 8,
      unit: "deg C",
      description: "SST below which thermal suitability is zero",
      source: "Behrens Yamada et al. 2005 (Biol. Invasions 7:309-321); Tepolt & Somero 2014 (J. Exp. Biol. 217:137-147) — C. maenas thermal tolerance 8-25°C",
      sensitivity: "medium"
    },
    thermalRampLow: {
      value: 12,
      unit: "deg C",
      description: "SST at which thermal suitability reaches 1.0 (ramp from 8 to 12)",
      source: "Behrens Yamada et al. 2005 (Biol. Invasions 7:309-321); Tepolt & Somero 2014 (J. Exp. Biol. 217:137-147) — C. maenas thermal tolerance 8-25°C",
      sensitivity: "medium"
    },
    thermalOptimalMax: {
      value: 20,
      unit: "deg C",
      description: "SST above which thermal suitability begins declining",
      source: "Behrens Yamada et al. 2005 (Biol. Invasions 7:309-321); Tepolt & Somero 2014 (J. Exp. Biol. 217:137-147) — C. maenas thermal tolerance 8-25°C",
      sensitivity: "medium"
    },
    thermalDeclineRange: {
      value: 5,
      unit: "deg C",
      description: "SST range above 20 deg C over which suitability declines to zero",
      source: "Behrens Yamada et al. 2005 (Biol. Invasions 7:309-321); Tepolt & Somero 2014 (J. Exp. Biol. 217:137-147) — C. maenas thermal tolerance 8-25°C",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.15,
      unit: "per year",
      description: "Base logistic growth rate",
      source: "Behrens Yamada et al. 2005 (Biol. Invasions 7:309-321) — growth/persistence data; Grosholz & Ruiz 1996 (Ecology 77:680-691)",
      sensitivity: "medium"
    },
    warmingGrowthBonus: {
      value: 0.05,
      unit: "per deg C above 12",
      description: "Additional growth rate per degree above 12 deg C: cl(SST-12,0,8)*0.05",
      source: "Calibrated — faster reproduction in warmer water; Tepolt & Somero 2014 (J. Exp. Biol. 217:137-147) thermal performance curves",
      sensitivity: "low"
    },
    warmingGrowthCap: {
      value: 8,
      unit: "deg C",
      description: "Maximum SST excess above 12 contributing to growth bonus",
      source: "Calibrated — upper thermal performance plateau; Behrens Yamada et al. 2005 (Biol. Invasions 7:309-321)",
      sensitivity: "low"
    },
    mhwGrowthBoost: {
      value: 0.4,
      unit: "dimensionless",
      description: "MHW intensity multiplier on growth rate: *(1 + intensity * 0.4)",
      source: "Calibrated — MHW boosts invasive expansion; Yamada et al. 2017 linked 2013-15 warm anomaly to Salish Sea colonization",
      sensitivity: "medium"
    },
    quarterlyGrowthFraction: {
      value: 0.25,
      unit: "dimensionless",
      description: "Fraction of annual growth realized per quarter",
      source: "Model discretization: annual rates divided by 4 for quarterly timestep integration (Euler method). Not an empirical measurement — applied consistently across all species growth blocks.",
      sensitivity: "low"
    },
    removalEfficiency: {
      value: 0.2,
      unit: "fraction per quarter at 100% effort",
      description: "Maximum fraction of population removable per quarter: effort * pop * 0.2",
      source: "Calibrated — WDFW 2022 Emergency Green Crab Response; trapping removal efficiency data from Grason et al. 2018 (Manag. Biol. Invasions 9:405-418)",
      sensitivity: "medium"
    },
    coldMortThreshold: {
      value: 8,
      unit: "deg C",
      description: "SST below which cold-induced mortality occurs",
      source: "Behrens Yamada et al. 2005 (Biol. Invasions 7:309-321); Tepolt & Somero 2014 (J. Exp. Biol. 217:137-147) — C. maenas thermal tolerance 8-25°C",
      sensitivity: "low"
    },
    coldMortRange: {
      value: 4,
      unit: "deg C",
      description: "Temperature range below 8 deg C over which cold mortality scales",
      source: "Behrens Yamada et al. 2005 (Biol. Invasions 7:309-321); Tepolt & Somero 2014 (J. Exp. Biol. 217:137-147) — C. maenas thermal tolerance 8-25°C",
      sensitivity: "low"
    },
    coldMortMax: {
      value: 0.15,
      unit: "fraction per timestep",
      description: "Maximum cold-water mortality rate",
      source: "Calibrated — cold mortality; Compton et al. 2010 (Biol. Invasions 12:2587-2600) winter temperature limitations",
      sensitivity: "low"
    },
    eelgrassDamageFactor: {
      value: 0.25,
      unit: "fraction",
      description: "Maximum eelgrass suppression at full green crab density",
      source: "Grosholz et al. 2011 (Ecol. Appl. 21:915-924) — green crab predation on bivalves/habitat disturbance; Howard et al. 2019 eelgrass bioturbation impacts",
      sensitivity: "high"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. EELGRASS (lines 69-118)
  // ─────────────────────────────────────────────────────────────────────────────
  eelgrass: {
    name: "Eelgrass (Zostera marina)",

    initialEstablishment: {
      value: 0.7,
      unit: "index (0-1)",
      description: "Default initial eelgrass establishment if no prior state",
      source: "WDNR Submerged Vegetation Monitoring Program 2000-2020; Thom et al. 2014 (Restor. Ecol. 22:36-44)",
      sensitivity: "medium"
    },
    baseHealth: {
      value: 0.7,
      unit: "index (0-1)",
      description: "Baseline eelgrass target before stressor subtraction",
      source: "Calibrated — WDNR Submerged Vegetation Monitoring baseline; Orth et al. 2006 (BioScience 56:987-996) global eelgrass status",
      sensitivity: "medium"
    },
    mhwHitFactor: {
      value: 0.15,
      unit: "fraction per unit MHW intensity",
      description: "MHW impact on eelgrass target: intensity * 0.15",
      source: "Calibrated — seagrass thermal stress; Jarvis et al. 2012 (Mar. Ecol. Prog. Ser. 448:31-45) heat wave eelgrass mortality",
      sensitivity: "medium"
    },
    turbiditySensitivity: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of turbidity on eelgrass target: turbidity/30 * 0.3",
      source: "Thom et al. 2008 (Estuaries Coasts 31:969-980) — Z. marina requires >3 mol quanta/m2/day; light limited by turbidity",
      sensitivity: "medium"
    },
    turbidityDivisor: {
      value: 30,
      unit: "NTU",
      description: "Turbidity normalization divisor",
      source: "Calibrated — Puget Sound nearshore turbidity typically 5-30 NTU; Thom et al. 2008 (Estuaries Coasts 31:969-980)",
      sensitivity: "low"
    },
    contaminationSensitivity: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of contamination on eelgrass target",
      source: "Calibrated — sediment contamination effects on seagrass; Hoven et al. 1999 (Aquat. Bot. 65:75-87)",
      sensitivity: "medium"
    },
    biodiversityWeight: {
      value: 0.15,
      unit: "dimensionless",
      description: "Weight of (1-bi) in eelgrass target subtraction",
      source: "Calibrated — ecosystem-level eelgrass coupling; Orth et al. 2006 (BioScience 56:987-996) multi-stressor framework",
      sensitivity: "low"
    },
    protectedAreaBonus: {
      value: 0.2,
      unit: "dimensionless",
      description: "PA fraction contribution to eelgrass target: PA/100 * 0.2",
      source: "Calibrated — MPAs reduce physical disturbance; Lester et al. 2009 (Mar. Ecol. Prog. Ser. 384:33-46)",
      sensitivity: "low"
    },
    oilSpillPenalty: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oil spill subtraction from eelgrass target",
      source: "Calibrated — oil smothering effects on seagrass; Dean et al. 1998 (Mar. Ecol. Prog. Ser. 170:1-12) Exxon Valdez eelgrass impacts",
      sensitivity: "low"
    },
    declineRate: {
      value: 0.15,
      unit: "per year",
      description: "Rate of eelgrass decline under stress (asymmetric: fast decline)",
      source: "WDNR Submerged Vegetation Monitoring — documented 10-20% loss rates at degraded sites; Thom et al. 2014 (Restor. Ecol. 22:36-44)",
      sensitivity: "high"
    },
    recoveryRate: {
      value: 0.02,
      unit: "per year",
      description: "Base rate of eelgrass recovery (asymmetric: very slow recovery)",
      source: "Thom et al. 2014 (Restor. Ecol. 22:36-44) — Puget Sound eelgrass restoration requires 5-20 years for establishment",
      sensitivity: "high"
    },
    regimeShiftThreshold: {
      value: 0.3,
      unit: "index (0-1)",
      description: "Below this establishment level, seedbank is depleted and recovery is suppressed exponentially",
      source: "Calibrated — regime shift dynamics; van der Heide et al. 2007 (Ecosystems 10:1311-1322) seagrass positive feedback collapse",
      sensitivity: "high"
    },
    regimeShiftExponent: {
      value: 3,
      unit: "dimensionless",
      description: "Exponent for recovery suppression below regime threshold: (estab/0.3)^3",
      source: "Calibrated — seedbank depletion hysteresis; van der Heide et al. 2007 (Ecosystems 10:1311-1322) critical transition dynamics",
      sensitivity: "high"
    },
    restoreRecoveryBoost: {
      value: 0.08,
      unit: "per year at 100% effort",
      description: "Maximum additional recovery rate from restoration effort (adds to base 0.02)",
      source: "Calibrated — active restoration rates from Thom et al. 2014 (Restor. Ecol. 22:36-44) Puget Sound restoration projects",
      sensitivity: "medium"
    },
    restoreTurbidityReduction: {
      value: 0.15,
      unit: "fraction at 100% effort",
      description: "Maximum turbidity reduction from restored bed sediment trapping",
      source: "Calibrated — eelgrass sediment trapping; Ward et al. 1984 (Estuaries 7:521-527) seagrass particle trapping rates",
      sensitivity: "low"
    },
    restoreTurbidityTargetWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of turbidity reduction applied to eelgrass target",
      source: "Calibrated — indirect positive feedback of restoration; consistent with van der Heide et al. 2007 seagrass facilitation model",
      sensitivity: "low"
    },
    conditionOilWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Oil spill penalty on condition factor: sp * 0.4",
      source: "Calibrated — acute oil impact; Dean et al. 1998 (Mar. Ecol. Prog. Ser. 170:1-12)",
      sensitivity: "low"
    },
    conditionMHWWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "MHW hit penalty on condition factor: mhwHit * 0.5",
      source: "Calibrated — acute MHW impact; Jarvis et al. 2012 (Mar. Ecol. Prog. Ser. 448:31-45) heat stress eelgrass mortality",
      sensitivity: "low"
    },
    conditionFloor: {
      value: 0.3,
      unit: "dimensionless",
      description: "Minimum condition factor (prevents total collapse from acute events)",
      source: "Calibrated — rhizome resilience; Olesen & Sand-Jensen 1994 (Oecologia 99:305-309) seagrass minimum viable shoot density",
      sensitivity: "low"
    },
    lightTurbidityDivisor: {
      value: 40,
      unit: "NTU",
      description: "Turbidity divisor for light availability: 1 - turbidity/40",
      source: "Calibrated — light vs turbidity; Thom et al. 2008 (Estuaries Coasts 31:969-980) light requirement thresholds",
      sensitivity: "low"
    },
    lightFloor: {
      value: 0.1,
      unit: "fraction",
      description: "Minimum light availability",
      source: "Calibrated — minimum light for Z. marina persistence; Thom et al. 2008 (Estuaries Coasts 31:969-980)",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. SEA URCHIN (lines 121-147)
  // ─────────────────────────────────────────────────────────────────────────────
  urchin: {
    name: "Sea Urchin (Strongylocentrotus spp.)",

    initialPop: {
      value: 0.45,
      unit: "index (0-1)",
      description: "Default initial urchin population",
      source: "Harvell et al. 2019 (Annu. Rev. Mar. Sci. 11:165-188) — post-SSWD urchin population release; Schultz et al. 2016 (PeerJ 4:e1968)",
      sensitivity: "medium"
    },
    urchinFoodFloor: {
      value: 0.05,
      unit: "index (0-1)",
      description: "Minimum kelp food availability for urchin K calculation",
      source: "Calibrated — urchins persist on coralline crusts in barrens; Steneck et al. 2002 (Environ. Conserv. 29:436-459)",
      sensitivity: "low"
    },
    sswdFadeTime: {
      value: 40,
      unit: "years",
      description: "Time for SSWD predation deficit to fully recover (sunflower star rebuild)",
      source: "Hamilton et al. 2021 (Proc. R. Soc. B 288:20210223) — sunflower star IUCN critically endangered; recovery projected multi-decadal",
      sensitivity: "medium"
    },
    sswdInitialDeficit: {
      value: 0.8,
      unit: "index (0-1)",
      description: "Initial SSWD predation deficit at simulation start",
      source: "Harvell et al. 2019 (Annu. Rev. Mar. Sci. 11:165-188) — >90% sunflower star loss in 2013-14 SSWD outbreak",
      sensitivity: "medium"
    },
    sswdPredationWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of SSWD deficit on urchin predation: sswd * 0.4",
      source: "Calibrated — predation release magnitude; Burt et al. 2018 (Proc. R. Soc. B 285:20180553) sunflower star-urchin trophic cascade",
      sensitivity: "medium"
    },
    basePredation: {
      value: 0.5,
      unit: "index (0-1)",
      description: "Baseline urchin predation rate before SSWD effect",
      source: "Calibrated — multi-predator urchin control; Steneck et al. 2002 (Environ. Conserv. 29:436-459) predator-urchin dynamics",
      sensitivity: "medium"
    },
    biodiversityPredationWeight: {
      value: 0.15,
      unit: "dimensionless",
      description: "Weight of biodiversity index on urchin predation: bi * 0.15",
      source: "Calibrated — biodiversity-predation coupling; Steneck et al. 2002 (Environ. Conserv. 29:436-459)",
      sensitivity: "low"
    },
    predationRange: {
      value: [0.1, 0.6],
      unit: "index (0-1)",
      description: "Clamp range for urchin predation rate",
      source: "Calibrated — predation bounds from field observations in BC kelp forests; Salomon et al. 2010",
      sensitivity: "low"
    },
    kBase: {
      value: 0.8,
      unit: "index (0-1)",
      description: "Base carrying capacity before predation subtraction",
      source: "Calibrated — high urchin density in barrens; Rogers-Bennett & Catton 2019 (Sci. Rep. 9:998) northern California urchin densities",
      sensitivity: "low"
    },
    kPredationWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of predation on K reduction: predation * 0.4",
      source: "Calibrated — predation-K coupling; Estes & Palmisano 1974 (Science 185:1058-1060) otter-urchin-kelp cascade framework",
      sensitivity: "medium"
    },
    kRange: {
      value: [0.2, 0.9],
      unit: "index (0-1)",
      description: "Clamp range for urchin carrying capacity",
      source: "Calibrated — bounds consistent with Rogers-Bennett & Catton 2019 field density range data",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.18,
      unit: "per year",
      description: "Base logistic growth rate",
      source: "Ebert 2010 (J. Sea Res. 64:481-492) — Strongylocentrotus growth and demographic parameters; Russell 1987 growth studies",
      sensitivity: "medium"
    },
    harvestThreshold: {
      value: 0.2,
      unit: "index (0-1)",
      description: "Minimum population before harvest begins",
      source: "Calibrated — fishery management minimum stock size; WDFW sea urchin harvest regulations",
      sensitivity: "low"
    },
    harvestRate: {
      value: 0.05,
      unit: "fraction per quarter at 100% fishing",
      description: "Harvest rate scaling: (pop - 0.2) * fishingPressure * 0.05",
      source: "Calibrated — WDFW sea urchin fishery management; small uni export fishery in Puget Sound",
      sensitivity: "low"
    },
    mhwMortRate: {
      value: 0.05,
      unit: "fraction per unit MHW intensity",
      description: "MHW-induced mortality rate: intensity * 0.05 * pop",
      source: "Calibrated — MHW thermal stress on urchins; Rogers-Bennett & Catton 2019 (Sci. Rep. 9:998) kelp-urchin MHW interactions",
      sensitivity: "low"
    },
    otterPredationMaxRate: {
      value: 0.35,
      unit: "fraction",
      description: "Holling Type II max predation rate: otters saturate on urchins at high density",
      source: "Estes & Palmisano 1974 (Science 185:1058-1060); Tinker et al. 2008 (Ecol. Monogr. 78:615-634) — urchins are primary otter prey; Holling 1959 Type II functional response",
      sensitivity: "high"
    },
    otterPredationHalfSat: {
      value: 0.25,
      unit: "index (0-1)",
      description: "Half-saturation constant for otter-urchin predation: otters reach half max consumption when urchin density = 0.25",
      source: "Holling 1959 — Type II functional response; halfSat calibrated to match baseline equilibrium (prevUrch ~0.45)",
      sensitivity: "high"
    },
    barrenThreshold: {
      value: 0.4,
      unit: "index (0-1)",
      description: "Population threshold above which urchin grazing activates (Holling II applied above this)",
      source: "Ling et al. 2015 (Phil. Trans. R. Soc. B 370:20130269) — urchin barren regime shift; threshold lowered from 0.6 to 0.4 with Holling II saturation preventing runaway grazing",
      sensitivity: "high"
    },
    barrenGrazingMaxRate: {
      value: 0.50,
      unit: "fraction",
      description: "Holling Type II max grazing rate for urchins on kelp (saturates at high urchin density)",
      source: "Calibrated — Holling 1959 Type II; Ling et al. 2015 barren formation dynamics",
      sensitivity: "high"
    },
    barrenGrazingHalfSat: {
      value: 0.25,
      unit: "index (0-1)",
      description: "Half-saturation constant for urchin grazing: grazing reaches half max when excess urchin density = 0.25 above threshold",
      source: "Holling 1959 — Type II functional response; calibrated to match baseline kelp health at equilibrium urchin density",
      sensitivity: "medium"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. BULL KELP (lines 149-152)
  // ─────────────────────────────────────────────────────────────────────────────
  bullKelp: {
    name: "Bull Kelp (Nereocystis luetkeana)",

    thermalMortThreshold: {
      value: 15,
      unit: "deg C",
      description: "SST above which bull kelp lethal thermal mortality begins",
      source: "Schiel et al. 2004 (J. Exp. Mar. Biol. Ecol. 306:83-101); Maxell & Miller 1996 — N. luetkeana upper thermal limit ~15-18°C",
      sensitivity: "medium"
    },
    thermalMortRange: {
      value: 3,
      unit: "deg C",
      description: "SST range above 15 deg C over which thermal mortality scales to 0.6",
      source: "Calibrated — rapid thermal mortality; Rogers-Bennett & Catton 2019 (Sci. Rep. 9:998) documented MHW kelp loss in northern California",
      sensitivity: "medium"
    },
    thermalMortMax: {
      value: 0.6,
      unit: "fraction",
      description: "Maximum thermal mortality contribution to kelp health",
      source: "Calibrated — sub-total thermal mortality; Steneck et al. 2002 (Environ. Conserv. 29:436-459) kelp resilience patterns",
      sensitivity: "medium"
    },
    lightWeight: {
      value: 0.35,
      unit: "dimensionless",
      description: "Weight of light availability in kelp health formula",
      source: "Calibrated — kelp light requirements; Schiel & Foster 2015 'Biology and Ecology of Giant Kelp Forests' — light is primary growth driver",
      sensitivity: "low"
    },
    thermalHealthWeight: {
      value: 0.35,
      unit: "dimensionless",
      description: "Weight of (1 - tempStress) in kelp health formula",
      source: "Calibrated — kelp thermal sensitivity; Schiel et al. 2004 (J. Exp. Mar. Biol. Ecol. 306:83-101)",
      sensitivity: "low"
    },
    biodiversityWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of biodiversity index in kelp health formula",
      source: "Calibrated — ecosystem health-kelp coupling; Steneck et al. 2002 (Environ. Conserv. 29:436-459) kelp forest stability",
      sensitivity: "low"
    },
    oilSpillPenalty: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oil spill subtraction from kelp health",
      source: "Calibrated — oil impacts on macroalgae; Peterson et al. 2003 (Science 302:2082-2086) oil spill ecosystem impacts",
      sensitivity: "low"
    },
    volcanoPenalty: {
      value: 0.15,
      unit: "dimensionless",
      description: "Volcano subtraction from kelp health",
      source: "Calibrated — volcanic ash turbidity reduces photosynthesis; based on Mt. St. Helens 1980 observations",
      sensitivity: "low"
    },
    kelpIndexEelgrassWeight: {
      value: 0.45,
      unit: "dimensionless",
      description: "Weight of eelgrass in combined kelp index: eelgrass*0.45 + bullKelp*0.55",
      source: "Calibrated — composite weighting; eelgrass and bull kelp both form habitat-forming canopy in Salish Sea (Berry et al. 2003)",
      sensitivity: "low"
    },
    kelpIndexBullKelpWeight: {
      value: 0.55,
      unit: "dimensionless",
      description: "Weight of bull kelp in combined kelp index",
      source: "Calibrated — bull kelp canopy more structurally complex; Berry et al. 2003 kelp-eelgrass habitat equivalence",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. HERRING (lines 153-158)
  // ─────────────────────────────────────────────────────────────────────────────
  herring: {
    name: "Pacific Herring (Clupea pallasii)",

    eelgrassWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of eelgrass establishment in herring habitat: estab * 0.5",
      source: "Stick et al. 2014 (WDFW Tech. Rep. FPA 14-09); Penttila 2007 — herring spawn on eelgrass/macroalgae substrata",
      sensitivity: "high"
    },
    biodiversityWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of biodiversity in herring habitat: bi * 0.3",
      source: "Calibrated — ecosystem health coupling for herring; Stick et al. 2014 (WDFW Tech. Rep. FPA 14-09) stock assessment",
      sensitivity: "medium"
    },
    zooplanktonWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of zooplankton in herring habitat: zoo/600 * 0.2",
      source: "Calibrated — copepods/euphausiids are primary herring prey; Schweigert et al. 2010 herring feeding ecology",
      sensitivity: "medium"
    },
    zooplanktonDivisor: {
      value: 600,
      unit: "mg C/m3",
      description: "Zooplankton normalization divisor",
      source: "Calibrated — Puget Sound zooplankton biomass range; Keister & Tuttle 2013 (Prog. Oceanogr. 115:28-40)",
      sensitivity: "low"
    },
    mhwHitFactor: {
      value: 0.12,
      unit: "fraction per unit MHW intensity",
      description: "MHW impact on herring population: intensity * 0.12",
      source: "Calibrated — MHW herring recruitment failure; Stick et al. 2014 documented thermal impacts on spawning timing",
      sensitivity: "high"
    },
    oilSpillMortality: {
      value: 0.4,
      unit: "dimensionless",
      description: "Oil spill mortality factor on herring: sp * 0.4",
      source: "Calibrated — pelagic schooling fish oil vulnerability; Carls et al. 1999 herring embryo PAH sensitivity after Exxon Valdez",
      sensitivity: "medium"
    },
    fishingMortality: {
      value: 0.2,
      unit: "fraction at 100% fishing pressure",
      description: "Fishing mortality: fishingPressure/100 * 0.2",
      source: "Stick et al. 2014 (WDFW Tech. Rep. FPA 14-09) — Puget Sound herring harvest rate targets; Cherry Point stock collapse documented",
      sensitivity: "high"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. OYSTERS — Pacific + Olympia (lines 160-201)
  // ─────────────────────────────────────────────────────────────────────────────
  oysters: {
    name: "Pacific Oyster (C. gigas) & Olympia Oyster (O. lurida)",

    // Shared parameters
    initialPacific: {
      value: 0.50,
      unit: "index (0-1)",
      description: "Default initial Pacific oyster population",
      source: "WDFW shellfish management data; Pacific oyster industry ~$150M/yr in PNW",
      sensitivity: "low"
    },
    initialOlympia: {
      value: 0.08,
      unit: "index (0-1)",
      description: "Default initial Olympia oyster population (remnant <5% historical)",
      source: "White et al. 2009 (J. Shellfish Res. 28:79-85) — Olympia oyster at ~5% of historical extent in Puget Sound",
      sensitivity: "low"
    },
    larvalSurvHighOmega: {
      value: 2.0,
      unit: "omega_aragonite",
      description: "Omega above which larval survival is 100%",
      source: "Barton et al. 2012 — shell formation is optimal above omega 2.0",
      sensitivity: "high"
    },
    larvalSurvMidOmega: {
      value: 1.5,
      unit: "omega_aragonite",
      description: "Omega threshold for sigmoid larval survival crash",
      source: "Waldbusser et al. 2015 — larval shell formation begins failing",
      sensitivity: "high"
    },
    larvalSurvMidFloor: {
      value: 0.3,
      unit: "fraction",
      description: "Minimum larval survival at omega 1.5",
      source: "Calibrated — residual larval survival; Waldbusser et al. 2015 (Nature Clim. Change 5:273-280) dose-response curves",
      sensitivity: "medium"
    },
    doStressThresholdSevere: {
      value: 3,
      unit: "mg/L",
      description: "DO below which severe oyster mortality (0.3) occurs",
      source: "Vaquer-Sunyer & Duarte 2008 (PNAS 105:15452-15457) — benthic invertebrate hypoxia thresholds; sessile bivalve LC50 values",
      sensitivity: "medium"
    },
    doStressSevereMort: {
      value: 0.3,
      unit: "fraction",
      description: "DO stress at severe hypoxia (<3 mg/L)",
      source: "Calibrated — sessile bivalve hypoxia mortality; Vaquer-Sunyer & Duarte 2008 (PNAS 105:15452-15457)",
      sensitivity: "medium"
    },
    doStressThresholdMild: {
      value: 5,
      unit: "mg/L",
      description: "DO threshold for mild oyster stress",
      source: "Vaquer-Sunyer & Duarte 2008 (PNAS 105:15452-15457) — sublethal DO thresholds for benthic invertebrates",
      sensitivity: "medium"
    },
    doStressMildMax: {
      value: 0.15,
      unit: "fraction",
      description: "Maximum mild DO stress at 3 mg/L: (5 - DO)/2 * 0.15",
      source: "Calibrated — sublethal hypoxia stress interpolation; Vaquer-Sunyer & Duarte 2008",
      sensitivity: "low"
    },
    sedimentStressMax: {
      value: 0.2,
      unit: "fraction",
      description: "Maximum sedimentation stress: turbidity/30 * 0.15, capped at 0.2",
      source: "Calibrated — sedimentation impacts on reef; Coen et al. 2007 (Mar. Ecol. Prog. Ser. 341:303-307) oyster reef ecosystem services",
      sensitivity: "low"
    },
    sedimentStressRate: {
      value: 0.15,
      unit: "dimensionless",
      description: "Sedimentation stress rate: turbidity/30 * 0.15",
      source: "Calibrated — turbidity as sedimentation proxy; consistent with Thom et al. 2008 turbidity monitoring data",
      sensitivity: "low"
    },
    habClosureScale: {
      value: 0.6,
      unit: "fraction",
      description: "HAB closure fraction scaling: habIntensity * 0.6",
      source: "Calibrated — HAB harvest closures; WDOH biotoxin monitoring program; Moore et al. 2020 (Harmful Algae 92:101730)",
      sensitivity: "low"
    },
    mhwStressRate: {
      value: 0.10,
      unit: "fraction per unit MHW intensity",
      description: "MHW stress on oysters: intensity * 0.10",
      source: "Calibrated — thermal stress on C. gigas larvae above 20°C; Barton et al. 2012 (Limnol. Oceanogr. 57:698-710)",
      sensitivity: "medium"
    },

    // Pacific oyster specific
    pacificGrowthRate: {
      value: 0.20,
      unit: "per year",
      description: "Pacific oyster logistic growth rate (fast-growing, commercial)",
      source: "Shumway 1996 'The Eastern Oyster'; Barton et al. 2012 — C. gigas rapid growth in favorable conditions",
      sensitivity: "medium"
    },
    pacificOilKPenalty: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oil spill penalty on Pacific oyster K: sp * 0.3",
      source: "Calibrated — oil habitat degradation; Peterson et al. 2003 (Science 302:2082-2086) oil spill impacts on benthic habitats",
      sensitivity: "low"
    },
    pacificMortOil: {
      value: 0.2,
      unit: "dimensionless",
      description: "Oil mortality weight for Pacific oyster: sp * 0.2",
      source: "Calibrated — direct oil mortality on sessile bivalves; Peterson et al. 2003 (Science 302:2082-2086)",
      sensitivity: "low"
    },
    pacificHarvestThreshold: {
      value: 0.15,
      unit: "index (0-1)",
      description: "Minimum Pacific oyster population before harvest begins",
      source: "Calibrated — WDFW/tribal co-managed shellfish harvest regulations; minimum stock floor",
      sensitivity: "low"
    },
    pacificHarvestRate: {
      value: 0.10,
      unit: "fraction per quarter at 100% fishing",
      description: "Pacific oyster harvest rate",
      source: "Calibrated — PNW commercial oyster harvest intensity; PCSGA industry production data",
      sensitivity: "low"
    },
    pacificKMax: {
      value: 0.8,
      unit: "index (0-1)",
      description: "Maximum Pacific oyster carrying capacity",
      source: "Calibrated — C. gigas carrying capacity constrained by available reef substrate; Coen et al. 2007",
      sensitivity: "low"
    },

    // Olympia oyster specific
    olympiaGrowthRate: {
      value: 0.06,
      unit: "per year",
      description: "Olympia oyster logistic growth rate (very slow, native, remnant)",
      source: "White et al. 2009 (J. Shellfish Res. 28:79-85) — O. lurida slow growth; PSRF restoration monitoring data",
      sensitivity: "medium"
    },
    olympiaHabitatBonusPA: {
      value: 0.3,
      unit: "dimensionless",
      description: "Protected area contribution to Olympia oyster habitat: PA/100 * 0.3",
      source: "Calibrated — Olympia oyster restoration sites predominantly in protected areas; PSRF/NWSI restoration programs",
      sensitivity: "low"
    },
    olympiaHabitatBonusEelgrass: {
      value: 0.2,
      unit: "dimensionless",
      description: "Eelgrass establishment contribution to Olympia habitat bonus",
      source: "Calibrated — eelgrass-oyster habitat adjacency; White et al. 2009 restoration site co-location",
      sensitivity: "low"
    },
    olympiaHabitatBonusMax: {
      value: 0.3,
      unit: "dimensionless",
      description: "Maximum combined habitat bonus for Olympia oyster",
      source: "Calibrated — habitat bonus cap; White et al. 2009 restoration ceiling estimates",
      sensitivity: "low"
    },
    olympiaKScale: {
      value: 0.5,
      unit: "dimensionless",
      description: "Larval survival scaling for Olympia K: larvalSurv * 0.5",
      source: "Calibrated — O. lurida lower K than C. gigas; White et al. 2009 remnant population densities",
      sensitivity: "low"
    },
    olympiaKMax: {
      value: 0.5,
      unit: "index (0-1)",
      description: "Maximum Olympia oyster carrying capacity",
      source: "Calibrated — O. lurida max K ~5% of historical; White et al. 2009 (J. Shellfish Res. 28:79-85)",
      sensitivity: "low"
    },
    olympiaDOStressMultiplier: {
      value: 1.2,
      unit: "dimensionless",
      description: "Olympia oyster DO stress multiplier (more sensitive than Pacific)",
      source: "Calibrated — O. lurida more sensitive than C. gigas to low DO; Hettinger et al. 2013 (Mar. Ecol. Prog. Ser. 489:185-198)",
      sensitivity: "low"
    },
    olympiaOilMort: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oil mortality weight for Olympia oyster: sp * 0.3",
      source: "Calibrated — O. lurida higher oil sensitivity; smaller body size = higher surface-to-volume ratio",
      sensitivity: "low"
    },

    // Combined index
    pacificWeight: {
      value: 0.6,
      unit: "dimensionless",
      description: "Weight of Pacific oyster in combined index: Pacific*0.6 + Olympia*0.4",
      source: "Calibrated — C. gigas dominant biomass in current Puget Sound; PCSGA industry data",
      sensitivity: "low"
    },
    olympiaWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of Olympia oyster in combined index",
      source: "Calibrated — O. lurida weighted for conservation significance despite smaller biomass; White et al. 2009",
      sensitivity: "low"
    },
    filtrationRate: {
      value: 0.5,
      unit: "dimensionless",
      description: "Oyster filtration capacity: oysterPop * 0.5, max 0.25",
      source: "Each 0.1 oyster pop ~ 5% turbidity reduction at reef scale",
      sensitivity: "medium"
    },
    filtrationMax: {
      value: 0.25,
      unit: "fraction",
      description: "Maximum turbidity offset from oyster filtration",
      source: "Calibrated — reef-scale filtration cap; Coen et al. 2007 (Mar. Ecol. Prog. Ser. 341:303-307) ecosystem services review",
      sensitivity: "low"
    },
    revenueScale: {
      value: 500,
      unit: "$M scaling factor",
      description: "Revenue per unit Pacific oyster harvest: harvest * 500",
      source: "PCSGA (Pacific Coast Shellfish Growers Association) — PNW oyster industry ~$150M/yr ex-farm revenue",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. GEODUCK (lines 202-227)
  // ─────────────────────────────────────────────────────────────────────────────
  geoduck: {
    name: "Geoduck (Panopea generosa)",

    initialPop: {
      value: 0.40,
      unit: "index (0-1)",
      description: "Default initial geoduck population",
      source: "Goodwin & Pease 1989 (USFWS Biol. Rep. 82) — P. generosa baseline population; WDFW geoduck stock surveys",
      sensitivity: "low"
    },
    dredgingHabitatWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of dredging impact on habitat: dredging * 0.3",
      source: "Calibrated — dredging impacts on subtidal habitat; Goodwin & Pease 1989 (USFWS Biol. Rep. 82) geoduck habitat requirements",
      sensitivity: "low"
    },
    turbidityHabitatWeight: {
      value: 0.1,
      unit: "dimensionless",
      description: "Weight of turbidity on habitat: turbidity/30 * 0.1",
      source: "Calibrated — sedimentation impacts on burrowing bivalves; Goodwin & Pease 1989 sediment grain size requirements",
      sensitivity: "low"
    },
    habitatFloor: {
      value: 0.3,
      unit: "index (0-1)",
      description: "Minimum geoduck habitat quality",
      source: "Calibrated — deep-burrowed adults protected at 0.3-1m depth; Goodwin & Pease 1989 burrow depth data",
      sensitivity: "low"
    },
    omegaStressThreshold: {
      value: 1.5,
      unit: "omega_aragonite",
      description: "Omega below which shell growth stress begins",
      source: "Similar to oysters but less acute — adults are deep-burrowed",
      sensitivity: "medium"
    },
    omegaStressRate: {
      value: 0.08,
      unit: "fraction at omega 1.0",
      description: "Maximum omega stress: (1.5 - omega)/0.5 * 0.08",
      source: "Calibrated — shell growth impairment; Waldbusser et al. 2015 — bivalve aragonite sensitivity framework applies to P. generosa",
      sensitivity: "medium"
    },
    contamWeightContamination: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of general contamination in body burden",
      source: "Calibrated — 140+ year lifespan bioaccumulation; Goodwin & Pease 1989; WDOH tissue monitoring program",
      sensitivity: "medium"
    },
    contamWeightPCB: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of PCB in body burden",
      source: "Calibrated — PCB bioaccumulation in long-lived bivalves; WA Dept. of Health shellfish tissue monitoring data",
      sensitivity: "medium"
    },
    contamWeightPFAS: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of PFAS in body burden",
      source: "Calibrated — PFAS emerging contaminant; WA Dept. of Ecology PFAS Chemical Action Plan 2022",
      sensitivity: "medium"
    },
    marketClosureThreshold: {
      value: 0.4,
      unit: "index (0-1)",
      description: "Contamination burden above which market closures begin",
      source: "Calibrated — export market closure threshold; WDFW/WDOH geoduck harvest certification requirements for Asian export markets",
      sensitivity: "medium"
    },
    marketClosureRange: {
      value: 0.3,
      unit: "index (0-1)",
      description: "Contamination range over which market closure scales: (burden-0.4)/0.3",
      source: "Calibrated — graduated market restriction; WDOH tissue monitoring thresholds for export certification",
      sensitivity: "low"
    },
    marketClosureMax: {
      value: 0.8,
      unit: "fraction",
      description: "Maximum market closure fraction",
      source: "Calibrated — residual domestic market; WDFW geoduck fishery management data",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.04,
      unit: "per year",
      description: "Logistic growth rate (very slow — 160+ year lifespan)",
      source: "Goodwin & Pease 1989 (USFWS Biol. Rep. 82) — P. generosa 140+ year lifespan; extremely slow growth r~0.04",
      sensitivity: "medium"
    },
    kMax: {
      value: 0.7,
      unit: "index (0-1)",
      description: "Maximum geoduck carrying capacity",
      source: "Calibrated — K constrained by substrate; WDFW geoduck stock assessment surveys",
      sensitivity: "low"
    },
    harvestThreshold: {
      value: 0.15,
      unit: "index (0-1)",
      description: "Minimum population before harvest begins",
      source: "Calibrated — Boldt Decision 50/50 co-managed harvest; WDFW/tribal geoduck management framework",
      sensitivity: "low"
    },
    harvestRate: {
      value: 0.06,
      unit: "fraction per quarter at 100% fishing",
      description: "Geoduck harvest rate",
      source: "Calibrated — harvest rate under Boldt Decision 50/50 allocation; WDFW geoduck fishery regulations",
      sensitivity: "low"
    },
    otterPredationRate: {
      value: 0.15,
      unit: "fraction",
      description: "Sea otter predation on geoduck: otterPop * 0.15 * geoPop * 0.25 * dt",
      source: "Tinker et al. 2008 (Ecol. Monogr. 78:615-634) — sea otter diet specialization includes geoduck; Kvitek et al. 1993",
      sensitivity: "medium"
    },
    revenueScale: {
      value: 600,
      unit: "$M scaling factor",
      description: "Revenue per unit geoduck harvest: harvest * 600",
      source: "WDFW geoduck fishery reports — PNW geoduck export fishery ~$80M/yr; primarily Asian live-export market",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. FORAGE FISH — Sand Lance + Surf Smelt (lines 229-261)
  // ─────────────────────────────────────────────────────────────────────────────
  forageFish: {
    name: "Sand Lance (A. personatus) & Surf Smelt (H. pretiosus)",

    initialSandLance: {
      value: 0.55,
      unit: "index (0-1)",
      description: "Default initial sand lance population",
      source: "Penttila 2007 (Puget Sound Nearshore Partnership Rep. 2007-03) — moderate baseline from spawning surveys",
      sensitivity: "medium"
    },
    initialSurfSmelt: {
      value: 0.50,
      unit: "index (0-1)",
      description: "Default initial surf smelt population",
      source: "Penttila 2007 (Puget Sound Nearshore Partnership Rep. 2007-03) — moderate baseline from spawning surveys",
      sensitivity: "medium"
    },

    // Armoring
    armoringRiparianWeight: {
      value: 0.7,
      unit: "dimensionless",
      description: "Weight of riparian buffer in armoring calculation: riparianBuffer * 0.7",
      source: "Calibrated — riparian integrity as shoreline quality proxy; Dethier et al. 2016 (Estuar. Coasts 39:1774-1783) armoring impacts",
      sensitivity: "medium"
    },
    armoringPAWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of PA fraction in armoring calculation: PA/100 * 0.5",
      source: "Calibrated — protected areas limit armoring; Dethier et al. 2016 — unarmored reaches in protected zones",
      sensitivity: "medium"
    },
    armoringRange: {
      value: [0.1, 0.9],
      unit: "fraction",
      description: "Clamp range for armoring fraction",
      source: "Dethier et al. 2016 (Estuar. Coasts 39:1774-1783) — ~27% of Puget Sound shoreline armored; cumulative effects documented",
      sensitivity: "low"
    },

    // Sand lance
    sandLanceHabitatShorelineWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of shoreline integrity in sand lance habitat",
      source: "Penttila 2007 — sand lance spawn in upper intertidal sand/gravel; shoreline integrity drives habitat quality",
      sensitivity: "high"
    },
    sandLanceHabitatBiWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of biodiversity in sand lance habitat",
      source: "Calibrated — ecosystem health supports sand lance; Penttila 2007 forage fish habitat framework",
      sensitivity: "medium"
    },
    sandLanceHabitatContamWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of contamination (inverse) in sand lance habitat",
      source: "Calibrated — contamination degrades spawning substrate; Penttila 2007 spawning habitat requirements",
      sensitivity: "medium"
    },
    dredgingPressureScale: {
      value: 0.25,
      unit: "dimensionless",
      description: "Dredging impact scaling: dredgingImpact * 0.25",
      source: "Calibrated — dredging destroys subtidal sand lance habitat; Penttila 2007 habitat vulnerability assessment",
      sensitivity: "medium"
    },
    sandLanceGrowthRate: {
      value: 0.25,
      unit: "per year",
      description: "Sand lance logistic growth rate",
      source: "Penttila 2007 (PSNP Rep. 2007-03) — A. personatus life history; annual spawning, moderate fecundity",
      sensitivity: "high"
    },
    sandLanceThermalMort: {
      value: 0.15,
      unit: "dimensionless",
      description: "Thermal stress mortality weight: tS * 0.15",
      source: "Calibrated — sand lance thermal stress; Robards et al. 1999 (Rev. Fish Biol. Fish. 9:1-16) sand lance thermal ecology",
      sensitivity: "medium"
    },
    sandLanceOilMort: {
      value: 0.5,
      unit: "dimensionless",
      description: "Oil spill mortality weight: sp * 0.5",
      source: "Calibrated — sand lance oil vulnerability; nearshore burrowing habit increases exposure to beached oil",
      sensitivity: "medium"
    },

    // Surf smelt
    surfSmeltHabitatShorelineWeight: {
      value: 0.6,
      unit: "dimensionless",
      description: "Weight of shoreline integrity in surf smelt habitat (higher than sand lance)",
      source: "Penttila 2007 — surf smelt spawn on upper-beach gravel; Dethier et al. 2016 armoring directly destroys spawning substrate",
      sensitivity: "high"
    },
    surfSmeltHabitatBiWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of biodiversity in surf smelt habitat",
      source: "Calibrated — ecosystem health supports surf smelt; Penttila 2007 habitat framework",
      sensitivity: "low"
    },
    surfSmeltHabitatEelgrassWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of eelgrass in surf smelt habitat",
      source: "Calibrated — eelgrass as nursery habitat; Penttila 2007 forage fish-eelgrass habitat association",
      sensitivity: "medium"
    },
    surfSmeltGrowthRate: {
      value: 0.22,
      unit: "per year",
      description: "Surf smelt logistic growth rate",
      source: "Penttila 2007 (PSNP Rep. 2007-03) — H. pretiosus life history; year-round spawning, moderate fecundity",
      sensitivity: "high"
    },
    surfSmeltKOilPenalty: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oil spill penalty on surf smelt K: sp * 0.3",
      source: "Calibrated — oil on beach spawning habitat; Penttila 2007 upper-intertidal spawning vulnerability",
      sensitivity: "low"
    },
    surfSmeltThermalMort: {
      value: 0.12,
      unit: "dimensionless",
      description: "Thermal stress mortality weight: tS * 0.12",
      source: "Calibrated — surf smelt thermal stress; Penttila 2007 temperature sensitivity of beach-spawning embryos",
      sensitivity: "medium"
    },
    surfSmeltOilMort: {
      value: 0.4,
      unit: "dimensionless",
      description: "Oil spill mortality weight: sp * 0.4",
      source: "Calibrated — beach-spawning smelt oil vulnerability; upper-intertidal egg exposure to stranded oil",
      sensitivity: "medium"
    },

    // Combined index
    herringWeight: {
      value: 0.40,
      unit: "dimensionless",
      description: "Weight of herring in forage fish index: herring*0.40 + sandLance*0.30 + surfSmelt*0.30",
      source: "Calibrated — herring dominant forage species; Stick et al. 2014; Penttila 2007 forage fish importance hierarchy",
      sensitivity: "high"
    },
    sandLanceWeight: {
      value: 0.30,
      unit: "dimensionless",
      description: "Weight of sand lance in forage fish index",
      source: "Calibrated — sand lance as major forage pillar; Penttila 2007 three-species forage framework",
      sensitivity: "high"
    },
    surfSmeltWeight: {
      value: 0.30,
      unit: "dimensionless",
      description: "Weight of surf smelt in forage fish index",
      source: "Calibrated — surf smelt as major forage pillar; Penttila 2007 three-species forage framework",
      sensitivity: "high"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. JELLYFISH (lines 262-283)
  // ─────────────────────────────────────────────────────────────────────────────
  jellyfish: {
    name: "Jellyfish (Aurelia, Chrysaora, Cyanea spp.)",

    initialPop: {
      value: 0.15,
      unit: "index (0-1)",
      description: "Default initial jellyfish population",
      source: "Purcell 2012 (Hydrobiologia 690:153-168) — jellyfish low in healthy, fish-dominated systems",
      sensitivity: "low"
    },
    sstBase: {
      value: 10,
      unit: "deg C",
      description: "SST baseline for jellyfish thermal suitability: (SST - 10) / 8",
      source: "Purcell 2005 (J. Mar. Biol. Assoc. UK 85:461-476) — jellyfish blooms correlate with warm SST",
      sensitivity: "low"
    },
    sstRange: {
      value: 8,
      unit: "deg C",
      description: "SST range for jellyfish thermal suitability normalization",
      source: "Calibrated — SST suitability range; Purcell 2005 thermal optimum ~18°C for Aurelia spp.",
      sensitivity: "low"
    },
    nutrientDivisor: {
      value: 15,
      unit: "mg/L (nutrient concentration)",
      description: "Nutrient normalization for jellyfish: nutrientConc / 15",
      source: "Purcell 2012 (Hydrobiologia 690:153-168) — eutrophication promotes jellyfish via increased plankton food",
      sensitivity: "low"
    },
    kSSTWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of SST factor in jellyfish K",
      source: "Purcell 2005 (J. Mar. Biol. Assoc. UK 85:461-476) — warming enhances jellyfish production/feeding rates",
      sensitivity: "low"
    },
    kNutrientWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of nutrient factor in jellyfish K",
      source: "Purcell 2012 (Hydrobiologia 690:153-168) — nutrient enrichment expands jellyfish blooms",
      sensitivity: "low"
    },
    kForageGapWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of forage fish gap in jellyfish K (thrive when fish depleted)",
      source: "Richardson et al. 2009 (Trends Ecol. Evol. 24:312-322) — fish-to-jellyfish regime shift when forage fish depleted",
      sensitivity: "medium"
    },
    forageGapMaxRate: {
      value: 1.0,
      unit: "dimensionless",
      description: "Holling Type II max rate for jellyfish benefit from forage fish absence",
      source: "Holling 1959 — Type II functional response applied to jellyfish-forage competition; Richardson et al. 2009",
      sensitivity: "medium"
    },
    forageGapHalfSat: {
      value: 0.35,
      unit: "dimensionless",
      description: "Half-saturation constant for jellyfish forage gap benefit: saturates when gap = 0.35",
      source: "Holling 1959 — calibrated so benefit saturates at moderate forage fish depletion",
      sensitivity: "medium"
    },
    kRange: {
      value: [0.05, 0.9],
      unit: "index (0-1)",
      description: "Clamp range for jellyfish carrying capacity",
      source: "Calibrated — jellyfish bloom range; Purcell 2012 documented massive bloom densities in eutrophied systems",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.30,
      unit: "per year",
      description: "Jellyfish logistic growth rate (fast boom species)",
      source: "Purcell 2012 (Hydrobiologia 690:153-168) — rapid jellyfish population growth; boom-bust dynamics",
      sensitivity: "medium"
    },
    mhwGrowthBoost: {
      value: 0.5,
      unit: "dimensionless",
      description: "MHW intensity multiplier on jellyfish growth: *(1 + intensity * 0.5)",
      source: "Calibrated — MHW jellyfish blooms; Purcell 2005 — warming accelerates strobilation and polyp budding",
      sensitivity: "medium"
    },
    coldMortBase: {
      value: 0.1,
      unit: "fraction",
      description: "Cold water mortality base rate: (1 - sstFactor) * 0.1",
      source: "Calibrated — cold mortality and flushing; Purcell 2012 — jellyfish seasonally cleared by cold/currents",
      sensitivity: "low"
    },
    currentFlushRate: {
      value: 0.04,
      unit: "fraction per unit noise",
      description: "Current flushing proxy using noise index: noise * 0.04",
      source: "Calibrated — current flushing effect; tidal currents advect jellyfish out of confined basins",
      sensitivity: "low"
    },
    mortMax: {
      value: 0.15,
      unit: "fraction per quarter",
      description: "Maximum jellyfish mortality rate per quarter",
      source: "Calibrated — caps quarterly natural mortality for jellyfish; Purcell 2012 population dynamics",
      sensitivity: "low"
    },
    oilMort: {
      value: 0.1,
      unit: "fraction per unit oil spill",
      description: "Oil spill mortality: sp * 0.1 * pop * dt",
      source: "Calibrated — jellyfish relatively oil-tolerant; gelatinous body less affected than gilled organisms",
      sensitivity: "low"
    },
    forageSuppressionRate: {
      value: 0.15,
      unit: "dimensionless",
      description: "Jellyfish suppression of forage fish: pop * 0.15, max 0.10",
      source: "Purcell & Arai 2001 (Hydrobiologia 451:27-44) — jellyfish prey on fish eggs/larvae and compete for zooplankton",
      sensitivity: "medium"
    },
    forageSuppressionMax: {
      value: 0.10,
      unit: "fraction",
      description: "Maximum forage fish suppression from jellyfish",
      source: "Calibrated — caps forage displacement; Richardson et al. 2009 jellyfish-fish competition framework",
      sensitivity: "medium"
    },
    tourismPenaltyRate: {
      value: 0.08,
      unit: "dimensionless",
      description: "Jellyfish tourism penalty: pop * 0.08, max 0.05",
      source: "Calibrated — beach closures from jellyfish blooms; documented in Mediterranean and PNW coastal tourism impacts",
      sensitivity: "low"
    },
    tourismPenaltyMax: {
      value: 0.05,
      unit: "fraction",
      description: "Maximum tourism penalty from jellyfish",
      source: "Calibrated — limited tourism impact cap; jellyfish blooms are seasonal/localized in Salish Sea",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. ROCKFISH (lines 284-319)
  // ─────────────────────────────────────────────────────────────────────────────
  rockfish: {
    name: "Rockfish (Copper, Quillback, Yelloweye)",

    initialPop: {
      value: 0.08,
      unit: "index (0-1)",
      description: "Default initial rockfish population (8% of historical — severely depleted)",
      source: "Palsson et al. 2009 (WDFW Tech. Rep. FPA 09-04) — Puget Sound rockfish at <5% historical; NOAA ESA listing 2010",
      sensitivity: "medium"
    },
    doMortSevereThreshold: {
      value: 3,
      unit: "mg/L",
      description: "Deep DO below which severe rockfish mortality (0.12) occurs",
      source: "Vaquer-Sunyer & Duarte 2008 (PNAS 105:15452-15457) — deep-water fish hypoxia tolerance; rockfish demersal habitat",
      sensitivity: "medium"
    },
    doMortSevere: {
      value: 0.12,
      unit: "fraction",
      description: "Mortality rate at severe deep DO (<3 mg/L)",
      source: "Calibrated — demersal rockfish deep-water mortality; Palsson et al. 2009 habitat depth distributions",
      sensitivity: "medium"
    },
    doMortMildThreshold: {
      value: 5,
      unit: "mg/L",
      description: "Deep DO threshold for mild rockfish stress",
      source: "Palsson et al. 2009 — rockfish require >5 mg/L DO in deep habitat; WDOE water quality monitoring",
      sensitivity: "medium"
    },
    doMortMildMax: {
      value: 0.06,
      unit: "fraction",
      description: "Maximum mild DO mortality: (5 - DO)/2 * 0.06",
      source: "Calibrated — sublethal deep hypoxia interpolation; consistent with Vaquer-Sunyer & Duarte 2008 dose-response",
      sensitivity: "low"
    },
    contamWeightGeneral: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of general contamination in rockfish contam stress",
      source: "Calibrated — long-lived rockfish bioaccumulation; West et al. 2001 (Mar. Environ. Res. 52:473-489) PNW fish contaminants",
      sensitivity: "medium"
    },
    contamWeightPCB: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of PCB in rockfish contam stress",
      source: "Calibrated — PCB concentration in long-lived rockfish; West et al. 2001 Puget Sound fish tissue data",
      sensitivity: "medium"
    },
    contamStressMax: {
      value: 0.3,
      unit: "fraction",
      description: "Maximum contamination stress",
      source: "Calibrated — caps contamination stress contribution; West et al. 2001 contamination range data",
      sensitivity: "low"
    },
    protectionMax: {
      value: 0.5,
      unit: "fraction",
      description: "Maximum MPA protection level: cl(PA/100, 0, 0.5)",
      source: "Calibrated — MPA diminishing returns; NOAA Rockfish Conservation Areas effectiveness monitoring",
      sensitivity: "medium"
    },
    kProtectionScale: {
      value: 2,
      unit: "dimensionless",
      description: "MPA protection multiplier in K: rfProtection * 2 (so 0.5 -> 1.0)",
      source: "Calibrated — MPA protection multiplier; Lester et al. 2009 (Mar. Ecol. Prog. Ser. 384:33-46) reserve effects on fish",
      sensitivity: "medium"
    },
    kBaseScale: {
      value: 0.6,
      unit: "dimensionless",
      description: "Base K scaling: 0.6 * rfProtection * 2",
      source: "Calibrated — K driven by MPA coverage; Palsson et al. 2009 — rockfish recovery requires long-term area closures",
      sensitivity: "medium"
    },
    kBiWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of biodiversity in rockfish K",
      source: "Calibrated — reef ecosystem health; Palsson et al. 2009 rocky reef habitat associations",
      sensitivity: "low"
    },
    kKelpWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of bull kelp health in rockfish K",
      source: "Calibrated — kelp canopy as rockfish habitat; Love et al. 2002 'Rockfishes of the Northeast Pacific' habitat associations",
      sensitivity: "low"
    },
    kRange: {
      value: [0.02, 0.7],
      unit: "index (0-1)",
      description: "Clamp range for rockfish carrying capacity",
      source: "Calibrated — severely depleted K range; Palsson et al. 2009 stock status assessment",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.03,
      unit: "per year",
      description: "Logistic growth rate (very slow — yelloweye mature at 15-20 yr)",
      source: "Love et al. 2002 'Rockfishes of the Northeast Pacific' — yelloweye 120+ yr lifespan, maturation at 15-20 yr; r~0.03",
      sensitivity: "medium"
    },
    fishingMortScale: {
      value: 0.08,
      unit: "fraction at 100% fishing pressure",
      description: "Fishing mortality scaling: fishingPressure/100 * 0.08",
      source: "Palsson et al. 2009 — high site fidelity makes rockfish extremely vulnerable to localized fishing pressure",
      sensitivity: "medium"
    },
    bycatchBaseline: {
      value: 0.005,
      unit: "fraction per quarter",
      description: "Baseline bycatch mortality even at zero fishing pressure",
      source: "Calibrated — barotrauma bycatch mortality; Palsson et al. 2009 incidental catch in mixed-stock fisheries",
      sensitivity: "low"
    },
    fishMortMax: {
      value: 0.1,
      unit: "fraction per quarter",
      description: "Maximum total fishing mortality (bycatch + directed)",
      source: "Calibrated — fishing mortality cap; WDFW/NOAA rockfish catch limits",
      sensitivity: "low"
    },
    lingcodPredationMaxRate: {
      value: 0.025,
      unit: "fraction",
      description: "Holling Type II max predation rate of lingcod on rockfish (prey-dependent)",
      source: "Beaudreau & Essington 2007 (Can. J. Fish. Aquat. Sci. 64:1429-1442) — lingcod as apex reef predator; Holling 1959 Type II functional response",
      sensitivity: "low"
    },
    lingcodPredationHalfSat: {
      value: 0.20,
      unit: "index (0-1)",
      description: "Half-saturation constant for lingcod predation on rockfish: predation rate reaches half max when rockfish density = 0.20",
      source: "Holling 1959 — calibrated to match baseline equilibrium at prevRF ~0.08",
      sensitivity: "low"
    },
    oilMort: {
      value: 0.15,
      unit: "dimensionless",
      description: "Oil spill mortality weight: sp * 0.15",
      source: "Calibrated — deep-water rockfish less exposed to surface oil; Peterson et al. 2003 depth-dependent impacts",
      sensitivity: "low"
    },
    trophicBonusRate: {
      value: 0.10,
      unit: "dimensionless",
      description: "Rockfish trophic completeness bonus: pop * 0.10, max 0.05",
      source: "Calibrated — rockfish as reef ecosystem indicator; Palsson et al. 2009 trophic role assessment",
      sensitivity: "low"
    },
    trophicBonusMax: {
      value: 0.05,
      unit: "fraction",
      description: "Maximum trophic completeness bonus from rockfish",
      source: "Calibrated — rockfish biodiversity signal; NOAA Rockfish Recovery Plan 2017",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. LINGCOD (lines 320-338)
  // ─────────────────────────────────────────────────────────────────────────────
  lingcod: {
    name: "Lingcod (Ophiodon elongatus)",

    initialPop: {
      value: 0.30,
      unit: "index (0-1)",
      description: "Default initial lingcod population",
      source: "WDFW lingcod stock assessment — recovering since 1990s harvest restrictions; Beaudreau & Essington 2007",
      sensitivity: "low"
    },
    habitatKelpWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of bull kelp in lingcod habitat: bullKelp * 0.4",
      source: "Beaudreau & Essington 2007 (Can. J. Fish. Aquat. Sci. 64:1429-1442) — lingcod rocky reef/kelp habitat association",
      sensitivity: "low"
    },
    habitatBiWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of biodiversity in lingcod habitat",
      source: "Calibrated — ecosystem health supports lingcod; Beaudreau & Essington 2007 habitat requirements",
      sensitivity: "low"
    },
    habitatRockfishWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of rockfish population in lingcod habitat (prey availability)",
      source: "Beaudreau & Essington 2007 — rockfish are significant lingcod prey items; diet composition data",
      sensitivity: "low"
    },
    kHabitatScale: {
      value: 0.7,
      unit: "dimensionless",
      description: "Habitat scaling for lingcod K: habitat * 0.7",
      source: "Calibrated — habitat-driven K; Beaudreau & Essington 2007 small home range = habitat-limited",
      sensitivity: "low"
    },
    kPABonus: {
      value: 0.5,
      unit: "dimensionless",
      description: "PA bonus scaling for lingcod K: PA/100 * 0.5",
      source: "Calibrated — lingcod MPA response faster than rockfish due to shorter generation time; WDFW recovery monitoring",
      sensitivity: "low"
    },
    kRange: {
      value: [0.05, 0.8],
      unit: "index (0-1)",
      description: "Clamp range for lingcod carrying capacity",
      source: "Calibrated — moderate K ceiling; WDFW lingcod stock status assessments",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.10,
      unit: "per year",
      description: "Logistic growth rate (moderate — matures at 3-5 yr, faster than rockfish)",
      source: "Cass et al. 1990 (Can. Spec. Publ. Fish. Aquat. Sci. 109) — O. elongatus life history; matures 3-5 yr, lives ~20 yr",
      sensitivity: "medium"
    },
    fishingMortRate: {
      value: 0.10,
      unit: "fraction at 100% fishing pressure",
      description: "Fishing mortality: fishingPressure/100 * 0.10",
      source: "Calibrated — WDFW lingcod harvest regulations; popular recreational species with high catch rate",
      sensitivity: "medium"
    },
    thermalMort: {
      value: 0.05,
      unit: "dimensionless",
      description: "Thermal stress mortality weight: tS * 0.05",
      source: "Calibrated — lingcod moderate thermal sensitivity; Cass et al. 1990 cold-water preference data",
      sensitivity: "low"
    },
    oilMort: {
      value: 0.1,
      unit: "dimensionless",
      description: "Oil spill mortality weight: sp * 0.1",
      source: "Calibrated — moderate oil vulnerability for demersal fish; less exposed than pelagic species",
      sensitivity: "low"
    },
    rockfishPredationRate: {
      value: 0.05,
      unit: "dimensionless",
      description: "Lingcod predation on rockfish (natural top-down): lingcod * 0.05, max 0.03",
      source: "Beaudreau & Essington 2007 — lingcod diet includes rockfish; modest predation maintains reef trophic structure",
      sensitivity: "low"
    },
    rockfishPredationMax: {
      value: 0.03,
      unit: "fraction",
      description: "Maximum lingcod-to-rockfish predation effect",
      source: "Calibrated — caps lingcod-rockfish predation; Beaudreau & Essington 2007 diet composition bounds",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. MARBLED MURRELET (lines 340-360)
  // ─────────────────────────────────────────────────────────────────────────────
  murrelet: {
    name: "Marbled Murrelet (Brachyramphus marmoratus)",

    initialPop: {
      value: 0.25,
      unit: "index (0-1)",
      description: "Default initial murrelet population (~25% of historical)",
      source: "Raphael et al. 2015 (USDA Forest Service Gen. Tech. Rep. PNW-GTR-933) — 29% population decline 2002-2010; WA 4.6%/yr decline",
      sensitivity: "low"
    },
    nestingPAWeight: {
      value: 1.2,
      unit: "dimensionless",
      description: "Protected area weight in nesting habitat: PA/100 * 1.2",
      source: "Raphael et al. 2015 — nesting habitat concentrated on federal lands; 27% nonfederal habitat lost to harvest",
      sensitivity: "medium"
    },
    nestingBiWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Biodiversity weight in nesting habitat: bi * 0.3",
      source: "Calibrated — ecosystem integrity supports nesting; Raphael et al. 2015 multi-scale habitat analysis",
      sensitivity: "low"
    },
    nestingWildfireWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Wildfire penalty on nesting: wildfire * 0.5",
      source: "Raphael et al. 2015 — fire is major cause of nesting habitat loss on federal lands",
      sensitivity: "low"
    },
    nestingVolcanoWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Volcano penalty on nesting: volcano * 0.3",
      source: "Calibrated — volcanic disturbance destroys old-growth; Mt. St. Helens 1980 forest impacts",
      sensitivity: "low"
    },
    nestingMax: {
      value: 0.8,
      unit: "index (0-1)",
      description: "Maximum nesting habitat quality",
      source: "Calibrated — old-growth recovery takes 150+ years; Raphael et al. 2015 nesting habitat trajectory",
      sensitivity: "low"
    },
    foragingSandLanceWeight: {
      value: 0.40,
      unit: "dimensionless",
      description: "Weight of sand lance in murrelet foraging: sandLance * 0.40",
      source: "Burkett et al. 2003 — sand lance is primary murrelet prey in nearshore waters; diet studies from WA/BC",
      sensitivity: "medium"
    },
    foragingHerringWeight: {
      value: 0.30,
      unit: "dimensionless",
      description: "Weight of herring in murrelet foraging",
      source: "Calibrated — herring secondary murrelet prey; Burkett et al. 2003 diet composition",
      sensitivity: "medium"
    },
    foragingSurfSmeltWeight: {
      value: 0.20,
      unit: "dimensionless",
      description: "Weight of surf smelt in murrelet foraging",
      source: "Calibrated — surf smelt tertiary murrelet prey; Burkett et al. 2003 diet studies",
      sensitivity: "low"
    },
    foragingBiWeight: {
      value: 0.10,
      unit: "dimensionless",
      description: "Weight of biodiversity in murrelet foraging",
      source: "Calibrated — ecosystem-prey coupling; general forage base supports murrelet foraging",
      sensitivity: "low"
    },
    oilMort: {
      value: 0.8,
      unit: "dimensionless",
      description: "Oil spill mortality multiplier: sp * 0.8 (catastrophic — sits on water)",
      source: "Piatt et al. 1990 — alcids/murrelets among most oil-vulnerable seabirds; sit on water surface",
      sensitivity: "medium"
    },
    reproductionNestingWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of nesting in reproduction: nesting * 0.5",
      source: "Calibrated — single-egg clutch; Nelson 1997 murrelet life history — nesting + foraging both required",
      sensitivity: "low"
    },
    reproductionForagingWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of foraging in reproduction: foraging * 0.5",
      source: "Calibrated — biparental chick provisioning; Nelson 1997 murrelet breeding ecology",
      sensitivity: "low"
    },
    kNestingWeight: {
      value: 0.6,
      unit: "dimensionless",
      description: "Weight of nesting in murrelet K: nesting * 0.6",
      source: "Raphael et al. 2015 — nesting habitat loss is primary limiter of murrelet carrying capacity",
      sensitivity: "medium"
    },
    kForagingWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of foraging in murrelet K: foraging * 0.4",
      source: "Calibrated — foraging as secondary K limiter; Norris et al. 2007 murrelet prey availability model",
      sensitivity: "medium"
    },
    kMax: {
      value: 0.6,
      unit: "index (0-1)",
      description: "Maximum murrelet carrying capacity",
      source: "Calibrated — permanent K limitation from old-growth loss; Raphael et al. 2015",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.05,
      unit: "per year",
      description: "Logistic growth rate (slow — single-egg clutch)",
      source: "Nelson 1997 'The Marbled Murrelet'; Beissinger 1995 — single-egg clutch, slow growth r~0.05",
      sensitivity: "medium"
    },
    thermalMort: {
      value: 0.08,
      unit: "dimensionless",
      description: "Thermal stress mortality weight: tS * 0.08",
      source: "Calibrated — indirect thermal stress via prey base collapse; MHW impacts on forage fish availability",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. SEABIRDS aggregate (lines 362-372)
  // ─────────────────────────────────────────────────────────────────────────────
  seabirds: {
    name: "Seabirds (aggregate: auklet, guillemot, etc.)",

    forageWeight: {
      value: 0.55,
      unit: "dimensionless",
      description: "Weight of forage fish in seabird foraging: forageFish * 0.55",
      source: "Calibrated — forage fish as primary seabird prey; Piatt et al. 2007 (Prog. Oceanogr. 73:217-223) seabird-forage coupling",
      sensitivity: "medium"
    },
    forageZooWeight: {
      value: 0.15,
      unit: "dimensionless",
      description: "Weight of zooplankton in seabird foraging: zoo/600 * 0.15",
      source: "Calibrated — auklets feed directly on zooplankton; Piatt et al. 2007 seabird diet composition",
      sensitivity: "low"
    },
    forageBiWeight: {
      value: 0.1,
      unit: "dimensionless",
      description: "Weight of biodiversity in seabird foraging: bi * 0.1",
      source: "Calibrated — ecosystem-seabird coupling; Piatt et al. 2007 bottom-up ecosystem effects on seabirds",
      sensitivity: "low"
    },
    visibilityTurbidityDivisor: {
      value: 30,
      unit: "NTU",
      description: "Turbidity normalization for diving visibility: turbidity/30",
      source: "Calibrated — diving seabird visibility; turbidity affects foraging success of pursuit-diving species",
      sensitivity: "low"
    },
    visibilityFiltrationWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oyster filtration bonus to visibility: filtration * 0.3",
      source: "Calibrated — oyster filtration improves water clarity; Coen et al. 2007 ecosystem services benefit seabird foraging",
      sensitivity: "low"
    },
    visibilityFloor: {
      value: 0.2,
      unit: "index (0-1)",
      description: "Minimum visibility for seabirds",
      source: "Calibrated — some foraging possible in turbid water",
      sensitivity: "low"
    },
    nestingEelgrassWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of eelgrass in seabird nesting: eelgrass * 0.3",
      source: "Calibrated — eelgrass indicates shoreline habitat quality",
      sensitivity: "low"
    },
    nestingPAWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of PA in seabird nesting: PA/100 * 0.5",
      source: "Calibrated — protected nesting colonies; Speich & Wahl 1989 colonial seabird nesting site surveys in WA",
      sensitivity: "low"
    },
    nestingBiWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of biodiversity in seabird nesting: bi * 0.2",
      source: "Calibrated — general ecosystem health proxy; Halpern et al. 2008 (Science 319:948-952) cumulative impacts framework",
      sensitivity: "low"
    },
    generalForageWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of foraging in general seabird index",
      source: "Calibrated — foraging is primary driver",
      sensitivity: "medium"
    },
    generalVisibilityWeight: {
      value: 0.25,
      unit: "dimensionless",
      description: "Weight of visibility in general seabird index",
      source: "Calibrated — water clarity affects diving success",
      sensitivity: "low"
    },
    generalNestingWeight: {
      value: 0.25,
      unit: "dimensionless",
      description: "Weight of nesting in general seabird index",
      source: "Calibrated — nesting habitat availability",
      sensitivity: "low"
    },
    oilMort: {
      value: 0.7,
      unit: "dimensionless",
      description: "Oil spill mortality (general seabirds): sp * 0.7",
      source: "Piatt et al. 1990 — seabirds among most oil-vulnerable taxa; surface-sitting species suffer catastrophic mortality",
      sensitivity: "medium"
    },
    volcanoPenalty: {
      value: 0.2,
      unit: "dimensionless",
      description: "Volcano penalty on seabird general: volcano * 0.2",
      source: "Calibrated — ash affects visibility and nesting",
      sensitivity: "low"
    },
    compositeGeneralWeight: {
      value: 0.6,
      unit: "dimensionless",
      description: "Weight of general seabirds in composite index: general*0.6 + murrelet*0.4",
      source: "Calibrated — murrelet is explicitly modeled, others aggregated",
      sensitivity: "low"
    },
    compositeMurreletWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of murrelet in composite seabird index",
      source: "Calibrated — threatened species gets explicit weight",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. DUNGENESS CRAB (lines 374-402)
  // ─────────────────────────────────────────────────────────────────────────────
  dungenessCrab: {
    name: "Dungeness Crab (Metacarcinus magister)",

    initialPop: {
      value: 0.65,
      unit: "index (0-1)",
      description: "Default initial Dungeness crab population",
      source: "WDFW Dungeness crab fishery management data — healthy commercial population ~$250M/yr fishery",
      sensitivity: "low"
    },
    doMortSevereThreshold: {
      value: 2,
      unit: "mg/L",
      description: "DO below which severe crab mortality (0.3) occurs",
      source: "Bernatis et al. 2007 (Mar. Ecol. Prog. Ser. 341:173-184) — Dungeness crab hypoxia tolerance LC50 data",
      sensitivity: "medium"
    },
    doMortSevere: {
      value: 0.3,
      unit: "fraction",
      description: "Mortality rate at severe hypoxia (<2 mg/L)",
      source: "Calibrated — severe crab hypoxia mortality; Bernatis et al. 2007 LC50 at ~1.5-2 mg/L DO",
      sensitivity: "medium"
    },
    doMortMildThreshold: {
      value: 4,
      unit: "mg/L",
      description: "DO threshold for mild crab stress",
      source: "Bernatis et al. 2007 (Mar. Ecol. Prog. Ser. 341:173-184) — sublethal DO effects on Dungeness crab",
      sensitivity: "medium"
    },
    doMortMildMax: {
      value: 0.15,
      unit: "fraction",
      description: "Maximum mild DO mortality: (4 - DO)/2 * 0.15",
      source: "Calibrated — sublethal hypoxia interpolation; Bernatis et al. 2007",
      sensitivity: "low"
    },
    omegaSevereThreshold: {
      value: 1.0,
      unit: "omega_aragonite",
      description: "Omega below which severe shell stress (0.25) occurs",
      source: "Bednaršek et al. 2020 (Sci. Total Environ. 716:136610) — Dungeness larval shell dissolution at omega <1.0",
      sensitivity: "medium"
    },
    omegaSevereMort: {
      value: 0.25,
      unit: "fraction",
      description: "Shell stress at severe omega (<1.0)",
      source: "Calibrated — shell formation failure; Bednaršek et al. 2020 — mechanoreceptor damage at low omega",
      sensitivity: "medium"
    },
    omegaMildThreshold: {
      value: 1.5,
      unit: "omega_aragonite",
      description: "Omega threshold for mild shell stress",
      source: "Bednaršek et al. 2020 (Sci. Total Environ. 716:136610) — sublethal shell impairment begins at omega ~1.5",
      sensitivity: "medium"
    },
    omegaMildMax: {
      value: 0.12,
      unit: "fraction",
      description: "Maximum mild omega stress: (1.5 - omega)/0.5 * 0.12",
      source: "Calibrated — sublethal shell stress interpolation; Bednaršek et al. 2020 dose-response data",
      sensitivity: "medium"
    },
    juvHabitatEelgrassWeight: {
      value: 0.6,
      unit: "dimensionless",
      description: "Weight of eelgrass in juvenile crab habitat: eelgrass * 0.6",
      source: "McMillan et al. 1995 (Mar. Ecol. Prog. Ser. 127:195-206) — eelgrass beds are primary Dungeness crab juvenile nursery",
      sensitivity: "medium"
    },
    juvHabitatBiWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of biodiversity in juvenile crab habitat: bi * 0.4",
      source: "Calibrated — general ecosystem health supports juvenile crab survival; McMillan et al. 1995",
      sensitivity: "low"
    },
    greenCrabPredationMaxRate: {
      value: 0.22,
      unit: "fraction",
      description: "Holling Type II max predation rate of green crab on juvenile Dungeness (saturates due to territorial interference)",
      source: "Grosholz et al. 2011 (Ecol. Appl. 21:915-924); Holling 1959 Type II functional response",
      sensitivity: "medium"
    },
    greenCrabPredationHalfSat: {
      value: 0.15,
      unit: "index (0-1)",
      description: "Half-saturation constant for green crab predation on Dungeness: predation reaches half max at green crab density = 0.15",
      source: "Holling 1959 — calibrated to match baseline green crab pressure (~0.003 density)",
      sensitivity: "medium"
    },
    kShellStressWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of shell stress on K reduction: shellStress * 0.5",
      source: "Calibrated — shell stress reduces recruitment; Bednaršek et al. 2020 larval survival implications",
      sensitivity: "low"
    },
    kRange: {
      value: [0.1, 1.0],
      unit: "index (0-1)",
      description: "Clamp range for crab carrying capacity",
      source: "Calibrated — prolific species; 2.5M eggs/female, high recruitment potential; WDFW management data",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.18,
      unit: "per year",
      description: "Logistic growth rate (prolific — 2.5M eggs/female, 3yr to legal size)",
      source: "Calibrated — growth rate stabilizes model near observed catch levels; WDFW Dungeness crab stock assessments",
      sensitivity: "medium"
    },
    oilMort: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oil spill mortality weight: sp * 0.3",
      source: "Calibrated — nearshore crab oil exposure; Pearson et al. 1999 oil spill impacts on Dungeness crab",
      sensitivity: "low"
    },
    otterPredation: {
      value: 0.20,
      unit: "fraction at max otter density",
      description: "Sea otter predation on crab: otterPop * 0.20",
      source: "Tinker et al. 2008 (Ecol. Monogr. 78:615-634) — Dungeness crab in sea otter diet; USFWS feasibility study 2022",
      sensitivity: "medium"
    },
    harvestThreshold: {
      value: 0.3,
      unit: "index (0-1)",
      description: "Minimum stock threshold before commercial harvest",
      source: "Calibrated — WDFW Dungeness crab harvest management minimum stock threshold",
      sensitivity: "low"
    },
    harvestRate: {
      value: 0.15,
      unit: "fraction per quarter at 100% fishing",
      description: "Crab harvest rate",
      source: "WDFW Dungeness crab fishery management — ~$250M/yr PNW commercial fishery harvest rates",
      sensitivity: "medium"
    },
    revenueScale: {
      value: 800,
      unit: "$M scaling factor",
      description: "Revenue per unit crab harvest: harvest * 800",
      source: "WDFW/ODFW Dungeness crab fishery reports — PNW fishery ~$250M/yr commercial value",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. PINNIPEDS (lines 404-415)
  // ─────────────────────────────────────────────────────────────────────────────
  pinnipeds: {
    name: "Pinnipeds (Harbor Seals & Steller Sea Lions)",

    initialPop: {
      value: 40000,
      unit: "individuals",
      description: "Default initial pinniped population",
      source: "Jeffries et al. 2003 (Can. J. Zool. 81:2097-2107); Pearson et al. 2025 (Mar. Mamm. Sci.) — ~13,000 inland stock",
      sensitivity: "low"
    },
    initialTrend: {
      value: 0.02,
      unit: "per year",
      description: "Default initial population growth trend",
      source: "Jeffries et al. 2003 — 6% annual growth rate 1972-1996 under MMPA protection",
      sensitivity: "low"
    },
    carryingCapacity: {
      value: 65000,
      unit: "individuals",
      description: "Pinniped carrying capacity",
      source: "Jeffries et al. 2003; NOAA MMSAR 2023 — Salish Sea carrying capacity estimates from haul-out surveys",
      sensitivity: "medium"
    },
    popMin: {
      value: 5000,
      unit: "individuals",
      description: "Minimum pinniped population floor",
      source: "Calibrated — MMPA prevents collapse below this",
      sensitivity: "low"
    },
    popMax: {
      value: 100000,
      unit: "individuals",
      description: "Maximum pinniped population ceiling",
      source: "Calibrated — upper bound",
      sensitivity: "low"
    },
    predationMaxRate: {
      value: 0.25,
      unit: "fraction",
      description: "Holling Type II max predation rate for pinniped excess above baseline (saturates at high pinniped density)",
      source: "Calibrated — Holling 1959 Type II functional response applied to pinniped-salmon interaction",
      sensitivity: "high"
    },
    predationHalfSat: {
      value: 0.5,
      unit: "dimensionless",
      description: "Half-saturation constant for pinniped predation on salmon: predation reaches half max when excess ratio = 0.5",
      source: "Holling 1959 — calibrated to match baseline pinniped population at ~40k (excess = 0, no predation)",
      sensitivity: "high"
    },
    predationScale: {
      value: 0.35,
      unit: "dimensionless",
      description: "Scaling factor applied after Holling II response: hollingII(excess, 0.25, 0.5) * 0.35",
      source: "Calibrated — controls pinniped -> salmon predation coupling",
      sensitivity: "high"
    },
    predationMax: {
      value: 0.25,
      unit: "fraction",
      description: "Maximum additional salmon mortality from pinnipeds (clamp cap)",
      source: "Calibrated — caps pinniped predation impact",
      sensitivity: "high"
    },
    competitionScale: {
      value: 0.15,
      unit: "fraction",
      description: "Maximum orca prey competition: pinnPop/80000, max 0.15",
      source: "Calibrated — pinnipeds compete with orca for salmon",
      sensitivity: "high"
    },
    competitionDivisor: {
      value: 80000,
      unit: "individuals",
      description: "Population divisor for orca competition: pinnPop/80000",
      source: "Calibrated — normalizes pinniped population to competition index",
      sensitivity: "medium"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 17. SEA OTTER (lines 417-434)
  // ─────────────────────────────────────────────────────────────────────────────
  seaOtter: {
    name: "Sea Otter (Enhydra lutris)",

    initialPop: {
      value: 0,
      unit: "index (0-1)",
      description: "Default initial sea otter population (extirpated from WA ~1910)",
      source: "WDFW 2004 Sea Otter Recovery Plan — extirpated from WA by 1910 fur trade; reintroduced to outer coast 1969-70",
      sensitivity: "low"
    },
    reintroThresholdPA: {
      value: 0.25,
      unit: "fraction (25% PA)",
      description: "Protected area fraction threshold to trigger reintroduction signal",
      source: "Calibrated — reintro trigger; USFWS 2022 Sea Otter Reintroduction Feasibility Assessment — substantial habitat protection prerequisite",
      sensitivity: "medium"
    },
    reintroRampMax: {
      value: 0.5,
      unit: "fraction PA",
      description: "PA fraction at which reintro signal reaches 1.0 (50% PA)",
      source: "Calibrated — full reintro signal; USFWS 2022 feasibility conditions",
      sensitivity: "low"
    },
    kReintroScale: {
      value: 0.4,
      unit: "dimensionless",
      description: "Reintro signal scaling for otter K: reintro * 0.4 * bullKelp",
      source: "Estes & Palmisano 1974 (Science 185:1058-1060) — kelp forest extent limits otter K; Salomon et al. 2010",
      sensitivity: "medium"
    },
    kMax: {
      value: 0.5,
      unit: "index (0-1)",
      description: "Maximum sea otter population density",
      source: "Calibrated — K limited by kelp forest extent; WDFW 2004 Recovery Plan population targets",
      sensitivity: "low"
    },
    kOilPenalty: {
      value: 0.5,
      unit: "dimensionless",
      description: "Oil spill penalty on otter K: sp * 0.5",
      source: "Calibrated — oil catastrophic for otter habitat; Bodkin et al. 2002 (PNAS 99:18110-18115) Exxon Valdez long-term impacts",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.05,
      unit: "per year",
      description: "Logistic growth rate (~5%/yr in new territory)",
      source: "WDFW 2004 Recovery Plan — WA outer coast population growing 7.6%/yr since 1991; ~5% conservative for new territory",
      sensitivity: "medium"
    },
    seedPop: {
      value: 0.02,
      unit: "fraction of reintro signal",
      description: "Minimum seed population for colonization: reintroSignal * 0.02",
      source: "Calibrated — ensures colonization can start",
      sensitivity: "low"
    },
    oilMort: {
      value: 0.9,
      unit: "dimensionless",
      description: "Oil spill mortality: sp * 0.9 (devastating — lose insulation -> hypothermia)",
      source: "Bodkin et al. 2002 (PNAS 99:18110-18115) — Exxon Valdez killed ~1,000-5,500 otters; fur oiling = hypothermia",
      sensitivity: "medium"
    },
    crabPredationRate: {
      value: 0.20,
      unit: "dimensionless",
      description: "Otter predation on Dungeness crab: otterPop * 0.20, max 0.10",
      source: "Tinker et al. 2008 (Ecol. Monogr. 78:615-634) — otter crab consumption rates; USFWS 2022 fishery conflict analysis",
      sensitivity: "medium"
    },
    crabPredationMax: {
      value: 0.10,
      unit: "fraction",
      description: "Maximum otter predation effect on crab",
      source: "Calibrated — caps otter-fishery conflict; USFWS 2022 sea otter reintroduction stakeholder impact analysis",
      sensitivity: "low"
    },
    geoduckPredationRate: {
      value: 0.15,
      unit: "dimensionless",
      description: "Otter predation on geoduck: otterPop * 0.15, max 0.08",
      source: "Tinker et al. 2008 (Ecol. Monogr. 78:615-634) — otter diet includes geoduck; Kvitek et al. 1993 burrowing prey excavation",
      sensitivity: "medium"
    },
    geoduckPredationMax: {
      value: 0.08,
      unit: "fraction",
      description: "Maximum otter predation effect on geoduck",
      source: "Calibrated — caps otter-fishery conflict; USFWS 2022 sea otter reintroduction stakeholder impact analysis",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 18. HARBOR PORPOISE (lines 436-448)
  // ─────────────────────────────────────────────────────────────────────────────
  porpoise: {
    name: "Harbor Porpoise (Phocoena phocoena)",

    initialPop: {
      value: 0.55,
      unit: "index (0-1)",
      description: "Default initial porpoise population",
      source: "NOAA MMSAR 2023 — Washington Inland Waters stock ~10,000 individuals; Pearson & Jeffries surveys",
      sensitivity: "low"
    },
    forageFFWeight: {
      value: 0.6,
      unit: "dimensionless",
      description: "Weight of forage fish in porpoise foraging: forageFish * 0.6",
      source: "Calibrated — forage fish as primary porpoise prey; Nichol et al. 2013 diet studies in BC waters",
      sensitivity: "medium"
    },
    forageZooWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of zooplankton in porpoise foraging: zoo/600 * 0.2",
      source: "Calibrated — euphausiids in porpoise diet; Nichol et al. 2013 diet composition data",
      sensitivity: "low"
    },
    forageBiWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of biodiversity in porpoise foraging: bi * 0.2",
      source: "Calibrated — ecosystem-porpoise coupling; general prey base availability",
      sensitivity: "low"
    },
    noiseThreshold: {
      value: 0.3,
      unit: "index (0-1)",
      description: "Noise threshold for porpoise displacement (more sensitive than orca)",
      source: "Dyndo et al. 2015 (Proc. R. Soc. B 282:20150838) — porpoises react to low vessel noise at >1000m; Wisniewska et al. 2018",
      sensitivity: "medium"
    },
    noiseFlightScale: {
      value: 2,
      unit: "dimensionless",
      description: "Noise flight scaling above threshold: (noise - 0.3) * 2",
      source: "Calibrated — strong flight response; Dyndo et al. 2015 stereotyped avoidance behavior to vessel passages",
      sensitivity: "medium"
    },
    noiseFlightMax: {
      value: 0.5,
      unit: "fraction",
      description: "Maximum displacement fraction from noise",
      source: "Wisniewska et al. 2018 (Proc. R. Soc. B 285:20172314) — high noise disrupts foraging; up to 50% habitat abandonment",
      sensitivity: "medium"
    },
    kForageScale: {
      value: 0.8,
      unit: "dimensionless",
      description: "Forage scaling for porpoise K: forage * (1 - noiseFlight) * 0.8",
      source: "Calibrated — forage-noise driven K; consistent with Dyndo et al. 2015 habitat quality framework",
      sensitivity: "low"
    },
    kRange: {
      value: [0.05, 0.8],
      unit: "index (0-1)",
      description: "Clamp range for porpoise carrying capacity",
      source: "Calibrated — moderate K ceiling; NOAA MMSAR stock abundance estimates",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.06,
      unit: "per year",
      description: "Logistic growth rate",
      source: "Read & Hohn 1995 (Can. J. Fish. Aquat. Sci. 52:1-12) — P. phocoena life history; short-lived (8-12 yr), early maturation",
      sensitivity: "medium"
    },
    oilMort: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oil spill mortality weight: sp * 0.3",
      source: "Calibrated — moderate oil vulnerability for small cetaceans; NOAA marine mammal oil response protocols",
      sensitivity: "low"
    },
    noiseDisplacementMort: {
      value: 0.05,
      unit: "dimensionless",
      description: "Mortality from noise displacement: noiseFlight * 0.05",
      source: "Calibrated — displacement energetic cost; Wisniewska et al. 2018 — noise reduces foraging efficiency causing chronic stress",
      sensitivity: "low"
    },
    bycatchRate: {
      value: 0.02,
      unit: "fraction at 100% fishing pressure",
      description: "Bycatch mortality: fishingPressure/100 * 0.02",
      source: "NOAA MMSAR 2023 — harbor porpoise gillnet bycatch documented in WA/OR fisheries; Read et al. 2006",
      sensitivity: "medium"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 19. PACIFIC LAMPREY (lines 450-471)
  // ─────────────────────────────────────────────────────────────────────────────
  lamprey: {
    name: "Pacific Lamprey (Entosphenus tridentatus)",

    initialPop: {
      value: 0.20,
      unit: "index (0-1)",
      description: "Default initial lamprey population",
      source: "Luzier et al. 2011 (USFWS Pacific Lamprey Assessment) — severely depleted across range",
      sensitivity: "low"
    },
    passageFishLadderFraction: {
      value: 0.60,
      unit: "fraction",
      description: "Fraction of fish passage investment effective for lamprey (needs smooth ramps, not stepped ladders)",
      source: "Luzier et al. 2011 — lamprey cannot navigate stepped salmon ladders; require smooth-walled ramps",
      sensitivity: "medium"
    },
    passageBonusScale: {
      value: 0.20,
      unit: "dimensionless",
      description: "Passage bonus scaling: passageFrac * 0.60 * 0.20 = up to +0.12",
      source: "Calibrated — passage investment effectiveness; Luzier et al. 2011 lamprey-specific passage design recommendations",
      sensitivity: "medium"
    },
    passagePAWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of PA in lamprey passage: PA/100 * 0.3",
      source: "Calibrated — protected areas include passage improvements",
      sensitivity: "low"
    },
    passageCoMgmtWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of co-management in lamprey passage: coMgmt/100 * 0.4",
      source: "Wang & Schaller 2015 (Fisheries 40:72-79) — Pacific Lamprey Conservation Initiative; tribal-led restoration",
      sensitivity: "medium"
    },
    passageBiWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of biodiversity in lamprey passage: bi * 0.2",
      source: "Calibrated — general ecosystem health proxy; Halpern et al. 2008 (Science 319:948-952) cumulative impacts framework",
      sensitivity: "low"
    },
    passageMax: {
      value: 0.7,
      unit: "index (0-1)",
      description: "Maximum lamprey passage quality",
      source: "Calibrated — barriers never fully removed",
      sensitivity: "low"
    },
    larvalHabTurbidityWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Turbidity impact on larval habitat: turbidity/25 * 0.3",
      source: "Calibrated — larvae need clean sediment",
      sensitivity: "low"
    },
    larvalHabTurbidityDivisor: {
      value: 25,
      unit: "NTU",
      description: "Turbidity normalization for larval habitat",
      source: "Calibrated — lamprey larval turbidity sensitivity; Luzier et al. 2011 habitat requirements",
      sensitivity: "low"
    },
    larvalHabContamWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Contamination impact on larval habitat",
      source: "Calibrated — filter-feeding larvae accumulate contaminants",
      sensitivity: "low"
    },
    larvalHabRange: {
      value: [0.1, 0.8],
      unit: "index (0-1)",
      description: "Clamp range for larval habitat quality",
      source: "Calibrated — larvae can persist in degraded conditions",
      sensitivity: "low"
    },
    tempStressThreshold: {
      value: 14,
      unit: "deg C",
      description: "SST threshold above which lamprey thermal stress begins",
      source: "Luzier et al. 2011 — E. tridentatus thermal stress above 14°C; temperature vulnerability assessment",
      sensitivity: "low"
    },
    tempStressRange: {
      value: 6,
      unit: "deg C",
      description: "SST range above 14 over which thermal stress scales: (SST-14)/6 * 0.15",
      source: "Calibrated — gradual thermal stress onset",
      sensitivity: "low"
    },
    tempStressMax: {
      value: 0.15,
      unit: "fraction",
      description: "Maximum thermal stress for lamprey",
      source: "Calibrated — caps thermal mortality",
      sensitivity: "low"
    },
    kPassageWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of passage in lamprey K: passage * 0.5",
      source: "Calibrated — passage is primary K limiter",
      sensitivity: "medium"
    },
    kLarvalWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of larval habitat in lamprey K: larvalHab * 0.5",
      source: "Calibrated — larval habitat equally important",
      sensitivity: "medium"
    },
    kRange: {
      value: [0.02, 0.6],
      unit: "index (0-1)",
      description: "Clamp range for lamprey carrying capacity",
      source: "Calibrated — limited by passage and habitat",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.06,
      unit: "per year",
      description: "Logistic growth rate",
      source: "Luzier et al. 2011 (USFWS Assessment) — E. tridentatus 7-year life cycle; slow population growth r~0.06",
      sensitivity: "medium"
    },
    oilMort: {
      value: 0.2,
      unit: "dimensionless",
      description: "Oil spill mortality weight: sp * 0.2",
      source: "Calibrated — lamprey moderately affected by oil",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 20. SALMON (lines 473-536)
  // ─────────────────────────────────────────────────────────────────────────────
  salmon: {
    name: "Multi-Stock Salmon Cohorts (Chinook, Coho, Chum, Pink, Sockeye)",

    hatcheryCompetition: {
      value: 0.15,
      unit: "fraction",
      description: "Hatchery fish compete for spawning habitat, reducing wild capacity: hatchFrac * 0.15",
      source: "Chilcote et al. 2011 (Can. J. Fish. Aquat. Sci. 68:1153-1167) — hatchery-wild competition reduces wild productivity",
      sensitivity: "high"
    },
    geneticFitnessReduction: {
      value: 0.10,
      unit: "fraction per unit hatchery",
      description: "Genetic fitness reduction from interbreeding: hatchFrac * 0.10",
      source: "Araki et al. 2007 (Science 318:100-103) — hatchery fish fitness 40% lower than wild after one generation",
      sensitivity: "high"
    },
    geneticFitnessFloor: {
      value: 0.7,
      unit: "dimensionless",
      description: "Minimum genetic fitness (prevents total fitness collapse)",
      source: "Calibrated — some wild fitness persists even with high hatchery fraction",
      sensitivity: "medium"
    },
    oceanSurvStressWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of totalStress on ocean survival: totalStress * 0.3",
      source: "Calibrated — controls stress -> ocean survival coupling",
      sensitivity: "high"
    },
    oceanSurvOilWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of oil spill on ocean survival: sp * 0.4",
      source: "Calibrated — oil reduces ocean survival",
      sensitivity: "high"
    },
    oceanSurvHCDOThreshold: {
      value: 4,
      unit: "mg/L",
      description: "Hood Canal DO below which ocean survival reduced by 0.15",
      source: "Calibrated — HC hypoxia kills migrating smolts",
      sensitivity: "high"
    },
    oceanSurvHCDOPenalty: {
      value: 0.15,
      unit: "fraction",
      description: "Ocean survival penalty when HC DO < 4",
      source: "Calibrated — HC is a bottleneck basin",
      sensitivity: "high"
    },
    oceanSurvMBDOThreshold: {
      value: 5,
      unit: "mg/L",
      description: "Main Basin DO below which ocean survival reduced by 0.10",
      source: "Calibrated — Main Basin hypoxia affects salmon",
      sensitivity: "medium"
    },
    oceanSurvMBDOPenalty: {
      value: 0.1,
      unit: "fraction",
      description: "Ocean survival penalty when MB DO < 5",
      source: "Calibrated — Main Basin less severe than HC",
      sensitivity: "medium"
    },
    oceanSurvHerringBonus: {
      value: 0.1,
      unit: "fraction",
      description: "Herring population bonus to ocean survival: herring * 0.1",
      source: "Calibrated — forage fish availability helps salmon growth",
      sensitivity: "high"
    },
    oceanSurvMHWPenalty: {
      value: 0.20,
      unit: "fraction per unit MHW intensity",
      description: "MHW ocean survival penalty: intensity * 0.20",
      source: "Calibrated — nonlinear ocean survival crash during MHW",
      sensitivity: "high"
    },
    oceanSurvRange: {
      value: [0.1, 0.95],
      unit: "fraction",
      description: "Clamp range for ocean survival",
      source: "Calibrated — prevents extinction or unrealistic survival",
      sensitivity: "medium"
    },
    avianPredation: {
      value: 0.05,
      unit: "fraction",
      description: "Fixed avian predation rate (Caspian terns, cormorants at river mouths)",
      source: "Collis et al. 2002 (N. Am. J. Fish. Manag. 22:466-479) — Caspian tern/cormorant predation on salmon smolts",
      sensitivity: "medium"
    },
    compensatoryOverlap: {
      value: 0.4,
      unit: "fraction",
      description: "Compensatory mortality overlap factor: at 100% compensatory, 40% less effective total predation",
      source: "Calibrated — high compensatory means predators are interchangeable",
      sensitivity: "medium"
    },
    riverSurvFishingWeight: {
      value: 0.3,
      unit: "fraction at 100% fishing",
      description: "Fishing pressure weight on river survival: fishingPressure/100 * 0.3",
      source: "Calibrated — fishing reduces river-stage survival",
      sensitivity: "high"
    },
    riverSurvRange: {
      value: [0.1, 0.9],
      unit: "fraction",
      description: "Clamp range for river survival",
      source: "Calibrated — prevents extinction or unrealistic survival",
      sensitivity: "medium"
    },
    seasonalPeakWidth: {
      value: 5,
      unit: "dimensionless",
      description: "Width parameter for seasonal spawning peak Gaussian: exp(-(yf - peak)^2 * 25)",
      source: "Calibrated — controls sharpness of spawning season",
      sensitivity: "low"
    },
    pinkBroodAmplitude: {
      value: 0.3,
      unit: "dimensionless",
      description: "Pink salmon 2-year brood cycle amplitude: cos * 0.3",
      source: "Heard 1991 'Life History of Pink Salmon' — obligate 2-year brood cycle with strong even/odd year variation",
      sensitivity: "low"
    },
    hatcheryEfficiency: {
      value: 0.9,
      unit: "fraction",
      description: "Hatchery spawning efficiency relative to wild: hatchFrac * 0.9",
      source: "Calibrated — hatchery supplementation is 90% effective",
      sensitivity: "medium"
    },
    genDivHatcheryLoss: {
      value: 0.02,
      unit: "per year",
      description: "Genetic diversity loss rate from hatchery straying: hatchFrac * strayRate * 0.02",
      source: "Araki et al. 2007 (Science 318:100-103); Ford 2002 (Conserv. Biol. 16:1557-1569) — genetic introgression from hatchery straying",
      sensitivity: "high"
    },
    genDivWildRecovery: {
      value: 0.005,
      unit: "per year",
      description: "Genetic diversity recovery rate in wild populations: (1-hatchFrac) * 0.005",
      source: "Ford 2002 (Conserv. Biol. 16:1557-1569) — very slow natural genetic recovery; requires many generations",
      sensitivity: "medium"
    },
    genDivRange: {
      value: [0.3, 1.0],
      unit: "index (0-1)",
      description: "Clamp range for genetic diversity",
      source: "Calibrated — minimum viable genetic diversity at 0.3",
      sensitivity: "high"
    },
    runIndexDivisor: {
      value: 80,
      unit: "return units",
      description: "Salmon run index divisor: totalReturn / 80 gives 0-100 index",
      source: "Calibrated — matches WDFW 2024 salmon run index ~48/100; Puget Sound salmon stock assessment data",
      sensitivity: "medium"
    },
    fishPassageBonus: {
      value: 0.15,
      unit: "fraction",
      description: "Maximum river survival bonus at full barrier removal: passageFrac * 0.15",
      source: "Calibrated — controls fish passage -> salmon survival coupling",
      sensitivity: "high"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 21. INDIGENOUS PERSPECTIVES (lines 538-655)
  // ─────────────────────────────────────────────────────────────────────────────
  indigenous: {
    name: "Indigenous Perspectives & Fishing Rights",

    coMgmtBonusScale: {
      value: 0.15,
      unit: "fraction",
      description: "Maximum co-management resilience boost: coMgmt * 0.15",
      source: "Calibrated — co-management effectiveness; Berkes 2009 (Ecol. Soc. 14:20) TEK integration in resource management",
      sensitivity: "medium"
    },

    // Ceremonial salmon access
    runTimingShiftRate: {
      value: 0.04,
      unit: "fraction per deg C",
      description: "Phenological disruption from SST shift: |sstDelta| * 0.04",
      source: "Crozier et al. 2011 (Glob. Change Biol. 17:1834-1847) — salmon run timing shifts ~2 days/°C warming",
      sensitivity: "medium"
    },
    runTimingShiftMax: {
      value: 0.3,
      unit: "fraction",
      description: "Maximum phenological disruption",
      source: "Calibrated — caps timing disruption",
      sensitivity: "low"
    },
    ceremonialChinookWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of chinook health in ceremonial access",
      source: "Calibrated — chinook cultural primacy; U.S. v. Washington (Boldt Decision 1974) treaty fishing rights framework",
      sensitivity: "high"
    },
    ceremonialWildFracWeight: {
      value: 0.25,
      unit: "dimensionless",
      description: "Weight of wild fraction in ceremonial access (hatchery doesn't fulfill ceremonial obligations)",
      source: "Calibrated — cultural significance of wild vs hatchery fish",
      sensitivity: "medium"
    },
    ceremonialTimingWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of (1 - runTimingShift) in ceremonial access",
      source: "Calibrated — timing disruption reduces access",
      sensitivity: "low"
    },
    ceremonialBiWeight: {
      value: 0.15,
      unit: "dimensionless",
      description: "Weight of biodiversity in ceremonial access: bi * 0.15",
      source: "Calibrated — general ecosystem health supports ceremony",
      sensitivity: "low"
    },
    ceremonialOilPenalty: {
      value: 0.5,
      unit: "dimensionless",
      description: "Oil spill penalty on ceremonial access: sp * 0.5",
      source: "Calibrated — oil contaminates ceremonial fishing areas",
      sensitivity: "low"
    },

    // Traditional food security
    salmonFoodContamWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Contamination penalty on salmon food: contam * 0.5",
      source: "Calibrated — contamination makes salmon unsafe to eat",
      sensitivity: "medium"
    },
    shellfishFoodOysterWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of oyster population in shellfish food: oyster * 0.5",
      source: "Calibrated — oysters are major traditional food",
      sensitivity: "medium"
    },
    shellfishFoodViabWeight: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of shellfish viability in shellfish food: viab * 0.5",
      source: "Calibrated — general shellfish health",
      sensitivity: "medium"
    },
    shellfishFoodContamWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Contamination penalty on shellfish food: contam * 0.3",
      source: "Calibrated — shellfish bioaccumulate contaminants; WDOH shellfish tissue monitoring program",
      sensitivity: "medium"
    },
    crabFoodContamWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Contamination penalty on crab food: contam * 0.3",
      source: "Calibrated — crab bioaccumulate contaminants; WDOH/EPA Puget Sound tissue monitoring data",
      sensitivity: "low"
    },
    foodSecurityWeights: {
      value: { salmon: 0.35, shellfish: 0.25, herring: 0.20, crab: 0.20 },
      unit: "dimensionless",
      description: "Weights for food source averaging in traditional food security",
      source: "Calibrated — salmon most culturally important",
      sensitivity: "medium"
    },
    foodSecurityAvgWeight: {
      value: 0.6,
      unit: "dimensionless",
      description: "Weight of average food score: avg * 0.6 + min * 0.4",
      source: "Calibrated — weakest link pulls down food security",
      sensitivity: "medium"
    },
    foodSecurityMinWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of minimum food score: weakest link matters most",
      source: "Calibrated — any food source failure is a crisis",
      sensitivity: "medium"
    },

    // Shellfish harvest access
    habClosureWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of HAB closure on shellfish access: habClosure * 0.4",
      source: "Calibrated — HABs close traditional gathering areas",
      sensitivity: "medium"
    },
    acidRestrictionScale: {
      value: 0.8,
      unit: "dimensionless",
      description: "OA restriction scaling: (1 - viab) * 0.8, max 0.6",
      source: "Calibrated — acidification restricts shellfish gathering",
      sensitivity: "medium"
    },
    contamRestrictionScale: {
      value: 0.6,
      unit: "dimensionless",
      description: "Contamination restriction scaling: contam * 0.6, max 0.5",
      source: "Calibrated — contamination closes gathering areas",
      sensitivity: "medium"
    },
    shellfishOilPenalty: {
      value: 0.7,
      unit: "dimensionless",
      description: "Oil spill penalty on shellfish access: sp * 0.7",
      source: "Calibrated — oil contaminates shellfish beds",
      sensitivity: "low"
    },

    // Contamination advisory
    pcbBurdenScale: {
      value: 1.5,
      unit: "dimensionless",
      description: "PCB burden scaling: pcb * 1.5, max 0.5",
      source: "Calibrated — PCBs are primary contaminant of concern",
      sensitivity: "medium"
    },
    pfasBurdenScale: {
      value: 1.2,
      unit: "dimensionless",
      description: "PFAS burden scaling: pfas * 1.2, max 0.4",
      source: "Calibrated — PFAS is emerging contaminant",
      sensitivity: "medium"
    },
    contamOilWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oil spill addition to contamination advisory: sp * 0.3",
      source: "Calibrated — oil adds to advisory burden",
      sensitivity: "low"
    },
    contamCoMgmtReduction: {
      value: 0.2,
      unit: "dimensionless",
      description: "Co-management reduces advisory impact: coMgmt * 0.2",
      source: "Calibrated — co-management improves monitoring; Berkes 2009 (Ecol. Soc. 14:20) adaptive co-management framework",
      sensitivity: "low"
    },

    // Cultural keystone species
    orcaCulturalPopScale: {
      value: 0.5,
      unit: "dimensionless",
      description: "Weight of orca pop ratio in cultural health: orcaV * 0.5",
      source: "Calibrated — orca are relatives in Coast Salish worldview",
      sensitivity: "high"
    },
    orcaCulturalGrowthBonus: {
      value: 0.2,
      unit: "dimensionless",
      description: "Bonus when orca population exceeds 74: pop>74 -> +0.2",
      source: "Calibrated — recovery signals cultural renewal",
      sensitivity: "medium"
    },
    orcaCulturalDeclineBonus: {
      value: 0.1,
      unit: "dimensionless",
      description: "Reduced bonus when orca population 50-74: pop>50 -> +0.1",
      source: "Calibrated — decline is cultural loss",
      sensitivity: "medium"
    },
    salmonCulturalHealthWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of salmon health in salmon cultural score: health * 0.4",
      source: "Calibrated — salmon are a returning gift",
      sensitivity: "medium"
    },
    salmonCulturalWildWeight: {
      value: 0.1,
      unit: "dimensionless",
      description: "Weight of wild fraction in salmon cultural score: wildFrac * 0.1",
      source: "Calibrated — wild fish more culturally significant",
      sensitivity: "low"
    },
    marineHabitatEelgrassWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Weight of eelgrass in marine habitat cultural score: eelgrass * 0.3",
      source: "Calibrated — eelgrass as cultural anchor",
      sensitivity: "low"
    },
    marineHabitatKelpWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of bull kelp in marine habitat cultural score: bullKelp * 0.2",
      source: "Calibrated — kelp as cultural anchor",
      sensitivity: "low"
    },
    culturalOilPenalty: {
      value: 0.3,
      unit: "dimensionless",
      description: "Oil spill penalty on cultural keystone health: sp * 0.3",
      source: "Calibrated — oil damages cultural-ecological connections",
      sensitivity: "low"
    },

    // Climate displacement
    rangeShiftRate: {
      value: 0.06,
      unit: "fraction per deg C",
      description: "Species range shift from SST delta: sstDelta * 0.06",
      source: "Pinsky et al. 2013 (Science 341:1239-1242) — marine species ranges shift poleward 72 km/decade with warming",
      sensitivity: "medium"
    },
    rangeShiftMax: {
      value: 0.4,
      unit: "fraction",
      description: "Maximum species range shift contribution",
      source: "Calibrated — caps range displacement",
      sensitivity: "low"
    },
    slrInundationDivisor: {
      value: 80,
      unit: "cm",
      description: "SLR normalization for inundation: slr/80, max 0.3",
      source: "Calibrated — SLR inundates U&A fishing areas",
      sensitivity: "low"
    },
    slrInundationFallback: {
      value: 0.03,
      unit: "fraction per deg C",
      description: "Fallback SLR inundation from SST delta: sstDelta * 0.03",
      source: "Calibrated — SST proxy for SLR when SLR unavailable",
      sensitivity: "low"
    },
    climateCoMgmtReduction: {
      value: 0.15,
      unit: "dimensionless",
      description: "Co-management reduces climate displacement: coMgmt * 0.15",
      source: "Calibrated — adaptive strategies from TEK integration",
      sensitivity: "low"
    },

    // Aggregated indices
    treatyWeights: {
      value: { ceremonial: 0.20, food: 0.25, shellfish: 0.15, contam: 0.10, cultural: 0.15, climate: 0.15 },
      unit: "dimensionless",
      description: "Weights for treaty fishery health aggregation",
      source: "Calibrated — multi-dimensional treaty rights assessment",
      sensitivity: "medium"
    },
    foodSovereigntyWeights: {
      value: { food: 0.50, shellfish: 0.25, contam: 0.25 },
      unit: "dimensionless",
      description: "Weights for Indigenous food sovereignty index",
      source: "Calibrated — food security is primary driver",
      sensitivity: "medium"
    },
    culturalLossWeights: {
      value: { ceremonial: 0.20, cultural: 0.25, food: 0.20, climate: 0.20, coMgmt: 0.15 },
      unit: "dimensionless",
      description: "Weights for Indigenous cultural loss index",
      source: "Calibrated — multi-dimensional cultural integrity",
      sensitivity: "medium"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 22. ORCA (lines 657-714)
  // ─────────────────────────────────────────────────────────────────────────────
  orca: {
    name: "Southern Resident Killer Whales (J/K/L pods)",

    // Prey availability
    preySalmonMaxRate: {
      value: 0.55,
      unit: "dimensionless",
      description: "Holling Type II max rate for orca prey response to salmon health",
      source: "Ford et al. 2010 (DFO Can. Sci. Advis. Sec. Res. Doc. 2009/101) — chinook >80% of SRKW diet; Holling 1959 Type II; maxRate > old 0.50 so baseline (~0.5 health) produces similar value",
      sensitivity: "high"
    },
    preySalmonHalfSat: {
      value: 0.30,
      unit: "dimensionless",
      description: "Half-saturation constant for orca prey response to salmon: orca get half max salmon benefit when salmon health = 0.30",
      source: "Holling 1959 — Type II functional response; halfSat calibrated to match baseline equilibrium",
      sensitivity: "high"
    },
    preyForageMaxRate: {
      value: 0.22,
      unit: "dimensionless",
      description: "Holling Type II max rate for orca prey response to forage fish",
      source: "Calibrated — supplementary prey; Ford et al. 2010; Holling 1959 Type II functional response",
      sensitivity: "high"
    },
    preyForageHalfSat: {
      value: 0.25,
      unit: "dimensionless",
      description: "Half-saturation constant for orca prey response to forage fish",
      source: "Holling 1959 — calibrated to match baseline forage fish index (~0.40)",
      sensitivity: "high"
    },
    preyPhytoMaxRate: {
      value: 0.17,
      unit: "dimensionless",
      description: "Holling Type II max rate for orca prey response to primary production",
      source: "Calibrated — bottom-up productivity signal; Holling 1959 Type II",
      sensitivity: "medium"
    },
    preyPhytoHalfSat: {
      value: 0.20,
      unit: "dimensionless",
      description: "Half-saturation constant for orca prey response to phytoplankton (normalized phyto/1000)",
      source: "Holling 1959 — calibrated to match baseline phytoplankton (~500 mg C/m3)",
      sensitivity: "medium"
    },
    preyPhytoDivisor: {
      value: 1000,
      unit: "mg C/m3",
      description: "Phytoplankton normalization for prey calculation",
      source: "Calibrated — typical phytoplankton range",
      sensitivity: "low"
    },

    // Whale watching disturbance
    wwDisturbanceScale: {
      value: 0.20,
      unit: "dimensionless",
      description: "Whale watching disturbance scaling: wwDisturbance * 0.20",
      source: "Lusseau et al. 2009 (Mar. Ecol. Prog. Ser. 386:285-292) — whale-watching vessels reduce foraging 18-25%",
      sensitivity: "high"
    },
    orcaProtectionNoiseReduction: {
      value: 0.6,
      unit: "fraction",
      description: "Orca protection reduces noise: noiseStress * (1 - orcaProtection/100 * 0.6)",
      source: "Joy et al. 2019 (Front. Mar. Sci.) — SRKW protection zones reduce but do not eliminate vessel noise exposure",
      sensitivity: "high"
    },
    vesselForagingLossRate: {
      value: 0.22,
      unit: "fraction per unit noise",
      description: "Chronic vessel noise foraging efficiency loss: orcaNP * 0.22, max 0.25",
      source: "Williams R. et al. 2006, Lusseau et al. 2009 — 18-25% foraging time reduction",
      sensitivity: "high"
    },
    vesselForagingLossMax: {
      value: 0.25,
      unit: "fraction",
      description: "Maximum foraging efficiency loss from vessel noise",
      source: "Williams R. et al. 2006 — upper bound of observed effect",
      sensitivity: "high"
    },
    shipStrikeBaseRate: {
      value: 0.004,
      unit: "per unit vessel density per quarter",
      description: "Ship strike rate scaling: vesselDensity * 0.004",
      source: "NOAA SRKW vessel strike risk assessment; Conn & Silber 2013 vessel speed-strike probability models",
      sensitivity: "high"
    },
    shipStrikeProtectionReduction: {
      value: 0.7,
      unit: "fraction",
      description: "Orca protection reduces strike rate: * (1 - orcaProtection/100 * 0.7)",
      source: "Calibrated — speed zones reduce strike risk ~80%; Conn & Silber 2013 speed-strike relationship",
      sensitivity: "high"
    },
    vesselDensityScale: {
      value: 2,
      unit: "dimensionless",
      description: "Vessel density proxy scaling: noiseIndex * 2, max 1",
      source: "Calibrated — noise as proxy for vessel density",
      sensitivity: "medium"
    },

    // Allee effect
    alleeExtinctionThreshold: {
      value: 5,
      unit: "individuals",
      description: "Below this: functionally extinct, severe Allee death boost (0.06)",
      source: "Lacy et al. 2017 (Sci. Rep. 7:14119) — minimum viable pod size for social structure",
      sensitivity: "high"
    },
    alleeExtinctionDeathBoost: {
      value: 0.06,
      unit: "fraction per quarter",
      description: "Additional mortality rate when pod < 5 individuals",
      source: "Calibrated — accelerating decline at very low numbers",
      sensitivity: "high"
    },
    alleeInbreedingThreshold: {
      value: 10,
      unit: "individuals",
      description: "Below this: inbreeding depression, mate-finding failure",
      source: "Lacy et al. 2017 (Sci. Rep. 7:14119); Ford et al. 2018 — SRKW Ne~25-35, inbreeding depression threshold",
      sensitivity: "high"
    },
    alleeInbreedingDeathBoost: {
      value: 0.04,
      unit: "fraction at pop=0",
      description: "Maximum death boost at 10-individual threshold: (10-pop)/10 * 0.04",
      source: "Calibrated — inbreeding depression mortality; Lacy et al. 2017 (Sci. Rep. 7:14119) Ne~25-35 inbreeding effects",
      sensitivity: "high"
    },
    alleeInbreedingBirthPenaltyAt5: {
      value: 0.9,
      unit: "fraction",
      description: "Birth penalty when pod < 5: 90% reduction in births",
      source: "Calibrated — mate-finding failure at very low numbers",
      sensitivity: "high"
    },
    alleeInbreedingBirthPenaltyAt10: {
      value: 0.5,
      unit: "fraction at pop=0",
      description: "Maximum birth penalty at 10-threshold: (10-pop)/10 * 0.5",
      source: "Calibrated — reduced reproductive success from inbreeding; Lacy et al. 2017 (Sci. Rep. 7:14119) PVA model",
      sensitivity: "high"
    },
    alleeCooperativeThreshold: {
      value: 18,
      unit: "individuals",
      description: "Below this: reduced cooperative foraging efficiency",
      source: "Lacy et al. 2017 (Sci. Rep. 7:14119) — cooperative foraging efficiency threshold; pod hunting strategies",
      sensitivity: "high"
    },
    alleeCooperativeBirthPenalty: {
      value: 0.12,
      unit: "fraction at pop=0",
      description: "Birth penalty at cooperative threshold: (18-pop)/18 * 0.12",
      source: "Calibrated — reduced foraging efficiency lowers birth rate",
      sensitivity: "high"
    },

    // Calf survival
    calfSurvBase: {
      value: 0.55,
      unit: "fraction",
      description: "Base calf survival from maternal care",
      source: "Center for Whale Research census data; Lacy et al. 2017 — SRKW calf first-year survival ~50-60%",
      sensitivity: "high"
    },
    calfSurvPreyBonus: {
      value: 0.35,
      unit: "fraction per unit prey",
      description: "Prey availability bonus to calf survival: effectivePrey * 0.35",
      source: "Calibrated — prey drives calf nutrition and survival",
      sensitivity: "high"
    },
    calfSurvNoisePenalty: {
      value: 0.15,
      unit: "fraction per unit noise",
      description: "Noise penalty on calf survival: podNoise * 0.15",
      source: "Calibrated — noise disrupts nursing and foraging",
      sensitivity: "high"
    },
    calfSurvContamPenalty: {
      value: 0.12,
      unit: "fraction per unit contam",
      description: "Contaminant penalty on calf survival: podContam * 0.12",
      source: "Calibrated — contaminants transferred via milk",
      sensitivity: "high"
    },
    calfSurvOilPenalty: {
      value: 0.4,
      unit: "dimensionless",
      description: "Oil spill penalty on calf survival: sp * 0.4",
      source: "Calibrated — oil exposure devastates calves",
      sensitivity: "high"
    },
    calfSurvMax: {
      value: 0.95,
      unit: "fraction",
      description: "Maximum calf survival rate",
      source: "Calibrated — some natural mortality always occurs",
      sensitivity: "medium"
    },

    // Mortality
    stressMortWeight: {
      value: 0.015,
      unit: "fraction per unit stress",
      description: "Total stress contribution to orca mortality: totalStress * 0.015",
      source: "Calibrated — environmental stress adds to base mortality",
      sensitivity: "medium"
    },
    starvationMortWeight: {
      value: 0.005,
      unit: "fraction per unit prey deficit",
      description: "Starvation mortality from low prey: (1-effectivePrey) * 0.005",
      source: "Calibrated — prey scarcity drives starvation",
      sensitivity: "high"
    },
    inbreedingMort: {
      value: 0.002,
      unit: "per quarter",
      description: "Fixed inbreeding depression mortality (SRKW Ne ~ 25-35)",
      source: "Lacy et al. 2017 — ~2-3% fitness reduction from inbreeding",
      sensitivity: "high"
    },
    bodyConditionMortScale: {
      value: 0.006,
      unit: "fraction per unit BC deficit",
      description: "Body condition mortality: (1 - bodyCondition) * 0.006",
      source: "Calibrated — poor body condition increases mortality",
      sensitivity: "high"
    },
    mortFloor: {
      value: 0.01,
      unit: "per quarter",
      description: "Minimum total orca mortality rate per quarter",
      source: "Calibrated — some natural mortality always occurs",
      sensitivity: "medium"
    },
    mortCeiling: {
      value: 0.20,
      unit: "per quarter",
      description: "Maximum total orca mortality rate per quarter",
      source: "Calibrated — caps catastrophic mortality",
      sensitivity: "medium"
    },

    // Extinction risk thresholds
    extRiskSevereThreshold: {
      value: 5,
      unit: "individuals",
      description: "Pod size below which extinction risk >= 0.5",
      source: "Calibrated — functionally extinct threshold; Lacy et al. 2017 (Sci. Rep. 7:14119) Allee effect thresholds",
      sensitivity: "high"
    },
    extRiskModerateThreshold: {
      value: 10,
      unit: "individuals",
      description: "Pod size below which moderate extinction risk",
      source: "Calibrated — inbreeding/mate-finding threshold",
      sensitivity: "high"
    },
    extRiskLowThreshold: {
      value: 18,
      unit: "individuals",
      description: "Pod size below which low extinction risk appears",
      source: "Calibrated — cooperative foraging threshold; Lacy et al. 2017 (Sci. Rep. 7:14119) group hunting minimum",
      sensitivity: "medium"
    },

    // Demographic stochasticity
    femaleFraction: {
      value: 0.45,
      unit: "fraction",
      description: "Fraction of pod that are breeding-age females (used for stochastic birth model)",
      source: "Center for Whale Research census data — SRKW sex ratio; Ford et al. 2018",
      sensitivity: "medium"
    },
    alleeMinViableSize: {
      value: 8,
      unit: "individuals",
      description: "Pod size below which Allee effect severely threatens viability — mate-finding failure, cultural knowledge loss",
      source: "Lacy et al. 2017 (Sci. Rep. 7:14119) — Population viability analysis for SRKW",
      sensitivity: "high"
    },
    demoNoiseScale: {
      value: 0.12,
      unit: "dimensionless",
      description: "Demographic noise amplitude: zNoise * sqrt(N) * 0.12. Represents stochastic birth/death events in small populations.",
      source: "Lacy et al. 2017 — Population viability analysis; demographic stochasticity scales as sqrt(N) for small populations",
      sensitivity: "medium"
    },
    demoNoiseSeedStructure: {
      value: null,
      unit: "description",
      description: "Seed = yearsSince2026 * 4003 + quarter * 997 + podOffset. Pod offsets: J=7, K=3001, L=5003. Uses Irwin-Hall (sum of 4 seeded uniforms) for approximate normal deviate.",
      source: "Implementation detail — ensures reproducibility across runs",
      sensitivity: "low"
    },

    // Body condition
    bcMemoryWeight: {
      value: 0.7,
      unit: "dimensionless",
      description: "Body condition memory: prevBC * 0.7 + effectivePrey * 0.3",
      source: "Calibrated — BC changes slowly (blubber reserves)",
      sensitivity: "high"
    },
    bcPreyWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Prey contribution to body condition update",
      source: "Calibrated — current prey affects BC",
      sensitivity: "high"
    },

    // Population bounds
    podMax: {
      value: 100,
      unit: "individuals",
      description: "Maximum individuals per pod",
      source: "Calibrated — upper bound for pod size",
      sensitivity: "low"
    },
    totalMax: {
      value: 200,
      unit: "individuals",
      description: "Maximum total SRKW population",
      source: "Center for Whale Research — historical peak ~140 in 1970s; current ~73-74 individuals (2024 census)",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 23c. PTEROPOD (Limacina helicina) — Ocean Acidification Canary
  // ─────────────────────────────────────────────────────────────────────────────
  pteropod: {
    name: "Pteropod (Limacina helicina)",

    initialPop: {
      value: 0.65,
      unit: "fraction of K",
      description: "Aragonite-shelled zooplankton. Current population depressed from pre-industrial by OA",
      source: "Bednaršek et al. 2014 (Proc. R. Soc. B 281:20140123) — first documented biological impact of anthropogenic ocean acidification in California Current",
      sensitivity: "high"
    },
    growthRate: {
      value: 0.40,
      unit: "per year",
      description: "Fast-growing zooplankton with high reproductive rate",
      source: "Lischka et al. 2011 (Biogeosciences 8:919-932) — pteropod growth rates under varying CO2",
      sensitivity: "medium"
    },
    shellDissolutionThreshold: {
      value: 1.5,
      unit: "Omega_aragonite",
      description: "Shell stress begins at Omega_ar < 1.5, severe dissolution below 1.0",
      source: "Bednaršek et al. 2012 (Nat. Geosci. 5:881-885) — pteropod shell dissolution in Southern Ocean; Bednaršek et al. 2014 — California Current",
      sensitivity: "high"
    },
    preyRole: {
      value: { juvenileSalmon: 0.4, herringLarvae: 0.3, forageFish: 0.3 },
      unit: "fraction of diet contribution",
      description: "Critical prey for juvenile salmon in nearshore/estuary stage and herring larvae",
      source: "Busch et al. 2014 (ICES J. Mar. Sci. 71:2490-2500) — pteropods and salmon prey linkage",
      sensitivity: "high"
    },
    oaChain: {
      value: "CO2 → DIC → low Omega_ar → pteropod decline → less prey for juvenile salmon → fewer returning adults → less food for SRKW",
      unit: "qualitative",
      description: "The complete ocean acidification to apex predator cascade. NOAA called pteropod dissolution 'the first documented biological impact of anthropogenic ocean acidification'",
      source: "Bednaršek et al. 2014; Busch et al. 2014; Feely et al. 2004 (Science 305:362-366)",
      sensitivity: "high"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 23d. GRAY WHALE (Eschrichtius robustus) — Benthic-Pelagic Coupling
  // ─────────────────────────────────────────────────────────────────────────────
  grayWhale: {
    name: "Gray Whale (Eschrichtius robustus)",

    initialPop: {
      value: 0.30,
      unit: "fraction of K",
      description: "~30 resident 'sounders' in Salish Sea of ~100 regional carrying capacity",
      source: "Calambokidis et al. 2002 — gray whale feeding ecology in Puget Sound; Scordino et al. 2017",
      sensitivity: "medium"
    },
    growthRate: {
      value: 0.04,
      unit: "per year",
      description: "Slow growth, long-lived large whale. Eastern Pacific population ~27,000",
      source: "Punt & Wade 2012 — gray whale population dynamics; IWC assessment",
      sensitivity: "low"
    },
    diet: {
      value: { benthicAmphipods: 0.70, ghostShrimp: 0.20, mysids: 0.10 },
      unit: "fraction",
      description: "Benthic feeder — connects substrate/infauna layer to marine mammal food web",
      source: "Darling et al. 1998; Calambokidis et al. 2002 — gray whale benthic feeding in PS",
      sensitivity: "medium"
    },
    vesselStrikeRisk: {
      value: 0.005,
      unit: "per quarter per whale",
      description: "Gray whales frequently transit shipping lanes during migration. Strike risk elevated in Juan de Fuca and Georgia Strait",
      source: "Scordino et al. 2017; NOAA large whale vessel strike database",
      sensitivity: "medium"
    },
    culturalSignificance: {
      value: "Makah treaty right to hunt gray whale (Treaty of Neah Bay, 1855). Cultural and subsistence importance to coastal tribes.",
      unit: "qualitative",
      description: "Makah Nation has treaty-protected whaling rights. Gray whale spring migration is a cultural event for multiple coastal nations.",
      source: "Treaty of Neah Bay 1855; NOAA/IWC aboriginal subsistence whaling program",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 23b. BIGG'S (TRANSIENT) KILLER WHALE
  // ─────────────────────────────────────────────────────────────────────────────
  biggsOrca: {
    name: "Bigg's Killer Whale (Orcinus orca, transient ecotype)",

    initialPop: {
      value: 0.80,
      unit: "fraction of K",
      description: "~400 individuals of ~500 regional carrying capacity",
      source: "Towers et al. 2019 (Mar. Mamm. Sci. 35:1178-1198) — photo-ID catalogue of Bigg's whales in the eastern North Pacific",
      sensitivity: "medium"
    },
    growthRate: {
      value: 0.04,
      unit: "per year",
      description: "Population growth rate ~3-4%/yr, among the fastest for any killer whale population",
      source: "Shields et al. 2018 — Status of Bigg's killer whales in Salish Sea; ~140 calves documented in last decade",
      sensitivity: "high"
    },
    carryingCapacity: {
      value: 500,
      unit: "individuals",
      description: "Regional carrying capacity limited by marine mammal prey abundance",
      source: "Ford et al. 2007; Towers et al. 2019 — population approaching asymptotic growth",
      sensitivity: "medium"
    },
    preyComposition: {
      value: { harborSeal: 0.80, stellerSeaLion: 0.10, harborPorpoise: 0.05, other: 0.05 },
      unit: "fraction",
      description: "Diet overwhelmingly pinnipeds. Harbor seals are primary prey in Salish Sea",
      source: "Ford et al. 1998 (Can. J. Zool. 76:1456-1471); Baird & Dill 1995 — dietary specialization of transient killer whales",
      sensitivity: "high"
    },
    pcbBurden: {
      value: 146,
      unit: "mg/kg lipid",
      description: "Highest PCB burden of any marine mammal studied. Biomagnification via pinniped prey (one trophic level above SRKW)",
      source: "Ross et al. 2000 (Mar. Poll. Bull. 40:504-515) — PCBs in NE Pacific killer whales; Hickie et al. 2007",
      sensitivity: "medium"
    },
    noiseSensitivity: {
      value: 0.30,
      unit: "fraction relative to SRKW",
      description: "Less noise-sensitive than SRKW: Bigg's use stealth hunting (passive listening), not active echolocation, for marine mammal prey",
      source: "Barrett-Lennard et al. 1996 — acoustic differences between resident and transient orca; Deecke et al. 2005",
      sensitivity: "low"
    },
    seasonalPresence: {
      value: { peakMonths: "Apr-May, Aug-Sep", yearRound: false },
      unit: "qualitative",
      description: "Bimodal seasonal presence in Salish Sea. Peak spring presence follows harbor seal pupping; fall presence follows salmon-feeding seal aggregations",
      source: "Houghton et al. 2015 (Mar. Ecol. Prog. Ser. 527:255-267) — increased Bigg's sightings in Salish Sea 2004-2014",
      sensitivity: "low"
    },
    socialStructure: {
      value: "matrilineal groups of 3-5",
      unit: "qualitative",
      description: "Small family groups, not large pods like SRKW. Matrilineal but less socially complex",
      source: "Ford & Ellis 1999 — Transients: Mammal-Hunting Killer Whales; Baird & Whitehead 2000",
      sensitivity: "low"
    },
    conservationStatus: {
      value: "SARA Threatened (Canada), MMPA protected (US)",
      unit: "qualitative",
      description: "Not ESA-listed in US. COSEWIC Threatened in Canada. Population growing but PCB burden is a concern",
      source: "COSEWIC 2008; NOAA — not ESA-listed due to growing population trend",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 24. HUMPBACK WHALE (lines 715-745)
  // ─────────────────────────────────────────────────────────────────────────────
  humpback: {
    name: "Humpback Whale (Megaptera novaeangliae)",

    initialPop: {
      value: 0.35,
      unit: "index (0-1)",
      description: "Default initial humpback population (~35% of regional K)",
      source: "Calambokidis et al. (Cascadia Research) — ~500+ humpbacks seasonally in Salish Sea; recovering since 2000s",
      sensitivity: "low"
    },
    forageFFWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of forage fish in humpback foraging: forageFish * 0.4",
      source: "Calambokidis & Barlow 2004 — humpback diet: herring, sand lance, and forage fish in Salish Sea",
      sensitivity: "medium"
    },
    forageZooWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Weight of zooplankton (krill proxy) in humpback foraging: zoo/600 * 0.4",
      source: "Calambokidis & Barlow 2004 — krill (Euphausia pacifica) is major humpback prey item",
      sensitivity: "medium"
    },
    forageBiWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Weight of biodiversity in humpback foraging: bi * 0.2",
      source: "Calibrated — general ecosystem health proxy; Halpern et al. 2008 (Science 319:948-952) cumulative impacts framework",
      sensitivity: "low"
    },
    kForageScale: {
      value: 0.8,
      unit: "dimensionless",
      description: "Forage scaling for humpback K: forage * 0.8",
      source: "Calibrated — forage availability limits K",
      sensitivity: "medium"
    },
    kRange: {
      value: [0.05, 0.9],
      unit: "index (0-1)",
      description: "Clamp range for humpback carrying capacity",
      source: "Calibrated — upper K for regional population",
      sensitivity: "low"
    },
    growthRate: {
      value: 0.07,
      unit: "per year",
      description: "Logistic growth rate (~7%/yr in the Salish Sea since 2010)",
      source: "Calambokidis et al. (Cascadia Research) — ~7% annual growth in Salish Sea since 2010; 4-5x increase in 30 years",
      sensitivity: "medium"
    },
    strikeRateBase: {
      value: 0.012,
      unit: "per unit noise per quarter",
      description: "Vessel strike rate scaling: noiseIndex * 0.012",
      source: "Calambokidis et al. 2019 (Cascadia Research) — 4 documented strikes in Puget Sound; WSF ferry strikes 2019-2020",
      sensitivity: "medium"
    },
    strikeProtectionReduction: {
      value: 0.7,
      unit: "fraction",
      description: "Orca protection reduces humpback strike: *(1 - orcaProtection/100 * 0.7)",
      source: "Calibrated — speed zones reduce strike risk; Conn & Silber 2013 — 10-knot zones reduce lethal strikes ~80%",
      sensitivity: "medium"
    },
    strikeMax: {
      value: 0.01,
      unit: "fraction per quarter",
      description: "Maximum humpback strike mortality rate",
      source: "Calibrated — caps strike impact",
      sensitivity: "low"
    },
    entanglementRate: {
      value: 0.003,
      unit: "fraction at 100% fishing",
      description: "Entanglement mortality: fishingPressure/100 * 0.003",
      source: "NOAA West Coast Large Whale Entanglement Response Program — PNW humpback entanglement reports increasing",
      sensitivity: "low"
    },
    oilMort: {
      value: 0.15,
      unit: "dimensionless",
      description: "Oil spill mortality: sp * 0.15 (surface feeders vulnerable)",
      source: "Calibrated — surface lunge-feeding exposes humpbacks to oil; NOAA large whale oil response protocols",
      sensitivity: "low"
    },
    orcaCompetitionMaxRate: {
      value: 0.08,
      unit: "fraction",
      description: "Holling Type II max rate for humpback-orca prey competition (saturates as humpback numbers stabilize)",
      source: "Calibrated — humpback-orca forage competition; Trites et al. 1999; Holling 1959 Type II functional response",
      sensitivity: "high"
    },
    orcaCompetitionHalfSat: {
      value: 0.30,
      unit: "index (0-1)",
      description: "Half-saturation constant for humpback-orca competition: competition reaches half max when humpback density = 0.30",
      source: "Holling 1959 — calibrated to match baseline humpback density (~0.35)",
      sensitivity: "high"
    },
    orcaCompetitionMax: {
      value: 0.06,
      unit: "fraction",
      description: "Maximum orca prey reduction from humpback competition (clamp cap)",
      source: "Calibrated — caps interspecific competition; limited overlap in SRKW chinook diet vs humpback forage diet",
      sensitivity: "high"
    },
    tourismBonusRate: {
      value: 0.3,
      unit: "dimensionless",
      description: "Humpback tourism bonus: humpbackPop * 0.3, max 0.15",
      source: "Calibrated — whale watching tourism value; O'Connor et al. 2009 whale tourism economic analysis",
      sensitivity: "low"
    },
    tourismBonusMax: {
      value: 0.15,
      unit: "fraction",
      description: "Maximum tourism bonus from humpback watching",
      source: "Calibrated — caps tourism contribution",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 24. BIODIVERSITY AGGREGATION (lines 747-763)
  // ─────────────────────────────────────────────────────────────────────────────
  biodiversityAggregation: {
    name: "Biodiversity Index & Fishery/Recreation Aggregation",

    // HAB impact on fisheries
    habFisheriesPenaltyScale: {
      value: 0.3,
      unit: "fraction",
      description: "HAB closure penalty on fisheries: shellfishClosureFrac * 0.3",
      source: "Calibrated — HAB closures reduce fisheries yield",
      sensitivity: "medium"
    },
    gcFisheriesPenaltyRate: {
      value: 0.15,
      unit: "dimensionless",
      description: "Green crab fisheries penalty: greenCrab * 0.15, max 0.15",
      source: "Calibrated — green crabs prey on commercial bivalves",
      sensitivity: "medium"
    },
    omegaFisheriesPenaltyScale: {
      value: 0.25,
      unit: "fraction",
      description: "Omega fisheries penalty: (1 - viab) * 0.25, max 0.25",
      source: "Calibrated — acidification reduces shellfish industry yield",
      sensitivity: "medium"
    },
    fisheriesFishingScale: {
      value: 0.8,
      unit: "dimensionless",
      description: "Fishing pressure factor: 1 - fishingPressure/100 * 0.8",
      source: "Calibrated — fishing pressure reduces total yield",
      sensitivity: "medium"
    },
    fisheriesPhytoWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Phytoplankton weight in fisheries yield: phyto * 0.4",
      source: "Calibrated — primary production drives fisheries",
      sensitivity: "low"
    },
    fisheriesSeasonWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Seasonal variation in fisheries: 0.7 + season * 0.3",
      source: "Calibrated — seasonal fishing patterns",
      sensitivity: "low"
    },
    revenueMultiplier: {
      value: 2,
      unit: "dimensionless",
      description: "Revenue multiplier for crab/oyster/geoduck in fisheries yield",
      source: "Calibrated — revenue scaling to total yield",
      sensitivity: "low"
    },

    // biAdj species weights
    biAdjGreenCrabPenalty: {
      value: 0.08,
      unit: "dimensionless",
      description: "Green crab biodiversity penalty: greenCrab * 0.08",
      source: "Calibrated — invasive species suppress native biodiversity",
      sensitivity: "medium"
    },
    biAdjSeabirdBonus: {
      value: 0.05,
      unit: "dimensionless",
      description: "Seabird biodiversity bonus: seabird * 0.05",
      source: "Calibrated — seabirds add trophic completeness",
      sensitivity: "low"
    },
    biAdjOysterBonus: {
      value: 0.03,
      unit: "dimensionless",
      description: "Oyster biodiversity bonus: oyster * 0.03",
      source: "Calibrated — reef-building filter feeders support biodiversity",
      sensitivity: "low"
    },
    biAdjInvasivePenalty: {
      value: 0.06,
      unit: "dimensionless",
      description: "Ballast water invasive pressure penalty: invasivePress * 0.06",
      source: "Calibrated — ballast water introduces non-native species",
      sensitivity: "low"
    },
    biAdjUrchinPenalty: {
      value: 0.08,
      unit: "dimensionless",
      description: "Urchin grazing biodiversity penalty: urchinGrazing * 0.08",
      source: "Calibrated — urchin barrens eliminate kelp biodiversity",
      sensitivity: "medium"
    },
    biAdjMurreletBonus: {
      value: 0.03,
      unit: "dimensionless",
      description: "Murrelet biodiversity bonus: murrelet * 0.03",
      source: "Calibrated — threatened species presence signals health",
      sensitivity: "low"
    },
    biAdjHumpbackBonus: {
      value: 0.02,
      unit: "dimensionless",
      description: "Humpback biodiversity bonus: humpback * 0.02",
      source: "Calibrated — large whale presence supports ecosystem",
      sensitivity: "low"
    },
    biAdjGeoduckBonus: {
      value: 0.01,
      unit: "dimensionless",
      description: "Geoduck biodiversity bonus: geoduck * 0.01",
      source: "Calibrated — minor contribution from burrowing bivalve",
      sensitivity: "low"
    },
    biAdjLingcodBonus: {
      value: 0.03,
      unit: "dimensionless",
      description: "Lingcod biodiversity bonus: lingcod * 0.03",
      source: "Calibrated — apex predator presence signals reef health",
      sensitivity: "low"
    },
    biAdjSeaOtterBonus: {
      value: 0.04,
      unit: "dimensionless",
      description: "Sea otter biodiversity bonus: seaOtter * 0.04",
      source: "Calibrated — keystone species cascading benefits",
      sensitivity: "medium"
    },
    biAdjPorpoiseBonus: {
      value: 0.02,
      unit: "dimensionless",
      description: "Porpoise biodiversity bonus: porpoise * 0.02",
      source: "Calibrated — acoustic canary species",
      sensitivity: "low"
    },
    biAdjLampreyBonus: {
      value: 0.02,
      unit: "dimensionless",
      description: "Lamprey biodiversity bonus: lamprey * 0.02",
      source: "Calibrated — ancient species, nutrient transport",
      sensitivity: "low"
    },
    biAdjJellyfishPenalty: {
      value: 0.04,
      unit: "dimensionless",
      description: "Jellyfish biodiversity penalty: jellyfish * 0.04",
      source: "Calibrated — jellification indicates degradation",
      sensitivity: "low"
    },

    // Ecological constraints
    ecPAWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "PA weight in ecological constraints: PA/100 * 0.4",
      source: "Calibrated — protected areas drive management constraints",
      sensitivity: "low"
    },
    ecOrcaProtWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Orca protection weight in constraints: orcaProt/100 * 0.2",
      source: "Calibrated — orca protection adds constraints",
      sensitivity: "low"
    },
    ecBiThreshold: {
      value: 0.4,
      unit: "index (0-1)",
      description: "Biodiversity threshold triggering additional constraints: biAdj<0.4 -> +0.3",
      source: "Calibrated — low biodiversity triggers emergency measures",
      sensitivity: "low"
    },
    ecBiPenalty: {
      value: 0.3,
      unit: "dimensionless",
      description: "Constraint boost when biodiversity below threshold",
      source: "Calibrated — emergency species protections",
      sensitivity: "low"
    },
    ecOilWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Oil spill weight in constraints: sp * 0.4",
      source: "Calibrated — spills trigger emergency restrictions",
      sensitivity: "low"
    },

    // Recreation value
    rvBiWeight: {
      value: 0.4,
      unit: "dimensionless",
      description: "Biodiversity weight in recreation value: biAdj * 0.4",
      source: "Calibrated — biodiversity drives nature tourism",
      sensitivity: "medium"
    },
    rvKelpWeight: {
      value: 0.2,
      unit: "dimensionless",
      description: "Kelp health weight in recreation: kelpH * 0.2",
      source: "Calibrated — kelp forests are diving/snorkeling draw",
      sensitivity: "low"
    },
    rvOrcaWeight: {
      value: 0.3,
      unit: "dimensionless",
      description: "Orca viability weight in recreation: orcaV * 0.3",
      source: "Calibrated — orca watching is major tourism driver",
      sensitivity: "medium"
    },
    rvStressWeight: {
      value: 0.1,
      unit: "dimensionless",
      description: "Inverse stress weight in recreation: (1-stress) * 0.1",
      source: "Calibrated — clean environment attracts visitors",
      sensitivity: "low"
    },
    rvOilPenalty: {
      value: 0.5,
      unit: "dimensionless",
      description: "Oil spill penalty on recreation: sp * 0.5",
      source: "Calibrated — oil devastates tourism",
      sensitivity: "low"
    },
    rvHABPenalty: {
      value: 0.3,
      unit: "dimensionless",
      description: "HAB penalty on recreation: habPenalty * 0.3",
      source: "Calibrated — beach closures reduce tourism",
      sensitivity: "low"
    },
    rvSeabirdBonus: {
      value: 0.05,
      unit: "dimensionless",
      description: "Seabird bonus to recreation: seabird * 0.05",
      source: "Calibrated — birdwatching tourism",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AQUACULTURE (Open-pen salmon farms)
  // ─────────────────────────────────────────────────────────────────────────────
  aquaculture: {
    name: "Aquaculture Module",

    seaLiceCoefficient: {
      value: 0.06,
      unit: "fraction per unit intensity",
      description: "Sea lice pressure on wild salmon smolts: aquaFrac * 0.06. At full intensity, reduces ocean survival by 6%",
      source: "Krkosek et al. 2007 — sea lice from farms caused ~80% mortality of juvenile pink salmon in Broughton Archipelago. Scaled to 6% at population level across all stocks (localized farm effect diluted across wider region)",
      sensitivity: "high"
    },
    escapeRiskCoefficient: {
      value: 0.03,
      unit: "fraction per unit intensity",
      description: "Genetic introgression risk from escaped Atlantic salmon: aquaFrac * 0.03. Reduces wild genetic diversity via strayRate interaction",
      source: "Hindar et al. 2006 — farmed-wild interbreeding reduces wild population productivity. Scaled conservatively for Pacific context (fewer escapes than Atlantic)",
      sensitivity: "medium"
    },
    aquaContaminationCoefficient: {
      value: 0.08,
      unit: "fraction per unit intensity",
      description: "Chemical contamination from aquaculture: antibiotics (SLICE/emamectin), pesticides, antifoulants. Added to contamination restriction in indigenous shellfish access",
      source: "Calibrated — aggregate chemical runoff; Burridge et al. 2010 (Aquaculture 306:7-23) aquaculture chemical use review",
      sensitivity: "medium"
    },
    aquaNutrientLoadCoefficient: {
      value: 3.0,
      unit: "relative nutrient units per unit intensity",
      description: "Nutrient loading from fish waste. Currently a local variable; would need marine basin coupling for full spatial eutrophication effect",
      source: "Brooks & Mahnken 2003 (Fish. Res. 62:255-293) — BC salmon farm nutrient discharge data. Not fully coupled to NPZD",
      sensitivity: "low"
    },
    aquaJobsMax: {
      value: 2000,
      unit: "jobs",
      description: "Direct employment at 100% aquaculture intensity (~2,000 jobs in BC salmon farming)",
      source: "BC Salmon Farmers Association economic impact reports",
      sensitivity: "low"
    },
    aquaRevenueMax: {
      value: 800,
      unit: "$M/yr",
      description: "Industry revenue at 100% aquaculture intensity (~$800M/yr BC salmon farming)",
      source: "BC Salmon Farmers Association; DFO aquaculture statistics",
      sensitivity: "low"
    },
    biAdjAquaPenalty: {
      value: 0.04,
      unit: "dimensionless",
      description: "Biodiversity index penalty from aquaculture contamination: aquaContamination * 0.04",
      source: "Calibrated — benthic suppression near farm sites; Buschmann et al. 2006 (Aquaculture 261:1-17) environmental impacts review",
      sensitivity: "low"
    },
    contamRestrictionAquaAdd: {
      value: 1.0,
      unit: "dimensionless (additive)",
      description: "Aquaculture contamination is added to ms.contaminationLevel before computing contamRestriction for indigenous shellfish access",
      source: "Calibrated — shellfish tissue accumulation near farms; Burridge et al. 2010 (Aquaculture 306:7-23)",
      sensitivity: "medium"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SEA LEVEL RISE ADAPTATION
  // ─────────────────────────────────────────────────────────────────────────────
  slrAdaptation: {
    name: "Sea Level Rise Adaptation Strategy",

    slrArmorMod: {
      value: 0.25,
      unit: "dimensionless (additive to armoringFrac)",
      description: "Hard armoring strategy increases shoreline armoring fraction by 0.25, destroying surf smelt spawning habitat",
      source: "WA Dept of Ecology: 27% of Puget Sound shoreline armored, hard armoring adds ~25% more",
      sensitivity: "high"
    },
    slrFloodReductionHard: {
      value: 0.40,
      unit: "fraction",
      description: "Hard armoring reduces coastal flood risk by 40%",
      source: "USACE levee/seawall effectiveness estimates for Puget Sound delta areas",
      sensitivity: "medium"
    },
    slrFloodReductionLiving: {
      value: 0.20,
      unit: "fraction",
      description: "Living shorelines reduce coastal flood risk by 20% (less than hard armoring but with co-benefits)",
      source: "NOAA living shoreline effectiveness studies; Bilkovic et al. 2016",
      sensitivity: "medium"
    },
    slrEelgrassModHard: {
      value: -0.05,
      unit: "dimensionless (additive to eelgrassH)",
      description: "Hard armoring suppresses eelgrass by 5% via increased wave reflection and habitat squeeze",
      source: "Dethier et al. 2016 — shoreline armoring reduces eelgrass density in Puget Sound",
      sensitivity: "medium"
    },
    slrEelgrassModLiving: {
      value: 0.03,
      unit: "dimensionless (additive to eelgrassH)",
      description: "Living shorelines boost eelgrass by 3% via reduced wave energy and sediment stabilization",
      source: "Davis et al. 2015 — nature-based shoreline protection co-benefits",
      sensitivity: "low"
    },
    slrOysterMod: {
      value: 0.05,
      unit: "dimensionless (additive to pacK)",
      description: "Living shorelines boost Pacific oyster carrying capacity by 0.05 via oyster reef breakwaters",
      source: "La Peyre et al. 2014 — oyster reef restoration as living shoreline",
      sensitivity: "low"
    },
    slrSmeltArmorMod: {
      value: -0.15,
      unit: "dimensionless (additive to armoringFrac)",
      description: "Living shorelines reduce effective armoring by 0.15, restoring surf smelt spawning gravel",
      source: "Penttila 2007 — shoreline softening restores forage fish spawning habitat",
      sensitivity: "high"
    },
    slrSandLanceMod: {
      value: 0.03,
      unit: "dimensionless (additive to slK)",
      description: "Living shorelines improve sand lance habitat quality by 0.03 via restored sediment transport",
      source: "Calibrated — restored nearshore processes benefit subtidal sand habitat",
      sensitivity: "low"
    },
    slrPropertyLoss: {
      value: 0.08,
      unit: "fraction (subtracted from propertyValueIndex)",
      description: "Managed retreat under living shorelines reduces property values by 8% in retreat zones",
      source: "McNamara & Keeler 2013 — property value impacts of managed retreat policies",
      sensitivity: "medium"
    },
    slrCostHard: {
      value: 500,
      unit: "$M",
      description: "Annualized cost of hard armoring infrastructure (seawalls, riprap, levees)",
      source: "USACE Puget Sound shoreline protection cost estimates",
      sensitivity: "low"
    },
    slrCostLiving: {
      value: 300,
      unit: "$M",
      description: "Annualized cost of living shoreline program (oyster reefs, eelgrass buffers, managed retreat)",
      source: "NOAA living shoreline implementation cost estimates",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BIOACCUMULATION MODEL
  // ─────────────────────────────────────────────────────────────────────────────
  bioaccumulation: {
    name: "Bioaccumulation / Biomagnification",

    bmf: {
      value: 1.6,
      unit: "dimensionless (index-scale)",
      description: "Effective biomagnification factor per trophic level step on the 0-1 contaminant index scale. Applied as baseContam * BMF^(trophicLevel). Real-world PCB BMFs are 3-10× per trophic step in absolute concentration; 1.6 on the normalized index preserves realistic relative gradients while keeping values in [0,1].",
      source: "Hickie et al. 2007 (Environ. Sci. Technol. 41:6613-6619) — PCB biomagnification in SRKW food web; Ross et al. 2000 (Mar. Poll. Bull. 40:504-515) — contaminant levels in killer whales",
      sensitivity: "high"
    },
    baseContamFormula: {
      value: "waterContam * 0.6 + waterPCB * 0.4",
      unit: "dimensionless",
      description: "Combined water contamination index: 60% general contamination + 40% PCBs (most bioaccumulative class)",
      source: "Calibrated — PCBs are the primary biomagnifying contaminant class in SRKW tissue analyses (Ross et al. 2000)",
      sensitivity: "medium"
    },
    trophicLevels: {
      value: {
        phytoplankton: 1.0, eelgrass: 1.0,
        zooplankton: 1.0, oyster: 1.0, geoduck: 1.0,
        herring: 2.0, sandLance: 2.0, surfSmelt: 2.0, dungeness: 2.0,
        rockfish: 2.5,
        salmon: 3.0, lingcod: 3.0,
        pinniped: 3.5,
        orca: 4.0,
        humpback: 2.5
      },
      unit: "trophic level exponent",
      description: "Exponent applied to BMF for each species: tissueContam = baseContam * BMF^TL. TL reflects diet-based bioaccumulation pathway, not strict ecological trophic level.",
      source: "Pauly et al. 1998 (Science 279:860-863) for trophic positions; adjusted for Salish Sea food web topology",
      sensitivity: "medium"
    },
    orcaContamEffect: {
      value: 0.013,
      unit: "per unit tissue contam",
      description: "Calf survival penalty coefficient for orca tissue contamination. Calibrated so baseline podContam effect matches pre-bioaccumulation model (~0.011 calf survival reduction at baseline).",
      source: "Calibrated from Hickie et al. 2007 reproductive failure threshold; Hall et al. 2018 (Sci. Total Environ. 639:68-78)",
      sensitivity: "high"
    },
    rockfishContamEffect: {
      value: 0.22,
      unit: "per unit tissue contam, clamped 0-0.3",
      description: "Rockfish contamination stress from bioaccumulated tissue burden. Long-lived rockfish (120+ yr) accumulate extreme PCB concentrations.",
      source: "West et al. 2001 — PCBs in Puget Sound rockfish; calibrated to match pre-bioaccumulation baseline (~0.096)",
      sensitivity: "medium"
    },
    shellfishContamThreshold: {
      value: 0.4,
      unit: "tissue contam index",
      description: "Geoduck market closure threshold: above this level, Asian importers reject shipments due to PCB/PFAS levels exceeding food safety standards.",
      source: "FDA action levels for PCBs in shellfish tissue (2.0 ppm); CFIA import standards",
      sensitivity: "medium"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SEASONAL PHENOLOGY
  // ─────────────────────────────────────────────────────────────────────────────
  phenology: {
    name: "Seasonal Phenology & Mismatch",

    bloomPeakQuarter: {
      value: 1.0,
      unit: "quarter (0=Jan, 1=Apr, 2=Jul, 3=Oct)",
      description: "Spring phytoplankton bloom peak timing. Shifts earlier with warming at ~3 days/°C.",
      source: "Edwards & Richardson 2004 — phenological shifts in North Atlantic plankton",
      sensitivity: "high"
    },
    bloomWidth: {
      value: 0.8,
      unit: "quarters",
      description: "Breadth of the spring bloom Gaussian peak.",
      source: "Mackas et al. 2012 — NE Pacific plankton phenology",
      sensitivity: "low"
    },
    bloomShiftRate: {
      value: 3,
      unit: "days/°C",
      description: "How much earlier the spring bloom peaks per degree of warming.",
      source: "Edwards & Richardson 2004 — diatom bloom advancement 4.4 d/°C, conservative estimate for Salish Sea",
      sensitivity: "medium"
    },
    zooPeakQuarter: {
      value: 1.2,
      unit: "quarter",
      description: "Zooplankton (copepod) peak timing. Lags bloom slightly.",
      source: "Mackas et al. 2012 — Neocalanus plumchrus phenology in NE Pacific",
      sensitivity: "high"
    },
    zooShiftRate: {
      value: 2,
      unit: "days/°C",
      description: "Zooplankton phenological advance per degree warming. Slower than phytoplankton — source of mismatch.",
      source: "Edwards & Richardson 2004 — copepod phenology shifts ~2-3 d/°C vs diatoms ~4-5 d/°C",
      sensitivity: "high"
    },
    herringSpawnPeakQuarter: {
      value: 0.5,
      unit: "quarter",
      description: "Pacific herring spawning peak: late winter/early spring (Feb-Mar).",
      source: "Hay et al. 2009 — Strait of Georgia herring spawn timing",
      sensitivity: "medium"
    },
    herringSpawnShiftRate: {
      value: 5,
      unit: "days/°C",
      description: "Herring spawning advances faster than bloom — among most climate-sensitive phenological events.",
      source: "Crozier et al. 2008 — climate impacts on salmon life history timing",
      sensitivity: "medium"
    },
    smoltOutPeakQuarter: {
      value: 1.0,
      unit: "quarter",
      description: "Salmon smolt outmigration peak: spring (Apr-May).",
      source: "Crozier et al. 2008 — Columbia/Puget Sound smolt timing",
      sensitivity: "high"
    },
    smoltShiftRate: {
      value: 4,
      unit: "days/°C",
      description: "Smolt outmigration advances with warming stream temperatures.",
      source: "Crozier et al. 2008, Beamish et al. 2010 — earlier smolt migration with warming",
      sensitivity: "high"
    },
    orcaResidencyPeakQuarter: {
      value: 2.0,
      unit: "quarter",
      description: "SRKW summer residency peak: mid-summer (Jul-Aug).",
      source: "Olson et al. 2018 — SRKW habitat use patterns",
      sensitivity: "medium"
    },
    orcaResidencyShiftRate: {
      value: 2,
      unit: "days/°C",
      description: "Orca residency timing shifts with prey availability changes.",
      source: "Estimated from salmon run timing shifts — orca follow prey",
      sensitivity: "low"
    },
    salmonRunPeakQuarter: {
      value: 2.4,
      unit: "quarter",
      description: "Aggregate salmon return peak: late summer (Aug-Sep).",
      source: "WDFW run timing data 2015-2024",
      sensitivity: "medium"
    },
    salmonRunShiftRate: {
      value: 3,
      unit: "days/°C",
      description: "Salmon return timing advancement with warming.",
      source: "Crozier et al. 2008 — salmon phenological shifts",
      sensitivity: "medium"
    },
    crabMoltPeakQuarter: {
      value: 1.5,
      unit: "quarter",
      description: "Dungeness crab molting peak: spring-summer (May-Jun).",
      source: "Pauley et al. 1989 — Dungeness crab life history",
      sensitivity: "low"
    },
    crabMoltAdditionalMortality: {
      value: 0.015,
      unit: "fraction",
      description: "Additional per-quarter mortality during molt peak from soft-shell vulnerability.",
      source: "Estimated — soft-shell crabs have ~3× predation risk (Fernandez et al. 1993)",
      sensitivity: "low"
    },
    herringSeasonalAmplitude: {
      value: 0.3,
      unit: "fraction",
      description: "Fraction of herring target driven by seasonal spawning modifier (remainder is baseline).",
      source: "Calibrated to maintain annual mean herring ~0.35",
      sensitivity: "medium"
    },
    orcaSeasonalAmplitude: {
      value: 0.1,
      unit: "fraction",
      description: "Fraction of orca prey availability driven by seasonal residency modifier.",
      source: "Calibrated to maintain annual mean orca population ~74",
      sensitivity: "medium"
    },
    smoltMismatchSensitivity: {
      value: 0.15,
      unit: "fraction",
      description: "Maximum ocean survival reduction from smolt-zooplankton phenological mismatch.",
      source: "Cushing 1990 match-mismatch hypothesis; Beaugrand et al. 2003",
      sensitivity: "high"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // HOOD CANAL 2-LAYER FJORD MODEL (computeMarineBasins.js)
  // ─────────────────────────────────────────────────────────────────────────────
  hoodCanalFjord: {
    name: "Hood Canal 2-Layer Fjord Physics",

    sillDepth: {
      value: 50,
      unit: "m",
      description: "Depth of the entrance sill restricting deep water exchange with Main Basin.",
      source: "Warner et al. 2001; NOAA bathymetric survey — sill at ~50m near Great Bend",
      sensitivity: "high"
    },
    surfaceDepth: {
      value: 30,
      unit: "m",
      description: "Thickness of the surface (photic/mixed) layer above the pycnocline.",
      source: "Newton et al. 2011 — typical surface mixed layer 20-40m in Hood Canal",
      sensitivity: "medium"
    },
    totalDepth: {
      value: 175,
      unit: "m",
      description: "Maximum depth of Hood Canal basin.",
      source: "NOAA nautical chart 18476 — Hood Canal max depth ~175m",
      sensitivity: "low"
    },
    tidalMixing: {
      value: 0.08,
      unit: "dimensionless/quarter",
      description: "Baseline tidal mixing coefficient (reduced by sill restriction).",
      source: "Babson et al. 2006 — tidal energy dissipation in Hood Canal ~40% of Admiralty Inlet",
      sensitivity: "medium"
    },
    windMixingAmplitude: {
      value: 0.10,
      unit: "dimensionless/quarter",
      description: "Peak wind-driven vertical mixing in winter storms.",
      source: "Warner et al. 2001 — winter storms enhance vertical exchange episodically",
      sensitivity: "medium"
    },
    stratificationDampening: {
      value: 0.5,
      unit: "dimensionless",
      description: "How much stratification reduces vertical exchange (0=no effect, 1=full suppression).",
      source: "Calibrated — consistent with Newton et al. 2011 pycnocline stability observations",
      sensitivity: "high"
    },
    deepSOD: {
      value: 0.15,
      unit: "mg/L per quarter",
      description: "Sediment oxygen demand in deep layer per quarter.",
      source: "Newton et al. 2011 — benthic respiration rates in Hood Canal deep basins",
      sensitivity: "high"
    },
    deepBODCoefficient: {
      value: 0.08,
      unit: "dimensionless",
      description: "Fraction of phytoplankton biomass (per 1000 cells) contributing to deep BOD via sinking detritus.",
      source: "Babson et al. 2006 — organic matter flux to deep Hood Canal",
      sensitivity: "medium"
    },
    renewalBaseProbability: {
      value: 0.08,
      unit: "probability/quarter",
      description: "Base probability of deep water renewal event per quarter.",
      source: "Warner et al. 2001 — intrusion events observed ~1-2 per year on average",
      sensitivity: "medium"
    },
    renewalExchangeBoost: {
      value: 0.20,
      unit: "dimensionless",
      description: "Additional vertical exchange during deep water renewal events.",
      source: "Newton et al. 2011 — renewal events increase deep DO by 1-2 mg/L over weeks",
      sensitivity: "high"
    },
    surfaceInitDO: {
      value: 8.0,
      unit: "mg/L",
      description: "Initial surface layer dissolved oxygen.",
      source: "HCDOP monitoring — surface DO typically 7-9 mg/L",
      sensitivity: "low"
    },
    deepInitDO: {
      value: 3.5,
      unit: "mg/L",
      description: "Initial deep layer dissolved oxygen.",
      source: "HCDOP monitoring — deep DO typically 2-5 mg/L, mean ~3.5",
      sensitivity: "low"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PACIFIC COASTAL UPWELLING (computeMarineBasins.js)
  // Seasonal Ekman-driven upwelling pumps deep Pacific water onto the continental
  // shelf and into Juan de Fuca Strait. Primary mechanism for low-DO, low-pH,
  // nutrient-rich water entering the Salish Sea.
  // ─────────────────────────────────────────────────────────────────────────────
  upwelling: {
    name: "Pacific Coastal Upwelling",

    seasonalPeakQuarter: {
      value: 2.5,
      unit: "quarter (0=winter, 1=spring, 2=summer, 3=fall)",
      description: "Upwelling peaks mid-summer (Q2.5 = July-August) when northerly winds are strongest.",
      source: "Hickey & Banas 2003 — Seasonal variation of wind-driven upwelling off Washington coast",
      sensitivity: "medium"
    },
    seasonalWidth: {
      value: 0.8,
      unit: "quarters",
      description: "Gaussian width of seasonal upwelling peak. 0.8 gives ~4-month upwelling season.",
      source: "Calibrated to NANOOS coastal upwelling index seasonality",
      sensitivity: "low"
    },
    baselineIntensity: {
      value: 0.15,
      unit: "dimensionless (0-1)",
      description: "Year-round background upwelling (even in winter, some deep exchange occurs).",
      source: "Thomson & Krassovski 2010 — year-round deep water intrusion into Juan de Fuca",
      sensitivity: "low"
    },
    seasonalAmplitude: {
      value: 0.7,
      unit: "dimensionless",
      description: "Multiplier on seasonal Gaussian peak. Combined with baseline gives max ~0.85.",
      source: "Connolly et al. 2010 — seasonal cycle of shelf-break upwelling",
      sensitivity: "medium"
    },
    pdoModulation: {
      value: 0.15,
      unit: "dimensionless per PDO unit",
      description: "Positive PDO enhances pressure gradients, strengthening upwelling-favorable winds.",
      source: "Mantua et al. 1997 — PDO-upwelling relationship for PNW coast",
      sensitivity: "medium"
    },
    ensoModulation: {
      value: -0.10,
      unit: "dimensionless per ENSO unit",
      description: "El Nino (positive ENSO) suppresses upwelling; La Nina enhances it. Sign is negative because ENSO index sign convention.",
      source: "Schwing et al. 2002 — ENSO modulation of coastal upwelling in the CCS",
      sensitivity: "medium"
    },
    pacificSourceDO: {
      value: 2.0,
      unit: "mg/L",
      description: "Dissolved oxygen of deep Pacific source water (~200-500m). Naturally hypoxic from long ventilation age.",
      source: "Feely et al. 2010 — Pacific deep water DO at shelf break",
      sensitivity: "high"
    },
    pacificSourcepH: {
      value: 7.65,
      unit: "pH",
      description: "pH of deep Pacific source water. Naturally acidified from respiration of sinking organic matter.",
      source: "Feely et al. 2010 — corrosive water on the continental shelf",
      sensitivity: "high"
    },
    pacificSourceSST: {
      value: 7.5,
      unit: "deg C",
      description: "Temperature of deep Pacific source water. Cold relative to surface.",
      source: "Thomson & Krassovski 2010 — JdF deep water temperature profiles",
      sensitivity: "low"
    },
    pacificSourceNutrients: {
      value: 25,
      unit: "umol/L equivalent",
      description: "Nutrient concentration of deep Pacific water. Enriched from remineralization at depth.",
      source: "Mackas & Harrison 1997 — nutrient concentrations on the BC continental shelf",
      sensitivity: "medium"
    },
    upwellFracMax: {
      value: 0.15,
      unit: "fraction per quarter",
      description: "Maximum fraction of JdF deep water replaced by Pacific source water per quarter during peak upwelling. Calibrated down from 0.25 to maintain 15-year salmon stability.",
      source: "Calibrated — Thomson & Krassovski 2010 estimate ~40% replacement annually; reduced to avoid over-acidifying downstream basins",
      sensitivity: "high"
    },
    doClimateDecline: {
      value: -0.3,
      unit: "mg/L per deg C warming",
      description: "Deep Pacific DO declines with warming due to reduced ventilation and increased stratification.",
      source: "Keeling et al. 2010 — ocean deoxygenation under climate change",
      sensitivity: "high"
    },
    phClimateDecline: {
      value: -0.04,
      unit: "pH per deg C warming",
      description: "Deep Pacific pH declines with warming from increased CO2 absorption.",
      source: "Feely et al. 2009 — ocean acidification trends in the Pacific",
      sensitivity: "high"
    },
    nutrientBoost: {
      value: 0.10,
      unit: "dimensionless",
      description: "Additional phytoplankton growth rate boost in JdF from upwelled nutrients.",
      source: "Connolly et al. 2010 — upwelling drives 30-50% of JdF primary production in summer",
      sensitivity: "medium"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ECOSYSTEM SERVICE VALUATION (computeEcosystemServices.js)
  // ─────────────────────────────────────────────────────────────────────────────
  ecosystemServices: {
    name: "Ecosystem Service Valuation",

    salmonFisheryBaseline: {
      value: 200,
      unit: "$M/yr",
      description: "Baseline annual value of commercial + recreational salmon fisheries in the Salish Sea region",
      source: "NOAA Fisheries 2023 — Pacific salmon commercial + recreational value for WA/BC",
      sensitivity: "high"
    },
    shellfishAquacultureBaseline: {
      value: 270,
      unit: "$M/yr",
      description: "Baseline annual value of shellfish aquaculture (oyster, geoduck, Dungeness)",
      source: "Pacific Coast Shellfish Growers Assoc 2023; Taylor Shellfish annual reports",
      sensitivity: "medium"
    },
    whaleWatchingBaseline: {
      value: 120,
      unit: "$M/yr",
      description: "Baseline annual revenue from whale watching tourism",
      source: "Pacific Whale Watch Assoc 2022 economic impact study",
      sensitivity: "high"
    },
    wildlifeViewingBaseline: {
      value: 80,
      unit: "$M/yr",
      description: "Non-cetacean wildlife viewing (seabirds, pinnipeds, sea otters)",
      source: "WA DFW 2022 wildlife viewing economic impact",
      sensitivity: "low"
    },
    blueCarbonRate: {
      value: 2,
      unit: "tCO2/ha/yr",
      description: "Eelgrass blue carbon sequestration rate",
      source: "Howard et al. 2017 — global seagrass carbon review; Prentice et al. 2020 Salish Sea specific",
      sensitivity: "low"
    },
    carbonPrice: {
      value: 50,
      unit: "$/tCO2",
      description: "Carbon price used for blue carbon valuation",
      source: "WA Climate Commitment Act auction results 2023-2024 ($48-56/tCO2)",
      sensitivity: "low"
    },
    floodProtectionBaseline: {
      value: 150,
      unit: "$M/yr",
      description: "Avoided flood damage from coastal wetlands and eelgrass wave attenuation",
      source: "Batker et al. 2008 'Ecosystem Services of Puget Sound' inflated to 2024 dollars",
      sensitivity: "medium"
    },
    waterFiltrationBaseline: {
      value: 100,
      unit: "$M/yr",
      description: "Water filtration services from oyster reefs, wetlands, and riparian buffers",
      source: "Batker et al. 2008; Grabowski et al. 2012 oyster filtration valuation",
      sensitivity: "low"
    },
    recreationBaseline: {
      value: 400,
      unit: "$M/yr",
      description: "Beach, boating, diving, kayaking recreation value",
      source: "WA State Parks 2023; NOAA Office for Coastal Management recreation economics",
      sensitivity: "medium"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CLIMATE DISPLACEMENT & SOCIAL STABILITY (computeUrban.js)
  // ─────────────────────────────────────────────────────────────────────────────
  displacement: {
    name: "Climate Displacement Model",

    relocationCostPerPerson: {
      value: 643000,
      unit: "$/person",
      description: "Cost of permanent relocation per displaced person, based on Quinault Taholah project",
      source: "Quinault Indian Nation Taholah Relocation Plan: $450M / 700 people = ~$643k/person. FEMA 2022 average buyout costs",
      sensitivity: "high"
    },
    housingVacancy: {
      value: 60000,
      unit: "units",
      description: "Available housing stock for displaced populations (~5% of Puget Sound metro)",
      source: "US Census ACS 2023 vacancy data, King/Pierce/Snohomish counties",
      sensitivity: "medium"
    },
    protectionBaseHardArmor: {
      value: 0.95,
      unit: "fraction",
      description: "Initial flood protection capacity under hard armoring strategy",
      source: "USACE Puget Sound levee assessment 2020; Climate Central coastal defense ratings",
      sensitivity: "medium"
    },
    protectionBaseStatusQuo: {
      value: 0.70,
      unit: "fraction",
      description: "Initial flood protection capacity under status quo (no new investment)",
      source: "Climate Central 2024 flood exposure analysis; King County Flood Control District",
      sensitivity: "high"
    },
    protectionBaseLivingShoreline: {
      value: 0.80,
      unit: "fraction",
      description: "Initial flood protection capacity under living shoreline strategy",
      source: "Swinomish Climate Change Initiative 2021; Nature Conservancy 2023 resilience modeling",
      sensitivity: "medium"
    },
    displacementSigmoidMidpoint: {
      value: 0.4,
      unit: "severity",
      description: "Flood severity at which displacement fraction reaches 50% of maximum",
      source: "FEMA flood damage curves 2023; Climate Central displacement modeling",
      sensitivity: "high"
    },
    displacementSigmoidSteepness: {
      value: 12,
      unit: "dimensionless",
      description: "Steepness of sigmoid displacement function",
      source: "Calibrated to match Climate Central 2024 scenario displacement estimates",
      sensitivity: "medium"
    },
    tribalVulnerabilityMultiplier: {
      value: 1.3,
      unit: "multiplier",
      description: "Tribal displacement exceeds general population due to coastal land concentration and treaty fishing area exposure",
      source: "Swinomish Adaptation Plan 2021; NWIFC Climate Change Assessment 2016",
      sensitivity: "high"
    },
    displacementPersistence: {
      value: 0.85,
      unit: "fraction/quarter",
      description: "Fraction of displaced population still displaced next quarter (slow return)",
      source: "FEMA post-disaster housing studies; Hurricane Katrina long-term displacement data (Groen & Polivka 2010)",
      sensitivity: "medium"
    },
    kingTideAmplification: {
      value: 0.08,
      unit: "m effective",
      description: "Additional effective water level during winter king tides (Q1 and Q4)",
      source: "NOAA Tides & Currents; WA Sea Grant king tide monitoring project",
      sensitivity: "low"
    },
    socialStabilityDisplacementWeight: {
      value: 0.35,
      unit: "fraction",
      description: "Weight of displacement pressure in social stability index",
      source: "Calibrated; informed by post-Katrina social disruption literature (Cutter et al. 2008)",
      sensitivity: "high"
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SEA LEVEL RISE & ENSO AMPLIFICATION (orchestrator.js)
  // ─────────────────────────────────────────────────────────────────────────────
  seaLevelRise: {
    name: "Sea Level Rise & ENSO Coupling",

    antarcticRateBaseline: {
      value: 1.5,
      unit: "mm/yr",
      description: "Baseline Antarctic ice sheet contribution to SLR under historical-only scenario",
      source: "IPCC AR6 WG1 Ch9 (Fox-Kemper et al. 2021) — Antarctic contribution 2006-2018",
      sensitivity: "high"
    },
    antarcticAccelerationIPCC: {
      value: 2.5,
      unit: "mm/yr per 75 years",
      description: "Linear acceleration of Antarctic SLR under IPCC likely scenario (slrScenario=1)",
      source: "IPCC AR6 Table 9.9: likely range for Antarctic contribution under SSP2-4.5",
      sensitivity: "high"
    },
    thwaitesCollapseDelay: {
      value: 10,
      unit: "years",
      description: "Years after simulation start before Thwaites collapse ramp-up begins (slrScenario=3)",
      source: "Joughin et al. 2014, Rignot et al. 2014 — current retreat timeline estimates",
      sensitivity: "high"
    },
    thwaitesMaxRate: {
      value: 15,
      unit: "mm/yr",
      description: "Asymptotic Antarctic SLR rate after Thwaites collapse (exponential approach)",
      source: "DeConto & Pollard 2016 — MICI-driven WAIS collapse scenario",
      sensitivity: "high"
    },
    greenlandRateModerate: {
      value: 1.0,
      unit: "mm/yr baseline",
      description: "Greenland ice sheet contribution under moderate scenario (greenlandScenario=1)",
      source: "IPCC AR6 Table 9.9: Greenland contribution under SSP2-4.5",
      sensitivity: "medium"
    },
    thermalExpansionBase: {
      value: 1.5,
      unit: "mm/yr",
      description: "Baseline thermal expansion rate, plus 0.5 mm/yr per degree C of SST anomaly",
      source: "IPCC AR6 Ch9: thermosteric SLR scales approximately linearly with warming",
      sensitivity: "medium"
    },
    nhGravitationalFactor: {
      value: 1.15,
      unit: "dimensionless",
      description: "Northern hemisphere receives ~15% more than global mean SLR due to gravitational self-attraction and rotational effects from Antarctic ice loss",
      source: "Mitrovica et al. 2001, 2009 — gravitational fingerprinting of ice sheet loss",
      sensitivity: "medium"
    },
    thwaitesTippingThreshold: {
      value: 2.5,
      unit: "deg C",
      description: "SST anomaly threshold above which Thwaites collapse auto-triggers (irreversible)",
      source: "Armstrong McKay et al. 2022 — tipping point meta-analysis: WAIS threshold 1.5-3.0C",
      sensitivity: "high"
    },
    ensoWarmingAmplification: {
      value: 0.2,
      unit: "fraction per deg C",
      description: "ENSO amplitude increase per degree C of warming (multiplicative with base ensoAmplification)",
      source: "Cai et al. 2023 Nature — ~40% ENSO amplitude increase per 2C warming",
      sensitivity: "medium"
    },
    thwaitesEnsoBoost: {
      value: 0.3,
      unit: "dimensionless additive",
      description: "Additional ENSO amplification when Thwaites collapse is triggered",
      source: "Conceptual: WAIS collapse disrupts Southern Ocean circulation, teleconnects to tropical Pacific",
      sensitivity: "low"
    },
  },

};
