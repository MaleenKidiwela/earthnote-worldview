// ═══════════════════════════════════════════════════════════
// SHORELINE REGISTRY — Georeferenced ecological, tribal,
// economic, and infrastructure assets along Salish Sea margins
// ═══════════════════════════════════════════════════════════
// The connective layer between land and water. Every module
// touches the shoreline — this registry maps what's there.
//
// Sources:
//   WA DNR Submerged Vegetation Monitoring Program
//   PSNERP (Puget Sound Nearshore Ecosystem Restoration Project)
//   Schlenger et al. 2011 — Puget Sound Shorelines
//   Penttila 2007 — Marine forage fishes in Puget Sound
//   Dethier et al. 2016 — Shoreline armoring effects
//   WDFW Herring Stock Status Reports
//   DFO Pacific Herring Assessment
//   EPA Superfund National Priorities List
//   WA Ecology CLARC database
//   WDNR Creosote Removal Priority List
//   CWR SRKW Critical Habitat designation
//   BC Conservation Data Centre
//   Berry et al. 2021 — Kelp monitoring
//   WDOH Shellfish Safety Program
//   County assessor / BC Assessment Authority data
//   King County CSO Control Plan
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

// ── FULL ASSET REGISTRY ──
export const SHORE_ASSETS = [

  // ═══════════════════════════════════════
  // ECOLOGICAL — EELGRASS BEDS
  // ═══════════════════════════════════════
  { id: 'eco_eelgrass_padilla', name: 'Padilla Bay Eelgrass Reserve', category: 'ecological', type: 'eelgrass',
    subBasin: 'whidbey_north', latlon: { lat: 48.51, lon: -122.48 },
    elevation_m: -1.5, exposure: 'protected', substrate: 'mud', armoredFraction: 0.05,
    slrVulnerability: 0.4, tsunamiVulnerability: 0.3, contaminationExposure: 0.15, developmentPressure: 0.1,
    ecologicalValue: 'critical', area_ha: 3200, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'reserve', condition: 'good', tribalNations: ['swinomish'],
    notes: 'Largest eelgrass bed in WA (~3,200 ha). National Estuarine Research Reserve.' },
  { id: 'eco_eelgrass_samish', name: 'Samish Bay Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'whidbey_north', latlon: { lat: 48.56, lon: -122.42 },
    elevation_m: -2.0, exposure: 'semi-protected', substrate: 'mud', armoredFraction: 0.08,
    slrVulnerability: 0.3, tsunamiVulnerability: 0.25, contaminationExposure: 0.1, developmentPressure: 0.2,
    ecologicalValue: 'high', area_ha: 400, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['swinomish'] },
  { id: 'eco_eelgrass_portsusan', name: 'Port Susan / Skagit Delta Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'whidbey_north', latlon: { lat: 48.23, lon: -122.38 },
    elevation_m: -1.0, exposure: 'protected', substrate: 'mud', armoredFraction: 0.12,
    slrVulnerability: 0.5, tsunamiVulnerability: 0.2, contaminationExposure: 0.2, developmentPressure: 0.3,
    ecologicalValue: 'high', area_ha: 500, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['stillaguamish', 'tulalip'] },
  { id: 'eco_eelgrass_possession', name: 'Possession Sound Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'whidbey_south', latlon: { lat: 48.00, lon: -122.22 },
    elevation_m: -2.0, exposure: 'semi-protected', substrate: 'sand', armoredFraction: 0.25,
    slrVulnerability: 0.4, tsunamiVulnerability: 0.3, contaminationExposure: 0.3, developmentPressure: 0.5,
    ecologicalValue: 'moderate', area_ha: 200, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'unprotected', condition: 'degraded', tribalNations: ['tulalip'] },
  { id: 'eco_eelgrass_portmadison', name: 'Port Madison Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'main_central', latlon: { lat: 47.70, lon: -122.52 },
    elevation_m: -1.5, exposure: 'protected', substrate: 'sand', armoredFraction: 0.15,
    slrVulnerability: 0.3, tsunamiVulnerability: 0.2, contaminationExposure: 0.15, developmentPressure: 0.3,
    ecologicalValue: 'moderate', area_ha: 150, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: [] },
  { id: 'eco_eelgrass_libertybay', name: 'Liberty Bay Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'hood_north', latlon: { lat: 47.73, lon: -122.70 },
    elevation_m: -1.5, exposure: 'protected', substrate: 'mud', armoredFraction: 0.2,
    slrVulnerability: 0.4, tsunamiVulnerability: 0.15, contaminationExposure: 0.2, developmentPressure: 0.3,
    ecologicalValue: 'moderate', area_ha: 100, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [] },
  { id: 'eco_eelgrass_hoodcanal', name: 'Hood Canal Eelgrass (scattered)', category: 'ecological', type: 'eelgrass',
    subBasin: 'hood_south', latlon: { lat: 47.45, lon: -123.05 },
    elevation_m: -2.0, exposure: 'semi-protected', substrate: 'mud', armoredFraction: 0.08,
    slrVulnerability: 0.5, tsunamiVulnerability: 0.1, contaminationExposure: 0.1, developmentPressure: 0.15,
    ecologicalValue: 'high', area_ha: 300, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'unprotected', condition: 'degraded', tribalNations: ['skokomish'],
    notes: 'Stressed by chronic hypoxia. Deep DO < 2 mg/L kills epifauna.' },
  { id: 'eco_eelgrass_nisqually', name: 'Nisqually Delta Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'ssound_north', latlon: { lat: 47.08, lon: -122.70 },
    elevation_m: -1.0, exposure: 'protected', substrate: 'mud', armoredFraction: 0.02,
    slrVulnerability: 0.5, tsunamiVulnerability: 0.2, contaminationExposure: 0.05, developmentPressure: 0.05,
    ecologicalValue: 'high', area_ha: 200, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'reserve', condition: 'good', tribalNations: ['nisqually'],
    restorationActive: true },
  { id: 'eco_eelgrass_boundarybay', name: 'Boundary Bay Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'georgia_south', latlon: { lat: 49.03, lon: -122.88 },
    elevation_m: -1.5, exposure: 'semi-protected', substrate: 'mud', armoredFraction: 0.1,
    slrVulnerability: 0.5, tsunamiVulnerability: 0.4, contaminationExposure: 0.15, developmentPressure: 0.3,
    ecologicalValue: 'critical', area_ha: 1000, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['tsawwassen'] },
  { id: 'eco_eelgrass_robertsbank', name: 'Roberts Bank Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'georgia_central', latlon: { lat: 49.02, lon: -123.18 },
    elevation_m: -1.5, exposure: 'exposed', substrate: 'mud', armoredFraction: 0.3,
    slrVulnerability: 0.7, tsunamiVulnerability: 0.8, contaminationExposure: 0.3, developmentPressure: 0.8,
    ecologicalValue: 'critical', area_ha: 500, modules: ['nearshore', 'ecosystem', 'port'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['musqueam', 'tsawwassen'],
    portTerminals: ['van_deltaport'],
    notes: 'Adjacent to Deltaport. T2 expansion threatens this bed. Musqueam/Tsawwassen fishing grounds.' },
  { id: 'eco_eelgrass_sidney', name: 'Sidney / Gulf Islands Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'sj_rosario', latlon: { lat: 48.65, lon: -123.35 },
    elevation_m: -2.0, exposure: 'semi-protected', substrate: 'sand', armoredFraction: 0.1,
    slrVulnerability: 0.3, tsunamiVulnerability: 0.3, contaminationExposure: 0.05, developmentPressure: 0.2,
    ecologicalValue: 'high', area_ha: 300, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: [] },
  { id: 'eco_eelgrass_jdfwest', name: 'Neah Bay / Makah Eelgrass', category: 'ecological', type: 'eelgrass',
    subBasin: 'jdf_west', latlon: { lat: 48.37, lon: -124.62 },
    elevation_m: -3.0, exposure: 'exposed', substrate: 'rock', armoredFraction: 0.0,
    slrVulnerability: 0.2, tsunamiVulnerability: 0.6, contaminationExposure: 0.02, developmentPressure: 0.02,
    ecologicalValue: 'high', area_ha: 80, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'pristine', tribalNations: ['makah'] },

  // ═══════════════════════════════════════
  // ECOLOGICAL — SALT MARSHES
  // ═══════════════════════════════════════
  { id: 'eco_marsh_nisqually', name: 'Nisqually Delta Restored Marsh', category: 'ecological', type: 'marsh',
    subBasin: 'ssound_north', latlon: { lat: 47.07, lon: -122.72 },
    elevation_m: 1.8, exposure: 'protected', substrate: 'mud', armoredFraction: 0.0,
    slrVulnerability: 0.6, tsunamiVulnerability: 0.3, contaminationExposure: 0.05, developmentPressure: 0.02,
    ecologicalValue: 'critical', area_ha: 360, modules: ['nearshore', 'ecosystem', 'tribal'],
    protectionStatus: 'reserve', condition: 'good', restorationActive: true, tribalNations: ['nisqually'],
    notes: 'Largest tidal marsh restoration in PNW (360 ha). Billy Frank Jr. legacy.' },
  { id: 'eco_marsh_skagit', name: 'Skagit Delta Marshes', category: 'ecological', type: 'marsh',
    subBasin: 'whidbey_north', latlon: { lat: 48.35, lon: -122.35 },
    elevation_m: 1.5, exposure: 'semi-protected', substrate: 'mud', armoredFraction: 0.15,
    slrVulnerability: 0.7, tsunamiVulnerability: 0.25, contaminationExposure: 0.1, developmentPressure: 0.3,
    ecologicalValue: 'critical', area_ha: 800, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['swinomish'] },
  { id: 'eco_marsh_padilla', name: 'Padilla Bay Marshes', category: 'ecological', type: 'marsh',
    subBasin: 'whidbey_north', latlon: { lat: 48.49, lon: -122.47 },
    elevation_m: 1.5, exposure: 'protected', substrate: 'mud', armoredFraction: 0.05,
    slrVulnerability: 0.5, tsunamiVulnerability: 0.2, contaminationExposure: 0.1, developmentPressure: 0.1,
    ecologicalValue: 'high', area_ha: 200, modules: ['nearshore'],
    protectionStatus: 'reserve', condition: 'good', tribalNations: ['swinomish'] },
  { id: 'eco_marsh_snohomish', name: 'Snohomish Delta Marshes', category: 'ecological', type: 'marsh',
    subBasin: 'whidbey_south', latlon: { lat: 47.97, lon: -122.20 },
    elevation_m: 1.5, exposure: 'semi-protected', substrate: 'mud', armoredFraction: 0.3,
    slrVulnerability: 0.6, tsunamiVulnerability: 0.25, contaminationExposure: 0.2, developmentPressure: 0.5,
    ecologicalValue: 'high', area_ha: 150, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['tulalip'] },
  { id: 'eco_marsh_duwamish', name: 'Duwamish Estuary Remnant Marsh', category: 'ecological', type: 'marsh',
    subBasin: 'main_north', latlon: { lat: 47.55, lon: -122.34 },
    elevation_m: 1.2, exposure: 'protected', substrate: 'fill', armoredFraction: 0.85,
    slrVulnerability: 0.8, tsunamiVulnerability: 0.3, contaminationExposure: 0.9, developmentPressure: 0.9,
    ecologicalValue: 'moderate', area_ha: 5, modules: ['nearshore', 'ecosystem', 'tribal'],
    protectionStatus: 'superfund', condition: 'severely_degraded', tribalNations: ['muckleshoot'],
    contaminationSources: ['superfund_duwamish'],
    notes: '99% of original Duwamish estuary marsh lost. 5 ha remnant in Superfund site.' },
  { id: 'eco_marsh_puyallup', name: 'Puyallup Delta Remnant Marsh', category: 'ecological', type: 'marsh',
    subBasin: 'main_south', latlon: { lat: 47.26, lon: -122.41 },
    elevation_m: 1.5, exposure: 'protected', substrate: 'fill', armoredFraction: 0.8,
    slrVulnerability: 0.7, tsunamiVulnerability: 0.3, contaminationExposure: 0.7, developmentPressure: 0.8,
    ecologicalValue: 'moderate', area_ha: 10, modules: ['nearshore', 'ecosystem', 'tribal'],
    protectionStatus: 'superfund', condition: 'severely_degraded', tribalNations: ['puyallup'] },
  { id: 'eco_marsh_fraser', name: 'Fraser Delta Marshes', category: 'ecological', type: 'marsh',
    subBasin: 'georgia_central', latlon: { lat: 49.10, lon: -123.15 },
    elevation_m: 1.5, exposure: 'semi-protected', substrate: 'alluvium', armoredFraction: 0.3,
    slrVulnerability: 0.8, tsunamiVulnerability: 0.7, contaminationExposure: 0.3, developmentPressure: 0.6,
    ecologicalValue: 'critical', area_ha: 2000, modules: ['nearshore', 'ecosystem', 'tribal'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['musqueam', 'tsawwassen'],
    notes: 'Part of Fraser Delta. Burns Bog and Boundary Bay marshes. Roberts Bank WMA.' },
  { id: 'eco_marsh_boundarybay', name: 'Boundary Bay Marshes', category: 'ecological', type: 'marsh',
    subBasin: 'georgia_south', latlon: { lat: 49.04, lon: -122.92 },
    elevation_m: 1.5, exposure: 'semi-protected', substrate: 'mud', armoredFraction: 0.1,
    slrVulnerability: 0.6, tsunamiVulnerability: 0.4, contaminationExposure: 0.1, developmentPressure: 0.3,
    ecologicalValue: 'high', area_ha: 500, modules: ['nearshore'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['tsawwassen'] },

  // ═══════════════════════════════════════
  // ECOLOGICAL — KELP FORESTS
  // ═══════════════════════════════════════
  { id: 'eco_kelp_sanjuan', name: 'San Juan Islands Bull Kelp', category: 'ecological', type: 'kelp',
    subBasin: 'sj_haro', latlon: { lat: 48.52, lon: -123.10 },
    elevation_m: -3.0, exposure: 'exposed', substrate: 'rock', armoredFraction: 0.0,
    slrVulnerability: 0.1, tsunamiVulnerability: 0.4, contaminationExposure: 0.05, developmentPressure: 0.05,
    ecologicalValue: 'critical', area_ha: 300, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['lummi'],
    notes: 'Most extensive kelp canopy in WA. Critical habitat for rockfish, lingcod.' },
  { id: 'eco_kelp_rosario', name: 'Rosario Strait Kelp', category: 'ecological', type: 'kelp',
    subBasin: 'sj_rosario', latlon: { lat: 48.48, lon: -122.82 },
    elevation_m: -4.0, exposure: 'exposed', substrate: 'rock', armoredFraction: 0.0,
    slrVulnerability: 0.1, tsunamiVulnerability: 0.3, contaminationExposure: 0.05, developmentPressure: 0.05,
    ecologicalValue: 'high', area_ha: 200, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: [] },
  { id: 'eco_kelp_jdf', name: 'Strait of Juan de Fuca Kelp', category: 'ecological', type: 'kelp',
    subBasin: 'jdf_west', latlon: { lat: 48.38, lon: -124.20 },
    elevation_m: -5.0, exposure: 'exposed', substrate: 'rock', armoredFraction: 0.0,
    slrVulnerability: 0.05, tsunamiVulnerability: 0.5, contaminationExposure: 0.02, developmentPressure: 0.02,
    ecologicalValue: 'high', area_ha: 300, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['makah'] },
  { id: 'eco_kelp_gulfislands', name: 'Gulf Islands Kelp', category: 'ecological', type: 'kelp',
    subBasin: 'georgia_south', latlon: { lat: 48.80, lon: -123.20 },
    elevation_m: -4.0, exposure: 'semi-protected', substrate: 'rock', armoredFraction: 0.0,
    slrVulnerability: 0.1, tsunamiVulnerability: 0.35, contaminationExposure: 0.05, developmentPressure: 0.1,
    ecologicalValue: 'high', area_ha: 400, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'good', tribalNations: [] },
  { id: 'eco_kelp_whidbey', name: 'Whidbey Island Kelp', category: 'ecological', type: 'kelp',
    subBasin: 'whidbey_central', latlon: { lat: 48.20, lon: -122.70 },
    elevation_m: -3.0, exposure: 'semi-protected', substrate: 'rock', armoredFraction: 0.0,
    slrVulnerability: 0.1, tsunamiVulnerability: 0.2, contaminationExposure: 0.1, developmentPressure: 0.15,
    ecologicalValue: 'moderate', area_ha: 100, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'unprotected', condition: 'degraded', tribalNations: [] },

  // ═══════════════════════════════════════
  // ECOLOGICAL — HERRING SPAWNING
  // ═══════════════════════════════════════
  { id: 'eco_herring_cherrypoint', name: 'Cherry Point Herring Spawning', category: 'ecological', type: 'herring_spawning',
    subBasin: 'georgia_south', latlon: { lat: 48.86, lon: -122.76 },
    elevation_m: 0.0, exposure: 'semi-protected', substrate: 'gravel', armoredFraction: 0.2,
    slrVulnerability: 0.5, tsunamiVulnerability: 0.4, contaminationExposure: 0.4, developmentPressure: 0.6,
    ecologicalValue: 'critical', modules: ['nearshore', 'ecosystem', 'fisheries', 'tribal'],
    protectionStatus: 'managed', condition: 'severely_degraded', tribalNations: ['lummi'],
    portTerminals: ['cherry_bp', 'cherry_p66'],
    notes: 'THE most important herring spawning ground in the Salish Sea. Stock declined 90%+ from historical. Lummi treaty fishing. Refinery adjacency.' },
  { id: 'eco_herring_fidalgo', name: 'Fidalgo Bay Herring Spawning', category: 'ecological', type: 'herring_spawning',
    subBasin: 'whidbey_north', latlon: { lat: 48.47, lon: -122.58 },
    elevation_m: 0.0, exposure: 'protected', substrate: 'gravel', armoredFraction: 0.15,
    slrVulnerability: 0.4, tsunamiVulnerability: 0.2, contaminationExposure: 0.3, developmentPressure: 0.4,
    ecologicalValue: 'high', modules: ['nearshore', 'ecosystem', 'fisheries'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['swinomish'] },
  { id: 'eco_herring_quilcene', name: 'Quilcene Bay Herring', category: 'ecological', type: 'herring_spawning',
    subBasin: 'hood_north', latlon: { lat: 47.82, lon: -122.88 },
    elevation_m: 0.0, exposure: 'protected', substrate: 'gravel', armoredFraction: 0.08,
    slrVulnerability: 0.3, tsunamiVulnerability: 0.1, contaminationExposure: 0.1, developmentPressure: 0.2,
    ecologicalValue: 'high', modules: ['nearshore', 'ecosystem', 'fisheries'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['sklallam'] },
  { id: 'eco_herring_holmes', name: 'Holmes Harbor Herring', category: 'ecological', type: 'herring_spawning',
    subBasin: 'whidbey_central', latlon: { lat: 48.10, lon: -122.55 },
    elevation_m: 0.0, exposure: 'protected', substrate: 'gravel', armoredFraction: 0.2,
    slrVulnerability: 0.3, tsunamiVulnerability: 0.15, contaminationExposure: 0.1, developmentPressure: 0.3,
    ecologicalValue: 'moderate', modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'unprotected', condition: 'degraded', tribalNations: [] },
  { id: 'eco_herring_semiahmoo', name: 'Semiahmoo Bay Herring', category: 'ecological', type: 'herring_spawning',
    subBasin: 'georgia_south', latlon: { lat: 48.99, lon: -122.78 },
    elevation_m: 0.0, exposure: 'semi-protected', substrate: 'gravel', armoredFraction: 0.15,
    slrVulnerability: 0.4, tsunamiVulnerability: 0.35, contaminationExposure: 0.1, developmentPressure: 0.3,
    ecologicalValue: 'high', modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: [] },

  // ═══════════════════════════════════════
  // ECOLOGICAL — SALMON ESTUARIES
  // ═══════════════════════════════════════
  { id: 'eco_estuary_skagit', name: 'Skagit Delta Estuary', category: 'ecological', type: 'salmon_estuary',
    subBasin: 'whidbey_north', latlon: { lat: 48.35, lon: -122.34 },
    elevation_m: 1.0, exposure: 'semi-protected', substrate: 'mud', armoredFraction: 0.15,
    slrVulnerability: 0.7, tsunamiVulnerability: 0.25, contaminationExposure: 0.15, developmentPressure: 0.3,
    ecologicalValue: 'critical', modules: ['nearshore', 'ecosystem', 'fisheries', 'tribal'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['swinomish'],
    notes: 'Largest river delta in Puget Sound. Chinook, pink, chum. ESA-listed Chinook.' },
  { id: 'eco_estuary_duwamish', name: 'Duwamish/Green River Estuary', category: 'ecological', type: 'salmon_estuary',
    subBasin: 'main_north', latlon: { lat: 47.55, lon: -122.34 },
    elevation_m: 0.5, exposure: 'protected', substrate: 'fill', armoredFraction: 0.90,
    slrVulnerability: 0.8, tsunamiVulnerability: 0.3, contaminationExposure: 0.95, developmentPressure: 0.95,
    ecologicalValue: 'critical', modules: ['nearshore', 'ecosystem', 'fisheries', 'tribal', 'publicHealth'],
    protectionStatus: 'superfund', condition: 'severely_degraded', tribalNations: ['muckleshoot'],
    contaminationSources: ['superfund_duwamish'],
    notes: 'Heavily channelized, Superfund. ESA-listed Chinook. Muckleshoot treaty fishing.' },
  { id: 'eco_estuary_puyallup', name: 'Puyallup River Estuary', category: 'ecological', type: 'salmon_estuary',
    subBasin: 'main_south', latlon: { lat: 47.26, lon: -122.40 },
    elevation_m: 0.5, exposure: 'protected', substrate: 'fill', armoredFraction: 0.85,
    slrVulnerability: 0.7, tsunamiVulnerability: 0.3, contaminationExposure: 0.7, developmentPressure: 0.8,
    ecologicalValue: 'critical', modules: ['nearshore', 'ecosystem', 'fisheries', 'tribal'],
    protectionStatus: 'superfund', condition: 'severely_degraded', tribalNations: ['puyallup'] },
  { id: 'eco_estuary_nisqually', name: 'Nisqually River Estuary', category: 'ecological', type: 'salmon_estuary',
    subBasin: 'ssound_north', latlon: { lat: 47.08, lon: -122.71 },
    elevation_m: 1.0, exposure: 'protected', substrate: 'mud', armoredFraction: 0.02,
    slrVulnerability: 0.5, tsunamiVulnerability: 0.2, contaminationExposure: 0.05, developmentPressure: 0.02,
    ecologicalValue: 'critical', modules: ['nearshore', 'ecosystem', 'fisheries', 'tribal'],
    protectionStatus: 'reserve', condition: 'good', restorationActive: true, tribalNations: ['nisqually'],
    notes: 'THE restoration success story. Billy Frank Jr. NWR.' },
  { id: 'eco_estuary_elwha', name: 'Elwha River Estuary', category: 'ecological', type: 'salmon_estuary',
    subBasin: 'jdf_central', latlon: { lat: 48.15, lon: -123.56 },
    elevation_m: 1.0, exposure: 'exposed', substrate: 'gravel', armoredFraction: 0.0,
    slrVulnerability: 0.3, tsunamiVulnerability: 0.5, contaminationExposure: 0.02, developmentPressure: 0.02,
    ecologicalValue: 'critical', modules: ['nearshore', 'ecosystem', 'fisheries', 'tribal'],
    protectionStatus: 'reserve', condition: 'good', restorationActive: true, tribalNations: ['sklallam'],
    notes: 'Dam removed 2012 — largest dam removal in US history. Delta rebuilding naturally.' },
  { id: 'eco_estuary_nooksack', name: 'Nooksack River Estuary', category: 'ecological', type: 'salmon_estuary',
    subBasin: 'georgia_south', latlon: { lat: 48.79, lon: -122.58 },
    elevation_m: 1.0, exposure: 'semi-protected', substrate: 'mud', armoredFraction: 0.2,
    slrVulnerability: 0.6, tsunamiVulnerability: 0.35, contaminationExposure: 0.3, developmentPressure: 0.4,
    ecologicalValue: 'high', modules: ['nearshore', 'ecosystem', 'fisheries', 'tribal'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['lummi'] },
  { id: 'eco_estuary_fraser', name: 'Fraser River Estuary', category: 'ecological', type: 'salmon_estuary',
    subBasin: 'georgia_central', latlon: { lat: 49.12, lon: -123.18 },
    elevation_m: 0.5, exposure: 'semi-protected', substrate: 'alluvium', armoredFraction: 0.4,
    slrVulnerability: 0.9, tsunamiVulnerability: 0.8, contaminationExposure: 0.4, developmentPressure: 0.7,
    ecologicalValue: 'critical', modules: ['nearshore', 'ecosystem', 'fisheries', 'tribal', 'port'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['musqueam', 'tsawwassen', 'stolo'],
    notes: 'Most important salmon river on the Pacific coast. 5 species, dozens of stocks.' },
  { id: 'eco_estuary_skokomish', name: 'Skokomish River Estuary', category: 'ecological', type: 'salmon_estuary',
    subBasin: 'hood_south', latlon: { lat: 47.35, lon: -123.13 },
    elevation_m: 1.0, exposure: 'protected', substrate: 'mud', armoredFraction: 0.1,
    slrVulnerability: 0.5, tsunamiVulnerability: 0.1, contaminationExposure: 0.1, developmentPressure: 0.15,
    ecologicalValue: 'high', modules: ['nearshore', 'ecosystem', 'fisheries', 'tribal'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['skokomish'],
    notes: 'Altered by Cushman Dam. Hood Canal hypoxia directly affects treaty waters.' },

  // ═══════════════════════════════════════
  // ECOLOGICAL — SEABIRD / PINNIPED / ORCA
  // ═══════════════════════════════════════
  { id: 'eco_seabird_protection', name: 'Protection Island NWR', category: 'ecological', type: 'seabird_colony',
    subBasin: 'jdf_east', latlon: { lat: 48.13, lon: -122.93 },
    elevation_m: 20, exposure: 'exposed', substrate: 'sand', armoredFraction: 0.0,
    slrVulnerability: 0.2, tsunamiVulnerability: 0.5, contaminationExposure: 0.05, developmentPressure: 0.0,
    ecologicalValue: 'critical', modules: ['ecosystem'],
    protectionStatus: 'reserve', condition: 'good', tribalNations: [],
    notes: '70% of Puget Sound nesting seabirds. Rhinoceros auklets, glaucous-winged gulls.' },
  { id: 'eco_pinniped_racerocks', name: 'Race Rocks Pinniped Haul-out', category: 'ecological', type: 'pinniped_haulout',
    subBasin: 'jdf_east', latlon: { lat: 48.30, lon: -123.53 },
    elevation_m: 3, exposure: 'exposed', substrate: 'rock', armoredFraction: 0.0,
    slrVulnerability: 0.1, tsunamiVulnerability: 0.5, contaminationExposure: 0.02, developmentPressure: 0.0,
    ecologicalValue: 'high', modules: ['ecosystem'],
    protectionStatus: 'reserve', condition: 'good', tribalNations: [] },
  { id: 'eco_orca_limekiln', name: 'Lime Kiln SRKW Rubbing Beaches', category: 'ecological', type: 'orca_habitat',
    subBasin: 'sj_haro', latlon: { lat: 48.52, lon: -123.15 },
    elevation_m: 0, exposure: 'exposed', substrate: 'rock', armoredFraction: 0.0,
    slrVulnerability: 0.1, tsunamiVulnerability: 0.3, contaminationExposure: 0.03, developmentPressure: 0.05,
    ecologicalValue: 'critical', modules: ['ecosystem'],
    protectionStatus: 'protected', condition: 'good', tribalNations: ['lummi'],
    notes: 'SRKW rubbing rocks on west San Juan Island. One of few known rubbing beach sites.' },
  { id: 'eco_orca_haro', name: 'Haro Strait SRKW Foraging Corridor', category: 'ecological', type: 'orca_habitat',
    subBasin: 'sj_haro', latlon: { lat: 48.55, lon: -123.20 },
    elevation_m: -50, exposure: 'exposed', substrate: 'rock', armoredFraction: 0.0,
    slrVulnerability: 0.0, tsunamiVulnerability: 0.1, contaminationExposure: 0.05, developmentPressure: 0.1,
    ecologicalValue: 'critical', modules: ['ecosystem', 'port'],
    protectionStatus: 'protected', condition: 'degraded', tribalNations: ['lummi'],
    notes: 'J Pod primary summer foraging. All Vancouver-bound shipping transits here. ECHO slowdown zone.' },

  // ═══════════════════════════════════════
  // MILITARY / STRATEGIC
  // ═══════════════════════════════════════
  { id: 'mil_bangor_exclusion', name: 'Bangor Naval Security Zone', category: 'ecological', type: 'security_exclusion_reserve',
    subBasin: 'hood_north', latlon: { lat: 47.72, lon: -122.73 },
    elevation_m: 5, exposure: 'protected', substrate: 'gravel', armoredFraction: 0.02,
    slrVulnerability: 0.1, tsunamiVulnerability: 0.1, contaminationExposure: 0.02, developmentPressure: 0.0,
    ecologicalValue: 'critical', area_ha: 560, modules: ['nearshore', 'ecosystem'],
    protectionStatus: 'military_restricted', condition: 'pristine', tribalNations: ['skokomish'],
    notes: 'De facto marine reserve. 7km of pristine Hood Canal shoreline. Zero development. Unintended conservation from nuclear submarine base security.' },
  { id: 'mil_keyport_range', name: 'NUWC Keyport Acoustic Test Range', category: 'infrastructure', type: 'military_testing',
    subBasin: 'hood_north', latlon: { lat: 47.73, lon: -122.80 },
    elevation_m: -20, exposure: 'protected', substrate: 'mud',
    slrVulnerability: 0.0, tsunamiVulnerability: 0.1, contaminationExposure: 0.1,
    modules: ['ecosystem'], // sonar testing affects marine mammals
    protectionStatus: 'military_restricted', condition: 'good', tribalNations: [],
    notes: 'Navy sonar testing range in Dabob Bay. Monthly exercises. 235 dB source level in 1-10 kHz band.' },
  { id: 'mil_everett_waterfront', name: 'Naval Station Everett', category: 'infrastructure', type: 'military_base',
    subBasin: 'whidbey_south', latlon: { lat: 47.98, lon: -122.23 },
    elevation_m: 3, exposure: 'semi-protected', substrate: 'fill',
    slrVulnerability: 0.4, tsunamiVulnerability: 0.25, developmentPressure: 0.0,
    economicValue: 500000000, modules: ['port', 'urban'],
    protectionStatus: 'military_restricted', condition: 'good', tribalNations: ['tulalip'],
    notes: 'Carrier strike group homeport. ~6,000 military + civilian jobs.' },

  // ═══════════════════════════════════════
  // TRIBAL SITES
  // ═══════════════════════════════════════
  { id: 'tribal_puyallup_shellfish', name: 'Commencement Bay Tribal Shellfish Beds', category: 'tribal', type: 'shellfish_beds',
    subBasin: 'main_south', latlon: { lat: 47.28, lon: -122.43 },
    elevation_m: 0.5, exposure: 'protected', substrate: 'mud',
    slrVulnerability: 0.5, tsunamiVulnerability: 0.3, contaminationExposure: 0.8,
    culturalValue: 'high', modules: ['tribal', 'fisheries', 'publicHealth'],
    protectionStatus: 'superfund', condition: 'severely_degraded', tribalNations: ['puyallup'],
    notes: 'Traditional shellfish grounds degraded by Superfund contamination.' },
  { id: 'tribal_puyallup_fishing', name: 'Puyallup River Treaty Fishing Grounds', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'main_south', latlon: { lat: 47.24, lon: -122.40 },
    elevation_m: 2, exposure: 'protected', substrate: 'gravel',
    slrVulnerability: 0.3, tsunamiVulnerability: 0.2, contaminationExposure: 0.5,
    culturalValue: 'sacred', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['puyallup'] },
  { id: 'tribal_puyallup_terminal', name: 'Puyallup Tribal Terminal Site', category: 'tribal', type: 'economic_development',
    subBasin: 'main_south', latlon: { lat: 47.258, lon: -122.418 },
    elevation_m: 3, exposure: 'protected', substrate: 'fill',
    slrVulnerability: 0.3, tsunamiVulnerability: 0.3, developmentPressure: 0.0,
    culturalValue: 'high', economicValue: 200000000, modules: ['tribal', 'port'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['puyallup'],
    portTerminals: ['puyallup_tribal'],
    notes: 'First tribally-owned terminal at a major US port. East Blair Waterway.' },

  { id: 'tribal_lummi_reefnet', name: 'Cherry Point Reef Net Sites', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'georgia_south', latlon: { lat: 48.86, lon: -122.76 },
    elevation_m: -2, exposure: 'semi-protected', substrate: 'gravel',
    slrVulnerability: 0.2, tsunamiVulnerability: 0.4, contaminationExposure: 0.4,
    culturalValue: 'sacred', modules: ['tribal', 'fisheries', 'ecosystem'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['lummi'],
    notes: 'ONLY remaining reef net fishery in the world. Rock formations used for millennia. Blocked Gateway Pacific coal terminal 2016.' },
  { id: 'tribal_lummi_shellfish', name: 'Lummi Bay Shellfish Beds', category: 'tribal', type: 'shellfish_beds',
    subBasin: 'georgia_south', latlon: { lat: 48.78, lon: -122.68 },
    elevation_m: 0.5, exposure: 'protected', substrate: 'gravel',
    slrVulnerability: 0.4, tsunamiVulnerability: 0.3, contaminationExposure: 0.15,
    culturalValue: 'high', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['lummi'] },
  { id: 'tribal_lummi_island', name: 'Lummi Island Fishing Grounds', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'georgia_south', latlon: { lat: 48.72, lon: -122.68 },
    elevation_m: -5, exposure: 'exposed', substrate: 'rock',
    slrVulnerability: 0.1, tsunamiVulnerability: 0.3, contaminationExposure: 0.05,
    culturalValue: 'high', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['lummi'] },

  { id: 'tribal_muckleshoot_duwamish', name: 'Duwamish River Treaty Fishing Sites', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'main_north', latlon: { lat: 47.54, lon: -122.33 },
    elevation_m: 1, exposure: 'protected', substrate: 'fill',
    slrVulnerability: 0.6, tsunamiVulnerability: 0.3, contaminationExposure: 0.95,
    culturalValue: 'sacred', modules: ['tribal', 'fisheries', 'publicHealth'],
    protectionStatus: 'superfund', condition: 'severely_degraded', tribalNations: ['muckleshoot'],
    notes: 'Treaty fishing in a Superfund site. Fish consumption advisories directly affect tribal diet.' },
  { id: 'tribal_muckleshoot_elliott', name: 'Elliott Bay Traditional Grounds', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'main_north', latlon: { lat: 47.60, lon: -122.37 },
    elevation_m: -5, exposure: 'semi-protected', substrate: 'mud',
    slrVulnerability: 0.2, tsunamiVulnerability: 0.3, contaminationExposure: 0.5,
    culturalValue: 'high', modules: ['tribal', 'fisheries'],
    protectionStatus: 'unprotected', condition: 'degraded', tribalNations: ['muckleshoot'] },

  { id: 'tribal_swinomish_village', name: 'Swinomish Village (at sea level)', category: 'tribal', type: 'village',
    subBasin: 'whidbey_north', latlon: { lat: 48.45, lon: -122.50 },
    elevation_m: 1.5, exposure: 'protected', substrate: 'sand',
    slrVulnerability: 0.9, tsunamiVulnerability: 0.25, contaminationExposure: 0.15,
    culturalValue: 'sacred', modules: ['tribal', 'urban'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['swinomish'],
    notes: 'Village at sea level — directly threatened by SLR. First comprehensive tribal climate adaptation plan (2010).' },
  { id: 'tribal_swinomish_gathering', name: 'Padilla Bay Gathering Grounds', category: 'tribal', type: 'gathering_site',
    subBasin: 'whidbey_north', latlon: { lat: 48.50, lon: -122.49 },
    elevation_m: 0.5, exposure: 'protected', substrate: 'mud',
    slrVulnerability: 0.5, tsunamiVulnerability: 0.2, contaminationExposure: 0.1,
    culturalValue: 'high', modules: ['tribal'],
    protectionStatus: 'reserve', condition: 'good', tribalNations: ['swinomish'] },

  { id: 'tribal_nisqually_delta', name: 'Nisqually Delta Cultural Site', category: 'tribal', type: 'cultural_site',
    subBasin: 'ssound_north', latlon: { lat: 47.07, lon: -122.71 },
    elevation_m: 1.5, exposure: 'protected', substrate: 'mud',
    slrVulnerability: 0.5, tsunamiVulnerability: 0.2, contaminationExposure: 0.05,
    culturalValue: 'sacred', modules: ['tribal', 'nearshore'],
    protectionStatus: 'reserve', condition: 'good', restorationActive: true, tribalNations: ['nisqually'],
    notes: 'Billy Frank Jr. legacy. Medicine Creek Treaty signing area.' },
  { id: 'tribal_nisqually_fishing', name: 'Nisqually River Treaty Fishing', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'ssound_north', latlon: { lat: 47.10, lon: -122.68 },
    elevation_m: 3, exposure: 'protected', substrate: 'gravel',
    slrVulnerability: 0.2, tsunamiVulnerability: 0.15, contaminationExposure: 0.05,
    culturalValue: 'sacred', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['nisqually'] },

  { id: 'tribal_musqueam_village', name: 'Musqueam Village / Reserve', category: 'tribal', type: 'village',
    subBasin: 'georgia_central', latlon: { lat: 49.22, lon: -123.19 },
    elevation_m: 3, exposure: 'semi-protected', substrate: 'alluvium',
    slrVulnerability: 0.7, tsunamiVulnerability: 0.6, contaminationExposure: 0.3,
    culturalValue: 'sacred', modules: ['tribal', 'urban'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['musqueam'],
    notes: 'On the Fraser, surrounded by Vancouver urbanization.' },
  { id: 'tribal_musqueam_marpole', name: 'Marpole Midden', category: 'tribal', type: 'archaeological',
    subBasin: 'georgia_central', latlon: { lat: 49.21, lon: -123.13 },
    elevation_m: 5, exposure: 'protected', substrate: 'alluvium',
    slrVulnerability: 0.3, tsunamiVulnerability: 0.4, developmentPressure: 0.8,
    culturalValue: 'sacred', modules: ['tribal'],
    protectionStatus: 'protected', condition: 'degraded', tribalNations: ['musqueam'],
    notes: 'One of most significant archaeological sites in BC (4,000+ years). Threatened by development.' },
  { id: 'tribal_musqueam_fraser', name: 'Fraser River Musqueam Fishing Grounds', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'georgia_central', latlon: { lat: 49.18, lon: -123.15 },
    elevation_m: 0, exposure: 'semi-protected', substrate: 'alluvium',
    slrVulnerability: 0.6, tsunamiVulnerability: 0.7, contaminationExposure: 0.3,
    culturalValue: 'sacred', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['musqueam'],
    notes: 'Foundation of Musqueam culture. Sparrow Decision (1990) site.' },

  { id: 'tribal_tsleilwaututh_indianarm', name: 'Indian Arm Sacred Site', category: 'tribal', type: 'cultural_site',
    subBasin: 'georgia_central', latlon: { lat: 49.33, lon: -122.88 },
    elevation_m: 10, exposure: 'protected', substrate: 'rock',
    slrVulnerability: 0.1, tsunamiVulnerability: 0.2, contaminationExposure: 0.2,
    culturalValue: 'sacred', modules: ['tribal'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['tsleil_waututh'] },
  { id: 'tribal_tsleilwaututh_monitoring', name: 'Burrard Inlet Monitoring Sites', category: 'tribal', type: 'monitoring',
    subBasin: 'georgia_central', latlon: { lat: 49.30, lon: -122.95 },
    elevation_m: 0, exposure: 'semi-protected', substrate: 'mixed',
    slrVulnerability: 0.3, tsunamiVulnerability: 0.3, contaminationExposure: 0.4,
    culturalValue: 'high', modules: ['tribal'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['tsleil_waututh'],
    notes: 'Sacred Trust Initiative — independent environmental monitoring. TMX tanker route.' },

  { id: 'tribal_makah_capeflattery', name: 'Cape Flattery Cultural Sites', category: 'tribal', type: 'cultural_site',
    subBasin: 'jdf_west', latlon: { lat: 48.38, lon: -124.72 },
    elevation_m: 5, exposure: 'exposed', substrate: 'rock',
    slrVulnerability: 0.1, tsunamiVulnerability: 0.7, contaminationExposure: 0.01,
    culturalValue: 'sacred', modules: ['tribal'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['makah'],
    notes: 'Most oceanic point in Salish Sea system. Only US tribe with treaty whale hunting right.' },
  { id: 'tribal_makah_fishing', name: 'Makah Fishing Grounds', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'jdf_west', latlon: { lat: 48.35, lon: -124.60 },
    elevation_m: -10, exposure: 'exposed', substrate: 'rock',
    slrVulnerability: 0.05, tsunamiVulnerability: 0.4, contaminationExposure: 0.02,
    culturalValue: 'sacred', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['makah'] },

  { id: 'tribal_sklallam_elwha', name: 'Elwha Klallam Dam Removal Site', category: 'tribal', type: 'cultural_site',
    subBasin: 'jdf_central', latlon: { lat: 48.15, lon: -123.55 },
    elevation_m: 5, exposure: 'exposed', substrate: 'gravel',
    slrVulnerability: 0.2, tsunamiVulnerability: 0.4, contaminationExposure: 0.02,
    culturalValue: 'sacred', modules: ['tribal', 'nearshore'],
    protectionStatus: 'reserve', condition: 'good', restorationActive: true, tribalNations: ['sklallam'],
    notes: 'Largest dam removal in US history (2012). THE success story for habitat restoration.' },
  { id: 'tribal_sklallam_fishing', name: 'S\'Klallam Strait Fishing Grounds', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'jdf_central', latlon: { lat: 48.12, lon: -123.30 },
    elevation_m: -5, exposure: 'exposed', substrate: 'rock',
    slrVulnerability: 0.1, tsunamiVulnerability: 0.4, contaminationExposure: 0.05,
    culturalValue: 'high', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['sklallam'] },

  { id: 'tribal_skokomish_river', name: 'Skokomish River Cultural Sites', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'hood_south', latlon: { lat: 47.35, lon: -123.12 },
    elevation_m: 2, exposure: 'protected', substrate: 'gravel',
    slrVulnerability: 0.4, tsunamiVulnerability: 0.1, contaminationExposure: 0.1,
    culturalValue: 'sacred', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['skokomish'],
    notes: 'Hood Canal hypoxia directly kills fish in treaty waters. Cushman Dam altered flows.' },
  { id: 'tribal_skokomish_shellfish', name: 'Hood Canal Tribal Shellfish', category: 'tribal', type: 'shellfish_beds',
    subBasin: 'hood_south', latlon: { lat: 47.40, lon: -123.05 },
    elevation_m: 0.5, exposure: 'protected', substrate: 'gravel',
    slrVulnerability: 0.4, tsunamiVulnerability: 0.1, contaminationExposure: 0.1,
    culturalValue: 'high', modules: ['tribal', 'fisheries', 'publicHealth'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['skokomish'] },

  { id: 'tribal_tulalip_estuary', name: 'Tulalip Bay / Snohomish Estuary', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'whidbey_south', latlon: { lat: 48.05, lon: -122.28 },
    elevation_m: 1, exposure: 'semi-protected', substrate: 'mud',
    slrVulnerability: 0.5, tsunamiVulnerability: 0.25, contaminationExposure: 0.2,
    culturalValue: 'high', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['tulalip'] },
  { id: 'tribal_tulalip_qce', name: 'Quil Ceda Village Economic Zone', category: 'tribal', type: 'economic_development',
    subBasin: 'whidbey_south', latlon: { lat: 48.07, lon: -122.20 },
    elevation_m: 30, exposure: 'protected', substrate: 'mixed',
    slrVulnerability: 0.0, tsunamiVulnerability: 0.0, developmentPressure: 0.0,
    culturalValue: 'high', economicValue: 1000000000, modules: ['tribal'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['tulalip'],
    notes: '$1B+/yr tribally-owned commerce zone. Economic sovereignty demonstration.' },

  { id: 'tribal_cowichan_river', name: 'Cowichan River Sites', category: 'tribal', type: 'fishing_grounds',
    subBasin: 'georgia_central', latlon: { lat: 48.78, lon: -123.63 },
    elevation_m: 3, exposure: 'protected', substrate: 'gravel',
    slrVulnerability: 0.2, tsunamiVulnerability: 0.2, contaminationExposure: 0.05,
    culturalValue: 'sacred', modules: ['tribal', 'fisheries'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['cowichan'],
    notes: 'Chronically low summer flows threatening salmon. Climate change worsens.' },
  { id: 'tribal_tsawwassen_land', name: 'Tsawwassen Treaty Lands', category: 'tribal', type: 'economic_development',
    subBasin: 'georgia_south', latlon: { lat: 49.01, lon: -123.09 },
    elevation_m: 3, exposure: 'semi-protected', substrate: 'alluvium',
    slrVulnerability: 0.6, tsunamiVulnerability: 0.5, developmentPressure: 0.0,
    culturalValue: 'high', economicValue: 500000000, modules: ['tribal', 'port'],
    protectionStatus: 'managed', condition: 'good', tribalNations: ['tsawwassen'],
    notes: 'One of first modern BC treaties (2009). Economic development directly beside Deltaport.' },

  // ═══════════════════════════════════════
  // ECONOMIC — MARINAS & WATERFRONT
  // ═══════════════════════════════════════
  { id: 'econ_marina_shilshole', name: 'Shilshole Bay Marina', category: 'economic', type: 'marina',
    subBasin: 'main_north', latlon: { lat: 47.68, lon: -122.41 },
    elevation_m: 2, exposure: 'protected', substrate: 'fill',
    slrVulnerability: 0.5, tsunamiVulnerability: 0.3, developmentPressure: 0.3,
    economicValue: 25000000, modules: ['port', 'urban'], slips: 1400,
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [],
    notes: 'Largest marina on Puget Sound. 1,400 slips.' },
  { id: 'econ_marina_elliott', name: 'Elliott Bay Marina', category: 'economic', type: 'marina',
    subBasin: 'main_north', latlon: { lat: 47.63, lon: -122.39 },
    elevation_m: 2, exposure: 'protected', substrate: 'fill',
    slrVulnerability: 0.5, tsunamiVulnerability: 0.3, developmentPressure: 0.3,
    economicValue: 20000000, modules: ['port', 'urban'], slips: 1200,
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [] },
  { id: 'econ_marina_fridayharbor', name: 'Friday Harbor Marina', category: 'economic', type: 'marina',
    subBasin: 'sj_rosario', latlon: { lat: 48.53, lon: -123.01 },
    elevation_m: 2, exposure: 'protected', substrate: 'rock',
    slrVulnerability: 0.2, tsunamiVulnerability: 0.3, developmentPressure: 0.2,
    economicValue: 8000000, modules: ['port'], slips: 500,
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [] },
  { id: 'econ_marina_steveston', name: 'Steveston Harbour', category: 'economic', type: 'marina',
    subBasin: 'georgia_central', latlon: { lat: 49.12, lon: -123.18 },
    elevation_m: 2, exposure: 'semi-protected', substrate: 'alluvium',
    slrVulnerability: 0.7, tsunamiVulnerability: 0.7, developmentPressure: 0.4,
    economicValue: 30000000, modules: ['port', 'fisheries'], slips: 600,
    protectionStatus: 'unprotected', condition: 'good', tribalNations: ['musqueam'],
    notes: 'Historic fishing harbour. 600+ commercial berths. ON the Fraser Delta.' },
  { id: 'econ_waterfront_seattle', name: 'Seattle Central Waterfront', category: 'economic', type: 'waterfront_commercial',
    subBasin: 'main_north', latlon: { lat: 47.61, lon: -122.34 },
    elevation_m: 3, exposure: 'semi-protected', substrate: 'fill',
    slrVulnerability: 0.6, tsunamiVulnerability: 0.3, developmentPressure: 0.1,
    economicValue: 500000000, modules: ['urban', 'port'],
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [],
    notes: 'Pike Place Market, Aquarium, Great Wheel. $500M+/yr tourist revenue.' },
  { id: 'econ_waterfront_victoria', name: 'Victoria Inner Harbour', category: 'economic', type: 'waterfront_commercial',
    subBasin: 'jdf_east', latlon: { lat: 48.42, lon: -123.37 },
    elevation_m: 2, exposure: 'protected', substrate: 'rock',
    slrVulnerability: 0.3, tsunamiVulnerability: 0.4, developmentPressure: 0.1,
    economicValue: 300000000, modules: ['urban', 'port'],
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [] },
  { id: 'econ_whalewatching_sji', name: 'San Juan Islands Whale Watching', category: 'economic', type: 'whale_watching',
    subBasin: 'sj_rosario', latlon: { lat: 48.53, lon: -123.02 },
    elevation_m: 3, exposure: 'protected', substrate: 'rock',
    slrVulnerability: 0.1, tsunamiVulnerability: 0.2, developmentPressure: 0.1,
    economicValue: 20000000, modules: ['ecosystem', 'port'],
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [],
    notes: '10-15 operators based in Friday Harbor. Revenue depends on SRKW presence + body condition.' },
  { id: 'econ_whalewatching_victoria', name: 'Victoria Whale Watching Fleet', category: 'economic', type: 'whale_watching',
    subBasin: 'jdf_east', latlon: { lat: 48.42, lon: -123.38 },
    elevation_m: 2, exposure: 'protected', substrate: 'rock',
    slrVulnerability: 0.1, tsunamiVulnerability: 0.3, developmentPressure: 0.1,
    economicValue: 30000000, modules: ['ecosystem', 'port'],
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [],
    notes: '15+ companies. Largest whale watching port on Pacific coast.' },
  { id: 'econ_property_kingcounty', name: 'King County Waterfront Property', category: 'economic', type: 'waterfront_property',
    subBasin: 'main_north', latlon: { lat: 47.60, lon: -122.35 },
    elevation_m: 5, exposure: 'semi-protected', substrate: 'fill',
    slrVulnerability: 0.5, tsunamiVulnerability: 0.3, developmentPressure: 0.1,
    economicValue: 50000000000, modules: ['urban'],
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [],
    notes: '~$50B assessed waterfront property value within 100m of shoreline.' },
  { id: 'econ_property_metrovancouver', name: 'Metro Vancouver Waterfront Property', category: 'economic', type: 'waterfront_property',
    subBasin: 'georgia_central', latlon: { lat: 49.27, lon: -123.12 },
    elevation_m: 5, exposure: 'semi-protected', substrate: 'alluvium',
    slrVulnerability: 0.6, tsunamiVulnerability: 0.5, developmentPressure: 0.1,
    economicValue: 120000000000, modules: ['urban'],
    protectionStatus: 'unprotected', condition: 'good', tribalNations: [],
    notes: '~$120B CAD assessed waterfront property.' },

  // ═══════════════════════════════════════
  // INFRASTRUCTURE
  // ═══════════════════════════════════════
  { id: 'infra_wwtp_westpoint', name: 'West Point WWTP', category: 'infrastructure', type: 'wastewater',
    subBasin: 'main_north', latlon: { lat: 47.66, lon: -122.43 },
    elevation_m: 3, exposure: 'exposed', substrate: 'fill',
    slrVulnerability: 0.8, tsunamiVulnerability: 0.4, contaminationExposure: 0.1,
    economicValue: 2000000000, modules: ['urban', 'nearshore', 'publicHealth'],
    protectionStatus: 'managed', condition: 'good', tribalNations: [],
    notes: '133 MGD, serves 700K people. ON the shoreline (Discovery Park). Flooded in 2017.' },
  { id: 'infra_wwtp_iona', name: 'Iona Island WWTP (being replaced)', category: 'infrastructure', type: 'wastewater',
    subBasin: 'georgia_central', latlon: { lat: 49.22, lon: -123.22 },
    elevation_m: 2, exposure: 'exposed', substrate: 'alluvium',
    slrVulnerability: 0.9, tsunamiVulnerability: 0.7, contaminationExposure: 0.2,
    economicValue: 3000000000, modules: ['urban', 'nearshore', 'publicHealth'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['musqueam'],
    notes: 'ON the Fraser Delta. Primary treatment only. Being replaced by tertiary plant at higher elevation.' },
  { id: 'infra_cso_seattle', name: 'Seattle CSO System', category: 'infrastructure', type: 'cso',
    subBasin: 'main_north', latlon: { lat: 47.60, lon: -122.35 },
    elevation_m: 1, exposure: 'protected', substrate: 'fill',
    slrVulnerability: 0.7, tsunamiVulnerability: 0.3, contaminationExposure: 0.6,
    modules: ['urban', 'nearshore', 'publicHealth'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: [],
    notes: '~90 CSO locations. Raw sewage discharge during heavy rain. $600M+ control plan.' },
  { id: 'infra_rail_chuckanut', name: 'Chuckanut BNSF Rail Segment', category: 'infrastructure', type: 'shoreline_rail',
    subBasin: 'georgia_south', latlon: { lat: 48.70, lon: -122.49 },
    elevation_m: 8, exposure: 'exposed', substrate: 'rock',
    slrVulnerability: 0.3, tsunamiVulnerability: 0.2,
    erosionVulnerability: 0.9, stormSurgeVulnerability: 0.5,
    modules: ['infrastructure'],
    protectionStatus: 'unprotected', condition: 'degraded', tribalNations: [],
    notes: 'March 2026 landslide (MP 248-249). Chronic slide zone. I-5 parallel vulnerability.' },
  { id: 'infra_cable_submarine', name: 'Puget Sound Submarine Cables', category: 'infrastructure', type: 'submarine_cable',
    subBasin: 'main_central', latlon: { lat: 47.60, lon: -122.50 },
    elevation_m: -50, exposure: 'protected', substrate: 'mud',
    slrVulnerability: 0.0, tsunamiVulnerability: 0.3,
    modules: ['infrastructure', 'energy'],
    protectionStatus: 'managed', condition: 'good', tribalNations: [],
    notes: 'Fiber + power cables. Vulnerable to earthquake, anchor strike, turbidity current.' },

  // ═══════════════════════════════════════
  // CONTAMINATION SITES
  // ═══════════════════════════════════════
  { id: 'contam_duwamish', name: 'Lower Duwamish Waterway Superfund', category: 'contamination', type: 'superfund',
    subBasin: 'main_north', latlon: { lat: 47.55, lon: -122.34 },
    elevation_m: 0, exposure: 'protected', substrate: 'fill',
    slrVulnerability: 0.7, tsunamiVulnerability: 0.3, contaminationExposure: 1.0,
    modules: ['nearshore', 'ecosystem', 'tribal', 'publicHealth'],
    protectionStatus: 'superfund', condition: 'severely_degraded', tribalNations: ['muckleshoot'],
    contaminants: ['PCBs', 'PAHs', 'arsenic', 'dioxins'],
    notes: '5.5 miles. PCBs/PAHs/arsenic. Muckleshoot treaty fishing grounds. EPA NPL.' },
  { id: 'contam_commencementbay', name: 'Commencement Bay Superfund', category: 'contamination', type: 'superfund',
    subBasin: 'main_south', latlon: { lat: 47.27, lon: -122.42 },
    elevation_m: 0, exposure: 'protected', substrate: 'fill',
    slrVulnerability: 0.6, tsunamiVulnerability: 0.3, contaminationExposure: 1.0,
    modules: ['nearshore', 'ecosystem', 'tribal', 'publicHealth'],
    protectionStatus: 'superfund', condition: 'severely_degraded', tribalNations: ['puyallup'],
    contaminants: ['PCBs', 'metals', 'PAHs'],
    notes: 'Puyallup territory. Multiple responsible parties. Tribal terminal being built here.' },
  { id: 'contam_eagleharbor', name: 'Eagle Harbor / Wyckoff Superfund', category: 'contamination', type: 'superfund',
    subBasin: 'main_central', latlon: { lat: 47.62, lon: -122.51 },
    elevation_m: 0, exposure: 'protected', substrate: 'mud',
    slrVulnerability: 0.4, tsunamiVulnerability: 0.2, contaminationExposure: 0.8,
    modules: ['nearshore', 'ecosystem', 'publicHealth'],
    protectionStatus: 'superfund', condition: 'degraded', tribalNations: [],
    contaminants: ['creosote', 'PAHs', 'metals'],
    notes: 'Creosote from former shipyard. Bainbridge Island.' },
  { id: 'contam_harborisland', name: 'Harbor Island Lead Smelter Legacy', category: 'contamination', type: 'superfund',
    subBasin: 'main_north', latlon: { lat: 47.58, lon: -122.35 },
    elevation_m: 2, exposure: 'protected', substrate: 'fill',
    slrVulnerability: 0.6, tsunamiVulnerability: 0.3, contaminationExposure: 0.9,
    modules: ['nearshore', 'publicHealth'],
    protectionStatus: 'superfund', condition: 'severely_degraded', tribalNations: ['muckleshoot'],
    contaminants: ['lead', 'arsenic', 'zinc'],
    notes: 'ASARCO smelter legacy. Adjacent to T-18.' },

  // ═══════════════════════════════════════
  // RECREATION
  // ═══════════════════════════════════════
  { id: 'rec_deceptionpass', name: 'Deception Pass State Park', category: 'recreation', type: 'state_park',
    subBasin: 'whidbey_north', latlon: { lat: 48.40, lon: -122.65 },
    elevation_m: 20, exposure: 'exposed', substrate: 'rock',
    slrVulnerability: 0.05, tsunamiVulnerability: 0.2, developmentPressure: 0.0,
    economicValue: 15000000, modules: ['ecosystem'],
    protectionStatus: 'protected', condition: 'good', tribalNations: ['swinomish'],
    notes: 'Most visited state park in WA. Iconic bridge over tidal rapids.' },
  { id: 'rec_sanjuannhp', name: 'San Juan Island National Historical Park', category: 'recreation', type: 'national_park',
    subBasin: 'sj_haro', latlon: { lat: 48.52, lon: -123.10 },
    elevation_m: 10, exposure: 'semi-protected', substrate: 'rock',
    slrVulnerability: 0.05, tsunamiVulnerability: 0.3, developmentPressure: 0.0,
    economicValue: 10000000, modules: ['ecosystem'],
    protectionStatus: 'protected', condition: 'good', tribalNations: ['lummi'],
    notes: 'Includes Lime Kiln Point — premier shore-based whale watching.' },
  { id: 'rec_goldgardens', name: 'Golden Gardens Beach', category: 'recreation', type: 'public_beach',
    subBasin: 'main_north', latlon: { lat: 47.69, lon: -122.40 },
    elevation_m: 2, exposure: 'semi-protected', substrate: 'sand',
    slrVulnerability: 0.5, tsunamiVulnerability: 0.3, contaminationExposure: 0.2,
    economicValue: 5000000, modules: ['publicHealth'],
    protectionStatus: 'protected', condition: 'good', tribalNations: [] },
  { id: 'rec_alki', name: 'Alki Beach', category: 'recreation', type: 'public_beach',
    subBasin: 'main_north', latlon: { lat: 47.58, lon: -122.41 },
    elevation_m: 2, exposure: 'exposed', substrate: 'sand',
    slrVulnerability: 0.6, tsunamiVulnerability: 0.3, contaminationExposure: 0.2,
    economicValue: 8000000, modules: ['publicHealth', 'urban'],
    protectionStatus: 'protected', condition: 'good', tribalNations: [] },
  { id: 'rec_shellfish_hoodcanal', name: 'Hood Canal Recreational Shellfish Beaches', category: 'recreation', type: 'shellfish_harvest',
    subBasin: 'hood_south', latlon: { lat: 47.50, lon: -123.00 },
    elevation_m: 0.5, exposure: 'protected', substrate: 'gravel',
    slrVulnerability: 0.4, tsunamiVulnerability: 0.1, contaminationExposure: 0.1,
    economicValue: 3000000, modules: ['publicHealth', 'fisheries'],
    protectionStatus: 'managed', condition: 'degraded', tribalNations: ['skokomish'],
    notes: 'Most popular recreational shellfish area. HAB closures increasingly frequent.' },
];

// ═══════════════════════════════════════
// AGGREGATE FUNCTIONS
// ═══════════════════════════════════════

export function getAssetsInBasin(subBasinId) {
  return SHORE_ASSETS.filter(a => a.subBasin === subBasinId);
}

export function getAssetsByType(type) {
  return SHORE_ASSETS.filter(a => a.type === type);
}

export function getAssetsByCategory(category) {
  return SHORE_ASSETS.filter(a => a.category === category);
}

export function getVulnerableAssets(hazardType, threshold = 0.5) {
  const key = hazardType + 'Vulnerability';
  return SHORE_ASSETS.filter(a => (a[key] || 0) >= threshold);
}

// ── GROUP BY SUB-BASIN ──
export const ASSETS_BY_BASIN = {};
for (const a of SHORE_ASSETS) {
  if (!ASSETS_BY_BASIN[a.subBasin]) ASSETS_BY_BASIN[a.subBasin] = [];
  ASSETS_BY_BASIN[a.subBasin].push(a);
}

// ── GROUP BY CATEGORY ──
export const ASSETS_BY_CATEGORY = {};
for (const a of SHORE_ASSETS) {
  if (!ASSETS_BY_CATEGORY[a.category]) ASSETS_BY_CATEGORY[a.category] = [];
  ASSETS_BY_CATEGORY[a.category].push(a);
}

// ── GROUP BY TRIBAL NATION ──
export const ASSETS_BY_NATION = {};
for (const a of SHORE_ASSETS) {
  if (a.tribalNations) {
    for (const n of a.tribalNations) {
      if (!ASSETS_BY_NATION[n]) ASSETS_BY_NATION[n] = [];
      ASSETS_BY_NATION[n].push(a);
    }
  }
}

// ── PER-BASIN AGGREGATE STATISTICS ──
// Shoreline lengths from PSNERP (Schlenger et al. 2011) + BC data
const SHORELINE_KM = {
  jdf_west: 85, jdf_central: 120, jdf_east: 65,
  georgia_north: 350, georgia_central: 280, georgia_south: 180,
  sj_haro: 95, sj_rosario: 110,
  whidbey_north: 140, whidbey_central: 90, whidbey_south: 80,
  main_north: 55, main_central: 70, main_south: 45,
  hood_north: 60, hood_south: 55,
  ssound_north: 65, ssound_south: 50,
};

// Armored fractions from Schlenger et al. 2011 PSNERP
const ARMORED_FRACTION = {
  jdf_west: 0.02, jdf_central: 0.08, jdf_east: 0.10,
  georgia_north: 0.05, georgia_central: 0.25, georgia_south: 0.12,
  sj_haro: 0.05, sj_rosario: 0.08,
  whidbey_north: 0.12, whidbey_central: 0.15, whidbey_south: 0.22,
  main_north: 0.65, main_central: 0.30, main_south: 0.55,
  hood_north: 0.18, hood_south: 0.12,
  ssound_north: 0.15, ssound_south: 0.25,
};

function computeStats() {
  const stats = {};
  const subBasinIds = Object.keys(SHORELINE_KM);
  for (const sbk of subBasinIds) {
    const assets = ASSETS_BY_BASIN[sbk] || [];
    const eco = assets.filter(a => a.category === 'ecological').length;
    const tribal = assets.filter(a => a.category === 'tribal').length;
    const econ = assets.filter(a => a.category === 'economic').length;
    const infra = assets.filter(a => a.category === 'infrastructure').length;
    const contam = assets.filter(a => a.category === 'contamination').length;
    const rec = assets.filter(a => a.category === 'recreation').length;
    const totalValue = assets.reduce((s, a) => s + (a.economicValue || 0), 0);
    const slrExposed = assets.filter(a => (a.slrVulnerability || 0) >= 0.5).length;
    const tsuExposed = assets.filter(a => (a.tsunamiVulnerability || 0) >= 0.5).length;
    const restorationCount = assets.filter(a => a.restorationActive).length;

    stats[sbk] = {
      totalShorelineKm: SHORELINE_KM[sbk],
      armoredShorelineKm: Math.round(SHORELINE_KM[sbk] * (ARMORED_FRACTION[sbk] || 0)),
      armorFraction: ARMORED_FRACTION[sbk] || 0,
      totalAssets: assets.length,
      ecologicalAssetCount: eco,
      tribalSiteCount: tribal,
      economicAssetCount: econ,
      infrastructureCount: infra,
      contaminationSiteCount: contam,
      recreationCount: rec,
      totalEconomicValue: totalValue,
      slrExposureIndex: assets.length > 0 ? slrExposed / assets.length : 0,
      tsunamiExposureIndex: assets.length > 0 ? tsuExposed / assets.length : 0,
      restorationSiteCount: restorationCount,
    };
  }
  return stats;
}

export const SHORELINE_STATS = computeStats();

// ── TOTAL WATERFRONT PROPERTY VALUE ──
export const TOTAL_WATERFRONT_VALUE = SHORE_ASSETS
  .filter(a => a.type === 'waterfront_property')
  .reduce((s, a) => s + (a.economicValue || 0), 0);
