// ═══════════════════════════════════════════════════════════
// CONTAMINANTS — Speciated contaminant fate, transport & bioaccumulation
// ═══════════════════════════════════════════════════════════
// Tracks 6 contaminant classes through water, sediment, and food web:
//   1. PCBs (legacy sediment, bioaccumulative, orca reproductive toxicity)
//   2. PAHs (fossil fuels, stormwater, dilbit spills, carcinogenic)
//   3. Copper (brake pads, antifouling paint, salmon olfactory toxicity)
//   4. PBDEs (flame retardants, legacy, declining with phase-out)
//   5. 6PPD-quinone (tire-derived, lethal to coho salmon — Tian et al. 2021)
//   6. Microplastics (tire wear, wastewater fibers, marine debris)
//
// Sources:
//   Ross et al. 2000, Hickie et al. 2007 — SRKW PCB burden & BMF
//   Desforges et al. 2018 — PCB immunosuppression thresholds
//   Sandahl et al. 2007 — Cu olfactory toxicity in salmon
//   Tian et al. 2021 (DOI: 10.1126/science.abd6951) — 6PPD-q coho mortality
//   Brinkmann et al. 2022 — 6PPD-q species sensitivity
//   Peter et al. 2018 — coho pre-spawn mortality in urban streams
//   Desforges et al. 2014 — NE Pacific microplastics
//   Talley et al. 2020 — Salish Sea sediment microplastics
//   EPA RODs — Duwamish, Commencement Bay sediment concentrations
//   Grant et al. 2011 — Fraser River contaminants
//   McIntyre et al. 2012 — stormwater Cu toxicity
//   Puget Sound Partnership 2022 — stormwater as #1 toxic source
//   King County WTD Annual Reports — wastewater nutrient/contaminant loads
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl } from './utils.js';

// ── INITIAL SEDIMENT CONCENTRATIONS (ng/g dry weight) ──
// Source: EPA Superfund RODs, NOAA OR&R site assessments, Grant et al. 2011
var SEDIMENT_INIT = {
  // sub-basin: { pcb, pah, cu_ugL, zn_ugL, pb_ugL, pbde, sixPPDq_ugL, microplastic (particles/L) }
  // 6PPD-q: µg/L in stormwater (Tian et al. 2021 — lethal to coho >0.8 µg/L in lab, ~1 µg/L field threshold)
  // Microplastic: particles per liter (Desforges et al. 2014 — 8-9000 particles/m³ in NE Pacific)
  main_north:      { pcb: 800,  pah: 5000, cu: 8.0, zn: 50, pb: 5.0, pbde: 240, sixPPDq: 3.2, mp: 45 },  // Duwamish — highest 6PPD-q (I-5, I-90, SR-99)
  main_south:      { pcb: 400,  pah: 2000, cu: 5.0, zn: 35, pb: 3.5, pbde: 120, sixPPDq: 2.8, mp: 35 },  // Commencement Bay (I-5, SR-167)
  main_central:    { pcb: 80,   pah: 500,  cu: 3.0, zn: 20, pb: 1.5, pbde: 25,  sixPPDq: 1.5, mp: 25 },
  georgia_central: { pcb: 100,  pah: 300,  cu: 2.5, zn: 15, pb: 1.0, pbde: 30,  sixPPDq: 2.0, mp: 30 },  // Metro Vancouver highways
  georgia_south:   { pcb: 60,   pah: 200,  cu: 2.0, zn: 12, pb: 0.8, pbde: 18,  sixPPDq: 1.0, mp: 18 },
  georgia_north:   { pcb: 30,   pah: 100,  cu: 1.5, zn: 8,  pb: 0.5, pbde: 10,  sixPPDq: 0.3, mp: 10 },
  whidbey_south:   { pcb: 50,   pah: 300,  cu: 3.5, zn: 18, pb: 1.2, pbde: 15,  sixPPDq: 1.8, mp: 22 },  // Everett I-5 corridor
  whidbey_north:   { pcb: 20,   pah: 80,   cu: 1.0, zn: 6,  pb: 0.3, pbde: 6,   sixPPDq: 0.4, mp: 8 },
  whidbey_central: { pcb: 25,   pah: 100,  cu: 1.2, zn: 7,  pb: 0.4, pbde: 8,   sixPPDq: 0.5, mp: 10 },
  sj_haro:         { pcb: 15,   pah: 40,   cu: 0.5, zn: 3,  pb: 0.2, pbde: 5,   sixPPDq: 0.05, mp: 4 },  // Background — minimal road runoff
  sj_rosario:      { pcb: 20,   pah: 60,   cu: 0.8, zn: 5,  pb: 0.3, pbde: 6,   sixPPDq: 0.1, mp: 5 },
  jdf_west:        { pcb: 5,    pah: 15,   cu: 0.3, zn: 2,  pb: 0.1, pbde: 2,   sixPPDq: 0.01, mp: 2 },  // Oceanic background
  jdf_central:     { pcb: 8,    pah: 25,   cu: 0.4, zn: 3,  pb: 0.1, pbde: 3,   sixPPDq: 0.05, mp: 3 },
  jdf_east:        { pcb: 12,   pah: 40,   cu: 0.6, zn: 4,  pb: 0.2, pbde: 4,   sixPPDq: 0.2, mp: 5 },
  hood_north:      { pcb: 25,   pah: 80,   cu: 0.8, zn: 5,  pb: 0.3, pbde: 8,   sixPPDq: 0.2, mp: 6 },
  hood_south:      { pcb: 35,   pah: 100,  cu: 1.0, zn: 6,  pb: 0.4, pbde: 10,  sixPPDq: 0.15, mp: 5 },
  ssound_north:    { pcb: 30,   pah: 120,  cu: 1.5, zn: 8,  pb: 0.5, pbde: 9,   sixPPDq: 0.6, mp: 12 },
  ssound_south:    { pcb: 40,   pah: 150,  cu: 2.0, zn: 10, pb: 0.6, pbde: 12,  sixPPDq: 0.8, mp: 15 },
};

// ── BIOACCUMULATION PARAMETERS ──
// BMF: biomagnification factor per trophic level step — Hickie et al. 2007
// BAF: bioaccumulation factor from water — EPA guidelines
var PCB_BMF = 3.5;  // per trophic level — Hickie et al. 2007
var PAH_BMF = 1.5;  // lower — metabolized by fish (but metabolites are carcinogenic)
var PBDE_BMF = 3.0; // similar to PCBs — Rayne et al. 2004
// Trophic levels (from CLAUDE.md food web)
var TROPHIC_LEVELS = {
  phytoplankton: 1.0, zooplankton: 2.0, euphausiids: 2.2,
  forageFish: 2.5, herring: 2.5, epibenthicCrust: 2.0, benthicInfauna: 2.0,
  salmon: 3.2, rockfish: 3.5, lingcod: 3.8, dungeness: 2.8,
  pinniped: 4.0, orca: 4.5, humpback: 3.2,
};

// ── COPPER OLFACTORY TOXICITY THRESHOLDS ──
// Sandahl et al. 2007: dissolved Cu impairs salmon olfaction
var CU_OLFACTION_THRESHOLD = 2.0;   // µg/L — onset of olfactory impairment
var CU_SEVERE_THRESHOLD = 5.0;      // µg/L — severe impairment (homing disrupted)
var CU_SURVIVAL_PENALTY_PER_UGL = 0.04; // fractional survival reduction per µg/L above threshold

// ── Compute tissue concentrations from water/sediment ──
export function computeBioaccumulation(waterPCB, sedimentPCB) {
  // PCB in water (ng/L) to tissue (ng/g lipid weight) via BMF per trophic level
  var basePCB = waterPCB > 0 ? waterPCB : sedimentPCB * 0.001; // partition from sediment if no water data
  var tissues = {};
  var tlKeys = Object.keys(TROPHIC_LEVELS);
  for (var i = 0; i < tlKeys.length; i++) {
    var sp = tlKeys[i];
    var tl = TROPHIC_LEVELS[sp];
    tissues[sp] = basePCB * Math.pow(PCB_BMF, tl - 1); // ng/g lipid weight
  }
  return tissues;
}

// ── Copper salmon olfaction effect ──
// Returns fractional survival penalty for juvenile salmon
export function computeCopperEffect(dissolvedCu) {
  if (dissolvedCu <= CU_OLFACTION_THRESHOLD) return { penalty: 0, impairment: 'none' };
  var excess = dissolvedCu - CU_OLFACTION_THRESHOLD;
  var penalty = cl(excess * CU_SURVIVAL_PENALTY_PER_UGL, 0, 0.30);
  var impairment = dissolvedCu >= CU_SEVERE_THRESHOLD ? 'severe' : 'moderate';
  return { penalty: penalty, impairment: impairment, dissolvedCu: dissolvedCu };
}

// ── 6PPD-quinone coho toxicity ──
// Tian et al. 2021 (Science): tire rubber antioxidant 6PPD oxidizes to 6PPD-quinone
// in stormwater. Lethal to coho salmon at ~0.8 µg/L (LC50 in lab). Near-100%
// pre-spawn mortality observed in urban streams (Longfellow Creek, Puyallup tributaries).
// Peter et al. 2018: coho pre-spawn mortality syndrome ("urban runoff mortality syndrome").
// Brinkmann et al. 2022: species sensitivity — coho >> Chinook >> steelhead.
var SIXPPDQ_COHO_LC50 = 0.8;         // µg/L — Tian et al. 2021
var SIXPPDQ_COHO_NOAEL = 0.1;        // µg/L — approximate no-effect level
var SIXPPDQ_CHINOOK_LC50 = 8.0;      // µg/L — Chinook ~10× more tolerant (Brinkmann 2022)

export function compute6PPDqCohoEffect(concentration) {
  // Returns fractional pre-spawn mortality (0 = no effect, 1 = 100% mortality)
  if (concentration <= SIXPPDQ_COHO_NOAEL) return { cohoMortality: 0, chinookPenalty: 0, level: 'safe' };
  // Sigmoidal dose-response (Hill equation, n=3 for steep threshold)
  var cohoMort = cl(Math.pow(concentration, 3) / (Math.pow(SIXPPDQ_COHO_LC50, 3) + Math.pow(concentration, 3)), 0, 0.95);
  // Chinook: much lower sensitivity (Brinkmann et al. 2022)
  var chinookPen = cl(Math.pow(concentration, 3) / (Math.pow(SIXPPDQ_CHINOOK_LC50, 3) + Math.pow(concentration, 3)), 0, 0.3);
  var level = cohoMort > 0.5 ? 'lethal' : cohoMort > 0.1 ? 'sublethal' : 'low';
  return { cohoMortality: cohoMort, chinookPenalty: chinookPen, level: level, concentration: concentration };
}

// ── PCB mobilization in orca (for IBM) ──
// When food-stressed, orca metabolize blubber → PCBs released into blood
// Immunosuppression threshold 9 mg/kg lipid — Kannan et al. 2000 (Hum. Ecol. Risk Assess. 6(1):181-201),
// Jepson et al. 2016 (Sci. Rep. 6:18573) primary literature. Desforges et al. 2018
// (Science 361:1373-1376) cites this threshold in its global population-collapse
// projection. Primary source over application paper per Session 2g
// scientific-defensibility-first discipline; Lacy-attribution-chain pattern.
export function computeOrcaPCBMobilization(bodyCondition, tissueBurden, sex, age, nCalves) {
  // Blubber PCB burden (mg/kg lipid) — accumulated over lifetime
  // Males: accumulate throughout life (can't offload via reproduction)
  // Females: offload ~60% to first calf, ~30% to subsequent — Hickie et al. 2007
  var offloadFraction = sex === 'F' ? cl(0.6 * Math.pow(0.7, Math.max(nCalves - 1, 0)), 0, 0.6) : 0;
  var retainedBurden = tissueBurden * (1 - offloadFraction);

  // Mobilization: when BC < 0.5, metabolize blubber → PCBs enter bloodstream
  var mobilizationRate = bodyCondition < 0.5 ? cl((0.5 - bodyCondition) * 2, 0, 1) : 0;
  var bloodPCB = retainedBurden * mobilizationRate * 0.3; // fraction mobilized

  // Health effects — Desforges et al. 2018
  // Immunosuppression: reduces calf survival, increases disease susceptibility
  var immunoSuppression = cl(bloodPCB / 50, 0, 0.5); // 50 mg/kg = half-maximal suppression
  // Endocrine disruption: reduces conception probability
  var endocrineDisruption = cl(bloodPCB / 80, 0, 0.4); // higher threshold

  return {
    retainedBurden: retainedBurden,
    mobilizationRate: mobilizationRate,
    bloodPCB: bloodPCB,
    immunoSuppression: immunoSuppression,
    endocrineDisruption: endocrineDisruption,
    offloadFraction: offloadFraction,
  };
}

// ── Stormwater delivery model ──
// Puget Sound Partnership 2022: stormwater is the #1 toxic pollution source
// First flush: first heavy rain after dry spell delivers concentrated pulse
// Green infrastructure (rain gardens, bioswales, permeable pavement) reduces delivery
function computeStormwaterLoad(urbanChar, imperviousFrac, precipIndex, stormwaterTreatment, greenInfra, quarter) {
  // Impervious surface area drives runoff volume (WA Ecology stormwater manual)
  var impervious = (imperviousFrac !== undefined ? imperviousFrac : 15) / 100;
  var treatment = (stormwaterTreatment !== undefined ? stormwaterTreatment : 20) / 100;
  var greenFrac = (greenInfra !== undefined ? greenInfra : 5) / 100;
  // Seasonal: Q3 (fall, Oct-Dec) has first flush after dry summer — 2× delivery
  var seasonalMult = quarter === 3 ? 2.0 : quarter === 0 ? 1.5 : quarter === 2 ? 0.6 : 1.0;
  // Precipitation amplifier (atmospheric rivers drive highest loads)
  var precipMult = cl(1.0 + (precipIndex - 120) / 200, 0.5, 2.5);
  // Base toxic load = impervious × urban character × precipitation × season
  var rawLoad = (urbanChar || 0) * impervious * precipMult * seasonalMult;
  // Treatment reduces delivery: stormwater treatment + green infrastructure
  var treatmentReduction = cl(treatment * 0.6 + greenFrac * 0.3, 0, 0.85);
  return cl(rawLoad * (1 - treatmentReduction), 0, 5);
}

// ── Wastewater nutrient/contaminant load per basin ──
// Returns nutrient + pharmaceutical + pathogen load from wastewater treatment plants
function computeWastewaterLoad(parentBasin, populationRatio, wastewaterEfficiency, wastewaterInvestment, precipIndex, dt) {
  // Plant capacities by basin (MGD): mainBasin=248 (West Point+South), georgia=260 (Lions Gate+Iona), whidbey=36 (Brightwater)
  var baseCapacity = parentBasin === 'mainBasin' ? 248 : parentBasin === 'georgia' ? 260 : parentBasin === 'whidbey' ? 36 : 0;
  if (baseCapacity === 0) return { nutrientLoad: 0, pathogenRisk: 0, pharmLoad: 0, csoEvents: 0, capacityStress: 0 };
  var efficiency = (wastewaterEfficiency !== undefined ? wastewaterEfficiency : 75) / 100;
  var investment = (wastewaterInvestment !== undefined ? wastewaterInvestment : 30) / 100;
  // Population growth stresses capacity
  var demandRatio = cl(populationRatio * 1.1, 0.8, 1.5); // current demand / capacity
  var capacityStress = cl(demandRatio - 1.0, 0, 0.5);
  // CSO overflow: heavy rain overwhelms combined sewers (Seattle still has ~30% combined)
  var csoRisk = parentBasin === 'mainBasin' ? 0.12 : parentBasin === 'georgia' ? 0.06 : 0.02;
  var csoEvents = (precipIndex > 150 ? 1 : 0) * csoRisk * (1 - investment * 0.4) * 4; // events per quarter
  // Nutrient load (kg N per quarter, relative scale 0-1)
  var nutrientLoad = cl((1 - efficiency) * demandRatio * 0.5 + csoEvents * 0.1, 0, 1);
  // Pharmaceutical/endocrine disruptor load
  var pharmLoad = cl((1 - efficiency * 0.5) * demandRatio * 0.3, 0, 1);
  // Pathogen risk from CSO
  var pathogenRisk = cl(csoEvents * 0.2 + capacityStress * 0.3, 0, 1);
  return { nutrientLoad: nutrientLoad, pathogenRisk: pathogenRisk, pharmLoad: pharmLoad, csoEvents: csoEvents, capacityStress: capacityStress };
}

// ── Main contaminant computation per parent basin ──
// Called each timestep for each of 7 parent basins
// Tracks 6 contaminant classes: PCB, PAH, Cu, PBDE, 6PPD-quinone, microplastics
export function computeContaminants(subBasinId, prev, stormwaterInput, urbanChar, remediation, oilSpill, dt) {
  var init = SEDIMENT_INIT[subBasinId] || { pcb: 20, pah: 50, cu: 1, zn: 5, pb: 0.3, pbde: 6, sixPPDq: 0.1, mp: 5 };
  var _prev = prev || {};
  var prevPCB = _prev.sedPCB !== undefined ? _prev.sedPCB : init.pcb;
  var prevPAH = _prev.sedPAH !== undefined ? _prev.sedPAH : init.pah;
  var prevCu = _prev.disCu !== undefined ? _prev.disCu : init.cu;
  var prevRemediation = _prev.remediationProgress !== undefined ? _prev.remediationProgress : 0;
  var prev6PPDq = _prev.sixPPDq !== undefined ? _prev.sixPPDq : (init.sixPPDq || 0.1);
  var prevMP = _prev.microplastics !== undefined ? _prev.microplastics : (init.mp || 5);

  // Extract extra parameters passed via arguments (backward compat)
  var dilbitSpill = arguments.length > 7 ? arguments[7] : 0;
  var extraParams = arguments.length > 8 ? arguments[8] : {};
  var stormwaterTreatment = extraParams.stormwaterTreatment;
  var greenInfra = extraParams.greenInfraFraction;
  var imperviousFrac = extraParams.imperviousSurface;
  var precipIndex = extraParams.precipIndex || 120;
  var quarter = extraParams.quarter || 0;
  var microplasticReduction = extraParams.microplasticReduction;
  var populationRatio = extraParams.populationRatio || 1.0;
  var wastewaterEfficiency = extraParams.wastewaterEfficiency;
  var wastewaterInvestment = extraParams.wastewaterInvestment;

  // Enhanced stormwater delivery (Puget Sound Partnership: #1 toxic source)
  var swLoad = computeStormwaterLoad(urbanChar, imperviousFrac, precipIndex, stormwaterTreatment, greenInfra, quarter);
  var newPCB_input = swLoad * 0.5;   // ng/g/timestep from stormwater particles
  var newPAH_input = swLoad * 5.0;   // PAHs much higher (vehicle exhaust, road surfaces)
  var newCu_input = swLoad * 2.0;    // µg/L from brake pads, antifouling paint

  // 6PPD-quinone delivery via stormwater (Tian et al. 2021)
  // Proportional to traffic density × impervious surface × precipitation
  // Highest in fall first flush (Q3) — concentrated pulse kills coho in urban streams
  var sixPPDq_input = swLoad * 1.2 * (urbanChar || 0);  // highest in urban basins

  // Microplastic delivery: stormwater (tire wear particles, road paint) + wastewater (fibers)
  var mpReduction = (microplasticReduction !== undefined ? microplasticReduction : 10) / 100;
  var mpStormwater = swLoad * 8.0 * (1 - mpReduction * 0.5); // tire particles, road debris
  var mpWastewater = (wastewaterEfficiency !== undefined ? (100 - wastewaterEfficiency) / 100 : 0.25) * urbanChar * 3.0 * (1 - mpReduction * 0.3); // laundry fibers
  var mpInput = mpStormwater + mpWastewater;

  // Oil spill input
  if (oilSpill > 0) {
    newPAH_input += oilSpill * 500;
    newPCB_input += oilSpill * 20;
  }
  // Dilbit spill: sinkable bitumen delivers PAHs directly to sediment (Greene & Aschoff 2023)
  if (dilbitSpill > 0) {
    newPAH_input += dilbitSpill * 1500;
    newPCB_input += dilbitSpill * 30;
  }

  // Wastewater nutrient/contaminant load
  var wwLoad = computeWastewaterLoad(subBasinId, populationRatio, wastewaterEfficiency, wastewaterInvestment, precipIndex, dt);

  // Degradation/loss
  var pcbDecay = prevPCB * 0.0001 * dt;  // very slow — half-life decades
  var pahDecay = prevPAH * 0.005 * dt;   // faster — some microbial degradation
  var cuLoss = prevCu * 0.01 * dt;       // flushing + settling
  var sixPPDq_decay = prev6PPDq * 0.08 * dt;  // moderate — photodegrades in days-weeks (Du et al. 2022)
  var mpLoss = prevMP * 0.003 * dt;      // very slow — fragments don't degrade, settle to sediment

  // Remediation (dredging, capping)
  var remRate = (remediation || 0) / 100;
  var remediationProgress = cl(prevRemediation + remRate * 0.02 * dt, 0, 1);
  var remReduction = remediationProgress * 0.3;

  // New concentrations
  var sedPCB = cl(prevPCB * (1 - remReduction * 0.01) + newPCB_input - pcbDecay, 0, 5000);
  var sedPAH = cl(prevPAH * (1 - remReduction * 0.02) + newPAH_input - pahDecay, 0, 20000);
  var disCu = cl(prevCu + newCu_input - cuLoss, 0, 50);
  var sedPBDE = cl((init.pbde || 6) * (1 - remReduction * 0.01), 0, 500);
  var sixPPDq = cl(prev6PPDq + sixPPDq_input - sixPPDq_decay, 0, 20);  // µg/L in stormwater
  var microplastics = cl(prevMP + mpInput - mpLoss, 0, 500);            // particles/L

  // Water column PCB (partitioned from sediment)
  var waterPCB = sedPCB * 0.001;

  // Bioaccumulation
  var tissues = computeBioaccumulation(waterPCB, sedPCB);

  // Copper salmon effect
  var cuEffect = computeCopperEffect(disCu);

  // 6PPD-quinone coho effect
  var sixPPDqEffect = compute6PPDqCohoEffect(sixPPDq);

  // Microplastic index (normalized 0-1 for downstream consumers)
  var mpIndex = cl(microplastics / 100, 0, 1);

  // Composite contamination index (backward compat: 0-1, now includes 6PPD-q and microplastics)
  var compositeIndex = cl(
    (sedPCB / 1000) * 0.25 + (sedPAH / 5000) * 0.20 + (disCu / 10) * 0.15 +
    (sedPBDE / 200) * 0.10 + (sixPPDq / 5) * 0.15 + mpIndex * 0.15,
    0, 1);

  return {
    // Sediment concentrations (ng/g dry weight)
    sedPCB: sedPCB,
    sedPAH: sedPAH,
    sedPBDE: sedPBDE,
    // Dissolved metals (µg/L)
    disCu: disCu,
    // 6PPD-quinone (µg/L in stormwater — Tian et al. 2021)
    sixPPDq: sixPPDq,
    sixPPDqEffect: sixPPDqEffect,
    // Microplastics (particles/L — Desforges et al. 2014)
    microplastics: microplastics,
    mpIndex: mpIndex,
    // Tissue concentrations (ng/g lipid weight)
    tissues: tissues,
    // Copper salmon effect
    copperEffect: cuEffect,
    // Wastewater load
    wastewater: wwLoad,
    // Remediation state
    remediationProgress: remediationProgress,
    // Backward-compatible composite index (0-1)
    compositeIndex: compositeIndex,
    // Water column
    waterPCB: waterPCB,
    // Stormwater load (for UI)
    stormwaterLoad: swLoad,
  };
}
