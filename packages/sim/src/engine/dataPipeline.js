// ═══════════════════════════════════════════════════════════
// NANOOS NVS Data Sources and Pipeline Utilities
// ═══════════════════════════════════════════════════════════
// Data definition file for real-time observational data connections.
// ES5 convention (engine file). export statements required for module loading.

export var DATA_SOURCES = [
  {
    id: 'nanoos_sst',
    name: 'NANOOS SST',
    url: 'https://nvs.nanoos.org/',
    description: 'Sea surface temperature from NANOOS Visualization System buoys',
    unit: '\u00B0C',
    modelKey: 'marine.state.sst',
    frequency: 'hourly',
    stations: [
      { id: 'CHABA', name: 'Ch\u00E1 B\u01CEi (Westport)', lat: 46.86, lon: -124.97, basin: null },
      { id: 'DABOB', name: 'Dabob Bay', lat: 47.80, lon: -122.80, basin: 'hoodCanal' },
      { id: 'TWANOH', name: 'Twanoh', lat: 47.38, lon: -123.01, basin: 'hoodCanal' },
      { id: 'NPBW', name: 'NW Enhanced Moored Observatory', lat: 47.76, lon: -122.38, basin: 'mainBasin' },
    ]
  },
  {
    id: 'nanoos_do',
    name: 'NANOOS Dissolved Oxygen',
    url: 'https://nvs.nanoos.org/',
    description: 'Dissolved oxygen from NANOOS buoys and profilers',
    unit: 'mg/L',
    modelKey: 'marine.state.dissolvedOxygen',
    frequency: 'hourly',
    stations: [
      { id: 'DABOB', name: 'Dabob Bay', lat: 47.80, lon: -122.80, basin: 'hoodCanal' },
      { id: 'TWANOH', name: 'Twanoh', lat: 47.38, lon: -123.01, basin: 'hoodCanal' },
    ]
  },
  {
    id: 'cwr_orca',
    name: 'Center for Whale Research Census',
    url: 'https://www.whaleresearch.com/',
    description: 'Annual SRKW population census by pod',
    unit: 'individuals',
    modelKey: 'ecosystem.state.orcaPopulation',
    frequency: 'annual',
  },
  {
    id: 'wdfw_salmon',
    name: 'WDFW Salmon Run Estimates',
    url: 'https://wdfw.wa.gov/fishing/management/salmon',
    description: 'Annual salmon run size estimates by species and river',
    unit: 'fish',
    modelKey: 'ecosystem.state.salmonRunStrength',
    frequency: 'annual',
  },
  {
    id: 'wdnr_kelp',
    name: 'WDNR Kelp Monitoring',
    url: 'https://www.dnr.wa.gov/programs-and-services/aquatics/kelp',
    description: 'Annual floating kelp canopy area surveys',
    unit: 'fraction of historical',
    modelKey: 'ecosystem.state.kelpHealth',
    frequency: 'annual',
  },
  {
    id: 'wdnr_eelgrass',
    name: 'WDNR Eelgrass Monitoring',
    url: 'https://www.dnr.wa.gov/programs-and-services/aquatics/aquatic-vegetation',
    description: 'Annual eelgrass extent surveys',
    unit: 'fraction of historical',
    modelKey: 'ecosystem.state.eelgrassHealth',
    frequency: 'annual',
  },
  {
    id: 'noaa_ph',
    name: 'NOAA Ocean Acidification Monitoring',
    url: 'https://www.pmel.noaa.gov/co2/',
    description: 'pH and pCO2 observations from buoys and cruises',
    unit: 'pH',
    modelKey: 'marine.state.pH',
    frequency: 'hourly',
  },
  {
    id: 'ooi_ce01',
    name: 'OOI CE01 Inshore Surface Mooring',
    url: 'https://erddap.dataexplorer.oceanobservatories.org/',
    description: 'Oregon shelf inshore — SST, salinity, DO. Pacific boundary forcing.',
    unit: 'multi',
    modelKey: 'pacific.sourceTemp',
    frequency: 'hourly',
    stations: [
      { id: 'CE01ISSM', name: 'Oregon Inshore (25m)', lat: 44.66, lon: -124.10, basin: 'juanDeFuca' },
    ],
  },
  {
    id: 'ooi_ce04',
    name: 'OOI CE04 Offshore Surface Mooring',
    url: 'https://erddap.dataexplorer.oceanobservatories.org/',
    description: 'Outer Oregon shelf — California Current, pH, MHW detection.',
    unit: 'multi',
    modelKey: 'pacific.sourceTemp',
    frequency: 'hourly',
    stations: [
      { id: 'CE04OSSM', name: 'Oregon Offshore (588m)', lat: 44.37, lon: -124.95, basin: 'juanDeFuca' },
    ],
  },
  {
    id: 'ooi_rs01',
    name: 'OOI RS01 Slope Base Profiler',
    url: 'https://erddap.dataexplorer.oceanobservatories.org/',
    description: 'Deep Pacific source water (2900m) — O₂, DIC, T. Feeds JdF upwelling.',
    unit: 'multi',
    modelKey: 'pacific.sourceO2',
    frequency: 'hourly',
    stations: [
      { id: 'RS01SBPS', name: 'Slope Base (2900m)', lat: 44.53, lon: -125.39, basin: 'juanDeFuca' },
    ],
  },
  {
    id: 'onc_venus',
    name: 'ONC VENUS (Saanich Inlet)',
    url: 'https://data.oceannetworks.ca/',
    description: 'Saanich Inlet deep observatory — anoxic reference, T, S, O₂.',
    unit: 'multi',
    modelKey: 'marine.state.dissolvedOxygen',
    frequency: 'hourly',
    stations: [
      { id: 'VENUS_DDL', name: 'Saanich Inlet (DDL)', lat: 48.65, lon: -123.50, basin: 'georgia' },
    ],
  },
];

export function createObservation(sourceId, value, timestamp, stationId, basin) {
  stationId = stationId !== undefined ? stationId : null;
  basin = basin !== undefined ? basin : null;
  return {
    sourceId: sourceId,
    value: Number(value),
    timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
    stationId: stationId,
    basin: basin,
  };
}

export function nudgeValue(modelValue, observedValue, alpha) {
  alpha = alpha !== undefined ? alpha : 0.1;
  if (observedValue == null || isNaN(observedValue)) return modelValue;
  return modelValue * (1 - alpha) + observedValue * alpha;
}
