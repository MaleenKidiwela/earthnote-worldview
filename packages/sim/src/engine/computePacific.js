// ═══════════════════════════════════════════════════════════
// computePacific.js — Pacific Ocean Boundary Forcing
// ═══════════════════════════════════════════════════════════
// Everything that enters the Salish Sea from the California Current
// system through Juan de Fuca Strait. The Pacific controls the
// baseline state more than anything local.
//
// Components: California Current upwelling, source water properties,
// marine heat waves, oxygen minimum zone, copepod community,
// salmon marine survival, Juan de Fuca estuarine inflow.
//
// Key references:
//   Hickey & Banas 2003 — Oceanography of the Pacific NW coastal ocean
//   Thomson 1981, 1994 — Oceanography of the British Columbia coast
//   Whitney et al. 2007 — declining O2 in NE Pacific
//   Crawford & Peña 2013 — oxygen trends in NE Pacific
//   Feely et al. 2008, 2016 — ocean acidification on NE Pacific shelf
//   Oliver et al. 2018 — marine heatwave frequency (Nature Communications 9:1324)
//   Stramma et al. 2008, 2010 — expanding oxygen minimum zones
//   Peterson et al. 2014 — copepod indicators for salmon
//   Peterman & Dorner 2012 — declining salmon marine survival
//   Connors et al. 2020 — Pacific salmon marine survival drivers
//   Ruggerone & Irvine 2018 — competition from Alaska hatchery pinks
//   Bond et al. 2015 — "The Blob" marine heat wave
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl, seededRandom, seasonalPeak, lerp } from './utils.js';
import { rfPredict } from './rfPredict.js';

export function computePacific(P, prev, shocks, quarter, year, climD, climExports) {
  var sstDelta = climD ? (climD.sstDelta !== undefined ? climD.sstDelta : 0) : 0;
  var yearsSince2026 = year - 2026;
  var _prev = prev || {};

  // Read climate module state
  var ce = climExports || {};
  var ensoValue = ce.climEnsoValue !== undefined ? ce.climEnsoValue : 0;
  var pdoValue = ce.climPdoValue !== undefined ? ce.climPdoValue : 0;
  var sstAnomaly = ce.climSstAnomaly !== undefined ? ce.climSstAnomaly : 0;

  // ═══════════════════════════════════════════════════════════
  // 1. CALIFORNIA CURRENT UPWELLING
  // ═══════════════════════════════════════════════════════════
  // Seasonal coastal upwelling driven by northerly winds (spring-summer)
  // Bakun index analog: wind stress × Coriolis → Ekman transport
  // Hickey & Banas 2003; Connolly et al. 2010
  //
  // PDO cool phase: stronger pressure gradients → enhanced upwelling
  // El Niño: deepened thermocline → suppressed upwelling
  // La Niña: shoaled thermocline → enhanced upwelling

  // Upwelling season: peaks Q2 (Jun-Aug), shoulders in Q1 and Q3
  var upwellingSeason = seasonalPeak(quarter, 2, 0.8); // Gaussian centered on summer

  // PDO modulation: cool PDO (negative) enhances upwelling — Mantua et al. 1997
  // 0.15 = ±15% upwelling modulation, unitless — Hickey & Banas 2003 (upwelling-PDO correlation ~0.4)
  var pdoUpwellMod = cl(-pdoValue * 0.15, -0.15, 0.15);

  // ENSO modulation: La Niña enhances, El Niño suppresses — Schwing et al. 2002
  // 0.20 = ±20% modulation, stronger than PDO — Connolly et al. 2014
  var ensoUpwellMod = cl(-ensoValue * 0.20, -0.20, 0.20);

  // Warming trend: Bakun 1990 hypothesis — upwelling winds may strengthen but
  // stratification counteracts. 0.03 = net ~3% weakening per °C — Rykaczewski & Dunne 2010
  var warmingUpwellMod = cl(-sstDelta * 0.03, -0.15, 0);

  // Stochastic interannual variability (delayed upwelling events like 2005)
  var upwellSeed = seededRandom(year * 100 + quarter + 19937);
  // 0.15 = ±7.5% interannual noise — Schwing et al. 2002: spring transition timing varies ±2 weeks
  var upwellStochastic = (upwellSeed - 0.5) * 0.15;

  // upwellingModifier param (default 100%): user control over upwelling strength
  // At 100% no change; <100% weakens upwelling (stratification dominates); >100% strengthens
  var upwellUserMod = (P.upwellingModifier !== undefined ? P.upwellingModifier : 100) / 100;

  var upwellingIntensity = cl(
    (upwellingSeason * 0.70 + 0.15 // seasonal + year-round base
    + pdoUpwellMod
    + ensoUpwellMod
    + warmingUpwellMod
    + upwellStochastic) * upwellUserMod,
    0, 1);

  // ═══════════════════════════════════════════════════════════
  // 2. OXYGEN MINIMUM ZONE (OMZ)
  // ═══════════════════════════════════════════════════════════
  // NE Pacific OMZ expanding and shoaling (Stramma et al. 2008, 2010)
  // OMZ core ~800-1000m. Upper boundary shoaling toward continental shelf.
  // When upper boundary < shelf depth (~200m), hypoxic water upwells directly.

  var omzBaseDepth = 400; // m, baseline upper OMZ boundary
  var omzShoalingRate = 7; // m/decade, accelerating under warming (Stramma et al. 2010)
  // 15 m/°C = warming-driven OMZ shoaling — Deutsch et al. 2011 (Science 334:1405):
  // enhanced stratification + reduced ventilation accelerates shoaling beyond trend
  var omzShoaling = cl(omzShoalingRate * yearsSince2026 / 10 + sstDelta * 15, 0, 250);
  var omzDepth = cl(omzBaseDepth - omzShoaling, 100, 500);
  var shelfDepth = 200; // continental shelf edge depth

  // OMZ impact: when OMZ upper boundary approaches shelf, source water O2 drops further
  var omzProximity = omzDepth < shelfDepth ? cl((shelfDepth - omzDepth) / 100, 0, 1) : 0;

  // ═══════════════════════════════════════════════════════════
  // 3. SOURCE WATER PROPERTIES
  // ═══════════════════════════════════════════════════════════
  // Properties of Pacific water entering Juan de Fuca Strait at depth
  // Sub-thermocline, ~150-300m depth on the continental shelf
  // Whitney et al. 2007, Crawford & Peña 2013, Feely et al. 2008

  // Temperature: baseline 7.5°C, warming slowly
  var sourceTemp = cl(7.5 + sstDelta * 0.3 + sstAnomaly * 0.2, 5.0, 12.0);

  // Dissolved Oxygen: THE critical declining variable
  // Baseline ~2.0 ml/L at shelf depth (~2.8 mg/L). Declining ~0.5 ml/L per decade
  // (Whitney et al. 2007: Station P O2 loss; Crawford & Peña 2013: continental shelf O2 decline)
  // OMZ proximity worsens this further. El Niño slightly better (less upwelling of deep low-O2)
  // pacificO2DeclineRate param (default 5%): controls rate of Pacific source water deoxygenation
  // At default 5: 0.5 ml/L per decade. At 20: 2.0 ml/L per decade (worst-case Stramma 2010).
  var o2RateParam = (P.pacificO2DeclineRate !== undefined ? P.pacificO2DeclineRate : 5) / 100;
  var o2DeclineTrend = cl(yearsSince2026 * o2RateParam / 10, 0, 1.5);
  // 0.15 ml/L ENSO modulation — Connolly et al. 2014: El Niño reduces upwelling of low-O2 water
  var o2EnsoMod = ensoValue * 0.15;
  // 0.5 ml/L OMZ penalty at full proximity — Crawford & Peña 2013: when OMZ reaches shelf depth,
  // bottom water O2 drops an additional 0.5 ml/L below trend
  var o2OmzPenalty = omzProximity * 0.5;
  var sourceDO = cl(2.0 - o2DeclineTrend - o2OmzPenalty + o2EnsoMod, 0.3, 3.5); // ml/L
  // Convert to mg/L for downstream compatibility (1 ml/L ≈ 1.43 mg/L)
  var sourceDO_mgL = sourceDO * 1.43;

  // DIC: increasing from ocean CO2 uptake
  // Feely et al. 2008, 2016: ~1 µmol/kg/yr increase from anthropogenic CO2
  // pacificDICIncrease param (default 100%): ocean acidification rate modifier
  // At 100%: 1 µmol/kg/yr (Feely 2008). At 300%: 3× faster under high-emissions pathway.
  var dicRateMod = (P.pacificDICIncrease !== undefined ? P.pacificDICIncrease : 100) / 100;
  var dicIncrease = cl(yearsSince2026 * 1.0 * dicRateMod, 0, 300); // µmol/kg
  var sourceDIC = cl(2100 + dicIncrease + sstDelta * 5, 2050, 2350);

  // Total Alkalinity: relatively stable, slight dilution from freshwater
  var sourceTA = cl(2250 - sstDelta * 2, 2180, 2320);

  // pH: declining from CO2 uptake (Feely et al. 2016)
  var sourcepH = cl(7.65 - yearsSince2026 * 0.004 - sstDelta * 0.02, 7.2, 7.80);

  // Nutrients: high in upwelled water, vary with upwelling intensity
  // NO3 ~25-35 µmol/L in upwelled water (Hickey & Banas 2003)
  var sourceNO3 = cl(25 + upwellingIntensity * 10 + sstDelta * 2, 15, 45);
  var sourcePO4 = cl(2.0 + upwellingIntensity * 1.0, 1.0, 4.0);

  // Salinity: stable open ocean
  var sourceSalinity = 34.0;

  // Aragonite saturation state of source water
  // During strong upwelling, Ω can drop below 1.0 (corrosive to shells)
  // Feely et al. 2008: upwelled water on WA shelf Ω < 1.0
  // 0.005 = Ω decrease per µmol/kg DIC increase — Feely et al. 2016: each ~200 µmol DIC
  // reduces Ω by ~1.0 on the WA shelf
  var sourceOmega = cl(1.5 - upwellingIntensity * 0.8 - dicIncrease * 0.005, 0.3, 2.5);

  // ═══════════════════════════════════════════════════════════
  // 4. MARINE HEAT WAVE (enhanced model)
  // ═══════════════════════════════════════════════════════════
  // Replaces simple MHW model with richer Pacific-boundary version.
  // The 2014-2016 "Blob": +2-3°C, 2+ years, massive ecological impacts.
  // Oliver et al. 2018: MHW frequency doubling per °C warming.
  // Bond et al. 2015: Blob mechanisms and impacts.

  var prevMHW = _prev.mhw || { active: 0, intensity: 0, peakIntensity: 0, duration: 0, remaining: 0, cooldown: 0 };

  var mhwActive = prevMHW.active;
  var mhwIntensity = prevMHW.intensity;
  var mhwDuration = prevMHW.duration;
  var mhwRemaining = prevMHW.remaining;
  var mhwCooldown = prevMHW.cooldown;
  var mhwPeak = prevMHW.peakIntensity;

  if (mhwCooldown > 0) {
    // Cooldown period — no new event
    mhwActive = 0; mhwIntensity = 0; mhwCooldown = mhwCooldown - 1;
  } else if (mhwActive && mhwRemaining > 0) {
    // Continue active MHW with bell-curve envelope
    mhwRemaining = mhwRemaining - 1;
    if (mhwRemaining <= 0) {
      mhwActive = 0; mhwIntensity = 0; mhwCooldown = 4; // 1-year cooldown
    } else {
      var elapsed = mhwDuration - mhwRemaining;
      var rampUp = cl(elapsed / 2, 0, 1);
      var fadeOut = cl(mhwRemaining / Math.max(mhwDuration * 0.3, 1), 0, 1);
      mhwIntensity = cl(mhwPeak * rampUp * fadeOut, 0, 1);
    }
  } else {
    // Check for new MHW trigger
    // Oliver et al. 2018: frequency ~doubles per °C
    // mhwProbabilityMod param (default 100%): scales MHW trigger probability
    // At 100%: baseline frequency. At 300%: 3× more likely (extreme warming scenario).
    var mhwProbMod = (P.mhwProbabilityMod !== undefined ? P.mhwProbabilityMod : 100) / 100;
    var pMHW = cl(0.02 * Math.pow(2, cl(sstDelta, 0, 4)) * mhwProbMod, 0, 0.50);
    // La Niña + warm PDO increases risk (persistent ridge pattern)
    pMHW = pMHW * (1 + cl(-ensoValue * 0.3 + pdoValue * 0.2, -0.3, 0.5));
    var mhwSeed = seededRandom(year * 137 + quarter * 31 + 31337);
    if (mhwSeed < pMHW) {
      mhwActive = 1;
      var durSeed = seededRandom(year * 251 + quarter * 17 + 7919);
      mhwDuration = Math.floor(4 + durSeed * 8); // 4-12 quarters
      mhwRemaining = mhwDuration;
      mhwPeak = cl(0.4 + durSeed * 0.6, 0.4, 1.0);
      mhwIntensity = mhwPeak * 0.3; // ramp-up first quarter
    }
  }

  var mhwSSTAnomaly = mhwActive ? mhwIntensity * lerp(1.5, 4.0, mhwPeak) : 0;

  // MHW effects on source water
  var mhwSourceTemp = sourceTemp + mhwSSTAnomaly * 0.5; // deep water partially affected
  var mhwUpwellSuppression = mhwActive ? mhwIntensity * 0.4 : 0; // warm surface suppresses upwelling

  // ═══════════════════════════════════════════════════════════
  // 5. COPEPOD COMMUNITY INDICATOR
  // ═══════════════════════════════════════════════════════════
  // Peterson's copepod index: species composition predicts salmon returns 1-2yr later.
  // (Peterson et al. 2014, Fisher et al. 2015)
  // Lipid-rich boreal copepods (cold water) = good prey = high survival
  // Lipid-poor subtropical copepods (warm water) = poor prey = low survival

  // Copepod quality index — Peterson et al. 2014 (Oceanography 27(4):80-89):
  // 0.5 = modern baseline (degraded from historical ~0.7) — Fisher et al. 2015
  // 0.25 = upwelling sensitivity — cold upwelled water favors boreal Calanus/Pseudocalanus
  // 0.15 = SST anomaly response — warm→subtropical Paracalanus shift (Peterson 2009 CJFAS)
  // 0.20 = MHW devastation — Bond et al. 2015: 2014-2016 Blob eliminated boreal copepods
  // 0.10 = PDO modulation — cool PDO = boreal dominance (Hooff & Peterson 2006)
  var copepodQuality = cl(
    0.5
    + upwellingIntensity * 0.25
    - sstAnomaly * 0.15
    - mhwSSTAnomaly * 0.20
    + pdoValue * -0.10,
    0.05, 1.0);

  // ═══════════════════════════════════════════════════════════
  // 6. SALMON MARINE SURVIVAL INDEX
  // ═══════════════════════════════════════════════════════════
  // Pacific salmon marine survival has declined dramatically since late 1990s.
  // Driven by: ocean temperature, copepod prey quality, competition, MHW events.
  // (Peterman & Dorner 2012, Connors et al. 2020)
  //
  // PRIMARY: Random Forest regression trained on synthetic data encoding
  // published empirical relationships (see scripts/train_marine_survival_rf.py).
  // FALLBACK: linear approximation if RF model unavailable.
  //
  // RF features map current ocean state to species-specific survival indices.

  // BUG FIX: P is already ap.pacific (orchestrator passes ap.pacific, not ap)
  // Previously read P.pacific.xxx → always undefined → always fallback 0.5
  var alaskaHatcheryFrac = (P.alaskaHatcheryCompetition !== undefined)
    ? P.alaskaHatcheryCompetition / 100 : 0.5;
  // Odd-year pink competition boost (Ruggerone & Irvine 2018)
  var alaskaComp = alaskaHatcheryFrac + ((year % 2 === 1) ? 0.1 : 0);

  var rfFeatures = {
    sst_anomaly: sstDelta,
    pdo_index: pdoValue,
    enso_index: ensoValue,
    upwelling_intensity: upwellingIntensity,
    copepod_quality: copepodQuality,
    mhw_active: mhwActive ? 1 : 0,
    mhw_intensity: mhwIntensity,
    alaska_hatchery: cl(alaskaComp, 0, 1),
  };

  // Try RF prediction for each species, fall back to linear if unavailable
  var rfBase = rfPredict('marineSurvival', rfFeatures);
  var rfSockeye = rfPredict('marineSurvival_sockeye', rfFeatures);
  var rfChinook = rfPredict('marineSurvival_chinook', rfFeatures);
  var rfPink = rfPredict('marineSurvival_pink', rfFeatures);
  var rfCoho = rfPredict('marineSurvival_coho', rfFeatures);
  var rfChum = rfPredict('marineSurvival_chum', rfFeatures);

  // Linear fallback (original calculation)
  var baseSurvival = 0.5;
  var copepodEffect = (copepodQuality - 0.5) * 0.4;
  var tempEffect = cl(-sstDelta * 0.08, -0.3, 0);
  var mhwPenalty = mhwActive ? -mhwIntensity * 0.30 : 0;
  var alaskaCompetition = (year % 2 === 1) ? -0.05 : 0;
  var linearBase = cl(baseSurvival + copepodEffect + tempEffect + mhwPenalty + alaskaCompetition, 0.05, 0.9);

  // Use RF if valid, else linear
  var marineSurvBase = (rfBase !== undefined && isFinite(rfBase)) ? cl(rfBase, 0.05, 0.9) : linearBase;

  var marineSurvival = {
    sockeye:  cl((rfSockeye !== undefined && isFinite(rfSockeye)) ? rfSockeye : linearBase * 0.85, 0.02, 0.8),
    chinook:  cl((rfChinook !== undefined && isFinite(rfChinook)) ? rfChinook : linearBase * 0.95, 0.02, 0.8),
    pink:     cl((rfPink !== undefined && isFinite(rfPink)) ? rfPink : linearBase * 1.15, 0.05, 0.9),
    chum:     cl((rfChum !== undefined && isFinite(rfChum)) ? rfChum : linearBase * 1.0, 0.03, 0.85),
    coho:     cl((rfCoho !== undefined && isFinite(rfCoho)) ? rfCoho : linearBase * 0.90, 0.02, 0.8),
  };

  // ═══════════════════════════════════════════════════════════
  // 7. JUAN DE FUCA ESTUARINE INFLOW
  // ═══════════════════════════════════════════════════════════
  // Deep estuarine circulation: salty Pacific water enters at depth (~100-200m),
  // fresh Salish Sea water exits at surface.
  // Thomson 1994: ~100,000-150,000 m³/s deep inflow — dwarfs river inputs.
  // Inflow strength modulated by density difference (more river runoff = stronger circulation).

  var baseInflowStrength = 120000; // m³/s baseline deep inflow
  // Freshwater forcing: more river runoff enhances estuarine exchange
  // (Fraser freshet dramatically increases density gradient)
  var freshwaterForcing = ce.fraserDischarge !== undefined ? cl(ce.fraserDischarge / 2700, 0.5, 2.0) : 1.0;
  // Wind forcing: westerly winds push surface water out, enhance deep replacement
  // 0.2 = wind-estuarine coupling coefficient — Thomson 1994: westerly wind stress modulates
  // deep replacement flow by ~20% per unit wind intensity (Ekman dynamics at JdF entrance)
  var windForcing = ce.climBasinWind && ce.climBasinWind.juanDeFuca !== undefined ? cl(1 + ce.climBasinWind.juanDeFuca * 0.2, 0.8, 1.4) : 1.0;

  var jdfInflowStrength = cl(baseInflowStrength * freshwaterForcing * windForcing, 60000, 200000);

  // Effective source water properties at JdF entrance (mixing deep + MHW effects)
  var effectiveSourceTemp = cl(mhwSourceTemp, 5.0, 14.0);
  var effectiveSourceDO = cl(sourceDO_mgL * (1 - mhwUpwellSuppression * 0.2), 0.5, 5.0);

  // ═══════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════
  var newMHW = { active: mhwActive, intensity: mhwIntensity, peakIntensity: mhwPeak, duration: mhwDuration, remaining: mhwRemaining, cooldown: mhwCooldown };

  return {
    state: {
      // Upwelling
      upwellingIntensity: upwellingIntensity,
      upwellingSeason: upwellingSeason,

      // OMZ
      omzDepth: omzDepth,
      omzProximity: omzProximity,

      // Source water
      sourceTemp: effectiveSourceTemp,
      sourceDO: effectiveSourceDO,
      sourceDIC: sourceDIC,
      sourceTA: sourceTA,
      sourcepH: sourcepH,
      sourceNO3: sourceNO3,
      sourcePO4: sourcePO4,
      sourceSalinity: sourceSalinity,
      sourceOmega: sourceOmega,

      // MHW
      mhwActive: mhwActive,
      mhwIntensity: mhwIntensity,
      mhwSSTAnomaly: mhwSSTAnomaly,
      mhwDuration: mhwDuration,
      mhwRemaining: mhwRemaining,

      // Copepod / productivity
      copepodQuality: copepodQuality,

      // Salmon marine survival
      marineSurvival: marineSurvival,
      marineSurvBase: marineSurvBase,

      // JdF inflow
      jdfInflowStrength: jdfInflowStrength,
    },

    _carry: {
      mhw: newMHW,
    },

    exports: {
      // Source water for computeMarineBasins
      pacSourceTemp: effectiveSourceTemp,
      pacSourceDO: effectiveSourceDO,
      pacSourceDIC: sourceDIC,
      pacSourceTA: sourceTA,
      pacSourcepH: sourcepH,
      pacSourceNutrients: sourceNO3,
      pacSourceSalinity: sourceSalinity,
      pacSourceOmega: sourceOmega,

      // Upwelling
      pacUpwellingIntensity: upwellingIntensity,
      pacOmzDepth: omzDepth,

      // MHW
      pacMhwActive: mhwActive,
      pacMhwIntensity: mhwIntensity,
      pacMhwSSTAnomaly: mhwSSTAnomaly,

      // Ecological indices
      pacCopepodQuality: copepodQuality,
      pacMarineSurvBase: marineSurvBase,
      pacMarineSurvSockeye: marineSurvival.sockeye,
      pacMarineSurvChinook: marineSurvival.chinook,
      pacMarineSurvPink: marineSurvival.pink,

      // Inflow
      pacJdfInflow: jdfInflowStrength,
    },
  };
}
