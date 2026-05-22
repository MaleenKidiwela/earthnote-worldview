// ═══════════════════════════════════════════════════════════
// computeNearshore.js — Nearshore & Estuarine Processes
// ═══════════════════════════════════════════════════════════
// The transition zone between land and sea: estuaries, salt marsh,
// eelgrass beds, kelp canopy, forage fish beaches, pocket estuaries,
// tidal flats, shoreline armoring, and contaminant hotspots.
//
// Per-basin spatial detail for the 7 Salish Sea sub-basins.
//
// Key references:
//   Beamer et al. 2005 — pocket estuaries for juvenile Chinook
//   Thom et al. 2014, 2018 — eelgrass and salt marsh in Puget Sound
//   Schlenger et al. 2011 — Puget Sound Nearshore Assessment (PSNERP)
//   Penttila 2007 — forage fish spawning beach surveys
//   Berry et al. 2021 — WA DNR Kelp Recovery Plan
//   West et al. 2017 — contaminant loading in Puget Sound
//   Shipman et al. 2010 — coastal erosion and armoring
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl, seasonalPeak } from './utils.js';

// ── BASIN BASELINE DATA ──
// Nearshore characteristics per basin (from PSNERP, DNR, WDFW surveys)
var BASIN_NEARSHORE = {
  juanDeFuca: { shorelineKm: 320, historicMarsh: 800, currentMarsh: 400, eelgrassHa: 3000, kelpHa: 1200, spawnBeachKm: 45, armorFrac: 0.10, tidalFlatHa: 500, superfund: 0 },
  georgia:    { shorelineKm: 250, historicMarsh: 1200, currentMarsh: 500, eelgrassHa: 4000, kelpHa: 400, spawnBeachKm: 30, armorFrac: 0.15, tidalFlatHa: 800, superfund: 0 },
  sanjuan:    { shorelineKm: 600, historicMarsh: 200, currentMarsh: 120, eelgrassHa: 5000, kelpHa: 2500, spawnBeachKm: 60, armorFrac: 0.12, tidalFlatHa: 300, superfund: 0 },
  whidbey:    { shorelineKm: 400, historicMarsh: 3000, currentMarsh: 800, eelgrassHa: 2500, kelpHa: 300, spawnBeachKm: 40, armorFrac: 0.22, tidalFlatHa: 4000, superfund: 0 },
  mainBasin:  { shorelineKm: 500, historicMarsh: 2500, currentMarsh: 500, eelgrassHa: 2000, kelpHa: 200, spawnBeachKm: 35, armorFrac: 0.38, tidalFlatHa: 600, superfund: 0.3 },
  hoodCanal:  { shorelineKm: 350, historicMarsh: 600, currentMarsh: 250, eelgrassHa: 1800, kelpHa: 150, spawnBeachKm: 25, armorFrac: 0.20, tidalFlatHa: 400, superfund: 0 },
  southSound: { shorelineKm: 300, historicMarsh: 1500, currentMarsh: 400, eelgrassHa: 1500, kelpHa: 100, spawnBeachKm: 20, armorFrac: 0.25, tidalFlatHa: 1500, superfund: 0 },
};

// Estuary data for major rivers
var ESTUARIES = {
  fraser:        { basin: "georgia", area: 20000, baseQuality: 0.5 },
  skagit:        { basin: "whidbey", area: 4000, baseQuality: 0.6 },
  snohomish:     { basin: "whidbey", area: 800, baseQuality: 0.4 },
  nooksack:      { basin: "georgia", area: 300, baseQuality: 0.35 },
  puyallup:      { basin: "mainBasin", area: 600, baseQuality: 0.25 },
  nisqually:     { basin: "southSound", area: 1200, baseQuality: 0.5 },
  stillaguamish: { basin: "whidbey", area: 500, baseQuality: 0.4 },
};

export function computeNearshore(basins, prev, shocks, quarter, year, ws, fraser, psw, eco, slr, coupling) {
  var _prev = prev || {};
  var basinKeys = Object.keys(BASIN_NEARSHORE);

  // ── TRIBAL RESTORATION COUPLING (previous quarter) ──
  // Tribal-led restoration achieves 1.2-1.5× habitat benefit per dollar
  // due to place-based knowledge, long-term commitment, and cultural motivation.
  // NWIFC 2020 State of Our Watersheds; Berkes 2012.
  // trbRestorationMultiplier (1.0-1.5×, from computeTribal via coupling object)
  // amplifies marsh, eelgrass, and beach restoration rates.
  var _c = coupling || {};
  var trbRestMult = _c.trbRestorationMultiplier !== undefined ? _c.trbRestorationMultiplier : 1.0;

  // Sea level rise
  var cumulativeSLR = slr !== undefined ? slr : 0; // meters
  // SLR rate from cumulative SLR ÷ elapsed years. In year 2026 (elapsed=0), use 1 year minimum
  // to avoid division by zero. Default 3.6 mm/yr when no SLR data available (historical rate).
  var yearsElapsed = Math.max(year - 2026, 1);
  var slrRate = cumulativeSLR > 0 ? cl(cumulativeSLR / yearsElapsed * 1000, 1, 30) : 3.6; // mm/yr

  // Ecosystem state
  var ecoState = eco || {};
  var eelgrassHealth = ecoState.eelgrassHealth !== undefined ? ecoState.eelgrassHealth : 0.7;
  var kelpHealth = ecoState.kelpHealth !== undefined ? ecoState.kelpHealth : 0.6;
  var urchinPop = ecoState.urchinPop !== undefined ? ecoState.urchinPop : 0.45;
  var seaOtterPop = ecoState.seaOtterPop !== undefined ? ecoState.seaOtterPop : 0;
  var greenCrabPop = ecoState.greenCrabPop !== undefined ? ecoState.greenCrabPop : 0.05;
  var slrStrategy = ecoState.slrStrategy !== undefined ? ecoState.slrStrategy : 1;

  // ── NEARSHORE PARAMETERS (from config/defaults.js) ──
  // Read from orchestrator params. Previously hardcoded; now user-adjustable.
  // Access via orchestrator coupling `c` which carries ap.nearshore values
  var nsParams = _c.nearshoreParams || {};
  // armorRemovalRate (default 100‰/yr = 0.1 = 10%/yr): annual fraction of armored shoreline removed
  // At default 100‰: 10% annual removal rate. Schlenger et al. 2011: PS target is net reduction.
  var armorRemovalRate = (nsParams.armorRemovalRate !== undefined ? nsParams.armorRemovalRate : 100) / 1000;
  // pocketEstuaryRestoration (default 25%): fraction of historic pocket estuaries functional
  // Beamer et al. 2005: baseline ~30% functional; slider allows 0-100%.
  // The 25% default and 30% baseline are model-construction parametric
  //   choices within the Beamer et al. 2005 pocket-estuary framework
  //   (10x-100x density vs offshore + asymptotic density-dependence
  //   qualitatively supported); specific magnitudes not paper-direct.
  //   Path 4 per Amendment 6 §5.24(b). See docs/citation-audit-followups.md
  //   sub-12E Entry 19 for close history.
  var pocketEstuaryRestoration = (nsParams.pocketEstuaryRestoration !== undefined ? nsParams.pocketEstuaryRestoration : 25) / 100;
  // marshRestorationRate (default 50‰/yr): rate of additional marsh restoration per year
  // Thom et al. 2018: active dike removal + replanting achieves ~2-5% of lost area per year
  var marshRestBoost = (nsParams.marshRestorationRate !== undefined ? nsParams.marshRestorationRate : 50) / 1000;
  // nearshoreInvestment (default 20%): overall nearshore investment level (amplifies all restoration)
  // Acts as a multiplier on eelgrass convergence, marsh gain, and beach restoration.
  var nsInvestMult = 1.0 + (nsParams.nearshoreInvestment !== undefined ? nsParams.nearshoreInvestment : 20) / 100 * 0.5; // 1.0-1.5×

  // Watershed exports
  var wsExports = ws || {};
  var frExports = fraser || {};
  var pswExports = psw || {};

  var results = {};
  var totalJuvHabitat = 0;
  var totalMarshArea = 0;
  var totalEelgrassArea = 0;
  var totalKelpArea = 0;
  var totalBeachIndex = 0;

  for (var bi = 0; bi < basinKeys.length; bi++) {
    var id = basinKeys[bi];
    var nb = BASIN_NEARSHORE[id];
    var basin = basins[id] || {};
    var prevB = _prev[id] || {};

    // ── 1. SALT MARSH ──
    // Puget Sound lost ~75% historic marsh (Thom et al. 2018)
    var prevMarsh = prevB.marshArea !== undefined ? prevB.marshArea : nb.currentMarsh;
    // Marsh loss: SLR squeeze (if armored, can't migrate) + development
    var armorFrac = prevB.armorFrac !== undefined ? prevB.armorFrac : nb.armorFrac;
    // 5 mm/yr = SLR threshold for squeeze loss — Shipman 2010 (Puget Sound Coastal Geomorphology):
    // above 5 mm/yr, marshes cannot accrete fast enough to keep pace if armored landward
    // The 5 mm/yr threshold is a model-construction choice within the
    //   Shipman 2010 (USGS SIR 2010-5254) coastal-squeeze framework. The
    //   coastal-squeeze mechanism is qualitatively paper-direct; the
    //   specific 5 mm/yr value is a regional-SLR planning threshold not
    //   paper-direct from the cited proceedings. Path 4 per Amendment 6
    //   §5.24(b). See docs/citation-audit-followups.md sub-12E Entry 23.
    // 0.002 = quarterly squeeze loss fraction/mm — Thom et al. 2018 (PS salt marsh persistence models)
    var squeezeLoss = slrRate > 5 ? cl((slrRate - 5) * armorFrac * 0.002, 0, 0.01) : 0;
    // 0.001 = quarterly development loss fraction — Calibrated: CGS Shore Friendly program data
    // (~0.4% per year loss from new bulkhead/development permits in armored areas)
    var devLoss = cl(armorFrac * 0.001, 0, 0.005);
    // Marsh gain: restoration (dike removal), natural accretion
    // Marsh restoration: base rate × marshRestorationRate param × tribal restoration multiplier × nearshore investment
    // Thom et al. 2018: PS marsh restoration sites gain ~2% of lost area per year
    var restorationGain = cl((nb.historicMarsh - prevMarsh) / nb.historicMarsh * (0.002 + marshRestBoost * 0.01) * trbRestMult * nsInvestMult, 0, 0.02);
    // Living shorelines accelerate marsh gain
    if (slrStrategy === 2) restorationGain *= 2;
    var marshArea = cl(prevMarsh * (1 - squeezeLoss - devLoss + restorationGain), 0, nb.historicMarsh);

    // ── 2. EELGRASS ──
    // Per-basin area driven by water clarity, temp, green crab, wasting disease
    var prevEelgrass = prevB.eelgrassArea !== undefined ? prevB.eelgrassArea : nb.eelgrassHa;
    var turbidity = basin.turbidity !== undefined ? basin.turbidity : 5;
    var sst = basin.SST !== undefined ? basin.SST : 11;
    // 30 NTU = turbidity threshold where eelgrass light limitation begins — Thom et al. 2014
    // (Zostera marina needs >10% surface irradiance; 30 NTU reduces light below threshold)
    var clarityFactor = cl(1 - turbidity / 30, 0.2, 1);
    // 20°C = Labyrinthula wasting disease threshold, 0.3 = mortality rate/°C above threshold
    // Groner et al. 2016 (eelgrass wasting disease in Pacific NW)
    var tempStress = sst > 20 ? cl((sst - 20) * 0.3, 0, 0.5) : 0;
    // 0.15 = green crab eelgrass damage coefficient — Matheson et al. 2016
    // (Carcinus maenas cuts eelgrass rhizomes, reducing bed density ~15% at full invasion)
    var crabDamage = greenCrabPop * 0.15;
    var eelgrassTarget = nb.eelgrassHa * eelgrassHealth * clarityFactor * (1 - tempStress - crabDamage);
    // Intentionally slow: eelgrass recovery takes 5-20 years (Thom et al. 2014).
    // 15% quarterly convergence → ~90% of target reached in ~15 quarters (~4 years).
    // trbRestMult × nsInvestMult amplifies restoration rate — NWIFC 2020, Thom et al. 2014
    var eelgrassConvRate = cl(0.15 * trbRestMult * nsInvestMult, 0.10, 0.30);
    var eelgrassArea = cl(prevEelgrass + (eelgrassTarget - prevEelgrass) * eelgrassConvRate, 0, nb.eelgrassHa * 1.2);

    // ── 3. KELP CANOPY ──
    // San Juan and JdF have most kelp (Berry et al. 2021, DNR Kelp Recovery Plan)
    var prevKelp = prevB.kelpArea !== undefined ? prevB.kelpArea : nb.kelpHa;
    // 16°C = bull kelp (Nereocystis) thermal stress threshold — Berry et al. 2021 (WA DNR Kelp Recovery Plan);
    // Pfister et al. 2018: kelp canopy loss accelerates above 16°C
    var kelpTempStress = sst > 16 ? cl((sst - 16) / 4, 0, 0.6) : 0;
    // 0.4 = urchin population threshold for kelp barren formation, 0.8 = grazing intensity above threshold
    // Steneck et al. 2002, Estes et al. 2016 (urchin-kelp trophic cascade dynamics)
    var urchinGrazing = urchinPop > 0.4 ? cl((urchinPop - 0.4) * 0.8, 0, 0.5) : 0;
    // 0.4 = otter-mediated urchin suppression coefficient — Estes et al. 2016, Gregr et al. 2020:
    // sea otter reintroduction reduces urchin biomass by 30-50%, enabling kelp recovery
    var otterTrophicCascade = seaOtterPop > 0.1 ? cl(seaOtterPop * 0.4, 0, 0.3) : 0;
    var kelpTarget = nb.kelpHa * kelpHealth * (1 - kelpTempStress - urchinGrazing + otterTrophicCascade);
    // 1.1× cap: kelp can slightly exceed historic baseline via otter trophic cascade
    // (urchin removal releases kelp from grazing, allowing denser beds than pre-collapse)
    var kelpArea = cl(prevKelp + (kelpTarget - prevKelp) * 0.08, 0, nb.kelpHa * 1.1);

    // ── 4. FORAGE FISH SPAWNING BEACHES ──
    // Penttila 2007: sand lance and surf smelt need natural beaches
    var prevBeachKm = prevB.spawnBeachKm !== undefined ? prevB.spawnBeachKm : nb.spawnBeachKm;
    // 0.8 = fraction of armored shoreline losing spawning habitat — Penttila 2007, Quinn et al. 2012:
    // bulkheads eliminate upper intertidal spawning zone for sand lance and surf smelt
    var armorLoss = armorFrac * 0.8;
    // 0.01 = hard armor SLR squeeze rate (fraction/mm·yr⁻¹) — Johannessen & MacLennan 2007:
    // hard armoring prevents beach migration, accelerating squeeze under SLR
    // 0.003 = living shoreline rate (less squeeze, beach can migrate) — Shipman 2010
    // The 0.003 living-shoreline annualized rate is a model-construction
    //   choice within the Shipman 2010 (USGS SIR 2010-5254) coastal-
    //   geomorphology framework; living-shoreline mechanism is qualitatively
    //   supported, specific rate not paper-direct. Path 4 per Amendment 6
    //   §5.24(b). See docs/citation-audit-followups.md sub-12E Entry 23.
    // Wake erosion (Curtiss et al. 2009): vessel wakes in narrow passages erode beaches
    // wakeErosionIndex (0-0.4) from orchestrator, proportional to throughput × speed
    var wakeErosion = _c.wakeErosionIndex !== undefined ? _c.wakeErosionIndex * 0.02 : 0;
    var squeezeLossBch = (slrStrategy === 0 ? cl(slrRate * 0.01, 0, 0.1) : cl(slrRate * 0.003, 0, 0.05)) + wakeErosion;
    // trbRestMult amplifies armor removal effectiveness — tribal nations advocate for beach restoration
    var armorRemoval = armorRemovalRate * 0.25 * trbRestMult; // quarterly fraction × tribal multiplier
    var spawnBeachKm = cl(nb.spawnBeachKm * (1 - armorLoss - squeezeLossBch) + armorRemoval * nb.spawnBeachKm * 0.1, 1, nb.spawnBeachKm);
    var beachIndex = cl(spawnBeachKm / nb.spawnBeachKm, 0, 1);

    // ── 5. POCKET ESTUARIES ──
    // Beamer et al. 2005: critical for juvenile Chinook rearing
    var basePockets = id === "sanjuan" ? 40 : id === "whidbey" ? 25 : id === "mainBasin" ? 15 : id === "hoodCanal" ? 20 : 10;
    var functionalPockets = cl(basePockets * (0.3 + pocketEstuaryRestoration * 0.7), 0, basePockets);
    // 500 = juvenile Chinook capacity per pocket estuary — Beamer et al. 2005:
    // functional pocket estuaries in Skagit/Whidbey rear 200-800 juveniles each (mean ~500)
    // The 500/estuary capacity is a model-construction magnitude within the
    //   Beamer et al. 2005 pocket-estuary rearing-capacity framework.
    //   Framework supports 10x-100x pocket-estuary density vs offshore +
    //   asymptotic density-dependence qualitatively; specific 500 value not
    //   paper-direct at this specificity. Path 4 per Amendment 6 §5.24(b).
    //   See docs/citation-audit-followups.md sub-12E Entry 19.
    var pocketCapacity = functionalPockets * 500;

    // ── 6. SHORELINE ARMORING ──
    // Schlenger et al. 2011: ~27% of PS shoreline armored
    // Housing → armor coupling now flows from orchestrator-supplied c.housingArmorDelta
    // (Track B): shorelineCoupling.computeArmorDynamics with both devPressure and
    // housingPressure factors, length-weighted-aggregated to a sound-wide value applied
    // uniformly across parent basins. Dethier et al. 2016 (~0.3-0.5%/yr new armoring,
    // urban PS) carried by orchestrator.js call site to computeShorelineCoupling.
    // Inline urbanFrac calc deleted per Track B; newArmorFrac variable preserved
    // (consumed below at :266 nearshoreHealth and :285 per-basin storage).
    var newArmorFrac = cl(armorFrac - armorRemovalRate * 0.25 + (_c.housingArmorDelta || 0) + (slrStrategy === 0 ? 0.002 : 0), 0.02, 0.60);

    // ── 7. CONTAMINANT HOTSPOTS ──
    // West et al. 2017: legacy PCBs, PAHs in Main Basin (Duwamish, Commencement Bay, Eagle Harbor)
    // 50 years = Superfund remediation timescale — EPA RODs for Commencement Bay (1989), Eagle Harbor (1994),
    // Lower Duwamish Waterway (2014): cleanup takes decades with ongoing monitoring
    var superfundDecay = nb.superfund * Math.exp(-(year - 2026) / 50);
    // Ongoing contamination index by basin — West et al. 2017 (NOAA PS contaminant loading):
    // Main Basin 0.10: Duwamish + Commencement Bay + Elliott Bay CSO + stormwater
    // Hood Canal 0.02: minimal industrial, some rural runoff
    // Others 0.01: background stormwater and atmospheric deposition
    var ongoingContam = id === "mainBasin" ? 0.10 : id === "hoodCanal" ? 0.02 : 0.01;
    var contamIndex = cl(superfundDecay + ongoingContam, 0, 0.8);

    // ── 8. TIDAL FLATS ──
    // 0.1 = tidal flat loss rate per meter SLR, max 30% loss — Dethier et al. 2016:
    // intertidal habitat inundation under SLR where landward migration blocked
    var tidalFlatArea = cl(nb.tidalFlatHa * (1 - cl(cumulativeSLR * 0.1, 0, 0.3)), 0, nb.tidalFlatHa * 1.1);

    // ── 9. ESTUARY HEALTH (aggregate per estuary in this basin) ──
    var estuaryHealth = 0.5; // default
    var estuaryJuvCapacity = 0;
    var estuaryKeys = Object.keys(ESTUARIES);
    for (var ei = 0; ei < estuaryKeys.length; ei++) {
      var ek = estuaryKeys[ei];
      var est = ESTUARIES[ek];
      if (est.basin !== id) continue;
      // Estuary quality: upstream water quality + SLR + development + restoration
      var upstreamQuality = 0.5; // default
      if (ek === "nisqually") {
        var nsRestore = pswExports.pswNsRestorationLevel !== undefined ? pswExports.pswNsRestorationLevel : 0.6;
        upstreamQuality = cl(est.baseQuality + nsRestore * 0.3, 0, 0.95);
      } else if (ek === "skagit") {
        upstreamQuality = cl(est.baseQuality + 0.1, 0, 0.85); // large delta, good baseline
      } else if (ek === "puyallup") {
        upstreamQuality = cl(est.baseQuality - contamIndex * 0.3, 0.1, 0.6); // Superfund impact
      } else {
        upstreamQuality = est.baseQuality;
      }
      var estQuality = cl(upstreamQuality * (1 - cl(cumulativeSLR * 0.15, 0, 0.3)), 0.05, 1);
      estuaryHealth = Math.max(estuaryHealth, estQuality); // best estuary in basin
      // Juvenile salmon capacity: area × quality × seasonal (juveniles rear in spring-summer)
      var juvSeason = seasonalPeak(quarter, 1.5, 0.8);
      // 0.1 juvenile Chinook per ha at full quality — Beamer et al. 2005, Simenstad et al. 2011:
      // estuarine rearing capacity ~100-500 fish per large estuary, normalized to per-ha
      // The 0.1 juv/ha density is a model-construction magnitude within the
      //   Beamer et al. 2005 estuarine-rearing framework. Framework supports
      //   estuarine rearing capacity qualitatively; specific 0.1/ha density
      //   not paper-direct at this specificity. Path 4 per Amendment 6
      //   §5.24(b). See docs/citation-audit-followups.md sub-12E Entry 19.
      estuaryJuvCapacity += est.area * estQuality * juvSeason * 0.1;
    }

    // ── COMPOSITE JUVENILE SALMON HABITAT ──
    var juvHabitat = cl(
      estuaryJuvCapacity * 0.4
      + marshArea / Math.max(nb.historicMarsh, 1) * 0.3 * nb.historicMarsh
      + pocketCapacity * 0.2
      + eelgrassArea / Math.max(nb.eelgrassHa, 1) * 0.1 * nb.eelgrassHa,
      0, 100000);

    // ── NEARSHORE HEALTH INDEX ──
    var nearshoreHealth = cl(
      (marshArea / Math.max(nb.historicMarsh, 1)) * 0.20
      + (eelgrassArea / Math.max(nb.eelgrassHa, 1)) * 0.20
      + (kelpArea / Math.max(nb.kelpHa, 1)) * 0.15
      + beachIndex * 0.15
      + (1 - newArmorFrac) * 0.10
      + (1 - contamIndex) * 0.10
      + estuaryHealth * 0.10,
      0, 1);

    totalJuvHabitat += juvHabitat;
    totalMarshArea += marshArea;
    totalEelgrassArea += eelgrassArea;
    totalKelpArea += kelpArea;
    totalBeachIndex += beachIndex;

    results[id] = {
      marshArea: marshArea,
      eelgrassArea: eelgrassArea,
      kelpArea: kelpArea,
      spawnBeachKm: spawnBeachKm,
      beachIndex: beachIndex,
      functionalPockets: functionalPockets,
      pocketCapacity: pocketCapacity,
      armorFrac: newArmorFrac,
      contamIndex: contamIndex,
      tidalFlatArea: tidalFlatArea,
      estuaryHealth: estuaryHealth,
      juvSalmonHabitat: juvHabitat,
      nearshoreHealth: nearshoreHealth,
    };
  }

  // Aggregated nearshore health
  var avgNearshoreHealth = 0;
  for (var hi = 0; hi < basinKeys.length; hi++) {
    avgNearshoreHealth += results[basinKeys[hi]].nearshoreHealth;
  }
  avgNearshoreHealth /= basinKeys.length;

  return {
    state: {
      basins: results,
      totalJuvSalmonHabitat: totalJuvHabitat,
      totalMarshArea: totalMarshArea,
      totalEelgrassArea: totalEelgrassArea,
      totalKelpArea: totalKelpArea,
      avgBeachIndex: totalBeachIndex / basinKeys.length,
      nearshoreHealthIndex: avgNearshoreHealth,
    },

    _carry: results, // full per-basin state carries forward

    exports: {
      nsrTotalJuvHabitat: totalJuvHabitat,
      nsrTotalMarshArea: totalMarshArea,
      nsrTotalEelgrassArea: totalEelgrassArea,
      nsrTotalKelpArea: totalKelpArea,
      nsrAvgBeachIndex: totalBeachIndex / basinKeys.length,
      nsrNearshoreHealth: avgNearshoreHealth,
      nsrMainBasinContam: results.mainBasin ? results.mainBasin.contamIndex : 0,
      nsrHoodCanalMarsh: results.hoodCanal ? results.hoodCanal.marshArea : 250,
      nsrWhidbeyEstuary: results.whidbey ? results.whidbey.estuaryHealth : 0.5,
    },
  };
}
