// ═══════════════════════════════════════════════════════════
// PERSONAS — Fictional but representative individuals whose
// lives are connected to specific model outputs
// ═══════════════════════════════════════════════════════════
// NOT simulated agents. Narrative devices that humanize the
// numbers. Each persona has stories for good/bad/disaster
// outcomes based on the metrics their life depends on.
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

export const PERSONAS = [
  {
    id: 'maria',
    name: 'Maria Chen',
    age: 42,
    role: 'Longshoreman, ILWU Local 19',
    location: 'Terminal 5, Seattle',
    subBasin: 'main_north',
    description: 'Maria has worked the cranes at T-5 for 16 years. She makes $142,000/year with benefits \u2014 a middle-class life in Seattle that doesn\'t require a college degree. She worries about automation and watches container volumes like a hawk.',
    connectedMetrics: ['portRevenue', 'containerThroughput', 'nwsaEmployment'],
    storyWhenGood: 'Maria picked up three extra shifts this month. The new shore power system means cleaner air on the terminal \u2014 her asthma has been better since it went in.',
    storyWhenBad: 'Maria hasn\'t had overtime in six weeks. Three shipping lines rerouted to Prince Rupert after the labor slowdown. She\'s looking at her savings and doing math.',
    storyWhenDisaster: 'Maria\'s house in the Rainier Valley is on fill soil. After the earthquake, she\'s living in a FEMA trailer while Terminal 5\'s cranes are rebuilt. The Navy is running supply ships into Elliott Bay.',
    threshold: { metric: 'employment', good: 0.05, bad: -0.10, disaster: -0.30 },
  },
  {
    id: 'james',
    name: 'James Williams',
    age: 67,
    role: 'Lummi Nation elder and reef net fisher',
    location: 'Cherry Point, Bellingham',
    subBasin: 'georgia_south',
    description: 'James learned reef net fishing from his grandfather \u2014 the same technique his family has used for over 3,000 years at the same rocks. He fought the coal terminal proposal for a decade and won.',
    connectedMetrics: ['cherryPointHerring', 'salmonRunIndex', 'culturalHealthIndex'],
    storyWhenGood: 'The herring came back thick this February. James took his granddaughter out to the reef net sites for the first time. She caught three sockeye. He didn\'t say anything \u2014 just watched her face.',
    storyWhenBad: 'Third year of poor herring returns. James sits at the dock and watches tankers pass Cherry Point. He won the coal fight, but the fish are still leaving.',
    storyWhenDisaster: 'The earthquake sent a tsunami up Bellingham Bay. James\'s boat survived \u2014 he was at sea. But the reef net rocks are buried under debris. The herring spawning beach is covered in mud.',
    threshold: { metric: 'salmonRunStrength', good: 5, bad: -8, disaster: -20 },
  },
  {
    id: 'sarah',
    name: 'Dr. Sarah Okafor',
    age: 35,
    role: 'Postdoctoral researcher, marine biogeochemistry',
    location: 'Hood Canal, Twanoh',
    subBasin: 'hood_south',
    description: 'Sarah checks the Twanoh DO sensor every morning from her laptop before coffee. She\'s studying whether the stateful sediment model can predict Hood Canal\'s annual hypoxia event. Her grant runs out in 8 months.',
    connectedMetrics: ['hoodCanalDO', 'avgDO', 'sedimentOM'],
    storyWhenGood: 'The DO readings are tracking her model within 0.2 mg/L. Sarah submits her paper to Limnology & Oceanography. The reviewer comments are encouraging.',
    storyWhenBad: 'August again. DO crashed to 1.8 mg/L \u2014 earlier than her model predicted. She recalibrates. Her PI asks about the paper timeline. The consulting firm calls again.',
    storyWhenDisaster: 'The Twanoh sensor went offline after the earthquake. Sarah can\'t get to her field site. She\'s running the Digital Cousin\'s hindcast mode, trying to estimate what the sensor would show.',
    threshold: { metric: 'hoodCanalDO', good: 0.5, bad: -1.0, disaster: -2.0 },
  },
  {
    id: 'david',
    name: 'David Nakamura',
    age: 51,
    role: 'Washington State Ferries captain',
    location: 'Kingston-Edmonds route',
    subBasin: 'whidbey_central',
    description: 'David has piloted WSF vessels for 22 years. He knows every current in Admiralty Inlet. His ferry carries 2,500 people a day. When the fleet is short a vessel, his route gets cancelled and 2,500 people can\'t get to work.',
    connectedMetrics: ['ferryReliability', 'infrastructureResilience', 'ferryInvestment'],
    storyWhenGood: 'The new hybrid-electric ferry arrived last month. Quieter, smoother, and David swears the orca stay closer to the route now.',
    storyWhenBad: 'Three vessels down for maintenance simultaneously. David\'s working double shifts. The 6:10 AM sailing was cancelled \u2014 800 commuters stranded in Kingston.',
    storyWhenDisaster: 'After the earthquake, David\'s ferry is the only way to evacuate Bainbridge Island. He runs continuous crossings for 72 hours straight. The Coast Guard deputizes his vessel.',
    threshold: { metric: 'ferryReliability', good: 0.05, bad: -0.15, disaster: -0.40 },
  },
  {
    id: 'nina',
    name: 'Nina Patel',
    age: 28,
    role: 'Whale watching guide and marine biology student',
    location: 'Friday Harbor, San Juan Island',
    subBasin: 'sj_haro',
    description: 'Nina runs whale watching tours in summer to pay for her master\'s degree in winter. She knows every SRKW by sight. She tells 40 tourists a day about J35 Talequah. When the orca are absent, her tips drop.',
    connectedMetrics: ['orcaPopulation', 'orcaBodyCondition', 'whaleWatchingRevenue', 'haroStrait_noise'],
    storyWhenGood: 'J Pod was in Haro Strait all week. Nina watched J35 make a successful hunt. Three people asked how to donate to orca research. Best tip week of the season.',
    storyWhenBad: 'No SRKW sightings in 18 days. Nina takes tourists to see humpbacks and harbor seals instead. It\'s not the same. Tips are down 40%.',
    storyWhenDisaster: 'The oil from the ruptured tanker reached Haro Strait on the third day. Nina can\'t take boats out. She watches cleanup crews from Lime Kiln lighthouse where she used to watch orca.',
    threshold: { metric: 'orcaPopulation', good: 2, bad: -3, disaster: -10 },
  },
];

export const PERSONA_COUNT = PERSONAS.length;

// Get the appropriate story variant for a persona based on metric deltas
export function getPersonaStory(personaId, metricDelta) {
  const persona = PERSONAS.find(p => p.id === personaId);
  if (!persona) return null;

  const t = persona.threshold;
  if (metricDelta === undefined || metricDelta === null) return { persona, variant: 'good', story: persona.storyWhenGood };

  if (metricDelta <= t.disaster) return { persona, variant: 'disaster', story: persona.storyWhenDisaster };
  if (metricDelta <= t.bad) return { persona, variant: 'bad', story: persona.storyWhenBad };
  return { persona, variant: 'good', story: persona.storyWhenGood };
}

// Find personas affected by a set of changed metrics
export function getAffectedPersonas(changedMetricKeys) {
  if (!changedMetricKeys || !changedMetricKeys.length) return [];
  return PERSONAS.filter(p =>
    p.connectedMetrics.some(m => changedMetricKeys.includes(m))
  );
}

// Format for display
export function formatPersonaCard(persona, story, variant) {
  return {
    name: persona.name,
    role: persona.role,
    location: persona.location,
    subBasin: persona.subBasin,
    story: story,
    variant: variant, // 'good' | 'bad' | 'disaster'
    borderColor: variant === 'good' ? '#10B981' : variant === 'bad' ? '#F97316' : '#F43F5E',
  };
}
