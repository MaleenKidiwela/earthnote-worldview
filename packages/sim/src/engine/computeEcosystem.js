import { cl, hollingII, hollingIII, hollingIV, ratioDep, seasonalPeak, shiftedPeak, seededRandom } from './utils.js';
import { SALMON_STOCKS, ORCA_PODS, initSalmonState, initOrcaState } from './species-data.js';
import { BASINS, SUBSTRATE } from './basins.js';
import { BENTHIC_SUBSTRATE, TIDAL_CURRENT_STRENGTH, SAND_WAVE_CURRENT_THRESHOLD } from '../config/benthicSubstrate.js';
import { computeOrcaIBM, initOrcaIBM } from './orcaIBM.js';
import { computeSalmonOcean } from './salmonOcean.js';

export function computeEcosystem(P, ms, basins, S, yf, prevEco, dt, oForcing, yearsSince2026, mhw, coupling) {
  // Unpack previous ecosystem state — all stateful species bundled into one object.
  // To add a new species: add field here, in the return object, and in orchestrator carry-forward.
  var _pe = prevEco || {};
  var prevSal = _pe.salmon || initSalmonState();
  var prevOrca = _pe.orca || initOrcaState();
  var prevPinniped = _pe.pinniped || null;
  var prevEelgrass = _pe.eelgrassEstab;
  var prevGreenCrab = _pe.greenCrab;
  var prevDungenessCrab = _pe.dungenessCrab;
  var prevOyster = _pe.oyster;
  var prevForageFish = _pe.forageFish;
  var prevRockfish = _pe.rockfish;
  var prevUrchin = _pe.urchin;
  var prevGeoduck = _pe.geoduck;
  var prevMurrelet = _pe.murrelet;
  var prevHumpback = _pe.humpback;
  var prevSeaOtter = _pe.seaOtter;
  var prevJellyfish = _pe.jellyfish;
  var prevLingcod = _pe.lingcod;
  var prevLamprey = _pe.lamprey;
  var prevPorpoise = _pe.porpoise;
  var prevHerring = _pe.herring;
  var prevBullKelp = _pe.bullKelp;
  // Phase: new functional groups (microbial loop, euphausiids, benthic infauna, epibenthic, epiphytes)
  var prevMicrobial = _pe.microbialLoop;
  var prevEuphausiids = _pe.euphausiids;
  var prevBenthicInfauna = _pe.benthicInfauna;
  var prevEpibenthicCrust = _pe.epibenthicCrust;
  var prevEpiphytes = _pe.epiphytes;
  // Greene review additions: deep urchin reservoir, sand wave integrity
  var prevDeepUrchin = _pe.deepUrchin;
  var prevSandWaveIntegrity = _pe.sandWaveIntegrity;
  // Tier 2/3 additions: sunflower sea star
  var prevSunflowerStar = _pe.sunflowerStar;
  // Bigg's (transient) killer whales — ecologically distinct from SRKW
  var prevBiggs = _pe.biggsOrca;
  // Pteropods (Limacina helicina) — OA canary species
  var prevPteropod = _pe.pteropod;
  // Gray whale (Eschrichtius robustus) — benthic feeder
  var prevGrayWhale = _pe.grayWhale;
  // Shoreline armoring fraction — carried via state contract to break variable-ordering
  // cycle. armoringFrac is defined at :802 (after eelgrassTarget at :360) but eelgrass
  // habitat must read armor pressure (Track A pre-reg, §9 Item A resolution A1).
  var prevArmoringFrac = _pe.armoringFrac;

  var sp=S.oilSpill||0, volcano=S.volcano||0;
  // Coseismic subsidence from specific earthquake types (meters of coastal drop)
  var coseismicSubsidence = ms.coseismicSubsidence !== undefined ? ms.coseismicSubsidence : 0;
  var liquefactionIntensity = ms.liquefactionIntensity !== undefined ? ms.liquefactionIntensity : 0;

  // ── SUBSTRATE SUITABILITY ──
  // Volume-weighted average substrate suitability per species.
  // Each species has preferred substrate types that modify carrying capacity.
  // Sedimentation events (earthquake, lahar) temporarily increase mud fraction.
  var substrateWeights = {
    rockfish:  { rock: 2.0, gravel: 0.5, sand: 0, mud: 0 },
    lingcod:   { rock: 1.5, gravel: 0.8, sand: 0.3, mud: 0 },
    geoduck:   { rock: 0, gravel: 0, sand: 0.5, mud: 1.0 },
    eelgrass:  { rock: 0, gravel: 0, sand: 1.0, mud: 0.6 },
    sandLance: { rock: 0, gravel: 0.3, sand: 1.5, mud: 0 },
    dungeness: { rock: 0, gravel: 0.3, sand: 0.8, mud: 0.6 },
    lamprey:   { rock: 0, gravel: 0, sand: 0.5, mud: 1.0 },
  };
  // Compute volume-weighted substrate suitability
  var totalVol = 0;
  var substrateSuit = {};
  var speciesKeys = Object.keys(substrateWeights);
  for (var si = 0; si < speciesKeys.length; si++) {
    substrateSuit[speciesKeys[si]] = 0;
  }
  var basinKeys = Object.keys(BASINS);
  for (var bi2 = 0; bi2 < basinKeys.length; bi2++) {
    var bk = basinKeys[bi2];
    var bvol = BASINS[bk].vol;
    totalVol += bvol;
    var sub = SUBSTRATE[bk];
    if (!sub) continue;
    // Sedimentation events shift substrate temporarily toward mud
    var quakeSed = (basins && basins[bk] && basins[bk].quakeSediment !== undefined) ? basins[bk].quakeSediment : 0;
    var mudShift = cl(quakeSed * 0.005, 0, 0.3); // up to 30% shift toward mud
    var effRock = cl(sub.rock * (1 - mudShift), 0, 1);
    var effGravel = cl(sub.gravel * (1 - mudShift * 0.5), 0, 1);
    var effSand = cl(sub.sand * (1 - mudShift * 0.3), 0, 1);
    var effMud = cl(sub.mud + mudShift * (sub.rock + sub.gravel * 0.5 + sub.sand * 0.3), 0, 1);
    for (var sj = 0; sj < speciesKeys.length; sj++) {
      var spKey = speciesKeys[sj];
      var w = substrateWeights[spKey];
      var suit = w.rock * effRock + w.gravel * effGravel + w.sand * effSand + w.mud * effMud;
      substrateSuit[spKey] += suit * bvol;
    }
  }
  // Normalize by total volume, then divide by baseline suitability so baseline = 1.0.
  // Baseline values computed from default substrate fractions (no sedimentation events).
  var baselineSuit = { rockfish: 0.379, lingcod: 0.427, geoduck: 0.567, eelgrass: 0.546, sandLance: 0.479, dungeness: 0.526, lamprey: 0.567 };
  if (totalVol > 0) {
    for (var sk2 = 0; sk2 < speciesKeys.length; sk2++) {
      var rawSuit = substrateSuit[speciesKeys[sk2]] / totalVol;
      var baseSuit = baselineSuit[speciesKeys[sk2]] || 0.5;
      substrateSuit[speciesKeys[sk2]] = cl(rawSuit / baseSuit, 0.5, 1.5);
    }
  }

  // ── SAND WAVE INTEGRITY INDEX (Greene et al. 2017, Greene et al. 2020, Baker et al. 2024) ──
  // Sand waves require strong tidal currents (>0.5 m/s) to maintain dynamic structure.
  // Pacific sand lance (Ammodytes personatus) are obligate burrowers in these sand waves.
  // When currents weaken, sedimentation increases, or physical disturbance occurs,
  // sand wave fields degrade → sand lance habitat collapses → cascading food web impacts.
  var prevSWI = (prevSandWaveIntegrity !== undefined && prevSandWaveIntegrity !== null) ? prevSandWaveIntegrity : 0.75;
  // Volume-weighted average sand wave fraction and tidal current from sub-basin data
  var totalSandWaveFrac = 0, totalTidalCurrent = 0, totalSubVol = 0;
  var subKeys = Object.keys(BENTHIC_SUBSTRATE);
  for (var swi = 0; swi < subKeys.length; swi++) {
    var sbk = subKeys[swi];
    var sbData = BENTHIC_SUBSTRATE[sbk];
    var sbCurrent = TIDAL_CURRENT_STRENGTH[sbk] || 0.3;
    // Use sub-basin volume if available, otherwise equal weight
    var sbVol2 = 1;
    totalSandWaveFrac += (sbData.sand_wave || 0) * sbVol2;
    totalTidalCurrent += sbCurrent * sbVol2;
    totalSubVol += sbVol2;
  }
  var avgSandWaveFrac = totalSubVol > 0 ? totalSandWaveFrac / totalSubVol : 0.08;
  var avgTidalCurrent = totalSubVol > 0 ? totalTidalCurrent / totalSubVol : 0.5;
  // Tidal exchange parameter modulates effective current strength
  // Tidal exchange from marine params (via coupling) — modulates effective current for sand waves
  var _cpl = coupling || {};
  var tidalExchangeMod = (_cpl.tidalExchangeRate !== undefined ? _cpl.tidalExchangeRate : 60) / 100;
  // Coupling: nearshore params for benthic protection and dredging restriction
  var _c2 = coupling || {};
  var benthicProtection = (_c2.nearshoreParams && _c2.nearshoreParams.benthicProtection !== undefined) ? _c2.nearshoreParams.benthicProtection / 100 : 0.3;
  var dredgingRestriction = (_c2.nearshoreParams && _c2.nearshoreParams.dredgingRestriction !== undefined) ? _c2.nearshoreParams.dredgingRestriction / 100 : 0.2;
  var effectiveCurrent = avgTidalCurrent * tidalExchangeMod;
  // Current adequacy: ratio of effective current to threshold (0.5 m/s)
  var currentAdequacy = cl(effectiveCurrent / SAND_WAVE_CURRENT_THRESHOLD, 0, 2);
  // Disturbance: dredging, anchoring, cable laying degrade sand waves
  var anthropDisturbance = cl((ms.dredgingImpact !== undefined ? ms.dredgingImpact : 0.1) * (1 - dredgingRestriction) + (1 - benthicProtection) * 0.05, 0, 0.3);
  // Temperature stress on sand lance: stressed >18°C, ramps 0→0.3 across 18–20°C.
  // Path 0 terminal per Amendment 6 §5.24 (Chain B Session 2i). Paper-direct threshold
  // and ramp from Horkan & Baker 2025 (Salish Sea A. personatus experimental,
  // 11°C ambient vs 18°C elevated → reduced activity + condition + mortality) and
  // Tomiyama & Yanagibashi 2004 (A. personatus aestivation-completion 17–20°C;
  // condition-factor decline above 20°C in rearing experiments). Supporting field
  // evidence: Arimitsu et al. 2021 GOA 2014–2016 MHW. Supersedes Greene 2017
  // as primary thermal-stress citation (Round 1/2 verification confirmed 16°C
  // not paper-direct in Greene 2017). See docs/citation-audit-log.md Entry 64 sub-ii.
  var slTempStress = ms.sst > 18 ? cl((ms.sst - 18) * 0.15, 0, 0.3) : 0;
  // Sand wave integrity target
  var swiTarget = cl(currentAdequacy * 0.5 + avgSandWaveFrac * 2.0 - anthropDisturbance - slTempStress - sp * 0.3, 0, 1);
  // Slow dynamics: sand waves rebuild over years, degrade over months
  var swiRate = swiTarget > prevSWI ? 0.03 : 0.12; // recover slowly, degrade faster
  var sandWaveIntegrity = cl(prevSWI + (swiTarget - prevSWI) * swiRate * dt, 0, 1);

  // ── DETAILED BENTHIC SUBSTRATE SUITABILITY (Greene & Barrie 2011) ──
  // Enhanced species-substrate coupling using sub-basin-level data
  // Rocky reef fraction: volume-weighted average for rockfish/lingcod habitat
  var totalRockyReef = 0, totalMudFrac = 0;
  for (var bsi = 0; bsi < subKeys.length; bsi++) {
    totalRockyReef += (BENTHIC_SUBSTRATE[subKeys[bsi]].rocky_reef || 0);
    totalMudFrac += (BENTHIC_SUBSTRATE[subKeys[bsi]].mud || 0);
  }
  var avgRockyReef = totalSubVol > 0 ? totalRockyReef / totalSubVol : 0.15;
  var avgMudFrac = totalSubVol > 0 ? totalMudFrac / totalSubVol : 0.4;
  // Substrate quality modifiers (applied to species K below)
  var rockyReefQuality = cl(avgRockyReef / 0.15, 0.5, 2.0); // normalized: 1.0 at 15% reef
  var sandWaveQuality = cl(sandWaveIntegrity * avgSandWaveFrac / 0.08, 0.3, 2.0); // normalized: 1.0 at 8% with full integrity
  var mudHabitatQuality = cl(avgMudFrac / 0.40, 0.5, 1.5); // normalized: 1.0 at 40% mud

  // ── DILBIT/OIL BENTHIC SMOTHERING (Greene & Aschoff 2023) ──
  // Dilbit is sinkable — reaches the seafloor unlike conventional crude.
  // Smothers sand wave fields, rocky reefs, eelgrass, shellfish beds.
  // Recovery: 5-20 years for benthic habitats.
  var dilbitSmothering = (S.dilbitSpill !== undefined ? S.dilbitSpill : 0);
  if (dilbitSmothering > 0) {
    // Sand waves: dilbit fills interstitial spaces, destroying burrowing habitat
    sandWaveIntegrity = cl(sandWaveIntegrity - dilbitSmothering * 0.4, 0, 1);
    sandWaveQuality = cl(sandWaveQuality - dilbitSmothering * 0.5, 0.1, 2.0);
    // Rocky reef: dilbit coats surfaces, suffocating sessile organisms
    rockyReefQuality = cl(rockyReefQuality - dilbitSmothering * 0.3, 0.3, 2.0);
    // Mud habitat: less affected (already anoxic at depth)
    mudHabitatQuality = cl(mudHabitatQuality - dilbitSmothering * 0.1, 0.3, 1.5);
  }

  // ── BIOACCUMULATION MODEL ──
  // Persistent organic pollutants (PCBs, PBDEs, mercury) biomagnify up the food chain.
  // Each trophic level accumulates roughly BMF× the concentration of the level below.
  // Hickie et al. 2007, Ross et al. 2000 — PCBs in SRKW.
  var waterContam = ms.contaminationLevel !== undefined ? ms.contaminationLevel : 0.15;
  var waterPCB = ms.pcb !== undefined ? ms.pcb : 0.12;
  var BMF = 1.6; // effective biomagnification factor per trophic level step (index-scale)
  // Combined index: 60% general contamination + 40% PCBs (most bioaccumulative)
  var baseContam = waterContam * 0.6 + waterPCB * 0.4;
  // Tissue contaminant burden per trophic level
  var tissueContam = {
    phytoplankton: cl(baseContam, 0, 1),
    eelgrass: cl(baseContam, 0, 1),
    zooplankton: cl(baseContam * Math.pow(BMF, 1), 0, 1),
    oyster: cl(baseContam * Math.pow(BMF, 1), 0, 1),
    geoduck: cl(baseContam * Math.pow(BMF, 1), 0, 1),
    herring: cl(baseContam * Math.pow(BMF, 2), 0, 1),
    sandLance: cl(baseContam * Math.pow(BMF, 2), 0, 1),
    surfSmelt: cl(baseContam * Math.pow(BMF, 2), 0, 1),
    dungeness: cl(baseContam * Math.pow(BMF, 2), 0, 1),
    rockfish: cl(baseContam * Math.pow(BMF, 2.5), 0, 1),
    salmon: cl(baseContam * Math.pow(BMF, 3), 0, 1),
    lingcod: cl(baseContam * Math.pow(BMF, 3), 0, 1),
    pinniped: cl(baseContam * Math.pow(BMF, 3.5), 0, 1),
    orca: cl(baseContam * Math.pow(BMF, 4), 0, 1),
    // Bigg's eat pinnipeds (TL 3.5) → one extra BMF step above SRKW (which eat salmon TL 3)
    // Ross et al. 2000 (Mar. Pollut. Bull. 40:504-515): SRKW males 146.3 mg/kg lipid,
    // SRKW females 55.4 mg/kg lipid; Biggs/transient males 251.2 mg/kg lipid,
    // transient females 58.8 mg/kg lipid. Mongillo et al. 2016 (NOAA Tech Memo
    // NMFS-NWFSC-135): SRKW 2008-2013 range 30 ± 31 ppm. One extra BMF step for
    // biggsOrca (TL 4.5) vs SRKW (TL 4.0) reflects empirical trophic-position
    // difference; index-scale compression does not preserve real-world magnitude ratios.
    biggsOrca: cl(baseContam * Math.pow(BMF, 4.5), 0, 1),
    humpback: cl(baseContam * Math.pow(BMF, 2.5), 0, 1)
  };

  // ── PTEROPOD (Limacina helicina) — Ocean Acidification Canary ──
  // Aragonite-shelled zooplankton. Shell dissolves when Omega_ar < 1.0, stress begins at 1.5.
  // Key prey for juvenile salmon (estuary/nearshore), herring larvae, and forage fish.
  // Completes the OA chain: CO2 → DIC → low Omega_ar → pteropod decline → less prey for
  // juvenile salmon → fewer returning adults → less food for SRKW.
  // Sources: Bednaršek et al. 2014 (first documented OA biological impact), Busch et al. 2014
  var prevPter = (prevPteropod !== undefined && prevPteropod !== null) ? prevPteropod : 0.65;
  var omegaAr = ms.omegaAragonite !== undefined ? ms.omegaAragonite : 2.0;
  // Shell dissolution: severe below 1.0, stress begins at 1.5 (Bednaršek et al. 2014)
  var pterShellStress = omegaAr < 1.0 ? cl((1.0 - omegaAr) / 0.5 * 0.5, 0, 0.5) : omegaAr < 1.5 ? cl((1.5 - omegaAr) / 0.5 * 0.15, 0, 0.15) : 0;
  var pterFood = cl((ms.phyto || 500) / 800, 0.2, 1.2); // phytoplankton-dependent
  var pterK = cl(pterFood * (1 - pterShellStress) * 0.8 + 0.15, 0.05, 1.0);
  var pterGrowth = 0.40 * prevPter * (1 - prevPter / Math.max(pterK, 0.05)) * 0.25 * dt;
  var pterTempStress = ms.sst > 13 ? cl((ms.sst - 13) / 7, 0, 0.3) : 0; // warm water stress
  var pterMort = (pterShellStress * 0.3 + pterTempStress * 0.08 + sp * 0.2) * prevPter * 0.25 * dt;
  // Predation: pteropods consumed by forage fish, herring, juvenile salmon
  // Use prev-quarter values since forage fish/herring not yet computed this step
  var _prevFF = _pe.forageFish ? (_pe.forageFish.sandLance || 0.5) : 0.4;
  var _prevHerr = (typeof _pe.herring === 'object' && _pe.herring !== null) ? (_pe.herring.adult || 0.3) : (typeof _pe.herring === 'number' ? _pe.herring : 0.3);
  var pterPredation = cl(_prevFF * 0.03 + _prevHerr * 0.02, 0, 0.05) * prevPter * 0.25 * dt;
  var pteropodPop = cl(prevPter + pterGrowth - pterMort - pterPredation, 0, 1.5);
  // Pteropod availability boosts juvenile salmon survival (Busch et al. 2014)
  var pteropodPreyBonus = cl(pteropodPop * 0.06, 0, 0.05); // up to +5% juvenile survival

  // ── MARINE HEAT WAVE amplifies thermal stress nonlinearly ──
  var mhwActive = mhw ? mhw.active : 0;
  var mhwIntensity = mhw ? mhw.intensity || 0 : 0;
  var oS=ms.dissolvedOxygen<5?Math.pow((5-ms.dissolvedOxygen)/5,1.5):0;
  // MHW creates severe nonlinear thermal stress beyond gradual warming
  var tS=ms.sst>13?Math.pow((ms.sst-13)/7,1.3):0;
  if (mhwActive) tS = cl(tS + mhwIntensity * 0.25, 0, 1); // additional acute thermal stress
  var aS=ms.pH<7.75?Math.pow((7.75-ms.pH)/0.75,1.4):0;
  // Ω_aragonite-enhanced acid stress: low Ω directly threatens calcifying organisms
  var omegaStress = (ms.omegaAragonite !== undefined && ms.omegaAragonite < 1.5) ? cl((1.5 - ms.omegaAragonite) / 1.2, 0, 0.4) : 0;
  aS = cl(aS + omegaStress, 0, 1);
  var shellfishViab = ms.shellfishViability !== undefined ? ms.shellfishViability : 1.0;
  // Frequency-dependent noise: extract per-band from noiseProfile if available
  var _np = ms.noiseProfile || null;
  var noiseLow = _np ? (_np.low !== undefined ? _np.low : ms.noiseIndex) : ms.noiseIndex;
  var noiseMid = _np ? (_np.mid !== undefined ? _np.mid : ms.noiseIndex) : ms.noiseIndex;
  var noiseHigh = _np ? (_np.high !== undefined ? _np.high : ms.noiseIndex) : ms.noiseIndex;
  var noiseImpulse = _np ? (_np.impulse !== undefined ? _np.impulse : 0) : 0;
  var nS=ms.noiseIndex>0.6?(ms.noiseIndex-0.6)*1.5:0;
  var spS=sp*0.9, totalStress=cl(oS+tS+aS+nS*0.5+spS+volcano*0.2,0,1);
  var stressMult=Math.pow(1-totalStress,1.1), pb=P.protectedAreaFraction/100*0.3;
  var bi=cl(P.baselineBiodiversity/100*stressMult*(1+pb),0,1);

  // ── SEASONAL PHENOLOGY ──
  // Biological timing drives marine productivity. Climate change shifts phenology
  // at different rates for different species, causing mismatches.
  // Mackas et al. 2012, Crozier et al. 2008, Edwards & Richardson 2004.
  var quarter = (yf % 1) * 4; // continuous 0-4 within the year
  var climateWarming = ms.sst > 11.3 ? ms.sst - 11.3 : 0; // anomaly above 2024 baseline SST

  // Spring bloom: peaks Q1 (spring), shifts earlier with warming
  var bloomMod = shiftedPeak(quarter, 1.0, 0.8, climateWarming, 3);

  // Zooplankton response: peaks slightly after bloom, shifts slower
  var zooPeakMod = shiftedPeak(quarter, 1.2, 0.7, climateWarming, 2);

  // Herring spawning: late winter/early spring, narrow window
  var herringSpawnMod = shiftedPeak(quarter, 0.5, 0.6, climateWarming, 5);

  // Salmon smolt outmigration: spring, narrow window
  var smoltOutMod = shiftedPeak(quarter, 1.0, 0.5, climateWarming, 4);

  // Orca summer residency: peaks mid-summer
  var orcaSeasonMod = shiftedPeak(quarter, 2.0, 1.0, climateWarming, 2);

  // Dungeness crab molting: spring-summer
  var crabMoltMod = seasonalPeak(quarter, 1.5, 0.8);

  // Phenological mismatch: how much climate has disrupted timing synchrony
  var bloomZooMismatch = Math.abs(bloomMod - zooPeakMod);
  var smoltFoodMismatch = Math.abs(smoltOutMod - zooPeakMod);
  var herringBloomMismatch = Math.abs(herringSpawnMod - bloomMod);
  // Orca-salmon seasonal overlap
  var salmonPeakMod = shiftedPeak(quarter, 2.4, 0.8, climateWarming, 3);
  var orcaSalmonMismatch = Math.abs(orcaSeasonMod - salmonPeakMod);

  var phenoMismatchIndex = cl(
    bloomZooMismatch * 0.3 +
    smoltFoodMismatch * 0.3 +
    herringBloomMismatch * 0.2 +
    orcaSalmonMismatch * 0.2,
    0, 1);

  // ── MICROBIAL LOOP (bacteria + microzooplankton) ──
  // Calbet & Landry 2004: microzooplankton graze 60-75% of daily PP globally
  // Kirchman et al. 2009: bacterial growth Q10 ~2.2
  // Processes 40-60% of primary production in Salish Sea
  var prevMicro = (prevMicrobial !== undefined && prevMicrobial !== null) ? prevMicrobial : 1.0;
  var detritusFrac = (ms.zoo !== undefined ? ms.zoo : 200) / 400; // detrital food availability
  var microTemp = 1 + (ms.sst - 10) * 0.05; // Q10 ~2.2 — warm = faster bacterial growth
  var microO2Limit = ms.dissolvedOxygen > 3 ? 1 : cl(ms.dissolvedOxygen / 3, 0.1, 1); // bacteria need some O2 (aerobic)
  var microbialTarget = cl(detritusFrac * microTemp * microO2Limit * (1 - sp * 0.2), 0.2, 2.0);
  var microbialLoop = cl(prevMicro * 0.85 + microbialTarget * 0.15, 0.1, 2.0);
  // Microbial respiration reduces detritus pool (feeds back to zoo/phyto dynamics)
  var microbialRespiration = microbialLoop * 0.08; // fraction of detritus processed per timestep

  // ── INVASIVE EUROPEAN GREEN CRAB (Carcinus maenas) ──
  // Logistic growth modulated by SST. Optimal 12-20°C, zero below 8°C.
  // First detected 2019 in inner Salish Sea, expanding rapidly with warming.
  // Destroys eelgrass roots, preys on juvenile bivalves and Dungeness crab.
  var prevGC = (prevGreenCrab !== undefined && prevGreenCrab !== null) ? prevGreenCrab : 0.003;
  var gcSST = ms.sst;
  // SST-dependent carrying capacity: optimal 12-20°C, zero below 8°C
  var gcThermalSuit = gcSST < 8 ? 0 : gcSST < 12 ? cl((gcSST - 8) / 4, 0, 1) : gcSST <= 20 ? 1 : cl(1 - (gcSST - 20) / 5, 0, 1);
  // Ballast water reinforcement: higher invasion pressure from shipping boosts green crab K
  var gcInvasiveBoost = cl((ms.invasivePressure || 0) * 0.15, 0, 0.10); // up to +10% K from ballast reinforcement
  var gcK = cl(gcThermalSuit + gcInvasiveBoost, 0, 1.1); // carrying capacity (0-1 density index)
  // Growth rate increases with warming (faster reproduction in warmer water)
  var gcGrowthRate = 0.08 * gcThermalSuit * (1 + cl(gcSST - 12, 0, 8) * 0.05);
  // MHW boosts green crab: warm water = population explosion
  if (mhwActive) gcGrowthRate *= (1 + mhwIntensity * 0.4);
  // Logistic growth. Math.max(K, floor) is a safety net; K is already clamped at
  // computation via cl(). This pattern repeats for all 15+ species growth blocks.
  var gcGrowth = gcGrowthRate * prevGC * (1 - prevGC / Math.max(gcK, 0.01)) * 0.25 * dt;
  // Removal effort: proportional to effort × current population
  var gcRemoval = (P.greenCrabRemoval !== undefined ? P.greenCrabRemoval : 10) / 100;
  var gcRemoved = gcRemoval * prevGC * 0.2 * dt; // 20% of population removable per quarter at 100% effort
  // Cold-water mortality: green crabs die below 8°C (thermal minimum)
  var gcColdMort = gcSST < 8 ? cl((8 - gcSST) / 4 * 0.15, 0, 0.15) * prevGC * dt : 0;
  var greenCrabPop = cl(prevGC + gcGrowth - gcRemoved - gcColdMort, 0, 1);
  // Green crab damage to eelgrass: crabs shred roots, proportional to population density
  var gcEelgrassDamage = greenCrabPop * 0.25; // up to 25% eelgrass suppression at max density

  // ── EELGRASS HYSTERESIS MODEL ──
  // Eelgrass establishment (0-1) represents root system density / seedbank viability.
  // Declines rapidly under stress (0.15/yr) but recovers very slowly (0.02/yr).
  // Below 0.3: regime shift — seedbank depleted, recovery rate near-zero.
  var prevEstab = (prevEelgrass !== undefined && prevEelgrass !== null) ? prevEelgrass : 0.7;

  // Target eelgrass health from current conditions (what equilibrium would be)
  var mhwEelgrassHit = mhwActive ? mhwIntensity * 0.15 : 0;
  // Coseismic subsidence drowns intertidal eelgrass fringe (1m drop = ~15% habitat loss)
  var subsidenceEelgrassLoss = cl(coseismicSubsidence * 0.10, 0, 0.30);
  // Armor penalty on eelgrass habitat. Mechanism: substrate coarsening, sediment-delivery
  // disruption, coastal squeeze (Dethier et al. 2016; Thom et al. 2011; Short & Neckles 1999).
  // Coefficient k=0.15 is equation-internal-consistency-bounded within [0.05, 0.30] per
  // hero-cascade-track-a-preregistration.md §4 — literature supports direction but not
  // magnitude; empirical magnitude selected from hindcast over k ∈ {0.10, 0.15, 0.20}.
  // Uses prev-quarter armoringFrac to break variable-ordering cycle (defined at :802,
  // read here at :360) per pre-reg §9 Item A resolution A1.
  var prevArmor = (prevArmoringFrac !== undefined && prevArmoringFrac !== null) ? prevArmoringFrac : 0.30;
  var eelgrassTarget = cl((0.7 * substrateSuit.eelgrass) - ms.turbidity/30*0.3 - tissueContam.eelgrass*0.2 - (1-bi)*0.15
    + P.protectedAreaFraction/100*0.2 - sp*0.3 - mhwEelgrassHit - gcEelgrassDamage - subsidenceEelgrassLoss - prevArmor*0.15, 0, 1);

  // Asymmetric rate dynamics
  var declineRate = 0.15;    // per year — fast (turbidity, MHW, contamination, green crab)
  var recoveryRate = 0.02;   // per year — very slow (root regrowth, seedling establishment)
  // ── EELGRASS RESTORATION (EU DTO nature-based solution pattern) ──
  // Active restoration: transplanting adult shoots, seed broadcasting, sediment stabilization.
  // Boosts recovery rate up to 5× at 100% effort. Also reduces effective turbidity by up to 15%
  // via sediment trapping in restored beds. Cascading benefits flow through:
  //   eelgrass ↑ → herring spawning habitat ↑ → salmon prey ↑ → orca recovery ↑
  //   eelgrass ↑ → crab juvenile habitat ↑ → Dungeness population ↑
  //   eelgrass ↑ → coastal erosion reduction → property values ↑
  var eelgrassRestoreFrac = cl((P.eelgrassRestoration !== undefined ? P.eelgrassRestoration : 0) / 100, 0, 1);
  var restoreRecoveryBoost = eelgrassRestoreFrac * 0.08; // adds up to 0.08/yr to base 0.02/yr (5× at max)
  var restoreTurbidityReduction = eelgrassRestoreFrac * 0.15; // up to 15% turbidity reduction from sediment trapping
  recoveryRate += restoreRecoveryBoost;
  // Apply turbidity reduction to eelgrass target (restored beds trap sediment)
  eelgrassTarget = cl(eelgrassTarget + restoreTurbidityReduction * 0.2, 0, 1);
  var quarterRate;

  if (eelgrassTarget < prevEstab) {
    // Declining: fast rate, proportional to gap
    quarterRate = -declineRate * 0.25 * (prevEstab - eelgrassTarget);
  } else {
    // Recovering: slow rate, proportional to gap
    var effectiveRecovery = recoveryRate;
    // Regime shift: below 0.3, seedbank is depleted → recovery nearly impossible
    if (prevEstab < 0.3) {
      // Exponential suppression of recovery below threshold
      effectiveRecovery = recoveryRate * Math.pow(prevEstab / 0.3, 3); // drops to ~0 near 0
    }
    quarterRate = effectiveRecovery * 0.25 * (eelgrassTarget - prevEstab);
  }

  var eelgrassEstab = cl(prevEstab + quarterRate * dt, 0, 1);

  // Eelgrass health = establishment × current condition factor
  // Even with good establishment, acute events (spills) still depress health temporarily
  var conditionFactor = cl(1 - sp * 0.4 - mhwEelgrassHit * 0.5, 0.3, 1);
  var eelgrassH = cl(eelgrassEstab * conditionFactor, 0, 1);

  // ── SEA LEVEL RISE ADAPTATION STRATEGY ──
  // Three-way policy tradeoff: hard armoring vs status quo vs living shorelines.
  // Hard armoring (seawalls, riprap) protects property but destroys beach spawning habitat.
  // Living shorelines (oyster reefs, eelgrass buffers, managed retreat) restore habitat
  // but involve property value loss. A sharp policy tradeoff for coastal communities.
  var slrStrategy = (P.slrAdaptation !== undefined ? P.slrAdaptation : 1);
  var slrArmorMod = 0, slrFloodReduction = 0, slrEelgrassMod = 0, slrOysterMod = 0;
  var slrTurbidityMod = 0, slrPropertyLoss = 0, slrSmeltArmorMod = 0, slrCost = 0;
  var slrSandLanceMod = 0;

  if (slrStrategy === 0) {
    // Hard armoring: seawalls and riprap
    slrArmorMod = 0.25;
    slrFloodReduction = 0.40;
    slrEelgrassMod = -0.05;
    slrTurbidityMod = 0.02;
    slrCost = 500;
  } else if (slrStrategy === 2) {
    // Living shorelines: oyster reefs, eelgrass buffers, managed retreat
    slrOysterMod = 0.05;
    slrEelgrassMod = 0.03;
    slrPropertyLoss = 0.08;
    slrSmeltArmorMod = -0.15;
    slrSandLanceMod = 0.03;
    slrFloodReduction = 0.20;
    slrCost = 300;
  }

  // Apply SLR eelgrass modifier post-hoc (SLR block is after eelgrass calculation)
  eelgrassH = cl(eelgrassH + slrEelgrassMod, 0, 1);

  // ── BLUFF EROSION AND BEACH SEDIMENT BUDGET ──
  // Feeder bluffs provide sediment to beaches where forage fish spawn.
  // Armoring bluffs eliminates erosion, starving beaches.
  // Shipman et al. 2010, Dethier et al. 2016.
  // Use tiered SLR from orchestrator if available, fallback to climate-warming proxy
  var slrRate = ms.slrRateMmYr !== undefined ? cl(ms.slrRateMmYr / 1000, 0, 0.03) : cl(climateWarming * 0.003, 0, 0.02); // meters/year SLR rate
  var baseErosionRate = 0.3; // meters/year base retreat
  var slrAcceleration = cl(slrRate * 0.5, 0, 0.3); // SLR accelerates erosion
  // Armoring blocks erosion — slrStrategy: 0=hard armor, 1=status quo, 2=living shoreline
  var armorBlock = slrStrategy === 0 ? 0.70 : slrStrategy === 2 ? 0.20 : 0.40;
  var effectiveErosion = baseErosionRate * (1 + slrAcceleration) * (1 - armorBlock);

  // Beach sediment budget: river input + bluff erosion
  var riverSedInput = cl(ms.turbidity / 20, 0, 0.5); // proxy for watershed sediment via turbidity
  var bluffSedInput = cl(effectiveErosion / 0.5, 0, 0.5);
  var beachHealth = cl(riverSedInput + bluffSedInput, 0, 1);

  // Coastal squeeze: armored beaches can't migrate inland under SLR
  // Hard armoring causes the worst squeeze; living shorelines allow some migration
  var coastalSqueeze = slrStrategy === 0 ? cl(slrRate * 50, 0, 0.5) : slrStrategy === 2 ? cl(slrRate * 20, 0, 0.3) : cl(slrRate * 35, 0, 0.4);

  // Beach health directly controls forage fish spawning habitat
  // Applied to surf smelt (upper-beach) and sand lance (nearshore sand) in their species blocks below

  var light = cl(1 - ms.turbidity/40, 0.1, 1);

  // ── EPIPHYTES AND BIOFILM ──
  // Williams & Ruckelshaus 1993: nutrient enrichment → epiphyte overgrowth → eelgrass decline
  // Neckles et al. 1993: epiphytes reduce light to eelgrass by 30-80% at high nutrient loads
  var prevEpi = (prevEpiphytes !== undefined && prevEpiphytes !== null) ? prevEpiphytes : 0.5;
  var nutrientDrive = cl((ms.nutrientConcentration||5) / 15, 0.2, 1.5); // high nutrients = more epiphytes
  var epiSubstrate = cl(eelgrassEstab * 0.5 + (prevBullKelp !== undefined ? prevBullKelp : 0.5) * 0.3 + 0.2, 0.2, 1.2);
  var epiLight = cl(1 - ms.turbidity / 40, 0.3, 1); // need light to photosynthesize
  var epiTarget = cl(nutrientDrive * epiSubstrate * epiLight * (1 + (ms.sst - 10) * 0.03), 0.1, 2.0);
  var epiphyteBiomass = cl(prevEpi * 0.88 + epiTarget * 0.12, 0.05, 2.0);
  // Epiphyte shading feedback on eelgrass (high epiphytes reduce light reaching eelgrass)
  var epiphyteShadingPenalty = cl((epiphyteBiomass - 0.8) * 0.15, 0, 0.3); // only kicks in above threshold

  // ── SUNFLOWER SEA STAR (Pycnopodia helianthoides) ──
  // Historically the dominant urchin predator — functionally extinct since 2013 SSWD outbreak.
  // IUCN 2020: Critically Endangered. Recovery extremely slow (r=0.03).
  // When present: controls urchin populations → prevents urchin barrens → protects kelp.
  // Disease recurrence: warm SST triggers new outbreaks (Harvell et al. 2019 PNAS).
  // Montecino-Latorre et al. 2016: SSWD linked to warm anomalies.
  var prevSS = (prevSunflowerStar !== undefined && prevSunflowerStar !== null) ? prevSunflowerStar : 0.02; // ~2% of historical
  // SSWD recurrence risk: warm SST triggers new outbreaks
  var sswdRecurrence = ms.sst > 14 ? cl((ms.sst - 14) * 0.08, 0, 0.3) : 0;
  var sswdMort = sswdRecurrence * prevSS * 0.25 * dt;
  // Recovery: extremely slow, limited by low starting population + Allee effects
  var ssK = cl(0.6 * bi * rockyReefQuality, 0.01, 0.6);
  var ssGrowth = 0.03 * prevSS * (1 - prevSS / Math.max(ssK, 0.01)) * 0.25 * dt;
  // Protected areas help: less bycatch, less disturbance
  var ssProtectionBonus = cl(P.protectedAreaFraction / 100 * 0.01, 0, 0.005) * dt;
  var sunflowerStarPop = cl(prevSS + ssGrowth - sswdMort + ssProtectionBonus, 0, 1);

  // ── SEA URCHIN (Strongylocentrotus spp.) — SHALLOW + DEEP RESERVOIR ──
  // Purple and red urchins are the primary grazers controlling kelp forest extent.
  // After sea star wasting disease (SSWD, 2013-14) killed 90% of sunflower stars
  // (their main predator), urchin populations exploded → urchin barrens replaced kelp.
  // This is a documented regime shift on the US West Coast.
  // Urchin barrens: when urchin pop > ~0.6, overgrazing eliminates kelp canopy.
  //
  // DEEP-WATER URCHIN RESERVOIR (Greene submersible observations, 2018 OceanGate/FHL)
  // Deep-water red urchins (Mesocentrotus franciscanus, >100m) feed on drift kelp that
  // sinks from shallow forests. Red urchins are the PNW species persistent at depth;
  // purple urchins (Strongylocentrotus purpuratus) mostly stay shallower. This
  // population acts as a recruitment reservoir: when shallow urchins are depleted
  // (by otters, harvest, or disease), deep populations slowly replenish them.
  // Creates more realistic recovery dynamics for the urchin-kelp-otter trophic cascade.
  // Quantitative parameters (0.4 food fraction, 0.10 growth, 0.02 recruitment,
  // 3 mg/L DO threshold, 0.05 mortality) are Session 2g Block 10 case (c) grounding
  // gap; Chain B Path selection deferred to Session 2h.
  var prevUrch = (prevUrchin !== undefined && prevUrchin !== null) ? prevUrchin : 0.45;
  var prevDeepUrch = (prevDeepUrchin !== undefined && prevDeepUrchin !== null) ? prevDeepUrchin : 0.35;
  // Carrying capacity: urchins thrive on rocky reef with algae. Limited by food (kelp) at high density.
  var urchinFood = cl(prevBullKelp !== undefined ? prevBullKelp : 0.5, 0.05, 1); // prev quarter's kelp (breaks circular dep: urchin→kelp→urchin)
  // Urchin predation: driven by sunflower sea star population (Pycnopodia helianthoides)
  // Pre-SSWD: sea stars controlled urchins. Post-SSWD: urchin explosion → kelp barrens.
  // Recovery of sea stars restores top-down control (Harvell et al. 2019).
  var ssStarPredation = cl(sunflowerStarPop * 0.8, 0, 0.5); // sea stars are voracious urchin predators
  var urchinPredation = cl(ssStarPredation + bi * 0.15, 0.1, 0.6);
  var urchinK = cl(0.8 - urchinPredation * 0.4, 0.2, 0.9); // high K when predators are absent
  var urchinGrowthRate = 0.18 * cl(urchinFood, 0.1, 1);
  var urchinGrowth = urchinGrowthRate * prevUrch * (1 - prevUrch / Math.max(urchinK, 0.1)) * 0.25 * dt;
  // Harvest: urchin fishery (uni export to Japan, ~$5M/yr but growing)
  var urchinHarvest = Math.max(0, prevUrch - 0.2) * (P.fishingPressure / 100) * 0.05 * dt;
  // Thermal stress: purple urchins tolerate wide range, but MHW can cause mass mortality
  var urchinMHWMort = mhwActive ? mhwIntensity * 0.05 * prevUrch * dt : 0;
  // Sea otter predation: if otters present, they are voracious urchin predators (keystone effect)
  // Uses prevSeaOtter to avoid circular dependency — otter model computed later
  var prevOtterPop = (prevSeaOtter !== undefined && prevSeaOtter !== null) ? prevSeaOtter : 0;
  // Sea otter → urchin: Type II RETAINED — otters are specialist foragers that
  // methodically clean urchin patches. Classic Type II. Estes et al. 1978.
  var otterUrchinPredation = hollingII(prevUrch, 0.35, 0.25) * prevOtterPop * 0.25 * dt;
  // Deep-to-shallow red urchin adult migration rate, 0.02 proportional coefficient.
  // Path 4 model-construction disclosure per Amendment 6 §5.24(d) (Chain B Session 2i
  // Entry 70 sub-iii). 0.02 model-construction choice within the Rogers-Bennett et al.
  // 1995 framework: asymmetric juvenile recruitment pattern (28% at 5m shallow vs 2%
  // at 11m intermediate depth) and 12x higher adult-juvenile sheltering in shallow
  // habitats imply shallow-biased population flow, but the specific deep-to-shallow
  // adult migration RATE is not quantified at this specificity in the literature. No
  // paper-direct value exists; extended §5.9 3-stream exhaustion (Session 2i Entry 70
  // Path 0 search) confirmed absence.
  // Recruitment rate: ~2% per quarter when shallow < deep (slow larval settlement and migration)
  var deepToShallowRecruit = prevUrch < prevDeepUrch ? cl((prevDeepUrch - prevUrch) * 0.02, 0, 0.03) * dt : 0;
  var urchinPop = cl(prevUrch + urchinGrowth - urchinHarvest - urchinMHWMort - otterUrchinPredation + deepToShallowRecruit, 0, 1);

  // Deep-water urchin population (>100m): feeds on drift kelp, no otter predation, no harvest
  // Drift kelp food: proportional to bull kelp health above (sinking detritus)

  // Deep-water red urchin food availability (deep relative to shallow), 0.4 multiplier.
  // Path 4 model-construction disclosure per Amendment 6 §5.24(d) (Chain B Session 2i
  // Entry 70 sub-iii). 0.4 model-construction choice within a framework bounded by:
  // (lower) Rogers-Bennett et al. 1995 open-coast Bodega Bay gonad ratios deep/shallow
  // ~0.19 (63±30g shallow vs 12±8g deep), consistent with literature consensus of ~0.25
  // (Basch & Tegner 2007, Carney 1991); (upper) Lowe & Galloway 2020 Salish-Sea-specific
  // observations of 15.4 g drift captured per urchin per day at mesophotic edge with 24%
  // drift-capture rate across depth column, contrasting the open-coast decline pattern.
  // 0.4 selected closer to the Salish Sea end of the range reflecting the Digital Cousin's
  // system-specific scope. No paper-direct value at this specificity exists for Salish Sea
  // deep-water red urchin relative food availability; extended §5.9 3-stream exhaustion
  // (Session 2i Entry 70 Path 0 search) confirmed absence. See docs/citation-audit-log.md
  // Entry 70 sub-iii close for full search record.
  var deepUrchinFood = cl(urchinFood * 0.4, 0.05, 0.6); // receives ~40% of drift kelp

  // Deep-water red urchin dissolved-oxygen functional (grazing) response.
  // Path 0 terminal per Amendment 6 §5.24(b) revised preference order + structural
  // refactor (Chain B Session 2i Entry 70 sub-iii). Paper-direct from Low & Micheli 2018
  // (MEPS 594:165-173, DOI 10.3354/meps12558): M. franciscanus species-specific grazing
  // rate decline of 39-47% at 5.5 mg/L DO (sublethal functional impairment). Midpoint
  // 0.43 decline used. Applied to the food-intake/grazing pathway (via deepUrchinFood
  // multiplier into deepUrchinK) rather than the mortality pathway, reflecting the
  // paper's explicit distinction between sublethal functional impacts and lethal effects.
  // See also `deepDOLethal` for the mortality pathway reparameterization.
  var deepDOGrazing = { threshold: 5.5, decline: 0.43 };
  var deepDOGrazingFactor = ms.dissolvedOxygen < deepDOGrazing.threshold
    ? cl(1 - deepDOGrazing.decline * (1 - ms.dissolvedOxygen / deepDOGrazing.threshold), 1 - deepDOGrazing.decline, 1)
    : 1;

  // Deep-water red urchin carrying capacity (deep relative to shallow), 0.6 multiplier.
  // Path 4 model-construction disclosure per Amendment 6 §5.24(d) (Chain B Session 2i
  // Entry 70 sub-iii). 0.6 model-construction choice within the Lowe & Galloway 2020
  // framework: Salish-Sea-specific observations of red urchin persistence to 284 m depth
  // with drift-supported food availability qualitatively support non-trivial carrying
  // capacity at depth relative to shallow. No paper-direct carrying-capacity coefficient
  // exists in the literature at this specificity; extended §5.9 3-stream exhaustion
  // (Session 2i Entry 70 Path 0 search) confirmed absence.
  var deepUrchinK = cl(0.6 * cl(deepUrchinFood * deepDOGrazingFactor, 0.1, 1) * rockyReefQuality, 0.15, 0.7);

  // Deep-water red urchin growth rate, 0.10 annual coefficient.
  // Path 4 terminal model-construction disclosure per Amendment 6 §5.24(d) (Chain B
  // Session 2i Entry 70 sub-iii). 0.10 is a simplified population-level representation
  // within the size-structured-growth framework established by Rogers-Bennett, Rogers,
  // Bennett & Ebert 2003 (six-growth-function comparative analysis, n=211 N. California
  // tag-recapture) and Zhang, Campbell & Bureau 2008 (BC tetracycline-tagging study,
  // 10-18.5 years to 90mm fishery recruitment depending on location). Literature uses
  // size-structured models (Tanaka, von Bertalanffy, logistic dose-response, Gompertz,
  // Richards, Gaussian) with parameters that don't map to a scalar annual growth
  // coefficient. No paper-direct value at this specificity exists; Rogers-Bennett et al.
  // 2003 additionally found that individual variation in growth dominated spatial
  // variation at shallow and deep sites (F=0.246, n=199, P=0.62), reinforcing the
  // defensibility of a shallow/deep agnostic growth rate at this simplified level.
  // Extended §5.9 3-stream exhaustion (Session 2i Entry 70 Path 0 search) confirmed
  // framework mismatch.
  var deepUrchinGrowth = 0.10 * prevDeepUrch * (1 - prevDeepUrch / Math.max(deepUrchinK, 0.1)) * 0.25 * dt;

  // Deep urchins not affected by otters (too deep) or harvest (not commercially viable at depth)
  // But affected by deep DO and deep temperature

  // Deep-water red urchin dissolved-oxygen lethal response.
  // Path 0 terminal per Amendment 6 §5.24(b) revised preference order + structural
  // refactor (Chain B Session 2i Entry 70 sub-iii). Paper-direct from Low & Micheli 2018
  // (MEPS 594:165-173, DOI 10.3354/meps12558): M. franciscanus species-specific median
  // lethal exposure threshold 1.0 mg/L (severe hypoxia). Red urchins are tolerant of
  // severe hypoxia; lethal effects engage only at 1.0 mg/L threshold. Coefficient 0.20
  // is a model-construction choice for the mortality-ramp steepness below threshold
  // (framework: Low & Micheli 2018 established step-function-like lethal response in
  // experimental exposure, which at population-model timescales is reasonably approximated
  // as a steep linear ramp below threshold). This parameter supersedes the prior combined
  // `deepDOMort` single-threshold representation (3 mg/L, 0.05) which conflated lethal
  // and functional effects into a single model-construction midpoint.
  var deepDOLethal = { threshold: 1.0, coefficient: 0.20 };
  var deepDOLethalMort = ms.dissolvedOxygen < deepDOLethal.threshold
    ? cl((deepDOLethal.threshold - ms.dissolvedOxygen) / deepDOLethal.threshold * deepDOLethal.coefficient, 0, deepDOLethal.coefficient) * prevDeepUrch * dt
    : 0;

  // Loss from recruitment to shallow
  var deepUrchinPop = cl(prevDeepUrch + deepUrchinGrowth - deepDOLethalMort - deepToShallowRecruit, 0, 1);

  // Urchin grazing pressure on kelp: nonlinear — moderate urchins healthy, high urchins → barrens
  // Urchin → kelp: Type II RETAINED — urchins are non-switching grazers that
  // methodically consume kelp. Classic disc equation. Steneck et al. 2002.
  // Only shallow urchins graze kelp (deep urchins are below kelp forests)
  var urchinGrazing = urchinPop > 0.4 ? hollingII(urchinPop - 0.4, 0.50, 0.25) : 0;

  // Bull kelp: severe mortality above 15°C (lethal threshold)
  var kelpThermalMort = ms.sst > 15 ? cl((ms.sst - 15) / 3, 0, 0.6) : 0;
  var bullKelpH = cl(light*0.25 + (1-tS)*0.25 + bi*0.25 - sp*0.3 - volcano*0.15 - kelpThermalMort - urchinGrazing - 0.15, 0, 1);
  var kelpH = (eelgrassH * 0.45 + bullKelpH * 0.55);

  // ── EUPHAUSIIDS (Euphausia pacifica — krill) ──
  // Mackas et al. 2007: dominant krill species in NE Pacific, critical food web link
  // Tanasichuk 1998: cold-water species, stressed above 14°C
  // Vertical migration: surface at night, deep by day — connects surface/deep ecology
  var prevEuph = (prevEuphausiids !== undefined && prevEuphausiids !== null) ? prevEuphausiids : 0.6;
  var euphPhytoFood = cl((ms.phyto !== undefined ? ms.phyto : 500) / 700, 0.2, 1.5); // filter feeders on phytoplankton
  var euphTempStress = ms.sst > 14 ? cl((ms.sst - 14) * 0.15, 0, 0.5) : 0; // cold-water species
  var euphO2Limit = ms.dissolvedOxygen > 4 ? 1 : cl(ms.dissolvedOxygen / 4, 0.2, 1); // sensitive to hypoxia
  var euphUpwelling = oForcing && oForcing.pacUpwellingIntensity !== undefined ? oForcing.pacUpwellingIntensity * 0.3 : 0.15;
  var euphMHWHit = mhwActive ? mhwIntensity * 0.12 : 0; // MHW devastates krill (warm + stratified)
  var euphTarget = cl(euphPhytoFood * (1 + euphUpwelling) * euphO2Limit * (1 - euphTempStress - euphMHWHit - sp * 0.3), 0.1, 1.5);
  var euphausiidBiomass = cl(prevEuph * 0.88 + euphTarget * 0.12, 0.05, 1.5);
  // Euphausiids are prey for herring, salmon, humpback, rockfish (connected below)

  // ── HERRING (Ricker stock-recruitment with depensation and age structure) ──
  // Upgraded from simple logistic to mechanistic Ricker model with:
  //   - Ricker recruitment: R = α * S * exp(-β * S) * depensation * environmental_forcing
  //   - 3 age classes: juvenile (0-1), sub-adult (2-3), adult (4+)
  //   - Spawning habitat fidelity: 0.7 for general stock (some mixing), 0.95 for Cherry Point
  //   - Environmental forcing: SST sensitivity, eelgrass dependency, phenology matching
  // Ricker 1954; Liermann & Hilborn 2001 (depensation); Stick et al. 2014 (Cherry Point)
  var prevHerr = (prevHerring !== undefined && prevHerring !== null) ? prevHerring : 0.35;
  // Unpack age structure (defaults: 40% juv, 35% sub, 25% adult)
  var _ha = (typeof prevHerr === 'object') ? prevHerr : { juv: (prevHerr || 0.35) * 0.40, sub: (prevHerr || 0.35) * 0.35, adult: (prevHerr || 0.35) * 0.25 };
  var prevJuv = _ha.juv !== undefined ? _ha.juv : 0.14;
  var prevSub = _ha.sub !== undefined ? _ha.sub : 0.12;
  var prevAdult = _ha.adult !== undefined ? _ha.adult : 0.09;
  var prevTotal = prevJuv + prevSub + prevAdult;

  // Spawning biomass = adults only (fecundity increases with age)
  var spawningBiomass = prevAdult;
  // Ricker parameters (normalized to 0-1 population index)
  // α = maximum recruitment per unit spawner at low density
  // β = density-dependent recruitment limit
  var herringAlpha = 1.8; // max recruits per spawner at low density (Ricker 1954)
  var herringBeta = 5.5; // density effect (calibrated: equilibrium herringPop ≈ 0.35)
  // Depensation (Allee effect for schooling fish): Liermann & Hilborn 2001
  // Below S_critical, spawning aggregation dissolves → recruitment drops non-linearly
  var herringScrit = 0.03; // 3% of K — below this, schools too small for effective spawning
  var depensation = spawningBiomass / (spawningBiomass + herringScrit);
  // Ricker stock-recruitment
  var rickerR = herringAlpha * spawningBiomass * Math.exp(-herringBeta * spawningBiomass) * depensation;

  // Environmental forcing on recruitment
  // SST: warm water reduces larval survival (-15% per 1°C above 11°C baseline)
  var herringSSTemp = cl(1 - (ms.sst - 11) * 0.15, 0.3, 1.2);
  // Eelgrass: herring deposit eggs on eelgrass blades and macroalgae
  var herringEelgrassEffect = cl(eelgrassEstab * 0.5 + 0.5, 0.3, 1.0);
  // MHW: marine heat waves crash larval survival
  var mhwHerringHit = mhwActive ? mhwIntensity * 0.12 : 0;
  // Impulse noise (pile driving) damages herring eggs during spawning season
  var herringImpulseHit = noiseImpulse * herringSpawnMod * 0.08;
  // Phenology: spawning success depends on timing match with bloom
  var herringSeasonAdj = 0.7 + 0.3 * herringSpawnMod;
  // Combined environmental modifier
  var envModifier = cl(herringSSTemp * herringEelgrassEffect * herringSeasonAdj * (1 - mhwHerringHit - sp * 0.3 - herringImpulseHit), 0.1, 1.5);

  // Spawning fidelity: general Salish Sea herring have moderate mixing between stocks
  // Immigration from other stocks provides a recruitment floor (1-fidelity fraction)
  var herringFidelity = 0.70; // 70% local, 30% immigration from other stocks
  var immigrationRecruit = (1 - herringFidelity) * 0.02 * dt; // small constant immigration
  // Fishing mortality
  var herringFishMort = prevTotal * (P.fishingPressure / 100) * 0.06 * 0.25 * dt;
  // Natural mortality by age class (juvenile > sub-adult > adult)
  var juvMort = prevJuv * 0.20 * 0.25 * dt; // 20%/yr natural mortality
  var subMort = prevSub * 0.12 * 0.25 * dt; // 12%/yr
  var adultMort = prevAdult * 0.15 * 0.25 * dt; // 15%/yr (senescence)

  // Age class transitions: aging per timestep
  // Juvenile → sub-adult: ~50% per year transition (2-year juvenile stage)
  var juvToSub = prevJuv * Math.pow(0.50, dt) * (1 - Math.pow(0.50, dt)); // fraction aging out
  // Sub-adult → adult: ~50% per year (2-year sub-adult stage)
  var subToAdult = prevSub * Math.pow(0.50, dt) * (1 - Math.pow(0.50, dt));

  // New recruits = Ricker × environment + immigration
  var newRecruits = cl(rickerR * envModifier * 0.25 * dt + immigrationRecruit, 0, 0.15);

  // Update age classes
  var newJuv = cl(prevJuv + newRecruits - juvToSub - juvMort, 0, 0.5);
  var newSub = cl(prevSub + juvToSub - subToAdult - subMort, 0, 0.5);
  var newAdult = cl(prevAdult + subToAdult - adultMort - herringFishMort, 0, 0.5);
  var herringPop = cl(newJuv + newSub + newAdult, 0, 1);
  // Store age structure for carry-forward
  var herringAgeStruct = { juv: newJuv, sub: newSub, adult: newAdult, spawningBiomass: newAdult, recruitment: newRecruits, depensation: depensation };

  // ── OYSTERS (Pacific + Olympia) ──
  // Two species: Pacific oyster (Crassostrea gigas, commercial, introduced) and
  // Olympia oyster (Ostrea lurida, native, remnant populations <5% of historical).
  // Primary driver: Ω_aragonite — larval shell formation fails below ~1.5.
  // Also sensitive to: HABs (closure → harvest loss), contamination (tissue accumulation),
  // sedimentation (smothers reefs), and DO (benthic hypoxia kills immobile adults).
  // Key feedback: each oyster filters ~190L/day. Population → water clarity → eelgrass ↑ → herring ↑
  var prevOyst = (prevOyster !== undefined && prevOyster !== null) ? prevOyster : { pacific: 0.50, olympia: 0.08 };
  var oystOmega = ms.omegaAragonite !== undefined ? ms.omegaAragonite : 2.0;
  // Larval survival: sigmoid crash below Ω 1.5 (Barton et al. 2012, Waldbusser et al. 2015)
  var oystLarvalSurv = oystOmega > 2.0 ? 1.0 : oystOmega > 1.5 ? cl((oystOmega - 1.5) / 0.5, 0.3, 1) : cl(oystOmega / 1.5 * 0.3, 0, 0.3);
  // DO stress: sessile adults can't escape benthic hypoxia
  var oystDOStress = ms.dissolvedOxygen < 3 ? 0.3 : ms.dissolvedOxygen < 5 ? cl((5 - ms.dissolvedOxygen) / 2 * 0.15, 0, 0.15) : 0;
  // Sedimentation buries reef structure
  var oystSedStress = cl(ms.turbidity / 30 * 0.15, 0, 0.2);
  // HAB contamination → harvest closures (economic impact, not population)
  var oystHABClosure = cl((ms.habIntensity || 0) * 0.6, 0, 0.6);
  // MHW: warm events stress temperate oysters (>20°C lethal for larvae)
  var oystMHWStress = mhwActive ? mhwIntensity * 0.10 : 0;
  // Microplastic ingestion stress: filter feeders concentrate particles (Desforges et al. 2014)
  // Reduces filtration efficiency, energy allocation to reproduction
  var mpIdx = _cpl.microplasticIndex || 0;
  var oystMPStress = cl(mpIdx * 0.12, 0, 0.12); // up to 12% growth reduction

  // Pacific oyster: robust, fast-growing (r=0.20), high commercial value
  var pacK = cl(oystLarvalSurv * (1 - oystSedStress) * (1 - sp * 0.3) * (1 - oystMPStress) + slrOysterMod, 0.05, 0.8);
  var pacGrowth = 0.20 * prevOyst.pacific * (1 - prevOyst.pacific / Math.max(pacK, 0.05)) * 0.25 * dt;
  var pacMort = (oystDOStress + oystMHWStress + sp * 0.2) * prevOyst.pacific * 0.25 * dt;
  var pacHarvest = Math.max(0, prevOyst.pacific - 0.15) * (P.fishingPressure / 100) * 0.10 * dt;
  var pacificOyster = cl(prevOyst.pacific + pacGrowth - pacMort - pacHarvest, 0, 1);

  // Olympia oyster: native, remnant, very slow recovery (r=0.06), no commercial harvest
  // Protected by restoration efforts — recovery tied to protectedAreaFraction + eelgrass
  var olyHabitatBonus = cl(P.protectedAreaFraction / 100 * 0.3 + eelgrassEstab * 0.2, 0, 0.3);
  var olyK = cl(oystLarvalSurv * 0.5 * (1 - oystSedStress) + olyHabitatBonus, 0.01, 0.5);
  var olyGrowth = 0.06 * prevOyst.olympia * (1 - prevOyst.olympia / Math.max(olyK, 0.01)) * 0.25 * dt;
  var olyMort = (oystDOStress * 1.2 + oystMHWStress + sp * 0.3) * prevOyst.olympia * 0.25 * dt;
  var olympiaOyster = cl(prevOyst.olympia + olyGrowth - olyMort, 0, 1);

  // Combined oyster index and water filtration feedback
  var oysterPop = pacificOyster * 0.6 + olympiaOyster * 0.4; // weighted: Pacific larger biomass
  // Filtration: oysters clear water → reduces effective turbidity for eelgrass + light
  // Each 0.1 oyster pop ≈ 5% turbidity reduction (reef-scale filtration at population densities)
  var oysterFiltration = cl(oysterPop * 0.5, 0, 0.25); // up to 25% turbidity offset
  // Revenue from Pacific oyster harvest ($150M/yr PNW industry)
  var oysterRevenue = pacHarvest * 500; // $M scaling

  // ── GEODUCK (Panopea generosa) ──
  // Longest-lived bivalve on Earth (160+ years). Burrowed 1m deep in subtidal sediment.
  // Major PNW export fishery ($80M/yr, primarily to Asia). Tribal co-managed under
  // Boldt Decision — 50/50 harvest split. Extremely long lifespan means:
  //   1. Very slow recovery from overharvest (r=0.04/yr)
  //   2. Extreme PCB/PFAS bioaccumulation over century-long lifespan
  //   3. Contamination can trigger export market closures → revenue + tribal income loss
  // Sensitive to: substrate disturbance, contamination (tissue), acidification (shell growth)
  var prevGeo = (prevGeoduck !== undefined && prevGeoduck !== null) ? prevGeoduck : 0.40;
  // Habitat: stable subtidal sediment, degraded by dredging and anchor scour
  var geoHabitat = cl(1 - (ms.dredgingImpact !== undefined ? ms.dredgingImpact : 0.1) * 0.3 - ms.turbidity/30 * 0.1, 0.3, 1);
  // Acidification: shell growth impaired below Ω 1.5 (similar to oysters but less acute — adults deep-burrowed)
  var geoOmegaStress = oystOmega < 1.5 ? cl((1.5 - oystOmega) / 0.5 * 0.08, 0, 0.08) : 0;
  // Contamination body burden: bioaccumulated tissue level, affects market access
  var geoContamBurden = cl(tissueContam.geoduck * 0.63 + (ms.pfas !== undefined ? ms.pfas : 0.05) * 0.3, 0, 1);
  // Market closure risk: high contamination → Asian importers reject shipments
  var geoMarketClosure = geoContamBurden > 0.4 ? cl((geoContamBurden - 0.4) / 0.3, 0, 0.8) : 0;
  var geoK = cl(geoHabitat * (1 - geoOmegaStress) * substrateSuit.geoduck, 0.05, 0.7);
  var geoGrowth = 0.04 * prevGeo * (1 - prevGeo / Math.max(geoK, 0.05)) * 0.25 * dt;
  // Harvest: co-managed, proportional to population above threshold
  var geoHarvestable = Math.max(0, prevGeo - 0.15);
  var geoHarvest = geoHarvestable * (P.fishingPressure / 100) * 0.015 * dt;
  var geoduckPop = cl(prevGeo + geoGrowth - geoHarvest - geoOmegaStress * prevGeo * 0.10 * dt - prevOtterPop * 0.15 * prevGeo * 0.25 * dt, 0, 1); // otters dig geoduck
  // Revenue: high value per unit ($80M/yr at healthy pop), but market closures from contamination
  var geoduckRevenue = geoHarvest * 600 * (1 - geoMarketClosure); // $M scaling, reduced by closures

  // ── FORAGE FISH (Sand Lance + Surf Smelt) ──
  // Two species that depend on DIFFERENT habitat than herring:
  // Sand lance (Ammodytes personatus): spawns in sandy subtidal sediment. Destroyed by
  //   dredging, bottom trawling, and sediment contamination. Primary food for murrelets.
  // Surf smelt (Hypomesus pretiosus): spawns on upper-beach gravel. Destroyed by
  //   shoreline armoring (seawalls, bulkheads, riprap). 53% of Puget Sound shoreline is armored.
  // Together with herring, these form the three pillars of the forage base.
  // New cascade: shoreline armoring → spawning habitat loss → forage collapse → seabird/salmon/orca
  var prevFF = (prevForageFish !== undefined && prevForageFish !== null) ? prevForageFish : { sandLance: 0.55, surfSmelt: 0.50 };
  // Shoreline armoring proxy: inverse of riparian buffer + impervious surface pressure
  // High impervious + low riparian buffer = heavily armored shoreline
  // housingArmorDelta (Track B Amendment 1): orchestrator-supplied sound-wide delta
  // from shorelineCoupling.computeArmorDynamics (devPressure × housingPressure × ...).
  // Additive term unifies the two armor proxies at state-contract level so Track A's
  // reader at :373 sees both riparian-derived AND housing-derived signal.
  var armoringFrac = cl(1 - (ms.riparianBuffer || 0.3) * 0.7 - (P.protectedAreaFraction / 100) * 0.5 + slrArmorMod + slrSmeltArmorMod + ((coupling && coupling.housingArmorDelta) || 0), 0.1, 0.9);
  // Override: use impervious coupling if available, otherwise derive from protection level
  var shorelineIntact = cl(1 - armoringFrac, 0.1, 0.9);

  // Sand lance (Ammodytes personatus): obligate sand wave burrowers
  // Greene et al. 2017 (Geosciences 7(4):107), Greene et al. 2020 (Seafloor Geomorphology as Benthic Habitat 2nd ed., pp. 267–279), Baker et al. 2024 (Mar. Environ. Res. 202:106778)
  // Sand lance depend on: (1) sand wave integrity (tidal current–maintained),
  // (2) sediment grain size suitability (~0.5mm median), (3) water temperature (<16°C),
  // (4) absence of anthropogenic disturbance (dredging, anchoring, cable laying).
  // They are THE critical link: prey for salmon, orca, seabirds, seals, humpbacks.
  var slHabitat = cl(shorelineIntact * 0.3 + bi * 0.2 + (1 - tissueContam.sandLance * 0.43) * 0.2 + sandWaveIntegrity * 0.3, 0, 1);
  // Dredging destroys subtidal sand habitat (uses port dredging intensity via coupling)
  var dredgingPressure = cl((ms.dredgingImpact !== undefined ? ms.dredgingImpact : 0.1) * 0.25 * (1 - dredgingRestriction), 0, 0.25);
  // Sand wave quality from detailed benthic substrate (Greene & Barrie 2011)
  var slK = cl((slHabitat - dredgingPressure + slrSandLanceMod) * substrateSuit.sandLance * sandWaveQuality * cl(beachHealth * 1.1, 0.4, 1.0), 0.05, 0.8);
  var slGrowth = 0.25 * prevFF.sandLance * (1 - prevFF.sandLance / Math.max(slK, 0.05)) * 0.25 * dt;
  // Temperature-driven mortality for sand lance: onset >18°C, ramps 0→0.12
  // across 18–20°C (matching slTempStress ramp; same paper-direct framework).
  // Path 0 terminal per Amendment 6 §5.24 (Chain B Session 2i, sibling finding
  // to Entry 64 sub-ii surfaced via Amendment 3 §3.3 grep-on-catch; audit-the-class
  // discipline from CLAUDE.md Scientific Rigor). Citations: Horkan & Baker 2025,
  // Tomiyama & Yanagibashi 2004, Arimitsu et al. 2021. Supersedes Greene 2017
  // as primary thermal-mortality citation at this locus.
  var slTempMort = ms.sst > 18 ? cl((ms.sst - 18) * 0.06, 0, 0.12) : 0;
  // Dilbit smothering: sand lance cannot burrow in contaminated sand waves
  var slDilbitMort = dilbitSmothering > 0 ? dilbitSmothering * 0.5 * prevFF.sandLance * 0.25 * dt : 0;
  var slMort = (tS * 0.15 + sp * 0.5 + oystMHWStress + slTempMort) * prevFF.sandLance * 0.25 * dt + slDilbitMort;
  var sandLance = cl(prevFF.sandLance + slGrowth - slMort, 0, 1);

  // Surf smelt: upper-beach gravel spawning — directly destroyed by armoring
  var smHabitat = cl(shorelineIntact * 0.6 + bi * 0.2 + eelgrassEstab * 0.2, 0, 1);
  var smK = cl(smHabitat * (1 - sp * 0.3) * cl(beachHealth * 1.2, 0.3, 1.0), 0.05, 0.8); // beach health controls upper-beach gravel spawning
  var smGrowth = 0.22 * prevFF.surfSmelt * (1 - prevFF.surfSmelt / Math.max(smK, 0.05)) * 0.25 * dt;
  var smMort = (tS * 0.12 + sp * 0.4) * prevFF.surfSmelt * 0.25 * dt;
  var surfSmelt = cl(prevFF.surfSmelt + smGrowth - smMort, 0, 1);

  // Combined forage fish index (all three pillars: herring + sand lance + surf smelt)
  var forageFishIndex = cl(herringPop * 0.40 + sandLance * 0.30 + surfSmelt * 0.30, 0, 1);

  // ── EPIBENTHIC CRUSTACEANS (mysids, amphipods, cumaceans) ──
  // Simenstad et al. 1988: critical prey for juvenile salmon in estuaries
  // Brennan et al. 2004: eelgrass-associated epibenthic communities
  // Connects benthic and pelagic food webs — lives on/just above seafloor
  var prevEpib = (prevEpibenthicCrust !== undefined && prevEpibenthicCrust !== null) ? prevEpibenthicCrust : 0.5;
  var epibDetritalFood = cl(detritusFrac * 0.5 + microbialLoop * 0.2, 0.1, 1.2);
  var epibHabitat = cl(eelgrassEstab * 0.4 + (prevBullKelp !== undefined ? prevBullKelp : 0.5) * 0.2 + 0.3, 0.2, 1.2);
  var epibContamPenalty = cl(waterContam * 0.3, 0, 0.3); // sensitive to contamination
  var epibTarget = cl(epibDetritalFood * epibHabitat * (1 - epibContamPenalty - sp * 0.3), 0.1, 1.5);
  var epibenthicCrustBiomass = cl(prevEpib * 0.87 + epibTarget * 0.13, 0.05, 1.5);

  // ── JELLYFISH (Aurelia, Chrysaora, Cyanea spp.) ──
  // Climate/eutrophication indicator. Warm water + nutrient loading + overfishing =
  // jellyfish blooms replacing forage fish. They compete with larval fish for zooplankton
  // and prey on fish eggs. The "jellification" regime shift is documented globally.
  // NOT a population to conserve — an indicator that the ecosystem is degrading.
  var prevJelly = (prevJellyfish !== undefined && prevJellyfish !== null) ? prevJellyfish : 0.22;
  // Conditions that favor jellyfish: warm SST, high nutrients, low forage fish (reduced competition)
  var jellySST = cl((ms.sst - 10) / 8, 0, 1); // favor warm water
  var jellyNutrients = cl(ms.nutrientConcentration / 15, 0, 1); // eutrophication
  // Jellyfish ← forage gap: Type II retained — jellyfish passively fill niche opened
  // by forage fish decline, not an active switching response. Purcell & Arai 2001.
  var jellyFishGap = hollingII(cl(1 - forageFishIndex, 0, 1), 1.0, 0.35);
  var jellyK = cl(jellySST * 0.3 + jellyNutrients * 0.3 + jellyFishGap * 0.4, 0.05, 0.9);
  var jellyGrowth = 0.30 * prevJelly * (1 - prevJelly / Math.max(jellyK, 0.05)) * 0.25 * dt; // fast boom
  // MHW: jellyfish love marine heat waves
  if (mhwActive) jellyGrowth *= (1 + mhwIntensity * 0.5);
  // Cold water and strong currents flush jellyfish out
  var jellyMort = cl((1 - jellySST) * 0.1 + (ms.noiseIndex || 0.3) * 0.04, 0, 0.15) * prevJelly * 0.25 * dt; // strong currents (high noise proxy) flush jellyfish
  var jellyfishPop = cl(prevJelly + jellyGrowth - jellyMort - sp * 0.1 * prevJelly * dt, 0, 1);
  // Jellyfish suppress forage fish recruitment: compete for zooplankton + eat fish eggs/larvae
  var jellyForageSuppression = cl(jellyfishPop * 0.15, 0, 0.10); // up to 10% forage base reduction
  // Tourism nuisance: high jellyfish = beach closures, sting warnings
  var jellyTourismPenalty = cl(jellyfishPop * 0.08, 0, 0.05);

  // ── ROCKFISH (Copper, Quillback, Yelloweye) ──
  // Extremely long-lived (yelloweye: 120+ yr), late-maturing (15-20 yr), and severely
  // overfished (<5% historical in Puget Sound). They are the species that demonstrate
  // why MPAs need DECADES to work. Recovery is logarithmic, not linear.
  // Habitat: rocky reef at 30-200m depth. Sensitive to DO at depth, contamination
  // (bioaccumulation over 100+ year lifespan), and fishing pressure.
  // Added to biodiversity as a "trophic completeness" signal — when rockfish return,
  // the reef ecosystem is functioning again.
  var prevRF = (prevRockfish !== undefined && prevRockfish !== null) ? prevRockfish : 0.08; // 8% of historical — severely depleted
  // DO at depth: rockfish live below thermocline where DO is lowest
  // Use Hood Canal DO as proxy for deep water (worst case basin)
  // Deep DO: weighted average of Hood Canal (worst) and mean DO, since rockfish occupy multiple basins
  var rfDeepDO = basins.hoodCanal ? (basins.hoodCanal.DO * 0.3 + ms.dissolvedOxygen * 0.7) : ms.dissolvedOxygen;
  var rfDOMort = rfDeepDO < 3 ? 0.10 : rfDeepDO < 5 ? cl((5 - rfDeepDO) / 2 * 0.04, 0, 0.04) : 0;
  // Contamination bioaccumulation: long-lived = extreme PCB/PFAS tissue concentration
  var rfContamStress = cl(tissueContam.rockfish * 0.22, 0, 0.3);
  // MPA protection: rockfish recovery requires fishing exclusion AND time
  // protectedAreaFraction gives the spatial coverage; time gives the recovery
  var rfProtection = cl(P.protectedAreaFraction / 100, 0, 0.5);
  // Per-basin MPA: if San Juan + Hood Canal are MPA-designated, extra rockfish benefit
  // (mpaBasins comes through effectiveParams → P doesn't have it, but protectedAreaFraction was auto-computed from it)
  // Carrying capacity: depends on habitat quality + protection + substrate suitability
  // Rocky reef quality from detailed benthic substrate (Greene & Barrie 2011)
  var rfK = cl((0.6 * rfProtection * 2 + bi * 0.2 + bullKelpH * 0.2 - rfContamStress) * substrateSuit.rockfish * cl(rockyReefQuality, 0.5, 1.5), 0.02, 0.7);
  // VERY slow growth rate (0.03/yr) — yelloweye mature at 15-20 years
  // This means meaningful recovery takes 30-50 years even under full protection
  var rfGrowthRate = 0.06 * cl(1 - rfContamStress, 0.3, 1);
  var rfGrowth = rfGrowthRate * prevRF * (1 - prevRF / Math.max(rfK, 0.02)) * 0.25 * dt;
  // Fishing mortality: rockfish are extremely vulnerable to incidental catch even under "reduced" pressure
  // At fishingPressure=0, still some bycatch mortality (0.5%)
  var rfFishMort = prevRF * cl(P.fishingPressure / 100 * 0.02 + 0.001, 0, 0.03) * 0.25 * dt;
  // Lingcod predation on rockfish (uses prevLingcod — lingcod model computed after)
  var prevLingPop = (prevLingcod !== undefined && prevLingcod !== null) ? prevLingcod : 0.30;
  // Lingcod → rockfish: ratio-dependent — lingcod are ambush predators in structured
  // habitat; consumption depends on encounter rate scaling with prey:predator ratio.
  // Arditi & Ginzburg 1989 ratio-dependent framework.
  var lingRFpredation = ratioDep(prevRF, prevLingPop, 0.15, 0.20) * prevLingPop;
  var rfNatMort = (rfDOMort + sp * 0.15 + lingRFpredation) * prevRF * 0.25 * dt;
  var rockfishPop = cl(prevRF + rfGrowth - rfFishMort - rfNatMort, 0, 1);
  // Rockfish contribute to reef ecosystem health (trophic completeness)
  var rockfishTrophicBonus = cl(rockfishPop * 0.10, 0, 0.05); // small but meaningful signal

  // ── LINGCOD (Ophiodon elongatus) ──
  // Apex reef predator, recovering under management. Completes the reef food web:
  //   kelp → invertebrates/small fish → rockfish → lingcod
  // Faster-recovering than rockfish (mature at 3-5yr vs 15-20yr), so MPA benefits
  // appear earlier. Preys on rockfish, greenlings, and herring. Popular recreational species.
  var prevLing = (prevLingcod !== undefined && prevLingcod !== null) ? prevLingcod : 0.30;
  // Habitat: rocky reef + kelp forest structure
  var lingHabitat = cl(bullKelpH * 0.4 + bi * 0.3 + rockfishPop * 0.3, 0, 1); // needs prey (rockfish)
  var lingK = cl(lingHabitat * 0.7 * (1 + P.protectedAreaFraction / 100 * 0.5) * substrateSuit.lingcod, 0.05, 0.8);
  // Moderate growth rate — faster than rockfish, slower than forage fish
  var lingGrowth = 0.10 * prevLing * (1 - prevLing / Math.max(lingK, 0.05)) * 0.25 * dt;
  // Fishing: popular recreational species + commercial
  var lingFishMort = prevLing * (P.fishingPressure / 100) * 0.06 * 0.25 * dt;
  var lingNatMort = (tS * 0.05 + sp * 0.1) * prevLing * 0.25 * dt;
  var lingcodPop = cl(prevLing + lingGrowth - lingFishMort - lingNatMort, 0, 1);
  // Lingcod predation on rockfish: top-down control (natural, not harmful)
  // Keeps rockfish population in check — healthy predator-prey dynamic
  var lingRockfishPredation = cl(lingcodPop * 0.05, 0, 0.03); // modest

  // ── MARBLED MURRELET (Brachyramphus marmoratus) ──
  // Federally threatened seabird — the ultimate land-sea connector.
  // NESTING: old-growth forest canopy (moss-covered limbs 30-60m up). Lost ~90% of
  //   nesting habitat to logging. Remaining old-growth almost entirely in protected areas.
  // FORAGING: dives for sand lance, herring, and small fish in nearshore waters.
  // The species where forest cover and marine conditions converge into a single population.
  // Cascades: old-growth loss → nesting failure; forage collapse → chick starvation.
  var prevMurr = (prevMurrelet !== undefined && prevMurrelet !== null) ? prevMurrelet : 0.30; // ~30% of historical
  // Nesting habitat: old-growth forest as proxy for protected areas + ecosystem integrity
  // In the PNW, virtually all remaining old-growth is on protected land
  var murrNesting = cl(P.protectedAreaFraction / 100 * 1.2 + bi * 0.3 - (S.wildfire || 0) * 0.5 - (S.volcano || 0) * 0.3, 0, 0.8);
  // Foraging success: depends on nearshore forage fish, especially sand lance
  var murrForaging = cl(sandLance * 0.40 + herringPop * 0.30 + surfSmelt * 0.20 + bi * 0.10, 0, 1);
  // Oil spill: murrelets sit on water surface → catastrophic mortality
  var murrOilMort = sp * 0.8;
  // Light pollution: ALAN (artificial light at night) disorients murrelets (Rich & Longcore 2006)
  // Urban basins have highest ALAN — increases collision/predation mortality
  var lightPollution = _cpl.lightPollutionIndex !== undefined ? _cpl.lightPollutionIndex : 0;
  var murrLightMort = cl(lightPollution * 0.04, 0, 0.04); // up to 4% additional mortality from ALAN
  // Reproductive rate: limited by both nesting AND foraging (single-egg clutch, both parents feed)
  var murrReproduction = cl(murrNesting * 0.5 + murrForaging * 0.5, 0, 0.8);
  var murrK = cl(murrNesting * 0.6 + murrForaging * 0.4, 0.02, 0.6);
  var murrGrowth = 0.05 * prevMurr * murrReproduction * (1 - prevMurr / Math.max(murrK, 0.02)) * 0.25 * dt;
  var murrMort = (tS * 0.08 + murrOilMort + murrLightMort) * prevMurr * 0.25 * dt;
  var murreletPop = cl(prevMurr + murrGrowth - murrMort, 0, 1);

  // ── SEABIRD POPULATIONS ──
  // Marbled murrelet, rhinoceros auklet, pigeon guillemot — diving and surface foragers.
  // Depend on ALL forage fish (herring + sand lance + surf smelt), water clarity, and nesting habitat.
  // Oyster filtration improves water clarity → benefits diving foragers.
  var seabirdForage = cl(forageFishIndex * 0.55 + (ms.zoo||200)/600 * 0.15 + bi * 0.1 - jellyForageSuppression, 0, 1); // jellyfish compete
  var seabirdVisibility = cl(1 - ms.turbidity/30 + oysterFiltration * 0.3, 0.2, 1); // oysters clear water
  var seabirdNesting = cl(eelgrassEstab * 0.3 + P.protectedAreaFraction/100 * 0.5 + bi * 0.2, 0, 1);
  var seabirdGeneral = cl(seabirdForage * 0.5 + seabirdVisibility * 0.25 + seabirdNesting * 0.25
    - sp * 0.7 - volcano * 0.2, 0, 1);
  // Composite: murrelet (threatened, explicitly modeled) + other seabirds (aggregate)
  var seabirdIndex = cl(seabirdGeneral * 0.6 + murreletPop * 0.4, 0, 1);

  // ── BENTHIC INFAUNA (clams, worms, amphipods — sediment community) ──
  // Llansó 1992: Puget Sound benthos diversity and abundance
  // Weston 1990: benthic infauna as indicators of sediment quality
  // Bioturbation connects to stateful SOD model — more infauna = faster sediment mixing
  var prevBenInf = (prevBenthicInfauna !== undefined && prevBenthicInfauna !== null) ? prevBenthicInfauna : 0.6;
  var infSedFood = cl((ms.hoodCanalBenthicLoad !== undefined ? ms.hoodCanalBenthicLoad : 20) / 40, 0.2, 1.5); // organic matter in sediment
  var infDOLimit = ms.dissolvedOxygen > 3 ? 1 : cl(ms.dissolvedOxygen / 3, 0.05, 1); // critical — infauna die in hypoxic sediments
  var infContamPenalty = cl(waterContam * 0.4, 0, 0.5); // sensitive to PCBs, metals
  // Substrate preference: soft sediments (mud/sand) preferred for burrowing
  // Enhanced with detailed benthic substrate quality (Greene & Barrie 2011)
  var _agSub = SUBSTRATE.mainBasin || { rock: 0.15, gravel: 0.15, sand: 0.3, mud: 0.4 };
  var infSubstrate = cl((0.5 + _agSub.mud * 0.3 + _agSub.sand * 0.2) * mudHabitatQuality, 0.3, 1.2);
  var infTarget = cl(infSedFood * infDOLimit * infSubstrate * (1 - infContamPenalty - sp * 0.4), 0.1, 1.5);
  var benthicInfaunaBiomass = cl(prevBenInf * 0.90 + infTarget * 0.10, 0.05, 1.5);
  // Bioturbation feedback: more infauna = faster sediment mixing = faster decomposition
  var bioturbationRate = cl(benthicInfaunaBiomass * 0.5, 0, 1);

  // ── DUNGENESS CRAB (Metacarcinus magister) ──
  // Logistic growth modulated by DO, Ω_aragonite, eelgrass (juvenile habitat),
  // green crab predation, and fishing pressure. ~$250M/yr PNW fishery.
  var prevCrab = (prevDungenessCrab !== undefined && prevDungenessCrab !== null) ? prevDungenessCrab : 0.65;
  // DO sensitivity: crabs die below 2 mg/L, stressed below 4 mg/L
  var crabDO = ms.dissolvedOxygen;
  var crabDOMort = crabDO < 2 ? 0.3 : crabDO < 4 ? cl((4 - crabDO) / 2 * 0.15, 0, 0.15) : 0;
  // Ω_aragonite: shell formation impaired below 1.5, severe below 1.0
  var crabOmega = ms.omegaAragonite !== undefined ? ms.omegaAragonite : 2.0;
  var crabShellStress = crabOmega < 1.0 ? 0.25 : crabOmega < 1.5 ? cl((1.5 - crabOmega) / 0.5 * 0.12, 0, 0.12) : 0;
  // Eelgrass: juvenile crab habitat — low establishment reduces recruitment
  var crabJuvHabitat = cl(eelgrassEstab * 0.6 + bi * 0.4, 0, 1);
  // Green crab predation on juvenile Dungeness
  // Green crab → Dungeness: Type IV — at very high green crab density, interference
  // competition reduces per-capita predation (Jensen et al. 2002, crowding in habitat)
  var gcPredation = hollingIV(greenCrabPop, 0.22, 0.15, 0.08);
  // Logistic growth — K reflects long-term habitat suitability (recruitment)
  // Mud/mixed substrate quality from detailed benthic substrate (Greene & Barrie 2011)
  var crabK = cl((crabJuvHabitat * (1 - crabShellStress * 0.3) + 0.1) * substrateSuit.dungeness * cl(mudHabitatQuality, 0.7, 1.3), 0.2, 1);
  // Growth rate 0.18: Dungeness crabs are prolific (2.5M eggs/female), fast-growing (3yr to legal
  // size), and resilient. Prior 0.12 caused unrealistic 35% decline over 20yr at baseline.
  // 0.18 stabilizes population near ~0.60-0.65 under moderate fishing pressure.
  var crabGrowthRate = 0.25 * crabK;
  var crabGrowth = crabGrowthRate * prevCrab * (1 - prevCrab / Math.max(crabK, 0.05)) * 0.25 * dt;
  // Crabs more vulnerable during molt season (spring-summer)
  var crabMoltVuln = crabMoltMod * 0.015; // additional mortality during molt
  // Acute mortality from stressors (separate from recruitment effects in K)
  var crabMort = (crabDOMort + gcPredation + sp * 0.3 + prevOtterPop * 0.20 + crabMoltVuln) * prevCrab * 0.25 * dt; // otters prey on crab + molt vulnerability
  // Commercial harvest: proportional to population above minimum stock threshold (0.3)
  var crabHarvestable = Math.max(0, prevCrab - 0.3);
  var crabHarvest = crabHarvestable * (P.fishingPressure / 100) * 0.10 * dt;
  var crabPop = cl(prevCrab + crabGrowth - crabMort - crabHarvest, 0, 1);
  // Crab fishery revenue contribution (proportional to harvest)
  var crabRevenue = crabHarvest * 800; // ~$M scaling factor

  // ── PINNIPED (SEAL / SEA LION) PREDATION ──
  // Harbor seals and Steller sea lions have grown ~5x since MMPA (1972)
  // They are a significant predation source on juvenile and returning adult salmon
  var prevPinn = prevPinniped || { population: 40000, trend: 0.01 };
  // Population grows logistically toward ~65k carrying capacity, boosted by salmon availability
  var pinnCarrying = 50000;
  var pinnGrowth = prevPinn.trend * (1 - prevPinn.population / pinnCarrying) * dt;
  // Domoic acid (from Pseudo-nitzschia) bioaccumulates through fish, causes pinniped strandings
  var domoicAcidMort = (ms.maxPseudoNitzschia !== undefined ? ms.maxPseudoNitzschia : 0) > 0.3 ? cl((ms.maxPseudoNitzschia - 0.3) * 0.02, 0, 0.01) : 0;
  var pinnPop = cl(prevPinn.population * (1 + pinnGrowth - domoicAcidMort), 5000, 100000);
  // Predation pressure on salmon scales with pinniped population / baseline
  // Pinnipeds → salmon: Type II retained — harbor seals are consistent predators
  // at river mouth aggregations regardless of run size. Holling 1959.
  var pinnipedPredation = cl(hollingII(Math.max(pinnPop / 40000 - 1, 0), 0.25, 0.5) * 0.35, 0, 0.25);
  // Pinnipeds also compete with orca for salmon
  var pinnipedCompetition = cl(pinnPop / 80000, 0, 0.15); // reduces effective prey for orca

  // ── SEA OTTER (Enhydra lutris) ──
  // Extirpated from Washington by fur trade (~1910). Reintroduction actively studied.
  // THE keystone predator: otters eat urchins → urchins eat kelp → so otters → kelp recovery.
  // But also eat Dungeness crab, geoduck, shellfish → direct fishery conflict.
  // Starts at 0 (extirpated). Colonization triggered by high protectedAreaFraction
  // (represents active reintroduction decision).
  var prevOtt = (prevSeaOtter !== undefined && prevSeaOtter !== null) ? prevSeaOtter : 0;
  // Reintroduction trigger: significant protection commitment signals reintro program
  var reintroSignal = cl(P.protectedAreaFraction / 100 - 0.25, 0, 0.5) * 2; // 0 below 25% PA, ramps to 1 at 50%
  var otterK = reintroSignal > 0.1 ? cl(reintroSignal * 0.4 * bullKelpH * (1 - sp * 0.5), 0, 0.5) : 0;
  // Slow colonization: ~5%/yr growth in new territory
  var otterGrowth = otterK > 0 ? 0.05 * Math.max(prevOtt, reintroSignal * 0.02) * (1 - prevOtt / Math.max(otterK, 0.01)) * 0.25 * dt : 0;
  // Mortality: oil spills are devastating to otters (lose insulation → hypothermia)
  var otterMort = sp * 0.9 * prevOtt * 0.25 * dt;
  var seaOtterPop = cl(prevOtt + otterGrowth - otterMort, 0, 1);
  // Otter-fishery conflict: otters consume crab and geoduck
  var otterCrabPredation = cl(seaOtterPop * 0.20, 0, 0.10);
  var otterGeoduckPredation = cl(seaOtterPop * 0.15, 0, 0.08);

  // ── HARBOR PORPOISE (Phocoena phocoena) ──
  // Most common small cetacean (~10,000 individuals). Extremely noise-sensitive —
  // first species to abandon areas with elevated vessel traffic.
  // An acoustic canary: porpoise presence = acceptable noise levels.
  var prevPorp = (prevPorpoise !== undefined && prevPorpoise !== null) ? prevPorpoise : 0.55;
  var porpForage = cl(forageFishIndex * 0.6 + (ms.zoo || 200) / 600 * 0.2 + bi * 0.2, 0, 1);
  // Noise sensitivity: porpoise most sensitive to high-frequency noise
  var porpHighNoise = noiseHigh > 0.3 ? cl((noiseHigh - 0.3) * 1.2, 0, 0.3) : 0;
  var porpNoiseFlight = cl(porpHighNoise * 0.6 + (ms.noiseIndex > 0.6 ? (ms.noiseIndex - 0.6) * 1.0 : 0) * 0.4, 0, 0.4);
  var porpK = cl(porpForage * (1 - porpNoiseFlight) * 0.8 + 0.25, 0.10, 0.8);
  var porpGrowth = 0.06 * prevPorp * (1 - prevPorp / Math.max(porpK, 0.05)) * 0.25 * dt;
  var porpMort = (sp * 0.3 + porpNoiseFlight * 0.05) * prevPorp * 0.25 * dt;
  var porpBycatch = (P.fishingPressure / 100) * 0.01 * prevPorp * 0.25 * dt;
  var porpoisePop = cl(prevPorp + porpGrowth - porpMort - porpBycatch, 0, 1);

  // ── FISH PASSAGE INVESTMENT ──
  // Fraction of ~20,000 culvert/dam barriers addressed (US v. Washington 2018).
  // At 100%, all barriers removed → +0.15 to riverSurvBase. At 0%, current degraded baseline.
  // Shared by salmon (full benefit) and lamprey (60% benefit — needs smooth ramps, not stepped ladders).
  var fishPassageFrac = cl((P.fishPassageInvestment !== undefined ? P.fishPassageInvestment : 20) / 100, 0, 1);
  var fishPassageBonus = fishPassageFrac * 0.15; // up to +0.15 river survival at full barrier removal

  // ── DAM FISH PASSAGE EFFECTS ──
  // Dam passage rates reduce salmon carrying capacity for stocks in affected rivers
  var damSkagitPassage = ms.damSkagitPassage !== undefined ? ms.damSkagitPassage : 0.5;
  var damBakerPassage = ms.damBakerPassage !== undefined ? ms.damBakerPassage : 0.3;
  var damElwhaRecovery = ms.damElwhaRecovery !== undefined ? ms.damElwhaRecovery : 0.5;
  // Dam warm releases add thermal stress to affected stocks
  var damThermalStress = ms.damState ? cl(
    ((ms.damState.skagit ? ms.damState.skagit.flowReg : 0) * 0.03 +
     (ms.damState.baker ? ms.damState.baker.flowReg : 0) * 0.02), 0, 0.05) : 0;

  // ── PACIFIC LAMPREY (Entosphenus tridentatus) ──
  // Ancient anadromous fish (450 million years), culturally critical to tribes.
  // Blocked by same barriers as salmon but CANNOT use salmon-designed fish ladders.
  // No commercial value, largely ignored by management, but deeply important to
  // Indigenous food systems (smoked lamprey is ceremony food).
  var prevLamp = (prevLamprey !== undefined && prevLamprey !== null) ? prevLamprey : 0.50;
  // Lamprey cannot use salmon-designed fish ladders (need smooth ramps), so only 60% of passage investment applies
  var lampreyPassageBonus = fishPassageFrac * 0.60 * 0.20; // up to +0.12 at full investment
  // Lamprey passage benefits from co-management (tribal nations prioritize lamprey — ceremony food)
  // Read coManagementIndex directly here because the unified coMgmt variable is declared later in the function
  var lampreyCoMgmt = (P.coManagementIndex !== undefined ? P.coManagementIndex : 50) / 100;
  var lampreyPassage = cl(P.protectedAreaFraction / 100 * 0.3 + lampreyCoMgmt * 0.4 + bi * 0.2 + lampreyPassageBonus, 0, 0.7);
  var lampreyLarvalHab = cl(1 - ms.turbidity / 25 * 0.3 - tissueContam.herring * 0.085, 0.1, 0.8);
  var lampreyTempStress = ms.sst > 14 ? cl((ms.sst - 14) / 6 * 0.15, 0, 0.15) : 0;
  var lampreyK = cl((lampreyPassage * 0.5 + lampreyLarvalHab * 0.5) * substrateSuit.lamprey, 0.02, 0.6);
  var lampreyGrowth = 0.03 * prevLamp * (1 - prevLamp / Math.max(lampreyK, 0.02)) * 0.25 * dt;
  var lampreyMort = (lampreyTempStress + sp * 0.2) * prevLamp * 0.25 * dt;
  var lampreyPop = cl(prevLamp + lampreyGrowth - lampreyMort, 0, 1);

  // ── GIANT PACIFIC OCTOPUS (Enteroctopus dofleini) ──
  // Largest octopus species (up to 50kg). Short-lived (3-5yr), semelparous (dies after
  // breeding). Rocky reef den-dependent. Generalist predator of crabs, clams, small fish.
  // Prey for harbor seals, sea otters, lingcod. Indicator of rocky subtidal habitat quality.
  // Temperature-sensitive: stressed above 15°C (Scheel 2002, Anderson et al. 2008).
  // Sources: Scheel 2002 (Mar. Ecol. Prog. Ser. 245:3), Anderson et al. 2008 (Aquat. Biol. 4:233)
  var prevOcto = (_pe.octopus !== undefined && _pe.octopus !== null) ? _pe.octopus : 0.40;
  var octoHabitat = cl(rockfishPop * 0.15 + bullKelpH * 0.25 + bi * 0.3 + (1 - ms.contaminationLevel) * 0.15 + substrateSuit.rockfish * 0.15, 0, 1);
  var octoTempStress = ms.sst > 15 ? cl((ms.sst - 15) / 5 * 0.20, 0, 0.20) : 0;
  var octoK = cl(octoHabitat * 0.7 * (1 - oS * 0.3), 0.05, 0.7);
  // Fast growth (short-lived, high fecundity) but high natural mortality
  var octoGrowth = 0.25 * prevOcto * (1 - prevOcto / Math.max(octoK, 0.05)) * 0.25 * dt;
  var octoNatMort = (0.15 + octoTempStress + sp * 0.3) * prevOcto * 0.25 * dt; // high base mortality (semelparous)
  var octoPredMort = cl(pinnPop / 65000 * 0.04 + seaOtterPop * 0.06 + lingcodPop * 0.03, 0, 0.08) * prevOcto * 0.25 * dt;
  var octopusPop = cl(prevOcto + octoGrowth - octoNatMort - octoPredMort, 0, 1);

  // ── CHERRY POINT HERRING (Ricker + depensation, genetically distinct sub-stock) ──
  // Cherry Point is the largest spring-spawning herring stock in the Salish Sea,
  // historically the biggest spawning aggregation (~12,000 tons peak).
  // Collapsed ~97% from 1970s peak. Critical Lummi Nation treaty fishery.
  // Genetically distinct (Small et al. 2005) — will NOT be recolonized from
  // neighboring stocks. Recovery depends entirely on local remnant population.
  // Sources: Stick et al. 2014 (WDFW), Ricker 1954, Liermann & Hilborn 2001
  var prevCherryPt = (_pe.cherryPointHerring !== undefined && _pe.cherryPointHerring !== null)
    ? _pe.cherryPointHerring : 0.06;
  // Unpack age structure (defaults based on depleted population)
  var _cpa = (typeof prevCherryPt === 'object') ? prevCherryPt : { juv: (prevCherryPt || 0.06) * 0.35, sub: (prevCherryPt || 0.06) * 0.30, adult: (prevCherryPt || 0.06) * 0.35 };
  var cpJuv = _cpa.juv !== undefined ? _cpa.juv : 0.021;
  var cpSub = _cpa.sub !== undefined ? _cpa.sub : 0.018;
  var cpAdult = _cpa.adult !== undefined ? _cpa.adult : 0.021;
  var cpTotal = cpJuv + cpSub + cpAdult;

  // Spawning biomass and Ricker recruitment
  var cpSpawning = cpAdult;
  var cpAlpha = 3.0; // lower than general herring (depleted stock structure)
  var cpBeta = 5.0;
  // Depensation: higher S_critical than general stock because Cherry Point needs
  // large aggregation for effective spawning (schooling fish, predator swamping)
  var cpScrit = 0.05; // 5% of historical K — higher than general stock's 3%
  var cpDepensation = cpSpawning / (cpSpawning + cpScrit);
  var cpRickerR = cpAlpha * cpSpawning * Math.exp(-cpBeta * cpSpawning) * cpDepensation;

  // Spawning fidelity: Cherry Point herring are genetically distinct (Small et al. 2005)
  // Almost zero immigration from other stocks — recovery depends on local remnant
  var cpFidelity = 0.95; // 95% local, only 5% immigration
  var cpImmigration = (1 - cpFidelity) * 0.005 * dt; // tiny immigration flow

  // Environmental forcing
  var cpHabitat = cl(eelgrassEstab * 0.4 + bi * 0.2 + (1 - ms.contaminationLevel) * 0.2, 0, 1);
  var cpSSTemp = cl(1 - (ms.sst - 11) * 0.15, 0.3, 1.2);
  // March Point refinery PAH contamination: localized chronic stressor
  var cpRefinery = cl(ms.contaminationLevel * 0.5, 0, 0.15);
  var cpEnvMod = cl(cpHabitat * cpSSTemp * herringSeasonAdj * (1 - cpRefinery - sp * 0.4 - mhwHerringHit * 0.5), 0.05, 1.5);

  // New recruits
  var cpNewRecruits = cl(cpRickerR * cpEnvMod * 0.25 * dt + cpImmigration, 0, 0.10);
  // Age class transitions
  var cpJuvToSub = cpJuv * Math.pow(0.50, dt) * (1 - Math.pow(0.50, dt));
  var cpSubToAdult = cpSub * Math.pow(0.50, dt) * (1 - Math.pow(0.50, dt));
  // Mortality
  var cpJuvMort = cpJuv * 0.22 * 0.25 * dt;
  var cpSubMort = cpSub * 0.14 * 0.25 * dt;
  var cpAdultMort = cpAdult * 0.16 * 0.25 * dt;
  // Fishing: very limited at current population levels
  var cpFishMort = cpTotal > 0.08 ? cpAdult * (P.fishingPressure / 100) * 0.03 * 0.25 * dt : 0;

  // Update
  var newCpJuv = cl(cpJuv + cpNewRecruits - cpJuvToSub - cpJuvMort, 0, 0.3);
  var newCpSub = cl(cpSub + cpJuvToSub - cpSubToAdult - cpSubMort, 0, 0.3);
  var newCpAdult = cl(cpAdult + cpSubToAdult - cpAdultMort - cpFishMort, 0, 0.3);
  var cherryPointHerring = cl(newCpJuv + newCpSub + newCpAdult, 0, 1);
  var cpAgeStruct = { juv: newCpJuv, sub: newCpSub, adult: newCpAdult, spawningBiomass: newCpAdult, recruitment: cpNewRecruits, depensation: cpDepensation, fidelity: cpFidelity };

  // ── AQUACULTURE (Open-pen salmon farms) ──
  // Georgia Strait open-pen Atlantic salmon farms: economic benefit vs ecological cost.
  // Sea lice (Lepeophtheirus salmonis) reservoir infects wild smolts.
  // Chemical runoff (antibiotics, pesticides, antifoulants), nutrient loading from fish waste,
  // and genetic introgression from escaped Atlantic salmon reduce wild fitness.
  // BC announced open-net pen transition plan in 2025; intensity slider models phase-out timeline.
  var aquaFrac = cl((P.aquacultureIntensity !== undefined ? P.aquacultureIntensity : 30) / 100, 0, 1);
  // aquaculturePolicy: 0=open net pens, 50=transitioning to closed, 100=fully closed containment
  // DFO 2022 Open-Net Pen Transition Plan, Cohen Commission 2012 recommendations
  var aquaPolicy = cl((P.aquaculturePolicy !== undefined ? P.aquaculturePolicy : 0) / 100, 0, 1);
  // Closed containment eliminates sea lice transfer and escape risk (Morton et al. 2017)
  var openPenFrac = aquaFrac * (1 - aquaPolicy); // fraction still in open pens

  // Sea lice pressure: farm-origin lice infect wild smolts passing Georgia Strait farms
  // Krkosek et al. 2007: 80% mortality of juvenile pink in Broughton — scaled to 6% at
  // population level across all stocks (localized effect diluted across wider region)
  // PRV (piscine orthoreovirus): additional pathogen from open-pen farms (Morton et al. 2017)
  var seaLicePressure = openPenFrac * 0.06;
  var prvPressure = openPenFrac * 0.03; // PRV reduces wild salmon ocean survival by ~3% at full open-pen

  // Escape hybridization risk: Atlantic salmon escapes reduce wild genetic fitness
  // Hindar et al. 2006: introgression from farmed fish reduces wild population productivity
  // Closed containment eliminates escape risk
  var escapeRisk = openPenFrac * 0.03;

  // Chemical contamination: antibiotics (e.g., SLICE/emamectin), pesticides, antifoulants
  // Closed containment contains most waste but still uses chemicals
  var aquaContamination = openPenFrac * 0.08 + aquaFrac * aquaPolicy * 0.02;

  // Nutrient loading: fish waste → localized eutrophication in Georgia Strait
  // Would need marine basin coupling for full spatial effect; applied as local modifier
  var aquaNutrientLoad = aquaFrac * 3.0;

  // Economic contribution: jobs and revenue from aquaculture industry
  var aquaJobs = aquaFrac * 2000;   // ~2000 direct jobs at full intensity in BC
  var aquaRevenue = aquaFrac * 800;  // ~$800M/yr at full intensity

  // ── MULTI-STOCK SALMON COHORTS (with hatchery/wild split) ──
  var hcDO=basins.hoodCanal?basins.hoodCanal.DO:7, mbDO=basins.mainBasin?basins.mainBasin.DO:8;
  var oceanSurvMod = oForcing ? oForcing.oceanSurvivalMod : 0;
  var hatchFrac = cl((P.hatcheryFraction !== undefined ? P.hatcheryFraction : 35) / 100, 0, 0.8);
  // Hatchery fish: inflate numbers but reduce wild fitness via competition and genetic introgression
  var wildCapReduction = hatchFrac * 0.15; // hatchery fish compete for spawning habitat
  var geneticFitness = cl(1 - hatchFrac * 0.10, 0.7, 1); // interbreeding reduces wild survival
  var prevStocks = prevSal.stocks || {};
  var newStocks = {};
  var totalSalmonHealth = 0, totalSalmonReturn = 0, totalAge0 = 0, totalAge1 = 0, totalAge2 = 0, totalAge3 = 0;
  var totalWildReturn = 0, totalHatchReturn = 0;

  Object.keys(SALMON_STOCKS).forEach(function(sk) {
    var cfg = SALMON_STOCKS[sk];
    var prev = prevStocks[sk] || { age0: 400, age1: 300, age2: 200, age3: 160, totalReturn: 13 };
    // Cap oceanSurvMod so ENSO/PDO stochastic forcing doesn't crash salmon survival.
    // Raw range is approx [-0.09, +0.09]; cap to [-0.03, +0.03] to preserve signal
    // direction while preventing multi-year compounding crashes.
    var cappedOceanSurvMod = cl(oceanSurvMod, -0.03, 0.03);
    // Smolt-zooplankton phenological mismatch reduces ocean survival
    var phenoMatch = cl(1 - smoltFoodMismatch * 0.15, 0.85, 1);
    var oceanSurv = cl(cfg.oceanSurvBase - totalStress*0.18 - sp*0.4 - (hcDO<4?0.15:0) - (mbDO<5?0.1:0)
      + herringPop*0.08 + cappedOceanSurvMod + pteropodPreyBonus
      - mhwActive * mhwIntensity * 0.20
      - seaLicePressure, 0.1, 0.95) * phenoMatch; // MHW + sea lice + phenology + pteropod prey
    // #15 Salmon predation disaggregation: pinniped + avian, compensatory vs additive
    // If compensatory (high): reducing one predator doesn't help — other mortality fills gap
    // If additive (low): every predator removed = more fish survive
    var compMort = (P.compensatoryMortality !== undefined ? P.compensatoryMortality : 40) / 100;
    var avianPredation = 0.05; // Caspian terns, cormorants at river mouths — fixed ~5%
    var totalPredation = pinnipedPredation + avianPredation;
    // Compensatory: total effective predation = totalPredation × (1 - compMort × overlap)
    // High compMort means predators are interchangeable — removing one has less effect
    var effectivePredation = totalPredation * (1 - compMort * 0.4); // at 100% compensatory, 40% less effective
    // Dam passage modifier: improvement relative to baseline dam state
    // At baseline (damRemovalPolicy=0), passage is already baked into riverSurvBase calibration.
    // damPassageMod only adds BENEFIT when dams are removed or passage upgraded.
    var damPassageBonus = 0;
    if (sk === "chinook" || sk === "pink") {
      // Chinook and pink benefit from Skagit passage improvement + Elwha recovery
      damPassageBonus = cl(damSkagitPassage - 0.5, 0, 0.5) * 0.06 + cl(damElwhaRecovery - 0.5, 0, 0.5) * 0.04;
    } else if (sk === "coho") {
      damPassageBonus = cl(damSkagitPassage - 0.5, 0, 0.5) * 0.04 + cl(damBakerPassage - 0.3, 0, 0.7) * 0.03;
      // 6PPD-quinone pre-spawn mortality in urban streams (Tian et al. 2021)
      // Lethal to coho at ~0.8 µg/L — delivered via stormwater from tire wear
      var sixPPDqCoho = _cpl.sixPPDqCohoMort || {};
      var sixPPDqMort = sixPPDqCoho.cohoMortality || 0;
      stressMult = stressMult * (1 - sixPPDqMort * 0.8); // up to 80% reduction in urban stream survival
    } else {
      damPassageBonus = cl(damSkagitPassage - 0.5, 0, 0.5) * 0.02;
    }
    var riverSurv = cl((cfg.riverSurvBase + fishPassageBonus + damPassageBonus) * (1 - P.fishingPressure/100*0.3) * stressMult * (1 - effectivePredation), 0.1, 0.9);
    var salSeason = Math.exp(-Math.pow((yf - cfg.runPeak)*5, 2));
    var broodMult = (sk === "pink") ? (1 + Math.cos(((yearsSince2026 || 0) + yf) * Math.PI) * 0.3) : 1;
    var rawSpawning = prev.age3 * cfg.fecundity * cl(riverSurv, 0.1, 1) * (0.5 + salSeason*0.5) * broodMult;
    // Wild carrying capacity with per-species genetic diversity tracking
    var prevGenDiv = prev.geneticDiv !== undefined ? prev.geneticDiv : (cfg.geneticDiv || 0.85);
    var strayRate = cfg.strays || 0.05;
    var genDivChange = -hatchFrac * strayRate * 0.02 + (1-hatchFrac) * 0.005 - escapeRisk * strayRate;
    var newGenDiv = cl(prevGenDiv + genDivChange * dt, 0.3, 1.0);
    var wildCap = cfg.carryingCap * (1 - wildCapReduction) * newGenDiv;
    var wildSpawning = (rawSpawning * (1-hatchFrac) * geneticFitness * newGenDiv * wildCap) / (rawSpawning * (1-hatchFrac) * geneticFitness * newGenDiv + wildCap);
    var hatchSpawning = rawSpawning * hatchFrac * 0.9; // hatchery supplementation (90% effective)
    var spawning = wildSpawning + hatchSpawning;
    // Cohort aging: apply survival as a fractional power for sub-quarterly timesteps.
    // At dt=1 (quarterly): Math.pow(surv, 1) = surv — matches original calibration.
    // At dt=1/3 (monthly): Math.pow(surv, 1/3) ≈ surv^0.33, and over 3 months:
    //   (surv^(1/3))^3 = surv — correctly reconstructs the quarterly survival rate.
    // Using "* dt" was wrong: it meant only 1/3 of the cohort advanced per month,
    // compounding to ~0.037 of original (0.33^3) instead of the intended survival rate.
    var riverSurvStep = Math.pow(riverSurv, dt);
    var oceanSurvStep = Math.pow(oceanSurv, dt);
    var ns = {
      age0: cl(spawning, 0, 50000),
      age1: cl(prev.age0 * riverSurvStep, 0, 50000),
      age2: cl(prev.age1 * oceanSurvStep, 0, 50000),
      age3: cl(prev.age2 * oceanSurvStep, 0, 50000),
      totalReturn: cl(prev.age3 * (0.5 + salSeason*0.5) / cfg.carryingCap * 100, 0, 500),
      geneticDiv: newGenDiv
    };
    newStocks[sk] = ns;
    totalAge0 += ns.age0; totalAge1 += ns.age1; totalAge2 += ns.age2; totalAge3 += ns.age3;
    totalSalmonReturn += ns.totalReturn * cfg.weight;
    totalSalmonHealth += cl(ns.totalReturn / 100, 0, 1) * cfg.weight;
    totalWildReturn += ns.totalReturn * (1 - hatchFrac) * cfg.weight;
    totalHatchReturn += ns.totalReturn * hatchFrac * cfg.weight;
  });

  var salmonHealth = cl(totalSalmonHealth, 0, 1);
  var aggSalSeason = Math.exp(-Math.pow((yf-0.6)*5, 2));
  // Normalize salmonRun as 0-100 index: at carrying capacity peak=100, off-season=50, stressed=20-40
  // Salmon run index: 0-100. Divisor 6 calibrated so equilibrium baseline annual mean ≈ 48
  // (matching WDFW 2024 observed ~48). Seasonal range: winter ~25, summer ~70.
  // An index of 100 = theoretical maximum at peak season.
  var salmonRun = cl(totalSalmonReturn * (0.5 + aggSalSeason*0.5) / 6, 0, 100);
  var nSal = { stocks: newStocks, age0: totalAge0, age1: totalAge1, age2: totalAge2, age3: totalAge3, totalReturn: totalSalmonReturn * 5, wildFrac: totalSalmonReturn > 0.001 ? totalWildReturn / totalSalmonReturn : (1 - hatchFrac) };

  // ── SALMON OCEAN COHORT TRACKING (parallel to age-class model) ──
  // Provides stage-specific diagnostics without affecting calibrated returns.
  var prevOcean = _pe.salmonOcean || null;
  // Smolt production: proportional to age0 in spring (month 3-5)
  var oceanMonth = Math.round(yf * 12) % 12;
  var smoltProd = null;
  if (oceanMonth >= 3 && oceanMonth <= 5) { // spring smolt outmigration
    smoltProd = {};
    Object.keys(newStocks).forEach(function(sk) {
      smoltProd[sk] = Math.round((newStocks[sk].age0 || 0) * 0.3); // ~30% of age0 outmigrate per spring month
    });
  }
  var oceanEnv = {
    estuaryQuality: ms.waterQualityIndex || 0.65,
    copepodQuality: oForcing && oForcing.copepodQuality !== undefined ? oForcing.copepodQuality : 0.5,
    sst: ms.sst, mhwActive: mhwActive, mhwIntensity: mhwIntensity,
    seaLicePressure: (P.aquacultureIntensity || 30) / 100 * 0.3,
    contamination: waterContam,
    fisheriesHarvestRate: (P.fishingPressure || 40) / 100,
    fraserTemp: oForcing && oForcing.fraserTemp ? oForcing.fraserTemp : 10,
  };
  var oceanYear = 2026 + (yearsSince2026 || 0);
  var salmonOceanResult = computeSalmonOcean(prevOcean, smoltProd, oceanEnv, oceanMonth, oceanYear);

  // ══════════════════════════════════════════════════════════════
  // INDIGENOUS PERSPECTIVES & FISHING RIGHTS
  // ══════════════════════════════════════════════════════════════
  // The Salish Sea is the homeland of Coast Salish peoples — Lummi, Tulalip,
  // Swinomish, Muckleshoot, Puyallup, Squaxin Island, Nisqually, Makah, and
  // dozens of First Nations on the BC side. Environmental degradation impacts
  // these communities through multiple distinct and independently vulnerable
  // pathways, each with different drivers.

  // ── CO-MANAGEMENT: unified from parameter + tribal governance module ──
  // P.coManagementIndex sets the policy baseline (institutional support, 0-100%).
  // trbCoMgmtMultiplier (1.0-1.5×, from computeTribal via coupling) amplifies it
  // based on actual treaty strength, funding, and TEK integration.
  // This reconciles the two previously parallel paths into one:
  //   coMgmt = basePolicy × tribalEffectiveness
  // Sources: Berkes 2012, NWIFC 2020, Pinkerton 1989
  var _tc = coupling || {};
  var trbCoMgmtMult = _tc.trbCoMgmtMultiplier !== undefined ? _tc.trbCoMgmtMultiplier : 1.0;
  var trbTekBon = _tc.trbTekBonus !== undefined ? _tc.trbTekBonus : 0;
  var coMgmtBase = (P.coManagementIndex !== undefined ? P.coManagementIndex : 50) / 100;
  var coMgmt = cl(coMgmtBase * trbCoMgmtMult, 0, 1);
  // Co-management bonus: base resilience boost + TEK-specific error reduction
  var coMgmtBonus = coMgmt * 0.12 + trbTekBon; // combined up to ~0.27 at full investment

  // ── 1. CEREMONIAL SALMON ACCESS ──
  // First Salmon ceremonies require specific chinook stocks at specific seasonal timing.
  // Climate warming shifts run peaks earlier (~2 days/°C), disrupting generational knowledge
  // of when and where to harvest. Wild fraction matters — hatchery fish don't fulfill
  // ceremonial obligations for many tribes.
  var sstDelta_eco = ms.sst - 11; // baseline SST reference
  var runTimingShift = cl(Math.abs(sstDelta_eco) * 0.04, 0, 0.3); // phenological disruption
  var chinookHealth = newStocks.chinook ? cl(newStocks.chinook.totalReturn / 100, 0, 1) : salmonHealth;
  var wildFraction = nSal.wildFrac !== undefined ? nSal.wildFrac : 0.65;
  var ceremonialAccess = cl(chinookHealth * 0.4 + wildFraction * 0.25
    + (1 - runTimingShift) * 0.2 + coMgmtBonus + bi * 0.15 - sp * 0.5, 0, 1);

  // ── 2. TRADITIONAL FOOD SECURITY ──
  // Composite across salmon + shellfish + herring + Dungeness crab.
  // Each food source has different vulnerability pathways.
  // Food security is the minimum of individual sources weighted by cultural importance.
  var salmonFood = cl(salmonHealth * (1 - tissueContam.salmon * 0.13) + coMgmtBonus, 0, 1);
  // Shellfish food now driven by actual oyster population + general viability
  var shellfishFood = cl((oysterPop * 0.5 + shellfishViab * 0.5) * (1 - (ms.shellfishClosureFrac || 0)) * (1 - tissueContam.oyster * 0.20) + coMgmtBonus, 0, 1);
  var herringFood = cl(forageFishIndex * (1 - sp * 0.5) + coMgmtBonus, 0, 1); // broadened to all forage fish
  var crabFood = cl(crabPop * (1 - tissueContam.dungeness * 0.20) + coMgmtBonus, 0, 1);
  // Traditional food security — weakest link matters most (minimum weighted)
  var minFood = Math.min(salmonFood, shellfishFood, herringFood, crabFood);
  var avgFood = (salmonFood * 0.35 + shellfishFood * 0.25 + herringFood * 0.20 + crabFood * 0.20);
  var traditionalFoodSecurity = cl(avgFood * 0.6 + minFood * 0.4, 0, 1); // weakest link pulls down

  // ── 3. SHELLFISH HARVEST ACCESS ──
  // HAB closures, ocean acidification (Ω_aragonite), and contamination each
  // independently restrict traditional shellfish gathering on distinct pathways.
  // Tribes have usual and accustomed (U&A) shellfish beds — closures are not just
  // economic but disrupt intergenerational knowledge transfer.
  var habClosure = ms.shellfishClosureFrac || 0;
  var acidRestriction = cl((1 - shellfishViab) * 0.8, 0, 0.6); // Ω < 1.5 → larvae die
  var contamRestriction = cl((tissueContam.oyster * 0.55 + aquaContamination) * 0.6, 0, 0.5);
  var shellfishHarvestAccess = cl(1 - habClosure * 0.4 - acidRestriction - contamRestriction
    - sp * 0.7 + coMgmtBonus, 0, 1);

  // ── 4. CONTAMINATION ADVISORY BURDEN ──
  // PCBs/PFAS in traditional foods force communities to choose between
  // cultural practice and health. This is a unique form of injustice —
  // the contamination originates from industrial activities but the burden
  // falls on communities whose food systems depend on these waters.
  var pcbBurden = ms.pcb !== undefined ? cl(ms.pcb * 1.5, 0, 0.5) : cl((ms.contaminationLevel || 0) * 0.5, 0, 0.5);
  var pfasBurden = ms.pfas !== undefined ? cl(ms.pfas * 1.2, 0, 0.4) : cl((ms.contaminationLevel || 0) * 0.3, 0, 0.3);
  var contamAdvisoryBurden = cl(pcbBurden + pfasBurden + sp * 0.3, 0, 1);
  // Higher co-management → better monitoring → communities can make informed choices
  var contamAdvisoryImpact = cl(contamAdvisoryBurden * (1 - coMgmt * 0.2), 0, 1);

  // ── 5. CULTURAL KEYSTONE SPECIES ──
  // In Coast Salish worldview, orca (qwe'lhol'mechen) are relatives, not just wildlife.
  // Salmon are a gift that returns. Cedar is the tree of life. These are not
  // separate "resources" but parts of an interconnected cultural-ecological system.
  // Orca decline is experienced as family loss, not just biodiversity loss.
  var prevOrcaPop = prevOrca.population || 74;
  var prevOrcaV = cl(prevOrcaPop / 100, 0, 1);
  var orcaCultural = cl(prevOrcaV * 0.5 + (prevOrcaPop > 74 ? 0.2 : prevOrcaPop > 50 ? 0.1 : 0), 0, 0.7);
  var salmonCultural = cl(salmonHealth * 0.4 + wildFraction * 0.1, 0, 0.5);
  // Cedar/forest and marine vegetation as cultural anchors
  var marineHabitatCultural = cl(eelgrassEstab * 0.3 + bullKelpH * 0.2, 0, 0.5);
  var culturalKeystoneHealth = cl(orcaCultural + salmonCultural * 0.6 + marineHabitatCultural * 0.4
    + coMgmtBonus - sp * 0.3, 0, 1);

  // ── 6. CLIMATE DISPLACEMENT RISK ──
  // Warming shifts species ranges northward, shifts salmon run timing earlier,
  // and sea level rise inundates usual and accustomed fishing areas.
  // This erodes the foundation of place-based traditional ecological knowledge
  // that has been developed over millennia.
  var speciesRangeShift = cl(sstDelta_eco * 0.06, 0, 0.4); // northward displacement
  var slrInundation = ms.slr !== undefined ? cl(ms.slr / 80, 0, 0.3) : cl(sstDelta_eco * 0.03, 0, 0.2);
  var climateDisplacementRisk = cl(runTimingShift + speciesRangeShift + slrInundation
    - coMgmt * 0.15, 0, 1); // co-management enables adaptive strategies

  // ── AGGREGATED INDICES ──
  // Treaty fishery health: expanded from salmon-only to multi-dimensional
  var treatyFisheryHealth = cl(
    ceremonialAccess * 0.20
    + traditionalFoodSecurity * 0.25
    + shellfishHarvestAccess * 0.15
    + (1 - contamAdvisoryImpact) * 0.10
    + culturalKeystoneHealth * 0.15
    + (1 - climateDisplacementRisk) * 0.15, 0, 1);

  // Indigenous food sovereignty: can communities feed themselves from their waters?
  var indigenousFoodSovereignty = cl(traditionalFoodSecurity * 0.5
    + shellfishHarvestAccess * 0.25 + (1 - contamAdvisoryImpact) * 0.25, 0, 1);

  // Cultural loss: multi-dimensional — not just fish numbers but cultural integrity
  var indigenousCulturalLoss = cl(1 - (
    ceremonialAccess * 0.20
    + culturalKeystoneHealth * 0.25
    + traditionalFoodSecurity * 0.20
    + (1 - climateDisplacementRisk) * 0.20
    + coMgmt * 0.15), 0, 1);

  // Indigenous wellbeing detail for equity breakdown
  var indigenousDetail = {
    ceremonialAccess: ceremonialAccess,
    traditionalFoodSecurity: traditionalFoodSecurity,
    shellfishHarvestAccess: shellfishHarvestAccess,
    contamAdvisoryImpact: contamAdvisoryImpact,
    culturalKeystoneHealth: culturalKeystoneHealth,
    climateDisplacementRisk: climateDisplacementRisk,
    foodSovereignty: indigenousFoodSovereignty,
    coManagement: coMgmt,
  };

  // ── ORCA POPULATION — J/K/L POD DISAGGREGATION ──
  // Humpback competition: uses prev quarter's humpback pop to avoid circular dependency
  // Humpback competition: Type III — humpbacks concentrate in prey-rich areas.
  // Lower halfSat (0.06) than Type II because sigmoidal shape at low prey.
  // Piatt & Methven 1992.
  var prevHumpCompetition = cl(hollingIII((prevHumpback !== undefined && prevHumpback !== null) ? prevHumpback : 0.35, 0.06, 0.30), 0, 0.06);
  // Orca forage more effectively during summer residency period
  var orcaSeasonAdj = 0.9 + 0.1 * orcaSeasonMod; // 90% baseline + 10% seasonal
  // Orca prey: Type III for salmon (switching behavior — Ford & Ellis 2006: orca concentrate
  // effort where Chinook are, abandon areas when density low → prey refugium prevents extinction)
  // Type II retained for forage fish and phyto (secondary prey, non-switching)
  // halfSat 0.30 for Type III (lower than Type II's 0.55 because sigmoidal shape
  // requires lower halfSat to achieve equivalent consumption at moderate prey density)
  // Type III halfSat=0.25: at salmonHealth=0.5, gives 0.25/(0.0625+0.25)=0.80
  // vs old Type II halfSat=0.55: 0.5/(0.55+0.5)=0.48. Compensated by lower maxRate 0.28.
  var preyAvail=cl((hollingIII(salmonHealth, 0.25, 0.28) + hollingII(forageFishIndex, 0.22, 0.25) + hollingII((ms.phyto !== undefined ? ms.phyto : 500)/1000, 0.17, 0.20) - pinnipedCompetition - prevHumpCompetition) * orcaSeasonAdj, 0, 1);
  // #16 Whale watching adds localized acute noise to orca (from port exports via coupling)
  var wwOrcaDisturbance = (ms.wwDisturbance || 0) * 0.10; // reduces foraging efficiency
  // Orca: primarily affected by mid-frequency noise (masks echolocation)
  var orcaMidNoise = noiseMid > 0.5 ? (noiseMid - 0.5) * 1.8 : 0;
  var orcaNP=cl(orcaMidNoise * 0.7 + nS * 0.3, 0, 1)*(1-P.orcaProtectionLevel/100*0.6) + wwOrcaDisturbance;
  // Chronic vessel noise foraging efficiency loss (Williams R. et al. 2006, Lusseau et al. 2009):
  // Vessel presence reduces foraging time by 18-25%. Even at moderate baseline noise, orcas
  // spend significant energy on avoidance behavior rather than echolocation-based hunting.
  // Orca protection zones reduce but don't eliminate this effect.
  var vesselForagingLoss = cl(orcaNP * 0.15, 0, 0.18);
  var vesselDensityProxy = cl((ms.noiseIndex || 0.3) * 2, 0, 1);
  // Ship strike rate: reduced by orca protection AND by vessel speed zones (via reduced noise in port exports)
  var shipStrikeRate = vesselDensityProxy * 0.004 * (1 - P.orcaProtectionLevel/100 * 0.7);
  var prevPods = prevOrca.pods || {};
  var newPods = {};
  var totalPop = 0, totalBirths = 0, totalDeaths = 0, totalBC = 0;
  Object.keys(ORCA_PODS).forEach(function(pk) {
    var cfg = ORCA_PODS[pk];
    var prevPod = prevPods[pk] || { population: cfg.pop, bodyCondition: 0.6 };
    var podPrey = cl(preyAvail * cfg.preyPref + (1-cfg.preyPref) * forageFishIndex * 0.3, 0, 1);
    // Effective prey after chronic vessel noise foraging loss
    var effectivePrey = podPrey * (1 - vesselForagingLoss);
    var podNoise = orcaNP * cfg.noiseSens;
    var podContam = cl(tissueContam.orca * cfg.contaminantLoad, 0, 1);
    // ── ALLEE EFFECT — small populations face accelerating decline ──
    // Allee effects below N ≈ 10 per Krahn et al. 2004 framework; continuous
    // logistic transition replaces prior discrete tri-threshold (Session 2g
    // Chain B Path 1 remediation; pre-reg Amendment 5.1 §5.9 case (c)).
    // severity = 1 / (1 + exp(0.6 * (N - 10))): ~0.95 at N=5, 0.50 at N=10,
    // ~0.01 at N=18; scaled by peak magnitudes 0.06 (death) and 0.9 (birth).
    var prevPopCount = prevPod.population;
    var alleeSev = 1 / (1 + Math.exp(0.6 * (prevPopCount - 10)));
    var alleeDeathBoost = alleeSev * 0.06;
    var alleeBirthPenalty = alleeSev * 0.9;
    // Calf survival: prey-dependent intercept 0.62, boosted by effective prey (after foraging loss),
    // penalized by noise/contaminants. At typical effectivePrey ≈ 0.5-0.7 the baseline output
    // ≈ 0.80, loosely consistent with Lacy et al. 2017 (Sci. Rep. 7:14119) observed SRKW calf
    // first-year survival ~82.5% (17.48% annual calf mortality) over 1976-2014. Vessel foraging
    // loss reduces prey available for calves. Calibrated so baseline ≈ flat population
    // (births ≈ deaths). Real SRKW have been 72-75 for a decade.
    // Green transition (high prey, low noise) → vesselForagingLoss → 0, calfSurv → ~0.70 → recovery.
    // Collapse (low prey, high contam) drops calfSurv to ~0.35 → accelerating decline.
    var calfSurv = cl(0.62 + effectivePrey*0.35 - podNoise*0.12 - podContam*0.013 - sp*0.4, 0, 0.95);
    // Death rate: base mortality + starvation + body condition + ship strikes + Allee effect
    // + inbreeding depression. Inbreeding Ne attribution: Lacy et al. 2017 (Sci. Rep.
    // 7:14119) model projection Ne ≈ 27 = 37% of N=74, composited with Ford et al.
    // 2011 (J. Hered. 102:537-553) genetic Ne estimate ~25-35, among lowest of any
    // mammal population.
    //
    // Approximating Lacy 2017's Vortex 6.29 LE parameterization as ~0.001/qtr
    // mortality contribution at observed mean F ≈ 0.067. Not a paper-direct value;
    // modeling choice within the Lacy framework (Session 2g Chain B Path 2 —
    // explicit modeling-assumption reframe; pre-reg Amendment 5.1 §5.9 case (c)
    // grounding gap, entry 61 sub-i terminal).
    //
    // Calibration note (2026-03-24 hindcast): SRKW declined from 86→73 over 2010-2025
    // (~1% per year = ~0.0025/qtr net). The stress and starvation coefficients are
    // tuned so moderate stress produces a slow decline, not catastrophic collapse.
    // Only extreme sustained stress (e.g., collapse scenario) drives rapid decline.
    // Previous coefficients (totalStress*0.012 + (1-prey)*0.004) were 2-3x too high,
    // causing the model to predict 86→35 instead of 86→73.
    var inbreedingMort = 0.001;
    var bcMortality = (1 - prevPod.bodyCondition) * 0.002;
    // Environmental stress mortality: use diminishing returns (sqrt) so moderate stress
    // doesn't compound as catastrophically as extreme stress
    var stressMort = Math.sqrt(cl(totalStress, 0, 1)) * 0.008;
    // Starvation mortality: only kicks in when prey is genuinely scarce (<0.3)
    var starvationMort = effectivePrey < 0.3 ? (0.3 - effectivePrey) * 0.010 : 0;
    var deathRate = cl(cfg.baseMort + stressMort + starvationMort + shipStrikeRate + alleeDeathBoost + bcMortality + inbreedingMort, 0.01, 0.20);

    // ── DEMOGRAPHIC STOCHASTICITY (Lacy et al. 2017) ──
    // With only 74 SRKW total, random birth/death events matter.
    // Method: deterministic births/deaths drive the continuous population state
    // (preserving calibration), plus a zero-mean stochastic perturbation term
    // scaled to sqrt(N) representing demographic noise in small populations.
    // The perturbation is mean-reverting: it does NOT accumulate over time.
    // Seeded PRNG ensures reproducibility: same params → same results.
    var podSeedBase = (yearsSince2026 !== undefined ? yearsSince2026 : 0) * 4003 + Math.round(yf * 4) * 997;
    var podOffset = pk === 'J' ? 7 : pk === 'K' ? 3001 : 5003;

    // Deterministic births/deaths (preserves calibration)
    var podBirths = prevPopCount * cfg.birthRate * calfSurv * (1 - alleeBirthPenalty) * dt;
    var podDeaths = prevPopCount * deathRate * dt;

    // Demographic noise: zero-mean perturbation proportional to sqrt(population).
    // Larger pods show less relative noise; tiny pods show large fluctuations.
    // Uses seeded uniform → approximate normal via Irwin-Hall (sum of 4 uniforms).
    var r1 = seededRandom(podSeedBase + podOffset);
    var r2 = seededRandom(podSeedBase + podOffset + 7919);
    var r3 = seededRandom(podSeedBase + podOffset + 15073);
    var r4 = seededRandom(podSeedBase + podOffset + 22111);
    var zNoise = (r1 + r2 + r3 + r4 - 2.0); // approx N(0,1/sqrt(3)) — range roughly ±2
    var demoNoise = zNoise * Math.sqrt(Math.max(prevPopCount, 1)) * 0.12;

    // Pods CAN go extinct (floor = 0, not 2). Fractional population maintained for calibration.
    var podPop = cl(prevPopCount + podBirths - podDeaths + demoNoise, 0, 100);
    var extRisk = podPop < 5 ? cl(0.5 + (5 - podPop) / 5 * 0.5, 0.5, 1.0) : podPop < 10 ? cl((10 - podPop) / 10 * 0.5, 0, 0.5) : podPop < 18 ? cl((18 - podPop) / 36 * 0.1, 0, 0.1) : 0;
    // Body condition: foraging efficiency reduced by vessel noise → slower BC recovery
    var podBC = cl(prevPod.bodyCondition * 0.7 + effectivePrey * 0.3, 0, 1);
    newPods[pk] = { population: podPop, births: podBirths, deaths: podDeaths, bodyCondition: podBC, extinctionRisk: extRisk };
    totalPop += podPop; totalBirths += podBirths; totalDeaths += podDeaths; totalBC += podBC * podPop;
  });
  // Total population: no artificial floor. If all pods collapse, that's extinction.
  var newPop = cl(totalPop, 0, 200);
  var orcaV=cl(newPop/100,0,1);

  // ── INDIVIDUAL-BASED MODEL (parallel tracking) ──
  // Runs alongside population model — IBM tracks named individuals for UI/education,
  // population model provides calibrated aggregates for simulation coupling.
  var prevIBM = _pe.orcaIBM || null;
  var ibmSeed = (yearsSince2026 !== undefined ? yearsSince2026 : 0) * 10007 + Math.round(yf * 12) * 997;
  var ibmMonth = Math.round(yf * 12) % 12;
  var ibmYear = 2026 + (yearsSince2026 || 0);
  var orcaIBMResult = computeOrcaIBM(prevIBM, preyAvail, orcaNP, tissueContam.orca, ibmMonth, ibmYear, dt, ibmSeed);

  // ── HUMPBACK WHALE (Megaptera novaeangliae) ──
  // Dramatic recovery story: ~7%/yr growth in the Salish Sea since 2010.
  // Now ~500+ seasonally in the region (up from near-zero in 1960s).
  // Creates MANAGEMENT TENSION with orca recovery:
  //   - Competes with SRKW for herring/forage fish
  //   - Vessel speed zones benefit BOTH species
  //   - Growing humpback tourism competes with orca-watching economy
  //   - Vessel strikes are the #1 mortality source for humpbacks here
  // A recovering species that complicates the narrative — good news that creates new problems.
  var prevHump = (prevHumpback !== undefined && prevHumpback !== null) ? prevHumpback : 0.35; // ~35% of regional K
  // Carrying capacity: forage-limited (herring, krill proxy via zooplankton)
  var humpForage = cl(forageFishIndex * 0.4 + (ms.zoo || 200) / 600 * 0.4 + bi * 0.2, 0, 1);
  var humpK = cl(humpForage * 0.8 + 0.20, 0.15, 0.9);
  // Growth rate: robust recovery at ~7%/yr when forage is good, slowing as K approached
  var humpGrowthRate = 0.09 * cl(humpForage, 0.2, 1);
  var humpGrowth = humpGrowthRate * prevHump * (1 - prevHump / Math.max(humpK, 0.05)) * 0.25 * dt;
  // Vessel strike: primary anthropogenic mortality source
  // Speed reduction zones dramatically reduce strike risk (~80% reduction)
  // Humpbacks primarily affected by low-frequency noise (masks communication)
  var humpLowNoiseStress = cl(noiseLow * 0.08, 0, 0.05);
  var humpStrikeRate = cl(ms.noiseIndex * 0.006 * (1 - (P.orcaProtectionLevel || 0) / 100 * 0.7), 0, 0.005);
  var humpStrikeMort = humpStrikeRate * prevHump * dt;
  // Entanglement in fishing gear: proportional to fishing pressure
  var humpEntanglement = (P.fishingPressure / 100) * 0.001 * prevHump * dt;
  // Oil spill: surface feeders vulnerable
  var humpOilMort = sp * 0.15 * prevHump * dt;
  // Low-frequency noise stress reduces humpback feeding efficiency
  var humpNoiseMort = humpLowNoiseStress * prevHump * 0.25 * dt;
  var humpbackPop = cl(prevHump + humpGrowth - humpStrikeMort - humpEntanglement - humpOilMort - humpNoiseMort, 0, 1);
  // Competition with SRKW: humpbacks consume significant herring/forage fish
  // At high humpback density, effectively reduces forage available to orca
  var humpOrcaCompetition = cl(humpbackPop * 0.08, 0, 0.06); // up to 6% prey reduction for orca
  // Whale watching: humpbacks are now a bigger tourism draw than orca in many areas
  var humpTourismBonus = cl(humpbackPop * 0.3, 0, 0.15); // adds to recreation value

  // ── BIGG'S (TRANSIENT) KILLER WHALE (Orcinus orca, Bigg's ecotype) ──
  // Ecologically distinct from SRKW: eat marine mammals (seals, sea lions, porpoises),
  // not fish. Population ~400 and growing (~3-4%/yr), vs SRKW ~73 and declining.
  // Travel in small matrilineal groups (3-5), not large pods.
  // Among the most PCB-contaminated marine mammals on Earth — biomagnification via
  // pinniped prey puts them one trophic level above SRKW for persistent organics.
  // Sources: Towers et al. 2019, Ford et al. 2007, Shields et al. 2018, Houghton et al. 2015
  var prevBig = (prevBiggs !== undefined && prevBiggs !== null) ? prevBiggs : 0.80; // ~400 of ~500 K
  // Pinnipedal culling policy: reduces seal/sea lion populations but also Bigg's prey
  var pinnCullFrac = cl((P.pinnipedCulling !== undefined ? P.pinnipedCulling : 0) / 100, 0, 1);
  // Apply culling to pinniped population (modifies pinnPop for downstream salmon calc)
  var pinnCullMort = pinnCullFrac * 0.15; // up to 15% additional pinniped mortality per quarter
  pinnPop = cl(pinnPop * (1 - pinnCullMort * dt), 5000, 100000);
  // Recalculate pinniped predation on salmon after culling
  pinnipedPredation = cl(hollingII(Math.max(pinnPop / 40000 - 1, 0), 0.25, 0.5) * 0.35, 0, 0.25);
  pinnipedCompetition = cl(pinnPop / 80000, 0, 0.15);

  // Bigg's prey: harbor seals (~80%), porpoises (~5%), other marine mammals (~15%)
  var biggsPinnipedPrey = cl(pinnPop / 50000, 0.1, 1.2); // seal/sea lion availability
  var biggsPorpoisePrey = cl(porpoisePop * 0.5, 0, 0.3); // minor prey source
  var biggsPreyAvail = cl(biggsPinnipedPrey * 0.85 + biggsPorpoisePrey * 0.05 + bi * 0.10, 0, 1);
  // Seasonal presence: peaks Apr-May and Aug-Sep in Salish Sea (Houghton et al. 2015)
  var biggsSeasonMod = cl(seasonalPeak(quarter, 1.2, 0.6) * 0.5 + seasonalPeak(quarter, 2.5, 0.6) * 0.5, 0.3, 1.2);
  // Carrying capacity: limited by pinniped prey abundance
  var biggsK = cl(biggsPreyAvail * 0.9 + 0.15, 0.2, 1.0);
  // Growth: ~3-4%/yr when prey is adequate (Towers et al. 2019 photo-ID: consistent recruitment)
  var biggsGrowthRate = 0.04 * cl(biggsPreyAvail, 0.3, 1);
  var biggsGrowth = biggsGrowthRate * prevBig * (1 - prevBig / Math.max(biggsK, 0.1)) * 0.25 * dt;
  // Noise: Bigg's use stealth hunting (not echolocation), less affected than SRKW
  // but still impacted by vessel disturbance during surface breathing, travel
  var biggsNoiseEffect = cl(nS * 0.3, 0, 0.1); // 30% sensitivity vs SRKW (stealth hunters)
  // PCB burden: highest of any marine mammal. Ross et al. 2000 (Mar. Pollut. Bull.
  // 40:504-515): transient (Biggs) males 251.2 mg/kg lipid, transient females 58.8
  // mg/kg lipid (compare SRKW males 146.3, SRKW females 55.4). Biggs occupy TL 4.5
  // (pinniped prey) vs SRKW TL 4.0 (salmon prey) — empirical trophic-position
  // differential drives higher biomagnification burden.
  // PCB-related calf mortality and immune suppression
  var biggsPCBBurden = tissueContam.biggsOrca;
  var biggsPCBMort = cl(biggsPCBBurden * 0.008, 0, 0.03); // PCB reproductive/immune effect
  // Vessel strike: moderate risk, less concentrated than SRKW in specific corridors
  var biggsStrikeRate = vesselDensityProxy * 0.002 * (1 - (P.orcaProtectionLevel || 0) / 100 * 0.4);
  // Oil spill: surface mammals, vulnerable during hunting
  var biggsOilMort = sp * 0.20;
  var biggsMort = cl(0.015 + biggsNoiseEffect * 0.02 + biggsPCBMort + biggsStrikeRate + biggsOilMort + volcano * 0.05, 0.005, 0.15);
  var biggsDeaths = biggsMort * prevBig * 0.25 * dt;
  var biggsOrcaPop = cl(prevBig + biggsGrowth - biggsDeaths, 0, 1.5);
  // Bigg's predation on pinnipeds: natural top-down control
  // More Bigg's → more seal mortality → less seal predation on salmon → indirect SRKW benefit
  var biggsSealPredation = cl(biggsOrcaPop * biggsSeasonMod * 0.04, 0, 0.08);
  // Reduce pinniped population by Bigg's predation
  pinnPop = cl(pinnPop * (1 - biggsSealPredation * dt), 5000, 100000);
  // Final recalculation of pinniped predation on salmon after Bigg's top-down effect
  pinnipedPredation = cl(hollingII(Math.max(pinnPop / 40000 - 1, 0), 0.25, 0.5) * 0.35, 0, 0.25);
  // Bigg's body condition tracks prey availability
  var biggsBodyCondition = cl(prevBig > 0.01 ? biggsPreyAvail * 0.6 + (1 - biggsPCBBurden * 0.3) * 0.4 : 0, 0, 1);
  // Whale watching boost: Bigg's sightings increasingly drive tourism (PWWA reports)
  var biggsTourismBonus = cl(biggsOrcaPop * biggsSeasonMod * 0.12, 0, 0.10);

  // ── GRAY WHALE (Eschrichtius robustus) — Benthic-Pelagic Coupling ──
  // ~30 resident "sounders" feed in Salish Sea on benthic amphipods, ghost shrimp, mysids.
  // Connects benthic substrate layer to marine mammal food web.
  // Spring northward migration is a major whale watching event.
  // Sources: Calambokidis et al. 2002, Scordino et al. 2017, Darling et al. 1998
  var prevGray = (prevGrayWhale !== undefined && prevGrayWhale !== null) ? prevGrayWhale : 0.30; // ~30 of ~100 SS K
  // Prey: benthic amphipods/infauna (70%), ghost shrimp (20%), mysids (10%)
  var grayBenthicPrey = cl(benthicInfaunaBiomass * 0.7 + mudHabitatQuality * 0.2 + bi * 0.1, 0, 1);
  // Seasonal presence: peaks Mar-May (spring migration) and Jun-Oct (summer feeding)
  var graySeasonMod = cl(seasonalPeak(quarter, 1.5, 1.2), 0.2, 1.2);
  var grayK = cl(grayBenthicPrey * 0.5 + 0.10, 0.05, 0.6);
  // Growth: slow, ~4%/yr (large whale, long-lived)
  var grayGrowthRate = 0.04 * cl(grayBenthicPrey, 0.3, 1);
  var grayGrowth = grayGrowthRate * prevGray * (1 - prevGray / Math.max(grayK, 0.05)) * 0.25 * dt;
  // Mortality: vessel strikes primary anthropogenic source (shipping lane overlap)
  var grayStrikeRate = cl(vesselDensityProxy * 0.005 * (1 - (P.orcaProtectionLevel || 0) / 100 * 0.5), 0, 0.004);
  var grayStrikeMort = grayStrikeRate * prevGray * dt;
  // Entanglement, oil spill, noise (low-frequency sensitive like humpback)
  var grayOilMort = sp * 0.15 * prevGray * dt;
  var grayNoiseMort = cl(noiseLow * 0.03, 0, 0.02) * prevGray * 0.25 * dt;
  var grayWhalePop = cl(prevGray + grayGrowth - grayStrikeMort - grayOilMort - grayNoiseMort, 0, 1);
  // Whale watching: spring migration is a major tourism draw
  var grayTourismBonus = cl(grayWhalePop * graySeasonMod * 0.08, 0, 0.06);

  // ── HAB IMPACT ON FISHERIES ──
  // Shellfish closures from HABs reduce fisheries yield and recreation value
  var habPenalty = cl((ms.shellfishClosureFrac || 0) * 0.3, 0, 0.3);
  // Green crab preys on juvenile bivalves and shellfish → fisheries yield penalty
  var gcFisheriesPenalty = cl(greenCrabPop * 0.15, 0, 0.15);
  // Ω_aragonite-based shellfish viability penalty: low Ω → larval mortality → industry loss
  var omegaFisheriesPenalty = cl((1 - shellfishViab) * 0.25, 0, 0.25);
  var ff=1-(P.fishingPressure/100)*0.8, fy=cl(bi*(ms.phyto||500)*0.4*ff*(0.7+aggSalSeason*0.3)*(1-habPenalty)*(1-gcFisheriesPenalty)*(1-omegaFisheriesPenalty) + crabRevenue*2 + oysterRevenue*2 + geoduckRevenue*2,0,5000);
  // Invasive species suppress native biodiversity
  // Invasive species suppress native biodiversity; seabirds add trophic completeness
  // #8 Ballast water invasive pressure reduces native biodiversity
  var invasivePress = ms.invasivePressure || 0;
  var biAdj = cl(bi - greenCrabPop * 0.08 + seabirdIndex * 0.05 + rockfishTrophicBonus + oysterPop * 0.03 - invasivePress * 0.06 - urchinGrazing * 0.08 + murreletPop * 0.03 + humpbackPop * 0.02 + geoduckPop * 0.01 + lingcodPop * 0.03 + seaOtterPop * 0.04 + porpoisePop * 0.02 + lampreyPop * 0.02 + biggsOrcaPop * 0.02 + grayWhalePop * 0.01 + pteropodPop * 0.01 - jellyfishPop * 0.04 - jellyForageSuppression - aquaContamination * 0.04, 0, 1);
  var ec2=cl(P.protectedAreaFraction/100*0.4+P.orcaProtectionLevel/100*0.2+(biAdj<0.4?0.3:0)+sp*0.4,0,1);
  var rv=cl(biAdj*0.4+kelpH*0.2+orcaV*0.3+(1-totalStress)*0.1-sp*0.5-habPenalty*0.3+seabirdIndex*0.05+humpTourismBonus+biggsTourismBonus+grayTourismBonus,0,1);

  return{state:{primaryProduction:ms.phyto||500,tissueContamination:tissueContam,totalStress:totalStress,biodiversityIndex:biAdj,fisheriesYield:fy,ecologicalConstraints:ec2,recreationValue:rv,oxygenStress:oS,tempStress:tS,acidStress:aS,noiseStress:nS*0.5,spillStress:spS,salmonRunStrength:salmonRun,orcaViability:orcaV,kelpHealth:kelpH,eelgrassHealth:eelgrassH,eelgrassEstablishment:eelgrassEstab,eelgrassRegimeShift:eelgrassEstab<0.3?1:0,bullKelpHealth:bullKelpH,herringPop:herringPop,herringAge:herringAgeStruct,cherryPointAge:cpAgeStruct,forageFishIndex:forageFishIndex,sandLancePop:sandLance,surfSmeltPop:surfSmelt,seabirdIndex:seabirdIndex,treatyFisheryHealth:treatyFisheryHealth,indigenousCulturalLoss:indigenousCulturalLoss,indigenousFoodSovereignty:indigenousFoodSovereignty,indigenousDetail:indigenousDetail,ceremonialAccess:ceremonialAccess,shellfishHarvestAccess:shellfishHarvestAccess,contamAdvisoryImpact:contamAdvisoryImpact,culturalKeystoneHealth:culturalKeystoneHealth,climateDisplacementRisk:climateDisplacementRisk,salmonHealth:salmonHealth,orcaPopulation:newPop,orcaPods:newPods,salmonStocks:newStocks,pinnipedPop:pinnPop,pinnipedPredation:pinnipedPredation,habIntensity:ms.habIntensity||0,shellfishClosure:ms.shellfishClosureFrac||0,mhwActive:mhwActive,mhwIntensity:mhwIntensity,greenCrabPop:greenCrabPop,greenCrabDamage:gcEelgrassDamage,omegaAragonite:ms.omegaAragonite||2.0,shellfishViability:shellfishViab,minOmega:ms.minOmegaAragonite||2.0,dungenessCrabPop:crabPop,dungenessCrabRevenue:crabRevenue,pacificOysterPop:pacificOyster,olympiaOysterPop:olympiaOyster,oysterPop:oysterPop,oysterFiltration:oysterFiltration,oysterRevenue:oysterRevenue,oysterHABClosure:oystHABClosure,rockfishPop:rockfishPop,urchinPop:urchinPop,deepUrchinPop:deepUrchinPop,urchinGrazing:urchinGrazing,geoduckPop:geoduckPop,geoduckRevenue:geoduckRevenue,murreletPop:murreletPop,humpbackPop:humpbackPop,humpOrcaCompetition:humpOrcaCompetition,jellyfishPop:jellyfishPop,jellyForageSuppression:jellyForageSuppression,lingcodPop:lingcodPop,seaOtterPop:seaOtterPop,porpoisePop:porpoisePop,lampreyPop:lampreyPop,octopusPop:octopusPop,cherryPointHerring:cherryPointHerring,sunflowerStarPop:sunflowerStarPop,biggsOrcaPop:biggsOrcaPop,biggsBodyCondition:biggsBodyCondition,biggsPreyAvail:biggsPreyAvail,biggsPCBBurden:biggsPCBBurden,biggsSealPredation:biggsSealPredation,biggsTourismBonus:biggsTourismBonus,pteropodPop:pteropodPop,pteropodPreyBonus:pteropodPreyBonus,grayWhalePop:grayWhalePop,grayTourismBonus:grayTourismBonus,aquacultureIntensity:aquaFrac,aquaculturePolicy:aquaPolicy,seaLicePressure:seaLicePressure,prvPressure:prvPressure,aquaContamination:aquaContamination,aquaJobs:aquaJobs,aquaRevenue:aquaRevenue,slrStrategy:slrStrategy,phenoMismatchIndex:phenoMismatchIndex,seasonalPhase:quarter,slrFloodReduction:slrFloodReduction,slrPropertyLoss:slrPropertyLoss,slrCost:slrCost,substrateSuitability:substrateSuit,beachHealth:beachHealth,coastalSqueeze:coastalSqueeze,bluffErosionRate:effectiveErosion,microbialLoop:microbialLoop,euphausiidBiomass:euphausiidBiomass,benthicInfaunaBiomass:benthicInfaunaBiomass,epibenthicCrustBiomass:epibenthicCrustBiomass,epiphyteBiomass:epiphyteBiomass,bioturbationRate:bioturbationRate,sandWaveIntegrity:sandWaveIntegrity,sandWaveQuality:sandWaveQuality,rockyReefQuality:rockyReefQuality,mudHabitatQuality:mudHabitatQuality,orcaIBM:orcaIBMResult?{population:orcaIBMResult.population,events:orcaIBMResult.events,podCounts:{J:orcaIBMResult.pods.J?orcaIBMResult.pods.J.population:0,K:orcaIBMResult.pods.K?orcaIBMResult.pods.K.population:0,L:orcaIBMResult.pods.L?orcaIBMResult.pods.L.population:0},acousticMasking:orcaIBMResult.acousticMasking||null}:null,salmonOcean:salmonOceanResult?salmonOceanResult.diagnostics:null},salmon:nSal,orca:{population:newPop,births:totalBirths,deaths:totalDeaths,bodyCondition:totalPop>0?totalBC/totalPop:0,pods:newPods},pinniped:{population:pinnPop,trend:prevPinn.trend},eelgrassEstab:eelgrassEstab,greenCrab:greenCrabPop,dungenessCrab:crabPop,oyster:{pacific:pacificOyster,olympia:olympiaOyster},forageFish:{sandLance:sandLance,surfSmelt:surfSmelt},rockfish:rockfishPop,urchin:urchinPop,deepUrchin:deepUrchinPop,geoduck:geoduckPop,murrelet:murreletPop,humpback:humpbackPop,seaOtter:seaOtterPop,jellyfish:jellyfishPop,lingcod:lingcodPop,lamprey:lampreyPop,porpoise:porpoisePop,herring:herringAgeStruct,bullKelp:bullKelpH,octopus:octopusPop,cherryPointHerring:cpAgeStruct,sunflowerStar:sunflowerStarPop,biggsOrca:biggsOrcaPop,pteropod:pteropodPop,grayWhale:grayWhalePop,armoringFrac:armoringFrac,microbialLoop:microbialLoop,euphausiids:euphausiidBiomass,benthicInfauna:benthicInfaunaBiomass,epibenthicCrust:epibenthicCrustBiomass,epiphytes:epiphyteBiomass,sandWaveIntegrity:sandWaveIntegrity,orcaIBM:orcaIBMResult?{individuals:orcaIBMResult.individuals,nextId:orcaIBMResult.nextId}:null,salmonOcean:salmonOceanResult?salmonOceanResult._carry:null,exports:{fisheriesYield:fy,ecologicalConstraints:ec2,recreationValue:rv,biologicalOxygenDemand:cl((ms.phyto||500)*0.003+(1-biAdj)*2,0,10),primaryProduction:ms.phyto||500,biogenicMixing:cl(biAdj*0.7,0,1),indigenousCulturalLoss:indigenousCulturalLoss,slrFloodReduction:slrFloodReduction,slrPropertyLoss:slrPropertyLoss,slrCost:slrCost}};
}
