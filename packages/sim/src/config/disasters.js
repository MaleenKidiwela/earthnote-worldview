const DIS = {
  // ── THREE EARTHQUAKE TYPES ──
  cascadia_megathrust: {
    l: "Cascadia M8.7–9.2", ic: "⚡", c: "#A32D2D", pk: 1.0, dur: 3, dc: 0.10,
    magnitudeRange: [8.7, 9.2],
    description: "Full Cascadia Subduction Zone rupture",
    // Cascadia full-margin megathrust scenario magnitude.
    // magnitudeRange [8.7, 9.2] is paper-direct from Satake, Wang & Atwater 2003
    // (JGR Solid Earth 108(B11):2535, doi:10.1029/2003JB002521). Range derived
    // from forward modeling of the 1700 Cascadia tsunami against Japanese
    // historical tsunami-height records: "The various combinations of Japanese
    // tsunami heights and Cascadia sources give seismic moment of 1-9 × 10²²
    // N m, equivalent to moment magnitude 8.7-9.2." Both endpoints from a
    // single peer-reviewed primary source. Most-likely scenario per Satake 2003
    // is Mw 9.0 (Long-Narrow model, 1100 km full-margin rupture, 19 m mean
    // slip), but the 8.7-9.2 envelope is the paper-direct range. Range-primary
    // representation per CLAUDE.md earthquake-magnitude convention; prior
    // scalar magnitude=9.0 (model-construction selection from this range)
    // removed in this migration commit. Shared with cascadia_m9 entry (same
    // physical event, different simulation depth).
    probability50yr: 0.12,
    recoveryQuarters: 20,
    tsunami: { juanDeFuca: 0.8, georgia: 0.3, sanJuan: 0.2, mainBasin: 0.1 },
    landslide: { mainBasin: 0.7, hoodCanal: 0.5, whidbey: 0.4, southSound: 0.3, georgia: 0.3, sanJuan: 0.2, juanDeFuca: 0.1 },
    liquefaction: { mainBasin: 0.8, southSound: 0.5 },
    subsidence: 1.5,
    shaking: 0.9,
  },
  deep_intraslab: {
    l: "Deep M6.6–6.8", ic: "⚡", c: "#D4810C", pk: 0.5, dur: 1, dc: 0.25,
    magnitudeRange: [6.6, 6.8],
    description: "Nisqually-type deep intraslab earthquake",
    // Puget Sound deep intraslab earthquake scenario magnitude.
    // magnitudeRange [6.6, 6.8] is paper-direct from Ichinose, Thio & Somerville
    // 2004 (GRL 31:L10604, doi:10.1029/2004GL019668), which gives both endpoints
    // from moment-tensor inversion of the two most recent canonical Puget Sound
    // intraslab events: lower bound Mw 6.6 from the 1965 Seattle-Tacoma
    // earthquake (Mo = 9.4 × 10²⁵ dyne-cm); upper bound Mw 6.8 from the 2001
    // Nisqually earthquake (Mo = 1.7 × 10²⁶ dyne-cm, 59-62 km depth). Both
    // endpoints from one peer-reviewed primary source. The 1949 Olympia
    // earthquake (third in the canonical Puget Sound intraslab cluster)
    // corroborates the upper bound at Mw 6.8 per the Ichinose et al. 2006 BSSA
    // reanalysis (doi:10.1785/0120050132); the older Baker & Langston 1987
    // estimate of M 7.1 was a body/surface-wave magnitude pre-Mw era,
    // superseded by the modern moment-tensor analysis. 'Or greater'
    // acknowledged: USGS hazard models extend potential intraslab events in
    // this region to ~Mw 7.5 on scaling-relations grounds; not encoded in
    // schema-level range per CLAUDE.md convention. Range-primary representation;
    // prior scalar magnitude=6.8 (model-construction selection from observation
    // cluster) removed in this migration commit.
    probability50yr: 0.84,
    recoveryQuarters: 4,
    tsunami: null,
    landslide: { mainBasin: 0.4, hoodCanal: 0.3 },
    liquefaction: { mainBasin: 0.5, southSound: 0.3 },
    subsidence: 0,
    shaking: 0.5,
  },
  seattle_fault: {
    l: "Seattle Fault M7.0–7.5", ic: "⚡", c: "#C0392B", pk: 0.8, dur: 2, dc: 0.15,
    magnitudeRange: [7.0, 7.5],
    description: "Shallow crustal rupture under Seattle",
    // Seattle Fault Zone full-length rupture scenario magnitude.
    // magnitudeRange [7.0, 7.5] is paper-direct from Styron & Sherrod 2021
    // (BSSA 111(2):1139-1153, doi:10.1785/0120200193), Bayesian inversion
    // method extending Biasi & Weldon 2006 to incorporate both rupture-length
    // and surface-displacement measurements; applied to 27 late-Pleistocene to
    // Holocene paleoearthquakes in the Puget Lowland. Mw 7.5 upper bound is
    // the median magnitude estimate for the Seattle Fault Zone main rupture
    // (cited as the SFZ Mw 7.5 estimate in Black et al. 2023, Sci Adv
    // 9(39):eadh4973). Mw 7.0 lower bound corresponds to the lower end of the
    // SFZ thrust-rupture range cited consistently across ten Brink et al. 2006,
    // Nelson et al. 2014, and Styron & Sherrod 2021. The most recent large
    // rupture (AD 923-924) produced ≥7 m of uplift along part of the fault per
    // Bucknam et al. 1992 and Atwater & Moore 1992 (Science 258:1614-1617).
    // Out-of-scope for single-fault range: Black et al. 2023 hypothesizes the
    // AD 923-924 event may have been a multi-fault co-rupture with the Saddle
    // Mountain fault at Mw ~7.8; this is a different physical scenario from a
    // single Seattle-fault rupture and would warrant a separate entry if/when
    // the data model encodes multi-fault scenarios. Range-primary
    // representation; prior scalar magnitude=7.2 (the WA DNR / FEMA / WA
    // Military Dept "Modeling a Magnitude 7.2 Earthquake on the Seattle Fault"
    // scenario value, a model-construction selection from this range) removed
    // in this migration commit.
    probability50yr: 0.05,
    recoveryQuarters: 12,
    tsunami: { mainBasin: 0.6, southSound: 0.3 },
    landslide: { mainBasin: 0.9, hoodCanal: 0.3, whidbey: 0.2 },
    liquefaction: { mainBasin: 0.9 },
    subsidence: 0.5,
    shaking: 0.8,
  },
  // ── LOCAL FAULT SOURCES (Greene, Barrie, Todd 2018; Barrie & Greene 2018; Sedimentary Geology) ──
  skipjack_island_fault: {
    l: "Skipjack Island Fault M6.9–7.3", ic: "⚡", c: "#D4810C", pk: 0.6, dur: 1, dc: 0.20,
    magnitudeRange: [6.9, 7.3],
    description: "Strike-slip rupture on Skipjack Island Fault Zone — local tsunami in narrow channels, San Juan infrastructure damage",
    // Skipjack Island Fault scenario magnitude.
    // Path 0 terminal per Amendment 6 §5.24 (Chain B Session 2i Entry 68 sub-ii).
    // magnitudeRange [6.9, 7.3] is paper-direct from Caston 2021. Range-
    // primary representation per CLAUDE.md earthquake-magnitude convention
    // (Session 2i Entry 69): literature describes faults as producing ranges
    // of potential earthquakes, so the data model represents ranges. Prior
    // scalar-magnitude-with-additive-range form (Entry 68 commit 57d9189)
    // refactored to range-only in this commit. §5.24(g) conservative-
    // selection no longer applicable since the scalar selection step is
    // eliminated; the range is the representation.
    // Caston 2021 (MSc thesis, Univ. of Victoria) constrained
    // rupture scenarios using relocated earthquake hypocentres, earthquake
    // mechanisms, bathymetry, aeromagnetic data, seismic reflection, magneto-
    // telluric data, and empirical fault-slip/fault-length relations; produced
    // modelled seafloor uplift 0.5–1.9 m across the 6.9–7.3 magnitude range.
    // Framework citations: Greene, Barrie & Todd 2018 (fault geometry, 55 km
    // minimum primary-strand length) and Nemati et al. 2023 (peer-reviewed
    // tsunami modeling paper citing Caston 2021, validating acceptance into
    // primary literature). See docs/citation-audit-log.md Entry 68 sub-ii close.
    probability50yr: 0.10,
    recoveryQuarters: 6,
    tsunami: { sanJuan: 0.4, juanDeFuca: 0.1 },
    landslide: { sanJuan: 0.5, whidbey: 0.1 },
    liquefaction: { sanJuan: 0.3 },
    subsidence: 0.2,
    shaking: 0.5,
    localBasins: ['sj_haro', 'sj_rosario'],
    tribalImpact: ['Lummi', 'Samish', 'Swinomish'],
  },
  devils_mountain_fault: {
    l: "Devils Mountain Fault M7.4–7.5", ic: "⚡", c: "#C0392B", pk: 0.7, dur: 1.5, dc: 0.18,
    magnitudeRange: [7.4, 7.5],
    description: "Active upper-plate fault from Whidbey Island toward San Juan Islands — broader damage zone than Skipjack",
    // Darrington–Devils Mountain Fault Zone scenario magnitude.
    // Path 0 terminal per Amendment 6 §5.24 (Chain B Session 2i Entry 69 sub-ii).
    // Range [7.4, 7.5] is paper-direct from two government-agency sources:
    // lower bound 7.4 from WA DNR/FEMA 2013 (western-section 80 km scenario,
    // full HAZUS modeling); upper bound 7.5 from Johnson et al. 2001 USGS
    // Prof Paper 1643 (full-length 125 km rupture via Wells & Coppersmith 1994
    // magnitude-length scaling). Framework citation: Barrie & Greene 2018
    // (peer-reviewed, "magnitude 7.5 or greater" DMFZ floor — 'or greater'
    // acknowledged but not encoded in schema-level range). Range-primary
    // data model per CLAUDE.md earthquake-magnitude convention; no scalar
    // field. See docs/citation-audit-log.md Entry 69 sub-ii close.
    probability50yr: 0.08,
    recoveryQuarters: 8,
    tsunami: { sanJuan: 0.2, whidbey: 0.3 },
    landslide: { sanJuan: 0.4, whidbey: 0.6, georgia: 0.2 },
    liquefaction: { whidbey: 0.4, sanJuan: 0.2 },
    subsidence: 0.3,
    shaking: 0.6,
    localBasins: ['sj_haro', 'sj_rosario', 'whidbey_north', 'whidbey_central'],
    tribalImpact: ['Lummi', 'Samish', 'Swinomish', 'Upper Skagit', 'Sauk-Suiattle'],
  },

  // ── DILBIT SPILL (Greene & Aschoff 2023) ──
  dilbit_spill: {
    l: "Dilbit tanker spill", ic: "●", c: "#1C1C1C", pk: 0.9, dur: 8, dc: 0.05,
    description: "Diluted bitumen spill from Trans Mountain tanker in San Juan Archipelago — sinkable oil reaches seafloor",
    // Greene & Aschoff 2023, Oil spill assessment maps of the central Salish Sea, Continental Shelf Research
    // Dilbit is denser than conventional crude, sinks within hours especially with sediment interaction
    recoveryQuarters: 40, // 5-20 years for benthic habitats
    localBasins: ['sj_haro', 'sj_rosario', 'whidbey_north'],
    tribalImpact: ['Lummi', 'Samish', 'Swinomish'],
    effects: {
      dilbitSpill: 0.8, // benthic smothering intensity
      oilSpill: 0.9, // conventional surface oil spill effects too
    },
    // Benthic-specific impacts
    sandWaveDamage: 0.6,     // sand wave fields smothered
    rockyReefDamage: 0.4,    // rocky reef organisms suffocated
    eelgrassBurial: 0.5,     // eelgrass buried by sinking oil
    shellfishContam: 0.7,    // shellfish beds contaminated
    // Economic impacts
    fisheryClosure: { tribal: 0.9, commercial: 0.8 },
    tourismCollapse: 0.7,
    cleanupCost: 2000, // $M
  },

  // Legacy "earthquake" alias deleted in earthquake-range migration commit;
  // synthetic shocks.earthquake key is still set by useSimulation.js when a
  // real earthquake subtype triggers (engine-internal generic-shock signal),
  // and engine consumers (chokepoint, computeFraser, computeInfrastructure,
  // computePSWatersheds, computePublicHealth) read shocks.earthquake as a
  // numeric scalar — none of them index DIS by 'earthquake'. The UI shock
  // indicator at SalishSeaCousin.jsx filters non-DIS keys via DIS[k] guard.
  tsunami: { l: "Tsunami", ic: "\u{1F30A}", c: "#1A5276", pk: 0.9, dur: 0.5, dc: 0.4 },
  oilSpill: { l: "Oil spill", ic: "\u25CF", c: "#444441", pk: 0.9, dur: 3, dc: 0.12 },
  storm: { l: "Extreme storm", ic: "\u2248", c: "#185FA5", pk: 1, dur: 0.25, dc: 0.5 },
  atmosphericRiver: { l: "Atmospheric river", ic: "\u{1F327}", c: "#2874A6", pk: 0.85, dur: 0.5, dc: 0.35 },
  volcano: { l: "Volcanic eruption", ic: "\u{1F30B}", c: "#922B21", pk: 0.9, dur: 4, dc: 0.08, _hidden: true },
  rainier_lahar: {
    l: "Rainier Lahar", ic: "\u{1F30B}", c: "#8B4513", pk: 0.9, dur: 6, dc: 0.06,
    description: "Massive lahar down Puyallup/Duwamish valleys",
    sediment: { mainBasin: 100, southSound: 60 },
    portDamage: 0.6,
    salmonHabitatLoss: { chinook: 0.40, coho: 0.30 },
    contamination: 0.3,
    populationDisplacement: 100000,
    recoveryQuarters: 40,
  },
  baker_eruption: {
    l: "Baker Eruption", ic: "\u{1F30B}", c: "#A93226", pk: 0.8, dur: 4, dc: 0.08,
    description: "Mount Baker eruption with acid drainage",
    sediment: { georgia: 40, whidbey: 15 },
    salmonHabitatLoss: { pink: 0.20, chinook: 0.10 },
    phDepression: 0.15,
    recoveryQuarters: 12,
  },
  glacier_peak_ashfall: {
    l: "Glacier Peak Ash", ic: "\u{1F30B}", c: "#7B7D7D", pk: 0.7, dur: 1, dc: 0.30,
    description: "Major ashfall across Salish Sea",
    lightReduction: 0.30,
    turbidityAll: 10,
    phDepressionAll: 0.05,
    airQualityReduction: 0.4,
    productionReduction: 0.20,
    recoveryQuarters: 2,
  },
  thwaites_collapse: {
    l: "Thwaites Collapse", ic: "\u{1F9CA}", c: "#1A5276", pk: 1.0, dur: 999, dc: 0,
    category: "tipping_point",
    description: "West Antarctic ice shelf collapse permanently accelerates sea level rise",
    effects: { slrScenarioOverride: 3, ensoBoost: 0.3 },
    recoveryQuarters: 999,
  },
  wildfire: { l: "Wildfire", ic: "\u25B2", c: "#D85A30", pk: 0.8, dur: 1, dc: 0.06 },
  // ── GRID THREATS ──
  grid_physical_attack: {
    l: "Grid physical attack", ic: "\u{1F4A5}", c: "#8B0000", pk: 0.7, dur: 1, dc: 0.20,
    description: "Physical attack on substations or transmission lines",
    recoveryQuarters: 4,
    effects: { physicalAttack: 0.7 },
  },
  grid_cyber_attack: {
    l: "Grid cyber attack", ic: "\u{1F4BB}", c: "#2C3E50", pk: 0.8, dur: 0.5, dc: 0.30,
    description: "Coordinated cyberattack on SCADA/grid control systems",
    recoveryQuarters: 2,
    effects: { cyberAttack: 0.8 },
  },
  grid_solar_storm: {
    l: "Solar storm (Carrington)", ic: "\u2600", c: "#FF8C00", pk: 0.9, dur: 2, dc: 0.10,
    description: "Severe geomagnetic storm inducing GIC in transmission lines",
    recoveryQuarters: 8,
    effects: { solarStorm: 0.9 },
  },
  grid_emp: {
    l: "EMP event", ic: "\u26A1", c: "#4A0080", pk: 1.0, dur: 3, dc: 0.08,
    description: "Electromagnetic pulse damaging grid electronics",
    recoveryQuarters: 12,
    effects: { emp: 1.0 },
  },
  // ── CASCADIA M9 FULL SCENARIO ──
  // The definitive event. See src/engine/cascadiaEvent.js for detailed simulation.
  // Probability: ~10-15% in 50 years (0.002-0.003/year). Last event: Jan 26, 1700.
  // Source: USGS, Atwater et al. 2005, FEMA Cascadia Rising 2016
  cascadia_m9: {
    l: "Cascadia M8.7–9.2 Full Scenario", ic: "\u26A1", c: "#8B0000", pk: 1.0, dur: 3, dc: 0.10,
    magnitudeRange: [8.7, 9.2],
    description: "Full CSZ megathrust rupture with tsunami, liquefaction, Fraser Delta collapse, and multi-decade recovery",
    // Cascadia full-margin megathrust — detailed simulation entry.
    // magnitudeRange [8.7, 9.2] shares cascadia_megathrust's paper-direct
    // attribution to Satake, Wang & Atwater 2003 (JGR 108(B11):2535,
    // doi:10.1029/2003JB002521); same physical event, different simulation
    // depth. cascadia_megathrust is the simplified-trigger entry (toolbar/quick
    // scenario); cascadia_m9 is the definitive simulation per the existing
    // header comment (see src/engine/cascadiaEvent.js for phase-by-phase
    // detail). Both entries co-encode the 1700-class full-margin CSZ rupture
    // and share the [8.7, 9.2] range honestly to the literature. Range-primary
    // representation per CLAUDE.md convention; prior scalar magnitude=9.0
    // (model-construction selection) removed in this migration commit.
    probability50yr: 0.12,
    recoveryQuarters: 80,  // 20 years for full environmental recovery
    // Phase-by-phase effects (detailed in cascadiaEvent.js)
    phases: {
      shaking: { duration: '3-5 minutes', pgaRange: '0.15-0.5g by sub-basin' },
      liquefaction: { duration: '0-10 minutes', worstAreas: 'Duwamish/SODO, Commencement Bay, Fraser Delta, Olympia' },
      externalTsunami: { arrival: '15-45 minutes', heightRange: '0.3-7.5m by sub-basin' },
      deltaLandslideTsunami: { arrival: '5-30 minutes', heightRange: '1.5-12m in Georgia Strait' },
      infrastructureDestruction: { duration: 'hours', systems: 'all' },
      environmentalDamage: { duration: 'days-years', contaminants: 'Superfund disturbance, refinery fires, sewage' },
    },
    // Sub-basin specific effects (simplified — cascadiaEvent.js has full detail)
    tsunami: { juanDeFuca: 0.9, georgia: 0.8, sanJuan: 0.4, mainBasin: 0.3, southSound: 0.2, hoodCanal: 0.1, whidbey: 0.2 },
    landslide: { mainBasin: 0.8, georgia: 0.7, whidbey: 0.5, southSound: 0.5, hoodCanal: 0.3, sanJuan: 0.2, juanDeFuca: 0.4 },
    liquefaction: { mainBasin: 0.85, georgia: 0.80, southSound: 0.50, whidbey: 0.30 },
    subsidence: 1.5,
    shaking: 1.0,
    // Recovery
    recoveryTrajectory: {
      infrastructure: '5-10 years',
      environmental: '10-20 years',
      economic: '3-7 years',
      population: '2-5 years',
    },
    // Human toll (context only — presented soberly, not gamified)
    humanImpact: {
      casualties: '10,000-30,000 across OR/WA/BC',
      displaced: '1-3 million',
      economicDamage: '$100-200 billion',
      source: 'FEMA Cascadia Rising 2016, CREW',
    },
    triggersFraserDeltaCollapse: true,
    affectsAllSubBasins: true,
  },

  // ── FRASER DELTA GEOHAZARDS ──
  // Lintern et al. (NRCan/ONC Delta Dynamics Lab), Rabinovich et al. 2003
  fraser_turbidity_current: {
    l: "Fraser Delta Turbidity Current", ic: "\uD83C\uDF0A", c: "#5D6D7E", pk: 0.4, dur: 1, dc: 0.25,
    description: "Submarine debris flow on Fraser Delta foreslope — cable damage, turbidity pulse in Georgia Strait",
    // Occurs several times per year during freshet, usually small
    // Citation: Hart et al. 1992, Lintern et al. NRCan
    sediment: { georgia: 20 }, // turbidity pulse
    cableDamageProb: 0.3, // probability of submarine cable damage
    recoveryQuarters: 2,
    effects: { deltaTC: 0.4 },
  },
  fraser_delta_collapse: {
    l: "Fraser Delta Slope Failure", ic: "\uD83C\uDF0A", c: "#1A5276", pk: 0.9, dur: 4, dc: 0.08,
    description: "Catastrophic slope failure of Fraser Delta foreslope — tsunami in Georgia Strait, Deltaport/ferry damage",
    // Very rare: ~0.1-0.5%/yr. Triggered by earthquake + high sediment loading.
    // Citation: Rabinovich et al. 2003 (tsunami 4-18m on Gulf Islands),
    // Christian et al. 1997 (slope stability), McKenna et al. 1992 (failure volumes)
    tsunami: { georgia: 0.7, sanjuan: 0.4, juanDeFuca: 0.1 }, // Georgia gets worst waves
    sediment: { georgia: 100 }, // massive turbidity pulse
    portDamage: 0.8, // Deltaport/Roberts Bank severely damaged
    ferryDamage: 0.9, // Tsawwassen terminal damaged/destroyed
    cableSeverance: 0.8, // submarine cables to VI severed
    recoveryQuarters: 20, // 5 years for infrastructure, decades for delta morphology
    effects: { deltaCollapse: 0.9, tsunami: 0.7 },
  },
};

export { DIS };
