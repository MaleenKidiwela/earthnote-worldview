// ═══════════════════════════════════════════════════════════
// DATA ASSIMILATION — Newtonian relaxation (nudging)
// ═══════════════════════════════════════════════════════════
// Blends observational data into model state using relaxation
// toward observations. Supports per-variable and per-basin
// nudging with configurable timescales.
//
// Method: Newtonian relaxation (Anthes 1974)
//   x_nudged = x_model + α * (x_obs - x_model)
//   where α = dt / τ_nudge (relaxation coefficient)
//
// Timescales (τ):
//   Fast (1 quarter):  α ≈ 1.0  — trust observation completely
//   Medium (4 quarters): α ≈ 0.25 — blend gradually
//   Slow (12 quarters):  α ≈ 0.08 — weak constraint
//
// Diagnostics: bias, RMSE, innovation (obs - model_prior),
//   analysis increment (nudged - model_prior), skill score.
//
// Sources:
//   Anthes 1974 (JAS): Data assimilation and initialization
//   Hoke & Anthes 1976 (MWR): Newtonian relaxation
//   Kalnay 2003: Atmospheric Modeling, Data Assimilation
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl } from './utils.js';

// ── NUDGING CONFIGURATION ──
// Maps observation categories to model state variables with
// relaxation timescales and quality control bounds.
var NUDGE_CONFIG = {
  // ── Marine surface ──
  sst: {
    modelPath: 'sst',
    unit: '°C',
    tau: 2,        // quarters — medium relaxation
    qcMin: 4.0,    // reject observations outside physical bounds
    qcMax: 25.0,
    description: 'Sea surface temperature',
  },
  dissolvedOxygen: {
    modelPath: 'dissolvedOxygen',
    unit: 'mg/L',
    tau: 3,
    qcMin: 0.0,
    qcMax: 16.0,
    description: 'Dissolved oxygen',
  },
  pH: {
    modelPath: 'pH',
    unit: 'pH units',
    tau: 4,        // slow — pH is derived from DIC/TA, nudge gently
    qcMin: 7.0,
    qcMax: 8.5,
    description: 'Seawater pH',
  },
  salinity: {
    modelPath: 'salinity',
    unit: 'PSU',
    tau: 3,
    qcMin: 15.0,
    qcMax: 35.0,
    description: 'Surface salinity',
  },
  nutrients: {
    modelPath: 'nutrients',
    unit: 'µmol/L',
    tau: 4,
    qcMin: 0.0,
    qcMax: 50.0,
    description: 'Dissolved inorganic nitrogen',
  },
  // ── Pacific boundary ──
  sourceO2: {
    modelPath: 'sourceO2',
    unit: 'mg/L',
    tau: 6,        // slow — boundary condition, don't overfit
    qcMin: 0.5,
    qcMax: 8.0,
    description: 'Pacific source water oxygen',
  },
  sourceDIC: {
    modelPath: 'sourceDIC',
    unit: 'µmol/kg',
    tau: 6,
    qcMin: 1800,
    qcMax: 2400,
    description: 'Pacific source water DIC',
  },
  sourceTemp: {
    modelPath: 'sourceTemp',
    unit: '°C',
    tau: 4,
    qcMin: 3.0,
    qcMax: 15.0,
    description: 'Pacific source water temperature',
  },
  // ── River discharge ──
  discharge: {
    modelPath: 'discharge',
    unit: 'm³/s',
    tau: 1,        // fast — discharge is well-observed, trust it
    qcMin: 0,
    qcMax: 20000,
    description: 'River discharge',
  },
  // ── Underwater noise ──
  noiseLevel: {
    modelPath: 'noiseIndex',
    unit: 'dB re 1µPa',
    tau: 2,
    qcMin: 90,
    qcMax: 170,
    description: 'Broadband underwater noise',
  },
};

// ── Basin mapping for observation station → model basin ──
var STATION_BASIN_MAP = {
  // OOI / ONC stations
  'CE01ISSM': 'juanDeFuca',    // Oregon shelf inshore — closest to JdF entrance
  'CE04OSSM': 'juanDeFuca',    // Oregon shelf offshore — Pacific boundary
  'RS01SBPS': 'juanDeFuca',    // Slope Base profiler — deep Pacific source
  'VENUS_DDL': 'georgia',       // ONC Saanich Inlet (deep, anoxic reference)
  'VENUS_SJIS': 'sanjuan',     // ONC Strait of Georgia / Juan de Fuca junction
  // NANOOS stations
  'TWANOH': 'hoodCanal',
  'DABOB': 'hoodCanal',
  'NPBW': 'mainBasin',
  // NOAA CO-OPS
  'fridayharbor': 'sanjuan',
  'neahbay': 'juanDeFuca',
  'portangeles': 'juanDeFuca',
  'porttownsend': 'whidbey',
  'tacoma': 'mainBasin',
  'seattle': 'mainBasin',
  'cherrypoint': 'georgia',
};

// ── QUALITY CONTROL ──
// Returns null if observation fails QC, otherwise returns value
function qcCheck(value, config) {
  if (value == null || !Number.isFinite(value)) return null;
  if (value < config.qcMin || value > config.qcMax) return null;
  return value;
}

// ── COMPUTE NUDGING COEFFICIENT ──
// α = dt / τ, clamped to [0, 1]
function nudgeAlpha(dt, tau) {
  if (!tau || tau <= 0) return 0;
  return cl(dt / tau, 0, 1);
}

// ── SINGLE-VARIABLE NUDGE ──
// Returns { nudged, increment, innovation }
function nudgeVariable(modelValue, obsValue, dt, config) {
  var checked = qcCheck(obsValue, config);
  if (checked === null) {
    return { nudged: modelValue, increment: 0, innovation: NaN, rejected: true };
  }
  var alpha = nudgeAlpha(dt, config.tau);
  var innovation = checked - modelValue;
  var increment = alpha * innovation;
  var nudged = modelValue + increment;
  return {
    nudged: nudged,
    increment: increment,
    innovation: innovation,
    alpha: alpha,
    rejected: false,
  };
}

// ═══════════════════════════════════════════════════════════
// ASSIMILATION ENGINE
// ═══════════════════════════════════════════════════════════

// Assimilate all available observations into model state.
// observations: array of { variable, value, station, basin }
// modelState: object with current model values (will be mutated)
// dt: timestep in quarters
// Returns diagnostics object.
export function assimilateObservations(observations, modelState, dt) {
  dt = dt !== undefined ? dt : 1;
  var diagnostics = {
    assimilated: 0,
    rejected: 0,
    innovations: {},   // variable → [innovation values]
    increments: {},    // variable → [increment values]
    biases: {},        // variable → mean(obs - model)
    rmse: {},          // variable → sqrt(mean((obs - model)²))
  };

  if (!observations || !observations.length || !modelState) return diagnostics;

  // Group observations by variable
  var grouped = {};
  for (var i = 0; i < observations.length; i++) {
    var obs = observations[i];
    if (!obs || !obs.variable) continue;
    var varKey = obs.variable;
    if (!grouped[varKey]) grouped[varKey] = [];
    grouped[varKey].push(obs);
  }

  var varKeys = Object.keys(grouped);
  for (var vi = 0; vi < varKeys.length; vi++) {
    var vk = varKeys[vi];
    var config = NUDGE_CONFIG[vk];
    if (!config) continue;

    var obsList = grouped[vk];
    var innovations = [];
    var increments = [];

    for (var oi = 0; oi < obsList.length; oi++) {
      var o = obsList[oi];
      var modelVal = modelState[config.modelPath];
      if (modelVal === undefined || !Number.isFinite(modelVal)) continue;

      var result = nudgeVariable(modelVal, o.value, dt, config);
      if (result.rejected) {
        diagnostics.rejected++;
        continue;
      }

      // Apply the nudge
      modelState[config.modelPath] = result.nudged;
      innovations.push(result.innovation);
      increments.push(result.increment);
      diagnostics.assimilated++;
    }

    // Compute per-variable diagnostics
    if (innovations.length > 0) {
      var sumInno = 0, sumSqInno = 0;
      for (var di = 0; di < innovations.length; di++) {
        sumInno += innovations[di];
        sumSqInno += innovations[di] * innovations[di];
      }
      diagnostics.innovations[vk] = innovations;
      diagnostics.increments[vk] = increments;
      diagnostics.biases[vk] = sumInno / innovations.length;
      diagnostics.rmse[vk] = Math.sqrt(sumSqInno / innovations.length);
    }
  }

  return diagnostics;
}

// ═══════════════════════════════════════════════════════════
// OBSERVATION PREPARATION
// ═══════════════════════════════════════════════════════════

// Convert raw fetched observations into assimilation-ready format.
// rawObs: array from fetchLiveData()
// Returns array of { variable, value, station, basin }
export function prepareObservations(rawObs) {
  if (!rawObs || !rawObs.length) return [];

  var prepared = [];
  for (var i = 0; i < rawObs.length; i++) {
    var r = rawObs[i];
    if (!r || r.value == null || isNaN(r.value)) continue;

    var variable = null;
    var basin = r.basin || null;
    var station = r.stationName || r.sourceId || '';

    // Map source categories to assimilation variables
    if (r.category === 'ooi' || r.category === 'onc') {
      // OOI/ONC deep ocean observations
      if (r.parameter && r.parameter.indexOf('O₂') >= 0) variable = 'sourceO2';
      else if (r.parameter && r.parameter.indexOf('DIC') >= 0) variable = 'sourceDIC';
      else if (r.parameter && r.parameter.indexOf('Temp') >= 0) variable = 'sourceTemp';
      else if (r.parameter && r.parameter.indexOf('DO') >= 0) variable = 'dissolvedOxygen';
      else if (r.parameter && r.parameter.indexOf('Sal') >= 0) variable = 'salinity';
      else if (r.parameter && r.parameter.indexOf('pH') >= 0) variable = 'pH';
      else if (r.parameter && r.parameter.indexOf('SST') >= 0) variable = 'sst';
    } else if (r.category === 'ocean') {
      variable = 'sst';
    } else if (r.category === 'waterQuality') {
      if (r.modelKey && r.modelKey.indexOf('dissolvedOxygen') >= 0) variable = 'dissolvedOxygen';
      else if (r.modelKey && r.modelKey.indexOf('pH') >= 0) variable = 'pH';
    } else if (r.category === 'river') {
      variable = 'discharge';
    } else if (r.category === 'bioacoustics') {
      variable = 'noiseLevel';
    }

    if (variable) {
      prepared.push({
        variable: variable,
        value: r.value,
        station: station,
        basin: basin,
      });
    }
  }

  return prepared;
}

// ═══════════════════════════════════════════════════════════
// DIAGNOSTICS SUMMARY
// ═══════════════════════════════════════════════════════════

// Compute skill scores from accumulated diagnostics history.
// history: array of diagnostics objects from assimilateObservations
// Returns { perVariable: { bias, rmse, skill, count }, overall }
export function computeSkillScores(history) {
  if (!history || !history.length) {
    return { perVariable: {}, overall: { bias: 0, rmse: 0, skill: 0, count: 0 } };
  }

  var allVars = {};
  for (var hi = 0; hi < history.length; hi++) {
    var h = history[hi];
    if (!h || !h.innovations) continue;
    var vks = Object.keys(h.innovations);
    for (var vi = 0; vi < vks.length; vi++) {
      var vk = vks[vi];
      if (!allVars[vk]) allVars[vk] = { innovations: [], increments: [] };
      var innos = h.innovations[vk] || [];
      var incrs = h.increments[vk] || [];
      for (var ii = 0; ii < innos.length; ii++) allVars[vk].innovations.push(innos[ii]);
      for (var ij = 0; ij < incrs.length; ij++) allVars[vk].increments.push(incrs[ij]);
    }
  }

  var perVariable = {};
  var totalBias = 0, totalRMSE = 0, totalCount = 0;
  var varNames = Object.keys(allVars);
  for (var vni = 0; vni < varNames.length; vni++) {
    var vn = varNames[vni];
    var data = allVars[vn];
    var n = data.innovations.length;
    if (n === 0) continue;

    var sum = 0, sumSq = 0, sumIncSq = 0;
    for (var di = 0; di < n; di++) {
      sum += data.innovations[di];
      sumSq += data.innovations[di] * data.innovations[di];
    }
    for (var dj = 0; dj < data.increments.length; dj++) {
      sumIncSq += data.increments[dj] * data.increments[dj];
    }

    var bias = sum / n;
    var rmse = Math.sqrt(sumSq / n);
    // Murphy skill score: 1 - MSE/variance
    // Using innovation variance as reference (perfect model = 0 innovation)
    var variance = sumSq / n - bias * bias;
    var mse = sumIncSq / (data.increments.length || 1);
    var skill = variance > 0 ? cl(1 - mse / (sumSq / n), -1, 1) : 0;

    perVariable[vn] = {
      bias: bias,
      rmse: rmse,
      skill: skill,
      count: n,
      config: NUDGE_CONFIG[vn] || {},
    };
    totalBias += bias;
    totalRMSE += rmse;
    totalCount += n;
  }

  var nVars = varNames.length || 1;
  return {
    perVariable: perVariable,
    overall: {
      bias: totalBias / nVars,
      rmse: totalRMSE / nVars,
      skill: Object.keys(perVariable).reduce(function(s, k) { return s + perVariable[k].skill; }, 0) / nVars,
      count: totalCount,
    },
  };
}

// Export config for UI display
export var NUDGE_VARIABLES = Object.keys(NUDGE_CONFIG).map(function(k) {
  return { key: k, description: NUDGE_CONFIG[k].description, unit: NUDGE_CONFIG[k].unit, tau: NUDGE_CONFIG[k].tau };
});

export { NUDGE_CONFIG, STATION_BASIN_MAP };
