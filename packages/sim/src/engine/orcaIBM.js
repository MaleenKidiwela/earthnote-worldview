// ═══════════════════════════════════════════════════════════
// ORCA IBM — Individual-Based Model for Southern Resident Killer Whales
// ═══════════════════════════════════════════════════════════
// Tracks each known SRKW by name, sex, age, pod, body condition,
// and reproductive state. Replaces population-level model with
// individual demographic events.
//
// Sources:
//   CWR 2024 — Center for Whale Research annual census
//   Olesiuk et al. 2005 — age-specific mortality
//   Wasser et al. 2017 — nutrition → reproduction link
//   Nattrass et al. 2019 — grandmother effect on calf survival
//   Ward et al. 2009 — SRKW demographic model
//   Lacy et al. 2017 — demographic stochasticity in small populations
//   Ross et al. 2000, Krahn et al. 2007 — PCB body burden
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl, seededRandom } from './utils.js';
import { SRKW_INDIVIDUALS } from '../config/orcaIndividuals.js';
import { computeForagingEfficiency, computeSubBasinNoiseField } from './acousticMasking.js';

// ── AGE-SPECIFIC MORTALITY RATES (annual) ──
// Olesiuk et al. 2005, CWR life tables
// Converted to per-month by /12
var MORT_RATES = {
  neonate: 0.40 / 12,  // year 0: ~40% annual mortality — very high
  juvenile: 0.03 / 12, // 1-10: ~3%/yr
  adultF: 0.02 / 12,   // female 10-40: ~2%/yr
  postRepF: 0.04 / 12, // female 40+: ~4%/yr
  adultM: 0.04 / 12,   // male 10-30: ~4%/yr (higher than females)
  oldM: 0.07 / 12,     // male 30+: ~7%/yr
};

function getBaseMortality(sex, age) {
  if (age < 1) return MORT_RATES.neonate;
  if (age < 10) return MORT_RATES.juvenile;
  if (sex === 'F') {
    return age < 42 ? MORT_RATES.adultF : MORT_RATES.postRepF;
  }
  return age < 30 ? MORT_RATES.adultM : MORT_RATES.oldM;
}

// ── Initialize IBM state from CWR registry ──
export function initOrcaIBM(year) {
  var baseYear = year || 2024;
  var individuals = [];
  var nextId = { J: 61, K: 46, L: 127 }; // next available ID per pod

  for (var i = 0; i < SRKW_INDIVIDUALS.length; i++) {
    var w = SRKW_INDIVIDUALS[i];
    if (w.alive === false) continue; // skip deceased
    individuals.push({
      id: w.id,
      name: w.name || '',
      pod: w.pod,
      sex: w.sex,
      birthYear: w.birthYear,
      mother: w.mother,
      alive: true,
      age: baseYear - w.birthYear,
      bodyCondition: 0.6, // baseline — Fearnbach et al. 2018
      pregnant: false,
      gestationMonth: 0,
      lastCalfYear: 0,
      reproductiveStatus: w.reproductiveStatus || 'pre-reproductive',
      notes: w.notes || '',
    });
  }

  return { individuals: individuals, nextId: nextId, events: [] };
}

// ── Main IBM computation ──
export function computeOrcaIBM(prevState, preyAvail, noise, contam, month, year, dt, rngSeed) {
  var prev = prevState || initOrcaIBM(year);
  var individuals = [];
  var events = [];
  var nextId = prev.nextId ? { J: prev.nextId.J, K: prev.nextId.K, L: prev.nextId.L } : { J: 61, K: 46, L: 127 };

  // Pod-level foraging efficiency (Allee effect — smaller pods forage less efficiently)
  var podCounts = { J: 0, K: 0, L: 0 };
  for (var ci = 0; ci < prev.individuals.length; ci++) {
    if (prev.individuals[ci].alive) podCounts[prev.individuals[ci].pod]++;
  }
  var podForaging = {};
  var pods = ['J', 'K', 'L'];
  for (var pi = 0; pi < pods.length; pi++) {
    var pk = pods[pi];
    var n = podCounts[pk];
    // Allee: foraging efficiency drops below 18, crashes below 10
    podForaging[pk] = n >= 18 ? 1.0 : n >= 10 ? cl(0.7 + (n - 10) / 8 * 0.3, 0.7, 1.0) : n >= 5 ? cl(0.4 + (n - 5) / 5 * 0.3, 0.4, 0.7) : cl(0.1 + n * 0.06, 0.1, 0.4);
  }

  // ── ACOUSTIC MASKING — mechanistic foraging efficiency from noise ──
  // Veirs et al. 2016: ship noise in Haro Strait at 50 kHz band
  // Compute masking-derived foraging efficiency for each pod's primary habitat
  var noiseLevel = noise * 120; // convert normalized noise (0-1) to approximate SPL (dB re 1µPa)
  var noiseField = computeSubBasinNoiseField('sj_haro', noiseLevel, 0); // J/K Pod primary habitat
  var maskingResult = computeForagingEfficiency(noiseField.orcaExposureSPL, preyAvail);
  var noiseForgEff = maskingResult.foragingEfficiency; // 0-1: how effectively orca can find prey

  // Process each living individual
  var births = [];
  for (var ii = 0; ii < prev.individuals.length; ii++) {
    var ind = prev.individuals[ii];
    if (!ind.alive) { individuals.push(ind); continue; }

    var age = year - ind.birthYear;
    var sex = ind.sex === 'U' ? (seededRandom(rngSeed + ii * 31 + 7777) > 0.5 ? 'M' : 'F') : ind.sex;
    var podEff = podForaging[ind.pod] || 1.0;

    // ── BODY CONDITION ──
    // Driven by prey, modulated by pod efficiency, sex, age
    // Males have ~15% higher metabolic demand — Noren 2011
    var metabolicDemand = sex === 'M' ? 1.15 : 1.0;
    // Calves depend on mother's condition
    var maternalSupport = 0;
    if (age < 3 && ind.mother) {
      for (var mi = 0; mi < prev.individuals.length; mi++) {
        if (prev.individuals[mi].id === ind.mother && prev.individuals[mi].alive) {
          maternalSupport = prev.individuals[mi].bodyCondition * 0.3;
          break;
        }
      }
    }
    // Food intake modulated by acoustic masking efficiency (mechanistic noise→foraging chain)
    var foodIntake = cl(preyAvail * podEff * noiseForgEff / metabolicDemand + maternalSupport, 0, 1);
    var bc = cl(ind.bodyCondition * 0.85 + foodIntake * 0.15, 0.1, 1.0);

    // PCB mobilization under food stress — Ross et al. 2000: when orcas burn blubber,
    // stored PCBs are released into bloodstream causing immunosuppression
    var contamStress = bc < 0.5 ? cl(contam * (0.5 - bc) * 2, 0, 0.3) : 0;

    // ── MORTALITY ──
    var baseMort = getBaseMortality(sex, age);
    // Body condition modifier: double mortality when BC < 0.4
    var bcMortMod = bc < 0.4 ? 2.0 : bc < 0.5 ? 1.5 : 1.0;
    // Contamination modifier
    var contamMortMod = 1 + contamStress * 2;
    // Noise stress (mid-frequency sonar, vessel noise)
    var noiseMort = noise * 0.001;
    // Total monthly mortality probability
    var mortProb = cl(baseMort * bcMortMod * contamMortMod + noiseMort, 0, 0.15);

    var mortRng = seededRandom(rngSeed + ii * 97 + month * 13 + year * 3);
    if (mortRng < mortProb) {
      // Death
      var dead = {};
      for (var dk in ind) dead[dk] = ind[dk];
      dead.alive = false;
      dead.deathYear = year;
      individuals.push(dead);
      events.push({ type: 'death', id: ind.id, name: ind.name, pod: ind.pod, age: age, year: year, month: month });
      continue;
    }

    // ── REPRODUCTION ──
    var pregnant = ind.pregnant || false;
    var gestMonth = ind.gestationMonth || 0;
    var lastCalf = ind.lastCalfYear || 0;

    if (sex === 'F' && age >= 10 && age < 42) {
      // Active reproductive female
      if (!pregnant) {
        // Conception: ~0.008/month at good BC, drops near zero below 0.5
        // Calving interval ~5 years minimum — Ward et al. 2009
        var calvingReady = (year - lastCalf) >= 4;
        var conceptionProb = calvingReady && bc > 0.45 ? cl((bc - 0.45) * 0.015, 0, 0.010) : 0;
        var concRng = seededRandom(rngSeed + ii * 53 + month * 7 + 33333);
        if (concRng < conceptionProb) {
          pregnant = true;
          gestMonth = 0;
        }
      } else {
        gestMonth++;
        // Gestation ~17 months. Miscarriage risk if body condition drops
        if (bc < 0.35) {
          var miscarriageRng = seededRandom(rngSeed + ii * 41 + gestMonth * 11);
          if (miscarriageRng < 0.15) { // 15% chance per month when starving
            pregnant = false;
            gestMonth = 0;
            events.push({ type: 'miscarriage', id: ind.id, name: ind.name, pod: ind.pod, year: year, month: month });
          }
        }
        // Birth at 17 months
        if (gestMonth >= 17) {
          pregnant = false;
          gestMonth = 0;
          lastCalf = year;
          // Create new calf
          var calfSex = seededRandom(rngSeed + ii * 71 + year * 17) > 0.5 ? 'M' : 'F';
          var calfId = ind.pod + nextId[ind.pod];
          nextId[ind.pod]++;
          births.push({
            id: calfId, name: '', pod: ind.pod, sex: calfSex,
            birthYear: year, mother: ind.id, alive: true, age: 0,
            bodyCondition: cl(bc * 0.8, 0.3, 0.7), // calf starts at fraction of mother's BC
            pregnant: false, gestationMonth: 0, lastCalfYear: 0,
            reproductiveStatus: 'pre-reproductive', notes: 'Born ' + year,
          });
          events.push({ type: 'birth', id: calfId, mother: ind.id, motherName: ind.name, pod: ind.pod, sex: calfSex, year: year, month: month });
        }
      }
    }

    // Update individual
    var updated = {};
    for (var uk in ind) updated[uk] = ind[uk];
    updated.age = age;
    updated.sex = sex;
    updated.bodyCondition = bc;
    updated.pregnant = pregnant;
    updated.gestationMonth = gestMonth;
    updated.lastCalfYear = lastCalf;
    updated.reproductiveStatus = sex === 'M' ? 'male' : age < 10 ? 'pre-reproductive' : age >= 42 ? 'post-reproductive' : 'active';
    individuals.push(updated);
  }

  // Add newborns
  for (var bi = 0; bi < births.length; bi++) {
    individuals.push(births[bi]);
  }

  // ── POD-LEVEL AGGREGATION (backward compatibility) ──
  var podAgg = { J: { pop: 0, bc: 0, births: 0, deaths: 0 }, K: { pop: 0, bc: 0, births: 0, deaths: 0 }, L: { pop: 0, bc: 0, births: 0, deaths: 0 } };
  for (var ai = 0; ai < individuals.length; ai++) {
    var a = individuals[ai];
    if (!a.alive || !podAgg[a.pod]) continue;
    podAgg[a.pod].pop++;
    podAgg[a.pod].bc += a.bodyCondition;
  }
  for (var ei = 0; ei < events.length; ei++) {
    var ev = events[ei];
    if (!podAgg[ev.pod]) continue;
    if (ev.type === 'birth') podAgg[ev.pod].births++;
    if (ev.type === 'death') podAgg[ev.pod].deaths++;
  }

  var totalPop = 0, totalBC = 0, totalBirths = 0, totalDeaths = 0;
  var podResult = {};
  for (var pki = 0; pki < pods.length; pki++) {
    var p = pods[pki];
    var pa = podAgg[p];
    totalPop += pa.pop;
    totalBC += pa.bc;
    totalBirths += pa.births;
    totalDeaths += pa.deaths;
    var avgBC = pa.pop > 0 ? pa.bc / pa.pop : 0;
    var extRisk = pa.pop < 5 ? 0.8 : pa.pop < 10 ? 0.4 : pa.pop < 18 ? 0.1 : 0;
    podResult[p] = { population: pa.pop, births: pa.births, deaths: pa.deaths, bodyCondition: avgBC, extinctionRisk: extRisk };
  }

  return {
    individuals: individuals,
    nextId: nextId,
    events: events,
    // Acoustic masking diagnostics — Veirs et al. 2016
    acousticMasking: {
      detectionRange_m: maskingResult.detectionRange_m,
      foragingEfficiency: maskingResult.foragingEfficiency,
      maskingIndex: maskingResult.maskingIndex,
      orcaExposureSPL: noiseField.orcaExposureSPL,
    },
    // Backward-compatible pod aggregates
    pods: podResult,
    population: totalPop,
    births: totalBirths,
    deaths: totalDeaths,
    bodyCondition: totalPop > 0 ? totalBC / totalPop : 0,
  };
}
