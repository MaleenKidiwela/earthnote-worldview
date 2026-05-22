// ═══════════════════════════════════════════════════════════
// SHORELINE COUPLING — Connective tissue between land and water
// ═══════════════════════════════════════════════════════════
// Wires the shoreline registry (75+ georeferenced assets) to
// every relevant compute module. Computes derived shoreline
// state from model dynamics without modifying calibrated modules.
//
// Reads FROM modules: nearshore, marine, port, urban, climate,
//   macroEconomy, ecosystem, publicHealth, contaminants
// Produces: per-asset condition, per-basin shoreline metrics,
//   coastal squeeze indices, restoration ROI, event impacts
//
// Called AFTER all modules have run for the timestep.
//
// Sources:
//   Shipman et al. 2010 — Coastal erosion and armoring
//   Dethier et al. 2016 — Shoreline armoring ecological effects
//   Schlenger et al. 2011 — PSNERP shoreline characterization
//   Thom et al. 2018 — PS salt marsh SLR vulnerability
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { cl } from './utils.js';

// ── PARENT BASIN MAPPING ──
// Maps sub-basins to parent basins used by computeNearshore
var SUB_TO_PARENT = {
  jdf_west: 'juanDeFuca', jdf_central: 'juanDeFuca', jdf_east: 'juanDeFuca',
  georgia_north: 'georgia', georgia_central: 'georgia', georgia_south: 'georgia',
  sj_haro: 'sanjuan', sj_rosario: 'sanjuan',
  whidbey_north: 'whidbey', whidbey_central: 'whidbey', whidbey_south: 'whidbey',
  main_north: 'mainBasin', main_central: 'mainBasin', main_south: 'mainBasin',
  hood_north: 'hoodCanal', hood_south: 'hoodCanal',
  ssound_north: 'southSound', ssound_south: 'southSound',
};

// ═══════════════════════════════════════════════════════════
// PART 1 — COASTAL SQUEEZE (SLR + armoring)
// ═══════════════════════════════════════════════════════════

// Compute coastal squeeze index per sub-basin.
// Squeeze = SLR rising from below + armor blocking landward migration.
// Citation: Shipman 2010, Thom et al. 2018
export function computeCoastalSqueeze(shorelineStats, cumulativeSLR, slrRateMmYr) {
  cumulativeSLR = cumulativeSLR !== undefined ? cumulativeSLR : 0;
  slrRateMmYr = slrRateMmYr !== undefined ? slrRateMmYr : 3.6;
  if (!shorelineStats) return {};

  var result = {};
  var basinKeys = Object.keys(shorelineStats);
  for (var i = 0; i < basinKeys.length; i++) {
    var sbk = basinKeys[i];
    var stats = shorelineStats[sbk];
    if (!stats) continue;

    var armorFrac = stats.armorFraction || 0;
    // Squeeze severity: SLR rate × armor fraction
    // 5 mm/yr threshold: below this, marshes/beaches can accrete fast enough
    // Above: squeeze is proportional to rate × armor — Thom et al. 2018
    var squeezeRate = slrRateMmYr > 5 ? cl((slrRateMmYr - 5) * armorFrac * 0.02, 0, 0.5) : 0;

    // Cumulative squeeze effect
    var squeezeFraction = cl(cumulativeSLR * armorFrac * 0.5, 0, 0.8);

    // Habitat at risk: eelgrass and marsh between armor and waterline
    var habitatAtRisk = cl(armorFrac * 0.7, 0, 0.9); // fraction of habitat squeezable

    result[sbk] = {
      squeezeRate: squeezeRate,         // per quarter loss rate
      squeezeFraction: squeezeFraction, // cumulative squeeze (0-1)
      habitatAtRisk: habitatAtRisk,     // fraction of habitat between armor and water
      armorFraction: armorFrac,
      slrRateMmYr: slrRateMmYr,
    };
  }
  return result;
}

// ═══════════════════════════════════════════════════════════
// PART 2 — CONTAMINATION EFFECTS ON ASSETS
// ═══════════════════════════════════════════════════════════

// Compute contamination impact on shoreline assets.
// Reads from nearshore state (contamIndex per parent basin).
export function computeContaminationImpacts(assets, nearshoreState) {
  if (!assets || !nearshoreState) return [];

  var results = [];
  for (var i = 0; i < assets.length; i++) {
    var a = assets[i];
    if (!a.contaminationExposure || a.contaminationExposure <= 0) continue;

    var parentBasin = SUB_TO_PARENT[a.subBasin] || 'mainBasin';
    var nsBasin = nearshoreState[parentBasin];
    var contamIndex = nsBasin ? (nsBasin.contamIndex || 0) : 0;

    // Impact: asset exposure × basin contamination level
    var impact = cl(a.contaminationExposure * contamIndex * 2, 0, 1);

    if (impact > 0.1) {
      results.push({
        assetId: a.id,
        assetName: a.name,
        subBasin: a.subBasin,
        category: a.category,
        contamImpact: impact,
        parentBasinContamIndex: contamIndex,
        // Specific effects by type
        shellfishAdvisory: a.type === 'shellfish_beds' && impact > 0.3,
        fishAdvisory: a.type === 'fishing_grounds' && impact > 0.4,
        beachClosure: a.type === 'public_beach' && impact > 0.3,
        culturalImpact: a.culturalValue && impact > 0.2,
        tribalNations: a.tribalNations || [],
      });
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════
// PART 3 — VESSEL TRAFFIC EFFECTS ON SHORELINE ASSETS
// ═══════════════════════════════════════════════════════════

// Compute noise/traffic impacts on ecologically sensitive shoreline sites.
export function computeVesselImpacts(assets, portState, ecoState) {
  if (!assets) return {};

  var basinNoise = (portState && portState.basinNoise) ? portState.basinNoise : {};
  var basinTraffic = (portState && portState.basinTraffic) ? portState.basinTraffic : {};
  var orcaViability = ecoState ? (ecoState.orcaViability !== undefined ? ecoState.orcaViability : 0.5) : 0.5;
  var orcaPop = ecoState ? (ecoState.orcaPopulation !== undefined ? ecoState.orcaPopulation : 73) : 73;

  var result = {
    // Whale watching revenue depends on SRKW presence and health
    whaleWatchingRevenueMod: cl(orcaViability * 0.7 + (orcaPop / 74) * 0.3, 0.1, 1.2),
    // Orca rubbing beach disturbance from vessel proximity
    rubbingBeachDisturbance: 0,
    // Herring spawning disturbance
    herringSpawningDisturbance: 0,
  };

  // Orca rubbing beaches in Haro Strait
  var haroNoise = basinNoise.sanjuan || basinNoise.sj_haro;
  if (haroNoise) {
    var noiseAgg = typeof haroNoise === 'object' ? (haroNoise.aggregate || haroNoise.mid || 0) : (haroNoise || 0);
    // Noise above 120 dB disturbs orca behavior — Holt et al. 2009
    result.rubbingBeachDisturbance = cl((noiseAgg - 115) / 20, 0, 0.8);
  }

  // Herring spawning disturbance at Cherry Point (Feb-Apr)
  var georgiaTraffic = basinTraffic.georgia || basinTraffic.georgia_south || 0;
  // High vessel traffic during spawning season disrupts aggregations
  result.herringSpawningDisturbance = cl(georgiaTraffic / 500 * 0.3, 0, 0.4);

  return result;
}

// ═══════════════════════════════════════════════════════════
// PART 4 — DEVELOPMENT PRESSURE ON SHORELINE
// ═══════════════════════════════════════════════════════════

// Compute armor fraction change from development vs restoration.
// Returns per-basin armor delta.
export function computeArmorDynamics(shorelineStats, macroState, restorationInvestment, dt) {
  dt = dt !== undefined ? dt : 1;
  restorationInvestment = restorationInvestment !== undefined ? restorationInvestment : 0.3;
  if (!shorelineStats) return {};

  var housingPressure = macroState ? (macroState.housingPressure || 1.0) : 1.0;
  var devPressure = macroState ? (macroState.developmentPressure || 1.0) : 1.0;

  var result = {};
  var basinKeys = Object.keys(shorelineStats);
  for (var i = 0; i < basinKeys.length; i++) {
    var sbk = basinKeys[i];
    var stats = shorelineStats[sbk];
    if (!stats) continue;

    var currentArmor = stats.armorFraction || 0;
    // New armoring: development pressure × housing demand × available natural shoreline
    // Dethier et al. 2016: ~0.3-0.5% new armoring per year in urban Puget Sound
    var newArmoring = cl(devPressure * housingPressure * (1 - currentArmor) * 0.001 * dt, 0, 0.01);
    // Armor removal: restoration investment drives removal
    // Shore Friendly program: ~0.1-0.3% removal per year at moderate investment
    var armorRemoval = cl(restorationInvestment * 0.002 * dt, 0, 0.005);

    var armorDelta = newArmoring - armorRemoval;

    result[sbk] = {
      currentArmor: currentArmor,
      newArmoring: newArmoring,
      armorRemoval: armorRemoval,
      armorDelta: armorDelta,
      projectedArmor: cl(currentArmor + armorDelta, 0.01, 0.80),
      naturalShorelineKm: stats.totalShorelineKm * (1 - currentArmor),
    };
  }
  return result;
}

// ═══════════════════════════════════════════════════════════
// PART 5 — STORM AND EXTREME EVENT EFFECTS
// ═══════════════════════════════════════════════════════════

// Compute storm/AR impacts on shoreline assets.
export function computeStormImpacts(assets, climateExports, quarter) {
  if (!assets || !climateExports) return { csoOverflows: 0, beachClosures: 0, erosionEvents: 0 };

  var arMaxIntensity = climateExports.climArMaxIntensity || 0;
  var arEventCount = climateExports.climArEventCount || 0;
  var isWinter = quarter === 0 || quarter === 3;

  // CSO overflows during storms (main_north has ~90 CSO points)
  var csoOverflows = 0;
  var beachClosures = 0;
  var erosionEvents = 0;
  var impactedAssets = [];

  for (var i = 0; i < assets.length; i++) {
    var a = assets[i];
    var stormVuln = a.stormSurgeVulnerability || 0;
    var erosionVuln = a.erosionVulnerability || 0;

    // CSO overflow: storm + winter + urban sub-basin
    if (a.type === 'cso' && arMaxIntensity > 0.3 && isWinter) {
      csoOverflows += Math.round(90 * cl(arMaxIntensity, 0, 1)); // up to 90 overflows
    }

    // Beach closures from CSO + stormwater
    if (a.type === 'public_beach' && arMaxIntensity > 0.5) {
      beachClosures++;
    }

    // Erosion events on exposed assets
    if (a.exposure === 'exposed' && erosionVuln > 0.3 && isWinter && arMaxIntensity > 0.4) {
      erosionEvents++;
      impactedAssets.push({ id: a.id, name: a.name, erosionVuln: erosionVuln });
    }
  }

  return {
    csoOverflows: csoOverflows,
    beachClosures: beachClosures,
    erosionEvents: erosionEvents,
    impactedAssets: impactedAssets,
    arMaxIntensity: arMaxIntensity,
  };
}

// ═══════════════════════════════════════════════════════════
// PART 6 — RESTORATION TRACKING
// ═══════════════════════════════════════════════════════════

// Track restoration progress and compute ROI.
export function computeRestorationMetrics(assets, nearshoreState) {
  if (!assets) return { totalRestoredHa: 0, activeProjects: 0, totalInvestment: 0, ecologicalROI: 0 };

  var restorationAssets = [];
  var totalRestoredHa = 0;
  var totalInvestment = 0;

  for (var i = 0; i < assets.length; i++) {
    var a = assets[i];
    if (a.restorationActive || a.protectionStatus === 'restoring') {
      restorationAssets.push(a);
      totalRestoredHa += a.area_ha || 0;
      // Estimated investment per project (based on Nisqually ~$15M for 360ha = ~$42K/ha)
      totalInvestment += (a.area_ha || 10) * 42000;
    }
  }

  // Ecological ROI: nearshore health improvement per dollar invested
  var avgNearshoreHealth = 0;
  if (nearshoreState) {
    var keys = Object.keys(nearshoreState);
    for (var j = 0; j < keys.length; j++) {
      if (nearshoreState[keys[j]] && nearshoreState[keys[j]].nearshoreHealth !== undefined) {
        avgNearshoreHealth += nearshoreState[keys[j]].nearshoreHealth;
      }
    }
    avgNearshoreHealth = keys.length > 0 ? avgNearshoreHealth / keys.length : 0.5;
  }

  return {
    activeProjects: restorationAssets.length,
    totalRestoredHa: totalRestoredHa,
    totalInvestment: totalInvestment,
    ecologicalROI: totalInvestment > 0 ? avgNearshoreHealth / (totalInvestment / 1e6) : 0,
    projects: restorationAssets.map(function(a) {
      return { id: a.id, name: a.name, subBasin: a.subBasin, area_ha: a.area_ha || 0 };
    }),
  };
}

// ═══════════════════════════════════════════════════════════
// MASTER COUPLING FUNCTION
// ═══════════════════════════════════════════════════════════

// Run all shoreline coupling computations for a single timestep.
// Called from orchestrator after all modules have run.
//
// Parameters:
//   assets: SHORE_ASSETS array from shorelineRegistry.js
//   shorelineStats: SHORELINE_STATS from shorelineRegistry.js
//   moduleState: { marine, nearshore, port, urban, climate, macro, ecosystem }
//   quarter, year, dt
//
// Returns comprehensive shoreline state.
export function computeShorelineCoupling(assets, shorelineStats, moduleState, quarter, year, dt) {
  dt = dt !== undefined ? dt : 1;
  var ms = moduleState || {};
  var marineState = ms.marine || {};
  var nearshoreState = (ms.nearshore && ms.nearshore.basins) ? ms.nearshore.basins : {};
  var portState = ms.port || {};
  var climateExports = ms.climate || {};
  var macroState = ms.macro || {};
  var ecoState = ms.ecosystem || {};

  var cumulativeSLR = marineState.cumulativeSLR || 0;
  var slrRateMmYr = marineState.slrRateMmYr || 3.6;

  // Run all coupling computations
  var squeeze = computeCoastalSqueeze(shorelineStats, cumulativeSLR, slrRateMmYr);
  var contamImpacts = computeContaminationImpacts(assets, nearshoreState);
  var vesselImpacts = computeVesselImpacts(assets, portState, ecoState);
  var armorDynamics = computeArmorDynamics(shorelineStats, macroState, 0.3, dt);
  var stormImpacts = computeStormImpacts(assets, climateExports, quarter);
  var restoration = computeRestorationMetrics(assets, nearshoreState);

  // Aggregate shoreline health index (0-1)
  var healthFactors = [];
  var squeezeKeys = Object.keys(squeeze);
  for (var i = 0; i < squeezeKeys.length; i++) {
    healthFactors.push(1 - squeeze[squeezeKeys[i]].squeezeFraction);
  }
  var avgSqueeze = healthFactors.length > 0 ?
    healthFactors.reduce(function(s, v) { return s + v; }, 0) / healthFactors.length : 0.8;
  var contamCount = contamImpacts.length;
  var contamPenalty = cl(contamCount / 20, 0, 0.2);

  var shorelineHealthIndex = cl(avgSqueeze - contamPenalty - stormImpacts.erosionEvents * 0.01, 0, 1);

  return {
    coastalSqueeze: squeeze,
    contaminationImpacts: contamImpacts,
    vesselImpacts: vesselImpacts,
    armorDynamics: armorDynamics,
    stormImpacts: stormImpacts,
    restoration: restoration,
    shorelineHealthIndex: shorelineHealthIndex,
    totalAssets: assets.length,
    cumulativeSLR_m: cumulativeSLR,
    slrRate_mmYr: slrRateMmYr,
  };
}
