// ═══════════════════════════════════════════════════════════
// CHOKEPOINT — Strait of Juan de Fuca strategic analysis
// ═══════════════════════════════════════════════════════════
// The Strait of Juan de Fuca is the ONLY deep-water entrance
// to the Salish Sea. Every container ship, submarine, tanker,
// cruise ship, and naval vessel passes through it.
//
// If JdF is blocked or restricted, the ENTIRE Salish Sea
// maritime economy stops. Prince Rupert (different route to
// Pacific) is the only PNW port still accessible.
//
// Sources:
//   USCG Vessel Traffic Service Puget Sound (VTS)
//   NOAA nautical charts (TSS layout)
//   JOC/IHS Markit PNW gateway analysis
//   FEMA Cascadia Rising 2016
//   Canadian Coast Guard Marine Communications
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl, seededRandom } from './utils.js';

// ── CHOKEPOINT PHYSICAL PARAMETERS ──
var CHOKEPOINT = {
  entranceWidthKm: 20,       // width at Pacific entrance
  admiraltyWidthKm: 3,       // narrowest point — Admiralty Inlet
  tssLanes: 2,               // inbound + outbound
  separationZoneKm: 1,       // TSS separation zone width
  maxSimultaneousLarge: 18,   // practical limit from TSS spacing
  // Daily traffic baseline — USCG VTS Puget Sound
  dailyCommercial: 50,       // container + tanker + bulk + cruise
  dailyMilitary: 3,          // submarine transits + surface naval
  dailyFerry: 8,             // international ferries (Victoria, Sidney)
  dailyFishing: 15,          // commercial fishing vessels
  dailyRecreational: 20,     // summer peak; winter ~5
  // Economic value flowing through the chokepoint
  dailyTradeValueM: 274,     // $274M/day trade — our existing model value
};

// ── CAPACITY FACTORS ──
// Conditions that reduce effective chokepoint capacity
var CAPACITY_FACTORS = {
  fog: { reduction: 0.4, probability: { winter: 0.15, summer: 0.05 } },
  tidalCurrent: { reduction: 0.2, probability: { all: 0.10 } }, // deep-draft window restrictions
  militaryEscort: { reduction: 0.15, probability: { all: 0.08 } }, // submarine escort closes one lane briefly
  iceNone: { reduction: 0.0, probability: { all: 0.0 } }, // Salish Sea never ices
};

// ── CLOSURE SCENARIOS ──
// Events that can close the strait
var CLOSURE_EVENTS = {
  oilSpill: {
    probability: 0.002,      // per quarter
    durationDays: 7,          // cleanup restricts traffic
    tradeDisruptionM: 1918,   // $274M/day × 7 days
  },
  m9TsunamiDebris: {
    probability: 0.0005,     // only during M9
    durationDays: 14,         // debris clearance
    tradeDisruptionM: 3836,
  },
  securityEvent: {
    probability: 0.001,      // Navy closes strait
    durationDays: 2,          // typically brief
    tradeDisruptionM: 548,
  },
  majorVesselCasualty: {
    probability: 0.001,
    durationDays: 5,          // grounding or sinking blocks channel
    tradeDisruptionM: 1370,
  },
};

// ── TRAFFIC DENSITY PER SUB-BASIN ──
// All traffic funnels through the strait
var TRANSIT_DENSITY = {
  jdf_west:     40,  // all traffic enters/exits here
  jdf_central:  40,  // all traffic transits through
  jdf_east:     45,  // convergence: Admiralty + Vancouver split
  sj_haro:      18,  // Vancouver-bound only — ALL Vancouver containers + TMX tankers through SRKW habitat
  sj_rosario:   6,   // smaller vessels, fishing, some San Juan ferry
};

// ═══════════════════════════════════════════════════════════
// COMPUTATION
// ═══════════════════════════════════════════════════════════

// Compute chokepoint status for the current timestep.
// Returns capacity, vulnerability, closure risk, and traffic density.
export function computeChokepointStatus(portState, shocks, climExports, quarter, seed) {
  seed = seed !== undefined ? seed : 42;
  var _q = quarter !== undefined ? quarter : 0;

  // ── EFFECTIVE CAPACITY ──
  var isWinter = _q === 0 || _q === 3;
  var fogProb = isWinter ? CAPACITY_FACTORS.fog.probability.winter : CAPACITY_FACTORS.fog.probability.summer;
  var fogActive = seededRandom(seed + 1111) < fogProb;
  var tidalRestriction = seededRandom(seed + 2222) < CAPACITY_FACTORS.tidalCurrent.probability.all;
  var militaryEscort = seededRandom(seed + 3333) < CAPACITY_FACTORS.militaryEscort.probability.all;

  var capacityReduction = 0;
  if (fogActive) capacityReduction += CAPACITY_FACTORS.fog.reduction;
  if (tidalRestriction) capacityReduction += CAPACITY_FACTORS.tidalCurrent.reduction;
  if (militaryEscort) capacityReduction += CAPACITY_FACTORS.militaryEscort.reduction;

  var effectiveCapacity = cl(1 - capacityReduction, 0.3, 1.0);

  // ── CLOSURE RISK ──
  var closureRisk = 0;
  var closureKeys = Object.keys(CLOSURE_EVENTS);
  for (var i = 0; i < closureKeys.length; i++) {
    closureRisk += CLOSURE_EVENTS[closureKeys[i]].probability;
  }
  // AR events increase spill risk (rough seas)
  var arIntensity = climExports ? (climExports.climArMaxIntensity || 0) : 0;
  closureRisk += arIntensity * 0.001;

  // Earthquake shock dramatically increases closure risk
  var earthquake = shocks ? (shocks.earthquake || shocks.cascadia_m9 || 0) : 0;
  if (earthquake > 0.1) {
    closureRisk += 0.5; // very high — debris, safety inspections
    effectiveCapacity *= 0.3; // severe reduction
  }

  // ── ACTUAL CLOSURE EVENT ──
  var closureActive = seededRandom(seed + 4444) < closureRisk;
  var closureDays = 0;
  var tradeDisruptionM = 0;
  if (closureActive) {
    // Determine which event
    var closureRng = seededRandom(seed + 5555);
    if (earthquake > 0.1) {
      closureDays = 14;
      tradeDisruptionM = CHOKEPOINT.dailyTradeValueM * closureDays;
    } else if (closureRng < 0.4) {
      closureDays = CLOSURE_EVENTS.oilSpill.durationDays;
      tradeDisruptionM = CLOSURE_EVENTS.oilSpill.tradeDisruptionM;
    } else if (closureRng < 0.7) {
      closureDays = CLOSURE_EVENTS.securityEvent.durationDays;
      tradeDisruptionM = CLOSURE_EVENTS.securityEvent.tradeDisruptionM;
    } else {
      closureDays = CLOSURE_EVENTS.majorVesselCasualty.durationDays;
      tradeDisruptionM = CLOSURE_EVENTS.majorVesselCasualty.tradeDisruptionM;
    }
  }

  // ── TRAFFIC DENSITY ──
  var traffic = {};
  var recMod = isWinter ? 0.25 : 1.0;
  var tdKeys = Object.keys(TRANSIT_DENSITY);
  for (var ti = 0; ti < tdKeys.length; ti++) {
    var sbk = tdKeys[ti];
    traffic[sbk] = Math.round(TRANSIT_DENSITY[sbk] * effectiveCapacity * (sbk === 'sj_rosario' ? recMod : 1));
  }

  // ── VULNERABILITY INDEX ──
  // Higher = more vulnerable to disruption
  var vulnerability = cl(
    closureRisk * 5           // base closure probability weight
    + (1 - effectiveCapacity) * 0.3  // current capacity reduction
    + (earthquake > 0.1 ? 0.4 : 0)  // seismic factor
    + arIntensity * 0.1,     // storm factor
    0, 1
  );

  return {
    effectiveCapacity: effectiveCapacity,
    closureActive: closureActive,
    closureDays: closureDays,
    tradeDisruptionM: tradeDisruptionM,
    closureRisk: closureRisk,
    vulnerability: vulnerability,
    traffic: traffic,
    conditions: {
      fogActive: fogActive,
      tidalRestriction: tidalRestriction,
      militaryEscort: militaryEscort,
    },
    // Prince Rupert bypasses JdF entirely — different route to Pacific
    princeRupertAccessible: true, // always, regardless of JdF status
    dailyTradeValueM: CHOKEPOINT.dailyTradeValueM,
  };
}

// ── MILITARY READINESS ──
// Navy deployment capability depends on infrastructure condition
export function computeMilitaryReadiness(infraState, chokepointStatus, shocks) {
  var earthquake = shocks ? (shocks.earthquake || shocks.cascadia_m9 || 0) : 0;

  // Bangor accessibility: depends on Hood Canal infrastructure
  var bangorAccess = 1.0;
  if (earthquake > 0.1) {
    bangorAccess = cl(0.4 + (infraState ? (infraState.i5Condition || 0.5) : 0.5) * 0.3, 0.2, 0.8);
  }

  // PSNS operational: depends on Main Basin infrastructure
  var psnsOperational = 1.0;
  if (earthquake > 0.1) {
    psnsOperational = cl(0.5 + (infraState ? (infraState.waterCondition || 0.5) : 0.5) * 0.3, 0.3, 0.85);
  }

  // JdF transit: can submarines get to the Pacific?
  var jdfTransit = chokepointStatus ? chokepointStatus.effectiveCapacity : 1.0;

  // Overall readiness
  var readiness = cl(bangorAccess * 0.4 + psnsOperational * 0.3 + jdfTransit * 0.3, 0.1, 1.0);

  // Post-M9: military becomes disaster relief asset
  var disasterResponseCapability = earthquake > 0.1 ?
    cl(readiness * 0.8, 0.3, 0.9) : // can still respond but degraded
    1.0;

  return {
    readiness: readiness,
    bangorAccess: bangorAccess,
    psnsOperational: psnsOperational,
    jdfTransitCapacity: jdfTransit,
    disasterResponseCapability: disasterResponseCapability,
    strategicAssets: {
      ssbnsDeployable: Math.round(8 * bangorAccess * jdfTransit),
      carriersInMaintenance: psnsOperational > 0.5 ? 1 : 0,
    },
  };
}

// ── SONAR EXERCISE NOISE ──
// Compute acute noise impact from naval sonar exercise
export function computeSonarNoise(exerciseActive, exerciseSubBasin) {
  if (!exerciseActive) {
    return { active: false, subBasin: null, noisePulse_dB: 0, frequencyHz: 0 };
  }
  return {
    active: true,
    subBasin: exerciseSubBasin || 'hood_north',
    noisePulse_dB: 210, // received level at 1km from 235 dB source
    sourceLevel_dB: 235,
    frequencyHz: 3500,  // mid-frequency active sonar center
    bandHz: [1000, 10000],
    marineDisplacement: true, // marine mammals leave the area
  };
}

export { CHOKEPOINT, CLOSURE_EVENTS, TRANSIT_DENSITY };
