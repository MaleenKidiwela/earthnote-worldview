// ═══════════════════════════════════════════════════════════
// ARCTIC SHIPPING — Long-term strategic disruption from
// warming-driven Arctic route opening
// ═══════════════════════════════════════════════════════════
// As the Arctic warms, the Northwest Passage and Transpolar
// Sea Route open for commercial shipping. This is a 20-50 year
// horizon disruption that could fundamentally change Pacific
// Northwest port economics — or create new opportunities.
//
// The paradox: the same warming that opens Arctic routes also
// warms the Salish Sea, stresses salmon, amplifies MHW, and
// increases wildfire smoke.
//
// Sources:
//   Smith & Stephenson 2013 (PNAS): NWP navigability projections
//   Melia et al. 2016 (GRL): sea ice and Arctic shipping routes
//   Bekkers et al. 2018 (J. Int. Econ.): Arctic trade impacts
//   Humpert & Raspotnik 2012: Arctic shipping economics
//   IPCC AR6 WG1 Chapter 9: sea ice projections
//   Arctic Council 2009: Arctic Marine Shipping Assessment
//   Lasserre 2014 (Maritime Policy): commercial shipping viability
//   Pizzolato et al. 2016: NWP transit analysis
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

// ── ARCTIC ROUTES ──
export const ARCTIC_ROUTES = {
  nwp: {
    name: 'Northwest Passage',
    description: 'Through Canadian Arctic Archipelago',
    route: 'Asia → N. Pacific → Bering Strait → NWP → Atlantic → Europe',
    distanceSavingKm: 7000,       // vs Panama Canal for Asia-Europe
    distanceSavingPercent: 25,    // ~25% shorter than via Panama
    controllingNation: 'Canada',
    sovereigntyDisputed: true,    // Canada claims internal waters; US claims international strait
    currentStatus: 'seasonal',   // ice-free July-October in good years
    iceClassPremium: 0.25,       // 25% more expensive for ice-class vessels
    citation: 'Pizzolato et al. 2016, Smith & Stephenson 2013',
  },
  tsr: {
    name: 'Transpolar Sea Route',
    description: 'Directly across the Arctic Ocean pole',
    route: 'Asia → N. Pacific → Bering Strait → over pole → Europe',
    distanceSavingKm: 8000,
    distanceSavingPercent: 30,
    controllingNation: 'international',
    sovereigntyDisputed: false,
    currentStatus: 'not_viable',  // ice-covered year-round currently
    iceClassPremium: 0.35,
    citation: 'Melia et al. 2016',
  },
  nsr: {
    name: 'Northern Sea Route',
    description: 'Along Russian Arctic coast (partially operational)',
    route: 'Asia → NSR → Europe (competitive with Suez Canal)',
    distanceSavingKm: 5000,       // vs Suez
    distanceSavingPercent: 30,    // vs Suez for Asia-Europe
    controllingNation: 'Russia',
    sovereigntyDisputed: false,   // Russia controls, but geopolitically complicated
    currentStatus: 'partial',    // Russian icebreaker escort available
    iceClassPremium: 0.30,
    geopoliticalRisk: 0.8,       // sanctions, unpredictability
    citation: 'Humpert & Raspotnik 2012, Arctic Council AMSA',
  },
};

// ── ICE-FREE PROJECTIONS ──
// NWP ice-free months as a function of global temperature anomaly
// Source: IPCC AR6 WG1 Ch9, Smith & Stephenson 2013, Melia et al. 2016
export const ICE_FREE_PROJECTIONS = {
  // globalTempAnomaly (°C above pre-industrial) → months of NWP ice-free season
  thresholds: [
    { warming: 1.0, nwpMonths: 1.5, tsrMonths: 0, nsrMonths: 3 },
    { warming: 1.5, nwpMonths: 3.5, tsrMonths: 0.5, nsrMonths: 4 },
    { warming: 2.0, nwpMonths: 5.5, tsrMonths: 2, nsrMonths: 5 },
    { warming: 2.5, nwpMonths: 7, tsrMonths: 3, nsrMonths: 6 },
    { warming: 3.0, nwpMonths: 9, tsrMonths: 5, nsrMonths: 8 },
    { warming: 4.0, nwpMonths: 11, tsrMonths: 8, nsrMonths: 10 },
  ],
  // Break-even: ~4 months reliable ice-free makes NWP competitive for some routes
  competitivenessThresholdMonths: 4,
  citation: 'IPCC AR6 WG1 Chapter 9, Smith & Stephenson 2013',
};

// ── IMPACT ON SALISH SEA PORTS ──
export const SALISH_SEA_IMPACT = {
  // Direct competition: Asia-Europe transshipment diverted to Arctic routes
  transshipmentShare: 0.08,       // ~8% of current Salish Sea container volume is Asia-Europe transshipment
  maxTransshipmentLoss: 0.08,     // up to 8% container volume loss when Arctic fully open
  // Indirect opportunity: Arctic resource extraction staging
  arcticStagingOpportunity: 0.03, // up to 3% new cargo from Arctic supply chain
  // Net effect range
  netImpactRange: { min: -0.05, max: 0.03 }, // -5% to +3% over 30-year horizon
  // Port-specific impact
  portImpact: {
    nwsa: { exposure: 'low', transshipmentFraction: 0.05, arcticStaging: 0.01 },
    vancouver: { exposure: 'moderate', transshipmentFraction: 0.10, arcticStaging: 0.02 },
    princeRupert: { exposure: 'moderate_positive', transshipmentFraction: 0.05, arcticStaging: 0.05 },
  },
  notes: 'Most NWSA/Vancouver cargo is Asia-North America (final destination), NOT transshipment. Arctic routes primarily divert Asia-Europe cargo. The impact on Salish Sea is real but modest.',
};

// ── COMPUTE FUNCTIONS ──

// Interpolate ice-free months from warming
export function getIceFreeMonths(globalTempAnomaly, route = 'nwp') {
  const thresholds = ICE_FREE_PROJECTIONS.thresholds;
  const key = route === 'nwp' ? 'nwpMonths' : route === 'tsr' ? 'tsrMonths' : 'nsrMonths';

  if (globalTempAnomaly <= thresholds[0].warming) return thresholds[0][key];
  if (globalTempAnomaly >= thresholds[thresholds.length - 1].warming) return thresholds[thresholds.length - 1][key];

  for (let i = 0; i < thresholds.length - 1; i++) {
    if (globalTempAnomaly >= thresholds[i].warming && globalTempAnomaly < thresholds[i + 1].warming) {
      const frac = (globalTempAnomaly - thresholds[i].warming) / (thresholds[i + 1].warming - thresholds[i].warming);
      return thresholds[i][key] + frac * (thresholds[i + 1][key] - thresholds[i][key]);
    }
  }
  return 0;
}

// Compute route competitiveness (0-1)
export function getRouteCompetitiveness(iceFreeMonths, iceClassPremium = 0.25) {
  if (iceFreeMonths < 2) return 0; // not viable below 2 months
  // Competitiveness increases with season length, discounted by ice-class cost premium
  const seasonFactor = Math.min(iceFreeMonths / 12, 1);
  const costFactor = 1 - iceClassPremium;
  const reliabilityFactor = iceFreeMonths >= 4 ? 1.0 : iceFreeMonths / 4; // need 4+ months for reliable scheduling
  return Math.min(seasonFactor * costFactor * reliabilityFactor, 1.0);
}

// Compute Salish Sea throughput impact
export function getSalishSeaImpact(arcticCompetitiveness) {
  const transshipmentLoss = -SALISH_SEA_IMPACT.maxTransshipmentLoss * arcticCompetitiveness;
  const stagingGain = SALISH_SEA_IMPACT.arcticStagingOpportunity * Math.min(arcticCompetitiveness, 0.5) * 2;
  return {
    transshipmentLoss,          // negative (volume lost)
    stagingGain,                // positive (new volume)
    netImpact: transshipmentLoss + stagingGain,
    percentChange: (transshipmentLoss + stagingGain) * 100,
  };
}

// ── GEOPOLITICAL DIMENSIONS ──
export const GEOPOLITICS = {
  nwpSovereignty: {
    issue: 'Canada claims NWP as internal waters; US claims it as international strait',
    parallel: 'Echoes the JdF UNCLOS dynamic — same legal framework, different waters',
    implication: 'If NWP is international strait, transit passage rights apply and Canada cannot unilaterally regulate traffic. If internal waters, Canada has full control including environmental regulation.',
    modelConnection: 'Same transit passage / internal waters distinction as JdF in our maritimeLaw.js',
  },
  arcticMilitarySignificance: {
    issue: 'Strategic submarine corridors under Arctic ice are disappearing',
    implication: 'Loss of Arctic ice removes hiding places for submarines — affects deterrence calculus. Connects to our Bangor SSBN model.',
  },
  newFisheries: {
    issue: 'Warming Arctic opens new fishing grounds',
    implication: 'Some Salish Sea fishing fleet may redirect northward to new Arctic fisheries. Reduces local fishing pressure but creates new ecosystem impacts in Arctic.',
    modelConnection: 'Reduces fishingPressureAdj in macroEconomy.js as fleet diversifies.',
  },
};
