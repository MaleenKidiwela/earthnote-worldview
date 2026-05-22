import { cl } from './utils.js';

// ═══════════════════════════════════════════════════════════
// ECOSYSTEM SERVICE VALUATION — Salish Sea Digital Cousin
// ═══════════════════════════════════════════════════════════
// ES5 convention. 8 valuation categories based on published estimates.
// Sources: NOAA, Taylor Shellfish, Pacific Whale Watch Assoc, WA DNR,
// Batker et al. 2008 "Ecosystem Services of Puget Sound"

function computeEcosystemServices(ecoState, marineState, portState, urbanState, wsState, P) {
  var es = ecoState || {};
  var ms = marineState || {};
  var ps = portState || {};
  var us = urbanState || {};
  var ws = wsState || {};

  // ── 1. SALMON FISHERY ──
  // Baseline: ~$1,100M/yr commercial + recreational + processing
  // Source: NOAA Fisheries 2022 ($1.1B combined WA+BC salmon economy);
  // EPA 2015 Puget Sound salmon economic analysis; WDFW 2023 commercial harvest report
  // Scales with salmon run strength and fishing pressure
  var salmonIdx = es.salmonRunStrength !== undefined ? es.salmonRunStrength : 48;
  var salmonNorm = cl(salmonIdx / 100, 0, 1);
  var fishPressure = P && P.ecosystem ? (P.ecosystem.fishingPressure !== undefined ? P.ecosystem.fishingPressure : 40) / 100 : 0.4;
  var salmonValue = 1100 * salmonNorm * cl(fishPressure * 1.5, 0.2, 1);
  var salmonJobs = cl(salmonValue * 12, 0, 5000); // ~12 jobs per $M

  // ── 2. SHELLFISH AQUACULTURE ──
  // Baseline: ~$184M/yr (WA Sea Grant 2020, PCSGA; shellfish harvest + aquaculture GDP)
  // Scales with oyster + geoduck + Dungeness populations and water quality
  var oysterPop = es.oysterPop !== undefined ? es.oysterPop : 0.30;
  var geoduckPop = es.geoduckPop !== undefined ? es.geoduckPop : 0.40;
  var dungenessPop = es.dungenessCrabPop !== undefined ? es.dungenessCrabPop : 0.65;
  var wqi = ms.waterQualityIndex !== undefined ? ms.waterQualityIndex : 0.65;
  // Species weighting: oyster 0.3, geoduck 0.3, Dungeness 0.4 (proportional to harvest revenue)
  // WQI scaling: shellfish require clean water for FDA-approved harvest
  // 2× multiplier converts normalized population to economic fraction — PCSGA harvest data 2020
  var shellfishBase = cl((oysterPop * 0.3 + geoduckPop * 0.3 + dungenessPop * 0.4) * wqi * 2, 0, 1);
  var shellfishValue = 184 * shellfishBase;
  // 8 jobs/$M — PCSGA: ~1,500 direct shellfish jobs on $184M industry ≈ 8 jobs/$M
  var shellfishJobs = cl(shellfishValue * 8, 0, 4000);

  // ── 3. WHALE WATCHING ──
  // Baseline: ~$217M/yr (PWWA 2024, Pacific Whale Watch Assoc economic impact study)
  // Scales with orca viability and tourism
  var orcaViab = es.orcaViability !== undefined ? es.orcaViability : 0.5;
  var humpbackPop = es.humpbackPop !== undefined ? es.humpbackPop : 0.35;
  // Bigg's orca sightings increasingly drive whale watching (PWWA: record sightings every year)
  var biggsPop = es.biggsOrcaPop !== undefined ? es.biggsOrcaPop : 0.80;
  var biggsAttract = cl(biggsPop * 0.25, 0, 0.2); // Bigg's hunts are dramatic tourist draws
  // Gray whale spring migration is a major whale watching draw (Calambokidis et al. 2002)
  var grayPop = es.grayWhalePop !== undefined ? es.grayWhalePop : 0.30;
  var grayAttract = cl(grayPop * 0.15, 0, 0.1);
  var cetaceanAttract = cl(orcaViab * 0.50 + humpbackPop * 0.20 + biggsAttract + grayAttract, 0, 1);
  var wwValue = 217 * cetaceanAttract;
  var wwJobs = cl(wwValue * 16, 0, 3000); // whale watching is labor-intensive

  // ── 4. WILDLIFE VIEWING (non-cetacean) ──
  // Baseline: ~$1,700M/yr (USFWS 2016 National Survey: WA+BC wildlife viewing expenditures)
  // Seabirds, pinnipeds, otters, general nature tourism
  var seabirdIdx = es.seabirdIndex !== undefined ? es.seabirdIndex : 0.5;
  var otterPop = es.seaOtterPop !== undefined ? es.seaOtterPop : 0;
  var biodiv = es.biodiversityIndex !== undefined ? es.biodiversityIndex : 0.72;
  var wildlifeAttract = cl(seabirdIdx * 0.3 + biodiv * 0.5 + otterPop * 0.2, 0, 1);
  var wildlifeValue = 1700 * wildlifeAttract;
  var wildlifeJobs = cl(wildlifeValue * 10, 0, 2000);

  // ── 5. BLUE CARBON ──
  // Eelgrass + kelp sequester 0.5-8 tCO2/ha/yr (Howard et al. 2017)
  // Baseline: ~20,000 ha eelgrass at ~2 tCO2/ha/yr = 40,000 t; valued at $50/t
  var eelgrassHealth = es.eelgrassHealth !== undefined ? es.eelgrassHealth : 0.5;
  var kelpHealth = es.kelpHealth !== undefined ? es.kelpHealth : 0.6;
  var eelgrassArea = 20000 * eelgrassHealth; // hectares
  var kelpArea = 5000 * kelpHealth;
  var eelgrassSeq = eelgrassArea * 2; // tCO2/yr
  var kelpSeq = kelpArea * 1; // kelp less permanent burial
  var totalCarbon = eelgrassSeq + kelpSeq;
  var carbonPrice = 50; // $/tCO2 (WA CCA market price ~$50-60)
  var blueCarbon = totalCarbon * carbonPrice / 1e6; // $M
  var blueCarbonTonnes = totalCarbon;

  // ── 6. FLOOD PROTECTION ──
  // Coastal wetlands + eelgrass reduce wave energy 50-70% (Gedan et al. 2011)
  // Baseline: ~$500M/yr avoided damage (Earth Economics 2015, updated from Batker et al. 2008)
  var coastalFlood = us.coastalFloodRisk !== undefined ? us.coastalFloodRisk : 0;
  var protectionHealth = cl(eelgrassHealth * 0.5 + (ws.reservoirLevel !== undefined ? ws.reservoirLevel : 0.75) * 0.3 + (1 - coastalFlood) * 0.2, 0, 1);
  var floodValue = 500 * protectionHealth;

  // ── 7. WATER FILTRATION ──
  // Oyster reefs, wetlands, riparian buffers filter nutrients/contaminants
  // Baseline: ~$2,000M/yr (Earth Economics 2015: Puget Sound ecosystem filtration services)
  var oysterFilt = es.oysterFiltration !== undefined ? es.oysterFiltration : 0;
  var forestCover = ws.effForest !== undefined ? ws.effForest : 0.65;
  // oysterFilt × 2: oyster reefs filter 190 L/day/individual (Zu Ermgassen et al. 2013);
  // 2× amplifies filtration signal since oysterFilt index is normalized low at baseline
  // wqi 0.3, forest 0.3: composite natural filtration capacity weighting
  var filtHealth = cl(oysterFilt * 2 + wqi * 0.3 + forestCover * 0.3, 0, 1);
  var filtValue = 2000 * filtHealth;

  // ── 8. RECREATION ──
  // Beach access, boating, diving, kayaking
  // Baseline: ~$3,000M/yr (WA Tourism Alliance, NOAA coastal recreation reports)
  var recValue_input = es.recreationValue !== undefined ? es.recreationValue : 0.5;
  var airQuality = ws.airQuality !== undefined ? ws.airQuality : 0.85;
  var recHealth = cl(recValue_input * 0.4 + wqi * 0.3 + airQuality * 0.3, 0, 1);
  var recValue = 3000 * recHealth;
  var recJobs = cl(recValue * 15, 0, 8000);

  // ── 9. CULTURAL & SUBSISTENCE (NOT MONETIZED) ──
  // First foods — salmon, shellfish, herring eggs, camas, berries — have cultural
  // and subsistence values that cannot and should not be reduced to dollars.
  // Monetization would imply these values are tradeable, which contradicts
  // Indigenous food sovereignty and treaty rights frameworks.
  // Sources: Turner & Turner 2008, Garibaldi & Turner 2004, NWIFC 2020
  //
  // We track a qualitative index (0-1) based on ecosystem health indicators
  // that affect first foods availability, but we do NOT assign a dollar value.
  var firstFoodsSalmon = cl(salmonNorm, 0, 1);
  var firstFoodsShellfish = cl(shellfishBase, 0, 1);
  var firstFoodsForage = cl((es.herringSpawning !== undefined ? es.herringSpawning : 0.4), 0, 1);
  var culturalSubsistenceIndex = cl(
    firstFoodsSalmon * 0.40     // salmon — central to Coast Salish culture
    + firstFoodsShellfish * 0.30 // shellfish — daily sustenance, gathering practice
    + firstFoodsForage * 0.15   // herring eggs, eulachon — seasonal ceremonies
    + wqi * 0.15,               // water quality — safe to harvest and consume
    0, 1);

  // ── TOTALS ──
  var totalValue = salmonValue + shellfishValue + wwValue + wildlifeValue + blueCarbon + floodValue + filtValue + recValue;
  var totalJobs = salmonJobs + shellfishJobs + wwJobs + wildlifeJobs + recJobs;

  return {
    state: {
      salmonFishery: { value: salmonValue, jobs: salmonJobs },
      shellfishAquaculture: { value: shellfishValue, jobs: shellfishJobs },
      whaleWatching: { value: wwValue, jobs: wwJobs },
      wildlifeViewing: { value: wildlifeValue, jobs: wildlifeJobs },
      blueCarbon: { value: blueCarbon, tonnesCO2: blueCarbonTonnes },
      floodProtection: { value: floodValue },
      waterFiltration: { value: filtValue },
      recreation: { value: recValue, jobs: recJobs },
      culturalSubsistence: {
        index: culturalSubsistenceIndex,
        monetized: false,
        note: 'Cultural and subsistence values are real but not monetized — they are protected by treaty rights, not market mechanisms.',
        components: { salmon: firstFoodsSalmon, shellfish: firstFoodsShellfish, forage: firstFoodsForage, waterQuality: wqi },
      },
      total: { value: totalValue, jobs: totalJobs }
    }
  };
}

export { computeEcosystemServices };
