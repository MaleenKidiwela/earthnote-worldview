// ═══════════════════════════════════════════════════════════
// ROLE FINANCIAL MODELS — Personal financial consequences per Governance Lab role
// ═══════════════════════════════════════════════════════════
// Inspired by the UVA Bay Game (Learmonth et al. 2011): each role
// experiences personal financial consequences from their decisions
// AND the system state. This makes tradeoffs visceral, not abstract.
//
// Each role has:
//   income(results)  — revenue from simulation outputs ($M/yr)
//   costs(results)   — expenses driven by decisions and system state ($M/yr)
//   net(results)     — income - costs
//   crossImpacts     — how other roles' decisions affect your finances
//   culturalValue(results) — non-monetary value (tribal role: food sovereignty, ceremonies)
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

function cl(v, mn, mx) { return Math.max(mn, Math.min(mx, v || 0)); }

export const ROLE_FINANCIALS = {
  port: {
    label: 'Port Authority',
    currency: '$M/yr',
    income: function(r) {
      var ps = r.port ? r.port.state : {};
      var ops = r.portOperations ? r.portOperations.state : {};
      // Revenue from container throughput, cruise, bulk cargo
      var containerRev = cl(ps.revenue, 0, 10000);
      var cruiseRev = cl(ps.tourismRev, 0, 2000);
      var opsRev = ops.totalRevenue ? cl(ops.totalRevenue, 0, 5000) : 0;
      return { total: containerRev + cruiseRev, containers: containerRev, cruise: cruiseRev, operations: opsRev };
    },
    costs: function(r, params) {
      var ps = r.port ? r.port.state : {};
      var eco = r.ecosystem ? r.ecosystem.state : {};
      // Labor costs scale with employment
      var labor = cl(ps.employment, 0, 60000) * 0.065; // ~$65K/job avg
      // Shore power investment (high upfront, saves on emissions fines)
      var shorePower = cl((params && params.port ? params.port.shorepower : 20) / 100, 0, 1) * 200;
      // Environmental compliance — rises with contamination and ESA listings
      var envCompliance = cl(eco.ecologicalConstraints, 0, 1) * 150;
      // Dredging maintenance
      var dredging = cl((params && params.port ? params.port.dredgingIntensity : 30) / 100, 0, 1) * 80;
      return { total: labor + shorePower + envCompliance + dredging, labor: labor, shorePower: shorePower, envCompliance: envCompliance, dredging: dredging };
    },
    crossImpacts: [
      { from: 'conservation', desc: 'Orca protection zones reduce vessel speed, cutting throughput', effect: function(r) { return -(r.ecosystem ? r.ecosystem.state.ecologicalConstraints : 0) * 200; } },
      { from: 'tribal', desc: 'Treaty fishing closures delay vessel movements near hatchery streams', effect: function(r) { return -cl((r.ecosystem ? r.ecosystem.state.treatyFisheryHealth : 0.5) - 0.5, 0, 0.5) * 50; } },
    ],
  },

  tribal: {
    label: 'Tribal Fisheries Council',
    currency: '$M/yr',
    income: function(r) {
      var eco = r.ecosystem ? r.ecosystem.state : {};
      var fish = r.fisheries ? r.fisheries.state : {};
      // Treaty harvest revenue — driven by salmon run strength and harvest allocation
      var salmonHarvest = cl(eco.salmonRunStrength, 0, 100) * 0.8; // ~$80M at full runs
      // Shellfish harvest — Dungeness crab, geoduck, oyster
      var shellfish = cl(eco.dungenessCrabRevenue, 0, 200) + cl(eco.geoduckRevenue, 0, 100) + cl(eco.oysterRevenue, 0, 50);
      // Aquaculture
      var aqua = cl(eco.aquaRevenue, 0, 100);
      return { total: salmonHarvest + shellfish + aqua, salmon: salmonHarvest, shellfish: shellfish, aquaculture: aqua };
    },
    costs: function(r, params) {
      // Co-management costs — monitoring, enforcement, habitat assessment
      var coMgmt = cl((params && params.tribal ? params.tribal.tribalManagementFunding : 40) / 100, 0, 1) * 25;
      // Restoration investment
      var restoration = cl((params && params.tribal ? params.tribal.tribalRestorationInvestment : 35) / 100, 0, 1) * 15;
      // Hatchery operations
      var hatchery = 8; // relatively fixed
      return { total: coMgmt + restoration + hatchery, coManagement: coMgmt, restoration: restoration, hatchery: hatchery };
    },
    // Non-monetary cultural value — food sovereignty, ceremonial access, cultural health
    culturalValue: function(r) {
      var eco = r.ecosystem ? r.ecosystem.state : {};
      return {
        foodSovereignty: cl(eco.indigenousFoodSovereignty, 0, 1),
        ceremonialAccess: cl(eco.ceremonialAccess, 0, 1),
        culturalHealth: cl(eco.culturalKeystoneHealth, 0, 1),
        shellfishAccess: cl(eco.shellfishHarvestAccess, 0, 1),
        // Composite: the weakest link matters most
        composite: Math.min(
          cl(eco.indigenousFoodSovereignty, 0, 1),
          cl(eco.ceremonialAccess, 0, 1),
          cl(eco.culturalKeystoneHealth, 0, 1)
        ),
      };
    },
    crossImpacts: [
      { from: 'port', desc: 'Vessel noise reduces orca prey availability, cutting salmon-dependent income', effect: function(r) { var eco = r.ecosystem ? r.ecosystem.state : {}; return -(1 - cl(eco.forageFishIndex, 0, 1)) * 30; } },
      { from: 'county', desc: 'Wastewater pollution triggers shellfish harvest closures', effect: function(r) { var eco = r.ecosystem ? r.ecosystem.state : {}; return -cl(eco.shellfishClosure, 0, 1) * 40; } },
    ],
  },

  county: {
    label: 'County Environmental Health',
    currency: '$M/yr',
    income: function(r) {
      var us = r.urban ? r.urban.state : {};
      // Tax revenue scales with population and property values
      var taxBase = cl(us.population, 0, 15000000) / 1000000 * 450; // ~$450M per million people
      var propertyTax = cl(us.propertyValueIndex, 0, 1) * 800;
      return { total: taxBase + propertyTax, taxBase: taxBase, propertyTax: propertyTax };
    },
    costs: function(r, params) {
      var us = r.urban ? r.urban.state : {};
      // Wastewater treatment
      var wastewater = cl((params && params.urban ? params.urban.wastewaterEfficiency : 75) / 100, 0, 1) * 400;
      // Stormwater infrastructure
      var stormwater = 200 + cl(us.effectiveInfraAge, 0, 1) * 150; // older = more expensive
      // Public health response (HABs, smoke, contamination)
      var healthResponse = cl(r.publicHealth && r.publicHealth.state ? r.publicHealth.state.totalHealthCost : 50, 0, 500);
      // Climate adaptation
      var adaptation = cl(us.coastalFloodRisk, 0, 1) * 300;
      return { total: wastewater + stormwater + healthResponse + adaptation, wastewater: wastewater, stormwater: stormwater, health: healthResponse, adaptation: adaptation };
    },
    crossImpacts: [
      { from: 'port', desc: 'Port expansion increases development pressure and infrastructure load', effect: function(r) { return -(r.urban && r.urban.state ? cl(r.urban.state.displacementPressure, 0, 1) : 0) * 100; } },
      { from: 'climate', desc: 'Climate warming increases public health costs (smoke, heat, HABs)', effect: function(r) { return -(r.publicHealth && r.publicHealth.state ? r.publicHealth.state.totalHealthCost : 50) * 0.5; } },
    ],
  },

  conservation: {
    label: 'Marine Conservation',
    currency: '$M/yr',
    income: function(r) {
      var eco = r.ecosystem ? r.ecosystem.state : {};
      // Ecosystem service valuations — nature's economy
      var ecoSvc = r.ecoServices && r.ecoServices.state && r.ecoServices.state.total ? cl(r.ecoServices.state.total.value, 0, 20000) : 6000;
      // Grant funding scales with biodiversity health (more crisis = more grants, up to a point)
      var grantFunding = 50 + cl(1 - eco.biodiversityIndex, 0, 0.5) * 100; // crisis attracts funding
      // Recreation/tourism value
      var recreation = cl(eco.recreationValue, 0, 1) * 500;
      return { total: ecoSvc, ecosystemServices: ecoSvc, grants: grantFunding, recreation: recreation };
    },
    costs: function(r, params) {
      var eco = r.ecosystem ? r.ecosystem.state : {};
      // MPA enforcement
      var mpaEnforcement = cl((params && params.ecosystem ? params.ecosystem.protectedAreaFraction : 15) / 100, 0, 0.5) * 60;
      // Species recovery programs
      var recovery = cl(eco.ecologicalConstraints, 0, 1) * 200;
      // Monitoring & assessment
      var monitoring = 30;
      // Restoration (eelgrass, kelp, shoreline)
      var restoration = cl((params && params.ecosystem ? params.ecosystem.eelgrassRestoration : 0) / 100, 0, 1) * 50;
      return { total: mpaEnforcement + recovery + monitoring + restoration, mpaEnforcement: mpaEnforcement, recovery: recovery, monitoring: monitoring, restoration: restoration };
    },
    crossImpacts: [
      { from: 'port', desc: 'Port pollution triggers additional monitoring and ESA compliance costs', effect: function(r) { return -(r.port && r.port.state ? cl(r.port.state.noiseIndex, 0, 1) : 0.3) * 40; } },
      { from: 'county', desc: 'Poor wastewater increases nutrient loading → HABs → monitoring costs', effect: function(r) { var ms = r.marine ? r.marine.state : {}; return -cl(ms.habIntensity, 0, 1) * 30; } },
    ],
  },

  climate: {
    label: 'Climate & Energy Board',
    currency: '$M/yr',
    income: function(r) {
      var en = r.energy && r.energy.state ? r.energy.state : {};
      // Electricity revenue: price × generation capacity × hours
      // PNW ~50 GW capacity, ~$0.09/kWh avg, ~$40B total sector revenue
      // We model regional utility revenue share: ~$2B at $0.09, scales with price
      var elecPrice = cl(en.electricityPrice, 0.03, 0.30) || 0.09;
      var electricityRev = elecPrice / 0.09 * 2000; // normalized: $2B at baseline price
      // Carbon credit revenue (from clean energy)
      var carbonCredits = cl(en.cleanFraction, 0, 1) * 200;
      return { total: electricityRev + carbonCredits, electricity: electricityRev, carbonCredits: carbonCredits };
    },
    costs: function(r, params) {
      var en = r.energy && r.energy.state ? r.energy.state : {};
      // Grid maintenance
      var gridMaint = 400 + cl(1 - (en.gridReliability || 0.95), 0, 0.2) * 1000;
      // Renewable transition investment
      var transition = cl((params && params.urban ? params.urban.energyCleanFraction : 45) / 100, 0, 1) * 800;
      // Infrastructure hardening (climate adaptation)
      var hardening = cl((params && params.infrastructure ? params.infrastructure.gridHardeningInvestment : 35) / 100, 0, 1) * 200;
      // Fuel costs (for non-renewable generation)
      var fuel = cl(1 - (en.cleanFraction || 0.65), 0, 1) * 600;
      return { total: gridMaint + transition + hardening + fuel, gridMaint: gridMaint, transition: transition, hardening: hardening, fuel: fuel };
    },
    crossImpacts: [
      { from: 'port', desc: 'Shore power adoption shifts electricity demand to the grid', effect: function(r) { return cl((r.port && r.port.state ? r.port.state.shorePowerAdoption || 0.3 : 0.3), 0, 1) * 50; } },
      { from: 'county', desc: 'Data center growth strains grid capacity', effect: function(r) { return -(r.energy && r.energy.state ? cl(r.energy.state.dataCenterLoad || 0, 0, 1) : 0) * 100; } },
    ],
  },
};

// Compute full financial summary for a role given simulation results
export function computeRoleFinances(roleId, results, params) {
  var model = ROLE_FINANCIALS[roleId];
  if (!model) return null;
  var inc = model.income(results);
  var cost = model.costs(results, params);
  var net = inc.total - cost.total;
  var crossEffects = (model.crossImpacts || []).map(function(ci) {
    return { from: ci.from, desc: ci.desc, amount: ci.effect(results) };
  });
  var totalCross = crossEffects.reduce(function(s, e) { return s + e.amount; }, 0);
  var cultural = model.culturalValue ? model.culturalValue(results) : null;
  return {
    roleId: roleId,
    label: model.label,
    currency: model.currency,
    income: inc,
    costs: cost,
    net: net,
    netWithCross: net + totalCross,
    crossEffects: crossEffects,
    culturalValue: cultural,
    trend: net > 0 ? 'positive' : net > -50 ? 'stable' : 'declining',
  };
}
