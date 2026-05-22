// ═══════════════════════════════════════════════════════════
// computeInfrastructure.js — Regional Infrastructure Vulnerability
// ═══════════════════════════════════════════════════════════
// Transportation, utility, and trade corridors — and their
// vulnerability to landslides, earthquakes, flooding, and climate.
//
// Inspired by the I-5 Chuckanut landslide (March 20, 2026) and
// the systemic fragility it exposed in the Cascadia corridor.
//
// Components: I-5 corridor (4 pinch points), BNSF rail (oil train risk),
// WA State Ferries, BC Highway 1 (Fraser Canyon), border crossings,
// secondary road redundancy, cascading failure.
//
// Key references:
//   WSDOT Unstable Slopes Program — Chuckanut section history
//   BC Ministry of Transportation — 2021 AR highway failures
//   WA State Ferries Long Range Plan 2040
//   Cascadia Lifelines Program (CLiP) — earthquake infrastructure risk
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl, seededRandom, seasonalPeak } from './utils.js';
import { rfPredict } from './rfPredict.js';

export function computeInfrastructure(P, prev, shocks, quarter, year, clim, psw, fraser, urban, port, energy, coupling) {
  var _prev = prev || {};
  var earthquake = shocks.earthquake || 0;
  var tsunami = shocks.tsunami || 0;
  var lahar = shocks.rainier_lahar || 0;
  var atmoRiver = shocks.atmosphericRiver || 0;
  // Local fault sources (Greene, GSA): smaller than M9 but more frequent and more local
  // Skipjack Island Fault: affects San Juan infrastructure (ferries, utilities)
  // Devils Mountain Fault: affects Whidbey + San Juan (broader zone)
  var skipjackQuake = shocks.skipjack_island_fault || 0;
  var devilsMtnQuake = shocks.devils_mountain_fault || 0;
  var localQuake = cl(skipjackQuake + devilsMtnQuake, 0, 1);
  // Add local quake damage to earthquake variable for downstream infrastructure calculations
  earthquake = cl(earthquake + localQuake * 0.4, 0, 1);

  // ── TRIBAL TREATY STRENGTH COUPLING (previous quarter) ──
  // Strong treaty implementation increases environmental review requirements for
  // infrastructure projects near culturally significant sites and treaty-protected
  // waterways. Culverts Case (2018): government has legal obligation to maintain
  // functional fish habitat — strong treaty strength means better culvert replacement
  // priority and infrastructure siting that respects treaty-protected resources.
  var _c = coupling || {};
  var trbTreatyStr = _c.trbTreatyStrength !== undefined ? _c.trbTreatyStrength : 0.5;

  // ── MACRO ECONOMY COUPLING ──
  // Higher borrowing costs (Fed rate above neutral ~4%) slow infrastructure investment
  // effectiveness: approved projects cost more and take longer to execute.
  // Regression on FHWA project cost data shows ~8% cost increase per 100bp above neutral.
  // Range 0.5-2.0; at 1.0 = neutral (no effect). >1.0 = expensive borrowing = less effective.
  var borrowingCostIdx = _c.borrowingCostIndex !== undefined ? _c.borrowingCostIndex : 1.0;
  // Investment effectiveness: higher borrowing costs reduce the bang-for-buck of maintenance $
  // At borrowingCostIdx=1.0: investEff=1.0 (neutral). At 2.0: investEff=0.7 (30% less effective).
  var investEffectiveness = cl(1.0 - (borrowingCostIdx - 1.0) * 0.30, 0.5, 1.2);

  // Climate exports
  var ce = clim || {};
  var arMaxIntensity = ce.climArMaxIntensity !== undefined ? ce.climArMaxIntensity : 0;
  var arEventCount = ce.climArEventCount !== undefined ? ce.climArEventCount : 0;

  // Watershed flood data
  var pe = psw || {};
  var skagitQ = pe.pswSkagitDischarge !== undefined ? pe.pswSkagitDischarge : 470;
  var nkQ = pe.pswNkDischarge !== undefined ? pe.pswNkDischarge : 100;

  // Fraser data (for BC highway)
  var fe = fraser || {};
  var fraserQ = fe.fraserDischarge !== undefined ? fe.fraserDischarge : 2700;

  // ── PARAMETERS ──
  var i5Investment = (P.i5MaintenanceInvestment !== undefined ? P.i5MaintenanceInvestment : 50) / 100;
  var railInvestment = (P.railSafetyInvestment !== undefined ? P.railSafetyInvestment : 40) / 100;
  var ferryInvestment = (P.ferryInvestment !== undefined ? P.ferryInvestment : 30) / 100;
  var bcResilience = (P.bcHighwayResilience !== undefined ? P.bcHighwayResilience : 40) / 100;

  // Apply borrowing cost effectiveness to all investment parameters
  // When borrowing is expensive (Fed rate high), investment $ buys less improvement
  i5Investment = i5Investment * investEffectiveness;
  railInvestment = railInvestment * investEffectiveness;
  ferryInvestment = ferryInvestment * investEffectiveness;
  bcResilience = bcResilience * investEffectiveness;

  // ── PREVIOUS STATE ──
  var prevI5 = _prev.i5Condition !== undefined ? _prev.i5Condition : 0.8;
  var prevRail = _prev.railCondition !== undefined ? _prev.railCondition : 0.75;
  var prevFerry = _prev.ferryReliability !== undefined ? _prev.ferryReliability : 0.7;
  var prevBCHwy = _prev.bcHwyCondition !== undefined ? _prev.bcHwyCondition : 0.7;
  var prevI5Closure = _prev.i5ClosureRemaining !== undefined ? _prev.i5ClosureRemaining : 0;
  var prevRailClosure = _prev.railClosureRemaining !== undefined ? _prev.railClosureRemaining : 0;
  var prevBCClosure = _prev.bcClosureRemaining !== undefined ? _prev.bcClosureRemaining : 0;

  // ═══════════════════════════════════════════════════════════
  // 1. I-5 CORRIDOR (4 pinch points)
  // ═══════════════════════════════════════════════════════════

  // Condition degrades without investment, improves with investment
  var i5Decay = cl(0.01 - i5Investment * 0.008, 0, 0.01); // quarterly degradation
  var i5Condition = cl(prevI5 - i5Decay + i5Investment * 0.005, 0.3, 1.0);

  // Chuckanut (MP 246-252): joint failures from rain + freeze-thaw
  // History: repeated slides — the March 2026 event is the latest in a pattern
  // PRIMARY: Random Forest trained on precipitation × geology × maintenance relationships
  // FALLBACK: linear model if RF unavailable
  var chuckanutWet = (quarter === 0 || quarter === 3) ? 1 : 0.3;
  var chuckanutAR = arMaxIntensity > 0.3 ? arMaxIntensity * 0.4 : 0;
  var freezeThaw = (quarter === 0 || quarter === 3) ? cl(8 + (1 - i5Condition) * 10, 0, 20) : cl(2 + (1 - i5Condition) * 3, 0, 8);
  var antecedentPrecip = cl(120 * chuckanutWet + arMaxIntensity * 150 + (1 - i5Condition) * 30, 0, 500);

  var slideFeatures = {
    antecedent_precip: antecedentPrecip,
    precip_intensity: cl(arMaxIntensity * 30, 0, 50),
    ar_active: arMaxIntensity > 0.3 ? 1 : 0,
    ar_category: cl(arMaxIntensity * 5, 0, 5),
    freeze_thaw: freezeThaw,
    slope_condition: i5Condition,
    season: quarter,
    earthquake: earthquake > 0.3 ? 1 : 0,
  };

  var rfChuckanut = rfPredict('landslide_chuckanut', slideFeatures);
  var linearChuckanut = cl((0.04 + chuckanutAR + chuckanutWet * 0.02) * (1 - i5Investment * 0.5) * (2 - i5Condition), 0, 0.25);
  var chuckanutProb = (rfChuckanut !== undefined && isFinite(rfChuckanut)) ? cl(rfChuckanut, 0, 0.25) : linearChuckanut;

  // Skagit floodplain (MP 220-235): flood overtopping
  var skagitFloodProb = skagitQ > 1500 ? cl((skagitQ - 1500) / 3000, 0, 0.2) : 0;

  // Nisqually delta (MP 114-120): earthquake liquefaction
  var nisquallyProb = earthquake > 0.3 ? cl(earthquake * 0.4, 0, 0.5) : 0;

  // Aggregate I-5 failure: ANY pinch point failing closes corridor
  var i5SlideProb = cl(chuckanutProb + skagitFloodProb + nisquallyProb, 0, 0.5);

  // Stochastic slide event
  var i5Seed = seededRandom(year * 100 + quarter * 25 + 26319);
  var newI5Closure = 0;
  if (prevI5Closure <= 0 && i5Seed < i5SlideProb) {
    // Closure: duration 0.25-2 quarters depending on severity
    var severitySeed = seededRandom(year * 100 + quarter * 25 + 77123);
    newI5Closure = cl(0.25 + severitySeed * 1.75, 0.25, 2);
  }
  var i5ClosureRemaining = cl(Math.max(prevI5Closure - 0.25, 0) + (newI5Closure > 0 ? newI5Closure : 0), 0, 4);
  var i5Closed = i5ClosureRemaining > 0 ? 1 : 0;
  // I-5 baseline capacity is NEVER 100% in reality. Normal degradation from:
  // - Active construction zones (perpetual): ~2-3% capacity loss
  // - Daily incidents/accidents: ~1-2%
  // - Aging bridges/overpasses: ~1% (structurally deficient spans)
  // - Seasonal weather (rain, snow on passes, flooding): 2-5% winter, 1% summer
  // Source: WSDOT Annual Congestion Report — typical corridor efficiency ~92-95%
  var seasonalWeatherPenalty = (quarter === 0 || quarter === 3) ? 0.04 : 0.01; // winter worse
  var constructionPenalty = 0.025; // perpetual construction zones
  var incidentPenalty = 0.015; // daily accidents/incidents
  var agingPenalty = cl((1 - i5Condition) * 0.02, 0, 0.03); // worse condition = more closures for repair
  var baselineCapacity = cl(1 - seasonalWeatherPenalty - constructionPenalty - incidentPenalty - agingPenalty, 0.85, 0.97);
  var i5Status = i5Closed ? cl(baselineCapacity * (1 - i5ClosureRemaining / 2), 0, 0.5) : baselineCapacity;

  // ═══════════════════════════════════════════════════════════
  // 2. BNSF RAIL CORRIDOR
  // ═══════════════════════════════════════════════════════════

  var railDecay = cl(0.008 - railInvestment * 0.006, 0, 0.008);
  var railCondition = cl(prevRail - railDecay + railInvestment * 0.004, 0.3, 1.0);

  // Same geological vulnerability as I-5 (parallel routing), reduced by rail safety investment
  var railSlideProb = cl((chuckanutProb * 0.8 + skagitFloodProb * 0.6) * (1 - railInvestment * 0.4), 0, 0.3);
  var railSeed = seededRandom(year * 100 + quarter * 25 + 55891);
  var newRailClosure = 0;
  if (prevRailClosure <= 0 && railSeed < railSlideProb) {
    newRailClosure = cl(0.25 + seededRandom(year * 100 + quarter * 25 + 88321) * 1, 0.25, 1.5);
  }
  var railClosureRemaining = cl(Math.max(prevRailClosure - 0.25, 0) + (newRailClosure > 0 ? newRailClosure : 0), 0, 3);
  var railClosed = railClosureRemaining > 0 ? 1 : 0;
  // Rail baseline: maintenance windows (~2%), slow orders (~1-2%), seasonal (~1-3% winter)
  var railSeasonalPenalty = (quarter === 0 || quarter === 3) ? 0.03 : 0.01;
  var railBaseCapacity = cl(1 - 0.02 - railSeasonalPenalty - cl((1 - railCondition) * 0.02, 0, 0.03), 0.88, 0.97);
  var railStatus = railClosed ? cl(railBaseCapacity * (1 - railClosureRemaining / 1.5), 0, 0.5) : railBaseCapacity;

  // Oil train derailment risk: crude oil trains × track condition × proximity to waterways
  // Oil train frequency scales with refinery demand (port activity proxy)
  var portActivity = port && port.opCap !== undefined ? port.opCap : 1;
  var oilTrainFreq = cl(6 * portActivity, 1, 12); // 6 trains/week baseline, scales with economy
  var derailmentProb = cl(oilTrainFreq * 0.0002 * (2 - railCondition) * (1 + railClosed * 2), 0, 0.05);
  var derailmentSeed = seededRandom(year * 100 + quarter * 25 + 33377);
  var oilDerailment = derailmentSeed < derailmentProb ? 1 : 0;
  var oilSpillRisk = cl(derailmentProb * 10 + oilDerailment * 0.8, 0, 1);

  // ═══════════════════════════════════════════════════════════
  // 3. WASHINGTON STATE FERRIES
  // ═══════════════════════════════════════════════════════════
  // System in crisis: aging fleet (~35yr avg), crewing shortages

  // Fleet ages 0.5yr/yr naturally; investment buys new vessels (min 10yr build-to-delivery cycle)
  var fleetAge = cl(35 + (year - 2026) * 0.5 - ferryInvestment * 10, 10, 50);
  var crewingLevel = cl(0.7 + ferryInvestment * 0.3, 0.5, 1.0);
  var windCancellation = (quarter === 0 || quarter === 3) ? 0.08 : 0.03; // winter storms
  var ferryReliability = cl(
    crewingLevel * 0.4
    + (1 - fleetAge / 50) * 0.3
    + (1 - windCancellation) * 0.2
    - earthquake * 0.3 // terminal damage
    + ferryInvestment * 0.1,
    0.2, 0.95);

  // ═══════════════════════════════════════════════════════════
  // 4. BC HIGHWAY 1 / TRANS-CANADA (Fraser Canyon)
  // ═══════════════════════════════════════════════════════════
  // 2021: five sections destroyed simultaneously by AR

  var bcDecay = cl(0.008 - bcResilience * 0.006, 0, 0.008);
  var bcHwyCondition = cl(prevBCHwy - bcDecay + bcResilience * 0.004, 0.3, 1.0);

  // AR events in BC interior trigger highway damage
  var bcARProb = arMaxIntensity > 0.4 ? cl((arMaxIntensity - 0.4) * 0.5 * (2 - bcHwyCondition), 0, 0.3) : 0;
  // Fraser flood also threatens canyon road
  var bcFloodProb = fraserQ > 5000 ? cl((fraserQ - 5000) / 10000, 0, 0.15) : 0;
  var bcCloseProb = cl(bcARProb + bcFloodProb, 0, 0.4);

  var bcSeed = seededRandom(year * 100 + quarter * 25 + 44519);
  var newBCClosure = 0;
  if (prevBCClosure <= 0 && bcSeed < bcCloseProb) {
    newBCClosure = cl(0.5 + seededRandom(year * 100 + quarter * 25 + 99221) * 1.5, 0.5, 2);
  }
  var bcClosureRemaining = cl(Math.max(prevBCClosure - 0.25, 0) + (newBCClosure > 0 ? newBCClosure : 0), 0, 4);
  var bcClosed = bcClosureRemaining > 0 ? 1 : 0;
  // BC Hwy 1 baseline: avalanche control closures (~3-5% winter), rockfall zones (~1%)
  var bcSeasonalPenalty = (quarter === 0 || quarter === 3) ? 0.05 : 0.01;
  var bcBaseCapacity = cl(1 - bcSeasonalPenalty - 0.01, 0.88, 0.97);
  var bcHighwayStatus = bcClosed ? cl(bcBaseCapacity * (1 - bcClosureRemaining / 2), 0, 0.3) : bcBaseCapacity;

  // ═══════════════════════════════════════════════════════════
  // 5. BORDER CROSSINGS & REDUNDANCY
  // ═══════════════════════════════════════════════════════════

  // Border throughput depends on I-5 status
  var borderCapacity = cl(i5Status * 0.6 + railStatus * 0.2 + bcHighwayStatus * 0.2, 0.1, 1);
  // Trade disruption from any corridor failure
  var tradeDisruption = cl(
    (1 - i5Status) * 0.35 + (1 - railStatus) * 0.20
    + (1 - bcHighwayStatus) * 0.25 + (1 - ferryReliability) * 0.10
    + earthquake * 0.10,
    0, 1);

  // Redundancy: how many alternate routes when primary fails
  // Cascadia corridor has VERY LOW redundancy
  var primaryOpen = (i5Status > 0.8 ? 1 : 0) + (railStatus > 0.8 ? 1 : 0) + (bcHighwayStatus > 0.8 ? 1 : 0);
  var redundancy = cl(primaryOpen / 3, 0, 1); // 0 = all corridors down, 1 = all open

  // Cascading failure: when I-5 closes, SR-11 (Chuckanut Drive) often closes too
  var cascadeProb = i5Closed ? 0.6 : 0; // 60% chance of simultaneous secondary failure
  var secondaryFailed = seededRandom(year * 100 + quarter * 25 + 11199) < cascadeProb ? 1 : 0;

  // ═══════════════════════════════════════════════════════════
  // 8. PIPELINE INFRASTRUCTURE
  // ═══════════════════════════════════════════════════════════
  // Trans Mountain (TMX), Cherry Point refineries, Olympic Pipeline.
  // 1999 Olympic Pipeline rupture in Bellingham killed 3 (Whatcom Falls).

  var pipelineInvestment = (P.pipelineSafetyInvestment !== undefined ? P.pipelineSafetyInvestment : 45) / 100;
  var prevPipeCondition = _prev.pipelineCondition !== undefined ? _prev.pipelineCondition : 0.75;
  var pipelineCondition = cl(prevPipeCondition - 0.005 + pipelineInvestment * 0.004, 0.3, 1.0);
  // Spill probability: throughput × age × earthquake × maintenance
  var pipeSpillProb = cl(0.005 * (2 - pipelineCondition) * (1 + earthquake * 3), 0, 0.1);
  var pipeSeed = seededRandom(year * 100 + quarter * 25 + 66713);
  var pipelineSpill = pipeSeed < pipeSpillProb ? 1 : 0;
  // Fuel distribution: Cherry Point produces ~40% of WA fuel. If I-5 closes, trucks can't distribute.
  var fuelDistribution = cl(i5Status * 0.6 + railStatus * 0.3 + pipelineCondition * 0.1, 0.2, 1);

  // ═══════════════════════════════════════════════════════════
  // 9. ELECTRICAL TRANSMISSION
  // ═══════════════════════════════════════════════════════════
  // BPA lines cross Cascades (wildfire vulnerable). SCL Skagit connection.

  var gridHardening = (P.gridHardeningInvestment !== undefined ? P.gridHardeningInvestment : 35) / 100;
  var fireRisk = shocks.wildfire || 0;
  var windstorm = (quarter === 0 || quarter === 3) ? 0.05 : 0.01; // winter storms
  var transmissionReliability = cl(
    0.95
    - fireRisk * 0.15       // wildfire takes down lines
    - earthquake * 0.30     // earthquake damages towers/substations
    - windstorm             // winter windstorms
    + gridHardening * 0.10, // hardening reduces vulnerability
    0.3, 0.99);

  // ═══════════════════════════════════════════════════════════
  // 10. WATER AND SEWER INFRASTRUCTURE
  // ═══════════════════════════════════════════════════════════
  // West Point (Seattle) flooded 2017, discharged raw sewage for weeks.

  var waterInvestment = (P.waterInfraInvestment !== undefined ? P.waterInfraInvestment : 40) / 100;
  var prevWaterCondition = _prev.waterCondition !== undefined ? _prev.waterCondition : 0.7;
  var waterCondition = cl(prevWaterCondition - 0.006 + waterInvestment * 0.005, 0.3, 1.0);
  // CSO reduction from sewer separation investment
  var csoReduction = cl(waterInvestment * 0.4, 0, 0.4); // up to 40% CSO reduction
  // Water main break risk: earthquake + age
  var waterMainBreak = earthquake > 0.3 ? cl(earthquake * 0.5 * (2 - waterCondition), 0, 0.8) : 0;
  // Wastewater plant flooding risk: SLR + storm
  var wwPlantRisk = cl(atmoRiver * 0.2 + earthquake * 0.3 - waterInvestment * 0.15, 0, 0.5);

  // ═══════════════════════════════════════════════════════════
  // 11. FLOOD CONTROL (LEVEE SYSTEMS)
  // ═══════════════════════════════════════════════════════════
  // Skagit levees: Army Corps rated HIGH RISK. ~20,000 people in floodplain.

  var leveeInvestment = (P.leveeInvestment !== undefined ? P.leveeInvestment : 30) / 100;
  var prevLeveeCondition = _prev.leveeCondition !== undefined ? _prev.leveeCondition : 0.6;
  var leveeCondition = cl(prevLeveeCondition - 0.005 + leveeInvestment * 0.004, 0.2, 0.95);
  // Design capacity: levees handle 100-yr flood at full condition
  var designCapacity = leveeCondition * 2000; // m³/s at full condition
  // Skagit levee failure probability
  var skagitLeveeProb = skagitQ > designCapacity ? cl((skagitQ - designCapacity) / 2000, 0, 0.6) : 0;
  // Earthquake can damage levees even without flood
  var eqLeveeDamage = earthquake > 0.3 ? cl(earthquake * 0.4, 0, 0.5) : 0;
  var leveeFailureProb = cl(skagitLeveeProb + eqLeveeDamage, 0, 0.7);
  var leveeSeed = seededRandom(year * 100 + quarter * 25 + 88517);
  var leveeFailure = leveeSeed < leveeFailureProb ? 1 : 0;
  // Catastrophic flooding: much worse than overtopping (sudden)
  var leveeFloodDamage = leveeFailure ? cl(0.5 + skagitQ / 3000, 0, 1) : 0;

  // ═══════════════════════════════════════════════════════════
  // 12. DIGITAL INFRASTRUCTURE
  // ═══════════════════════════════════════════════════════════
  // Fiber follows I-5/rail corridors — when road goes, sometimes internet goes.

  var digitalInvestment = (P.digitalInfraInvestment !== undefined ? P.digitalInfraInvestment : 50) / 100;
  var digitalReliability = cl(
    0.95
    - i5Closed * 0.10      // fiber cut with landslide
    - earthquake * 0.25    // widespread damage
    + digitalInvestment * 0.05,
    0.4, 0.99);
  var ruralBroadband = cl(digitalInvestment * 0.6, 0.2, 0.8); // rural access gap

  // ═══════════════════════════════════════════════════════════
  // 13. COMPOSITE INFRASTRUCTURE RESILIENCE
  // ═══════════════════════════════════════════════════════════
  // Correlated failure: AR events and earthquakes affect everything at once.

  // Diagnostic: probability that MULTIPLE corridors fail simultaneously (correlated risk).
  // NOT applied as additional damage — individual corridor calcs already include AR/EQ effects.
  // This metric quantifies the systemic risk that March 2026 demonstrated.
  var correlatedARFailure = arMaxIntensity > 0.5 ? cl(arMaxIntensity * 0.3, 0, 0.4) : 0;
  var correlatedEQFailure = earthquake > 0.3 ? cl(earthquake * 0.6, 0, 0.8) : 0;
  var simultaneousFailureProb = cl(correlatedARFailure + correlatedEQFailure, 0, 0.9);

  // Treaty strength improves infrastructure outcomes through two mechanisms:
  // 1. Culverts Case (2018) requires culvert replacement for fish passage — stronger
  //    treaty implementation accelerates this, improving water infrastructure condition.
  // 2. Tribal environmental review raises infrastructure standards near treaty waters.
  // Effect is modest (up to +0.03 resilience) — treaty strength is governance, not engineering.
  var treatyCulvertBonus = cl((trbTreatyStr - 0.5) * 0.06, 0, 0.03);

  // infrastructureRedundancy (default 20%): investment in alternative routes and backup systems
  // Reduces impact of simultaneous corridor failures. At 100%: +0.05 resilience from redundancy.
  var redundancyInvestment = (P.infrastructureRedundancy !== undefined ? P.infrastructureRedundancy : 20) / 100;
  var redundancyBonus = cl(redundancyInvestment * 0.05, 0, 0.05);

  var resilienceIndex = cl(
    i5Status * 0.15 + railStatus * 0.10 + ferryReliability * 0.10 + bcHighwayStatus * 0.10
    + transmissionReliability * 0.15 + waterCondition * 0.10 + leveeCondition * 0.10
    + pipelineCondition * 0.10 + digitalReliability * 0.05 + fuelDistribution * 0.05
    + treatyCulvertBonus
    + redundancyBonus,
    0, 1);

  // ═══════════════════════════════════════════════════════════
  // 6. ECONOMIC IMPACT (updated with all infrastructure)
  // ═══════════════════════════════════════════════════════════

  // $100B/yr ÷ 365 = $274M/day through Cascadia corridor
  // Source: US Census Bureau Foreign Trade Statistics 2023 — US-Canada trade through WA border crossings
  // (~$75B goods + $25B services); NWSA 2024: $66B in seaborne trade alone
  var dailyTradeValue = 274;
  var tradeLossDays = tradeDisruption * 91.25; // days of disrupted trade per quarter
  // tradeLossDays already includes tradeDisruption — don't multiply again
  var tradeLossCost = tradeLossDays * dailyTradeValue * 0.3; // $M (30% of disrupted-day trade actually lost)

  var ferryLostRev = (1 - ferryReliability) * 15; // $M/quarter from cancelled sailings
  var reroutingCost = (i5Closed + railClosed) * 5; // $M/quarter for truck rerouting
  var leveeDamageCost = leveeFloodDamage * 200; // $M from levee failure flooding
  var pipelineSpillCost = pipelineSpill ? 50 : 0; // $M from spill cleanup
  var waterMainCost = waterMainBreak * 30; // $M from water main break
  var totalInfraCost = cl(tradeLossCost / 1000 + ferryLostRev + reroutingCost + leveeDamageCost + pipelineSpillCost + waterMainCost, 0, 1000); // $M/quarter

  // Port accessibility: can trucks reach the ports?
  // Ports primarily need I-5 for truck access; rail is secondary (containers shift to truck if rail down)
  var portAccessibility = cl(i5Status * 0.75 + railStatus * 0.15 + (1 - earthquake * 0.3) * 0.1, 0.1, 1);

  // Supply chain stress: food, fuel, goods availability
  var supplyChainStress = cl(tradeDisruption * 0.5 + (1 - portAccessibility) * 0.3 + (1 - redundancy) * 0.2, 0, 1);

  // ═══════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════
  return {
    state: {
      // I-5
      i5Condition: i5Condition,
      i5Status: i5Status,
      i5Closed: i5Closed,
      i5ClosureRemaining: i5ClosureRemaining,
      chuckanutSlideProb: chuckanutProb,
      skagitFloodProb: skagitFloodProb,

      // Rail
      railCondition: railCondition,
      railStatus: railStatus,
      railClosed: railClosed,
      oilSpillRisk: oilSpillRisk,
      oilDerailment: oilDerailment,

      // Ferries
      ferryReliability: ferryReliability,
      fleetAge: fleetAge,
      crewingLevel: crewingLevel,

      // BC Highway
      bcHwyCondition: bcHwyCondition,
      bcHighwayStatus: bcHighwayStatus,
      bcClosed: bcClosed,

      // Pipelines
      pipelineCondition: pipelineCondition,
      pipelineSpill: pipelineSpill,
      fuelDistribution: fuelDistribution,

      // Transmission
      transmissionReliability: transmissionReliability,

      // Water/sewer
      waterCondition: waterCondition,
      csoReduction: csoReduction,
      waterMainBreak: waterMainBreak,
      wwPlantRisk: wwPlantRisk,

      // Levees
      leveeCondition: leveeCondition,
      leveeFailureProb: leveeFailureProb,
      leveeFailure: leveeFailure,
      leveeFloodDamage: leveeFloodDamage,

      // Digital
      digitalReliability: digitalReliability,
      ruralBroadband: ruralBroadband,

      // Corridor
      tradeDisruption: tradeDisruption,
      portAccessibility: portAccessibility,
      borderCapacity: borderCapacity,
      redundancy: redundancy,
      supplyChainStress: supplyChainStress,
      cascadingFailure: secondaryFailed,

      // Composite
      resilienceIndex: resilienceIndex,
      simultaneousFailureProb: simultaneousFailureProb,

      // Economics
      totalInfraCost: totalInfraCost,
    },

    _carry: {
      i5Condition: i5Condition,
      railCondition: railCondition,
      ferryReliability: ferryReliability,
      bcHwyCondition: bcHwyCondition,
      i5ClosureRemaining: i5ClosureRemaining,
      railClosureRemaining: railClosureRemaining,
      bcClosureRemaining: bcClosureRemaining,
      pipelineCondition: pipelineCondition,
      waterCondition: waterCondition,
      leveeCondition: leveeCondition,
    },

    exports: {
      infI5Status: i5Status,
      infRailStatus: railStatus,
      infFerryReliability: ferryReliability,
      infBcHighwayStatus: bcHighwayStatus,
      infTradeDisruption: tradeDisruption,
      infPortAccessibility: portAccessibility,
      infSupplyChainStress: supplyChainStress,
      infRedundancy: redundancy,
      infOilSpillRisk: oilSpillRisk,
      infPipelineSpill: pipelineSpill,
      infTransmissionReliability: transmissionReliability,
      infFuelDistribution: fuelDistribution,
      infLeveeFailure: leveeFailure,
      infResilienceIndex: resilienceIndex,
      infInfraCost: totalInfraCost,
    },
  };
}
