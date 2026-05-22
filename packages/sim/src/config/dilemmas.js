// ═══════════════════════════════════════════════════════════
// DILEMMAS — Emotional tension moments that force tradeoffs
// ═══════════════════════════════════════════════════════════
// Triggered when the user's choices create impossible tradeoffs.
// Each dilemma presents a genuine ethical/practical tension
// with 3 choices that have real downstream consequences.
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

export const DILEMMAS = [
  {
    id: 'kpod_dying',
    title: 'K Pod is dying',
    trigger: (results) => {
      const kPop = results?.ecosystem?.state?.kPodPop;
      return typeof kPop === 'number' && kPop < 12;
    },
    triggerDescription: 'K Pod drops below 12 individuals (near Allee threshold)',
    text: 'K Pod has fewer than 12 members. Below 10, they may never recover. Saving them requires immediate vessel exclusion zones in Haro Strait. But that route carries $76 billion in annual trade to Vancouver.',
    choices: [
      {
        label: 'Protect K Pod \u2014 close Haro Strait to large vessels',
        consequence: 'Trade reroutes through Rosario Strait (shallow, slower) or to Prince Rupert. Vancouver port revenue drops 25%.',
        params: { port: { vesselSpeedZone: 100 }, ecosystem: { orcaProtectionLevel: 100 } },
      },
      {
        label: 'Keep the trade route open \u2014 K Pod takes its chances',
        consequence: 'Shipping continues unimpeded. K Pod faces continued noise stress and prey competition. 60% probability of functional extinction within 10 years.',
        params: {},
      },
      {
        label: 'Seasonal restrictions during foraging season (May-Oct)',
        consequence: 'Partial trade disruption during summer. Reduced noise during critical feeding months. K Pod survival probability improves to 40%.',
        params: { port: { vesselSpeedZone: 60 }, ecosystem: { orcaProtectionLevel: 70 } },
      },
    ],
  },
  {
    id: 'budget_crisis',
    title: 'The Budget',
    trigger: (results, params) => {
      // Trigger when user allocates more than budget allows
      // Simple proxy: check if multiple high-investment params are set
      if (!params) return false;
      const eco = params.ecosystem || {};
      const infra = params.infrastructure || {};
      const highCount = [
        eco.fishPassageInvestment > 80,
        eco.eelgrassRestoration > 70,
        eco.orcaProtectionLevel > 80,
        infra.i5MaintenanceInvestment > 80,
        infra.ferryInvestment > 70,
      ].filter(Boolean).length;
      return highCount >= 4;
    },
    triggerDescription: 'User tries to invest heavily in 4+ categories simultaneously',
    text: 'You\'ve committed to more investment than the budget supports. Something has to give.',
    choices: [
      {
        label: 'Cut salmon restoration \u2014 save $300M',
        consequence: 'Salmon habitat recovery slows. Orca prey base remains limited. But infrastructure and tribal funding are preserved.',
        params: { ecosystem: { fishPassageInvestment: 30, eelgrassRestoration: 20 } },
      },
      {
        label: 'Cut infrastructure maintenance \u2014 save $400M',
        consequence: 'I-5 and ferry reliability decline. Trade disruption increases. But ecological investment continues.',
        params: { infrastructure: { i5MaintenanceInvestment: 25, ferryInvestment: 20 } },
      },
      {
        label: 'Cut tribal co-management funding \u2014 save $200M',
        consequence: 'Treaty implementation weakened. Co-management effectiveness drops. First foods availability declines. Environmental justice worsens.',
        params: { tribal: { tribalManagementFunding: 20, tekIntegration: 15 } },
        legallyConstrained: true,
        legalNote: 'The Culverts Case (United States v. Washington, 2018) established that the government has a legal obligation to maintain functional fish habitat. Co-management funding is a mechanism for that obligation. Cutting it risks court-ordered remediation that costs far more than the savings.',
      },
    ],
  },
  {
    id: 'the_spill',
    title: 'The Spill',
    trigger: (results) => {
      // Trigger on oil spill event or high spill probability
      const spillRisk = results?.infrastructure?.state?.oilSpillRisk;
      return typeof spillRisk === 'number' && spillRisk > 0.5;
    },
    triggerDescription: 'Oil spill risk exceeds 50% or spill event occurs',
    text: 'An Aframax tanker has grounded in Haro Strait. 30,000 barrels of diluted bitumen are entering SRKW critical habitat. You can\'t do everything at once.',
    choices: [
      {
        label: 'Prioritize wildlife rescue \u2014 orca, seabirds, pinnipeds',
        consequence: 'Marine mammal rescue teams deployed. Oil continues spreading to shorelines. Shellfish beds contaminated. But individual animals are saved.',
        params: { ecosystem: { orcaProtectionLevel: 90 } },
      },
      {
        label: 'Prioritize containment \u2014 protect shorelines and shellfish beds',
        consequence: 'Booms deployed around shellfish beds and tribal harvest areas. Wildlife in the slick zone is unrescued. But contamination spread is limited.',
        params: { nearshore: { superfundRemediationRate: 80 } },
      },
      {
        label: 'Prioritize navigation \u2014 reopen the strait for trade ASAP',
        consequence: 'Cleanup operations minimized to clear shipping lanes. Oil spreads further. But $274M/day in trade resumes within 48 hours instead of 7 days.',
        params: {},
      },
    ],
  },
  {
    id: 'whose_fish',
    title: 'Whose Fish?',
    trigger: (results) => {
      const salmon = results?.ecosystem?.state?.salmonRunStrength;
      return typeof salmon === 'number' && salmon < 30;
    },
    triggerDescription: 'Salmon abundance drops below 30/100 (critical)',
    text: 'Chinook returns are at 30% of historical levels. The Boldt Decision guarantees tribes 50% of the harvestable surplus. At current abundance, 50% isn\'t enough for either tribal or commercial fishers.',
    choices: [
      {
        label: 'Honor the treaty \u2014 tribes get their 50%, commercial fleet absorbs the cut',
        consequence: 'Tribal harvest security maintained. Commercial fishing communities devastated. Legal precedent upheld. Salmon recovery prioritized.',
        params: { ecosystem: { fishingPressure: 15 } },
      },
      {
        label: 'Emergency conservation closure \u2014 nobody fishes until stocks recover',
        consequence: 'All fishing stopped for 2-5 years. Both tribal and commercial communities lose income. But salmon get the recovery window they need.',
        params: { ecosystem: { fishingPressure: 5 } },
      },
      {
        label: 'Reduce the tribal allocation \u2014 face legal challenge under Boldt',
        consequence: 'This is legally impossible. The Boldt Decision is federal case law affirmed by the Supreme Court. Any attempt would be struck down in court and damage government-tribal relations for a generation.',
        params: {},
        legallyBlocked: true,
        legalExplanation: 'The Boldt Decision (US v. Washington, 1974) is settled federal law. Treaty rights are constitutionally protected. This option exists to illustrate WHY treaty rights are non-negotiable.',
      },
    ],
  },
  {
    id: 'the_seal_question',
    title: 'The Seal Question',
    trigger: (results) => {
      const pinnipedPop = results?.ecosystem?.state?.pinnipedPop;
      const salmonRun = results?.ecosystem?.state?.salmonRunStrength;
      return typeof pinnipedPop === 'number' && pinnipedPop > 45000
        && typeof salmonRun === 'number' && salmonRun < 35;
    },
    triggerDescription: 'Pinniped population above 45,000 while salmon runs below 35/100',
    text: 'Harbor seals have recovered to record numbers since the Marine Mammal Protection Act. They eat salmon. Salmon feed endangered SRKW orca. But Bigg\'s orca eat seals. Culling seals helps salmon directly but removes prey for an entire orca population.',
    choices: [
      {
        label: 'Cull seals to help salmon \u2014 prioritize SRKW recovery',
        consequence: 'Pinniped populations reduced. Salmon smolt survival improves. SRKW prey base strengthens. But Bigg\'s orca lose their primary food source and begin declining. One orca population saved at the expense of another.',
        params: { ecosystem: { pinnipedCulling: 50 } },
      },
      {
        label: 'Let ecosystems self-regulate \u2014 Bigg\'s orca are natural seal control',
        consequence: 'Bigg\'s orca provide top-down control on seals, but it takes years. Salmon remain depressed in the interim. SRKW continue declining while waiting for natural balance. Ecosystem integrity maintained.',
        params: {},
      },
      {
        label: 'Invest in salmon habitat instead \u2014 grow the pie, don\'t fight over slices',
        consequence: 'Massive habitat investment ($500M+). Dam removal, fish passage, hatchery reform. Salmon production increases enough for both seals and orca. But it takes 10-15 years to see results, and SRKW may not have that long.',
        params: { ecosystem: { fishPassageInvestment: 90, eelgrassRestoration: 70, pinnipedCulling: 0 }, psWatersheds: { psHabitatInvestment: 80 } },
      },
    ],
  },
];

export const DILEMMA_COUNT = DILEMMAS.length;

// Check all dilemma triggers against current state
export function checkDilemmas(results, params, firedDilemmaIds) {
  const fired = firedDilemmaIds || new Set();
  const triggered = [];
  for (const d of DILEMMAS) {
    if (fired.has(d.id)) continue;
    try {
      if (d.trigger(results, params)) {
        triggered.push(d);
      }
    } catch (e) { /* trigger evaluation failed — skip */ }
  }
  return triggered;
}
