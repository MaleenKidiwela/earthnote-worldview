// ═══════════════════════════════════════════════════════════
// MACRO ECONOMY — FRED data → regional economic conditions
// ═══════════════════════════════════════════════════════════
// Translates Federal Reserve macroeconomic indicators into
// simulation drivers: trade volume, development pressure,
// fishing effort, shipping speed, energy transition, budgets.
//
// Transmission channels documented inline with citations.
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl } from './utils.js';

// Static defaults when API key not available — March 2026 values
// Updated quarterly. When FRED live data is connected, these are overridden.
var DEFAULTS = {
  // US (Federal Reserve) — verified 2026-03-23
  fedFundsRate: 3.625,    // Verified 2026-03-23: 3.50-3.75% target per Fed FOMC Mar 2026
  gdpGrowth: 2.3,         // % annualized real GDP growth (2026 full-year forecast ~2.4%, Q4 2025 was 0.7%)
  waUnemployment: 4.8,    // % — WA state unemployment (WA ESD Dec 2025: 4.7%, close enough)
  housingStarts: 1350,    // thousands SAAR (US national)
  mortgageRate: 6.5,      // % — 30yr fixed (Freddie Mac Mar 2026: 6.22%)
  oilPrice: 88,           // Fallback only — live price from FRED (DCOILWTICO) overrides this. WTI ~$88-92/bbl as of Mar 2026 (Iran/Hormuz tensions). Volatile — this is a mid-range fallback.
  cpiChange: 2.4,         // Verified 2026-03-23: 2.4% per BLS CPI Feb 2026
  // Canada (Bank of Canada / StatCan) — verified 2026-03-23
  bocRate: 2.25,          // Verified 2026-03-23: 2.25% per BoC Mar 18 2026 decision
  canadaGDP: 1.2,         // % — Canada real GDP growth (StatCan 2025: 1.7%, BoC forecast 2026: ~1.25%)
  cadUsd: 0.73,           // Verified 2026-03-23: ~0.729 (USD/CAD ~1.37) per exchange-rates.org
  canadaCPI: 1.8,         // Verified 2026-03-23: 1.8% per StatCan CPI Feb 2026
  bcUnemployment: 6.1,    // Verified 2026-03-23: 6.1% per StatCan LFS Feb 2026
  bcCarbonTax: 85,        // Verified 2026-03-23: BC consumer carbon tax eliminated Apr 2025; federal carbon price $85/ton applies per BC Gov
};

export function computeMacroEconomy(fredData, prev) {
  var fd = fredData || {};
  var _v = function(k, fb) { return fd[k] !== undefined && Number.isFinite(fd[k]) ? fd[k] : (DEFAULTS[k] !== undefined ? DEFAULTS[k] : fb); };

  var fedRate = _v('fedFundsRate', 3.625);
  var gdp = _v('gdpGrowth', 2.3);
  var unemp = _v('waUnemployment', 4.8);
  var housing = _v('housingStarts', 1350);
  var mortgage = _v('mortgageRate', 6.5);
  var oil = _v('oilPrice', 70);
  var inflation = _v('cpiChange', 2.4) / 100;

  // ── CANADA (Bank of Canada / StatCan) ──
  var bocRate = _v('bocRate', 2.25);
  var canadaGDP = _v('canadaGDP', 1.2);
  var cadUsd = _v('cadUsd', 0.73);
  var canadaCPI = _v('canadaCPI', 1.8) / 100;
  var bcUnemp = _v('bcUnemployment', 6.1);
  var bcCarbonTax = _v('bcCarbonTax', 85);

  // ── a) MONETARY POLICY → BORROWING COSTS ──
  // Normalized around "neutral" rate ~4%. Higher = tighter credit.
  // Affects infrastructure investment capacity.
  var borrowingCostIndex = cl(1.0 + (fedRate - 4.0) * 0.10, 0.5, 2.0);

  // ── b) GDP GROWTH → TRADE VOLUME ──
  // Trade elasticity ~1.5-2.0: 1% GDP change → 1.5-2% trade change.
  // Hummels 2007 (J. Econ. Perspectives): income elasticity of trade ~1.5.
  var tradeGrowthFactor = cl(1.0 + (gdp - 2.0) * 0.015, 0.7, 1.4);

  // ── c) UNEMPLOYMENT → FISHING PRESSURE ──
  // High unemployment: more subsistence/commercial fishing (desperation).
  // Cinner et al. 2009: poverty traps in fisheries.
  // 0.02 per % above baseline — small but real second-order effect.
  // The 0.02/% coefficient and [-0.05, +0.10] clamp on the macroeconomic
  //   response to fishery-community stress are model-construction choices
  //   within the poverty-traps-in-fisheries framework (Cinner 2009
  //   [framework reference]; Finkbeiner et al. 2017; Daw et al. 2012).
  //   Framework establishes qualitatively that fishery community hardship
  //   propagates into broader livelihood and regional-economic effects;
  //   specific coefficient and clamp bounds selected to bound simulation
  //   response magnitude. Path 4 per Amendment 6 §5.24(b).
  var fishingPressureAdj = cl((unemp - 4.5) * 0.02, -0.05, 0.10);

  // ── d) HOUSING STARTS → DEVELOPMENT PRESSURE ──
  // Construction activity predicts new impervious surface, shoreline armoring.
  // Normalized to ~1.0 at 1400K starts/yr (long-term average).
  var developmentPressure = cl(housing / 1400, 0.5, 1.8);

  // ── e) MORTGAGE RATES → WATERFRONT DEMAND ──
  // Low rates → housing boom → pressure on waterfront properties.
  // High rates → construction slows → less shoreline disturbance.
  var housingPressure = cl(1.0 - (mortgage - 5.0) * 0.08, 0.4, 1.6);

  // ── f) OIL PRICE → SLOW STEAMING ──
  // High oil prices → ships slow down to save fuel.
  // Noise ∝ speed^5 (approximately) — even small speed reduction helps.
  // Leaper 2019 (JASA): 1 knot reduction ≈ 1 dB noise reduction.
  // 0.003 per $/barrel above $70 — at $100, ships are ~9% slower.
  var slowSteamFactor = cl(1.0 - (oil - 70) * 0.003, 0.80, 1.05);

  // ── g) OIL PRICE → ENERGY TRANSITION ──
  // High oil/gas prices → renewables more competitive → faster transition.
  // Low prices → gas cheaper → slows clean energy adoption.
  var energyTransitionPressure = cl(1.0 + (oil - 70) * 0.005, 0.8, 1.5);

  // ── h) OIL PRICE → SPILL RISK ──
  // High prices → more transport, exploration, refinery throughput → higher spill risk.
  var oilSpillRiskAdj = cl((oil - 60) * 0.002, -0.02, 0.05);

  // ── i) INFLATION → REAL CONSERVATION BUDGET ──
  // Fixed-dollar budgets buy less restoration at high inflation.
  // At 2% inflation: multiplier = 1.0. At 5%: multiplier = 0.97.
  var realBudgetMultiplier = cl(1.0 / (1.0 + Math.max(inflation - 0.02, 0)), 0.85, 1.05);

  // ── EXCHANGE RATE COMPETITIVE EFFECT ──
  // THE single biggest factor in NWSA vs Vancouver port competition.
  // Notteboom et al. 2022: port competition and exchange rates.
  // When CAD is weak (e.g., 0.70): Vancouver labor 30% cheaper in USD → favors Vancouver.
  // When CAD is strong (e.g., 0.85): cost advantage reverses → favors NWSA.
  // 0.75 = approximate "neutral" rate where neither has cost advantage.
  var exchangeRateEffect = cl((cadUsd - 0.75) * 0.30, -0.05, 0.05); // ±5% share shift max
  // Positive = strong CAD = favors NWSA; Negative = weak CAD = favors Vancouver

  // Interest rate divergence drives exchange rate movement
  // BoC > Fed → capital to Canada → CAD strengthens → favors NWSA
  var rateDifferential = fedRate - bocRate; // positive = Fed higher = CAD weakens

  // ── Canada-side trade growth (separate from US) ──
  var tradeGrowthFactor_CA = cl(1.0 + (canadaGDP - 1.5) * 0.015, 0.7, 1.4);
  var bcFishingPressureAdj = cl((bcUnemp - 5.0) * 0.015, -0.03, 0.08);

  // ── BC carbon tax cost in real terms ──
  var bcCarbonCostReal = bcCarbonTax * cadUsd / (1 + canadaCPI); // USD, inflation-adjusted

  // ── Recession detection ──
  var prevGDP = prev && prev.gdpGrowth !== undefined ? prev.gdpGrowth : 2.5;
  var recessionFlag = (gdp < 0 && prevGDP < 0) ? 1 : 0;

  return {
    state: {
      tradeGrowthFactor: tradeGrowthFactor,
      developmentPressure: developmentPressure,
      fishingPressureAdj: fishingPressureAdj,
      slowSteamFactor: slowSteamFactor,
      energyTransitionPressure: energyTransitionPressure,
      realBudgetMultiplier: realBudgetMultiplier,
      borrowingCostIndex: borrowingCostIndex,
      housingPressure: housingPressure,
      oilSpillRiskAdj: oilSpillRiskAdj,
      recessionFlag: recessionFlag,
      // Dual-nation exchange rate effects — Notteboom et al. 2022
      exchangeRateEffect: exchangeRateEffect, // positive = favors NWSA, negative = favors Vancouver
      rateDifferential: rateDifferential,
      tradeGrowthFactor_CA: tradeGrowthFactor_CA,
      bcFishingPressureAdj: bcFishingPressureAdj,
      bcCarbonCostReal: bcCarbonCostReal,
      cadUsd: cadUsd,
      // Raw values for display
      fedFundsRate: fedRate,
      gdpGrowth: gdp,
      waUnemployment: unemp,
      housingStarts: housing,
      mortgageRate: mortgage,
      oilPrice: oil,
      inflationRate: inflation,
      bocRate: bocRate,
      canadaGDP: canadaGDP,
      canadaCPI: canadaCPI,
      bcUnemployment: bcUnemp,
    },
    _carry: { gdpGrowth: gdp },
  };
}
