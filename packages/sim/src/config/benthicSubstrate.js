// ═══════════════════════════════════════════════════════════
// BENTHIC SUBSTRATE CHARACTERIZATION — Per Sub-Basin
// ═══════════════════════════════════════════════════════════
// Simplified benthic habitat characterization for each of the 18 sub-basins.
// Substrate composition drives species carrying capacity:
//   rocky_reef  → rockfish, lingcod, octopus (den habitat)
//   sand_wave   → Pacific sand lance (obligate burrowers in dynamic sand waves)
//   glacial_till → general habitat complexity, refuge structure
//   cobble      → forage fish spawning, juvenile habitat
//   mud         → Dungeness crab, geoduck, benthic infauna (burrowing)
//   mixed       → moderate suitability for multiple species
//
// Data basis:
//   Greene & Barrie 2011 — Potential Marine Benthic Habitats of the
//     San Juan Archipelago (GSC Marine Map Series)
//   Greene et al. 2017 — Sand wave field dynamics, Geosciences 7(4):107
//     DOI: 10.3390/geosciences7040107
//   Baker & Greene 2024 — Atlas of Pacific sand lance benthic habitat
//   Greene & Aschoff 2023 — Oil spill assessment maps, Continental Shelf Research
//   NOAA/PNNL Salish Sea bathymetry and substrate surveys
//   WA DNR ShoreZone Inventory
//   BC Marine Conservation Analysis substrate layers
//
// Fractions sum to 1.0 per basin. "sand_wave" is a subset of sand that is
// actively maintained by tidal currents — distinct from passive sand deposits.
// ═══════════════════════════════════════════════════════════

// Per sub-basin substrate fractions
// rocky_reef: exposed bedrock, boulders, rocky outcrops
// sand_wave: active sand wave fields maintained by tidal currents (>0.5 m/s)
// glacial_till: compacted glacial deposits with mixed grain sizes
// cobble: cobble/gravel beaches and subtidal pavements
// mud: fine-grained sediment (silt + clay), often organic-rich
// mixed: heterogeneous mix of above types
export const BENTHIC_SUBSTRATE = {
  // ── JUAN DE FUCA ──
  // Strong tidal currents, oceanic influence, mixed substrate
  jdf_west: {
    rocky_reef: 0.25, sand_wave: 0.15, glacial_till: 0.10,
    cobble: 0.15, mud: 0.15, mixed: 0.20,
  },
  jdf_central: {
    rocky_reef: 0.20, sand_wave: 0.10, glacial_till: 0.15,
    cobble: 0.15, mud: 0.20, mixed: 0.20,
  },
  // Admiralty Inlet: strong tidal mixing, rocky sills
  jdf_east: {
    rocky_reef: 0.30, sand_wave: 0.12, glacial_till: 0.10,
    cobble: 0.18, mud: 0.15, mixed: 0.15,
  },

  // ── GEORGIA STRAIT ──
  // Fraser plume = massive mud deposition; north is sandier
  georgia_north: {
    rocky_reef: 0.08, sand_wave: 0.08, glacial_till: 0.10,
    cobble: 0.10, mud: 0.44, mixed: 0.20,
  },
  // Fraser Plume Zone: heavy mud from Fraser River sediment load
  georgia_central: {
    rocky_reef: 0.05, sand_wave: 0.05, glacial_till: 0.05,
    cobble: 0.05, mud: 0.60, mixed: 0.20,
  },
  // Boundary Bay: moderate mud, some sand flats
  georgia_south: {
    rocky_reef: 0.06, sand_wave: 0.08, glacial_till: 0.08,
    cobble: 0.08, mud: 0.50, mixed: 0.20,
  },

  // ── SAN JUAN ARCHIPELAGO ──
  // Greene & Barrie 2011: highest rocky reef and sand wave fraction in the Salish Sea.
  // Strong tidal currents through Haro and Rosario straits maintain dynamic sand waves.
  // This is the critical benthic habitat zone for sand lance and rockfish.
  sj_haro: {
    rocky_reef: 0.40, sand_wave: 0.25, glacial_till: 0.08,
    cobble: 0.10, mud: 0.07, mixed: 0.10,
  },
  sj_rosario: {
    rocky_reef: 0.35, sand_wave: 0.20, glacial_till: 0.10,
    cobble: 0.12, mud: 0.10, mixed: 0.13,
  },

  // ── WHIDBEY BASIN ──
  // River-dominated, fine sediment from Skagit/Snohomish/Stillaguamish
  whidbey_north: {
    rocky_reef: 0.05, sand_wave: 0.05, glacial_till: 0.12,
    cobble: 0.08, mud: 0.50, mixed: 0.20,
  },
  whidbey_central: {
    rocky_reef: 0.08, sand_wave: 0.06, glacial_till: 0.12,
    cobble: 0.10, mud: 0.44, mixed: 0.20,
  },
  whidbey_south: {
    rocky_reef: 0.10, sand_wave: 0.05, glacial_till: 0.10,
    cobble: 0.12, mud: 0.43, mixed: 0.20,
  },

  // ── MAIN BASIN ──
  // Urban waterfront (Seattle, Tacoma), mixed substrate, contaminated sediment
  main_north: {
    rocky_reef: 0.12, sand_wave: 0.06, glacial_till: 0.12,
    cobble: 0.12, mud: 0.38, mixed: 0.20,
  },
  main_central: {
    rocky_reef: 0.15, sand_wave: 0.08, glacial_till: 0.12,
    cobble: 0.12, mud: 0.33, mixed: 0.20,
  },
  main_south: {
    rocky_reef: 0.10, sand_wave: 0.05, glacial_till: 0.10,
    cobble: 0.10, mud: 0.45, mixed: 0.20,
  },

  // ── HOOD CANAL ──
  // Fjord: steep rocky walls near sill, deep mud basin below
  hood_north: {
    rocky_reef: 0.15, sand_wave: 0.03, glacial_till: 0.15,
    cobble: 0.10, mud: 0.42, mixed: 0.15,
  },
  hood_south: {
    rocky_reef: 0.08, sand_wave: 0.02, glacial_till: 0.10,
    cobble: 0.08, mud: 0.57, mixed: 0.15,
  },

  // ── SOUTH SOUND ──
  // Shallow inlets, extensive mud flats, some glacial till
  ssound_north: {
    rocky_reef: 0.05, sand_wave: 0.03, glacial_till: 0.10,
    cobble: 0.08, mud: 0.54, mixed: 0.20,
  },
  ssound_south: {
    rocky_reef: 0.04, sand_wave: 0.02, glacial_till: 0.08,
    cobble: 0.06, mud: 0.60, mixed: 0.20,
  },
};

// Tidal current strength per sub-basin (m/s, depth-averaged maximum)
// Drives sand wave maintenance: sand waves require >0.5 m/s to remain dynamic.
// Source: Khangaonkar et al. 2011, NOAA tidal current predictions, CHS current atlas
export const TIDAL_CURRENT_STRENGTH = {
  jdf_west: 0.8,       // strong oceanic/tidal
  jdf_central: 0.6,    // moderate
  jdf_east: 1.2,       // Admiralty Inlet — very strong
  georgia_north: 0.3,  // weak, stratified
  georgia_central: 0.2,// Fraser plume dominates
  georgia_south: 0.4,  // moderate tidal
  sj_haro: 1.5,        // strongest in Salish Sea — Haro Strait
  sj_rosario: 1.0,     // Rosario Strait — strong
  whidbey_north: 0.3,  // river-dominated
  whidbey_central: 0.4,// Saratoga Passage — moderate
  whidbey_south: 0.3,  // Possession Sound — moderate/weak
  main_north: 0.3,     // Elliott Bay — moderate
  main_central: 0.4,   // Central Basin
  main_south: 0.5,     // Tacoma Narrows influence
  hood_north: 0.2,     // weak tidal exchange
  hood_south: 0.1,     // almost stagnant
  ssound_north: 0.3,   // Nisqually Reach
  ssound_south: 0.2,   // Budd Inlet — weak
};

// Sand wave maintenance threshold (m/s)
// Below this, sand waves degrade over time as fine sediment infills.
export const SAND_WAVE_CURRENT_THRESHOLD = 0.5;

// Aggregate to parent basins (volume-weighted) for backward compatibility
// with the existing SUBSTRATE export in basins.js
export function aggregateSubstrateToParent(subBasinMap) {
  // This function is provided for reference but the engine now reads
  // sub-basin-level data directly from BENTHIC_SUBSTRATE.
  const PARENT_MAP = {
    juanDeFuca: ['jdf_west', 'jdf_central', 'jdf_east'],
    georgia: ['georgia_north', 'georgia_central', 'georgia_south'],
    sanjuan: ['sj_haro', 'sj_rosario'],
    whidbey: ['whidbey_north', 'whidbey_central', 'whidbey_south'],
    mainBasin: ['main_north', 'main_central', 'main_south'],
    hoodCanal: ['hood_north', 'hood_south'],
    southSound: ['ssound_north', 'ssound_south'],
  };
  const result = {};
  for (const [parent, subs] of Object.entries(PARENT_MAP)) {
    const agg = { rocky_reef: 0, sand_wave: 0, glacial_till: 0, cobble: 0, mud: 0, mixed: 0 };
    let count = subs.length;
    for (const sb of subs) {
      const d = subBasinMap[sb];
      if (!d) continue;
      for (const k of Object.keys(agg)) agg[k] += d[k] || 0;
    }
    for (const k of Object.keys(agg)) agg[k] /= count;
    result[parent] = agg;
  }
  return result;
}
