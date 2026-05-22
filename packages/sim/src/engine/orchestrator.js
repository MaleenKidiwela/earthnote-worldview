import { cl, climateDrift, oceanForcing, computeMHW, resetEnsoCache, setEnsoCache, _ensoCache, seededRandom } from './utils.js';
import { initBasinState } from './basins.js';
import { initSalmonState, initOrcaState, initPopState } from './species-data.js';
import { computeWatershed } from './computeWatershed.js';
import { computeMarineBasins } from './computeMarineBasins.js';
import { computePort } from './computePort.js';
import { computeUrban } from './computeUrban.js';
import { computeEcosystem } from './computeEcosystem.js';
import { computeEnergy } from './computeEnergy.js';
import { computeEcosystemServices } from './computeEcosystemServices.js';
import { computeFraser } from './computeFraser.js';
import { computeClimate } from './computeClimate.js';
import { computePacific } from './computePacific.js';
import { computeBiogeochem } from './computeBiogeochem.js';
import { computePSWatersheds } from './computePSWatersheds.js';
import { computeNearshore } from './computeNearshore.js';
import { computeFisheries } from './computeFisheries.js';
import { computeTribal } from './computeTribal.js';
import { computePublicHealth } from './computePublicHealth.js';
import { computeInfrastructure } from './computeInfrastructure.js';
import { nudgeValue } from './dataPipeline.js';
import { assimilateObservations, prepareObservations } from './dataAssimilation.js';
import { computeMacroEconomy } from './macroEconomy.js';
import { computePortOperations } from './portOperations.js';
import { simulateCascadiaM9, applyM9Recovery,
  computeM9MacroShock, computeM9LaborEffects, computeM9RouteShares,
  computeSegmentRecovery, computeFleetDamage, computeTsunamiHabitatDamage,
  computeAquacultureDamage, computeContaminationMobilization,
  computeTribalSiteDamage, computeM9PublicHealthImpact,
  computeSensorDegradation, computeAllTerminalDamage } from './cascadiaEvent.js';
import { TERMINALS } from '../config/portSystem.js';
import { computeShorelineCoupling } from './shorelineCoupling.js';
import { SHORE_ASSETS, SHORELINE_STATS } from '../config/shorelineRegistry.js';
import { computeContaminants } from './contaminants.js';
import { computeChokepointStatus, computeMilitaryReadiness } from './chokepoint.js';

function runOrchestrator(allParams, shocks, yf, prevState, dt, yearsSince2026, jitter, opts) {
  dt=dt||1;
  // SSP pathway selection: 0=SSP1-2.6, 1=SSP2-4.5, 2=SSP5-8.5
  var sspKeys = ["ssp126","ssp245","ssp585"];
  var sspKey = sspKeys[Math.round(cl(allParams.marine.sspPathway||1, 0, 2))] || "ssp245";
  var climD=climateDrift(yearsSince2026||0, sspKey);
  var oF = oceanForcing(yearsSince2026||0);
  var prev=prevState||{}, prevB=prev.basins||initBasinState(), prevPop=prev.pop||initPopState(allParams.urban.population), prevWS=prev.watershed||null, prevFraser=prev.fraser||null, prevClimate=prev.climate||null, prevPacific=prev.pacific||null, prevBGC=prev.biogeochem||null, prevPSW=prev.psWatersheds||null, prevNS=prev.nearshore||null, prevFish=prev.fisheries||null, prevTribal=prev.tribal||null, prevPH=prev.publicHealth||null, prevInfra=prev.infrastructure||null;

  // ── SEA LEVEL RISE ACCUMULATION ──
  // Tiered SLR model with Antarctic, Greenland, and thermal expansion components
  // yearsElapsed: for SLR calculations, clamp to 0 (no negative SLR accumulation)
  // The negative yearsSince2026 already affects climateDrift's sstDelta (cooler SST pre-2026)
  var yearsElapsed = Math.max(yearsSince2026 !== undefined ? yearsSince2026 : 0, 0);
  var slrScenario = allParams.marine.slrScenario !== undefined ? allParams.marine.slrScenario : 1;
  var greenlandScenario = allParams.marine.greenlandScenario !== undefined ? allParams.marine.greenlandScenario : 1;
  var prevSLR = prev.cumulativeSLR !== undefined ? prev.cumulativeSLR : 0;

  // ── THWAITES TIPPING POINT ──
  // If warming exceeds 2.5C and Thwaites hasn't already collapsed,
  // automatically trigger collapse (irreversible tipping point)
  var thwaitesTriggered = prev.thwaitesTriggered ? true : false;
  if (!thwaitesTriggered && climD.sstDelta > 2.5 && slrScenario < 3) {
    slrScenario = 3;
    thwaitesTriggered = true;
  }
  // Disaster button override: if thwaites_collapse shock is active, force scenario 3
  if (shocks.slrScenarioOverride && shocks.slrScenarioOverride >= 3 && slrScenario < 3) {
    slrScenario = 3;
    thwaitesTriggered = true;
  }

  // Antarctic contribution (mm/yr)
  var antarcticRate;
  if (slrScenario === 0) {
    antarcticRate = 1.5;
  } else if (slrScenario === 1) {
    antarcticRate = 1.5 + 2.5 * (yearsElapsed / 75);
  } else if (slrScenario === 2) {
    antarcticRate = 1.5 + 8 * Math.pow(yearsElapsed / 75, 1.3);
  } else if (slrScenario === 3) {
    var collapseYr = 10;
    if (yearsElapsed < collapseYr) {
      antarcticRate = 1.5 + 1.5 * (yearsElapsed / collapseYr);
    } else {
      antarcticRate = 3.0 + 15 * (1 - Math.exp(-(yearsElapsed - collapseYr) / 25));
    }
  } else {
    antarcticRate = 1.5 + 25 * Math.pow(yearsElapsed / 75, 1.5);
  }

  // Greenland contribution (mm/yr)
  var greenlandRate;
  if (greenlandScenario === 0) { greenlandRate = 0.5; }
  else if (greenlandScenario === 1) { greenlandRate = 1.0 + 2 * (yearsElapsed / 75); }
  else if (greenlandScenario === 2) { greenlandRate = 2.0 + 6 * (yearsElapsed / 75); }
  else { greenlandRate = 5.0 + 10 * Math.pow(yearsElapsed / 75, 1.3); }

  // Thermal expansion (mm/yr) - scales with SSP pathway
  var thermalRate = 1.5 + (climD.sstDelta !== undefined ? climD.sstDelta : 0) * 0.5;

  // Total SLR rate
  var totalSLRRate = antarcticRate + greenlandRate + thermalRate;
  // Northern hemisphere gets ~10-20% more than global average (gravitational self-attraction)
  var nhFactor = 1.15;
  var slrRateMmYr = totalSLRRate * nhFactor;
  var slrIncrement = (slrRateMmYr / 1000) / 4; // m per quarter
  var cumulativeSLR = prevSLR + slrIncrement;

  // Override climateDrift's slrCm with the new accumulating SLR for downstream consumers
  climD.slrCm = cumulativeSLR * 100; // convert m to cm
  climD.effectiveDeltaSLR = climD.slrCm + (yearsElapsed * 0.20); // delta subsidence
  climD.floodRiskMult = 1 + climD.slrCm / 50;
  climD.deltaFloodMult = 1 + climD.effectiveDeltaSLR / 40;
  climD.saltwaterIntrusion = cl(climD.effectiveDeltaSLR / 70, 0, 1);
  climD.csoSlrPenalty = climD.slrCm * 0.04;

  // ── ENSO AMPLITUDE COUPLING ──
  // Cai et al. 2023: ~40% ENSO amplitude increase per 2C warming
  var ensoAmplification = allParams.marine.ensoAmplification !== undefined ? allParams.marine.ensoAmplification : 1.0;
  if (thwaitesTriggered) { ensoAmplification = cl(ensoAmplification + 0.3, 1.0, 2.0); }
  var warmingEnsoBoost = 1.0 + 0.2 * (climD.sstDelta !== undefined ? climD.sstDelta : 0);
  var effectiveEnsoAmp = ensoAmplification * warmingEnsoBoost;
  // Amplify ENSO anomaly in ocean forcing
  if (oF) {
    oF.enso = oF.enso * effectiveEnsoAmp;
    oF.sstAnomaly = oF.enso * 0.6 + oF.pdo * 0.4;
    oF.precipMult = 1 + oF.enso * -0.12 + oF.pdo * -0.05;
    oF.productivityMult = 1 + oF.enso * -0.15 + oF.pdo * -0.10;
    oF.oceanSurvivalMod = oF.enso * -0.05 + oF.pdo * -0.04;
  }
  var prevMHW = prev.mhw || null;
  var prevEnergy = prev.energy || null;
  // Bundle all ecosystem species state into one object — matches computeEcosystem's prevEco param.
  // To add a new species: add field here, in curEco carry-forward, and in _state return.
  var prevEco = {
    salmon: prev.salmon || initSalmonState(),
    orca: prev.orca || initOrcaState(),
    pinniped: prev.pinniped || null,
    eelgrassEstab: prev.eelgrassEstab !== undefined ? prev.eelgrassEstab : null,
    greenCrab: prev.greenCrab !== undefined ? prev.greenCrab : null,
    dungenessCrab: prev.dungenessCrab !== undefined ? prev.dungenessCrab : null,
    oyster: prev.oyster || null,
    forageFish: prev.forageFish || null,
    rockfish: prev.rockfish !== undefined ? prev.rockfish : null,
    urchin: prev.urchin !== undefined ? prev.urchin : null,
    geoduck: prev.geoduck !== undefined ? prev.geoduck : null,
    murrelet: prev.murrelet !== undefined ? prev.murrelet : null,
    humpback: prev.humpback !== undefined ? prev.humpback : null,
    seaOtter: prev.seaOtter !== undefined ? prev.seaOtter : null,
    jellyfish: prev.jellyfish !== undefined ? prev.jellyfish : null,
    lingcod: prev.lingcod !== undefined ? prev.lingcod : null,
    lamprey: prev.lamprey !== undefined ? prev.lamprey : null,
    porpoise: prev.porpoise !== undefined ? prev.porpoise : null,
    herring: prev.herring !== undefined ? prev.herring : null,
    microbialLoop: prev.microbialLoop !== undefined ? prev.microbialLoop : null,
    euphausiids: prev.euphausiids !== undefined ? prev.euphausiids : null,
    benthicInfauna: prev.benthicInfauna !== undefined ? prev.benthicInfauna : null,
    epibenthicCrust: prev.epibenthicCrust !== undefined ? prev.epibenthicCrust : null,
    epiphytes: prev.epiphytes !== undefined ? prev.epiphytes : null,
    bullKelp: prev.bullKelp !== undefined ? prev.bullKelp : null,
    octopus: prev.octopus !== undefined ? prev.octopus : null,
    cherryPointHerring: prev.cherryPointHerring !== undefined ? prev.cherryPointHerring : null,
    deepUrchin: prev.deepUrchin !== undefined ? prev.deepUrchin : null,
    sandWaveIntegrity: prev.sandWaveIntegrity !== undefined ? prev.sandWaveIntegrity : null,
    biggsOrca: prev.biggsOrca !== undefined ? prev.biggsOrca : null,
    pteropod: prev.pteropod !== undefined ? prev.pteropod : null,
    grayWhale: prev.grayWhale !== undefined ? prev.grayWhale : null,
    armoringFrac: prev.armoringFrac !== undefined ? prev.armoringFrac : null
  };

  // ── MARINE HEAT WAVE — quarterly stochastic event ──
  var mhw = computeMHW(yearsSince2026||0, yf, climD, prevMHW, _ensoCache.seed);

  // ── HISTORICAL FORCING OVERRIDE (hindcast mode) ──
  // When running against historical data (2010-2025), override the model's
  // internally-generated ENSO/PDO/SST/MHW with observed values.
  // This replaces the stochastic climate generation with real history.
  if (opts && opts.historicalForcing) {
    var hf = opts.historicalForcing;
    // Override ENSO index — replaces stochastic Markov chain with observed ONI
    if (hf.ensoOverride !== undefined && oF) {
      oF.enso = hf.ensoOverride;
    }
    // Override PDO index — replaces stochastic PDO with observed NCEI values
    if (hf.pdoOverride !== undefined && oF) {
      oF.pdo = hf.pdoOverride;
    }
    // Override SST anomaly — replaces SSP-driven warming with observed anomaly
    if (hf.sstAnomalyOverride !== undefined) {
      climD.sstDelta = hf.sstAnomalyOverride;
      if (oF) oF.sstAnomaly = hf.sstAnomalyOverride;
    }
    // Recompute derived ocean forcing fields from overridden ENSO/PDO
    if (oF && (hf.ensoOverride !== undefined || hf.pdoOverride !== undefined)) {
      oF.sstAnomaly = oF.enso * 0.6 + oF.pdo * 0.4;
      oF.precipMult = 1 + oF.enso * -0.12 + oF.pdo * -0.05;
      oF.productivityMult = 1 + oF.enso * -0.15 + oF.pdo * -0.10;
      oF.oceanSurvivalMod = oF.enso * -0.05 + oF.pdo * -0.04;
    }
    // Override MHW state — replaces stochastic MHW trigger with historical events
    // (The Blob 2014-2016, 2019 moderate MHW, 2021 Heat Dome)
    if (hf.mhwOverride) {
      mhw = hf.mhwOverride;
    }
    // Wind forcing override — affects vertical mixing → DO in marine basins
    // Higher wind → more mixing → higher deep DO (breaks stratification)
    if (hf.windSpeedOverride !== undefined) {
      // Store on oF so computeMarineBasins can read it
      if (oF) oF.windSpeed = hf.windSpeedOverride;
    }
    // Fraser basin precipitation override — drives discharge interannual variability
    // Multiplier on precipDelta: 1.0 = normal, 1.18 = wet year (2012), 0.79 = drought (2015)
    if (hf.fraserPrecipOverride !== undefined) {
      climD.precipDelta = (climD.precipDelta || 1) * hf.fraserPrecipOverride;
    }
    // Signal hindcast mode to downstream modules (suppresses stochastic processes
    // that would conflict with historical event forcing)
    climD._hindcastMode = true;
  }

  // Monte Carlo jitter: perturb parameters by ±jitter fraction
  var ap = allParams;
  if (jitter && jitter > 0) {
    ap = JSON.parse(JSON.stringify(allParams));
    var MC_SIG = { watershed:{precipitation:1.5,forestCover:0.5}, marine:{baselineTemperature:1.2,stratificationStrength:0.8}, ecosystem:{baselineBiodiversity:0.6,fishingPressure:0.5,hatcheryFraction:0.3} };
    function nRand() { var u1=Math.random(),u2=Math.random(); return Math.sqrt(-2*Math.log(u1||0.001))*Math.cos(2*Math.PI*u2); }
    Object.keys(ap).forEach(function(mod) {
      Object.keys(ap[mod]).forEach(function(pk) {
        if (typeof ap[mod][pk] === "number") {
          var sigma = (MC_SIG[mod] && MC_SIG[mod][pk]) || 0.4;
          ap[mod][pk] *= (1 + nRand() * jitter * sigma);
        }
      });
    });
  }

  // Trade volume override — drives port TEU interannual variability
  // Must come after ap is assigned (line above) and after jitter (which may deep-copy ap)
  // Deep copy ap.port to avoid mutating original params across quarters
  if (opts && opts.historicalForcing && opts.historicalForcing.tradeVolumeOverride !== undefined && ap.port) {
    ap = JSON.parse(JSON.stringify(ap));
    ap.port.containerThroughput = (ap.port.containerThroughput || 3500) * opts.historicalForcing.tradeVolumeOverride;
  }

  // ── MODULE ERROR ISOLATION ──
  // Wraps each compute module call so a thrown error in one module
  // doesn't crash the entire simulation. On error, returns previous
  // state with empty exports, logs the error for diagnostics.
  function safeCall(name, fn, fallback) {
    try { return fn(); }
    catch (e) {
      console.error('Salish Cousin: ' + name + ' threw — using fallback state.', e);
      return fallback;
    }
  }

  // ── SUB-QUARTERLY RESOLUTION ──
  var hasActiveDisaster = Object.values(shocks).some(function(v) { return v > 0.1; });
  var subSteps = hasActiveDisaster ? 4 : 1;
  var subDt = dt / subSteps;
  var subYfStep = 0.25 / (4 * subSteps);

  // ── CASCADIA M9 COUNTER — once per orchestrator call ──
  // m9Quarters tracks real-elapsed-quarters since the M9 event. Per
  // cascadiaEvent.js author intent (RECOVERY_TAU comment-justified as
  // "5-10 years," "10-20 years," etc.; the 80-quarter cutoff
  // comment-justified as "20 year recovery"), the counter must advance
  // in real-quarter units, not in orchestrator-invocation units.
  // Pre-fix wiring at orchestrator.js:374 + 701 had read AND write inside
  // the sub-step loop, so the counter advanced once per sub-step (4× when
  // subSteps=4 under active disaster) on top of monthly cadence (3
  // orchestrator calls per real quarter), totaling 12× advance per real
  // quarter while M9 active; recovery exponentials saturated in ~1.7
  // wall-time years instead of 20. Surfaced during Stage 2A.0 visual
  // verification when sim time 2027 Q1 (1.25 years post-event) showed
  // 98%/98%/98%/94% recovery quartiles. Fix: advance m9Quarters by `dt`
  // (quarter units; 1/3 at monthly cadence) once per orchestrator call,
  // with read+write outside the sub-step loop. simulateCascadiaM9 +
  // applyM9Recovery + the Stage 2A.0 helper-extension block remain inside
  // the sub-step loop and read m9Quarters as a stable value across
  // sub-steps within a single orchestrator call. cascadiaEvent.js function
  // bodies untouched per workstream scope guard.
  // Re-trigger semantics (design choice, Tier 1 audit Finding 2): M9 re-trigger
  // during recovery does NOT reset _m9QuartersSince. Practical reachability is
  // near-zero post-M9-propagation-Commit-2 — loadScenario fully resets state
  // (useSimulation.js:161) and the triggerDisaster path was deprecated for
  // cascadia_m9 at the Explorer earthquake card migration. Treated as design
  // choice: a second M9 within the recovery period continues the existing
  // trajectory rather than creating a fresh event.
  var m9Quarters = prev._m9QuartersSince !== undefined ? prev._m9QuartersSince : -1;
  var m9ActiveThisCall = shocks.cascadia_m9 > 0.1 || shocks.cascadia_megathrust > 0.1;
  if (m9ActiveThisCall) {
    if (m9Quarters < 0) m9Quarters = 0; // trigger anchor — first M9 call
    else m9Quarters += dt; // advance by dt (1/3 at monthly cadence)
  } else if (m9Quarters >= 0) {
    m9Quarters += dt; // recovery continues after shock decays below 0.1
  }
  var m9Prep = cl((ap.infrastructure ? (ap.infrastructure.i5MaintenanceInvestment || 50) : 50) / 100, 0, 1);

  var curB = prevB, curEco = prevEco, curPop = prevPop, curWS = prevWS, curEnergy = prevEnergy, curFraser = prevFraser, curClimate = prevClimate, curPacific = prevPacific, curBGC = prevBGC, curPSW = prevPSW, curNS = prevNS, curFish = prevFish, curTribal = prevTribal, curPH = prevPH, curInfra = prevInfra;
  var ws, po, ur, ma, ec, en, fr, clim, pac, bgc, psw, ns, fish, trb, ph, infra, c = prev.coupling || {};

  // ── CASCADIA M9 — runs once per orchestrator call (hoisted outside sub-step loop) ──
  // Counter fix-pass landed at 14cb769 moved m9Quarters increment outside the
  // loop. Tier 1 audit fix-pass extends the same pattern to the rest of the
  // M9 block: applyM9Recovery mutates curInfra + curEco IN-PLACE; running it
  // inside the sub-step loop caused 4× compounding under active disaster
  // (subSteps=4), invisible at display surfaces (which read m9Result.recovery
  // computed from the stable counter, not curInfra) but real for downstream
  // coupling chains where M9-mutated infrastructure/ecosystem state propagates
  // forward. The 11 Stage 2A.0 helpers are pure functions of stable inputs
  // (m9Quarters, climQuarter, m9Prep) — under previous wiring they computed
  // 4× per real quarter producing identical outputs (wasted work, Finding 4
  // from Tier 1 audit). Both classes resolved by hoisting once per orchestrator
  // call; same shape as today's earlier counter fix-pass. cascadiaEvent.js
  // function bodies untouched per workstream scope guard. climQuarterCall and
  // climYearCall are computed at orchestrator-call level (vs the in-loop
  // climQuarter at line 309-310 that's used by other modules within the
  // sub-step loop) — under monthly cadence yf advances by 1/12 per call which
  // is smaller than the per-quarter resolution 1/4, so call-level vs sub-step
  // climQuarter is invariant across sub-steps in practice but the call-level
  // declaration makes the once-per-call semantic explicit.
  var climQuarterCall = Math.floor((yf % 1) * 4);
  var climYearCall = 2026 + (yearsSince2026 || 0);
  var m9Result = null;
  if (m9ActiveThisCall || m9Quarters >= 0) {
    m9Result = simulateCascadiaM9(m9Quarters, m9Prep, cumulativeSLR * 100, climYearCall * 1000 + climQuarterCall);
    if (curInfra && m9Quarters < 80) applyM9Recovery(m9Result, null, curInfra, curEco);
    // Stage 2A.0 helper-extension block — surfaces 13 of 15 cascadiaEvent.js
    // exports through results.cascadiaM9 (the remaining computeTerminalDamage
    // is the per-terminal helper called transitively by computeAllTerminalDamage
    // for the canonical TERMINALS registry from src/config/portSystem.js).
    m9Result.macroShock = computeM9MacroShock(m9Quarters);
    m9Result.laborEffects = computeM9LaborEffects(m9Quarters);
    m9Result.routeShares = computeM9RouteShares(m9Result.terminalDamage, m9Quarters);
    m9Result.segmentRecovery = computeSegmentRecovery(m9Quarters);
    m9Result.fleetDamage = computeFleetDamage(m9Result, climQuarterCall);
    m9Result.tsunamiHabitatDamage = computeTsunamiHabitatDamage(m9Result, m9Quarters);
    m9Result.aquacultureDamage = computeAquacultureDamage(m9Result);
    m9Result.contaminationMobilization = computeContaminationMobilization(m9Result, m9Quarters);
    m9Result.tribalSiteDamage = computeTribalSiteDamage(m9Result, m9Quarters);
    m9Result.publicHealthImpact = computeM9PublicHealthImpact(m9Result, m9Quarters);
    m9Result.sensorDegradation = computeSensorDegradation(climYearCall * 1000 + climQuarterCall);
    m9Result.allTerminalDamage = computeAllTerminalDamage(TERMINALS, m9Result, m9Prep);
  }

  for (var step = 0; step < subSteps; step++) {
    try {
    var subYf = yf + step * subYfStep;

    // ── TRIBAL GOVERNANCE COUPLING (previous quarter, one-quarter lag) ──
    // computeTribal runs at position 16 (after ecosystem/fisheries/nearshore).
    // Its exports take effect in the NEXT quarter via the coupling object.
    // This is consistent with existing state carry-forward patterns and represents
    // a realistic implementation lag for governance decisions.
    // Source: Berkes 2012, NWIFC 2020, Pinkerton 1989 — co-management effectiveness
    if (c.trbCoMgmtMultiplier === undefined) c.trbCoMgmtMultiplier = 1.0;
    if (c.trbTekBonus === undefined) c.trbTekBonus = 0;
    if (c.trbRestorationMultiplier === undefined) c.trbRestorationMultiplier = 1.0;
    if (c.trbTreatyStrength === undefined) c.trbTreatyStrength = 0.5;

    // ── CLIMATE MODULE — computed first, drives all other modules ──
    var climQuarter = Math.floor((subYf % 1) * 4);
    var climYear = 2026 + (yearsSince2026 || 0);
    // Pass Fraser burn scar to climate for smoke transport
    var climParams = ap.climate || {};
    climParams.fraserBurnScar = curFraser ? curFraser.burnScar || 0 : 0;
    clim = computeClimate(climParams, curClimate, shocks, climQuarter, climYear, climD);
    // Spread climate exports into coupling
    c = Object.assign(c, clim.exports);
    // Inject smoke solar reduction into climD so computeMarineBasins can reduce PAR
    // Wernberg et al. 2022: wildfire smoke measurably reduces marine photosynthesis
    if (clim.exports.smokeSolarReduction !== undefined) {
      climD.smokeSolarReduction = clim.exports.smokeSolarReduction;
    }

    // ── PACIFIC OCEAN BOUNDARY — after climate, before everything else ──
    pac = computePacific(ap.pacific || {}, curPacific, shocks, climQuarter, climYear, climD, clim.exports);
    c = Object.assign(c, pac.exports);
    // Inject Pacific source water into oForcing for marine basins (replaces hardcoded values)
    if (oF) {
      oF.pacSourceDO = pac.exports.pacSourceDO;
      oF.pacSourceTemp = pac.exports.pacSourceTemp;
      oF.pacSourcepH = pac.exports.pacSourcepH;
      oF.pacSourceNutrients = pac.exports.pacSourceNutrients;
      oF.pacSourceDIC = pac.exports.pacSourceDIC;
      oF.pacSourceTA = pac.exports.pacSourceTA;
      oF.pacSourceOmega = pac.exports.pacSourceOmega;
      oF.pacUpwellingIntensity = pac.exports.pacUpwellingIntensity;
      oF.pacMhwActive = pac.exports.pacMhwActive;
      oF.pacMhwSSTAnomaly = pac.exports.pacMhwSSTAnomaly;
      oF.pacCopepodQuality = pac.exports.pacCopepodQuality;
    }

    // ── PUGET SOUND WATERSHEDS — after Pacific (marine survival), before marine basins ──
    var pswParams = ap.psWatersheds || {};
    pswParams.damRemovalPolicy = ap.ecosystem ? ap.ecosystem.fishPassageInvestment : 20;
    pswParams.fishingPressure = ap.ecosystem ? ap.ecosystem.fishingPressure : 40;
    pswParams.habitatRestoration = pswParams.psHabitatInvestment !== undefined ? pswParams.psHabitatInvestment : 30;
    pswParams.agIntensity = pswParams.nooksackDairyIntensity !== undefined ? pswParams.nooksackDairyIntensity : 70;
    pswParams.urbanGrowth = pswParams.puyallupUrbanGrowth !== undefined ? pswParams.puyallupUrbanGrowth : 50;
    psw = computePSWatersheds(pswParams, curPSW, shocks, climQuarter, climYear, climD, clim ? clim.exports : null, pac ? pac.exports : null);
    c = Object.assign(c, psw.exports);
    // PS Chinook availability for SRKW (adds to Fraser Chinook)
    c.pswTotalChinookAvail = psw.exports.pswTotalChinookAvail;

    // ── INFRASTRUCTURE — after climate/watersheds (needs AR, discharge), before port/urban ──
    infra = computeInfrastructure(ap.infrastructure || {}, curInfra, shocks, climQuarter, climYear,
      clim ? clim.exports : null, psw ? psw.exports : null, fr ? fr.exports : null, null, null, null, c);
    c = Object.assign(c, infra.exports);

    // ── MACRO ECONOMY — before coupling loop, provides trade/development drivers ──
    var macroState = computeMacroEconomy(opts && opts.fredData ? opts.fredData : null, prev._macroCarry || null);
    c.tradeGrowthFactor = macroState.state.tradeGrowthFactor;
    c.developmentPressure = macroState.state.developmentPressure;
    c.fishingPressureAdj = macroState.state.fishingPressureAdj;
    c.slowSteamFactor = macroState.state.slowSteamFactor;
    c.realBudgetMultiplier = macroState.state.realBudgetMultiplier;
    c.exchangeRateEffect = macroState.state.exchangeRateEffect;
    c.oilPrice = macroState.state.oilPrice;
    // Wired in Phase 2 audit fix — these were previously dead channels
    c.energyTransitionPressure = macroState.state.energyTransitionPressure; // → computeEnergy renewable growth
    c.oilSpillRiskAdj = macroState.state.oilSpillRiskAdj; // → contaminants spill probability
    c.tradeGrowthFactor_CA = macroState.state.tradeGrowthFactor_CA; // → computeFraser, portOperations
    c.bcFishingPressureAdj = macroState.state.bcFishingPressureAdj; // → computeFraser fishing pressure
    // Economic integration (wired 2026-03-23 economic audit fix):
    c.borrowingCostIndex = macroState.state.borrowingCostIndex; // → computeInfrastructure investment effectiveness
    c.housingPressure = macroState.state.housingPressure; // → computeUrban housing affordability + armoring
    c.recessionFlag = macroState.state.recessionFlag; // → computeUrban social stability
    c.fishingPressureAdj = macroState.state.fishingPressureAdj; // → computeFisheries desperation baseline
    // Note: developmentPressure already in coupling (line 256), now consumed by computeNearshore

    // ── SHORELINE COUPLING — housing → armor (Track B, hero cascade link 2) ──
    // Computes sound-wide housingArmorDelta from devPressure × housingPressure × ...
    // via shorelineCoupling.computeArmorDynamics; per-sub-basin armorDelta is
    // length-weighted-aggregated to a single sound-wide value applied uniformly
    // to (a) computeNearshore.js:285 per-basin armorFrac evolution (replacing
    // deleted inline urbanFrac) and (b) computeEcosystem.js:820 armoringFrac
    // calc as additive term (Track B Amendment 1, makes link 2 → link 3
    // load-bearing through the eelgrass pathway).
    // Citations: Schlenger et al. 2011 (~27% PS shoreline armored, PSNERP);
    // Dethier et al. 2016 (~0.3-0.5%/yr new armoring, urban PS).
    var _shoreModuleState = { macro: macroState.state };
    var _shoreOut = computeShorelineCoupling(SHORE_ASSETS, SHORELINE_STATS, _shoreModuleState, climQuarter, climYear, subDt);
    var _armorDynamics = _shoreOut.armorDynamics || {};
    var _adKeys = Object.keys(_armorDynamics);
    var _totalKm = 0, _weightedDelta = 0;
    for (var _adi = 0; _adi < _adKeys.length; _adi++) {
      var _ad = _armorDynamics[_adKeys[_adi]];
      var _km = (SHORELINE_STATS[_adKeys[_adi]] && SHORELINE_STATS[_adKeys[_adi]].totalShorelineKm) || 0;
      _totalKm += _km;
      _weightedDelta += (_ad.armorDelta || 0) * _km;
    }
    c.housingArmorDelta = _totalKm > 0 ? _weightedDelta / _totalKm : 0;

    // ── COUPLING ITERATIONS ──
    // Watershed, Port, and Urban iterate 3× to converge cross-module dependencies
    // (e.g., port employment → urban population → watershed impervious).
    // KNOWN GAP: Marine and Ecosystem are computed ONCE after convergence,
    // so marine DO changes within a quarter don't feed back into urban health
    // or port decisions until the next quarter. This is acceptable because
    // marine state changes slowly relative to the quarterly timestep.
    // If adding fast marine→urban feedback (e.g., real-time HAB beach closures),
    // marine would need to join the coupling loop.
    // Inject displacement persistence and context for urban climate displacement model
    c.prevDisplacement = prev.urban ? prev.urban.state.perBasinDisplaced : {};
    c.yearsSince = yearsSince2026 || 0;
    c.economyIndex = c.employment !== undefined ? cl(c.employment / 60000, 0, 1) : 0.5;
    c.slrStrategy = ap.ecosystem.slrAdaptation !== undefined ? ap.ecosystem.slrAdaptation : 1;
    // Economic integration: previous-quarter economic state for downstream modules
    // These are one-quarter lagged because fisheries/energy/ecoServices compute after the coupling loop.
    var _prevEcon = prev._econCarry || {};
    c.prevElectricityPrice = _prevEcon.electricityPrice !== undefined ? _prevEcon.electricityPrice : 0.09;
    c.prevFisheriesEmployment = _prevEcon.fisheriesEmployment !== undefined ? _prevEcon.fisheriesEmployment : 7900;
    c.prevFisheriesCommunityStress = _prevEcon.communityStress !== undefined ? _prevEcon.communityStress : 0.2;
    c.prevTourismRev = _prevEcon.tourismRev !== undefined ? _prevEcon.tourismRev : 800;
    c.prevTourismEmp = _prevEcon.tourismEmp !== undefined ? _prevEcon.tourismEmp : 12000;
    c.prevEcoServicesTotal = _prevEcon.ecoServicesTotal !== undefined ? _prevEcon.ecoServicesTotal : 6000;
    c.prevHealthCost = _prevEcon.healthCost !== undefined ? _prevEcon.healthCost : 50;
    c.prevInsurancePremiumIndex = _prevEcon.insurancePremiumIndex !== undefined ? _prevEcon.insurancePremiumIndex : 1.0;
    for(var i=0;i<3;i++){
      var w2=computeWatershed(ap.watershed,c,shocks,subYf,climD,curWS,oF);
      var p2=computePort(ap.port,c,shocks,subYf);
      c.droughtStress=w2.state.droughtStress;
      var u2=computeUrban(ap.urban,c,shocks,subYf,climD,curPop);
      c={...c,...w2.exports,...p2.exports,...u2.exports};
      // Re-inject context variables that must not be overwritten by module exports
      c.prevDisplacement = prev.urban ? prev.urban.state.perBasinDisplaced : {};
      c.yearsSince = yearsSince2026 || 0;
      c.economyIndex = c.employment !== undefined ? cl(c.employment / 60000, 0, 1) : 0.5;
      c.slrStrategy = ap.ecosystem.slrAdaptation !== undefined ? ap.ecosystem.slrAdaptation : 1;
    }
    ws=computeWatershed(ap.watershed,c,shocks,subYf,climD,curWS,oF);
    po=computePort(ap.port,c,shocks,subYf);
    c.droughtStress=ws.state.droughtStress;
    c.prevDisplacement = prev.urban ? prev.urban.state.perBasinDisplaced : {};
    c.yearsSince = yearsSince2026 || 0;
    c.economyIndex = c.employment !== undefined ? cl(c.employment / 60000, 0, 1) : 0.5;
    c.slrStrategy = ap.ecosystem.slrAdaptation !== undefined ? ap.ecosystem.slrAdaptation : 1;
    ur=computeUrban(ap.urban,c,shocks,subYf,climD,curPop);
    // Fraser River: feedforward — watershed→fraser→marine→ecosystem (no convergence loop needed)
    var fraserQuarter = Math.floor((subYf % 1) * 4);
    var fraserYear = 2026 + (yearsSince2026 || 0);
    if (climD._hindcastMode) c.hindcastMode = true;
    fr=computeFraser(ap.fraser || {}, curFraser, shocks, fraserQuarter, fraserYear, climD, c);
    // Override Fraser discharge in watershed rivers for marine coupling.
    // Scale Fraser model outputs (real-world units) to match watershed module's
    // internal unit convention (abstract index scale) used by computeMarineBasins.
    if (ws.rivers && ws.rivers.fraser) {
      ws.rivers.fraser.discharge = fr.state.discharge;
      // Fraser nitrogen: kg/day real → scale to match dN*0.50 convention (~130 baseline)
      ws.rivers.fraser.nitrogen = cl(fr.state.totalNitrogen / 300, 50, 800);
      // Fraser sediment: tonnes/day real → scale to match sL*0.45 convention (~100 baseline)
      ws.rivers.fraser.sediment = cl(fr.state.sedimentLoad / 40, 50, 3000);
    }
    // Attach sub-basin state to prevBasins for carry-forward (Phase 2 sub-basin expansion)
    if (prev._subBasins) curB._subBasins = prev._subBasins;
    ma=computeMarineBasins(ap.marine,curB,ws.rivers,po.exports,ur.exports,shocks,subYf,subDt,climD,oF,mhw);
    // Biogeochemical cycling: runs alongside marine basins, provides authoritative nutrient/carbon/O2 state.
    // ma.subBasins (18-entry per-sub-basin state from computeMarineBasins) enables 18-sub-basin sediment resolution.
    bgc=computeBiogeochem(ma.basins, curBGC, climQuarter, climYear, pac ? pac.exports : null, ws ? ws.exports : null, fr ? fr.exports : null, clim ? clim.exports : null, ap.biogeochem || {}, c, subDt, ma.subBasins);
    c = Object.assign(c, bgc.exports);
    // Inject nearshore params into coupling for computeNearshore to read
    c.nearshoreParams = ap.nearshore || {};
    // Nearshore & estuarine processes: after marine basins + biogeochem, before ecosystem
    ns = computeNearshore(ma.basins, curNS, shocks, climQuarter, climYear,
      ws ? ws.exports : null, fr ? fr.exports : null, psw ? psw.exports : null,
      curEco ? { eelgrassHealth: curEco.eelgrassEstab, kelpHealth: curEco.rockfish !== undefined ? 0.5 : 0.6, urchinPop: curEco.urchin, seaOtterPop: curEco.seaOtter, greenCrabPop: curEco.greenCrab, slrStrategy: ap.ecosystem ? ap.ecosystem.slrAdaptation : 1 } : null,
      cumulativeSLR, c);
    c = Object.assign(c, ns.exports);

    // ── CONTAMINANTS — speciated PCB/PAH/Cu/PBDE per parent basin ──
    var contaminantState = {};
    var parentBasinKeys = ['juanDeFuca', 'georgia', 'sanjuan', 'whidbey', 'mainBasin', 'hoodCanal', 'southSound'];
    var prevContam = prev._contaminantState || {};
    var urbanContamFactor = ur && ur.state ? cl((ur.state.population || 4200000) / 9000000, 0.3, 1.5) : 0.5;
    var remedInv = ap.nearshore ? (ap.nearshore.superfundRemediationRate || 30) : 30;
    var oilSpillActive = shocks.oilSpill || 0;
    var dilbitSpillActive = shocks.dilbitSpill || 0;
    // Dilbit spill also triggers surface oil (it has both surface and sinking components)
    if (dilbitSpillActive > 0 && !oilSpillActive) oilSpillActive = dilbitSpillActive * 0.5;
    // Oil price raises background spill risk (macro channel, wired Phase 2 audit fix)
    if (!oilSpillActive && c.oilSpillRiskAdj > 0.01) {
      oilSpillActive = c.oilSpillRiskAdj * 0.3; // scaled down: max 0.05 * 0.3 = 0.015 minor chronic input
    }
    // Extra params for enhanced stormwater/contaminant model
    var contamExtraParams = {
      stormwaterTreatment: ap.urban ? ap.urban.stormwaterTreatment : 20,
      greenInfraFraction: ap.urban ? ap.urban.greenInfraFraction : 5,
      imperviousSurface: ap.watershed ? ap.watershed.imperviousSurface : 15,
      precipIndex: clim ? (clim.exports.precipIndex || 120) : 120,
      quarter: climQuarter,
      microplasticReduction: ap.urban ? ap.urban.microplasticReduction : 10,
      populationRatio: ur && ur.state ? (ur.state.population || 9000000) / 9000000 : 1.0,
      wastewaterEfficiency: ap.urban ? ap.urban.wastewaterEfficiency : 75,
      wastewaterInvestment: ap.urban ? ap.urban.wastewaterInvestment : 30,
    };
    for (var ci = 0; ci < parentBasinKeys.length; ci++) {
      var cid = parentBasinKeys[ci];
      var basinUrban = cid === 'mainBasin' ? 0.6 : cid === 'georgia' ? 0.4 : 0.15;
      // Dilbit spill: concentrated in San Juan basins (Greene & Aschoff 2023)
      var localDilbit = (cid === 'sanjuan' || cid === 'whidbey') ? dilbitSpillActive : dilbitSpillActive * 0.2;
      contaminantState[cid] = computeContaminants(cid, prevContam[cid] || null, urbanContamFactor, basinUrban, remedInv, oilSpillActive, subDt, localDilbit, contamExtraParams);
    }
    // Feed contaminant outputs into coupling for ecosystem/publicHealth
    c.mainBasinPCB = contaminantState.mainBasin ? contaminantState.mainBasin.sedPCB : 0;
    c.mainBasinCu = contaminantState.mainBasin ? contaminantState.mainBasin.disCu : 0;
    c.orcaPCBTissue = contaminantState.mainBasin && contaminantState.mainBasin.tissues ? contaminantState.mainBasin.tissues.orca : 0;
    c.salmonCuImpairment = contaminantState.mainBasin ? contaminantState.mainBasin.cuEffect : 0;
    // 6PPD-quinone: per-basin coho mortality (Tian et al. 2021)
    c.sixPPDqCohoMort = contaminantState.mainBasin ? contaminantState.mainBasin.sixPPDqEffect : { cohoMortality: 0, chinookPenalty: 0, level: 'safe' };
    c.sixPPDqMainBasin = contaminantState.mainBasin ? contaminantState.mainBasin.sixPPDq : 0;
    // Microplastics: average across basins
    var mpSum = 0;
    for (var mpi = 0; mpi < parentBasinKeys.length; mpi++) { mpSum += contaminantState[parentBasinKeys[mpi]] ? contaminantState[parentBasinKeys[mpi]].mpIndex : 0; }
    c.microplasticIndex = mpSum / parentBasinKeys.length;
    // Wastewater load for downstream
    c.wastewaterMainBasin = contaminantState.mainBasin ? contaminantState.mainBasin.wastewater : null;
    c.wastewaterGeorgia = contaminantState.georgia ? contaminantState.georgia.wastewater : null;

    // Inject nearshore habitat coupling: juvenile salmon habitat enhances ecosystem smolt survival
    c.nearshoreJuvHabitat = ns ? ns.exports.nsrTotalJuvHabitat : 0;
    c.nearshoreHealth = ns ? ns.exports.nsrNearshoreHealth : 0.7;
    // Inject Fraser salmon coupling into ecosystem state via coupling object
    c.fraserChinookAvail = fr.exports.fraserChinookAvail;
    c.fraserTotalSalmon = fr.exports.fraserTotalSalmon;
    c.fraserSmoltProduction = fr.exports.fraserSmoltProduction;
    c.fraserEnRouteMortality = fr.exports.fraserEnRouteMortality;
    // Pass marine tidalExchangeRate to ecosystem for sand wave model (Greene et al. 2017)
    c.tidalExchangeRate = ap.marine ? ap.marine.tidalExchangeRate : 60;
    // Pass nearshore params for benthic protection
    c.nearshoreParams = ap.nearshore || {};
    // Light pollution index (Rich & Longcore 2006): proportional to urban population + development
    var lightPollReduction = ap.urban ? (ap.urban.lightPollutionReduction || 0) / 100 : 0;
    c.lightPollutionIndex = cl((ur && ur.state ? (ur.state.population || 9e6) / 9e6 : 1) * 0.4 * (1 - lightPollReduction * 0.6), 0, 0.5);
    // Pharmaceutical contamination index (Meador et al. 2016): population × (1-treatment efficiency)
    var pharmReduction = ap.urban ? (ap.urban.pharmReduction || 0) / 100 : 0;
    c.pharmIndex = cl((ur && ur.state ? (ur.state.population || 9e6) / 9e6 : 1) * (1 - (ap.urban ? (ap.urban.wastewaterEfficiency || 75) / 100 * 0.5 : 0.375)) * 0.3 * (1 - pharmReduction * 0.5), 0, 0.4);
    // Wake erosion (Curtiss et al. 2009): vessel traffic × speed in narrow passages
    var vesselSpeed = ap.port ? (ap.port.vesselSpeedZone || 0) : 0;
    c.wakeErosionIndex = cl((po && po.state ? (po.state.throughput || 3500) / 5000 : 0.7) * (1 - vesselSpeed / 100 * 0.4) * 0.3, 0, 0.4);
    // Water withdrawal stress (WA Ecology instream flow rules)
    var waterConsv = ap.watershed ? (ap.watershed.waterConservation || 30) / 100 : 0.3;
    var instreamProt = ap.watershed ? (ap.watershed.instreamFlowProtection || 20) / 100 : 0.2;
    var summerFlowStress = cl((ap.watershed ? (ap.watershed.agriculturalArea || 20) / 100 * 0.5 : 0.1) * (1 - waterConsv * 0.6) * (1 - instreamProt * 0.4), 0, 0.5);
    c.summerFlowStress = summerFlowStress;
    ec=computeEcosystem(ap.ecosystem,ma.state,ma.basins,shocks,subYf,curEco,subDt,oF,yearsSince2026,mhw,c);
    // Fisheries management: after ecosystem (needs salmon + orca state), feeds back next quarter
    fish = computeFisheries(ap.fisheries || {}, curFish, shocks, climQuarter, climYear,
      fr ? fr.exports : null, psw ? psw.exports : null,
      ec ? { bodyCondition: ec.orca ? ec.orca.bodyCondition : 0.6, population: ec.state ? ec.state.orcaPopulation : 74 } : null,
      ec ? ec.state : null, c);
    c = Object.assign(c, fish.exports);
    // Tribal governance: after fisheries + nearshore (needs treaty harvest, restoration, contamination)
    trb = computeTribal(ap.tribal || {}, curTribal, shocks, climQuarter, climYear,
      fish ? fish.exports : null, ec ? ec.state : null, ns ? ns.exports : null,
      ma ? ma.basins : null, ur ? ur.state : null);
    c = Object.assign(c, trb.exports);
    en=computeEnergy(ap.urban,ws.state,climD,ur.state,po.state,subYf,curEnergy,shocks,c,subDt);
    // Public health: LAST computation — reads from almost all other modules
    ph = computePublicHealth(ap.publicHealth || {}, curPH, shocks, climQuarter, climYear,
      ma ? ma.basins : null, clim ? clim.exports : null, Object.assign({}, ns ? ns.exports : {}, psw ? psw.exports : {}),
      trb ? trb.exports : null, ur ? ur.state : null, ec ? ec.state : null, fish ? fish.exports : null, c);
    c = Object.assign(c, ph.exports);

    // ── ECOSYSTEM SERVICES VALUATION ──
    var ecoSvc = computeEcosystemServices(ec.state, ma.state, po.state, ur.state, ws.state, ap);

    // ── ENVIRONMENTAL REINVESTMENT FUND ──
    // Levy rate from port params feeds back into ecosystem/infrastructure parameters
    // NOTE: Fund reinvestment is applied ONCE per quarter (on last sub-step only)
    // to prevent 4× accumulation during disaster sub-stepping.
    var levyRev = po.state.levyRevenue || 0;
    var prevFund = prev.envFundBalance || 0;
    var fundBalance = prevFund + levyRev * 0.25; // quarterly accumulation

    // Split into 5 reinvestment buckets (could be parameterized later)
    // For now: equal split (20% each)
    var bucketFrac = 0.2;
    // realBudgetMultiplier: inflation erodes purchasing power of conservation funds
    // At 2% inflation: multiplier=1.0 (full value). At 5%: multiplier=0.97 (buys 3% less).
    // Source: BLS CPI, applied to government restoration budgets per OMB deflator methodology.
    var budgetMult = c.realBudgetMultiplier !== undefined ? c.realBudgetMultiplier : 1.0;
    var fundSpend = cl(fundBalance * 0.1 * budgetMult, 0, fundBalance); // spend 10% of balance per quarter, inflation-adjusted
    var eelgrassInv = fundSpend * bucketFrac;
    var passageInv = fundSpend * bucketFrac;
    var quietingInv = fundSpend * bucketFrac;
    var wqInv = fundSpend * bucketFrac;
    var habitatInv = fundSpend * bucketFrac;
    fundBalance = fundBalance - fundSpend;

    // Apply fund effects as parameter nudges (non-destructive: only active while levy > 0)
    // These are small additive effects that compound over time
    // Guard: only on last sub-step to prevent N× accumulation during disaster sub-stepping
    if (fundSpend > 0 && step === subSteps - 1) {
      // Eelgrass: +1% restoration per $200M invested
      ap.ecosystem.eelgrassRestoration = cl((ap.ecosystem.eelgrassRestoration || 0) + eelgrassInv / 200, 0, 100);
      // Fish passage: +1% per $500M
      ap.ecosystem.fishPassageInvestment = cl((ap.ecosystem.fishPassageInvestment || 20) + passageInv / 500, 0, 100);
      // Vessel quieting: boost shorepower and speed zone
      ap.port.shorepower = cl((ap.port.shorepower || 20) + quietingInv / 100, 0, 100);
      ap.port.vesselSpeedZone = cl((ap.port.vesselSpeedZone || 0) + quietingInv / 150, 0, 100);
      // Water quality: wastewater efficiency
      ap.urban.wastewaterEfficiency = cl((ap.urban.wastewaterEfficiency || 75) + wqInv / 300, 0, 99);
      // Habitat: protected area fraction
      ap.ecosystem.protectedAreaFraction = cl((ap.ecosystem.protectedAreaFraction || 15) + habitatInv / 2000, 0, 50);
    }

    // ── PORT OPERATIONS — after port + ecosystem, provides labor/segment detail ──
    var portOps = computePortOperations(prev._portOpsCarry || null, ap, shocks, climQuarter, climYear, macroState ? macroState.state : null);
    // Merge port operations exports into coupling (additive — doesn't overwrite core port)
    c.portOpsRouteShares = portOps.state.routeShares;
    c.portOpsHaroTransits = portOps.state.haroStraitTransits;
    c.portOpsTmxTankers = portOps.state.tmxTankerCount;
    c.portOpsEchoNoise = portOps.state.echoNoiseReduction;

    // ── CHOKEPOINT & MILITARY READINESS (Walsh review) ──
    // JdF strait status and Bangor/PSNS readiness — computed quarterly.
    // Respects sovereign tribal waters along submarine transit corridor.
    var chokepointResult = safeCall('chokepoint', function() {
      return computeChokepointStatus(po ? po.state : {}, shocks, clim ? clim.exports : null, climQuarter, climYear * 1000 + climQuarter);
    }, { effectiveCapacity: 1, closureActive: false, vulnerability: 0, traffic: {} });
    var militaryResult = safeCall('military', function() {
      return computeMilitaryReadiness(curInfra, chokepointResult, shocks);
    }, { readiness: 1, bangorAccess: 1, psnsOperational: 1 });

    // Data assimilation (optional) — Newtonian relaxation toward observations
    // Supports two formats:
    //   1. Legacy: opts.observations = { nanoos_sst: {value}, ... }
    //   2. Full:   opts.observations = array from fetchLiveData() (auto-prepared)
    // Default (no opts) changes nothing — fully backwards compatible.
    var _assimDiag = null;
    if (opts && opts.observations) {
      var obs = opts.observations;
      if (Array.isArray(obs)) {
        // Full assimilation: prepare observations and run Newtonian relaxation
        var prepObs = prepareObservations(obs);
        if (prepObs.length > 0 && ma.state) {
          _assimDiag = assimilateObservations(prepObs, ma.state, dt);
        }
      } else {
        // Legacy format: simple nudge (backward compatible)
        if (obs.nanoos_sst && ma.state) {
          ma.state.sst = nudgeValue(ma.state.sst, obs.nanoos_sst.value, 0.1);
        }
        if (obs.nanoos_do && ma.state) {
          ma.state.dissolvedOxygen = nudgeValue(ma.state.dissolvedOxygen, obs.nanoos_do.value, 0.1);
        }
        if (obs.noaa_ph && ma.state) {
          ma.state.pH = nudgeValue(ma.state.pH, obs.noaa_ph.value, 0.1);
        }
      }
    }

    // Advance sub-step state
    curB = ma.basins; curPop = ur.population;
    // Store sub-basin state for next quarter carry-forward
    if (ma.subBasins) prev._subBasins = ma.subBasins;
    curWS = { reservoirLevel: ws.state.reservoirLevel, snowpack: ws.state.snowpack, glacialMass: ws.state.glacialMass, burnScar: ws.state.burnScar, burnAge: ws.state.burnAge, groundwaterLevel: ws.state.groundwaterLevel, arIntensity: ws.state.arIntensity, arCategory: ws.state.arCategory, _yearsSince2026: yearsSince2026 || 0 };
    curEco = { salmon: ec.salmon, orca: ec.orca, pinniped: ec.pinniped, eelgrassEstab: ec.eelgrassEstab, greenCrab: ec.greenCrab, dungenessCrab: ec.dungenessCrab, oyster: ec.oyster, forageFish: ec.forageFish, rockfish: ec.rockfish, urchin: ec.urchin, geoduck: ec.geoduck, murrelet: ec.murrelet, humpback: ec.humpback, seaOtter: ec.seaOtter, jellyfish: ec.jellyfish, lingcod: ec.lingcod, lamprey: ec.lamprey, porpoise: ec.porpoise, herring: ec.herring, microbialLoop: ec.microbialLoop, euphausiids: ec.euphausiids, benthicInfauna: ec.benthicInfauna, epibenthicCrust: ec.epibenthicCrust, epiphytes: ec.epiphytes, bullKelp: ec.bullKelp, deepUrchin: ec.deepUrchin, sandWaveIntegrity: ec.sandWaveIntegrity, octopus: ec.octopus, cherryPointHerring: ec.cherryPointHerring, sunflowerStar: ec.sunflowerStar, biggsOrca: ec.biggsOrca, pteropod: ec.pteropod, grayWhale: ec.grayWhale, armoringFrac: ec.armoringFrac };
    curEnergy = en._carry;
    curFraser = fr._carry;
    curClimate = clim._carry;
    curPacific = pac._carry;
    curBGC = bgc._carry;
    curPSW = psw._carry;
    curNS = ns._carry;
    curFish = fish._carry;
    curTribal = trb._carry;
    curPH = ph._carry;
    curInfra = infra._carry;
    c = {...ws.exports,...ma.exports,...ec.exports,...po.exports,...ur.exports,...en.exports,...fr.exports,...clim.exports,...pac.exports,...bgc.exports,...psw.exports,...ns.exports,...fish.exports,...trb.exports,...ph.exports,...infra.exports};
    // Carry forward new module state
    prev._macroCarry = macroState ? macroState._carry : null;
    prev._portOpsCarry = portOps ? portOps._carry : null;
    // Note: prev._m9QuartersSince is no longer written inside the sub-step
    // loop. The counter advances once per orchestrator call (above the
    // loop) and carries forward via _state at the orchestrator return.
    prev._contaminantState = contaminantState;
    } catch (subStepErr) {
      console.error('Salish Cousin: sub-step ' + step + ' threw — using last good state.', subStepErr);
      break; // exit sub-step loop, preserving last good curB/curEco/etc.
    }
  }

  // ── M9 RECOVERY-COMPLETE RESET ──
  // 80 quarters = 20 years. Once m9Quarters reaches 80, recovery is
  // structurally complete; reset counter to -1 so subsequent calls don't
  // populate m9Result and the engine returns to baseline dynamics.
  // Pre-fix wiring inlined this reset inside the recovery branch of the
  // sub-step loop; post-fix it lives here at the orchestrator-call boundary.
  if (m9Quarters >= 80) m9Quarters = -1;

  // ── _state FIELD CONTRACT ──
  // Every field here must match what prevState unpacking (top of this function) expects.
  // Missing a field = that state variable silently resets to default next quarter.
  // Fields: basins, salmon, orca, pop, pinniped, mhw, eelgrassEstab, greenCrab,
  //         dungenessCrab, watershed.{reservoirLevel,snowpack,glacialMass,burnScar,
  //         burnAge,groundwaterLevel}, coupling
  // To add a new field: add here AND in prevEco (if ecosystem) or prevWS (if watershed).
  // Inject SLR state into marine aggregate for dashboard access
  if (ma && ma.state) {
    ma.state.cumulativeSLR = cumulativeSLR;
    ma.state.slrRateMmYr = slrRateMmYr;
    ma.state.thwaitesTriggered = thwaitesTriggered;
    ma.state.effectiveEnsoAmp = effectiveEnsoAmp;
    ma.state.slrScenario = slrScenario;
    ma.state.sspPathway = Math.round(cl(allParams.marine.sspPathway || 1, 0, 4));
  }

  return{watershed:ws,marine:ma,port:po,ecosystem:ec,urban:ur,energy:en,fraser:fr,climate:clim,pacific:pac,biogeochem:bgc,psWatersheds:psw,nearshore:ns,fisheries:fish,tribal:trb,publicHealth:ph,infrastructure:infra,ecoServices:ecoSvc,macroEconomy:macroState,portOperations:portOps,cascadiaM9:m9Result,contaminants:contaminantState,chokepoint:chokepointResult,military:militaryResult,oceanForcing:oF,climatePathway:sspKey,mhw:mhw,assimilationDiagnostics:_assimDiag,_state:{basins:ma.basins,salmon:ec.salmon,orca:ec.orca,pop:ur.population,pinniped:ec.pinniped,mhw:mhw,eelgrassEstab:ec.eelgrassEstab,greenCrab:ec.greenCrab,dungenessCrab:ec.dungenessCrab,oyster:ec.oyster,forageFish:ec.forageFish,rockfish:ec.rockfish,urchin:ec.urchin,geoduck:ec.geoduck,murrelet:ec.murrelet,humpback:ec.humpback,seaOtter:ec.seaOtter,jellyfish:ec.jellyfish,lingcod:ec.lingcod,lamprey:ec.lamprey,porpoise:ec.porpoise,herring:ec.herring,octopus:ec.octopus,cherryPointHerring:ec.cherryPointHerring,sunflowerStar:ec.sunflowerStar,biggsOrca:ec.biggsOrca,pteropod:ec.pteropod,grayWhale:ec.grayWhale,armoringFrac:ec.armoringFrac,deepUrchin:ec.deepUrchin,sandWaveIntegrity:ec.sandWaveIntegrity,microbialLoop:ec.microbialLoop,euphausiids:ec.euphausiids,benthicInfauna:ec.benthicInfauna,epibenthicCrust:ec.epibenthicCrust,epiphytes:ec.epiphytes,bullKelp:ec.bullKelp,energy:en._carry,fraser:fr._carry,climate:clim._carry,pacific:pac._carry,biogeochem:bgc._carry,psWatersheds:psw._carry,nearshore:ns._carry,fisheries:fish._carry,tribal:trb._carry,publicHealth:ph._carry,infrastructure:infra._carry,envFundBalance:fundBalance,cumulativeSLR:cumulativeSLR,thwaitesTriggered:thwaitesTriggered,urban:{state:{perBasinDisplaced:ur.state.perBasinDisplaced}},watershed:{reservoirLevel:ws.state.reservoirLevel,snowpack:ws.state.snowpack,glacialMass:ws.state.glacialMass,burnScar:ws.state.burnScar,burnAge:ws.state.burnAge,groundwaterLevel:ws.state.groundwaterLevel,arIntensity:ws.state.arIntensity,arCategory:ws.state.arCategory},_macroCarry:macroState?macroState._carry:null,_portOpsCarry:portOps?portOps._carry:null,_econCarry:{electricityPrice:en&&en.state?en.state.electricityPrice:0.09,fisheriesEmployment:fish&&fish.state?fish.state.fisheriesEmployment:7900,communityStress:fish&&fish.state?fish.state.communityStress:0.2,tourismRev:po&&po.state?po.state.tourismRev:800,tourismEmp:po&&po.state?po.state.tourismEmp:12000,ecoServicesTotal:ecoSvc&&ecoSvc.state&&ecoSvc.state.total?ecoSvc.state.total.value:6000,healthCost:ph&&ph.state?ph.state.totalHealthCost:50,insurancePremiumIndex:ur&&ur.state&&ur.state.insurancePremiumIndex?ur.state.insurancePremiumIndex:1.0},_m9QuartersSince:m9Quarters,_contaminantState:contaminantState,coupling:c}};
}

// ── SALMON PRE-RUN WARMUP ──
// Runs 4 silent quarters at year 0 to let salmon cohorts cycle to equilibrium.
// Without this, year-0 salmon reads ~34 instead of observed ~48 because the
// initial cohort structure hasn't been shaped by seasonal modulation yet.
// ENSO cache is saved/restored so the warmup doesn't shift the stochastic sequence.
function warmupState(allParams, monthlyDt) {
  var savedSeed = _ensoCache.seed;
  var savedSeq = _ensoCache.seq.slice();
  resetEnsoCache(savedSeed);
  var state = null;
  if (monthlyDt) {
    // Monthly warmup: 12 months × dt=1/3 = 1 year equivalent
    for (var m = 0; m < 12; m++) {
      var result = runOrchestrator(allParams, {}, m / 12, state, 1/3, 0);
      state = result._state;
    }
  } else {
    // Quarterly warmup (legacy, used by tests and projections)
    for (var q = 0; q < 4; q++) {
      var result = runOrchestrator(allParams, {}, q / 4, state, 1, 0);
      state = result._state;
    }
  }
  setEnsoCache({ seq: savedSeq, seed: savedSeed });
  return state;
}

// ── MONTE CARLO ENSEMBLE RUNNER ──
// Runs N ensemble members with parameter jitter, returns mean + percentile bands
function runEnsemble(allParams, shocks, yf, prevStates, dt, yearsSince2026, N, jitterFrac) {
  N = N || 8; jitterFrac = jitterFrac || 0.05;
  var runs = [];
  for (var r = 0; r < N; r++) {
    var prevState = (prevStates && prevStates[r]) ? prevStates[r] : (prevStates && prevStates[0]) ? prevStates[0] : null;
    runs.push(runOrchestrator(allParams, shocks, yf, prevState, dt, yearsSince2026, jitterFrac));
  }
  // Extract key metrics from each run
  var metrics = runs.map(function(run) {
    var ms = run.marine.state, es = run.ecosystem.state, us = run.urban.state, ps = run.port.state;
    return {
      waterQuality: ms.waterQualityIndex, biodiversity: es.biodiversityIndex,
      orcaViability: es.orcaViability, salmonRun: es.salmonRunStrength,
      populationHealth: us.populationHealth, employment: ps.employment / 60000,
      dissolvedOxygen: ms.dissolvedOxygen, herringPop: es.herringPop !== undefined ? es.herringPop : 0.5,
    };
  });
  // Compute percentile bands
  var keys = Object.keys(metrics[0]);
  var bands = {};
  keys.forEach(function(k) {
    var vals = metrics.map(function(m) { return m[k]; }).sort(function(a,b) { return a-b; });
    var n = vals.length;
    bands[k] = { p10: vals[Math.floor(n*0.1)] || vals[0], p50: vals[Math.floor(n*0.5)], p90: vals[Math.ceil(n*0.9)-1] || vals[n-1], mean: vals.reduce(function(s,v){return s+v;},0)/n };
  });
  return { runs: runs, bands: bands, states: runs.map(function(r) { return r._state; }) };
}

// ═══════════════════════════════════════════════════════════
// SCENARIO PROJECTION ENGINE — runs sim forward N years in batch
// ═══════════════════════════════════════════════════════════
// Returns yearly snapshots of key metrics for baseline vs. policy comparison
// NOTE: POL and PM are passed as parameters until config module is extracted.
// TODO: import { POL, PM } from '../config/index.js';
function projectScenario(baseParams, policies, targetYear, startYear, POL, PM) {
  startYear = startYear || 2026;
  targetYear = targetYear || 2050;
  var nYears = targetYear - startYear;
  var snapshots = [];
  var state = null;
  var savedSeed = _ensoCache.seed;

  // Build effective params with fully-realized policy effects
  var ep = JSON.parse(JSON.stringify(baseParams));
  if (policies) {
    Object.entries(policies).forEach(function(entry) {
      var polKey = entry[0], polDef = POL[polKey];
      if (!polDef) return;
      Object.entries(polDef.fx).forEach(function(modEntry) {
        var mod = modEntry[0], changes = modEntry[1];
        Object.entries(changes).forEach(function(pEntry) {
          var pk = pEntry[0], dv = pEntry[1];
          if (ep[mod] && ep[mod][pk] !== undefined) {
            var meta = PM[mod] && PM[mod].p[pk];
            ep[mod][pk] = cl(ep[mod][pk] + dv, meta ? meta.mn : 0, meta ? meta.mx : 100);
          }
        });
      });
    });
  }

  resetEnsoCache(42); // fixed seed for reproducible projection
  for (var y = 0; y < nYears; y++) {
    var r;
    for (var q = 0; q < 4; q++) {
      var yf = q / 4;
      r = runOrchestrator(ep, {}, yf, state, 1, y);
      state = r._state;
    }
    // Record annual snapshot from last quarter's result
    var ms = r.marine.state, es = r.ecosystem.state, us = r.urban.state, ps = r.port.state;
    snapshots.push({
      year: startYear + y,
      waterQuality: ms.waterQualityIndex,
      biodiversity: es.biodiversityIndex,
      orcaPop: es.orcaPopulation !== undefined ? es.orcaPopulation : 74,
      orcaViability: es.orcaViability,
      salmonRun: es.salmonRunStrength,
      dissolvedOxygen: ms.dissolvedOxygen,
      omegaAragonite: ms.omegaAragonite !== undefined ? ms.omegaAragonite : 2.0,
      shellfishViability: ms.shellfishViability !== undefined ? ms.shellfishViability : 1.0,
      populationHealth: us.populationHealth,
      employment: ps.employment,
      revenue: ps.revenue,
      equityIndex: us.equityIndex !== undefined ? us.equityIndex : 0.65,
      coastalFloodRisk: us.coastalFloodRisk || 0,
      csoFrequency: us.csoFrequency,
      kelpHealth: es.kelpHealth,
      eelgrassEstablishment: es.eelgrassEstablishment !== undefined ? es.eelgrassEstablishment : 0.7,
      eelgrassRegimeShift: es.eelgrassRegimeShift || 0,
      greenCrabPop: es.greenCrabPop || 0,
      dungenessCrabPop: es.dungenessCrabPop !== undefined ? es.dungenessCrabPop : 0.65,
      herringPop: es.herringPop !== undefined ? es.herringPop : 0.5,
      waterStress: us.waterStress || 0,
      mhwActive: es.mhwActive || 0,
      mhwIntensity: es.mhwIntensity || 0,
      pop: (us.dynamicPopulation !== undefined ? us.dynamicPopulation : 9000000) / 1e6,
      socialStability: us.socialStability !== undefined ? us.socialStability : 1,
      totalDisplaced: us.totalDisplaced || 0,
      tribalDisplaced: us.tribalDisplaced || 0,
      cumulativeSLR: ms.cumulativeSLR !== undefined ? ms.cumulativeSLR : 0,
      slrRateMmYr: ms.slrRateMmYr !== undefined ? ms.slrRateMmYr : 0,
      thwaitesTriggered: ms.thwaitesTriggered || false,
    });
  }
  resetEnsoCache(savedSeed); // restore original seed
  return snapshots;
}

export { runOrchestrator, warmupState, runEnsemble, projectScenario };
