// ═══════════════════════════════════════════════════════════
// REFERENCE INDEX — Comprehensive citation database
// ═══════════════════════════════════════════════════════════
// Auto-aggregates every citation from parameter registries, calibration
// targets, and engine constants into a searchable index.
//
// Usage:
//   searchReferences("Veirs") → all citations mentioning Veirs
//   getReferencesForParam("orcaNoiseThreshold") → citations for that param
//   CITATION_STATS → { peerReviewed: N, governmentAgency: N, ... }

// Import all parameter registries
import { SPECIES_PARAMS } from './speciesParams.js';
import { FRASER_PARAMS } from './fraserParams.js';
import { CLIMATE_PARAMS } from './climateParams.js';
import { PACIFIC_PARAMS } from './pacificParams.js';
import { BIOGEOCHEM_PARAMS } from './biogeochemParams.js';
import { PS_WATERSHED_PARAMS } from './psWatershedParams.js';
import { NEARSHORE_PARAMS } from './nearshoreParams.js';
import { FISHERIES_PARAMS } from './fisheriesParams.js';
import { TRIBAL_PARAMS } from './tribalParams.js';
import { PUBLIC_HEALTH_PARAMS } from './publicHealthParams.js';
import { INFRASTRUCTURE_PARAMS } from './infrastructureParams.js';
import { CALIBRATION_TARGETS } from './calibrationTargets.js';

// ── Registry map ──
const REGISTRIES = {
  species: { data: SPECIES_PARAMS, module: 'ecosystem' },
  fraser: { data: FRASER_PARAMS, module: 'fraser' },
  climate: { data: CLIMATE_PARAMS, module: 'climate' },
  pacific: { data: PACIFIC_PARAMS, module: 'pacific' },
  biogeochem: { data: BIOGEOCHEM_PARAMS, module: 'biogeochem' },
  psWatersheds: { data: PS_WATERSHED_PARAMS, module: 'psWatersheds' },
  nearshore: { data: NEARSHORE_PARAMS, module: 'nearshore' },
  fisheries: { data: FISHERIES_PARAMS, module: 'fisheries' },
  tribal: { data: TRIBAL_PARAMS, module: 'tribal' },
  publicHealth: { data: PUBLIC_HEALTH_PARAMS, module: 'publicHealth' },
  infrastructure: { data: INFRASTRUCTURE_PARAMS, module: 'infrastructure' },
};

// ── Engine constant citations (compiled from audit) ──
const ENGINE_CITATIONS = [
  // computePort.js
  { source: 'NWSA 2023 Annual Report', module: 'port', category: 'government-agency' },
  { source: 'Port of Vancouver 2023 Statistics', module: 'port', category: 'government-agency' },
  { source: 'Martin Associates 2018 Port Economic Impact Study', module: 'port', category: 'government-agency' },
  { source: 'Veirs et al. 2016 — ship noise in Haro Strait (PeerJ 4:e1657)', module: 'port', category: 'peer-reviewed' },
  { source: 'MacGillivray et al. 2019 — ECHO program Vancouver', module: 'port', category: 'peer-reviewed' },
  { source: 'IMO 4th GHG Study 2020', module: 'port', category: 'government-agency' },
  { source: 'EPA AP-42 vessel emission factors', module: 'port', category: 'government-agency' },
  { source: 'CLIA 2023 Cruise Industry Report', module: 'port', category: 'government-agency' },
  { source: 'WSF 2023 Annual Report', module: 'port', category: 'government-agency' },
  { source: 'NOAA OR&R spill incident data', module: 'port', category: 'government-agency' },
  { source: 'Smithsonian SERC ballast water studies', module: 'port', category: 'peer-reviewed' },
  // computeUrban.js
  { source: 'WA OFM 2024 population forecast', module: 'urban', category: 'government-agency' },
  { source: 'EPA Clean Watersheds Needs Survey 2022', module: 'urban', category: 'government-agency' },
  { source: 'CDC Social Vulnerability Index methodology', module: 'urban', category: 'government-agency' },
  { source: 'WA DOH Environmental Health Disparities Map v2.0 (Min et al. 2019)', module: 'urban', category: 'peer-reviewed' },
  { source: 'King County CSO Control Plan', module: 'urban', category: 'government-agency' },
  { source: 'Schueler 2003 — urban watershed imperviousness', module: 'urban', category: 'peer-reviewed' },
  { source: 'PSCAA 2022 emission inventory', module: 'urban', category: 'government-agency' },
  // FRED housing-and-rates wiring pre-reg §4 citations (added 2026-04-25; macro-economic inputs
  // to developmentPressure / housingPressure at macroEconomy.js:81, :86)
  { source: 'HOUST 2025 — New Privately-Owned Housing Units Started: Total Units (FRED). U.S. Census Bureau and U.S. Department of Housing and Urban Development. https://fred.stlouisfed.org/series/HOUST', module: 'urban', category: 'government-agency' },
  { source: 'MORTGAGE30US 2025 — 30-Year Fixed Rate Mortgage Average in the United States (FRED, Freddie Mac). https://fred.stlouisfed.org/series/MORTGAGE30US. Methodology change 2022-11-17: pre-change Primary Mortgage Market Survey lender survey; post-change Loan Product Advisor application data. FRED treats series as continuous; hindcast accepts continuity as a known data-source caveat.', module: 'urban', category: 'government-agency' },
  // computeNearshore.js
  { source: 'Beamer et al. 2005 — pocket estuaries for juvenile Chinook', module: 'nearshore', category: 'peer-reviewed' },
  { source: 'Thom et al. 2014, 2018 — eelgrass and salt marsh', module: 'nearshore', category: 'peer-reviewed' },
  { source: 'Penttila 2007 — forage fish spawning beach surveys', module: 'nearshore', category: 'peer-reviewed' },
  { source: 'Berry et al. 2021 — WA DNR Kelp Recovery Plan', module: 'nearshore', category: 'government-agency' },
  { source: 'Shipman 2010 — Puget Sound coastal geomorphology', module: 'nearshore', category: 'peer-reviewed' },
  { source: 'Schlenger et al. 2011 — PSNERP nearshore assessment', module: 'nearshore', category: 'government-agency' },
  { source: 'Dethier et al. 2016 — beach armoring effects', module: 'nearshore', category: 'peer-reviewed' },
  // Track A pre-reg §4 citation set (added 2026-04-25, hero-cascade link 3 armor → eelgrass coupling)
  { source: 'Thom et al. 2011 — Eelgrass (Zostera marina L.) stressors in Puget Sound (PNNL/WA DNR synthesis)', module: 'nearshore', category: 'grey-literature' },
  { source: 'Short & Neckles 1999 — global climate change effects on seagrasses (coastal squeeze framing). Aquatic Botany 63:169-196', module: 'nearshore', category: 'peer-reviewed' },
  { source: 'Estes et al. 2016 — trophic cascades', module: 'nearshore', category: 'peer-reviewed' },
  { source: 'West et al. 2017 — PS contaminant loading', module: 'nearshore', category: 'peer-reviewed' },
  // computeClimate.js
  { source: 'Cai et al. 2014 — ENSO amplitude under warming', module: 'climate', category: 'peer-reviewed' },
  { source: 'Mass 2008 — The Weather of the Pacific Northwest', module: 'climate', category: 'peer-reviewed' },
  { source: 'Ralph et al. 2019 — atmospheric river scale (BAMS)', module: 'climate', category: 'peer-reviewed' },
  { source: 'Jaffe et al. 2020 — wildfire smoke transport (BAMS)', module: 'climate', category: 'peer-reviewed' },
  { source: 'Johnstone & Dawson 2010 — fog decline (PNAS 107(10):4533-4538)', module: 'climate', category: 'peer-reviewed' },
  // computeWatershed.js
  { source: 'Hock 2003 — degree-day melt factor review (J. Hydrol. 282:104-115)', module: 'watershed', category: 'peer-reviewed' },
  { source: 'Hamlet et al. 2013 — PNW streamflow projections', module: 'watershed', category: 'peer-reviewed' },
  { source: 'Vaccaro et al. 1998 — USGS PS groundwater', module: 'watershed', category: 'government-agency' },
  { source: 'Pelto 2010 — North Cascades Glacier Climate Project', module: 'watershed', category: 'peer-reviewed' },
  { source: 'Brett et al. 2005 — Puget Sound nutrient sources', module: 'watershed', category: 'peer-reviewed' },
  { source: 'Czuba et al. 2011 — Skagit sediment budget', module: 'watershed', category: 'peer-reviewed' },
  // computeEnergy.js
  { source: 'BPA 2023 White Book', module: 'energy', category: 'government-agency' },
  { source: 'NWPCC 2021 Power Plan', module: 'energy', category: 'government-agency' },
  { source: 'EIA-860 generator data', module: 'energy', category: 'government-agency' },
  { source: 'NREL ATB 2023 — capacity factors', module: 'energy', category: 'government-agency' },
  { source: 'WA CETA (RCW 19.405)', module: 'energy', category: 'government-agency' },
  { source: 'IEA Data Centres report 2023', module: 'energy', category: 'government-agency' },
  // computePacific.js
  { source: 'Whitney et al. 2007 — NE Pacific O2 decline', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Crawford & Peña 2013 — shelf O2 decline', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Feely et al. 2008 — ocean acidification (Science 320:1490–1492)', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Feely et al. 2016 — ocean acidification (identity pending Scout #11 resolution per Session 2e §5.2(b))', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Oliver et al. 2018 — MHW frequency (Nature Communications 9:1324)', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Peterson et al. 2014 — copepod indicators (Oceanography 27(4):80–89)', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Peterman & Dorner 2012 — marine survival decline', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Stramma et al. 2008 — expanding OMZ (Science 320:655–658)', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Stramma et al. 2010 — Eastern Pacific OMZ supply paths (J. Geophys. Res. 115:C09011)', module: 'pacific', category: 'peer-reviewed' },
  // computePublicHealth.js
  { source: 'Liu et al. 2015 — wildfire smoke health review', module: 'publicHealth', category: 'peer-reviewed' },
  { source: 'Baker-Austin et al. 2013 — Vibrio and warming', module: 'publicHealth', category: 'peer-reviewed' },
  { source: 'HCUP/AHRQ — ER visit cost data', module: 'publicHealth', category: 'government-agency' },
  // RF models
  { source: 'Connors et al. 2020 — salmon marine survival drivers', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Ruggerone & Irvine 2018 — Alaska hatchery competition', module: 'pacific', category: 'peer-reviewed' },
  { source: 'Trainer et al. 2002, 2012 — HAB species ecology', module: 'marine', category: 'peer-reviewed' },
  // Contaminants — PCB marine mammal toxicity literature (added sub-12F fast-wrap close)
  { source: 'Kannan et al. 2000 — toxicity reference values for PCBs in aquatic mammals (Hum. Ecol. Risk Assess. 6(1):181-201)', module: 'contaminants', category: 'peer-reviewed', doi: '10.1080/10807030091124491' },
  { source: 'Jepson et al. 2016 — PCB pollution in European cetaceans (Scientific Reports 6:18573)', module: 'contaminants', category: 'peer-reviewed', doi: '10.1038/srep18573' },
  // Pacific marine heatwave — Blob literature (added sub-12F fast-wrap close)
  { source: 'Cavole et al. 2016 — Biological impacts of the 2013-2015 Warm-Water Anomaly in the Northeast Pacific (Oceanography 29(2):62-71)', module: 'pacific', category: 'peer-reviewed' },
  // species-data.js
  { source: 'Center for Whale Research 2025 — SRKW census', module: 'ecosystem', category: 'government-agency' },
  { source: 'Quinn 2005 — Behavior and Ecology of Pacific Salmon and Trout (American Fisheries Society / University of Washington Press, ISBN 978-0-295-98457-6)', module: 'ecosystem', category: 'peer-reviewed' },
  { source: 'Ford & Ellis 2006 — SRKW prey selectivity (Mar. Ecol. Prog. Ser. 316:185-199)', module: 'ecosystem', category: 'peer-reviewed' },
  { source: 'Ford et al. 1998 — Dietary specialization in resident/transient killer whales (Can. J. Zool. 76:1456-1471)', module: 'ecosystem', category: 'peer-reviewed' },
  { source: 'Ford et al. 2010 — Chinook salmon predation by resident killer whales (DFO Can. Sci. Advis. Sec. Res. Doc.)', module: 'ecosystem', category: 'government-agency' },
  { source: 'Ford M.J. et al. 2011 — Inferred paternity and male reproductive success in killer whales (J. Hered. 102:537-553)', module: 'ecosystem', category: 'peer-reviewed' },
  { source: 'Hanson et al. 2010 — SRKW prey species identification via fecal DNA (Endang. Species Res. 11:69-82)', module: 'ecosystem', category: 'peer-reviewed' },
  { source: 'Lacy et al. 2017 — SRKW demographics (Sci. Rep. 7:14119)', module: 'ecosystem', category: 'peer-reviewed' },
  { source: 'Ross et al. 2000 — orca PCB burden (Mar. Pollut. Bull. 40(6):504-515)', module: 'ecosystem', category: 'peer-reviewed' },
  { source: 'Krahn et al. 2007 — orca PCB burden (paper identity pending Scout #12 disambiguation)', module: 'ecosystem', category: 'peer-reviewed' },
  { source: 'Mongillo et al. 2016 — SRKW exposure to chemical contaminants (NOAA Tech Memo NMFS-NWFSC-135)', module: 'ecosystem', category: 'government-agency', doi: '10.7289/V5/TM-NWFSC-135' },
  { source: 'Hickie et al. 2007 — maternal PCB offloading in resident killer whales (Environ. Sci. Technol. 41:6613-6619)', module: 'ecosystem', category: 'peer-reviewed', doi: '10.1021/es0702519' },
  // Marine geology, benthic habitats, and forage fish — H. Gary Greene (FHL/Tombolo)
  { source: 'Greene, H.G., Barrie, V. 2011 — Potential Marine Benthic Habitats of the San Juan Archipelago. Geological Survey of Canada Marine Map Series', module: 'ecosystem', category: 'government-agency' },
  { source: 'Greene et al. 2017 — Sand wave field dynamics and habitat, Geosciences 7(4):107', module: 'ecosystem', category: 'peer-reviewed', doi: '10.3390/geosciences7040107' },
  { source: 'Greene, H.G., Baker, M.R., Aschoff, J. 2020 — A Dynamic Bedforms Habitat for the Forage Fish Pacific Sand Lance, San Juan Islands, WA, USA. In: Seafloor Geomorphology as Benthic Habitat, 2nd ed. (Harris, P.T., Baker, E.K., Eds.), Elsevier Science, pp. 267–279', module: 'ecosystem', category: 'book-chapter' },
  { source: 'Baker, M.R., Greene, H.G., Aschoff, J., Aitoro, E., Bates, E., Hesselroth, D., Johnson, K., Mather, B., Sealover, N. 2024 — Atlas of Pacific sand lance (Ammodytes personatus) benthic habitat. Marine Environmental Research 202:106778', module: 'ecosystem', category: 'peer-reviewed', doi: '10.1016/j.marenvres.2024.106778' },
  // Sand lance thermal biology (added Session 2i Chain B Entry 64 sub-ii close)
  { source: 'Horkan, E., Baker, M.R. 2025 — Experimental trials provide insight to climate impacts on condition and over-winter survival in Pacific sand lance, Ammodytes personatus. Behavioural Processes 226:105169', module: 'ecosystem', category: 'peer-reviewed', doi: '10.1016/j.beproc.2025.105169' },
  { source: 'Tomiyama, M., Yanagibashi, S. 2004 — Effect of temperature, age class, and growth on induction of aestivation in Japanese sandeel (Ammodytes personatus) in Ise Bay, central Japan. Fisheries Oceanography 13(2):81-90', module: 'ecosystem', category: 'peer-reviewed', doi: '10.1046/j.1365-2419.2003.00272.x' },
  { source: 'Arimitsu, M.L., Piatt, J.F., Hatch, S., Suryan, R.M., Batten, S., Bishop, M.A., Campbell, R.W., Coletti, H., Cushing, D., Gorman, K., Hopcroft, R.R., Kuletz, K.J., Marsteller, C., McKinstry, C., McGowan, D., Moran, J., Pegau, S., Schaefer, A., Schoen, S., Straley, J., von Biela, V.R. 2021 — Heatwave-induced synchrony within forage fish portfolio disrupts energy flow to top pelagic predators. Global Change Biology 27(9):1859-1878', module: 'ecosystem', category: 'peer-reviewed', doi: '10.1111/gcb.15556' },
  { source: 'Greene, H.G., Aschoff, J. 2023 — Oil spill assessment maps of the central Salish Sea. Continental Shelf Research 253:104880', module: 'contaminants', category: 'peer-reviewed', doi: '10.1016/j.csr.2022.104880' },
  { source: 'Greene, H.G., Barrie, J.V., Todd, B.J. 2018 — The Skipjack Island fault zone: An active transcurrent structure within the upper plate of the Cascadia subduction complex. Sedimentary Geology 378:61–79', module: 'infrastructure', category: 'peer-reviewed', doi: '10.1016/j.sedgeo.2018.05.005' },
  // Skipjack Island Fault rupture-magnitude primary literature (added Session 2i Chain B Entry 68 sub-ii close)
  { source: 'Caston, M. 2021 — Tsunamigenic potential of crustal faults in the southern Strait of Georgia and Boundary Bay. MSc thesis, University of Victoria, 216 pp. Supervisor: Lucinda Leonard. hdl.handle.net/1828/13351', module: 'infrastructure', category: 'grey-literature' },
  { source: 'Nemati, F., Leonard, L., Thomson, R., Lintern, G., Kouhi, S. 2023 — Numerical modeling of a potential landslide-generated tsunami in the southern Strait of Georgia. Natural Hazards 117(2):2029-2054', module: 'infrastructure', category: 'peer-reviewed', doi: '10.1007/s11069-023-05854-w' },
  { source: 'Barrie, J.V., Greene, H.G. 2018 — The Devils Mountain fault zone: An active Cascadia upper plate zone of deformation, Pacific Northwest of North America. Sedimentary Geology 364:228–241', module: 'infrastructure', category: 'peer-reviewed', doi: '10.1016/j.sedgeo.2017.12.018' },
  // Devils Mountain Fault rupture-magnitude primary literature (added Session 2i Chain B Entry 69 sub-ii close)
  { source: 'Washington Department of Natural Resources 2013 — Modeling a Magnitude 7.4 Earthquake on the Western Section of the Darrington-Devils Mountain Fault Zone. Understanding Earthquake Hazards in Washington State series, WA DNR / WA Military Department Emergency Management Division / FEMA, 4 pp.', module: 'infrastructure', category: 'government-agency' },
  { source: 'Johnson, S.Y., Dadisman, S.V., Mosher, D.C., Blakely, R.J., Childs, J.R. 2001 — Active tectonics of the Devils Mountain Fault and related structures, northern Puget Lowland and eastern Strait of Juan de Fuca region, Pacific Northwest. U.S. Geological Survey Professional Paper 1643, 45 p. + 2 plates', module: 'infrastructure', category: 'government-agency', doi: '10.3133/pp1643' },
  // Cascadia megathrust magnitude — added during disasters.js earthquake-range migration (post-audit workstream (e) close)
  { source: 'Satake, K., Wang, K., Atwater, B.F. 2003 — Fault slip and seismic moment of the 1700 Cascadia earthquake inferred from Japanese tsunami descriptions. Journal of Geophysical Research: Solid Earth 108(B11):2535', module: 'infrastructure', category: 'peer-reviewed', doi: '10.1029/2003JB002521' },
  // Puget Sound deep intraslab magnitudes — added during disasters.js earthquake-range migration (post-audit workstream (e) close)
  { source: 'Ichinose, G.A., Thio, H.K., Somerville, P.G. 2004 — Rupture process and near-source shaking of the 1965 Seattle-Tacoma and 2001 Nisqually, intraslab earthquakes. Geophysical Research Letters 31:L10604', module: 'infrastructure', category: 'peer-reviewed', doi: '10.1029/2004GL019668' },
  // Seattle Fault zone rupture magnitudes — added during disasters.js earthquake-range migration (post-audit workstream (e) close)
  { source: 'Styron, R.H., Sherrod, B. 2021 — Improving paleoseismic earthquake magnitude estimates with rupture length information: Application to the Puget Lowland, Washington State, U.S.A. Bulletin of the Seismological Society of America 111(2):1139–1153', module: 'infrastructure', category: 'peer-reviewed', doi: '10.1785/0120200193' },
  { source: 'Greene 2018 — Deep-water urchin observations (Greene submersible observations, 2018 OceanGate/FHL)', module: 'ecosystem', category: 'grey-literature' },
  // Deep-water red urchin population dynamics — Entry 70 sub-iii primary literature (added Session 2i Chain B close)
  { source: 'Rogers-Bennett, L., Bennett, W.A., Fastenau, H.C., Dewees, C.M. 1995 — Spatial variation in red sea urchin reproduction and morphology: implications for harvest refugia. Ecological Applications 5(4):1171-1180', module: 'ecosystem', category: 'peer-reviewed', doi: '10.2307/2269364' },
  { source: 'Lowe, A.T., Galloway, A.W.E. 2020 — Urchin Searchin\': Red urchins and drift kelp found at 284 m in the mesophotic zone. Ciencias Marinas 46(4):283-296', module: 'ecosystem', category: 'peer-reviewed', doi: '10.7773/cm.v46i4.3156' },
  { source: 'Low, N.H.N., Micheli, F. 2018 — Lethal and functional thresholds of hypoxia in two key benthic grazers. Marine Ecology Progress Series 594:165-173', module: 'ecosystem', category: 'peer-reviewed', doi: '10.3354/meps12558' },
  { source: 'Rogers-Bennett, L., Rogers, D.W., Bennett, W.A., Ebert, T.A. 2003 — Modeling red sea urchin (Strongylocentrotus franciscanus) growth using six growth functions. Fishery Bulletin 101(3):614-626', module: 'ecosystem', category: 'peer-reviewed' },
  { source: 'Zhang, Z., Campbell, A., Bureau, D. 2008 — Growth and Natural Mortality Rates of Red Sea Urchin (Strongylocentrotus franciscanus) in British Columbia. Journal of Shellfish Research 27(5):1291-1299', module: 'ecosystem', category: 'peer-reviewed', doi: '10.2983/0730-8000-27.5.1291' },
  // Participatory simulation and policy informatics — UVA Bay Game
  { source: 'Learmonth, G., Smith, D.E., Sherman, W.H., White, M.A., and Plank, J., 2011 — A practical approach to the complex problem of environmental sustainability: The UVA Bay Game. The Innovation Journal: The Public Sector Innovation Journal, 16(1)', module: 'governance', category: 'peer-reviewed' },
  { source: 'Learmonth, G.P. Sr., Plank, J. 2015 — Participatory Simulation as a Tool of Policy Informatics: Definitions, Literature Review, and Research Directions. Chapter 16 in Johnston, E.W. (Ed.), Governance in the Information Era: Theory and Practice of Policy Informatics. Routledge (Taylor & Francis), ISBN 9781138832084', module: 'governance', category: 'peer-reviewed' },
  // Hood Canal SOD composite attribution (added Session 2m Block 12 sub-12D close, DOI-14 Path 3)
  { source: 'Pelletier, G., Bianucci, L., Long, W., Khangaonkar, T., Mohamedali, T., Ahmed, A., Figueroa-Kaminsky, C. 2017 — Salish Sea Model: Sediment Diagenesis Module. Publication 17-03-010, Washington State Department of Ecology. URL: https://apps.ecology.wa.gov/publications/documents/1703010.pdf', module: 'biogeochem', category: 'government-agency' },
  { source: 'Ahmed, A., Figueroa-Kaminsky, C., Gala, J., Mohamedali, T., Pelletier, G., Sheelagh, M. 2019 — Puget Sound Nutrient Source Reduction Project Volume 1: Model Updates and Bounding Scenarios. Publication 19-03-001, Washington State Department of Ecology. URL: https://apps.ecology.wa.gov/publications/SummaryPages/1903001.html', module: 'biogeochem', category: 'government-agency' },
  { source: 'Pamatmat, M.M., Banse, K. 1969 — Oxygen Consumption by the Seabed II. In Situ Measurements to a Depth of 180 m. Limnology and Oceanography 14(2):250-259', module: 'biogeochem', category: 'peer-reviewed', doi: '10.4319/lo.1969.14.2.0250' },
  { source: 'Khangaonkar, T., Nugraha, A., Xu, W., Long, W., Bianucci, L., Ahmed, A., Mohamedali, T., Pelletier, G. 2018 (JGR-Oceans) — Analysis of Hypoxia and Sensitivity to Nutrient Pollution in Salish Sea. Journal of Geophysical Research: Oceans 123(7):4735-4761', module: 'biogeochem', category: 'peer-reviewed', doi: '10.1029/2017JC013650' },
  // Sediment phase-coupling pre-reg 09fd936 + §11 Amendments 3+4 (commit 2): renewal-locked
  // seasonality framing for the Aug–Nov trough window (Newton 2011), paleoclimate sediment-core
  // context (Brandenberger 2011 promoted from DOI_LOOKUP-only), bioturbation framework
  // (Kristensen 2012), stratification-duration coupling (Middelburg & Levin 2009), and
  // foundational benthic-flux references (Aller 1982, Burdige 2006/2007 promoted from
  // inline-source-only at computeBiogeochem.js:46/:94 per CLAUDE.md citation-discipline §(c)).
  { source: 'Newton, J., Bassin, C., Devol, A., Kawase, M., Ruef, W., Warner, M., Hannafious, D., Rose, R. 2011 — Hypoxia in Hood Canal: An overview of status and contributing factors. Hood Canal Dissolved Oxygen Program (HCDOP), University of Washington / Hood Canal Salmon Enhancement Group; Salish Sea Ecosystem Conference proceedings', module: 'biogeochem', category: 'peer-reviewed' },
  { source: 'Brandenberger, J.M., Crecelius, E.A., Louchouarn, P. 2011 — Historical inputs and natural recovery rates for heavy metals and organic biomarkers in Puget Sound during the 20th century. Aquatic Geochemistry 17(4-5):645-670', module: 'biogeochem', category: 'peer-reviewed', doi: '10.1007/s10498-011-9129-0' },
  { source: 'Kristensen, E., Penha-Lopes, G., Delefosse, M., Valdemarsen, T., Quintana, C.O., Banta, G.T. 2012 — What is bioturbation? The need for a precise definition for fauna in aquatic sciences. Marine Ecology Progress Series 446:285-302', module: 'biogeochem', category: 'peer-reviewed', doi: '10.3354/meps09506' },
  { source: 'Middelburg, J.J., Levin, L.A. 2009 — Coastal hypoxia and sediment biogeochemistry. Biogeosciences 6:1273-1293', module: 'biogeochem', category: 'peer-reviewed', doi: '10.5194/bg-6-1273-2009' },
  { source: 'Aller, R.C. 1982 — The effects of macrobenthos on chemical properties of marine sediment and overlying water. In: Animal-Sediment Relations (McCall, P.L., Tevesz, M.J.S., eds), Plenum Press, pp. 53-102', module: 'biogeochem', category: 'peer-reviewed' },
  { source: 'Burdige, D.J. 2006 — Geochemistry of Marine Sediments. Princeton University Press, 609 pp', module: 'biogeochem', category: 'peer-reviewed' },
  { source: 'Burdige, D.J. 2007 — Preservation of organic matter in marine sediments: controls, mechanisms, and an imbalance in sediment organic carbon budgets? Chemical Reviews 107(2):467-485', module: 'biogeochem', category: 'peer-reviewed', doi: '10.1021/cr050347q' },
  // Fisher-behavior-under-scarcity framework composite (added Session 2m Block 12 sub-12D close, DOI-34 Path 4)
  { source: 'Finkbeiner, E.M., Bennett, N.J., Frawley, T.H., Mason, J.G., Briscoe, D.K., Brooks, C.M., Ng, C.A., Ourens, R., Seto, K., Switzer Swanson, S., Urteaga, J., Crowder, L.B. 2017 — Reconstructing overfishing: Moving beyond Malthus for effective and equitable solutions. Fish and Fisheries 18(6):1180-1191', module: 'fisheries', category: 'peer-reviewed', doi: '10.1111/faf.12245' },
  { source: 'Daw, T.M., Cinner, J.E., McClanahan, T.R., Brown, K., Stead, S.M., Graham, N.A.J., Maina, J. 2012 — To Fish or Not to Fish: Factors at Multiple Scales Affecting Artisanal Fishers\' Readiness to Exit a Declining Fishery. PLoS ONE 7(2):e31460', module: 'fisheries', category: 'peer-reviewed', doi: '10.1371/journal.pone.0031460' },
];

// ── Extract citations from registries ──
function extractRegistryCitations() {
  const citations = new Map(); // fullCitation → { id, author, year, ..., usedBy: [] }
  let nextId = 1;

  function classifyCitation(source) {
    if (!source) return 'unknown';
    const s = source.toLowerCase();
    if (s.startsWith('calibrated')) return 'calibrated';
    if (s.includes('model convention') || s.includes('model estimate')) return 'model-convention';
    // Check for author+year pattern
    if (/\b(19|20)\d{2}\b/.test(source) && /[A-Z][a-z]+/.test(source)) return 'peer-reviewed';
    // Government agencies
    if (/\b(NOAA|EPA|USGS|WDFW|DFO|WDOE|USFWS|DOH|NRCS|BPA|USCG|USACE|CWR)\b/.test(source)) return 'government-agency';
    if (/\b(Census|Statistics|Survey|Program|Report|Plan)\b/.test(source)) return 'government-agency';
    return 'peer-reviewed'; // default if has author-like text
  }

  function parseAuthorYear(source) {
    // Try to extract "Author et al. YEAR" or "Author YEAR"
    const m = source.match(/^([A-Z][A-Za-z\s&]+(?:et al\.?)?)\s*[\(,]?\s*((?:19|20)\d{2})/);
    if (m) return { author: m[1].trim(), year: parseInt(m[2]) };
    // Try "Agency YEAR" at start
    const m2 = source.match(/^([A-Z][A-Za-z\s]+)\s+((?:19|20)\d{2})/);
    if (m2) return { author: m2[1].trim(), year: parseInt(m2[2]) };
    // Just find any year
    const ym = source.match(/((?:19|20)\d{2})/);
    return { author: source.split(/[—\-–(,;]/)[0].trim().slice(0, 40), year: ym ? parseInt(ym[1]) : null };
  }

  function addCitation(source, paramKey, registry, module) {
    if (!source) return;
    const key = source.trim();
    if (!citations.has(key)) {
      const parsed = parseAuthorYear(key);
      citations.set(key, {
        id: nextId++,
        author: parsed.author,
        year: parsed.year,
        fullCitation: key,
        category: classifyCitation(key),
        usedBy: [],
        modules: new Set(),
      });
    }
    const entry = citations.get(key);
    entry.usedBy.push({ param: paramKey, registry, module });
    entry.modules.add(module);
  }

  // Process each registry
  for (const [regName, regInfo] of Object.entries(REGISTRIES)) {
    const data = regInfo.data;
    if (!data) continue;
    // Registries are structured as nested objects with "source" fields
    function walk(obj, path) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.source) {
        addCitation(obj.source, path, regName, regInfo.module);
      }
      for (const [k, v] of Object.entries(obj)) {
        if (k === 'source') continue;
        if (typeof v === 'object' && v !== null) {
          walk(v, path ? `${path}.${k}` : k);
        }
      }
    }
    walk(data, '');
  }

  // Process calibration targets
  for (const t of CALIBRATION_TARGETS) {
    if (t.source) {
      addCitation(t.source, t.id, 'calibrationTargets', t.category?.toLowerCase() || 'calibration');
    }
  }

  // Add engine citations
  for (const ec of ENGINE_CITATIONS) {
    const key = ec.source.trim();
    if (!citations.has(key)) {
      const parsed = parseAuthorYear(key);
      citations.set(key, {
        id: nextId++,
        author: parsed.author,
        year: parsed.year,
        fullCitation: key,
        category: ec.category,
        usedBy: [],
        modules: new Set(),
      });
    }
    const entry = citations.get(key);
    entry.usedBy.push({ param: 'engine-constant', registry: 'engine', module: ec.module });
    entry.modules.add(ec.module);
  }

  return citations;
}

// ── Build the index ──
const _citations = extractRegistryCitations();

export const REFERENCE_INDEX = [..._citations.values()].map((c) => ({
  ...c,
  modules: [...c.modules],
}));

export const TOTAL_CITATIONS = REFERENCE_INDEX.length;

// ── DOI LOOKUP for key peer-reviewed papers ──
export const DOI_LOOKUP = {
  'Veirs et al. 2016': '10.7717/peerj.1657',
  'Ross et al. 2000': '10.1016/S0025-326X(99)00233-7', // Mar. Poll. Bull. 40:504-515
  'Hickie et al. 2007': '10.1021/es0702519', // Environ. Sci. Technol. 41:3222-3229
  'Wasser et al. 2017': '10.1371/journal.pone.0179824',
  'Ford & Ellis 2006': '10.3354/meps316185', // Mar. Ecol. Prog. Ser. 316:185-199
  'Ford et al. 1998': '10.1139/z98-089', // Can. J. Zool. 76:1456-1471
  'Ford et al. 2010': null, // DFO Can. Sci. Advis. Sec. Res. Doc. — grey lit
  'Ford et al. 2011': '10.1093/jhered/esr067', // J. Hered. 102:537-553
  'Hanson et al. 2010': '10.3354/esr00263', // Endang. Species Res. 11:69-82
  'Mongillo et al. 2016': '10.7289/V5/TM-NWFSC-135', // NOAA Tech Memo NMFS-NWFSC-135 — NOAA IR-assigned DOI
  'Lueker et al. 2000': '10.1016/S0304-4203(00)00022-0',
  'Mucci 1983': '10.2475/ajs.283.7.780',
  'Wanninkhof 2014': '10.4319/lom.2014.12.351',
  'Brandenberger et al. 2011': '10.1007/s10498-011-9129-0', // Aquat. Geochem. 17(4-5):645-670
  'Rabinovich et al. 2003': '10.1007/s000240300006', // Pure Appl. Geophys. (old PAGEOPH format)
  'Holling 1959': '10.4039/Ent91385-7',
  'Calbet & Landry 2004': '10.4319/lo.2004.49.1.0051',
  'Sandahl et al. 2007': '10.1021/es062287r',
  'Desforges et al. 2018': '10.1126/science.aat1953',
  'Au et al. 2004': '10.1121/1.1642628', // JASA 115(2):901-909
  'Dethier et al. 2016': '10.1016/j.ecss.2016.03.033', // Estuar. Coast. Shelf Sci. 175:106-117
  'Oliver et al. 2018': '10.1038/s41467-018-03732-9',
  'Lacy et al. 2017': '10.1038/s41598-017-14471-0',
  'Halpern et al. 2008': '10.1126/science.1149345',
  'Bond et al. 2015': '10.1002/2015GL063306',
  'Cai et al. 2014': '10.1038/nclimate2100',
  'Peterson et al. 2014': '10.5670/oceanog.2014.88',
  'Feely et al. 2008': '10.1126/science.1155676',
  'Stramma et al. 2008': '10.1126/science.1153847',
  'Williams R. et al. 2006': '10.1016/j.biocon.2006.06.010', // Biol. Conserv. 133:301-311
  'Thom et al. 2014': '10.1016/j.ecss.2014.04.015',
  'Penttila 2007': null, // WDFW technical report — no DOI
  'Beamer et al. 2005': null, // Skagit System Cooperative report — no DOI
  'Cinner et al. 2009': '10.1111/j.1523-1739.2008.01041.x', // Conserv. Biol. 23(1):124-130
  'Stramma et al. 2010': '10.1029/2009JC005976', // J. Geophys. Res. Oceans 115:C09011
  // Added Session 2m Block 12 sub-12D close — DOI-14 Path 3 composite + DOI-34 Path 4 framework
  'Pelletier et al. 2017': null, // WA Ecology 17-03-010 — no DOI (agency report)
  'Ahmed et al. 2019': null, // WA Ecology 19-03-001 — no DOI (agency report)
  'Pamatmat & Banse 1969': '10.4319/lo.1969.14.2.0250', // L&O 14(2):250-259
  'Khangaonkar et al. 2018 (JGR-Oceans)': '10.1029/2017JC013650', // JGR-Oceans 123(7):4735-4761
  'Finkbeiner et al. 2017': '10.1111/faf.12245', // Fish and Fisheries 18(6):1180-1191
  'Daw et al. 2012': '10.1371/journal.pone.0031460', // PLoS ONE 7(2):e31460
  // Added Session 2m-close-plus-2 Block 12 sub-12F close (fast-wrap)
  'MacGillivray et al. 2019': '10.1121/1.5116140', // JASA 146(1):340-351
  'Min et al. 2019': '10.3390/ijerph16224470', // Int. J. Environ. Res. Public Health 16(22):4470
  'Trainer et al. 2012': '10.1016/j.hal.2011.10.025', // Harmful Algae 14:271-300 (review)
  'Brett et al. 2005': '10.1007/s00267-003-0311-z', // Environmental Management 35(3):330-342
  'Kannan et al. 2000': '10.1080/10807030091124491', // Hum. Ecol. Risk Assess. 6(1):181-201 (corrected venue — spine-inline "Ambio 29:262-270" was wrong)
  'Jepson et al. 2016': '10.1038/srep18573', // Scientific Reports 6:18573
  'Cavole et al. 2016': null, // Oceanography 29(2):62-71 — society-magazine, no DOI assigned
  // Added Session 2m-close-plus-4 §5.5 retroactive review close (fast-wrap audit-wrap)
  'Johnstone & Dawson 2010': '10.1073/pnas.0915062107', // PNAS 107(10):4533-4538 (venue corrected from Session 2d entry 32 "(Science)" → PNAS)
  'Hock 2003': '10.1016/S0022-1694(03)00257-9', // J. Hydrol. 282(1-4):104-115
  // Track A pre-reg §4 citations (added 2026-04-25)
  'Thom et al. 2011': null, // PNNL/WA DNR synthesis — grey literature, no DOI
  'Short & Neckles 1999': '10.1016/S0304-3770(98)00117-X', // Aquat. Bot. 63(3-4):169-196
  // Sediment phase-coupling pre-reg 09fd936 + §11 Amendments 3+4 (commit 2)
  'Newton et al. 2011': null, // HCDOP overview, conference proceedings — no DOI
  'Kristensen et al. 2012': '10.3354/meps09506', // MEPS 446:285-302
  'Middelburg & Levin 2009': '10.5194/bg-6-1273-2009', // Biogeosciences 6:1273-1293
  'Aller 1982': null, // Edited-volume book chapter — no DOI
  'Burdige 2006': null, // Princeton University Press monograph — no DOI
  'Burdige 2007': '10.1021/cr050347q', // Chem. Rev. 107(2):467-485
};

// Attach DOIs to reference index entries
for (const ref of REFERENCE_INDEX) {
  for (const [key, doi] of Object.entries(DOI_LOOKUP)) {
    if (doi && ref.fullCitation.includes(key.split(' ')[0]) && ref.fullCitation.includes(key.split(' ').pop())) {
      ref.doi = doi;
      break;
    }
  }
}

const _withDOI = REFERENCE_INDEX.filter((r) => r.doi).length;

export const CITATION_STATS = {
  peerReviewed: REFERENCE_INDEX.filter((r) => r.category === 'peer-reviewed').length,
  governmentAgency: REFERENCE_INDEX.filter((r) => r.category === 'government-agency').length,
  calibrated: REFERENCE_INDEX.filter((r) => r.category === 'calibrated').length,
  modelConvention: REFERENCE_INDEX.filter((r) => r.category === 'model-convention').length,
  total: REFERENCE_INDEX.length,
  withDOI: _withDOI,
  withoutDOI: REFERENCE_INDEX.length - _withDOI,
  doiCoverage: REFERENCE_INDEX.length > 0 ? Math.round(_withDOI / REFERENCE_INDEX.length * 100) : 0,
};

export const REFERENCES_BY_CATEGORY = {
  peerReviewed: REFERENCE_INDEX.filter((r) => r.category === 'peer-reviewed'),
  governmentAgency: REFERENCE_INDEX.filter((r) => r.category === 'government-agency'),
  calibrated: REFERENCE_INDEX.filter((r) => r.category === 'calibrated'),
};

// Group by module
const _byModule = {};
for (const ref of REFERENCE_INDEX) {
  for (const mod of ref.modules) {
    if (!_byModule[mod]) _byModule[mod] = [];
    _byModule[mod].push(ref);
  }
}
export const REFERENCES_BY_MODULE = _byModule;

// Search function
export function searchReferences(query) {
  if (!query) return REFERENCE_INDEX;
  const q = query.toLowerCase();
  return REFERENCE_INDEX.filter((r) =>
    r.fullCitation.toLowerCase().includes(q) ||
    r.author.toLowerCase().includes(q) ||
    (r.year && String(r.year).includes(q)) ||
    r.modules.some((m) => m.toLowerCase().includes(q))
  );
}

// Get references for a specific parameter
export function getReferencesForParam(paramKey) {
  return REFERENCE_INDEX.filter((r) =>
    r.usedBy.some((u) => u.param === paramKey || u.param.endsWith('.' + paramKey))
  );
}
