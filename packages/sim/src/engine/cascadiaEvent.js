// ═══════════════════════════════════════════════════════════
// CASCADIA M9 EVENT — Full subduction zone megathrust scenario
// ═══════════════════════════════════════════════════════════
// The Cascadia Subduction Zone last ruptured January 26, 1700
// (precisely dated from Japanese tsunami records and ghost forests
// — Atwater et al. 2005). Recurrence: ~200-600 years. We are
// 326 years into the current cycle. Probability of M9 in the
// next 50 years: ~10-15% (USGS).
//
// The event unfolds in phases over minutes to decades:
//   a) Ground shaking (0-4 min)
//   b) Liquefaction (0-10 min)
//   c) External tsunami (15-45 min)
//   d) Fraser Delta submarine landslide tsunami (5-30 min)
//   e) Infrastructure destruction (hours)
//   f) Environmental damage (days-months)
//   g) Recovery trajectory (years-decades)
//
// Sources:
//   Atwater et al. 2005: The Orphan Tsunami of 1700
//   Atkinson & Adams 2003: Ground motion for M9 CSZ
//   Walsh et al. 2000: USGS tsunami inundation (Puget Sound)
//   Rabinovich et al. 2003: Fraser Delta tsunami (4-18m)
//   USGS M9 ShakeMap scenario
//   USGS Seattle Urban Hazard Map (liquefaction)
//   WA DNR Liquefaction Susceptibility Map
//   FEMA Cascadia Rising exercise 2016
//   CREW (Cascadia Region Earthquake Workgroup) reports
//   Cascadia Lifelines Program (CLiP) — Oregon State Univ.
//   Christian et al. 1997: Fraser Delta slope stability
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl, seededRandom } from './utils.js';

// ── PEAK GROUND ACCELERATION BY SUB-BASIN ──
// From USGS M9 ShakeMap scenario, Atkinson & Adams 2003
// Amplified by local soil conditions (VS30)
var PGA_BY_SUB_BASIN = {
  jdf_west:        0.40,  // closest to rupture zone
  jdf_central:     0.35,
  jdf_east:        0.30,
  georgia_north:   0.15,  // far from rupture, bedrock
  georgia_central: 0.25,  // Fraser Delta amplification
  georgia_south:   0.25,
  sj_haro:         0.20,
  sj_rosario:      0.20,
  whidbey_north:   0.22,
  whidbey_central: 0.20,
  whidbey_south:   0.25,  // Everett waterfront fill
  main_north:      0.28,  // Seattle fill areas amplify
  main_central:    0.22,
  main_south:      0.30,  // Commencement Bay deep sediments
  hood_north:      0.18,
  hood_south:      0.15,
  ssound_north:    0.25,  // Nisqually delta
  ssound_south:    0.35,  // Olympia deep basin sediments
};

// ── LIQUEFACTION SUSCEPTIBILITY ──
// Fraction of sub-basin area susceptible to liquefaction
// High values = built on fill, alluvium, or reclaimed land
// Source: WA DNR Liquefaction Susceptibility Map, USGS Seattle Urban Hazard Map
var LIQUEFACTION_SUSCEPTIBILITY = {
  jdf_west:        0.05,  // mostly bedrock/bluff
  jdf_central:     0.10,  // Port Angeles waterfront
  jdf_east:        0.08,
  georgia_north:   0.05,
  georgia_central: 0.85,  // Fraser Delta: ENTIRE delta is alluvial
  georgia_south:   0.40,  // Roberts Bank, Tsawwassen
  sj_haro:         0.03,  // bedrock islands
  sj_rosario:      0.05,
  whidbey_north:   0.25,  // Skagit Delta alluvium
  whidbey_central: 0.10,
  whidbey_south:   0.35,  // Everett waterfront fill
  main_north:      0.75,  // Duwamish/SODO/SLU — built on fill
  main_central:    0.20,
  main_south:      0.70,  // Commencement Bay fill areas
  hood_north:      0.05,
  hood_south:      0.05,
  ssound_north:    0.30,  // Nisqually delta
  ssound_south:    0.50,  // Olympia basin sediments
};

// ── TSUNAMI ARRIVAL ──
// External tsunami (from CSZ rupture on the shelf)
// Heights in meters, arrival times in minutes
// Source: Walsh et al. 2000, PMEL tsunami modeling
var TSUNAMI_EXTERNAL = {
  jdf_west:        { height: 7.5, arrivalMin: 18 },
  jdf_central:     { height: 4.5, arrivalMin: 28 },
  jdf_east:        { height: 3.0, arrivalMin: 35 },  // Victoria
  georgia_north:   { height: 0.3, arrivalMin: 60 },  // very attenuated
  georgia_central: { height: 0.5, arrivalMin: 55 },
  georgia_south:   { height: 0.8, arrivalMin: 50 },
  sj_haro:         { height: 1.5, arrivalMin: 40 },
  sj_rosario:      { height: 1.0, arrivalMin: 42 },
  whidbey_north:   { height: 0.3, arrivalMin: 55 },
  whidbey_central: { height: 0.3, arrivalMin: 58 },
  whidbey_south:   { height: 0.5, arrivalMin: 55 },
  main_north:      { height: 1.0, arrivalMin: 48 },  // Admiralty → Main Basin
  main_central:    { height: 0.8, arrivalMin: 50 },
  main_south:      { height: 0.6, arrivalMin: 52 },
  hood_north:      { height: 0.3, arrivalMin: 60 },  // sill attenuates
  hood_south:      { height: 0.2, arrivalMin: 65 },
  ssound_north:    { height: 0.5, arrivalMin: 55 },
  ssound_south:    { height: 0.3, arrivalMin: 60 },
};

// ── FRASER DELTA LANDSLIDE TSUNAMI ──
// Additive to external tsunami in Georgia Strait
// Rabinovich et al. 2003: 4-18m on Gulf Islands
// Triggered when M9 shaking destabilizes gas-charged foreslope
var FRASER_DELTA_TSUNAMI = {
  georgia_central: { height: 8.0, arrivalMin: 8 },   // epicenter of slope failure
  georgia_south:   { height: 12.0, arrivalMin: 5 },   // Roberts Bank directly exposed
  georgia_north:   { height: 4.0, arrivalMin: 15 },
  sj_haro:         { height: 2.0, arrivalMin: 20 },
  sj_rosario:      { height: 1.5, arrivalMin: 22 },
};

// ── TERMINAL DAMAGE MODEL ──
// Damage fraction (0-1) per terminal from combined hazards
// Factors: PGA, liquefaction, tsunami, fire risk
var TERMINAL_VULNERABILITY = {
  // NWSA Seattle — built on Duwamish fill
  nwsa_t5:        { liquefaction: 0.85, tsunami: 0.10, fire: 0.05 },
  nwsa_t18:       { liquefaction: 0.85, tsunami: 0.10, fire: 0.05 },
  nwsa_t46:       { liquefaction: 0.80, tsunami: 0.10, fire: 0.03 },
  sea_cruise_91:  { liquefaction: 0.60, tsunami: 0.15, fire: 0.02 },
  sea_cruise_66:  { liquefaction: 0.70, tsunami: 0.12, fire: 0.02 },
  sea_fishing:    { liquefaction: 0.50, tsunami: 0.08, fire: 0.05 },
  // NWSA Tacoma — Commencement Bay fill
  nwsa_husky:     { liquefaction: 0.80, tsunami: 0.08, fire: 0.05 },
  nwsa_wut:       { liquefaction: 0.80, tsunami: 0.08, fire: 0.05 },
  nwsa_pct:       { liquefaction: 0.75, tsunami: 0.08, fire: 0.04 },
  nwsa_tote:      { liquefaction: 0.70, tsunami: 0.06, fire: 0.10 },  // LNG
  puyallup_tribal:{ liquefaction: 0.75, tsunami: 0.08, fire: 0.03 },
  // Vancouver — mixed vulnerability
  van_deltaport:  { liquefaction: 0.90, tsunami: 0.80, fire: 0.05 },  // Fraser Delta + tsunami
  van_centerm:    { liquefaction: 0.30, tsunami: 0.10, fire: 0.05 },  // more bedrock
  van_vanterm:    { liquefaction: 0.30, tsunami: 0.10, fire: 0.05 },
  van_transmtn:   { liquefaction: 0.35, tsunami: 0.08, fire: 0.40 },  // pipeline rupture fire
  van_neptune:    { liquefaction: 0.25, tsunami: 0.08, fire: 0.10 },
  van_westshore:  { liquefaction: 0.85, tsunami: 0.75, fire: 0.15 },  // Roberts Bank
  van_cruise:     { liquefaction: 0.20, tsunami: 0.10, fire: 0.02 },
  // Refineries — HIGH fire risk
  cherry_bp:      { liquefaction: 0.20, tsunami: 0.05, fire: 0.60 },
  cherry_p66:     { liquefaction: 0.20, tsunami: 0.05, fire: 0.55 },
  march_marathon: { liquefaction: 0.25, tsunami: 0.05, fire: 0.55 },
  march_holly:    { liquefaction: 0.25, tsunami: 0.05, fire: 0.50 },
  // Military — built to seismic standards
  psns:           { liquefaction: 0.15, tsunami: 0.05, fire: 0.08 },
  bangor:         { liquefaction: 0.10, tsunami: 0.03, fire: 0.05 },
  // Victoria
  vic_ogden:      { liquefaction: 0.15, tsunami: 0.30, fire: 0.02 },
};

// ── INFRASTRUCTURE DAMAGE ──
// Each system gets a damage fraction based on PGA + liquefaction + tsunami
var INFRA_DAMAGE = {
  i5: {
    chuckanut:    0.95,  // near-certain failure during M9
    skagitFlood:  0.70,  // levee damage + shaking
    seattleFill:  0.80,  // approaches on fill liquefy
    tacomaFill:   0.75,  // Puyallup valley fill
    nisquallyDelta: 0.85, // Nisqually liquefaction
  },
  rail: {
    bnsf:         0.70,  // Stampede tunnel + fill sections
    cnFraser:     0.85,  // Fraser Canyon rockslides
    cpRogers:     0.75,  // Rogers Pass closures
  },
  airports: {
    seatac:       0.40,  // runway on fill, possible liquefaction
    yvr:          0.90,  // ON the Fraser Delta — severe liquefaction
  },
  ferries: {
    wsf:          0.30,  // some terminals on fill, but Colman Dock seismically upgraded
    bcFerries:    0.80,  // Tsawwassen on Fraser Delta
  },
  utilities: {
    powerGrid:    0.70,  // widespread outage
    waterSewer:   0.85,  // broken mains in liquefaction zones
    communications: 0.50, // submarine cables may break
  },
};

// ── ENVIRONMENTAL DAMAGE ──
// Per sub-basin: contamination release, habitat destruction
var ENV_DAMAGE_FACTORS = {
  contamination: {
    main_north:      0.80,  // Duwamish Superfund disturbed
    main_south:      0.70,  // Commencement Bay Superfund
    georgia_central: 0.50,  // Trans Mountain rupture risk
    whidbey_north:   0.30,  // March Point refinery risk
    georgia_south:   0.40,  // Cherry Point refinery risk
  },
  habitatDestruction: {
    // Eelgrass and marsh scoured by tsunami + sediment mobilization
    georgia_south:   0.60,  // Roberts Bank eelgrass
    georgia_central: 0.50,  // Fraser estuary habitat
    main_south:      0.40,  // Commencement Bay habitat
    whidbey_north:   0.35,  // Skagit Delta marsh
    ssound_north:    0.30,  // Nisqually Delta
  },
  sedimentMobilization: {
    // Landslides + liquefaction + tsunami scour
    georgia_central: 0.90,  // Fraser Delta morphology permanently altered
    georgia_south:   0.70,
    main_north:      0.60,  // Duwamish
    main_south:      0.50,  // Puyallup
    whidbey_north:   0.40,
  },
};

// ── RECOVERY TRAJECTORIES ──
// Time constants (in quarters) for exponential recovery
var RECOVERY_TAU = {
  infrastructure: 16,   // ~4 years to 63% recovery (5-10 years to full)
  environmental:  40,   // ~10 years to 63% (10-20 years to full)
  economic:       12,   // ~3 years to 63% (3-7 years full)
  population:     8,    // ~2 years to 63% (2-5 years full)
};

// ═══════════════════════════════════════════════════════════
// MAIN EVENT SIMULATION
// ═══════════════════════════════════════════════════════════

// Compute immediate M9 effects for a single timestep.
// Called from orchestrator when cascadia_m9 shock is active.
//
// Parameters:
//   quartersSinceEvent: 0 = event just triggered, >0 = recovery
//   preparedness: 0-1 from infrastructure investment levels
//   slrCm: current sea level rise (amplifies tsunami)
//   seed: for stochastic variation
//
// Returns:
//   { subBasinDamage, terminalDamage, infraDamage, envDamage,
//     recovery, portCapacityFraction, casualties (context only) }
export function simulateCascadiaM9(quartersSinceEvent, preparedness, slrCm, seed) {
  quartersSinceEvent = quartersSinceEvent !== undefined ? quartersSinceEvent : 0;
  preparedness = preparedness !== undefined ? preparedness : 0.3;
  slrCm = slrCm !== undefined ? slrCm : 0;
  seed = seed !== undefined ? seed : 42;

  var isInitialEvent = quartersSinceEvent === 0;
  var prepMod = cl(1 - preparedness * 0.4, 0.4, 1.0); // preparedness reduces damage by up to 40%
  var slrTsunamiMod = 1 + cl(slrCm / 100, 0, 0.5); // SLR amplifies tsunami (0.3m = +15%)

  // ── PER SUB-BASIN DAMAGE ──
  var subBasinDamage = {};
  var subBasinKeys = Object.keys(PGA_BY_SUB_BASIN);
  for (var i = 0; i < subBasinKeys.length; i++) {
    var sbk = subBasinKeys[i];
    var pga = PGA_BY_SUB_BASIN[sbk];
    var liqSusc = LIQUEFACTION_SUSCEPTIBILITY[sbk] || 0;
    var extTsu = TSUNAMI_EXTERNAL[sbk] || { height: 0 };
    var deltaTs = FRASER_DELTA_TSUNAMI[sbk] || { height: 0 };

    // Combined PGA effect (nonlinear — damage accelerates above 0.2g)
    var shakingDamage = cl(Math.pow(pga / 0.3, 1.5) * 0.3, 0, 0.8);

    // Liquefaction damage (PGA × susceptibility)
    var liqProb = cl(pga * liqSusc * 3.0, 0, 1.0);
    var rng = seededRandom(seed + i * 7777);
    var liqOccurred = rng < liqProb ? 1 : 0;
    var liqDamage = liqOccurred * cl(liqSusc * 0.7, 0, 0.9);

    // Tsunami damage (external + Fraser Delta, amplified by SLR)
    var totalTsunamiHeight = (extTsu.height + deltaTs.height) * slrTsunamiMod;
    var tsunamiDamage = cl(totalTsunamiHeight / 15.0, 0, 0.9); // 15m = 90% damage

    // Combined damage (multiplicative — each source compounds the others)
    var totalDamage = cl(1 - (1 - shakingDamage * prepMod) * (1 - liqDamage * prepMod) * (1 - tsunamiDamage), 0, 0.98);

    subBasinDamage[sbk] = {
      pga: pga,
      shakingDamage: shakingDamage * prepMod,
      liquefactionProb: liqProb,
      liquefactionOccurred: liqOccurred,
      liquefactionDamage: liqDamage * prepMod,
      tsunamiHeight: totalTsunamiHeight,
      tsunamiDamage: tsunamiDamage,
      totalDamage: totalDamage,
      arrivalMin: extTsu.arrivalMin || 60,
    };
  }

  // ── TERMINAL DAMAGE ──
  var terminalDamage = {};
  var termKeys = Object.keys(TERMINAL_VULNERABILITY);
  for (var ti = 0; ti < termKeys.length; ti++) {
    var tk = termKeys[ti];
    var tv = TERMINAL_VULNERABILITY[tk];
    var termRng = seededRandom(seed + ti * 3333);

    var termLiqDmg = termRng < (tv.liquefaction * prepMod) ? tv.liquefaction : tv.liquefaction * 0.3;
    var termTsuDmg = tv.tsunami * slrTsunamiMod;
    var termFireDmg = (termRng * 0.7 + 0.3) < tv.fire ? tv.fire : 0;

    var termTotal = cl(1 - (1 - termLiqDmg * prepMod) * (1 - termTsuDmg) * (1 - termFireDmg), 0, 0.98);

    terminalDamage[tk] = {
      liquefaction: termLiqDmg * prepMod,
      tsunami: termTsuDmg,
      fire: termFireDmg,
      total: termTotal,
      recoveryMonths: Math.round(termTotal * 60), // severe damage = 5 years to rebuild
    };
  }

  // ── INFRASTRUCTURE DAMAGE ──
  var infraDamage = {
    i5Damage: cl((INFRA_DAMAGE.i5.chuckanut * 0.3 + INFRA_DAMAGE.i5.seattleFill * 0.3 +
      INFRA_DAMAGE.i5.tacomaFill * 0.2 + INFRA_DAMAGE.i5.skagitFlood * 0.1 +
      INFRA_DAMAGE.i5.nisquallyDelta * 0.1) * prepMod, 0, 0.95),
    railDamage: cl((INFRA_DAMAGE.rail.bnsf * 0.4 + INFRA_DAMAGE.rail.cnFraser * 0.35 +
      INFRA_DAMAGE.rail.cpRogers * 0.25) * prepMod, 0, 0.95),
    airportDamage: cl((INFRA_DAMAGE.airports.seatac * 0.5 + INFRA_DAMAGE.airports.yvr * 0.5) * prepMod, 0, 0.95),
    ferryDamage: cl((INFRA_DAMAGE.ferries.wsf * 0.5 + INFRA_DAMAGE.ferries.bcFerries * 0.5) * prepMod, 0, 0.90),
    powerDamage: cl(INFRA_DAMAGE.utilities.powerGrid * prepMod, 0, 0.85),
    waterDamage: cl(INFRA_DAMAGE.utilities.waterSewer * prepMod, 0, 0.95),
    commsDamage: cl(INFRA_DAMAGE.utilities.communications * prepMod, 0, 0.75),
  };

  // ── ENVIRONMENTAL DAMAGE ──
  var envDamage = {};
  var envKeys = Object.keys(ENV_DAMAGE_FACTORS);
  for (var ek = 0; ek < envKeys.length; ek++) {
    var cat = envKeys[ek];
    var catDmg = ENV_DAMAGE_FACTORS[cat];
    envDamage[cat] = {};
    var dmgKeys = Object.keys(catDmg);
    for (var dk = 0; dk < dmgKeys.length; dk++) {
      envDamage[cat][dmgKeys[dk]] = catDmg[dmgKeys[dk]];
    }
  }

  // ── RECOVERY TRAJECTORY ──
  // Exponential recovery: recovery(t) = 1 - exp(-t/τ)
  var recovery = {
    infrastructure: cl(1 - Math.exp(-quartersSinceEvent / RECOVERY_TAU.infrastructure), 0, 0.98),
    environmental:  cl(1 - Math.exp(-quartersSinceEvent / RECOVERY_TAU.environmental), 0, 0.98),
    economic:       cl(1 - Math.exp(-quartersSinceEvent / RECOVERY_TAU.economic), 0, 0.98),
    population:     cl(1 - Math.exp(-quartersSinceEvent / RECOVERY_TAU.population), 0, 0.98),
    quartersSinceEvent: quartersSinceEvent,
  };

  // ── PORT CAPACITY ──
  // Aggregate port capacity fraction during/after event
  var totalTerminals = termKeys.length;
  var avgTermDamage = 0;
  for (var tdi = 0; tdi < termKeys.length; tdi++) {
    avgTermDamage += terminalDamage[termKeys[tdi]].total;
  }
  avgTermDamage = avgTermDamage / totalTerminals;

  // Port capacity during initial event vs recovery
  var portCapacityFraction;
  if (quartersSinceEvent === 0) {
    portCapacityFraction = cl(1 - avgTermDamage, 0.02, 0.30); // 2-30% capacity immediately
  } else {
    portCapacityFraction = cl(recovery.infrastructure * (1 - avgTermDamage * 0.5) + 0.1, 0.05, 1.0);
  }

  // ── HUMAN TOLL (context only — presented soberly) ──
  // FEMA Cascadia Rising 2016 estimates
  var casualties = {
    estimated: '10,000-30,000 across OR/WA/BC',
    displaced: '1-3 million',
    economicDamage: '$100-200 billion',
    source: 'FEMA Cascadia Rising 2016, CREW reports',
    note: 'This is a teaching simulation. These numbers represent real human suffering.',
  };

  return {
    subBasinDamage: subBasinDamage,
    terminalDamage: terminalDamage,
    infraDamage: infraDamage,
    envDamage: envDamage,
    recovery: recovery,
    portCapacityFraction: portCapacityFraction,
    avgTerminalDamage: avgTermDamage,
    preparedness: preparedness,
    slrAmplification: slrTsunamiMod,
    casualties: casualties,
    fraserDeltaCollapse: true, // M9 always triggers Fraser Delta slope failure
  };
}

// ── APPLY RECOVERY TO MODEL STATE ──
// Blends M9 damage into existing model state variables.
// Called each quarter while m9 recovery is active.
export function applyM9Recovery(m9Result, marineState, infraState, ecoState) {
  if (!m9Result) return;
  var rec = m9Result.recovery;
  var damageRemaining = 1 - rec.infrastructure;

  // Infrastructure effects (carried through infrastructure module)
  if (infraState) {
    infraState.i5Condition = cl((infraState.i5Condition || 0.8) * (1 - m9Result.infraDamage.i5Damage * damageRemaining), 0.01, 1.0);
    infraState.railCondition = cl((infraState.railCondition || 0.75) * (1 - m9Result.infraDamage.railDamage * damageRemaining), 0.01, 1.0);
    infraState.ferryReliability = cl((infraState.ferryReliability || 0.7) * (1 - m9Result.infraDamage.ferryDamage * damageRemaining * 0.5), 0.1, 1.0);
    infraState.pipelineCondition = cl((infraState.pipelineCondition || 0.7) * (1 - m9Result.infraDamage.powerDamage * damageRemaining * 0.5), 0.1, 1.0);
    infraState.waterCondition = cl((infraState.waterCondition || 0.7) * (1 - m9Result.infraDamage.waterDamage * damageRemaining), 0.01, 1.0);
  }

  // Environmental effects (carried through marine and ecosystem)
  var envRemaining = 1 - rec.environmental;
  if (marineState) {
    // Contamination release from Superfund disturbance
    var contam = m9Result.envDamage.contamination || {};
    var contamKeys = Object.keys(contam);
    for (var ci = 0; ci < contamKeys.length; ci++) {
      // contaminationIndex is region-wide; add pulse scaled by damage
      var pulse = contam[contamKeys[ci]] * envRemaining * 0.02;
      marineState.contamination = cl((marineState.contamination || 0.1) + pulse, 0, 0.8);
    }
    // Sediment mobilization → turbidity
    marineState.sediment = cl((marineState.sediment || 20) + envRemaining * 15, 0, 100);
  }

  // Ecosystem effects
  if (ecoState) {
    var habDmg = m9Result.envDamage.habitatDestruction || {};
    // Eelgrass scoured by tsunami + sediment
    var habAvg = 0, habCount = 0;
    var habKeys = Object.keys(habDmg);
    for (var hi = 0; hi < habKeys.length; hi++) {
      habAvg += habDmg[habKeys[hi]];
      habCount++;
    }
    habAvg = habCount > 0 ? habAvg / habCount : 0;
    if (ecoState.eelgrassEstab !== undefined) {
      ecoState.eelgrassEstab = cl(ecoState.eelgrassEstab * (1 - habAvg * envRemaining * 0.3), 0.1, 1.0);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// PART 2 — DYNAMIC TERMINAL DAMAGE (uses portSystem.js data)
// ═══════════════════════════════════════════════════════════

// Compute per-terminal damage from actual TERMINALS array.
// Uses soil/vulnerability properties added to portSystem.js.
export function computeTerminalDamage(terminal, subBasinPGA, tsunamiHeight, preparednessInvestment) {
  preparednessInvestment = preparednessInvestment !== undefined ? preparednessInvestment : 0.5;
  var liqSusc = terminal.liquefactionSusceptibility || 0.3;
  var seismicUp = terminal.seismicUpgrade || 0.2;
  var fire = terminal.fireRisk || 0;

  var liqDamage = cl(subBasinPGA * liqSusc * (1 - seismicUp * preparednessInvestment), 0, 0.9);
  var tsunamiDamage = tsunamiHeight > 1.0 ? cl((tsunamiHeight - 1.0) / 10.0, 0, 0.9) : 0;
  var fireDamage = cl(fire * subBasinPGA * 2, 0, 0.7);
  var totalDamage = cl(1 - (1 - liqDamage) * (1 - tsunamiDamage) * (1 - fireDamage), 0, 0.98);
  var recoveryMonths = Math.round(totalDamage * 120);

  return {
    terminalId: terminal.id,
    type: terminal.type,
    soilType: terminal.soilType || 'unknown',
    damage: totalDamage,
    liqDamage: liqDamage,
    tsunamiDamage: tsunamiDamage,
    fireDamage: fireDamage,
    recoveryMonths: recoveryMonths,
    seismicUpgrade: seismicUp,
  };
}

// Compute damage for ALL terminals from portSystem.js
export function computeAllTerminalDamage(terminals, m9Result, preparednessInvestment) {
  var result = {};
  for (var i = 0; i < terminals.length; i++) {
    var t = terminals[i];
    var sbk = t.subBasin || 'main_central';
    var sbDmg = m9Result.subBasinDamage[sbk];
    var pga = sbDmg ? PGA_BY_SUB_BASIN[sbk] || 0.2 : 0.2;
    var tsuHeight = sbDmg ? sbDmg.tsunamiHeight || 0 : 0;
    result[t.id] = computeTerminalDamage(t, pga, tsuHeight, preparednessInvestment);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════
// PART 3 — COMPETITIVE ROUTING POST-M9
// ═══════════════════════════════════════════════════════════

// Segment recovery rates: fraction operational at 6 months post-M9
var SEGMENT_RECOVERY_RATE = {
  military:   0.90,  // Kitsap on bedrock, built to seismic standards. Disaster relief hub.
  ferry:      0.70,  // Critical priority — becomes essential transport when roads fail
  fishing:    0.60,  // Fleet mobile (at sea survives) but processing infrastructure destroyed
  petroleum:  0.40,  // Must inspect refineries, pipelines. 3-6 months partial restart
  bulk:       0.30,  // Grain exports critical but terminals complex. 6-12 months
  container:  0.15,  // Slowest. Crane replacement 12-24 months. 1-3 years for first terminals
  cruise:     0.05,  // Non-essential. Lines reroute immediately. 5+ years to return
  breakbulk:  0.25,
  tanker:     0.35,
  refinery:   0.35,
};

// Compute post-M9 competitive routing shares.
// Prince Rupert is 1200km from epicenter — undamaged.
// Returns { nwsa, vancouver, princeRupert, laLongBeach }
export function computeM9RouteShares(terminalDamage, quartersSinceEvent) {
  quartersSinceEvent = quartersSinceEvent !== undefined ? quartersSinceEvent : 0;

  // Compute surviving capacity per port complex
  var nwsaCap = 0, nwsaTotal = 0;
  var vanCap = 0, vanTotal = 0;
  var nwsaTerms = ['nwsa_t5', 'nwsa_t18', 'nwsa_t46', 'nwsa_husky', 'nwsa_wut', 'nwsa_pct', 'nwsa_tote'];
  var vanTerms = ['van_deltaport', 'van_centerm', 'van_vanterm'];

  for (var i = 0; i < nwsaTerms.length; i++) {
    var td = terminalDamage[nwsaTerms[i]];
    if (td) {
      nwsaTotal += 1;
      // Recovery: exponential with segment-specific rate
      var segRate = SEGMENT_RECOVERY_RATE[td.type] || 0.2;
      var recovFrac = cl(1 - (td.damage * Math.exp(-quartersSinceEvent * segRate / 4)), 0, 1);
      nwsaCap += recovFrac;
    }
  }
  for (var j = 0; j < vanTerms.length; j++) {
    var vd = terminalDamage[vanTerms[j]];
    if (vd) {
      vanTotal += 1;
      var vSegRate = SEGMENT_RECOVERY_RATE[vd.type] || 0.2;
      var vRecovFrac = cl(1 - (vd.damage * Math.exp(-quartersSinceEvent * vSegRate / 4)), 0, 1);
      vanCap += vRecovFrac;
    }
  }

  var nwsaCapFrac = nwsaTotal > 0 ? nwsaCap / nwsaTotal : 0;
  var vanCapFrac = vanTotal > 0 ? vanCap / vanTotal : 0;

  // Base shares adjusted by surviving capacity
  var nwsaShare = cl(0.30 * nwsaCapFrac, 0.02, 0.35);
  var vanShare = cl(0.35 * vanCapFrac, 0.02, 0.40);

  // Prince Rupert absorbs surge (undamaged, 1200km away)
  var displaced = cl((0.30 - nwsaShare) + (0.35 - vanShare), 0, 0.50);
  var prShare = cl(0.15 + displaced * 0.65, 0.15, 0.50);  // absorbs 65% of displaced cargo

  // LA/LB absorbs remainder
  var laShare = cl(1 - nwsaShare - vanShare - prShare, 0.10, 0.45);

  // Hysteresis: even after full recovery, some cargo never returns
  // Shipping lines that rerouted build relationships, sign contracts
  var hysteresis = cl(1 - Math.exp(-quartersSinceEvent / 40), 0, 0.15); // up to 15% permanent shift
  nwsaShare = cl(nwsaShare - hysteresis * 0.3, 0.02, 0.35);   // NWSA loses ~5% permanently
  vanShare = cl(vanShare - hysteresis * 0.35, 0.02, 0.40);     // Vancouver loses ~5% permanently
  prShare = cl(prShare + hysteresis * 0.65, 0.15, 0.50);       // PR gains permanently

  return {
    nwsa: nwsaShare,
    vancouver: vanShare,
    princeRupert: prShare,
    laLongBeach: cl(1 - nwsaShare - vanShare - prShare, 0.10, 0.45),
    nwsaCapacityFraction: nwsaCapFrac,
    vancouverCapacityFraction: vanCapFrac,
    hysteresisEffect: hysteresis,
  };
}

// ═══════════════════════════════════════════════════════════
// PART 4 — SEGMENT RECOVERY TIMELINES
// ═══════════════════════════════════════════════════════════

// Compute per-segment operational fraction during recovery
export function computeSegmentRecovery(quartersSinceEvent) {
  quartersSinceEvent = quartersSinceEvent !== undefined ? quartersSinceEvent : 0;
  var segments = {};
  var keys = Object.keys(SEGMENT_RECOVERY_RATE);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var rate = SEGMENT_RECOVERY_RATE[k];
    // Exponential recovery: 1 - exp(-t × rate/4)
    // At 2 quarters (6 months), military = 0.90, cruise = 0.05
    segments[k] = cl(1 - Math.exp(-quartersSinceEvent * rate / 2), 0, 1);
  }
  return segments;
}

// ═══════════════════════════════════════════════════════════
// PART 5 — LABOR DYNAMICS POST-M9
// ═══════════════════════════════════════════════════════════

// M9 effects on labor: no disputes, but severe availability crisis
export function computeM9LaborEffects(quartersSinceEvent) {
  quartersSinceEvent = quartersSinceEvent !== undefined ? quartersSinceEvent : 0;

  // Labor tension drops to 0 — everyone cooperates post-disaster
  var tensionMod = cl(Math.exp(-quartersSinceEvent / 8) * -0.8, -0.8, 0); // tension reduction

  // Labor AVAILABILITY: workers displaced, injured, caring for families
  // Drops to 30% immediately, recovers with τ = 8 quarters (~2 years)
  var laborAvailability = cl(1 - 0.7 * Math.exp(-quartersSinceEvent / 8), 0.3, 1.0);

  return {
    tensionModifier: tensionMod,
    laborAvailability: laborAvailability,
    disputeProbability: 0,  // no strikes during disaster recovery
  };
}

// ═══════════════════════════════════════════════════════════
// PART 6 — MACROECONOMIC SHOCK
// ═══════════════════════════════════════════════════════════

// Compute M9 macroeconomic effects for injection into macroEconomy.js
export function computeM9MacroShock(quartersSinceEvent) {
  quartersSinceEvent = quartersSinceEvent !== undefined ? quartersSinceEvent : 0;

  // GDP shock: sharp drop year 1, then construction-boom recovery
  // US (WA): -25% year 1, +2% above trend years 2-5 (rebuilding stimulus)
  var gdpShock;
  if (quartersSinceEvent < 4) {
    gdpShock = -6.25; // -25% annualized over 4 quarters
  } else if (quartersSinceEvent < 20) {
    gdpShock = 2.0 * Math.exp(-(quartersSinceEvent - 4) / 16); // construction boom fades
  } else {
    gdpShock = 0;
  }

  // Canada (BC): -20% year 1 (smaller national share than WA)
  var canadaGdpShock;
  if (quartersSinceEvent < 4) {
    canadaGdpShock = -5.0;
  } else if (quartersSinceEvent < 20) {
    canadaGdpShock = 1.5 * Math.exp(-(quartersSinceEvent - 4) / 16);
  } else {
    canadaGdpShock = 0;
  }

  // Unemployment: spikes then falls as rebuilding creates jobs
  var waUnempShock = cl(10.0 * Math.exp(-quartersSinceEvent / 6), 0, 10);
  var bcUnempShock = cl(8.0 * Math.exp(-quartersSinceEvent / 6), 0, 8);

  // Fed/BoC may cut rates to support recovery
  var fedRateShock = quartersSinceEvent < 8 ? -1.5 : cl(-1.5 + quartersSinceEvent * 0.15, -1.5, 0);
  var bocRateShock = quartersSinceEvent < 8 ? -1.25 : cl(-1.25 + quartersSinceEvent * 0.12, -1.25, 0);

  // Housing starts surge in years 2-5 (reconstruction)
  var housingShock;
  if (quartersSinceEvent < 4) {
    housingShock = -600; // construction halted
  } else if (quartersSinceEvent < 20) {
    housingShock = 400 * (1 - Math.exp(-(quartersSinceEvent - 4) / 8)); // reconstruction boom
  } else {
    housingShock = 0;
  }

  // Oil price: may spike briefly from refinery shutdowns, then normalize
  var oilShock = cl(15 * Math.exp(-quartersSinceEvent / 4), 0, 15);

  return {
    gdpShock: gdpShock,
    canadaGdpShock: canadaGdpShock,
    waUnempShock: waUnempShock,
    bcUnempShock: bcUnempShock,
    fedRateShock: fedRateShock,
    bocRateShock: bocRateShock,
    housingShock: housingShock,
    oilShock: oilShock,
    federalDisasterSpending: quartersSinceEvent < 20 ? 12500 : 0, // $50B/4yr ≈ $12.5B/yr
    insurancePayouts: quartersSinceEvent < 8 ? 6000 : 0, // $30-50B spread over 2 years
  };
}

// ═══════════════════════════════════════════════════════════
// PART 7 — SENSOR NETWORK DEGRADATION
// ═══════════════════════════════════════════════════════════

// Seismic vulnerability of observation stations
// 0 = survives, 1 = certainly destroyed
var STATION_SEISMIC_VULNERABILITY = {
  // Shore-based on fill — high vulnerability
  'noaa_seattle_sst':   0.70,  // Seattle waterfront fill
  'noaa_tacoma_sst':    0.60,  // Commencement Bay
  'nanoos_pointwells_do': 0.40, // offshore mooring, moderate
  // Shore-based on bedrock — low vulnerability
  'noaa_fridayharbor_sst': 0.10,  // bedrock island
  'noaa_neahbay_sst':     0.15,  // remote, bedrock
  'noaa_portangeles_sst': 0.25,
  'noaa_porttownsend_sst': 0.20,
  'noaa_cherrypoint_wl':  0.20,
  // NANOOS moorings — moderate (offshore, but cables may break)
  'nanoos_twanoh_do':    0.15,  // Hood Canal, remote
  'nanoos_twanoh_ph':    0.15,
  'nanoos_dabob_do':     0.15,
  // USGS river gauges — mostly survive (upstream of liquefaction)
  'usgs_skagit':         0.10,
  'usgs_snohomish':      0.15,
  'usgs_nooksack':       0.08,
  'usgs_puyallup':       0.25,  // near liquefaction zone
  'usgs_nisqually':      0.20,
  'usgs_stillaguamish':  0.10,
  // OOI shelf moorings — SURVIVE (offshore, different tectonic context)
  'ooi_ce01_ctd':        0.05,
  'ooi_ce01_do':         0.05,
  'ooi_ce04_ctd':        0.03,
  'ooi_ce04_ph':         0.03,
  'ooi_rs01_ctd':        0.02,
  'ooi_rs01_do':         0.02,
  // ONC — cable may break from seafloor disruption
  'onc_venus_ddl':       0.40,
  'onc_venus_ddl_do':    0.40,
  // NDBC buoys — offshore, survive
  'ndbc_46087':          0.03,
  'ndbc_46041':          0.02,
  'ndbc_46029':          0.02,
  // Orcasound — shore-based but on bedrock islands
  'orcasound_lab':       0.10,
  'orcasound_bush':      0.15,
  'orcasound_pt':        0.20,
};

// Compute which stations survive M9
export function computeSensorDegradation(seed) {
  seed = seed !== undefined ? seed : 42;
  var surviving = {};
  var failed = {};
  var stationIds = Object.keys(STATION_SEISMIC_VULNERABILITY);
  for (var i = 0; i < stationIds.length; i++) {
    var sid = stationIds[i];
    var vuln = STATION_SEISMIC_VULNERABILITY[sid];
    var rng = seededRandom(seed + i * 9999);
    if (rng < vuln) {
      failed[sid] = vuln;
    } else {
      surviving[sid] = vuln;
    }
  }
  return {
    surviving: surviving,
    failed: failed,
    survivingCount: Object.keys(surviving).length,
    failedCount: Object.keys(failed).length,
    totalStations: stationIds.length,
  };
}

// ═══════════════════════════════════════════════════════════
// PART 8 — FISHING FLEET DAMAGE
// ═══════════════════════════════════════════════════════════
// Most of the fleet is in harbor at any given time.
// Vessels at sea in deep water survive; vessels in port do not.

// Fishing harbors: vessels, sub-basin, exposure
var FISHING_HARBORS = {
  fishermens_terminal: { vessels: 200, subBasin: 'main_north', name: 'Fishermen\'s Terminal, Seattle' },
  steveston:           { vessels: 400, subBasin: 'georgia_central', name: 'Steveston, BC' },
  squalicum:           { vessels: 150, subBasin: 'georgia_south', name: 'Squalicum Harbor, Bellingham' },
  cap_sante:           { vessels: 80, subBasin: 'whidbey_north', name: 'Cap Sante, Anacortes' },
  commencement_bay:    { vessels: 60, subBasin: 'main_south', name: 'Commencement Bay, Tacoma' },
};

// Tribal fleets from indigenousMaritime.js
var TRIBAL_FLEET_HARBORS = {
  puyallup:   { vessels: 45, subBasin: 'main_south' },
  lummi:      { vessels: 120, subBasin: 'georgia_south' },
  muckleshoot:{ vessels: 15, subBasin: 'main_north' },
  musqueam:   { vessels: 40, subBasin: 'georgia_central' },
  stolo:      { vessels: 200, subBasin: 'georgia_central' },
  makah:      { vessels: 60, subBasin: 'jdf_west' },
  swinomish:  { vessels: 20, subBasin: 'whidbey_north' },
  tulalip:    { vessels: 35, subBasin: 'whidbey_south' },
  nisqually:  { vessels: 25, subBasin: 'ssound_north' },
  skokomish:  { vessels: 15, subBasin: 'hood_south' },
  sklallam:   { vessels: 30, subBasin: 'jdf_central' },
  cowichan:   { vessels: 25, subBasin: 'georgia_central' },
};

export function computeFleetDamage(m9Result, quarter) {
  var fleetAtSea = quarter === 2 || quarter === 3 ? 0.25 : 0.10; // more at sea in summer/fall
  var fleetInHarbor = 1 - fleetAtSea;

  var commercialResult = {};
  var totalCommVessels = 0, totalCommSurviving = 0;
  var harbKeys = Object.keys(FISHING_HARBORS);
  for (var i = 0; i < harbKeys.length; i++) {
    var hk = harbKeys[i];
    var harb = FISHING_HARBORS[hk];
    var sbDmg = m9Result.subBasinDamage[harb.subBasin];
    var tsuHeight = sbDmg ? sbDmg.tsunamiHeight || 0 : 0;
    var harborSurvival = cl(1 - tsuHeight / 15.0, 0.05, 0.95);
    var survival = fleetAtSea * 0.98 + fleetInHarbor * harborSurvival;
    var surviving = Math.round(harb.vessels * survival);
    commercialResult[hk] = {
      name: harb.name,
      totalVessels: harb.vessels,
      surviving: surviving,
      lost: harb.vessels - surviving,
      survivalFraction: survival,
      tsunamiHeight: tsuHeight,
    };
    totalCommVessels += harb.vessels;
    totalCommSurviving += surviving;
  }

  var tribalResult = {};
  var totalTribalVessels = 0, totalTribalSurviving = 0;
  var tribKeys = Object.keys(TRIBAL_FLEET_HARBORS);
  for (var j = 0; j < tribKeys.length; j++) {
    var tk = tribKeys[j];
    var tf = TRIBAL_FLEET_HARBORS[tk];
    var tSbDmg = m9Result.subBasinDamage[tf.subBasin];
    var tTsuHeight = tSbDmg ? tSbDmg.tsunamiHeight || 0 : 0;
    var tHarborSurv = cl(1 - tTsuHeight / 15.0, 0.05, 0.95);
    var tSurvival = fleetAtSea * 0.98 + fleetInHarbor * tHarborSurv;
    var tSurv = Math.round(tf.vessels * tSurvival);
    tribalResult[tk] = {
      totalVessels: tf.vessels,
      surviving: tSurv,
      lost: tf.vessels - tSurv,
      survivalFraction: tSurvival,
    };
    totalTribalVessels += tf.vessels;
    totalTribalSurviving += tSurv;
  }

  return {
    commercial: commercialResult,
    tribal: tribalResult,
    totalCommercialSurvival: totalCommVessels > 0 ? totalCommSurviving / totalCommVessels : 1,
    totalTribalSurvival: totalTribalVessels > 0 ? totalTribalSurviving / totalTribalVessels : 1,
    fleetAtSea: fleetAtSea,
  };
}

// ═══════════════════════════════════════════════════════════
// PART 9 — NEARSHORE HABITAT TSUNAMI DAMAGE
// ═══════════════════════════════════════════════════════════
// Tsunami scour removes eelgrass, marsh, kelp, spawning substrate

// Habitat recovery timescales (quarters)
var HABITAT_RECOVERY_TAU = {
  eelgrass: 20,        // 5 years partial, 10-15 full (rhizome regrowth)
  marsh: 40,           // 10-20 years (slow colonization)
  kelp: 6,             // 1-2 years (holdfast regrowth) IF substrate intact
  kelpBuried: 30,      // 7-10 years if substrate buried by tsunami sediment
  spawningBeach: 12,   // 2-5 years (wave action re-sorts gravel) — Penttila 2007
  pocketEstuary: 16,   // 4 years, some may improve (barriers breached)
};

export function computeTsunamiHabitatDamage(m9Result, quartersSinceEvent) {
  quartersSinceEvent = quartersSinceEvent !== undefined ? quartersSinceEvent : 0;

  var perBasin = {};
  var subBasinKeys = Object.keys(PGA_BY_SUB_BASIN);
  for (var i = 0; i < subBasinKeys.length; i++) {
    var sbk = subBasinKeys[i];
    var sbDmg = m9Result.subBasinDamage[sbk];
    var tsuHeight = sbDmg ? sbDmg.tsunamiHeight || 0 : 0;

    // Scour factor: nonlinear with wave height
    var scourFactor = cl(Math.pow(tsuHeight / 10.0, 1.3), 0, 0.9);

    // Shallow eelgrass most exposed; depth attenuates
    var eelgrassLoss = cl(scourFactor * 0.7, 0, 0.70);
    var marshLoss = cl(scourFactor * 0.8, 0, 0.80);
    var kelpLoss = cl(scourFactor * 0.5, 0, 0.50); // holdfasts survive
    var beachLoss = cl(scourFactor * 0.6, 0, 0.60);
    var pocketLoss = cl(scourFactor * 0.3, 0, 0.40); // some survive, some improve

    // Apply recovery
    var eelgrassRecov = cl(1 - Math.exp(-quartersSinceEvent / HABITAT_RECOVERY_TAU.eelgrass), 0, 1);
    var marshRecov = cl(1 - Math.exp(-quartersSinceEvent / HABITAT_RECOVERY_TAU.marsh), 0, 1);
    var kelpRecov = cl(1 - Math.exp(-quartersSinceEvent / HABITAT_RECOVERY_TAU.kelp), 0, 1);
    var beachRecov = cl(1 - Math.exp(-quartersSinceEvent / HABITAT_RECOVERY_TAU.spawningBeach), 0, 1);

    perBasin[sbk] = {
      tsunamiHeight: tsuHeight,
      scourFactor: scourFactor,
      eelgrassLoss: eelgrassLoss * (1 - eelgrassRecov),
      marshLoss: marshLoss * (1 - marshRecov),
      kelpLoss: kelpLoss * (1 - kelpRecov),
      beachLoss: beachLoss * (1 - beachRecov),
      pocketLoss: pocketLoss * (1 - cl(1 - Math.exp(-quartersSinceEvent / HABITAT_RECOVERY_TAU.pocketEstuary), 0, 1)),
    };
  }

  // Aggregate
  var totalEelgrassLoss = 0, totalMarshLoss = 0, count = 0;
  var keys = Object.keys(perBasin);
  for (var j = 0; j < keys.length; j++) {
    totalEelgrassLoss += perBasin[keys[j]].eelgrassLoss;
    totalMarshLoss += perBasin[keys[j]].marshLoss;
    count++;
  }

  return {
    perBasin: perBasin,
    avgEelgrassLoss: count > 0 ? totalEelgrassLoss / count : 0,
    avgMarshLoss: count > 0 ? totalMarshLoss / count : 0,
  };
}

// ═══════════════════════════════════════════════════════════
// PART 10 — AQUACULTURE DESTRUCTION + FARMED SALMON ESCAPE
// ═══════════════════════════════════════════════════════════

// BC salmon farms: ~100 active net pens, mostly in Georgia Strait
// Tsunami breaks anchor lines → mass escape of farmed Atlantic salmon
// Citation: Naylor et al. 2005 (escaped farmed salmon ecological impacts)
export function computeAquacultureDamage(m9Result) {
  // Net pen failures proportional to wave height in Georgia Strait
  var georgiaHeight = 0;
  var gBasins = ['georgia_north', 'georgia_central', 'georgia_south'];
  for (var i = 0; i < gBasins.length; i++) {
    var dmg = m9Result.subBasinDamage[gBasins[i]];
    if (dmg && dmg.tsunamiHeight > georgiaHeight) {
      georgiaHeight = dmg.tsunamiHeight;
    }
  }

  var netPenFailureFraction = cl(georgiaHeight / 12.0, 0.1, 0.8);
  var totalFarms = 100;
  var failedFarms = Math.round(totalFarms * netPenFailureFraction);
  var averageFishPerFarm = 50000;
  var escapedFish = failedFarms * averageFishPerFarm;

  // Shellfish farm damage: intertidal most exposed
  var shellfishDamageFraction = cl(georgiaHeight / 15.0, 0.1, 0.7);

  // Escaped farmed salmon competition pressure on wild stocks
  // Decays over 2-5 years as escaped fish die (not adapted to wild conditions)
  var escapePressureDecayTau = 8; // quarters

  return {
    netPenFailures: failedFarms,
    escapedFarmedSalmon: escapedFish,
    shellfishFarmDamage: shellfishDamageFraction,
    wildSalmonCompetitionPressure: cl(escapedFish / 2000000, 0, 0.15), // max 15% competition effect
    geneticContaminationRisk: cl(escapedFish / 1000000, 0, 0.20),
    escapePressureDecayTau: escapePressureDecayTau,
  };
}

// ═══════════════════════════════════════════════════════════
// PART 11 — CONTAMINATION MOBILIZATION
// ═══════════════════════════════════════════════════════════
// Tsunami resuspends PCBs/PAHs/metals from Superfund sites
// and redistributes them across the Salish Sea.

// Sediment contamination concentrations (ng/g dry weight)
// Source: EPA Superfund RODs, NOAA NS&T program
var SUPERFUND_CONTAMINATION = {
  main_north:      { pcb: 800, pah: 5000, cu: 200, label: 'Duwamish Superfund' },
  main_south:      { pcb: 400, pah: 3000, cu: 150, label: 'Commencement Bay Superfund' },
  georgia_central: { pcb: 50, pah: 200, cu: 30, label: 'Fraser delta (urban runoff)' },
  whidbey_north:   { pcb: 30, pah: 500, cu: 20, label: 'March Point refinery vicinity' },
  georgia_south:   { pcb: 20, pah: 300, cu: 15, label: 'Cherry Point/Bellingham Bay' },
};

// Contamination transport: where resuspended contaminants spread
var CONTAMINATION_TRANSPORT = {
  main_north: ['main_central', 'whidbey_south'], // Duwamish → central basin, Possession Sound
  main_south: ['main_central'],                   // Commencement Bay → central
  georgia_central: ['georgia_south', 'georgia_north'], // Fraser → spreads both ways
};

export function computeContaminationMobilization(m9Result, quartersSinceEvent) {
  quartersSinceEvent = quartersSinceEvent !== undefined ? quartersSinceEvent : 0;

  // Resuspension decays over 6-18 months (particles resettle)
  var resuspensionDecay = cl(Math.exp(-quartersSinceEvent / 4), 0, 1); // τ=4 quarters (~1 year)

  var perBasin = {};
  var sourceKeys = Object.keys(SUPERFUND_CONTAMINATION);
  for (var i = 0; i < sourceKeys.length; i++) {
    var sbk = sourceKeys[i];
    var source = SUPERFUND_CONTAMINATION[sbk];
    var sbDmg = m9Result.subBasinDamage[sbk];
    var tsuHeight = sbDmg ? sbDmg.tsunamiHeight || 0 : 0;
    var liqDmg = sbDmg ? sbDmg.liquefactionDamage || 0 : 0;

    // Resuspension factor: tsunami scour + liquefaction churning
    var resuspension = cl(tsuHeight / 10.0 + liqDmg * 0.5, 0, 0.8);
    var pcbRelease = source.pcb * resuspension * resuspensionDecay;
    var pahRelease = source.pah * resuspension * resuspensionDecay;

    if (!perBasin[sbk]) perBasin[sbk] = { pcbRelease: 0, pahRelease: 0, isSource: true };
    perBasin[sbk].pcbRelease += pcbRelease;
    perBasin[sbk].pahRelease += pahRelease;
    perBasin[sbk].label = source.label;

    // Transport to adjacent basins
    var targets = CONTAMINATION_TRANSPORT[sbk] || [];
    for (var j = 0; j < targets.length; j++) {
      var tgt = targets[j];
      if (!perBasin[tgt]) perBasin[tgt] = { pcbRelease: 0, pahRelease: 0, isSource: false };
      perBasin[tgt].pcbRelease += pcbRelease * 0.3; // 30% transport fraction
      perBasin[tgt].pahRelease += pahRelease * 0.3;
      perBasin[tgt].receivedFrom = perBasin[tgt].receivedFrom || [];
      perBasin[tgt].receivedFrom.push(source.label);
    }
  }

  // Contamination index bump for each affected sub-basin (0-1 scale)
  var contamIndexBump = {};
  var allKeys = Object.keys(perBasin);
  for (var k = 0; k < allKeys.length; k++) {
    var bk = allKeys[k];
    contamIndexBump[bk] = cl(perBasin[bk].pcbRelease / 500, 0, 0.4); // PCB is primary concern
  }

  return {
    perBasin: perBasin,
    contamIndexBump: contamIndexBump,
    resuspensionDecay: resuspensionDecay,
    fishAdvisoryExpansion: resuspensionDecay > 0.3, // advisories expand when contamination elevated
  };
}

// ═══════════════════════════════════════════════════════════
// PART 12 — TRIBAL CULTURAL SITE IMPACTS
// ═══════════════════════════════════════════════════════════

// Nations with waterfront cultural sites in tsunami inundation zones
var TRIBAL_SITE_VULNERABILITY = {
  puyallup:       { subBasin: 'main_south', sites: 12, sitesInundated: 8, culturalImpact: 0.6 },
  muckleshoot:    { subBasin: 'main_north', sites: 8, sitesInundated: 5, culturalImpact: 0.5 },
  lummi:          { subBasin: 'georgia_south', sites: 15, sitesInundated: 6, culturalImpact: 0.4 },
  musqueam:       { subBasin: 'georgia_central', sites: 20, sitesInundated: 18, culturalImpact: 0.9 },
  tsawwassen:     { subBasin: 'georgia_south', sites: 8, sitesInundated: 7, culturalImpact: 0.85 },
  tsleil_waututh: { subBasin: 'georgia_central', sites: 10, sitesInundated: 6, culturalImpact: 0.6 },
  swinomish:      { subBasin: 'whidbey_north', sites: 10, sitesInundated: 4, culturalImpact: 0.35 },
  nisqually:      { subBasin: 'ssound_north', sites: 12, sitesInundated: 5, culturalImpact: 0.4 },
  makah:          { subBasin: 'jdf_west', sites: 15, sitesInundated: 10, culturalImpact: 0.7 },
  sklallam:       { subBasin: 'jdf_central', sites: 8, sitesInundated: 4, culturalImpact: 0.45 },
};

export function computeTribalSiteDamage(m9Result, quartersSinceEvent) {
  quartersSinceEvent = quartersSinceEvent !== undefined ? quartersSinceEvent : 0;

  var culturalRecoveryTau = 60; // 15 years — cultural sites never fully recover
  var recoveryFrac = cl(1 - Math.exp(-quartersSinceEvent / culturalRecoveryTau), 0, 0.80); // max 80% recovery

  var perNation = {};
  var nationKeys = Object.keys(TRIBAL_SITE_VULNERABILITY);
  for (var i = 0; i < nationKeys.length; i++) {
    var nk = nationKeys[i];
    var nation = TRIBAL_SITE_VULNERABILITY[nk];
    var sbDmg = m9Result.subBasinDamage[nation.subBasin];
    var tsuHeight = sbDmg ? sbDmg.tsunamiHeight || 0 : 0;

    // Sites damaged proportional to tsunami height
    var siteDamage = cl(tsuHeight / 10.0 * nation.culturalImpact, 0, 0.95);
    var sitesDestroyed = Math.round(nation.sitesInundated * siteDamage);

    // Shellfish gathering sites contaminated by resuspended pollution
    var shellfishContamination = cl(tsuHeight / 12.0, 0, 0.8);

    perNation[nk] = {
      totalSites: nation.sites,
      sitesInundationZone: nation.sitesInundated,
      sitesDestroyed: sitesDestroyed,
      culturalHealthImpact: siteDamage * (1 - recoveryFrac),
      shellfishContamination: shellfishContamination,
      firstFoodsReduction: cl(siteDamage * 0.5 + shellfishContamination * 0.3, 0, 0.8),
    };
  }

  // Musqueam and Tsawwassen on Fraser Delta — their territory IS the delta
  if (perNation.musqueam) {
    perNation.musqueam.deltaCollapse = true;
    perNation.musqueam.culturalHealthImpact = cl(perNation.musqueam.culturalHealthImpact + 0.2, 0, 0.95);
  }
  if (perNation.tsawwassen) {
    perNation.tsawwassen.deltaCollapse = true;
    perNation.tsawwassen.culturalHealthImpact = cl(perNation.tsawwassen.culturalHealthImpact + 0.2, 0, 0.95);
  }

  return {
    perNation: perNation,
    fishAdvisoryExpansion: true, // tribal consumption advisories expand Salish Sea-wide
  };
}

// ═══════════════════════════════════════════════════════════
// PART 13 — PUBLIC HEALTH CASCADE
// ═══════════════════════════════════════════════════════════

export function computeM9PublicHealthImpact(m9Result, quartersSinceEvent) {
  quartersSinceEvent = quartersSinceEvent !== undefined ? quartersSinceEvent : 0;

  // Sewage: treatment plants in liquefaction zones fail
  var sewageDecay = cl(Math.exp(-quartersSinceEvent / 6), 0, 1); // τ=6 quarters
  var rawSewageDischarge = cl(m9Result.infraDamage.waterDamage * sewageDecay, 0, 0.8);

  // Drinking water: broken mains, seawater intrusion
  var drinkingWaterRisk = cl(m9Result.infraDamage.waterDamage * 0.7 * sewageDecay, 0, 0.6);

  // Health system capacity: overwhelmed by injuries
  var capacityStress = cl(0.9 * Math.exp(-quartersSinceEvent / 4), 0, 1); // extreme initially

  // Contaminated seafood: expanded advisories
  var fishAdvisoryLevel = cl(3 * Math.exp(-quartersSinceEvent / 8), 0, 3); // 3=highest level

  // Waterborne pathogens: sewage + broken infrastructure
  var pathogenRisk = cl(rawSewageDischarge * 0.8, 0, 0.6);

  return {
    rawSewageDischarge: rawSewageDischarge,
    drinkingWaterRisk: drinkingWaterRisk,
    capacityStress: capacityStress,
    fishAdvisoryLevel: fishAdvisoryLevel,
    pathogenRisk: pathogenRisk,
    mentalHealthBurden: cl(0.5 * Math.exp(-quartersSinceEvent / 20), 0, 0.5), // very slow recovery
  };
}

// ── EXPORTS ──
export { PGA_BY_SUB_BASIN, LIQUEFACTION_SUSCEPTIBILITY, TSUNAMI_EXTERNAL,
  FRASER_DELTA_TSUNAMI, TERMINAL_VULNERABILITY, INFRA_DAMAGE,
  ENV_DAMAGE_FACTORS, RECOVERY_TAU, SEGMENT_RECOVERY_RATE,
  STATION_SEISMIC_VULNERABILITY, FISHING_HARBORS, TRIBAL_FLEET_HARBORS,
  HABITAT_RECOVERY_TAU, SUPERFUND_CONTAMINATION, CONTAMINATION_TRANSPORT,
  TRIBAL_SITE_VULNERABILITY };
