// ═══════════════════════════════════════════════════════════
// PORT OPERATIONS — Labor, rail, emissions, business segments
// ═══════════════════════════════════════════════════════════
// Operational dynamics for the terminal-level port system.
// Covers ILWU labor regimes, intermodal rail capacity,
// emission regulations, and 7 distinct business segments.
//
// Sources:
//   ILWU: PMA contract history, 2023 ILWU-Canada strike data
//   Rail: BNSF/CN/CP network maps, WSDOT Rail Plan 2019
//   Emissions: WA CCA, BC Carbon Tax, IMO 2020/GHG Strategy
//   Employment: Martin Associates 2023, VFPA 2024, DOD, WSF
//   ECHO Program: Vancouver Fraser Port Authority
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl, seededRandom } from './utils.js';

// ── LABOR REGIME STATE ──
export function initLaborState() {
  return {
    ilwuUS: { contractExpiry: 2029, tensionLevel: 0.15, disruption: 0, severity: 0,
      autoDispute: 0.3 }, // ILWU opposes terminal automation (T-5 issue)
    ilwuCanada: { contractExpiry: 2029, tensionLevel: 0.10, disruption: 0, severity: 0,
      autoDispute: 0.1 },
    cnRail: { disruption: 0, severity: 0, tensionLevel: 0.10 },
    cpRail: { disruption: 0, severity: 0, tensionLevel: 0.08 },
  };
}

// ── RAIL CORRIDOR CAPACITIES ──
// Trains/day through mountain passes — WSDOT Rail Plan 2019, CN/CP network data
var RAIL_CORRIDORS = {
  bnsf: { capacity: 28, serves: 'NWSA', bottleneck: 'Stampede Pass tunnel',
    winterRisk: 0.05, fireRisk: 0.03, slideRisk: 0.02 },
  up: { capacity: 15, serves: 'NWSA', bottleneck: 'Columbia River shared',
    winterRisk: 0.02, fireRisk: 0.02, slideRisk: 0.01 },
  cn: { capacity: 30, serves: 'Vancouver', bottleneck: 'Fraser Canyon (single track)',
    winterRisk: 0.08, fireRisk: 0.05, slideRisk: 0.06 }, // Fraser Canyon very vulnerable
  cp: { capacity: 23, serves: 'Vancouver', bottleneck: 'Rogers Pass avalanche',
    winterRisk: 0.10, fireRisk: 0.03, slideRisk: 0.04 },
};

// ── EMISSION COST BY REGIME ──
// $/TEU equivalent carbon compliance cost — WA CCA, BC Carbon Tax, IMO
var EMISSION_COSTS = {
  nwsa: 8,        // WA CCA ~$50-60/ton × ~0.14 ton CO2/TEU — WA CETA
  vancouver: 12,  // BC Carbon Tax $80 CAD/ton (~$60 USD) × 0.14 + federal OBPS
  princeRupert: 12, // same BC regime
};

// ── ECHO PROGRAM (voluntary vessel slowdown in Haro Strait for orca) ──
var ECHO_COMPLIANCE = 0.85; // ~85% of large commercial vessels comply — VFPA ECHO 2024
var ECHO_SPEED_REDUCTION = 3; // knots reduction — from ~14 to ~11 knots
var ECHO_NOISE_REDUCTION = 3; // dB broadband reduction — Veirs et al. 2016 (speed-noise: ~1 dB/knot)

// ── BUSINESS SEGMENT BASELINES ──
// Employment and revenue by segment — Martin Associates 2023, VFPA 2024, DOD, WSF, DFO
var SEGMENTS = {
  container:  { employment: 167000, revenue: 28000, seasonality: 0.95 }, // $M, slight winter dip
  cruise:     { employment: 9000, revenue: 3200, seasonality: 0.0 },    // strongly seasonal (May-Oct)
  bulk:       { employment: 3500, revenue: 4500, seasonality: 0.90 },   // grain harvest peak Q3
  petroleum:  { employment: 3500, revenue: 9000, seasonality: 1.0 },    // year-round
  fishing:    { employment: 10000, revenue: 1200, seasonality: 0.0 },   // seasonal (species-dependent)
  ferry:      { employment: 7500, revenue: 800, seasonality: 0.80 },    // summer peak
  military:   { employment: 18000, revenue: 2400, seasonality: 1.0 },   // budget-driven, steady
};

// ── Compute port operational state ──
export function computePortOperations(prev, params, shocks, quarter, year, macroState) {
  var _prev = prev || initLaborState();
  var macro = macroState || {};
  var tradeGrowth = macro.tradeGrowthFactor || 1.0;
  var oilPrice = macro.oilPrice || 70;
  var slowSteam = macro.slowSteamFactor || 1.0;

  // ── LABOR DYNAMICS ──
  var laborState = {};
  var regimes = ['ilwuUS', 'ilwuCanada', 'cnRail', 'cpRail'];
  for (var li = 0; li < regimes.length; li++) {
    var regime = regimes[li];
    var prevL = _prev[regime] || { contractExpiry: 2029, tensionLevel: 0.1, disruption: 0, severity: 0 };
    var yearsToExpiry = (prevL.contractExpiry || 2029) - year;

    // Tension rises as contract expiration approaches
    // 0.05/yr increase in last 2 years before expiry — PMA negotiation history
    var tension = prevL.tensionLevel || 0.1;
    if (yearsToExpiry <= 2 && yearsToExpiry > 0) {
      tension = cl(tension + 0.05 * (1 / 3), 0, 0.8); // quarterly increment
    }

    // Disruption probability: scales with tension
    // 0.02 per quarter at max tension (8%/yr) — roughly matches historical frequency
    var disruptProb = tension * 0.02;
    var seed = seededRandom(year * 1000 + quarter * 250 + li * 7777);
    var newDisruption = seed < disruptProb ? 1 : 0;

    // Disruption severity and duration
    var severity = prevL.severity || 0;
    var disruption = prevL.disruption || 0;
    if (newDisruption && !disruption) {
      disruption = 1;
      // Severity: slowdown (0.3-0.5) or full stop (0.8-1.0) — weighted toward slowdowns
      severity = seed < disruptProb * 0.3 ? cl(0.8 + seed * 0.2, 0.8, 1.0) : cl(0.3 + seed * 0.3, 0.3, 0.6);
    } else if (disruption) {
      // Resolution: 20% chance per quarter of resolving
      var resolveSeed = seededRandom(year * 1000 + quarter * 250 + li * 7777 + 33333);
      if (resolveSeed < 0.20) { disruption = 0; severity = 0; tension = cl(tension - 0.3, 0, 0.8); }
    }

    laborState[regime] = {
      contractExpiry: prevL.contractExpiry, tensionLevel: tension,
      disruption: disruption, severity: severity,
      autoDispute: prevL.autoDispute || 0,
    };
  }

  // ── RAIL CAPACITY ──
  var isWinter = quarter === 0 || quarter === 3;
  var railCapacity = {};
  var corridorKeys = Object.keys(RAIL_CORRIDORS);
  for (var ri = 0; ri < corridorKeys.length; ri++) {
    var ck = corridorKeys[ri];
    var corr = RAIL_CORRIDORS[ck];
    var seasonalRisk = isWinter ? corr.winterRisk : corr.fireRisk;
    var disrupted = seededRandom(year * 1000 + quarter * 250 + ri * 5555) < (seasonalRisk + corr.slideRisk);
    // Rail disruption from labor (CN/CP)
    var laborDisruption = (ck === 'cn' && laborState.cnRail.disruption) ? laborState.cnRail.severity :
      (ck === 'cp' && laborState.cpRail.disruption) ? laborState.cpRail.severity : 0;
    var effectiveCapacity = cl(1 - (disrupted ? 0.4 : 0) - laborDisruption * 0.6, 0.1, 1.0);
    railCapacity[ck] = { capacity: corr.capacity, effectiveFraction: effectiveCapacity, disrupted: disrupted || laborDisruption > 0 };
  }

  // Port-level rail factor
  var nwsaRailFactor = cl((railCapacity.bnsf.effectiveFraction * 0.7 + railCapacity.up.effectiveFraction * 0.3), 0.1, 1.0);
  var vanRailFactor = cl((railCapacity.cn.effectiveFraction * 0.55 + railCapacity.cp.effectiveFraction * 0.45), 0.1, 1.0);

  // ── COMPETITIVE ROUTING ──
  // Shares shift based on labor + rail + costs
  var nwsaLaborPenalty = laborState.ilwuUS.disruption ? laborState.ilwuUS.severity * 0.5 : 0;
  var vanLaborPenalty = laborState.ilwuCanada.disruption ? laborState.ilwuCanada.severity * 0.5 : 0;

  var nwsaShare = cl(0.30 * (1 - nwsaLaborPenalty) * nwsaRailFactor * tradeGrowth, 0.05, 0.55);
  var vanShare = cl(0.35 * (1 - vanLaborPenalty) * vanRailFactor * tradeGrowth, 0.05, 0.55);
  var prShare = cl(0.15 + nwsaLaborPenalty * 0.1 + vanLaborPenalty * 0.1, 0.10, 0.30);
  var totalShare = nwsaShare + vanShare + prShare;
  // Normalize + diversion to LA/LB
  var laShare = cl(1 - totalShare, 0.05, 0.40);

  // ── BUSINESS SEGMENTS ──
  var segments = {};
  var totalEmployment = 0, totalRevenue = 0;
  var cruiseSeason = quarter === 1 || quarter === 2 ? 1.0 : 0.15; // May-Oct
  var fishingSeason = quarter === 2 || quarter === 3 ? 1.0 : 0.3; // summer-fall
  var seasonMods = {
    container: SEGMENTS.container.seasonality,
    cruise: cruiseSeason,
    bulk: SEGMENTS.bulk.seasonality,
    petroleum: SEGMENTS.petroleum.seasonality,
    fishing: fishingSeason,
    ferry: quarter === 2 ? 1.2 : 0.85,
    military: SEGMENTS.military.seasonality,
  };

  var segKeys = Object.keys(SEGMENTS);
  for (var si = 0; si < segKeys.length; si++) {
    var sk = segKeys[si];
    var base = SEGMENTS[sk];
    var seasonMod = seasonMods[sk] || 1.0;

    var emp = base.employment * seasonMod;
    var rev = base.revenue * seasonMod / 4; // quarterly

    // Segment-specific drivers
    if (sk === 'container') {
      emp *= nwsaShare / 0.30 * 0.5 + vanShare / 0.35 * 0.5; // weighted by port shares
      rev *= tradeGrowth;
    } else if (sk === 'petroleum') {
      rev *= cl(oilPrice / 70, 0.5, 2.0); // revenue scales with oil price
    } else if (sk === 'fishing') {
      var fishPressure = params && params.ecosystem ? (params.ecosystem.fishingPressure || 40) / 100 : 0.4;
      emp *= cl(fishPressure * 2, 0.3, 1.5);
      rev *= cl(fishPressure * 1.5, 0.2, 1.5);
    } else if (sk === 'ferry') {
      var ferryInv = params && params.infrastructure ? (params.infrastructure.ferryInvestment || 30) / 100 : 0.3;
      emp *= cl(0.8 + ferryInv * 0.4, 0.6, 1.2);
    }

    segments[sk] = { employment: Math.round(emp), revenue: Math.round(rev), seasonal: seasonMod };
    totalEmployment += emp;
    totalRevenue += rev;
  }

  // ── HARO STRAIT VESSEL TRANSITS ──
  // All Vancouver-bound containers + TMX tankers pass through SRKW habitat
  var vanContainerTransits = Math.round(2200 * vanShare / 0.35);
  var tmxTankers = Math.round(408 * cl(oilPrice / 70, 0.5, 1.5)); // tanker count scales with oil demand
  var haroBulk = Math.round(800 * vanShare / 0.35);
  var haroCruise = Math.round(350 * cruiseSeason);
  var haroTotal = vanContainerTransits + tmxTankers + haroBulk + haroCruise;

  // ECHO slowdown effect on noise
  var echoNoiseReduction = ECHO_COMPLIANCE * ECHO_NOISE_REDUCTION; // ~2.5 dB effective reduction

  return {
    state: {
      laborState: laborState,
      railCapacity: railCapacity,
      nwsaRailFactor: nwsaRailFactor,
      vanRailFactor: vanRailFactor,
      routeShares: { nwsa: nwsaShare, vancouver: vanShare, princeRupert: prShare, laLongBeach: laShare },
      segments: segments,
      totalEmployment: Math.round(totalEmployment),
      totalRevenue: Math.round(totalRevenue),
      haroStraitTransits: haroTotal,
      tmxTankerCount: tmxTankers,
      echoNoiseReduction: echoNoiseReduction,
      echoCompliance: ECHO_COMPLIANCE,
      emissionCosts: EMISSION_COSTS,
    },
    _carry: laborState,
  };
}
