// ── SALMON STOCK STRUCTURE ──
// 5 Pacific salmon species with distinct life-history parameters.
// Sources:
//   fecundity (eggs/female): Healey 1991 (Life History of Chinook), Quinn 2005 (The Behavior and Ecology of Pacific Salmon)
//   carryingCap (index): WDFW/NWIFC stock assessments, relative abundance indices
//   runPeak (yf): WDFW run timing data (0=Jan, 0.5=Jul, 1=Dec)
//   oceanSurvBase: Peterman & Dorner 2012, Bradford 1995 (smolt-to-adult survival)
//   riverSurvBase: Quinn 2005, upstream passage survival by species
//   ages, oceanYrs: Quinn 2005 standard life history
//   weight (index fraction): relative contribution to aggregate salmon run index
//   geneticDiv: NOAA ESU/DPS recovery plan genetic diversity assessments
//   strays (fraction): Quinn 2005 straying rates by species
export var SALMON_STOCKS = {
  chinook: { name: "Chinook", fecundity: 350, carryingCap: 1200, runPeak: 0.55, oceanSurvBase: 0.72, riverSurvBase: 0.65, ages: 4, oceanYrs: 3, weight: 0.35, geneticDiv: 0.85, strays: 0.05 },
  coho:    { name: "Coho",    fecundity: 400, carryingCap: 1500, runPeak: 0.65, oceanSurvBase: 0.77, riverSurvBase: 0.70, ages: 3, oceanYrs: 2, weight: 0.25, geneticDiv: 0.80, strays: 0.08 },
  sockeye: { name: "Sockeye", fecundity: 500, carryingCap: 2000, runPeak: 0.50, oceanSurvBase: 0.74, riverSurvBase: 0.68, ages: 4, oceanYrs: 2, weight: 0.20, geneticDiv: 0.90, strays: 0.03 },
  pink:    { name: "Pink",    fecundity: 600, carryingCap: 3000, runPeak: 0.60, oceanSurvBase: 0.80, riverSurvBase: 0.75, ages: 2, oceanYrs: 1, weight: 0.10, geneticDiv: 0.75, strays: 0.12 },
  chum:    { name: "Chum",    fecundity: 450, carryingCap: 1800, runPeak: 0.70, oceanSurvBase: 0.76, riverSurvBase: 0.72, ages: 4, oceanYrs: 2, weight: 0.10, geneticDiv: 0.82, strays: 0.06 },
};

export function initSalmonState() {
  var stocks = {};
  // Initial cohort sizes scaled per species to reflect real-world 2024 status.
  // totalReturn is an index: (age3 * seasonMod / carryingCap) * 100.
  // Fractions from WDFW 2024 salmon stock assessments + NWIFC preseason forecasts:
  //   Chinook 0.40: ESA-listed, severely depleted (COSEWIC Endangered)
  //   Coho 0.50: moderate, some interior stocks at risk
  //   Sockeye 0.55: Fraser runs cyclical but declining trend (DFO)
  //   Pink 0.80: most abundant, fast lifecycle, odd-year dominant
  //   Chum 0.50: stable but not recovering (25% hatchery origin)
  var initFrac = { chinook: 0.40, coho: 0.50, sockeye: 0.55, pink: 0.80, chum: 0.50 };
  var totalAge0 = 0, totalAge1 = 0, totalAge2 = 0, totalAge3 = 0;
  Object.keys(SALMON_STOCKS).forEach(function(sk) {
    var cfg = SALMON_STOCKS[sk];
    var frac = initFrac[sk] || 0.50;
    var a3 = Math.round(cfg.carryingCap * frac);
    // Cohort age structure scaling: younger cohorts larger to reflect natural mortality pyramid
    // 1.3 = inter-age survival ratio (1 / oceanSurvBase ≈ 1.3-1.4) — Bradford 1995
    // 1.5 = fry-to-smolt ratio (higher mortality in earliest stage) — Quinn 2005
    var a2 = Math.round(a3 * 1.3);
    var a1 = Math.round(a2 * 1.3);
    var a0 = Math.round(a1 * 1.5);
    stocks[sk] = { age0: a0, age1: a1, age2: a2, age3: a3, totalReturn: Math.round(frac * 100), geneticDiv: cfg.geneticDiv || 0.85 };
    totalAge0 += a0; totalAge1 += a1; totalAge2 += a2; totalAge3 += a3;
  });
  return { stocks: stocks, age0: totalAge0, age1: totalAge1, age2: totalAge2, age3: totalAge3, totalReturn: 48 };
}

// ── ORCA J/K/L POD STRUCTURE ──
// Source: Center for Whale Research 2025 annual photo-ID census
// pop: individuals per CWR July 2025 count (J=27, K=14, L=33, census total=74)
// range: primary foraging area — Ford & Ellis 2006, Hanson et al. 2010
// preyPref: Chinook prey selectivity index — Ford & Ellis 2006 (J Pod most inland/Chinook-dependent)
// noiseSens: vessel noise sensitivity — Holt et al. 2009 (J Pod most exposed to Haro Strait traffic)
// contaminantLoad: PCB body burden (normalized) — Ross et al. 2000, Krahn et al. 2007
//   K Pod highest (0.70) — offshore diet = more bioaccumulation; J Pod lowest (0.55) — younger whales
// birthRate: calves/female/yr — Olesiuk et al. 1990, Ward et al. 2009 (SRKW demographic models)
// baseMort: annual mortality — Olesiuk et al. 2005, Lacy et al. 2017 (0.022-0.025/yr range)
export var ORCA_PODS = {
  J: { name: "J Pod", pop: 27, range: "inland", preyPref: 0.6, noiseSens: 0.8, contaminantLoad: 0.55, birthRate: 0.045, baseMort: 0.022 }, // Verified 2026-03-23: 27 per CWR Jul 2025 census
  K: { name: "K Pod", pop: 14, range: "coastal", preyPref: 0.5, noiseSens: 0.7, contaminantLoad: 0.70, birthRate: 0.040, baseMort: 0.025 }, // Verified 2026-03-23: 14 per CWR Jul 2025 census
  L: { name: "L Pod", pop: 33, range: "offshore", preyPref: 0.7, noiseSens: 0.6, contaminantLoad: 0.60, birthRate: 0.040, baseMort: 0.025 }, // Verified 2026-03-23: 33 per CWR Jul 2025 census
};

export function initOrcaState() {
  var pods = {};
  Object.keys(ORCA_PODS).forEach(function(pk) {
    var cfg = ORCA_PODS[pk];
    // bodyCondition 0.6: baseline body condition index — Fearnbach et al. 2018 (photogrammetry)
    // extinctionRisk: K=0.15 (smallest pod, highest demographic stochasticity — Lacy et al. 2017)
    // J/L=0.02 (larger pods, lower stochastic risk — NOAA SRKW Recovery Plan 2008)
    pods[pk] = { population: cfg.pop, births: 0, deaths: 0, bodyCondition: 0.6, extinctionRisk: pk === "K" ? 0.15 : 0.02 };
  });
  return { population:74, births:0, deaths:0, bodyCondition:0.6, pods: pods }; // Verified 2026-03-23: 74 total per CWR Jul 2025 census (27+14+33)
}

// 9000000 = Salish Sea watershed population — US Census 2024 + Statistics Canada 2021:
// Puget Sound metro 4.5M + Metro Vancouver 2.8M + Victoria 420K + broader 1.3M
// 0.010 = 1.0% annual growth rate — weighted avg of WA OFM 2024 (~1.2%) + BC Stats (~0.8%)
export function initPopState(basePop) { return { population: basePop || 9000000, growthRate: 0.010, infraDecay: 0 }; }
