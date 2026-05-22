// ═══════════════════════════════════════════════════════════
// PUGET SOUND WATERSHEDS PARAMETER REGISTRY
// ═══════════════════════════════════════════════════════════

export const PS_WATERSHED_PARAMS = {

  skagit: {
    name: "Skagit River (8,000 km²)",
    meanDischarge: { value: 470, unit: "m³/s", description: "Mean annual discharge at Mt. Vernon (USGS 12200500)", source: "USGS National Water Information System — period of record 1940-present", sensitivity: "high" },
    damCapacity: { value: 700, unit: "MW", description: "Total Seattle City Light dam capacity (Gorge + Diablo + Ross)", source: "Seattle City Light Skagit Hydroelectric Project", sensitivity: "medium" },
    baselinePassage: { value: 0.5, unit: "fraction", description: "Baseline fish passage fraction at SCL dams", source: "NOAA ESA consultation — limited passage above Ross Dam", sensitivity: "high" },
    springChinookBaseline: { value: 8000, unit: "fish", description: "Baseline Skagit spring Chinook return", source: "WDFW SaSI; Beechie et al. 2006 — most SRKW-critical PS stock", sensitivity: "high" },
    summerChinookBaseline: { value: 12000, unit: "fish", description: "Baseline Skagit summer Chinook return", source: "WDFW SaSI", sensitivity: "high" },
  },

  snohomish: {
    name: "Snohomish River (4,700 km²)",
    meanDischarge: { value: 270, unit: "m³/s", description: "Mean annual discharge at Monroe (USGS 12150800)", source: "USGS NWIS", sensitivity: "medium" },
    czVulnerability: { value: 0.30, unit: "fraction", description: "Fraction of quarters with Convergence Zone flooding risk", source: "Mass 2008; Snohomish County FCZD records", sensitivity: "medium" },
    chinookBaseline: { value: 10000, unit: "fish", description: "Baseline Snohomish Chinook return", source: "WDFW SaSI; Ruckelshaus et al. 2002", sensitivity: "medium" },
  },

  nooksack: {
    name: "Nooksack River (2,000 km²)",
    meanDischarge: { value: 100, unit: "m³/s", description: "Mean annual discharge (USGS 12213100)", source: "USGS NWIS", sensitivity: "medium" },
    dairyIntensity: { value: 0.70, unit: "fraction", description: "Baseline Whatcom County dairy intensity (one of highest in WA)", source: "WSDA; Whatcom County nutrient management plans", sensitivity: "high" },
    chinookBaseline: { value: 3000, unit: "fish", description: "Baseline Nooksack Chinook return (South Fork nearly extinct)", source: "WDFW SaSI; NOAA Nooksack Chinook recovery plan", sensitivity: "high" },
  },

  puyallup: {
    name: "Puyallup River (2,700 km²)",
    meanDischarge: { value: 90, unit: "m³/s", description: "Mean annual discharge at Puyallup (USGS 12101500)", source: "USGS NWIS", sensitivity: "medium" },
    glacialSediment: { value: 150, unit: "tonnes/day per unit glacier mass", description: "Very high glacial sediment from Rainier volcanoclastic deposits", source: "Czuba et al. 2012 — Puyallup glacial sediment budget", sensitivity: "medium" },
    mudMtnPassage: { value: 0.4, unit: "fraction", description: "Baseline fish passage at Mud Mountain Dam", source: "USACE Mud Mountain Dam fish trap and haul operations", sensitivity: "medium" },
    chinookBaseline: { value: 5000, unit: "fish", description: "Baseline White River spring Chinook return", source: "WDFW SaSI; Puyallup Tribe hatchery records", sensitivity: "medium" },
  },

  nisqually: {
    name: "Nisqually River (1,850 km²)",
    meanDischarge: { value: 55, unit: "m³/s", description: "Mean annual discharge (USGS 12089500)", source: "USGS NWIS", sensitivity: "medium" },
    restorationArea: { value: 762, unit: "acres", description: "Nisqually Delta restoration area (Brown Farm Dike removal 2009)", source: "Nisqually NWR; Ellings et al. 2016 (Restoration Ecology 24:441-453)", sensitivity: "high" },
    chinookBaseline: { value: 6000, unit: "fish", description: "Baseline Nisqually Chinook return (recovery success)", source: "Nisqually Indian Tribe co-management reports; WDFW", sensitivity: "medium" },
  },

  stillaguamish: {
    name: "Stillaguamish River (1,800 km²)",
    meanDischarge: { value: 75, unit: "m³/s", description: "Mean annual discharge (USGS 12167000)", source: "USGS NWIS", sensitivity: "medium" },
    osoLegacy: { value: 0.15, unit: "fraction", description: "Oso landslide scar fraction (decaying since 2014)", source: "USGS Oso landslide investigation; Iverson et al. 2015 (Landslides 12:69-87)", sensitivity: "medium" },
    chinookBaseline: { value: 4000, unit: "fish", description: "Baseline Stillaguamish Chinook return", source: "WDFW SaSI; Stillaguamish Tribe recovery plan", sensitivity: "medium" },
    slideProb: { value: 0.005, unit: "per quarter", description: "Baseline landslide probability per quarter", source: "Calibrated — informed by Oso slide conditions (glacial deposits + saturated slopes)", sensitivity: "medium" },
  },
};
