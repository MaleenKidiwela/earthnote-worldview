// ═══════════════════════════════════════════════════════════
// GOVERNANCE SCENARIO LAB — Role definitions, tensions, alignments
// NOTE: The export name STAKEHOLDER_ROLES is retained for backwards compatibility,
// but the UI-facing name is "Governance Lab." Tribal nations participate as
// sovereign co-managers with treaty-protected authority, not as stakeholders.
// ═══════════════════════════════════════════════════════════

import { DEF } from './defaults.js';
import { CALIBRATION_TARGETS } from './calibrationTargets.js';

// Helper to get a calibration target value as "observed unit"
function calTarget(id) {
  const t = CALIBRATION_TARGETS.find(t => t.id === id);
  return t ? t.observed + ' ' + t.unit : '\u2014';
}

export const STAKEHOLDER_ROLES = {
  port: {
    id: 'port',
    name: 'Port Authority',
    icon: '⚓',
    tagline: 'Keep the ports competitive and our communities employed',
    color: '#8B6914',
    colorLight: '#FEF3E2',
    analog: 'Northwest Seaports Alliance',
    budget: 2000,
    optimizes: ['Employment', 'Revenue', 'Supply chain'],
    briefing: 'The Northwest Seaports Alliance manages the ports of Seattle and Tacoma \u2014 the 4th largest container gateway in North America. Your 30,000+ direct employees and $300B in trade depend on deep shipping channels, efficient terminals, and competitive freight rates. But every vessel that enters Puget Sound adds underwater noise that disrupts orca echolocation.',
    keyStats: [
      { label: 'Current vessel traffic', value: calTarget('vessel_density'), source: 'USCG VTS' },
      { label: 'Port throughput', value: DEF.port.containerThroughput + ' TEU', source: 'NWSA 2024' },
      { label: 'Underwater noise', value: '150+ dB re 1\u03bcPa', source: 'NOAA noise monitoring' },
    ],
    redLines: ['Will not accept >20% reduction in container throughput', 'Minimum vessel access to all terminals'],
    leverage: 'Controls 30,000+ jobs and $300B in regional trade. Economic arguments carry political weight.',
    params: {
      port: ['containerThroughput', 'avgVesselSize', 'dredgingIntensity', 'shorepower', 'cruiseShipCalls', 'vesselSpeedZone', 'altFuelFraction', 'autonomousVessels', 'ballastTreatment', 'seattleThroughput', 'tacomaThroughput', 'vancouverThroughput', 'bellinghamGrowthRate', 'bremertonNavalActivity', 'seattleCruiseCalls', 'vancouverCruiseCalls', 'victoriaCruiseCalls', 'seattleShorepower', 'tacomaShorepower', 'vancouverShorepower', 'environmentalLevyRate'],
    },
    kpis: [
      { key: 'employment', label: 'Employment', extract: (r) => r.port.state.employment, max: 60000, unit: 'jobs' },
      { key: 'revenue', label: 'Revenue', extract: (r) => r.port.state.revenue, max: 5000, unit: '$M' },
      { key: 'supplyChain', label: 'Supply chain', extract: (r) => r.port.state.supplyChainEff || 1, max: 1 },
      { key: 'vesselDensity', label: 'Vessel density', extract: (r) => r.port.state.vesselDensity, max: 50, unit: 'ships/d' },
    ],
  },
  tribal: {
    id: 'tribal',
    name: 'Tribal Fisheries Council',
    icon: '🐟',
    tagline: 'Protect treaty rights and restore what was promised',
    color: '#7B4A8C',
    colorLight: '#F3ECF6',
    analog: 'Northwest Indian Fisheries Commission',
    budget: 500,
    optimizes: ['Treaty fisheries', 'Food sovereignty', 'Salmon runs'],
    briefing: 'The Northwest Indian Fisheries Commission represents 20 treaty tribes whose fishing rights were affirmed in the 1974 Boldt Decision (U.S. v. Washington). Your people have fished these waters for 10,000+ years. Every salmon that doesn\'t return is a treaty violation. Food sovereignty means shellfish, salmon, and lamprey \u2014 not grocery stores.',
    keyStats: [
      { label: 'Salmon run index', value: calTarget('salmon_run'), source: 'WDFW/NWIFC' },
      { label: 'SRKW population', value: calTarget('orca_population'), source: 'CWR census' },
      { label: 'Food sovereignty index', value: '~60%', source: 'Model estimate' },
    ],
    redLines: ['Treaty fishing rights are non-negotiable', 'Co-management authority must be maintained or expanded'],
    leverage: 'Treaty rights have the force of federal law. Can block projects through legal challenges and co-management authority.',
    params: {
      ecosystem: ['fishingPressure', 'coManagementIndex', 'hatcheryFraction', 'protectedAreaFraction', 'fishPassageInvestment', 'eelgrassRestoration', 'greenCrabRemoval'],
      tribal: ['treatyImplementation', 'tribalManagementFunding', 'tekIntegration', 'tribalRestorationInvestment', 'culturalSiteProtection'],
      fisheries: ['tribalHarvestAllocation', 'orcaPreyProtectionLevel', 'harvestRuleStrictness'],
    },
    kpis: [
      { key: 'salmon', label: 'Salmon run', extract: (r) => r.ecosystem.state.salmonRunStrength, max: 100, unit: 'idx' },
      { key: 'treaty', label: 'Treaty health', extract: (r) => r.ecosystem.state.treatyFisheryHealth || 0.5, max: 1 },
      { key: 'foodSov', label: 'Food sovereignty', extract: (r) => r.ecosystem.state.indigenousFoodSovereignty || 0.6, max: 1 },
      { key: 'ceremonial', label: 'Ceremonial access', extract: (r) => r.ecosystem.state.ceremonialAccess || 0.6, max: 1 },
    ],
  },
  county: {
    id: 'county',
    name: 'County Environmental Health',
    icon: '🏥',
    tagline: 'Clean water, healthy communities, fair outcomes',
    color: '#1A7A8A',
    colorLight: '#E8F4F8',
    analog: 'King County DNRP',
    budget: 3000,
    optimizes: ['Public health', 'Equity', 'Water quality'],
    briefing: 'King County\'s Department of Natural Resources and Parks manages 1.4 million residents\' wastewater, stormwater, and public health infrastructure. Your aging combined sewer system overflows 3 billion gallons/year into Puget Sound. Environmental justice communities near the Duwamish bear disproportionate pollution burden.',
    keyStats: [
      { label: 'Regional population', value: calTarget('population'), source: 'Census/BC Stats' },
      { label: 'Social equity index', value: calTarget('equity'), source: 'WA health disparities' },
      { label: 'Mean DO', value: calTarget('do_mean'), source: 'WA Ecology monitoring' },
    ],
    redLines: ['Environmental justice communities cannot bear additional pollution burden', 'Public health standards are non-negotiable'],
    leverage: 'Controls wastewater and stormwater infrastructure investment. Permitting authority over development.',
    params: {
      urban: ['wastewaterEfficiency', 'stormwaterInfraAge', 'greenInfraFraction', 'urbanDensity', 'energyCleanFraction', 'population'],
      ecosystem: ['slrAdaptation'],
    },
    kpis: [
      { key: 'health', label: 'Pop. health', extract: (r) => r.urban.state.populationHealth || 0.7, max: 1 },
      { key: 'equity', label: 'Equity', extract: (r) => r.urban.state.equityIndex !== undefined ? r.urban.state.equityIndex : 0.65, max: 1 },
      { key: 'waterQuality', label: 'Water quality', extract: (r) => r.marine.state.waterQualityIndex, max: 1 },
      { key: 'cso', label: 'CSO events', extract: (r) => r.urban.state.csoFrequency, max: 20, unit: '/mo', invert: true },
      { key: 'socialStability', label: 'Social stability', extract: (r) => r.urban.state.socialStability !== undefined ? r.urban.state.socialStability : 1, max: 1 },
      { key: 'displaced', label: 'Displaced', extract: (r) => r.urban.state.totalDisplaced || 0, max: 50000, unit: 'people', invert: true },
    ],
  },
  conservation: {
    id: 'conservation',
    name: 'Marine Conservation',
    icon: '🌿',
    tagline: 'Restore the ecosystem before it\'s too late',
    color: '#2D7A4F',
    colorLight: '#E6F0E4',
    analog: 'Puget Sound Partnership',
    budget: 800,
    optimizes: ['Biodiversity', 'Orca viability', 'Habitat health'],
    briefing: 'The Puget Sound Partnership coordinates recovery of the Salish Sea ecosystem \u2014 from orca to eelgrass. With only 74 Southern Resident killer whales left, every policy decision either helps or hurts their survival. Your mandate: restore the ecosystem that 6 million people and thousands of species depend on.',
    keyStats: [
      { label: 'SRKW population', value: calTarget('orca_population'), source: 'CWR census' },
      { label: 'Biodiversity index', value: calTarget('biodiversity'), source: 'Vital Signs' },
      { label: 'Eelgrass extent', value: calTarget('eelgrass_area'), source: 'WDNR monitoring' },
    ],
    redLines: ['Orca protection zones cannot be reduced', 'No net loss of critical habitat'],
    leverage: 'ESA listings give federal enforcement power. Public sympathy for orca creates political pressure.',
    params: {
      ecosystem: ['protectedAreaFraction', 'orcaProtectionLevel', 'baselineBiodiversity', 'compensatoryMortality', 'eelgrassRestoration', 'greenCrabRemoval'],
    },
    kpis: [
      { key: 'bio', label: 'Biodiversity', extract: (r) => r.ecosystem.state.biodiversityIndex, max: 1 },
      { key: 'orca', label: 'Orca viability', extract: (r) => r.ecosystem.state.orcaViability, max: 1 },
      { key: 'kelp', label: 'Kelp health', extract: (r) => r.ecosystem.state.kelpHealth, max: 1 },
      { key: 'eelgrass', label: 'Eelgrass', extract: (r) => r.ecosystem.state.eelgrassHealth || 0.5, max: 1 },
    ],
  },
  climate: {
    id: 'climate',
    name: 'Climate & Energy Board',
    icon: '⚡',
    tagline: 'Prepare for what\'s coming while reducing what we\'re causing',
    color: '#3B5068',
    colorLight: '#E8EDF2',
    analog: 'WA Dept of Ecology',
    budget: 2500,
    optimizes: ['Preparedness', 'Clean energy', 'Resilience'],
    briefing: 'Washington\'s Department of Ecology oversees the state\'s response to climate change under the Climate Commitment Act and Clean Energy Transformation Act (100% clean electricity by 2045). Your challenge: decarbonize while keeping the lights on as data centers multiply and heat waves intensify.',
    keyStats: [
      { label: 'Baseline SST', value: calTarget('sst_baseline'), source: 'NANOOS NVS' },
      { label: 'Snowpack', value: calTarget('snowpack'), source: 'SNOTEL' },
      { label: 'Hydro fraction', value: '~63%', source: 'WA EIA' },
    ],
    redLines: ['CETA 2045 deadline is law \u2014 clean energy targets are non-negotiable', 'Grid reliability cannot fall below 99.9%'],
    leverage: 'Controls climate/energy policy, carbon pricing, and grid modernization funding.',
    params: {
      marine: ['sspPathway', 'tidalEnergyExtraction', 'slrScenario', 'greenlandScenario', 'ensoAmplification'],
      urban: ['energyCleanFraction', 'crossBorderCoord', 'dataCenterGrowth', 'gridInvestment', 'smrPathway', 'fusionPathway'],
      watershed: ['forestCover'],
      ecosystem: ['fishPassageInvestment'],
    },
    kpis: [
      { key: 'prep', label: 'Preparedness', extract: (r) => 0.5, max: 1 },
      { key: 'cleanEnergy', label: 'Clean energy', extract: (r) => (r.energy && r.energy.state ? r.energy.state.cleanFraction : 0.85), max: 1 },
      { key: 'gridReliability', label: 'Grid reliability', extract: (r) => (r.energy && r.energy.state ? r.energy.state.gridReliability : 0.95), max: 1 },
      { key: 'snowpack', label: 'Snowpack', extract: (r) => r.watershed.state.snowpack || 180, max: 500, unit: 'mm' },
      { key: 'flood', label: 'Flood risk', extract: (r) => r.urban.state.coastalFloodRisk || 0, max: 1, invert: true },
      { key: 'fishHydro', label: 'Fish spill cost', extract: (r) => (r.energy && r.energy.state ? r.energy.state.fishSpillCostDollars : 0), max: 50, unit: '$M' },
    ],
  },
};

export const TENSIONS = [
  { id: 't1', label: 'Shipping noise vs orca recovery', roles: ['port', 'conservation'],
    check: (params) => (params.port.containerThroughput > 4000 && params.ecosystem.orcaProtectionLevel > 50),
    magnitude: (params) => Math.min(1, (params.port.containerThroughput - 3500) / 4500 + params.ecosystem.orcaProtectionLevel / 100) },
  { id: 't2', label: 'Fishing access vs marine protection', roles: ['tribal', 'conservation'],
    check: (params) => (params.ecosystem.fishingPressure > 30 && params.ecosystem.protectedAreaFraction > 25),
    magnitude: (params) => Math.min(1, params.ecosystem.fishingPressure / 80 + params.ecosystem.protectedAreaFraction / 50) * 0.7 },
  { id: 't3', label: 'Tidal energy vs water mixing', roles: ['climate', 'conservation'],
    check: (params) => (params.marine.tidalEnergyExtraction > 30),
    magnitude: (params) => Math.min(1, params.marine.tidalEnergyExtraction / 80) },
  { id: 't4', label: 'Dredging vs habitat restoration', roles: ['port', 'tribal'],
    check: (params) => (params.port.dredgingIntensity > 40 && params.ecosystem.eelgrassRestoration > 20),
    magnitude: (params) => Math.min(1, params.port.dredgingIntensity / 80 + params.ecosystem.eelgrassRestoration / 100) * 0.8 },
  { id: 't5', label: 'Cruise tourism vs water quality', roles: ['port', 'county'],
    check: (params) => (params.port.cruiseShipCalls > 120 && params.urban.wastewaterEfficiency < 80),
    magnitude: (params) => Math.min(1, params.port.cruiseShipCalls / 300) },
  { id: 't6', label: 'Hatchery production vs wild genetics', roles: ['tribal', 'conservation'],
    check: (params) => (params.ecosystem.hatcheryFraction > 40),
    magnitude: (params) => Math.min(1, params.ecosystem.hatcheryFraction / 80) * 0.6 },
  { id: 't7', label: 'Urban growth vs green space', roles: ['county', 'conservation'],
    check: (params) => (params.urban.urbanDensity > 55 && params.urban.greenInfraFraction < 15),
    magnitude: (params) => Math.min(1, params.urban.urbanDensity / 90) * 0.5 },
  { id: 't8', label: 'Hydro generation vs salmon passage', roles: ['climate', 'tribal'],
    check: (params) => (params.ecosystem.fishPassageInvestment > 40),
    magnitude: (params) => Math.min(1, params.ecosystem.fishPassageInvestment / 100) * 0.8 },
  { id: 't9', label: 'Data center demand vs grid capacity', roles: ['climate', 'county'],
    check: (params) => (params.urban.dataCenterGrowth > 15 && params.urban.gridInvestment < 40),
    magnitude: (params) => Math.min(1, params.urban.dataCenterGrowth / 30) * 0.7 },
  { id: 't10', label: 'SMR siting vs seismic risk', roles: ['climate', 'county'],
    check: (params) => (params.urban.smrPathway > 0),
    magnitude: (params) => params.urban.smrPathway > 0 ? 0.4 : 0 },
  { id: 't11', label: 'Rooftop solar vs utility revenue', roles: ['climate', 'county'],
    check: (params) => (params.urban.gridInvestment > 50),
    magnitude: (params) => Math.min(1, params.urban.gridInvestment / 100) * 0.5 },
  { id: 't12', label: 'Port revenue vs environmental levy', roles: ['port', 'conservation'],
    check: (params) => (params.port.environmentalLevyRate > 0),
    magnitude: (params) => Math.min(1, (params.port.environmentalLevyRate || 0) / 5) * 0.6 },
  { id: 't13', label: 'SLR adaptation vs displacement equity', roles: ['county', 'tribal'],
    check: (params) => (params.ecosystem.slrAdaptation === 1),
    magnitude: (params) => params.ecosystem.slrAdaptation === 1 ? 0.4 : 0.2 },
];

export const ALIGNMENTS = [
  { id: 'a1', label: 'Clean energy improves air quality + health', roles: ['climate', 'county'], impact: 'strong' },
  { id: 'a2', label: 'Eelgrass restoration helps crab, salmon, and treaty fisheries', roles: ['conservation', 'tribal'], impact: 'strong' },
  { id: 'a3', label: 'Fish passage benefits salmon AND lamprey', roles: ['tribal', 'conservation'], impact: 'strong' },
  { id: 'a4', label: 'MPA protects orca AND grows whale-watch tourism', roles: ['conservation', 'port'], impact: 'moderate' },
  { id: 'a5', label: 'Forest restoration improves water supply + flood protection', roles: ['climate', 'county'], impact: 'moderate' },
  { id: 'a6', label: 'Shore power reduces port emissions + improves equity', roles: ['port', 'county'], impact: 'moderate' },
  { id: 'a7', label: 'Green infrastructure reduces CSO + improves habitat', roles: ['county', 'conservation'], impact: 'moderate' },
  { id: 'a8', label: 'Cross-border coordination benefits all governance actors', roles: ['climate', 'tribal'], impact: 'moderate' },
  { id: 'a9', label: 'Fusion power eliminates salmon-hydro tradeoff', roles: ['climate', 'tribal'], impact: 'strong' },
  { id: 'a10', label: 'Microgrids improve energy equity in underserved areas', roles: ['climate', 'county'], impact: 'moderate' },
  { id: 'a11', label: 'Environmental levy funds eelgrass, fish passage, and water quality', roles: ['conservation', 'port'], impact: 'strong' },
];

// NOTE: sspPathway and baselineTemperature are intentionally excluded from
// COUPLING_HINTS — they represent exogenous global climate forcing, not regional
// policy levers that governance actors in the Scenario Lab can negotiate.
export const COUPLING_HINTS = {
  fishingPressure: {
    text: 'Fishing pressure \u2192 salmon stock decline \u2192 reduces orca prey base \u2192 demographic stress on J/K/L pods',
    affectedDomains: ['ecosystem'],
    direction: 'tradeoff',
  },
  baselineBiodiversity: {
    text: 'Biodiversity baseline shifts food web carrying capacities \u2192 cascading effects on ecosystem service valuation',
    affectedDomains: ['ecosystem'],
    direction: 'synergy',
  },
  damRemovalPolicy: {
    text: 'Dam removal restores sediment supply to beaches \u2192 improves fish passage \u2192 but reduces flow regulation and hydro capacity',
    affectedDomains: ['watershed', 'ecosystem', 'energy'],
    direction: 'tradeoff',
  },
  fishPassageInvestment: {
    text: 'Increases fish passage spill \u2192 reduces hydro generation \u2192 may raise electricity prices',
    affectedDomains: ['ecosystem', 'energy'],
    direction: 'tradeoff',
  },
  tidalEnergyExtraction: {
    text: 'Extracts tidal energy \u2192 reduces tidal mixing in San Juan \u2192 may lower deep water DO',
    affectedDomains: ['energy', 'marine'],
    direction: 'tradeoff',
  },
  containerThroughput: {
    text: 'More vessel traffic \u2192 increases underwater noise \u2192 stress on orca and porpoise',
    affectedDomains: ['port', 'ecosystem'],
    direction: 'tradeoff',
  },
  dataCenterGrowth: {
    text: 'Increases grid demand \u2192 may require more gas generation \u2192 raises emissions',
    affectedDomains: ['urban', 'energy'],
    direction: 'tradeoff',
  },
  energyCleanFraction: {
    text: 'Reduces gas generation \u2192 lowers CO\u2082 \u2192 slows ocean acidification',
    affectedDomains: ['energy', 'marine'],
    direction: 'synergy',
  },
  vesselSpeedZone: {
    text: 'Slower vessels \u2192 less noise + fewer whale strikes \u2192 but longer transit times',
    affectedDomains: ['port', 'ecosystem'],
    direction: 'tradeoff',
  },
  aquacultureIntensity: {
    text: 'More sea lice on wild smolts + nutrient loading \u2192 but jobs and revenue',
    affectedDomains: ['ecosystem', 'port'],
    direction: 'tradeoff',
  },
  slrAdaptation: {
    text: 'Hard armoring: best flood protection but destroys beach habitat and degrades over time. Living shorelines: restores habitat, moderate protection. Status quo: lowest protection capacity, highest long-term displacement risk for tribal and low-income communities',
    affectedDomains: ['ecosystem', 'urban'],
    direction: 'tradeoff',
  },
  protectedAreaFraction: {
    text: 'More MPAs \u2192 less fishing access \u2192 but orca habitat and reef recovery improve',
    affectedDomains: ['ecosystem', 'port'],
    direction: 'tradeoff',
  },
  orcaProtectionLevel: {
    text: 'Vessel exclusion zones \u2192 less whale-watch revenue \u2192 but reduced orca noise stress',
    affectedDomains: ['ecosystem', 'port'],
    direction: 'tradeoff',
  },
  hatcheryFraction: {
    text: 'More hatchery fish \u2192 boosts short-term returns \u2192 but reduces wild genetic fitness',
    affectedDomains: ['ecosystem'],
    direction: 'tradeoff',
  },
  wastewaterEfficiency: {
    text: 'Better treatment \u2192 less nutrient loading \u2192 healthier marine water quality',
    affectedDomains: ['urban', 'marine'],
    direction: 'synergy',
  },
  greenInfraFraction: {
    text: 'Green infrastructure \u2192 reduces CSO events \u2192 improves water quality and habitat',
    affectedDomains: ['urban', 'marine', 'ecosystem'],
    direction: 'synergy',
  },
  forestCover: {
    text: 'More forest \u2192 better water filtration \u2192 reduced erosion and flooding',
    affectedDomains: ['watershed', 'marine'],
    direction: 'synergy',
  },
  gridInvestment: {
    text: 'Grid modernization \u2192 enables more renewables + storage \u2192 improves resilience',
    affectedDomains: ['energy'],
    direction: 'synergy',
  },
  smrPathway: {
    text: 'Nuclear modules \u2192 carbon-free baseload \u2192 no river/salmon tradeoff \u2192 but siting concerns in seismic zone',
    affectedDomains: ['energy', 'ecosystem'],
    direction: 'tradeoff',
  },
  eelgrassRestoration: {
    text: 'Eelgrass restoration \u2192 herring spawning habitat \u2192 forage fish \u2192 salmon \u2192 orca',
    affectedDomains: ['ecosystem'],
    direction: 'synergy',
  },
  greenCrabRemoval: {
    text: 'Removes invasive green crabs \u2192 protects eelgrass and native shellfish',
    affectedDomains: ['ecosystem'],
    direction: 'synergy',
  },
  coManagementIndex: {
    text: 'Tribal co-management \u2192 better adaptive harvest \u2192 improved salmon and cultural access',
    affectedDomains: ['ecosystem'],
    direction: 'synergy',
  },
  slrScenario: {
    text: 'Higher SLR scenario \u2192 faster sea level rise \u2192 coastal flooding, displacement, saltwater intrusion, habitat loss. Thwaites collapse auto-triggers at 2.5\u00B0C warming',
    affectedDomains: ['marine', 'urban', 'ecosystem'],
    direction: 'tradeoff',
  },
  ensoAmplification: {
    text: 'Higher ENSO amplification \u2192 more extreme El Ni\u00F1o/La Ni\u00F1a cycles \u2192 greater year-to-year variability in SST, salmon, and marine heat waves',
    affectedDomains: ['marine', 'ecosystem'],
    direction: 'tradeoff',
  },
  environmentalLevyRate: {
    text: 'Port levy \u2192 funds eelgrass/passage/quieting/water quality \u2192 reduces port profit margin',
    affectedDomains: ['port', 'ecosystem', 'urban'],
    direction: 'tradeoff',
  },
};

export const HEALTH_INDEX_WEIGHTS = {
  ocean: 0.15,
  biodiversity: 0.20,
  orca: 0.15,
  equity: 0.15,
  economy: 0.10,
  health: 0.15,
  preparedness: 0.10,
};
