import { DEF } from './defaults.js';

const SCEN = {
  baseline: { l: "Baseline", p: DEF },
  climate: { l: "Climate stress", p: { ...DEF, marine: { ...DEF.marine, baselineTemperature: 13, stratificationStrength: 70, sspPathway: 2 }, watershed: { ...DEF.watershed, precipitation: 155 } } },
  portExp: { l: "Port expansion", p: { ...DEF, port: { ...DEF.port, containerThroughput: 7000, avgVesselSize: 90, autonomousVessels: 15 }, urban: { ...DEF.urban, population: 11000000, urbanizationRate: 55 } } },
  green: { l: "Green transition", p: { ...DEF, urban: { ...DEF.urban, wastewaterEfficiency: 95, energyCleanFraction: 85, stormwaterInfraAge: 15, crossBorderCoord: 85, greenInfraFraction: 35, dataCenterGrowth: 10, gridInvestment: 70, smrPathway: 1, fusionPathway: 0 }, watershed: { ...DEF.watershed, forestCover: 78, imperviousSurface: 10, riparianBufferWidth: 60, nutrientMgmt: 80 }, ecosystem: { ...DEF.ecosystem, protectedAreaFraction: 35, fishingPressure: 20, orcaProtectionLevel: 80, greenCrabRemoval: 80, coManagementIndex: 85, eelgrassRestoration: 70, fishPassageInvestment: 80, aquacultureIntensity: 0, slrAdaptation: 2 }, port: { ...DEF.port, shorepower: 80, tourismLevel: 80, vesselSpeedZone: 80, altFuelFraction: 60 }, marine: { ...DEF.marine, sspPathway: 0, tidalEnergyExtraction: 40, slrScenario: 1, greenlandScenario: 1 } } },
  collapse: { l: "Collapse", p: { ...DEF, watershed: { ...DEF.watershed, forestCover: 25, imperviousSurface: 50, agriculturalArea: 45, riparianBufferWidth: 5 }, urban: { ...DEF.urban, population: 12000000, urbanizationRate: 65, wastewaterEfficiency: 40, stormwaterInfraAge: 80, crossBorderCoord: 15, greenInfraFraction: 0, dataCenterGrowth: 25, gridInvestment: 10, smrPathway: 0, fusionPathway: 0 }, ecosystem: { ...DEF.ecosystem, fishingPressure: 85, protectedAreaFraction: 5, orcaProtectionLevel: 10, greenCrabRemoval: 0, coManagementIndex: 10, fishPassageInvestment: 5, aquacultureIntensity: 70, slrAdaptation: 0 }, marine: { ...DEF.marine, slrScenario: 2, greenlandScenario: 2 } } },
  energy_crunch: { l: "Energy crunch", p: { ...DEF, urban: { ...DEF.urban, dataCenterGrowth: 28, gridInvestment: 10, smrPathway: 0, fusionPathway: 0 }, watershed: { ...DEF.watershed, precipitation: 80 } } },
  nuclear_renaissance: { l: "Nuclear renaissance", p: { ...DEF, urban: { ...DEF.urban, smrPathway: 3, fusionPathway: 2, gridInvestment: 60, dataCenterGrowth: 20 } } },
  distributed_resilience: { l: "Distributed resilience", p: { ...DEF, urban: { ...DEF.urban, gridInvestment: 80, dataCenterGrowth: 10, smrPathway: 1, fusionPathway: 0 }, marine: { ...DEF.marine, tidalEnergyExtraction: 50 } } },
  grid_collapse: { l: "Grid collapse", p: { ...DEF, urban: { ...DEF.urban, dataCenterGrowth: 30, gridInvestment: 5, stormwaterInfraAge: 90, smrPathway: 0, fusionPathway: 0 }, watershed: { ...DEF.watershed, precipitation: 70 } } },
  thwaites_collapse: { l: "Thwaites Collapse", p: { ...DEF, marine: { ...DEF.marine, slrScenario: 3, sspPathway: 2, ensoAmplification: 1.4 } } },
  wais_greenland: { l: "WAIS + Greenland", p: { ...DEF, marine: { ...DEF.marine, slrScenario: 4, greenlandScenario: 3, sspPathway: 2, ensoAmplification: 1.6 } } },
  save_hood_canal: {
    l: "Save Hood Canal",
    d: "Hood Canal suffers chronic deep-water hypoxia with recurring fish kills. Can local nutrient reduction overcome worsening Pacific source water? A test of whether local action can outrun global change.",
    p: {
      ...DEF,
      urban: { ...DEF.urban, wastewaterEfficiency: 92, greenInfraFraction: 30, stormwaterInfraAge: 20 },
      watershed: { ...DEF.watershed, riparianBufferWidth: 60, nutrientMgmt: 85, agriculturalArea: 12 },
      ecosystem: { ...DEF.ecosystem, fishingPressure: 25, eelgrassRestoration: 60, protectedAreaFraction: 25, slrAdaptation: 2, greenCrabRemoval: 40 },
    },
  },
  hood_canal_collapse: {
    l: "Hood Canal Collapse",
    d: "What happens when warming Pacific source water meets increased local nutrient loading? Hood Canal's weak tidal mixing (0.05) cannot compensate — hypoxia intensifies, shellfish die, and the basin tips toward a dead zone.",
    p: {
      ...DEF,
      urban: { ...DEF.urban, wastewaterEfficiency: 50, population: 10500000, urbanizationRate: 55, greenInfraFraction: 0, stormwaterInfraAge: 80 },
      watershed: { ...DEF.watershed, forestCover: 40, imperviousSurface: 35, agriculturalArea: 35, riparianBufferWidth: 10, nutrientMgmt: 5 },
      marine: { ...DEF.marine, sspPathway: 2, baselineTemperature: 13 },
      ecosystem: { ...DEF.ecosystem, fishingPressure: 60, eelgrassRestoration: 0, protectedAreaFraction: 5, slrAdaptation: 0 },
    },
  },
  // ── NEW MODULE SHOWCASE SCENARIOS ──
  blob_returns: {
    l: "The Blob Returns",
    d: "A marine heat wave like the 2014-2016 Blob returns — warmer, longer, and more devastating. Local management is good, but the Pacific turns hostile. Can local action compensate for ocean-scale forcing?",
    p: {
      ...DEF,
      pacific: { ...DEF.pacific, mhwProbabilityMod: 300, alaskaHatcheryCompetition: 80, upwellingModifier: 70 },
      climate: { ...DEF.climate, pdoPhaseOverride: 1, smokeTransportEfficiency: 80 },
      marine: { ...DEF.marine, baselineTemperature: 13, sspPathway: 2, ensoAmplification: 1.5 },
      // Local management stays good
      ecosystem: { ...DEF.ecosystem, protectedAreaFraction: 25, orcaProtectionLevel: 70, eelgrassRestoration: 40 },
      fisheries: { ...DEF.fisheries, orcaPreyProtectionLevel: 80, harvestRuleStrictness: 80 },
    },
  },
  infrastructure_collapse: {
    l: "Infrastructure Collapse",
    d: "A major atmospheric river triggers simultaneous landslides on I-5 and BNSF rail — exactly like March 2026 Chuckanut, but with a moderate earthquake during recovery. Tests cascading failure across the region's fragile transportation spine.",
    p: {
      ...DEF,
      infrastructure: { ...DEF.infrastructure, i5MaintenanceInvestment: 15, railSafetyInvestment: 15, ferryInvestment: 10, bcHighwayResilience: 20, leveeInvestment: 10, gridHardeningInvestment: 15, waterInfraInvestment: 20, infrastructureRedundancy: 5 },
      climate: { ...DEF.climate, arIntensityMod: 180 },
      marine: { ...DEF.marine, sspPathway: 2 },
    },
  },
  tribal_renaissance: {
    l: "Tribal Renaissance",
    d: "Treaty rights fully funded. Co-management capacity at 90%. TEK guiding restoration priorities across all watersheds. What happens when Indigenous governance leads?",
    p: {
      ...DEF,
      tribal: { treatyImplementation: 95, tribalManagementFunding: 90, tekIntegration: 80, tribalRestorationInvestment: 85, culturalSiteProtection: 90 },
      ecosystem: { ...DEF.ecosystem, coManagementIndex: 90, fishingPressure: 25, protectedAreaFraction: 35, fishPassageInvestment: 80, eelgrassRestoration: 70, greenCrabRemoval: 70 },
      psWatersheds: { ...DEF.psWatersheds, skagitDamPolicy: 80, nisquallyRestorationLevel: 90, psHabitatInvestment: 80 },
      fraser: { ...DEF.fraser, bigBarPassage: 95, fraserHabitatRestoration: 80, fraserFishingPressure: 20 },
      nearshore: { ...DEF.nearshore, armorRemovalRate: 500, pocketEstuaryRestoration: 80, marshRestorationRate: 300, nearshoreInvestment: 80 },
      fisheries: { ...DEF.fisheries, orcaPreyProtectionLevel: 80, harvestRuleStrictness: 70, stockAssessmentFunding: 80 },
    },
  },
  silent_crisis: {
    l: "Silent Crisis",
    d: "No disasters, no policy failures — just 50 years of slow Pacific source water deoxygenation and acidification. The crisis nobody sees coming. Local management looks fine, but global forcing changes everything.",
    p: {
      ...DEF,
      marine: { ...DEF.marine, sspPathway: 2 },
      pacific: { ...DEF.pacific, pacificO2DeclineRate: 12, pacificDICIncrease: 200 },
      biogeochem: { ...DEF.biogeochem, atmosphericCO2: 450 },
      // Everything else at default — the threat is global, not local
    },
  },
  perfect_storm: {
    l: "Perfect Storm",
    d: "Everything goes wrong at once: atmospheric river, marine heat wave, wildfire smoke, and infrastructure failure. Compound events under climate change — the real threat isn't individual disasters.",
    p: {
      ...DEF,
      climate: { ...DEF.climate, arIntensityMod: 180, smokeTransportEfficiency: 90 },
      pacific: { ...DEF.pacific, mhwProbabilityMod: 250, upwellingModifier: 60 },
      marine: { ...DEF.marine, sspPathway: 2, baselineTemperature: 13, ensoAmplification: 1.5 },
      infrastructure: { ...DEF.infrastructure, i5MaintenanceInvestment: 15, railSafetyInvestment: 15, leveeInvestment: 10, gridHardeningInvestment: 15 },
      fraser: { ...DEF.fraser, fireSuppressionEffort: 10, forestryIntensity: 70 },
      publicHealth: { ...DEF.publicHealth, smokePreparedness: 15, drinkingWaterInvestment: 30 },
    },
  },
  restoration_nation: {
    l: "Restoration Nation",
    d: "Maximum investment in everything — habitat, infrastructure, fisheries, tribal co-management, public health, climate adaptation. Ambitious realism under moderate warming. What responds fast, what takes decades?",
    p: {
      ...DEF,
      marine: { ...DEF.marine, sspPathway: 1 },
      ecosystem: { ...DEF.ecosystem, fishingPressure: 15, protectedAreaFraction: 40, orcaProtectionLevel: 90, fishPassageInvestment: 95, eelgrassRestoration: 80, greenCrabRemoval: 80, coManagementIndex: 90, aquacultureIntensity: 5, slrAdaptation: 2 },
      fraser: { ...DEF.fraser, bigBarPassage: 100, fraserHabitatRestoration: 90, fraserFishingPressure: 10, nechakoDiversionFrac: 50 },
      psWatersheds: { ...DEF.psWatersheds, skagitDamPolicy: 90, nisquallyRestorationLevel: 95, psHabitatInvestment: 90, nooksackDairyIntensity: 30 },
      nearshore: { ...DEF.nearshore, armorRemovalRate: 500, pocketEstuaryRestoration: 80, marshRestorationRate: 300, nearshoreInvestment: 90, superfundRemediationRate: 80 },
      fisheries: { ...DEF.fisheries, orcaPreyProtectionLevel: 80, harvestRuleStrictness: 75, stockAssessmentFunding: 85, markSelectiveFishing: 70 },
      tribal: { treatyImplementation: 90, tribalManagementFunding: 85, tekIntegration: 70, tribalRestorationInvestment: 80, culturalSiteProtection: 85 },
      infrastructure: { ...DEF.infrastructure, i5MaintenanceInvestment: 85, railSafetyInvestment: 75, ferryInvestment: 80, bcHighwayResilience: 70, leveeInvestment: 75, gridHardeningInvestment: 70, waterInfraInvestment: 75, infrastructureRedundancy: 60 },
      publicHealth: { ...DEF.publicHealth, habMonitoringIntensity: 80, drinkingWaterInvestment: 85, smokePreparedness: 70, sewerSeparation: 60 },
      urban: { ...DEF.urban, wastewaterEfficiency: 92, energyCleanFraction: 80, greenInfraFraction: 35, gridInvestment: 70 },
      port: { ...DEF.port, shorepower: 80, vesselSpeedZone: 70, altFuelFraction: 50 },
    },
  },
  environmental_justice: {
    l: "Environmental Justice",
    d: "Environmental burdens fall disproportionately on tribal and frontline communities — Duwamish Superfund, Commencement Bay contamination, Nooksack dairy, BC fire smoke — while investment goes elsewhere.",
    p: {
      ...DEF,
      tribal: { treatyImplementation: 30, tribalManagementFunding: 10, tekIntegration: 5, tribalRestorationInvestment: 10, culturalSiteProtection: 15 },
      nearshore: { ...DEF.nearshore, superfundRemediationRate: 5, nearshoreInvestment: 5, armorRemovalRate: 20 },
      psWatersheds: { ...DEF.psWatersheds, nooksackDairyIntensity: 90, puyallupUrbanGrowth: 80, psHabitatInvestment: 5 },
      fraser: { ...DEF.fraser, miningIntensity: 70, fraserUrbanization: 80, fireSuppressionEffort: 15 },
      publicHealth: { ...DEF.publicHealth, habMonitoringIntensity: 20, drinkingWaterInvestment: 25, smokePreparedness: 10, sewerSeparation: 10 },
      urban: { ...DEF.urban, wastewaterEfficiency: 50, stormwaterInfraAge: 75, greenInfraFraction: 0 },
      ecosystem: { ...DEF.ecosystem, fishingPressure: 60, protectedAreaFraction: 5, coManagementIndex: 15 },
    },
  },
  // ── DILBIT SPILL SCENARIO (Greene & Aschoff 2023) ──
  trans_mountain_spill: {
    l: "Trans Mountain Tanker Spill",
    d: "Diluted bitumen (dilbit) spill from tanker in San Juan Archipelago. Unlike conventional crude, dilbit sinks — reaching the seafloor to smother sand wave fields, rocky reefs, eelgrass beds, and shellfish habitat. Benthic recovery takes 5-20 years, far longer than surface spills. Fishery closures devastate tribal and commercial harvest. The scenario Dr. Greene warns about.",
    p: {
      ...DEF,
      // Good management otherwise — the spill is the exogenous shock
      ecosystem: { ...DEF.ecosystem, protectedAreaFraction: 25, orcaProtectionLevel: 70, eelgrassRestoration: 40 },
      fisheries: { ...DEF.fisheries, orcaPreyProtectionLevel: 70, harvestRuleStrictness: 70 },
      tribal: { treatyImplementation: 70, tribalManagementFunding: 60, tekIntegration: 50, tribalRestorationInvestment: 50, culturalSiteProtection: 60 },
    },
    autoTrigger: { dilbitSpill: 0.8 },
  },

  // ── CASCADIA M9 SCENARIOS ──
  cascadia_m9: {
    l: "Cascadia M9",
    d: "The Big One. Full Cascadia Subduction Zone M9.0 megathrust rupture with tsunami, liquefaction, Fraser Delta collapse, and multi-decade recovery. The existential hazard for the Salish Sea — everything else becomes secondary when the ground shakes for 4 minutes.",
    p: {
      ...DEF,
      // Infrastructure at baseline investment — unprepared
      infrastructure: { ...DEF.infrastructure, i5MaintenanceInvestment: 50, railSafetyInvestment: 40, ferryInvestment: 30 },
    },
    autoTrigger: { cascadia_m9: true },
  },
  seismic_preparedness: {
    l: "Seismic Preparedness",
    d: "Same M9 event but with decades of preparedness investment — seismic retrofits, ShakeAlert early warning, pre-positioned supplies, liquefaction mitigation. How much difference does preparation make?",
    p: {
      ...DEF,
      infrastructure: { ...DEF.infrastructure, i5MaintenanceInvestment: 85, railSafetyInvestment: 80, ferryInvestment: 75, bcHighwayResilience: 70, leveeInvestment: 80, gridHardeningInvestment: 75, waterInfraInvestment: 80, infrastructureRedundancy: 60 },
      urban: { ...DEF.urban, wastewaterEfficiency: 90, greenInfraFraction: 25 },
    },
    autoTrigger: { cascadia_m9: true },
  },
  big_one_plus_climate: {
    l: "The Big One + Climate",
    d: "M9 occurs in 2040 after 1.5°C of additional warming. Sea level is 0.3m higher (amplifies tsunami). Infrastructure already stressed from climate adaptation costs. Recovery slower because the economy was already strained. The worst-case compound scenario.",
    p: {
      ...DEF,
      marine: { ...DEF.marine, sspPathway: 2, slrScenario: 2, greenlandScenario: 1, baselineTemperature: 13, ensoAmplification: 1.4 },
      infrastructure: { ...DEF.infrastructure, i5MaintenanceInvestment: 35, railSafetyInvestment: 30, ferryInvestment: 25, gridHardeningInvestment: 30 },
      urban: { ...DEF.urban, population: 10500000, urbanizationRate: 55, energyCleanFraction: 50 },
      watershed: { ...DEF.watershed, forestCover: 55, imperviousSurface: 25 },
      pacific: { ...DEF.pacific, pacificO2DeclineRate: 10 },
    },
    autoTrigger: { cascadia_m9: true },
  },
  pinniped_dilemma: {
    l: "Pinniped Management Dilemma",
    d: "Harbor seals eat salmon. Salmon feed SRKW orca. Bigg's orca eat seals. What happens if we cull seals to help salmon? Bigg's population declines as unintended consequence. A real policy debate in WA and BC.",
    p: {
      ...DEF,
      ecosystem: { ...DEF.ecosystem, pinnipedCulling: 50, fishingPressure: 25, orcaProtectionLevel: 70 },
    },
  },
};

// Scenario identifiers that auto-trigger the cascadia_m9 shock and surface
// M9 engine state via results.cascadiaM9. Consumed by Research M9 Detail tab
// visibility gating (Stage 2A) and Policy M9 Detail entry (Stage 2B). All
// three scenarios above carry `autoTrigger: { cascadia_m9: true }` — keep this
// set in sync if a fourth M9 scenario is added.
const M9_SCENARIOS = new Set(['cascadia_m9', 'seismic_preparedness', 'big_one_plus_climate']);

export { SCEN, M9_SCENARIOS };
