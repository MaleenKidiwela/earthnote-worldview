// ═══════════════════════════════════════════════════════════
// POLICY COSTS — Annual cost of each policy lever
// ═══════════════════════════════════════════════════════════
// Enables budget-constrained scenarios where students must choose
// WHERE to spend limited resources. Forces genuine tradeoffs.
//
// All costs in $M/year at the specified parameter level.
// Cost scales linearly with parameter value from min to max.
// Sources: WA state budget, federal conservation spending, NWSA reports.

// costAtMax: annual cost ($M) when parameter is at maximum setting
// costAtDefault: annual cost at default setting (baseline spending)
// category: grouping for display
export const POLICY_COSTS = {
  // ── RESTORATION ──
  fishPassageInvestment: { costAtMax: 500, costAtDefault: 50, category: 'restoration',
    source: 'WDFW fish barrier removal program + BPA fish passage costs' },
  eelgrassRestoration: { costAtMax: 50, costAtDefault: 0, category: 'restoration',
    source: 'PSNERP nearshore restoration estimates ($500K-2M per site)' },
  nearshoreInvestment: { costAtMax: 80, costAtDefault: 10, category: 'restoration',
    source: 'Puget Sound Partnership action agenda restoration costs' },
  armorRemovalRate: { costAtMax: 200, costAtDefault: 10, category: 'restoration',
    source: 'Shore Friendly program costs (~$5K/linear foot removal)' },
  marshRestorationRate: { costAtMax: 100, costAtDefault: 5, category: 'restoration',
    source: 'Nisqually NWR restoration ($30M for 900 acres) scaled up' },
  // pocketEstuaryRestoration cost magnitudes (30 / 3 $M) are Path 4 model-
  //   construction choices within the Beamer et al. 2005 pocket-estuary
  //   framework. Beamer 2005 supports pocket-estuary restoration as a
  //   policy lever qualitatively; specific cost values not paper-direct.
  //   Path 4 per Amendment 6 §5.24(b). See docs/citation-audit-followups.md
  //   sub-12E Entry 19.
  pocketEstuaryRestoration: { costAtMax: 30, costAtDefault: 3, category: 'restoration',
    source: 'Beamer et al. 2005 — pocket estuary restoration costs' },
  greenCrabRemoval: { costAtMax: 15, costAtDefault: 1, category: 'restoration',
    source: 'WDFW green crab trapping program budget' },
  psHabitatInvestment: { costAtMax: 90, costAtDefault: 15, category: 'restoration',
    source: 'PS watershed habitat investment (SRFB grants)' },
  superfundRemediationRate: { costAtMax: 300, costAtDefault: 30, category: 'restoration',
    source: 'EPA Superfund RODs — Duwamish $342M, Commencement Bay $100M+' },
  damRemovalPolicy: { costAtMax: 1000, costAtDefault: 0, category: 'restoration',
    source: 'Elwha removal cost ~$325M; full Skagit would be ~$1B. Amortized over 20yr.' },

  // ── INFRASTRUCTURE ──
  i5MaintenanceInvestment: { costAtMax: 500, costAtDefault: 120, category: 'infrastructure',
    source: 'WSDOT highway preservation budget ($2.4B total, I-5 portion ~20%)' },
  railSafetyInvestment: { costAtMax: 200, costAtDefault: 40, category: 'infrastructure',
    source: 'FRA rail safety investment + WSDOT rail program' },
  ferryInvestment: { costAtMax: 300, costAtDefault: 30, category: 'infrastructure',
    source: 'WSF new vessel = $150M each; fleet of 21 needs 3 replacements/decade' },
  leveeInvestment: { costAtMax: 400, costAtDefault: 30, category: 'infrastructure',
    source: 'USACE Skagit levee improvements + King County flood control district' },
  bcHighwayResilience: { costAtMax: 250, costAtDefault: 50, category: 'infrastructure',
    source: 'BC MOT Highway 1 rebuild after 2021 AR ($1B, amortized)' },
  gridHardeningInvestment: { costAtMax: 300, costAtDefault: 40, category: 'infrastructure',
    source: 'BPA transmission hardening + PSE/SCL grid modernization' },
  waterInfraInvestment: { costAtMax: 300, costAtDefault: 60, category: 'infrastructure',
    source: 'EPA Clean Water SRF + SPU CIP' },
  infrastructureRedundancy: { costAtMax: 200, costAtDefault: 10, category: 'infrastructure',
    source: 'WSDOT corridor redundancy studies + alternate route development' },

  // ── MANAGEMENT ──
  stockAssessmentFunding: { costAtMax: 50, costAtDefault: 15, category: 'management',
    source: 'WDFW + NWIFC + DFO stock assessment programs' },
  habMonitoringIntensity: { costAtMax: 20, costAtDefault: 5, category: 'management',
    source: 'ORHAB + WA DOH biotoxin monitoring programs' },
  tribalManagementFunding: { costAtMax: 100, costAtDefault: 15, category: 'management',
    source: 'BIA + NWIFC co-management funding' },
  tekIntegration: { costAtMax: 30, costAtDefault: 3, category: 'management',
    source: 'Tribal TEK programs + federal TEK integration grants' },
  tribalRestorationInvestment: { costAtMax: 85, costAtDefault: 10, category: 'management',
    source: 'Tribal restoration programs (Swinomish, Nisqually, etc.)' },
  smokePreparedness: { costAtMax: 40, costAtDefault: 5, category: 'management',
    source: 'DOH smoke response + clean air shelter programs' },
  drinkingWaterInvestment: { costAtMax: 150, costAtDefault: 40, category: 'management',
    source: 'EPA SDWA + state drinking water assistance' },

  // ── CLIMATE/ENERGY ──
  gridInvestment: { costAtMax: 400, costAtDefault: 80, category: 'energy',
    source: 'BPA + utility grid modernization spending' },
  energyCleanFraction: { costAtMax: 600, costAtDefault: 200, category: 'energy',
    source: 'CETA compliance costs (renewable + storage procurement)' },
};

// Default total annual budget ($M/year)
// Roughly the combined conservation + infrastructure spending of:
// WA state (~$1.2B), BC (~$0.5B), federal (~$0.5B), local (~$0.3B)
export const DEFAULT_BUDGET = 2000; // $M/year

// Compute total annual cost for a given parameter configuration
export function computeTotalCost(params) {
  var total = 0;
  var breakdown = {};
  var costKeys = Object.keys(POLICY_COSTS);
  for (var i = 0; i < costKeys.length; i++) {
    var key = costKeys[i];
    var costDef = POLICY_COSTS[key];
    // Find the parameter value
    var paramVal = null;
    var mods = ['ecosystem', 'infrastructure', 'nearshore', 'fisheries', 'tribal',
      'publicHealth', 'urban', 'watershed', 'psWatersheds', 'fraser'];
    for (var mi = 0; mi < mods.length; mi++) {
      if (params[mods[mi]] && params[mods[mi]][key] !== undefined) {
        paramVal = params[mods[mi]][key];
        break;
      }
    }
    if (paramVal === null) continue;

    // Find PM range for this parameter
    var defVal = costDef.costAtDefault; // cost at default setting
    var maxVal = costDef.costAtMax; // cost at max setting
    // Linear interpolation: cost scales with parameter level
    // At default param: cost = costAtDefault
    // At max param: cost = costAtMax
    var cost = defVal + (maxVal - defVal) * Math.max(0, (paramVal - 50) / 50);
    cost = Math.max(0, cost);
    total += cost;
    breakdown[key] = { cost: Math.round(cost), category: costDef.category };
  }
  return { total: Math.round(total), breakdown: breakdown };
}

// Category labels
export const COST_CATEGORIES = {
  restoration: 'Ecosystem Restoration',
  infrastructure: 'Infrastructure',
  management: 'Management & Monitoring',
  energy: 'Climate & Energy',
};
