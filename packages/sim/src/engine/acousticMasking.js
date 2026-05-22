// ═══════════════════════════════════════════════════════════
// ACOUSTIC MASKING — Mechanistic noise-orca foraging model
// ═══════════════════════════════════════════════════════════
// Computes orca echolocation detection range as a function of
// ambient noise, then derives encounter rate and foraging efficiency.
//
// Sources:
//   Au et al. 2004 — orca click source levels (~220 dB re 1µPa)
//   Au & Benoit-Bird 2003 — biosonar detection thresholds
//   Veirs et al. 2016 — ship noise spectra in Haro Strait
//   Francois & Garrison 1982 — acoustic absorption in seawater
//   Williams R. et al. 2006 — behavioral response to vessel noise
//   Love 1977 — fish target strength
//   Ford 1989 — orca call frequency bands
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

var cl = function(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

// ── ORCA ECHOLOCATION PARAMETERS ──
var CLICK_SOURCE_LEVEL = 220; // dB re 1µPa @ 1m — Au et al. 2004
var CLICK_DIRECTIVITY = 25;   // dB — highly directional beam
var CHINOOK_TARGET_STRENGTH = -27; // dB — Love 1977 (adult Chinook ~60cm)
var DETECTION_THRESHOLD = 18;  // dB signal excess required — Au & Benoit-Bird 2003
var ABSORPTION_50KHZ = 15;     // dB/km at 50 kHz — Francois & Garrison 1982

// ── 1/3 OCTAVE BAND CENTER FREQUENCIES ──
// Standard bands relevant to marine species
// Veirs et al. 2016 Table II for vessel source levels
export var THIRD_OCTAVE_BANDS = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 50000, 63000];

// Species hearing/sensitivity bands (Hz)
export var SPECIES_BANDS = {
  srkw_echolocation: { low: 20000, high: 100000, peak: 50000 }, // Au et al. 2004
  srkw_communication: { low: 1000, high: 20000, peak: 8000 },   // Ford 1989
  humpback: { low: 20, high: 4000, peak: 500 },
  porpoise: { low: 100000, high: 150000, peak: 130000 },         // very high freq
  herring: { low: 100, high: 4000, peak: 1000 },
};

// Vessel spectral source levels (dB re 1µPa @ 1m per 1/3 octave band)
// Source: Veirs et al. 2016 Table II — median values
export var VESSEL_SPECTRA = {
  //                   63   125  250  500  1k   2k   4k   8k   16k  32k  50k  63k
  container:         [185, 183, 180, 177, 173, 168, 162, 155, 148, 140, 132, 128],
  tanker:            [187, 185, 182, 178, 174, 169, 163, 155, 147, 138, 130, 126],
  bulk:              [183, 182, 179, 175, 170, 164, 158, 150, 143, 135, 127, 123],
  tug:               [178, 177, 175, 173, 170, 167, 163, 158, 152, 145, 138, 134],
  recreational:      [160, 158, 155, 153, 152, 155, 158, 160, 158, 150, 142, 138],
  whale_watch:       [165, 163, 160, 158, 155, 152, 148, 144, 140, 135, 130, 126],
  ferry:             [180, 178, 175, 172, 168, 163, 158, 152, 146, 140, 134, 130],
};

// ── NOISE FIELD: spatial variation within sub-basins ──
// shippingLaneFraction: fraction of sub-basin area within ~2km of shipping lane
// orcaShippingOverlap: fraction of orca foraging habitat within acoustic range of lane
// Source: NOAA Critical Habitat maps + Veirs et al. 2016 hydrophone data
export var SUB_BASIN_NOISE_SPATIAL = {
  sj_haro:         { shippingLaneFrac: 0.35, orcaShippingOverlap: 0.70, ambientSPL: 100 },
  sj_rosario:      { shippingLaneFrac: 0.15, orcaShippingOverlap: 0.25, ambientSPL: 98 },
  georgia_central: { shippingLaneFrac: 0.25, orcaShippingOverlap: 0.30, ambientSPL: 102 },
  georgia_south:   { shippingLaneFrac: 0.15, orcaShippingOverlap: 0.15, ambientSPL: 97 },
  georgia_north:   { shippingLaneFrac: 0.10, orcaShippingOverlap: 0.10, ambientSPL: 95 },
  main_north:      { shippingLaneFrac: 0.40, orcaShippingOverlap: 0.20, ambientSPL: 105 },
  main_central:    { shippingLaneFrac: 0.20, orcaShippingOverlap: 0.15, ambientSPL: 100 },
  main_south:      { shippingLaneFrac: 0.30, orcaShippingOverlap: 0.10, ambientSPL: 103 },
  jdf_central:     { shippingLaneFrac: 0.20, orcaShippingOverlap: 0.15, ambientSPL: 98 },
  jdf_east:        { shippingLaneFrac: 0.25, orcaShippingOverlap: 0.20, ambientSPL: 100 },
  whidbey_south:   { shippingLaneFrac: 0.15, orcaShippingOverlap: 0.05, ambientSPL: 96 },
  hood_north:      { shippingLaneFrac: 0.05, orcaShippingOverlap: 0.02, ambientSPL: 90 },
};

// ── DETECTION RANGE COMPUTATION ──
// Compute max range (meters) at which orca can detect Chinook via echolocation
// given ambient noise level in the echolocation band (50 kHz)
export function computeDetectionRange(noiseSPL_50kHz) {
  // Sonar equation: EL = SL + DI - 2*TL + TS
  // Detection: EL - NL >= DT
  // SL + DI - 2*TL + TS - NL >= DT
  // 2*TL <= SL + DI + TS - NL - DT
  // TL_max = (SL + DI + TS - NL - DT) / 2
  var maxTL = (CLICK_SOURCE_LEVEL + CLICK_DIRECTIVITY + CHINOOK_TARGET_STRENGTH - noiseSPL_50kHz - DETECTION_THRESHOLD) / 2;

  // TL = 20*log10(R) + alpha*R/1000 (R in meters, alpha in dB/km)
  // Solve iteratively for R where TL(R) = maxTL
  if (maxTL <= 0) return 1; // can't detect anything

  var R = 100; // initial guess in meters
  for (var iter = 0; iter < 20; iter++) {
    var TL = 20 * Math.log10(Math.max(R, 1)) + ABSORPTION_50KHZ * R / 1000;
    if (Math.abs(TL - maxTL) < 0.5) break;
    // Newton-like step
    var dTL = 20 / (R * Math.log(10)) + ABSORPTION_50KHZ / 1000;
    R = R - (TL - maxTL) / dTL;
    R = Math.max(1, Math.min(1000, R)); // clamp to reasonable range
  }
  return Math.max(1, Math.round(R));
}

// ── FORAGING EFFICIENCY from detection range ──
// Encounter rate ∝ detectionRange² × preyDensity (sweeping a cone)
// Normalized to ambient conditions as reference
export function computeForagingEfficiency(noiseSPL_50kHz, preyDensity) {
  var range = computeDetectionRange(noiseSPL_50kHz);
  var ambientRange = computeDetectionRange(85); // ~85 dB at 50 kHz = natural ambient (Veirs et al. 2016)

  // Encounter rate scales with range² (search volume)
  var encounterRatio = ambientRange > 0 ? (range * range) / (ambientRange * ambientRange) : 0;

  // Prey capture probability: ~35% at normal range, decreases slightly at very short range
  // (prey evasion easier when orca must approach closely)
  var captureProbability = range > 50 ? 0.35 : cl(0.35 * range / 50, 0.10, 0.35);

  // Metabolic cost increase from behavioral disruption — Williams R. et al. 2006
  // Orca increase swimming speed, reduce dive time in noise
  var metabolicPenalty = noiseSPL_50kHz > 100 ? cl((noiseSPL_50kHz - 100) * 0.008, 0, 0.25) : 0;

  // Final foraging efficiency
  var efficiency = cl(encounterRatio * captureProbability / 0.35 * (1 - metabolicPenalty), 0.05, 1.0);

  return {
    detectionRange_m: range,
    ambientRange_m: ambientRange,
    encounterRatio: encounterRatio,
    foragingEfficiency: efficiency,
    metabolicPenalty: metabolicPenalty,
    maskingIndex: cl(1 - efficiency, 0, 1),
  };
}

// ── NOISE FIELD COMPUTATION ──
// Compute effective noise at orca foraging locations within a sub-basin
export function computeSubBasinNoiseField(subBasinId, vesselNoiseSPL, speedReduction) {
  var spatial = SUB_BASIN_NOISE_SPATIAL[subBasinId];
  if (!spatial) return { orcaExposureSPL: vesselNoiseSPL, ambientSPL: 95, shippingNoiseSPL: vesselNoiseSPL };

  var ambientSPL = spatial.ambientSPL;

  // Shipping noise in the lane (louder than basin average)
  var laneSPL = cl(vesselNoiseSPL + 6, ambientSPL, 150); // +6 dB in-lane concentration

  // Speed reduction benefit — Veirs et al. 2016: 1 knot reduction ≈ 1 dB reduction
  // Speed zones reduce noise by 3-6 dB depending on implementation
  var speedBenefit = (speedReduction || 0) * 5; // dB reduction from speed zone
  laneSPL = cl(laneSPL - speedBenefit, ambientSPL, 150);

  // Orca exposure: weighted average based on overlap with shipping lanes
  var overlap = spatial.orcaShippingOverlap;
  // Energy averaging in dB: 10*log10(overlap*10^(laneSPL/10) + (1-overlap)*10^(ambientSPL/10))
  var orcaExposureSPL = 10 * Math.log10(
    overlap * Math.pow(10, laneSPL / 10) +
    (1 - overlap) * Math.pow(10, ambientSPL / 10)
  );

  return {
    ambientSPL: ambientSPL,
    shippingNoiseSPL: laneSPL,
    orcaExposureSPL: cl(orcaExposureSPL, ambientSPL, 150),
    shippingLaneFraction: spatial.shippingLaneFrac,
    orcaShippingOverlap: overlap,
  };
}

// ── ORCASOUND HYDROPHONE LOCATIONS ──
// For live data integration — maps hydrophone to sub-basin
export var ORCASOUND_HYDROPHONES = [
  { id: 'orcasound_lab', name: 'Orcasound Lab', subBasin: 'sj_haro',
    lat: 48.5155, lon: -123.2140,
    description: 'West side San Juan Island — THE critical SRKW noise exposure site',
    // medianBroadbandSPL 117 dB is a Path 4 model-construction received-
    //   level proxy, not source-level. Veirs et al. 2016 paper-direct values
    //   (12-band 1/3 octave spectra, 173 dB SL @ 1m, ~1 dB/knot slowdown)
    //   are preserved elsewhere in this file as framework-grounded; this
    //   medianBroadbandSPL field encodes a hydrophone-site received-level
    //   estimate rather than a paper-direct Veirs source-level. Path 4 per
    //   Amendment 6 §5.24(b). See docs/citation-audit-followups.md §5.5
    //   Veirs entry.
    medianBroadbandSPL: 117, // dB re 1µPa — Veirs et al. 2016
    median50kHz: 85, // dB re 1µPa in 50 kHz band when no ship
    shipPass50kHz: 110, // dB re 1µPa during ship pass
    s3Bucket: 's3://streaming-orcasound-net/rpi_orcasound_lab/',
  },
  { id: 'bush_point', name: 'Bush Point', subBasin: 'whidbey_central',
    lat: 48.0268, lon: -122.6122,
    description: 'Whidbey Island — monitors vessel traffic entering Puget Sound',
    medianBroadbandSPL: 112,
    s3Bucket: 's3://streaming-orcasound-net/rpi_bush_point/',
  },
  { id: 'port_townsend', name: 'Port Townsend', subBasin: 'jdf_east',
    lat: 48.1138, lon: -122.7605,
    description: 'Admiralty Inlet entrance — vessel transit monitoring',
    medianBroadbandSPL: 114,
    s3Bucket: 's3://streaming-orcasound-net/rpi_port_townsend/',
  },
];
