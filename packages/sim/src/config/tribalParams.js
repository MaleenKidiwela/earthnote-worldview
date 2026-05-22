// ═══════════════════════════════════════════════════════════
// TRIBAL / FIRST NATIONS GOVERNANCE PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════

export const TRIBAL_PARAMS = {

  treatyFramework: {
    name: "Treaty Framework and Legal Status",
    boldtAllocation: { value: 0.50, unit: "fraction", description: "Treaty harvest allocation (Boldt Decision: 50% of harvestable surplus)", source: "United States v. Washington 1974 (Boldt Decision); affirmed by Supreme Court 1979", sensitivity: "high" },
    culvertsHabitatRight: { value: 0.80, unit: "fraction of treaty strength", description: "Habitat protection right (Culverts Case 2018)", source: "United States v. Washington (Culverts Case) 2018 — tribal right to functional fish habitat", sensitivity: "high" },
    sparrowPriority: { value: 0.90, unit: "fraction of treaty strength", description: "Aboriginal fishing priority after conservation (Sparrow Decision)", source: "R. v. Sparrow 1990 — Section 35 constitutional right priority", sensitivity: "high" },
  },

  coManagement: {
    name: "Co-Management Effectiveness",
    maxMultiplier: { value: 1.5, unit: "×", description: "Maximum outcome improvement from effective co-management", source: "NWIFC 2020 State of Our Watersheds; Pinkerton 1989 — co-management improves outcomes 20-40%", sensitivity: "high" },
    nwifcNations: { value: 20, unit: "treaty tribes", description: "Number of treaty tribes in NWIFC (US side)", source: "Northwest Indian Fisheries Commission — 20 member tribes", sensitivity: "low" },
  },

  tribalRestoration: {
    name: "Tribal Restoration Programs",
    effectivenessMultiplier: { value: 1.5, unit: "× per dollar", description: "Maximum restoration effectiveness multiplier for tribal-led programs", source: "NWIFC 2020 — tribal programs achieve 1.2-1.5× habitat benefit per dollar due to place-based knowledge", sensitivity: "medium" },
    nisquallyRestorationArea: { value: 762, unit: "acres", description: "Nisqually Delta restoration area (Brown Farm Dike removal 2009)", source: "USFWS Nisqually NWR; Ellings et al. 2016 (Restoration Ecology 24:441-453)", sensitivity: "medium" },
  },

  tek: {
    name: "Traditional Ecological Knowledge",
    maxErrorReduction: { value: 0.15, unit: "fraction", description: "Maximum management error reduction from TEK integration", source: "Berkes 2012 (Sacred Ecology) — TEK improves calibration of ecological understanding", sensitivity: "medium" },
    managementImprovement: { value: 0.15, unit: "fraction", description: "Maximum management quality improvement from TEK-informed decisions", source: "Turner et al. 2000 — ethnobotanical knowledge improves species management", sensitivity: "medium" },
  },

  culturalHealth: {
    name: "Cultural Health Indicators",
    ceremonialWeight: { value: 0.25, unit: "fraction", description: "Weight of ceremonial access in cultural health index", source: "Garibaldi & Turner 2004 — cultural keystone species framework", sensitivity: "low" },
    firstFoodsWeight: { value: 0.30, unit: "fraction", description: "Weight of first foods availability in cultural health index", source: "Turner & Turner 2008 — food sovereignty as cultural survival indicator", sensitivity: "low" },
    orcaCulturalWeight: { value: 0.20, unit: "fraction of ceremonial", description: "Weight of orca (qwe'lhol'mechen) within ceremonial access", source: "Coast Salish oral tradition — orca are relatives, not resources", sensitivity: "low" },
  },

  environmentalJustice: {
    name: "Environmental Justice",
    tribalVulnerabilityMult: { value: 1.3, unit: "×", description: "Tribal vulnerability multiplier for displacement (already in computeUrban)", source: "FEMA environmental justice framework; Quinault relocation cost analysis", sensitivity: "medium" },
    duwamishContam: { value: 0.35, unit: "index", description: "Main Basin contamination exposure from Duwamish Waterway Superfund", source: "West et al. 2017 (NOAA) — PS Chinook among most contaminated salmon globally due to Duwamish", sensitivity: "high" },
  },

  perBasin: {
    name: "Per-Basin Tribal Data",
    totalTribalPop: { value: 118500, unit: "people", description: "Total tribal population across all 18 sub-basins (approximate)", source: "Census 2020 + tribal enrollment data (self-reported, likely undercount)", sensitivity: "low" },
    georgiaNations: { value: 8, unit: "nations", description: "Number of nations with treaty interests in Georgia Strait basin", source: "Treaty records — Musqueam, Tsleil-Waututh, Squamish, Stó:lō, Tsawwassen, Lummi, Nooksack, Semiahmoo", sensitivity: "low" },
  },
};
