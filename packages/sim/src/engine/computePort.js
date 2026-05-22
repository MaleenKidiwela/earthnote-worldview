import { cl, seas } from './utils.js';

// ═══════════════════════════════════════════════════════════
// 6 INDEPENDENT PORTS — Salish Sea Digital Cousin
// ═══════════════════════════════════════════════════════════
// Each port is computed independently with its own throughput, cruise calls,
// shore power, and vessel characteristics. Per-port results are aggregated
// by basin for marine noise coupling and into region-wide totals for
// backward compatibility with existing consumers.

var PORTS = {
  seattle: {
    id: 'seattle', name: 'Seattle', basin: 'mainBasin',
    baseTEU: 1500000,   // TEU/yr — NWSA 2024 Annual Trade Report (Seattle terminal share of 3.3M combined)
    baseCruise: 290,     // calls/yr — Port of Seattle 2025 (record 1.35M passengers, 5,120 jobs, $1.2B output)
    baseJobs: 23400,     // direct + induced jobs — Martin Associates 2023 Port Economic Impact Study (NWSA combined: 52,100)
    baseRevenue: 6300,   // $M/yr — Martin Associates 2023 (NWSA combined: $14B business output)
    vesselSizeAvg: 80,   // dimensionless vessel size index (relative scale 0-100+) — NWSA 2023 Annual Report
    shorepower: 0.3,     // fraction of berths with shore power (0-1) — Port of Seattle shore power program
    type: 'container_cruise',
    tsunamiExposure: 0.7,  // fractional vulnerability to tsunami (0-1) — sheltered but low-lying; NOAA tsunami inundation maps
    navalFrac: 0           // fraction of port activity that is naval (0-1)
  },
  tacoma: {
    id: 'tacoma', name: 'Tacoma', basin: 'mainBasin',
    baseTEU: 1800000,   // TEU/yr — NWSA 2024 Annual Trade Report (Tacoma terminal share of 3.3M combined)
    baseCruise: 0,       // no cruise terminal
    baseJobs: 28700,     // direct + induced jobs — Martin Associates 2023 (NWSA combined: 52,100)
    baseRevenue: 7700,   // $M/yr — Martin Associates 2023 (NWSA combined: $14B)
    vesselSizeAvg: 100,  // dimensionless vessel size index — largest container ships at Tacoma; NWSA 2023
    shorepower: 0.4,     // fraction of berths with shore power — NWSA shore power expansion
    type: 'container_bulk',
    tsunamiExposure: 0.6,  // fractional vulnerability to tsunami (0-1) — inner sound, moderate exposure; NOAA inundation maps
    navalFrac: 0
  },
  vancouver: {
    id: 'vancouver', name: 'Vancouver', basin: 'georgia',
    baseTEU: 3300000,   // TEU/yr — Vancouver Fraser Port Authority 2024 Annual Statistics (3.3M TEU)
    baseCruise: 330,     // calls/yr — Port of Vancouver 2024 cruise season
    baseJobs: 115300,    // direct + indirect — VFPA 2024 Economic Impact Study
    baseRevenue: 16800,  // $M CAD (~$12.4B USD) — VFPA 2024 ($11.9B GDP contribution)
    vesselSizeAvg: 90,   // dimensionless vessel size index — Port of Vancouver 2023 Statistics
    shorepower: 0.8,     // fraction of berths with shore power — Port of Vancouver ECHO program, leading shore power adoption
    type: 'full_service',
    tsunamiExposure: 0.4,  // fractional vulnerability to tsunami (0-1) — well-sheltered behind Vancouver Island
    navalFrac: 0
  },
  bellingham: {
    id: 'bellingham', name: 'Bellingham', basin: 'georgia',
    baseTEU: 0,          // no container terminal
    baseCruise: 5,       // calls/yr — small seasonal cruise visits
    baseJobs: 6400,      // jobs — Port of Bellingham economic reports
    baseRevenue: 1600,   // $M/yr — Port of Bellingham economic reports
    vesselSizeAvg: 30,   // dimensionless vessel size index — small bulk/fishing vessels
    shorepower: 0.1,     // fraction of berths with shore power — minimal infrastructure
    type: 'bulk_emerging',
    tsunamiExposure: 0.3,  // fractional vulnerability to tsunami (0-1) — sheltered in Bellingham Bay
    navalFrac: 0
  },
  bremerton: {
    id: 'bremerton', name: 'Bremerton', basin: 'mainBasin',
    baseTEU: 0,          // naval base, no commercial container ops
    baseCruise: 0,       // no cruise terminal
    baseJobs: 14500,     // civilian jobs — DOD/PSNS 2024 employment data (Puget Sound Naval Shipyard & IMF)
    baseRevenue: 2400,   // $M/yr — DOD budget for PSNS operations 2024
    vesselSizeAvg: 60,   // dimensionless vessel size index — naval vessel average
    shorepower: 0.2,     // fraction of berths with shore power — DOD shore power installations
    type: 'naval',
    tsunamiExposure: 0.5,  // fractional vulnerability to tsunami (0-1) — moderate, Sinclair Inlet
    navalFrac: 1.0         // fraction of port activity that is naval — 100% military
  },
  victoria: {
    id: 'victoria', name: 'Victoria', basin: 'juanDeFuca',
    baseTEU: 0,          // no container terminal
    baseCruise: 316,     // calls/yr — CLIA 2023 Cruise Industry Report, Victoria cruise stats
    baseJobs: 17960,     // jobs — Greater Victoria Harbour Authority economic reports
    baseRevenue: 1920,   // $M/yr — Greater Victoria economic reports
    vesselSizeAvg: 40,   // dimensionless vessel size index — cruise/ferry average
    shorepower: 0.3,     // fraction of berths with shore power — Victoria cruise terminal
    type: 'cruise_ferry',
    tsunamiExposure: 0.5,  // fractional vulnerability to tsunami (0-1) — exposed to JdF strait tsunami propagation
    navalFrac: 0.15        // fraction of port activity that is naval — CFB Esquimalt nearby
  }
};

var PORT_KEYS = Object.keys(PORTS);

export { PORTS };

export function computePort(P, I, S, yf) {
  var eq = S.earthquake || 0, sp = S.oilSpill || 0, st = S.storm || 0;
  var tsunami = S.tsunami || 0, volcano = S.volcano || 0, atmoRiver = S.atmosphericRiver || 0;

  // ── SHARED PARAMETERS ──
  // Operational capacity: fractional reduction per disaster type (dimensionless multipliers, 0-1)
  var oc = cl(1
    - eq * 0.7          // earthquake reduces port ops by up to 70% — crane/wharf damage; ASCE seismic port vulnerability studies
    - tsunami * 0.8      // tsunami reduces port ops by up to 80% — inundation/debris; NOAA OR&R incident data
    - volcano * 0.3      // volcanic eruption reduces port ops by up to 30% — ashfall/lahar disruption; USGS Cascade volcano hazards
    - atmoRiver * 0.15,  // atmospheric river reduces port ops by up to 15% — flooding/visibility; WA Ecology storm reports
    0.1, 1);
  // Chokepoint risk: probability of navigation chokepoint closure (dimensionless, 0-1)
  var chokepointRisk = cl(
    eq * 0.5             // earthquake: 50% chokepoint risk — channel shoaling/debris; NOAA navigation hazard assessments
    + tsunami * 0.7      // tsunami: 70% chokepoint risk — strongest channel-blocking effect; NOAA OR&R
    + st * 0.3           // storm: 30% chokepoint risk — wind/wave closures; USCG port closure records
    + sp * 0.4,          // oil spill: 40% chokepoint risk — boom/cleanup vessel blockage; WA Ecology Spill Prevention Program
    0, 1);
  // Infrastructure accessibility: when I-5/rail are down, trucks can't reach ports
  var infraAccess = I.infPortAccessibility !== undefined ? I.infPortAccessibility : 1;
  var supplyChainEff = cl(
    (1 - chokepointRisk * 0.6)   // chokepoint risk degrades supply chain by up to 60% — AAPA port statistics
    * infraAccess,
    0.2, 1);  // floor 0.2: some maritime-only access always possible
  var nf = cl(
    (I.navigationConditions || 0.9)
    - st * 0.5           // storm: 50% navigation degradation — USCG vessel traffic service reports
    - tsunami * 0.6      // tsunami: 60% navigation degradation — debris/current hazards; NOAA OR&R
    - atmoRiver * 0.2,   // atmospheric river: 20% navigation degradation — visibility/current; WA Ecology
    0.2, 1);
  var er = 1
    - (I.ecologicalConstraints || 0) * 0.3  // ecological constraints reduce throughput by up to 30% — ESA listing vessel restrictions
    - sp * 0.5;                              // oil spill reduces throughput by 50% — NOAA OR&R incident data

  // ── SHARED POLICY LEVERS ──
  var autoFrac = (P.autonomousVessels || 0) / 100;
  var crewReduction = autoFrac * 0.4;    // autonomous vessels reduce crew need by up to 40% (fraction) — IMO Maritime Autonomous Surface Ships scoping study
  var densityBoost = 1 + autoFrac * 0.15; // autonomous vessels increase effective throughput density by up to 15% (multiplier) — McKinsey autonomous shipping analysis

  var globalSpeedZone = (P.vesselSpeedZone !== undefined ? P.vesselSpeedZone : 0) / 100;
  // 0.5 = max noise reduction from speed-zone policies (fraction).
  //   Combined Path 4 model-construction disclosure for both co-citations
  //   (Veirs et al. 2016; MacGillivray et al. 2019). Veirs et al. 2016
  //   ship-noise framework establishes vessel slowdown as a noise-reduction
  //   pathway with paper-direct ~1 dB/knot reduction; MacGillivray et al.
  //   2019 ECHO program / 11-knot Haro Strait slowdown reports specific dB
  //   source-level reductions for the slowdown cohort (1-2 dB re 1 µPa²
  //   Hz⁻¹ at 20-80 Hz). Specific 0.5 fraction-based reduction on a
  //   dimensionless emission index is a model-construction choice within
  //   the combined Veirs/MacGillivray framework, not paper-direct from
  //   either source. Path 4 per Amendment 6 §5.24(b). See
  //   docs/citation-audit-followups.md sub-12F MacGillivray + §5.5 Veirs
  //   entries for close history.
  var speedNoiseReduction = globalSpeedZone * 0.5;  // speed reduction zones cut noise by up to 50% — Veirs et al. 2016 (ship noise Haro Strait); MacGillivray et al. 2019 (ECHO program Vancouver)
  var speedTransitCost = globalSpeedZone * 0.12;    // speed zones increase transit cost by up to 12% of revenue (fraction) — ECHO program economic analysis, vessel fuel/time tradeoff

  var altFuel = (P.altFuelFraction !== undefined ? P.altFuelFraction : 5) / 100;
  // 0.25 = max emission reduction from alternative fuels (fraction).
  //   Path 4 model-construction disclosure within the IMO 4th GHG Study
  //   2020 alt-fuel pathway framework. IMO framework supports alt-fuel
  //   (LNG/hydrogen/ammonia) emission-reduction pathway qualitatively;
  //   specific 25% magnitude is a model-construction choice, not paper-
  //   direct from the IMO study. Path 4 per Amendment 6 §5.24(b). See
  //   docs/citation-audit-followups.md sub-12E Entry 6 for close history.
  var altFuelEmissionReduction = altFuel * 0.25;  // alternative fuels (LNG/hydrogen/ammonia) reduce emissions by up to 25% (fraction) — IMO 4th GHG Study 2020
  var altFuelAirQualityBonus = altFuel * 0.15;    // alternative fuels improve local air quality index by up to 0.15 (dimensionless) — EPA AP-42 Ch.2 vessel emissions factors

  var ballastTreat = (P.ballastTreatment !== undefined ? P.ballastTreatment : 30) / 100;
  var milFrac = (P.militaryPresence || 40) / 100;

  // ── MACRO ECONOMY COUPLING ──
  // slowSteamFactor: oil price → ship speed reduction → fuel savings + noise reduction.
  // At $100/bbl oil: ships ~9% slower (0.91×). Leaper 2019 (JASA): 1 knot ≈ 1 dB.
  // Applied as throughput penalty (slower ships = fewer rotations/year) and noise benefit.
  var slowSteam = I.slowSteamFactor !== undefined ? I.slowSteamFactor : 1.0;
  var slowSteamTputPenalty = cl((1.0 - slowSteam) * 0.5, 0, 0.10); // max 10% throughput loss
  var slowSteamNoiseReduction = cl((1.0 - slowSteam) * 3.0, 0, 0.30); // max 30% noise reduction
  // electricityPrice: cheap hydro incentivizes shore power adoption (lower operating cost
  // than diesel at berth). At $0.09/kWh (PNW baseline), shore power saves ~$800/day vs
  // marine diesel. At $0.20/kWh, advantage narrows → less voluntary adoption.
  // Source: VFPA ECHO Program 2024, EPA shore power calculator.
  var elecPrice = I.prevElectricityPrice !== undefined ? I.prevElectricityPrice : 0.09;
  var shorePowerIncentive = cl(1.3 - elecPrice * 5.0, 0.5, 1.5); // cheap power = strong incentive
  // Tourism/fisheries coupling: bring in previous-quarter tourism + fisheries employment
  var prevTourEmp = I.prevTourismEmp !== undefined ? I.prevTourismEmp : 12000;
  var prevFishEmp = I.prevFisheriesEmployment !== undefined ? I.prevFisheriesEmployment : 7900;

  // ── TOURISM / WHALE WATCHING / CRUISE (shared across region) ──
  var tourismBase = (P.tourismLevel || 60) / 100;
  var ecoAttract = cl(
    (I.recreationValue !== undefined ? I.recreationValue : 0.5) * 0.5  // recreation value contributes 50% to eco-attraction (weight) — WA Tourism Alliance visitor surveys
    + (I.biogenicMixing !== undefined ? I.biogenicMixing : 0.5) * 0.3, // biogenic mixing (ecosystem health proxy) contributes 30% to eco-attraction (weight) — USFWS wildlife viewing survey
    0, 1);
  var tourismRev = tourismBase * ecoAttract * 800 * oc;    // 800: tourism revenue scaling factor ($M at full tourism + eco-attraction) — WA Tourism Alliance economic impact reports
  var tourismEmp = tourismBase * ecoAttract * 12000 * oc;  // 12000: tourism employment scaling factor (jobs at full tourism + eco-attraction) — WA Tourism Alliance employment data
  // 0.04 tourism-vessel noise scaling is a model-construction choice within
  //   the Veirs et al. 2016 ship-noise framework. Veirs framework supports
  //   recreational-vessel noise contribution qualitatively; specific 0.04
  //   fraction on a dimensionless emission index not paper-direct. Path 4
  //   per Amendment 6 §5.24(b). See docs/citation-audit-followups.md §5.5
  //   Veirs entry for close history.
  var tourismNoise = tourismBase * 0.04;  // tourism vessel noise contribution (dimensionless, 0-1 scale) — Veirs et al. 2016, recreational vessel noise

  var wwIntensity = (P.whaleWatchIntensity !== undefined ? P.whaleWatchIntensity : 50) / 100;
  var orcaPresence = cl((I.recreationValue !== undefined ? I.recreationValue : 0.5) * 1.5, 0, 1);  // 1.5: orca presence amplification factor — PWWA (Pacific Whale Watch Association) sighting data
  var wwDisturbance = wwIntensity * orcaPresence * (1 - (P.orcaProtectionLevel !== undefined ? P.orcaProtectionLevel : 40) / 100 * 0.5);  // 0.5: max disturbance reduction from orca protection rules (fraction) — NOAA vessel distance regulations
  // 0.15 whale-watch-noise scaling is a model-construction choice within
  //   the Veirs et al. 2016 ship-noise framework (extended to small-vessel
  //   noise in Haro Strait). Specific 0.15 fraction on a dimensionless
  //   emission index not paper-direct from Veirs. Path 4 per Amendment 6
  //   §5.24(b). See docs/citation-audit-followups.md §5.5 Veirs entry.
  var wwNoise = wwDisturbance * 0.15;              // 0.15: whale watch noise contribution scaling (dimensionless, 0-1 scale) — Veirs et al. 2016, small vessel noise in Haro Strait
  var wwRevenue = wwIntensity * orcaPresence * 120 * oc;   // 120: whale watching revenue scaling ($M at full intensity + orca presence) — PWWA 2024 economic data ($217M industry scaled)
  var wwEmployment = wwIntensity * orcaPresence * 2000 * oc; // 2000: whale watching employment scaling (jobs at full intensity + orca presence) — PWWA 2024, ~2000 FTE in PNW whale watch industry

  // ── COMPUTE EACH PORT ──
  var portResults = {};
  var totalVessels = 0;
  var totalPortJobs = 0;
  var totalPortRev = 0;
  var totalPortEmissions = 0;
  var totalPortBallast = 0;
  var totalPortDredging = 0;

  // Aggregate region TEU from per-port throughputs for backward compat
  var regionTEU = P.containerThroughput * seas(yf, 0.95, 1.05);

  // Per-port throughput multipliers (from params, default 100 = baseline)
  var seattleTput = (P.seattleThroughput !== undefined ? P.seattleThroughput : 100) / 100;
  var tacomaTput = (P.tacomaThroughput !== undefined ? P.tacomaThroughput : 100) / 100;
  var vancouverTput = (P.vancouverThroughput !== undefined ? P.vancouverThroughput : 100) / 100;
  var bellGrowth = (P.bellinghamGrowthRate !== undefined ? P.bellinghamGrowthRate : 15) / 100;
  var bremNaval = (P.bremertonNavalActivity !== undefined ? P.bremertonNavalActivity : 70) / 100;

  // Per-port cruise calls (param overrides)
  var seaCruise = P.seattleCruiseCalls !== undefined ? P.seattleCruiseCalls : 275;
  var vanCruise = P.vancouverCruiseCalls !== undefined ? P.vancouverCruiseCalls : 327;
  var vicCruise = P.victoriaCruiseCalls !== undefined ? P.victoriaCruiseCalls : 316;

  // Per-port shorepower (param overrides)
  var seaShore = (P.seattleShorepower !== undefined ? P.seattleShorepower : 30) / 100;
  var tacShore = (P.tacomaShorepower !== undefined ? P.tacomaShorepower : 40) / 100;
  var vanShore = (P.vancouverShorepower !== undefined ? P.vancouverShorepower : 80) / 100;

  // Per-port speed
  var seaSpeed = (P.seattleVesselSpeed !== undefined ? P.seattleVesselSpeed : 50) / 100;
  var tacSpeed = (P.tacomaVesselSpeed !== undefined ? P.tacomaVesselSpeed : 50) / 100;
  var vanSpeed = (P.vancouverVesselSpeed !== undefined ? P.vancouverVesselSpeed : 50) / 100;

  // Environmental levy
  var levyRate = (P.environmentalLevyRate !== undefined ? P.environmentalLevyRate : 0) / 100;

  // Cruise season: Gaussian centered at mid-year (yf=0.5), width ~0.25 yr (dimensionless, 0-1)
  // Peak summer season (May-Sep) — CLIA 2023 Cruise Industry Report
  var cruiseSeason = Math.exp(-Math.pow((yf - 0.5) * 4, 2));  // 4: inverse half-width of cruise season in year-fractions (~3 months FWHM)

  // TEU distribution: scale per-port base TEU so they sum close to regionTEU at baseline
  // At baseline: regionTEU = 3500 * seas(yf, 0.95, 1.05) ~= 3500
  // Port base TEUs are in absolute units (millions); we normalize to the param-scale TEU
  // The old model treated containerThroughput as ~3500 TEU (actually thousands).
  // Sum of baseTEU: 1.5M + 1.84M + 3.47M = 6.81M. We don't try to map these directly;
  // instead we use the existing regionTEU and split it proportionally, then per-port multipliers adjust.
  var teuWeights = {
    seattle: 0.22 * seattleTput,   // 22% of regional TEU share — NWSA 2023 Annual Report (~770 of 3500)
    tacoma: 0.27 * tacomaTput,     // 27% of regional TEU share — NWSA 2023 Annual Report (~945 of 3500)
    vancouver: 0.51 * vancouverTput // 51% of regional TEU share — Port of Vancouver 2023 Statistics (~1785 of 3500)
  };
  var teuTotal = teuWeights.seattle + teuWeights.tacoma + teuWeights.vancouver;

  for (var pi = 0; pi < PORT_KEYS.length; pi++) {
    var pk = PORT_KEYS[pi];
    var portDef = PORTS[pk];
    var portTEU = 0;
    var portCruise = 0;
    var portShore = portDef.shorepower;
    var portSpeed = globalSpeedZone;
    var portNaval = 0;

    // Assign per-port TEU from region total
    if (pk === 'seattle') {
      portTEU = regionTEU * (teuWeights.seattle / Math.max(teuTotal, 0.01));
      portCruise = seaCruise;
      portShore = seaShore;
      portSpeed = seaSpeed;
    } else if (pk === 'tacoma') {
      portTEU = regionTEU * (teuWeights.tacoma / Math.max(teuTotal, 0.01));
      portCruise = 0;
      portShore = tacShore;
      portSpeed = tacSpeed;
    } else if (pk === 'vancouver') {
      portTEU = regionTEU * (teuWeights.vancouver / Math.max(teuTotal, 0.01));
      portCruise = vanCruise;
      portShore = vanShore;
      portSpeed = vanSpeed;
    } else if (pk === 'bellingham') {
      portTEU = bellGrowth * 50;  // 50: emerging TEU base (TEU per 1% growth rate) — TODO-CITE: Bellingham port growth projection — source needed
      portCruise = 5;             // 5 cruise calls/yr — small seasonal visits
      portShore = 0.1;            // 10% shore power fraction — minimal infrastructure
    } else if (pk === 'bremerton') {
      portTEU = 0;
      portCruise = 0;
      portShore = 0.2;            // 20% shore power fraction — DOD shore power installations at PSNS
      portNaval = bremNaval;
    } else if (pk === 'victoria') {
      portTEU = 0;
      portCruise = vicCruise;
      portShore = 0.3;            // 30% shore power fraction — Victoria cruise terminal shore power
    }

    // Vessel traffic for this port
    var pTsunamiMult = cl(1 - tsunami * portDef.tsunamiExposure, 0.1, 1);
    var pOc = oc * pTsunamiMult;

    // Container vessels: TEU-to-vessel conversion
    // slowSteamTputPenalty: high oil → slower ships → fewer annual rotations per vessel
    var containerVessels = (portTEU / 150)   // 150: TEU per vessel-transit (avg container ship carries ~150 TEU per port call in model units) — NWSA 2023 Annual Report vessel call data
      * nf * er * pOc * supplyChainEff * densityBoost * (1 - slowSteamTputPenalty);

    // Cruise vessel equivalents (seasonal)
    var cruiseNorm = portCruise / 300;  // 300: normalization base for cruise calls (calls/yr) — CLIA 2023, typical major PNW port ~300 calls/yr
    var activeCruiseP = cruiseNorm * cruiseSeason;
    var cruiseVessels = activeCruiseP * 2; // 2: cruise ship vessel-equivalents — cruise ships displace ~2x a typical cargo vessel; IMO vessel size classifications

    // Naval vessel equivalents
    var navalVessels = portNaval * portDef.navalFrac * 3  // 3: naval vessel-equivalents — warships (carriers, destroyers) ~3x traffic impact of cargo vessel; DOD budget reports
      * pOc;

    // Bulk/other vessels (small ports without TEU still have some traffic)
    var bulkVessels = 0;
    if (pk === 'bellingham') bulkVessels = bellGrowth * 2 * pOc;  // 2: bulk vessel scaling (vessels per 1% growth rate) — Port of Bellingham traffic records
    if (pk === 'victoria') bulkVessels = 1.5 * pOc;  // 1.5: baseline ferry terminal traffic (vessel-equivalents/quarter) — BC Ferries Swartz Bay terminal data

    var portVessels = containerVessels + cruiseVessels + navalVessels + bulkVessels;

    // Revenue
    var pRevContainer = portTEU * 0.5       // 0.5: revenue per TEU ($500/TEU in model $M scaling) — Martin Associates 2018 Port Economic Impact Study
      * pOc * supplyChainEff;
    var pRevCruise = activeCruiseP * 200    // 200: revenue per normalized cruise call ($M) — CLIA 2023 Cruise Industry Report, port spending per call
      * pOc;
    var pRevNaval = portNaval * portDef.navalFrac * 1400  // 1400: military revenue scaling ($M at full naval fraction) — DOD budget reports, PSNS annual economic impact
      * pOc;
    var pRevBulk = bulkVessels * 80         // 80: revenue per bulk vessel ($M per vessel-equivalent) — AAPA port statistics, bulk cargo revenue
      * pOc;
    var pRev = pRevContainer + pRevCruise + pRevNaval + pRevBulk;

    // Jobs
    var pJobsContainer = portTEU * 8        // 8: jobs per TEU (direct + induced employment per TEU in model units) — Martin Associates 2018 Port Economic Impact Study
      * (1 - crewReduction) * pOc * supplyChainEff;
    var pJobsCruise = activeCruiseP * 3000  // 3000: jobs per normalized cruise call — CLIA 2023, cruise port employment (stevedores, provisioning, tourism)
      * pOc;
    var pJobsNaval = portNaval * portDef.navalFrac * 10000  // 10000: naval employment scaling (jobs at full naval activity) — Puget Sound Naval Shipyard employment data
      * pOc;
    var pJobsBulk = bulkVessels * 200       // 200: jobs per bulk vessel-equivalent — AAPA port statistics, bulk terminal employment
      * pOc;
    var pJobs = pJobsContainer + pJobsCruise + pJobsNaval + pJobsBulk;

    // Noise per frequency band.
    // The 1.2 / 0.5 dB-proxy scalings on vessel-transit and vessel-size, and
    //   the /150 normalization divisor, are model-construction choices within
    //   the Veirs et al. 2016 ship-noise framework. Veirs framework is
    //   paper-direct for 12-band 1/3-octave spectra and 173 dB SL @ 1m
    //   source levels (preserved at acousticMasking.js); these dimensionless
    //   per-vessel proxy scalars are not paper-direct from Veirs at the
    //   claimed specificity. Path 4 per Amendment 6 §5.24(b). See
    //   docs/citation-audit-followups.md §5.5 Veirs entry.
    var pUn = portVessels * 1.2             // 1.2: noise contribution per vessel-transit (dB-proxy scaling, dimensionless) — Veirs et al. 2016 (ship noise Haro Strait)
      + portDef.vesselSizeAvg * 0.5;        // 0.5: noise contribution per unit vessel size (dB-proxy scaling, dimensionless) — Veirs et al. 2016, larger vessels are louder
    var pBaseShipNoise = cl(pUn / 150, 0, 1); // 150: noise normalization divisor (dimensionless, maps raw noise to 0-1 scale) — calibrated to Veirs et al. 2016 median broadband levels
    // shorePowerIncentive: cheap electricity makes shore power adoption more attractive
    // 0.4 max shore-power-noise-reduction and 0.06 cruise-noise-per-call are
    //   model-construction fractions within the MacGillivray et al. 2019
    //   ECHO program / 11-knot Haro Strait slowdown framework. The paper
    //   reports specific dB source-level reductions for the slowdown cohort,
    //   not fraction-based reductions on dimensionless emission indices.
    //   Path 4 per Amendment 6 §5.24(b). See docs/citation-audit-followups.md
    //   sub-12F MacGillivray entry.
    var pShorePower = cl(portShore * shorePowerIncentive, 0, 1) * 0.4;      // 0.4: max noise reduction from shore power (fraction) — MacGillivray et al. 2019 (ECHO program)
    // slowSteamNoiseReduction: oil price → slow steaming → quieter ships (additive to policy speed zones)
    var pSpeedReduct = cl(portSpeed * 0.5 + slowSteamNoiseReduction, 0, 0.6);     // 0.5: max policy noise reduction + economic slow steam bonus — Veirs et al. 2016
    var pCruiseNoise = activeCruiseP * 0.06; // 0.06: cruise ship noise contribution per normalized call (dimensionless, 0-1 scale) — MacGillivray et al. 2019 (ECHO program)
    var pMilNoise = portNaval * portDef.navalFrac * 0.06; // 0.06: military vessel noise contribution (dimensionless, 0-1 scale) — Veirs et al. 2016, naval vessel noise signatures

    // Frequency band weights — Veirs et al. 2016: ship noise energy distribution across bands
    var pNoiseLow = cl(
      (pBaseShipNoise * 0.8    // 0.8: low-freq weight for ship noise — bulk of propulsion/cavitation energy is below 1 kHz; Veirs et al. 2016
      + pCruiseNoise * 0.7     // 0.7: low-freq weight for cruise noise — large slow-speed diesels concentrate energy <1 kHz
      + pMilNoise * 0.5)       // 0.5: low-freq weight for military noise — more distributed spectrum than commercial
      * (1 - pShorePower)
      * (1 - pSpeedReduct * 1.2), // 1.2: speed reduction is most effective at low frequencies (20% bonus) — Veirs et al. 2016
      0, 1);
    var pNoiseMid = cl(
      (pBaseShipNoise * 0.5    // 0.5: mid-freq weight for ship noise — moderate energy in 1-10 kHz band; Veirs et al. 2016
      + pCruiseNoise * 0.3)    // 0.3: mid-freq weight for cruise noise — less mid-freq energy
      * (1 - pShorePower)
      * (1 - pSpeedReduct * 0.8), // 0.8: speed reduction is moderately effective at mid frequencies (80% of low-freq benefit)
      0, 1);
    var pNoiseHigh = cl(
      (pMilNoise * 0.7         // 0.7: high-freq weight for military noise — sonar/electronics dominate >10 kHz; most harmful to harbor porpoise
      + pBaseShipNoise * 0.2)  // 0.2: high-freq weight for ship noise — little energy above 10 kHz; Veirs et al. 2016
      * (1 - pShorePower)
      * (1 - pSpeedReduct * 0.5), // 0.5: speed reduction is least effective at high frequencies (50% of low-freq benefit)
      0, 1);
    var pNoiseAgg = cl((pNoiseLow + pNoiseMid + pNoiseHigh) / 3, 0, 1);  // simple mean across 3 frequency bands

    // Emissions (dimensionless index, 0-1).
    // 0.08 per-voyage and 0.003 per-vessel-size emission indices are model-
    //   construction choices within the IMO 4th GHG Study 2020 framework.
    //   IMO framework supports per-voyage CO2-equivalent emission factors
    //   qualitatively; specific 0.08 / 0.003 magnitudes on a dimensionless
    //   emission index not paper-direct at this specificity. Path 4 per
    //   Amendment 6 §5.24(b). See docs/citation-audit-followups.md sub-12E
    //   Entry 6 for close history.
    var pEmissions = cl(
      (portVessels * 0.08      // 0.08: emission index per vessel-transit (dimensionless) — IMO 4th GHG Study 2020, per-voyage CO2 equivalent
      + portDef.vesselSizeAvg * 0.003)  // 0.003: emission index per unit vessel size (dimensionless) — IMO 4th GHG Study 2020, larger vessels have higher absolute emissions
      * (1 - pShorePower) * (1 - altFuelEmissionReduction)
      + activeCruiseP * 0.08,  // 0.08: cruise ship emission contribution per normalized call (dimensionless) — EPA AP-42 Ch.2, cruise ship stack emissions
      0, 1);

    // Dredging (only major container ports)
    var pDredge = 0;
    if (pk === 'seattle' || pk === 'tacoma' || pk === 'vancouver') {
      pDredge = (P.dredgingIntensity || 30)
        * 333                  // 333: dredging cost per unit intensity ($K) — USACE dredging contract costs, PNW navigation channels
        + (I.channelSedimentation || 0)
        * 67;                  // 67: sedimentation-driven dredging cost ($K per unit sedimentation index) — USACE maintenance dredging records
    }

    // Ballast water volume
    var pBallast = portVessels * portDef.vesselSizeAvg
      * 50;                    // 50: ballast water volume per unit vessel-size (gallons per vessel-size unit) — Smithsonian Environmental Research Center ballast water studies

    // Cruise wastewater discharge
    var pCruiseWW = activeCruiseP
      * 600000;                // 600,000: gallons of wastewater per normalized cruise call — CLIA 2023 Cruise Industry Report, avg cruise ship generates ~150,000-250,000 gal/day, ~3-4 day port visits

    // Oil spill risk (dimensionless probability index, 0-1)
    var pOSR = cl(
      portVessels * 0.01       // 0.01: spill probability per vessel-transit — NOAA OR&R incident data, historical spill frequency per vessel movement
      + portDef.vesselSizeAvg * 0.001  // 0.001: spill probability per unit vessel size — larger vessels carry more fuel/cargo; WA Ecology Spill Prevention Program
      + sp * 0.8               // 0.8: existing spill event amplifies risk by 80% — cascading spill effects; NOAA OR&R
      + tsunami * 0.3,        // 0.3: tsunami adds 30% spill risk — infrastructure damage releases stored fuel; NOAA OR&R
      0, 1);

    // Invasive species introduction pressure (dimensionless, 0-1)
    var pInvasive = cl(
      portVessels * 0.015      // 0.015: invasive species introduction probability per vessel-transit — Smithsonian Environmental Research Center ballast water studies
      * (1 - ballastTreat * 0.85),  // 0.85: max ballast treatment effectiveness (fraction) — Smithsonian SERC, modern UV/filtration systems ~85% effective
      0, 1);

    portResults[pk] = {
      id: pk,
      name: portDef.name,
      basin: portDef.basin,
      type: portDef.type,
      teu: portTEU,
      vessels: portVessels,
      jobs: pJobs,
      revenue: pRev,
      cruiseCalls: portCruise,
      activeCruise: activeCruiseP,
      shorepower: portShore,
      noiseLow: pNoiseLow,
      noiseMid: pNoiseMid,
      noiseHigh: pNoiseHigh,
      noiseAggregate: pNoiseAgg,
      emissions: pEmissions,
      dredging: pDredge,
      ballast: pBallast,
      cruiseWastewater: pCruiseWW,
      oilSpillRisk: pOSR,
      invasivePressure: pInvasive,
      opCap: pOc
    };

    totalVessels += portVessels;
    totalPortJobs += pJobs;
    totalPortRev += pRev;
    totalPortEmissions += pEmissions;
    totalPortBallast += pBallast;
    totalPortDredging += pDredge;
  }

  // ── AGGREGATE BY BASIN ──
  var basinNoise = {};
  var basinTraffic = {};
  for (var bi = 0; bi < PORT_KEYS.length; bi++) {
    var bpk = PORT_KEYS[bi];
    var bport = portResults[bpk];
    var basin = PORTS[bpk].basin;
    if (!basinNoise[basin]) {
      basinNoise[basin] = { low: 0, mid: 0, high: 0, impulse: 0, aggregate: 0 };
    }
    if (!basinTraffic[basin]) basinTraffic[basin] = 0;
    basinNoise[basin].low += bport.noiseLow;
    basinNoise[basin].mid += bport.noiseMid;
    basinNoise[basin].high += bport.noiseHigh;
    basinNoise[basin].aggregate += bport.noiseAggregate;
    basinTraffic[basin] += bport.vessels;
  }

  // ── REGION-WIDE AGGREGATES ──
  // Port container employment comes from per-port sum (totalPortJobs).
  // Fisheries and recreation are region-wide (not per-port).
  var fisheriesEmpAgg = (I.fisheriesYield !== undefined ? I.fisheriesYield : 1000)
    * 2                        // 2: fisheries jobs per unit yield (jobs per fisheries yield unit) — Martin Associates 2018, fishing industry employment multiplier
    * oc;
  var recreationEmpAgg = (I.recreationValue !== undefined ? I.recreationValue : 0.5)
    * 6000                     // 6000: recreation employment scaling (jobs at full recreation value) — WA Tourism Alliance recreation employment data
    * oc;
  var fisheriesRevAgg = (I.fisheriesYield !== undefined ? I.fisheriesYield : 1000)
    * 0.02                     // 0.02: fisheries revenue per unit yield ($M per yield unit) — NOAA Fisheries economics reports, PNW commercial fisheries
    * oc;
  var recreationRevAgg = (I.recreationValue !== undefined ? I.recreationValue : 0.5)
    * 120                      // 120: recreation revenue scaling ($M at full recreation value) — WA Tourism Alliance economic impact
    * oc;
  var rev = totalPortRev + fisheriesRevAgg + recreationRevAgg;

  // Military (region-wide, not per-port since it spans multiple bases)
  var militaryEmp = milFrac * 25000;   // 25000: total military employment at full presence (jobs) — Puget Sound Naval Shipyard + Joint Base Lewis-McChord employment data
  var militaryRev = milFrac * 3500;    // 3500: total military revenue at full presence ($M/yr) — DOD budget reports, regional military economic impact
  var militaryNoise = milFrac * 0.06;  // 0.06: military noise contribution scaling (dimensionless, 0-1 scale) — Veirs et al. 2016, naval vessel acoustic signatures

  var totalEmp = totalPortJobs + fisheriesEmpAgg + recreationEmpAgg + tourismEmp + militaryEmp + wwEmployment;
  var totalRev = rev + tourismRev + militaryRev + wwRevenue;

  // ── FERRY SYSTEM ──
  var ferrySailingsPerDay = 450          // 450: baseline WSF sailings per day — WSF 2023 Annual Report (~450 sailings/day across 10 routes)
    * oc * cl(1
    - tsunami * 0.8                      // tsunami: 80% ferry disruption — vessel damage/dock destruction; WSF emergency protocols
    - atmoRiver * 0.3,                   // atmospheric river: 30% ferry disruption — high winds/seas; WSF weather suspension records
    0.1, 1);
  var ferryNoise = cl(ferrySailingsPerDay / 500  // 500: ferry noise normalization (sailings/day) — calibrated so baseline ~450 sailings yields ~0.13 noise index
    * 0.15,                              // 0.15: ferry fleet noise scaling (dimensionless) — Veirs et al. 2016, WSF vessel noise signatures (diesel-electric propulsion)
    0, 0.2);                             // cap at 0.2 — ferries are lower-noise than cargo ships
  var ferryEmissions = cl(ferrySailingsPerDay
    * 0.0004                             // 0.0004: emission index per ferry sailing (dimensionless) — EPA AP-42, WSF fleet diesel emissions per crossing
    * (1 - P.shorepower / 100 * 0.2),   // 0.2: max emission reduction from ferry shore power (fraction) — WSF electrification program
    0, 0.3);
  var ferryEmployment = ferrySailingsPerDay * 3;  // 3: crew/support jobs per daily sailing — WSF 2023 Annual Report (~1350 FTE for ~450 sailings/day)

  // ── AGGREGATE VESSEL DENSITY (backward compat: ships per day) ──
  // Old model: vd = (teu/150)*nf*er*oc*supplyChainEff*densityBoost
  // To maintain calibration at ~22 transits/day, use the same formula
  var vd = (regionTEU / 150) * nf * er * oc * supplyChainEff * densityBoost;  // 150: TEU per vessel-transit — same as per-port calculation

  // ── AGGREGATE NOISE (backward compat) ──
  var un = 120                           // 120: ambient underwater noise baseline (dB re 1 μPa proxy) — Veirs et al. 2016, Haro Strait ambient ~120 dB broadband
    + vd * 1.2                           // 1.2: noise per vessel-transit (dB-proxy) — Veirs et al. 2016
    + P.avgVesselSize * 0.5;             // 0.5: noise per unit vessel size (dB-proxy) — Veirs et al. 2016
  // 0.4 max shore-power-noise-reduction (aggregate, backward-compat).
  //   Same Path 4 model-construction disclosure as per-port pShorePower
  //   above — model-construction fraction within MacGillivray et al. 2019
  //   ECHO program framework. Path 4 per Amendment 6 §5.24(b). See
  //   docs/citation-audit-followups.md sub-12F MacGillivray entry.
  var spr = P.shorepower / 100 * 0.4;   // 0.4: max shore power noise reduction (fraction) — MacGillivray et al. 2019 (ECHO program)
  // 0.08 / 0.003 aggregate emission indices: same Path 4 model-construction
  //   disclosure as per-port pEmissions above — model-construction within
  //   IMO 4th GHG Study 2020 framework. Path 4 per Amendment 6 §5.24(b).
  //   See docs/citation-audit-followups.md sub-12E Entry 6.
  var ei = cl(
    (vd * 0.08                           // 0.08: emission index per vessel-transit (dimensionless) — IMO 4th GHG Study 2020
    + P.avgVesselSize * 0.003)           // 0.003: emission index per vessel size unit (dimensionless) — IMO 4th GHG Study 2020
    * (1 - spr) * (1 - altFuelEmissionReduction),
    0, 1);
  var bv = vd * P.avgVesselSize * 50;   // 50: ballast volume per vessel-size unit (gallons) — Smithsonian Environmental Research Center
  var dr = P.dredgingIntensity * 1000    // 1000: dredging cost scaling ($K per intensity unit, aggregate) — USACE dredging contracts
    + (I.channelSedimentation || 0) * 200; // 200: sedimentation dredging cost ($K per sedimentation unit, aggregate) — USACE maintenance records
  var osr = cl(
    vd * 0.01                            // 0.01: spill probability per vessel-transit — NOAA OR&R
    + P.avgVesselSize * 0.001            // 0.001: spill probability per vessel size unit — WA Ecology Spill Prevention Program
    + sp * 0.8                           // 0.8: existing spill amplification — NOAA OR&R
    + tsunami * 0.3,                     // 0.3: tsunami spill risk — NOAA OR&R
    0, 1);

  // Cruise (aggregate, backward compat)
  var cruiseCallsNorm = (P.cruiseShipCalls !== undefined ? P.cruiseShipCalls : 100) / 300;  // 300: cruise call normalization — CLIA 2023
  var activeCruise = cruiseCallsNorm * cruiseSeason;
  // 0.06 cruise-noise per normalized call (aggregate, backward-compat):
  //   same Path 4 model-construction disclosure as per-port pCruiseNoise —
  //   model-construction within MacGillivray et al. 2019 ECHO framework.
  //   Path 4 per Amendment 6 §5.24(b).
  var cruiseNoise = activeCruise * 0.06;     // 0.06: cruise noise per normalized call (dimensionless) — MacGillivray et al. 2019
  var cruiseEmissions = activeCruise * 0.08; // 0.08: cruise emission index per normalized call (dimensionless) — EPA AP-42 Ch.2
  var cruiseRevenue = activeCruise * 200     // 200: cruise revenue per normalized call ($M) — CLIA 2023
    * oc;
  var cruiseEmployment = activeCruise * 3000 // 3000: cruise employment per normalized call (jobs) — CLIA 2023
    * oc;
  var cruiseWastewater = activeCruise * 600000; // 600,000: gallons wastewater per normalized cruise call — CLIA 2023

  // Cruise employment already included in per-port totalPortJobs (pJobsCruise).
  // Cruise revenue already included in per-port totalPortRev (pRevCruise).
  // Only add aggregate-only items that aren't in per-port sums.

  var totalNoise = cl(
    ((un - 120) / 150            // 150: noise normalization (same as per-port) — Veirs et al. 2016
    + ferryNoise + tourismNoise + militaryNoise + wwNoise + cruiseNoise)
    * (1 - speedNoiseReduction),
    0, 1);

  // ── FREQUENCY-DEPENDENT NOISE PROFILE (backward compat) ──
  var baseShipNoise = cl((un - 120) / 150, 0, 1);  // 150: noise normalization — Veirs et al. 2016
  var constructionProxy = cl(dr / 5000, 0, 1);       // 5000: dredging-to-construction noise normalization ($K) — maps dredging cost to impulsive noise index
  // Frequency band weights — same rationale as per-port bands; Veirs et al. 2016
  var noiseLow = cl(
    (baseShipNoise * 0.8        // 0.8: low-freq ship noise weight — propulsion/cavitation energy <1 kHz
    + cruiseNoise * 0.7          // 0.7: low-freq cruise noise weight
    + militaryNoise * 0.5)       // 0.5: low-freq military noise weight
    * (1 - speedNoiseReduction * 1.2),  // 1.2: speed reduction most effective at low freq
    0, 1);
  var noiseMid = cl(
    (baseShipNoise * 0.5        // 0.5: mid-freq ship noise weight — moderate energy 1-10 kHz
    + ferryNoise * 0.8           // 0.8: mid-freq ferry noise weight — diesel-electric propulsion prominent in mid band
    + tourismNoise * 0.6         // 0.6: mid-freq tourism noise weight — small vessel engine noise
    + wwNoise * 0.7)             // 0.7: mid-freq whale watch noise weight — outboard engines in 1-10 kHz range
    * (1 - speedNoiseReduction * 0.8),  // 0.8: speed reduction moderately effective at mid freq
    0, 1);
  var noiseHigh = cl(
    (militaryNoise * 0.7        // 0.7: high-freq military noise weight — sonar/electronics >10 kHz
    + baseShipNoise * 0.2        // 0.2: high-freq ship noise weight — minimal energy >10 kHz
    + ferryNoise * 0.3)          // 0.3: high-freq ferry noise weight — some propeller cavitation harmonics
    * (1 - speedNoiseReduction * 0.5),  // 0.5: speed reduction least effective at high freq
    0, 1);
  var noiseImpulse = cl(
    constructionProxy * 0.3      // 0.3: impulsive noise fraction from construction/dredging — pile driving, clamshell dredging
    + (eq > 0.3 ? eq * 0.3 : 0),  // 0.3 threshold + 0.3 scaling: significant earthquakes generate impulsive underwater sound
    0, 1);

  var noiseProfile = { low: noiseLow, mid: noiseMid, high: noiseHigh, impulse: noiseImpulse, aggregate: totalNoise };

  // Add impulse to basin noise
  var bKeys = Object.keys(basinNoise);
  for (var bni = 0; bni < bKeys.length; bni++) {
    basinNoise[bKeys[bni]].impulse = noiseImpulse;
  }

  // Invasive pressure (aggregate, backward compat)
  var invasivePressure = cl(
    vd * 0.015                   // 0.015: invasive introduction probability per vessel-transit — Smithsonian Environmental Research Center
    * (1 - ballastTreat * 0.85), // 0.85: max ballast treatment effectiveness (fraction) — Smithsonian SERC
    0, 1);

  var speedCostPenalty = speedTransitCost;

  // ── OLD-STYLE PORTS (backward compat for existing consumers) ──
  var tsunamiSeattle = tsunami * 0.7,  // 0.7: Seattle tsunami exposure — same as PORTS.seattle.tsunamiExposure
    tsunamiVan = tsunami * 0.4;        // 0.4: Vancouver tsunami exposure — same as PORTS.vancouver.tsunamiExposure
  var portsLegacy = {
    seattle: {
      teu: regionTEU * 0.40 * (1 - tsunamiSeattle * 0.5),   // 0.40: Seattle TEU share (legacy); 0.5: tsunami throughput reduction fraction
      emp: totalEmp * 0.38,   // 0.38: Seattle employment share of regional total (legacy) — Martin Associates 2018
      rev: totalRev * 0.35,   // 0.35: Seattle revenue share of regional total (legacy) — Martin Associates 2018
      noise: vd * 0.35        // 0.35: Seattle noise share of vessel density (legacy)
    },
    vancouver: {
      teu: regionTEU * 0.40 * (1 - tsunamiVan * 0.3),  // 0.40: Vancouver TEU share (legacy); 0.3: tsunami throughput reduction (less exposed)
      emp: totalEmp * 0.42,   // 0.42: Vancouver employment share (legacy) — Port of Vancouver economic reports
      rev: totalRev * 0.45,   // 0.45: Vancouver revenue share (legacy) — Port of Vancouver 2023 Statistics
      noise: vd * 0.35        // 0.35: Vancouver noise share (legacy)
    },
    tacoma: {
      teu: regionTEU * 0.20 * (1 - tsunamiSeattle * 0.6),  // 0.20: Tacoma TEU share (legacy); 0.6: tsunami throughput reduction (lower elevation)
      emp: totalEmp * 0.20,   // 0.20: Tacoma employment share (legacy) — Martin Associates 2018
      rev: totalRev * 0.20,   // 0.20: Tacoma revenue share (legacy) — Martin Associates 2018
      noise: vd * 0.30        // 0.30: Tacoma noise share (legacy) — slightly less traffic than Seattle/Vancouver
    },
  };

  // ── SECTOR DISAGGREGATION (backward compat) ──
  var maritimeEmp = regionTEU * 8       // 8: jobs per TEU — Martin Associates 2018
    * (1 - crewReduction) * oc * supplyChainEff;
  var maritimeRev = regionTEU * 0.5     // 0.5: revenue per TEU ($M scaling) — Martin Associates 2018
    * oc * supplyChainEff;
  var fisheriesEmp = (I.fisheriesYield !== undefined ? I.fisheriesYield : 1000)
    * 2 * oc;                           // 2: jobs per yield unit — same as fisheriesEmpAgg
  var fisheriesRev = (I.fisheriesYield !== undefined ? I.fisheriesYield : 1000)
    * 0.02 * oc;                        // 0.02: revenue per yield unit ($M) — same as fisheriesRevAgg
  var recreationEmp = (I.recreationValue !== undefined ? I.recreationValue : 0.5)
    * 6000 * oc;                        // 6000: recreation jobs scaling — same as recreationEmpAgg
  var recreationRev = (I.recreationValue !== undefined ? I.recreationValue : 0.5)
    * 120 * oc;                         // 120: recreation revenue scaling ($M) — same as recreationRevAgg
  // 9M = Salish Sea watershed population — US Census 2024 + Statistics Canada 2021
  var techMultiplier = cl((I.dynamicPopulation !== undefined ? I.dynamicPopulation : 9000000) / 9000000, 0.5, 2);
  var techEmp = 45000                   // 45000: baseline tech sector employment (jobs) — WA Employment Security Dept, Seattle metro tech employment
    * techMultiplier * cl(1
    - eq * 0.1                          // 0.1: earthquake tech disruption fraction — moderate (mostly office/remote work)
    - tsunami * 0.05,                   // 0.05: tsunami tech disruption fraction — minimal (inland campuses)
    0.5, 1);
  var techRev = 8000                    // 8000: baseline tech sector revenue ($M/yr) — WA Dept of Commerce, regional tech GDP contribution
    * techMultiplier * cl(1
    - eq * 0.1,                         // 0.1: earthquake tech revenue disruption
    0.5, 1);
  var agriMultiplier = cl(1 - (I.contaminantIndex || 0) * 0.3, 0.3, 1);  // 0.3: max contamination impact on agriculture (fraction) — WA Dept of Agriculture, soil/water contamination crop loss estimates
  var agriEmp = 8000                    // 8000: baseline agriculture employment (jobs) — USDA Census of Agriculture, Skagit/Whatcom/Snohomish counties
    * agriMultiplier;
  var agriRev = 2000                    // 2000: baseline agriculture revenue ($M/yr) — USDA Census of Agriculture, PNW farm gate value
    * agriMultiplier;

  var totalStress_p = cl(eq + sp + st + tsunami + volcano, 0, 1);
  var fire = S.wildfire || 0;

  var sectors = {
    maritime:    { emp: maritimeEmp, rev: maritimeRev, vuln: cl(eq * 0.7 + tsunami * 0.8 + sp * 0.5, 0, 1) },
    fisheries:   { emp: fisheriesEmp, rev: fisheriesRev, vuln: cl(sp * 0.8 + totalStress_p * 0.3, 0, 1) },
    tourism:     { emp: tourismEmp, rev: tourismRev, vuln: cl(sp * 0.6 + eq * 0.3 + volcano * 0.4, 0, 1) },
    military:    { emp: militaryEmp, rev: militaryRev, vuln: cl(eq * 0.15 + tsunami * 0.2, 0, 1) },
    recreation:  { emp: recreationEmp, rev: recreationRev, vuln: cl(sp * 0.4 + (1 - (I.recreationValue !== undefined ? I.recreationValue : 0.5)) * 0.3, 0, 1) },
    tech:        { emp: techEmp, rev: techRev, vuln: cl(eq * 0.1 + tsunami * 0.05, 0, 1) },
    agriculture: { emp: agriEmp, rev: agriRev, vuln: cl(volcano * 0.5 + fire * 0.3 + atmoRiver * 0.4, 0, 1) },
    ferry:       { emp: ferryEmployment, rev: ferrySailingsPerDay * 0.15, vuln: cl(tsunami * 0.8 + atmoRiver * 0.3, 0, 1) },
    // ferry rev: 0.15 = revenue per ferry sailing ($M scaling) — WSF 2023 Annual Report, fare revenue per sailing
  };
  var sectorTotalEmp = Object.values(sectors).reduce(function(s, x) { return s + x.emp; }, 0);
  var sectorTotalRev = Object.values(sectors).reduce(function(s, x) { return s + x.rev; }, 0);

  // ── ENVIRONMENTAL LEVY ──
  var levyRevenue = totalRev * levyRate;

  return {
    state: {
      // Backward-compatible aggregate fields
      vesselDensity: vd,
      underwaterNoise: un,
      oilSpillRisk: osr,
      employment: totalEmp + ferryEmployment,
      revenue: totalRev * (1 - speedCostPenalty),
      opCap: oc,
      emissionsIndex: cl(ei + ferryEmissions + cruiseEmissions, 0, 1),
      dredgingRate: dr,
      ballastVolume: bv,
      infraDemand: cl(regionTEU / 10000, 0, 1),  // 10000: TEU normalization for infrastructure demand index — calibrated to regional port capacity
      ports: portsLegacy,
      ferryNoise: ferryNoise,
      ferrySailings: ferrySailingsPerDay,
      ferryEmployment: ferryEmployment,
      supplyChainEff: supplyChainEff,
      chokepointRisk: chokepointRisk,
      tourismRev: tourismRev,
      tourismEmp: tourismEmp,
      militaryEmp: militaryEmp,
      militaryRev: militaryRev,
      autonomousFrac: autoFrac,
      vesselSpeedZone: globalSpeedZone,
      altFuelFraction: altFuel,
      altFuelAirQuality: altFuelAirQualityBonus,
      invasivePressure: invasivePressure,
      wwDisturbance: wwDisturbance,
      wwRevenue: wwRevenue,
      cruiseRevenue: cruiseRevenue,
      cruiseWastewater: cruiseWastewater,
      sectors: sectors,
      sectorTotalEmp: sectorTotalEmp,
      sectorTotalRev: sectorTotalRev,
      noiseProfile: noiseProfile,
      // NEW: per-port data
      portDetails: portResults,
      basinNoise: basinNoise,
      basinTraffic: basinTraffic,
      levyRevenue: levyRevenue,
      environmentalLevyRate: levyRate
    },
    exports: {
      // Backward-compatible exports
      vesselDensity: vd,
      underwaterNoise: totalNoise,
      ballastVolume: bv,
      dredgingRate: dr,
      oilSpillRisk: osr,
      employment: totalEmp + ferryEmployment,
      revenue: totalRev * (1 - speedCostPenalty),
      infraDemand: cl(regionTEU / 10000, 0, 1),  // 10000: same TEU normalization as above
      emissionsIndex: cl(ei + ferryEmissions + cruiseEmissions, 0, 1),
      altFuelAirQuality: altFuelAirQualityBonus,
      vesselSpeedZone: globalSpeedZone,
      invasivePressure: invasivePressure,
      wwDisturbance: wwDisturbance,
      cruiseWastewater: cruiseWastewater,
      noiseProfile: noiseProfile,
      // NEW: per-basin noise for marine model
      basinNoise: basinNoise,
      basinTraffic: basinTraffic,
      levyRevenue: levyRevenue
    }
  };
}
