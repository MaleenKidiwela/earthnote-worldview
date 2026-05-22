// ═══════════════════════════════════════════════════════════
// computePublicHealth.js — Public Health Engine
// ═══════════════════════════════════════════════════════════
// Connects ecological state to human health outcomes:
// shellfish closures, smoke health burden, drinking water,
// waterborne pathogens, fish advisories, environmental health
// disparities, health costs, and system capacity.
//
// Key references:
//   Trainer et al. 2002 — HABs and shellfish safety
//   Liu et al. 2015 — wildfire smoke health review
//   Baker-Austin et al. 2013 — Vibrio and warming
//   O'Neill & West 2009 — PS Chinook contaminants
//   Min et al. 2019 — WA DOH Environmental Health Disparities Map
//   Vezzulli et al. 2012 — Vibrio range expansion under warming
//   Moore et al. 2019 — HAB trends under climate change
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl, seasonalPeak } from './utils.js';

// Per-basin baseline shellfish bed area (hectares commercially harvestable)
var SHELLFISH_BEDS = {
  juanDeFuca: 400, georgia: 1200, sanjuan: 600, whidbey: 800,
  mainBasin: 500, hoodCanal: 1000, southSound: 1500,
};

// Per-basin hospital capacity (beds per 100k population, urban vs rural)
var HEALTH_CAPACITY = {
  juanDeFuca: 1.5, georgia: 3.5, sanjuan: 0.5, whidbey: 1.2,
  mainBasin: 4.0, hoodCanal: 0.8, southSound: 2.0,
};

export function computePublicHealth(P, prev, shocks, quarter, year, basins, clim, nsr, trb, urban, eco, fm, coupling) {
  var _prev = prev || {};
  var basinKeys = ["juanDeFuca", "georgia", "sanjuan", "whidbey", "mainBasin", "hoodCanal", "southSound"];

  // ── PUBLIC HEALTH PARAMETERS ──
  // Previously hardcoded; now user-adjustable via config/defaults.js
  var PHP = P || {};
  // habMonitoringIntensity (default 50%): reduces HAB-related closure duration through early detection
  var habMonitoring = (PHP.habMonitoringIntensity !== undefined ? PHP.habMonitoringIntensity : 50) / 100;
  // drinkingWaterInvestment (default 60%): reduces drinking water risk through treatment upgrades
  var waterInvestment = (PHP.drinkingWaterInvestment !== undefined ? PHP.drinkingWaterInvestment : 60) / 100;
  // smokePreparedness (default 30%): reduces health burden from wildfire smoke through preparedness
  var smokePrepared = (PHP.smokePreparedness !== undefined ? PHP.smokePreparedness : 30) / 100;
  // sewerSeparation (default 25%): reduces CSO-driven pathogen risk through sewer separation
  var sewerSep = (PHP.sewerSeparation !== undefined ? PHP.sewerSeparation : 25) / 100;
  // fishAdvisoryCompliance (default 40%): reduces exposure from contaminated fish through advisory compliance
  var advisoryComp = (PHP.fishAdvisoryCompliance !== undefined ? PHP.fishAdvisoryCompliance : 40) / 100;

  // Module inputs
  var climState = clim || {};
  var nsrState = nsr || {};
  var trbState = trb || {};
  var urbanState = urban || {};
  var ecoState = eco || {};
  var fmState = fm || {};

  var smokeIndex = climState.climSmokeIndex !== undefined ? climState.climSmokeIndex : 0;
  // 9M = Salish Sea watershed population — US Census 2024 + Statistics Canada 2021
  var population = urbanState.dynamicPopulation !== undefined ? urbanState.dynamicPopulation : 9000000;
  var csoFrequency = urbanState.csoFrequency !== undefined ? urbanState.csoFrequency : 2;
  var airQuality = urbanState.airQuality !== undefined ? urbanState.airQuality : 0.85;

  var results = {};
  var totalClosureDays = 0;
  var totalSmokeBurden = 0;
  var totalHealthCost = 0;
  var totalAdvisoryDays = 0;
  var totalVibrioRisk = 0;
  var totalCapacityStress = 0;
  var totalNoctiluca = 0;

  for (var bi = 0; bi < basinKeys.length; bi++) {
    var id = basinKeys[bi];
    var basin = basins && basins[id] ? basins[id] : {};
    var prevB = _prev[id] || {};

    var sst = basin.SST !== undefined ? basin.SST : 11;
    var wqi = basin.wqi !== undefined ? basin.wqi : 0.6;

    // ── 1. HAB SHELLFISH CLOSURES — 3 species differentiated ──
    // WDOH Biotoxin Monitoring Program thresholds (Moore et al. 2009, Trainer et al. 2003):
    //   Alexandrium catenella: PSP (saxitoxin) — triggered by warm SST + stratification
    //   Pseudo-nitzschia: ASP (domoic acid) — triggered by upwelling + high nutrients
    //   Noctiluca scintillans: non-toxic but indicator — high nutrients + warm water → DO depletion on decay
    var alexIntensity = basin.alexandriumIntensity !== undefined ? basin.alexandriumIntensity : 0;
    var pnIntensity = basin.pseudoNitzschiaIntensity !== undefined ? basin.pseudoNitzschiaIntensity : 0;
    // Noctiluca: nutrient-driven (Fawcett et al. 2018), thrives in warm stratified water
    var noctilucaIntensity = cl((basin.nutrients || 8) / 20 * (sst > 13 ? (sst - 13) / 5 : 0) * 0.6, 0, 0.8);
    var pspClosed = alexIntensity > 0.3 ? 1 : 0;    // shellfish harvest closed
    var aspClosed = pnIntensity > 0.25 ? 1 : 0;      // crab + shellfish closed, mammal strandings
    var noctilucaFishKill = noctilucaIntensity > 0.5 ? cl((noctilucaIntensity - 0.5) * 0.4, 0, 0.2) : 0; // DO crash on bloom decay
    // HAB monitoring reduces closure duration: better monitoring → earlier detection → shorter closures
    var habReduction = habMonitoring * 0.3;
    var closedFrac = cl((pspClosed * 0.5 + aspClosed * 0.5 + (alexIntensity > 0.5 ? 0.3 : 0)) * (1 - habReduction), 0, 1);
    var closureDays = closedFrac * 91.25;
    var closureArea = SHELLFISH_BEDS[id] * closedFrac;
    // HAB species detail for UI
    var habSpecies = { alexandrium: alexIntensity, pseudoNitzschia: pnIntensity, noctiluca: noctilucaIntensity, pspClosed: pspClosed, aspClosed: aspClosed, noctilucaFishKill: noctilucaFishKill };
    // Accumulate closure days
    var prevClosureDays = prevB.cumulativeClosureDays !== undefined ? prevB.cumulativeClosureDays : 0;
    var cumulativeClosureDays = prevClosureDays + closureDays;
    // $0.50/ha/day = shellfish harvest + recreation loss — WA DOH Biotoxin Program cost estimates;
    // WA Sea Grant 2020 shellfish industry valuation ($184M/yr over ~6000 ha commercially active)
    var closureCost = closureArea * 0.5;

    // ── 2. DRINKING WATER RISK ──
    // Turbidity from ARs/landslides, cyanobacteria from warming reservoirs
    var turbidityRisk = cl(csoFrequency / 10, 0, 0.5);
    var cyanoRisk = sst > 18 ? cl((sst - 18) * 0.15, 0, 0.4) : 0; // warm reservoirs → blooms
    var fireAshRisk = cl(smokeIndex * 0.3, 0, 0.3); // post-fire watershed contamination
    // drinkingWaterInvestment reduces risk through treatment upgrades (up to 40% reduction)
    var drinkingWaterRisk = cl((turbidityRisk + cyanoRisk + fireAshRisk) * (1 - waterInvestment * 0.4), 0, 1);
    // Boil-water advisory probability
    var boilWaterProb = drinkingWaterRisk > 0.5 ? cl((drinkingWaterRisk - 0.5) * 2, 0, 0.5) : 0;

    // ── 3. SMOKE HEALTH BURDEN ──
    // Convert smokeIndex to AQI-equivalent health effects (Liu et al. 2015)
    // smokeIndex 0-1 from computeClimate.js (0.6-0.9 = 2017/2018 severity).
    // Mapping: index 1.0 ≈ 300 µg/m³ PM2.5 (AQI ~350, "Hazardous").
    // Basis: Liu et al. 2015 — severe smoke events produce 200-400 µg/m³ PM2.5.
    var pm25 = smokeIndex * 300;
    var aqi = pm25 < 12 ? pm25 / 12 * 50 : pm25 < 55 ? 50 + (pm25 - 12) / 43 * 50 : pm25 < 150 ? 100 + (pm25 - 55) / 95 * 50 : cl(150 + (pm25 - 150) / 100 * 100, 150, 500);
    // 30 = max smoke days per quarter at index=1.0 — WA DOH 2018 Wildfire Smoke Response:
    // 2017 season had ~25 unhealthy days in parts of WA; 2018 ~15 days; extreme = ~30
    // smokePreparedness reduces smoke health burden (clean air shelters, alerts, N95 distribution)
    var smokeDays = smokeIndex > 0.1 ? cl(smokeIndex * 30 * (1 - smokePrepared * 0.3), 0, 91) : 0;
    // 20 = severe smoke days scaling, 45 = max/quarter — Liu et al. 2015: severe AQI>200
    // events lasted 5-15 days in worst western US seasons; 45 = absolute upper bound
    var severeSmokeDays = smokeIndex > 0.5 ? cl((smokeIndex - 0.5) * 20, 0, 45) : 0;
    // Health burden per 100k population
    var basinPop = population / basinKeys.length; // rough per-basin (equal distribution)
    // 0.8, 3 = ER visits per smoke day per 100k — HCUP/AHRQ: respiratory ER visits increase
    // 5-15% during smoke events; WA DOH 2018 data: ~0.8 excess visits/day moderate, ~3/day severe
    var respERVisits = cl(smokeDays * 0.8 + severeSmokeDays * 3, 0, 500);
    // 5, 15 = asthma exacerbations per smoke day per 100k — CDC asthma surveillance:
    // 8-12% of WA population has asthma; exacerbation rate rises 20-40% during smoke (Rappold et al. 2011)
    var asthmaExacerbations = cl(smokeDays * 5 + severeSmokeDays * 15, 0, 2000);
    // $4000/ER visit — HCUP 2020 national median ER charge for respiratory; $800/asthma exacerbation
    // (outpatient + medication) — CMS Medicare/Medicaid asthma management cost data
    var smokeCost = (respERVisits * 4000 + asthmaExacerbations * 800) * basinPop / 100000 / 1e6;

    // ── 4. WATERBORNE PATHOGENS ──
    // CSO → fecal coliform → beach advisories
    // Vibrio: shellfish-associated, increases above SST 15°C (Baker-Austin et al. 2013)
    // sewerSeparation reduces CSO-driven swim advisory days (up to 50% reduction)
    var swimAdvisoryDays = cl((csoFrequency * 3 + (wqi < 0.4 ? 15 : 0)) * (1 - sewerSep * 0.5), 0, 91);
    var vibrioRisk = sst > 15 ? cl((sst - 15) * 0.15, 0, 0.8) : 0; // Vibrio range expansion
    // Nooksack fecal coliform (dairy) affects Georgia Strait / Bellingham Bay
    var nkColiform = nsrState.pswNkFecalColiform !== undefined ? nsrState.pswNkFecalColiform : 0;
    if (id === "georgia") swimAdvisoryDays += nkColiform * 20;
    // $0.01M/advisory day = beach closure economic impact — WA Ecology 2018 beach monitoring costs;
    // $0.5M at full Vibrio risk = CDC estimate shellfish-related illness costs per outbreak
    var pathogenCost = cl(swimAdvisoryDays * 0.01 + vibrioRisk * 0.5, 0, 5);

    // ── 5. FISH CONSUMPTION ADVISORIES ──
    // O'Neill & West 2009: PS resident Chinook PCBs 3-5× higher than Fraser Chinook
    var contamIndex = nsrState.nsrMainBasinContam !== undefined && id === "mainBasin" ? nsrState.nsrMainBasinContam : cl(wqi < 0.5 ? (0.5 - wqi) * 0.5 : 0, 0, 0.4);
    var pcbLevel = ecoState.tissueContamination ? (ecoState.tissueContamination.salmon || 0) : 0;
    // 6PPD-q: not a fish consumption issue (acute toxicity, not bioaccumulative) but triggers water quality advisories
    // Use basin-specific concentration from coupling when available (more accurate than ecosystem-wide level)
    var _cpl = coupling || {};
    var sixPPDqConc = (_cpl.sixPPDqMainBasin !== undefined && id === "mainBasin") ? _cpl.sixPPDqMainBasin : (ecoState.sixPPDqLevel || 0);
    var sixPPDqWQAdvisory = cl(sixPPDqConc / 5, 0, 0.2);
    // Pharmaceutical contamination: endocrine disruptors (fluoxetine, estradiol) impair fish behavior
    // Meador et al. 2016: WWTP effluent fish had 2-5× elevated tissue concentrations
    var pharmAdvisory = cl((_cpl.pharmIndex || 0) * 0.25, 0, 0.1);
    var fishAdvisoryLevel = cl(contamIndex * 0.30 + pcbLevel * 0.30 + (basin.microplastics || 0) * 0.15 + sixPPDqWQAdvisory + cl((ecoState.mpIndex || 0) * 0.15, 0, 0.15) + pharmAdvisory, 0, 1);
    // fishAdvisoryCompliance: higher compliance means people follow advisories → less exposure
    // but also higher economic/cultural cost (lost fishing, alternative food)
    var advisoryExposure = fishAdvisoryLevel * (1 - advisoryComp * 0.6); // reduced exposure with compliance
    var advisoryCost = (fishAdvisoryLevel * 0.3) + (advisoryComp * 0.1); // $M (monitoring + alternatives)

    // ── 6. ENVIRONMENTAL HEALTH DISPARITIES ──
    // WA DOH EHD Map methodology (Min et al. 2019)
    var tribalEJ = trbState.trbMainBasinEJ !== undefined && id === "mainBasin" ? trbState.trbMainBasinEJ : 0.1;
    var cumulativeExposure = cl(
      smokeIndex * 0.25 + drinkingWaterRisk * 0.20 + fishAdvisoryLevel * 0.20
      + (1 - wqi) * 0.15 + vibrioRisk * 0.10 + closedFrac * 0.10,
      0, 1);
    // Demographic vulnerability (simplified: urban = less vulnerable, rural/tribal = more)
    // Demographic vulnerability index per basin — WA DOH EHD Map v2.0 (Min et al. 2019):
    // mainBasin 0.35: urban hospitals but environmental justice communities (Duwamish)
    // sanjuan 0.45: rural, limited healthcare access (island communities)
    // hoodCanal 0.50: most rural, fewest hospitals, tribal populations
    // others 0.30: moderate urban-suburban mix
    var demoVulnerability = id === "mainBasin" ? 0.35 : id === "sanjuan" ? 0.45 : id === "hoodCanal" ? 0.50 : 0.30;
    var healthDisparities = cl(cumulativeExposure * 0.6 + demoVulnerability * 0.3 + tribalEJ * 0.1, 0, 1);

    // ── 7. HEALTH SYSTEM CAPACITY ──
    var capacity = HEALTH_CAPACITY[id];
    // Health demand weighting: smoke 0.3, closures 0.15, Vibrio 0.2, earthquake 0.35
    // Weights from WA DOH emergency preparedness surge capacity planning (mass casualty events)
    // Earthquake highest (0.35) per AHA Hospital Preparedness Program guidelines
    var demandIndex = cl(smokeDays / 30 * 0.3 + closedFrac * 0.15 + vibrioRisk * 0.2 + (shocks.earthquake || 0) * 0.35, 0, 1);
    var capacityStress = cl(demandIndex / Math.max(capacity / 4, 0.5), 0, 1); // low capacity basins stress faster

    // ── 8. TOTAL HEALTH COST ──
    var basinHealthCost = closureCost + smokeCost + pathogenCost + advisoryCost;

    totalClosureDays += closureDays;
    totalSmokeBurden += smokeDays;
    totalHealthCost += basinHealthCost;
    totalAdvisoryDays += swimAdvisoryDays;
    totalVibrioRisk += vibrioRisk;
    totalCapacityStress += capacityStress;
    totalNoctiluca += noctilucaIntensity;

    results[id] = {
      // Shellfish
      shellfishClosureDays: closureDays,
      shellfishClosureArea: closureArea,
      cumulativeClosureDays: cumulativeClosureDays,
      habSpecies: habSpecies,
      // Drinking water
      drinkingWaterRisk: drinkingWaterRisk,
      boilWaterProb: boilWaterProb,
      // Smoke
      smokeDays: smokeDays,
      severeSmokeDays: severeSmokeDays,
      aqi: aqi,
      respERVisits: respERVisits,
      // Waterborne
      swimAdvisoryDays: swimAdvisoryDays,
      vibrioRisk: vibrioRisk,
      // Fish advisories
      fishAdvisoryLevel: fishAdvisoryLevel,
      // EJ
      healthDisparities: healthDisparities,
      // Capacity
      capacityStress: capacityStress,
      // Cost
      healthCost: basinHealthCost,
    };
  }

  var avgDisparities = 0;
  for (var di = 0; di < basinKeys.length; di++) avgDisparities += results[basinKeys[di]].healthDisparities;
  avgDisparities /= basinKeys.length;

  return {
    state: {
      basins: results,
      totalClosureDays: totalClosureDays,
      totalSmokeDays: totalSmokeBurden,
      totalSwimAdvisoryDays: totalAdvisoryDays,
      avgVibrioRisk: totalVibrioRisk / basinKeys.length,
      avgCapacityStress: totalCapacityStress / basinKeys.length,
      avgHealthDisparities: avgDisparities,
      totalHealthCost: totalHealthCost, // $M
      noctilucaIntensity: totalNoctiluca / basinKeys.length, // avg Noctiluca red tide intensity
    },

    _carry: (function() {
      var carry = {};
      for (var ci = 0; ci < basinKeys.length; ci++) {
        carry[basinKeys[ci]] = { cumulativeClosureDays: results[basinKeys[ci]].cumulativeClosureDays };
      }
      return carry;
    })(),

    exports: {
      phShellClosureIndex: cl(totalClosureDays / (91 * 7), 0, 1), // normalized
      phSmokeDays: totalSmokeBurden / basinKeys.length,
      phSwimAdvisoryDays: totalAdvisoryDays / basinKeys.length,
      phVibrioRisk: totalVibrioRisk / basinKeys.length,
      phHealthDisparities: avgDisparities,
      phHealthCost: totalHealthCost,
      phCapacityStress: totalCapacityStress / basinKeys.length,
      phDrinkingWaterRisk: results.mainBasin ? results.mainBasin.drinkingWaterRisk : 0,
      phFishAdvisoryMainBasin: results.mainBasin ? results.mainBasin.fishAdvisoryLevel : 0,
    },
  };
}
