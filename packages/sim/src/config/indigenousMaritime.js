// ═══════════════════════════════════════════════════════════
// INDIGENOUS MARITIME INTERESTS — First Nations & Treaty Tribes
// ═══════════════════════════════════════════════════════════
// Models Indigenous peoples as ACTIVE ECONOMIC AND GOVERNANCE
// PARTICIPANTS in the Salish Sea maritime system.
//
// This is NOT a stakeholder "input" — these are sovereign nations
// with constitutionally protected rights who exercise governance
// authority over waters, fisheries, and development decisions.
//
// Sources:
//   Boldt Decision (US v. Washington, 1974): 50% harvest share
//   Sparrow Decision (R v. Sparrow, 1990): Aboriginal priority access
//   Culverts Case (US v. Washington, 2018): habitat protection duty
//   UNDRIP (2007): free, prior and informed consent
//   Puyallup Tribal Council: terminal MOU March 2025
//   Lummi Nation: Cherry Point Gateway Pacific denial 2016
//   Tsleil-Waututh: Trans Mountain opposition (Federal Court)
//   NWIFC (Northwest Indian Fisheries Commission) — nwifc.org/member-tribes/
//   DFO Aboriginal Fisheries Strategy
//   W'SANEC Leadership Council — wsanec.com
//   Te'mexw Treaty Association — temexw.org
//   Hul'qumi'num Treaty Group — via BC Treaty Commission
//   Douglas Treaties 1850-1854 — Vancouver Island colonial treaties
//   Treaty of Point Elliott 1855 — Gov. Stevens, 10 tribes
//   Treaty of Medicine Creek 1854 — Gov. Stevens, first WA treaty
//   Treaty of Point No Point 1855 — Gov. Stevens, S'Klallam & Skokomish
//   Treaty of Neah Bay 1855 — Gov. Stevens, Makah

export const INDIGENOUS_NATIONS = [
  // ════════════════════════════════════════════════════════
  // US TREATY TRIBES — NWIFC Members (Salish Sea territory)
  // Source: nwifc.org/member-tribes/
  // ════════════════════════════════════════════════════════
  {
    id: 'puyallup', name: 'Puyallup Tribe of Indians',
    territory: 'Commencement Bay, Puyallup River watershed',
    subBasins: ['main_south'],
    treatyBasis: 'Medicine Creek Treaty 1854',
    legalFramework: 'Boldt Decision — 50% harvest share',
    population: 5500,
    fishingFleetSize: 45,
    keySpecies: ['chinook', 'chum', 'pink', 'shellfish'],
    marineAssets: [
      { type: 'terminal', name: 'Puyallup Tribal Terminal', value: 200e6, status: 'under_development',
        notes: 'First tribally-owned terminal at a major US port (NWSA MOU March 2025). East Blair Waterway, 120+ acres.' },
    ],
    environmentalConcerns: ['asarco_contamination', 'commencement_bay_superfund', 'salmon_habitat'],
    governanceRole: 'co-management',
    relationshipToPorts: 'direct_partner',
    vetoPower: [],
    keyStory: 'Transitioning from contamination victim to maritime economic powerhouse — the Puyallup Tribal Terminal is the first tribally-owned facility at a major US port.',
  },
  {
    id: 'tulalip', name: 'Tulalip Tribes',
    territory: 'Tulalip Bay, Snohomish estuary, Possession Sound',
    subBasins: ['whidbey_south'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 5000,
    fishingFleetSize: 35,
    keySpecies: ['chinook', 'coho', 'shellfish', 'herring'],
    governanceRole: 'co-management',
    relationshipToPorts: 'affected_community',
    keyStory: 'Quil Ceda Village — tribally-owned commerce zone generating $1B+ in annual sales, demonstrating economic sovereignty.',
  },
  {
    id: 'swinomish', name: 'Swinomish Indian Tribal Community',
    territory: 'Swinomish Channel, Padilla Bay, Skagit Delta',
    subBasins: ['whidbey_north'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 1000,
    fishingFleetSize: 20,
    keySpecies: ['chinook', 'herring', 'shellfish', 'crab'],
    environmentalConcerns: ['march_point_refineries', 'oil_spill_risk', 'sea_level_rise'],
    governanceRole: 'co-management',
    keyStory: 'One of first tribes to develop a comprehensive climate adaptation plan (2010). Village is at sea level — directly threatened by SLR.',
  },
  {
    id: 'lummi', name: 'Lummi Nation',
    territory: 'Bellingham Bay, Lummi Island, Cherry Point, San Juan waters',
    subBasins: ['georgia_south', 'sj_haro'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 5500,
    fishingFleetSize: 120, // largest fishing fleet of any WA tribe
    keySpecies: ['chinook', 'sockeye', 'herring', 'crab', 'shellfish'],
    governanceRole: 'co-management',
    relationshipToPorts: 'opposition',
    vetoPower: ['cherry_point_coal'],
    keyStory: 'Successfully blocked Cherry Point coal terminal (Gateway Pacific, 2016) using treaty fishing rights — the terminal would have disrupted herring spawning grounds. Largest tribal fishing fleet in WA.',
  },
  {
    id: 'muckleshoot', name: 'Muckleshoot Indian Tribe',
    territory: 'Duwamish/Green River watershed, Elliott Bay',
    subBasins: ['main_north'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 3000,
    fishingFleetSize: 15,
    keySpecies: ['chinook', 'coho', 'steelhead'],
    environmentalConcerns: ['duwamish_superfund', 'pcb_contamination'],
    governanceRole: 'co-management',
    keyStory: 'Exercise treaty fishing rights in the Duwamish Waterway — one of the most contaminated waterways in WA (EPA Superfund). Fish consumption advisories directly affect tribal diet and cultural practices.',
  },
  {
    id: 'nisqually', name: 'Nisqually Indian Tribe',
    territory: 'Nisqually River, Nisqually Delta, South Sound',
    subBasins: ['ssound_north'],
    treatyBasis: 'Medicine Creek Treaty 1854',
    legalFramework: 'Boldt Decision',
    population: 800,
    fishingFleetSize: 25,
    keySpecies: ['chinook', 'coho', 'chum', 'steelhead'],
    governanceRole: 'co-management',
    keyStory: 'Billy Frank Jr. (Nisqually) was the central figure in the fishing rights movement leading to the Boldt Decision. The Nisqually Delta restoration is the MODEL for what should happen across Puget Sound.',
  },
  {
    id: 'skokomish', name: 'Skokomish Indian Tribe',
    territory: 'Hood Canal, Skokomish River',
    subBasins: ['hood_south'],
    treatyBasis: 'Point No Point Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 900,
    fishingFleetSize: 15,
    keySpecies: ['chinook', 'chum', 'shellfish'],
    environmentalConcerns: ['hood_canal_hypoxia', 'cushman_dam'],
    governanceRole: 'co-management',
    keyStory: 'Hood Canal hypoxia directly kills fish in Skokomish treaty waters. The stateful sediment model predicts decades of recovery — with direct treaty rights implications.',
  },
  {
    id: 'makah', name: 'Makah Tribe',
    territory: 'Cape Flattery, Neah Bay, western Strait of Juan de Fuca',
    subBasins: ['jdf_west'],
    treatyBasis: 'Treaty of Neah Bay 1855',
    legalFramework: 'Boldt Decision + unique whale hunting rights (IWC)',
    population: 2800,
    fishingFleetSize: 60,
    keySpecies: ['chinook', 'halibut', 'crab', 'whale'],
    governanceRole: 'co-management',
    keyStory: 'Only US tribe with treaty right to whale. Cape Flattery is the most oceanic point in the Salish Sea system.',
  },
  // ── S'Klallam Nations (3 separate sovereigns, Point No Point Treaty 1855) ──
  // Previously bundled — split because each is a distinct federally recognized tribe
  // with its own reservation, governance, and sub-basin presence.
  // Source: Point No Point Treaty Council (shared fisheries management)
  {
    id: 'lower_elwha_klallam', name: 'Lower Elwha Klallam Tribe',
    territory: 'Elwha River, central Strait of Juan de Fuca',
    subBasins: ['jdf_central'],
    treatyBasis: 'Point No Point Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 985,
    fishingFleetSize: 15,
    keySpecies: ['chinook', 'coho', 'steelhead', 'shellfish'],
    governanceRole: 'co-management',
    // Source: elwha.org, NPS Elwha River Restoration
    keyStory: 'Elwha Dam removal (2011-2014) — largest dam removal in US history. THE success story for habitat restoration. Chinook are returning to 70+ miles of river for the first time in a century.',
  },
  {
    id: 'jamestown_sklallam', name: "Jamestown S'Klallam Tribe",
    territory: 'Sequim Bay, Dungeness River, eastern Strait of Juan de Fuca',
    subBasins: ['jdf_central', 'jdf_east'],
    treatyBasis: 'Point No Point Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 594,
    fishingFleetSize: 10,
    keySpecies: ['chinook', 'coho', 'shellfish', 'crab'],
    governanceRole: 'co-management',
    // Source: jamestowntribe.org
    keyStory: 'Self-sufficient since the 1870s — ancestors purchased their own townsite rather than accept a reservation. Now a leader in shellfish aquaculture and habitat restoration on Dungeness River.',
  },
  {
    id: 'port_gamble_sklallam', name: "Port Gamble S'Klallam Tribe",
    territory: 'Port Gamble Bay, northern Kitsap Peninsula, Hood Canal',
    subBasins: ['hood_north'],
    treatyBasis: 'Point No Point Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 950,
    fishingFleetSize: 15,
    keySpecies: ['chinook', 'coho', 'shellfish', 'herring'],
    environmentalConcerns: ['port_gamble_bay_contamination', 'timber_mill_legacy'],
    governanceRole: 'co-management',
    // Source: pgst.nsn.us, Point No Point Treaty Council
    keyStory: 'Port Gamble Bay was a major Pope Resources timber mill site — now a contaminated cleanup area. The tribe leads shellfish aquaculture and restoration, and co-manages fisheries through the Point No Point Treaty Council.',
  },
  // ── Additional NWIFC Member Tribes ──
  // Source: nwifc.org/member-tribes/, individual tribal government websites
  {
    id: 'suquamish', name: 'Suquamish Tribe',
    territory: 'Port Madison, Kitsap Peninsula, Agate Passage, Bainbridge Island waters',
    subBasins: ['main_central', 'hood_north'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 950,
    fishingFleetSize: 20,
    keySpecies: ['chinook', 'coho', 'shellfish', 'herring', 'crab'],
    governanceRole: 'co-management',
    // Source: suquamish.nsn.us, EPA 2014 tribal fish consumption survey
    keyStory: 'Homeland of Chief Si\'ahl (Seattle), for whom the city is named. Their fish consumption survey (175 g/day) is the basis for EPA tribal exposure rates — 10x the general population.',
  },
  {
    id: 'nooksack', name: 'Nooksack Indian Tribe',
    territory: 'Nooksack River valley, foothills of Mt. Baker',
    subBasins: ['georgia_south'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 2000,
    fishingFleetSize: 25,
    keySpecies: ['chinook', 'coho', 'steelhead', 'chum'],
    environmentalConcerns: ['nooksack_water_rights', 'agricultural_withdrawals', 'chinook_recovery'],
    governanceRole: 'co-management',
    // Source: nooksacktribe.org, NWIFC State of Our Watersheds 2020
    keyStory: 'Nooksack River water rights are among the most contested in WA — the tribe fights for minimum instream flows against agricultural withdrawals to protect critically endangered Chinook.',
  },
  {
    id: 'squaxin_island', name: 'Squaxin Island Tribe',
    territory: 'Squaxin Island, seven inlets of South Sound (Eld, Totten, Hammersley, Oakland, Budd, Henderson, Case)',
    subBasins: ['ssound_south'],
    treatyBasis: 'Medicine Creek Treaty 1854',
    legalFramework: 'Boldt Decision',
    population: 1000,
    fishingFleetSize: 20,
    keySpecies: ['shellfish', 'salmon', 'herring', 'geoduck'],
    governanceRole: 'co-management',
    // Source: squaxinisland.org, Medicine Creek Treaty signed Dec 26, 1854
    keyStory: '"People of the Water" — their territory encompasses 7 of the southernmost inlets of Puget Sound. Among the most successful shellfish aquaculture operations in the region. Medicine Creek was the first treaty signed in Washington Territory.',
  },
  {
    id: 'stillaguamish', name: 'Stillaguamish Tribe of Indians',
    territory: 'Stillaguamish River, North Fork and South Fork, Port Susan',
    subBasins: ['whidbey_north'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 300,
    fishingFleetSize: 10,
    keySpecies: ['chinook', 'coho', 'steelhead', 'chum'],
    environmentalConcerns: ['oso_landslide_legacy', 'chinook_endangered'],
    governanceRole: 'co-management',
    // Source: stillaguamish.com, federally recognized 1976
    keyStory: '2014 Oso landslide killed 43 people on the Stillaguamish River — the deadliest landslide in US history. The tribe lost traditional fishing sites and manages one of the most endangered Chinook stocks in Puget Sound.',
  },
  {
    id: 'upper_skagit', name: 'Upper Skagit Indian Tribe',
    territory: 'Upper Skagit River, Skagit County',
    subBasins: ['whidbey_north'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 300,
    fishingFleetSize: 10,
    keySpecies: ['chinook', 'coho', 'steelhead', 'chum'],
    governanceRole: 'co-management',
    // Source: upperskagittribe-nsn.gov, Skagit River System Cooperative
    keyStory: 'Successor-in-interest to approximately 11 historic bands along the Skagit River. Despite small enrolled population, holds treaty rights to one of the most productive salmon rivers in Puget Sound.',
  },
  {
    id: 'sauk_suiattle', name: 'Sauk-Suiattle Indian Tribe',
    territory: 'Sauk River, Suiattle River, upper Skagit tributaries',
    subBasins: ['whidbey_north'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 350,
    fishingFleetSize: 5,
    keySpecies: ['chinook', 'coho', 'steelhead', 'bull_trout'],
    governanceRole: 'co-management',
    // Source: sauk-suiattle.com, NWIFC, Skagit River System Cooperative
    keyStory: 'Population crashed to just 18 individuals by 1924 — one of the most dramatic demographic recoveries of any tribe. Glacier-fed headwaters of the Skagit are among the most pristine in the system.',
  },
  {
    id: 'samish', name: 'Samish Indian Nation',
    territory: 'Samish Island, Guemes Channel, Padilla Bay, San Juan Islands',
    subBasins: ['sj_rosario', 'whidbey_north'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 1800,
    fishingFleetSize: 15,
    keySpecies: ['salmon', 'crab', 'shellfish', 'herring'],
    governanceRole: 'co-management',
    // Source: samishtribe.nsn.us, federal recognition restored 1996
    // Cascadia Daily News 2026-03-07: "Error left Samish tribe forgotten for decades"
    keyStory: 'A clerical error in 1969 dropped them from the federal recognition list. They spent nearly 30 years fighting to be restored (1996). Major traditional territory in the San Juan Islands.',
  },
  {
    id: 'snoqualmie', name: 'Snoqualmie Indian Tribe',
    territory: 'Snoqualmie River, Snoqualmie Falls (sacred site), Tolt River',
    subBasins: ['main_north'],
    treatyBasis: 'Point Elliott Treaty 1855',
    legalFramework: 'Boldt Decision',
    population: 650,
    fishingFleetSize: 5,
    keySpecies: ['chinook', 'coho', 'steelhead'],
    governanceRole: 'co-management',
    // Source: snoqualmietribe.us, federally recognized 1999
    keyStory: 'Snoqualmie Falls is among the most sacred sites in Coast Salish culture. Federally recognized only in 1999, they have no reservation and are fighting for treaty fishing rights at usual and accustomed grounds.',
  },
  {
    id: 'chehalis', name: 'Confederated Tribes of the Chehalis Reservation',
    territory: 'Chehalis River, Black River, upper Grays Harbor watershed',
    subBasins: ['ssound_south'],
    treatyBasis: 'No treaty — refused relocation terms 1855; reservation by executive order 1864',
    legalFramework: 'Boldt Decision — fishing rights affirmed despite no treaty',
    population: 800,
    fishingFleetSize: 15,
    keySpecies: ['chinook', 'coho', 'chum', 'steelhead'],
    governanceRole: 'co-management',
    // Source: chehalistribe.org, NWIFC member
    keyStory: 'Rejected Governor Stevens\' treaty in 1855 because they refused relocation. Their fishing rights were later affirmed under the Boldt Decision — sovereignty without a treaty. The Chehalis River basin drains to Grays Harbor, peripheral to the Salish Sea.',
  },
  // ── Duwamish — NOT federally recognized ──
  // Included for environmental justice representation (Duwamish Superfund site)
  // and historical significance. They do NOT have Boldt co-management rights.
  // Source: duwamishtribe.org, federal court ordered DOI reconsideration Jan 2025
  {
    id: 'duwamish', name: 'Duwamish Tribal Organization',
    territory: 'Duwamish River, Elliott Bay, Green River, Lake Washington — the heart of Seattle',
    subBasins: ['main_north'],
    treatyBasis: 'Point Elliott Treaty 1855 (Chief Si\'ahl signatory — but tribe NOT federally recognized)',
    legalFramework: 'No federal recognition — no treaty fishing rights. DOI reconsideration ordered Jan 2025.',
    population: 600,
    fishingFleetSize: 0, // no treaty fishing rights without recognition
    keySpecies: ['chinook', 'coho', 'steelhead'],
    governanceRole: 'none',
    environmentalConcerns: ['duwamish_superfund', 'pcb_contamination', 'federal_recognition'],
    keyStory: 'The most prominent unrecognized tribe in America. Chief Si\'ahl signed the Point Elliott Treaty, but the Duwamish were directed to other reservations. The city named after their chief has never formally recognized them. They operate the Duwamish Longhouse on the Superfund site.',
  },

  // ════════════════════════════════════════════════════════
  // CANADIAN FIRST NATIONS — BC Salish Sea Territory
  // Sources: BCAFN (bcafn.ca), individual nation websites,
  // BC Treaty Commission (bctreaty.ca), Douglas Treaties
  // ════════════════════════════════════════════════════════
  {
    id: 'musqueam', name: 'Musqueam (x\u02B7m\u0259\u03B8k\u02B7\u0259y\u0313\u0259m)',
    territory: 'Fraser River mouth, Roberts Bank, YVR area',
    subBasins: ['georgia_central'],
    treatyBasis: 'No treaty — unceded territory',
    legalFramework: 'Sparrow Decision (1990) — Aboriginal fishing rights foundational case',
    population: 1400,
    fishingFleetSize: 40,
    keySpecies: ['sockeye', 'chinook', 'pink', 'chum', 'eulachon'],
    governanceRole: 'consultation_required',
    vetoPower: ['deltaport_t2_conditions'],
    keyStory: 'Musqueam vs The Queen (1990, "Sparrow Decision") established that Aboriginal fishing rights cannot be extinguished without explicit government intent. Their territory includes ALL of the Fraser River mouth, Deltaport, and the airport.',
  },
  {
    id: 'tsawwassen', name: 'Tsawwassen First Nation',
    territory: 'Tsawwassen, Roberts Bank, adjacent to Deltaport',
    subBasins: ['georgia_south'],
    treatyBasis: 'Modern treaty (2009 — BC Treaty Process)',
    legalFramework: 'Treaty rights + self-governance',
    population: 500,
    fishingFleetSize: 10,
    keySpecies: ['crab', 'salmon'],
    governanceRole: 'consent_required',
    keyStory: 'One of first modern treaties in BC. Negotiated land for economic development directly beside the port — both rights holder AND development partner.',
  },
  {
    id: 'tsleil_waututh', name: 'Tsleil-Waututh Nation',
    territory: 'Burrard Inlet (Indian Arm to First Narrows)',
    subBasins: ['georgia_central'],
    treatyBasis: 'No treaty — unceded territory',
    legalFramework: 'Aboriginal title + duty to consult/accommodate',
    population: 600,
    fishingFleetSize: 5,
    keySpecies: ['salmon', 'herring', 'shellfish'],
    environmentalConcerns: ['trans_mountain_tankers', 'oil_spill_risk'],
    governanceRole: 'consultation_required',
    vetoPower: ['trans_mountain_conditions'],
    keyStory: 'Led opposition to Trans Mountain Pipeline expansion — 34 tankers/month through their waters poses unacceptable spill risk. Conduct independent environmental monitoring of Burrard Inlet (Sacred Trust Initiative).',
  },
  {
    id: 'squamish', name: 'Squamish Nation (S\u1E35wx\u0331w\u00FA7mesh)',
    territory: 'Burrard Inlet (shared), Howe Sound, Squamish River',
    subBasins: ['georgia_central'],
    treatyBasis: 'No treaty — unceded territory',
    legalFramework: 'Aboriginal title',
    population: 4000,
    fishingFleetSize: 15,
    keySpecies: ['salmon', 'herring'],
    governanceRole: 'consultation_required',
    keyStory: 'Major economic development on former industrial waterfront in Vancouver. Also opposed Trans Mountain expansion.',
  },
  {
    id: 'stolo', name: 'St\u00F3:l\u014D Nation (Fraser Valley collective)',
    territory: 'Fraser River canyon and valley',
    subBasins: ['georgia_central'],
    treatyBasis: 'No treaty — unceded territory',
    legalFramework: 'Aboriginal rights (Section 35)',
    population: 30000,
    fishingFleetSize: 200,
    keySpecies: ['sockeye', 'chinook', 'pink', 'chum', 'sturgeon'],
    governanceRole: 'consultation_required',
    keyStory: 'Big Bar landslide (2019) blocked their fishing grounds. DFO spent $60M+ on remediation. Their fishery is directly modeled in our Fraser module.',
  },
  {
    id: 'cowichan', name: 'Cowichan Tribes (Quw\'utsun)',
    territory: 'Cowichan River, Cowichan Bay, southeastern Vancouver Island',
    subBasins: ['georgia_central'],
    treatyBasis: 'Douglas Treaties 1850s',
    legalFramework: 'Aboriginal rights + Douglas Treaty fishing rights',
    population: 5000,
    fishingFleetSize: 25,
    keySpecies: ['chinook', 'coho', 'chum'],
    environmentalConcerns: ['cowichan_river_low_flows', 'water_temperature'],
    governanceRole: 'co-management',
    keyStory: 'Largest First Nation in BC. Cowichan River has chronically low summer flows threatening salmon. Climate change makes this worse.',
  },
  // ── Additional BC First Nations with Salish Sea territory ──
  {
    id: 'semiahmoo', name: 'Semiahmoo First Nation',
    territory: 'Semiahmoo Bay, Boundary Bay, White Rock / Peace Arch border area',
    subBasins: ['georgia_south'],
    treatyBasis: 'No treaty — unceded territory',
    legalFramework: 'Aboriginal rights (Section 35)',
    population: 100, // one of the smallest First Nations in BC
    fishingFleetSize: 5,
    keySpecies: ['salmon', 'shellfish', 'herring'],
    governanceRole: 'consultation_required',
    // Source: Semiahmoo First Nation, North Straits Salish language group
    keyStory: 'A trans-boundary nation straddling the Canada-US border, closely connected to Lummi and Nooksack. Historically major reef-net fishers in Boundary Bay. Devastated by smallpox — from 300 in 1790 to a fraction.',
  },
  {
    id: 'wsanec', name: "W\u0313S\u00C1NE\u0106 (Saanich Nations)",
    territory: 'Saanich Peninsula, Saanich Inlet, Gulf Islands, San Juan Islands',
    subBasins: ['georgia_central', 'sj_haro'],
    treatyBasis: 'Douglas Treaty at Saanich 1852 (partial)',
    legalFramework: 'Aboriginal rights + Douglas Treaty fishing rights',
    population: 2800, // combined: Tsartlip ~1068, Tsawout ~895, Tseycum ~200, Pauquachin ~373, Malahat ~360
    fishingFleetSize: 30,
    keySpecies: ['salmon', 'herring', 'shellfish', 'reef_net'],
    governanceRole: 'consultation_required',
    // Source: wsanec.com (W'SANEC Leadership Council)
    // 5 nations: Tsartlip (W'JOLELP), Tsawout (STAUTW'), Tseycum, Pauquachin, Malahat
    keyStory: 'Five nations (Tsartlip, Tsawout, Tseycum, Pauquachin, Malahat) governing through W\u0313S\u00C1NE\u0106 Leadership Council. Traditional reef-net fishing across Gulf/San Juan Islands is a culturally defining practice. Douglas Treaty at Saanich (1852) is one of the earliest treaties on Vancouver Island.',
  },
  {
    id: 'songhees', name: 'Songhees Nation (Lekwungen)',
    territory: 'Victoria Inner Harbour, Cadboro Bay, southeastern Vancouver Island',
    subBasins: ['jdf_east'],
    treatyBasis: 'Douglas Treaty at Victoria 1850',
    legalFramework: 'Aboriginal rights + Douglas Treaty rights',
    population: 600,
    fishingFleetSize: 10,
    keySpecies: ['salmon', 'herring', 'shellfish'],
    governanceRole: 'consultation_required',
    // Source: songheesnation.ca, Te'mexw Treaty Association (temexw.org)
    keyStory: 'Lekwungen host nation of the BC capital, Victoria. Their village was forcibly relocated from Victoria\'s Inner Harbour in 1911. Now developing major waterfront economic projects on reserve lands adjacent to downtown.',
  },
  {
    id: 'esquimalt', name: 'Esquimalt Nation (Lekwungen)',
    territory: 'Esquimalt Harbour, CFB Esquimalt (Canadian Pacific naval headquarters)',
    subBasins: ['jdf_east'],
    treatyBasis: 'Douglas Treaty at Kosampsom 1850',
    legalFramework: 'Aboriginal rights + Douglas Treaty rights',
    population: 300,
    fishingFleetSize: 5,
    keySpecies: ['salmon', 'herring', 'shellfish'],
    governanceRole: 'consultation_required',
    // Source: bcafn.ca/first-nations-bc/esquimalt-nation, Te'mexw Treaty Association
    keyStory: 'CFB Esquimalt — Canada\'s Pacific naval headquarters — sits on unceded Esquimalt territory. This creates a unique sovereignty tension directly relevant to naval operations and maritime security in the model.',
  },
  {
    id: 'snuneymuxw', name: 'Snuneymuxw First Nation',
    territory: 'Nanaimo, Gabriola Island, Nanaimo River watershed',
    subBasins: ['georgia_central'],
    treatyBasis: 'Douglas Treaty at Nanaimo 1854 (coal mining rights only)',
    legalFramework: 'Aboriginal rights (Section 35)',
    population: 1700,
    fishingFleetSize: 15,
    keySpecies: ['salmon', 'herring', 'shellfish', 'clams'],
    governanceRole: 'consultation_required',
    // Source: snuneymuxw.ca, Hul'qumi'num Treaty Group, BC Treaty Commission
    keyStory: '"Snuneymuxw" is the original name for the Nanaimo area. Their territory includes Nanaimo Harbour, one of the busiest ferry terminals in BC (Departure Bay). Nanaimo was built on their coal resources. Member of Hul\'qumi\'num Treaty Group.',
  },
  {
    id: 'penelakut', name: 'Penelakut Tribe',
    territory: 'Penelakut Island (formerly Kuper Island), Tent Island, southern Gulf Islands',
    subBasins: ['georgia_central', 'sj_haro'],
    treatyBasis: 'No treaty — unceded territory',
    legalFramework: 'Aboriginal rights (Section 35)',
    population: 1000,
    fishingFleetSize: 10,
    keySpecies: ['salmon', 'shellfish', 'reef_net'],
    governanceRole: 'consultation_required',
    // Source: penelakut.ca, Hul'qumi'num Treaty Group
    keyStory: 'Kuper Island residential school, on their island, was one of the most notorious in BC — a site of significant trauma and unmarked graves. The island was renamed to Penelakut Island. Member of Hul\'qumi\'num Treaty Group.',
  },
  {
    id: 'stzuminus', name: "Stz'uminus First Nation",
    territory: 'Ladysmith Harbour, Chemainus area, eastern Vancouver Island coast',
    subBasins: ['georgia_central'],
    treatyBasis: 'No treaty — unceded territory',
    legalFramework: 'Aboriginal rights (Section 35)',
    population: 1400,
    fishingFleetSize: 10,
    keySpecies: ['salmon', 'shellfish', 'herring'],
    governanceRole: 'consultation_required',
    // Source: bcafn.ca/first-nations-bc/vancouver-island-coast/stzuminus-first-nation
    // Reconciliation agreement with BC signed 2022
    keyStory: '"Stz\'uminus" is the original name for Chemainus. Signed a reconciliation agreement with BC in 2022. Their territory borders the Strait of Georgia and Ladysmith Harbour. Member of Hul\'qumi\'num Treaty Group.',
  },
];

// Summary statistics — computed dynamically from INDIGENOUS_NATIONS array
export const INDIGENOUS_SUMMARY = {
  totalNations: INDIGENOUS_NATIONS.length,
  usTribes: INDIGENOUS_NATIONS.filter(n => n.legalFramework && n.legalFramework.includes('Boldt')).length,
  bcFirstNations: INDIGENOUS_NATIONS.filter(n => n.treatyBasis && (n.treatyBasis.includes('unceded') || n.treatyBasis.includes('Douglas') || n.treatyBasis.includes('Modern') || n.treatyBasis.includes('Saanich') || n.treatyBasis.includes('Kosampsom') || n.treatyBasis.includes('Victoria') || n.treatyBasis.includes('Nanaimo'))).length,
  totalPopulation: INDIGENOUS_NATIONS.reduce((s, n) => s + (n.population || 0), 0),
  totalFishingVessels: INDIGENOUS_NATIONS.reduce((s, n) => s + (n.fishingFleetSize || 0), 0),
  nationsWithVetoPower: INDIGENOUS_NATIONS.filter(n => n.vetoPower && n.vetoPower.length > 0).length,
};

// Fish consumption rates — EPA 2014: tribal rates 6-10x general population
export const TRIBAL_CONSUMPTION_RATES = {
  generalPopulation: 17.5,  // g/day — EPA 2011 Exposure Factors Handbook
  tribalAverage: 113,       // g/day — EPA 2014 tribal consumption survey (6.5x)
  highConsumption: 175,     // g/day — Tulalip/Suquamish survey (10x)
  units: 'grams of fish per day',
  source: 'EPA 2014 Estimated Fish Consumption Rates for Tribal Populations',
};
