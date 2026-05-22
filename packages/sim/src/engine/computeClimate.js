// ═══════════════════════════════════════════════════════════
// computeClimate.js — Regional Atmospheric Physics Engine
// ═══════════════════════════════════════════════════════════
// Consolidates atmospheric forcing for the Salish Sea region:
//   Atmospheric rivers (physics-based IVT model, AR1-AR5 scale)
//   Rain shadow / orographic effects (per-basin precipitation)
//   Puget Sound Convergence Zone
//   Temperature regimes (per-basin, seasonal, urban heat island)
//   Precipitation type partitioning (rain/snow)
//   ENSO/PDO state machine (consolidated from utils.js)
//
// Key references:
//   Ralph et al. 2019 — AR scale (BAMS 100:269-289)
//   Payne & Magnusdottir 2015 — AR intensification under warming
//   Cai et al. 2014 — ENSO intensification (Nature Clim. Change 4:111-116)
//   Mass 2008 — Weather of the Pacific Northwest (rain shadow, convergence zone)
//   Mote et al. 2018 — PNW climate change impacts (Climatic Change)
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl, seededRandom, ensoPhase, pdoPhase, seasonalPeak } from './utils.js';

export function computeClimate(P, prev, shocks, quarter, year, climD) {
  var sstDelta = climD ? (climD.sstDelta !== undefined ? climD.sstDelta : 0) : 0;
  var yearsSince2026 = year - 2026;
  var _prev = prev || {};

  // Carry-forward state
  var prevARSequence = _prev.arSequenceCount !== undefined ? _prev.arSequenceCount : 0;

  // ═══════════════════════════════════════════════════════════
  // 1. ENSO / PDO STATE MACHINE (consolidated)
  // ═══════════════════════════════════════════════════════════
  // Uses the existing Markov chain from utils.js but surfaces full state
  // PDO: 25-year cycle with stochastic perturbation
  // ENSO: Markov chain, amplitude increases with warming (Cai et al. 2014)

  var ensoValue = ensoPhase(yearsSince2026);
  var pdoValue = pdoPhase(yearsSince2026);

  // pdoPhaseOverride param (default 0=Auto): force PDO phase for scenario testing
  // 0=Auto (stochastic), 1=Force warm, 2=Force cool, 3=Force neutral
  var pdoOverride = P.pdoPhaseOverride !== undefined ? P.pdoPhaseOverride : 0;
  if (pdoOverride === 1) pdoValue = 0.8;       // warm phase
  else if (pdoOverride === 2) pdoValue = -0.8;  // cool phase
  else if (pdoOverride === 3) pdoValue = 0;     // neutral

  // ENSO amplitude amplification under warming (Cai et al. 2014: ~40% per 2°C)
  // Thwaites collapse adds +0.3 (handled in orchestrator, but we also apply here)
  // 0.2 — ENSO amplitude gain per °C SST warming, unitless; Cai et al. 2014 (Nature Clim. Change 4:111-116), ~20%/°C
  // 1.0 — minimum amplification factor (no reduction below baseline), unitless
  // 2.5 — maximum amplification cap to prevent runaway ENSO, unitless; Cai et al. 2014 extreme scenario bound
  // The 0.2/°C amplification rate is a Path 4 model-construction choice
  //   within the Cai et al. 2014 ENSO-under-warming framework. Cai 2014
  //   establishes frequency-doubling of extreme El Niño qualitatively;
  //   the 40%/2°C → 0.2/°C derivation and the 2.5 cap are not paper-direct
  //   from Cai 2014 or Cai 2023. Path 4 per Amendment 6 §5.24(b). See
  //   docs/citation-audit-followups.md Scout #3 entry.
  var ensoAmplification = cl(1.0 + sstDelta * 0.2, 1.0, 2.5);
  var effectiveEnso = ensoValue * ensoAmplification;

  // Combined ocean state
  // 0.6 — ENSO weighting in SST anomaly blend, unitless; ENSO dominates interannual variability — Trenberth 1997 (Bull. AMS 78:2771-2777)
  // 0.4 — PDO weighting in SST anomaly blend, unitless; PDO modulates decadal background — Mantua et al. 1997
  var sstAnomaly = effectiveEnso * 0.6 + pdoValue * 0.4;
  // -0.12 — El Niño precipitation sensitivity, unitless fraction per ENSO unit; Ropelewski & Halpert 1986, PNW dries ~10-15% during El Niño
  // -0.05 — warm PDO precipitation sensitivity, unitless fraction per PDO unit; weaker than ENSO — Mantua et al. 1997
  var precipAnomaly = 1 + effectiveEnso * -0.12 + pdoValue * -0.05; // El Niño = drier PNW

  // ENSO phase for labeling
  // 0.5 / -0.5 — thresholds for El Niño / La Niña classification, unitless ENSO index; Trenberth 1997 (±0.5°C Niño-3.4 convention)
  var ensoPhaseLabel = effectiveEnso > 0.5 ? "El Nino" : effectiveEnso < -0.5 ? "La Nina" : "Neutral";
  // 0.2 / -0.2 — thresholds for warm/cool PDO phase classification, unitless PDO index; Mantua et al. 1997
  var pdoPhaseLabel = pdoValue > 0.2 ? "Warm" : pdoValue < -0.2 ? "Cool" : "Neutral";

  // Ocean survival modifier for salmon (negative = poor survival)
  // El Niño + warm PDO = poor salmon marine survival (Mantua et al. 1997)
  // -0.05 — ENSO effect on salmon marine survival, unitless fraction per ENSO unit; Mantua et al. 1997, Mueter et al. 2002
  // -0.04 — PDO effect on salmon marine survival, unitless fraction per PDO unit; Mantua et al. 1997
  var oceanSurvivalMod = effectiveEnso * -0.05 + pdoValue * -0.04;

  // ═══════════════════════════════════════════════════════════
  // 2. TEMPERATURE REGIMES (per-basin, seasonal)
  // ═══════════════════════════════════════════════════════════
  // Maritime-continental gradient (Mass 2008, Weather of PNW):
  //   Coastal basins: narrow range, moderated by Pacific
  //   Inland basins: wider seasonal range
  //   Fraser corridor: continental extremes (handled by computeFraser)

  // Baseline seasonal temperature by basin (°C)
  // quarter: 0=winter, 1=spring, 2=summer, 3=fall
  // Values from NOAA CO-OPS station climatology (1991-2020 normals) and Environment Canada
  var BASIN_TEMP = {
    juanDeFuca: [6, 9, 14, 10],    // Pacific-exposed, narrow range — Neah Bay/Port Angeles stations
    georgia:    [4, 9, 17, 10],    // Fraser influence — Vancouver Intl / Nanaimo stations
    sanjuan:    [5, 9, 15, 10],    // Rain shadow but coastal — Friday Harbor station
    whidbey:    [4, 9, 16, 10],    // Moderate — Whidbey Island NAS climatology
    mainBasin:  [4, 10, 18, 10],   // Urban influence (Seattle) — SeaTac/Seattle stations
    hoodCanal:  [4, 9, 16, 9],    // Fjord — moderate — Hoodsport/Bremerton stations
    southSound: [3, 9, 17, 9],    // Slightly more continental — Olympia station
  };

  // Urban heat island: +1-3°C for metro areas (Oke 1973, Boustead 2015)
  // Values in °C, applied at full strength in summer, halved otherwise
  var URBAN_HEAT = {
    juanDeFuca: 0,      // no significant urban area
    georgia: 1.5,       // Vancouver metro — °C; Oke 1973
    sanjuan: 0,         // no significant urban area
    whidbey: 0.3,       // small towns only — °C
    mainBasin: 2.0,     // Seattle/Tacoma metro — °C; Boustead 2015
    hoodCanal: 0,       // no significant urban area
    southSound: 0.5,    // Olympia — °C
  };

  var basinTemps = {};
  var basinKeys = ["juanDeFuca", "georgia", "sanjuan", "whidbey", "mainBasin", "hoodCanal", "southSound"];
  for (var bi = 0; bi < basinKeys.length; bi++) {
    var bid = basinKeys[bi];
    var baseT = BASIN_TEMP[bid][quarter];
    // 1.0 / 0.5 — summer/non-summer UHI seasonal modulation, unitless fraction; UHI strongest in calm, clear summer conditions — Oke 1973
    var uhi = URBAN_HEAT[bid] * (quarter === 2 ? 1.0 : 0.5); // UHI stronger in summer
    // 0.5 — coastal warming dampening factor, unitless fraction of SST delta; ocean thermal inertia moderates coastal temps — Mass 2008
    // 0.7 — inland warming sensitivity, unitless fraction of SST delta; less ocean buffering — Mass 2008, Mote et al. 2018
    var warming = sstDelta * (bid === "juanDeFuca" || bid === "sanjuan" ? 0.5 : 0.7); // coastal dampened
    // 0.3 — ENSO-to-regional-temp coupling coefficient, °C per unit SST anomaly; Ropelewski & Halpert 1986
    var ensoTemp = sstAnomaly * 0.3; // ENSO modulates regional temp
    basinTemps[bid] = baseT + warming + uhi + ensoTemp;
  }

  // Degree-days above/below thresholds
  // 91.25 — days per quarter, days; 365.25 / 4
  var daysPerQuarter = 91.25;
  var basinDegreeDays = {};
  for (var di = 0; di < basinKeys.length; di++) {
    var dbid = basinKeys[di];
    var t = basinTemps[dbid];
    basinDegreeDays[dbid] = {
      above0: t > 0 ? t * daysPerQuarter : 0,    // growing degree-days base 0°C, °C·days
      above5: t > 5 ? (t - 5) * daysPerQuarter : 0,  // growing degree-days base 5°C (vegetation threshold), °C·days
      above18: t > 18 ? (t - 18) * daysPerQuarter : 0, // cooling degree-days base 18°C (human comfort), °C·days
      below0: t < 0 ? Math.abs(t) * daysPerQuarter : 0, // freezing degree-days, °C·days
    };
  }

  // Frost-free season: approximation based on mean temp
  // Historically ~200 days in lowlands, lengthening ~5 days/°C (Mote et al. 2018)
  // 200 — baseline frost-free season length, days; PNW lowland average — Mote et al. 2018 (Climatic Change 153:1.2:69-88)
  // 5 — frost-free season lengthening rate, days per °C warming; Mote et al. 2018
  // 150 — minimum frost-free days, days; hard floor for cold scenarios
  // 365 — maximum frost-free days, days; physical upper limit
  var frostFreeDays = cl(200 + sstDelta * 5, 150, 365);

  // ═══════════════════════════════════════════════════════════
  // 3. RAIN SHADOW MODEL (orographic precipitation)
  // ═══════════════════════════════════════════════════════════
  // Olympic and Cascade rain shadows create dramatic west-east gradient
  // (Mass 2008: Quinault ~4000mm/yr vs Sequim ~450mm/yr)
  //
  // Orographic enhancement factors per basin (relative to regional mean)
  // Unitless scaling factors derived from PRISM climate data and Mass 2008
  var RAIN_SHADOW = {
    juanDeFuca: 1.0,    // Pacific-exposed, baseline reference — PRISM
    georgia:    0.70,   // Partial shadow from Vancouver Island — Mass 2008; ~70% of windward
    sanjuan:    0.40,   // Deep rain shadow — driest in western WA (~450mm/yr Sequim) — PRISM; Mass 2008
    whidbey:    0.80,   // Moderate shadow — PRISM
    mainBasin:  0.90,   // Seattle area, moderate — Sea-Tac ~960mm/yr — PRISM
    hoodCanal:  1.20,   // Olympic east slopes — enhanced orographic lift — PRISM; Mass 2008
    southSound: 0.85,   // Moderate — Olympia ~1270mm/yr — PRISM
  };

  // Regional baseline precipitation (mm/quarter, seasonal)
  // PNW: wet winter, dry summer (Mediterranean-ish pattern)
  // Values in mm/quarter — Sea-Tac 1991-2020 normals (~960mm/yr total), scaled to regional average
  var regionalPrecip = [300, 180, 80, 260]; // Q0=winter, Q1=spring, Q2=summer, Q3=fall
  var basePrecipQuarter = regionalPrecip[quarter] * precipAnomaly;

  // Per-basin precipitation
  var basinPrecip = {};
  for (var pi = 0; pi < basinKeys.length; pi++) {
    var pbid = basinKeys[pi];
    basinPrecip[pbid] = basePrecipQuarter * RAIN_SHADOW[pbid];
  }

  // ═══════════════════════════════════════════════════════════
  // 4. PUGET SOUND CONVERGENCE ZONE
  // ═══════════════════════════════════════════════════════════
  // PSCZ: wind splits around Olympics, reconverges over N King / S Snohomish
  // (Mass 2008, ch. 8). Creates intense localized precipitation band.
  // Active with west-northwest flow, primarily winter months.

  var czActive = 0;
  var czEnhancement = 1.0;
  if (quarter === 0 || quarter === 3) { // winter + fall
    // ~30% of winter days with conditions favorable for PSCZ
    // 44449 — arbitrary seed offset for PSCZ stochastic generation
    var czSeed = seededRandom(year * 100 + quarter * 25 + 44449);
    // 0.30 — baseline PSCZ activation probability, unitless; ~30% of winter days — Mass 2008 ch. 8; Colle & Mass 2000 (Mon. Wea. Rev. 128:208-225)
    // 0.05 — La Niña ENSO modulation of PSCZ probability, unitless; more westerly flow favors convergence — Colle & Mass 2000
    var czProb = 0.30 + effectiveEnso * 0.05; // slightly more likely during La Niña (more westerly flow)
    if (czSeed < czProb) {
      czActive = 1;
      // 1.5 — minimum PSCZ precipitation enhancement factor, unitless; Colle & Mass 2000
      // 1.0 — stochastic range of additional enhancement, unitless; event-to-event variability
      // 2.5 — maximum PSCZ precipitation enhancement factor, unitless; extreme events can double+ precip — Mass 2008
      // 55551 — arbitrary seed offset for PSCZ intensity stochastic generation
      czEnhancement = cl(1.5 + seededRandom(year * 100 + quarter * 25 + 55551) * 1.0, 1.5, 2.5);
      // Apply to affected basins (Whidbey + Main Basin)
      basinPrecip.whidbey = basinPrecip.whidbey * czEnhancement;
      // 0.6 — Main Basin partial PSCZ effect fraction, unitless; convergence zone centered north of Seattle, Main Basin gets southern fringe — Mass 2008
      basinPrecip.mainBasin = basinPrecip.mainBasin * (1 + (czEnhancement - 1) * 0.6); // partial effect
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 5. ATMOSPHERIC RIVER PHYSICS
  // ═══════════════════════════════════════════════════════════
  // Physics-based IVT model (Ralph et al. 2019, BAMS 100:269-289):
  //   AR category determined by integrated vapor transport (IVT)
  //   IVT increases ~7% per °C (Clausius-Clapeyron, Payne & Magnusdottir 2015)
  //   Seasonality: Oct-Mar (Q0 + Q3), peak Dec-Jan
  //   3 landfall zones: Olympic, North Cascades, BC Interior
  //   Sequence tracking: back-to-back ARs compound flood risk

  var arSeason = (quarter === 0 || quarter === 3) ? 1 : 0; // Oct-Mar active season
  var arShock = shocks.atmosphericRiver || 0;

  // IVT baseline: ~250 kg/m/s threshold for AR, ~1000+ for AR5
  // Warming increases IVT capacity: ~7% per °C (Clausius-Clapeyron)
  // 1.07 — Clausius-Clapeyron IVT scaling factor per °C, unitless; ~7% increase in atmospheric moisture capacity per °C — Payne & Magnusdottir 2015
  // arIntensityMod param (default 100%): scales AR event intensity
  // At 100%: baseline AR strength. At 200%: double IVT → more intense precipitation events.
  var arIntensityMod = (P.arIntensityMod !== undefined ? P.arIntensityMod : 100) / 100;
  var ivtBoost = Math.pow(1.07, sstDelta) * arIntensityMod; // compound 7%/°C × user modifier

  // Stochastic AR generation: ~3-6 events per season at baseline
  // Each quarter in season has ~1.5 events on average (3 per season / 2 quarters)
  var arEvents = [];
  var arSequenceCount = 0;
  var arTotalPrecip = {};
  for (var ai = 0; ai < basinKeys.length; ai++) arTotalPrecip[basinKeys[ai]] = 0;

  var maxArIntensity = 0;
  var maxArCategory = 0;

  // 0.1 — manual AR shock activation threshold, unitless; below this value, use stochastic generation
  if (arSeason && arShock < 0.1) {
    // Number of AR events this quarter (Poisson-like)
    // 1.5 — mean AR events per active quarter, count; ~3 events/season ÷ 2 quarters — Ralph et al. 2019
    // -0.3 — La Niña AR frequency boost (negative ENSO = more PNW ARs), events per ENSO unit; Payne & Magnusdottir 2015
    // 0.5 — minimum mean AR events per quarter, count; floor for El Niño years
    // 4 — maximum mean AR events per quarter, count; cap for extreme La Niña + warming
    var meanEvents = cl(1.5 * ivtBoost + effectiveEnso * -0.3, 0.5, 4); // La Niña → more ARs in PNW
    // Generate individual events
    // 6 — maximum potential AR events per quarter, count; upper bound for event generation loop
    for (var ae = 0; ae < 6; ae++) {
      // 88813 — arbitrary seed offset for AR event occurrence
      var eSeed = seededRandom(year * 1000 + quarter * 100 + ae * 17 + 88813);
      if (eSeed > meanEvents / 6) continue; // probabilistic event count

      // IVT determines category (Ralph et al. 2019 scale)
      // 22277 — arbitrary seed offset for AR IVT intensity
      var ivtSeed = seededRandom(year * 1000 + quarter * 100 + ae * 17 + 22277);
      // 250 — AR detection threshold IVT, kg/m/s; Ralph et al. 2019 (BAMS 100:269-289)
      // 800 — IVT stochastic range above threshold, kg/m/s; spans AR1 (~250) to AR5 (~1050) — Ralph et al. 2019
      var baseIVT = 250 + ivtSeed * 800; // 250-1050 kg/m/s range
      var effectiveIVT = baseIVT * ivtBoost;

      // AR category thresholds (IVT in kg/m/s) and normalized intensity (0-1)
      // Ralph et al. 2019 AR scale: AR1<250, AR2 250-500, AR3 500-750, AR4 750-1000, AR5>1000
      // Thresholds here slightly simplified for model tractability
      var arCat, arInt;
      if (effectiveIVT < 350) { arCat = 1; arInt = 0.15; }       // AR1: weak, mostly beneficial — 350 kg/m/s upper bound
      else if (effectiveIVT < 500) { arCat = 2; arInt = 0.30; }   // AR2: moderate — 500 kg/m/s upper bound
      else if (effectiveIVT < 700) { arCat = 3; arInt = 0.50; }   // AR3: strong — 700 kg/m/s upper bound
      else if (effectiveIVT < 900) { arCat = 4; arInt = 0.75; }   // AR4: extreme — 900 kg/m/s upper bound
      else { arCat = 5; arInt = 1.0; }                            // AR5: exceptional — >900 kg/m/s

      // Landfall zone (stochastic)
      // 33391 — arbitrary seed offset for AR landfall zone
      var zoneSeed = seededRandom(year * 1000 + quarter * 100 + ae * 17 + 33391);
      var zone;
      // 0.35 — Olympic landfall probability, unitless; most common target for PNW ARs — Ralph et al. 2019
      // 0.65 — cumulative probability threshold for Cascades landfall (0.30 marginal), unitless; Ralph et al. 2019
      // remainder (0.35) — BC Interior landfall probability, unitless
      if (zoneSeed < 0.35) zone = "olympic";
      else if (zoneSeed < 0.65) zone = "cascades";
      else zone = "bcInterior";

      // Duration (1-5 days, higher categories → longer)
      // 0.8 — duration scaling per AR category, days/category; higher-category ARs persist longer — Ralph et al. 2019
      // 2 — stochastic duration range, days; event-to-event variability
      // 1 — minimum AR duration, days; even brief ARs last ~1 day
      // 5 — maximum AR duration, days; multi-day events cap at ~5 days — Ralph et al. 2019
      // 66677 — arbitrary seed offset for AR duration
      var duration = cl(1 + arCat * 0.8 + seededRandom(year * 1000 + quarter * 100 + ae * 17 + 66677) * 2, 1, 5);

      // Precipitation total (mm per event)
      // AR1: 20-50mm, AR3: 100-200mm, AR5: 300-500mm
      // 60 — base precipitation per AR category, mm/category; scales linearly with category — derived from Ralph et al. 2019 Table 2
      // 40 — stochastic precipitation range per category, mm/category; event-to-event variability
      // 10 — minimum AR precipitation, mm; floor for weakest events
      // 600 — maximum AR precipitation, mm; cap for most extreme AR5 events
      // 99901 — arbitrary seed offset for AR precipitation
      var eventPrecip = cl(arCat * 60 * ivtBoost + seededRandom(year * 1000 + quarter * 100 + ae * 17 + 99901) * arCat * 40, 10, 600);

      arEvents.push({ category: arCat, intensity: arInt, zone: zone, duration: duration, precip: eventPrecip, ivt: effectiveIVT });

      if (arInt > maxArIntensity) { maxArIntensity = arInt; maxArCategory = arCat; }

      // Distribute AR precipitation to basins based on landfall zone + orography
      // Weights are unitless fractions summing to ~1.0 per zone
      // Reflect orographic interception and distance from landfall — derived from PRISM AR precipitation composites
      var ZONE_WEIGHTS = {
        olympic:    { juanDeFuca: 0.4, mainBasin: 0.15, hoodCanal: 0.3, southSound: 0.1, whidbey: 0.05, georgia: 0.0, sanjuan: 0.0 },
        cascades:   { juanDeFuca: 0.0, mainBasin: 0.15, hoodCanal: 0.05, southSound: 0.05, whidbey: 0.35, georgia: 0.15, sanjuan: 0.25 },
        bcInterior: { juanDeFuca: 0.0, mainBasin: 0.0, hoodCanal: 0.0, southSound: 0.0, whidbey: 0.05, georgia: 0.65, sanjuan: 0.30 },
      };
      var weights = ZONE_WEIGHTS[zone];
      for (var wi = 0; wi < basinKeys.length; wi++) {
        var wbid = basinKeys[wi];
        basinPrecip[wbid] += eventPrecip * (weights[wbid] || 0);
        arTotalPrecip[wbid] += eventPrecip * (weights[wbid] || 0);
      }
    }

    // Sequence tracking: back-to-back ARs compound risk
    if (arEvents.length > 0) {
      arSequenceCount = prevARSequence + arEvents.length;
    } else {
      arSequenceCount = 0;
    }
  }

  // Manual AR shock overrides
  if (arShock > 0.1) {
    maxArIntensity = arShock;
    // AR category thresholds for manual shock: 0.9→AR5, 0.7→AR4, 0.4→AR3, 0.2→AR2, else AR1
    maxArCategory = arShock > 0.9 ? 5 : arShock > 0.7 ? 4 : arShock > 0.4 ? 3 : arShock > 0.2 ? 2 : 1;
    // 3 — default shock AR duration, days
    // 80 — precipitation per AR category for shock events, mm/category
    // 500 — base IVT for shock AR events, kg/m/s
    // 500 — IVT scaling range for shock intensity, kg/m/s; total IVT = 500 + intensity * 500
    arEvents = [{ category: maxArCategory, intensity: maxArIntensity, zone: "cascades", duration: 3, precip: maxArCategory * 80, ivt: 500 + maxArIntensity * 500 }];
    // Add shock precipitation to basins
    // 40 — precipitation added per AR category to all basins during shock, mm/category; uniform distribution for manual events
    for (var si = 0; si < basinKeys.length; si++) {
      basinPrecip[basinKeys[si]] += maxArCategory * 40;
    }
  }

  // Compound flood risk: back-to-back ARs (>2 events in a quarter)
  // 2 — AR sequence threshold before compound risk begins, count; soil saturation requires multiple events — TODO-CITE: source needed for specific threshold
  // 0.3 — compound risk increment per additional AR beyond threshold, unitless per event; TODO-CITE: source needed for specific scaling
  var arCompoundRisk = arSequenceCount > 2 ? cl((arSequenceCount - 2) * 0.3, 0, 1) : 0;

  // ═══════════════════════════════════════════════════════════
  // 6. PRECIPITATION TYPE PARTITIONING (rain vs snow)
  // ═══════════════════════════════════════════════════════════
  // Rain/snow transition: ~1-2°C threshold, 2°C mixed zone (Kienzle 2008)
  // Under warming: more rain, less snow at all elevations — fundamental shift

  var basinSnowFrac = {};
  for (var sfi = 0; sfi < basinKeys.length; sfi++) {
    var sfbid = basinKeys[sfi];
    var bTemp = basinTemps[sfbid];
    // Low elevation snow fraction (basin-level, not high-alpine)
    // 0°C — all-snow threshold, °C; Kienzle 2008
    // 2°C — all-rain threshold (above this, no snow at low elevation), °C; Kienzle 2008 — 2°C mixed transition zone
    basinSnowFrac[sfbid] = bTemp < 0 ? 1.0 : bTemp < 2 ? cl(1 - bTemp / 2, 0, 1) : 0;
  }

  // ═══════════════════════════════════════════════════════════
  // 7. WIND MODEL (simplified)
  // ═══════════════════════════════════════════════════════════
  // Per-basin wind speed index (0-1, normalized)
  // Higher in exposed basins (JdF, Georgia Strait)
  // Seasonal: stronger in winter, calmer in summer

  // Seasonal baseline wind index (0-1), unitless; NOAA NDBC buoy climatology (Smith Island, New Dungeness buoys)
  var windBase = [0.7, 0.5, 0.3, 0.6]; // Q0=winter, Q1=spring, Q2=summer, Q3=fall
  // Basin wind exposure factors, unitless; relative exposure from NOAA NDBC buoy data and Coastal Engineering Manual
  var WIND_EXPOSURE = {
    juanDeFuca: 1.2,   // open strait, strongest sustained winds — NDBC buoy 46088
    georgia: 1.0,      // broad strait, moderate exposure — NDBC buoy 46146
    sanjuan: 0.8,      // island sheltering reduces wind — NDBC buoy 46088 (nearby)
    whidbey: 0.7,      // partial shelter from Whidbey Island
    mainBasin: 0.6,    // surrounded by land, moderate shelter
    hoodCanal: 0.4,    // narrow fjord, highly sheltered — minimal buoy data
    southSound: 0.5,   // narrow waterways, moderate shelter
  };
  var basinWind = {};
  for (var wdi = 0; wdi < basinKeys.length; wdi++) {
    var wbid2 = basinKeys[wdi];
    // 0.3 — AR intensity threshold for wind enhancement, unitless; AR3+ brings significant wind — Ralph et al. 2019
    // 0.3 — wind enhancement scaling from AR intensity, unitless; AR winds add up to 30% to base wind index
    basinWind[wbid2] = cl(windBase[quarter] * WIND_EXPOSURE[wbid2] + (maxArIntensity > 0.3 ? maxArIntensity * 0.3 : 0), 0, 1);
  }

  // ═══════════════════════════════════════════════════════════
  // 8. WILDFIRE SMOKE TRANSPORT
  // ═══════════════════════════════════════════════════════════
  // BC interior fires (primary source) generate smoke that reaches the Salish Sea
  // when synoptic patterns carry it south/southwest. Major events: 2017, 2018, 2021.
  // (McKendry et al. 2019, Atmos. Environ.; Jaffe et al. 2020, Bull. AMS)
  //
  // Source: Fraser model burnScar or external shock. Smoke only in fire season (Q2-Q3).
  // Transport: ~60% probability when fires active and winds favorable.

  var prevSmokeAccum = _prev.smokeAccumulation !== undefined ? _prev.smokeAccumulation : 0;

  // Read fire activity from parameters or coupling (Fraser burnScar, wildfire shock)
  // 0.5 — wildfire shock to fire activity conversion, unitless; shock partially contributes to regional fire activity
  var fireActivity = cl((P.fraserBurnScar !== undefined ? P.fraserBurnScar : 0) + (shocks.wildfire || 0) * 0.5, 0, 1);
  // 60 — default smoke transport efficiency, percent; ~60% of fire-season days with favorable transport — McKendry et al. 2011 (Atmos. Environ. 45:2734-2743)
  var smokeTransportEff = (P.smokeTransportEfficiency !== undefined ? P.smokeTransportEfficiency : 60) / 100;

  var smokeIndex = 0;
  var fireSmokeQuarter = (quarter === 2 || quarter === 3); // summer-fall fire season only
  // 0.05 — minimum fire activity threshold for smoke generation, unitless; below this, fires too small to generate transportable smoke
  if (fireSmokeQuarter && fireActivity > 0.05) {
    // Transport probability: ~60% baseline, modulated by wind direction
    // 77713 — arbitrary seed offset for smoke transport occurrence
    var transportSeed = seededRandom(year * 100 + quarter * 25 + 77713);
    var transportOccurs = transportSeed < smokeTransportEff ? 1 : 0;
    if (transportOccurs) {
      // Smoke intensity: fire area × transport efficiency × duration factor
      // 2017/2018 events (1.2-1.35M ha): smokeIndex ~0.6-0.9
      // 1.5 — smoke intensity amplification factor, unitless; accounts for multi-day accumulation and trapping inversions — Jaffe et al. 2020 (Bull. AMS 101:E1908-E1935)
      smokeIndex = cl(fireActivity * smokeTransportEff * 1.5, 0, 1);
    }
  }

  // Smoke accumulation: persists partially across quarters (haze lingers)
  // 0.3 — smoke carry-forward fraction from previous quarter, unitless; residual fine particulate haze persistence — Jaffe et al. 2020
  // 0.7 — current-quarter smoke contribution fraction, unitless; complement of carry-forward
  var smokeAccumulation = cl(prevSmokeAccum * 0.3 + smokeIndex * 0.7, 0, 1); // 30% carry-forward

  // Smoke effects:
  // Solar radiation: up to 30% reduction during heavy smoke (Jaffe et al. 2020)
  // 0.30 — maximum solar radiation reduction from smoke, unitless fraction; Jaffe et al. 2020 (Bull. AMS 101:E1908-E1935)
  var smokeSolarReduction = smokeAccumulation * 0.30;
  // Visibility: affects seabird foraging, vessel navigation
  // 0.6 — visibility reduction scaling from smoke, unitless; smoke-to-visibility conversion
  // 0.8 — maximum visibility reduction cap, unitless fraction; even worst events don't reach zero visibility — McKendry et al. 2011
  var visibilityReduction = cl(smokeAccumulation * 0.6, 0, 0.8); // up to 80% visibility loss

  // ═══════════════════════════════════════════════════════════
  // 9. MARINE FOG MODEL
  // ═══════════════════════════════════════════════════════════
  // Summer stratus off Pacific coast. Frequency ~40% of summer days at JdF,
  // decreasing inland (Mass 2008). Declining ~2%/decade under warming
  // (Johnstone & Dawson 2010, PNAS 107:4533-4538).
  // Fog reduces solar radiation ~20%, moderates coastal temperatures.

  // 2 — default fog decline rate, percent per decade; Johnstone & Dawson 2010 (PNAS 107(10):4533-4538)
  var fogDeclineRate = (P.fogDeclineRate !== undefined ? P.fogDeclineRate : 2) / 100; // fraction per decade
  var fogDeclineDecades = yearsSince2026 / 10;
  // 0.40 — baseline coastal fog frequency, unitless fraction of days; ~40% of summer days at JdF — Mass 2008; Johnstone & Dawson 2010
  var fogBaseline = 0.40; // 40% of summer days at coast

  var fogFrequency = 0;
  if (quarter === 1 || quarter === 2) { // spring-summer fog season
    // 0.05 — minimum fog frequency floor, unitless fraction; fog never fully disappears — Johnstone & Dawson 2010
    // 0.50 — maximum fog frequency cap, unitless fraction; physical upper bound
    fogFrequency = cl(fogBaseline * (1 - fogDeclineRate * fogDeclineDecades), 0.05, 0.50);
    // Reduce inland: gradient from coast to interior
    // JdF: full fog, Main Basin: 40% of coastal, Hood Canal: 20%
  }

  // Per-basin fog frequency
  // Unitless fractions relative to coastal fog frequency; inland gradient — Mass 2008 ch. 4
  var FOG_GRADIENT = {
    juanDeFuca: 1.0,   // full Pacific coastal fog exposure
    georgia: 0.5,      // moderate — Vancouver Island partial shelter
    sanjuan: 0.7,      // exposed channels catch marine layer
    whidbey: 0.3,      // inland, sheltered from marine layer
    mainBasin: 0.4,    // Seattle area, some marine layer penetration
    hoodCanal: 0.2,    // deep fjord, minimal fog penetration
    southSound: 0.3,   // inland, minimal fog
  };
  var basinFog = {};
  for (var fi = 0; fi < basinKeys.length; fi++) {
    basinFog[basinKeys[fi]] = fogFrequency * FOG_GRADIENT[basinKeys[fi]];
  }

  // Fog solar reduction: ~20% when present, weighted by frequency
  // 0.20 — solar radiation reduction per unit fog frequency, unitless; fog blocks ~20% of insolation when present — Johnstone & Dawson 2010
  var fogSolarReduction = fogFrequency * 0.20; // regional average

  // Combined solar radiation modifier
  // 0.3 — minimum solar radiation modifier, unitless fraction; floor prevents total darkness even with smoke + fog
  // 1.0 — maximum solar radiation modifier, unitless fraction; clear-sky baseline
  var solarRadiationModifier = cl(1.0 - smokeSolarReduction - fogSolarReduction, 0.3, 1.0);

  // ═══════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════
  return {
    state: {
      // ENSO / PDO
      ensoValue: effectiveEnso,
      ensoAmplification: ensoAmplification,
      ensoPhaseLabel: ensoPhaseLabel,
      pdoValue: pdoValue,
      pdoPhaseLabel: pdoPhaseLabel,
      sstAnomaly: sstAnomaly,
      oceanSurvivalMod: oceanSurvivalMod,

      // Temperature (per-basin)
      basinTemps: basinTemps,
      basinDegreeDays: basinDegreeDays,
      frostFreeDays: frostFreeDays,

      // Precipitation (per-basin)
      basinPrecip: basinPrecip,
      basinSnowFrac: basinSnowFrac,
      regionalPrecipBase: basePrecipQuarter,

      // Atmospheric rivers
      arEvents: arEvents,
      arEventCount: arEvents.length,
      arMaxIntensity: maxArIntensity,
      arMaxCategory: maxArCategory,
      arSequenceCount: arSequenceCount,
      arCompoundRisk: arCompoundRisk,
      arTotalPrecip: arTotalPrecip,

      // Convergence zone
      convergenceZoneActive: czActive,
      czEnhancement: czEnhancement,

      // Wind (per-basin)
      basinWind: basinWind,

      // Smoke
      smokeIndex: smokeAccumulation,
      smokeSolarReduction: smokeSolarReduction,
      visibilityReduction: visibilityReduction,
      fireActivity: fireActivity,

      // Fog
      fogFrequency: fogFrequency,
      basinFog: basinFog,
      fogSolarReduction: fogSolarReduction,

      // Combined radiation
      solarRadiationModifier: solarRadiationModifier,
    },

    _carry: {
      arSequenceCount: arSequenceCount,
      smokeAccumulation: smokeAccumulation,
    },

    exports: {
      // Per-basin fields for downstream modules
      climBbasinPrecip: basinPrecip,
      climBasinTemps: basinTemps,
      climBasinSnowFrac: basinSnowFrac,
      climBasinWind: basinWind,

      // AR summary
      climArMaxIntensity: maxArIntensity,
      climArMaxCategory: maxArCategory,
      climArEventCount: arEvents.length,
      climArCompoundRisk: arCompoundRisk,
      climConvergenceZone: czActive,

      // Ocean state
      climEnsoValue: effectiveEnso,
      climPdoValue: pdoValue,
      climSstAnomaly: sstAnomaly,
      climOceanSurvivalMod: oceanSurvivalMod,
      climPrecipAnomaly: precipAnomaly,

      // Smoke, fog, radiation
      climSmokeIndex: smokeAccumulation,
      climVisibilityReduction: visibilityReduction,
      climSolarMod: solarRadiationModifier,
      climFogFrequency: fogFrequency,
    },
  };
}
