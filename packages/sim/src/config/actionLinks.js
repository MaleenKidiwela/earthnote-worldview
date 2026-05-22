// ═══════════════════════════════════════════════════════════
// ACTION LINKS — Connect findings to real decision processes
// ═══════════════════════════════════════════════════════════
// NOT advocacy — civic information. After a simulation finding,
// users can learn where the real decisions are made.
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

export const ACTION_LINKS = {
  vesselNoise: {
    finding: 'Vessel noise reduces orca foraging efficiency',
    keywords: ['noise', 'orca', 'vessel', 'shipping', 'acoustic', 'masking'],
    actions: [
      { label: 'ECHO Program (VFPA)', url: 'https://www.portvancouver.com/environmental-protection-at-the-port-of-vancouver/echo-program/', description: 'Voluntary vessel slowdown in SRKW habitat' },
      { label: 'NOAA SRKW Recovery Plan', url: 'https://www.fisheries.noaa.gov/resource/document/recovery-plan-southern-resident-killer-whales', description: 'Federal recovery plan for endangered orca' },
      { label: 'San Juan County Marine Resources', url: 'https://www.sanjuanco.com/1588/Marine-Resources-Committee', description: 'Local marine stewardship committee' },
    ],
  },
  salmonRecovery: {
    finding: 'Salmon habitat restoration improves run strength',
    keywords: ['salmon', 'chinook', 'fisheries', 'habitat', 'passage', 'hatchery'],
    actions: [
      { label: 'WDFW Salmon Recovery', url: 'https://wdfw.wa.gov/species-habitats/at-risk/species-recovery/salmon', description: 'Washington salmon recovery programs' },
      { label: 'Pacific Salmon Commission', url: 'https://www.psc.org/', description: 'US-Canada bilateral salmon management' },
      { label: 'Long Live the Kings', url: 'https://lltk.org/', description: 'Non-profit salmon recovery organization' },
    ],
  },
  hoodCanal: {
    finding: 'Hood Canal dissolved oxygen responds to nutrient reduction',
    keywords: ['hood canal', 'hypoxia', 'oxygen', 'dissolved oxygen', 'nutrient'],
    actions: [
      { label: 'Hood Canal Dissolved Oxygen Program', url: 'https://www.hoodcanal.washington.edu/', description: 'Integrated research and monitoring' },
      { label: 'Puget Sound Partnership', url: 'https://www.psp.wa.gov/', description: 'Regional recovery organization' },
    ],
  },
  tribalRights: {
    finding: 'Treaty implementation strengthens ecological outcomes',
    keywords: ['tribal', 'treaty', 'indigenous', 'co-management', 'first nations', 'boldt'],
    actions: [
      { label: 'Northwest Indian Fisheries Commission', url: 'https://nwifc.org/', description: 'Treaty tribes fisheries co-management' },
      { label: 'First Nations Fisheries Council (BC)', url: 'https://www.fnfisheriescouncil.ca/', description: 'BC First Nations fisheries governance' },
      { label: 'UNDRIP Implementation', url: 'https://www.un.org/development/desa/indigenouspeoples/declaration-on-the-rights-of-indigenous-peoples.html', description: 'UN Declaration on Indigenous Peoples rights' },
    ],
  },
  cascadiaPreparedness: {
    finding: 'Seismic preparedness investment reduces recovery time',
    keywords: ['earthquake', 'cascadia', 'tsunami', 'seismic', 'M9', 'preparedness'],
    actions: [
      { label: 'Washington Emergency Management', url: 'https://mil.wa.gov/emergency-management-division', description: 'State earthquake preparedness resources' },
      { label: 'ShakeAlert Early Warning', url: 'https://www.shakealert.org/', description: 'West Coast earthquake early warning system' },
      { label: 'Cascadia Region Earthquake Workgroup', url: 'https://crew.org/', description: 'Research and public education on Cascadia hazards' },
    ],
  },
  portSustainability: {
    finding: 'Port operations affect regional ecology and economy',
    keywords: ['port', 'trade', 'container', 'shipping', 'emissions', 'shore power'],
    actions: [
      { label: 'NWSA Environmental Programs', url: 'https://www.nwseaportalliance.com/environment', description: 'Clean air, water, and habitat programs' },
      { label: 'VFPA Environmental Programs', url: 'https://www.portvancouver.com/environmental-protection-at-the-port-of-vancouver/', description: 'Vancouver port environmental stewardship' },
    ],
  },
  contamination: {
    finding: 'Legacy contamination affects tribal health and food sovereignty',
    keywords: ['contamination', 'PCB', 'superfund', 'duwamish', 'cleanup', 'toxics'],
    actions: [
      { label: 'Lower Duwamish Waterway Cleanup', url: 'https://www.epa.gov/superfund/lower-duwamish-waterway', description: 'EPA Superfund site cleanup plan' },
      { label: 'Puget Sound Partnership', url: 'https://www.psp.wa.gov/', description: 'Regional recovery coordination' },
      { label: 'WA Dept. of Ecology Cleanup', url: 'https://ecology.wa.gov/spills-cleanup', description: 'State toxic cleanup programs' },
    ],
  },
  climateAdaptation: {
    finding: 'Climate change compounds all other stressors',
    keywords: ['climate', 'warming', 'sea level', 'SLR', 'CO2', 'acidification'],
    actions: [
      { label: 'WA Climate Commitment Act', url: 'https://ecology.wa.gov/air-climate/climate-commitment-act', description: 'Washington cap-and-trade program' },
      { label: 'BC Climate Action', url: 'https://www2.gov.bc.ca/gov/content/environment/climate-change', description: 'BC carbon tax and climate programs' },
    ],
  },
};

// Match findings to relevant action links based on keywords
export function findRelevantActions(findingText) {
  if (!findingText) return [];
  const lower = findingText.toLowerCase();
  const matches = [];
  for (const [key, entry] of Object.entries(ACTION_LINKS)) {
    const score = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (score > 0) matches.push({ key, ...entry, score });
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

export const ACTION_LINK_COUNT = Object.keys(ACTION_LINKS).length;
