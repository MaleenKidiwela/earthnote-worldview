// ═══════════════════════════════════════════════════════════
// PSP VITAL SIGNS — Puget Sound Partnership recovery targets
// ═══════════════════════════════════════════════════════════
// Translation layer: maps model outputs to PSP's official vital sign
// indicators. No new computation — reads existing engine state.
//
// Source: Puget Sound Partnership 2022-2026 Action Agenda,
// PSP Vital Sign indicators (pugetpartnership.org)
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

export const PSP_VITAL_SIGNS = [
  {
    id: 'chinook',
    name: 'Chinook Salmon',
    category: 'Species & Food Web',
    modelKey: 'ecosystem.state.salmonStocks.chinook.totalReturn',
    pspBaseline: 48,
    pspTarget: 75,
    unit: '/100 index',
    transform: (v) => v !== undefined ? v : 48,
    status: (v) => v >= 75 ? 'on-track' : v >= 50 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'orca',
    name: 'Orcas (SRKW)',
    category: 'Species & Food Web',
    modelKey: 'ecosystem.state.orcaPopulation',
    pspBaseline: 74,
    pspTarget: 86,
    unit: 'individuals',
    transform: (v) => v !== undefined ? Math.round(v) : 74,
    status: (v) => v >= 86 ? 'on-track' : v >= 74 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'waterQuality',
    name: 'Marine Water Quality',
    category: 'Water Quality',
    modelKey: 'marine.state.waterQualityIndex',
    pspBaseline: 0.65,
    pspTarget: 0.80,
    unit: 'index',
    transform: (v) => v !== undefined ? +v.toFixed(2) : 0.65,
    status: (v) => v >= 0.80 ? 'on-track' : v >= 0.60 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'dissolvedOxygen',
    name: 'Marine Dissolved Oxygen',
    category: 'Water Quality',
    modelKey: 'marine.state.dissolvedOxygen',
    pspBaseline: 6.4,
    pspTarget: 7.0,
    unit: 'mg/L',
    transform: (v) => v !== undefined ? +v.toFixed(1) : 6.4,
    status: (v) => v >= 7.0 ? 'on-track' : v >= 5.0 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'eelgrass',
    name: 'Eelgrass Area',
    category: 'Habitats',
    modelKey: 'ecosystem.state.eelgrassHealth',
    pspBaseline: 0.50,
    pspTarget: 0.70,
    unit: 'health index',
    transform: (v) => v !== undefined ? +v.toFixed(2) : 0.50,
    status: (v) => v >= 0.70 ? 'on-track' : v >= 0.45 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'shorelineArmoring',
    name: 'Shoreline Armoring',
    category: 'Habitats',
    modelKey: 'ecosystem.state.coastalSqueeze',
    pspBaseline: 0.15,
    pspTarget: 0.05,
    unit: 'squeeze index',
    transform: (v) => v !== undefined ? +v.toFixed(2) : 0.15,
    status: (v) => v <= 0.05 ? 'on-track' : v <= 0.15 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'toxicsInFish',
    name: 'Toxics in Fish',
    category: 'Water Quality',
    modelKey: 'ecosystem.state.tissueContamination.salmon',
    pspBaseline: 0.18,
    pspTarget: 0.08,
    unit: 'contam index',
    transform: (v) => v !== undefined ? +v.toFixed(2) : 0.18,
    status: (v) => v <= 0.08 ? 'on-track' : v <= 0.20 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'shellfish',
    name: 'Shellfish Beds',
    category: 'Species & Food Web',
    modelKey: 'ecosystem.state.shellfishViability',
    pspBaseline: 0.75,
    pspTarget: 0.90,
    unit: 'viability index',
    transform: (v) => v !== undefined ? +v.toFixed(2) : 0.75,
    status: (v) => v >= 0.90 ? 'on-track' : v >= 0.70 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'landCover',
    name: 'Land Development & Cover',
    category: 'Habitats',
    modelKey: 'watershed.state.effForest',
    pspBaseline: 0.65,
    pspTarget: 0.70,
    unit: 'forest fraction',
    transform: (v) => v !== undefined ? +v.toFixed(2) : 0.65,
    status: (v) => v >= 0.70 ? 'on-track' : v >= 0.55 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'outdoorRec',
    name: 'Outdoor Recreation',
    category: 'Human Wellbeing',
    modelKey: 'ecosystem.state.recreationValue',
    pspBaseline: 0.50,
    pspTarget: 0.65,
    unit: 'index',
    transform: (v) => v !== undefined ? +v.toFixed(2) : 0.50,
    status: (v) => v >= 0.65 ? 'on-track' : v >= 0.45 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'culturalWellbeing',
    name: 'Cultural Wellbeing',
    category: 'Human Wellbeing',
    modelKey: 'ecosystem.state.culturalKeystoneHealth',
    pspBaseline: 0.55,
    pspTarget: 0.70,
    unit: 'index',
    transform: (v) => v !== undefined ? +v.toFixed(2) : 0.55,
    status: (v) => v >= 0.70 ? 'on-track' : v >= 0.45 ? 'mixed' : 'not-on-track',
  },
  {
    id: 'economicVitality',
    name: 'Economic Vitality',
    category: 'Human Wellbeing',
    modelKey: 'port.state.revenue',
    pspBaseline: 2500,
    pspTarget: 3000,
    unit: '$M/yr',
    transform: (v) => v !== undefined ? Math.round(v) : 2500,
    status: (v) => v >= 3000 ? 'on-track' : v >= 2000 ? 'mixed' : 'not-on-track',
  },
];

export const PSP_VITAL_SIGN_COUNT = PSP_VITAL_SIGNS.length;

// Evaluate all vital signs against current simulation results
export function evaluateVitalSigns(results) {
  if (!results) return [];
  return PSP_VITAL_SIGNS.map(vs => {
    // Navigate nested key path
    const parts = vs.modelKey.split('.');
    let val = results;
    for (const p of parts) {
      if (val === undefined || val === null) break;
      val = val[p];
    }
    const current = vs.transform(val);
    return {
      ...vs,
      current,
      status: vs.status(typeof current === 'number' ? current : 0),
    };
  });
}
