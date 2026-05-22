// =====================================================================
// QUICK QUESTIONS -- 60-second Q&A entry point
// =====================================================================
// One question, one simulation, one answer, one action.
// For the congressional staffer with 2 minutes, the journalist
// on deadline, the parent who saw an orca on a whale trip.
//
// 18 questions across 5 categories.
// Voice: K-12 teacher -- concrete, warm, short sentences.
//
// ES6 convention (config file).
// =====================================================================

export const QUESTIONS = [
  // ── ECOLOGY ────────────────────────────────────────────────
  {
    id: 'quiet_ships',
    question: 'What happens if we quiet the ships?',
    subtitle: 'Vessel speed reductions in orca habitat',
    icon: 'sound',
    category: 'ecology',
    scenario: 'green',
    extraParams: {
      port: { vesselSpeedZone: 90, shorepower: 80 },
      ecosystem: { orcaProtectionLevel: 80 },
    },
    yearsToRun: 20,
    personaId: 'nina',
    actionLinkKey: 'vesselNoise',
    findingTemplate: {
      headline: (r) => {
        const foragingGain = r?.ecosystem?.state?.orcaBodyCondition;
        return foragingGain > 0.6
          ? 'Orca foraging efficiency improves significantly'
          : 'Orca foraging shows modest improvement';
      },
      bullets: [
        'Ship noise in Haro Strait drops as vessels slow down',
        'Orca detection range expands from 50m toward 200m',
        'Shipping transit time increases by ~45 minutes per voyage',
      ],
      tradeoff: 'Quieter ships save orca. Slower ships cost the shipping industry in delay. Is it worth it?',
    },
  },
  {
    id: 'salmon_home',
    question: 'What happens if salmon come home?',
    subtitle: 'Full habitat restoration and fishing reform',
    icon: 'salmon',
    category: 'ecology',
    scenario: 'restoration_nation',
    yearsToRun: 20,
    personaId: 'james',
    actionLinkKey: 'salmonRecovery',
    findingTemplate: {
      headline: (r) => {
        const salmon = r?.ecosystem?.state?.salmonRunStrength || 48;
        return salmon > 55 ? 'Salmon runs strengthen across the region' : 'Recovery is slow but measurable';
      },
      bullets: [
        'Fish passage investment opens hundreds of stream miles',
        'Eelgrass and marsh restoration rebuilds juvenile rearing habitat',
        'Orca prey base improves as Chinook abundance rises',
      ],
      tradeoff: 'Habitat restoration works but takes decades. The fish that return in 2046 depend on the investments we make in 2026.',
    },
  },
  {
    id: 'hood_canal',
    question: 'What if Hood Canal could breathe?',
    subtitle: 'Decades of accumulated pollution finally addressed',
    icon: 'water',
    category: 'ecology',
    scenario: 'save_hood_canal',
    yearsToRun: 20,
    personaId: 'sarah',
    actionLinkKey: 'hoodCanal',
    findingTemplate: {
      headline: (r) => {
        const doDelta = (r?.marine?.state?.hoodCanalDO || 4) - 4;
        return doDelta > 0.5 ? 'Hood Canal oxygen levels improve' : 'Recovery is measurable but slow';
      },
      bullets: [
        'Nutrient reduction lowers organic matter accumulation in sediment',
        'Deep water renewal events bring more oxygen to the basin',
        'Shellfish and Skokomish treaty fisheries stabilize',
      ],
      tradeoff: 'Even if we stopped all pollution today, the sediment that accumulated over decades would take 15 years to process. Local action can work, but it races against global ocean deoxygenation.',
    },
  },
  {
    id: 'sea_stars',
    question: 'What happens when the sea stars come back?',
    subtitle: 'Sunflower star recovery could trigger a kelp forest comeback',
    icon: 'star',
    category: 'ecology',
    scenario: 'green',
    yearsToRun: 20,
    personaId: 'sarah',
    actionLinkKey: 'salmonRecovery',
    findingTemplate: {
      headline: 'One predator controls the whole nearshore',
      bullets: [
        'Sunflower sea stars eat urchins. Without them, urchins devour kelp forests.',
        'Kelp forests shelter juvenile salmon, herring, and rockfish -- they are nurseries.',
        'Recovery is possible but fragile. Disease could return with warming.',
      ],
      tradeoff: 'We cannot bring back the sea stars directly. But we can protect the kelp forests that would benefit from their return -- and control urchins in the meantime.',
    },
  },
  {
    id: 'tire_dust',
    question: 'How does tire dust kill salmon?',
    subtitle: '6PPD-quinone: the chemical salmon never evolved to handle',
    icon: 'warning',
    category: 'ecology',
    scenario: 'baseline',
    extraParams: {
      urban: { stormwaterTreatment: 80, greenInfraFraction: 30 },
    },
    yearsToRun: 10,
    personaId: 'james',
    actionLinkKey: 'contamination',
    findingTemplate: {
      headline: 'Every rainstorm washes tire chemicals into salmon streams',
      bullets: [
        'A chemical called 6PPD-quinone forms when tire rubber hits pavement and rain.',
        'Coho salmon die within hours of exposure. Longfellow Creek in Seattle loses fish every fall.',
        'Green infrastructure -- rain gardens, bioswales -- can filter 60-80% of this pollution before it reaches streams.',
      ],
      tradeoff: 'We know the chemical. We know the solution. Rain gardens and bioswales work. The question is whether cities invest in green infrastructure before more streams go silent.',
    },
  },
  {
    id: 'cherry_point',
    question: 'Could Cherry Point herring recover?',
    subtitle: 'A 97% decline and the Lummi Nation fishery that depends on them',
    icon: 'fish',
    category: 'ecology',
    scenario: 'green',
    extraParams: {
      ecosystem: { fishingPressure: 10, protectedAreaFraction: 40, eelgrassRestoration: 80 },
      nearshore: { armorRemovalRate: 600, nearshoreInvestment: 90 },
    },
    yearsToRun: 30,
    personaId: 'james',
    actionLinkKey: 'salmonRecovery',
    findingTemplate: {
      headline: 'Recovery is possible -- but it would take decades',
      bullets: [
        'Cherry Point herring are genetically distinct. They spawn only at Cherry Point -- nowhere else.',
        'The Lummi Nation has fished this stock for thousands of years. The closure devastated treaty harvest.',
        'Below a critical population size, herring cannot find enough mates. This Allee effect makes small populations shrink faster.',
      ],
      tradeoff: 'Maximum protection -- no fishing, no shoreline development, contamination cleanup -- might allow recovery over 20-30 years. But one bad year at low numbers could push the stock past the point of no return.',
    },
  },

  // ── ECONOMY & INFRASTRUCTURE ───────────────────────────────
  {
    id: 'tanker_spill',
    question: 'What if a tanker spills oil in the San Juans?',
    subtitle: 'Dilbit sinks. That changes everything about oil spill response.',
    icon: 'warning',
    category: 'economy',
    scenario: 'trans_mountain_spill',
    yearsToRun: 20,
    personaId: 'james',
    actionLinkKey: 'contamination',
    findingTemplate: {
      headline: 'Dilbit reaches the seafloor. Recovery takes decades.',
      bullets: [
        'Unlike conventional crude, diluted bitumen sinks -- smothering sand wave fields, rocky reefs, and eelgrass.',
        'Fishery closures affect Lummi, Samish, and Swinomish treaty harvest immediately.',
        'Tourism and recreation collapse across the San Juan Islands for years.',
      ],
      tradeoff: 'The Trans Mountain pipeline expansion triples tanker traffic through the San Juans. The economic benefits flow to Alberta. The ecological risk stays in the Salish Sea.',
    },
  },
  {
    id: 'data_centers',
    question: 'Can the power grid handle AI data centers?',
    subtitle: 'Demand growing 15% per year into a grid with thin margins',
    icon: 'lightning',
    category: 'economy',
    scenario: 'energy_crunch',
    yearsToRun: 15,
    personaId: 'david',
    actionLinkKey: 'climateAdaptation',
    findingTemplate: {
      headline: 'The grid runs out of headroom within a decade',
      bullets: [
        'Data centers in central Washington already use 700 MW. Growth at 15% per year doubles demand every 5 years.',
        'The PNW grid relies on hydropower -- clean but finite. New demand competes with fish flows and flood control.',
        'Grant County PUD faces a choice: serve data centers or keep electricity cheap for residents.',
      ],
      tradeoff: 'AI needs power. Fish need water. Residents need affordable electricity. The Columbia River cannot serve all three at current growth rates without new generation -- nuclear, wind, or both.',
    },
  },
  {
    id: 'i5_landslide',
    question: 'What does the I-5 landslide cost?',
    subtitle: 'When the highway closes, the whole region feels it',
    icon: 'road',
    category: 'economy',
    scenario: 'infrastructure_collapse',
    yearsToRun: 5,
    personaId: 'maria',
    actionLinkKey: 'cascadiaPreparedness',
    findingTemplate: {
      headline: 'One landslide disrupts the entire Pacific trade corridor',
      bullets: [
        'I-5 carries 70% of freight between Seattle and Vancouver. When it closes, there is no good alternative.',
        'Heavy rain saturates the Chuckanut Formation -- the same geology that failed in March 2026.',
        'Port delays cascade: container ships divert, rail capacity maxes out, costs spike.',
      ],
      tradeoff: 'Climate change means more atmospheric rivers. The Chuckanut corridor will fail again. Investing in alternatives -- rail redundancy, ferry capacity, highway resilience -- costs less than repeated disruption.',
    },
  },

  // ── CLIMATE ────────────────────────────────────────────────
  {
    id: 'do_nothing',
    question: 'What happens if we do nothing?',
    subtitle: 'Current trends continue for 20 years',
    icon: 'clock',
    category: 'climate',
    scenario: 'baseline',
    yearsToRun: 20,
    personaId: 'sarah',
    actionLinkKey: 'climateAdaptation',
    findingTemplate: {
      headline: () => 'Slow decline across multiple dimensions',
      bullets: [
        'Pacific source water continues deoxygenating',
        'Hood Canal hypoxia worsens as sediment load accumulates',
        'Warming shifts salmon migration timing -- phenological mismatch grows',
      ],
      tradeoff: 'Doing nothing is itself a choice. The costs of inaction compound over time as the ecosystem crosses thresholds that are expensive or impossible to reverse.',
    },
  },
  {
    id: 'blob_returns',
    question: 'What if the Blob comes back?',
    subtitle: 'A marine heat wave like 2014-2016, but in a warmer ocean',
    icon: 'thermometer',
    category: 'climate',
    scenario: 'blob_returns',
    yearsToRun: 10,
    personaId: 'sarah',
    actionLinkKey: 'climateAdaptation',
    findingTemplate: {
      headline: 'The next Blob hits an ecosystem already under stress',
      bullets: [
        'The 2014-2016 Blob raised sea surface temperatures 2-3 degrees C for two years. Kelp died. Seabirds starved. Toxic algae bloomed.',
        'A new Blob in a warmer baseline ocean pushes temperatures past thresholds that were merely stressed before.',
        'Hood Canal oxygen crashes. Salmon migration timing shifts. Orca lose prey at the worst possible time.',
      ],
      tradeoff: 'We cannot prevent marine heat waves. But a healthier baseline ecosystem -- more kelp, more salmon, less pollution -- absorbs the shock better. Local resilience buys time against global forcing.',
    },
  },
  {
    id: 'sea_level',
    question: 'How fast is the sea rising?',
    subtitle: 'It depends on ice sheets 10,000 miles away',
    icon: 'water',
    category: 'climate',
    scenario: 'thwaites_collapse',
    yearsToRun: 50,
    personaId: 'david',
    actionLinkKey: 'climateAdaptation',
    findingTemplate: {
      headline: 'The range of possible futures is enormous',
      bullets: [
        'Current rate: about 4 mm per year at Seattle. That is double the 20th century average.',
        'If Thwaites Glacier collapses, add 0.5 meters by 2100. Tribal lands, ferry terminals, and wastewater plants flood.',
        'Insurance companies are already pulling back. The Stillaguamish delta and Skagit flats face the highest risk.',
      ],
      tradeoff: 'Sea level rise is locked in for decades regardless of emissions. The question is how much and how fast. Every fraction of a degree of warming avoided is less ice lost and more time to adapt.',
    },
  },

  // ── COMMUNITIES & RIGHTS ───────────────────────────────────
  {
    id: 'tribal_terminal',
    question: 'What if the Puyallup Terminal succeeds?',
    subtitle: 'Tribal economic development expands across the Salish Sea',
    icon: 'ship',
    category: 'communities',
    scenario: 'tribal_renaissance',
    yearsToRun: 20,
    personaId: 'james',
    actionLinkKey: 'tribalRights',
    findingTemplate: {
      headline: () => 'Treaty implementation drives ecological and economic recovery',
      bullets: [
        'Co-management effectiveness improves habitat outcomes',
        'Tribal terminal generates revenue that funds restoration',
        'First foods availability increases across treaty territories',
      ],
      tradeoff: 'Indigenous-led governance has a 10,000-year track record in these waters. The question is whether the legal and institutional structures will support it.',
    },
  },
  {
    id: 'whose_water',
    question: 'Whose water is this?',
    subtitle: 'Treaty rights, sovereignty, and 10,000 years of stewardship',
    icon: 'people',
    category: 'communities',
    scenario: 'tribal_renaissance',
    yearsToRun: 20,
    personaId: 'james',
    actionLinkKey: 'tribalRights',
    findingTemplate: {
      headline: 'When treaty rights are funded, the ecosystem recovers',
      bullets: [
        '34 sovereign Indigenous nations govern these waters. Their rights are not policy choices -- they are law.',
        'The Boldt Decision guarantees 50% of harvestable fish. The Culverts Case requires fish passage restoration.',
        'When co-management is funded at 90%, habitat outcomes improve across every metric the model tracks.',
      ],
      tradeoff: 'Indigenous peoples managed these waters sustainably for millennia. The last 150 years of colonial management produced orca endangerment, salmon collapse, and toxic sediment. The model shows what Indigenous-led governance achieves.',
    },
  },
  {
    id: 'sewage',
    question: 'Where does our sewage go?',
    subtitle: 'Five plants, 544 million gallons per day, and what happens when it rains',
    icon: 'droplet',
    category: 'communities',
    scenario: 'baseline',
    extraParams: {
      urban: { wastewaterInvestment: 90, wastewaterEfficiency: 95 },
    },
    yearsToRun: 15,
    personaId: 'sarah',
    actionLinkKey: 'contamination',
    findingTemplate: {
      headline: 'When it rains hard, raw sewage overflows into the Sound',
      bullets: [
        'West Point treats 133 million gallons per day. In February 2017, it flooded -- months of raw sewage into Elliott Bay.',
        'Combined sewer overflows send untreated waste into Puget Sound during heavy rain. Pharmaceuticals, nutrients, pathogens.',
        'Population growth is stressing plant capacity. Without investment, overflows become more frequent.',
      ],
      tradeoff: 'Upgrading wastewater infrastructure is expensive and invisible -- nobody campaigns on sewer pipes. But every gallon of untreated overflow carries pharmaceuticals that feminize fish and nutrients that feed toxic algae.',
    },
  },

  // ── STRATEGY ───────────────────────────────────────────────
  {
    id: 'big_one',
    question: 'What happens if the Big One hits?',
    subtitle: 'Magnitude 9 earthquake on the Cascadia fault',
    icon: 'seismic',
    category: 'strategy',
    scenario: 'cascadia_m9',
    yearsToRun: 20,
    personaId: 'maria',
    actionLinkKey: 'cascadiaPreparedness',
    findingTemplate: {
      headline: () => 'The recovery takes 20 years',
      bullets: [
        'Fraser Delta collapses -- 18m tsunami in Georgia Strait',
        'Port capacity drops to <20% immediately',
        'Prince Rupert absorbs 30%+ of Pacific trade permanently',
      ],
      tradeoff: 'Preparedness investment before the earthquake determines how fast we recover after. Every dollar spent on retrofits saves ten in reconstruction.',
    },
  },
  {
    id: 'strait_closure',
    question: 'What if the Strait of Juan de Fuca closes?',
    subtitle: 'The only way in and out of the Salish Sea',
    icon: 'lock',
    category: 'strategy',
    scenario: 'baseline',
    extraParams: {
      port: { containerThroughput: 1500 },
    },
    yearsToRun: 5,
    personaId: 'maria',
    actionLinkKey: 'portSustainability',
    findingTemplate: {
      headline: 'Everything stops. There is no alternative route.',
      bullets: [
        'Every container ship, oil tanker, grain bulk carrier, and Navy submarine enters through Juan de Fuca.',
        'A closure -- collision, military event, natural disaster -- halts $200B in annual trade.',
        'The nearest alternative port (Prince Rupert) cannot absorb the volume. Supply chains break within days.',
      ],
      tradeoff: 'Geographic chokepoints cannot be engineered away. The Strait of Juan de Fuca is both the region\'s lifeline and its single point of failure. Diversification -- rail, pipeline, strategic reserves -- reduces but cannot eliminate the risk.',
    },
  },
  {
    id: 'arctic_shipping',
    question: 'Is Arctic shipping coming to the Salish Sea?',
    subtitle: 'The same warming that opens new routes degrades the ecosystem',
    icon: 'compass',
    category: 'strategy',
    scenario: 'climate',
    extraParams: {
      marine: { sspPathway: 2 },
    },
    yearsToRun: 30,
    personaId: 'maria',
    actionLinkKey: 'portSustainability',
    findingTemplate: {
      headline: 'Arctic routes could reshape Pacific trade by mid-century',
      bullets: [
        'Three routes are opening: Northwest Passage, Transpolar, and Northern Sea Route.',
        'If Asian cargo ships can reach Europe via the Arctic, West Coast ports lose competitive advantage.',
        'The warming that opens Arctic routes also acidifies the Salish Sea, starves salmon, and bleaches kelp.',
      ],
      tradeoff: 'Arctic shipping is a climate feedback loop. The fossil fuels that warm the planet open the routes that carry more fossil fuels. The Salish Sea sits at the intersection of global trade and local ecology.',
    },
  },
  // ── OCEAN ACIDIFICATION CHAIN ──
  {
    id: 'acid_ocean',
    question: 'What happens when the ocean turns acid?',
    subtitle: 'CO2 dissolves pteropod shells, starving juvenile salmon',
    icon: 'water',
    category: 'ecology',
    scenario: 'silent_crisis',
    yearsToRun: 30,
    personaId: 'sarah',
    actionLinkKey: 'hoodCanal',
    findingTemplate: {
      headline: (r) => {
        const omega = r?.marine?.state?.omegaAragonite || 2.0;
        return omega < 1.5
          ? 'Ocean acidification is dissolving the base of the food web'
          : 'Acidification is measurable but not yet critical';
      },
      bullets: [
        'CO2 dissolves into seawater, lowering pH and aragonite saturation.',
        'Pteropod shells dissolve when omega drops below 1.2. They are prey for juvenile salmon.',
        'Less pteropod prey means fewer juvenile salmon survive to adulthood.',
        'This is the invisible crisis: no oil spill, no disaster, just slowly rising CO2.',
      ],
      tradeoff: 'Ocean acidification is global. Local action cannot stop it. But local monitoring can detect it early, and local habitat restoration can buffer the worst effects.',
    },
  },
  // ── BIGG'S ORCA COMPARISON ──
  {
    id: 'two_orcas',
    question: 'Why are some orcas thriving while others aren\'t?',
    subtitle: 'Bigg\'s orca are growing while SRKW decline',
    icon: 'sound',
    category: 'ecology',
    scenario: 'baseline',
    yearsToRun: 20,
    personaId: 'nina',
    actionLinkKey: 'vesselNoise',
    findingTemplate: {
      headline: (r) => {
        const srkw = r?.ecosystem?.state?.orcaPopulation || 74;
        const biggs = r?.ecosystem?.state?.biggsOrcaPop || 0.80;
        return srkw < 70
          ? 'Two orca populations, two very different futures'
          : 'Both orca populations present, but trajectories diverge';
      },
      bullets: [
        'SRKW eat salmon (declining). Bigg\'s eat seals (abundant). Diet is destiny.',
        'Bigg\'s population is ~400 and growing. SRKW is ~73 and declining.',
        'Both carry toxic PCBs, but Bigg\'s levels are even higher (eating contaminated seals).',
        'Bigg\'s predation on seals indirectly helps salmon, which helps SRKW.',
      ],
      tradeoff: 'Same species, same waters, opposite fates. The difference is food. SRKW recovery depends on salmon recovery. Bigg\'s success shows what happens when prey is abundant.',
    },
  },
];

// Category definitions for UI
export const CATEGORIES = [
  { id: 'ecology', label: 'Ecology', color: '#10B981', icon: 'leaf' },
  { id: 'economy', label: 'Economy & Infrastructure', color: '#F59E0B', icon: 'gear' },
  { id: 'climate', label: 'Climate', color: '#EF4444', icon: 'thermometer' },
  { id: 'communities', label: 'Communities & Rights', color: '#8B5CF6', icon: 'people' },
  { id: 'strategy', label: 'Strategy', color: '#64748B', icon: 'compass' },
];

export const QUESTION_COUNT = QUESTIONS.length;
