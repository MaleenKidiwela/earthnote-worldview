// ═══════════════════════════════════════════════════════════
// RF_MODELS — Pre-trained Random Forest models for simulation
// ═══════════════════════════════════════════════════════════
// Hand-built initial trees encoding known empirical relationships.
// Replace with Python-trained models from scripts/train_marine_survival_rf.py
// for full 100-tree accuracy.
//
// Tree format:
//   Internal: { feature, threshold, left, right }
//   Leaf: { value }
//
// Features: sst_anomaly, pdo_index, enso_index, upwelling_intensity,
//   copepod_quality, mhw_active, mhw_intensity, alaska_hatchery

// ── Tree builder helpers ──
function node(f, t, l, r) { return { feature: f, threshold: t, left: l, right: r }; }
function leaf(v) { return { value: v }; }

// ── Base marine survival trees ──
// Each tree encodes a partial view of the survival relationship.
// Averaging 20 trees approximates the nonlinear response surface.

function makeBaseTrees(speciesMult) {
  var m = speciesMult;
  return [
    // Tree 1: MHW dominates
    node('mhw_active', 0.5,
      node('sst_anomaly', 1.5, leaf(0.55 * m), leaf(0.35 * m)),
      node('mhw_intensity', 2.0, leaf(0.25 * m), leaf(0.10 * m))),

    // Tree 2: PDO + ENSO interaction
    node('pdo_index', 0.5,
      node('enso_index', 0.5, leaf(0.60 * m), leaf(0.45 * m)),
      node('enso_index', 0.5, leaf(0.40 * m), leaf(0.25 * m))),

    // Tree 3: Copepod quality primary
    node('copepod_quality', 0.4,
      node('sst_anomaly', 2.0, leaf(0.20 * m), leaf(0.12 * m)),
      node('copepod_quality', 0.7, leaf(0.45 * m), leaf(0.60 * m))),

    // Tree 4: Upwelling benefit
    node('upwelling_intensity', 0.4,
      node('mhw_active', 0.5, leaf(0.30 * m), leaf(0.12 * m)),
      node('sst_anomaly', 1.0, leaf(0.55 * m), leaf(0.40 * m))),

    // Tree 5: SST threshold response
    node('sst_anomaly', 0.5,
      node('copepod_quality', 0.5, leaf(0.50 * m), leaf(0.62 * m)),
      node('sst_anomaly', 2.5, leaf(0.35 * m), leaf(0.15 * m))),

    // Tree 6: Alaska hatchery competition
    node('alaska_hatchery', 0.6,
      node('pdo_index', 0.0, leaf(0.55 * m), leaf(0.42 * m)),
      node('copepod_quality', 0.5, leaf(0.30 * m), leaf(0.38 * m))),

    // Tree 7: MHW intensity gradient
    node('mhw_active', 0.5,
      node('pdo_index', -0.5, leaf(0.58 * m), leaf(0.48 * m)),
      node('mhw_intensity', 3.0, leaf(0.18 * m), leaf(0.06 * m))),

    // Tree 8: Combined warm signal
    node('sst_anomaly', 1.0,
      node('upwelling_intensity', 0.5, leaf(0.48 * m), leaf(0.58 * m)),
      node('pdo_index', 0.8, leaf(0.32 * m), leaf(0.20 * m))),

    // Tree 9: Cold favorable conditions
    node('enso_index', -0.5,
      node('copepod_quality', 0.6, leaf(0.55 * m), leaf(0.68 * m)),
      node('mhw_active', 0.5, leaf(0.42 * m), leaf(0.15 * m))),

    // Tree 10: Moderate conditions
    node('sst_anomaly', 0.0,
      node('pdo_index', -1.0, leaf(0.62 * m), leaf(0.55 * m)),
      node('sst_anomaly', 2.0,
        node('copepod_quality', 0.45, leaf(0.30 * m), leaf(0.42 * m)),
        leaf(0.18 * m))),

    // Tree 11: Upwelling + copepod synergy
    node('upwelling_intensity', 0.6,
      node('sst_anomaly', 1.5, leaf(0.38 * m), leaf(0.22 * m)),
      node('copepod_quality', 0.55, leaf(0.50 * m), leaf(0.62 * m))),

    // Tree 12: El Niño cascade
    node('enso_index', 1.0,
      node('pdo_index', 0.5, leaf(0.45 * m), leaf(0.35 * m)),
      node('mhw_active', 0.5, leaf(0.22 * m), leaf(0.10 * m))),

    // Tree 13: La Niña benefit
    node('enso_index', -1.0,
      node('upwelling_intensity', 0.5, leaf(0.58 * m), leaf(0.65 * m)),
      node('sst_anomaly', 1.0, leaf(0.48 * m), leaf(0.30 * m))),

    // Tree 14: Deep warm anomaly
    node('sst_anomaly', 3.0,
      node('mhw_active', 0.5,
        node('copepod_quality', 0.4, leaf(0.28 * m), leaf(0.40 * m)),
        leaf(0.08 * m)),
      leaf(0.05 * m)),

    // Tree 15: Hatchery + warm interaction
    node('alaska_hatchery', 0.4,
      node('sst_anomaly', 1.0, leaf(0.52 * m), leaf(0.38 * m)),
      node('sst_anomaly', 1.5, leaf(0.40 * m), leaf(0.25 * m))),

    // Tree 16: Copepod threshold
    node('copepod_quality', 0.3,
      leaf(0.15 * m),
      node('copepod_quality', 0.6,
        node('sst_anomaly', 1.0, leaf(0.42 * m), leaf(0.32 * m)),
        leaf(0.55 * m))),

    // Tree 17: MHW recovery lag
    node('mhw_active', 0.5,
      node('enso_index', 0.0, leaf(0.52 * m), leaf(0.40 * m)),
      node('mhw_intensity', 1.5, leaf(0.28 * m), leaf(0.12 * m))),

    // Tree 18: Neutral baseline
    node('pdo_index', -0.3,
      node('enso_index', -0.3, leaf(0.58 * m), leaf(0.50 * m)),
      node('pdo_index', 1.0, leaf(0.38 * m), leaf(0.28 * m))),

    // Tree 19: Strong upwelling rescue
    node('upwelling_intensity', 0.7,
      node('mhw_active', 0.5, leaf(0.35 * m), leaf(0.15 * m)),
      node('sst_anomaly', 0.5, leaf(0.58 * m), leaf(0.50 * m))),

    // Tree 20: Compound warm event
    node('sst_anomaly', 1.5,
      node('alaska_hatchery', 0.5, leaf(0.45 * m), leaf(0.38 * m)),
      node('enso_index', 0.8,
        node('pdo_index', 0.5, leaf(0.28 * m), leaf(0.18 * m)),
        leaf(0.12 * m))),
  ];
}

var baseImportance = {
  sst_anomaly: 0.28,
  mhw_active: 0.18,
  copepod_quality: 0.16,
  pdo_index: 0.12,
  enso_index: 0.10,
  upwelling_intensity: 0.08,
  alaska_hatchery: 0.05,
  mhw_intensity: 0.03,
};

var baseFeatures = ['sst_anomaly', 'pdo_index', 'enso_index', 'upwelling_intensity',
  'copepod_quality', 'mhw_active', 'mhw_intensity', 'alaska_hatchery'];

var baseMeta = {
  type: 'hand_built',
  note: 'Approximate trees encoding known empirical relationships. Replace with Python-trained model for full accuracy.',
  trainDate: '2026-03-22',
};

export var RF_MODELS = {
  marineSurvival: {
    name: 'Marine Survival (base)',
    trees: makeBaseTrees(1.0),
    features: baseFeatures,
    importance: baseImportance,
    meta: baseMeta,
  },
  marineSurvival_sockeye: {
    name: 'Marine Survival — Sockeye',
    trees: makeBaseTrees(0.85),
    features: baseFeatures,
    importance: baseImportance,
    meta: { ...baseMeta, species: 'sockeye', note: 'Most sensitive to SST (x0.85)' },
  },
  marineSurvival_chinook: {
    name: 'Marine Survival — Chinook',
    trees: makeBaseTrees(1.0),
    features: baseFeatures,
    importance: baseImportance,
    meta: { ...baseMeta, species: 'chinook', note: 'Moderate sensitivity (x1.0)' },
  },
  marineSurvival_pink: {
    name: 'Marine Survival — Pink',
    trees: makeBaseTrees(1.15),
    features: baseFeatures,
    importance: baseImportance,
    meta: { ...baseMeta, species: 'pink', note: 'Most resilient, short ocean time (x1.15)' },
  },
  marineSurvival_coho: {
    name: 'Marine Survival — Coho',
    trees: makeBaseTrees(0.90),
    features: baseFeatures,
    importance: baseImportance,
    meta: { ...baseMeta, species: 'coho', note: 'Moderate-high sensitivity (x0.90)' },
  },
  marineSurvival_chum: {
    name: 'Marine Survival — Chum',
    trees: makeBaseTrees(0.95),
    features: baseFeatures,
    importance: baseImportance,
    meta: { ...baseMeta, species: 'chum', note: 'Moderate sensitivity (x0.95)' },
  },

  // ════ HAB BLOOM MODELS ════
  // Alexandrium (PSP/saxitoxin): warm, stratified, summer, low mixing
  // Refs: Trainer et al. 2002, Moore et al. 2009
  hab_alexandrium: {
    name: 'HAB — Alexandrium (PSP)',
    features: ['sst', 'stratification', 'din', 'si_n_ratio', 'salinity', 'quarter', 'mhw_active'],
    importance: { sst: 0.28, stratification: 0.22, quarter: 0.15, din: 0.12, salinity: 0.10, si_n_ratio: 0.08, mhw_active: 0.05 },
    meta: { type: 'hand_built', note: 'Alexandrium: warm + stratified + summer = PSP bloom' },
    trees: [
      // T1: Temperature dominates
      node('sst', 13, leaf(0.08), node('stratification', 0.5, leaf(0.25), leaf(0.55))),
      // T2: Seasonal peak (Q2=0.5 summer)
      node('quarter', 1.5, leaf(0.05), node('quarter', 2.5, node('sst', 14, leaf(0.20), leaf(0.50)), leaf(0.12))),
      // T3: Stratification + nutrients
      node('stratification', 0.4, leaf(0.06), node('din', 8, leaf(0.18), leaf(0.42))),
      // T4: Salinity optimum (25-30)
      node('salinity', 24, leaf(0.10), node('salinity', 31, node('sst', 12, leaf(0.15), leaf(0.40)), leaf(0.08))),
      // T5: MHW boost
      node('mhw_active', 0.5, node('sst', 13.5, leaf(0.10), leaf(0.35)), leaf(0.55)),
      // T6: Si:N ratio — low Si favors dinos
      node('si_n_ratio', 1.0, node('sst', 13, leaf(0.12), leaf(0.48)), node('din', 10, leaf(0.08), leaf(0.22))),
      // T7: Cold kills bloom
      node('sst', 10, leaf(0.02), node('stratification', 0.6, leaf(0.18), leaf(0.45))),
      // T8: Warm + mixed = moderate
      node('sst', 14, node('stratification', 0.3, leaf(0.05), leaf(0.20)), node('din', 15, leaf(0.35), leaf(0.60))),
      // T9: Winter suppression
      node('quarter', 0.5, leaf(0.03), node('sst', 12, leaf(0.08), leaf(0.32))),
      // T10: Combined warm signal
      node('sst', 15, node('quarter', 1.5, leaf(0.12), leaf(0.30)), node('stratification', 0.5, leaf(0.40), leaf(0.65))),
      // T11-15: variations
      node('din', 12, node('sst', 11, leaf(0.04), leaf(0.15)), node('stratification', 0.5, leaf(0.25), leaf(0.45))),
      node('stratification', 0.3, leaf(0.04), node('sst', 14, leaf(0.22), leaf(0.50))),
      node('sst', 12.5, node('quarter', 2.5, leaf(0.05), leaf(0.03)), node('mhw_active', 0.5, leaf(0.28), leaf(0.52))),
      node('quarter', 1, leaf(0.04), node('quarter', 3, node('sst', 13, leaf(0.15), leaf(0.38)), leaf(0.08))),
      node('salinity', 26, node('sst', 11, leaf(0.03), leaf(0.18)), node('sst', 13, leaf(0.20), leaf(0.42))),
    ],
  },

  // Pseudo-nitzschia (ASP/domoic acid): upwelling + nutrients + spring-summer
  // Refs: Trainer et al. 2012, McCabe et al. 2016
  hab_pseudonitzschia: {
    name: 'HAB — Pseudo-nitzschia (ASP)',
    features: ['sst', 'din', 'dsi', 'si_n_ratio', 'upwelling', 'quarter', 'mhw_active'],
    importance: { din: 0.25, upwelling: 0.22, si_n_ratio: 0.18, sst: 0.12, quarter: 0.10, dsi: 0.08, mhw_active: 0.05 },
    meta: { type: 'hand_built', note: 'Pseudo-nitzschia: upwelling + high N + low Si:N = ASP bloom' },
    trees: [
      // T1: Nutrient driven
      node('din', 15, leaf(0.06), node('upwelling', 0.4, leaf(0.20), leaf(0.50))),
      // T2: Si:N ratio — low Si favors Pseudo-nitzschia over diatoms
      node('si_n_ratio', 1.0, node('din', 10, leaf(0.15), leaf(0.52)), leaf(0.08)),
      // T3: Upwelling primary
      node('upwelling', 0.5, node('din', 12, leaf(0.05), leaf(0.18)), node('din', 10, leaf(0.25), leaf(0.55))),
      // T4: Spring peak
      node('quarter', 0.5, leaf(0.05), node('quarter', 2.5, node('upwelling', 0.4, leaf(0.15), leaf(0.40)), leaf(0.10))),
      // T5: Cool water OK (unlike Alexandrium)
      node('sst', 10, node('upwelling', 0.6, leaf(0.15), leaf(0.35)), node('din', 15, leaf(0.20), leaf(0.45))),
      // T6: MHW intensifies
      node('mhw_active', 0.5, node('din', 12, leaf(0.08), leaf(0.25)), node('upwelling', 0.3, leaf(0.35), leaf(0.58))),
      // T7: High N + low Si = danger
      node('din', 20, node('si_n_ratio', 0.8, leaf(0.55), leaf(0.18)), node('upwelling', 0.5, leaf(0.10), leaf(0.30))),
      // T8: Low nutrients = no bloom
      node('din', 5, leaf(0.02), node('upwelling', 0.5, leaf(0.15), leaf(0.38))),
      // T9: DSi availability
      node('dsi', 10, node('din', 15, leaf(0.45), leaf(0.15)), node('din', 10, leaf(0.08), leaf(0.22))),
      // T10: Seasonal + nutrient
      node('quarter', 1, leaf(0.04), node('din', 18, node('upwelling', 0.4, leaf(0.22), leaf(0.48)), leaf(0.12))),
      // T11-15
      node('upwelling', 0.3, node('din', 10, leaf(0.04), leaf(0.12)), node('si_n_ratio', 1.2, leaf(0.42), leaf(0.15))),
      node('din', 25, node('si_n_ratio', 0.7, leaf(0.60), leaf(0.25)), leaf(0.08)),
      node('sst', 14, node('upwelling', 0.5, leaf(0.12), leaf(0.32)), node('din', 12, leaf(0.20), leaf(0.45))),
      node('quarter', 3, leaf(0.06), node('upwelling', 0.4, leaf(0.10), leaf(0.35))),
      node('si_n_ratio', 0.5, node('din', 12, leaf(0.30), leaf(0.58)), node('upwelling', 0.5, leaf(0.10), leaf(0.28))),
    ],
  },

  // ════ LANDSLIDE PROBABILITY MODELS ════
  // Chuckanut section: geologically most vulnerable (Bellingham Formation sandstone)
  // Refs: WSDOT Geotechnical Reports, Baum et al. 2005, March 2026 event
  landslide_chuckanut: {
    name: 'Landslide — Chuckanut',
    features: ['antecedent_precip', 'precip_intensity', 'ar_active', 'ar_category', 'freeze_thaw', 'slope_condition', 'season', 'earthquake'],
    importance: { antecedent_precip: 0.30, ar_active: 0.20, slope_condition: 0.15, freeze_thaw: 0.12, precip_intensity: 0.10, season: 0.06, ar_category: 0.04, earthquake: 0.03 },
    meta: { type: 'hand_built', geology: 'chuckanut', vulnerability: 0.8, note: 'Chuckanut MP 246-252: highest geological risk' },
    trees: [
      // T1: Antecedent moisture is #1 (McShane: "heavy rain clears out the stuff keeping it stuck together")
      node('antecedent_precip', 200, leaf(0.02), node('ar_active', 0.5, leaf(0.08), leaf(0.18))),
      // T2: AR events trigger slides
      node('ar_active', 0.5, node('antecedent_precip', 150, leaf(0.01), leaf(0.04)), node('ar_category', 3, leaf(0.10), leaf(0.22))),
      // T3: Maintenance matters
      node('slope_condition', 0.6, node('antecedent_precip', 100, leaf(0.04), leaf(0.12)), node('ar_active', 0.5, leaf(0.02), leaf(0.06))),
      // T4: Freeze-thaw weakens bedrock
      node('freeze_thaw', 8, node('antecedent_precip', 150, leaf(0.01), leaf(0.05)), node('antecedent_precip', 180, leaf(0.06), leaf(0.16))),
      // T5: Wet season (winter/spring Q0,Q3)
      node('season', 0.5, node('antecedent_precip', 200, leaf(0.03), leaf(0.10)), node('season', 2.5, leaf(0.02), node('antecedent_precip', 150, leaf(0.02), leaf(0.08)))),
      // T6: Compound: AR + wet antecedent
      node('antecedent_precip', 250, node('ar_active', 0.5, leaf(0.03), leaf(0.08)), node('ar_active', 0.5, leaf(0.10), leaf(0.25))),
      // T7: Earthquake on saturated slope
      node('earthquake', 0.5, node('antecedent_precip', 100, leaf(0.01), leaf(0.05)), node('antecedent_precip', 150, leaf(0.08), leaf(0.20))),
      // T8: Low maintenance + wet = danger
      node('slope_condition', 0.4, node('antecedent_precip', 180, leaf(0.05), leaf(0.18)), node('antecedent_precip', 250, leaf(0.02), leaf(0.08))),
      // T9: Dry season safety
      node('precip_intensity', 5, leaf(0.01), node('antecedent_precip', 200, leaf(0.04), leaf(0.12))),
      // T10: Heavy sustained rain
      node('precip_intensity', 20, node('antecedent_precip', 100, leaf(0.02), leaf(0.06)), node('ar_category', 4, leaf(0.12), leaf(0.22))),
      // T11-15
      node('antecedent_precip', 300, node('slope_condition', 0.5, leaf(0.08), leaf(0.05)), leaf(0.20)),
      node('ar_category', 2, node('freeze_thaw', 5, leaf(0.02), leaf(0.04)), node('antecedent_precip', 150, leaf(0.06), leaf(0.15))),
      node('freeze_thaw', 12, node('slope_condition', 0.5, leaf(0.06), leaf(0.03)), node('antecedent_precip', 200, leaf(0.10), leaf(0.18))),
      node('slope_condition', 0.7, node('ar_active', 0.5, leaf(0.01), leaf(0.05)), leaf(0.01)),
      node('antecedent_precip', 180, leaf(0.02), node('freeze_thaw', 6, leaf(0.06), leaf(0.12))),
    ],
  },

  // General I-5 sections (lower geological vulnerability)
  landslide_general: {
    name: 'Landslide — General I-5',
    features: ['antecedent_precip', 'precip_intensity', 'ar_active', 'ar_category', 'freeze_thaw', 'slope_condition', 'season', 'earthquake'],
    importance: { antecedent_precip: 0.28, ar_active: 0.18, slope_condition: 0.18, earthquake: 0.12, precip_intensity: 0.10, freeze_thaw: 0.08, season: 0.04, ar_category: 0.02 },
    meta: { type: 'hand_built', geology: 'general', vulnerability: 0.3, note: 'General I-5: lower geological risk than Chuckanut' },
    trees: [
      // Same structure but lower probabilities (~0.3× Chuckanut)
      node('antecedent_precip', 250, leaf(0.005), node('ar_active', 0.5, leaf(0.02), leaf(0.06))),
      node('ar_active', 0.5, node('antecedent_precip', 200, leaf(0.003), leaf(0.01)), node('ar_category', 3, leaf(0.03), leaf(0.08))),
      node('slope_condition', 0.5, node('antecedent_precip', 150, leaf(0.01), leaf(0.04)), leaf(0.005)),
      node('freeze_thaw', 10, leaf(0.003), node('antecedent_precip', 200, leaf(0.02), leaf(0.05))),
      node('earthquake', 0.5, node('antecedent_precip', 100, leaf(0.003), leaf(0.01)), leaf(0.08)),
      node('antecedent_precip', 300, node('ar_active', 0.5, leaf(0.008), leaf(0.03)), node('slope_condition', 0.5, leaf(0.08), leaf(0.04))),
      node('season', 0.5, node('antecedent_precip', 200, leaf(0.005), leaf(0.025)), leaf(0.003)),
      node('precip_intensity', 25, node('antecedent_precip', 150, leaf(0.005), leaf(0.02)), leaf(0.05)),
      node('slope_condition', 0.6, node('ar_active', 0.5, leaf(0.003), leaf(0.015)), leaf(0.003)),
      node('antecedent_precip', 200, leaf(0.004), node('ar_category', 2, leaf(0.02), leaf(0.04))),
      node('freeze_thaw', 8, leaf(0.003), node('slope_condition', 0.4, leaf(0.04), leaf(0.01))),
      node('ar_active', 0.5, leaf(0.004), node('precip_intensity', 15, leaf(0.02), leaf(0.06))),
      node('antecedent_precip', 180, node('earthquake', 0.5, leaf(0.003), leaf(0.04)), leaf(0.02)),
      node('slope_condition', 0.7, leaf(0.002), node('antecedent_precip', 250, leaf(0.01), leaf(0.05))),
      node('earthquake', 0.5, leaf(0.003), node('antecedent_precip', 100, leaf(0.03), leaf(0.07))),
    ],
  },
};
