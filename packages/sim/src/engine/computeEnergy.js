// ═══════════════════════════════════════════════════════════
// computeEnergy.js — PNW electrical grid model
// Hydropower-dominated grid coupled to watershed, climate, and ecosystem
// ES5 convention (var, function) — matches engine convention
// ═══════════════════════════════════════════════════════════

import { cl, seas, seasonalPeak, seededRandom } from './utils.js';

export function computeEnergy(P, ws, climD, urban, port, yf, prevEnergy, S, coupling, dt) {
  // dt = timestep fraction (1 for quarterly, 1/3 for monthly). Defaults to 1 for backward compat.
  dt = dt || 1;
  // S = disaster shocks (earthquake, wildfire, storm, etc.)
  var eq = S.earthquake || 0;
  var fire = S.wildfire || 0;
  var storm = S.storm || 0;
  var volcano = S.volcano || 0;
  var atmoRiver = S.atmosphericRiver || 0;

  var quarter = (yf !== undefined ? (yf % 1) : 0) * 4; // 0=winter, 1=spring, 2=summer, 3=fall
  var sstDelta = climD ? climD.sstDelta || 0 : 0;
  // SLR rate approximations by SSP scenario, cm/yr — IPCC AR6 Ch9 Table 9.9
  var yearsSince2026 = climD ? (climD.slrCm || 0) / (climD.sspKey === "ssp126" ? 0.30 : climD.sspKey === "ssp585" ? 0.50 : 0.38) : 0;
  // Fallback: use yf progression if climD doesn't give us years
  if (yearsSince2026 < 0) yearsSince2026 = 0;
  var yearsSince = yearsSince2026; // alias for readability
  var year = 2026 + yearsSince2026;

  // ── PREVIOUS STATE ──
  var prev = prevEnergy || {};
  var prevGridDamage = (prev.gridDamage !== undefined) ? prev.gridDamage : 0;
  var prevWindCapacity = (prev.windCapacity !== undefined) ? prev.windCapacity : 7200; // Verified 2026-03-23: ~7,200 MW WA+OR combined per EIA (WA ~3,400 + OR ~3,800)
  var prevSolarCapacity = (prev.solarCapacity !== undefined) ? prev.solarCapacity : 2700; // Verified 2026-03-23: ~2,700 MW WA+OR combined per SEIA/EIA (OR alone ~2,058 MW)
  var prevTidalCapacity = (prev.tidalCapacity !== undefined) ? prev.tidalCapacity : 0; // MW, no commercial tidal deployed in PNW as of 2026
  var prevDataCenterDemand = (prev.dataCenterDemand !== undefined) ? prev.dataCenterDemand : 600; // MW, estimated PNW data center load circa 2026 — IEA Data Centres report 2023
  var prevEVDemand = (prev.evDemand !== undefined) ? prev.evDemand : 200; // MW, estimated EV charging load circa 2026 — WA Commerce EV infrastructure plan

  // ── PARAMETERS ──
  var dataCenterGrowth = (P.dataCenterGrowth !== undefined ? P.dataCenterGrowth : 15) / 100; // 15%/yr default growth rate — Uptime Institute 2023 global forecast
  var gridInvestment = (P.gridInvestment !== undefined ? P.gridInvestment : 30) / 100; // fraction, 30% = moderate investment baseline

  // ── POPULATION AND ECONOMIC DRIVERS ──
  // 9M = Salish Sea watershed population — US Census 2024 + Statistics Canada 2021
  var pop = (urban && urban.dynamicPopulation !== undefined) ? urban.dynamicPopulation : 9000000;
  var popFrac = pop / 9000000; // fraction relative to baseline population

  // ═══════════════════════════════════════════════════════════
  // GENERATION SOURCES
  // ═══════════════════════════════════════════════════════════

  // ── 1. HYDROPOWER (BPA system) ──
  // PNW is ~65% hydro. Columbia/Snake system dominates.
  // Capacity: ~21,000 MW nameplate, actual output varies with snowpack/runoff
  // 33,000 MW = combined US (BPA 21GW) + BC Hydro (~12GW) for the Salish Sea region
  // Population base is 9M spanning WA+BC, so generation must include both sides
  var hydroCapacity = 33000; // MW nameplate — BPA 2023 White Book + BC Hydro Annual Report 2024

  // Snowpack and reservoir drive hydro availability
  var snowpack = (ws && ws.snowpack !== undefined) ? ws.snowpack : 180; // mm SWE, typical PNW April 1 snowpack — NRCS
  var reservoirLevel = (ws && ws.reservoirLevel !== undefined) ? ws.reservoirLevel : 0.75; // fraction full, typical end-of-winter fill — BPA reservoir ops
  var droughtStress = (ws && ws.droughtStress !== undefined) ? ws.droughtStress : 0;
  var glacialMass = (ws && ws.glacialMass !== undefined) ? ws.glacialMass : 1.0; // 1.0 = present-day reference mass

  // Hydro capacity factor: seasonal (spring peak from snowmelt, summer from reservoirs)
  // Spring freshet peaks generation; late summer drops if drought
  var hydroSeasonal = seas(yf, 0.75, 0.55); // CF range: winter 0.75 (rain+stored), summer 0.55 — BPA 2023 White Book seasonal generation data
  var springFreshet = seasonalPeak(quarter, 1.2, 0.8); // peak in ~Q1.2 (May), half-width ~0.8 quarters — Columbia Basin freshet timing
  // Blended seasonal CF: 50% base seasonal + 30% freshet peak + 20% floor
  var hydroSeasonalCF = cl(hydroSeasonal * 0.5 + springFreshet * 0.3 + 0.2, 0.3, 0.85); // bounds: 0.30 min CF, 0.85 max CF — EIA Electric Power Monthly, NREL ATB 2023

  // Drought reduces hydro output
  var droughtPenalty = droughtStress * 0.25; // up to 25% reduction in severe drought — 2001 PNW drought reduced BPA output ~25%, BPA historical ops
  // Long-term: glacial retreat reduces summer baseflow
  var glacialLoss = cl((1 - glacialMass) * 0.05, 0, 0.08); // up to 8% loss when glaciers gone — Riedel & Larrabee 2016, NPS glacier monitoring

  // ── SALMON-HYDRO TRADEOFF (KEY INSIGHT) ──
  // Fish passage investment increases spill at dams for fish, reducing hydro generation
  // fishPassageInvestment 0-100 represents policy commitment
  var fishPassage = (P.fishPassageInvestment !== undefined ? P.fishPassageInvestment : 20) / 100; // 20% default = current BiOp baseline — CRITFC spill guidelines
  // Spill fraction: 0-20% of water bypasses turbines for fish
  var spillForFish = fishPassage * 0.20; // 20% max spill fraction — BPA Fish Operations Plan, court-ordered spill caps
  // Cost of spill in lost generation
  // 0.25 factor converts peak-spill to average impact across all dam projects
  var fishSpillCost = spillForFish * hydroCapacity * hydroSeasonalCF * 0.25; // MW lost — BPA spill cost estimates ~$500M/yr at full spill
  // Spill peaks during salmon migration (spring/fall)
  // 60% spring (chinook/steelhead), 40% fall (coho/fall chinook) — CRITFC migration windows
  var migrationSeason = seasonalPeak(quarter, 1.5, 1.0) * 0.6 + seasonalPeak(quarter, 3.0, 1.0) * 0.4;
  // 40% baseline spill year-round + 60% concentrated during migration
  fishSpillCost = fishSpillCost * (0.4 + migrationSeason * 0.6);

  // 0.3 factor accounts for spill only at fish-passage dams (not all hydro projects)
  var hydroCF = cl(hydroSeasonalCF - droughtPenalty - glacialLoss - spillForFish * migrationSeason * 0.3, 0.15, 0.80); // bounds: 0.15 emergency min, 0.80 physical max — EIA Electric Power Monthly
  var hydroGeneration = hydroCapacity * hydroCF;

  // ── 2. NUCLEAR (Columbia Generating Station) ──
  // Single plant, 1190 MW, CF ~0.90 (very reliable baseload)
  var nuclearCapacity = 1190; // MW, Columbia Generating Station (Richland, WA) — NRC license, EIA-860
  var nuclearCF = 0.90; // capacity factor, US nuclear fleet avg 0.92, CGS slightly lower — EIA Electric Power Monthly 2023
  // Earthquake can cause shutdown (automatic SCRAM)
  var nuclearEqShutdown = eq > 0.3 ? cl(eq * 0.8, 0, 1) : 0; // threshold 0.3 = ~M5.5 triggers automatic SCRAM — NRC seismic trip setpoints; 0.8 scaling = high likelihood of extended shutdown
  var nuclearGeneration = nuclearCapacity * nuclearCF * (1 - nuclearEqShutdown);

  // ── 3. NATURAL GAS ──
  // Peaking and baseload gas plants, ~5000 MW capacity
  // WA CETA (Clean Energy Transformation Act) phases out gas by 2045
  // 8000 MW = combined WA+OR (5GW, eGRID 2022) + BC gas (3GW, BC Hydro IRP)
  // for the integrated Salish Sea grid serving 9M people
  var gasCapacity = 8000; // MW — EPA eGRID 2022 + BC Hydro IRP 2024
  // CETA phase-out: linear decline starting 2030, zero by 2045
  var cetaYear = cl(yearsSince2026 - 4, 0, 15); // years since 2030; CETA requires coal-free by 2025, 80% clean by 2030, 100% by 2045 — RCW 19.405
  var cetaPhaseout = cl(cetaYear / 15, 0, 1); // linear ramp: 0 at 2030, 1 at 2045 — 15-year phase-out window per CETA RCW 19.405.050
  // Grid investment accelerates clean transition (or delays it if low)
  // 0.5 base means even without extra investment, CETA achieves 50% of scheduled phase-out
  var cetaEffective = cl(cetaPhaseout * (0.5 + gridInvestment * 0.5), 0, 1);
  var gasAvailable = gasCapacity * (1 - cetaEffective);
  // Gas runs as needed to fill gap — capacity factor depends on demand
  // We'll compute actual dispatch below after demand is known

  // ── 4. WIND ──
  // Growing rapidly: 3200 MW base (2026), adds ~200 MW/yr with investment
  // energyTransitionPressure from macroEconomy: high oil prices accelerate renewable buildout
  var etPressure = coupling && coupling.energyTransitionPressure !== undefined ? coupling.energyTransitionPressure : 1.0;
  var windGrowth = 200 * gridInvestment * 1.5 * etPressure; // MW/yr base addition rate; 200 MW/yr = recent WA wind buildout — NWPCC 2021 Power Plan; 1.5x = investment multiplier; etPressure from oil price
  var windCapacity = cl(prevWindCapacity + windGrowth * 0.25 * dt, 3200, 15000); // dt-scaled growth; 15000 MW cap = PNW technical wind potential — NREL ATB 2023
  // Capacity factor: 0.25-0.35, seasonal (windier in winter)
  var windSeasonalCF = seas(yf, 0.33, 0.22); // winter CF 0.33, summer CF 0.22 — EIA Electric Power Monthly, Columbia Gorge wind data
  // Random variability ±0.02 around seasonal mean; 7919 = prime seed offset for decorrelation
  var windCF = cl(windSeasonalCF + (seededRandom(Math.floor(year) * 100 + Math.floor(quarter) + 7919) * 0.04 - 0.02), 0.15, 0.42); // bounds: 0.15 calm spells, 0.42 exceptional — NREL ATB 2023 PNW class
  var windGeneration = windCapacity * windCF;

  // ── 5. SOLAR ──
  // Small but growing: 800 MW base (2026), rapid growth with investment
  var solarGrowth = 150 * gridInvestment * 2.0 * etPressure; // MW/yr; 150 MW/yr = recent WA solar buildout rate — SEIA state data, WA Commerce solar report; 2.0x = investment multiplier; etPressure from oil price
  var solarCapacity = cl(prevSolarCapacity + solarGrowth * 0.25, 800, 10000); // quarterly growth; 10000 MW cap = PNW rooftop+utility solar potential — NREL ATB 2023
  // Capacity factor: strong seasonal (summer peak, low winter)
  var solarSeasonalCF = seas(yf, 0.08, 0.22); // winter CF 0.08 (short days, clouds), summer CF 0.22 — EIA Electric Power Monthly, PNW latitude ~47°N
  // Cloud cover from storms/volcanoes reduces solar
  var solarPenalty = storm * 0.3 + volcano * 0.5 + fire * 0.2; // fractional CF reduction: storm clouds 30%, volcanic ash 50%, wildfire smoke 20% — observed PNW smoke impacts on solar, NREL smoke study
  var solarCF = cl(solarSeasonalCF - solarPenalty, 0.02, 0.28); // bounds: 0.02 worst-case winter, 0.28 clear summer peak — EIA Electric Power Monthly
  var solarGeneration = solarCapacity * solarCF;

  // ── 6. TIDAL ENERGY ──
  // Extracted from marine module parameter
  var tidalExtraction = (P.tidalEnergyExtraction !== undefined ? P.tidalEnergyExtraction : 0);
  var tidalCapacity = cl(prevTidalCapacity + tidalExtraction * 0.5 * 0.25, 0, 100); // MW; 0.5 MW per unit extraction per year, quarterly; 100 MW cap = Admiralty Inlet + Tacoma Narrows potential — EPRI tidal resource assessment 2011, Snohomish PUD tidal project
  var tidalCF = 0.30; // capacity factor, tidal is predictable but bi-directional with slack periods — EPRI tidal resource assessment, ~26-30% CF for in-stream tidal
  var tidalGeneration = tidalCapacity * tidalCF;

  // ── 7. BC HYDRO IMPORTS ──
  // British Columbia exports surplus hydro to WA via interties
  // ~2000-4000 MW import capacity, depends on BC surplus
  var bcImportCapacity = 3000; // MW, BPA-BC Hydro intertie capacity — BPA interconnection data, BC Hydro 2021 IRP
  // BC surplus higher in spring (freshet), lower in winter (BC heating demand)
  var bcSurplus = seas(yf, 0.4, 0.7); // fraction: winter 0.4 (BC domestic heating), spring/summer 0.7 (freshet surplus) — BC Hydro 2021 IRP export forecasts
  var bcImportGeneration = bcImportCapacity * bcSurplus * 0.6; // 0.6 = transmission/scheduling losses and contractual availability — BPA transmission data

  // ═══════════════════════════════════════════════════════════
  // TASK 4: FUTURE TECHNOLOGY — SMR, Fusion, Green Hydrogen
  // ═══════════════════════════════════════════════════════════

  // ── SMR (Small Modular Reactor) deployment ──
  var smrPathway = (P.smrPathway !== undefined ? P.smrPathway : 1);
  // Deployment year by pathway: 0=never, 1=baseline 2032, 2=delayed 2035, 3=accelerated 2030
  // 2032 baseline aligns with NuScale FSAR schedule (INL CFPP target, since deferred)
  var smrOnlineYear = smrPathway === 0 ? 9999 : smrPathway === 1 ? 2032 : smrPathway === 2 ? 2035 : 2030;
  var smrCapacity = 0;
  if (year >= smrOnlineYear) {
    var yrSinceSMR = year - smrOnlineYear;
    // Accelerating deployment: linear + quadratic ramp (0.3 acceleration factor)
    // 77 MW per module — NuScale Power Module rated output per NRC Design Certification
    smrCapacity = cl(yrSinceSMR * (1 + yrSinceSMR * 0.3), 0, 30) * 77; // max 30 modules = 2310 MW — DOE SMR deployment roadmap
  }
  var smrGeneration = smrCapacity * 0.92; // CF 0.92 = NuScale design target capacity factor — NuScale FSAR

  // ── Fusion power ──
  var fusionPathway = (P.fusionPathway !== undefined ? P.fusionPathway : 0);
  // Deployment year by pathway: 0=never, 1=ITER-timeline 2050, 2=accelerated 2042, 3=breakthrough 2035
  // 2050 = ITER Q=10 → commercial demo timeline; 2042/2035 = aggressive private fusion targets — DOE fusion milestones
  var fusionOnlineYear = fusionPathway === 0 ? 9999 : fusionPathway === 1 ? 2050 : fusionPathway === 2 ? 2042 : 2035;
  var fusionCapacity = 0;
  if (year >= fusionOnlineYear) {
    // 500 MW first plant + 300 MW/yr buildout; 5000 MW cap = regional fusion fleet limit
    fusionCapacity = cl(500 + (year - fusionOnlineYear) * 300, 0, 5000); // MW — DOE Fusion Energy Sciences target plant scale ~500 MW
  }
  var fusionGeneration = fusionCapacity * 0.85; // CF 0.85 = projected fusion plant availability, lower than fission due to plasma stability — DOE fusion milestones, ITER design basis

  // ═══════════════════════════════════════════════════════════
  // TASK 1: DISTRIBUTED GENERATION
  // ═══════════════════════════════════════════════════════════

  // We need electricityPrice from previous iteration for economic incentive
  var prevElecPrice = (prev.electricityPrice !== undefined) ? prev.electricityPrice : 0.09; // $/kWh, PNW avg residential rate — EIA state electricity profiles, cheap hydro baseline

  // ── Rooftop solar ──
  var solarAdoptionBase = 0.05; // 5% initial adoption rate = WA residential solar penetration circa 2026 — SEIA state data
  // 0.12 $/kWh = grid parity threshold; ratio drives economic incentive (>1 means solar is competitive)
  var solarEconomicIncentive = cl(prevElecPrice / 0.12, 0.5, 3); // 0.12 $/kWh reference = Lazard LCOE v16 rooftop solar
  var solarPolicySupport = cl(cleanFractionPrev(), 0, 1);
  // 0.015/yr = annual adoption growth rate — SEIA WA market forecast; 0.60 cap = practical rooftop saturation (not all homes suitable)
  var solarAdoption = cl(solarAdoptionBase + yearsSince * 0.015 * solarEconomicIncentive * (0.5 + solarPolicySupport), 0, 0.60);
  // 2.5 persons/household — US Census WA avg + Statistics Canada BC avg household size
  var homes = (pop || 9000000) / 2.5;
  var homesWithSolar = homes * solarAdoption;
  var rooftopCapacity = homesWithSolar * 0.008; // 0.008 MW (8 kW) per residential solar system — SEIA avg system size 2023
  // 0.18 = annual avg CF for rooftop solar in PNW, adjusted seasonally — NREL PVWatts, Seattle TMY data
  var rooftopGeneration = rooftopCapacity * seasonalPeak(quarter, 2, 1.0) * 0.18;

  // ── Battery storage ──
  // Battery adoption lags solar by 5 percentage points (early solar adopters add batteries later)
  var batteryAdoption = cl(solarAdoption - 0.05, 0, 0.40); // 0.40 cap = max battery co-adoption — SEIA/Wood Mackenzie storage forecast
  var homeBatteryCapacity = homesWithSolar * batteryAdoption * 0.013; // 0.013 MW (13 kWh) per home battery — Tesla Powerwall 2 capacity
  var gridBatteryCapacity = cl(gridInvestment * 3000, 0, 5000); // MW; 3000 MW at full investment, 5000 MW cap — NWPCC resource adequacy targets
  var totalStorage = homeBatteryCapacity + gridBatteryCapacity;
  var storageValue = totalStorage * 4; // 4-hour storage duration in MWh — industry standard for grid batteries (FERC Order 841)

  // ── Community wind and tidal ──
  // Community wind scales with solar adoption as proxy for community energy engagement
  var communityWindCapacity = cl(solarAdoption * 200, 0, 500); // MW; 500 MW cap = PNW community wind resource potential — TODO-CITE: community wind cap — source needed
  // 0.22 base CF + 0.08 seasonal winter boost
  var communityWindGen = communityWindCapacity * (0.22 + seasonalPeak(quarter, 0, 0.8) * 0.08); // 0.22 base CF = small turbine avg — NREL distributed wind data
  var communityTidalCapacity = cl(tidalExtraction * 2, 0, 100); // MW; 2x multiplier for community-scale tidal relative to utility extraction; 100 MW cap — Snohomish PUD tidal project data
  var communityTidalGen = communityTidalCapacity * 0.25; // CF 0.25 = lower than utility-scale tidal due to smaller devices — EPRI tidal resource assessment

  // ── Microgrid capability ──
  var microgridCapability = cl(
    (solarAdoption * 0.3 + batteryAdoption * 0.4 + communityTidalGen / Math.max(communityTidalCapacity, 1) * 0.3) * gridInvestment / Math.max(gridInvestment, 0.01),
    0, 0.8 // 0.8 max = practical limit on microgrid islanding capability — NERC State of Reliability
  );
  // Simplified: microgrid scales with distributed adoption and investment
  // Weights: 30% solar + 40% batteries + 30% community tidal; (0.5 + investment*0.5) = floor ensures some microgrid even at low investment
  microgridCapability = cl(
    (solarAdoption * 0.3 + batteryAdoption * 0.4 + cl(communityTidalGen / 100, 0, 0.3) * 0.3) * (0.5 + gridInvestment * 0.5),
    0, 0.8
  );

  // ── Utility death spiral ──
  // Defection starts when solar adoption exceeds 20% — enough to erode utility revenue base
  var gridDefectionRate = cl(solarAdoption - 0.20, 0, 0.3); // 0.20 threshold, 0.3 max defection — utility "death spiral" literature, RMI 2014
  // 0.15 = rate increase elasticity; utilities raise rates 15% per unit defection to recover fixed costs
  var rateIncreasePressure = gridDefectionRate * 0.15 / Math.max(1 - gridDefectionRate, 0.01);

  // Helper: estimate previous clean fraction for policy support calculation
  function cleanFractionPrev() {
    return (prev.cleanFraction !== undefined) ? prev.cleanFraction : 0.85; // 0.85 = PNW baseline clean fraction (hydro+nuclear) — EIA state electricity profiles
  }

  // ═══════════════════════════════════════════════════════════
  // DEMAND COMPONENTS
  // ═══════════════════════════════════════════════════════════

  // ── BASE DEMAND ──
  // ~12,600 MW average for 4.2M people, scales with population
  // 21000 MW = combined US+Canada Salish Sea region average load (~2.3 kW/capita × 9M)
  // BPA 2023 White Book (US side ~10.5 GW avg) + BC Hydro 2021 IRP (BC domestic ~8 GW avg)
  // Seasonal modifiers add 15-20% for winter heating peak.
  // Previous value (24000) was too high — produced negative reserve margins at baseline.
  // Calibrated so 2026 baseline has +5-10% reserve margin, declining as data centers grow.
  var baseDemand = 21000 * popFrac;

  // ── SEASONAL DEMAND ──
  // PNW: winter heating peak (electric heat pumps), summer cooling growing
  // 0.15 = winter heating adds 15% to base demand; 1.15/0.85 seasonal swing — BPA load forecasts
  var winterHeatDemand = seas(yf, 1.15, 0.85) * baseDemand * 0.15;
  // Summer cooling: growing with climate warming
  // 0.05 = current summer cooling fraction; 0.015 per °C SST increase; 0.15 max — TODO-CITE: PNW cooling demand growth rate — source needed (emerging trend, limited historical data)
  var coolingDemand = seasonalPeak(quarter, 2.0, 0.8) * baseDemand * cl(0.05 + sstDelta * 0.015, 0, 0.15);

  // ── PORT DEMAND ──
  // Shore power, container handling, cranes
  // 60000 = normalization factor (total port employment at full capacity); 400 MW = estimated full-port electrical load
  var portDemand = (port && port.employment !== undefined) ? port.employment / 60000 * 400 : 200; // ~200-400 MW — TODO-CITE: port electricity demand — source needed

  // ═══════════════════════════════════════════════════════════
  // TASK 2: AI DATA CENTER DEMAND PROFILES
  // ═══════════════════════════════════════════════════════════

  var dcGrowthRate = dataCenterGrowth;
  // -0.03 exponential decay = growth rate decelerates over time (market saturation) — IEA Data Centres report 2023 long-range forecast
  var dcGrowthCurve = dcGrowthRate * Math.exp(-0.03 * yearsSince);
  // dt-scaled fraction of annual growth; 500 MW floor, 20000 MW cap — IEA Data Centres report 2023, Uptime Institute regional forecasts
  // Uses dt (1/3 for monthly, 1 for quarterly) to prevent over-compounding at monthly resolution.
  var dataCenterBase = cl(prevDataCenterDemand * (1 + dcGrowthCurve * 0.25 * dt), 500, 20000);
  dataCenterBase = cl(dataCenterBase, 0, 20000);

  // 0.3 = AI training is ~30% of data center power; 0.7 = inference is ~70% — Uptime Institute 2023, IEA Data Centres report 2023
  var aiTrainingDemand = dataCenterBase * 0.3 * (1 + seededRandom(Math.floor(year) * 10 + Math.floor(quarter)) * 0.3); // 0.3 random multiplier = training workload variability (bursty GPU jobs)
  var aiInferenceDemand = dataCenterBase * 0.7;
  // 0.35 = summer cooling overhead adds up to 35% to DC power (PUE seasonal variation) — Uptime Institute, typical PUE 1.3-1.4
  var dcCoolingMultiplier = 1 + seasonalPeak(quarter, 2, 0.8) * 0.35;
  var totalDCDemand = (aiTrainingDemand + aiInferenceDemand) * dcCoolingMultiplier;
  // Cap DC demand relative to total supply to prevent runaway
  var totalSupplyEstimate = hydroGeneration + nuclearGeneration + windGeneration + solarGeneration + tidalGeneration + bcImportGeneration + gasAvailable + smrGeneration + fusionGeneration + rooftopGeneration + communityWindGen + communityTidalGen;
  totalDCDemand = cl(totalDCDemand, 0, totalSupplyEstimate * 0.25); // 0.25 = data centers cannot exceed 25% of total supply — practical grid constraint

  // Legacy compatibility: keep dataCenterDemand as the total DC demand
  var dataCenterDemand = totalDCDemand;

  // Water consumption (millions of gallons per quarter)
  var dcWaterConsumption = cl(totalDCDemand * 0.0005, 0, 10); // 0.0005 Mgal/MW = data center evaporative cooling water use — IEA Data Centres report 2023; 10 Mgal cap

  // Geographic concentration
  // 0.6 = 60% of PNW data centers are in eastern WA (Grant/Douglas County, cheap hydro) — Uptime Institute, Microsoft/Yahoo data center locations
  var easternWADemand = totalDCDemand * 0.6;
  // 2000 MW = Grant County PUD capacity threshold for grid stress — Grant County PUD integrated resource plan
  var grantCountyStress = cl(easternWADemand / 2000, 0, 1);

  // ── EV DEMAND ──
  // Electric vehicle charging load, growing as WA phases out gas cars (2035 mandate)
  var evAdoption = cl(yearsSince2026 * 0.04, 0, 0.8); // 0.04/yr = 4%/yr adoption rate; 80% by ~2046 — WA Clean Cars 2030 mandate, ZEV adoption curves
  // 50 MW per unit adoption per year = incremental EV charging load; 200 MW floor, 4000 MW cap — NWPCC EV load forecast
  var evDemand = cl(prevEVDemand + evAdoption * 50 * 0.25 * dt, 200, 4000);

  // ── TOTAL DEMAND ──
  var totalDemand = baseDemand + winterHeatDemand + coolingDemand + portDemand + totalDCDemand + evDemand;

  // ═══════════════════════════════════════════════════════════
  // TASK 5: UPDATED SUPPLY/DEMAND BALANCE
  // ═══════════════════════════════════════════════════════════

  // Clean generation includes distributed + future tech
  var cleanGeneration = hydroGeneration + nuclearGeneration + windGeneration + solarGeneration
    + tidalGeneration + bcImportGeneration + rooftopGeneration + communityWindGen
    + communityTidalGen + smrGeneration + fusionGeneration;
  var supplyGap = Math.max(0, totalDemand - cleanGeneration);
  var gasGeneration = cl(supplyGap, 0, gasAvailable);
  var totalGeneration = cleanGeneration + gasGeneration;

  // ═══════════════════════════════════════════════════════════
  // TASK 3: GRID THREAT EFFECTS
  // ═══════════════════════════════════════════════════════════

  // Grid threats from disaster shocks — matching the existing shock pattern
  // Max damage fractions based on NERC State of Reliability and historical events:
  var solarStormDamage = (S.solarStorm) ? cl(S.solarStorm, 0, 0.4) : 0; // 0.4 max = Carrington-class geomagnetic storm, transformer damage — NERC GMD task force
  var empDamage = (S.emp) ? cl(S.emp * 0.6, 0, 0.6) : 0; // 0.6 max, 0.6 scaling = high-altitude EMP destroys unshielded electronics — EMP Commission 2008 report
  var cyberDamage = (S.cyberAttack) ? cl(S.cyberAttack * 0.5, 0, 0.5) : 0; // 0.5 max = SCADA compromise (cf. Ukraine 2015 grid attack) — NERC CIP standards
  var physicalAttackDamage = (S.physicalAttack) ? cl(S.physicalAttack * 0.25, 0, 0.25) : 0; // 0.25 max = substation attack (cf. Metcalf 2013 sniper attack) — FERC physical security order

  // Total threat damage to centralized grid
  var threatDamage = cl(solarStormDamage + empDamage + cyberDamage + physicalAttackDamage, 0, 0.95); // 0.95 cap = even worst-case some infrastructure survives
  // Distributed generation survives grid threats better (islanding capability)
  // Solar storm damages transformers but leaves panels intact (1.0 survival); EMP damages electronics including inverters (0.3 survival)
  var distributedSurvival = solarStormDamage > 0 ? 1.0 : empDamage > 0 ? 0.3 : 1.0;

  // Apply threat damage to grid output — centralized generation reduced, distributed partially survives
  var centralizedGen = hydroGeneration + nuclearGeneration + gasGeneration + windGeneration + solarGeneration + bcImportGeneration + smrGeneration + fusionGeneration;
  var distributedGen = rooftopGeneration + communityWindGen + communityTidalGen;
  if (threatDamage > 0) {
    var effectiveCentralLoss = centralizedGen * threatDamage;
    var effectiveDistLoss = distributedGen * threatDamage * (1 - distributedSurvival * microgridCapability);
    totalGeneration = cl(totalGeneration - effectiveCentralLoss - effectiveDistLoss, 0, totalGeneration);
  }

  // Unmet demand (potential brownout/blackout)
  var unmetDemand = Math.max(0, totalDemand - totalGeneration);

  // ── Green hydrogen ──
  var surplusGen = Math.max(0, totalGeneration - totalDemand);
  var electrolyzerCap = cl(gridInvestment * 500, 0, 1000); // MW; 500 MW at full investment, 1000 MW cap — DOE Hydrogen Shot targets, PNW green hydrogen feasibility
  var hydrogenProduction = Math.min(surplusGen, electrolyzerCap) * 0.7; // 0.7 = 70% electrolyzer efficiency (PEM) — DOE Hydrogen Shot, NREL electrolysis data
  var hydrogenStorage = hydrogenProduction * 0.25; // 0.25 = quarterly storage fraction (25% stored, rest consumed immediately) — TODO-CITE: hydrogen storage fraction — source needed

  // ═══════════════════════════════════════════════════════════
  // GRID METRICS
  // ═══════════════════════════════════════════════════════════

  // ── RESERVE MARGIN ──
  // Healthy grid needs 15-20% reserve above peak demand
  var totalCapacity = hydroCapacity * hydroCF + nuclearCapacity * nuclearCF * (1 - nuclearEqShutdown)
    + gasAvailable + windCapacity * windCF + solarCapacity * solarCF + tidalCapacity * tidalCF
    + bcImportCapacity * bcSurplus * 0.6 + rooftopCapacity * solarCF + communityWindCapacity * 0.25 // 0.25 = community wind avg CF — NREL distributed wind data
    + smrCapacity * 0.92 + fusionCapacity * 0.85; // CFs match generation calculations above
  var reserveMargin = cl((totalCapacity - totalDemand) / Math.max(totalDemand, 1), -0.3, 0.5); // bounds: -0.3 extreme deficit, 0.5 large surplus — NERC reference margin range

  // ── GRID RELIABILITY ──
  // 0=blackouts, 1=perfect. Depends on reserve margin, infrastructure age, disasters
  var infraAge = (P.stormwaterInfraAge !== undefined ? P.stormwaterInfraAge : 55) / 100; // 55 = proxy for grid age (years), normalized to fraction; shared with urban infrastructure param
  var gridAge = cl(infraAge - gridInvestment * 0.3, 0, 1); // 0.3 = investment rejuvenation factor — higher investment reduces effective grid age

  // Earthquake damage to grid infrastructure
  var eqGridDamage = eq * 0.4; // 0.4 = earthquake grid damage coefficient; M9 Cascadia could damage 40% of transmission — NERC seismic assessment
  // Liquefaction damage to substations in low-lying areas
  var liqDamage = (ws && ws.liquefactionRisk !== undefined) ? ws.liquefactionRisk * eq * 0.2 : 0; // 0.2 = liquefaction damage multiplier for substations — FEMA Hazus earthquake model
  // Damage contributions: earthquake 0.4, liquefaction 0.2, storm 0.1, fire 0.15, AR 0.05, threats 0.5
  var newDamage = cl(eqGridDamage + liqDamage + storm * 0.1 + fire * 0.15 + atmoRiver * 0.05 + threatDamage * 0.5, 0, 0.8); // 0.8 cap prevents total grid destruction
  // Damage persists and recovers over quarters
  // 0.15 = investment-accelerated recovery rate; 0.05 = base natural recovery per year — utility restoration timelines, NERC State of Reliability
  var damageRecovery = gridInvestment * 0.15 + 0.05;
  var gridDamage = cl(Math.max(prevGridDamage - damageRecovery * 0.25, 0) + newDamage, 0, 0.8); // 0.25 = quarterly fraction of annual recovery

  var gridReliability = cl(
    0.95 // baseline reliability = 95% (SAIDI/SAIFI equivalent) — NERC State of Reliability 2023, PNW utility avg
    - cl(1 - reserveMargin * 3, 0, 0.3) * 0.2  // low reserve margin penalty (3x scaling, max 0.06 reduction) — NERC resource adequacy
    - gridAge * 0.1                               // aging infrastructure penalty, max 0.1 — ASCE infrastructure report card
    - gridDamage * 0.5                            // earthquake/disaster damage penalty, max 0.4 — post-event utility data
    - cl(unmetDemand / Math.max(totalDemand, 1), 0, 0.3) * 0.3 // unmet demand penalty, max 0.09 — load shedding protocols
    + gridInvestment * 0.05                        // modernization bonus, max 0.05 — smart grid reliability improvements
    + microgridCapability * 0.03                   // distributed resilience bonus, max 0.024 — DOE microgrid R&D data
  , 0, 1);

  // ── GRID RESILIENCE SCORE ──
  // Composite resilience: diversity of sources, storage, microgrids, low threat exposure
  // Herfindahl-Hirschman Index (HHI) for source diversity — inverse concentration
  var sourceDiv = cl(1 - Math.pow(hydroGeneration / Math.max(totalGeneration, 1), 2)
    - Math.pow(gasGeneration / Math.max(totalGeneration, 1), 2), 0, 1);
  // Weights: 25% diversity + 20% storage + 20% microgrids + 20% reliability + 15% reserves = 100%
  var gridResilience = cl(
    sourceDiv * 0.25
    + cl(totalStorage / 3000, 0, 1) * 0.20 // 3000 MWh = target storage for PNW resilience — NWPCC 2021 Power Plan
    + microgridCapability * 0.20
    + gridReliability * 0.20
    + cl(reserveMargin * 3, 0, 1) * 0.15 // 3x scaling: 33% reserve margin → full score
  , 0, 1);

  // ── GRID VULNERABILITY ──
  // Composite: drought, heat wave, earthquake exposure
  // Drought vulnerability weights: 50% drought stress + 30% low reservoirs
  var droughtVulnerability = cl(droughtStress * 0.5 + (1 - reservoirLevel) * 0.3, 0, 1);
  // Heat wave: 0.1 per °C SST delta — summer peak demand vulnerability
  var heatWaveVulnerability = cl(seasonalPeak(quarter, 2.0, 0.6) * sstDelta * 0.1, 0, 1);
  // Vulnerability weights: 40% drought + 30% heat + 30% physical damage
  var gridVulnerability = cl(
    droughtVulnerability * 0.4
    + heatWaveVulnerability * 0.3
    + gridDamage * 0.3
  , 0, 1);

  // ── ELECTRICITY PRICE ──
  // Base: $0.09/kWh (cheap hydro). Rises with gas dependency, low reserves, damage
  var basePrice = 0.09; // $/kWh, PNW avg residential rate — EIA state electricity profiles 2023, WA avg ~$0.09/kWh
  var gasFraction = gasGeneration / Math.max(totalGeneration, 1);
  var electricityPrice = cl(
    basePrice
    + gasFraction * 0.08          // gas is more expensive: adds up to $0.08/kWh at 100% gas — Lazard LCOE v16, gas LCOE ~$0.05-0.08/kWh premium over hydro
    + cl(-reserveMargin, 0, 0.3) * 0.05  // scarcity premium: up to $0.05/kWh when reserves negative — CAISO scarcity pricing data
    + gridDamage * 0.03           // repair costs passed to ratepayers: up to $0.03/kWh — utility rate case filings post-disaster
    + totalDCDemand / 8000 * 0.02 // demand pressure: $0.02/kWh at 8000 MW DC load — TODO-CITE: DC demand price elasticity — source needed
    - gridInvestment * 0.01       // efficiency gains: up to $0.01/kWh savings — smart grid efficiency studies
    + rateIncreasePressure * 0.02 // utility death spiral: up to ~$0.02/kWh — RMI 2014 death spiral analysis
  , 0.05, 0.30); // bounds: $0.05/kWh floor (below cost), $0.30/kWh cap — historical PNW rate range

  // ── CARBON INTENSITY & EMISSIONS ──
  // Gas: ~0.45 tonnes CO2/MWh. Hydro/nuclear/wind/solar: ~0
  var gasEmissionRate = 0.45; // tonnes CO2/MWh, natural gas combined cycle — EPA eGRID 2022, US avg NGCC emission rate
  var gasEmissions = gasGeneration * gasEmissionRate * 0.25 * 8760 / 4; // quarterly tonnes — NOTE: this line has a redundant calculation, see totalEmissions below
  // Annualize: MW * hours/quarter
  var hoursPerQuarter = 8760 / 4; // 2190 hours/quarter, based on 8760 hours/year
  var totalEmissions = gasGeneration * gasEmissionRate * hoursPerQuarter / 1e6; // million tonnes CO2/quarter
  var gridCarbonIntensity = cl(gasFraction * 0.45, 0, 0.45); // tonnes CO2/MWh blended grid average — EPA eGRID

  // ── GENERATION FRACTIONS ──
  var hydroFraction = hydroGeneration / Math.max(totalGeneration, 1);
  var renewableFraction = (windGeneration + solarGeneration + tidalGeneration + rooftopGeneration + communityWindGen + communityTidalGen) / Math.max(totalGeneration, 1);
  var cleanFraction = cleanGeneration / Math.max(totalGeneration, 1);

  // ── DUCK CURVE INDICATOR ──
  // Midday solar surplus, evening ramp-up need — stress on gas peakers
  // 3x multiplier amplifies solar/demand ratio to 0-1 indicator scale — CAISO duck curve analysis
  var duckCurve = cl((solarGeneration + rooftopGeneration) / Math.max(totalDemand, 1) * 3, 0, 1);

  // ── FISH SPILL COST ($/MWh equivalent) ──
  // Economic cost of spilling water for fish passage instead of generating
  var fishSpillCostDollars = fishSpillCost * electricityPrice * hoursPerQuarter / 1e6; // $M/quarter — BPA spill cost estimates, CRITFC economic analysis

  // ═══════════════════════════════════════════════════════════
  // TASK 6: RETURN ALL NEW STATE FIELDS
  // ═══════════════════════════════════════════════════════════

  return {
    state: {
      // Generation (MW)
      hydroGeneration: hydroGeneration,
      nuclearGeneration: nuclearGeneration,
      gasGeneration: gasGeneration,
      windGeneration: windGeneration,
      solarGeneration: solarGeneration,
      tidalGeneration: tidalGeneration,
      bcImportGeneration: bcImportGeneration,
      totalGeneration: totalGeneration,
      cleanGeneration: cleanGeneration,
      // Distributed generation
      solarAdoption: solarAdoption,
      rooftopGeneration: rooftopGeneration,
      batteryAdoption: batteryAdoption,
      totalStorage: totalStorage,
      storageValue: storageValue,
      communityWindGen: communityWindGen,
      communityTidalGen: communityTidalGen,
      microgridCapability: microgridCapability,
      // AI / Data center
      totalDCDemand: totalDCDemand,
      aiTrainingDemand: aiTrainingDemand,
      aiInferenceDemand: aiInferenceDemand,
      dcWaterConsumption: dcWaterConsumption,
      grantCountyStress: grantCountyStress,
      // Future tech
      smrCapacity: smrCapacity,
      smrGeneration: smrGeneration,
      fusionCapacity: fusionCapacity,
      fusionGeneration: fusionGeneration,
      // Hydrogen
      hydrogenProduction: hydrogenProduction,
      // Grid threats
      threatDamage: threatDamage,
      distributedSurvival: distributedSurvival,
      // Grid resilience
      gridResilience: gridResilience,
      // Demand (MW)
      baseDemand: baseDemand,
      totalDemand: totalDemand,
      dataCenterDemand: dataCenterDemand,
      evDemand: evDemand,
      portDemand: portDemand,
      unmetDemand: unmetDemand,
      // Grid metrics
      gridReliability: gridReliability,
      gridVulnerability: gridVulnerability,
      electricityPrice: electricityPrice,
      gridCarbonIntensity: gridCarbonIntensity,
      reserveMargin: reserveMargin,
      gridDamage: gridDamage,
      // Fractions
      hydroFraction: hydroFraction,
      gasFraction: gasFraction,
      renewableFraction: renewableFraction,
      cleanFraction: cleanFraction,
      duckCurve: duckCurve,
      // Salmon-hydro tradeoff
      fishSpillCost: fishSpillCost,
      fishSpillCostDollars: fishSpillCostDollars,
      spillForFish: spillForFish,
      // Emissions
      totalEmissions: totalEmissions,
      gasEmissions: gasEmissions,
      // Capacities (for carry-forward)
      windCapacity: windCapacity,
      solarCapacity: solarCapacity,
      tidalCapacity: tidalCapacity,
      // CETA
      cetaPhaseout: cetaEffective,
      // Seasonal
      hydroCF: hydroCF,
      nuclearCF: nuclearCF * (1 - nuclearEqShutdown),
    },
    exports: {
      electricityPrice: electricityPrice,
      gridReliability: gridReliability,
      gridCarbonIntensity: gridCarbonIntensity,
      gasEmissions: totalEmissions,
      gridResilience: gridResilience,
    },
    // Carry-forward state for next quarter
    _carry: {
      gridDamage: gridDamage,
      windCapacity: windCapacity,
      solarCapacity: solarCapacity,
      tidalCapacity: tidalCapacity,
      dataCenterDemand: dataCenterBase,  // carry base demand (before cooling), not inflated totalDCDemand
      evDemand: evDemand,
      electricityPrice: electricityPrice,
      cleanFraction: cleanFraction,
    }
  };
}
