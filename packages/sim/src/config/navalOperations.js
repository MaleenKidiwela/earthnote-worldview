// ═══════════════════════════════════════════════════════════
// NAVAL OPERATIONS — Military maritime presence in the Salish Sea
// ═══════════════════════════════════════════════════════════
// The Salish Sea hosts the US Navy's Pacific Northwest submarine
// fleet (Trident SSBNs at Bangor), a nuclear shipyard (PSNS),
// and Coast Guard District 13 operations. These create unique
// acoustic, economic, and ecological dynamics.
//
// Sources:
//   Navy Region Northwest public affairs
//   US Navy NW Training and Testing EIS (2020)
//   NMFS Biological Opinion on NW Training
//   DOD Budget Justification documents
//   Kitsap Sun naval reporting
//   Coast Guard NOTAM archives
//   NUWC Keyport acoustic testing documentation
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

// ── SUBMARINE TRANSIT CORRIDOR ──
// Bangor → Hood Canal → Admiralty Inlet → JdF → Pacific
export const SUBMARINE_TRANSIT_ROUTE = [
  'hood_north',      // Bangor departure
  'hood_south',      // Hood Canal transit (surface)
  'main_central',    // brief transit to Admiralty Inlet
  'jdf_east',        // Admiralty Inlet (convergence point)
  'jdf_central',     // central strait
  'jdf_west',        // strait exit to Pacific
];

export const SUBMARINE_OPERATIONS = {
  transitsPerMonth: 6,       // ~4-8 acknowledged (publicly available level)
  transitSpeedKnots: 11,     // slow, minimizing wake and noise
  escortType: 'USCG',        // Coast Guard security escort
  exclusionZoneYards: 500,   // vessels must stay 500 yards from submarines
  transitDurationHours: 8,   // Hood Canal to open ocean
  surfaceInInlandWaters: true,
  // Acoustic signature: submarines are QUIETER than commercial ships
  transitNoiseSPL: 150,      // dB re 1µPa @ 1m — significantly quieter than container ship (185 dB)
  submergedNoiseSPL: 120,    // extremely quiet when submerged
  vesselClasses: {
    ssbn: { name: 'Ohio-class SSBN (Trident)', count: 8, homeport: 'bangor', draft_m: 11.1 },
    ssn: { name: 'Fast Attack SSN (various)', count: 2, homeport: 'bangor', draft_m: 9.4 },
  },
};

// ── BANGOR SECURITY ZONE ──
// De facto marine reserve created by military exclusion
export const BANGOR_SECURITY_ZONE = {
  subBasin: 'hood_north',
  shorelineKm: 7,
  offshoreExtentM: 800,
  areaHa: 560,               // ~7km × 0.8km
  restrictions: ['no_fishing', 'no_anchoring', 'no_recreation', 'no_development'],
  armoredFraction: 0.02,     // almost zero
  developmentPressure: 0.0,
  ecologicalCondition: 'pristine',
  // Ecological significance: undisturbed eelgrass, undisturbed forage fish spawning,
  // no shoreline armoring — one of the HEALTHIEST shoreline segments on Hood Canal
  eelgrassHealth: 0.95,
  forageFishSpawning: 0.90,
  notes: 'De facto marine reserve. Healthiest Hood Canal shoreline. Unintended conservation benefit from nuclear submarine base security requirements.',
};

// ── SONAR EXERCISES ──
// Navy acoustic testing in designated areas
export const SONAR_EXERCISES = {
  dabobBay: {
    subBasin: 'hood_north',
    facilityName: 'NUWC Keyport Acoustic Test Range',
    latlon: { lat: 47.73, lon: -122.80 },
    exerciseFrequency: 'monthly',        // regular testing
    exerciseDurationDays: 2,
    sonarType: 'MFAS',                   // mid-frequency active sonar
    frequencyRangeHz: [1000, 10000],     // 1-10 kHz
    sourceLevel_dB: 235,                 // extremely loud
    marineSpeciesImpact: {
      srkw: 'behavioral_avoidance',      // whales leave the area
      porpoise: 'high_sensitivity',      // most sensitive cetacean
      humpback: 'moderate_avoidance',
      pinnipeds: 'mild_response',
    },
    mitigation: ['marine_mammal_observers', 'shutdown_zones', 'seasonal_restrictions'],
    citation: 'US Navy NW Training and Testing EIS, NMFS Biological Opinion',
  },
  jdfExercise: {
    subBasin: 'jdf_central',
    exerciseFrequency: 'quarterly',
    exerciseDurationDays: 3,
    sonarType: 'MFAS',
    frequencyRangeHz: [2000, 8000],
    sourceLevel_dB: 230,
    notes: 'Occasional exercises in Strait of Juan de Fuca',
  },
};

// ── NAVAL VESSEL TRAFFIC ──
// Surface vessels beyond submarines
export const NAVAL_VESSELS = {
  cvn: {
    type: 'Aircraft Carrier',
    class: 'Nimitz-class CVN',
    homeport: 'psns',          // PSNS Bremerton for maintenance
    subBasin: 'main_central',
    annualTransits: 20,         // major transit events (Rich Passage)
    draftM: 12.0,
    noiseSPL: 188,             // loud — large propulsion plant
    notes: 'Rich Passage transit is major navigation event. Tugs escort.',
  },
  ddg: {
    type: 'Destroyer',
    class: 'Arleigh Burke DDG',
    homeport: 'psns',
    subBasin: 'main_central',
    annualTransits: 80,
    draftM: 9.4,
    noiseSPL: 178,
  },
  uscg: {
    type: 'Coast Guard Cutter',
    class: 'Various',
    homeport: 'seattle',        // USCG District 13 HQ
    subBasin: 'main_north',
    annualTransits: 200,
    draftM: 4.5,
    noiseSPL: 170,
  },
  totalAnnualTransits: 300,     // all military vessel types combined
  primaryBasins: ['main_central', 'hood_north', 'jdf_east', 'jdf_central'],
};

// ── MILITARY EMPLOYMENT AND ECONOMIC DATA ──
// Source: DOD 2024, Martin Associates 2023
export const MILITARY_ECONOMICS = {
  psns: {
    civilianJobs: 14500,
    militaryPersonnel: 2000,
    annualBudget: 2400,         // $M/yr
    economicMultiplier: 2.3,    // $2.3 in regional economic activity per $1 DOD spending
    notes: 'Largest naval shipyard on the Pacific Coast. Nuclear-capable.',
  },
  bangor: {
    civilianJobs: 4000,
    militaryPersonnel: 6000,
    annualBudget: 1800,         // $M/yr — submarine operations
    strategicAssets: '8 Trident SSBNs — 3rd largest nuclear arsenal in the US',
  },
  uscgD13: {
    civilianJobs: 500,
    militaryPersonnel: 1200,
    annualBudget: 300,          // $M/yr
  },
  totalJobs: 28200,             // all military + civilian at all facilities
  totalBudget: 4500,            // $M/yr combined
};

// ── TRIBAL-MILITARY INTERACTIONS ──
export const TRIBAL_MILITARY_OVERLAP = {
  suquamish: {
    overlapArea: 'Rich Passage, Port Madison, Sinclair Inlet',
    subBasins: ['main_central'],
    consultationRequired: true,
    fishingRestrictions: 'Periodic closures during carrier transit',
    notes: 'Suquamish territory overlaps with PSNS naval operations.',
  },
  sklallam: {
    overlapArea: 'Strait of Juan de Fuca submarine transit corridor',
    subBasins: ['jdf_east', 'jdf_central'],
    consultationRequired: true,
    fishingRestrictions: 'Brief closures during submarine escort',
    notes: 'S\'Klallam treaty fishing in submarine transit corridor.',
  },
  skokomish: {
    overlapArea: 'Hood Canal — submarine corridor',
    subBasins: ['hood_north', 'hood_south'],
    consultationRequired: true,
    fishingRestrictions: 'Bangor security zone excludes fishing from 7km shoreline',
    notes: 'Skokomish treaty waters in Hood Canal include submarine route.',
  },
};
