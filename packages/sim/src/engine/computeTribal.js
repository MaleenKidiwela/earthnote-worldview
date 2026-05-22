// ═══════════════════════════════════════════════════════════
// computeTribal.js — Tribal / First Nations Governance Engine
// ═══════════════════════════════════════════════════════════
// Indigenous governance is NOT advisory — it is legally binding
// co-management grounded in treaty law and constitutional rights.
// Tribes are co-managers, not stakeholders.
//
// Legal foundations:
//   United States v. Washington (Boldt Decision) 1974 — 50% harvest right
//   United States v. Washington (Culverts Case) 2018 — right to functional habitat
//   R. v. Sparrow 1990 — Canadian Aboriginal fishing priority after conservation
//   Section 35 of the Constitution Act 1982 — Aboriginal rights affirmed
//
// Components: treaty framework, co-management effectiveness, tribal
// restoration, TEK integration, first foods, cultural health,
// environmental justice, per-basin nation mapping.
//
// Key references:
//   Pinkerton 1989 — co-management theory and practice
//   Turner et al. 2000 — ethnobotany and TEK in Pacific Northwest
//   Berkes 2012 — Sacred Ecology: TEK and resource management
//   NWIFC 2020 — State of Our Watersheds (NW Indian Fisheries Commission)
//   Ruckelshaus et al. 2002 — Puget Sound Chinook recovery planning
//   Garibaldi & Turner 2004 — cultural keystone species
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl } from './utils.js';

// ── PER-BASIN TRIBAL DATA ──
// Nations, approximate tribal population, treaty interests, cultural sites
// Sources: Census 2020, tribal enrollment data, treaty records
var BASIN_TRIBAL = {
  juanDeFuca: {
    // Source: Point No Point Treaty, Treaty of Neah Bay, Douglas Treaties at Victoria/Kosampsom
    nations: ["Lower Elwha Klallam", "Jamestown S'Klallam", "Makah", "Songhees", "Esquimalt"],
    population: 9400, nationsCount: 5,
    culturalSites: 0.7,  // reef net, whaling heritage, Ozette village, Victoria Inner Harbour
    shellfishDependence: 0.6, salmonDependence: 0.8,
    contamExposure: 0.05, // low industrial (except Esquimalt Harbour naval activity)
  },
  georgia: {
    // Source: NWIFC, BCAFN, Douglas Treaties, Hul'qumi'num Treaty Group, W'SANEC Leadership Council
    nations: ["Musqueam", "Tsleil-Waututh", "Squamish", "Stolo", "Tsawwassen", "Lummi", "Nooksack", "Semiahmoo",
             "Cowichan", "W'SANEC", "Snuneymuxw", "Penelakut", "Stz'uminus"],
    population: 57000, nationsCount: 13,
    culturalSites: 0.8,  // Lummi reef-net, Fraser fisheries, Stolo fishing camps, Cowichan River, Gulf Islands
    shellfishDependence: 0.7, salmonDependence: 0.9,
    contamExposure: 0.15, // Cherry Point refinery, urban, industrial Nanaimo
  },
  sanjuan: {
    // Source: NWIFC, W'SANEC Leadership Council, Hul'qumi'num Treaty Group
    nations: ["Lummi", "Samish", "Swinomish", "W'SANEC", "Penelakut"],
    population: 10000, nationsCount: 5,
    culturalSites: 0.9,  // Lummi reef-net (culturally central), Samish territory, W'SANEC reef-net, Gulf Islands
    shellfishDependence: 0.8, salmonDependence: 0.7,
    contamExposure: 0.05,
  },
  whidbey: {
    nations: ["Swinomish", "Upper Skagit", "Sauk-Suiattle", "Tulalip", "Stillaguamish", "Samish"],
    population: 18500, nationsCount: 6,
    culturalSites: 0.7,  // Skagit delta fishing sites, Tulalip reservation, Samish Island
    shellfishDependence: 0.5, salmonDependence: 0.9,
    contamExposure: 0.10, // Everett industrial
  },
  mainBasin: {
    nations: ["Muckleshoot", "Suquamish", "Puyallup", "Duwamish", "Snoqualmie"],
    population: 22000, nationsCount: 5,
    culturalSites: 0.5,  // urbanized — many sites paved over
    shellfishDependence: 0.3, salmonDependence: 0.8,
    contamExposure: 0.35, // Duwamish Superfund, Commencement Bay, industrial Seattle
  },
  hoodCanal: {
    nations: ["Skokomish", "Port Gamble S'Klallam", "Suquamish"],
    population: 7000, nationsCount: 3,
    culturalSites: 0.6,
    shellfishDependence: 0.8, salmonDependence: 0.7,
    contamExposure: 0.08,
  },
  southSound: {
    nations: ["Nisqually", "Squaxin Island", "Chehalis"],
    population: 12000, nationsCount: 3,
    culturalSites: 0.7,  // Nisqually delta (restored), Medicine Creek Treaty site
    shellfishDependence: 0.7, salmonDependence: 0.8,
    contamExposure: 0.06,
  },
};

export function computeTribal(P, prev, shocks, quarter, year, fm, eco, nsr, basins, urban) {
  var _prev = prev || {};
  var basinKeys = Object.keys(BASIN_TRIBAL);

  // ── PARAMETERS ──
  var treatyImplementation = (P.treatyImplementation !== undefined ? P.treatyImplementation : 70) / 100;
  var tribalFunding = (P.tribalManagementFunding !== undefined ? P.tribalManagementFunding : 40) / 100;
  var tekIntegration = (P.tekIntegration !== undefined ? P.tekIntegration : 30) / 100;
  var tribalRestInvestment = (P.tribalRestorationInvestment !== undefined ? P.tribalRestorationInvestment : 40) / 100;
  // culturalSiteProtection (default 50%): investment in protecting/restoring cultural sites
  // Affects ceremonial access and cultural health — physical protection of reef-net sites,
  // burial grounds, village sites, and gathering areas.
  var culturalSiteProtection = (P.culturalSiteProtection !== undefined ? P.culturalSiteProtection : 50) / 100;

  // ── MODULE INPUTS ──
  var fmState = fm || {};
  var ecoState = eco || {};
  var nsrState = nsr || {};
  var urbanState = urban || {};

  // Fisheries inputs
  var tribalCatch = fmState.fmTribalValue !== undefined ? fmState.fmTribalValue : 1;
  var closures = fmState.fmClosureCount !== undefined ? fmState.fmClosureCount : 0;
  var effectivePressure = fmState.fmEffectivePressure !== undefined ? fmState.fmEffectivePressure : 40;

  // Ecosystem inputs
  var salmonHealth = ecoState.salmonHealth !== undefined ? ecoState.salmonHealth : 0.5;
  var biodiversity = ecoState.biodiversityIndex !== undefined ? ecoState.biodiversityIndex : 0.7;
  var shellfishViab = ecoState.shellfishViability !== undefined ? ecoState.shellfishViability : 0.8;
  var orcaPop = ecoState.orcaPopulation !== undefined ? ecoState.orcaPopulation : 74;

  // Nearshore inputs
  var nearshoreHealth = nsrState.nsrNearshoreHealth !== undefined ? nsrState.nsrNearshoreHealth : 0.7;
  var contamMain = nsrState.nsrMainBasinContam !== undefined ? nsrState.nsrMainBasinContam : 0.3;

  // Urban inputs
  var displacement = urbanState.totalDisplaced !== undefined ? urbanState.totalDisplaced : 0;

  // ═══════════════════════════════════════════════════════════
  // 1. TREATY FRAMEWORK
  // ═══════════════════════════════════════════════════════════
  // Treaty strength determines how effectively rights are implemented.
  // At 100%: full Boldt/Sparrow, co-management authority, habitat protection.
  // Lower values: historic pattern of treaty erosion, underfunding, exclusion.

  var treatyStrength = cl(treatyImplementation * (0.7 + tribalFunding * 0.3), 0.1, 1);
  // Culverts Case (2018): tribes have right to functional habitat
  var habitatRight = cl(treatyStrength * 0.8, 0, 1);
  // Harvest right: Boldt 50% is law, but implementation varies
  var harvestRight = cl(treatyStrength * 0.9, 0.3, 1);

  // ═══════════════════════════════════════════════════════════
  // 2. CO-MANAGEMENT EFFECTIVENESS
  // ═══════════════════════════════════════════════════════════
  // NWIFC 2020: effective co-management improves outcomes 20-40%
  // Pinkerton 1989: co-management theory — shared authority outperforms top-down

  var coMgmtBase = cl(treatyStrength * 0.5 + tribalFunding * 0.3 + tekIntegration * 0.2, 0.1, 1);
  // Co-management multiplier: enhances fisheries assessment and restoration
  var coMgmtMultiplier = cl(1.0 + coMgmtBase * 0.4, 1.0, 1.5); // up to 50% improvement
  // TEK bonus: reduces management error (Berkes 2012)
  var tekBonus = cl(tekIntegration * 0.15, 0, 0.15); // up to 15% error reduction

  // ═══════════════════════════════════════════════════════════
  // 3. TRIBAL RESTORATION
  // ═══════════════════════════════════════════════════════════
  // Tribal-led restoration achieves 1.2-1.5× habitat benefit per dollar
  // (place-based knowledge, long-term commitment, cultural motivation)
  // NWIFC 2020 State of Our Watersheds

  var tribalRestorationMult = cl(1.0 + tribalRestInvestment * 0.5 * coMgmtBase, 1.0, 1.5);

  // ═══════════════════════════════════════════════════════════
  // 4-7. PER-BASIN TRIBAL INDICATORS
  // ═══════════════════════════════════════════════════════════

  var results = {};
  var totalCulturalHealth = 0;
  var totalEJScore = 0;
  var totalFirstFoods = 0;
  var totalHarvestSecurity = 0;
  var totalTribalPop = 0;

  for (var bi = 0; bi < basinKeys.length; bi++) {
    var id = basinKeys[bi];
    var td = BASIN_TRIBAL[id];
    var basin = basins && basins[id] ? basins[id] : {};

    // ── FIRST FOODS AVAILABILITY ──
    // Salmon + shellfish + forage fish + crab — quality and access
    var basinSalmon = cl(salmonHealth * harvestRight, 0, 1);
    var basinShellfish = cl(shellfishViab * td.shellfishDependence * (1 - (basin.shellfishClosure || 0)), 0, 1);
    var beachAccess = nearshoreHealth; // beach access for gathering
    var waterQuality = basin.wqi !== undefined ? basin.wqi : 0.6;
    var contamBurden = cl(td.contamExposure + contamMain * 0.3, 0, 0.8);
    var firstFoods = cl(
      basinSalmon * td.salmonDependence * 0.35
      + basinShellfish * 0.25
      + beachAccess * 0.15
      + waterQuality * 0.15
      + (1 - contamBurden) * 0.10,
      0, 1);

    // ── CULTURAL HEALTH INDEX ──
    // Garibaldi & Turner 2004: cultural keystone species
    // culturalSiteProtection amplifies cultural site contribution to ceremonial access and cultural health
    var siteHealth = td.culturalSites * (0.5 + culturalSiteProtection * 0.5); // 50-100% of site value realized
    var ceremonialAccess = cl(basinSalmon * 0.4 + (orcaPop / 100) * 0.2 + siteHealth * 0.2 + coMgmtBase * 0.2, 0, 1);
    var culturalHealth = cl(
      firstFoods * 0.30
      + ceremonialAccess * 0.25
      + coMgmtBase * 0.20
      + siteHealth * 0.15
      + harvestRight * 0.10,
      0, 1);

    // ── ENVIRONMENTAL JUSTICE SCORE ──
    // Higher score = worse EJ conditions (more exposure, less protection)
    // Displacement contribution clamped before weighting to prevent high-pop basins from dominating
    var displacementContrib = cl(displacement / 50000 * cl(td.population / 10000, 0, 5), 0, 1);
    var exposureScore = cl(contamBurden * 0.4 + displacementContrib * 0.3 + (1 - waterQuality) * 0.3, 0, 1);
    var protectionScore = cl(treatyStrength * 0.5 + nearshoreHealth * 0.3 + tribalFunding * 0.2, 0, 1);
    var ejScore = cl(exposureScore * (1 - protectionScore * 0.5), 0, 1); // 0=good, 1=severe injustice

    // ── HARVEST SECURITY ──
    // How reliably can tribal members access their treaty-guaranteed fish?
    var harvestSecurity = cl(
      harvestRight * 0.3
      + basinSalmon * 0.3
      + cl(1 - closures / Math.max(closures + 1, 4), 0, 1) * 0.2 // fewer closures = more security; scales with actual count
      + coMgmtBase * 0.2,
      0, 1);

    totalCulturalHealth += culturalHealth * td.population;
    totalEJScore += ejScore * td.population;
    totalFirstFoods += firstFoods * td.population;
    totalHarvestSecurity += harvestSecurity * td.population;
    totalTribalPop += td.population;

    results[id] = {
      firstFoodsAvailability: firstFoods,
      culturalHealth: culturalHealth,
      ejScore: ejScore,
      harvestSecurity: harvestSecurity,
      ceremonialAccess: ceremonialAccess,
      contamBurden: contamBurden,
      nationsCount: td.nationsCount,
      tribalPopulation: td.population,
    };
  }

  // Population-weighted aggregates
  var popDiv = Math.max(totalTribalPop, 1);
  var avgCulturalHealth = totalCulturalHealth / popDiv;
  var avgEJScore = totalEJScore / popDiv;
  var avgFirstFoods = totalFirstFoods / popDiv;
  var avgHarvestSecurity = totalHarvestSecurity / popDiv;

  return {
    state: {
      basins: results,
      treatyStrength: treatyStrength,
      coManagementEffectiveness: coMgmtBase,
      coManagementMultiplier: coMgmtMultiplier,
      tekBonus: tekBonus,
      tribalRestorationMultiplier: tribalRestorationMult,
      avgCulturalHealth: avgCulturalHealth,
      avgEJScore: avgEJScore,
      avgFirstFoods: avgFirstFoods,
      avgHarvestSecurity: avgHarvestSecurity,
      totalTribalPopulation: totalTribalPop,
    },

    _carry: {}, // stateless — reads current conditions each quarter

    exports: {
      // Management multipliers (feed back into fisheries and nearshore)
      trbCoMgmtMultiplier: coMgmtMultiplier,
      trbTekBonus: tekBonus,
      trbRestorationMultiplier: tribalRestorationMult,
      trbTreatyStrength: treatyStrength,

      // Cultural indicators
      trbCulturalHealth: avgCulturalHealth,
      trbFirstFoods: avgFirstFoods,
      trbHarvestSecurity: avgHarvestSecurity,
      trbEJScore: avgEJScore,

      // Per-basin for equity model
      trbMainBasinEJ: results.mainBasin ? results.mainBasin.ejScore : 0,
      trbHoodCanalCultural: results.hoodCanal ? results.hoodCanal.culturalHealth : 0.5,
    },
  };
}
