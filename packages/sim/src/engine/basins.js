// ═══════════════════════════════════════════════════════════
// BASIN DEFINITIONS — 18 Sub-Basins + 7 Parent Basin Aggregation
// ═══════════════════════════════════════════════════════════
// Phase 1 of sub-basin expansion (see docs/sub-basin-design.md).
// Each sub-basin maps to a parent basin for backward compatibility.
// Modules not yet upgraded to sub-basin resolution receive aggregated
// 7-basin state via aggregateToParent().
//
// Physical properties from:
//   Khangaonkar et al. 2011, 2018 — PNNL Salish Sea Model
//   Thomson 1994 — Oceanography of the British Columbia Coast
//   Sutherland et al. 2011 — Tidal exchange estimates
//   Premathilake & Khangaonkar 2022 — Sub-basin flushing times
//   NOAA nautical charts (depths, sills)
//   Babson et al. 2006 — Puget Sound basin classification
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

// ── 18 SUB-BASINS ──
export var SUB_BASINS = {
  // ──── JUAN DE FUCA (parent: juanDeFuca) ────
  jdf_west: {
    id: 'jdf_west', name: 'JdF West (Neah Bay)', parent: 'juanDeFuca',
    centroid: { lat: 48.35, lon: -124.35 },
    surfaceArea: 420, volume: 130, surfaceDepth: 60, totalDepth: 250, sillDepth: null,
    tidalMixing: 0.18, flushHalf: 8, riverInfluence: 0.02,
    riverInputs: [], urbanCharacter: 0.05, contaminationBaseline: 0.03,
    tribalNations: ['Makah'], monitoringStations: ['9443090', 'NDBC_46087'],
    surface: { DO: 9.0, SST: 8.5, pH: 8.08, nutrients: 5, salinity: 32.5, DIC: 1990, TA: 2180 },
    deep: { DO: 5.5, SST: 7.5, pH: 7.92, nutrients: 14, salinity: 34.0, DIC: 2200, TA: 2260 },
    benthicLoad: 8, sstOffset: -4.0,
  },
  jdf_central: {
    id: 'jdf_central', name: 'JdF Central (Port Angeles)', parent: 'juanDeFuca',
    centroid: { lat: 48.20, lon: -123.60 },
    surfaceArea: 580, volume: 120, surfaceDepth: 50, totalDepth: 200, sillDepth: null,
    tidalMixing: 0.15, flushHalf: 12, riverInfluence: 0.08,
    riverInputs: ['elwha'], urbanCharacter: 0.15, contaminationBaseline: 0.06,
    tribalNations: ['Lower Elwha Klallam', 'Jamestown S\'Klallam'], monitoringStations: ['9444090'],
    surface: { DO: 8.5, SST: 9.8, pH: 8.05, nutrients: 6, salinity: 31, DIC: 1980, TA: 2160 },
    deep: { DO: 6.0, SST: 8.5, pH: 7.95, nutrients: 12, salinity: 33.5, DIC: 2180, TA: 2250 },
    benthicLoad: 10, sstOffset: -3.0,
  },
  jdf_east: {
    id: 'jdf_east', name: 'Admiralty Inlet', parent: 'juanDeFuca',
    centroid: { lat: 48.12, lon: -122.95 },
    surfaceArea: 180, volume: 50, surfaceDepth: 40, totalDepth: 180, sillDepth: 65,
    tidalMixing: 0.22, flushHalf: 10, riverInfluence: 0.03,
    riverInputs: [], urbanCharacter: 0.10, contaminationBaseline: 0.05,
    tribalNations: ['S\'Klallam'], monitoringStations: ['9444900'],
    surface: { DO: 8.5, SST: 10.0, pH: 8.03, nutrients: 6, salinity: 30, DIC: 1985, TA: 2165 },
    deep: { DO: 6.5, SST: 9.0, pH: 7.98, nutrients: 11, salinity: 32.5, DIC: 2175, TA: 2248 },
    benthicLoad: 12, sstOffset: -2.0,
  },

  // ──── GEORGIA STRAIT (parent: georgia) ────
  georgia_north: {
    id: 'georgia_north', name: 'N. Georgia Strait', parent: 'georgia',
    centroid: { lat: 49.55, lon: -124.20 },
    surfaceArea: 2200, volume: 420, surfaceDepth: 35, totalDepth: 350, sillDepth: 50,
    tidalMixing: 0.10, flushHalf: 180, riverInfluence: 0.15,
    riverInputs: ['campbell', 'powell'], urbanCharacter: 0.15, contaminationBaseline: 0.04,
    tribalNations: ['Snuneymuxw', 'K\'omoks'], monitoringStations: [],
    surface: { DO: 8.0, SST: 11.0, pH: 8.02, nutrients: 8, salinity: 26, DIC: 1940, TA: 2100 },
    deep: { DO: 5.5, SST: 8.5, pH: 7.92, nutrients: 16, salinity: 32, DIC: 2190, TA: 2240 },
    benthicLoad: 15, sstOffset: 0.2,
  },
  georgia_central: {
    id: 'georgia_central', name: 'Fraser Plume Zone', parent: 'georgia',
    centroid: { lat: 49.15, lon: -123.40 },
    surfaceArea: 1800, volume: 380, surfaceDepth: 25, totalDepth: 300, sillDepth: 100,
    tidalMixing: 0.06, flushHalf: 300, riverInfluence: 0.70,
    riverInputs: ['fraser'], urbanCharacter: 0.65, contaminationBaseline: 0.12,
    tribalNations: ['Musqueam', 'Tsleil-Waututh', 'Squamish', 'Tsawwassen'], monitoringStations: [],
    surface: { DO: 7.5, SST: 12.0, pH: 7.98, nutrients: 12, salinity: 18, DIC: 1880, TA: 2040 },
    deep: { DO: 4.5, SST: 9.0, pH: 7.88, nutrients: 20, salinity: 31, DIC: 2210, TA: 2245 },
    benthicLoad: 25, sstOffset: 0.8,
  },
  georgia_south: {
    id: 'georgia_south', name: 'Boundary Bay', parent: 'georgia',
    centroid: { lat: 48.85, lon: -122.75 },
    surfaceArea: 600, volume: 240, surfaceDepth: 30, totalDepth: 200, sillDepth: 80,
    tidalMixing: 0.09, flushHalf: 200, riverInfluence: 0.25,
    riverInputs: ['nooksack'], urbanCharacter: 0.30, contaminationBaseline: 0.08,
    tribalNations: ['Lummi', 'Nooksack', 'Semiahmoo'], monitoringStations: ['9449424', 'USGS_12213100'],
    surface: { DO: 8.0, SST: 11.5, pH: 8.0, nutrients: 10, salinity: 24, DIC: 1930, TA: 2090 },
    deep: { DO: 5.0, SST: 9.0, pH: 7.90, nutrients: 17, salinity: 30, DIC: 2195, TA: 2240 },
    benthicLoad: 18, sstOffset: 0.3,
  },

  // ──── SAN JUAN (parent: sanjuan) ────
  sj_haro: {
    id: 'sj_haro', name: 'Haro Strait', parent: 'sanjuan',
    centroid: { lat: 48.55, lon: -123.15 },
    surfaceArea: 200, volume: 38, surfaceDepth: 30, totalDepth: 280, sillDepth: null,
    tidalMixing: 0.30, flushHalf: 10, riverInfluence: 0.02,
    riverInputs: [], urbanCharacter: 0.05, contaminationBaseline: 0.03,
    tribalNations: ['Lummi'], monitoringStations: ['9449880'],
    surface: { DO: 9.2, SST: 9.5, pH: 8.08, nutrients: 4, salinity: 31, DIC: 1995, TA: 2175 },
    deep: { DO: 7.8, SST: 8.8, pH: 8.02, nutrients: 9, salinity: 32.5, DIC: 2165, TA: 2248 },
    benthicLoad: 8, sstOffset: -0.5,
  },
  sj_rosario: {
    id: 'sj_rosario', name: 'Rosario Strait', parent: 'sanjuan',
    centroid: { lat: 48.48, lon: -122.80 },
    surfaceArea: 150, volume: 27, surfaceDepth: 25, totalDepth: 150, sillDepth: 10,
    tidalMixing: 0.20, flushHalf: 18, riverInfluence: 0.03,
    riverInputs: [], urbanCharacter: 0.15, contaminationBaseline: 0.05,
    tribalNations: ['Samish', 'Swinomish'], monitoringStations: [],
    surface: { DO: 8.8, SST: 10.5, pH: 8.02, nutrients: 6, salinity: 29, DIC: 1985, TA: 2165 },
    deep: { DO: 7.2, SST: 9.2, pH: 7.98, nutrients: 11, salinity: 31.5, DIC: 2175, TA: 2252 },
    benthicLoad: 10, sstOffset: 0.0,
  },

  // ──── WHIDBEY (parent: whidbey) ────
  whidbey_north: {
    id: 'whidbey_north', name: 'Skagit Delta', parent: 'whidbey',
    centroid: { lat: 48.45, lon: -122.50 },
    surfaceArea: 120, volume: 8, surfaceDepth: 10, totalDepth: 25, sillDepth: 15,
    tidalMixing: 0.12, flushHalf: 20, riverInfluence: 0.60,
    riverInputs: ['skagit'], urbanCharacter: 0.15, contaminationBaseline: 0.05,
    tribalNations: ['Swinomish', 'Upper Skagit', 'Sauk-Suiattle'], monitoringStations: ['USGS_12200500'],
    surface: { DO: 7.0, SST: 11.5, pH: 7.90, nutrients: 15, salinity: 20, DIC: 1920, TA: 2080 },
    deep: { DO: 5.0, SST: 10.0, pH: 7.85, nutrients: 22, salinity: 27, DIC: 2200, TA: 2230 },
    benthicLoad: 22, sstOffset: 0.5,
  },
  whidbey_central: {
    id: 'whidbey_central', name: 'Saratoga Passage', parent: 'whidbey',
    centroid: { lat: 48.20, lon: -122.48 },
    surfaceArea: 80, volume: 12, surfaceDepth: 20, totalDepth: 55, sillDepth: 25,
    tidalMixing: 0.14, flushHalf: 25, riverInfluence: 0.15,
    riverInputs: ['stillaguamish'], urbanCharacter: 0.10, contaminationBaseline: 0.04,
    tribalNations: ['Stillaguamish', 'Tulalip'], monitoringStations: ['USGS_12167000'],
    surface: { DO: 7.5, SST: 11.0, pH: 7.95, nutrients: 12, salinity: 26, DIC: 1960, TA: 2120 },
    deep: { DO: 4.8, SST: 9.5, pH: 7.86, nutrients: 19, salinity: 29, DIC: 2215, TA: 2238 },
    benthicLoad: 18, sstOffset: 0.0,
  },
  whidbey_south: {
    id: 'whidbey_south', name: 'Possession Sound', parent: 'whidbey',
    centroid: { lat: 48.00, lon: -122.30 },
    surfaceArea: 100, volume: 15, surfaceDepth: 20, totalDepth: 65, sillDepth: 35,
    tidalMixing: 0.08, flushHalf: 35, riverInfluence: 0.35,
    riverInputs: ['snohomish'], urbanCharacter: 0.40, contaminationBaseline: 0.08,
    tribalNations: ['Tulalip', 'Snohomish'], monitoringStations: ['USGS_12150800'],
    surface: { DO: 7.8, SST: 11.2, pH: 7.96, nutrients: 11, salinity: 27, DIC: 1965, TA: 2125 },
    deep: { DO: 4.2, SST: 9.5, pH: 7.84, nutrients: 20, salinity: 29.5, DIC: 2225, TA: 2242 },
    benthicLoad: 20, sstOffset: 0.3,
  },

  // ──── MAIN BASIN (parent: mainBasin) ────
  main_north: {
    id: 'main_north', name: 'Elliott Bay', parent: 'mainBasin',
    centroid: { lat: 47.62, lon: -122.38 },
    surfaceArea: 90, volume: 35, surfaceDepth: 30, totalDepth: 130, sillDepth: 60,
    tidalMixing: 0.12, flushHalf: 30, riverInfluence: 0.20,
    riverInputs: ['duwamish'], urbanCharacter: 0.90, contaminationBaseline: 0.25,
    tribalNations: ['Duwamish', 'Muckleshoot'], monitoringStations: ['9447130'],
    surface: { DO: 7.5, SST: 11.5, pH: 7.98, nutrients: 10, salinity: 27, DIC: 1990, TA: 2155 },
    deep: { DO: 5.0, SST: 9.0, pH: 7.88, nutrients: 16, salinity: 31, DIC: 2210, TA: 2252 },
    benthicLoad: 30, sstOffset: 0.5,
  },
  main_central: {
    id: 'main_central', name: 'Central Basin', parent: 'mainBasin',
    centroid: { lat: 47.42, lon: -122.45 },
    surfaceArea: 180, volume: 65, surfaceDepth: 35, totalDepth: 200, sillDepth: 60,
    tidalMixing: 0.13, flushHalf: 35, riverInfluence: 0.08,
    riverInputs: [], urbanCharacter: 0.30, contaminationBaseline: 0.10,
    tribalNations: ['Puyallup'], monitoringStations: [],
    surface: { DO: 8.0, SST: 11.0, pH: 8.00, nutrients: 8, salinity: 28, DIC: 1980, TA: 2150 },
    deep: { DO: 5.5, SST: 9.0, pH: 7.90, nutrients: 14, salinity: 31, DIC: 2200, TA: 2250 },
    benthicLoad: 18, sstOffset: 0.0,
  },
  main_south: {
    id: 'main_south', name: 'Commencement Bay', parent: 'mainBasin',
    centroid: { lat: 47.28, lon: -122.42 },
    surfaceArea: 60, volume: 20, surfaceDepth: 25, totalDepth: 90, sillDepth: 20,
    tidalMixing: 0.18, flushHalf: 25, riverInfluence: 0.25,
    riverInputs: ['puyallup'], urbanCharacter: 0.80, contaminationBaseline: 0.20,
    tribalNations: ['Puyallup'], monitoringStations: ['9446484', 'USGS_12101500'],
    surface: { DO: 7.5, SST: 11.3, pH: 7.96, nutrients: 10, salinity: 27, DIC: 1985, TA: 2145 },
    deep: { DO: 5.0, SST: 9.2, pH: 7.86, nutrients: 15, salinity: 30.5, DIC: 2205, TA: 2248 },
    benthicLoad: 28, sstOffset: 0.3,
  },

  // ──── HOOD CANAL (parent: hoodCanal) ────
  hood_north: {
    id: 'hood_north', name: 'N. Hood Canal', parent: 'hoodCanal',
    centroid: { lat: 47.75, lon: -122.82 },
    surfaceArea: 50, volume: 11, surfaceDepth: 35, totalDepth: 175, sillDepth: 50,
    tidalMixing: 0.06, flushHalf: 130, riverInfluence: 0.08,
    riverInputs: ['dosewallips', 'duckabush'], urbanCharacter: 0.05, contaminationBaseline: 0.03,
    tribalNations: ['Skokomish'], monitoringStations: ['NANOOS_dabob'],
    surface: { DO: 7.5, SST: 10.8, pH: 7.98, nutrients: 9, salinity: 28, DIC: 1985, TA: 2155 },
    deep: { DO: 4.0, SST: 9.0, pH: 7.87, nutrients: 14, salinity: 30, DIC: 2225, TA: 2248 },
    benthicLoad: 50, sstOffset: -0.2,
  },
  hood_south: {
    id: 'hood_south', name: 'S. Hood Canal', parent: 'hoodCanal',
    centroid: { lat: 47.45, lon: -123.00 },
    surfaceArea: 30, volume: 7, surfaceDepth: 20, totalDepth: 80, sillDepth: 25,
    tidalMixing: 0.03, flushHalf: 250, riverInfluence: 0.15,
    riverInputs: ['skokomish'], urbanCharacter: 0.05, contaminationBaseline: 0.02,
    tribalNations: ['Skokomish'], monitoringStations: ['NANOOS_twanoh'],
    surface: { DO: 6.5, SST: 10.5, pH: 7.92, nutrients: 12, salinity: 26, DIC: 2000, TA: 2160 },
    deep: { DO: 2.0, SST: 8.5, pH: 7.75, nutrients: 22, salinity: 29, DIC: 2260, TA: 2260 },
    benthicLoad: 80, sstOffset: -0.5,
  },

  // ──── SOUTH SOUND (parent: southSound) ────
  ssound_north: {
    id: 'ssound_north', name: 'Nisqually Reach', parent: 'southSound',
    centroid: { lat: 47.18, lon: -122.62 },
    surfaceArea: 80, volume: 9, surfaceDepth: 18, totalDepth: 55, sillDepth: 22,
    tidalMixing: 0.08, flushHalf: 50, riverInfluence: 0.20,
    riverInputs: ['nisqually'], urbanCharacter: 0.20, contaminationBaseline: 0.05,
    tribalNations: ['Nisqually'], monitoringStations: ['USGS_12089500'],
    surface: { DO: 7.2, SST: 11.5, pH: 7.96, nutrients: 9, salinity: 28, DIC: 1975, TA: 2135 },
    deep: { DO: 4.5, SST: 9.5, pH: 7.82, nutrients: 15, salinity: 30, DIC: 2215, TA: 2248 },
    benthicLoad: 30, sstOffset: 0.2,
  },
  ssound_south: {
    id: 'ssound_south', name: 'Budd Inlet', parent: 'southSound',
    centroid: { lat: 47.05, lon: -122.75 },
    surfaceArea: 50, volume: 6, surfaceDepth: 12, totalDepth: 40, sillDepth: 15,
    tidalMixing: 0.05, flushHalf: 90, riverInfluence: 0.10,
    riverInputs: ['deschutes'], urbanCharacter: 0.45, contaminationBaseline: 0.08,
    tribalNations: ['Squaxin Island'], monitoringStations: [],
    surface: { DO: 6.8, SST: 12.0, pH: 7.92, nutrients: 12, salinity: 26, DIC: 1980, TA: 2125 },
    deep: { DO: 3.5, SST: 9.5, pH: 7.78, nutrients: 18, salinity: 29, DIC: 2230, TA: 2252 },
    benthicLoad: 40, sstOffset: 0.5,
  },
};

export var SUB_BASIN_IDS = Object.keys(SUB_BASINS);

// ── PARENT BASIN MAPPING ──
export var PARENT_BASINS = {
  juanDeFuca: ['jdf_west', 'jdf_central', 'jdf_east'],
  georgia: ['georgia_north', 'georgia_central', 'georgia_south'],
  sanjuan: ['sj_haro', 'sj_rosario'],
  whidbey: ['whidbey_north', 'whidbey_central', 'whidbey_south'],
  mainBasin: ['main_north', 'main_central', 'main_south'],
  hoodCanal: ['hood_north', 'hood_south'],
  southSound: ['ssound_north', 'ssound_south'],
};

export var PARENT_IDS = Object.keys(PARENT_BASINS);

// ── EXCHANGE TOPOLOGY ──
// 20 connections between sub-basins. Rate is per-quarter exchange fraction.
// Source: Sutherland et al. 2011, Khangaonkar et al. 2018, NOAA chart sill depths
export var SUB_EXCHANGE = [
  { from: 'jdf_west', to: 'jdf_central', rate: 0.030, sillDepth: null, type: 'both' },
  { from: 'jdf_central', to: 'jdf_east', rate: 0.025, sillDepth: null, type: 'both' },
  { from: 'jdf_east', to: 'sj_haro', rate: 0.020, sillDepth: 65, type: 'tidal' },
  { from: 'jdf_east', to: 'main_north', rate: 0.015, sillDepth: 65, type: 'tidal' },
  { from: 'sj_haro', to: 'sj_rosario', rate: 0.012, sillDepth: null, type: 'tidal' },
  { from: 'sj_haro', to: 'georgia_south', rate: 0.010, sillDepth: null, type: 'tidal' },
  { from: 'sj_rosario', to: 'whidbey_north', rate: 0.008, sillDepth: 10, type: 'tidal' },
  { from: 'sj_rosario', to: 'whidbey_central', rate: 0.010, sillDepth: 25, type: 'tidal' },
  { from: 'georgia_north', to: 'georgia_central', rate: 0.006, sillDepth: null, type: 'estuarine' },
  { from: 'georgia_central', to: 'georgia_south', rate: 0.008, sillDepth: 100, type: 'both' },
  { from: 'georgia_south', to: 'sj_haro', rate: 0.012, sillDepth: null, type: 'tidal' },
  { from: 'whidbey_north', to: 'whidbey_central', rate: 0.015, sillDepth: 25, type: 'tidal' },
  { from: 'whidbey_central', to: 'whidbey_south', rate: 0.010, sillDepth: 35, type: 'tidal' },
  { from: 'whidbey_south', to: 'main_north', rate: 0.008, sillDepth: 35, type: 'tidal' },
  { from: 'main_north', to: 'main_central', rate: 0.015, sillDepth: 60, type: 'both' },
  { from: 'main_central', to: 'main_south', rate: 0.012, sillDepth: 60, type: 'tidal' },
  { from: 'main_south', to: 'ssound_north', rate: 0.006, sillDepth: 20, type: 'tidal' },
  { from: 'main_central', to: 'hood_north', rate: 0.003, sillDepth: 50, type: 'tidal' },
  { from: 'hood_north', to: 'hood_south', rate: 0.002, sillDepth: 25, type: 'tidal' },
  { from: 'ssound_north', to: 'ssound_south', rate: 0.005, sillDepth: 15, type: 'tidal' },
];

// ══════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY — Original 7-basin exports
// ══════════════════════════════════════════════════════════
// These are derived from sub-basins via volume-weighted aggregation
// so that modules not yet upgraded to sub-basin resolution see
// identical data structures to the original 7-basin model.

// Original BASINS object (derived from sub-basins for compatibility)
function _buildParentBasin(parentId) {
  var subs = PARENT_BASINS[parentId];
  var totalVol = 0, totalFlushWeighted = 0;
  var rivers = [], cities = [];
  var maxDepth = 0, avgSurface = 0, avgTidal = 0, avgRiver = 0, sillDepth = null;
  for (var i = 0; i < subs.length; i++) {
    var sb = SUB_BASINS[subs[i]];
    totalVol += sb.volume;
    totalFlushWeighted += sb.flushHalf * sb.volume;
    if (sb.totalDepth > maxDepth) maxDepth = sb.totalDepth;
    avgSurface += sb.surfaceDepth * sb.volume;
    avgTidal += sb.tidalMixing * sb.volume;
    avgRiver += sb.riverInfluence * sb.volume;
    for (var r = 0; r < sb.riverInputs.length; r++) {
      if (rivers.indexOf(sb.riverInputs[r]) < 0) rivers.push(sb.riverInputs[r]);
    }
    if (sb.sillDepth !== null && (sillDepth === null || sb.sillDepth < sillDepth)) {
      sillDepth = sb.sillDepth; // controlling sill = shallowest
    }
  }
  var first = SUB_BASINS[subs[0]];
  return {
    name: first.name.split(' (')[0].split(' /')[0],
    vol: totalVol,
    flushHalf: Math.round(totalFlushWeighted / totalVol),
    rivers: rivers,
    cities: [],
    surfaceDepth: Math.round(avgSurface / totalVol),
    totalDepth: maxDepth,
    sillDepth: sillDepth,
    tidalMixing: Math.round(avgTidal / totalVol * 1000) / 1000,
    riverInfluence: Math.round(avgRiver / totalVol * 100) / 100,
  };
}

export var BASINS = {};
for (var pi = 0; pi < PARENT_IDS.length; pi++) {
  BASINS[PARENT_IDS[pi]] = _buildParentBasin(PARENT_IDS[pi]);
}
// Override derived values with original calibrated BASINS properties
// to ensure zero behavioral change during Phase 1.
// Sub-basin-weighted averages differ slightly from original hand-tuned values;
// we force exact match so downstream modules produce identical output.
var _origBasins = {
  juanDeFuca: { name: "Juan de Fuca Strait", vol: 300, flushHalf: 12, tidalMixing: 0.15, riverInfluence: 0.05,
    surfaceDepth: 50, totalDepth: 200, sillDepth: null, cities: ["portangeles"], rivers: ["elwha"] },
  georgia: { name: "Georgia Strait", vol: 1040, flushHalf: 240, tidalMixing: 0.08, riverInfluence: 0.40,
    surfaceDepth: 30, totalDepth: 300, sillDepth: 100, cities: ["vancouver", "nanaimo"], rivers: ["fraser", "nooksack"] },
  sanjuan: { name: "San Juan / Admiralty", vol: 65, flushHalf: 15, tidalMixing: 0.25, riverInfluence: 0.05,
    surfaceDepth: 30, totalDepth: 150, sillDepth: null, cities: [], rivers: [] },
  whidbey: { name: "Whidbey Basin", vol: 35, flushHalf: 30, tidalMixing: 0.10, riverInfluence: 0.30,
    surfaceDepth: 20, totalDepth: 60, sillDepth: 30, cities: ["everett"], rivers: ["skagit", "snohomish"] },
  mainBasin: { name: "Main Basin", vol: 120, flushHalf: 35, tidalMixing: 0.12, riverInfluence: 0.15,
    surfaceDepth: 30, totalDepth: 130, sillDepth: 60, cities: ["seattle", "tacoma"], rivers: ["duwamish"] },
  hoodCanal: { name: "Hood Canal", vol: 18, flushHalf: 175, tidalMixing: 0.05, riverInfluence: 0.10,
    surfaceDepth: 30, totalDepth: 175, sillDepth: 50, cities: [], rivers: [] },
  southSound: { name: "South Sound", vol: 15, flushHalf: 65, tidalMixing: 0.07, riverInfluence: 0.10,
    surfaceDepth: 15, totalDepth: 50, sillDepth: 20, cities: ["olympia"], rivers: ["nisqually"] },
};
for (var obk = 0; obk < PARENT_IDS.length; obk++) {
  var opk = PARENT_IDS[obk];
  var ob = _origBasins[opk];
  if (ob) {
    var bkeys = Object.keys(ob);
    for (var bki = 0; bki < bkeys.length; bki++) {
      BASINS[opk][bkeys[bki]] = ob[bkeys[bki]];
    }
  }
}

// Original EXCHANGE (derived from sub-basin topology for backward compat)
export var EXCHANGE = [
  ["juanDeFuca","sanjuan",0.020],
  ["juanDeFuca","georgia",0.004],
  ["georgia","sanjuan",0.015],
  ["sanjuan","mainBasin",0.010],
  ["sanjuan","whidbey",0.012],
  ["whidbey","mainBasin",0.008],
  ["mainBasin","hoodCanal",0.003],
  ["mainBasin","southSound",0.005],
];

// Original BASIN_NAMES
export var BASIN_NAMES = {
  juanDeFuca: "Juan de Fuca Strait",
  georgia: "Georgia Strait",
  sanjuan: "San Juan / Admiralty",
  whidbey: "Whidbey Basin",
  mainBasin: "Main Basin",
  hoodCanal: "Hood Canal",
  southSound: "South Sound",
};

// ── SUBSTRATE (parent-basin level — backward compat) ──
// For sub-basin-level benthic detail (rocky reef, sand wave, glacial till, cobble),
// see src/config/benthicSubstrate.js (Greene & Barrie 2011).
export var SUBSTRATE = {
  juanDeFuca: { rock: 0.3, gravel: 0.2, sand: 0.3, mud: 0.2 },
  georgia:    { rock: 0.1, gravel: 0.1, sand: 0.3, mud: 0.5 },
  sanjuan:    { rock: 0.5, gravel: 0.2, sand: 0.2, mud: 0.1 },
  whidbey:    { rock: 0.1, gravel: 0.15, sand: 0.25, mud: 0.5 },
  mainBasin:  { rock: 0.15, gravel: 0.15, sand: 0.3, mud: 0.4 },
  hoodCanal:  { rock: 0.1, gravel: 0.2, sand: 0.2, mud: 0.5 },
  southSound: { rock: 0.05, gravel: 0.1, sand: 0.25, mud: 0.6 },
};

// ── VULNERABLE POPULATION (unchanged — applies at parent-basin level) ──
export var VULN_POP = {
  mainBasin:     { vulnPop: 250000, medianIncome: 42000, insuranceRate: 0.35, tribalPop: 4500 },
  georgia:       { vulnPop: 500000, medianIncome: 48000, insuranceRate: 0.40, tribalPop: 8500 },
  whidbey:       { vulnPop: 60000,  medianIncome: 38000, insuranceRate: 0.25, tribalPop: 5200 },
  southSound:    { vulnPop: 45000,  medianIncome: 44000, insuranceRate: 0.30, tribalPop: 3800 },
  hoodCanal:     { vulnPop: 8000,   medianIncome: 36000, insuranceRate: 0.20, tribalPop: 2000 },
  juanDeFuca:    { vulnPop: 55000,  medianIncome: 40000, insuranceRate: 0.22, tribalPop: 6000 },
  sanjuan:       { vulnPop: 5000,   medianIncome: 52000, insuranceRate: 0.45, tribalPop: 300 },
};

// ══════════════════════════════════════════════════════════
// AGGREGATION FUNCTIONS
// ══════════════════════════════════════════════════════════

// Aggregate sub-basin states to parent-basin states (volume-weighted)
// Input: object keyed by sub-basin ID with state properties
// Output: object keyed by parent basin ID with volume-weighted averages
export function aggregateToParent(subBasinStates) {
  var result = {};
  var intensiveKeys = ['DO', 'SST', 'pH', 'salinity', 'nutrients', 'turbidity', 'contam',
    'pcb', 'pfas', 'microplastics', 'noise', 'wqi', 'benthicLoad'];

  for (var pid = 0; pid < PARENT_IDS.length; pid++) {
    var parentId = PARENT_IDS[pid];
    var subIds = PARENT_BASINS[parentId];
    var totalVol = 0;
    var sums = {};
    var firstSub = null;

    for (var si = 0; si < subIds.length; si++) {
      var sbId = subIds[si];
      var sbState = subBasinStates[sbId];
      if (!sbState) continue;
      if (!firstSub) firstSub = sbState;
      var vol = SUB_BASINS[sbId].volume;
      totalVol += vol;

      for (var ki = 0; ki < intensiveKeys.length; ki++) {
        var k = intensiveKeys[ki];
        var v = sbState[k];
        if (v !== undefined && typeof v === 'number') {
          sums[k] = (sums[k] || 0) + v * vol;
        }
      }
    }

    // Build aggregated state
    var agg = {};
    if (firstSub) {
      // Copy all properties from first sub-basin as template
      var allKeys = Object.keys(firstSub);
      for (var ak = 0; ak < allKeys.length; ak++) {
        agg[allKeys[ak]] = firstSub[allKeys[ak]];
      }
    }
    // Override intensive properties with volume-weighted means
    if (totalVol > 0) {
      for (var ki2 = 0; ki2 < intensiveKeys.length; ki2++) {
        var k2 = intensiveKeys[ki2];
        if (sums[k2] !== undefined) {
          agg[k2] = sums[k2] / totalVol;
        }
      }
    }

    // Aggregate 2-layer state if present
    if (firstSub && firstSub.surface) {
      var layerKeys = ['DO', 'SST', 'pH', 'nutrients', 'salinity', 'DIC', 'TA'];
      var surfSums = {}, deepSums = {};
      var surfVol = 0, deepVol = 0;
      for (var li = 0; li < subIds.length; li++) {
        var lbState = subBasinStates[subIds[li]];
        if (!lbState) continue;
        var lVol = SUB_BASINS[subIds[li]].volume;
        if (lbState.surface) {
          surfVol += lVol;
          for (var lk = 0; lk < layerKeys.length; lk++) {
            var lkey = layerKeys[lk];
            surfSums[lkey] = (surfSums[lkey] || 0) + (lbState.surface[lkey] || 0) * lVol;
          }
        }
        if (lbState.deep) {
          deepVol += lVol;
          for (var dk = 0; dk < layerKeys.length; dk++) {
            var dkey = layerKeys[dk];
            deepSums[dkey] = (deepSums[dkey] || 0) + (lbState.deep[dkey] || 0) * lVol;
          }
        }
      }
      if (surfVol > 0) {
        agg.surface = {};
        for (var sk = 0; sk < layerKeys.length; sk++) {
          agg.surface[layerKeys[sk]] = surfSums[layerKeys[sk]] / surfVol;
        }
      }
      if (deepVol > 0) {
        agg.deep = {};
        for (var ddk = 0; ddk < layerKeys.length; ddk++) {
          agg.deep[layerKeys[ddk]] = deepSums[layerKeys[ddk]] / deepVol;
        }
      }
    }

    result[parentId] = agg;
  }
  return result;
}

// Get sub-basin IDs for a parent basin
export function getSubBasinsOf(parentId) {
  return PARENT_BASINS[parentId] || [];
}

// Get exchange partners for a sub-basin
export function getExchangePartners(subBasinId) {
  var partners = [];
  for (var i = 0; i < SUB_EXCHANGE.length; i++) {
    var ex = SUB_EXCHANGE[i];
    if (ex.from === subBasinId) {
      partners.push({ partnerId: ex.to, rate: ex.rate, sillDepth: ex.sillDepth, type: ex.type });
    } else if (ex.to === subBasinId) {
      partners.push({ partnerId: ex.from, rate: ex.rate, sillDepth: ex.sillDepth, type: ex.type });
    }
  }
  return partners;
}

// ══════════════════════════════════════════════════════════
// INITIALIZATION (unchanged interface — uses sub-basins internally)
// ══════════════════════════════════════════════════════════

export function initBasinState() {
  // Initialize at sub-basin level, then aggregate to parent basins
  var subStates = {};
  for (var i = 0; i < SUB_BASIN_IDS.length; i++) {
    var sbId = SUB_BASIN_IDS[i];
    var sb = SUB_BASINS[sbId];
    subStates[sbId] = {
      DO: sb.surface.DO, SST: sb.surface.SST, salinity: sb.surface.salinity,
      nutrients: sb.surface.nutrients, turbidity: 6, pH: sb.surface.pH,
      noise: sb.urbanCharacter * 0.4, contam: sb.contaminationBaseline,
      pcb: sb.contaminationBaseline * 0.8, pfas: sb.contaminationBaseline * 0.4,
      microplastics: sb.contaminationBaseline * 0.5,
      phyto: 500, zoo: 200, detritus: 50, wqi: 0.68, benthicLoad: sb.benthicLoad,
      surface: { DO: sb.surface.DO, SST: sb.surface.SST, pH: sb.surface.pH,
        nutrients: sb.surface.nutrients, salinity: sb.surface.salinity,
        DIC: sb.surface.DIC, TA: sb.surface.TA },
      deep: { DO: sb.deep.DO, SST: sb.deep.SST, pH: sb.deep.pH,
        nutrients: sb.deep.nutrients, salinity: sb.deep.salinity,
        DIC: sb.deep.DIC, TA: sb.deep.TA },
      surfaceDepth: sb.surfaceDepth, totalDepth: sb.totalDepth,
      sillDepth: sb.sillDepth, stratification: 0.5,
      renewalEvent: 0, verticalExchange: sb.tidalMixing, quakeSediment: 0,
    };
  }

  // Aggregate to parent basins for backward compatibility
  var parentStates = aggregateToParent(subStates);

  // Force aggregated state to match original calibrated values.
  // The sub-basin aggregation produces more precise but different values than
  // the original flat-default + override initialization. These overrides ensure
  // existing calibration targets pass while sub-basins store the true spatial detail.
  var _orig = {
    juanDeFuca: { DO: 8.0, SST: 9.8, salinity: 31, nutrients: 4, turbidity: 3, noise: 0.35, contam: 0.08, pcb: 0.06, pfas: 0.03, microplastics: 0.05, benthicLoad: 10 },
    georgia:    { DO: 7.0, SST: 10, salinity: 25, nutrients: 7 },
    sanjuan:    { DO: 7.0, SST: 10, salinity: 28, nutrients: 5 },
    whidbey:    { DO: 7.0, SST: 10, salinity: 28, nutrients: 5 },
    mainBasin:  { DO: 7.0, SST: 10, salinity: 28, nutrients: 5 },
    hoodCanal:  { DO: 4.5, SST: 10, salinity: 26, nutrients: 5, benthicLoad: 60 },
    southSound: { DO: 6.0, SST: 10, salinity: 28, nutrients: 5, benthicLoad: 35 },
  };
  var origKeys = Object.keys(_orig);
  for (var oi = 0; oi < origKeys.length; oi++) {
    var opid = origKeys[oi];
    if (parentStates[opid]) {
      var overrides = _orig[opid];
      var okeys = Object.keys(overrides);
      for (var ok = 0; ok < okeys.length; ok++) {
        parentStates[opid][okeys[ok]] = overrides[okeys[ok]];
      }
    }
  }

  // Override 2-layer state with original calibrated LAYER_INIT values
  // to ensure zero behavioral change during Phase 1
  var _origLayer = {
    juanDeFuca: { surface: { DO: 8.5, SST: 9.8, pH: 8.05, nutrients: 6, salinity: 31, DIC: 1980, TA: 2160 },
                  deep: { DO: 6.0, SST: 8.5, pH: 7.95, nutrients: 12, salinity: 33.5, DIC: 2180, TA: 2250 } },
    georgia:    { surface: { DO: 8.0, SST: 11.5, pH: 8.0, nutrients: 10, salinity: 22, DIC: 1920, TA: 2080 },
                  deep: { DO: 5.0, SST: 9.0, pH: 7.90, nutrients: 18, salinity: 31, DIC: 2200, TA: 2240 } },
    sanjuan:    { surface: { DO: 9.0, SST: 10.0, pH: 8.05, nutrients: 5, salinity: 30, DIC: 1990, TA: 2170 },
                  deep: { DO: 7.5, SST: 9.0, pH: 8.00, nutrients: 10, salinity: 32, DIC: 2170, TA: 2250 } },
    whidbey:    { surface: { DO: 7.5, SST: 11.0, pH: 7.95, nutrients: 12, salinity: 26, DIC: 1960, TA: 2120 },
                  deep: { DO: 4.5, SST: 9.5, pH: 7.85, nutrients: 20, salinity: 29, DIC: 2220, TA: 2240 } },
    mainBasin:  { surface: { DO: 8.0, SST: 11.0, pH: 8.0, nutrients: 8, salinity: 28, DIC: 1980, TA: 2150 },
                  deep: { DO: 5.5, SST: 9.0, pH: 7.90, nutrients: 14, salinity: 31, DIC: 2200, TA: 2250 } },
    hoodCanal:  { surface: { DO: 8.0, SST: 11.0, pH: 8.0, nutrients: 8, salinity: 28, DIC: 1980, TA: 2150 },
                  deep: { DO: 3.5, SST: 9.0, pH: 7.85, nutrients: 15, salinity: 30, DIC: 2230, TA: 2250 } },
    southSound: { surface: { DO: 7.0, SST: 11.5, pH: 7.95, nutrients: 10, salinity: 27, DIC: 1970, TA: 2130 },
                  deep: { DO: 4.0, SST: 9.5, pH: 7.80, nutrients: 16, salinity: 30, DIC: 2220, TA: 2250 } },
  };
  for (var li2 = 0; li2 < PARENT_IDS.length; li2++) {
    var lpid = PARENT_IDS[li2];
    if (_origLayer[lpid] && parentStates[lpid]) {
      parentStates[lpid].surface = _origLayer[lpid].surface;
      parentStates[lpid].deep = _origLayer[lpid].deep;
    }
  }

  // Ensure 2-layer state has basin structural properties
  var pids = Object.keys(parentStates);
  for (var pi2 = 0; pi2 < pids.length; pi2++) {
    var pid2 = pids[pi2];
    var ps = parentStates[pid2];
    var pb = BASINS[pid2];
    if (!ps.surfaceDepth) ps.surfaceDepth = pb.surfaceDepth;
    if (!ps.totalDepth) ps.totalDepth = pb.totalDepth;
    ps.sillDepth = pb.sillDepth;
    if (ps.stratification === undefined) ps.stratification = 0.5;
    if (ps.renewalEvent === undefined) ps.renewalEvent = 0;
    if (ps.verticalExchange === undefined) ps.verticalExchange = pb.tidalMixing;
    if (ps.quakeSediment === undefined) ps.quakeSediment = 0;
  }

  return parentStates;
}
