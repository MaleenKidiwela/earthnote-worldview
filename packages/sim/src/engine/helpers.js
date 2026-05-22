import React from 'react';
import { cl } from './utils.js';
import { BASINS } from './basins.js';
import { POL } from '../config/policies.js';
import { PM } from '../config/parameters.js';

var LESSONS = [
  { id: "orcas", title: "Why do orcas need salmon?", icon: "\u{1F40B}",
    desc: "Explore how Southern Resident orcas depend on a chain of life stretching from tiny plankton to chinook salmon.",
    scenario: "baseline", tab: "dashboard",
    steps: "Start by looking at the food web at the bottom of the Dashboard. Notice how each level feeds the next. Now try increasing Fishing Pressure in the Ecosystem panel \u2014 watch what happens to salmon, then to orcas." },
  { id: "flood", title: "Who gets flooded when seas rise?", icon: "\u{1F30A}",
    desc: "Investigate how climate change and sea level rise affect different communities unequally.",
    scenario: "climate", tab: "dashboard",
    steps: "Run the simulation forward to 2060. Watch the Social Equity panel \u2014 flood exposure rises, but not everyone is affected equally. Now try activating the Green Stormwater policy. Does equity improve?" },
  { id: "cascade", title: "When everything goes wrong at once", icon: "\u26A1",
    desc: "See how an earthquake triggers a chain reaction across every part of the Salish Sea system.",
    scenario: "baseline", tab: "timeline",
    steps: "Press Play, then trigger the Cascadia Earthquake. Switch to the Timeline tab and watch all the indicators drop. Which ones recover first? Which take the longest? Why?" },
];

var CHALLENGES = [
  { id: "saveOrcas", title: "Save the orcas!", icon: "\u{1F40B}",
    desc: "The Southern Resident orcas are at 75 individuals and declining. Can you grow their population above 85 by 2050?",
    target: function(r) { return (r.ecosystem.state.orcaPopulation !== undefined ? r.ecosystem.state.orcaPopulation : 75) >= 85; },
    score: function(r) { return Math.round(r.ecosystem.state.orcaPopulation !== undefined ? r.ecosystem.state.orcaPopulation : 75); },
    unit: "orcas", goal: 85 },
  { id: "cleanHood", title: "Fix Hood Canal!", icon: "\u{1F30A}",
    desc: "Hood Canal is suffocating — dissolved oxygen is dangerously low. Can you get Hood Canal DO above 7 mg/L?",
    target: function(r) { return r.marine.basins && r.marine.basins.hoodCanal && r.marine.basins.hoodCanal.DO >= 7; },
    score: function(r) { return r.marine.basins ? parseFloat(r.marine.basins.hoodCanal.DO.toFixed(1)) : 0; },
    unit: "mg/L DO", goal: 7 },
  { id: "equityAll", title: "Justice for all!", icon: "\u2696",
    desc: "Environmental burdens hit some communities harder than others. Can you raise the equity index above 75%?",
    target: function(r) { return (r.urban.state.equityIndex !== undefined ? r.urban.state.equityIndex : 0.65) >= 0.75; },
    score: function(r) { return Math.round((r.urban.state.equityIndex !== undefined ? r.urban.state.equityIndex : 0.65) * 100); },
    unit: "%", goal: 75 },
];

function generateCascadeMsg(prev, curr) {
  if (!prev || !curr) return null;
  var msgs = [];
  var pm = prev.marine.state, cm = curr.marine.state;
  var pe = prev.ecosystem.state, ce = curr.ecosystem.state;
  var pu = prev.urban.state, cu = curr.urban.state;
  var dDO = cm.dissolvedOxygen - pm.dissolvedOxygen;
  var dOrca = (ce.orcaPopulation||74) - (pe.orcaPopulation||74);
  var dSalmon = ce.salmonRunStrength - pe.salmonRunStrength;
  var dEquity = (cu.equityIndex||0.65) - (pu.equityIndex||0.65);
  var dWQ = cm.waterQualityIndex - pm.waterQualityIndex;
  var dCSO = cu.csoFrequency - pu.csoFrequency;
  if (Math.abs(dDO) > 0.5) msgs.push((dDO < 0 ? "Oxygen dropped" : "Oxygen improved") + " by " + Math.abs(dDO).toFixed(1) + " mg/L");
  if (Math.abs(dSalmon) > 5) msgs.push((dSalmon < 0 ? "Salmon runs declined" : "Salmon runs improved") + " by " + Math.abs(dSalmon).toFixed(0) + " points");
  if (Math.abs(dOrca) > 0.5) msgs.push("Orca population " + (dOrca < 0 ? "fell" : "grew") + " by " + Math.abs(dOrca).toFixed(0));
  if (Math.abs(dEquity) > 0.03) msgs.push("Social equity " + (dEquity < 0 ? "worsened" : "improved") + " by " + Math.abs(dEquity*100).toFixed(0) + "%");
  if (Math.abs(dWQ) > 0.05) msgs.push("Water quality " + (dWQ < 0 ? "declined" : "improved") + " " + Math.abs(dWQ*100).toFixed(0) + "%");
  if (Math.abs(dCSO) > 1) msgs.push("Sewage overflows " + (dCSO > 0 ? "increased" : "decreased") + " by " + Math.abs(dCSO).toFixed(1) + "/month");
  // Marine heat wave onset/end
  var prevMHW = prev.mhw ? prev.mhw.active : 0;
  var currMHW = curr.mhw ? curr.mhw.active : 0;
  if (currMHW && !prevMHW) msgs.push("\u{1F321} Marine heat wave began — SST +" + (curr.mhw.sstAnomaly||0).toFixed(1) + "\u00B0C anomaly, expect kelp/salmon/HAB cascades");
  if (!currMHW && prevMHW) msgs.push("Marine heat wave ended — ecosystem recovery begins (slow)");
  // Eelgrass hysteresis — regime shift detection
  var prevEstab = pe.eelgrassEstablishment !== undefined ? pe.eelgrassEstablishment : 0.7;
  var currEstab = ce.eelgrassEstablishment !== undefined ? ce.eelgrassEstablishment : 0.7;
  if (prevEstab >= 0.3 && currEstab < 0.3) msgs.push("\u26A0 EELGRASS REGIME SHIFT — establishment below 0.3, seedbank depleted. Recovery now functionally impossible on management timescales");
  else if (currEstab < 0.4 && prevEstab >= 0.4) msgs.push("Eelgrass declining toward regime shift threshold (0.3) — herring spawning habitat at risk");
  var dEelgrass = currEstab - prevEstab;
  if (Math.abs(dEelgrass) > 0.03) msgs.push("Eelgrass establishment " + (dEelgrass < 0 ? "declined" : "recovered") + " by " + Math.abs(dEelgrass * 100).toFixed(0) + "%" + (currEstab < 0.3 ? " — REGIME SHIFT active" : ""));
  // Eelgrass restoration milestones
  if (dEelgrass > 0.02 && currEstab > 0.5 && prevEstab <= 0.5) msgs.push("\u{1F33F} Eelgrass restoration milestone — establishment above 50%, herring spawning habitat recovering");
  if (dEelgrass > 0.02 && currEstab > 0.7 && prevEstab <= 0.7) msgs.push("\u{1F33F} Eelgrass meadows healthy — establishment above 70%, cascading benefits for crab, salmon, and coastal protection");
  // Green crab invasion detection
  var prevGC = pe.greenCrabPop || 0;
  var currGC = ce.greenCrabPop || 0;
  if (currGC > 0.3 && prevGC <= 0.3) msgs.push("\u{1F980} Green crab population explosion — density above 30%, eelgrass destruction accelerating");
  if (currGC > 0.6 && prevGC <= 0.6) msgs.push("\u{1F980} Green crab invasion severe — density above 60%, native shellfish and eelgrass heavily impacted");
  if (currGC < 0.1 && prevGC >= 0.1) msgs.push("Green crab population suppressed below 10% — removal efforts succeeding");
  // Snowpack and glacial retreat
  var prevGlacial = (prev.watershed && prev.watershed.state) ? prev.watershed.state.glacialMass : 1.0;
  var currGlacial = (curr.watershed && curr.watershed.state) ? curr.watershed.state.glacialMass : 1.0;
  if (prevGlacial !== undefined && currGlacial !== undefined) {
    if (prevGlacial >= 0.5 && currGlacial < 0.5) msgs.push("\u26F0 Glacial mass below 50% of 2026 baseline — summer baseflow decline accelerating, peak water approaching");
    if (prevGlacial >= 0.2 && currGlacial < 0.2) msgs.push("\u26F0 Glacial retreat critical — only 20% mass remaining, summer water supply collapse imminent");
    if (prevGlacial > 0.05 && currGlacial <= 0.05) msgs.push("\u26F0 GLACIERS EFFECTIVELY GONE — summer baseflow permanently reduced, Fraser River discharge halved");
  }
  var prevSnow = (prev.watershed && prev.watershed.state) ? prev.watershed.state.snowpack : 180;
  var currSnow = (curr.watershed && curr.watershed.state) ? curr.watershed.state.snowpack : 180;
  if (prevSnow !== undefined && currSnow !== undefined && prevSnow > 50 && currSnow < 50) msgs.push("Snowpack critically low (<50 mm SWE) — freshet will be weak, summer drought stress elevated");
  // Burn scar detection
  var prevBurnSc = (prev.watershed && prev.watershed.state) ? prev.watershed.state.activeBurnScar || 0 : 0;
  var currBurnSc = (curr.watershed && curr.watershed.state) ? curr.watershed.state.activeBurnScar || 0 : 0;
  if (currBurnSc > 0.3 && prevBurnSc <= 0.3) msgs.push("\u{1F525} Burn scar active — hydrophobic soil amplifying runoff \u00D7" + (1 + currBurnSc * 1.5).toFixed(1) + " and sediment \u00D7" + (1 + currBurnSc * 3).toFixed(1) + ". Watch for debris flows if atmospheric river hits");
  var currDebris = (curr.watershed && curr.watershed.state) ? curr.watershed.state.debrisFlowRisk || 0 : 0;
  if (currDebris > 0.5) msgs.push("\u26A0 DEBRIS FLOW — atmospheric river hitting active burn scar! Catastrophic sediment pulse into marine system");
  // Groundwater depletion
  var prevGW2 = (prev.watershed && prev.watershed.state) ? prev.watershed.state.groundwaterLevel : 0.7;
  var currGW2 = (curr.watershed && curr.watershed.state) ? curr.watershed.state.groundwaterLevel : 0.7;
  if (prevGW2 !== undefined && currGW2 !== undefined) {
    if (prevGW2 >= 0.3 && currGW2 < 0.3) msgs.push("\u{1F4A7} Groundwater critically low — aquifer below 30%, saltwater intrusion accelerating, summer baseflows collapsing");
    if (prevGW2 >= 0.5 && currGW2 < 0.5) msgs.push("Groundwater declining below 50% — subsidence risk increasing in delta areas");
  }
  // Aragonite saturation thresholds
  var prevOmega = (prev.marine && prev.marine.state) ? prev.marine.state.minOmegaAragonite : 2.0;
  var currOmega = (curr.marine && curr.marine.state) ? curr.marine.state.minOmegaAragonite : 2.0;
  if (prevOmega !== undefined && currOmega !== undefined) {
    if (prevOmega >= 1.0 && currOmega < 1.0) msgs.push("\u2697 ARAGONITE UNDERSATURATION — \u03A9 < 1.0 in at least one basin. Shell dissolution threshold crossed. Shellfish larval mortality imminent");
    if (prevOmega >= 1.5 && currOmega < 1.5) msgs.push("\u2697 Aragonite saturation declining below 1.5 — shellfish stress zone, oyster/mussel larvae at risk");
  }
  // Tidal energy tradeoff detection
  var prevTidal = (prev.marine && prev.marine.state) ? prev.marine.state.tidalExtraction || 0 : 0;
  var currTidal = (curr.marine && curr.marine.state) ? curr.marine.state.tidalExtraction || 0 : 0;
  if (currTidal > 0.3 && prevTidal <= 0.3) msgs.push("\u{1F30A} Tidal energy extraction significant (>" + (currTidal*100).toFixed(0) + " MW) — monitor Hood Canal DO for mixing reduction impacts");
  if (currTidal > 0.6 && prevTidal <= 0.6) msgs.push("\u{1F30A} Tidal energy extraction high — stratification increasing, Hood Canal hypoxia risk elevated. Tradeoff: CO\u2082 benefit is decades away");
  // Dungeness crab population
  var prevDCrab = pe.dungenessCrabPop !== undefined ? pe.dungenessCrabPop : 0.65;
  var currDCrab = ce.dungenessCrabPop !== undefined ? ce.dungenessCrabPop : 0.65;
  if (prevDCrab >= 0.3 && currDCrab < 0.3) msgs.push("\u{1F980} Dungeness crab below minimum stock threshold — fishery closure likely, $250M/yr industry at risk");
  if (currDCrab < 0.2 && prevDCrab >= 0.2) msgs.push("\u{1F980} Dungeness crab population critical — hypoxia, acidification, and green crab predation compounding");
  // Orca population thresholds and pod extinction
  var prevOrcaPop2 = (prev.ecosystem && prev.ecosystem.state) ? prev.ecosystem.state.orcaPopulation || 74 : 74;
  var currOrcaPop2 = (curr.ecosystem && curr.ecosystem.state) ? curr.ecosystem.state.orcaPopulation !== undefined ? curr.ecosystem.state.orcaPopulation : 74 : 74;
  if (prevOrcaPop2 >= 70 && currOrcaPop2 < 70) msgs.push("\u{1F40B} SRKW orca population below 70 — species in decline, prey and noise reduction urgently needed");
  if (prevOrcaPop2 >= 50 && currOrcaPop2 < 50) msgs.push("\u{1F40B} SRKW population below 50 — species viability in question, Allee effects accelerating decline in smallest pods");
  if (prevOrcaPop2 >= 30 && currOrcaPop2 < 30) msgs.push("\u{1F40B} SRKW CRITICALLY ENDANGERED — fewer than 30 individuals, functional extinction likely without extraordinary intervention");
  // Per-pod extinction detection
  var prevPods2 = (prev.ecosystem && prev.ecosystem.state) ? prev.ecosystem.state.orcaPods || {} : {};
  var currPods2 = (curr.ecosystem && curr.ecosystem.state) ? curr.ecosystem.state.orcaPods || {} : {};
  ["J","K","L"].forEach(function(pk) {
    var pp = prevPods2[pk] ? prevPods2[pk].population : (pk==="J"?24:pk==="K"?14:36);
    var cp = currPods2[pk] ? currPods2[pk].population : pp;
    if (pp >= 1 && cp < 1) msgs.push("\u{1F40B} " + pk + " POD EXTINCT — a matrilineal line lost forever. In Coast Salish worldview, this is the loss of family (qwe'lhol'mechen)");
    else if (pp >= 5 && cp < 5) msgs.push("\u{1F40B} " + pk + " Pod functionally extinct — fewer than 5 individuals, cannot sustain social structure for reproduction");
    else if (pp >= 10 && cp < 10) msgs.push("\u{1F40B} " + pk + " Pod below 10 — Allee effect active, inbreeding depression and cultural knowledge loss accelerating decline");
  });
  // Pinniped population thresholds
  var prevPinnPop = (prev.ecosystem && prev.ecosystem.state) ? prev.ecosystem.state.pinnipedPop || 40000 : 40000;
  var currPinnPop = (curr.ecosystem && curr.ecosystem.state) ? curr.ecosystem.state.pinnipedPop !== undefined ? curr.ecosystem.state.pinnipedPop : 40000 : 40000;
  if (prevPinnPop < 55000 && currPinnPop >= 55000) msgs.push("\u{1F9AD} Pinniped population exceeding 55,000 — salmon predation pressure intensifying, orca prey competition increasing");
  if (prevPinnPop < 65000 && currPinnPop >= 65000) msgs.push("\u{1F9AD} Pinniped population at carrying capacity (~65,000) — maximum predation pressure on salmon smolts at river mouths");
  // Indigenous perspectives cascade messages
  var prevCerem = (prev.ecosystem && prev.ecosystem.state) ? prev.ecosystem.state.ceremonialAccess : 0.6;
  var currCerem = (curr.ecosystem && curr.ecosystem.state) ? curr.ecosystem.state.ceremonialAccess : 0.6;
  if (prevCerem !== undefined && currCerem !== undefined && prevCerem >= 0.3 && currCerem < 0.3) msgs.push("\u{1F3D4} Ceremonial salmon access critically impaired — chinook returns and run timing no longer support First Salmon ceremonies");
  var prevFoodSov = (prev.ecosystem && prev.ecosystem.state) ? prev.ecosystem.state.indigenousFoodSovereignty : 0.6;
  var currFoodSov = (curr.ecosystem && curr.ecosystem.state) ? curr.ecosystem.state.indigenousFoodSovereignty : 0.6;
  if (prevFoodSov !== undefined && currFoodSov !== undefined && prevFoodSov >= 0.3 && currFoodSov < 0.3) msgs.push("\u{1F41F} Indigenous food sovereignty failing — traditional food web (salmon, shellfish, herring, crab) simultaneously compromised");
  var prevContam = (prev.ecosystem && prev.ecosystem.state) ? prev.ecosystem.state.contamAdvisoryImpact : 0.1;
  var currContam = (curr.ecosystem && curr.ecosystem.state) ? curr.ecosystem.state.contamAdvisoryImpact : 0.1;
  if (prevContam !== undefined && currContam !== undefined && prevContam <= 0.5 && currContam > 0.5) msgs.push("\u26A0 Contamination advisories now severely restricting traditional food harvest — PCB/PFAS burden forcing impossible choices");
  var prevCliDisp = (prev.ecosystem && prev.ecosystem.state) ? prev.ecosystem.state.climateDisplacementRisk : 0.1;
  var currCliDisp = (curr.ecosystem && curr.ecosystem.state) ? curr.ecosystem.state.climateDisplacementRisk : 0.1;
  if (prevCliDisp !== undefined && currCliDisp !== undefined && prevCliDisp <= 0.5 && currCliDisp > 0.5) msgs.push("\u{1F321} Climate displacement crossing threshold — species ranges shifting, run timing advancing, usual and accustomed areas inundating");
  // Sediment oxygen demand — Hood Canal benthic load
  var prevBenthic = (prev.marine && prev.marine.state) ? prev.marine.state.hoodCanalBenthicLoad || 60 : 60;
  var currBenthic = (curr.marine && curr.marine.state) ? curr.marine.state.hoodCanalBenthicLoad !== undefined ? curr.marine.state.hoodCanalBenthicLoad : 60 : 60;
  if (currBenthic > 100 && prevBenthic <= 100) msgs.push("Hood Canal benthic load exceeding 100 — decades of organic matter accumulation creating persistent oxygen demand. Cleaning up inputs alone won't fix this quickly");
  if (currBenthic > 150 && prevBenthic <= 150) msgs.push("\u26A0 Hood Canal benthic load critical (>150) — self-reinforcing hypoxia: low DO \u2192 more die-offs \u2192 more organic matter \u2192 more SOD");
  // Infrastructure decay spiral (property value → tax revenue → infra maintenance)
  var prevInfraD = (prev.urban && prev.urban.state) ? prev.urban.state.infraDecay || 0 : 0;
  var currInfraD = (curr.urban && curr.urban.state) ? curr.urban.state.infraDecay || 0 : 0;
  if (currInfraD > 0.1 && prevInfraD <= 0.1) msgs.push("\u{1F3D7} Infrastructure decay spiral beginning — declining property values reducing tax revenue, infrastructure maintenance falling behind");
  if (currInfraD > 0.25 && prevInfraD <= 0.25) msgs.push("\u{1F3D7} Infrastructure decay spiral accelerating — 25%+ additional aging from underfunding. CSO frequency rising, flood defenses weakening. Policy intervention needed to break the cycle");
  return msgs.length > 0 ? msgs : null;
}

var emojiStatus = function(v) { return v > 0.7 ? "\u{1F7E2}" : v > 0.4 ? "\u{1F7E1}" : "\u{1F534}"; };
var orcaEmoji = function(v) { return v > 0.7 ? "\u{1F40B}" : v > 0.4 ? "\u{1F40B}" : "\u{1F622}"; };

// ═══════════════════════════════════════════════════════════
// CSV EXPORT — Full time series + snapshot
// ═══════════════════════════════════════════════════════════
var CSV_FLAT_COLS = [
  "year","waterQuality","biodiversity","populationHealth","orcaViability",
  "orcaJPop","orcaKPop","orcaLPop","orcaJCondition","orcaKCondition","orcaLCondition",
  "dissolvedOxygen","sst","pH","salinity","turbidity","nutrientConc",
  "noiseIndex","contaminationLevel","pcb","pfas","microplastics","hoodCanalDO",
  "omegaAragonite","minOmega","shellfishViability",
  "tidalExtraction","mixingReduction",
  "hoodCanalBenthicLoad","hoodCanalSOD",
  "salmonRun","salmonAge0","salmonAge1","salmonAge2","salmonAge3","salmonTotalReturn",
  "chinookReturn","cohoReturn","sockeyeReturn","pinkReturn","chumReturn",
  "orcaPopulation","orcaBirths","orcaDeaths","orcaBodyCondition",
  "oxygenStress","tempStress","acidStress","noiseStress","totalStress","kelpHealth",
  "eelgrassHealth","eelgrassEstablishment","eelgrassRegimeShift","bullKelpHealth",
  "greenCrabPop","greenCrabDamage",
  "dungenessCrabPop","dungenessCrabRevenue",
  "seabirdIndex",
  "pinnipedPop","pinnipedPredation",
  "herringPop","treatyFisheryHealth","indigenousCulturalLoss",
  "indigenousFoodSovereignty","ceremonialAccess","shellfishHarvestAccess",
  "contamAdvisoryImpact","culturalKeystoneHealth","climateDisplacementRisk",
  "fisheriesYield","freshwaterDischarge","dissolvedNitrogen","sedimentLoad",
  "fraserFreshet","wastewaterDischarge","stormwaterRunoff","underwaterNoise",
  "reservoirLevel","droughtStress","firstFlushIntensity","effForest","effImpervious","popDrivenImpervious",
  "airQuality","submarineLandslide",
  "snowpack","glacialMass","snowFraction",
  "burnScar","burnAge","debrisFlowRisk",
  "groundwaterLevel","gwSaltIntrusion",
  "csoFrequency","coastalFloodRisk","waterStress","equityIndex",
  "dynamicPopulation","populationGrowthRate",
  "eqNearIndustrial","eqSuburban","eqWaterfront",
  "respiratoryIllness","waterborneIllness","seafoodContamRisk","mentalHealthIndex",
  "propertyValueIndex","infraDecay","effectiveInfraAge","urbanDensity",
  "portEmployment","portRevenue","vesselDensity","opCap","emissionsIndex",
  "ferrySailings","ferryNoise","supplyChainEff","chokepointRisk",
  "tourismRev","tourismEmp","militaryEmp","militaryRev","autonomousFrac",
  "invasivePressure","wwDisturbance","cruiseRevenue","wwRevenue",
  "sstDrift","slrCm","employment",
  "enso","pdo","sstAnomaly",
  "mhwActive","mhwIntensity","mhwSSTAnomaly","mhwRemaining",
  "chinookReturn","cohoReturn","sockeyeReturn","pinkReturn","chumReturn"
];
var BASIN_IDS = Object.keys(BASINS);
var BASIN_METRICS = ["DO","SST","pH","salinity","nutrients","turbidity","wqi","phyto","zoo","omegaAragonite","benthicLoad"];

function historyToCSV(history, params, activePolicies, eventLog) {
  // Build header
  var cols = CSV_FLAT_COLS.slice();
  BASIN_IDS.forEach(function(bid) {
    BASIN_METRICS.forEach(function(m) { cols.push(bid + "_" + m); });
  });
  cols.push("event");
  var lines = [cols.join(",")];

  history.forEach(function(row) {
    var vals = CSV_FLAT_COLS.map(function(c) {
      var v = row[c];
      return v !== undefined && v !== null ? (typeof v === "number" ? v.toPrecision(6) : v) : "";
    });
    // Per-basin columns
    BASIN_IDS.forEach(function(bid) {
      BASIN_METRICS.forEach(function(m) {
        var v = row.basins && row.basins[bid] ? row.basins[bid][m] : "";
        vals.push(v !== "" && typeof v === "number" ? v.toPrecision(6) : "");
      });
    });
    vals.push(row._ev || "");
    lines.push(vals.join(","));
  });

  // Append metadata block
  lines.push("");
  lines.push("# METADATA");
  lines.push("# Generated," + new Date().toISOString());
  lines.push("# Model,Salish Sea Digital Cousin v5");
  lines.push("# Parameters," + JSON.stringify(params).replace(/,/g, ";"));
  lines.push("# Policies," + JSON.stringify(Object.keys(activePolicies)).replace(/,/g, ";"));
  lines.push("# Events," + eventLog.map(function(e) { return e.year + ":" + e.label; }).join(";"));

  return lines.join("\n");
}

function downloadBlob(content, filename, mime) {
  var blob = new Blob([content], { type: mime || "text/csv" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════
// SCENARIO SERIALIZATION
// ═══════════════════════════════════════════════════════════
function serializeScenario(name, description, params, activePolicies, year) {
  return {
    v: 1, name: name, description: description,
    timestamp: new Date().toISOString(),
    year: year, params: params,
    policies: Object.keys(activePolicies),
  };
}

function exportScenarioJSON(scenario) {
  downloadBlob(JSON.stringify(scenario, null, 2), (scenario.name || "scenario").replace(/\s+/g, "_") + ".json", "application/json");
}

// ═══════════════════════════════════════════════════════════
// RESILIENCE / PREPAREDNESS INDEX
// ═══════════════════════════════════════════════════════════
function computePreparedness(results, params, activePolicies) {
  var us = results.urban.state, ps = results.port.state, ws = results.watershed.state;
  var iaf = params.urban.stormwaterInfraAge / 100;
  var govCoord = (params.urban.crossBorderCoord || 50) / 100;
  var hasPolicies = Object.keys(activePolicies);

  // Infrastructure readiness (newer = better prepared)
  var infraReady = cl(1 - iaf, 0, 1) * 0.25;
  // Stormwater/flood capacity
  var floodPrep = cl((1 - (us.coastalFloodRisk !== undefined ? us.coastalFloodRisk : 0)) * 0.5 + (params.urban.wastewaterEfficiency || 75) / 100 * 0.5, 0, 1) * 0.2;
  // Supply chain redundancy
  var supplyPrep = cl((ps.supplyChainEff !== undefined ? ps.supplyChainEff : 1) * 0.5 + (hasPolicies.indexOf("supplyResilience") >= 0 ? 0.3 : 0), 0, 1) * 0.15;
  // Cross-border disaster response coordination
  var govPrep = govCoord * 0.15;
  // Ecological buffer (healthy ecosystems absorb shocks better)
  var ecoBuffer = cl(results.ecosystem.state.biodiversityIndex * 0.5 + ws.effForest / 100 * 0.5, 0, 1) * 0.15;
  // Financial reserves proxy (low current spending = more capacity to respond)
  var totalCost = Object.keys(activePolicies).reduce(function(s, k) { return s + (POL[k]?.cost || 0); }, 0);
  var fiscalCapacity = cl(1 - totalCost / 5000, 0, 1) * 0.1;

  var total = cl(infraReady + floodPrep + supplyPrep + govPrep + ecoBuffer + fiscalCapacity, 0, 1);

  // Projected impact of a Cascadia M9 at current readiness
  var eqDamage = cl(0.7 * (1 - govCoord * 0.2) * (1 + iaf * 0.5), 0.2, 1);
  var recoveryYears = cl(2 + (1 - total) * 6, 1, 10);

  return {
    total: total,
    infraReady: infraReady / 0.25,
    floodPrep: floodPrep / 0.2,
    supplyPrep: supplyPrep / 0.15,
    govPrep: govPrep / 0.15,
    ecoBuffer: ecoBuffer / 0.15,
    fiscalCapacity: fiscalCapacity / 0.1,
    eqProjectedDamage: eqDamage,
    eqRecoveryYears: recoveryYears,
    label: total > 0.7 ? "Well prepared" : total > 0.4 ? "Partially prepared" : "Vulnerable"
  };
}

// Estimate what a policy would change if activated now
function estimatePolicyImpact(polKey, results, params) {
  var pol = POL[polKey];
  if (!pol) return null;
  var impacts = [];
  Object.entries(pol.fx).forEach(function(modEntry) {
    var mod = modEntry[0], changes = modEntry[1];
    Object.entries(changes).forEach(function(paramEntry) {
      var pk = paramEntry[0], dv = paramEntry[1];
      var meta = PM[mod] && PM[mod].p[pk];
      var label = meta ? meta.l : pk;
      var unit = meta ? meta.u : "";
      var current = params[mod] ? params[mod][pk] : 0;
      var projected = cl(current + dv, meta ? meta.mn : 0, meta ? meta.mx : 100);
      impacts.push({ label: label, current: current, projected: projected, delta: dv, unit: unit });
    });
  });
  return impacts;
}

// ═══════════════════════════════════════════════════════════
// URBAN SEA SYSTEM CHARACTERIZATION (Greene & Delaney, 2025)
// ═══════════════════════════════════════════════════════════
// 7-element rubric from: Estuarine, Coastal and Shelf Science 322 (2025) 109274
// Elements: Physiography, Size, Age, Population, Impacts, Economy+Self-Sufficiency, Ecology, Significance
function computeUrbSeaScore(results, year, params) {
  var ms = results.marine.state, es = results.ecosystem.state;
  var us = results.urban.state, ps = results.port.state, ws = results.watershed.state;
  var yrs = year - 2026;

  // 1. Physiography/Geotectonic + Climate: Fixed for Salish Sea
  var physiography = { label: "Temperate Active Margin", rating: "Active convergent (Cascadia Subduction Zone)", fixed: true };

  // 2. Size: Fixed macro-system (paper: Macro = 10,000–10,000,000 km²)
  var size = { label: "Macro", rating: "~560,000 km\u00B2 combined land+sea", areaKm2: 560000, fixed: true };

  // 3. Age: Young per paper Section 7.1 (industrialized ~150 years)
  var age = { label: "Young", rating: "Industrialized ~" + (150 + yrs) + " years (since ~1880)", fixed: true };

  // 4. Population: Dynamic — thresholds from Appendix A
  // Paper: Small <1M, Medium 1–10M, Large 10–30M, Very Large >30M
  var pop = (us.dynamicPopulation !== undefined ? us.dynamicPopulation : 9000000) / 1e6;
  var popLabel = pop > 30 ? "Very Large" : pop > 10 ? "Large" : pop > 1 ? "Medium" : "Small";
  var population = { label: popLabel, rating: pop.toFixed(1) + "M people", value: pop, dynamic: true };

  // 5. Natural vs. Anthropogenic Impacts (paper Section 5.5)
  // Paper rates Salish as "Moderate to High Adverse Impact"
  // Natural: earthquake/tsunami/volcanic risk (fixed high for active margin) + storm/atmospheric river
  // Anthropogenic: climate change (SST drift, SLR), contamination, urbanization, noise
  var naturalHazardBase = 0.35; // fixed: active subduction zone = moderate-high baseline
  var climateImpact = cl((ms.sst - 10) / 6 * 0.3 + (us.coastalFloodRisk !== undefined ? us.coastalFloodRisk : 0) * 0.3 + (us.waterStress || 0) * 0.2, 0, 0.5);
  var anthropoImpact = cl(ms.contaminationLevel * 0.25 + ms.noiseIndex * 0.15 + (1 - (ws.airQuality !== undefined ? ws.airQuality : 0.85)) * 0.15
    + cl((pop - 4.2) / 8, 0, 0.2) * 0.15 + (ws.popDrivenImpervious || 0) / 25 * 0.15, 0, 0.5);
  var activeDisasters = 0;
  if (results.watershed && results.watershed.state) {
    activeDisasters = cl((ws.submarineLandslide || 0) * 0.3 + (ws.droughtStress || 0) * 0.1, 0, 0.15);
  }
  var impactScore = cl(naturalHazardBase + climateImpact + anthropoImpact + activeDisasters, 0, 1);
  // Paper scale: Light, Moderate, Heavy, Severe
  var impactLabel = impactScore > 0.7 ? "Severe" : impactScore > 0.5 ? "Heavy" : impactScore > 0.3 ? "Moderate\u2013High" : "Light\u2013Moderate";
  var impacts = { label: impactLabel, rating: (impactScore * 100).toFixed(0) + "% exposure", value: impactScore, dynamic: true };

  // 6. Economic Vitality + Self-Sufficiency (paper Section 5.6)
  // Paper: Dynamic / Stable / Declining + Strong / Moderate / Weak
  var econScore = cl(ps.opCap * 0.3 + cl(ps.employment / 60000, 0, 1) * 0.3 + (ps.supplyChainEff !== undefined ? ps.supplyChainEff : 1) * 0.2 + cl(ps.revenue / 5000, 0, 1) * 0.2, 0, 1);
  var selfSuff = cl((params.urban.energyCleanFraction || 45) / 100 * 0.3 + cl(ws.freshwaterDischarge / 6000, 0, 1) * 0.3 + (ps.supplyChainEff !== undefined ? ps.supplyChainEff : 1) * 0.2 + (1 - (us.waterStress || 0)) * 0.2, 0, 1);
  var econLabel = econScore > 0.7 ? "Dynamic" : econScore > 0.4 ? "Stable" : "Declining";
  var suffLabel = selfSuff > 0.7 ? "Strong" : selfSuff > 0.4 ? "Moderate" : "Weak";
  var economy = { label: econLabel, rating: (econScore * 100).toFixed(0) + "% vitality", value: econScore, selfSufficiency: suffLabel, selfSuffValue: selfSuff, dynamic: true };

  // 7. Ecological Status (paper Section 5.6.1–5.6.3)
  // Paper: Nearly Pristine / Partially Degraded / Degraded / Severely Degraded
  var ecoScore = cl(ms.waterQualityIndex * 0.25 + es.biodiversityIndex * 0.25 + es.kelpHealth * 0.15 + (1 - es.totalStress) * 0.15 + (es.herringPop !== undefined ? es.herringPop : 0.5) * 0.1 + (es.treatyFisheryHealth !== undefined ? es.treatyFisheryHealth : 0.5) * 0.1, 0, 1);
  var ecoLabel = ecoScore > 0.7 ? "Nearly Pristine" : ecoScore > 0.5 ? "Nearly Pristine\u2013Degraded" : ecoScore > 0.3 ? "Degraded" : "Severely Degraded";
  var ecology = { label: ecoLabel, rating: (ecoScore * 100).toFixed(0) + "% health", value: ecoScore, dynamic: true };

  // Significance: capstone assessment (paper Section 5.7)
  // Paper: High / Moderate / Poor
  var sigScore = cl(econScore * 0.25 + ecoScore * 0.2 + cl(pop / 10, 0, 1) * 0.15 + (us.equityIndex !== undefined ? us.equityIndex : 0.65) * 0.15 + selfSuff * 0.15 + (1 - impactScore * 0.5) * 0.1, 0, 1);
  var sigLabel = sigScore > 0.6 ? "High" : sigScore > 0.35 ? "Moderate" : "Poor";
  var significance = { label: sigLabel, rating: (sigScore * 100).toFixed(0) + "% composite", value: sigScore, dynamic: true };

  return {
    physiography: physiography, size: size, age: age,
    population: population, impacts: impacts,
    economy: economy, ecology: ecology, significance: significance,
    composite: cl((econScore + ecoScore + sigScore + selfSuff + (us.equityIndex !== undefined ? us.equityIndex : 0.65) + (1 - impactScore)) / 6, 0, 1),
    summary: "Young, Temperate Active Margin Macro-Urban Sea System — " + popLabel + " Population, " + impactLabel + " Impacts, " + econLabel + " Economy, " + suffLabel + " Self-Sufficiency, " + ecoLabel + " Ecological Status, " + sigLabel + " Significance"
  };
}

// ═══════════════════════════════════════════════════════════
// MODEL METHODOLOGY
// ═══════════════════════════════════════════════════════════
var MODEL_DOC = [
  { section: "Overview", content: "Coupled socio-ecological model of the Salish Sea with 6 sub-basins (Georgia Strait, San Juan/Admiralty, Whidbey Basin, Main Basin, Hood Canal, South Sound). Quarterly timestep, 50-year horizon. Modules: watershed hydrology, marine biogeochemistry, port economics, urban infrastructure, and ecosystem dynamics are iteratively coupled at each step." },
  { section: "Watershed hydrology", content: "Freshwater discharge = f(precipitation, snowmelt, forest cover, impervious surface). Seasonal sinusoidal modulation via cos(2\u03C0\u00B7yf). First-flush effect: nutrient/contaminant spike at yf\u22480.75 (October), intensity proportional to dry-season accumulation \u00D7 impervious fraction. Reservoir bucket model: \u0394R = (inflow \u2212 demand) \u00D7 0.1 per quarter, drought stress activates below 75% capacity. Nitrogen loading = agricultural (area \u00D7 runoff) + urban (impervious \u00D7 runoff \u00D7 first-flush multiplier) + background, attenuated by riparian buffer efficiency. Population growth drives impervious surface expansion at 0.5%/100k above baseline." },
  { section: "Marine biogeochemistry", content: "Each sub-basin tracks: DO, SST, salinity, nutrients, turbidity, pH, contamination, phytoplankton, zooplankton, and a composite water quality index. Inter-basin exchange follows exponential flushing: flush = 1 \u2212 exp(\u22120.693 / t\u00BD \u00D7 91.25 \u00D7 dt). Flushing half-lives calibrated to Premathilake & Khangaonkar (2022): Georgia Strait 240d, Hood Canal 175d, South Sound 65d, Main Basin 35d, Whidbey 30d, San Juan/Admiralty 15d. DO dynamics: consumption = nutrients \u00D7 0.15 + phyto \u00D7 0.002 + stratification (2.5\u00D7 in Hood Canal); production = phyto \u00D7 0.005 \u00D7 (1 \u2212 sediment/(vol \u00D7 30)). Climate drift: SST +0.018\u00B0C/yr (mid-range projection, ~1.4\u00B0C/century observed trend per Kearney et al. 2025), SLR +0.35 cm/yr (contemporary rate per NOAA gauges), precipitation \u22120.3%/yr. CSO frequency increases with SLR at 0.04 events/month per cm." },
  { section: "Salmon population dynamics", content: "Four age cohorts (age-0 through age-3) with stage-structured survival. Recruitment: Beverton-Holt model S(R) = (R \u00D7 K) / (R + K) where K = 5000 (carrying capacity) and R = spawners \u00D7 fecundity (400) \u00D7 river survival \u00D7 seasonal pulse. River survival = 0.7 \u00D7 (1 \u2212 fishing pressure \u00D7 0.3) \u00D7 stress multiplier. Ocean survival = 0.85 \u2212 total stress \u00D7 0.3 \u2212 spill \u00D7 0.4, reduced further by Hood Canal hypoxia (<4 mg/L) and Main Basin low-DO (<5 mg/L). Return timing follows Gaussian pulse centered at yf = 0.6 (August)." },
  { section: "Orca population dynamics", content: "Southern Resident Killer Whale (SRKW) J/K/L pod model. Births = population \u00D7 birthRate \u00D7 calf survival \u00D7 (1 - Allee birth penalty) \u00D7 dt. Calf survival = 0.55 + effectivePrey\u00D70.35 \u2212 noise\u00D70.15 \u2212 contamination\u00D70.12 \u2212 spill\u00D70.4. Effective prey = raw prey availability \u00D7 (1 \u2212 vesselForagingLoss), where foraging loss = min(orcaNoise\u00D70.22, 0.25) \u2014 chronic vessel noise reduces echolocation-based hunting efficiency by 18-25% (Williams R. et al. 2006). Deaths = population \u00D7 (baseMort + totalStress\u00D70.015 + starvation\u00D70.005 + shipStrike + Allee boost + bodyConditionMort + inbreedingMort). Inbreeding depression: fixed 0.001/qtr in simulation (see audit entry 61 sub-i \u2014 case (c) grounding gap, pending Chain B Path 0/2 selection) reflecting SRKW effective Ne\u224825-35 (Lacy et al. 2017 model projection Ne\u224827 = 37% of N=74; Ford M.J. et al. 2011 J. Hered. 102:537-553 genetic Ne estimate). Body condition mortality: (1-BC)\u00D70.006, creating stabilizing feedback. Population bounded [0, 200] \u2014 pods can go extinct. Green transition: reduced vessel noise \u2192 lower foraging loss \u2192 higher effective prey \u2192 recovery to ~80-90. Collapse: compounding stressors \u2192 K Pod extinct by year 15." },
  { section: "Social equity index", content: "Composite index = mean(1 \u2212 pollution burden, 1 \u2212 flood exposure, 1 \u2212 housing pressure, job access). Pollution burden scales with contamination, CSO frequency, and inverse of clean energy fraction. Flood exposure = coastal flood risk \u00D7 (1 \u2212 stormwater investment). Housing pressure = f(population, urbanization). Job access = f(employment, operational capacity). SLR-driven saltwater intrusion affects water supply equity." },
  { section: "Port economics", content: "Three disaggregated ports (Seattle 40%, Vancouver 40%, Tacoma 20% of throughput). Ferry system: ~450 daily sailings generating noise (distributed, 0\u20130.4 index) and emissions (partially offset by shore power). TEU throughput modulated by earthquake damage and vessel size. Employment = TEU \u00D7 8 + fisheries \u00D7 2 + recreation \u00D7 6000 + ferry crew." },
  { section: "Policy interventions", content: "12 policy levers with implementation timelines (1\u201315 years), cumulative cost, and parameter effects applied linearly over duration. Includes tidal energy harvesting, supply chain resilience, green crab removal, and eelgrass restoration (nature-based solution inspired by EU DTO Wadden Sea seagrass demonstrator). Eelgrass restoration boosts natural recovery rate up to 5\u00D7 and reduces turbidity via sediment trapping, with cascading benefits for herring, salmon, crab, and coastal erosion protection." },
  { section: "Data connection layer", content: "CF-convention compatible observation schema (DATA_SCHEMA) maps model variables to standard names for interoperability with NOAA, Ecology, NANOOS, DFO, and Copernicus products. Users can export a blank JSON template, fill in observed values from real monitoring stations, and import to activate Newtonian relaxation nudging (alpha=0.10/qtr). Nudging gently pulls per-basin and aggregate marine state toward observations without overriding model dynamics. Supports per-basin overrides (georgia.DO, hoodCanal.pH, etc.) following the EU DTO sub-basin validation pattern. Inspired by EDITO-Infra's FAIR data integration and the EU DTO's architecture of separating data, model, and front-end layers." },
  { section: "Disaster events", content: "7 event types: Cascadia earthquake (pk=1.0, dur=2yr, triggers submarine landslide via glacial liquefaction), tsunami (pk=0.9, dur=0.5yr, coastal inundation of low-lying port areas), oil spill (pk=0.9, dur=3yr), extreme storm (pk=1.0, dur=0.25yr), atmospheric river (pk=0.85, dur=0.5yr, multi-day sustained heavy rainfall distinct from short storms), volcanic eruption (pk=0.9, dur=4yr, ash/lahar from Rainier/St. Helens/Garibaldi), and wildfire (pk=0.8, dur=1yr)." },
  { section: "Habitat differentiation", content: "Eelgrass (Zostera marina): nearshore meadows with hysteresis dynamics \u2014 root establishment declines rapidly under stress (0.15/yr) but recovers very slowly (0.02/yr). Below 30% establishment: regime shift, seedbank depleted, recovery functionally impossible. Critical spawning substrate for Pacific herring. Bull kelp (Nereocystis luetkeana): canopy forests sensitive to temperature (lethal >15\u00B0C), light, and urchin grazing. Combined kelp metric = 0.45 \u00D7 eelgrass + 0.55 \u00D7 bull kelp. Herring (Clupea pallasii): explicit forage fish trophic layer, population = f(eelgrass establishment, biodiversity, zooplankton, stress, fishing). Herring feed into salmon ocean survival (+10%) and orca prey availability (15%)." },
  { section: "Indigenous perspectives & fishing rights", content: "Comprehensive 6-pathway model of Coast Salish environmental vulnerability: (1) Ceremonial access \u2014 First Salmon ceremonies require specific chinook at specific timing, disrupted by climate phenology shifts (~2 days/\u00B0C); (2) Traditional food security \u2014 weakest-link composite across salmon, shellfish, herring, Dungeness crab; (3) Shellfish harvest access \u2014 HAB closures, \u03A9_aragonite, contamination independently restrict gathering on U&A beds; (4) Contamination advisory burden \u2014 PCB/PFAS force choice between cultural practice and health; (5) Cultural keystone species \u2014 orca as relatives (qwe'lhol'mechen), salmon as returning gifts, eelgrass/kelp as marine habitat anchors; (6) Climate displacement \u2014 species range shifts, run timing advances, SLR inundation erode millennia of place-based TEK. Co-management parameter (Boldt Decision) provides adaptive resilience through TEK integration. Based on Greene & Delaney (2025) emphasis that salmon decline 'disrupts the customary sustainable fisheries of the Indigenous populations.'" },
  { section: "Fraser River & glacial legacy", content: "Fraser delivers ~50% of freshwater. Glacial snowmelt freshet peaks at 3.5\u00D7 base flow in June (yf\u22480.45). Fraser Delta subsidence adds ~2mm/yr effective SLR beyond open-coast rates. Puget Sound lowlands contain water-saturated glacial till prone to liquefaction; earthquake damage amplified by glacialLiquefaction parameter (grows 0.5%/yr as groundwater conditions change)." },
  { section: "Tourism & military economics", content: "Tourism revenue = f(tourismLevel, ecosystem health, operational capacity). Orca watching, recreation, cruise ships contribute up to $800M/yr and 12,000 jobs at full activity. Military installations (Bangor, Bremerton, Whidbey Island NAS, Esquimalt) provide stable economic anchor up to 25,000 jobs and $3.5B/yr but add underwater noise. Autonomous vessels reduce crew costs 40% but increase vessel density 15%." },
  { section: "Cross-border governance", content: "US-Canada border bisects the system with different regulatory regimes. crossBorderCoord parameter (0-100%) modulates: wastewater standards alignment (up to +15% effective efficiency), earthquake disaster response speed (-20% damage at full coordination), and social equity (+0.075 index points). Reflects Greene & Delaney (2025) emphasis on geopolitical complexity of shared Urban Sea Systems." },
  { section: "UrbSea characterization rubric", content: "Live implementation of Greene & Delaney (2025) 7-element scoring framework: (1) Physiography/Geotectonics \u2014 fixed as Temperate Active Margin; (2) Size \u2014 Macro, ~560,000 km\u00B2; (3) Age \u2014 Young, ~150 years industrialized; (4) Population \u2014 dynamic from simulation; (5) Economic Vitality + Self-Sufficiency \u2014 composite of port operations, employment, supply chain, energy independence; (6) Ecological Status \u2014 composite of water quality, biodiversity, kelp, herring, treaty fisheries; (7) Significance \u2014 composite of economic, ecological, demographic, and equity scores. All dynamic elements update in real-time as the simulation runs." },
  { section: "ENSO & PDO ocean forcing", content: "Pacific basin-scale forcing modulates Salish Sea conditions on interannual to decadal scales. ENSO: quasi-periodic oscillation (superposition of ~4.7yr and ~2.3yr cycles) producing El Ni\u00F1o (+SST, \u2212precip, \u2212productivity) and La Ni\u00F1a (inverse) phases. PDO: ~25yr regime shift (tanh-smoothed sine) modulating background SST and upwelling nutrient delivery. Combined effects: SST anomaly = ENSO\u00D70.6 + PDO\u00D70.4 \u00B0C; precipitation multiplier = 1 + ENSO\u00D7(\u22120.12) + PDO\u00D7(\u22120.05); ocean productivity = 1 + ENSO\u00D7(\u22120.15) + PDO\u00D7(\u22120.10); salmon ocean survival modifier = ENSO\u00D7(\u22120.08) + PDO\u00D7(\u22120.06). Parameters are deterministic approximations \u2014 real ENSO is stochastic." },
  { section: "Salmon genetic stock structure", content: "Five Pacific salmon species with distinct life-history parameters: Chinook (fecundity=350, K=1200, peak yf=0.55, 3yr ocean, weight=0.35), Coho (fecundity=400, K=1500, peak yf=0.65, 2yr ocean, weight=0.25), Sockeye (fecundity=500, K=2000, peak yf=0.50, 2yr ocean, weight=0.20), Pink (fecundity=600, K=3000, peak yf=0.60, 1yr ocean, even/odd brood dominance, weight=0.10), Chum (fecundity=450, K=1800, peak yf=0.70, 2yr ocean, weight=0.10). Each stock runs independent Beverton-Holt recruitment with species-specific ocean/river survival rates. ENSO modifies ocean survival across all stocks. Composite salmon health = weighted sum of per-stock returns." },
  { section: "Economic sector disaggregation", content: "Eight economic sectors tracked independently: Maritime (TEU-driven), Fisheries (yield-driven), Tourism (ecosystem health \u00D7 attraction), Military (stable anchor, ~25k jobs), Recreation (biodiversity-driven), Technology/Services (population-scaled), Agriculture (contaminant-sensitive), Ferry (450 daily sailings). Each sector has separate employment, revenue, and disaster vulnerability indices. Vulnerability profiles differ: maritime is earthquake/tsunami-vulnerable; fisheries are spill/stress-vulnerable; tech is relatively disaster-resistant." },
  { section: "Sub-quarterly resolution", content: "During active disasters (any shock > 0.1 intensity), the quarterly timestep is subdivided into 4 sub-steps (~weekly resolution). This captures the rapid cascade dynamics of earthquake \u2192 submarine landslide \u2192 turbidity pulse that would be smoothed over in a full quarterly step. Each sub-step runs the complete 6-module pipeline including 3 convergence iterations, advancing basin state, salmon cohorts, and orca population at finer granularity." },
  { section: "Monte Carlo ensemble", content: "Optional stochastic capability: N ensemble members (default 8) run in parallel with \u00B15% parameter jitter (uniform random perturbation of all numeric parameters). Output: 10th/50th/90th percentile bands and mean for key metrics (water quality, biodiversity, orca viability, salmon run, population health, employment, dissolved oxygen, herring). Ensemble state is propagated forward to maintain divergent trajectories. Performance note: N=8 runs ~8\u00D7 computation per timestep." },
  { section: "Limitations & caveats", content: "This is a teaching and scenario-exploration tool, not a calibrated predictive model. Key simplifications: Economic model uses constant multipliers rather than general-equilibrium pricing. No spatial advection within basins (parameterized hydrodynamics). PDO forcing remains deterministic. Sub-basin exchange coefficients and flushing half-lives are approximate. Users should treat outputs as directional indicators of system sensitivity, not as forecasts." },
  { section: "References", content: "Flushing dynamics: Premathilake & Khangaonkar (2022) Estuarine, Coastal and Shelf Science, doi:10.1016/j.ecss.2022.108033 \u2014 sub-basin flushing times for 36 Salish Sea sub-basins. SRKW population: Center for Whale Research July 2025 Census (74 individuals); Marine Mammal Commission SRKW page. Salmon Beverton-Holt: Ricker (1975) Bull. Fish. Res. Board Can. 191. Hood Canal hypoxia: Warner et al. (2001) Estuaries 24(6B). Sea level rise projections: Miller et al. (2018) NRC Washington Sea Grant \u2014 contemporary RSLR 3.0-4.4 mm/yr. SST trends: Kearney et al. (2025) ESS Open Archive \u2014 1.4\u00B0C/century observed warming in Puget Sound. First-flush dynamics: Lee et al. (2004) Sci. Total Environ. 334-335. Fraser River discharge: ~3,475 m\u00B3/s mean, ~50% of Salish Sea freshwater (Canada Water Agency 2024). Salish Sea climate projections: Khangaonkar et al. (2019, 2021) PNNL/Salish Sea Model \u2014 1.5-3\u00B0C SST increase by 2100 under RCP 8.5." },
];

// ═══════════════════════════════════════════════════════════
// ERROR BOUNDARY — prevents white screen on NaN propagation or undefined access
// ═══════════════════════════════════════════════════════════
class SimErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error: error }; }
  componentDidCatch(error, info) { console.error("Salish Cousin render error:", error, info.componentStack); }
  render() {
    if (this.state.hasError) {
      var self = this;
      return React.createElement("div", { style: { padding: 40, textAlign: "center", fontFamily: "var(--font-sans)" } },
        React.createElement("div", { style: { fontSize: 18, fontWeight: 500, marginBottom: 12 } }, "Simulation produced invalid results"),
        React.createElement("div", { style: { fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 } },
          "This usually happens with extreme parameter combinations. Error: " + String(this.state.error && this.state.error.message || "Unknown")),
        React.createElement("button", {
          onClick: function() { self.setState({ hasError: false, error: null }); },
          style: { padding: "8px 20px", fontSize: 13, borderRadius: 6, border: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", cursor: "pointer" }
        }, "Reset and try again")
      );
    }
    return this.props.children;
  }
}

export {
  LESSONS,
  CHALLENGES,
  generateCascadeMsg,
  emojiStatus,
  orcaEmoji,
  CSV_FLAT_COLS,
  BASIN_IDS,
  BASIN_METRICS,
  historyToCSV,
  downloadBlob,
  serializeScenario,
  exportScenarioJSON,
  computePreparedness,
  estimatePolicyImpact,
  computeUrbSeaScore,
  MODEL_DOC,
  SimErrorBoundary,
};
