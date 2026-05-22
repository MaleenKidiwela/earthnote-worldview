const DEF = {
  watershed: { forestCover: 65, imperviousSurface: 15, precipitation: 120, agriculturalArea: 20, riparianBufferWidth: 30, nutrientMgmt: 20, damRemovalPolicy: 0, waterConservation: 30, instreamFlowProtection: 20 },
  port: { containerThroughput: 3500, avgVesselSize: 50, dredgingIntensity: 30, shorepower: 20, tourismLevel: 60, militaryPresence: 40, autonomousVessels: 0, vesselSpeedZone: 0, altFuelFraction: 5, ballastTreatment: 30, cruiseShipCalls: 100, cruiseShipRegulation: 0, whaleWatchIntensity: 50, seattleThroughput: 100, tacomaThroughput: 100, vancouverThroughput: 100, bellinghamGrowthRate: 15, bremertonNavalActivity: 70, seattleCruiseCalls: 275, vancouverCruiseCalls: 327, victoriaCruiseCalls: 316, seattleShorepower: 30, tacomaShorepower: 40, vancouverShorepower: 80, seattleVesselSpeed: 50, tacomaVesselSpeed: 50, vancouverVesselSpeed: 50, environmentalLevyRate: 0 },
  // 9000000 = Salish Sea watershed total: Puget Sound metro 4.5M (PSRC 2025) + broader WA 600K
  // + Metro Vancouver 2.8M (StatCan 2021) + Victoria CMA 420K + other BC 300K + tribal/rural 380K
  urban: { population: 9000000, urbanizationRate: 35, wastewaterEfficiency: 75, energyCleanFraction: 45, stormwaterInfraAge: 55, crossBorderCoord: 50, greenInfraFraction: 5, urbanDensity: 50, dataCenterGrowth: 15, gridInvestment: 30, smrPathway: 1, fusionPathway: 0, insuranceBaseRate: 50, stormwaterTreatment: 20, microplasticReduction: 10, wastewaterInvestment: 30, populationGrowthRate: 1.2, lightPollutionReduction: 0, pharmReduction: 0 },
  marine: { tidalExchangeRate: 60, baselineTemperature: 11.5, oceanCurrentStrength: 70, stratificationStrength: 50, sspPathway: 1, tidalEnergyExtraction: 0, slrScenario: 1, greenlandScenario: 1, ensoAmplification: 1.0 },
  ecosystem: { baselineBiodiversity: 72, fishingPressure: 40, protectedAreaFraction: 15, orcaProtectionLevel: 40, hatcheryFraction: 35, greenCrabRemoval: 10, compensatoryMortality: 40, coManagementIndex: 50, eelgrassRestoration: 0, fishPassageInvestment: 20, aquacultureIntensity: 30, aquaculturePolicy: 0, slrAdaptation: 1, pinnipedCulling: 0 },
  fraser: { nechakoDiversionFrac: 0, pineBeetleSeverity: 60, fireSuppressionEffort: 50, miningIntensity: 30, forestryIntensity: 40, fraserAgIntensity: 50, fraserUrbanization: 60, bigBarPassage: 70, fraserHabitatRestoration: 20, fraserFishingPressure: 30, sockeyeHatchery: 20, chinookHatchery: 30 },
  climate: { arIntensityMod: 100, pdoPhaseOverride: 0, smokeTransportEfficiency: 60, fogDeclineRate: 2 },
  pacific: { upwellingModifier: 100, pacificO2DeclineRate: 5, pacificDICIncrease: 100, alaskaHatcheryCompetition: 50, mhwProbabilityMod: 100 },
  biogeochem: {
    denitrificationRate: 15, sedimentOxygenDemand: 100, calcificationRate: 100, atmosphericCO2: 420, sedimentBurialRate: 40,
    // Sediment sub-model parameters.
    // Values stored in native units (fractions, rates per month, multipliers). This differs
    // from the scaled-integer convention used elsewhere in this file; the sediment sub-object
    // represents the go-forward standard for new parameter groups.
    sediment: {
      sinkingFrac: 0.30,         // fraction of NPP that sinks below surface
      benthicFluxFrac: 0.50,     // fraction of sinking flux reaching benthos
      benthicAccumFrac: 0.40,    // fraction of benthic flux accumulating in sediment pool
      q10: 2.0,                  // Q10 temperature sensitivity (reference 10°C)
      decayRatePerMonth: 0.003,  // first-order decomposition rate at 10°C (Burdige 2006)
      burialO2Min: 0.8,          // O2 burial-efficiency clamp floor
      burialO2Max: 2.0,          // O2 burial-efficiency clamp ceiling
      // Session 2b: substrate-dependent decomposition (Keil et al. 1994, Burdige 2007 Table 2).
      // k_effective = decayRatePerMonth × (mudFactor × mud + coarseFactor × (1 − mud)).
      substrateMudFactor: 0.4,   // pure-mud endpoint (preservation via mineral surface binding)
      substrateCoarseFactor: 1.6,// pure-coarse endpoint (oxic sandy decomposition)
      // Session 2b: resuspension (Sanford & Maa 2001, Le Hir et al. 2001 for threshold).
      // resuspensionCoefPerMonth: 0.01 — initial value, order-of-magnitude plausible. Literature
      // form (Partheniades-Ariathurai) is cited; empirical coefficient requires calibration
      // against sediment flux measurements in the Salish Sea. Candidate calibration datasets:
      // NOAA PRISM sediment cores, Hood Canal Dissolved Oxygen Program sediment traps.
      // Refine in future work.
      resuspensionThreshold: 0.15,      // m/s — cohesive mud critical depth-avg current
      resuspensionCoefPerMonth: 0.01,   // fraction/month per (current − threshold)/threshold
      maxResuspendFracPerMonth: 0.15,   // safety cap for extreme currents
      // Sediment phase-coupling (pre-reg 09fd936 + §11 Amendments). Default 1.0 = mechanism-neutral
      // middle of pre-reg §4 range β ∈ [0.5, 2.0]; central value selected by hindcast sweep tie-break.
      stratDeficitBeta: 1.0,            // SOD-to-deep-DO modulation coefficient (advisory path)
    },
  },
  psWatersheds: { skagitDamPolicy: 50, nisquallyRestorationLevel: 60, nooksackDairyIntensity: 70, puyallupUrbanGrowth: 50, stillaguamishForestry: 40, psHabitatInvestment: 30 },
  nearshore: { armorRemovalRate: 100, pocketEstuaryRestoration: 25, marshRestorationRate: 50, superfundRemediationRate: 30, nearshoreInvestment: 20, benthicProtection: 30, dredgingRestriction: 20 },
  fisheries: { stockAssessmentFunding: 50, harvestRuleStrictness: 60, orcaPreyProtectionLevel: 50, tribalHarvestAllocation: 50, recreationalFishingEffort: 40, markSelectiveFishing: 30, pacificSalmonTreaty: 70 },
  tribal: { treatyImplementation: 70, tribalManagementFunding: 40, tekIntegration: 30, tribalRestorationInvestment: 35, culturalSiteProtection: 50 },
  publicHealth: { habMonitoringIntensity: 50, drinkingWaterInvestment: 60, smokePreparedness: 30, sewerSeparation: 25, fishAdvisoryCompliance: 40 },
  infrastructure: { i5MaintenanceInvestment: 50, railSafetyInvestment: 40, ferryInvestment: 30, bcHighwayResilience: 40, pipelineSafetyInvestment: 45, leveeInvestment: 30, gridHardeningInvestment: 35, waterInfraInvestment: 40, infrastructureRedundancy: 20 },
};

export { DEF };
