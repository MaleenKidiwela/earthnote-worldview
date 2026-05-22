// ═══════════════════════════════════════════════════════════
// NARRATIVE GENERATOR — Human-readable story text from simulation state
// ═══════════════════════════════════════════════════════════
// Inspired by UVA Bay Game (Learmonth et al. 2011): the most powerful
// learning comes not from numbers but from understanding WHY things changed.
//
// Generates 2-3 specific narrative sentences per quarter referencing
// places, species, nations, and dollar amounts from the model output.
// Prioritizes threshold crossings, scenario events, and cascade chains.
//
// ES5 convention (engine file).
// ═══════════════════════════════════════════════════════════

var cl = function(v, mn, mx) { return Math.max(mn, Math.min(mx, v || 0)); };

// ── Threshold-crossing event templates ──
// Each tests a condition and returns a narrative string if triggered.
var THRESHOLD_EVENTS = [
  // Orca
  { severity: 'warning',
    test: function(c, p) { return c.orcaPop < 70 && (!p || p.orcaPop >= 70); },
    text: function(c) { return 'SRKW population dropped below 70 (' + Math.round(c.orcaPop) + ' individuals). Below this threshold, inbreeding depression and mate-finding failure accelerate decline. K Pod at ' + Math.round((c.orcaPodK || 14)) + ' members.'; } },
  { severity: 'positive',
    test: function(c, p) { return c.orcaPop > 80 && p && p.orcaPop <= 80; },
    text: function(c) { return 'SRKW population recovered above 80 (' + Math.round(c.orcaPop) + '). Calf survival is up, driven by improved prey availability and reduced vessel noise.'; } },

  // SST / Marine Heat Wave
  { severity: 'warning',
    test: function(c) { return c.sst > 13.5; },
    text: function(c) { return 'SST reached ' + c.sst.toFixed(1) + '\u00B0C, marine heat wave conditions. Bull kelp die above 15\u00B0C. Hood Canal stratification increasing, deep-water oxygen renewal suppressed.'; } },

  // Dissolved Oxygen
  { severity: 'warning',
    test: function(c) { return c.do < 5.5 && c.do > 0; },
    text: function(c) { return 'Average DO at ' + c.do.toFixed(1) + ' mg/L. Hood Canal approaching hypoxia. Dungeness crab and rockfish habitat contracting. WDFW may issue Skokomish shellfish advisory.'; } },

  // Salmon
  { severity: 'warning',
    test: function(c, p) { return c.salmonRun < 25 && (!p || p.salmonRun >= 25); },
    text: function(c) { return 'Salmon index at ' + Math.round(c.salmonRun) + '/100. Fraser sockeye and PS Chinook critically depressed. Treaty harvest obligations at risk. Lummi, Tulalip, and Muckleshoot fishers facing closure.'; } },
  { severity: 'positive',
    test: function(c, p) { return c.salmonRun > 60 && p && p.salmonRun <= 60; },
    text: function(c) { return 'Salmon index at ' + Math.round(c.salmonRun) + '/100. Dominant Fraser sockeye cycle year plus improved fish passage. Treaty fisheries operational. First salmon ceremonies held on schedule.'; } },

  // Eelgrass regime shift
  { severity: 'warning',
    test: function(c) { return c.eelgrassEstab !== undefined && c.eelgrassEstab < 0.3; },
    text: function(c) { return 'Eelgrass below 30% (regime shift threshold). Seedbank depleted, natural recovery unlikely. Herring spawning habitat at Padilla Bay, Samish Bay, and Cherry Point collapsing.'; } },

  // Infrastructure
  { severity: 'warning',
    test: function(c) { return c.i5Capacity !== undefined && c.i5Capacity < 0.6; },
    text: function(c) { return 'I-5 corridor below 60% capacity. Landslide or seismic damage on the primary north-south freight route. Bellingham, Burlington, Mount Vernon cut off from Seattle. Rerouting through SR-9, +$4.2M/week.'; } },

  // Insurance crisis
  { severity: 'warning',
    test: function(c) { return c.insurancePremium !== undefined && c.insurancePremium > 2.0; },
    text: function(c) { return 'Insurance premiums at ' + c.insurancePremium.toFixed(1) + '\u00D7 baseline. Coverage withdrawal beginning in flood zones. Property values falling near Duwamish, Puyallup, and Nisqually deltas, reducing tax revenue.'; } },

  // Green crab invasion
  { severity: 'warning',
    test: function(c) { return c.greenCrab > 0.4; },
    text: function(c) { return 'Green crab at ' + Math.round(c.greenCrab * 100) + '% of carrying capacity. Eelgrass root damage in Willapa Bay and Padilla Bay. Dungeness crab juvenile recruitment declining from green crab predation on megalopae.'; } },

  // Energy — only fire when reliability is critically low
  { severity: 'warning',
    test: function(c) { return c.gridReliability !== undefined && c.gridReliability < 0.70; },
    text: function(c) { return 'Grid reliability at ' + (c.gridReliability * 100).toFixed(0) + '%. Rolling brownouts possible during peak demand. Data center load straining BPA transmission.'; } },

  // Earthquake / seismic events
  { severity: 'warning',
    test: function(c) { return c.earthquakeActive > 0.5; },
    text: function(c) { return 'Major seismic event detected. Infrastructure across the region is damaged. Port terminals at risk, ferry routes disrupted. Tribal cultural sites in the San Juan Islands and along the Duwamish are vulnerable.'; } },

  // Sand wave / benthic habitat (Greene review features)
  { severity: 'warning',
    test: function(c) { return c.sandWaveIntegrity !== undefined && c.sandWaveIntegrity < 0.3; },
    text: function(c) { return 'Sand wave field integrity collapsed to ' + Math.round(c.sandWaveIntegrity * 100) + '% \u2014 Pacific sand lance habitat is being destroyed. This threatens the entire upper food web: herring, salmon, seabirds, and orcas all depend on sand lance as prey. (Greene et al. 2017)'; } },

  // Dilbit / oil spill benthic
  { severity: 'warning',
    test: function(c) { return c.dilbitActive > 0; },
    text: function(c) { return 'Dilbit tanker spill, San Juan Archipelago. Diluted bitumen sinks to the seafloor (unlike conventional crude), smothering sand wave fields, rocky reefs, eelgrass. Lummi and Samish treaty fisheries facing multi-year closure. Benthic recovery: 5-20 years.'; } },

  // Tribal food sovereignty crisis
  { severity: 'warning',
    test: function(c) { return c.foodSovereignty !== undefined && c.foodSovereignty < 0.35; },
    text: function(c) { return 'Indigenous food sovereignty at ' + Math.round(c.foodSovereignty * 100) + '%. Salmon, shellfish, herring, lamprey simultaneously compromised. Treaty-protected subsistence harvests insufficient for Lummi, Tulalip, Swinomish, and Muckleshoot nations.'; } },

  // Social stability
  { severity: 'warning',
    test: function(c) { return c.displaced > 5000; },
    text: function(c) { return Math.round(c.displaced).toLocaleString() + ' people displaced (flooding, SLR, housing pressure). Worst-affected: Duwamish, Puyallup delta, Nisqually Reach.'; } },

  // 6PPD-quinone coho mortality (Tian et al. 2021)
  { severity: 'warning',
    test: function(c) { return c.sixPPDq > 0.8; },
    text: function(c) { return '6PPD-quinone at ' + c.sixPPDq.toFixed(1) + ' \u00B5g/L in urban stormwater \u2014 above coho lethal threshold. Pre-spawn mortality in Longfellow Creek, Puyallup tributaries, Duwamish approaching 90%. Tire-derived toxin (Tian et al. 2021). Puyallup and Muckleshoot coho fisheries collapsing.'; } },
  { severity: 'warning',
    test: function(c) { return c.sixPPDq > 0.3 && c.sixPPDq <= 0.8; },
    text: function(c) { return '6PPD-quinone rising (' + c.sixPPDq.toFixed(1) + ' \u00B5g/L) in urban streams. Sublethal effects on coho. WA legislature passed SB 5931 (tire reformulation) but replacement chemicals are years away. Stormwater bioretention is the near-term fix.'; } },

  // Wastewater capacity crisis
  { severity: 'warning',
    test: function(c) { return c.wwCapacityStress > 0.3; },
    text: function(c) { return 'Wastewater treatment at capacity. Population growth has outpaced plant upgrades. CSO overflows increasing \u2014 untreated sewage entering Elliott Bay and Commencement Bay during storms. King County WTD scrambling to expand West Point and South Plant.'; } },

  // Sunflower sea star SSWD recurrence
  { severity: 'warning',
    test: function(c) { return c.sunflowerStar < 0.01; },
    text: function(c) { return 'Sunflower sea star functionally extinct (' + Math.round(c.sunflowerStar * 100) + '% of historical). Without this keystone predator, urchin populations are unchecked. Kelp forests converting to urchin barrens in the San Juans. Recovery will take decades.'; } },
  { severity: 'positive',
    test: function(c, p) { return c.sunflowerStar > 0.10 && (!p || p.sunflowerStar <= 0.10); },
    text: function(c) { return 'Sunflower sea star recovering (' + Math.round(c.sunflowerStar * 100) + '% of historical). Urchin predation increasing \u2014 kelp forests may begin to recover if SSWD does not recur.'; } },

  // Fish farm → wild salmon
  { severity: 'warning',
    test: function(c) { return c.seaLicePressure > 0.05; },
    text: function(c) { return 'Sea lice from open-net salmon farms infecting wild smolts in Georgia Strait. Pre-migration mortality elevated. Cohen Commission recommended transition to closed containment; DFO plan proceeding slowly.'; } },

  // Pteropod collapse (OA canary)
  { severity: 'warning',
    test: function(c) { return c.pteropodPop < 0.25; },
    text: function(c) { return 'Pteropod shells dissolving in Salish Sea waters (Omega_ar < 1.2). This is ocean acidification made visible \u2014 the first biological impact of rising CO2. Juvenile salmon, herring larvae lose a critical prey source. The OA-to-orca cascade is now active.'; } },

  // Gray whale
  { severity: 'warning',
    test: function(c, p) { return c.grayWhalePop < 0.15 && (!p || p.grayWhalePop >= 0.15); },
    text: function(c) { return 'Gray whale population in the Salish Sea at ' + Math.round((c.grayWhalePop || 0.15) * 100) + ' individuals. Benthic amphipod prey declining. Spring migration whale watching revenue falling. Makah Nation cultural connection at risk.'; } },

  // Smoke → marine productivity
  { severity: 'warning',
    test: function(c) { return c.smokePAR > 0.15; },
    text: function(c) { return 'Wildfire smoke blocking ' + Math.round((c.smokePAR || 0.15) * 100) + '% of sunlight reaching the ocean surface. Phytoplankton growth suppressed across all basins. Less plankton \u2192 less forage fish \u2192 less salmon \u2192 less food for orca. The 2020 and 2025 smoke seasons showed this is not rare.'; } },

  // Bigg's (transient) killer whale
  { severity: 'positive',
    test: function(c, p) { return c.biggsPop > 0.90 && (!p || p.biggsPop <= 0.90); },
    text: function(c) { return 'Bigg\'s orca population surpassed 450 (' + Math.round((c.biggsPop || 0.80) * 500) + ' individuals). Record seasonal presence in Haro Strait and Georgia Strait. Harbor seal predation events reported near San Juan Island, Boundary Bay. Whale watching revenue at record highs.'; } },
  { severity: 'warning',
    test: function(c, p) { return c.biggsPop < 0.40 && (!p || p.biggsPop >= 0.40); },
    text: function(c) { return 'Bigg\'s orca declining (' + Math.round((c.biggsPop || 0.40) * 500) + ' individuals). Pinniped prey depletion or PCB burden reducing calf survival. The most PCB-contaminated marine mammals on Earth face reproductive failure.'; } },
];

// ── Economic narrative snippets ──
var ECON_NARRATIVES = [
  { severity: 'positive',
    test: function(c) { return c.portRevenue > 3000; },
    text: function(c) { return 'Port revenue $' + Math.round(c.portRevenue) + 'M/yr. Strong trade volumes, 194K maritime jobs across Seattle-Tacoma-Vancouver.'; } },
  { severity: 'warning',
    test: function(c) { return c.portRevenue < 1500 && c.portRevenue > 0; },
    text: function(c) { return 'Port revenue down to $' + Math.round(c.portRevenue) + 'M/yr. Container diversions to Prince Rupert and Long Beach accelerating. Maritime employment down ~30%.'; } },
  { severity: 'neutral',
    test: function(c) { return c.oilPrice > 100; },
    text: function(c) { return 'Oil at $' + Math.round(c.oilPrice) + '/bbl. Container fleet slow-steaming. Throughput down ~8%, but whale-strike risk halved as vessels slow through Haro Strait.'; } },
];

// Extract narrative-relevant state from full simulation results
function extractNarrativeState(results) {
  if (!results) return null;
  var eco = results.ecosystem ? results.ecosystem.state : {};
  var ms = results.marine ? results.marine.state : {};
  var us = results.urban ? results.urban.state : {};
  var ps = results.port ? results.port.state : {};
  var en = results.energy ? results.energy.state : {};
  var infra = results.infrastructure ? results.infrastructure.state : {};
  return {
    sst: ms.sst || 11.3,
    do: ms.dissolvedOxygen || 6.4,
    pH: ms.pH || 7.95,
    orcaPop: eco.orcaPopulation || 74,
    orcaPodK: eco.orcaPods && eco.orcaPods.K ? eco.orcaPods.K.population : 14,
    salmonRun: eco.salmonRunStrength || 48,
    biodiversity: eco.biodiversityIndex || 0.72,
    eelgrassEstab: eco.eelgrassEstablishment,
    greenCrab: eco.greenCrabPop || 0,
    forageFish: eco.forageFishIndex || 0.45,
    sandLance: eco.sandLancePop || 0.5,
    sandWaveIntegrity: eco.sandWaveIntegrity,
    mhwActive: eco.mhwActive || 0,
    portRevenue: ps.revenue || 2500,
    employment: ps.employment || 30000,
    oilPrice: results.macroEconomy && results.macroEconomy.state ? results.macroEconomy.state.oilPrice : 70,
    i5Capacity: infra.i5Capacity,
    gridReliability: en.gridReliability,
    insurancePremium: us.insurancePremiumIndex,
    socialStability: us.socialStability,
    displaced: us.totalDisplaced || 0,
    culturalHealth: eco.culturalKeystoneHealth,
    foodSovereignty: eco.indigenousFoodSovereignty,
    // Earthquake detection: infer from infrastructure capacity drop
    earthquakeActive: infra.i5Capacity !== undefined && infra.i5Capacity < 0.5 ? 1 : 0,
    // Dilbit detection: infer from contaminant spike in San Juan basins
    dilbitActive: (results.contaminants && results.contaminants.sanjuan && results.contaminants.sanjuan.sedPAH > 5000) ? 1 : 0,
    // 6PPD-quinone level (main basin — highest urban runoff)
    sixPPDq: results.contaminants && results.contaminants.mainBasin ? (results.contaminants.mainBasin.sixPPDq || 0) : 0,
    // Wastewater capacity stress
    wwCapacityStress: results.contaminants && results.contaminants.mainBasin && results.contaminants.mainBasin.wastewater ? results.contaminants.mainBasin.wastewater.capacityStress : 0,
    // Sunflower sea star
    sunflowerStar: eco.sunflowerStarPop || 0.02,
    // Fish farm pathogens
    seaLicePressure: eco.seaLicePressure || 0,
    // Bigg's (transient) killer whale
    biggsPop: eco.biggsOrcaPop !== undefined ? eco.biggsOrcaPop : 0.80,
    // Pteropods, gray whales, smoke
    pteropodPop: eco.pteropodPop !== undefined ? eco.pteropodPop : 0.65,
    grayWhalePop: eco.grayWhalePop !== undefined ? eco.grayWhalePop : 0.30,
    smokePAR: results.climate && results.climate.exports ? (results.climate.exports.smokeSolarReduction || 0) : 0,
  };
}

// ── Main narrative generator ──
// Returns array of 2-3 narrative strings describing the most significant changes.
export function generateNarratives(results, prevResults, year, quarter) {
  var current = extractNarrativeState(results);
  var prev = prevResults ? extractNarrativeState(prevResults) : null;
  if (!current) return [];

  var narratives = [];

  // Check threshold crossings (highest priority)
  for (var i = 0; i < THRESHOLD_EVENTS.length; i++) {
    var te = THRESHOLD_EVENTS[i];
    try {
      if (te.test(current, prev)) {
        narratives.push({ type: 'threshold', severity: te.severity || 'neutral', priority: 10, text: te.text(current) });
      }
    } catch (e) { /* skip broken templates */ }
  }

  // Check economic narratives
  for (var j = 0; j < ECON_NARRATIVES.length; j++) {
    var en = ECON_NARRATIVES[j];
    try {
      if (en.test(current)) {
        narratives.push({ type: 'economic', severity: en.severity || 'neutral', priority: 5, text: en.text(current) });
      }
    } catch (e) { /* skip */ }
  }

  // If no threshold events, generate a status summary
  if (narratives.length === 0 && current) {
    var trend = current.orcaPop > (prev ? prev.orcaPop : 74) ? 'improving' : 'declining';
    narratives.push({
      type: 'summary',
      severity: 'neutral',
      priority: 1,
      text: 'Year ' + (year || '?') + ' Q' + ((quarter || 0) + 1) + ': Orca population at ' + Math.round(current.orcaPop) +
        ' (' + trend + '). SST ' + current.sst.toFixed(1) + '\u00B0C, DO ' + current.do.toFixed(1) + ' mg/L, salmon ' + Math.round(current.salmonRun) + '/100.',
    });
  }

  // Sort by priority descending, take top 3
  narratives.sort(function(a, b) { return b.priority - a.priority; });
  return narratives.slice(0, 3);
}

// ── Risk list to narrative (for Governance Lab between-round summaries) ──
export function riskListToNarrative(risks) {
  if (!risks || risks.length === 0) return 'No critical risks detected this period.';
  var critical = risks.filter(function(r) { return r.sev === 'critical'; });
  var warnings = risks.filter(function(r) { return r.sev === 'warning'; });
  var parts = [];
  if (critical.length > 0) parts.push(critical.length + ' critical risk' + (critical.length > 1 ? 's' : '') + ': ' + critical.slice(0, 2).map(function(r) { return r.text; }).join('. '));
  if (warnings.length > 0) parts.push(warnings.length + ' warning' + (warnings.length > 1 ? 's' : ''));
  return parts.join('. ') + '.';
}
