// ═══════════════════════════════════════════════════════════
// CORE ENGINE — Utilities, climate drift, and ocean forcing
// Extracted from salish-cousin-v5.jsx lines 1-213
// ES5 convention inside functions; ES module exports at top level
// ═══════════════════════════════════════════════════════════

export var clamp = function(v,lo,hi) { return Math.max(lo, Math.min(hi, v)); };
export var cl = clamp;
export var lerp = function(a,b,t) { return a + (b-a) * cl(t,0,1); };
export var seas = function(yf,w,s) { w = w||1.4; s = s||0.6; return lerp(s, w, Math.cos(yf*Math.PI*2)*0.5+0.5); };

// ── TEMPORAL RESOLUTION ──
// Monthly timestep: 12 steps/year for bloom dynamics, migration timing, weather
export var MONTHS_PER_YEAR = 12;
export var MONTHLY_DT = 1.0 / 3; // dt relative to quarterly baseline (1/3 of a quarter per month)
export var MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function monthToQuarter(month) { return Math.floor(month / 3); }
export function monthToSeason(month) { return ['winter','winter','spring','spring','spring','summer','summer','summer','fall','fall','fall','winter'][month]; }
export function yearFractionFromMonth(month) { return month / 12; }

// ── FUNCTIONAL RESPONSE TYPES ──
// Different predator-prey interactions require different mathematical forms.
// Using Type II everywhere is a modeling convenience, not ecology.
// Holling 1959, Real 1977, Arditi & Ginzburg 1989.

// Holling Type II — disc equation (specialist foragers, filter feeders)
// At low prey: consumption ≈ (maxRate/halfSat) * prey (linear)
// At high prey: consumption → maxRate (saturates)
// Use for: sea otter→urchin, urchin→kelp, filter feeders, Dungeness→infauna
// Citation: Holling 1959 (Can. Entomol. 91:293-320)
export function hollingII(preyDensity, maxRate, halfSat) {
  var p = preyDensity > 0 ? preyDensity : 0;
  return maxRate * p / (halfSat + p);
}

// Holling Type III — sigmoidal (switching predators, creates prey refugium)
// At low prey: consumption is VERY LOW (predator doesn't bother / switches to other prey)
// At intermediate prey: steep increase (predator learns/focuses)
// At high prey: saturates like Type II
// The squared term creates a prey refugium that prevents extinction at low density
// Use for: orca→salmon, pinnipeds→salmon, humpback→euphausiids, seabirds→forage fish
// Citation: Holling 1959, Real 1977 (Am. Nat. 111:289-300)
export function hollingIII(preyDensity, halfSat, maxRate) {
  var p = preyDensity > 0 ? preyDensity : 0;
  var p2 = p * p;
  var h2 = halfSat * halfSat;
  return maxRate * p2 / (h2 + p2);
}

// Holling Type IV — dome-shaped (group defense / predator interference)
// At low prey: increasing consumption (like Type II)
// At high prey: consumption DECREASES (interference competition, group defense)
// Use for: green crab→eelgrass (interference at high density), jellyfish→zooplankton
// Citation: Andrews 1968, Jeschke et al. 2004 (Biol. Rev. 79:337-349)
export function hollingIV(preyDensity, halfSat, maxRate, inhibition) {
  var p = preyDensity > 0 ? preyDensity : 0;
  inhibition = inhibition || 0.1;
  return maxRate * p / (halfSat + p + inhibition * p * p);
}

// Ratio-dependent — consumption depends on prey:predator ratio
// More realistic for mobile predators in patchy environments
// Use for: lingcod→rockfish (ambush predator in structured habitat)
// Citation: Arditi & Ginzburg 1989 (J. Theor. Biol. 139:311-326)
export function ratioDep(preyDensity, predatorDensity, halfSat, maxRate) {
  var pred = predatorDensity > 0.001 ? predatorDensity : 0.001;
  var ratio = (preyDensity > 0 ? preyDensity : 0) / pred;
  return maxRate * ratio / (halfSat + ratio);
}

// ── SEASONAL PHENOLOGY FUNCTIONS ──
// Seasonal peak modifier (0-1) — Gaussian centered on peakQuarter
// quarter: continuous 0-4 (0=winter start, 1=spring, 2=summer, 3=fall)
// peakQuarter: when process peaks (0-3)
// width: peak breadth (0.5=sharp, 2.0=broad)
export function seasonalPeak(quarter, peakQuarter, width) {
  var diff = Math.abs(quarter - peakQuarter);
  if (diff > 2) diff = 4 - diff; // wrap around annual cycle
  return Math.exp(-0.5 * Math.pow(diff / Math.max(width, 0.1), 2));
}

// Climate-shifted peak: warming advances phenology
// shiftPerDegree: days earlier per °C of warming
export function shiftedPeak(quarter, peakQuarter, width, tempAnomaly, shiftPerDegree) {
  var shiftQuarters = (tempAnomaly !== undefined ? tempAnomaly : 0) * (shiftPerDegree !== undefined ? shiftPerDegree : 0) / 90;
  var effectivePeak = peakQuarter - shiftQuarters;
  // Wrap to 0-4 range
  while (effectivePeak < 0) effectivePeak += 4;
  while (effectivePeak >= 4) effectivePeak -= 4;
  return seasonalPeak(quarter, effectivePeak, width);
}

// ── SSP/RCP CLIMATE PATHWAYS ──
// Piecewise warming curves based on CMIP6 projections for Salish Sea region
// SST anomaly in °C, SLR in cm, relative to 2026 baseline
export var SSP_PATHS = {
  "ssp126": { label: "SSP1-2.6 (low)", sstRate: function(yr) { return 0.012 * Math.max(0, 1 - yr/60); }, slrRate: 0.30, precipTrend: -0.002 },
  "ssp245": { label: "SSP2-4.5 (mid)", sstRate: function(yr) { return 0.018; }, slrRate: 0.38, precipTrend: -0.003 },
  "ssp585": { label: "SSP5-8.5 (high)", sstRate: function(yr) { return 0.018 + yr * 0.0004; }, slrRate: 0.50, precipTrend: -0.004 },
};

export function climateDrift(yr, sspKey) {
  var ssp = SSP_PATHS[sspKey] || SSP_PATHS["ssp245"];
  // Integrate SST: accumulate variable rate over years
  // For negative yr (hindcast, pre-2026): integrate backwards to get negative sstDelta
  // (cooler than 2026 baseline, which is historically correct)
  var sstDelta = 0;
  if (yr >= 0) {
    for (var y = 0; y < yr; y++) { sstDelta += ssp.sstRate(y); }
    if (yr % 1 > 0) sstDelta += ssp.sstRate(Math.floor(yr)) * (yr % 1);
  } else {
    // Negative years: reverse-integrate from 0 back to yr
    // e.g. yr=-16 (year 2010): sstDelta ≈ -16 * 0.018 ≈ -0.29°C cooler than 2026
    for (var yb = -1; yb >= Math.ceil(yr); yb--) { sstDelta -= ssp.sstRate(Math.abs(yb)); }
    if (yr % 1 !== 0) sstDelta -= ssp.sstRate(Math.abs(Math.ceil(yr))) * Math.abs(yr % 1);
  }
  // SLR: negative yr gives negative SLR (less sea level rise than 2026 baseline)
  // Use Math.max(0, ...) for SLR since we don't want negative sea levels in the model
  var slr = Math.max(yr * ssp.slrRate, 0);
  var deltaSubsidence = Math.max(yr * 0.20, 0);
  var effectiveDeltaSLR = slr + deltaSubsidence;
  return { sstDelta: sstDelta, precipDelta: 1 + yr * ssp.precipTrend, slrCm: slr,
    effectiveDeltaSLR: effectiveDeltaSLR,
    floodRiskMult: 1 + slr/50,
    deltaFloodMult: 1 + effectiveDeltaSLR/40,
    saltwaterIntrusion: cl(effectiveDeltaSLR/70, 0, 1),
    csoSlrPenalty: slr * 0.04,
    glacialLiquefaction: cl(Math.max(yr, 0) * 0.005, 0, 0.3),
    sspKey: sspKey || "ssp245" };
}

// ── ENSO / PDO OCEAN FORCING ──
// ENSO: Markov chain state transitions (stochastic, seeded for reproducibility)
export var ENSO_STATES = [
  { name: "Strong La Ni\u00f1a", value: -0.9 },
  { name: "Weak La Ni\u00f1a", value: -0.4 },
  { name: "Neutral", value: 0.0 },
  { name: "Weak El Ni\u00f1o", value: 0.4 },
  { name: "Strong El Ni\u00f1o", value: 0.9 },
];
export var ENSO_TRANSITION = [
  [0.40, 0.30, 0.20, 0.08, 0.02],
  [0.15, 0.35, 0.30, 0.15, 0.05],
  [0.08, 0.20, 0.40, 0.22, 0.10],
  [0.05, 0.12, 0.28, 0.35, 0.20],
  [0.02, 0.06, 0.22, 0.28, 0.42],
];

export function seededRandom(seed) {
  // Mulberry32: full-period 2^32 PRNG with good statistical properties.
  // Replaces sin() hash which had visible patterns in low bits.
  seed = (seed | 0) + 0x6D2B79F5 | 0;
  var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// Mutable shared state — ensoPhase builds this cache lazily
export var _ensoCache = { seq: [2], seed: 0 };

export function ensoPhase(yearsSince2026) {
  var step = Math.max(0, Math.floor(yearsSince2026 * 4));
  while (_ensoCache.seq.length <= step) {
    var prev = _ensoCache.seq[_ensoCache.seq.length - 1];
    var s = _ensoCache.seq.length;
    var r = seededRandom(s + 7919 + _ensoCache.seed);
    var row = ENSO_TRANSITION[prev];
    var cum = 0, next = row.length - 1;
    for (var i = 0; i < row.length; i++) { cum += row[i]; if (r < cum) { next = i; break; } }
    _ensoCache.seq.push(next);
  }
  return ENSO_STATES[_ensoCache.seq[cl(step, 0, _ensoCache.seq.length - 1)]].value;
}

export function resetEnsoCache(seed) { _ensoCache = { seq: [2], seed: seed || 0 }; }
export function setEnsoCache(cache) { _ensoCache = cache; }

export function pdoPhase(yearsSince2026) {
  var t = yearsSince2026;
  return Math.tanh(Math.sin(t * 2 * Math.PI / 25) * 1.8);
}

export function oceanForcing(yearsSince2026) {
  var enso = ensoPhase(yearsSince2026);
  var pdo = pdoPhase(yearsSince2026);
  var step = Math.max(0, Math.floor(yearsSince2026 * 4));
  var idx = _ensoCache.seq[cl(step, 0, _ensoCache.seq.length - 1)];
  return {
    enso: enso, pdo: pdo,
    ensoStateName: ENSO_STATES[idx].name, ensoStateIdx: idx,
    sstAnomaly: enso * 0.6 + pdo * 0.4,
    precipMult: 1 + enso * -0.12 + pdo * -0.05,
    productivityMult: 1 + enso * -0.15 + pdo * -0.10,
    oceanSurvivalMod: enso * -0.05 + pdo * -0.04,
  };
}

// ── MARINE HEAT WAVE (MHW) MODULE ──
// Stochastic event: probability increases with SSP warming. Once triggered, persists 4-12 quarters.
// SST anomaly +2-4°C above climatological mean. Cascading impacts on ecosystem.
export function computeMHW(yearsSince2026, yf, climD, prevMHW, seed) {
  var prev = prevMHW || { active: 0, intensity: 0, peakIntensity: 0, duration: 0, remaining: 0, cooldown: 0, sstAnomaly: 0 };

  // During cooldown after MHW ends, no new event can trigger
  if (prev.cooldown > 0) {
    return { active: 0, intensity: 0, peakIntensity: 0, duration: 0, remaining: 0, cooldown: prev.cooldown - 1, sstAnomaly: 0 };
  }

  // If MHW is active, continue it with bell-curve intensity profile
  if (prev.active > 0 && prev.remaining > 0) {
    var newRemaining = prev.remaining - 1;
    if (newRemaining <= 0) {
      // MHW ends — enter 4-quarter cooldown before next can trigger
      return { active: 0, intensity: 0, peakIntensity: 0, duration: prev.duration, remaining: 0, cooldown: 4, sstAnomaly: 0 };
    }
    // Intensity computed from peakIntensity (fixed at trigger) x envelope shape
    // Bell curve: ramps up first 2 qtrs, holds, then fades in last 30% of duration
    var elapsed = prev.duration - newRemaining;
    var rampUp = cl(elapsed / 2, 0, 1);
    var fadeOut = cl(newRemaining / Math.max(prev.duration * 0.3, 1), 0, 1);
    var newIntensity = cl(prev.peakIntensity * rampUp * fadeOut, 0, 1);
    var sstAnom = newIntensity * lerp(2.0, 4.0, prev.peakIntensity); // +2-4 C based on event severity
    return { active: 1, intensity: newIntensity, peakIntensity: prev.peakIntensity, duration: prev.duration, remaining: newRemaining, cooldown: 0, sstAnomaly: sstAnom };
  }

  // Check for new MHW trigger — P(MHW) = 0.02 + sstDelta x 0.03 per quarter
  var sstDelta = climD ? climD.sstDelta || 0 : 0;
  var pMHW = cl(0.02 + sstDelta * 0.03, 0, 0.25);
  var step = Math.max(0, Math.floor(yearsSince2026 * 4));
  var r = seededRandom(step * 137 + 31337 + (seed || 0));

  if (r < pMHW) {
    // MHW triggered — duration 4-12 quarters, intensity 0.5-1.0
    var durR = seededRandom(step * 251 + 7919 + (seed || 0));
    var dur = Math.floor(4 + durR * 8); // 4-12 quarters (1-3 years)
    var peakInt = cl(0.5 + durR * 0.5, 0.5, 1.0);
    var sstAnom2 = peakInt * lerp(2.0, 4.0, peakInt) * 0.3; // ramp-up: partial on first quarter
    return { active: 1, intensity: peakInt * 0.3, peakIntensity: peakInt, duration: dur, remaining: dur, cooldown: 0, sstAnomaly: sstAnom2 };
  }

  return { active: 0, intensity: 0, peakIntensity: 0, duration: 0, remaining: 0, cooldown: 0, sstAnomaly: 0 };
}
