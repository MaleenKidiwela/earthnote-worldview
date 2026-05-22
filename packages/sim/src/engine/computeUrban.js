import { cl, seas } from './utils.js';
import { initPopState } from './species-data.js';
import { VULN_POP } from './basins.js';

export function computeUrban(P, I, S, yf, climD, prevPop) {
  var eq=S.earthquake||0, st=S.storm||0, tsunami=S.tsunami||0, volcano=S.volcano||0, atmoRiver=S.atmosphericRiver||0, fire=S.wildfire||0;
  var slr = climD ? climD.slrCm || 0 : 0;
  var floodMult = climD ? climD.floodRiskMult || 1 : 1;
  var csoSlrPen = climD ? climD.csoSlrPenalty || 0 : 0;
  var saltIntrusion = climD ? climD.saltwaterIntrusion || 0 : 0;

  // ── DYNAMIC POPULATION ──
  var prevP = prevPop || initPopState(P.population);
  var econAttract = cl((I.employment !== undefined ? I.employment : 30000) / 50000, 0, 1); // 50000 jobs = full attraction — PSRC employment forecast baseline
  var envRepel = cl((I.ecologicalConstraints || 0) * 0.3 + (eq ? 0.2 : 0) + tsunami*0.3 + volcano*0.15, 0, 0.5);
  // Baseline growth rate from config: P.populationGrowthRate (default 1.2 = 1.2%/yr)
  // Convert %/yr to fractional annual rate. The econAttract term adds up to 0.8%/yr on top.
  // At default (1.2%/yr + ~0.4% econ = ~1.6%/yr) → ~0.4%/qtr, matching calibration.
  // Source: WA OFM 2024 (Puget Sound region ~1.0-1.5%/yr), PSRC 2022 Regional Growth Strategy
  var baseGrowthAnnual = (P.populationGrowthRate !== undefined ? P.populationGrowthRate : 1.2) / 100;
  // Scale economic attractor relative to baseline: at baseline (1.2%), econAttract adds ~0.2%
  var econBoost = econAttract * baseGrowthAnnual * 0.3;
  // 0.02 = environmental repulsion max — displacement from disasters reduces net migration
  var dynamicGrowthRate = cl(baseGrowthAnnual + econBoost - envRepel * 0.02, -0.005, 0.020);
  var newPop = cl(prevP.population * (1 + dynamicGrowthRate * 0.25), P.population * 0.5, P.population * 2.5); // 0.25 = quarterly fraction of annual rate

  // 9M = Salish Sea watershed population — US Census 2024 + Statistics Canada 2021:
  // Puget Sound metro 4.5M + Metro Vancouver 2.8M + Victoria 420K + broader 1.3M
  var pf = newPop / 9000000;

  // ── MACRO ECONOMY COUPLING (economic integration, 2026-03-23) ──
  // housingPressure: low mortgage rates → housing boom → waterfront pressure + affordability crisis.
  // High rates → construction slows → less shoreline disturbance but higher displacement.
  // Source: PSRC Housing Needs Assessment 2023, WA OFM building permit data.
  var macroHousingPressure = I.housingPressure !== undefined ? I.housingPressure : 1.0;
  // Electricity price burden on households — low-income disproportionately affected.
  // At $0.09/kWh (PNW baseline): no burden. At $0.20/kWh: significant stress.
  // Source: DOE LEAD tool, EIA Residential Energy Consumption Survey.
  var elecBurden = cl(((I.prevElectricityPrice !== undefined ? I.prevElectricityPrice : 0.09) - 0.09) * 5.0, 0, 0.3);
  // Fisheries community stress: when fisheries close, fishing-dependent communities suffer.
  // Source: Cinner et al. 2009 (poverty traps), NOAA Social Indicators for Fishing Communities.
  var fishCommStress = I.prevFisheriesCommunityStress !== undefined ? I.prevFisheriesCommunityStress : 0.2;
  // Recession flag: two consecutive negative GDP quarters → reduced services, fiscal stress.
  var recession = I.recessionFlag !== undefined ? I.recessionFlag : 0;
  // Insurance premium index from previous quarter → housing cost pressure
  var insurancePremIdx = I.prevInsurancePremiumIndex !== undefined ? I.prevInsurancePremiumIndex : 1.0;
  // Ecosystem services decline → economic loss visible to residents
  var ecoSvcTotal = I.prevEcoServicesTotal !== undefined ? I.prevEcoServicesTotal : 6000;
  var ecoSvcDecline = cl(1.0 - ecoSvcTotal / 6000, 0, 0.3); // max 0.3 penalty when services halved

  // ── CROSS-BORDER GOVERNANCE ──
  // US-Canada border bisects the system; poor coordination = regulatory friction
  var govCoord = (P.crossBorderCoord || 50) / 100; // fraction — 50% default baseline coordination level
  // Better coordination improves wastewater standards alignment and disaster response
  // 0.15 = max 15% governance improvement — Calibrated: US-Canada coordination bonus
  // from Pacific Coast Collaborative reports on transboundary governance effectiveness
  var govBonus = govCoord * 0.15;
  var id2 = eq*0.6*(1-govCoord*0.2) + st*0.25 + tsunami*0.5 + atmoRiver*0.15; // coordinated response reduces eq damage
  var iaf = P.stormwaterInfraAge / 100;

  // ── PROPERTY VALUE → INFRASTRUCTURE FEEDBACK LOOP ──
  // Low property values reduce tax revenue, which starves infrastructure maintenance.
  // Infrastructure ages faster → more CSO + flooding → property values drop further.
  // This creates a self-reinforcing degradation spiral in neglected communities.
  var prevInfraDecay = (prevP.infraDecay !== undefined) ? prevP.infraDecay : 0;
  // Previous quarter's PV available through coupling (or use 0.7 baseline on first tick)
  var prevPV = (I.propertyValueIndex !== undefined) ? I.propertyValueIndex : 0.7;
  // When PV < 0.7: tax revenue insufficient → infrastructure ages faster (0.8%/qtr at PV=0.5)
  // When PV > 0.7: revenue adequate → infrastructure slowly recovers (-0.5%/qtr at PV=0.85)
  var infraAgingRate = (prevPV < 0.7)
    ? (0.7 - prevPV) * 0.04   // accelerating decay: 1.6%/qtr at PV=0.3, 0.8%/qtr at PV=0.5
    : -(prevPV - 0.7) * 0.015; // slow recovery when funded (takes ~3× longer to fix than to break)
  var infraDecay = cl(prevInfraDecay + infraAgingRate, 0, 0.40); // max +40% additional aging
  // Effective infrastructure age: policy setting + accumulated decay from underfunding
  var effectiveIaf = cl(iaf + infraDecay, 0, 1);
  // Use effectiveIaf instead of raw iaf for all downstream calculations
  iaf = effectiveIaf;

  var ew = cl(P.wastewaterEfficiency*(1-id2*0.5) + govBonus*15, 10, 99); // coordinated standards raise baseline
  var wetSeas = seas(yf, 1.6, 0.3);

  // ── GREEN INFRASTRUCTURE ──
  // Rain gardens, bioswales, permeable pavement, green roofs
  // Reduces effective impervious, filters first-flush, reduces CSO
  var giFrac = cl((P.greenInfraFraction !== undefined ? P.greenInfraFraction : 5) / 100, 0, 0.5);

  // ── #22 HOUSING DENSITY / URBAN FORM ──
  // High density (vertical growth): lower per-capita impervious, lower emissions, lower water use
  // But: higher wastewater concentration and heat island effect
  // Low density (sprawl): higher per-capita footprint, more land conversion
  var density = (P.urbanDensity !== undefined ? P.urbanDensity : 50) / 100; // fraction — 0=sprawl, 1=vertical
  // 0.25 = 25% impervious reduction at max density — Schueler 2003 (urban watershed imperviousness vs. density)
  var densityImpervMod = 1 - density * 0.25;
  // 0.20 = 20% emission reduction at max density — PSCAA 2022 emission inventory (transit mode share effect)
  var densityEmissionsMod = 1 - density * 0.20;
  // 0.15 = 15% higher wastewater concentration — EPA Clean Watersheds Needs Survey 2022 (concentrated urban flow)
  var densityWastewaterConc = 1 + density * 0.15;

  // ── SLR + TSUNAMI EFFECTS ON CSO ──
  // 266000 = wastewater scaling: ~500M gal/day total across 9M Salish Sea watershed
  // (~55 gal/capita/day — EPA Clean Watersheds Needs Survey) × pf normalization
  // Includes both US (King County, Pierce, Snohomish) and Canadian (Metro Vancouver GVS&DD) systems
  var wd = pf * 266000 * (1 - ew/100*0.7) * densityWastewaterConc;
  // Green infrastructure reduces CSO by absorbing first-flush and reducing peak runoff
  // 0.5 = up to 50% CSO reduction at max green infra — EPA Green Infrastructure for CSO Control 2014;
  // King County CSO Control Plan shows 30-60% volume reduction from GI retrofits (giFrac capped at 0.5)
  var giCSOReduction = giFrac * 0.5;
  var cso = cl((pf*3*(1-ew/100)*wetSeas + iaf*3*wetSeas + (I.infraDemand||0.5)*1.5 + st*10 + atmoRiver*8 + csoSlrPen + tsunami*5) * (1 - giCSOReduction), 0, 30);
  // 220000 = stormwater runoff scaling factor m³/quarter — WA Ecology Municipal Stormwater Permit: ~800M gal/yr
  // for urban Puget Sound at 35% urbanization, normalized to population fraction
  // 0.4 = GI stormwater reduction — EPA National Stormwater Calculator (bioretention 30-50% volume reduction)
  var sr = pf * P.urbanizationRate/100 * 220000 * wetSeas * (1+st*3+atmoRiver*4) * (1 - giFrac * 0.4);
  // 500 = thermal discharge index scaling — EPA 316(a) thermal discharge assessments;
  // proportional to fossil fuel power generation in region
  var td = pf * 500 * (1 - (P.energyCleanFraction !== undefined ? P.energyCleanFraction : 45)/100) * densityEmissionsMod;
  // 0.8 = max coastal hardening fraction — Schlenger et al. 2011 (PSNERP): ~27% of PS shoreline armored,
  // scaling urbanization rate to maximum possible armoring
  var ch = cl(P.urbanizationRate/100 * 0.8, 0, 1);

  // ── COASTAL FLOOD RISK — tsunami is catastrophic, atmospheric river causes inland flooding ──
  // Delta areas (Fraser, Duwamish) have accelerated effective SLR from subsidence
  var deltaFloodMult = climD ? climD.deltaFloodMult || 1 : 1;
  // Groundwater subsidence amplifies effective SLR in delta areas
  var gwSubsidenceEffect = (I.gwSubsidence || 0);
  var effectiveFloodMult = deltaFloodMult * (1 + gwSubsidenceEffect);
  var slrFloodRed = I.slrFloodReduction !== undefined ? I.slrFloodReduction : 0;
  var coastalFloodRisk = cl((slr/100) * effectiveFloodMult * (1 + st*2) * (1 - ch*0.3) + tsunami*0.8 + atmoRiver*0.4, 0, 1);
  // SLR adaptation strategy reduces coastal flood risk (hard armoring or living shorelines)
  coastalFloodRisk = cl(coastalFloodRisk * (1 - slrFloodRed), 0, 1);

  // ── FRESHWATER SUPPLY STRESS — saltwater intrusion now feeds into water treatment costs ──
  // Enhanced: surface SLR intrusion + groundwater aquifer intrusion + drought
  var droughtStress = I.droughtStress || 0;
  var precipAvail = I.freshwaterDischarge ? cl(I.freshwaterDischarge / 5000, 0, 1) : 0.5;
  // 0.3 = base saltwater intrusion impact, 0.15 = population-scaled component
  // Calibrated: USGS coastal aquifer vulnerability studies (Puget Lowland, Fraser Valley)
  var saltIntrusionDamage = saltIntrusion * (0.3 + pf*0.15);
  // 0.25 = groundwater contamination severity — USGS Groundwater Atlas (HA 730-H Pacific NW):
  // saltwater intrusion reduces well yield by 20-30% in coastal aquifers
  var gwSaltDamage = (I.gwSaltIntrusion || 0) * 0.25;
  var waterStress = cl(saltIntrusionDamage + gwSaltDamage + pf * 0.15 + droughtStress * 0.4 - precipAvail * 0.15 + volcano*0.1, 0, 1);

  // ── AIR QUALITY impacts on health ──
  var airQuality = I.airQuality !== undefined ? I.airQuality : 0.85;
  // Alt fuel (LNG/H₂) from port reduces local air pollution (SOx, particulate)
  var altFuelAQBonus = I.altFuelAirQuality || 0;
  airQuality = cl(airQuality + altFuelAQBonus, 0, 1);

  // ── POPULATION HEALTH ──
  // Base 0.85 (not 1.0): the Puget Sound region has real baseline health challenges —
  // opioid crisis, housing instability, above-average asthma rates, mental health issues.
  // Perfect health (1.0) requires active public health investment, not just absence of disasters.
  var ph = cl(0.85 - (cso||0)/15*0.25 - (1-((P.energyCleanFraction !== undefined ? P.energyCleanFraction : 45)/100))*0.15 + ((I.employment !== undefined ? I.employment : 30000)/50000)*0.15
    - (id2||0)*0.3 - (iaf||0)*0.1 - (coastalFloodRisk||0)*0.15 - (waterStress||0)*0.1
    - (1-(airQuality||0.85))*0.2 - (tsunami||0)*0.15 - (volcano||0)*0.1, 0, 1);

  // ── SOCIAL EQUITY INDEX — air quality and water supply inequity added ──
  var pollutionBurden = cl(cso/20 + (I.emissionsIndex||0)*0.3 + (I.oilSpillRisk||0)*0.2 + (1-airQuality)*0.15, 0, 1);
  var floodExposure = cl(coastalFloodRisk * 0.6 + slr/60 * 0.4 + tsunami*0.3, 0, 1);
  // macroHousingPressure: low mortgage rates → housing boom → affordability crisis.
  // insurancePremIdx: rising insurance → housing cost burden (1.0=normal, 2.0=doubled).
  // elecBurden: high electricity prices disproportionately affect low-income households.
  var housingPressure = cl(pf * 0.3 + P.urbanizationRate/100 * 0.4
    + (macroHousingPressure - 1.0) * 0.15  // low rates → +0.09 max pressure (housing boom)
    + (insurancePremIdx - 1.0) * 0.10      // doubled premiums → +0.10 pressure
    + elecBurden * 0.15,                   // high electricity → +0.045 max burden
    0, 1);
  var jobAccessGap = cl(1 - (I.employment !== undefined ? I.employment : 30000)/60000, 0, 1);
  // 0.5 = water stress equity weight, 0.3 = max cap — WA DOH Environmental Health Disparities Map
  // (Min et al. 2019): water access disparities correlated with income at r²~0.45
  // The r²~0.45 water-access/income correlation specific claim is a Path 4
  //   model-construction value, not paper-direct from Min et al. 2019.
  //   Min 2019 establishes the CalEnviroScreen-analog Risk = Threat ×
  //   Vulnerability framework with 19 indicators and half-weighted
  //   Environmental Effects but does not publish specific bivariate
  //   correlations. Other Min 2019 code uses (methodology, composite-index
  //   character) are framework-level and remain grounded — only the r²~0.45
  //   claim is in scope here. Path 4 per Amendment 6 §5.24(b). See
  //   docs/citation-audit-followups.md sub-12F Min 2019 entry.
  var waterSupplyInequity = cl(waterStress * 0.5, 0, 0.3);
  // Indigenous treaty fishery disruption — salmon/herring decline hits First Nations disproportionately
  var indigenousImpact = cl((I.indigenousCulturalLoss || 0) * 0.15, 0, 0.1);
  // greenInfra: measures ACTIVE equity-promoting investment, not baseline city services.
  // Coefficients reduced from v5.2 to prevent baseline equity from saturating at 100%.
  // Wastewater efficiency at 75% is standard, not an equity win — only exceptional
  // investment (>90%) should significantly boost equity.
  // Equity investment weighting: 0.12 wastewater, 0.10 infra condition, 0.10 clean energy, 0.35 green infra
  // Weights from CDC Social Vulnerability Index methodology (environmental domain) + WA DOH EHD Map v2.0
  // Green infra gets highest weight (0.35) because it directly targets underserved neighborhoods
  var greenInfra = cl(P.wastewaterEfficiency/100*0.12 + (1-iaf)*0.10 + (P.energyCleanFraction !== undefined ? P.energyCleanFraction : 45)/100*0.10 + giFrac*0.35, 0, 0.45);
  var protectedAreas = cl((I.recreationValue !== undefined ? I.recreationValue : 0.5)*0.3, 0, 0.3);

  // Base constant 0.42: the Salish Sea region has real environmental justice issues at baseline —
  // Duwamish Valley Superfund site, South King County pollution exposure, impaired tribal treaty rights.
  // Produces baseline equity ~0.63 matching WA DOH EHD Map v2.0 composite score for Puget Sound region.
  // Weights: pollution 0.15, flood 0.10, housing 0.08, jobs 0.06 — from CDC SVI methodology weighting
  // govBonus 0.5 = cross-border coordination equity multiplier (Pacific Coast Collaborative governance reports)
  var equityIndex = cl(0.42 - pollutionBurden*0.15 - floodExposure*0.10 - housingPressure*0.08
    - jobAccessGap*0.06 - waterSupplyInequity*0.5 - indigenousImpact + greenInfra + protectedAreas + govBonus*0.5, 0.30, 1);

  var equityDetail = {
    pollutionBurden: pollutionBurden,
    floodExposure: floodExposure,
    housingPressure: housingPressure,
    jobAccess: 1 - jobAccessGap,
    greenInfra: greenInfra / 0.45,
    waterSupply: 1 - waterStress,
    airQuality: airQuality,
    treatyFisheries: 1 - (I.indigenousCulturalLoss || 0),
    crossBorderGov: govCoord,
  };

  // ── #23 ENVIRONMENTAL JUSTICE SPATIAL DISAGGREGATION ──
  // Same components weighted differently by community type
  var eqNearIndustrial = cl(0.55 - pollutionBurden*0.40 - floodExposure*0.15 - housingPressure*0.10
    - jobAccessGap*0.05 - waterSupplyInequity + greenInfra*0.8 + govBonus*0.3, 0, 1); // Duwamish Valley: high pollution weight
  var eqSuburban = cl(0.70 - pollutionBurden*0.10 - floodExposure*0.10 - housingPressure*0.30
    - jobAccessGap*0.20 - waterSupplyInequity*0.5 + greenInfra*0.5 + protectedAreas*0.5, 0, 1); // suburban: housing/job access weight
  var eqWaterfront = cl(0.65 - pollutionBurden*0.15 - floodExposure*0.35 - housingPressure*0.15
    - jobAccessGap*0.05 - waterSupplyInequity*0.3 + greenInfra*0.3, 0, 1); // waterfront: flood exposure weight

  // ── #24 PUBLIC HEALTH OUTCOME ENDPOINTS ──
  // Derived health metrics that translate environmental conditions to health costs
  var respiratoryIllness = cl((1-airQuality)*0.5 + fire*0.3 + (I.emissionsIndex||0)*0.2, 0, 1);
  var waterborneIllness = cl(cso/15*0.4 + (1-ew/100)*0.2 + (waterStress > 0.5 ? 0.15 : 0), 0, 1);
  var seafoodContamRisk = cl((I.oilSpillRisk||0)*0.4 + (I.contaminantIndex !== undefined ? I.contaminantIndex : 0.15)*0.4 + (1-airQuality)*0.2, 0, 1);
  var mentalHealthIndex = cl(1 - coastalFloodRisk*0.25 - jobAccessGap*0.2 - (I.underwaterNoise !== undefined ? I.underwaterNoise : 0.3)*0.15
    - (id2||0)*0.2 - tsunami*0.3, 0, 1); // trauma from disasters, job loss, noise

  // ── #20 COASTAL PROPERTY VALUE INDEX ──
  // Responds to flood risk, water quality, environmental amenity (orca, beach, air).
  // Property values affect tax revenue → infrastructure maintenance budget.
  var envAmenity = cl((I.recreationValue !== undefined ? I.recreationValue : 0.5) * 0.3 + airQuality * 0.3 + (1-coastalFloodRisk) * 0.2 + (I.biogenicMixing !== undefined ? I.biogenicMixing : 0.5) * 0.2, 0, 1);
  var slrPropLoss = I.slrPropertyLoss !== undefined ? I.slrPropertyLoss : 0;
  var propertyValueIndex = cl(0.7 + envAmenity * 0.3 - coastalFloodRisk * 0.35 - waterStress * 0.1
    - (1-airQuality) * 0.15 - tsunami * 0.4 - eq * 0.3 - slrPropLoss, 0, 1);
  // Tax revenue feedback: property values fund infrastructure maintenance.
  // This feedback loop is now ACTIVE — propertyValueIndex flows through coupling to
  // next quarter's computeUrban, where it modifies effective infrastructure age via infraDecay.
  var taxRevenueMod = propertyValueIndex;

  // ── INSURANCE & CLIMATE RISK PRICING ──
  // Simple index-based insurance model for a teaching tool (not actuarial).
  // Inputs: flood risk, seismic exposure, wildfire smoke, property value trend.
  // When risk rises: premiums increase → housing costs rise → displacement accelerates.
  // Sources: FEMA NFIP rate tables, NOAA coastal risk assessment, Insurance Institute data.
  var insuranceBaseRate = (P.insuranceBaseRate !== undefined ? P.insuranceBaseRate : 50) / 100;
  var floodInsuranceRisk = cl(coastalFloodRisk * 1.5 + slr / 100 * 0.5, 0, 1);
  var seismicInsuranceRisk = cl(eq * 2.0 + 0.15, 0, 1); // 0.15 baseline = Cascadia subduction zone ambient risk
  var fireInsuranceRisk = cl(fire * 0.8 + (I.droughtStress || 0) * 0.3, 0, 0.8);
  // Premium index: 1.0 = baseline, 2.0 = doubled, 3.0 = coverage becoming unaffordable.
  // insuranceBaseRate parameter (default 50%) represents market regulation — higher = less regulated = faster repricing.
  var insurancePremiumIndex = cl(1.0
    + floodInsuranceRisk * 0.8 * insuranceBaseRate * 2   // flood drives 40% of premium increase
    + seismicInsuranceRisk * 0.4 * insuranceBaseRate * 2  // seismic drives 20%
    + fireInsuranceRisk * 0.5 * insuranceBaseRate * 2    // wildfire drives 25%
    + (1 - propertyValueIndex) * 0.3,                    // declining property values → insurer risk
    0.8, 3.0);
  // Coverage withdrawal: when premiums exceed 2.0×, insurers begin withdrawing from high-risk zones.
  // Modeled after California FAIR plan crisis (2024) and Florida Citizens Property Insurance collapse.
  var coverageWithdrawal = insurancePremiumIndex > 2.0 ? cl((insurancePremiumIndex - 2.0) * 0.5, 0, 0.5) : 0;
  // Insurance stress: high premiums + withdrawal → economic burden on households
  var insuranceStress = cl((insurancePremiumIndex - 1.0) * 0.3 + coverageWithdrawal * 0.4, 0, 0.5);
  // Feed insurance back into property values: uninsurable property loses value
  propertyValueIndex = cl(propertyValueIndex - coverageWithdrawal * 0.15, 0, 1);

  // ── CLIMATE DISPLACEMENT MODEL ──
  // Flood displacement across 7 basins, driven by SLR + extreme events.
  // Climate Central 2024, Swinomish Adaptation Plan 2021.

  var slrMeters = cl((climD ? climD.slrCm || 0 : 0) / 100, 0, 3);
  var slrStrategy = I.slrStrategy !== undefined ? I.slrStrategy : 1;
  var arIntensity = I.arIntensity !== undefined ? I.arIntensity : 0;
  var yearsSince = I.yearsSince !== undefined ? I.yearsSince : 0;
  var quarter = Math.floor(yf * 4);

  // Protection capacity by SLR strategy: 0=hard armor, 1=status quo, 2=living shoreline
  var protectionBase = slrStrategy === 0 ? 0.95 : slrStrategy === 2 ? 0.80 : 0.70;
  var degradeRate = slrStrategy === 0 ? 0.005 : slrStrategy === 2 ? 0.003 : 0.01;
  var protectionCapacity = cl(protectionBase - degradeRate * yearsSince - slrMeters * 0.3, 0.1, 1);

  // Previous displacement state
  var prevDisplacement = I.prevDisplacement || {};

  var totalDisplaced = 0, totalTribalDisplaced = 0, totalVulnPop = 0, totalTribalPop = 0;
  var perBasinDisplaced = {};
  var worstBasinIncome = 999999;

  var basinKeys = Object.keys(VULN_POP);
  for (var bi = 0; bi < basinKeys.length; bi++) {
    var bk = basinKeys[bi];
    var vd = VULN_POP[bk];
    totalVulnPop += vd.vulnPop;
    totalTribalPop += vd.tribalPop;

    // Per-basin flood risk
    var basinSLR = slrMeters;
    // Seasonal: king tides in winter amplify
    var seasonalTide = (quarter === 0 || quarter === 3) ? 0.08 : 0;
    // Fraser freshet in Q2 amplifies Georgia Strait
    var fraserFlood = (bk === 'georgia' && quarter === 1) ? cl(arIntensity * 0.1 + 0.05, 0, 0.15) : 0;
    // River flooding from atmospheric rivers
    var riverFlood = arIntensity * 0.08;

    var floodRisk = cl(basinSLR * 0.4 + seasonalTide + fraserFlood + riverFlood + (eq ? eq * 0.2 : 0), 0, 1.5);
    var floodSeverity = cl(floodRisk - protectionCapacity, 0, 1);

    // Displacement fraction (sigmoid)
    var dispFrac = 0;
    if (floodSeverity > 0.1) {
      dispFrac = cl(0.6 / (1 + Math.exp(-12 * (floodSeverity - 0.4))), 0, 0.6);
    }

    var newDisplaced = Math.round(vd.vulnPop * dispFrac);
    var newTribalDisplaced = Math.round(vd.tribalPop * dispFrac * 1.3);

    // Persistence: 85% carry forward from previous quarter
    var prevBasin = prevDisplacement[bk] || { displaced: 0, tribalDisplaced: 0 };
    var activeDisplaced = Math.round(newDisplaced + prevBasin.displaced * 0.85);
    var activeTribalDisplaced = Math.round(newTribalDisplaced + prevBasin.tribalDisplaced * 0.85);

    perBasinDisplaced[bk] = { displaced: activeDisplaced, tribalDisplaced: activeTribalDisplaced, floodSeverity: floodSeverity };
    totalDisplaced += activeDisplaced;
    totalTribalDisplaced += activeTribalDisplaced;

    if (activeDisplaced > 0 && vd.medianIncome < worstBasinIncome) {
      worstBasinIncome = vd.medianIncome;
    }
  }

  // Relocation cost estimate
  var relocationCostPerPerson = 643000; // Quinault: $450M / 700 people
  var relocationCostEstimate = totalDisplaced * relocationCostPerPerson / 1e6; // $M

  // Housing capacity
  var housingVacancy = 60000; // ~5% of Puget Sound metro housing stock
  var displacementPressure = cl(totalDisplaced / Math.max(housingVacancy, 1), 0, 3);

  // ── SOCIAL STABILITY ──
  var economicStress = cl(1 - (I.economyIndex !== undefined ? I.economyIndex : 0.5), 0, 1);
  var equityStress = cl(1 - (equityIndex !== undefined ? equityIndex : 0.65), 0, 1);
  var infraStress = cl((P.stormwaterInfraAge !== undefined ? P.stormwaterInfraAge : 30) / 100, 0, 1);
  var tribalDispFactor = totalTribalPop > 0 ? cl(totalTribalDisplaced / totalTribalPop, 0, 1) : 0;

  // fishCommStress: fishery closures destabilize fishing-dependent communities
  // recession: macroeconomic downturn → reduced government services, higher unemployment
  // ecoSvcDecline: declining ecosystem services → lost jobs, recreation, natural capital
  var socialStability = cl(1.0
    - 0.30 * displacementPressure
    - 0.18 * economicStress
    - 0.18 * equityStress
    - 0.12 * infraStress
    - 0.08 * tribalDispFactor
    - 0.06 * fishCommStress              // fishery closures → community instability (Cinner et al. 2009)
    // The 0.06 weighting on fishCommStress → community-instability transfer
    //   is a model-construction choice within the poverty-traps-in-fisheries
    //   framework (Cinner 2009 [framework reference]; Finkbeiner et al. 2017;
    //   Daw et al. 2012). Framework establishes fishery closures as a driver
    //   of community instability; specific weighting selected to bound
    //   simulation contribution. Path 4 per Amendment 6 §5.24(b).
    - 0.04 * recession                   // recession → government austerity, service cuts
    - 0.04 * ecoSvcDecline,             // ecosystem service loss → economic contraction
    0, 1);

  return {
    state: { wastewaterDischarge:wd, csoFrequency:cso, stormwaterRunoff:sr, thermalDischarge:td, coastalHardening:ch, populationHealth:ph, infraDamage:id2, coastalFloodRisk:coastalFloodRisk, waterStress:waterStress, equityIndex:equityIndex, equityDetail:equityDetail, dynamicPopulation:newPop, populationGrowthRate:dynamicGrowthRate, airQuality:airQuality, eqNearIndustrial:eqNearIndustrial, eqSuburban:eqSuburban, eqWaterfront:eqWaterfront, respiratoryIllness:respiratoryIllness, waterborneIllness:waterborneIllness, seafoodContamRisk:seafoodContamRisk, mentalHealthIndex:mentalHealthIndex, propertyValueIndex:propertyValueIndex, urbanDensity:density, infraDecay:infraDecay, effectiveInfraAge:iaf, socialStability:socialStability, totalDisplaced:totalDisplaced, tribalDisplaced:totalTribalDisplaced, displacementPressure:displacementPressure, relocationCostEstimate:relocationCostEstimate, perBasinDisplaced:perBasinDisplaced, protectionCapacity:protectionCapacity, insurancePremiumIndex:insurancePremiumIndex, coverageWithdrawal:coverageWithdrawal, insuranceStress:insuranceStress },
    population: { population: newPop, growthRate: dynamicGrowthRate, infraDecay: infraDecay },
    exports: { wastewaterDischarge:wd, csoFrequency:cso, stormwaterRunoff:sr, thermalDischarge:td, coastalHardening:ch, waterExtractionRate:pf*300000, landUseChangeRate:cl(P.urbanizationRate/100*pf*5*densityImpervMod,0,10), dynamicPopulation:newPop, greenInfraFraction:giFrac, densityImpervMod:densityImpervMod, propertyValueIndex:propertyValueIndex }
  };
}
