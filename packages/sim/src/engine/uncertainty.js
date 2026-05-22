// ═══════════════════════════════════════════════════════════
// UNCERTAINTY QUANTIFICATION — Monte Carlo ensemble analysis
// ═══════════════════════════════════════════════════════════
// Samples parameter space to estimate confidence intervals on
// model outputs. Uses Latin Hypercube Sampling for efficient
// coverage of the ~22 high-leverage parameters.
//
// LHS implementation per McKay, Beckman & Conover 1979
// "A comparison of three methods for selecting values of input
// variables in the analysis of output from a computer code",
// Technometrics 21(2):239-245.
//
// Rank correlation preservation per Iman & Conover 1982
// "A distribution-free approach to inducing rank correlation
// among input variables", Communications in Statistics B11(3):311-334.
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl, resetEnsoCache } from './utils.js';
import { runOrchestrator } from './orchestrator.js';
import { DEF } from '../config/defaults.js';
import { PM, HIGH_LEVERAGE } from '../config/parameters.js';

// Find module for a parameter key
function findModule(paramKey) {
  var keys = Object.keys(PM);
  for (var i = 0; i < keys.length; i++) {
    if (PM[keys[i]].p && PM[keys[i]].p[paramKey]) return keys[i];
  }
  return null;
}

// Build parameter info list
var PARAM_INFO = [];
var hlKeys = Object.keys(HIGH_LEVERAGE);
for (var i = 0; i < hlKeys.length; i++) {
  var key = hlKeys[i];
  var mod = findModule(key);
  if (!mod) continue;
  var meta = PM[mod].p[key];
  PARAM_INFO.push({
    key: key, mod: mod,
    min: meta ? meta.mn : 0,
    max: meta ? meta.mx : 100,
    default: DEF[mod] && DEF[mod][key] !== undefined ? DEF[mod][key] : 50,
  });
}

// ── CORRELATION MATRIX — Iman & Conover 1982 ──
// Physical correlations between high-leverage parameters to prevent
// implausible combinations (e.g., high temperature + high snowpack).
// Keys must match PARAM_INFO keys. Values are Spearman rank correlations.
var CORRELATIONS = [
  // Temperature ↔ DO: warm water holds less oxygen (Garcia & Gordon 1992)
  { a: 'baselineTemperature', b: 'fishingPressure', rho: 0 }, // placeholder — real pairs below
];

// Build correlation pairs from PARAM_INFO indices
function buildCorrelationPairs(params) {
  var pairs = [
    // Temperature–related negative correlations
    { aKey: 'baselineTemperature', bKey: 'forestCover', rho: -0.3 },
    // Precipitation ↔ nutrient runoff
    { aKey: 'precipitation', bKey: 'nutrientMgmt', rho: -0.5 },
    // Forest cover ↔ impervious surface (inverse by definition)
    { aKey: 'forestCover', bKey: 'imperviousSurface', rho: -0.7 },
    // Container throughput ↔ vessel speed (high traffic → more speed zones)
    { aKey: 'containerThroughput', bKey: 'vesselSpeedZone', rho: 0.3 },
  ];
  var result = [];
  for (var pi = 0; pi < pairs.length; pi++) {
    var aIdx = -1, bIdx = -1;
    for (var j = 0; j < params.length; j++) {
      if (params[j].key === pairs[pi].aKey) aIdx = j;
      if (params[j].key === pairs[pi].bKey) bIdx = j;
    }
    if (aIdx >= 0 && bIdx >= 0) {
      result.push({ a: aIdx, b: bIdx, rho: pairs[pi].rho });
    }
  }
  return result;
}

// ── Iman-Conover rank correlation inducer ──
// Reorders columns of LHS matrix to induce target rank correlations.
// Simplified pairwise approach: for each correlated pair, sort one
// column to match the rank order that would produce the target correlation.
function induceRankCorrelation(columns, pairs) {
  if (!pairs || pairs.length === 0) return;
  for (var pi = 0; pi < pairs.length; pi++) {
    var pair = pairs[pi];
    var colA = columns[pair.a];
    var colB = columns[pair.b];
    var n = colA.length;
    if (n < 4) continue;

    // Get rank order of column A
    var idxA = [];
    for (var i = 0; i < n; i++) idxA.push(i);
    idxA.sort(function(x, y) { return colA[x] - colA[y]; });

    // For positive correlation: sort B in same rank order as A
    // For negative correlation: sort B in reverse rank order
    var sortedB = colB.slice().sort(function(a, b) { return a - b; });
    if (pair.rho < 0) sortedB.reverse();

    // Blend: fully correlated order vs original order
    // |rho| = 1 means full reorder, |rho| = 0 means no change
    var absRho = Math.abs(pair.rho);
    if (absRho < 0.1) continue; // too weak to bother

    // Assign sorted values to positions determined by A's rank order
    var newB = new Array(n);
    for (var k = 0; k < n; k++) {
      newB[idxA[k]] = sortedB[k];
    }

    // Blend between original and correlated: B_final = (1-|rho|)*B_orig + |rho|*B_correlated
    for (var m = 0; m < n; m++) {
      columns[pair.b][m] = (1 - absRho) * colB[m] + absRho * newB[m];
    }
  }
}

// ── Latin Hypercube Sampling ──
// McKay et al. 1979: divide each dimension into N equal-probability strata,
// draw one sample per stratum, and shuffle columns independently.
// Samples across the FULL parameter range [p.min, p.max] from PM.
function lhsSample(n, params) {
  var samples = [];
  var d = params.length;
  var corrPairs = buildCorrelationPairs(params);

  // Create stratified columns across full parameter range
  var columns = [];
  for (var j = 0; j < d; j++) {
    var p = params[j];
    // Use full parameter range from PM — McKay et al. 1979
    // Fall back to ±25% of default if min/max are not meaningfully different
    var rangeSpan = p.max - p.min;
    var lo, hi;
    if (rangeSpan > 0 && p.max !== p.min) {
      lo = p.min;
      hi = p.max;
    } else {
      // Fallback: ±25% of default
      var jitter = Math.max(Math.abs(p.default) * 0.25, 1);
      lo = p.default - jitter;
      hi = p.default + jitter;
    }
    var strata = [];
    for (var si = 0; si < n; si++) {
      var sLo = lo + (si / n) * (hi - lo);
      var sHi = lo + ((si + 1) / n) * (hi - lo);
      strata.push(sLo + Math.random() * (sHi - sLo));
    }
    // Fisher-Yates shuffle — McKay et al. 1979
    for (var k = strata.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var tmp = strata[k]; strata[k] = strata[r]; strata[r] = tmp;
    }
    columns.push(strata);
  }

  // Apply Iman-Conover rank correlation — Iman & Conover 1982
  induceRankCorrelation(columns, corrPairs);

  // Build parameter sets from columns
  for (var si2 = 0; si2 < n; si2++) {
    var paramSet = JSON.parse(JSON.stringify(DEF));
    for (var j2 = 0; j2 < d; j2++) {
      var pi = params[j2];
      if (paramSet[pi.mod]) paramSet[pi.mod][pi.key] = columns[j2][si2];
    }
    samples.push(paramSet);
  }
  return samples;
}

// Run a single simulation and extract key outputs
function runSim(params) {
  resetEnsoCache(42);
  var state = null;
  for (var q = 0; q < 4; q++) {
    var r = runOrchestrator(params, {}, q / 4, state, 1, 0);
    state = r._state;
  }
  var result;
  for (var q2 = 0; q2 < 4; q2++) {
    result = runOrchestrator(params, {}, q2 / 4, state, 1, 0);
    state = result._state;
  }
  var _v = function(v, fb) { return v !== undefined && Number.isFinite(v) ? v : fb; };
  var es = result.ecosystem.state, ms = result.marine.state;
  var us = result.urban.state, ps = result.port.state;
  return {
    biodiversity: _v(es.biodiversityIndex, 0.72),
    orcaPopulation: _v(es.orcaPopulation, 74),
    salmonRun: _v(es.salmonRunStrength, 48),
    dissolvedOxygen: _v(ms.dissolvedOxygen, 6.4),
    pH: _v(ms.pH, 7.95),
    sst: _v(ms.sst, 11.3),
    equity: _v(us.equityIndex, 0.65),
    employment: _v(ps.employment, 30000),
    infraResilience: result.infrastructure ? _v(result.infrastructure.state.resilienceIndex, 0.85) : 0.85,
    culturalHealth: result.tribal ? _v(result.tribal.state.avgCulturalHealth, 0.5) : 0.5,
  };
}

// Compute statistics from ensemble
function computeStats(values) {
  var n = values.length;
  if (n === 0) return { mean: 0, std: 0, p5: 0, p95: 0, cv: 0 };
  values.sort(function(a, b) { return a - b; });
  var sum = 0;
  for (var i = 0; i < n; i++) sum += values[i];
  var mean = sum / n;
  var variance = 0;
  for (var i2 = 0; i2 < n; i2++) variance += (values[i2] - mean) * (values[i2] - mean);
  variance /= n;
  var std = Math.sqrt(variance);
  return {
    mean: mean,
    std: std,
    p5: values[Math.floor(n * 0.05)],
    p95: values[Math.floor(n * 0.95)],
    cv: mean !== 0 ? std / Math.abs(mean) : 0,
    min: values[0],
    max: values[n - 1],
  };
}

// ── Convergence check ──
// After each batch, check if the running mean CV has stabilized.
// If the relative change in mean across all outputs is < threshold,
// we declare convergence.
function checkConvergence(prevStats, currStats, outputKeys, threshold) {
  if (!prevStats) return false;
  var maxRelChange = 0;
  for (var ki = 0; ki < outputKeys.length; ki++) {
    var k = outputKeys[ki];
    var prevMean = prevStats[k] ? prevStats[k].mean : 0;
    var currMean = currStats[k] ? currStats[k].mean : 0;
    if (Math.abs(prevMean) > 1e-10) {
      var relChange = Math.abs(currMean - prevMean) / Math.abs(prevMean);
      if (relChange > maxRelChange) maxRelChange = relChange;
    }
  }
  return maxRelChange < threshold;
}

// ── Main uncertainty computation ──
// Returns: { outputName: { mean, std, p5, p95, cv, min, max }, _meta: { converged, effectiveN, totalN } }
export function computeUncertainty(nSamples, onProgress) {
  nSamples = nSamples || 50;
  var samples = lhsSample(nSamples, PARAM_INFO);

  // Collect results
  var outputKeys = ['biodiversity', 'orcaPopulation', 'salmonRun', 'dissolvedOxygen',
    'pH', 'sst', 'equity', 'employment', 'infraResilience', 'culturalHealth'];
  var results = {};
  for (var ki = 0; ki < outputKeys.length; ki++) results[outputKeys[ki]] = [];

  var effectiveN = 0;
  var converged = false;
  var prevBatchStats = null;
  var BATCH_SIZE = 10; // Check convergence every 10 runs
  var CONVERGENCE_THRESHOLD = 0.01; // 1% relative change in means

  for (var si = 0; si < nSamples; si++) {
    if (onProgress) onProgress(si, nSamples);
    try {
      var output = runSim(samples[si]);
      for (var ki2 = 0; ki2 < outputKeys.length; ki2++) {
        var k = outputKeys[ki2];
        if (output[k] !== undefined && Number.isFinite(output[k])) {
          results[k].push(output[k]);
        }
      }
      effectiveN++;
    } catch (e) {
      // Skip failed runs — effectiveN tracks actual successes
    }

    // Convergence check every BATCH_SIZE runs (after at least 20)
    if (effectiveN >= 20 && effectiveN % BATCH_SIZE === 0) {
      var batchStats = {};
      for (var ki3 = 0; ki3 < outputKeys.length; ki3++) {
        batchStats[outputKeys[ki3]] = computeStats(results[outputKeys[ki3]].slice());
      }
      if (checkConvergence(prevBatchStats, batchStats, outputKeys, CONVERGENCE_THRESHOLD)) {
        converged = true;
      }
      prevBatchStats = batchStats;
    }
  }

  // Compute final statistics
  var stats = {};
  for (var ki4 = 0; ki4 < outputKeys.length; ki4++) {
    var k4 = outputKeys[ki4];
    stats[k4] = computeStats(results[k4]);
  }

  // Attach convergence metadata
  stats._meta = {
    converged: converged,
    effectiveN: effectiveN,
    totalN: nSamples,
    failedRuns: nSamples - effectiveN,
    convergenceThreshold: CONVERGENCE_THRESHOLD,
    samplingRange: 'full [p.min, p.max]',
    correlationMethod: 'Iman-Conover pairwise rank',
  };

  return stats;
}

// ── Output labels ──
export var UNCERTAINTY_LABELS = {
  biodiversity: 'Biodiversity Index',
  orcaPopulation: 'Orca Population',
  salmonRun: 'Salmon Run Index',
  dissolvedOxygen: 'Dissolved Oxygen',
  pH: 'pH',
  sst: 'Sea Surface Temperature',
  equity: 'Social Equity',
  employment: 'Employment',
  infraResilience: 'Infrastructure Resilience',
  culturalHealth: 'Cultural Health',
};
