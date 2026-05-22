// ═══════════════════════════════════════════════════════════
// computePSWatersheds.js — Puget Sound Watersheds (North)
// ═══════════════════════════════════════════════════════════
// Individual river models for Skagit, Snohomish, and Nooksack —
// the three northern Puget Sound watersheds most important for
// Southern Resident killer whale Chinook prey.
//
// Each watershed: hydrology, dams, glaciers, salmon stocks,
// land use, water quality, tribal context.
//
// Key references:
//   Hamlet et al. 2013 — WA climate impacts on hydrology
//   Beechie et al. 2006 — Skagit salmon habitat assessment
//   Ruckelshaus et al. 2002 — Puget Sound Chinook recovery plan
//   WDFW SaSI — Salmon & Steelhead Inventory
//   Mauger et al. 2015 — Puget Sound climate impacts (CIG)
//   Snover et al. 2013 — climate-ready water management
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl, seasonalPeak, seededRandom } from './utils.js';

export function computePSWatersheds(P, prev, shocks, quarter, year, climD, climExports, pacExports) {
  var sstDelta = climD ? (climD.sstDelta !== undefined ? climD.sstDelta : 0) : 0;
  var yearsSince2026 = year - 2026;
  var _prev = prev || {};

  // Disaster shocks
  var earthquake = shocks.earthquake || 0;
  var atmoRiver = shocks.atmosphericRiver || 0;
  var fire = shocks.wildfire || 0;

  // Climate exports
  var ce = climExports || {};
  var basinPrecip = ce.climBbasinPrecip || {};
  var basinTemps = ce.climBasinTemps || {};

  // Pacific marine survival
  var pe = pacExports || {};
  var marineSurvChinook = pe.pacMarineSurvChinook !== undefined ? pe.pacMarineSurvChinook : 0.04;
  var marineSurvPink = pe.pacMarineSurvPink !== undefined ? pe.pacMarineSurvPink : 0.06;
  var marineSurvCoho = pe.pacMarineSurvBase !== undefined ? pe.pacMarineSurvBase * 0.9 : 0.035;

  // ── USER PARAMETERS ──
  var damRemovalPolicy = (P.damRemovalPolicy !== undefined ? P.damRemovalPolicy : 0) / 3;
  var fishingPressure = (P.fishingPressure !== undefined ? P.fishingPressure : 40) / 100;
  var habitatRestoration = (P.habitatRestoration !== undefined ? P.habitatRestoration : 20) / 100;
  var agIntensity = (P.agIntensity !== undefined ? P.agIntensity : 50) / 100;
  var urbanGrowth = (P.urbanGrowth !== undefined ? P.urbanGrowth : 40) / 100;
  // skagitDamPolicy (default 50%): Skagit-specific dam operations for fish passage
  // At 0%: status quo (high dam fraction). At 100%: maximum fish-friendly operations.
  // Combines with ecosystem-wide damRemovalPolicy for total passage improvement.
  var skagitDamPolicyBonus = (P.skagitDamPolicy !== undefined ? P.skagitDamPolicy : 50) / 100;

  // ═══════════════════════════════════════════════════════════
  // 1. SKAGIT RIVER (8,000 km², mean 470 m³/s)
  // ═══════════════════════════════════════════════════════════
  // Largest Puget Sound river. Dual-peak: Nov-Dec rain, May-Jun snowmelt.
  // Glacier Peak + Mt. Baker glaciers. 3 SCL dams + 2 PSE Baker dams.
  // Skagit Delta: largest PS delta, critical estuary habitat.
  // MOST IMPORTANT PS Chinook stocks for SRKW (Beechie et al. 2006).

  var prevSkagit = _prev.skagit || {};

  // ── SKAGIT HYDROLOGY ──
  var skagitBasePrecip = basinPrecip.whidbey || 200; // Skagit drains into Whidbey Basin
  var skagitTemp = basinTemps.whidbey !== undefined ? basinTemps.whidbey : 10;

  // Dual-peak hydrology (Hamlet et al. 2013)
  var rainPeak = seasonalPeak(quarter, 3.5, 0.7); // Nov-Dec rain peak
  var snowPeak = seasonalPeak(quarter, 1.5, 0.6); // May-Jun snowmelt peak
  var skagitSeasonal = cl(0.3 + rainPeak * 0.35 + snowPeak * 0.35, 0.3, 1.0);

  // Glacier contribution (Glacier Peak + Mt. Baker)
  var prevGlacier = prevSkagit.glacierMass !== undefined ? prevSkagit.glacierMass : 1.0;
  var glacierMeltRate = cl(0.006 + sstDelta * 0.004, 0.003, 0.03);
  var skagitGlacierMass = cl(prevGlacier - glacierMeltRate * 0.25, 0, 1.2);
  var glacierFlow = skagitGlacierMass * 50 * seasonalPeak(quarter, 2, 0.8); // ~50 m³/s at full mass, summer peak

  // AR events amplify discharge
  var arBoost = atmoRiver > 0.2 ? atmoRiver * 2.0 : 0;

  // Base discharge
  var skagitDischarge = cl(470 * skagitSeasonal * (1 + arBoost) + glacierFlow, 100, 3000);

  // ── SKAGIT DAMS ──
  // 3 Seattle City Light dams: Gorge (1924), Diablo (1930), Ross (1949)
  // Total ~700 MW. Ross Dam blocks passage above river km 159.
  // Baker River dams: Upper Baker (1959), Lower Baker (1927). Fish passage ~30%.
  var skagitDamFrac = cl(1 - damRemovalPolicy * 0.5, 0, 1);
  var bakerDamFrac = cl(1 - damRemovalPolicy * 0.4, 0, 1);

  // Dam effects
  var skagitFlowReg = 0.6 * skagitDamFrac; // dampens peaks, augments lows
  var skagitSedTrap = 0.7 * skagitDamFrac; // traps 70% of upstream sediment
  // skagitDamPolicy adds fish-friendly operations even without physical removal
  var skagitPassage = cl(0.5 + (1 - skagitDamFrac) * 0.5 + skagitDamPolicyBonus * 0.2, 0, 1);
  var bakerPassage = cl(0.3 + (1 - bakerDamFrac) * 0.5, 0, 1);

  // Regulated discharge (dams smooth the hydrograph)
  var floodDampen = skagitFlowReg * 0.15 * (quarter === 0 || quarter === 3 ? 1 : 0.3);
  var lowFlowAugment = skagitFlowReg * 0.10 * (quarter === 2 ? 1 : 0.3);
  skagitDischarge = skagitDischarge * (1 - floodDampen + lowFlowAugment);

  // ── SKAGIT WATER TEMPERATURE ──
  // Summer dam releases warm water (hypolimnetic release from reservoirs)
  var damTempAdd = 1.5 * skagitDamFrac * seasonalPeak(quarter, 2, 0.8);
  var glacierCooling = cl(glacierFlow / Math.max(skagitDischarge, 100) * 3, 0, 2);
  var skagitTemp2 = cl(skagitTemp * 0.8 + damTempAdd - glacierCooling + sstDelta * 0.5, 2, 20);

  // ── SKAGIT LAND USE ──
  var skagitAgNutrients = agIntensity * 300; // kg N/day (Skagit Valley agriculture)
  var skagitUrbanRunoff = urbanGrowth * 100;
  var skagitSediment = cl(200 * (1 - skagitSedTrap * 0.5) + atmoRiver * 500 + fire * 200, 50, 3000); // tonnes/day

  // ── SKAGIT SALMON ──
  // Spring Chinook: THE most SRKW-critical PS stock (Beechie et al. 2006)
  // Run timing: Apr-Jun. Spawn in upper Skagit tributaries.
  var prevSkSalmon = prevSkagit.salmon || {};

  // Habitat quality
  var skHabitatQ = cl(0.5 + habitatRestoration * 0.3 - urbanGrowth * 0.15 - agIntensity * 0.1 + (1 - skagitDamFrac) * 0.15, 0.1, 1);
  var skSpawningSuccess = cl(skHabitatQ * (1 - cl((skagitTemp2 - 16) / 6, 0, 0.5)), 0.1, 0.9);

  // Spring Chinook (small, critically important)
  var prevSpChinook = prevSkSalmon.springChinook || 8000;
  var spChReturn = cl(prevSpChinook * marineSurvChinook / 0.04 * skagitPassage, 500, 50000);
  var spChHarvest = spChReturn * fishingPressure * 0.3; // low harvest (conservation closures)
  var spChSpawners = cl(spChReturn - spChHarvest, 100, 40000);
  // Spring Chinook spawn Apr-Jun (Q1), not fall — distinct from summer Chinook and other stocks
  var spChSmolts = spChSpawners * 2000 * skSpawningSuccess * (quarter === 1 ? 1 : 0);

  // Summer Chinook
  var prevSuChinook = prevSkSalmon.summerChinook || 12000;
  var suChReturn = cl(prevSuChinook * marineSurvChinook / 0.04 * skagitPassage, 1000, 80000);
  var suChHarvest = suChReturn * fishingPressure * 0.4;
  var suChSpawners = cl(suChReturn - suChHarvest, 500, 60000);
  var suChSmolts = suChSpawners * 2200 * skSpawningSuccess * (quarter === 3 ? 1 : 0);

  // Skagit Pink (odd-year dominant, very large runs)
  var pinkCycle = (year % 2 === 1) ? 5.0 : 0.3;
  var prevPink = prevSkSalmon.pink || 500000;
  var pinkReturn = cl(prevPink * marineSurvPink / 0.06 * pinkCycle, 10000, 5000000);
  var pinkHarvest = pinkReturn * fishingPressure * 0.4;
  var pinkSpawners = cl(pinkReturn - pinkHarvest, 5000, 4000000);

  // Skagit Coho
  var prevCoho = prevSkSalmon.coho || 30000;
  var cohoReturn = cl(prevCoho * marineSurvCoho / 0.035 * bakerPassage, 5000, 200000);
  var cohoHarvest = cohoReturn * fishingPressure * 0.3;
  var cohoSpawners = cl(cohoReturn - cohoHarvest, 2000, 150000);
  var cohoSmolts = cohoSpawners * 2500 * skSpawningSuccess * cl(skHabitatQ * 0.8, 0.1, 0.8) * (quarter === 3 ? 1 : 0);

  // Skagit Chinook availability for SRKW (spring + summer combined)
  var skagitChinookAvail = cl((spChSpawners + suChSpawners) / 50000 * seasonalPeak(quarter, 1.5, 1.0) * 0.4, 0, 3);

  var skagitSalmon = {
    springChinook: spChSpawners, summerChinook: suChSpawners,
    pink: pinkSpawners, coho: cohoSpawners,
    totalReturn: spChReturn + suChReturn + pinkReturn + cohoReturn,
    smolts: spChSmolts + suChSmolts + cohoSmolts,
  };

  // ═══════════════════════════════════════════════════════════
  // 2. SNOHOMISH RIVER (4,700 km², mean 270 m³/s)
  // ═══════════════════════════════════════════════════════════
  // Skykomish + Snoqualmie converge near Monroe.
  // Convergence Zone flooding vulnerability. Rapid suburban development.

  var prevSnohomish = _prev.snohomish || {};

  // Hydrology: mixed rain/snow, strong CZ influence
  var snohPrecip = basinPrecip.mainBasin || 200;
  var snohTemp = basinTemps.mainBasin !== undefined ? basinTemps.mainBasin : 10;

  // CZ boost: convergence zone drops extra precip on this watershed
  var czActive = ce.climConvergenceZone || 0;
  var czBoost = czActive ? 0.3 : 0;

  var snohSeasonal = cl(0.35 + seasonalPeak(quarter, 3.5, 0.7) * 0.35 + seasonalPeak(quarter, 1.5, 0.7) * 0.30, 0.3, 1.0);
  var snohDischarge = cl(270 * snohSeasonal * (1 + czBoost + atmoRiver * 1.5), 60, 2000);

  // Water temperature
  var snohTemp2 = cl(snohTemp * 0.85 + sstDelta * 0.5, 2, 19);

  // Land use: rapid development pressure
  var snohUrbanFrac = cl(urbanGrowth * 1.2, 0, 0.8); // Everett/Marysville expanding fast
  var snohNutrients = urbanGrowth * 150 + agIntensity * 100;
  var snohSediment = cl(100 + atmoRiver * 300 + snohUrbanFrac * 80, 30, 2000);

  // Salmon: Snohomish Chinook + coho
  var prevSnSalmon = prevSnohomish.salmon || {};
  var snHabitatQ = cl(0.45 + habitatRestoration * 0.3 - snohUrbanFrac * 0.2, 0.1, 0.9);
  var snSpawnSuccess = cl(snHabitatQ * (1 - cl((snohTemp2 - 16) / 6, 0, 0.4)), 0.1, 0.85);

  var prevSnChinook = prevSnSalmon.chinook || 10000;
  var snChReturn = cl(prevSnChinook * marineSurvChinook / 0.04, 1000, 60000);
  var snChSpawners = cl(snChReturn * (1 - fishingPressure * 0.4), 500, 50000);
  var snChSmolts = snChSpawners * 2000 * snSpawnSuccess * (quarter === 3 ? 1 : 0);

  var prevSnCoho = prevSnSalmon.coho || 20000;
  var snCoReturn = cl(prevSnCoho * marineSurvCoho / 0.035, 3000, 100000);
  var snCoSpawners = cl(snCoReturn * (1 - fishingPressure * 0.3), 1500, 80000);
  var snCoSmolts = snCoSpawners * 2200 * snSpawnSuccess * cl(snHabitatQ * 0.8, 0.1, 0.7) * (quarter === 3 ? 1 : 0);

  var snohChinookAvail = cl(snChSpawners / 30000 * seasonalPeak(quarter, 1.5, 1.0) * 0.3, 0, 2);

  var snohSalmon = {
    chinook: snChSpawners, coho: snCoSpawners,
    totalReturn: snChReturn + snCoReturn,
    smolts: snChSmolts + snCoSmolts,
  };

  // ═══════════════════════════════════════════════════════════
  // 3. NOOKSACK RIVER (2,000 km², mean 100 m³/s)
  // ═══════════════════════════════════════════════════════════
  // Drains Mt. Baker north side. Three forks.
  // Whatcom County dairy: one of most intensive in WA.
  // Lummi Nation reef-net fishery. Chronic flooding.

  var prevNooksack = _prev.nooksack || {};

  // Hydrology
  var nkPrecip = basinPrecip.georgia || 180;
  var nkTemp = basinTemps.georgia !== undefined ? basinTemps.georgia : 9;

  // Mt. Baker glaciers (retreating)
  var prevNkGlacier = prevNooksack.glacierMass !== undefined ? prevNooksack.glacierMass : 1.0;
  var nkGlacierMelt = cl(0.008 + sstDelta * 0.005, 0.004, 0.035);
  var nkGlacierMass = cl(prevNkGlacier - nkGlacierMelt * 0.25, 0, 1.2);
  var nkGlacierFlow = nkGlacierMass * 15 * seasonalPeak(quarter, 2, 0.8);

  var nkSeasonal = cl(0.35 + seasonalPeak(quarter, 3.5, 0.7) * 0.35 + seasonalPeak(quarter, 1.5, 0.6) * 0.30, 0.3, 1.0);
  var nkDischarge = cl(100 * nkSeasonal + nkGlacierFlow + atmoRiver * 200, 20, 800);

  // Water temperature
  var nkGlacierCooling = cl(nkGlacierFlow / Math.max(nkDischarge, 20) * 2, 0, 1.5);
  var nkTemp2 = cl(nkTemp * 0.8 - nkGlacierCooling + sstDelta * 0.5, 1, 18);

  // Agriculture: Whatcom County dairy is massive
  // Fecal coliform from dairy causes shellfish bed closures in Bellingham Bay
  var nkDairyIntensity = agIntensity * 1.5; // higher than regional average
  var nkNutrients = nkDairyIntensity * 400; // kg N/day — very high
  var nkFecalColiform = cl(nkDairyIntensity * 0.6, 0, 1); // index 0-1
  var nkSediment = cl(80 + atmoRiver * 250 + nkDairyIntensity * 50, 20, 1500);

  // Salmon: Nooksack Chinook (concern) + coho
  var prevNkSalmon = prevNooksack.salmon || {};
  var nkHabitatQ = cl(0.4 + habitatRestoration * 0.3 - nkDairyIntensity * 0.15 - urbanGrowth * 0.1, 0.1, 0.85);
  var nkSpawnSuccess = cl(nkHabitatQ * (1 - cl((nkTemp2 - 15) / 5, 0, 0.5)), 0.1, 0.8);

  // South Fork Nooksack early Chinook: nearly extinct
  var prevNkChinook = prevNkSalmon.chinook || 3000;
  var nkChReturn = cl(prevNkChinook * marineSurvChinook / 0.04, 200, 20000);
  var nkChSpawners = cl(nkChReturn * (1 - fishingPressure * 0.3), 100, 15000);
  var nkChSmolts = nkChSpawners * 1800 * nkSpawnSuccess * (quarter === 3 ? 1 : 0);

  var prevNkCoho = prevNkSalmon.coho || 8000;
  var nkCoReturn = cl(prevNkCoho * marineSurvCoho / 0.035, 1000, 50000);
  var nkCoSpawners = cl(nkCoReturn * (1 - fishingPressure * 0.3), 500, 40000);
  var nkCoSmolts = nkCoSpawners * 2000 * nkSpawnSuccess * cl(nkHabitatQ * 0.7, 0.1, 0.7) * (quarter === 3 ? 1 : 0);

  var nkChinookAvail = cl(nkChSpawners / 10000 * seasonalPeak(quarter, 1.5, 1.0) * 0.2, 0, 1);

  var nkSalmon = {
    chinook: nkChSpawners, coho: nkCoSpawners,
    totalReturn: nkChReturn + nkCoReturn,
    smolts: nkChSmolts + nkCoSmolts,
  };

  // ═══════════════════════════════════════════════════════════
  // 4. PUYALLUP RIVER (2,700 km², mean 90 m³/s)
  // ═══════════════════════════════════════════════════════════
  // Drains Mt. Rainier's north/west flanks. Lahar hazard zone.
  // Mud Mountain Dam (flood control). Puyallup Tribe.
  // Very high glacial sediment. Feeds Main Basin (Commencement Bay).
  // USGS gauge 12101500 at Puyallup.

  var prevPuyallup = _prev.puyallup || {};

  // Hydrology: glacial meltwater dominant in summer (Rainier = largest glacial system in lower 48)
  var pyTemp = basinTemps.mainBasin !== undefined ? basinTemps.mainBasin : 10;
  var prevPyGlacier = prevPuyallup.glacierMass !== undefined ? prevPuyallup.glacierMass : 1.0;
  var pyGlacierMelt = cl(0.005 + sstDelta * 0.004, 0.003, 0.025);
  var pyGlacierMass = cl(prevPyGlacier - pyGlacierMelt * 0.25, 0, 1.2);
  var pyGlacierFlow = pyGlacierMass * 30 * seasonalPeak(quarter, 2, 0.7); // Rainier glaciers: ~30 m³/s peak

  var pySeasonal = cl(0.35 + seasonalPeak(quarter, 3.5, 0.7) * 0.30 + seasonalPeak(quarter, 1.5, 0.7) * 0.35, 0.3, 1.0);
  var pyUrbanGrowth2 = (P.puyallupUrbanGrowth !== undefined ? P.puyallupUrbanGrowth : 50) / 100;
  var pyDischarge = cl(90 * pySeasonal + pyGlacierFlow + atmoRiver * 150, 20, 600);

  // Lahar disaster coupling: if Rainier lahar shock active, massive sediment pulse
  var laharShock = shocks.rainier_lahar || 0;

  // Temperature: glacial cooling strong in summer
  var pyGlacierCooling = cl(pyGlacierFlow / Math.max(pyDischarge, 20) * 4, 0, 3); // very cold glacial water
  var pyTemp2 = cl(pyTemp * 0.75 - pyGlacierCooling + sstDelta * 0.5, 1, 18);

  // Sediment: very high glacial sediment (Rainier volcanoclastic material)
  var pyGlacialSediment = pyGlacierMass * 150; // much higher than other rivers (volcanic source)
  var pyLaharSediment = laharShock > 0.1 ? laharShock * 5000 : 0; // catastrophic during lahar
  var pySediment = cl(pyGlacialSediment + pyUrbanGrowth2 * 60 + atmoRiver * 300 + pyLaharSediment, 30, 10000);
  var pyNutrients = pyUrbanGrowth2 * 200 + agIntensity * 80;

  // Salmon: White River spring Chinook + coho
  var prevPySalmon = prevPuyallup.salmon || {};
  // Mud Mountain Dam passage ~40% baseline
  var mudMtnPassage = cl(0.4 + habitatRestoration * 0.3, 0, 1);
  var pyHabitatQ = cl(0.4 + habitatRestoration * 0.25 - pyUrbanGrowth2 * 0.2 - laharShock * 0.4, 0.05, 0.85);
  var pySpawnSuccess = cl(pyHabitatQ * (1 - cl((pyTemp2 - 16) / 6, 0, 0.5)), 0.1, 0.8);

  var prevPyChinook = prevPySalmon.chinook || 5000;
  var pyChReturn = cl(prevPyChinook * marineSurvChinook / 0.04 * mudMtnPassage, 300, 30000);
  var pyChSpawners = cl(pyChReturn * (1 - fishingPressure * 0.35), 200, 25000);
  var pyChSmolts = pyChSpawners * 1800 * pySpawnSuccess * (quarter === 3 ? 1 : 0);

  var prevPyCoho = prevPySalmon.coho || 10000;
  var pyCoReturn = cl(prevPyCoho * marineSurvCoho / 0.035, 1500, 50000);
  var pyCoSpawners = cl(pyCoReturn * (1 - fishingPressure * 0.3), 800, 40000);

  var pyChinookAvail = cl(pyChSpawners / 15000 * seasonalPeak(quarter, 1.5, 1.0) * 0.25, 0, 1.5);
  var pySalmon = { chinook: pyChSpawners, coho: pyCoSpawners, totalReturn: pyChReturn + pyCoReturn, smolts: pyChSmolts };

  // ═══════════════════════════════════════════════════════════
  // 5. NISQUALLY RIVER (1,850 km², mean 55 m³/s)
  // ═══════════════════════════════════════════════════════════
  // THE SUCCESS STORY. Nisqually Delta restoration (2009, 762 acres).
  // Nisqually Tribe co-management. Alder + La Grande dams (Tacoma Power).
  // JBLM military base in watershed. Nisqually NWR.
  // Feeds South Sound. USGS gauge 12089500.

  var prevNisqually = _prev.nisqually || {};
  var nisquallyRestoration = (P.nisquallyRestorationLevel !== undefined ? P.nisquallyRestorationLevel : 60) / 100;

  // Hydrology
  var nsTemp = basinTemps.southSound !== undefined ? basinTemps.southSound : 9;
  var prevNsGlacier = prevNisqually.glacierMass !== undefined ? prevNisqually.glacierMass : 1.0;
  var nsGlacierMelt = cl(0.005 + sstDelta * 0.004, 0.003, 0.025);
  var nsGlacierMass = cl(prevNsGlacier - nsGlacierMelt * 0.25, 0, 1.2);
  var nsGlacierFlow = nsGlacierMass * 15 * seasonalPeak(quarter, 2, 0.7);

  var nsSeasonal = cl(0.35 + seasonalPeak(quarter, 3.5, 0.7) * 0.30 + seasonalPeak(quarter, 1.5, 0.6) * 0.35, 0.3, 1.0);
  // Alder/La Grande dams regulate flow
  var nsDamReg = 0.4; // moderate flow regulation
  var nsDischarge = cl(55 * nsSeasonal * (1 - nsDamReg * 0.1 + nsDamReg * 0.05) + nsGlacierFlow + atmoRiver * 100, 15, 400);

  // Temperature
  var nsGlacierCooling = cl(nsGlacierFlow / Math.max(nsDischarge, 15) * 3, 0, 2);
  var nsTemp2 = cl(nsTemp * 0.8 - nsGlacierCooling + sstDelta * 0.5, 1, 18);

  // Land use: JBLM protects large areas, but some contamination
  var nsSediment = cl(40 + atmoRiver * 150, 15, 800);
  var nsNutrients = agIntensity * 60 + urbanGrowth * 40;

  // Salmon: Nisqually Chinook (recovery success!) + coho + chum
  var prevNsSalmon = prevNisqually.salmon || {};
  // Delta restoration dramatically improves estuary rearing habitat
  var nsHabitatQ = cl(0.35 + nisquallyRestoration * 0.4 + habitatRestoration * 0.15 - urbanGrowth * 0.08, 0.1, 0.95);
  // Nisqually dam passage improved through fish ladder upgrades
  var nsDamPassage = cl(0.5 + habitatRestoration * 0.2, 0, 1);
  var nsSpawnSuccess = cl(nsHabitatQ * (1 - cl((nsTemp2 - 15) / 5, 0, 0.4)), 0.15, 0.9);

  var prevNsChinook = prevNsSalmon.chinook || 6000;
  var nsChReturn = cl(prevNsChinook * marineSurvChinook / 0.04 * nsDamPassage, 500, 40000);
  var nsChSpawners = cl(nsChReturn * (1 - fishingPressure * 0.3), 300, 35000);
  var nsChSmolts = nsChSpawners * 2200 * nsSpawnSuccess * (quarter === 3 ? 1 : 0);

  var prevNsCoho = prevNsSalmon.coho || 12000;
  var nsCoReturn = cl(prevNsCoho * marineSurvCoho / 0.035, 2000, 60000);
  var nsCoSpawners = cl(nsCoReturn * (1 - fishingPressure * 0.3), 1000, 50000);

  var nsChinookAvail = cl(nsChSpawners / 20000 * seasonalPeak(quarter, 1.5, 1.0) * 0.2, 0, 1);
  var nsSalmon = { chinook: nsChSpawners, coho: nsCoSpawners, totalReturn: nsChReturn + nsCoReturn, smolts: nsChSmolts };

  // ═══════════════════════════════════════════════════════════
  // 6. STILLAGUAMISH RIVER (1,800 km², mean 75 m³/s)
  // ═══════════════════════════════════════════════════════════
  // North and South forks. Oso landslide (2014, 43 killed).
  // Stillaguamish Tribe. Mix of forestry, agriculture, rural.
  // Feeds Whidbey Basin. USGS gauge 12167000.

  var prevStilly = _prev.stillaguamish || {};
  var stillyForestry = (P.stillaguamishForestry !== undefined ? P.stillaguamishForestry : 40) / 100;

  // Hydrology: rain-dominant, no significant glaciers
  var stTemp = basinTemps.whidbey !== undefined ? basinTemps.whidbey : 10;
  var stSeasonal = cl(0.35 + seasonalPeak(quarter, 3.5, 0.7) * 0.40 + seasonalPeak(quarter, 1.5, 0.5) * 0.25, 0.3, 1.0);
  var stDischarge = cl(75 * stSeasonal + atmoRiver * 150, 15, 500);

  // Temperature
  var stForestCooling = cl((1 - stillyForestry) * 0.5, 0, 0.5); // intact riparian cools streams
  var stTemp2 = cl(stTemp * 0.85 - stForestCooling + sstDelta * 0.5 + stillyForestry * 0.3, 2, 19);

  // Oso landslide legacy + stochastic landslide risk
  var prevOsoScar = prevStilly.osoScar !== undefined ? prevStilly.osoScar : 0.15; // decaying since 2014
  var slideSeed = seededRandom(year * 100 + quarter + 55577);
  var slideProb = cl(0.005 + atmoRiver * 0.03 + stillyForestry * 0.01, 0, 0.08); // deforestation + rain = higher risk
  var newSlide = slideSeed < slideProb ? 1 : 0;
  var osoScar = cl(Math.max(prevOsoScar, newSlide ? 0.3 : 0) * Math.exp(-1 / 40), 0, 0.5); // ~10yr recovery

  // Sediment: elevated by Oso scar + forestry roads
  var stSediment = cl(60 + osoScar * 800 + stillyForestry * 100 + atmoRiver * 250, 20, 2000);
  var stNutrients = agIntensity * 80 + urbanGrowth * 50 + stillyForestry * 30;

  // Salmon: Chinook + coho
  var prevStSalmon = prevStilly.salmon || {};
  var stHabitatQ = cl(0.4 + habitatRestoration * 0.3 - stillyForestry * 0.15 - osoScar * 0.2 - urbanGrowth * 0.1, 0.1, 0.85);
  var stSpawnSuccess = cl(stHabitatQ * (1 - cl((stTemp2 - 16) / 6, 0, 0.4)), 0.1, 0.8);

  var prevStChinook = prevStSalmon.chinook || 4000;
  var stChReturn = cl(prevStChinook * marineSurvChinook / 0.04, 300, 25000);
  var stChSpawners = cl(stChReturn * (1 - fishingPressure * 0.35), 150, 20000);
  var stChSmolts = stChSpawners * 1800 * stSpawnSuccess * (quarter === 3 ? 1 : 0);

  var prevStCoho = prevStSalmon.coho || 8000;
  var stCoReturn = cl(prevStCoho * marineSurvCoho / 0.035, 1000, 40000);
  var stCoSpawners = cl(stCoReturn * (1 - fishingPressure * 0.3), 500, 30000);

  var stChinookAvail = cl(stChSpawners / 12000 * seasonalPeak(quarter, 1.5, 1.0) * 0.2, 0, 1);
  var stSalmon = { chinook: stChSpawners, coho: stCoSpawners, totalReturn: stChReturn + stCoReturn, smolts: stChSmolts };

  // ═══════════════════════════════════════════════════════════
  // AGGREGATES (all 6 watersheds)
  // ═══════════════════════════════════════════════════════════
  var totalPSChinookAvail = skagitChinookAvail + snohChinookAvail + nkChinookAvail + pyChinookAvail + nsChinookAvail + stChinookAvail;
  var totalPSDischarge = skagitDischarge + snohDischarge + nkDischarge + pyDischarge + nsDischarge + stDischarge;
  var totalPSSalmonReturn = skagitSalmon.totalReturn + snohSalmon.totalReturn + nkSalmon.totalReturn + pySalmon.totalReturn + nsSalmon.totalReturn + stSalmon.totalReturn;
  var totalPSSmolts = skagitSalmon.smolts + snohSalmon.smolts + nkSalmon.smolts + pySalmon.smolts + nsSalmon.smolts + stSalmon.smolts;
  var totalPSSediment = skagitSediment + snohSediment + nkSediment + pySediment + nsSediment + stSediment;
  var totalPSNutrients = skagitAgNutrients + skagitUrbanRunoff + snohNutrients + nkNutrients + pyNutrients + nsNutrients + stNutrients;

  // ═══════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════
  return {
    state: {
      // Skagit
      skagitDischarge: skagitDischarge,
      skagitTemp: skagitTemp2,
      skagitSediment: skagitSediment,
      skagitGlacierMass: skagitGlacierMass,
      skagitDamFrac: skagitDamFrac,
      skagitPassage: skagitPassage,
      bakerPassage: bakerPassage,
      skagitHabitatQ: skHabitatQ,
      skagitSalmon: skagitSalmon,
      skagitChinookAvail: skagitChinookAvail,
      skagitSpringChinook: spChSpawners,

      // Snohomish
      snohDischarge: snohDischarge,
      snohTemp: snohTemp2,
      snohSediment: snohSediment,
      snohUrbanFrac: snohUrbanFrac,
      snohHabitatQ: snHabitatQ,
      snohSalmon: snohSalmon,
      snohChinookAvail: snohChinookAvail,

      // Nooksack
      nkDischarge: nkDischarge,
      nkTemp: nkTemp2,
      nkSediment: nkSediment,
      nkGlacierMass: nkGlacierMass,
      nkDairyIntensity: nkDairyIntensity,
      nkFecalColiform: nkFecalColiform,
      nkHabitatQ: nkHabitatQ,
      nkSalmon: nkSalmon,
      nkChinookAvail: nkChinookAvail,

      // Puyallup
      pyDischarge: pyDischarge,
      pyTemp: pyTemp2,
      pySediment: pySediment,
      pyGlacierMass: pyGlacierMass,
      pyHabitatQ: pyHabitatQ,
      pySalmon: pySalmon,
      pyChinookAvail: pyChinookAvail,
      pyLaharDamage: laharShock,

      // Nisqually
      nsDischarge: nsDischarge,
      nsTemp: nsTemp2,
      nsSediment: nsSediment,
      nsGlacierMass: nsGlacierMass,
      nsRestorationLevel: nisquallyRestoration,
      nsHabitatQ: nsHabitatQ,
      nsSalmon: nsSalmon,
      nsChinookAvail: nsChinookAvail,

      // Stillaguamish
      stDischarge: stDischarge,
      stTemp: stTemp2,
      stSediment: stSediment,
      stOsoScar: osoScar,
      stHabitatQ: stHabitatQ,
      stSalmon: stSalmon,
      stChinookAvail: stChinookAvail,

      // Aggregates (all 6)
      totalPSChinookAvail: totalPSChinookAvail,
      totalPSDischarge: totalPSDischarge,
      totalPSSalmonReturn: totalPSSalmonReturn,
      totalPSSmolts: totalPSSmolts,
    },

    _carry: {
      skagit: {
        glacierMass: skagitGlacierMass,
        salmon: { springChinook: spChSpawners, summerChinook: suChSpawners, pink: pinkSpawners, coho: cohoSpawners },
      },
      snohomish: {
        salmon: { chinook: snChSpawners, coho: snCoSpawners },
      },
      nooksack: {
        glacierMass: nkGlacierMass,
        salmon: { chinook: nkChSpawners, coho: nkCoSpawners },
      },
      puyallup: {
        glacierMass: pyGlacierMass,
        salmon: { chinook: pyChSpawners, coho: pyCoSpawners },
      },
      nisqually: {
        glacierMass: nsGlacierMass,
        salmon: { chinook: nsChSpawners, coho: nsCoSpawners },
      },
      stillaguamish: {
        osoScar: osoScar,
        salmon: { chinook: stChSpawners, coho: stCoSpawners },
      },
    },

    exports: {
      // Per-watershed discharge (for marine basin coupling)
      pswSkagitDischarge: skagitDischarge,
      pswSnohDischarge: snohDischarge,
      pswNkDischarge: nkDischarge,
      pswTotalDischarge: totalPSDischarge,

      // Per-watershed sediment + nutrients
      pswSkagitSediment: skagitSediment,
      pswTotalSediment: totalPSSediment,
      pswTotalNutrients: totalPSNutrients,
      pswNkFecalColiform: nkFecalColiform,

      // Temperature
      pswSkagitTemp: skagitTemp2,
      pswSnohTemp: snohTemp2,
      pswNkTemp: nkTemp2,

      // Salmon (CRITICAL for SRKW prey)
      pswSkagitChinookAvail: skagitChinookAvail,
      pswSnohChinookAvail: snohChinookAvail,
      pswNkChinookAvail: nkChinookAvail,
      pswTotalChinookAvail: totalPSChinookAvail,
      pswTotalSalmonReturn: totalPSSalmonReturn,
      pswTotalSmolts: totalPSSmolts,

      // Dam state
      pswSkagitPassage: skagitPassage,
      pswBakerPassage: bakerPassage,
      pswSkagitDamFrac: skagitDamFrac,

      // Southern watersheds
      pswPyDischarge: pyDischarge,
      pswNsDischarge: nsDischarge,
      pswStDischarge: stDischarge,
      pswPySediment: pySediment,
      pswPyChinookAvail: pyChinookAvail,
      pswNsChinookAvail: nsChinookAvail,
      pswStChinookAvail: stChinookAvail,
      pswNsRestorationLevel: nisquallyRestoration,
      pswNkFecalColiform: nkFecalColiform,

      // Glacier
      pswSkagitGlacierMass: skagitGlacierMass,
      pswNkGlacierMass: nkGlacierMass,
      pswPyGlacierMass: pyGlacierMass,
      pswNsGlacierMass: nsGlacierMass,
    },
  };
}
