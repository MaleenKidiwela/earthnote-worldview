// ═══════════════════════════════════════════════════════════
// computeBiogeochem.js — Biogeochemical Cycling Engine
// ═══════════════════════════════════════════════════════════
// Proper N/C/P/Si/O2 budgets for the Salish Sea marine system.
// Fixes conservation law violations identified in the engine audit:
//   - Nutrient ghost sink (flushed detritus never returns N)
//   - Missing carbonate pump (CaCO3 precipitation/dissolution)
//   - Oxygen double-counting (single-box + 2-layer)
//
// This module computes per-basin, per-layer biogeochemical state.
// It is designed to be called alongside (not replacing) computeMarineBasins,
// providing corrected nutrient/carbon/oxygen values that can gradually
// replace the ad-hoc calculations in the marine module.
//
// Redfield stoichiometry: C:N:P:O2 = 106:16:1:138; Si:N = 1:1 for diatoms
//
// Key references:
//   Mackas & Harrison 1997 — Puget Sound nutrient budgets
//   Khangaonkar et al. 2012, 2018 — Salish Sea Model (PNNL/EPA)
//   Devol & Christensen 1993 — denitrification in Puget Sound sediments
//   Pelletier et al. 2017 (WA Ecology 17-03-010); Ahmed et al. 2019
//     (WA Ecology 19-03-001); Pamatmat & Banse 1969 (L&O 14(2):250-259);
//     Khangaonkar et al. 2018 (JGR-Oceans 123(7):4735-4761) — Hood Canal SOD
//   Feely et al. 2010, 2016 — carbonate chemistry in Salish Sea
//   Fassbender et al. 2016, 2018 — air-sea CO2 flux in NE Pacific
//   Evans et al. 2019 — Salish Sea carbon budget
//   Ragueneau et al. 2006 — silica cycling
//   Trainer et al. 2002 — Si:N ratio and HAB community shifts
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl } from './utils.js';
import { BASINS, EXCHANGE, SUB_BASINS, SUB_BASIN_IDS, PARENT_BASINS } from './basins.js';
import { BENTHIC_SUBSTRATE, TIDAL_CURRENT_STRENGTH } from '../config/benthicSubstrate.js';
import { co2sysCalc } from './co2sys.js';

// ── REDFIELD RATIOS ──
var RF_C_N = 106 / 16;    // mol C per mol N
var RF_O2_C = 138 / 106;  // mol O2 per mol C (photosynthesis/respiration)
var RF_N_P = 16;           // mol N per mol P
var RF_Si_N = 1;           // mol Si per mol N (diatoms only)

// ── INITIAL SEDIMENT OM POOLS (g C/m²) ──
// Values cited to Burdige 2006 Table 10.5 (hypoxic fjord range 400–1200 g C/m² for ~1–2 cm
// reactive layer) and Brandenberger et al. 2011 (Hood Canal surface sediment TOC).
// Hood Canal South (Lynch Cove) highest due to decades of accumulation in poorly flushed basin.
// TODO: 8 of 18 sub-basins currently inherit parent basin's initial value (see fallback in the
// sediment loop). Candidate datasets for future sub-basin-specific initialization: NOAA OR&R
// sediment surveys; EPA Superfund RODs for main_north (Duwamish) and main_south (Commencement
// Bay); Puget Sound Partnership sediment monitoring; NANOOS/ORCA sediment-trap collections.
var SEDIMENT_OM_INIT = {
  // Parent-basin values (used when sub-basin value is not defined)
  hoodCanal: 650, southSound: 350, mainBasin: 300, georgia: 320,
  whidbey: 280, sanjuan: 100, juanDeFuca: 80,
  // Sub-basin values (from sediment core data where available)
  hood_south: 800, hood_north: 500,
  ssound_south: 400, ssound_north: 300,
  main_north: 350, main_central: 280, main_south: 320,
  georgia_central: 350, georgia_south: 300, georgia_north: 280,
  // Sub-basins without explicit initial values inherit the parent basin value at lookup time.
};

export function computeBiogeochem(basins, prev, quarter, year, pac, ws, fraser, climExports, bgcParams, coupling, dt, subBasins) {
  var _prev = prev || {};
  var _dt = dt !== undefined ? dt : 1; // quarterly units: 1 = quarter, 1/3 = month
  var _subBasins = subBasins || null;   // per-sub-basin state from computeMarineBasins; undefined in direct test calls
  var basinKeys = Object.keys(BASINS);

  // ── BIOGEOCHEMISTRY PARAMETERS ──
  // Previously hardcoded; now user-adjustable via config/defaults.js
  var BP = bgcParams || {};
  // denitrificationRate (default 15%): fraction of remineralized N lost as N2
  // Devol & Christensen 1993: PS sediment denitrification 10-20% of sinking N
  var denitrFrac = (BP.denitrificationRate !== undefined ? BP.denitrificationRate : 15) / 100;
  // sedimentOxygenDemand (default 100%): modifier on SOD calculation
  // 100% = Hood Canal basin-mean baseline per Pelletier et al. 2017 + Ahmed et al.
  //   2019 composite (0.3-0.8 g O2/m²/day; low end of Salish Sea distribution
  //   consistent with two-layer fjord circulation and near-stagnant deep bottom layer,
  //   Khangaonkar et al. 2018). Higher = more legacy pollution.
  var sodMod = (BP.sedimentOxygenDemand !== undefined ? BP.sedimentOxygenDemand : 100) / 100;
  // calcificationRate (default 100%): modifier on CaCO3 precipitation/dissolution
  var calcMod = (BP.calcificationRate !== undefined ? BP.calcificationRate : 100) / 100;
  // atmosphericCO2 (default 420 ppm): drives air-sea CO2 flux and pH decline
  var atmCO2 = BP.atmosphericCO2 !== undefined ? BP.atmosphericCO2 : 420;
  // sedimentBurialRate (default 40‰/yr): permanent carbon sequestration rate
  var burialMod = (BP.sedimentBurialRate !== undefined ? BP.sedimentBurialRate : 40) / 1000;

  // Sediment sub-model parameters (native-value convention — see defaults.js sediment block)
  var SP = BP.sediment || {};
  var sinkingFrac     = SP.sinkingFrac     !== undefined ? SP.sinkingFrac     : 0.30; // Khangaonkar 2012
  var benthicFluxFrac = SP.benthicFluxFrac !== undefined ? SP.benthicFluxFrac : 0.50; // Martin et al. 1987
  var benthicAccumFrac= SP.benthicAccumFrac!== undefined ? SP.benthicAccumFrac: 0.40; // Burdige 2006 Ch.5
  var sedQ10          = SP.q10             !== undefined ? SP.q10             : 2.0;  // Burdige 2006
  var decayRatePerMonth = SP.decayRatePerMonth !== undefined ? SP.decayRatePerMonth : 0.003; // Burdige 2006 Table 5.1
  var burialO2Min     = SP.burialO2Min     !== undefined ? SP.burialO2Min     : 0.8;  // Hedges & Keil 1995
  var burialO2Max     = SP.burialO2Max     !== undefined ? SP.burialO2Max     : 2.0;  // Hedges & Keil 1995
  // Substrate-dependent decomposition (Session 2b): Keil et al. 1994 surface-area binding, Burdige 2007 Table 2
  var substrateMudFactor    = SP.substrateMudFactor    !== undefined ? SP.substrateMudFactor    : 0.4;
  var substrateCoarseFactor = SP.substrateCoarseFactor !== undefined ? SP.substrateCoarseFactor : 1.6;
  // Resuspension (Session 2b): Sanford & Maa 2001, Le Hir et al. 2001 (threshold); coefficient order-of-magnitude
  var resuspensionThreshold     = SP.resuspensionThreshold     !== undefined ? SP.resuspensionThreshold     : 0.15;
  var resuspensionCoefPerMonth  = SP.resuspensionCoefPerMonth  !== undefined ? SP.resuspensionCoefPerMonth  : 0.01;
  var maxResuspendFracPerMonth  = SP.maxResuspendFracPerMonth  !== undefined ? SP.maxResuspendFracPerMonth  : 0.15;
  // Sediment phase-coupling β: stratification-deficit modulation coefficient on SOD-to-deep-DO
  // coupling at the per-basin export site (advisory path; pre-reg 09fd936 §2 Change 3 + §11
  // Amendment 2). Mechanism-bounded β ∈ [0.5, 2.0] per pre-reg §4 + §11 Amendment 4.
  // Renewal-locked seasonality framing: Newton et al. 2011 (Hood Canal HCDOP overview).
  // Bioturbation/stratification-duration framework: Kristensen et al. 2012; Middelburg & Levin 2009.
  var stratDeficitBeta = SP.stratDeficitBeta !== undefined ? SP.stratDeficitBeta : 1.0;

  // Pacific source water (from computePacific or defaults)
  var srcDIN = pac ? cl((pac.pacSourceNutrients !== undefined ? pac.pacSourceNutrients : 25), 10, 50) : 25; // µmol/L
  var srcDIP = srcDIN / RF_N_P; // Redfield P
  var srcDSi = pac ? cl(srcDIN * 1.5, 15, 60) : 40; // Si:N > 1 in upwelled water
  var srcDIC = pac ? (pac.pacSourceDIC !== undefined ? pac.pacSourceDIC : 2100) : 2100;
  var srcTA = pac ? (pac.pacSourceTA !== undefined ? pac.pacSourceTA : 2250) : 2250;
  var srcO2 = pac ? (pac.pacSourceDO !== undefined ? pac.pacSourceDO : 2.8) : 2.8; // mg/L
  var solarMod = climExports ? (climExports.climSolarMod !== undefined ? climExports.climSolarMod : 1.0) : 1.0;

  // River nutrient loading (from watershed/Fraser)
  var wsNitrogen = ws ? (ws.dissolvedNitrogen !== undefined ? ws.dissolvedNitrogen : 250) : 250;
  var frNitrogen = fraser ? (fraser.fraserNitrogen !== undefined ? fraser.fraserNitrogen : 400) : 400;

  // Atmospheric N deposition: ~0.5 kg N/ha/yr for Puget Sound (Mackas & Harrison 1997)
  // Total area ~10,000 km² = 1e6 ha → 5e5 kg N/yr → ~1400 kg/day → ~0.35 kg/day/basin (7 basins)
  var atmNDeposition = 0.35; // kg N/day per basin (small but non-zero)

  // ── PER-BASIN BIOGEOCHEMISTRY ──
  var bgcResults = {};
  var totalBudgets = { nResidual: 0, pResidual: 0, cResidual: 0 };

  for (var bi = 0; bi < basinKeys.length; bi++) {
    var id = basinKeys[bi];
    var def = BASINS[id];
    var basin = basins[id];
    if (!basin) continue;

    var vol = def.vol; // km³
    var volM3 = vol * 1e9; // m³

    // Previous state (or initialize from basin data)
    var prevBGC = _prev[id] || {};

    // ── SURFACE LAYER ──
    var surf = basin.surface || {};
    var deep = basin.deep || {};

    // DIN (dissolved inorganic nitrogen, µmol/L)
    var prevDIN_s = prevBGC.DIN_s !== undefined ? prevBGC.DIN_s : (surf.nutrients !== undefined ? surf.nutrients : 8);
    var prevDIN_d = prevBGC.DIN_d !== undefined ? prevBGC.DIN_d : (deep.nutrients !== undefined ? deep.nutrients : 18);

    // DIP (dissolved inorganic phosphorus, µmol/L)
    var prevDIP_s = prevBGC.DIP_s !== undefined ? prevBGC.DIP_s : prevDIN_s / RF_N_P;
    var prevDIP_d = prevBGC.DIP_d !== undefined ? prevBGC.DIP_d : prevDIN_d / RF_N_P;

    // DSi (dissolved silica, µmol/L)
    var prevDSi_s = prevBGC.DSi_s !== undefined ? prevBGC.DSi_s : 15;
    var prevDSi_d = prevBGC.DSi_d !== undefined ? prevBGC.DSi_d : 35;

    // DIC (dissolved inorganic carbon, µmol/kg)
    var prevDIC_s = prevBGC.DIC_s !== undefined ? prevBGC.DIC_s : (surf.DIC !== undefined ? surf.DIC : 1980);
    var prevDIC_d = prevBGC.DIC_d !== undefined ? prevBGC.DIC_d : (deep.DIC !== undefined ? deep.DIC : 2200);

    // TA (total alkalinity, µmol/kg)
    var prevTA_s = prevBGC.TA_s !== undefined ? prevBGC.TA_s : (surf.TA !== undefined ? surf.TA : 2150);
    var prevTA_d = prevBGC.TA_d !== undefined ? prevBGC.TA_d : (deep.TA !== undefined ? deep.TA : 2250);

    // O2 (dissolved oxygen, mg/L)
    var prevO2_s = prevBGC.O2_s !== undefined ? prevBGC.O2_s : (surf.DO !== undefined ? surf.DO : 8.5);
    var prevO2_d = prevBGC.O2_d !== undefined ? prevBGC.O2_d : (deep.DO !== undefined ? deep.DO : 5.0);

    // Benthic organic load (g C/m²)
    var prevBenthic = prevBGC.benthicLoad !== undefined ? prevBGC.benthicLoad : (id === "hoodCanal" ? 60 : id === "southSound" ? 35 : 20);

    // ── FLUSHING / EXCHANGE RATES ──
    var flushHalf = def.flushHalf;
    var flush = 1 - Math.exp(-0.693 / flushHalf * 91.25); // quarterly flush fraction
    var tidalMix = def.tidalMixing;
    var vertExchange = cl(tidalMix * 2, 0.02, 0.30); // vertical mixing (fraction of layer exchanged/quarter)

    // ── RIVER INPUTS (scaled by basin) ──
    // Distribute total river N loading to basins by their river fraction
    var riverFrac = def.riverInfluence; // 0-1
    var riverDIN = cl(wsNitrogen * riverFrac * 0.1, 0, 30); // µmol/L contribution per quarter (diluted into basin volume)
    // Fraser-dominated basins (georgia) get Fraser N
    if (id === "georgia") riverDIN += cl(frNitrogen * 0.003, 0, 10);
    var riverDIP = riverDIN / RF_N_P;
    var riverDSi = riverDIN * 2; // rivers carry excess Si relative to N (weathering)

    // Wastewater nutrient loading (from contaminants module via coupling)
    // WWTP effluent adds DIN and DIP to receiving basins
    // West Point (133 MGD) → main basin, Lions Gate/Iona → georgia
    var _cpl = coupling || {};
    var wwLoad = null;
    if (id === "mainBasin" && _cpl.wastewaterMainBasin) wwLoad = _cpl.wastewaterMainBasin;
    if (id === "georgia" && _cpl.wastewaterGeorgia) wwLoad = _cpl.wastewaterGeorgia;
    var wwNutrientDIN = wwLoad ? cl(wwLoad.nutrientLoad * 3, 0, 5) : 0; // µmol/L contribution
    var wwNutrientDIP = wwNutrientDIN / RF_N_P;
    riverDIN += wwNutrientDIN;
    riverDIP += wwNutrientDIP;

    // ── LIGHT AVAILABILITY ──
    var turbidity = basin.turbidity !== undefined ? basin.turbidity : 5;
    var lightSurf = cl(1 - turbidity / 40, 0.1, 1) * solarMod;

    // ── PRIMARY PRODUCTION (Redfield-linked) ──
    // Nutrient limitation: min of N, P, Si (for diatoms)
    var nLim = cl(prevDIN_s / (prevDIN_s + 2.0), 0, 1); // Michaelis-Menten
    var pLim = cl(prevDIP_s / (prevDIP_s + 0.2), 0, 1);
    var siLim = cl(prevDSi_s / (prevDSi_s + 2.0), 0, 1);

    // Diatom fraction: favored when Si:N > 1 (Trainer et al. 2002)
    var siNRatio = prevDIN_s > 0.1 ? prevDSi_s / prevDIN_s : 2;
    var diatomFrac = cl(siNRatio / 2, 0.1, 0.9); // Si-replete → diatom-dominated

    // Effective nutrient limitation (diatoms need Si, others don't)
    var nutrientLim = diatomFrac * Math.min(nLim, pLim, siLim) + (1 - diatomFrac) * Math.min(nLim, pLim);

    // Determine limiting nutrient type
    var limitType = "none";
    if (nutrientLim < 0.5) {
      if (nLim <= pLim && nLim <= siLim) limitType = "N";
      else if (pLim <= nLim && pLim <= siLim) limitType = "P";
      else limitType = "Si";
    }
    if (lightSurf < 0.3) limitType = "light";

    // Temperature effect on productivity (Q10 ≈ 2)
    var sst = surf.SST !== undefined ? surf.SST : 11;
    var tempFactor = cl(Math.exp(0.063 * (sst - 10)), 0.3, 2.5);

    // Net primary production (µmol C/L/quarter, Redfield-linked)
    var maxProdRate = 15; // µmol C/L/quarter at unlimited nutrients + light
    var npp = maxProdRate * nutrientLim * lightSurf * tempFactor;

    // ── NUTRIENT UPTAKE (Redfield stoichiometry) ──
    var nUptake = npp / RF_C_N; // µmol N/L/quarter
    var pUptake = npp / (RF_C_N * RF_N_P); // µmol P/L/quarter
    var siUptake = nUptake * diatomFrac; // only diatoms consume Si

    // ── O2 PRODUCTION FROM PHOTOSYNTHESIS ──
    var o2Production = npp * RF_O2_C * 0.032; // convert µmol O2 to mg/L (MW O2 = 32 g/mol)

    // ── REMINERALIZATION (deep layer + water column) ──
    // Sinking organic matter decomposes, returning nutrients
    var sinkingFlux = npp * sinkingFrac;
    var waterColumnRemin = sinkingFlux * (1 - benthicFluxFrac);
    var benthicFlux = sinkingFlux * benthicFluxFrac;

    // Deep layer remineralization returns nutrients
    var deepReminN = waterColumnRemin / RF_C_N;
    var deepReminP = deepReminN / RF_N_P;
    var deepReminSi = deepReminN * diatomFrac; // diatom frustules dissolve slowly

    // O2 consumption from respiration (deep layer)
    var o2Respiration = waterColumnRemin * RF_O2_C * 0.032;

    // ── SEDIMENT ORGANIC MATTER & OXYGEN DEMAND (18-SUB-BASIN STATEFUL MODEL) ──
    // Session 2b: sediment pool runs at sub-basin resolution with substrate-dependent
    // decomposition (Keil et al. 1994, Burdige 2007 Table 2) and tidal-current
    // resuspension (Sanford & Maa 2001, Le Hir et al. 2001). Parent-basin outputs
    // (decomposition, burial, sodRate, benthicNReturn, benthicPReturn) are area-weighted
    // aggregates over the sub-basins composing this parent, feeding the parent's
    // deep-layer DIN/DIP/O2 budgets. Sub-basin state carries forward in bgcResults
    // alongside parent state (disjoint keys — no collision).
    // Hood Canal basin SOD benchmark 0.3-0.8 g O2/m²/day derived from
    //   Pelletier et al. 2017 Salish Sea Model Sediment Diagenesis Module
    //   (WA Ecology 17-03-010; Salish-Sea-wide 2006 modeled range 0.4-1.3
    //   g O2/m²/day, Hood Canal at low end), Ahmed et al. 2019 (WA Ecology
    //   19-03-001; updated 2006/2008 range 0.2-1.4), with historical baseline
    //   from Pamatmat & Banse 1969 in-situ measurements (0.2-1.2 across Puget
    //   Sound, 11-180 m depth stations). Low-end siting for Hood Canal basin
    //   reflects deep stratified fjord character with two-layer circulation
    //   and near-stagnant deep bottom layer occupying ~60% of water column
    //   (Khangaonkar et al. 2018 JGR-Oceans 123(7):4735-4761; Shull 2022
    //   PSI Sediment Exchange Workshop characterization of Hood Canal benthic
    //   O2 consumption as low relative to Main Basin, Whidbey, and South Sound).
    //   Path 3 remediation per Amendment 6 §5.24(b) — §5.24(b) condition (ii)
    //   failed for prior 1.5-3.0 claim (framework output contradicted it);
    //   Path 3 composite attribution with value revision selected per
    //   scientific-defensibility-first (CLAUDE.md Session 2g).
    // Burdige 2006: decomposition rate k ~0.02-0.05 /month at 10°C
    var dtMonth = _dt * 3;
    var o2PerC = 138.0 / 106.0 * 32.0 / 12.0; // 3.48 g O2 / g C — Redfield stoichiometry
    var burialRate = cl(burialMod / 12, 0.0001, 0.005); // monthly rate from annual param
    var parentBenthicFlux = benthicFlux * benthicAccumFrac; // g C/m²/month reaching sediment

    var subList = PARENT_BASINS[id] || [];
    var agg_decomp_areaWeighted = 0;  // Σ decomposition_i × area_i (g C/m²/mo × km²)
    var agg_burial_areaWeighted = 0;
    var agg_sedOM_areaWeighted = 0;
    var agg_sodGO2_areaWeighted = 0;
    var agg_resusp_areaWeighted = 0;
    var agg_total_area = 0;            // Σ area_i (km²)

    for (var sbi = 0; sbi < subList.length; sbi++) {
      var sbId = subList[sbi];
      var sbDef = SUB_BASINS[sbId];
      if (!sbDef) continue;
      var sbPrev = _prev[sbId] || {};
      var sbMarine = _subBasins ? _subBasins[sbId] : null;
      // Defensive fallback: if sub-basin marine state is unavailable (direct test call),
      // inherit parent deep state for temp and DO.
      var sbDeep = sbMarine && sbMarine.deep ? sbMarine.deep : deep;
      var sbArea = sbDef.surfaceArea || 1;

      // Initial sediment OM (per sub-basin if defined; else parent fallback; else 100)
      var sbInit = SEDIMENT_OM_INIT[sbId] !== undefined ? SEDIMENT_OM_INIT[sbId]
                 : SEDIMENT_OM_INIT[id]   !== undefined ? SEDIMENT_OM_INIT[id]
                 : 100;
      var sbPrevSedOM = sbPrev.sedimentOM !== undefined ? sbPrev.sedimentOM : sbInit;

      // Substrate-dependent decomposition (Keil et al. 1994, Burdige 2007 Table 2)
      // Linear interpolation on mud fraction between mud-end (preservation) and coarse-end.
      var sbSubstrate = BENTHIC_SUBSTRATE[sbId];
      var mudFrac = sbSubstrate && sbSubstrate.mud !== undefined ? sbSubstrate.mud : 0.3;
      var substrateDecayMod = substrateMudFactor * mudFrac + substrateCoarseFactor * (1 - mudFrac);
      var k_effective = decayRatePerMonth * substrateDecayMod;

      // Temperature (per sub-basin deep temp)
      var sb_T_deep = sbDeep.SST !== undefined ? sbDeep.SST : 9.0;
      var sb_tempFactor = Math.pow(sedQ10, (sb_T_deep - 10.0) / 10);
      var sbDecomposition = sbPrevSedOM * k_effective * sb_tempFactor; // g C/m²/mo

      // Burial (functional form 1.5 − DO/6 per Hedges & Keil 1995; clamp range is the tuning surface)
      var sb_o2BurialMod = sbDeep.DO !== undefined ? cl(1.5 - sbDeep.DO / 6, burialO2Min, burialO2Max) : 1.0;
      var sbBurial = sbPrevSedOM * burialRate * sb_o2BurialMod; // g C/m²/mo

      // Resuspension (Session 2b): linear above threshold, capped
      // Threshold 0.15 m/s from Sanford & Maa 2001, Le Hir et al. 2001 (cohesive mud critical shear)
      // Coefficient order-of-magnitude; see defaults.js comment for future-calibration note.
      var sbCurrent = TIDAL_CURRENT_STRENGTH[sbId] !== undefined ? TIDAL_CURRENT_STRENGTH[sbId] : 0.3;
      var excessRatio = sbCurrent > resuspensionThreshold
        ? (sbCurrent - resuspensionThreshold) / resuspensionThreshold
        : 0;
      var resuspendFrac = cl(resuspensionCoefPerMonth * excessRatio, 0, maxResuspendFracPerMonth);
      var sbResuspended = sbPrevSedOM * resuspendFrac; // g C/m²/mo
      // Note: resuspended mass is subtracted from sedimentOM and exported for downstream
      // consumption. NOT yet wired into deep-layer DOC/PON/PIP — that is a Session 3+ concern.

      // Net sediment OM update
      var sbNewSedOM = cl(
        sbPrevSedOM + (parentBenthicFlux - sbDecomposition - sbBurial - sbResuspended) * dtMonth,
        0, 2000
      );

      var sbSodGO2perM2 = sbDecomposition * o2PerC; // g O2/m²/mo

      // Write sub-basin entry into bgcResults (flat dict alongside parents — disjoint keys)
      bgcResults[sbId] = {
        sedimentOM: sbNewSedOM,
        sedDecomposition: sbDecomposition * 3, // g C/m²/qtr
        sedBurial: sbBurial * 3,
        sedResuspension: sbResuspended * 3,
        sodGO2perM2: sbSodGO2perM2,
        substrateDecayMod: substrateDecayMod,
        mudFrac: mudFrac,
        tidalCurrent: sbCurrent,
        resuspendFrac: resuspendFrac,
        sbArea_km2: sbArea,
        parent: id,
      };

      // Area-weighted accumulators for parent aggregates
      agg_decomp_areaWeighted += sbDecomposition * sbArea;
      agg_burial_areaWeighted += sbBurial * sbArea;
      agg_sedOM_areaWeighted  += sbNewSedOM * sbArea;
      agg_sodGO2_areaWeighted += sbSodGO2perM2 * sbArea;
      agg_resusp_areaWeighted += sbResuspended * sbArea;
      agg_total_area += sbArea;
    }

    // Parent-level area-weighted aggregates (intensive quantities)
    var decomposition = agg_total_area > 0 ? agg_decomp_areaWeighted / agg_total_area : 0;
    var burial        = agg_total_area > 0 ? agg_burial_areaWeighted / agg_total_area : 0;
    var newSedOM      = agg_total_area > 0 ? agg_sedOM_areaWeighted  / agg_total_area : (prevBenthic * 5);
    var sodGO2perM2   = agg_total_area > 0 ? agg_sodGO2_areaWeighted / agg_total_area : 0;
    var parentResusp  = agg_total_area > 0 ? agg_resusp_areaWeighted / agg_total_area : 0;

    // SOD volumetric rate — dimensionally honest derivation.
    // sodGO2perM2 [g O2/m²/month] / deepDepth [m] = [g/m³/month] ≡ [mg/L/month].
    // SOD acts at the seafloor and is distributed over the deep layer only; the
    // denominator is deep-layer depth (totalDepth − surfaceDepth), not total depth.
    // Replaces the legacy ce42479 scaling `sodGO2perM2 * 0.001 * (50/vol)` whose
    // units did not resolve to a concentration rate (latent under advisory-only
    // status; Session 2b noted "unchanged scaling" without validation).
    var deepDepth = Math.max((def.totalDepth || 100) - (def.surfaceDepth || 0), 10);
    var sodRate = (sodGO2perM2 / deepDepth) * sodMod; // mg O2/L/month

    // Backward-compat benthic load
    var newBenthic = cl(newSedOM / 5, 0, 500);

    // Denitrification (water-column-remin-driven, unchanged from Session 2a)
    var denitrification = deepReminN * denitrFrac;

    // Benthic nutrient returns to deep layer — now from area-weighted sub-basin decomposition
    var benthicNReturn = decomposition * 0.003;
    var benthicPReturn = benthicNReturn / RF_N_P;

    // ── INTER-BASIN EXCHANGE (fixes ghost N sink) ──
    // Flushed material from one basin enters adjacent basins via EXCHANGE topology
    // For now, flushed nutrients are partially returned via Pacific source water inflow
    // (the JdF deep water brings nutrients back into the system)
    var flushExportN = prevDIN_s * flush * 0.3; // N lost to flushing
    var pacImportN = srcDIN * flush * 0.2; // N gained from Pacific inflow (through JdF)
    var flushExportP = flushExportN / RF_N_P;
    var pacImportP = srcDIP * flush * 0.2;

    // ── CARBONATE PUMP (THE MISSING PIECE) ──
    // Calcification by shellfish + coccolithophores: DIC ↓, TA ↓ (1:2 ratio)
    // Dissolution in corrosive water: DIC ↑, TA ↑
    // Feely et al. 2010, Fassbender et al. 2016

    // Aragonite saturation state — full CO2SYS (Lewis & Wallace 1998)
    var surfSal = surf.salinity !== undefined ? surf.salinity : 28;
    var deepSal = deep.salinity !== undefined ? deep.salinity : 32;
    var carbSurf = co2sysCalc(prevDIC_s, prevTA_s, sst, surfSal);
    var carbDeep = co2sysCalc(prevDIC_d, prevTA_d, sst > 2 ? sst - 2 : sst, deepSal);
    var omega_s = cl(carbSurf.omegaArag, 0.3, 4.0);
    var omega_d = cl(carbDeep.omegaArag, 0.2, 3.5);

    // Calcification rate: proportional to Ω and shellfish/plankton biomass
    // Only occurs when Ω > 1.0 (supersaturated)
    var calcRate = omega_s > 1.0 ? cl((omega_s - 1.0) * 0.5 * calcMod, 0, 2) : 0; // µmol CaCO3/L/quarter × modifier
    // Dissolution: occurs in deep when Ω < 1.5 (undersaturated or near-)
    var dissRate = omega_d < 1.5 ? cl((1.5 - omega_d) * 0.8, 0, 3) : 0;

    // CaCO3 effects on DIC and TA:
    // Calcification: DIC -= calcRate, TA -= 2*calcRate
    // Dissolution: DIC += dissRate, TA += 2*dissRate

    // ── AIR-SEA CO2 EXCHANGE ──
    // pCO2 from CO2SYS (mechanistic, replaces simplified linear approximation)
    var surfPCO2 = cl(carbSurf.pCO2, 200, 1500);
    // atmosphericCO2 param (from config): user-set base level; 2.5 ppm/yr trend added
    var atmCO2_local = atmCO2 + (year - 2026) * 2.5; // ppm, base from param + trend
    var windSpeed = climExports && climExports.climBasinWind && climExports.climBasinWind[id] !== undefined ? climExports.climBasinWind[id] : 0.5;
    // Gas transfer velocity scales with wind² (Wanninkhof 1992)
    var gasTransfer = 0.003 * (1 + windSpeed * windSpeed);
    var co2Flux = (atmCO2_local - surfPCO2) * gasTransfer; // µmol/kg/quarter, + = ocean uptake

    // ── AIR-SEA O2 EXCHANGE ──
    // O2 saturation depends on temperature and salinity — Garcia & Gordon 1992
    // Linear approx with salinity correction: freshwater intercept 14.6 mg/L at 0°C,
    // reduced ~0.6% per PSU salinity. At T=10°C, S=30: gives ~9.7 mg/L (vs 9.0-9.2 exact).
    // Verified 2026-03-23: salinity correction fixes ~1.5 mg/L high bias per Garcia & Gordon 1992
    var o2Sat = cl((14.6 - 0.4 * sst) * (1 - 0.006 * surfSal), 6, 14); // mg/L saturation
    var o2Deficit = o2Sat - prevO2_s;
    var o2AirSea = o2Deficit * 0.15 * (1 + windSpeed); // reaeration rate

    // ── UPDATE DIN ──
    var DIN_s = cl(prevDIN_s
      - nUptake                    // phyto uptake
      + riverDIN                   // river input
      + atmNDeposition * 0.001     // atmospheric deposition (converted to µmol/L)
      - flushExportN               // flushing loss
      + vertExchange * (prevDIN_d - prevDIN_s) * 0.3, // vertical mixing
      0, 50);

    var DIN_d = cl(prevDIN_d
      + deepReminN                 // remineralization
      + benthicNReturn             // sediment return
      - denitrification            // permanent N2 loss
      + pacImportN                 // Pacific source inflow
      - vertExchange * (prevDIN_d - prevDIN_s) * 0.3, // vertical mixing
      0, 50);

    // ── UPDATE DIP ──
    var DIP_s = cl(prevDIP_s - pUptake + riverDIP - flushExportP + vertExchange * (prevDIP_d - prevDIP_s) * 0.3, 0, 5);
    var DIP_d = cl(prevDIP_d + deepReminP + benthicPReturn + pacImportP - vertExchange * (prevDIP_d - prevDIP_s) * 0.3, 0, 5);

    // ── UPDATE DSi ──
    var DSi_s = cl(prevDSi_s - siUptake + riverDSi + vertExchange * (prevDSi_d - prevDSi_s) * 0.3, 0, 80);
    var DSi_d = cl(prevDSi_d + deepReminSi * 0.5 + srcDSi * flush * 0.1 - vertExchange * (prevDSi_d - prevDSi_s) * 0.3, 0, 80); // frustule dissolution is slow

    // ── UPDATE DIC ──
    var DIC_s = cl(prevDIC_s
      + co2Flux                     // air-sea exchange
      - npp                         // photosynthesis removes C
      - calcRate                    // CaCO3 precipitation
      + vertExchange * (prevDIC_d - prevDIC_s) * 0.3,
      1600, 2400);

    var DIC_d = cl(prevDIC_d
      + waterColumnRemin            // respiration adds C
      + dissRate                    // CaCO3 dissolution
      - vertExchange * (prevDIC_d - prevDIC_s) * 0.3,
      1800, 2500);

    // ── UPDATE TA ──
    var TA_s = cl(prevTA_s
      - calcRate * 2                // calcification removes TA (1:2 DIC:TA)
      + nUptake * 1                 // nitrate uptake increases TA (+1 per mol NO3)
      + vertExchange * (prevTA_d - prevTA_s) * 0.3,
      1800, 2400);

    var TA_d = cl(prevTA_d
      + dissRate * 2                // dissolution adds TA
      - deepReminN * 1             // nitrification decreases TA
      - vertExchange * (prevTA_d - prevTA_s) * 0.3,
      2000, 2500);

    // ── UPDATE O2 (SINGLE AUTHORITATIVE SOURCE) ──
    var O2_s = cl(prevO2_s
      + o2Production               // photosynthesis
      + o2AirSea                   // reaeration
      - prevO2_s * 0.02,           // surface respiration (small)
      2, 14);

    var O2_d = cl(prevO2_d
      - o2Respiration              // water column respiration
      - sodRate * dtMonth          // sediment oxygen demand — sodRate is mg/L/month; scale to timestep-in-months
      + vertExchange * (prevO2_s - prevO2_d) * 0.5 // mixing brings O2 down
      + srcO2 * flush * 0.1,      // Pacific source water O2
      0.5, 12);

    // Recompute Ω with updated DIC/TA
    var newPCO2 = DIC_s > 1800 ? cl(350 + (DIC_s - 1900) * 1.5, 200, 1500) : 300;
    var newpH_s = cl(8.1 - Math.log10(Math.max(newPCO2, 100) / 350) * 0.4, 7.4, 8.3);
    var newOmega_s = cl(2.5 * Math.pow(10, newpH_s - 8.1) * (surfSal / 30), 0.3, 4.0);
    var newOmega_d = cl(omega_d + (dissRate - calcRate * 0.2) * 0.1, 0.2, 3.5); // deep Ω adjusts slowly

    // ── CONSERVATION CHECK ──
    // N budget residual (should be near zero if conservative)
    var nInputs = riverDIN + atmNDeposition * 0.001 + pacImportN + deepReminN + benthicNReturn;
    var nOutputs = nUptake + flushExportN + denitrification;
    var nResidual = (DIN_s + DIN_d) - (prevDIN_s + prevDIN_d) - (nInputs - nOutputs);

    // P budget residual
    var pResidual = (DIP_s + DIP_d) - (prevDIP_s + prevDIP_d) - (riverDIP + pacImportP + deepReminP + benthicPReturn - pUptake - flushExportP);

    // C budget residual (simplified)
    var cResidual = (DIC_s + DIC_d) - (prevDIC_s + prevDIC_d) - (co2Flux - npp + waterColumnRemin - calcRate + dissRate);

    totalBudgets.nResidual += Math.abs(nResidual);
    totalBudgets.pResidual += Math.abs(pResidual);
    totalBudgets.cResidual += Math.abs(cResidual);

    bgcResults[id] = {
      // Nitrogen
      DIN_s: DIN_s, DIN_d: DIN_d,
      // Phosphorus
      DIP_s: DIP_s, DIP_d: DIP_d,
      // Silica
      DSi_s: DSi_s, DSi_d: DSi_d,
      // Carbon
      DIC_s: DIC_s, DIC_d: DIC_d,
      pCO2_s: newPCO2,
      // Alkalinity
      TA_s: TA_s, TA_d: TA_d,
      // Oxygen
      O2_s: O2_s, O2_d: O2_d,
      // Aragonite saturation
      omegaArag_s: newOmega_s, omegaArag_d: newOmega_d,
      // Productivity
      npp: npp,
      nutrientLimitType: limitType,
      diatomFraction: diatomFrac,
      // Sediment (area-weighted aggregate over sub-basins — Session 2b)
      sedimentOM: newSedOM, // g C/m² — area-weighted mean over sub-basins
      benthicLoad: newBenthic, // backward compat (sedimentOM / 5)
      sodRate: sodRate,
      sodGO2perM2: sodGO2perM2, // g O2/m²/month — area-weighted mean
      sedBurial: burial * 3, // g C/m²/quarter
      sedDecomposition: decomposition * 3, // g C/m²/quarter
      sedResuspension: parentResusp * 3, // g C/m²/quarter — Session 2b (advisory, not wired to water column)
      // Fluxes
      airSeaCO2Flux: co2Flux,
      calcificationRate: calcRate,
      dissolutionRate: dissRate,
      denitrificationRate: denitrification,
      // Conservation
      nBudgetResidual: nResidual,
      pBudgetResidual: pResidual,
      cBudgetResidual: cResidual,
    };
  }

  // ── AGGREGATED EXPORTS ──
  var totalVol = 0;
  var aggDIN = 0, aggDIP = 0, aggDSi = 0, aggO2_s = 0, aggO2_d = 0;
  var aggNPP = 0, aggSOD = 0, aggCalcRate = 0;
  for (var ai = 0; ai < basinKeys.length; ai++) {
    var aid = basinKeys[ai];
    var v = BASINS[aid].vol;
    var bg = bgcResults[aid];
    if (!bg) continue;
    totalVol += v;
    aggDIN += bg.DIN_s * v;
    aggDIP += bg.DIP_s * v;
    aggDSi += bg.DSi_s * v;
    aggO2_s += bg.O2_s * v;
    aggO2_d += bg.O2_d * v;
    aggNPP += bg.npp * v;
    // Stratification-deficit-modulated SOD-to-deep-DO coupling per pre-reg §2 Change 3 +
    // §11 Amendment 2; β bounded mechanism-internally [0.5, 2.0] per pre-reg §4 + §11 Amendment 4.
    // Default `|| 0` treats missing-signal as fully-mixed (conservative; pre-modulation fallback).
    var aidStratDeficit = (basins[aid] && basins[aid].stratDeficit !== undefined) ? basins[aid].stratDeficit : 0;
    aggSOD += bg.sodRate * (1 + stratDeficitBeta * aidStratDeficit) * v;
    aggCalcRate += bg.calcificationRate * v;
  }
  if (totalVol > 0) {
    aggDIN /= totalVol; aggDIP /= totalVol; aggDSi /= totalVol;
    aggO2_s /= totalVol; aggO2_d /= totalVol;
    aggNPP /= totalVol; aggSOD /= totalVol; aggCalcRate /= totalVol;
  }

  // Split bgcResults into parent-basin state (water column + sediment aggregate) and
  // sub-basin state (sediment only) for the public state API. _carry retains both
  // (flat dict with disjoint keys) for next-timestep prev lookup.
  var parentState = {};
  var subBasinState = {};
  for (var rk = 0; rk < basinKeys.length; rk++) {
    if (bgcResults[basinKeys[rk]]) parentState[basinKeys[rk]] = bgcResults[basinKeys[rk]];
  }
  for (var sk2 = 0; sk2 < SUB_BASIN_IDS.length; sk2++) {
    if (bgcResults[SUB_BASIN_IDS[sk2]]) subBasinState[SUB_BASIN_IDS[sk2]] = bgcResults[SUB_BASIN_IDS[sk2]];
  }

  return {
    state: {
      basins: parentState,            // parent-only (backward-compatible external API)
      subBasinSediments: subBasinState, // Session 2b: 18-sub-basin sediment state
      // Volume-weighted aggregates
      avgSurfaceDIN: aggDIN,
      avgSurfaceDIP: aggDIP,
      avgSurfaceDSi: aggDSi,
      avgSurfaceO2: aggO2_s,
      avgDeepO2: aggO2_d,
      avgNPP: aggNPP,
      avgSOD: aggSOD,
      avgCalcRate: aggCalcRate,
      // Conservation diagnostics
      totalNResidual: totalBudgets.nResidual,
      totalPResidual: totalBudgets.pResidual,
      totalCResidual: totalBudgets.cResidual,
    },

    _carry: bgcResults, // carry full per-basin state forward (parents + sub-basins, disjoint keys)

    exports: {
      bgcSurfaceDIN: aggDIN,
      bgcSurfaceDIP: aggDIP,
      bgcSurfaceDSi: aggDSi,
      bgcSurfaceO2: aggO2_s,
      bgcDeepO2: aggO2_d,
      bgcAvgNPP: aggNPP,
      bgcAvgSOD: aggSOD,
      bgcCalcRate: aggCalcRate,
      bgcHoodCanalO2: bgcResults.hoodCanal ? bgcResults.hoodCanal.O2_d : 3.5,
      // Stratification-deficit-modulated Hood Canal SOD per pre-reg §2 Change 3 + §11 Amendment 2.
      bgcHoodCanalSOD: bgcResults.hoodCanal
        ? bgcResults.hoodCanal.sodRate * (1 + stratDeficitBeta * ((basins.hoodCanal && basins.hoodCanal.stratDeficit !== undefined) ? basins.hoodCanal.stratDeficit : 0))
        : 0,
      bgcHoodCanalBenthic: bgcResults.hoodCanal ? bgcResults.hoodCanal.benthicLoad : 60,
      bgcHoodCanalSedOM: bgcResults.hoodCanal ? bgcResults.hoodCanal.sedimentOM : 650,
      bgcHoodCanalResuspension: bgcResults.hoodCanal ? (bgcResults.hoodCanal.sedResuspension || 0) : 0,
      // bgcTotalBurial: sum over 7 parent entries (preserves pre-Session-2b export semantics —
      // filter by .parent absence to exclude the 18 sub-basin entries).
      bgcTotalBurial: basinKeys.reduce(function(s, k) {
        return s + ((bgcResults[k] && bgcResults[k].sedBurial) || 0);
      }, 0),
      bgcTotalResuspension: basinKeys.reduce(function(s, k) {
        return s + ((bgcResults[k] && bgcResults[k].sedResuspension) || 0);
      }, 0),
    },
  };
}
