// ═══════════════════════════════════════════════════════════
// MARITIME LAW — International legal framework for the Salish Sea
// ═══════════════════════════════════════════════════════════
// The Salish Sea is governed by overlapping and sometimes
// conflicting US, Canadian, international, and Indigenous
// legal regimes. Regulations, enforcement, and jurisdiction
// directly constrain what policy actions are feasible.
//
// Sources:
//   UNCLOS (1982): transit passage, territorial sea, EEZ
//   ICJ Corfu Channel case (1949): international strait rights
//   Pacific Salmon Treaty (1985, renewed 2019)
//   Boundary Waters Treaty (1909): IJC
//   Boldt Decision (US v. Washington, 1974): tribal fishing rights
//   Sparrow Decision (R v. Sparrow, 1990): Aboriginal fishing
//   ECHO Program MOU: VFPA voluntary vessel slowdown
//   BC Carbon Tax Act: $80 CAD/ton (2024)
//   WA Climate Commitment Act (2023): cap-and-trade
//   IMO MARPOL / 2020 sulfur cap / ECA North America
//   Transport Canada / USCG vessel safety regulations
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

// ── JURISDICTIONAL ZONES PER SUB-BASIN ──
export const JURISDICTIONS = {
  // ── JUAN DE FUCA — International Strait ──
  jdf_west: {
    jurisdiction: 'shared',
    unclosRegime: 'transit_passage',
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'CA_TC', 'CA_ECCC', 'IMO'],
    canRestrictTraffic: false,
    environmentalRegulations: ['IMO_2020', 'ECA_NAm'],
    tribalAuthority: ['makah_treaty'],
    notes: 'International strait. Transit passage rights limit unilateral environmental regulation of shipping.',
  },
  jdf_central: {
    jurisdiction: 'shared',
    unclosRegime: 'transit_passage',
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'CA_TC', 'IMO'],
    canRestrictTraffic: false,
    environmentalRegulations: ['IMO_2020', 'ECA_NAm', 'ECHO_voluntary'],
    tribalAuthority: ['sklallam_treaty'],
    notes: 'Boundary runs mid-strait. ECHO slowdown is VOLUNTARY because mandatory would face UNCLOS challenge.',
  },
  jdf_east: {
    jurisdiction: 'shared',
    unclosRegime: 'transit_passage',
    regulatoryAuthority: ['US_USCG', 'CA_TC', 'IMO'],
    canRestrictTraffic: false,
    environmentalRegulations: ['IMO_2020', 'ECA_NAm'],
    tribalAuthority: ['sklallam_treaty'],
    notes: 'Admiralty Inlet — convergence of Puget Sound and Haro Strait traffic.',
  },

  // ── HARO STRAIT — Shared boundary ──
  sj_haro: {
    jurisdiction: 'shared',
    unclosRegime: 'transit_passage',
    regulatoryAuthority: ['US_USCG', 'CA_TC', 'NOAA', 'DFO', 'IMO'],
    canRestrictTraffic: false,
    environmentalRegulations: ['IMO_2020', 'ECA_NAm', 'ECHO_voluntary', 'SRKW_critical_habitat'],
    tribalAuthority: ['lummi_treaty'],
    notes: 'US-Canada boundary runs through Haro Strait (1872 arbitration). ALL Vancouver shipping transits through SRKW critical habitat. ECHO voluntary slowdown applies both sides.',
  },
  sj_rosario: {
    jurisdiction: 'US',
    unclosRegime: 'internal_waters',
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'NOAA'],
    canRestrictTraffic: true,
    environmentalRegulations: ['IMO_2020', 'ECA_NAm', 'SRKW_critical_habitat'],
    tribalAuthority: ['swinomish_treaty', 'samish_treaty'],
    notes: 'Entirely US waters. San Juan Islands NWR.',
  },

  // ── GEORGIA STRAIT — Canadian waters ──
  georgia_north: {
    jurisdiction: 'Canada',
    unclosRegime: 'internal_waters',
    regulatoryAuthority: ['CA_TC', 'CA_ECCC', 'DFO', 'VFPA'],
    canRestrictTraffic: true,
    environmentalRegulations: ['IMO_2020', 'ECA_NAm', 'BC_carbon_tax', 'federal_OBPS'],
    tribalAuthority: [],
    notes: 'Entirely Canadian internal waters. Full regulatory authority.',
  },
  georgia_central: {
    jurisdiction: 'Canada',
    unclosRegime: 'internal_waters',
    regulatoryAuthority: ['CA_TC', 'CA_ECCC', 'DFO', 'VFPA'],
    canRestrictTraffic: true,
    environmentalRegulations: ['IMO_2020', 'ECA_NAm', 'BC_carbon_tax', 'TMX_conditions'],
    tribalAuthority: ['musqueam_aboriginal', 'tsleilwaututh_aboriginal', 'squamish_aboriginal'],
    notes: 'Fraser plume zone. Vancouver port. TMX tanker route. Duty to consult First Nations.',
  },
  georgia_south: {
    jurisdiction: 'shared',
    unclosRegime: 'mixed',
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'CA_TC', 'DFO'],
    canRestrictTraffic: false,
    environmentalRegulations: ['IMO_2020', 'ECA_NAm', 'BC_carbon_tax', 'WA_CCA'],
    tribalAuthority: ['lummi_treaty', 'tsawwassen_modern_treaty'],
    notes: 'Boundary Bay area. US-Canada border. Cherry Point refineries (US side), Roberts Bank (CA side).',
  },

  // ── PUGET SOUND — US internal waters ──
  whidbey_north: {
    jurisdiction: 'US',
    unclosRegime: 'internal_waters',
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'NOAA', 'WA_ECY'],
    canRestrictTraffic: true,
    environmentalRegulations: ['IMO_2020', 'ECA_NAm', 'WA_CCA'],
    tribalAuthority: ['swinomish_treaty'],
  },
  whidbey_central: { jurisdiction: 'US', unclosRegime: 'internal_waters', canRestrictTraffic: true,
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'WA_ECY'], tribalAuthority: ['stillaguamish_treaty', 'tulalip_treaty'] },
  whidbey_south: { jurisdiction: 'US', unclosRegime: 'internal_waters', canRestrictTraffic: true,
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'WA_ECY'], tribalAuthority: ['tulalip_treaty'] },
  main_north: { jurisdiction: 'US', unclosRegime: 'internal_waters', canRestrictTraffic: true,
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'WA_ECY', 'NWSA'], tribalAuthority: ['muckleshoot_treaty'] },
  main_central: { jurisdiction: 'US', unclosRegime: 'internal_waters', canRestrictTraffic: true,
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'WA_ECY', 'US_Navy'], tribalAuthority: [] },
  main_south: { jurisdiction: 'US', unclosRegime: 'internal_waters', canRestrictTraffic: true,
    regulatoryAuthority: ['US_USCG', 'US_EPA', 'WA_ECY', 'NWSA'], tribalAuthority: ['puyallup_treaty'] },
  hood_north: { jurisdiction: 'US', unclosRegime: 'internal_waters', canRestrictTraffic: true,
    regulatoryAuthority: ['US_USCG', 'US_Navy'], tribalAuthority: ['skokomish_treaty'] },
  hood_south: { jurisdiction: 'US', unclosRegime: 'internal_waters', canRestrictTraffic: true,
    regulatoryAuthority: ['US_USCG', 'WA_ECY'], tribalAuthority: ['skokomish_treaty'] },
  ssound_north: { jurisdiction: 'US', unclosRegime: 'internal_waters', canRestrictTraffic: true,
    regulatoryAuthority: ['US_USCG', 'WA_ECY'], tribalAuthority: ['nisqually_treaty'] },
  ssound_south: { jurisdiction: 'US', unclosRegime: 'internal_waters', canRestrictTraffic: true,
    regulatoryAuthority: ['US_USCG', 'WA_ECY'], tribalAuthority: [] },
};

// ── BILATERAL TREATIES AND AGREEMENTS ──
export const TREATIES = {
  pacific_salmon_treaty: {
    name: 'Pacific Salmon Treaty (1985, renewed 2019)',
    parties: ['US', 'Canada'],
    governs: 'Salmon allocation and management across US-Canada boundary',
    modelVariables: ['fishingAllocation', 'fraserHarvestRate', 'psChinookHarvestRate'],
    enforcement: 'Pacific Salmon Commission (PSC)',
    disputeResolution: 'Bilateral negotiation, arbitration panel',
    constraints: 'US and Canadian harvest rates are JOINTLY determined — neither side can unilaterally increase harvest. Fraser sockeye management requires bilateral coordination.',
    citation: 'Pacific Salmon Treaty, 16 USC §3631-3644',
  },
  boundary_waters_treaty: {
    name: 'Boundary Waters Treaty (1909)',
    parties: ['US', 'Canada'],
    governs: 'Use and diversion of boundary and transboundary waters',
    modelVariables: ['crossBorderCoordination'],
    enforcement: 'International Joint Commission (IJC)',
    constraints: 'Neither country may pollute boundary waters to the injury of health or property on the other side.',
    citation: 'Treaty Relating to Boundary Waters, Jan 11 1909',
  },
  echo_program: {
    name: 'ECHO Voluntary Vessel Slowdown',
    parties: ['VFPA', 'shipping_industry', 'NOAA'],
    governs: 'Vessel speed reduction in SRKW critical habitat (Haro Strait)',
    modelVariables: ['vesselSpeedZone', 'underwaterNoise'],
    enforcement: 'Voluntary — ~85% compliance (VFPA ECHO 2024)',
    constraints: 'VOLUNTARY precisely because mandatory slowdown in international strait would face UNCLOS transit passage challenge. Legal uncertainty is why it remains voluntary.',
    citation: 'VFPA ECHO Program Annual Reports',
  },
  unclos_transit_passage: {
    name: 'UNCLOS Part III — Transit Passage',
    parties: ['US (non-party but accepts customary)', 'Canada'],
    governs: 'Right of transit through international straits',
    modelVariables: ['canRestrictTraffic'],
    enforcement: 'International Tribunal for the Law of the Sea (ITLOS)',
    constraints: 'Ships in transit passage shall not be impeded. Coastal states may regulate pollution and navigation safety but cannot suspend transit. This limits ability to ban tankers from JdF for environmental protection.',
    citation: 'UNCLOS Articles 37-44, ICJ Corfu Channel case 1949',
  },
};

// ── REGULATORY COST ASYMMETRIES ──
// Different regulations create competitive dynamics between ports
export const REGULATORY_COSTS = {
  nwsa: {
    carbonPricePerTon: 55,        // WA CCA cap-and-trade ~$55/ton (2024)
    carbonCostPerTEU: 8,          // ~0.14 ton CO2/TEU × $55
    shorepower: 'voluntary',
    laborRegime: 'ILWU-US',
    laborCostIndex: 1.00,         // normalized baseline
    environmentalCompliance: 12,  // $/TEU additional environmental costs
    atBerthEmissions: 'CARB-style_pending',
    notes: 'WA CCA + CARB-style at-berth regulation pending',
  },
  vancouver: {
    carbonPricePerTon: 58,        // BC carbon tax $80 CAD × 0.72 CAD/USD ≈ $58 USD
    carbonCostPerTEU: 12,         // higher: BC tax + federal OBPS
    shorepower: 'mandatory_centerm',
    laborRegime: 'ILWU-CA',
    laborCostIndex: 0.85,         // CAD weakness = lower USD labor cost
    environmentalCompliance: 15,  // $/TEU — VFPA environmental programs
    atBerthEmissions: 'shore_power_expansion',
    notes: 'BC carbon tax ($80 CAD/ton) + federal OBPS. Higher carbon cost but labor cheaper in USD.',
  },
  princeRupert: {
    carbonPricePerTon: 58,        // same BC regime
    carbonCostPerTEU: 12,
    laborRegime: 'ILWU-CA',
    laborCostIndex: 0.80,         // lower cost of living
    environmentalCompliance: 10,
    notes: 'Same BC carbon regime. Lower operating costs. NO JdF chokepoint dependency.',
  },
};

// ── POLICY FEASIBILITY ASSESSMENTS ──
// For each proposed policy, rate legal feasibility
export const POLICY_FEASIBILITY = {
  ban_tankers_haro: {
    policy: 'Ban tankers from Haro Strait',
    legalFeasibility: 0.15,
    timeToImplementMonths: 60,
    jurisdictionalComplexity: 5,     // US, Canada, IMO, ITLOS, industry
    tribalConsentRequired: false,
    blockedBy: 'UNCLOS_transit_passage',
    notes: 'Transit passage rights likely prevent unilateral tanker ban. Would require bilateral agreement + possible UNCLOS amendment. TMX Environmental Assessment already approved tanker traffic.',
  },
  mandatory_slowdown_srkw: {
    policy: 'Mandatory vessel slowdown in SRKW critical habitat',
    legalFeasibility: 0.35,
    timeToImplementMonths: 36,
    jurisdictionalComplexity: 4,
    tribalConsentRequired: false,
    blockedBy: 'UNCLOS_transit_passage_partial',
    notes: 'ECHO is voluntary precisely because mandatory faces UNCLOS challenge. Bilateral US-Canada agreement could work but politically difficult. Safety-based argument (whale strikes) may be stronger legal basis than environmental.',
  },
  expand_deltaport_t2: {
    policy: 'Expand Deltaport Terminal 2',
    legalFeasibility: 0.70,
    timeToImplementMonths: 48,
    jurisdictionalComplexity: 3,
    tribalConsentRequired: true,
    notes: 'Canadian federal jurisdiction. Requires Musqueam/Tsawwassen consultation under duty to consult. Environmental assessment. Tsawwassen have modern treaty — consent required.',
  },
  block_cherry_point_coal: {
    policy: 'Block Cherry Point coal terminal (Gateway Pacific)',
    legalFeasibility: 0.95,
    timeToImplementMonths: 0,         // already done (2016)
    jurisdictionalComplexity: 2,
    tribalConsentRequired: true,
    blockedBy: null,
    notes: 'DONE. Lummi treaty rights prevailed 2016. Army Corps denied permit based on treaty fishing impacts to herring spawning. Treaty rights are the most powerful environmental protection tool in the system.',
  },
  shore_power_mandate: {
    policy: 'Mandatory shore power for all vessels at berth',
    legalFeasibility: 0.80,
    timeToImplementMonths: 24,
    jurisdictionalComplexity: 2,
    tribalConsentRequired: false,
    notes: 'Within port authority regulatory power. CARB already does this in California. NWSA and VFPA have authority to mandate.',
  },
  speed_limit_puget_sound: {
    policy: '10-knot speed limit in all Puget Sound',
    legalFeasibility: 0.65,
    timeToImplementMonths: 18,
    jurisdictionalComplexity: 2,
    tribalConsentRequired: false,
    notes: 'US internal waters — full regulatory authority. USCG can implement under safety/environmental authority. Does NOT face UNCLOS transit passage issues (Puget Sound is not an international strait).',
  },
};
