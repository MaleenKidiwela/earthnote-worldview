import { cl, resetEnsoCache, _ensoCache } from './utils.js';
import { BASINS } from './basins.js';
import { runOrchestrator } from './orchestrator.js';

// ═══════════════════════════════════════════════════════════
// RESEARCH TOOLS — Calibration, Sensitivity, Mass Balance, Equations
// ═══════════════════════════════════════════════════════════

// Observed calibration targets (source, year, value, uncertainty)
var CALIBRATION_TARGETS = {
  orcaPopulation: [
    { yr: 2018, v: 75, u: 0, src: "CWR Census" }, { yr: 2019, v: 73, u: 0, src: "CWR" },
    { yr: 2020, v: 72, u: 0, src: "CWR" }, { yr: 2021, v: 73, u: 0, src: "CWR" },
    { yr: 2022, v: 73, u: 0, src: "CWR" }, { yr: 2023, v: 75, u: 0, src: "CWR" },
    { yr: 2024, v: 74, u: 0, src: "CWR Jul 2024" }, { yr: 2025, v: 74, u: 0, src: "CWR Jul 2025" },
  ],
  dissolvedOxygen: [
    { yr: 2020, v: 6.8, u: 0.5, src: "Ecology WQ Atlas" }, { yr: 2022, v: 6.5, u: 0.5, src: "Ecology WQ" },
    { yr: 2024, v: 6.4, u: 0.5, src: "Ecology WQ est." },
  ],
  hoodCanalDO: [
    { yr: 2020, v: 4.5, u: 0.8, src: "ORCA buoy" }, { yr: 2022, v: 4.2, u: 0.8, src: "ORCA buoy" },
    { yr: 2024, v: 4.0, u: 0.8, src: "ORCA buoy est." },
  ],
  sst: [
    { yr: 2020, v: 10.8, u: 0.3, src: "NOAA NDBC" }, { yr: 2022, v: 11.1, u: 0.3, src: "NOAA" },
    { yr: 2024, v: 11.3, u: 0.3, src: "NOAA est." },
  ],
  salmonRun: [
    { yr: 2020, v: 55, u: 10, src: "WDFW est." }, { yr: 2022, v: 50, u: 10, src: "WDFW" },
    { yr: 2024, v: 48, u: 10, src: "WDFW prelim." },
  ],
  // ── PER-BASIN CALIBRATION (EU DTO sub-basin validation pattern) ──
  // Sources: WA Ecology Marine Water Quality Monitoring, DFO BC, NOAA NDBC buoys,
  // ORCA profiling buoys, King County Marine Monitoring, NANOOS real-time observations.
  georgiaDO: [
    { yr: 2022, v: 7.2, u: 0.6, src: "DFO BC monitoring" }, { yr: 2024, v: 7.0, u: 0.6, src: "DFO est." },
  ],
  georgiaSST: [
    { yr: 2022, v: 10.4, u: 0.4, src: "DFO BC / NANOOS" }, { yr: 2024, v: 10.6, u: 0.4, src: "est." },
  ],
  whidbeyDO: [
    { yr: 2022, v: 6.8, u: 0.5, src: "Ecology Whidbey stn" }, { yr: 2024, v: 6.5, u: 0.5, src: "est." },
  ],
  mainBasinDO: [
    { yr: 2022, v: 7.0, u: 0.5, src: "King Co. Marine" }, { yr: 2024, v: 6.8, u: 0.5, src: "est." },
  ],
  mainBasinSST: [
    { yr: 2022, v: 11.0, u: 0.3, src: "NOAA Seattle buoy" }, { yr: 2024, v: 11.3, u: 0.3, src: "est." },
  ],
  southSoundDO: [
    { yr: 2022, v: 6.0, u: 0.7, src: "Ecology South Puget" }, { yr: 2024, v: 5.8, u: 0.7, src: "est." },
  ],
  sanjuanSST: [
    { yr: 2022, v: 9.8, u: 0.4, src: "NANOOS Orca buoy" }, { yr: 2024, v: 10.1, u: 0.4, src: "est." },
  ],
  georgiaSalinity: [
    { yr: 2022, v: 25.5, u: 1.5, src: "DFO BC" }, { yr: 2024, v: 25.0, u: 1.5, src: "est." },
  ],
  hoodCanalpH: [
    { yr: 2022, v: 7.85, u: 0.10, src: "ORCA buoy" }, { yr: 2024, v: 7.82, u: 0.10, src: "est." },
  ],
  juanDeFucaDO: [
    { yr: 2022, v: 7.8, u: 0.6, src: "NANOOS JdF buoy" }, { yr: 2024, v: 7.6, u: 0.6, src: "est." },
  ],
  juanDeFucaSST: [
    { yr: 2022, v: 9.5, u: 0.5, src: "NOAA NDBC 46087" }, { yr: 2024, v: 9.8, u: 0.5, src: "est." },
  ],
  juanDeFucaSalinity: [
    { yr: 2022, v: 31.2, u: 1.0, src: "DFO/NANOOS" }, { yr: 2024, v: 31.0, u: 1.0, src: "est." },
  ],
};

// ── DATA CONNECTION LAYER (inspired by EU DTO FAIR/CF-convention interoperability) ──
// Maps internal model variables to CF standard names + units for interoperability
// with NOAA, Ecology, NANOOS, DFO, and Copernicus data products.
// Use exportObservationSchema() to get a blank JSON template for pasting in real data.
// Use nudgeState() to gently pull model toward observations during simulation.
var DATA_SCHEMA = {
  // key: { cf: CF standard name, unit: SI unit, path: model accessor, basin: optional basin ID }
  sst:              { cf: "sea_surface_temperature", unit: "degC", path: "marine.state.sst" },
  dissolvedOxygen:  { cf: "mass_concentration_of_oxygen_in_sea_water", unit: "mg/L", path: "marine.state.dissolvedOxygen" },
  salinity:         { cf: "sea_water_salinity", unit: "PSU", path: "marine.state.salinity" },
  pH:               { cf: "sea_water_ph_reported_on_total_scale", unit: "", path: "marine.state.pH" },
  turbidity:        { cf: "sea_water_turbidity", unit: "NTU", path: "marine.state.turbidity" },
  nutrients:        { cf: "mole_concentration_of_nitrate_in_sea_water", unit: "umol/L", path: "marine.state.nutrientConcentration" },
  chlorophyll:      { cf: "mass_concentration_of_chlorophyll_in_sea_water", unit: "mg/m3", path: "marine.state.phyto", scale: 0.01 },
  orcaPopulation:   { cf: "number_of_organisms", unit: "individuals", path: "ecosystem.state.orcaPopulation" },
  salmonRunIndex:   { cf: "fisheries_stock_index", unit: "index(0-100)", path: "ecosystem.state.salmonRunStrength" },
  freshwaterDischarge: { cf: "water_volume_transport_into_sea_water_from_rivers", unit: "m3/s", path: "watershed.freshwaterDischarge" },
  // Per-basin overrides — append basin ID to key
  "georgia.DO":      { cf: "mass_concentration_of_oxygen_in_sea_water", unit: "mg/L", path: "marine.basins.georgia.DO" },
  "georgia.SST":     { cf: "sea_surface_temperature", unit: "degC", path: "marine.basins.georgia.SST" },
  "georgia.salinity":{ cf: "sea_water_salinity", unit: "PSU", path: "marine.basins.georgia.salinity" },
  "hoodCanal.DO":    { cf: "mass_concentration_of_oxygen_in_sea_water", unit: "mg/L", path: "marine.basins.hoodCanal.DO" },
  "hoodCanal.pH":    { cf: "sea_water_ph_reported_on_total_scale", unit: "", path: "marine.basins.hoodCanal.pH" },
  "mainBasin.DO":    { cf: "mass_concentration_of_oxygen_in_sea_water", unit: "mg/L", path: "marine.basins.mainBasin.DO" },
  "mainBasin.SST":   { cf: "sea_surface_temperature", unit: "degC", path: "marine.basins.mainBasin.SST" },
  "southSound.DO":   { cf: "mass_concentration_of_oxygen_in_sea_water", unit: "mg/L", path: "marine.basins.southSound.DO" },
  "whidbey.DO":      { cf: "mass_concentration_of_oxygen_in_sea_water", unit: "mg/L", path: "marine.basins.whidbey.DO" },
  "sanjuan.SST":     { cf: "sea_surface_temperature", unit: "degC", path: "marine.basins.sanjuan.SST" },
  "juanDeFuca.DO":   { cf: "mass_concentration_of_oxygen_in_sea_water", unit: "mg/L", path: "marine.basins.juanDeFuca.DO" },
  "juanDeFuca.SST":  { cf: "sea_surface_temperature", unit: "degC", path: "marine.basins.juanDeFuca.SST" },
  "juanDeFuca.salinity": { cf: "sea_water_salinity", unit: "PSU", path: "marine.basins.juanDeFuca.salinity" },
};

// ── CITIZEN SCIENCE IMPORT SCHEMA ──
// Accepts standardized citizen science observations and maps them to model variables.
// Compatible with: Orca Network sightings, SoundToxins HAB reports, REEF fish surveys,
// King County beach naturalist Secchi disk readings, iNaturalist observations.
// Use exportCitizenScienceTemplate() to get a blank JSON template.
var CITIZEN_SCIENCE_SCHEMA = {
  orcaSighting: {
    desc: "Orca sighting report (Orca Network format)",
    fields: { pod: "J/K/L/unknown", count: "number of individuals", location: "basin ID or lat/lon", date: "ISO date", behavior: "foraging/traveling/socializing/resting" },
    mapsTo: "Validates orca population and pod distribution. Foraging sightings indicate prey availability."
  },
  habReport: {
    desc: "Harmful algal bloom report (SoundToxins / beach naturalist)",
    fields: { basin: "basin ID", toxinType: "PSP/ASP/DSP", severity: "low/medium/high", closureActive: "boolean", date: "ISO date" },
    mapsTo: "Validates HAB intensity and shellfish closure status per basin."
  },
  secchiDisk: {
    desc: "Water clarity measurement (Secchi disk depth in meters)",
    fields: { basin: "basin ID", depth_m: "number (deeper = clearer)", date: "ISO date" },
    mapsTo: "Maps to turbidity: turbidity ≈ 40 / (depth_m + 1). Feeds into eelgrass light availability."
  },
  waterTemp: {
    desc: "Surface water temperature observation",
    fields: { basin: "basin ID", temp_c: "number (°C)", date: "ISO date" },
    mapsTo: "Maps to basin SST. Validates model temperature predictions."
  },
  speciesCount: {
    desc: "Species observation count (iNaturalist / REEF format)",
    fields: { basin: "basin ID", taxon: "species or group name", count: "number observed", date: "ISO date" },
    mapsTo: "Feeds biodiversity index calibration. Aggregated across taxa."
  },
};

// Convert citizen science observations to nudging-compatible format
function citizenScienceToObservations(csData) {
  if (!csData || !csData.reports) return {};
  var obs = {};
  csData.reports.forEach(function(r) {
    if (r.type === "secchiDisk" && r.basin && typeof r.depth_m === "number") {
      // Secchi depth → turbidity: empirical relationship (Preisendorfer 1986)
      var turb = cl(40 / (r.depth_m + 1), 0, 50);
      obs[r.basin + ".turbidity"] = { value: turb, source: "citizen science (Secchi)", date: r.date || "" };
    }
    if (r.type === "waterTemp" && r.basin && typeof r.temp_c === "number") {
      obs[r.basin + ".SST"] = { value: r.temp_c, source: "citizen science", date: r.date || "" };
    }
    if (r.type === "habReport" && r.basin) {
      var habVal = r.severity === "high" ? 0.8 : r.severity === "medium" ? 0.5 : 0.3;
      obs[r.basin + ".habIntensity"] = { value: habVal, source: "SoundToxins / citizen report", date: r.date || "" };
    }
  });
  return obs;
}

function exportCitizenScienceTemplate() {
  var template = {
    _format: "salish-sea-dt-citizen-science-v1",
    _generated: new Date().toISOString(),
    _instructions: "Add observation reports to the 'reports' array. Each report needs a 'type' field matching one of: orcaSighting, habReport, secchiDisk, waterTemp, speciesCount. Valid basin IDs: " + Object.keys(BASINS).join(", ") + ". Import via the Data button in the Research panel.",
    _schema: CITIZEN_SCIENCE_SCHEMA,
    reports: [
      { type: "secchiDisk", basin: "mainBasin", depth_m: 5.2, date: "2026-03-15" },
      { type: "waterTemp", basin: "sanjuan", temp_c: 9.8, date: "2026-03-15" },
      { type: "habReport", basin: "southSound", toxinType: "PSP", severity: "low", closureActive: false, date: "2026-03-15" },
      { type: "orcaSighting", pod: "J", count: 22, location: "sanjuan", date: "2026-03-15", behavior: "foraging" },
    ]
  };
  return JSON.stringify(template, null, 2);
}

// Generate blank observation template for users to fill with real data
function exportObservationSchema() {
  var template = { _format: "salish-sea-dt-observations-v1", _generated: new Date().toISOString(), _instructions: "Fill 'value' fields with observed data. Set 'value' to null for variables you don't have. Import via the Data button in the Research panel.", observations: {} };
  Object.keys(DATA_SCHEMA).forEach(function(k) {
    var s = DATA_SCHEMA[k];
    template.observations[k] = { cf_standard_name: s.cf, unit: s.unit, value: null, source: "", date: "" };
  });
  return JSON.stringify(template, null, 2);
}

// Nudge model basins toward observations. Called after orchestrator computes marine state.
// Uses simple Newtonian relaxation: model_new = model + alpha * (obs - model)
// Alpha = 0.10 per quarter = gentle pull, allows model dynamics to dominate but corrects drift.
function nudgeBasins(basins, observedData, alpha) {
  if (!observedData || !basins) return basins;
  alpha = alpha !== undefined ? alpha : 0.10;
  var nudged = JSON.parse(JSON.stringify(basins));
  Object.keys(observedData).forEach(function(key) {
    var obs = observedData[key];
    if (obs === null || obs === undefined || typeof obs.value !== "number") return;
    var parts = key.split(".");
    if (parts.length === 2) {
      // Per-basin observation: e.g., "georgia.DO"
      var bid = parts[0], prop = parts[1];
      if (nudged[bid] && nudged[bid][prop] !== undefined) {
        nudged[bid][prop] += alpha * (obs.value - nudged[bid][prop]);
      }
    }
  });
  return nudged;
}

// Nudge aggregate marine state toward observations
function nudgeMarineState(mState, observedData, alpha) {
  if (!observedData || !mState) return mState;
  alpha = alpha !== undefined ? alpha : 0.10;
  var propMap = { sst: "sst", dissolvedOxygen: "dissolvedOxygen", salinity: "salinity", pH: "pH", turbidity: "turbidity", nutrients: "nutrientConcentration" };
  Object.keys(propMap).forEach(function(obsKey) {
    var obs = observedData[obsKey];
    if (obs && typeof obs.value === "number" && mState[propMap[obsKey]] !== undefined) {
      mState[propMap[obsKey]] += alpha * (obs.value - mState[propMap[obsKey]]);
    }
  });
  return mState;
}

// OAT sensitivity sweep: vary one param ±range, return output metric at each step
// PM passed as parameter
function runSensitivity(baseParams, paramPath, outputFn, steps, rangeFrac, PM) {
  steps = Math.max(steps || 11, 2); rangeFrac = rangeFrac || 0.3;
  var parts = paramPath.split(".");
  var mod = parts[0], pk = parts[1];
  var baseVal = baseParams[mod][pk];
  var meta = PM[mod] && PM[mod].p[pk];
  var lo = meta ? meta.mn : baseVal * (1 - rangeFrac);
  var hi = meta ? meta.mx : baseVal * (1 + rangeFrac);
  var results = [];
  var savedSeed = _ensoCache.seed;
  for (var i = 0; i < steps; i++) {
    var frac = i / (steps - 1);
    var val = lo + frac * (hi - lo);
    var testParams = JSON.parse(JSON.stringify(baseParams));
    testParams[mod][pk] = val;
    resetEnsoCache(42);
    // Run 4 quarters to get past initialization transients
    var state = null;
    for (var q = 0; q < 4; q++) {
      var r = runOrchestrator(testParams, {}, q / 4, state, 1, 0);
      state = r._state;
    }
    var r2 = runOrchestrator(testParams, {}, 0, state, 1, 1);
    results.push({ paramVal: val, output: outputFn(r2) });
  }
  resetEnsoCache(savedSeed);
  return { mod: mod, param: pk, baseVal: baseVal, lo: lo, hi: hi, label: (meta ? meta.l : pk), unit: (meta ? meta.u : ""), results: results };
}

// Batch parameter sweep: sweep one param, return multiple outputs per step
// PM passed as parameter
function runBatchSweep(baseParams, paramPath, steps, rangeFrac, yearsToRun, PM) {
  steps = Math.max(steps || 11, 2); rangeFrac = rangeFrac || 0.3; yearsToRun = yearsToRun || 10;
  var parts = paramPath.split(".");
  var mod = parts[0], pk = parts[1];
  var baseVal = baseParams[mod][pk];
  var meta = PM[mod] && PM[mod].p[pk];
  var lo = meta ? meta.mn : baseVal * (1 - rangeFrac);
  var hi = meta ? meta.mx : baseVal * (1 + rangeFrac);
  var results = [];
  var savedSeed = _ensoCache.seed;
  for (var i = 0; i < steps; i++) {
    var val = lo + (i / (steps - 1)) * (hi - lo);
    var testParams = JSON.parse(JSON.stringify(baseParams));
    testParams[mod][pk] = val;
    resetEnsoCache(42);
    var state = null;
    var r;
    for (var y = 0; y < yearsToRun; y++) {
      for (var q = 0; q < 4; q++) {
        r = runOrchestrator(testParams, {}, q / 4, state, 1, y);
        state = r._state;
      }
    }
    var ms = r.marine.state, es = r.ecosystem.state, us = r.urban.state, ps = r.port.state;
    results.push({ paramVal: val, wqi: ms.waterQualityIndex, bio: es.biodiversityIndex, orca: es.orcaPopulation !== undefined ? es.orcaPopulation : 74, salmon: es.salmonRunStrength, do: ms.dissolvedOxygen, equity: us.equityIndex !== undefined ? us.equityIndex : 0.65, emp: ps.employment });
  }
  resetEnsoCache(savedSeed);
  return { mod: mod, param: pk, baseVal: baseVal, lo: lo, hi: hi, label: (meta ? meta.l : pk), unit: (meta ? meta.u : ""), years: yearsToRun, results: results };
}

// NPZD mass balance diagnostic per basin
function computeMassBalance(results) {
  if (!results.marine || !results.marine.basins) return null;
  var balances = {};
  Object.keys(BASINS).forEach(function(bid) {
    var b = results.marine.basins[bid];
    if (!b) return;
    var phytoN = b.phyto * 0.016; // Redfield C:N, phyto units ~ µg C/L → µmol N
    var zooN = b.zoo * 0.016;
    var detN = (b.detritus || 50) * 0.016;
    var dissolvedN = b.nutrients;
    var totalN = dissolvedN + phytoN + zooN + detN;
    // Flux estimates from model rates
    var uptake = 0.5 * b.phyto * cl(b.nutrients / (b.nutrients + 2.0), 0, 1) * 0.016; // phyto growth consumes N
    var grazing = 0.25 * b.phyto / (b.phyto + 300) * b.zoo * 0.016;
    var remin = 0.15 * (b.detritus || 50) * 0.016; // detritus → dissolved N
    var sinking = 0.12 * (b.detritus || 50) * 0.016; // loss to benthos
    var benthicN = (b.benthicLoad || 20) * 0.016; // benthic organic nitrogen pool
    var benthicRemin = (b.benthicLoad || 20) * 0.008 * 0.016; // slow sediment remineralization
    balances[bid] = { totalN: totalN + benthicN, dissolvedN: dissolvedN, phytoN: phytoN, zooN: zooN, detN: detN, benthicN: benthicN, uptake: uptake, grazing: grazing, remin: remin, sinking: sinking, benthicRemin: benthicRemin, residual: remin + benthicRemin - uptake - sinking, sod: b.sod || 0 };
  });
  return balances;
}

// Equation reference: structured model equations with live parameter substitution
var MODEL_EQUATIONS = [
  { id: "npzd_phyto", section: "NPZD", title: "Phytoplankton growth",
    tex: "dP/dt = μ_max × (N/(N+K_N)) × I × f(T) × P - m_P × P - G(P,Z)",
    desc: "Michaelis-Menten nutrient uptake × light × temperature (Q10=1.9) - mortality - grazing loss",
    params: [{ k: "μ_max", v: 0.5, u: "d⁻¹", desc: "Max growth rate" }, { k: "K_N", v: 2.0, u: "µmol/L", desc: "Half-saturation for nutrients" }, { k: "m_P", v: 0.08, u: "d⁻¹", desc: "Phyto mortality rate" }] },
  { id: "npzd_zoo", section: "NPZD", title: "Zooplankton grazing",
    tex: "G = g_max × P/(P+K_P) × Z × ε",
    desc: "Holling Type II functional response. Assimilation efficiency ε = 0.6",
    params: [{ k: "g_max", v: 0.25, u: "d⁻¹", desc: "Max grazing rate" }, { k: "K_P", v: 300, u: "µg C/L", desc: "Half-saturation for grazing" }, { k: "ε", v: 0.6, u: "", desc: "Assimilation efficiency" }] },
  { id: "npzd_det", section: "NPZD", title: "Detritus dynamics",
    tex: "dD/dt = m_P×P + (1-ε)×G + m_Z×Z - r×D - s×D",
    desc: "Accumulates from mortality + fecal pellets. Remineralizes at 15%/qtr, sinks at 12%/qtr",
    params: [{ k: "r", v: 0.15, u: "qtr⁻¹", desc: "Remineralization rate" }, { k: "s", v: 0.12, u: "qtr⁻¹", desc: "Sinking rate" }] },
  { id: "salmon_bh", section: "Salmon", title: "Beverton-Holt stock-recruitment",
    tex: "R = (α × S × f_genetic × K_wild) / (α × S × f_genetic + K_wild)",
    desc: "Density-dependent recruitment. Wild carrying capacity modulated by genetic diversity",
    params: [{ k: "α", v: 1.0, u: "", desc: "Productivity (fecundity × survival)" }, { k: "K_wild", v: 1200, u: "fish", desc: "Wild carrying capacity (Chinook)" }, { k: "f_genetic", v: 0.85, u: "", desc: "Genetic fitness (1.0 = fully wild)" }] },
  { id: "salmon_genetic", section: "Salmon", title: "Genetic diversity dynamics",
    tex: "dG/dt = -h × s_rate × 0.02 + (1-h) × 0.005",
    desc: "Hatchery fraction h degrades via stray rate; wild recovery at 0.5%/yr",
    params: [{ k: "h", v: 0.35, u: "", desc: "Hatchery fraction" }, { k: "s_rate", v: 0.05, u: "", desc: "Stray rate (Chinook)" }] },
  { id: "orca_pop", section: "Orca", title: "Pod population dynamics",
    tex: "dN/dt = N × b × S_calf × (1-alleePenalty) - N × (m_base + σ_stress×0.015 + σ_starvation×0.005 + σ_strike + allee_boost + σ_inbreeding + σ_BC) + ε_demo",
    desc: "Per-pod: deterministic births × calf survival × Allee factor - deaths from base mortality + stress + starvation + ship strike + Allee boost + inbreeding depression (0.001/qtr in simulation — see audit entry 61 sub-i case (c) grounding gap; Lacy et al. 2017 model projection Ne ≈ 27 + Ford M.J. et al. 2011 J. Hered. 102:537-553 genetic Ne) + body condition mortality + demographic stochasticity noise (ε_demo). Calf survival uses effective prey (after vessel foraging loss of up to 22%, Williams R. et al. 2006). Demographic noise: zero-mean perturbation ε ~ 0.12 × √N × z, where z is an Irwin-Hall normal approximation from seeded PRNG. At N=74, noise SD ≈ 1.0 individual/quarter. Baseline ≈ 74 stable (births ≈ deaths). Green → recovery via reduced noise → lower foraging loss. Collapse → extinction via compounding stressors + amplified stochastic risk.",
    params: [{ k: "b_J", v: 0.045, u: "yr⁻¹", desc: "J Pod birth rate" }, { k: "b_K", v: 0.040, u: "yr⁻¹", desc: "K Pod birth rate" }, { k: "m_base", v: 0.025, u: "yr⁻¹", desc: "Base mortality (all pods)" }, { k: "S_calf_base", v: 0.55, u: "", desc: "Base calf survival (maternal care)" }, { k: "σ_inbreeding", v: 0.002, u: "qtr⁻¹", desc: "Inbreeding depression (Ne≈25-35; Lacy 2017 proj. + Ford M.J. 2011 genetic)" }, { k: "forage_loss_max", v: 0.25, u: "", desc: "Max vessel foraging efficiency loss" }, { k: "ε_scale", v: 0.12, u: "", desc: "Demographic noise amplitude (×√N)" }] },
  { id: "orca_allee", section: "Orca", title: "Allee effect (functional feedback)",
    tex: "mort_boost = 0.06 if N<5; (10-N)/10×0.04 if N<10. birth_penalty = 0.9 if N<5; (10-N)/10×0.5 if N<10; (18-N)/18×0.12 if N<18",
    desc: "Small populations face accelerating decline from inbreeding depression, mate-finding difficulty, and loss of matrilineal foraging knowledge (cultural transmission failure). Below 10: mortality increases up to +4%/qtr, births suppressed up to 50%. Below 5: functionally extinct — 90% birth suppression, +6%/qtr mortality boost. Pods can reach zero (true extinction). No artificial population floor.",
    params: [{ k: "threshold_critical", v: 10, u: "individuals", desc: "Critical Allee threshold" }, { k: "threshold_functional", v: 5, u: "individuals", desc: "Functional extinction threshold" }] },
  { id: "enso_markov", section: "Ocean Forcing", title: "ENSO Markov chain",
    tex: "P(state_t+1 | state_t) = T[state_t][state_t+1]",
    desc: "5-state chain: Strong La Niña → Weak La Niña → Neutral → Weak El Niño → Strong El Niño. ~35-42% persistence, mean-reverting toward Neutral",
    params: [{ k: "P(persist|neutral)", v: 0.40, u: "", desc: "Neutral self-transition" }, { k: "P(persist|StrongEN)", v: 0.42, u: "", desc: "Strong El Niño persistence" }] },
  { id: "climate_sst", section: "Climate", title: "SSP warming curves",
    tex: "SST(t) = SST_base + Σ r(y) for y=0..t",
    desc: "Piecewise integration of SSP-dependent warming rates",
    params: [{ k: "r_ssp126", v: "0.012×(1-t/60)", u: "°C/yr", desc: "SSP1-2.6 (decelerating)" }, { k: "r_ssp245", v: 0.018, u: "°C/yr", desc: "SSP2-4.5 (constant)" }, { k: "r_ssp585", v: "0.018+t×0.0004", u: "°C/yr", desc: "SSP5-8.5 (accelerating)" }] },
  { id: "flushing", section: "Marine", title: "Basin flushing",
    tex: "F = 1 - exp(-0.693 / τ_half × 91.25 × dt)",
    desc: "Exponential flushing per quarter. Seasonal: Hood Canal flushes slower in winter (increased stratification); others faster",
    params: [{ k: "τ_georgia", v: 240, u: "days", desc: "Georgia Strait half-life" }, { k: "τ_hoodCanal", v: 175, u: "days", desc: "Hood Canal half-life" }, { k: "τ_sanjuan", v: 15, u: "days", desc: "San Juan half-life" }] },
  { id: "mhw_trigger", section: "Marine", title: "Marine heat wave probability",
    tex: "P(MHW) = 0.02 + SST_delta × 0.03 per quarter",
    desc: "Stochastic trigger: once active, persists 4-12 quarters with +2-4°C SST anomaly. Cascades: kelp mortality >15°C, salmon ocean survival crash, HAB intensification, DO depression via reduced solubility + stratification. Cooldown 4 quarters post-event.",
    params: [{ k: "P_base", v: 0.02, u: "qtr⁻¹", desc: "Baseline probability" }, { k: "k_sst", v: 0.03, u: "qtr⁻¹/°C", desc: "SST sensitivity" }, { k: "dur_range", v: "4-12", u: "quarters", desc: "Duration range" }, { k: "SST_anom", v: "2-4", u: "°C", desc: "SST anomaly range" }] },
  { id: "eelgrass_hysteresis", section: "Ecosystem", title: "Eelgrass hysteresis / slow recovery",
    tex: "dE/dt = -0.15×(E-E_target) if declining; +r_eff×(E_target-E) if recovering; r_eff = 0.02×(E/0.3)³ if E<0.3",
    desc: "Root system establishment (0-1) declines rapidly under stress (turbidity, MHW, contamination) at 0.15/yr but recovers at only 0.02/yr. Below 0.3: regime shift — seedbank depleted, recovery rate collapses cubically toward zero. Creates irreversibility on management timescales.",
    params: [{ k: "r_decline", v: 0.15, u: "yr⁻¹", desc: "Decline rate" }, { k: "r_recover", v: 0.02, u: "yr⁻¹", desc: "Recovery rate (favorable)" }, { k: "threshold", v: 0.3, u: "", desc: "Regime shift threshold" }] },
  { id: "eelgrass_restore", section: "Ecosystem", title: "Eelgrass restoration (nature-based solution)",
    tex: "r_eff = r_base + effort × 0.08; E_target += effort × 0.15 × 0.2",
    desc: "Active restoration via shoot transplanting and seed broadcasting. Boosts recovery rate up to 5× (0.02 → 0.10/yr at max effort). Restored beds trap sediment, reducing effective turbidity by up to 15%. Cascading benefits: eelgrass ↑ → herring spawning habitat ↑ → salmon prey ↑ → orca recovery. Also: crab juvenile habitat ↑, coastal erosion ↓ → property values ↑. Inspired by EU DTO nature-based solutions what-if framework (EDITO-Model Lab Wadden Sea seagrass demonstrator). 8-year implementation timeline reflects real restoration lead times.",
    params: [{ k: "r_boost_max", v: 0.08, u: "yr⁻¹", desc: "Max recovery rate boost at 100%" }, { k: "turb_reduction", v: 0.15, u: "", desc: "Max turbidity reduction from sediment trapping" }, { k: "cost", v: 95, u: "$M", desc: "Implementation cost" }] },
  { id: "green_crab", section: "Ecosystem", title: "Invasive green crab population",
    tex: "dC/dt = r × f(SST) × C × (1 - C/K(SST)) - removal × C × 0.2",
    desc: "Logistic growth with SST-dependent carrying capacity. Optimal 12-20°C, zero below 8°C. MHW boosts growth +40%. Damages eelgrass roots (up to 25% suppression), preys on juvenile bivalves (15% fisheries penalty), reduces native biodiversity. First detected 2019 in inner Salish Sea.",
    params: [{ k: "r_base", v: 0.15, u: "yr⁻¹", desc: "Base growth rate" }, { k: "T_opt", v: "12-20", u: "°C", desc: "Optimal SST range" }, { k: "T_min", v: 8, u: "°C", desc: "Minimum viable SST" }, { k: "removal_max", v: 0.2, u: "qtr⁻¹", desc: "Max removal rate at 100% effort" }] },
  { id: "snowpack_glacial", section: "Watershed", title: "Snowpack & glacial mass balance",
    tex: "dS/dt = P×f_snow - S×melt(T); dG/dt = -0.008×max(0,SST_Δ)×(1+f_rain×0.3)",
    desc: "Snowpack accumulates in winter (snow fraction depends on mountain temperature), releases in spring. Glacial mass irreversibly declines under warming. Peak water: glacial melt initially boosts flow, then crashes when glacier is gone. Fraser freshet driven by snowmelt pulse. Snow-rain transition increases winter flooding. Stream temperature rises as snowmelt cooling is lost.",
    params: [{ k: "S_base", v: 180, u: "mm SWE", desc: "Baseline snowpack" }, { k: "G_base", v: 1.0, u: "fraction", desc: "2026 glacial mass" }, { k: "melt_coeff", v: 0.008, u: "°C⁻¹ yr⁻¹", desc: "Glacial melt rate" }, { k: "T_snow", v: "0-4", u: "°C", desc: "Snow-rain transition range" }] },
  { id: "omega_aragonite", section: "Marine", title: "Aragonite saturation state",
    tex: "Ω_arag = 2.5 × 10^(pH-8.1) × (sal/30) / (1+(SST-10)×0.01) - upwelling_penalty",
    desc: "Simplified carbonate chemistry. Ω > 1.5 = healthy for shellfish; Ω 1.0-1.5 = stressed larvae; Ω < 1.0 = shell dissolution threshold. Upwelling brings corrosive deep water (strongest in San Juan basin), modulated by ENSO (La Niña enhances). PNW shellfish industry ($100M+) depends on Ω staying above 1.0.",
    params: [{ k: "Ω_healthy", v: 1.5, u: "", desc: "Healthy threshold" }, { k: "Ω_dissolution", v: 1.0, u: "", desc: "Shell dissolution threshold" }, { k: "upwell_sanjuan", v: 0.4, u: "", desc: "San Juan upwelling penalty" }] },
  { id: "tidal_energy", section: "Marine", title: "Tidal energy extraction tradeoff",
    tex: "E_mix = E_tidal × (1 - extraction/100 × 0.15); stratification += extraction × 0.075",
    desc: "Extracting tidal current energy reduces vertical mixing → stronger stratification → Hood Canal DO depression. Basin-specific flushing slowdown: San Juan +20%, Hood Canal +12%, Main Basin +5% at max extraction. Benefit: 5% CO₂ acidification rate reduction from clean energy (decades-scale). Creates genuine policy dilemma: immediate hypoxia cost vs. long-term acidification benefit.",
    params: [{ k: "E_max", v: 100, u: "MW", desc: "Maximum extraction" }, { k: "mix_loss", v: 0.15, u: "", desc: "Mixing fraction lost at max" }, { k: "acid_benefit", v: 0.05, u: "", desc: "Acidification rate reduction at max" }] },
  { id: "dungeness_crab", section: "Ecosystem", title: "Dungeness crab population",
    tex: "dC/dt = r×K_eff×C×(1-C/K_eff) - (DO_mort + shell_stress + GC_pred + spill)×C - harvest",
    desc: "Logistic growth with effective carrying capacity K_eff = f(eelgrass, Ω_aragonite, DO). DO < 2 mg/L → 30% mortality; Ω < 1.0 → 25% shell stress. Green crab predation on juveniles up to 20%. Commercial harvest above minimum stock threshold (0.3). Growth rate 0.18 (increased from 0.12 in v5.4 to prevent unrealistic 35% decline — Dungeness are prolific, ~2.5M eggs/female). ~$250M/yr PNW fishery.",
    params: [{ k: "r_base", v: 0.18, u: "yr⁻¹", desc: "Base growth rate" }, { k: "DO_lethal", v: 2.0, u: "mg/L", desc: "Lethal DO threshold" }, { k: "min_stock", v: 0.3, u: "", desc: "Minimum stock for harvest" }] },
  { id: "sediment_oxygen_demand", section: "Marine", title: "Sediment oxygen demand (SOD)",
    tex: "dB/dt = detSink×0.4 - B×0.008; SOD = B × 0.003 × (50/V_basin)",
    desc: "Benthic organic load accumulates from sinking detritus (40% reaches bottom). Very slow decay (~3.2%/yr). SOD consumes bottom-water DO proportional to load and inversely to basin volume. Creates hysteresis: decades of accumulation mean cleaning up inputs doesn't immediately fix hypoxia. Hood Canal most vulnerable (small volume, slow flushing, high initial load). Dredging releases stored nutrients as a pulse.",
    params: [{ k: "k_accum", v: 0.4, u: "", desc: "Fraction of sinking detritus reaching benthos" }, { k: "k_decay", v: 0.008, u: "qtr⁻¹", desc: "Benthic remineralization rate" }, { k: "k_SOD", v: 0.003, u: "mg O₂/unit/qtr", desc: "SOD rate coefficient" }] },
  { id: "green_infrastructure", section: "Urban", title: "Green infrastructure effects",
    tex: "eI_eff = eI × (1 - GI × 0.6); N_urban *= (1 - GI × 0.4); CSO *= (1 - GI × 0.5)",
    desc: "Rain gardens, bioswales, permeable pavement, green roofs. Reduces effective impervious surface by up to 30% (at 50% coverage), first-flush nitrogen by up to 20%, and CSO frequency by up to 25%. Co-benefits: improved equity score, urban cooling, habitat corridors.",
    params: [{ k: "GI_max", v: 50, u: "%", desc: "Maximum coverage" }, { k: "imperv_reduction", v: 0.6, u: "", desc: "Impervious reduction factor" }, { k: "N_reduction", v: 0.4, u: "", desc: "Nitrogen filtration factor" }] },
  { id: "extreme_event_freq", section: "Climate", title: "Extreme event frequency shift",
    tex: "P(AR) = 0.008 + SST_Δ × 0.00056/qtr; P(wildfire) = 0.005 + drought × 0.01; P(storm) = 0.006 + SST_Δ × 0.004",
    desc: "Stochastic disaster triggering modulated by climate state. Atmospheric rivers increase 7%/°C (Espinoza et al. 2018). Wildfire probability driven by drought stress + warming. Storms intensify with SST. Creates accelerating compound risk under high SSP pathways. Events auto-trigger during simulation — no manual button needed.",
    params: [{ k: "AR_base", v: 0.008, u: "qtr⁻¹", desc: "Baseline atmospheric river probability" }, { k: "AR_sensitivity", v: 0.07, u: "/°C", desc: "AR probability increase per °C" }, { k: "WF_drought", v: 0.01, u: "qtr⁻¹", desc: "Wildfire probability from drought" }] },
  { id: "burn_scar", section: "Watershed", title: "Post-fire burn scar persistence",
    tex: "scar_active = scar_area × exp(-age/3); runoff ×= 1+scar×1.5; sediment ×= 1+scar×3",
    desc: "Wildfire creates hydrophobic soil that persists 2-5 years (e-folding ~3 years). Amplifies runoff ×2.5 and sediment ×4 at peak. Ash releases nitrogen pulse for 1-2 years → HAB risk. Burn scar + atmospheric river = catastrophic debris flows with 6000+ t/day sediment surge.",
    params: [{ k: "τ_recovery", v: 3, u: "years", desc: "E-folding recovery time" }, { k: "runoff_mult", v: 2.5, u: "×", desc: "Peak runoff multiplier" }, { k: "sediment_mult", v: 4.0, u: "×", desc: "Peak sediment multiplier" }] },
  { id: "groundwater", section: "Watershed", title: "Groundwater table dynamics",
    tex: "dGW/dt = recharge(P,imperv) - extraction(pop) - baseflow(GW); intrusion = SLR/80 + (1-GW)×0.3",
    desc: "Aquifer recharge from infiltrating precipitation (reduced by impervious surface), depleted by municipal extraction and baseflow discharge. Low groundwater + high SLR = saltwater intrusion through aquifer (distinct from surface). Over-extraction causes subsidence that amplifies effective SLR in delta areas.",
    params: [{ k: "GW_base", v: 0.7, u: "", desc: "Baseline level (0-1)" }, { k: "extraction", v: 0.12, u: "", desc: "Fraction of demand from groundwater" }, { k: "baseflow", v: 0.08, u: "qtr⁻¹", desc: "Darcy discharge rate" }] },
  { id: "seabirds", section: "Ecosystem", title: "Seabird population index",
    tex: "S = forage×0.5 + visibility×0.25 + nesting×0.25 - spill×0.7",
    desc: "Marbled murrelet, rhinoceros auklet, pigeon guillemot. Depend on herring/forage fish, water clarity for diving, and protected nesting habitat. Oil spills cause immediate mass mortality. Feed into biodiversity index.",
    params: [{ k: "forage_w", v: 0.5, u: "", desc: "Forage fish weight" }, { k: "spill_mort", v: 0.7, u: "", desc: "Oil spill mortality factor" }] },
  { id: "pinnipeds", section: "Ecosystem", title: "Pinniped population dynamics",
    tex: "dP/dt = trend × (1 - P/K) × dt; predation = (P/40000 - 1) × 0.08",
    desc: "Harbor seals and Steller sea lions growing logistically toward ~65,000 carrying capacity since MMPA 1972. Concentrate at river mouths, consuming juvenile and returning adult salmon (0-25% additional mortality). Also compete with Southern Resident orca for Chinook prey. Predation disaggregated into pinniped + avian components with compensatory mortality parameter.",
    params: [{ k: "K", v: 65000, u: "individuals", desc: "Carrying capacity" }, { k: "pred_scale", v: 0.08, u: "", desc: "Predation scaling factor" }] },
  { id: "vessel_speed", section: "Port", title: "Vessel speed reduction zones",
    tex: "noise × (1 - zone×0.5); strike_risk × (1 - zone×0.8); fuel_cost × (1 + zone×0.12)",
    desc: "Mandatory slowdowns in Haro/Rosario Strait. Reduces underwater noise ~6dB (50% perceived), ship strike risk ~80%. But increases transit time and fuel costs 10-15%. Creates cost-per-orca-saved metric.",
    params: [{ k: "noise_reduction", v: 0.5, u: "", desc: "Noise reduction at full implementation" }, { k: "transit_cost", v: 0.12, u: "", desc: "Fuel/time cost penalty" }] },
  { id: "alt_fuel", section: "Port", title: "LNG/alternative fuel transition",
    tex: "emissions × (1 - altFuel×0.25); air_quality += altFuel×0.15",
    desc: "Transition from heavy fuel oil (HFO) to LNG/H₂: 25% less CO₂ (net of methane slip), 90% less SOx, near-zero particulate. Improves local air quality. Infrastructure cost substantial.",
    params: [{ k: "CO2_reduction", v: 0.25, u: "", desc: "Net CO₂ reduction" }, { k: "AQ_bonus", v: 0.15, u: "", desc: "Air quality improvement" }] },
  { id: "ej_disaggregation", section: "Urban", title: "Environmental justice spatial disaggregation",
    tex: "EQ_industrial = f(pollution×0.40, flood×0.15, GI×0.8); EQ_waterfront = f(flood×0.35, pollution×0.15)",
    desc: "Same equity components weighted differently by community type. Near-industrial (Duwamish Valley): pollution burden dominates. Waterfront: flood exposure dominates. Suburban: housing/job access. Green infrastructure in Duwamish shows different impacts than system-wide policies.",
    params: [{ k: "industrial_pollution_w", v: 0.40, u: "", desc: "Pollution weight (industrial)" }, { k: "waterfront_flood_w", v: 0.35, u: "", desc: "Flood weight (waterfront)" }] },
  { id: "public_health", section: "Urban", title: "Public health outcome endpoints",
    tex: "respiratory = f(air,fire,emissions); waterborne = f(CSO,treatment); seafood = f(spill,contam); mental = f(flood,jobs,noise)",
    desc: "Four derived health metrics translating environmental conditions to quantifiable health costs. Respiratory illness from poor air quality and wildfire smoke. Waterborne illness from CSO frequency. Seafood contamination risk from PCBs/PFAS. Mental health impacts from flood displacement, job loss, and chronic noise.",
    params: [{ k: "CSO_waterborne", v: 0.4, u: "", desc: "CSO → waterborne illness weight" }, { k: "fire_respiratory", v: 0.3, u: "", desc: "Wildfire → respiratory weight" }] },
  { id: "ag_nutrient_mgmt", section: "Watershed", title: "Agricultural nutrient management",
    tex: "N_ag = ag_area × loading × (1 - mgmt × 0.6)",
    desc: "Cover crops, buffer strips, and precision fertilizer reduce agricultural nitrogen export by up to 60% at full implementation. Directly reduces HAB risk and shellfish closures downstream.",
    params: [{ k: "reduction_max", v: 0.6, u: "", desc: "Max nitrogen reduction at 100% mgmt" }] },
  { id: "ballast_invasive", section: "Port", title: "Ballast water invasive pressure",
    tex: "invasive = vessel_density × 0.015 × (1 - treatment × 0.85)",
    desc: "Vessel ballast discharge introduces non-native species. Treatment compliance removes 85% of risk. Accumulating invasive pressure degrades native biodiversity.",
    params: [{ k: "treatment_eff", v: 0.85, u: "", desc: "Treatment effectiveness" }] },
  { id: "sgd_nutrients", section: "Marine", title: "Submarine groundwater discharge",
    tex: "SGD_N = basin_factor × urban_fraction × 1.5",
    desc: "Hidden nearshore nutrient source from septic systems and coastal development. Bypasses rivers and riparian buffers. Most significant in enclosed embayments (Hood Canal factor=0.8, South Sound=0.6).",
    params: [{ k: "HC_factor", v: 0.8, u: "", desc: "Hood Canal SGD factor" }] },
  { id: "salmon_predation", section: "Ecosystem", title: "Salmon predation disaggregation",
    tex: "effective_pred = (pinniped + avian) × (1 - compensatory × 0.4)",
    desc: "Total predation = pinniped + avian (Caspian terns, cormorants). Compensatory mortality: if high, reducing one predator just means other mortality fills the gap — fishing moratoriums less effective. Key policy insight: if mortality is compensatory, culling pinnipeds doesn't help salmon.",
    params: [{ k: "avian_base", v: 0.05, u: "", desc: "Avian predation rate" }, { k: "comp_reduction", v: 0.4, u: "", desc: "Compensatory overlap factor" }] },
  { id: "whale_watching", section: "Port", title: "Whale watching vessel disturbance",
    tex: "disturbance = intensity × orca_presence × (1 - protection × 0.5)",
    desc: "Whale watching vessels follow orca pods, creating localized acute noise. Reduces foraging efficiency 18-25%. Self-limiting: depends on orca being visible. Orca protection level enforces setback distances.",
    params: [{ k: "foraging_reduction", v: 0.20, u: "", desc: "Foraging efficiency reduction" }] },
  { id: "cruise_ships", section: "Port", title: "Cruise ship traffic",
    tex: "cruise_activity = calls/300 × seasonal(May-Oct); wastewater = activity × 600kL/day",
    desc: "Seasonal May-October traffic generating large wastewater volumes (3000+ passengers × 200L/day), tourism revenue, acoustic and air quality impacts. Summer pollution peak coincides with HAB season and salmon migration.",
    params: [{ k: "max_calls", v: 300, u: "/yr", desc: "Maximum annual calls" }, { k: "ww_per_call", v: 600000, u: "L/day", desc: "Wastewater per active call" }] },
  { id: "property_value", section: "Urban", title: "Coastal property value index",
    tex: "PV = 0.7 + amenity×0.3 - flood×0.35 - water_stress×0.1 - (1-AQ)×0.15",
    desc: "Property values respond to flood risk, water quality, environmental amenity (orca sightings, beach access, air quality). Property values affect tax revenue which funds infrastructure maintenance — creating a feedback loop where environmental degradation erodes the budget to address it.",
    params: [{ k: "flood_weight", v: 0.35, u: "", desc: "Flood risk sensitivity" }] },
  { id: "housing_density", section: "Urban", title: "Housing density / urban form",
    tex: "imperv_mod = 1 - density×0.25; emissions_mod = 1 - density×0.20; ww_conc = 1 + density×0.15",
    desc: "High density (vertical growth): lower per-capita impervious (-25%), lower emissions (-20%), but higher wastewater concentration (+15%). Low density (sprawl): higher per-capita footprint. High density + green infrastructure = best environmental outcome.",
    params: [{ k: "imperv_reduction", v: 0.25, u: "", desc: "Per-capita impervious reduction" }, { k: "emission_reduction", v: 0.20, u: "", desc: "Per-capita emission reduction" }] },
  { id: "indigenous_perspectives", section: "Ecosystem", title: "Indigenous perspectives & fishing rights",
    tex: "treaty = ceremonial×0.2 + food×0.25 + shellfish×0.15 + (1-contam)×0.1 + keystone×0.15 + (1-climate)×0.15",
    desc: "Six distinct pathways of Indigenous environmental vulnerability: (1) Ceremonial salmon access — First Salmon ceremonies require specific chinook at specific seasonal timing, disrupted by climate phenology shifts; (2) Traditional food security — salmon + shellfish + herring + crab, weakest link matters most; (3) Shellfish harvest access — HAB closures, acidification, and contamination independently restrict gathering on usual and accustomed beds; (4) Contamination advisory burden — PCBs/PFAS force choice between cultural practice and health; (5) Cultural keystone species — orca as relatives in Coast Salish worldview, salmon as returning gifts, cedar/eelgrass as marine habitat anchors; (6) Climate displacement — species range shifts, run timing shifts, SLR inundation of fishing areas erode millennia of place-based knowledge. Co-management (Boldt Decision) provides resilience through TEK integration.",
    params: [{ k: "coMgmt_bonus", v: 0.15, u: "", desc: "Max TEK resilience boost" }, { k: "timing_shift", v: 0.04, u: "/°C", desc: "Run timing disruption per °C" }, { k: "min_food_weight", v: 0.4, u: "", desc: "Weakest-link weighting in food security" }] },
  { id: "infra_decay", section: "Urban", title: "Infrastructure decay feedback loop",
    tex: "dD/dt = (PV < 0.7) ? (0.7-PV)×0.04 : -(PV-0.7)×0.015; IAF_eff = IAF_slider + D",
    desc: "Self-reinforcing degradation spiral: low property values reduce tax revenue, starving infrastructure maintenance. Infrastructure ages faster → more CSO + flooding → property values drop further. Decay accelerates 3× faster than recovery (asymmetric by design — it takes longer to rebuild infrastructure than to let it deteriorate). Maximum accumulated decay capped at 40% additional aging. Breaking the spiral requires either direct infrastructure investment (policy) or restoring property values through environmental amenity improvement.",
    params: [{ k: "decay_rate", v: 0.04, u: "qtr⁻¹", desc: "Max decay rate at PV=0.3" }, { k: "recovery_rate", v: 0.015, u: "qtr⁻¹", desc: "Max recovery rate when funded" }, { k: "max_decay", v: 0.40, u: "", desc: "Max accumulated infra decay" }] },
];

export {
  CALIBRATION_TARGETS,
  DATA_SCHEMA,
  CITIZEN_SCIENCE_SCHEMA,
  citizenScienceToObservations,
  exportCitizenScienceTemplate,
  exportObservationSchema,
  nudgeBasins,
  nudgeMarineState,
  runSensitivity,
  runBatchSweep,
  computeMassBalance,
  MODEL_EQUATIONS,
};
