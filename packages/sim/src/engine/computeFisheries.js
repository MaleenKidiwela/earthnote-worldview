// ═══════════════════════════════════════════════════════════
// computeFisheries.js — Fisheries Management Engine
// ═══════════════════════════════════════════════════════════
// Adaptive management cycle: stock assessment → harvest rules →
// fishing pressure → stock response → next assessment.
//
// Replaces static fishing pressure slider with dynamic management.
//
// Components: stock assessment, harvest rules (weak stock management),
// 3 fishing sectors (commercial/recreational/treaty), SRKW prey
// protection, hatchery management, economic output, Pacific Salmon Treaty.
//
// Key references:
//   Holt & Ogden 2013 — DFO spawner-recruit benchmarks (Sgen, Smsy)
//   McElhany et al. 2000 — NOAA viable salmonid populations
//   Chasco et al. 2017 — orca prey needs vs Chinook fisheries
//   Chilcote et al. 2011 — hatchery/wild interactions
//   Pacific Salmon Treaty 1985, renewed 2019
//   U.S. v. Washington (Boldt Decision) 1974
//   R. v. Sparrow 1990 (Canadian Aboriginal fishing rights)
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl, seededRandom } from './utils.js';

// ── STOCK DEFINITIONS ──
// Spawner benchmarks: Sgen (lower) and Smsy (upper)
// Status: spawners > Smsy = healthy, Sgen-Smsy = concern, < Sgen = critical
var STOCK_BENCHMARKS = {
  // Fraser stocks
  fraserSockeye:  { smsy: 2000000, sgen: 400000, fisheryComplex: "fraser", pricePerFish: 25 },
  fraserChinook:  { smsy: 80000,   sgen: 20000,  fisheryComplex: "fraser", pricePerFish: 75 },
  fraserPink:     { smsy: 5000000, sgen: 1000000, fisheryComplex: "fraser", pricePerFish: 8 },
  fraserChum:     { smsy: 1500000, sgen: 500000,  fisheryComplex: "fraser", pricePerFish: 10 },
  fraserCoho:     { smsy: 200000,  sgen: 50000,   fisheryComplex: "fraser", pricePerFish: 30 },
  // PS stocks
  skagitSpringCh: { smsy: 5000,    sgen: 1500,   fisheryComplex: "psChinook", pricePerFish: 80 },
  skagitSummerCh: { smsy: 8000,    sgen: 2500,   fisheryComplex: "psChinook", pricePerFish: 70 },
  snohChinook:    { smsy: 6000,    sgen: 2000,   fisheryComplex: "psChinook", pricePerFish: 70 },
  nkChinook:      { smsy: 2000,    sgen: 500,    fisheryComplex: "psChinook", pricePerFish: 70 },
  pyChinook:      { smsy: 3000,    sgen: 800,    fisheryComplex: "psChinook", pricePerFish: 70 },
  nsChinook:      { smsy: 4000,    sgen: 1000,   fisheryComplex: "psChinook", pricePerFish: 70 },
  stChinook:      { smsy: 2500,    sgen: 700,    fisheryComplex: "psChinook", pricePerFish: 70 },
  psCoho:         { smsy: 80000,   sgen: 20000,  fisheryComplex: "psCoho", pricePerFish: 35 },
  psPink:         { smsy: 2000000, sgen: 500000, fisheryComplex: "psPink", pricePerFish: 8 },
};

// Fishery complexes: groups of stocks caught together in mixed-stock fisheries
var FISHERY_COMPLEXES = {
  fraser: { name: "Fraser River", sectors: ["commercial", "recreational", "treaty"], baseJobs: 5000, communityDep: 0.15 },
  psChinook: { name: "PS Chinook", sectors: ["commercial", "recreational", "treaty"], baseJobs: 1500, communityDep: 0.25 },
  psCoho: { name: "PS Coho", sectors: ["recreational", "treaty"], baseJobs: 800, communityDep: 0.10 },
  psPink: { name: "PS Pink/Chum", sectors: ["commercial", "treaty"], baseJobs: 600, communityDep: 0.08 },
};

export function computeFisheries(P, prev, shocks, quarter, year, fraserSalmon, psSalmon, orcaState, eco, coupling) {
  var _prev = prev || {};

  // ── PARAMETERS ──
  var harvestStrictness = (P.harvestRuleStrictness !== undefined ? P.harvestRuleStrictness : 60) / 100;
  var orcaProtectionLevel = (P.orcaPreyProtectionLevel !== undefined ? P.orcaPreyProtectionLevel : 50) / 100;
  var tribalAllocation = (P.tribalHarvestAllocation !== undefined ? P.tribalHarvestAllocation : 50) / 100;
  var assessmentFunding = (P.stockAssessmentFunding !== undefined ? P.stockAssessmentFunding : 50) / 100;
  var recEffort = (P.recreationalFishingEffort !== undefined ? P.recreationalFishingEffort : 50) / 100;
  var treatyCompliance = (P.pacificSalmonTreaty !== undefined ? P.pacificSalmonTreaty : 70) / 100;
  // markSelectiveFishing (default 30%): targets adipose-fin-clipped hatchery fish,
  // reducing bycatch mortality on unmarked wild fish. At 100%: wild bycatch halved.
  // Chilcote et al. 2011: mark-selective reduces wild mortality 30-50%.
  var markSelective = (P.markSelectiveFishing !== undefined ? P.markSelectiveFishing : 30) / 100;

  // ── TRIBAL CO-MANAGEMENT COUPLING (previous quarter) ──
  // Tribal co-management improves fisheries outcomes through better stock assessment,
  // adaptive harvest rules, and place-based monitoring that reduces management error.
  // Berkes 2012 (Sacred Ecology): TEK integration reduces assessment uncertainty by 10-15%.
  // NWIFC 2020 (State of Our Watersheds): co-management improves outcomes 20-40%.
  // Pinkerton 1989: shared authority outperforms top-down management.
  var _c = coupling || {};
  var trbCoMgmt = _c.trbCoMgmtMultiplier !== undefined ? _c.trbCoMgmtMultiplier : 1.0;
  var trbTekBonus = _c.trbTekBonus !== undefined ? _c.trbTekBonus : 0;

  // ── EXTRACT CURRENT STOCK SIZES ──
  var fs = fraserSalmon || {};
  var ps = psSalmon || {};
  var orca = orcaState || {};

  var currentSpawners = {
    fraserSockeye:  fs.fraserSockeyeReturn !== undefined ? fs.fraserSockeyeReturn * 1e6 : 500000,
    fraserChinook:  fs.fraserChinookAvail !== undefined ? fs.fraserChinookAvail * 100000 : 150000,
    fraserPink:     fs.fraserPinkReturn !== undefined ? fs.fraserPinkReturn * 1e6 : 5000000,
    fraserChum:     fs.fraserChumReturn !== undefined ? fs.fraserChumReturn * 1e6 : 2000000,
    fraserCoho:     fs.fraserCohoReturn !== undefined ? fs.fraserCohoReturn * 100000 : 400000,
    skagitSpringCh: ps.pswSkagitChinookAvail !== undefined ? ps.pswSkagitChinookAvail * 25000 : 8000,
    skagitSummerCh: ps.pswSkagitChinookAvail !== undefined ? ps.pswSkagitChinookAvail * 25000 : 12000,
    snohChinook:    ps.pswSnohChinookAvail !== undefined ? ps.pswSnohChinookAvail * 30000 : 10000,
    nkChinook:      ps.pswNkChinookAvail !== undefined ? ps.pswNkChinookAvail * 10000 : 3000,
    pyChinook:      ps.pswPyChinookAvail !== undefined ? ps.pswPyChinookAvail * 15000 : 5000,
    nsChinook:      ps.pswNsChinookAvail !== undefined ? ps.pswNsChinookAvail * 20000 : 6000,
    stChinook:      ps.pswStChinookAvail !== undefined ? ps.pswStChinookAvail * 12000 : 4000,
    psCoho:         80000,
    psPink:         ps.pswTotalSalmonReturn !== undefined ? ps.pswTotalSalmonReturn * 0.4 : 2000000,
  };

  // ═══════════════════════════════════════════════════════════
  // 1. STOCK ASSESSMENT (Q4 annual cycle)
  // ═══════════════════════════════════════════════════════════
  // Holt & Ogden 2013: spawner-recruit benchmarks
  // Assessment error: ±15-30% depending on funding

  var prevAssessments = _prev.assessments || {};
  var assessments = {};
  // TEK bonus reduces assessment error: tribal monitoring programs supplement agency surveys
  // trbTekBonus ranges 0-0.15 (from computeTribal), directly reduces error floor
  var assessmentError = cl(0.30 - assessmentFunding * 0.15 - trbTekBonus, 0.05, 0.35);

  var stockKeys = Object.keys(STOCK_BENCHMARKS);
  for (var si = 0; si < stockKeys.length; si++) {
    var sk = stockKeys[si];
    var bench = STOCK_BENCHMARKS[sk];
    var actual = currentSpawners[sk] || 0;

    // Assessment estimate with noise
    var noise = seededRandom(year * 1000 + si * 73 + quarter * 17 + 44491);
    var assessed = actual * (1 + (noise - 0.5) * 2 * assessmentError);
    assessed = cl(assessed, 0, actual * 3); // can't be negative or wildly high

    // Status determination (McElhany et al. 2000)
    var status;
    if (assessed >= bench.smsy) status = "healthy";
    else if (assessed >= bench.sgen) status = "concern";
    else if (assessed >= bench.sgen * 0.5) status = "critical";
    else status = "endangered";

    assessments[sk] = {
      actual: actual,
      assessed: assessed,
      status: status,
      smsy: bench.smsy,
      sgen: bench.sgen,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 2. HARVEST RULES + WEAK STOCK MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  // In mixed-stock fisheries, the weakest stock constrains harvest for all.

  var harvestRates = {};
  var complexStatus = {};

  // Per-stock harvest rate based on status
  // Co-management multiplier (trbCoMgmt, 1.0-1.5×) improves harvest rule precision:
  // better monitoring → more accurate stock status → rates better matched to actual abundance.
  // Effect: for stressed stocks, co-management reduces overharvest (better conservation).
  // trbCoMgmt acts as a small modifier on effective strictness, not a replacement.
  // At trbCoMgmt=1.0 (baseline): no change. At 1.5: strictness +20% (capped at 1.0).
  var coMgmtStrictnessBoost = cl((trbCoMgmt - 1.0) * 0.4, 0, 0.20); // 0 at baseline, +0.20 at full
  var effectiveStrictness = cl(harvestStrictness + coMgmtStrictnessBoost, 0, 1);
  for (var hi = 0; hi < stockKeys.length; hi++) {
    var hk = stockKeys[hi];
    var assess = assessments[hk];
    var rate;
    // Floor at 2% (unavoidable bycatch) so full strictness range produces meaningful variation
    if (assess.status === "healthy") rate = cl(0.30 * effectiveStrictness + 0.02, 0.02, 0.40);
    else if (assess.status === "concern") rate = cl(0.15 * effectiveStrictness + 0.02, 0.02, 0.20);
    // Mark-selective fishing reduces wild bycatch on critical/endangered stocks
    else if (assess.status === "critical") rate = cl(0.03 * effectiveStrictness * (1 - markSelective * 0.3), 0.00, 0.05);
    else rate = cl(0.02 * (1 - markSelective * 0.5), 0.005, 0.02); // endangered: bycatch reduced by mark-selective
    harvestRates[hk] = rate;
  }

  // Weak stock management: constrain fishery complex to weakest stock
  var complexKeys = Object.keys(FISHERY_COMPLEXES);
  for (var ci = 0; ci < complexKeys.length; ci++) {
    var ck = complexKeys[ci];
    var minRate = 1.0;
    var worstStatus = "healthy";
    var statusPriority = { healthy: 0, concern: 1, critical: 2, endangered: 3 };
    for (var wi = 0; wi < stockKeys.length; wi++) {
      var wk = stockKeys[wi];
      if (STOCK_BENCHMARKS[wk].fisheryComplex === ck) {
        if (harvestRates[wk] < minRate) minRate = harvestRates[wk];
        if (statusPriority[assessments[wk].status] > statusPriority[worstStatus]) {
          worstStatus = assessments[wk].status;
        }
      }
    }
    complexStatus[ck] = { effectiveRate: minRate, worstStatus: worstStatus, closed: worstStatus === "endangered" };

    // Apply weak stock constraint: override individual rates to complex minimum
    for (var oi = 0; oi < stockKeys.length; oi++) {
      var ok = stockKeys[oi];
      if (STOCK_BENCHMARKS[ok].fisheryComplex === ck) {
        harvestRates[ok] = Math.min(harvestRates[ok], minRate);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 3. SRKW PREY PROTECTION
  // ═══════════════════════════════════════════════════════════
  // NOAA 2019: restrict Chinook harvest when SRKW are food-stressed
  // Chasco et al. 2017: orca prey needs

  var orcaBC = orca.bodyCondition !== undefined ? orca.bodyCondition : 0.6;
  var orcaPop = orca.population !== undefined ? orca.population : 74;
  var srkwProtectionActive = 0;

  if (orcaBC < 0.5 || orcaPop < 70) {
    srkwProtectionActive = 1;
    var chinookReduction = cl(orcaProtectionLevel * 0.5, 0, 0.50); // up to 50% Chinook harvest reduction
    // Apply to all Chinook stocks
    for (var pi = 0; pi < stockKeys.length; pi++) {
      var pk = stockKeys[pi];
      if (pk.indexOf("Chinook") >= 0 || pk.indexOf("Ch") >= 0) {
        harvestRates[pk] = harvestRates[pk] * (1 - chinookReduction);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 4. SECTOR ALLOCATION
  // ═══════════════════════════════════════════════════════════
  // Treaty/tribal: first priority after conservation (Boldt/Sparrow)
  // Commercial: largest volume
  // Recreational: highest per-fish value

  var totalCommercialCatch = 0;
  var totalCommercialValue = 0;
  var totalRecCatch = 0;
  var totalRecValue = 0;
  var totalTribalCatch = 0;
  var totalTribalValue = 0;
  var totalJobs = 0;

  for (var fi = 0; fi < stockKeys.length; fi++) {
    var fk = stockKeys[fi];
    var spawners = currentSpawners[fk] || 0;
    var rate = harvestRates[fk];
    var totalHarvest = spawners * rate;
    var price = STOCK_BENCHMARKS[fk].pricePerFish;

    // Pacific Salmon Treaty constraint (PST 1985, renewed 2019):
    // For transboundary stocks (Fraser sockeye/chinook), treaty limits US harvest share.
    // At full compliance: US gets 16-20% of Fraser stocks. Low compliance → overharvest.
    var pstCap = 1.0; // no cap for US-only stocks
    if (fk === 'fraserSockeye' || fk === 'fraserChinook') {
      // US harvest share: 18% at full treaty compliance, up to 30% at low compliance
      pstCap = cl(0.18 + (1 - treatyCompliance) * 0.12, 0.10, 0.35);
      totalHarvest = totalHarvest * pstCap;
    }
    // Tribal allocation: first priority (Boldt Decision — 50% of harvestable surplus)
    var tribalCatch = totalHarvest * tribalAllocation;
    // Commercial: bulk of remainder
    var commercialCatch = (totalHarvest - tribalCatch) * 0.6;
    // Recreational: impacts salmon mortality (WDFW catch estimates, ~15-25K Chinook/yr)
    var recCatch = (totalHarvest - tribalCatch) * 0.4 * recEffort;

    totalTribalCatch += tribalCatch;
    totalTribalValue += tribalCatch * price * 0.5; // food/cultural value at ~50% market
    totalCommercialCatch += commercialCatch;
    totalCommercialValue += commercialCatch * price;
    totalRecCatch += recCatch;
    totalRecValue += recCatch * 200; // $200 per recreational trip (higher per-fish value)
  }

  // ═══════════════════════════════════════════════════════════
  // 5. ECONOMIC OUTPUT
  // ═══════════════════════════════════════════════════════════

  // Employment: scales with catch volume
  var commercialJobs = cl(totalCommercialCatch / 1000, 500, 8000); // ~1 job per 1000 fish
  var recJobs = cl(totalRecCatch / 500, 200, 5000); // more labor-intensive
  var processingJobs = cl(totalCommercialCatch / 2000, 200, 3000);
  totalJobs = commercialJobs + recJobs + processingJobs;

  // Total economic contribution ($M/year — divide by 4 for quarterly)
  var totalEconomicContrib = (totalCommercialValue + totalRecValue + totalTribalValue) / 1e6;

  // Community dependence stress: high when closures hit fishing-dependent communities
  var closureCount = 0;
  for (var ki = 0; ki < complexKeys.length; ki++) {
    if (complexStatus[complexKeys[ki]].closed) closureCount++;
  }
  var communityStress = cl(closureCount / complexKeys.length * 0.7 + (1 - totalEconomicContrib / 200) * 0.3, 0, 1);

  // ═══════════════════════════════════════════════════════════
  // 5b. SOCIO-ECONOMIC FEEDBACK: DESPERATION FISHING
  // ═══════════════════════════════════════════════════════════
  // When fishing revenue declines below ~70% of historical average, fishers
  // increase effort to maintain livelihoods — a poverty trap.
  // Cinner et al. 2009 (Conserv. Biol. 23(1):124-130): poverty traps in fisheries.
  // Modulated by alternativeLivelihood: high alternative employment reduces desperation.
  // Magnitude: small (up to 10% effective pressure increase) — second-order effect.
  var historicalRevBaseline = 150; // $M/yr — approximate historical average fishery revenue
  var revDeficit = cl(1 - totalEconomicContrib / (historicalRevBaseline * 0.7), 0, 1);
  // 0.10 = max 10% harvest-rate boost under scarcity-driven desperation.
  //   Value is a bounded model-construction choice within the fisher-behavior-
  //   under-scarcity / poverty-traps-in-fisheries framework (Cinner et al. 2009
  //   Conserv. Biol. 23(1):124-130 [framework reference]; Finkbeiner et al.
  //   2017; Daw et al. 2012). Framework establishes qualitatively that small-
  //   scale fishers facing stock decline respond through effort maintenance
  //   or intensification; specific 10% cap selected to bound simulation
  //   response magnitude conservatively, at an order-of-magnitude near the
  //   lower end of effort-escalation responses documented in hyperstability
  //   and derby-fishing literature. Path 4 per Amendment 6 §5.24(b).
  // Higher community stress amplifies desperation; alternative employment reduces it
  var desperationBoost = revDeficit * communityStress * 0.10;

  // ═══════════════════════════════════════════════════════════
  // 6. EFFECTIVE FISHING PRESSURE (REPLACES STATIC SLIDER)
  // ═══════════════════════════════════════════════════════════
  var totalPossibleHarvest = 0;
  var totalActualHarvest = 0;
  for (var ei = 0; ei < stockKeys.length; ei++) {
    totalPossibleHarvest += (currentSpawners[stockKeys[ei]] || 0) * 0.40;
    // Apply desperation boost: fishers work harder when revenue drops
    var adjustedRate = cl(harvestRates[stockKeys[ei]] * (1 + desperationBoost), 0, 0.50);
    totalActualHarvest += (currentSpawners[stockKeys[ei]] || 0) * adjustedRate;
  }
  var effectiveFishingPressure = totalPossibleHarvest > 0 ? cl(totalActualHarvest / totalPossibleHarvest * 100, 0, 100) : 40;

  // ═══════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════
  return {
    state: {
      // Assessments
      assessments: assessments,
      assessmentError: assessmentError,

      // Harvest
      harvestRates: harvestRates,
      complexStatus: complexStatus,
      srkwProtectionActive: srkwProtectionActive,

      // Catches
      commercialCatch: totalCommercialCatch,
      commercialValue: totalCommercialValue / 1e6, // $M
      recreationalCatch: totalRecCatch,
      recreationalValue: totalRecValue / 1e6, // $M
      tribalCatch: totalTribalCatch,
      tribalValue: totalTribalValue / 1e6, // $M

      // Economics
      totalEconomicContrib: totalEconomicContrib,
      fisheriesEmployment: totalJobs,
      communityStress: communityStress,
      closureCount: closureCount,

      // Effective pressure
      effectiveFishingPressure: effectiveFishingPressure,
    },

    _carry: {
      assessments: assessments,
    },

    exports: {
      // Effective harvest rates per complex (for downstream salmon models)
      fmEffectivePressure: effectiveFishingPressure,
      fmFraserHarvestRate: complexStatus.fraser ? complexStatus.fraser.effectiveRate : 0.3,
      fmPsChinookHarvestRate: complexStatus.psChinook ? complexStatus.psChinook.effectiveRate : 0.3,
      fmSrkwProtectionActive: srkwProtectionActive,

      // Economics
      fmCommercialValue: totalCommercialValue / 1e6,
      fmRecreationalValue: totalRecValue / 1e6,
      fmTribalValue: totalTribalValue / 1e6,
      fmTotalEconomic: totalEconomicContrib,
      fmEmployment: totalJobs,
      fmCommunityStress: communityStress,
      fmClosureCount: closureCount,
    },
  };
}
