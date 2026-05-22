// ═══════════════════════════════════════════════════════════
// SALMON OCEAN — Multi-stage cohort tracking through ocean residence
// ═══════════════════════════════════════════════════════════
// Tracks salmon cohorts through 4 ocean life stages with stage-specific
// mortality pressures. Runs alongside the existing age-class model;
// provides stage-level diagnostics without affecting calibration.
//
// Stages:
//   1. Estuary (0-3 months) — Beamer et al. 2005, Duffy et al. 2010
//   2. Nearshore/Coastal (3-12 months) — Pearcy 1992, Beamish & Mahnken 2001
//   3. Open Ocean (1-3 years) — Ruggerone & Irvine 2018, Connors et al. 2020
//   4. Return Migration (1-3 months) — Hinch et al. 2012
//
// Note on Beamer et al. 2005 framework attribution: Beamer et al. 2005 is
// cited here at the framework level for estuarine-rearing-stage modeling.
// Specific magnitudes that propagate from this framework (500 juv/estuary
// capacity at computeNearshore.js + nearshoreParams.js, 0.1 juv/ha at
// computeNearshore.js, restoration costs at policyCosts.js) are Path 4
// model-construction choices within the Beamer framework, not paper-direct
// from the cited source. Framework establishes pocket-estuary rearing as
// critical habitat at 10x-100x density vs offshore + asymptotic density-
// dependence qualitatively. Path 4 per Amendment 6 §5.24(b). See
// docs/citation-audit-followups.md sub-12E Entry 19.
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl } from './utils.js';

// Ocean residence duration by species (months in each stage)
// Source: Quinn 2005, Healey 1991
var OCEAN_STAGES = {
  chinook: { estuary: 3, nearshore: 9, ocean: 24, return: 3 }, // 39 months total (~3.25 yr)
  coho:    { estuary: 2, nearshore: 6, ocean: 10, return: 2 }, // 20 months (~1.7 yr)
  sockeye: { estuary: 1, nearshore: 5, ocean: 18, return: 2 }, // 26 months (~2.2 yr)
  pink:    { estuary: 1, nearshore: 4, ocean: 6,  return: 1 }, // 12 months (1 yr)
  chum:    { estuary: 2, nearshore: 6, ocean: 14, return: 2 }, // 24 months (2 yr)
};

// Base stage survival rates (monthly, at baseline conditions)
// Source: Bradford 1995, Peterman & Dorner 2012, marine survival meta-analyses
var BASE_SURVIVAL = {
  chinook: { estuary: 0.90, nearshore: 0.95, ocean: 0.97, return: 0.95 },
  coho:    { estuary: 0.92, nearshore: 0.96, ocean: 0.97, return: 0.96 },
  sockeye: { estuary: 0.93, nearshore: 0.96, ocean: 0.975, return: 0.94 },
  pink:    { estuary: 0.95, nearshore: 0.97, ocean: 0.98, return: 0.97 },
  chum:    { estuary: 0.92, nearshore: 0.96, ocean: 0.975, return: 0.96 },
};

// Initialize ocean cohort tracking state
export function initSalmonOcean() {
  return { cohorts: [], totalAdultsReturned: {}, diagnostics: {} };
}

// Main ocean computation — called each timestep
export function computeSalmonOcean(prevState, smoltProduction, env, month, year) {
  var prev = prevState || initSalmonOcean();
  var cohorts = [];
  var returned = {};
  var diagnostics = { activeCohortsCount: 0, stageBreakdown: {} };

  // env: { estuaryQuality, copepodQuality, sst, pdoIndex, mhwActive, mhwIntensity,
  //         seaLicePressure, contamination, fisheriesHarvestRate, fraserTemp }

  var eQ = env.estuaryQuality !== undefined ? env.estuaryQuality : 0.5;
  var copQ = env.copepodQuality !== undefined ? env.copepodQuality : 0.5;
  var sst = env.sst !== undefined ? env.sst : 11;
  var mhwActive = env.mhwActive || 0;
  var mhwInt = env.mhwIntensity || 0;
  var seaLice = env.seaLicePressure || 0;
  var contam = env.contamination || 0;
  var harvest = env.fisheriesHarvestRate || 0;
  var fraserTemp = env.fraserTemp || 10;

  // ── Add new smolt cohorts ──
  // smoltProduction: { chinook: N, coho: N, sockeye: N, pink: N, chum: N }
  if (smoltProduction) {
    var species = Object.keys(smoltProduction);
    for (var si = 0; si < species.length; si++) {
      var sp = species[si];
      var count = smoltProduction[sp];
      if (count > 0 && OCEAN_STAGES[sp]) {
        cohorts.push({
          species: sp,
          yearClass: year,
          entryMonth: month,
          smolts: count,
          currentCount: count,
          stage: 'estuary',
          monthsInStage: 0,
          totalMonthsInOcean: 0,
          cumulativeSurvival: 1.0,
          stageSurvival: { estuary: 1, nearshore: 1, ocean: 1, return: 1 },
        });
      }
    }
  }

  // ── Process existing cohorts ──
  for (var ci = 0; ci < prev.cohorts.length; ci++) {
    var coh = {};
    var pc = prev.cohorts[ci];
    // Copy all fields
    for (var ck in pc) coh[ck] = pc[ck];

    var stages = OCEAN_STAGES[coh.species];
    var baseSurv = BASE_SURVIVAL[coh.species];
    if (!stages || !baseSurv) continue;

    coh.monthsInStage++;
    coh.totalMonthsInOcean++;

    // ── Stage-specific survival modifiers ──
    var monthSurv = 1.0;

    if (coh.stage === 'estuary') {
      // Estuarine survival — Beamer et al. 2005, Duffy et al. 2010
      // (See file-header note: Beamer 2005 is a framework-level citation;
      //  specific estuarine-survival magnitudes referenced under this stage
      //  fall under the Path 4 model-construction disclosure scope.)
      var estuarySurv = baseSurv.estuary;
      estuarySurv *= cl(0.7 + eQ * 0.3, 0.5, 1.0); // habitat quality
      estuarySurv *= cl(1 - seaLice * 0.3, 0.5, 1.0); // sea lice from aquaculture
      estuarySurv *= cl(1 - contam * 0.15, 0.7, 1.0); // contamination (Duwamish smolts)
      monthSurv = cl(estuarySurv, 0.70, 0.99);

      // Transition check
      if (coh.monthsInStage >= stages.estuary) {
        coh.stageSurvival.estuary = coh.cumulativeSurvival;
        coh.stage = 'nearshore';
        coh.monthsInStage = 0;
      }
    } else if (coh.stage === 'nearshore') {
      // Nearshore — Pearcy 1992, Beamish & Mahnken 2001
      var nearshoreSurv = baseSurv.nearshore;
      nearshoreSurv *= cl(0.6 + copQ * 0.4, 0.5, 1.0); // copepod prey quality
      nearshoreSurv *= cl(1 - (sst > 14 ? (sst - 14) * 0.04 : 0), 0.7, 1.0); // warm = bad
      nearshoreSurv *= cl(1 - mhwActive * mhwInt * 0.08, 0.5, 1.0); // MHW hits juveniles hard
      monthSurv = cl(nearshoreSurv, 0.80, 0.99);

      if (coh.monthsInStage >= stages.nearshore) {
        coh.stageSurvival.nearshore = coh.cumulativeSurvival;
        coh.stage = 'ocean';
        coh.monthsInStage = 0;
      }
    } else if (coh.stage === 'ocean') {
      // Open ocean — Ruggerone & Irvine 2018, Connors et al. 2020
      var oceanSurv = baseSurv.ocean;
      oceanSurv *= cl(0.8 + copQ * 0.2, 0.7, 1.0); // copepod community
      oceanSurv *= cl(1 - mhwActive * mhwInt * 0.05, 0.7, 1.0); // MHW in open ocean
      // Alaska hatchery competition (Ruggerone & Irvine 2018)
      // Odd-year pink releases reduce prey for all species
      if (year % 2 === 1) oceanSurv *= 0.97; // ~3% mortality boost in odd years
      monthSurv = cl(oceanSurv, 0.90, 0.995);

      if (coh.monthsInStage >= stages.ocean) {
        coh.stageSurvival.ocean = coh.cumulativeSurvival;
        coh.stage = 'return';
        coh.monthsInStage = 0;
      }
    } else if (coh.stage === 'return') {
      // Return migration — Hinch et al. 2012
      var returnSurv = baseSurv.return;
      returnSurv *= cl(1 - harvest * 0.5, 0.3, 1.0); // fisheries interception
      // Fraser en-route thermal mortality (sockeye, chinook especially)
      if ((coh.species === 'sockeye' || coh.species === 'chinook') && fraserTemp > 18) {
        returnSurv *= cl(1 - (fraserTemp - 18) * 0.08, 0.3, 1.0);
      }
      monthSurv = cl(returnSurv, 0.70, 0.99);

      if (coh.monthsInStage >= stages.return) {
        // Cohort completes — adults return!
        coh.stageSurvival.return = coh.cumulativeSurvival * monthSurv;
        var adults = Math.round(coh.smolts * coh.cumulativeSurvival * monthSurv);
        if (!returned[coh.species]) returned[coh.species] = 0;
        returned[coh.species] += adults;
        // Don't add to active cohorts — this cohort is done
        continue;
      }
    }

    // Apply monthly survival
    coh.cumulativeSurvival *= monthSurv;
    coh.currentCount = Math.round(coh.smolts * coh.cumulativeSurvival);

    // Remove if effectively zero
    if (coh.currentCount < 1) continue;

    cohorts.push(coh);
  }

  diagnostics.activeCohortsCount = cohorts.length;
  // Stage breakdown
  var sb = { estuary: 0, nearshore: 0, ocean: 0, return: 0 };
  for (var di = 0; di < cohorts.length; di++) sb[cohorts[di].stage]++;
  diagnostics.stageBreakdown = sb;
  diagnostics.totalInOcean = cohorts.reduce(function(s, c) { return s + c.currentCount; }, 0);

  return {
    cohorts: cohorts,
    adultsReturned: returned, // by species
    diagnostics: diagnostics,
    _carry: { cohorts: cohorts },
  };
}
