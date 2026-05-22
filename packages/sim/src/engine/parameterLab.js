// ═══════════════════════════════════════════════════════════
// PARAMETER LAB — Controlled experiment engine
// ═══════════════════════════════════════════════════════════
// Runs paired simulations (baseline vs treatment) with identical
// seeds so any difference is purely from the parameter change.
// Three modes: single perturbation, parameter sweep, coupling trace.
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl, resetEnsoCache } from './utils.js';
import { runOrchestrator } from './orchestrator.js';

// ── Extract key outputs from simulation result ──
var OUTPUT_DEFS = [
  { key: 'avgDO', label: 'Dissolved Oxygen', module: 'marine', extract: function(r) { return r.marine.state.dissolvedOxygen; } },
  { key: 'avgSST', label: 'Sea Surface Temp', module: 'marine', extract: function(r) { return r.marine.state.sst; } },
  { key: 'avgpH', label: 'pH', module: 'marine', extract: function(r) { return r.marine.state.pH; } },
  { key: 'hoodCanalDO', label: 'Hood Canal DO', module: 'marine', extract: function(r) { return r.marine.state.pugetSoundDO; } },
  { key: 'biodiversity', label: 'Biodiversity', module: 'ecosystem', extract: function(r) { return r.ecosystem.state.biodiversityIndex; } },
  { key: 'salmonRun', label: 'Salmon Run Index', module: 'ecosystem', extract: function(r) { return r.ecosystem.state.salmonRunStrength; } },
  { key: 'orcaPop', label: 'Orca Population', module: 'ecosystem', extract: function(r) { return r.ecosystem.state.orcaPopulation; } },
  { key: 'herring', label: 'Herring', module: 'ecosystem', extract: function(r) { return r.ecosystem.state.herringPop; } },
  { key: 'kelp', label: 'Kelp Health', module: 'ecosystem', extract: function(r) { return r.ecosystem.state.kelpHealth; } },
  { key: 'eelgrass', label: 'Eelgrass', module: 'ecosystem', extract: function(r) { return r.ecosystem.state.eelgrassHealth; } },
  { key: 'forageFish', label: 'Forage Fish', module: 'ecosystem', extract: function(r) { return r.ecosystem.state.forageFishIndex; } },
  { key: 'euphausiids', label: 'Euphausiids', module: 'ecosystem', extract: function(r) { return r.ecosystem.state.euphausiidBiomass; } },
  { key: 'employment', label: 'Employment', module: 'port', extract: function(r) { return r.port.state.employment; } },
  { key: 'portRevenue', label: 'Port Revenue', module: 'port', extract: function(r) { return r.port.state.revenue; } },
  { key: 'equity', label: 'Equity Index', module: 'urban', extract: function(r) { return r.urban.state.equityIndex; } },
  { key: 'gridReliability', label: 'Grid Reliability', module: 'energy', extract: function(r) { return r.energy ? r.energy.state.gridReliability : 0.95; } },
  { key: 'infraResilience', label: 'Infrastructure', module: 'infrastructure', extract: function(r) { return r.infrastructure ? r.infrastructure.state.resilienceIndex : 0.85; } },
  { key: 'culturalHealth', label: 'Cultural Health', module: 'tribal', extract: function(r) { return r.tribal ? r.tribal.state.avgCulturalHealth : 0.5; } },
  { key: 'fraserChinook', label: 'Fraser Chinook', module: 'fraser', extract: function(r) { return r.fraser ? r.fraser.state.chinookReturn : 1.5; } },
  { key: 'effectiveHarvest', label: 'Harvest Rate', module: 'fisheries', extract: function(r) { return r.fisheries ? r.fisheries.state.effectiveFishingPressure : 40; } },
];

export var OUTPUT_KEYS = OUTPUT_DEFS.map(function(d) { return d.key; });
export var OUTPUT_LABELS = {};
OUTPUT_DEFS.forEach(function(d) { OUTPUT_LABELS[d.key] = d.label; });

function extractOutputs(result) {
  var out = {};
  for (var i = 0; i < OUTPUT_DEFS.length; i++) {
    var d = OUTPUT_DEFS[i];
    try { out[d.key] = d.extract(result); } catch(e) { out[d.key] = null; }
    if (out[d.key] === undefined || !Number.isFinite(out[d.key])) out[d.key] = null;
  }
  return out;
}

// ── Run simulation for N quarters, recording monthly-equivalent outputs ──
function runSim(params, nQuarters, seed) {
  resetEnsoCache(seed);
  var state = null;
  // Warmup: 4 quarters
  for (var w = 0; w < 4; w++) {
    var wr = runOrchestrator(params, {}, w / 4, state, 1, 0);
    state = wr._state;
  }
  // Run and record
  var timeline = [];
  var result;
  for (var q = 0; q < nQuarters; q++) {
    var yf = (q % 4) / 4;
    var yr = Math.floor(q / 4);
    result = runOrchestrator(params, {}, yf, state, 1, yr);
    state = result._state;
    timeline.push(extractOutputs(result));
  }
  return { timeline: timeline, finalResult: result };
}

// Find module for a parameter key
function findModule(paramKey, params) {
  var mods = Object.keys(params);
  for (var i = 0; i < mods.length; i++) {
    if (params[mods[i]] && params[mods[i]][paramKey] !== undefined) return mods[i];
  }
  return null;
}

// ══════════════════════════════════════════════
// SINGLE PERTURBATION
// ══════════════════════════════════════════════
export function runPerturbation(baseParams, paramKey, newValue, nMonths, outputKeys, seed) {
  seed = seed || 42;
  var nQuarters = Math.ceil((nMonths || 120) / 3);
  outputKeys = outputKeys || OUTPUT_KEYS.slice(0, 8);

  // Find and set parameter
  var mod = findModule(paramKey, baseParams);
  var baseValue = mod ? baseParams[mod][paramKey] : undefined;

  // Baseline run
  var baseRun = runSim(JSON.parse(JSON.stringify(baseParams)), nQuarters, seed);

  // Treatment run
  var treatParams = JSON.parse(JSON.stringify(baseParams));
  if (mod) treatParams[mod][paramKey] = newValue;
  var treatRun = runSim(treatParams, nQuarters, seed);

  // Build results
  var baseline = {}, treatment = {}, delta = {}, summary = {};
  for (var ki = 0; ki < outputKeys.length; ki++) {
    var k = outputKeys[ki];
    var bVals = baseRun.timeline.map(function(t) { return t[k]; });
    var tVals = treatRun.timeline.map(function(t) { return t[k]; });
    baseline[k] = bVals;
    treatment[k] = tVals;
    delta[k] = bVals.map(function(b, i) { return tVals[i] !== null && b !== null ? tVals[i] - b : 0; });

    var bFinal = bVals[bVals.length - 1] || 0;
    var tFinal = tVals[tVals.length - 1] || 0;
    var absChange = tFinal - bFinal;
    var pctChange = bFinal !== 0 ? (absChange / Math.abs(bFinal)) * 100 : 0;

    // Time to effect: first quarter where deviation > 5%
    var timeToEffect = nQuarters;
    var maxDev = 0, maxDevQ = 0;
    for (var qi = 0; qi < bVals.length; qi++) {
      if (bVals[qi] !== null && bVals[qi] !== 0) {
        var dev = Math.abs((tVals[qi] - bVals[qi]) / bVals[qi]);
        if (dev > 0.05 && qi < timeToEffect) timeToEffect = qi;
        if (dev > maxDev) { maxDev = dev; maxDevQ = qi; }
      }
    }

    summary[k] = {
      baselineFinal: bFinal,
      treatmentFinal: tFinal,
      absoluteChange: absChange,
      percentChange: Math.round(pctChange * 100) / 100,
      direction: absChange > 0.001 ? 'increase' : absChange < -0.001 ? 'decrease' : 'unchanged',
      timeToEffect: timeToEffect,
      maxDeviation: Math.round(maxDev * 10000) / 100,
      maxDeviationMonth: maxDevQ * 3,
    };
  }

  return {
    baseline: baseline, treatment: treatment, delta: delta, summary: summary,
    paramKey: paramKey, module: mod, baseValue: baseValue, newValue: newValue,
    nMonths: nQuarters * 3, seed: seed,
  };
}

// ══════════════════════════════════════════════
// PARAMETER SWEEP
// ══════════════════════════════════════════════
export function runSweep(baseParams, paramKey, sweepValues, nMonths, outputKeys, seed) {
  seed = seed || 42;
  var nQuarters = Math.ceil((nMonths || 120) / 3);
  outputKeys = outputKeys || OUTPUT_KEYS.slice(0, 6);
  var mod = findModule(paramKey, baseParams);
  var baseValue = mod ? baseParams[mod][paramKey] : undefined;

  // Baseline
  var baseRun = runSim(JSON.parse(JSON.stringify(baseParams)), nQuarters, seed);
  var baselineOutputs = {};
  for (var ki = 0; ki < outputKeys.length; ki++) {
    var k = outputKeys[ki];
    var bt = baseRun.timeline;
    baselineOutputs[k] = bt.length > 0 ? bt[bt.length - 1][k] : null;
  }

  // Sweep
  var sweepResults = [];
  for (var si = 0; si < sweepValues.length; si++) {
    var sv = sweepValues[si];
    var sp = JSON.parse(JSON.stringify(baseParams));
    if (mod) sp[mod][paramKey] = sv;
    var sr = runSim(sp, nQuarters, seed);
    var outputs = {};
    for (var ki2 = 0; ki2 < outputKeys.length; ki2++) {
      var k2 = outputKeys[ki2];
      var st = sr.timeline;
      outputs[k2] = st.length > 0 ? st[st.length - 1][k2] : null;
    }
    sweepResults.push({ paramValue: sv, outputs: outputs });
  }

  // Dose-response analysis
  var doseResponse = {};
  for (var ki3 = 0; ki3 < outputKeys.length; ki3++) {
    var k3 = outputKeys[ki3];
    var pVals = sweepResults.map(function(s) { return s.paramValue; });
    var oVals = sweepResults.map(function(s) { return s.outputs[k3]; });
    var baseOut = baselineOutputs[k3] || 0;

    // Threshold: where output changes >10% from baseline
    var threshold = null;
    for (var ti = 0; ti < oVals.length; ti++) {
      if (baseOut !== 0 && Math.abs((oVals[ti] - baseOut) / baseOut) > 0.10) {
        threshold = pVals[ti]; break;
      }
    }

    // Monotonicity
    var increasing = true, decreasing = true;
    for (var mi = 1; mi < oVals.length; mi++) {
      if (oVals[mi] !== null && oVals[mi - 1] !== null) {
        if (oVals[mi] < oVals[mi - 1]) increasing = false;
        if (oVals[mi] > oVals[mi - 1]) decreasing = false;
      }
    }

    // Elasticity at baseline
    var elasticity = 0;
    if (baseValue !== undefined && baseValue !== 0 && baseOut !== 0) {
      // Find closest sweep value to baseline
      var closest = 0;
      for (var ci = 1; ci < pVals.length; ci++) {
        if (Math.abs(pVals[ci] - baseValue) < Math.abs(pVals[closest] - baseValue)) closest = ci;
      }
      if (closest < pVals.length - 1) {
        var dp = pVals[closest + 1] - pVals[closest];
        var dout = (oVals[closest + 1] || 0) - (oVals[closest] || 0);
        if (dp !== 0) elasticity = (dout / baseOut) / (dp / baseValue);
      }
    }

    doseResponse[k3] = {
      paramValues: pVals, outputValues: oVals,
      threshold: threshold,
      isMonotonic: increasing || decreasing,
      elasticity: Math.round(elasticity * 1000) / 1000,
    };
  }

  return {
    baseline: baselineOutputs, sweepResults: sweepResults, doseResponse: doseResponse,
    paramKey: paramKey, module: mod, baseValue: baseValue,
    paramRange: [sweepValues[0], sweepValues[sweepValues.length - 1]],
    nSteps: sweepValues.length, nMonths: nQuarters * 3, seed: seed,
  };
}

// ══════════════════════════════════════════════
// COUPLING CHAIN TRACE
// ══════════════════════════════════════════════
export function runCouplingTrace(baseParams, paramKey, newValue, nMonths, seed) {
  seed = seed || 42;
  var nQuarters = Math.ceil((nMonths || 120) / 3);
  var mod = findModule(paramKey, baseParams);
  var baseValue = mod ? baseParams[mod][paramKey] : undefined;

  // Run both
  var baseRun = runSim(JSON.parse(JSON.stringify(baseParams)), nQuarters, seed);
  var treatParams = JSON.parse(JSON.stringify(baseParams));
  if (mod) treatParams[mod][paramKey] = newValue;
  var treatRun = runSim(treatParams, nQuarters, seed);

  // Analyze all outputs
  var affected = [];
  var unaffected = [];

  for (var di = 0; di < OUTPUT_DEFS.length; di++) {
    var d = OUTPUT_DEFS[di];
    var bVals = baseRun.timeline.map(function(t) { return t[d.key]; });
    var tVals = treatRun.timeline.map(function(t) { return t[d.key]; });

    var firstDiv = -1, peakDev = 0, peakDevQ = 0, finalDev = 0;
    var deviations = [];
    for (var qi = 0; qi < bVals.length; qi++) {
      var dev = 0;
      if (bVals[qi] !== null && bVals[qi] !== 0) {
        dev = (tVals[qi] - bVals[qi]) / Math.abs(bVals[qi]);
      }
      deviations.push(dev);
      if (Math.abs(dev) > 0.02 && firstDiv < 0) firstDiv = qi;
      if (Math.abs(dev) > Math.abs(peakDev)) { peakDev = dev; peakDevQ = qi; }
    }
    finalDev = deviations.length > 0 ? deviations[deviations.length - 1] : 0;

    if (firstDiv >= 0) {
      affected.push({
        key: d.key, label: d.label, module: d.module,
        firstDivergenceMonth: firstDiv * 3,
        peakDeviation: Math.round(peakDev * 10000) / 100,
        peakDeviationMonth: peakDevQ * 3,
        finalDeviation: Math.round(finalDev * 10000) / 100,
        direction: peakDev > 0 ? 'increase' : 'decrease',
        timeline: deviations,
      });
    } else {
      unaffected.push(d.key);
    }
  }

  // Sort by first divergence time
  affected.sort(function(a, b) { return a.firstDivergenceMonth - b.firstDivergenceMonth; });

  // Build coupling chain: connect sequentially diverging outputs
  var chain = [];
  for (var ai = 1; ai < affected.length; ai++) {
    chain.push({
      from: affected[ai - 1].key,
      to: affected[ai].key,
      lag: affected[ai].firstDivergenceMonth - affected[ai - 1].firstDivergenceMonth,
      strength: Math.abs(affected[ai].peakDeviation) / 100,
    });
  }

  return {
    affectedOutputs: affected,
    unaffectedOutputs: unaffected,
    couplingChain: chain,
    paramKey: paramKey, module: mod,
    perturbation: { from: baseValue, to: newValue },
    nMonths: nQuarters * 3, seed: seed,
  };
}
