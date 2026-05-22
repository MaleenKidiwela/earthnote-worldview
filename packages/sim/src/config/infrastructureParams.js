// ═══════════════════════════════════════════════════════════
// REGIONAL INFRASTRUCTURE PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════

export const INFRASTRUCTURE_PARAMS = {

  i5Corridor: {
    name: "I-5 Corridor",
    chuckanutBaseProb: { value: 0.04, unit: "per quarter", description: "Baseline Chuckanut section landslide probability", source: "WSDOT Unstable Slopes Program — recurring joint failures at MP 246-252; March 2026 event", sensitivity: "high" },
    dailyTradeValue: { value: 274, unit: "$M/day", description: "Daily trade value through Cascadia I-5 corridor", source: "US Census Bureau trade data — ~$100B/yr US-Canada trade via Cascadia crossings", sensitivity: "medium" },
    skagitFloodThreshold: { value: 1500, unit: "m³/s", description: "Skagit River discharge above which I-5 flood risk begins", source: "USGS flood stage data; Army Corps Skagit flood risk assessment", sensitivity: "medium" },
  },

  rail: {
    name: "BNSF Rail Corridor",
    oilTrainFreq: { value: 6, unit: "trains/week", description: "Bakken crude oil train frequency to Cherry Point/Anacortes refineries", source: "WA UTC rail safety data; BNSF filings", sensitivity: "medium" },
    derailBaseProb: { value: 0.0002, unit: "per train per quarter", description: "Baseline derailment probability per oil train", source: "FRA accident data; Lac-Mégantic 2013, Mosier OR 2016 inform risk", sensitivity: "high" },
  },

  ferries: {
    name: "WA State Ferries",
    avgFleetAge: { value: 35, unit: "years", description: "Average WSF vessel age (oldest fleet in US)", source: "WA State Ferries Long Range Plan 2040 — fleet nearing end of service life", sensitivity: "medium" },
    annualRiders: { value: 24000000, unit: "riders/year", description: "WSF annual ridership (largest ferry system in US)", source: "WSF ridership statistics", sensitivity: "low" },
  },

  bcHighway: {
    name: "BC Highway 1 (Fraser Canyon)",
    ar2021Destruction: { value: 5, unit: "sections", description: "Number of highway sections destroyed by November 2021 AR", source: "BC Ministry of Transportation — unprecedented simultaneous destruction of Hwy 1, Hwy 5 (Coquihalla), and rail", sensitivity: "high" },
  },

  pipelines: {
    name: "Pipeline Infrastructure",
    olympicRupture1999: { value: 3, unit: "fatalities", description: "Olympic Pipeline rupture in Bellingham (1999) — Whatcom Falls Park", source: "NTSB accident report — pipeline safety failure killed 3, ignited creek", sensitivity: "high" },
    cherryPointFuelShare: { value: 0.40, unit: "fraction", description: "Cherry Point refineries' share of WA fuel production", source: "WA Dept of Commerce — Cherry Point complex produces ~40% of WA fuel", sensitivity: "medium" },
  },

  levees: {
    name: "Flood Control Levees",
    skagitLeveeRisk: { value: "high", unit: "risk category", description: "Army Corps risk rating for Skagit River levee system", source: "USACE Skagit River Flood Risk Management; ~20,000 people in protected floodplain", sensitivity: "high" },
    designFloodCapacity: { value: 2000, unit: "m³/s at full condition", description: "Maximum discharge levees can contain at perfect condition", source: "Calibrated — Skagit 100-yr flood ~2,000 m³/s at Burlington gauge", sensitivity: "high" },
  },

  resilience: {
    name: "Infrastructure Resilience",
    cascadeProbability: { value: 0.60, unit: "fraction", description: "Probability of secondary road failure when I-5 closes (SR-11 Chuckanut)", source: "March 2026 event: I-5 and SR-11 closed simultaneously due to shared geology", sensitivity: "medium" },
    lowRedundancy: { value: "critical", unit: "assessment", description: "Cascadia corridor structural vulnerability: essentially one highway, one rail line, and ferries", source: "CLiP Cascadia Lifelines Program — recognized extreme single-point-of-failure risk", sensitivity: "high" },
  },
};
