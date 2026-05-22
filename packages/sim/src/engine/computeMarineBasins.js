import { cl, seas, seasonalPeak, shiftedPeak } from './utils.js';
import { BASINS, EXCHANGE, SUB_BASINS, SUB_EXCHANGE, SUB_BASIN_IDS, PARENT_BASINS, aggregateToParent } from './basins.js';
import { rfPredict } from './rfPredict.js';
import { co2sysCalc } from './co2sys.js';

// ── CARBONATE CHEMISTRY — CO2SYS (Lewis & Wallace 1998) ──
// Full CO2SYS implementation replaces the simplified solver.
// See src/engine/co2sys.js for the complete algorithm with citations.
function computeCarbonate(DIC, TA, SST, sal) {
  var result = co2sysCalc(DIC, TA, SST, sal);
  return {
    pH: cl(result.pH, 7.0, 8.5),
    omega: cl(result.omegaArag, 0.2, 4.0),
    pCO2: cl(result.pCO2, 50, 2000),
    omegaCalc: cl(result.omegaCalc, 0.2, 6.0),
    CO3: result.CO3,
    HCO3: result.HCO3,
  };
}

export function computeMarineBasins(P, prevBasins, wsRivers, portExp, urbanExp, S, yf, dt, climD, oForcing, mhw) {
  var sp=S.oilSpill||0, st=S.storm||0, sstBase=P.baselineTemperature+(climD.sstDelta||0);
  // ENSO/PDO SST anomaly
  if (oForcing) sstBase += oForcing.sstAnomaly;
  // Marine heat wave SST anomaly (+2-4°C when active)
  var mhwActive = mhw ? mhw.active : 0;
  var mhwSSTAnomaly = mhw ? mhw.sstAnomaly || 0 : 0;
  sstBase += mhwSSTAnomaly;
  var prodMult = oForcing ? oForcing.productivityMult : 1; // warm phases reduce upwelling productivity
  // MHW increases stratification (warm surface layer suppresses mixing)
  var mhwStratBonus = mhwActive ? mhwSSTAnomaly * 0.08 : 0;
  // ── TIDAL ENERGY EXTRACTION TRADEOFF ──
  // Extracting energy from tidal currents reduces mixing energy in the water column
  // E_mix = E_tidal - E_extracted → less vertical mixing → stronger stratification
  var tidalExtraction = (P.tidalEnergyExtraction !== undefined ? P.tidalEnergyExtraction : 0) / 100; // 0-1 fraction of max
  // Mixing reduction: at 100 MW, removes ~15% of tidal mixing energy
  var mixingReduction = tidalExtraction * 0.15;
  // Stratification boost from reduced mixing
  var tidalStratBonus = mixingReduction * 0.5; // substantial stratification increase
  // ── PACIFIC COASTAL UPWELLING & SOURCE WATER ──
  // Now provided by computePacific.js via oForcing injection.
  // Fallback to internal model if Pacific module data is not available.
  var quarter0 = (yf !== undefined ? (yf % 1) : 0) * 4;
  var climateWarming = cl(climD.sstDelta !== undefined ? climD.sstDelta : 0, 0, 5);

  var upwellingIndex;
  if (oForcing && oForcing.pacUpwellingIntensity !== undefined) {
    upwellingIndex = oForcing.pacUpwellingIntensity;
  } else {
    // Legacy fallback
    var upwellingSeason = Math.exp(-0.5 * Math.pow((quarter0 - 2.5) / 0.8, 2));
    var pdoMod = oForcing ? (oForcing.pdo !== undefined ? oForcing.pdo * 0.15 : 0) : 0;
    var ensoMod = oForcing ? (oForcing.enso !== undefined ? -oForcing.enso * 0.10 : 0) : 0;
    upwellingIndex = cl(upwellingSeason * 0.7 + 0.15 + pdoMod + ensoMod, 0, 1);
  }

  // Deep Pacific source water — from computePacific via oForcing, or legacy fallback
  var pacificSourceDO = (oForcing && oForcing.pacSourceDO !== undefined) ? oForcing.pacSourceDO : cl(2.8 - climateWarming * 0.3, 0.5, 4.0);
  var pacificSourcepH = (oForcing && oForcing.pacSourcepH !== undefined) ? oForcing.pacSourcepH : cl(7.65 - climateWarming * 0.04, 7.3, 7.75);
  var pacificSourceSST = (oForcing && oForcing.pacSourceTemp !== undefined) ? oForcing.pacSourceTemp : cl(7.5 + climateWarming * 0.3, 6.0, 10.0);
  var pacificSourceNutrients = (oForcing && oForcing.pacSourceNutrients !== undefined) ? oForcing.pacSourceNutrients : cl(25 + climateWarming * 2, 20, 35);
  var pacificSourceSalinity = 34.0;
  var pacificSourceDIC = (oForcing && oForcing.pacSourceDIC !== undefined) ? oForcing.pacSourceDIC : cl(2100 + climateWarming * 5, 2050, 2350);
  var pacificSourceTA = (oForcing && oForcing.pacSourceTA !== undefined) ? oForcing.pacSourceTA : cl(2250 - climateWarming * 2, 2180, 2320);

  // MHW: use Pacific module MHW if available, otherwise use existing mhw param
  if (oForcing && oForcing.pacMhwActive !== undefined && oForcing.pacMhwActive) {
    mhwActive = 1;
    mhwSSTAnomaly = oForcing.pacMhwSSTAnomaly !== undefined ? oForcing.pacMhwSSTAnomaly : mhwSSTAnomaly;
    sstBase += mhwSSTAnomaly * 0.3; // partial additional warming from Pacific MHW (if not already included)
  }

  // ── ATMOSPHERIC CO2 FORCING ──
  var atmCO2 = 420 + climateWarming * 2.5; // ppm, increases with SSP pathway

  // ── TIDAL MIXING — SPRING-NEAP CYCLE ──
  // 14.76 day cycle: spring tides (full/new moon) = max mixing.
  // Sutherland et al. 2011, Khangaonkar et al. 2018.
  var simulationDay = yf * 365.25; // day within current year
  var lunarPhase = (simulationDay % 14.76) / 14.76; // 0-1 within spring-neap cycle
  var springNeapMod = 1.0 + 0.15 * Math.cos(lunarPhase * 2 * Math.PI); // 0.85-1.15, averages to 1.0

  // Sill-enhanced tidal dissipation per basin (relative modifier around 1.0)
  // Base tidalMixing in BASINS already encodes absolute rates, so these are small adjustments
  // reflecting spring-neap sensitivity at each sill/narrows
  var sillEnhancement = {
    juanDeFuca: 1.0,
    georgia: 1.0,
    sanjuan: 1.05,    // tidal rapids — slightly enhanced spring-neap response
    whidbey: 1.02,    // Deception Pass
    mainBasin: 1.0,
    hoodCanal: 0.98,  // very restricted — slightly less tidal influence
    southSound: 0.98  // Tacoma Narrows
  };

  // ── FRASER RIVER PLUME ──
  // Fraser discharge now comes from computeFraser.js via wsRivers.fraser.discharge
  // (orchestrator overrides the watershed module's Fraser output with the full Fraser model).
  // Fallback to original hardcoded model if computeFraser is not wired yet.
  var fraserMeanQ = 2700; // m³/s reference for normalization
  var quarter0f = (yf !== undefined ? (yf % 1) : 0) * 4;
  var fraserDischarge;
  if (wsRivers.fraser && wsRivers.fraser.discharge > 0) {
    fraserDischarge = wsRivers.fraser.discharge;
  } else {
    // Legacy fallback: internal seasonal model
    var fraserSeasonShifted = shiftedPeak(quarter0f, 1.8, 0.6, climateWarming, 6);
    var fraserClimateReduction = cl(1 - climateWarming * 0.03, 0.7, 1);
    fraserDischarge = fraserMeanQ * (0.4 + 0.6 * fraserSeasonShifted) * fraserClimateReduction;
  }
  // Sediment: now from Fraser model when available, else proportional to discharge
  var fraserSediment = cl(fraserDischarge / fraserMeanQ * 0.5, 0.1, 1.0); // normalized 0-1
  // Plume fraction: how much of Georgia Strait surface is covered
  var fraserPlumeFrac = cl(fraserDischarge / 8000, 0.1, 0.50);

  // ── SEDIMENT ROUTING & GEOLOGICAL HAZARDS ──
  // Total watershed sediment load routed to basins by river drainage
  var totalWsSediment = 0;
  Object.keys(wsRivers).forEach(function(rk) { if (wsRivers[rk]) totalWsSediment += wsRivers[rk].sediment || 0; });
  var sedimentRouting = {
    whidbey: 0.35,   // Skagit + Snohomish
    mainBasin: 0.20,  // Duwamish + Cedar
    southSound: 0.10, // Nisqually
    hoodCanal: 0.05,  // Skokomish
    georgia: 0.25,    // Nooksack + Fraser
    juanDeFuca: 0.05,  // Elwha
    sanjuan: 0.00     // rocky, no major rivers
  };
  // Submarine landslide probability per basin (for earthquake events)
  // Override with per-type landslide data if available from earthquake disaster config
  var landslideProbability = {
    mainBasin: 0.7, hoodCanal: 0.5, whidbey: 0.4,
    southSound: 0.3, georgia: 0.3, sanjuan: 0.2, juanDeFuca: 0.1
  };
  // Detect specific earthquake type and use its per-basin landslide/tsunami config
  var eqType = S.cascadia_megathrust ? "cascadia_megathrust" : S.seattle_fault ? "seattle_fault" : S.deep_intraslab ? "deep_intraslab" : null;
  var eqIntensity = S.earthquake || 0;
  // Subsidence: Cascadia drops coast 1-2m, Seattle fault 0.5m — increases effective SLR
  var coseismicSubsidence = 0;
  if (eqType === "cascadia_megathrust" && S.cascadia_megathrust > 0.3) {
    coseismicSubsidence = 1.5 * S.cascadia_megathrust;
  } else if (eqType === "seattle_fault" && S.seattle_fault > 0.3) {
    coseismicSubsidence = 0.5 * S.seattle_fault;
  }
  // Liquefaction: reduces port and urban infrastructure
  var liquefactionIntensity = 0;
  if (eqType === "cascadia_megathrust" && S.cascadia_megathrust > 0.3) {
    liquefactionIntensity = 0.8 * S.cascadia_megathrust;
  } else if (eqType === "seattle_fault" && S.seattle_fault > 0.3) {
    liquefactionIntensity = 0.9 * S.seattle_fault;
  } else if (eqType === "deep_intraslab" && S.deep_intraslab > 0.3) {
    liquefactionIntensity = 0.5 * S.deep_intraslab;
  }

  // ── VOLCANIC HAZARD EFFECTS ──
  // Lahar: massive sediment pulse to specific basins
  var laharIntensity = S.rainier_lahar || 0;
  var bakerIntensity = S.baker_eruption || 0;
  var ashfallIntensity = S.glacier_peak_ashfall || 0;
  // Baker eruption: pH depression in Georgia Strait
  var bakerPhDepression = bakerIntensity > 0.3 ? bakerIntensity * 0.15 : 0;
  // Glacier Peak ashfall: light reduction and turbidity across all basins
  var ashfallLightReduction = ashfallIntensity > 0.3 ? ashfallIntensity * 0.30 : 0;
  var ashfallTurbidity = ashfallIntensity > 0.3 ? ashfallIntensity * 10 : 0;
  var ashfallPhDepression = ashfallIntensity > 0.3 ? ashfallIntensity * 0.05 : 0;

  var stratF=(P.stratificationStrength/100 + mhwStratBonus + tidalStratBonus)*seas(yf,0.4,1.0), nb = {};
  Object.keys(BASINS).forEach(function(id) {
    var def=BASINS[id], prev=prevBasins[id];
    // ── SEASONAL FLUSHING (Premathilake & Khangaonkar 2022) ──
    // Most basins flush faster in winter (higher freshwater, stronger estuarine circulation)
    // Exception: Hood Canal flushes SLOWER in winter (increased stratification reduces mixing)
    var seasonalFlushMult = id === "hoodCanal"
      ? seas(yf, 1.3, 0.75)    // Hood Canal: longer (slower) flushing in winter
      : id === "juanDeFuca"
      ? seas(yf, 0.85, 1.05)   // JdF: slightly faster flushing in summer (upwelling enhances exchange)
      : seas(yf, 0.75, 1.15);  // Others: shorter (faster) flushing in winter
    var effectiveFlushHalf = def.flushHalf * seasonalFlushMult;
    // Tidal energy extraction slows flushing in turbine basins (San Juan, Admiralty Inlet)
    // and downstream (Hood Canal gets reduced tidal pumping)
    if (tidalExtraction > 0) {
      // Penalty proportional to basin's tidal mixing dependence (from BASINS config).
      // San Juan (strongest mixing 0.25) most affected; Hood Canal (weakest 0.05) vulnerable.
      var tidalFlushPenalty = id === "juanDeFuca" ? tidalExtraction * 0.10
        : id === "sanjuan" ? tidalExtraction * 0.20
        : id === "hoodCanal" ? tidalExtraction * 0.12
        : id === "mainBasin" ? tidalExtraction * 0.05
        : id === "georgia" ? tidalExtraction * 0.06
        : id === "whidbey" ? tidalExtraction * 0.08
        : id === "southSound" ? tidalExtraction * 0.09 : 0;
      effectiveFlushHalf *= (1 + tidalFlushPenalty); // longer half-life = slower flushing
    }
    var flush=1-Math.exp(-0.693/effectiveFlushHalf*91.25*dt);
    var lD=0, lN=0, lS=0;
    (def.rivers||[]).forEach(function(r) { if(wsRivers[r]) { lD+=wsRivers[r].discharge; lN+=wsRivers[r].nitrogen; lS+=wsRivers[r].sediment; } });
    var isSea=def.cities.indexOf("seattle")>=0, isVan=def.cities.indexOf("vancouver")>=0, isPA=def.cities.indexOf("portangeles")>=0;
    var uF=cl((isSea?0.4:0)+(isVan?0.3:0)+(isPA?0.05:0)+(def.cities.length>0?0.1:0),0,1);
    // ── PER-BASIN MPA EFFECTS ──
    // Designated MPAs get: noise reduction (vessel slowdowns/exclusions), reduced contaminant input
    // (stricter discharge, no dredging), and reduced fishing-related mortality.
    // Spillover: benefits propagate to adjacent basins naturally through EXCHANGE topology.
    var isInMPA = P.mpaBasins && P.mpaBasins[id];
    var mpaNoiseMult = isInMPA ? 0.5 : 1.0;   // 50% noise reduction in MPAs
    var mpaContamMult = isInMPA ? 0.6 : 1.0;   // 40% reduced contaminant input
    var mpaFishMult = isInMPA ? 0.3 : 1.0;     // 70% reduced fishing-related disturbance
    var lWW=(urbanExp.wastewaterDischarge||200000)*uF, lCSO=(urbanExp.csoFrequency||2)*uF;
    // #19 Cruise ship wastewater adds nutrients in port basins (seasonal)
    var cruiseWW = (portExp.cruiseWastewater || 0) * (isSea ? 0.7 : isVan ? 0.3 : 0);
    lWW += cruiseWW;
    var lNoi=(portExp.underwaterNoise||0.3)*(isSea||isVan?0.8:id==="juanDeFuca"?0.7:id==="sanjuan"?0.6:0.2) * mpaNoiseMult;
    var lVes=(portExp.vesselDensity||5)*(isSea||isVan?0.7:id==="juanDeFuca"?0.55:0.15) * mpaNoiseMult;
    var ni=lN*0.01+lWW*0.00001+lCSO*0.5, up=(id==="juanDeFuca"?1.8:id==="sanjuan"?0.8:id==="georgia"?0.3:0.1)*seas(yf,0.2,1.0)*3;
    // ENSO/PDO modulate upwelling nutrient delivery
    up *= prodMult;
    // ── COLUMBIA RIVER PLUME INTRUSION (juanDeFuca only) ──
    // Under southerly winds, Columbia River plume water travels 200+ km north and enters
    // Juan de Fuca as a fresher, warmer surface layer (Hickey et al. 1991, 2009).
    // Episodic: strongest in winter during atmospheric rivers. Reduces salinity, adds nutrients.
    var columbiaPlume = 0;
    if (id === "juanDeFuca") {
      // Winter southerly winds carry Columbia plume north; summer upwelling blocks it
      columbiaPlume = seas(yf, 0.6, 0.1) * cl(1 + (climD.sstDelta || 0) * 0.1, 0.5, 1.5);
    }
    // #9 Submarine groundwater discharge — hidden nearshore nutrient source
    // Proportional to coastal development (urban fraction) and independent of rivers
    // Most significant in enclosed embayments (Hood Canal, South Sound)
    var sgdFactor = id === "hoodCanal" ? 0.8 : id === "southSound" ? 0.6 : id === "mainBasin" ? 0.3 : id === "juanDeFuca" ? 0.05 : 0.1;
    var sgdNitrogen = sgdFactor * uF * 1.5; // kg/day equivalent, bypasses riparian buffers
    var tNut=cl((ni+up+sgdNitrogen*0.01)*(1-flush*0.5),0,50);
    var prevDet0 = prev.detritus !== undefined ? prev.detritus : 50;
    // O2 consumption: nutrients decomposition + phytoplankton respiration + stratification + detritus
    // NOTE: Oxygen double-counting resolved by computeBiogeochem.js which provides a
    // single authoritative O2 source using Redfield-linked production/consumption.
    // These calculations are kept for backward compatibility.
    var oCon=tNut*0.15+prev.phyto*0.002+stratF*(id==="hoodCanal"?2.5:1.0) + prevDet0*0.001;
    // O2 production: photosynthesis (reduced from 0.005 — most surface production consumed in situ)
    var oPro=prev.phyto*0.003*(1-lS/(def.vol*30));
    // DO target: base 7 mg/L (real Salish Sea ambient, not the 10 mg/L saturation of v5.2).
    // Flushing reaerates at 2x (reduced from 3x — exchange with oxygenated Pacific water).
    // Seasonal: +1.5 winter (cold = higher solubility), -1.5 summer (warm = lower solubility + bloom respiration).
    var tDO=cl(6.2-oCon+oPro+flush*1.5-sp*4+seas(yf,1.5,-1.5),0,14);
    // juanDeFuca: DO modulated by upwelling — coastal upwelling brings oxygen-poor deep water in summer
    if (id === "juanDeFuca") { tDO = cl(tDO - up * 0.15 + 1.0, 0, 14); } // +1.0 base (more oceanic)
    var doI=id==="hoodCanal"?0.15:id==="southSound"?0.25:id==="juanDeFuca"?0.5:0.4;
    var nDO=prev.DO+(tDO-prev.DO)*doI*dt;
    // Basin SST offset: Juan de Fuca is cooler (Pacific upwelling), Georgia warmer (shallower stratified)
    var basinSSTOffset = id === "juanDeFuca" ? -3.5 : id === "georgia" ? 0.5 : id === "hoodCanal" ? -0.3 : 0;
    var tSST=sstBase+basinSSTOffset+seas(yf,-2.5,3)+lD*0.00002;
    // Columbia plume: warmer, fresher water in winter
    if (columbiaPlume > 0) { tSST += columbiaPlume * 0.8; }
    // SST convergence: JdF converges faster (strong Pacific influence), others at 0.3/qtr
    var sstConvRate = id === "juanDeFuca" ? 0.5 : 0.3;
    var nSST=prev.SST+(tSST-prev.SST)*sstConvRate*dt;
    // Basin-specific base salinity: reflects real-world freshwater influence.
    // Juan de Fuca is near-oceanic (31). Georgia is Fraser-dominated (25).
    // Interior basins are intermediate, reflecting mix of river input and tidal exchange.
    var baseSalinity = id === "juanDeFuca" ? 31 : id === "georgia" ? 21 : id === "whidbey" ? 26 : id === "hoodCanal" ? 27 : id === "southSound" ? 28 : id === "sanjuan" ? 29 : 28;
    // Freshwater discharge further modulates salinity around the basin baseline
    // Empirical freshening: lD is river discharge (m³/s), def.vol is basin volume (km³).
    // The 0.15 factor is a calibrated scaling coefficient (not a dimensional conversion)
    // that produces realistic salinity depression (~0.3 PSU per 2000 m³/s in Georgia Strait).
    var freshDilution = lD * 0.15 / Math.max(def.vol, 1);
    var tSal=cl(baseSalinity - freshDilution + flush*1.5, 12, 34);
    // Columbia plume reduces salinity; juanDeFuca also more oceanic (higher base salinity)
    if (id === "juanDeFuca") { tSal = cl(tSal + 2 - columbiaPlume * 1.5, 12, 34); }
    var nSal=prev.salinity+(tSal-prev.salinity)*0.3*dt;
    // Sediment routing: add routed watershed sediment to basin turbidity
    var routedSediment = totalWsSediment * (sedimentRouting[id] !== undefined ? sedimentRouting[id] : 0);
    var tTurb=cl((lS + routedSediment * 0.002)*0.008/Math.max(def.vol*0.05,1)+lWW*0.000001,0,50);
    // ── POST-QUAKE SEDIMENT ──
    // Tracks persistent turbidity from earthquake-triggered submarine landslides.
    // Decays 30% per quarter as sediment settles.
    var prevQuakeSediment = (prev.quakeSediment !== undefined ? prev.quakeSediment : 0) * 0.70;
    // New earthquake: roll for submarine landslide per basin
    if (eqIntensity > 0.3) {
      var lsProb = landslideProbability[id] !== undefined ? landslideProbability[id] : 0.1;
      // Deterministic pseudo-random per basin based on earthquake intensity
      var lsSeed = Math.sin(eqIntensity * 997 + (id === "mainBasin" ? 1 : id === "hoodCanal" ? 2 : id === "whidbey" ? 3 : id === "southSound" ? 4 : id === "georgia" ? 5 : id === "sanjuan" ? 6 : 7) * 31) * 0.5 + 0.5;
      if (lsSeed < lsProb * eqIntensity) {
        prevQuakeSediment += 50 * eqIntensity; // turbidity pulse
      }
    }
    tTurb += prevQuakeSediment;
    // Lahar sediment pulse: massive turbidity in specific basins
    if (laharIntensity > 0.3) {
      var laharSedMap = { mainBasin: 100, southSound: 60 };
      var laharSed = laharSedMap[id] !== undefined ? laharSedMap[id] : 0;
      tTurb += laharSed * laharIntensity * 0.5;
    }
    // Baker eruption sediment in Georgia Strait and Whidbey
    if (bakerIntensity > 0.3) {
      var bakerSedMap = { georgia: 40, whidbey: 15 };
      var bakerSed = bakerSedMap[id] !== undefined ? bakerSedMap[id] : 0;
      tTurb += bakerSed * bakerIntensity * 0.3;
    }
    // Glacier Peak ashfall: turbidity in all basins
    tTurb += ashfallTurbidity;
    tTurb = cl(tTurb, 0, 80);
    var nTurb=prev.turbidity+(tTurb-prev.turbidity)*0.5*dt;
    // ── OCEAN ACIDIFICATION from atmospheric CO2 ──
    // Background pH decline independent of local nutrients: ~0.12 pH units by 2095 under RCP8.5
    // Scaled by SSP pathway: ssp126=0.04, ssp245=0.08, ssp585=0.12 over ~70 years
    var sspAcidRate = (climD.sspKey === "ssp585") ? 0.0017 : (climD.sspKey === "ssp126") ? 0.0006 : 0.0011; // pH units/yr
    var co2Acidification = (climD.sstDelta||0) > 0 ? sspAcidRate * (climD.sstDelta / 0.018) : 0; // scale with cumulative warming as proxy for time
    // Tidal energy benefit: clean energy reduces regional CO2 -> slightly slower acidification (decades-scale)
    var tidalAcidBenefit = tidalExtraction * 0.05; // up to 5% acidification rate reduction at max extraction
    co2Acidification *= (1 - tidalAcidBenefit);
    // Volcanic pH depression: Baker acid drainage (Georgia Strait), ashfall (all basins)
    var volcanicPhPenalty = ashfallPhDepression;
    if (id === "georgia" || id === "whidbey") volcanicPhPenalty += bakerPhDepression;
    var tpH=cl(7.92-tNut*0.012-(climD.sstDelta||0)*0.015+flush*0.10-co2Acidification-volcanicPhPenalty,7,8.3);
    var npH=prev.pH+(tpH-prev.pH)*0.3*dt;
    // ── CARBONATE CHEMISTRY / ARAGONITE SATURATION (pre-2-layer estimate) ──
    // Overwritten by CO2SYS solver in the 2-layer model below (see "CO2SYS AUTHORITATIVE OMEGA").
    // Kept as initial value for the single-layer basin output and shellfishViability.
    // Omega_aragonite = [Ca2+][CO32-] / K_sp
    // Simplified: Omega depends on pH (controls [CO32-]), SST (affects K_sp), salinity ([Ca2+])
    // At pH 8.1, Omega ~ 2.5 (supersaturated); at pH 7.7, Omega ~ 0.8 (undersaturated -> dissolution)
    // Upwelling brings naturally low-Omega deep water, modulated by ENSO
    var co3FromPH = Math.pow(10, npH - 8.1); // relative [CO32-] from pH
    var kspTemp = 1 + (nSST - 10) * 0.01; // K_sp decreases slightly with warming (helps Omega slightly)
    var caFromSal = nSal / 30; // [Ca2+] proportional to salinity
    var baseOmega = 2.5 * co3FromPH * caFromSal / kspTemp;
    // Upwelling effect: brings corrosive deep water, especially San Juan / outer basins
    // La Nina enhances upwelling -> lower Omega; El Nino suppresses it
    var upwellingOmegaPenalty = (id === "juanDeFuca" ? 0.5 : id === "sanjuan" ? 0.4 : id === "georgia" ? 0.15 : 0.05) * seas(yf, 0.1, 1.0);
    if (oForcing) upwellingOmegaPenalty *= (1 - oForcing.enso * 0.3); // La Nina (negative) increases penalty
    var omegaAragonite = cl(baseOmega - upwellingOmegaPenalty, 0.3, 4.0);
    // Shellfish viability: Omega > 1.5 = healthy, Omega 1.0-1.5 = stressed, Omega < 1.0 = dissolution
    var shellfishViability = omegaAragonite > 1.5 ? 1.0 : omegaAragonite > 1.0 ? cl((omegaAragonite - 0.8) / 0.7, 0, 1) : cl(omegaAragonite / 1.0 * 0.3, 0, 0.3);

    var nNoi=prev.noise+(cl(lNoi*0.7+lVes*0.02,0,1)-prev.noise)*0.6*dt;
    // ── DISAGGREGATED CONTAMINANTS ──
    // Legacy PCBs: declining slowly (~2%/yr from sediment burial + remediation)
    var prevPCB = prev.pcb !== undefined ? prev.pcb : 0.12;
    var nPCB = cl(prevPCB * (1 - 0.005*dt) + (sp*0.15 + uF*0.02*(1-flush*0.3)) * mpaContamMult, 0, 1);
    // PFAS (forever chemicals): accumulating from wastewater, firefighting foam — very slow decay
    var prevPFAS = prev.pfas !== undefined ? prev.pfas : 0.05;
    var pfasInput = (uF * 0.04 + lWW * 0.0000002) * mpaContamMult;
    var nPFAS = cl(prevPFAS + (pfasInput - prevPFAS * 0.002) * dt, 0, 1); // near-zero decay
    // Microplastics: steadily increasing with population and vessel traffic
    var prevMP = prev.microplastics !== undefined ? prev.microplastics : 0.08;
    var mpInput = uF * 0.03 + lVes * 0.005 + (lD > 0 ? 0.01 : 0);
    var nMP = cl(prevMP + (mpInput - prevMP * flush * 0.3) * 0.1 * dt, 0, 1);
    // Composite contamination (weighted: PCBs bioaccumulate most in orca/salmon)
    var nCon = cl(nPCB * 0.45 + nPFAS * 0.30 + nMP * 0.25, 0, 1);
    var nNut=prev.nutrients+(tNut-prev.nutrients)*0.35*dt;
    // Smoke PAR reduction: wildfire smoke blocks photosynthetically active radiation
    // Wernberg et al. 2022, Abram et al. 2021: severe smoke → 30-60% PAR reduction
    var smokePARReduction = climD.smokeSolarReduction !== undefined ? climD.smokeSolarReduction : 0;
    var light=cl(1-nTurb/40-ashfallLightReduction-smokePARReduction,0.1,1);
    // ── NPZD BIOGEOCHEMISTRY ──
    var prevDet = prev.detritus !== undefined ? prev.detritus : 50;
    var nutF = cl(nNut / (nNut + 2.0), 0, 1);
    var tempF = cl(Math.exp(0.063 * (nSST - 10)), 0.3, 2.5);
    var bloom = Math.exp(-Math.pow((yf-0.3)*6,2))*0.5;
    // Upwelled nutrients fuel coastal productivity — this is why the PNW shelf is so productive
    var upwellNutrientBoost = 0; // disabled for test
    var ashProdPenalty = ashfallIntensity > 0.3 ? ashfallIntensity * 0.20 : 0;
    var phyGrowRate = 0.5 * light * nutF * tempF * (1 + bloom + upwellNutrientBoost) * prodMult * (1 - sp*0.6) * (1 - ashProdPenalty);
    var grazRate = 0.25 * prev.phyto / (prev.phyto + 300) * prev.zoo;
    var phyMort = 0.08 * prev.phyto;
    var nPhy = cl(prev.phyto + (phyGrowRate * prev.phyto - phyMort - grazRate) * dt - flush * prev.phyto * 0.3 * dt, 5, 2500);
    var zooGain = grazRate * 0.6;
    var zooMortR = (0.1 + (1 - cl(prev.wqi !== undefined ? prev.wqi : 0.6, 0, 1)) * 0.05) * prev.zoo;
    var zooPred = 0.06 * prev.zoo;
    var nZoo = cl(prev.zoo + (zooGain - zooMortR - zooPred) * dt - flush * prev.zoo * 0.2 * dt, 5, 1200);
    // NOTE: Nutrient ghost sink issue resolved by computeBiogeochem.js which tracks
    // explicit N/P/C/Si budgets with inter-basin exchange and Pacific inflow return.
    // These ad-hoc calculations are kept for backward compatibility but computeBiogeochem
    // provides the authoritative nutrient state via orchestrator coupling.
    var detIn = phyMort + grazRate * 0.4 + zooMortR * 0.5 + zooPred * 0.3;
    var remin = 0.15 * prevDet;
    var detSink = 0.12 * prevDet;
    var nDet = cl(prevDet + (detIn - remin - detSink) * dt - flush * prevDet * 0.15 * dt, 0, 2000);
    nNut = cl(nNut + remin * 0.005 * dt, 0, 50);
    // ── SEDIMENT OXYGEN DEMAND (SOD) ──
    // Benthic organic load accumulates from sinking detritus over years.
    // Very slow decay (remineralization in sediment). Consumes bottom-water DO.
    // Creates hysteresis: cleaning up inputs doesn't immediately fix hypoxia.
    var prevBenthic = prev.benthicLoad !== undefined ? prev.benthicLoad : (id === "hoodCanal" ? 60 : id === "southSound" ? 35 : 20);
    var benthicAccum = detSink * 0.4 * dt; // 40% of sinking detritus reaches benthos
    var benthicDecay = prevBenthic * 0.008 * dt; // ~3.2%/yr — very slow sediment remineralization
    // Dredging disturbance releases benthic nutrients (pulse) but reduces long-term load
    var dredgeRelease = (portExp.dredgingRate || 0) > 5000 ? prevBenthic * 0.01 * dt : 0;
    var nBenthic = cl(prevBenthic + benthicAccum - benthicDecay - dredgeRelease, 0, 500);
    // SOD: oxygen consumed by benthic decomposition, scaled by basin volume
    // Hood Canal is most vulnerable: small volume + poor flushing + high benthic load
    var sodRate = 0.003; // DO consumed per unit benthic load per quarter
    var sodVolScale = 50 / Math.max(def.vol, 10); // smaller basins feel it more
    var sod = nBenthic * sodRate * sodVolScale;
    // Nutrient release from benthic remineralization (internal loading — the hysteresis mechanism)
    var benthicNutRelease = benthicDecay * 0.003;
    nNut = cl(nNut + benthicNutRelease + dredgeRelease * 0.005, 0, 50);
    // Apply SOD to DO (post-hoc adjustment)
    nDO = cl(nDO - sod, 0, 14);
    var wqi=cl(cl(nDO,0,14)/14*0.25+(1-cl(nTurb,0,50)/40)*0.15+(cl(npH,7,8.3)-7)/1.3*0.15+(1-cl(nNoi,0,1))*0.1+(1-cl(nCon,0,1))*0.2+(1-cl(nNut,0,50)/30)*0.15,0,1);
    // ── HARMFUL ALGAL BLOOM (HAB) MODULE — DUAL SPECIES (RF-ENHANCED) ──
    // PRIMARY: Random Forest regression on basin-specific conditions.
    // FALLBACK: linear model if RF unavailable.
    // Refs: Trainer et al. 2002, 2012; Moore et al. 2009; McCabe et al. 2016
    var habSST = cl((nSST - 12) / 5, 0, 1);
    var habNut = cl(nNut / 20, 0, 1);
    var habStrat = cl(stratF * (id==="hoodCanal" ? 1.5 : id==="juanDeFuca" ? 0.3 : 1.0), 0, 1);
    var habFlush = cl(1 - flush * 2, 0, 1);
    var basinUpwelling = (id==="juanDeFuca" ? 0.5 : id==="sanjuan" ? 0.3 : id==="georgia" ? 0.15 : 0.05) * seas(yf, 0.2, 1.0);

    // Basin nutrient estimates for RF features
    var basinDIN = nNut;
    var basinDSi = nNut * 1.5; // approximate Si from N
    var basinSiN = basinDIN > 0.1 ? basinDSi / basinDIN : 2.0;
    var basinSalinity = nb[id] ? (nb[id].salinity || 30) : 30;
    var quarterNum = Math.floor(yf * 4);

    var habRfFeatures = {
      sst: nSST, stratification: habStrat, din: basinDIN, dsi: basinDSi,
      si_n_ratio: basinSiN, salinity: basinSalinity, upwelling: basinUpwelling,
      quarter: quarterNum, mhw_active: mhwActive ? 1 : 0,
    };

    var rfAlex = rfPredict('hab_alexandrium', habRfFeatures);
    var rfPN = rfPredict('hab_pseudonitzschia', habRfFeatures);

    // Linear fallback
    var alexSeason = Math.exp(-Math.pow((yf - 0.55) * 5, 2));
    var linearAlex = cl(habSST * 0.35 + habNut * 0.20 + habStrat * 0.25 + habFlush * 0.10 + alexSeason * 0.10 - sp*0.3 + mhwActive * 0.15, 0, 1);
    var pnSeason = Math.exp(-Math.pow((yf - 0.40) * 4, 2));
    var linearPN = cl(habNut * 0.30 + basinUpwelling * 0.25 + habSST * 0.20 + pnSeason * 0.15 + habFlush * 0.10 - sp*0.2 + mhwActive * 0.15, 0, 1);

    var alexandriumIntensity = (rfAlex !== undefined && isFinite(rfAlex)) ? cl(rfAlex, 0, 1) : linearAlex;
    var pseudoNitzschiaIntensity = (rfPN !== undefined && isFinite(rfPN)) ? cl(rfPN, 0, 1) : linearPN;

    var pspClosure = alexandriumIntensity > 0.3 ? 1 : 0;
    var aspClosure = pseudoNitzschiaIntensity > 0.25 ? 1 : 0;
    var habIntensity = Math.max(alexandriumIntensity, pseudoNitzschiaIntensity);
    var shellfishClosure = (pspClosure || aspClosure) ? 1 : habIntensity > 0.4 ? 0.5 : 0;
    // MHW depresses DO via warming (reduced O2 solubility) + increased stratification
    if (mhwActive) { nDO = cl(nDO - mhwSSTAnomaly * 0.3, 0, 14); }
    // Earthquake: deep DO penalty from landslide sediment resuspension
    if (prevQuakeSediment > 5) {
      nDO = cl(nDO - prevQuakeSediment * 0.04, 0, 14);
    }
    nb[id] = { DO:cl(nDO,0,14), SST:nSST, salinity:cl(nSal,12,34), nutrients:cl(nNut,0,50), turbidity:cl(nTurb,0,80), pH:cl(npH,7,8.3), noise:cl(nNoi,0,1), contam:cl(nCon,0,1), pcb:nPCB, pfas:nPFAS, microplastics:nMP, phyto:cl(nPhy,5,2500), zoo:cl(nZoo,5,1200), detritus:cl(nDet,0,2000), wqi:wqi, habIntensity:habIntensity, shellfishClosure:shellfishClosure, mhwActive:mhwActive, omegaAragonite:omegaAragonite, shellfishViability:shellfishViability, benthicLoad:nBenthic, sod:sod, quakeSediment:prevQuakeSediment, alexandriumIntensity:alexandriumIntensity, pseudoNitzschiaIntensity:pseudoNitzschiaIntensity, pspClosure:pspClosure, aspClosure:aspClosure };
  });
  EXCHANGE.forEach(function(ex) { var a=ex[0],b=ex[1],r=ex[2]*91.25*dt;if(!nb[a]||!nb[b])return;["DO","nutrients","turbidity","contam","detritus"].forEach(function(p){var d=nb[b][p]-nb[a][p];nb[a][p]+=d*r*0.5;nb[b][p]-=d*r*0.5;});
    // SST exchange at reduced rate — SST is primarily set by atmospheric/upwelling forcing, not tidal mixing
    var sstD = nb[b].SST - nb[a].SST; nb[a].SST += sstD * r * 0.15; nb[b].SST -= sstD * r * 0.15;
    // Salinity exchange at reduced rate — maintained by continuous river input against tidal mixing
    var salD = nb[b].salinity - nb[a].salinity; nb[a].salinity += salD * r * 0.25; nb[b].salinity -= salD * r * 0.25;
  });

  // ══════════════════════════════════════════════════════════════
  // 2-LAYER FJORD MODEL — all basins
  // Surface layer (photic, oxygenated, river-influenced) and deep layer
  // (cold, nutrient-rich, potentially hypoxic behind sills).
  // Generalizes the former Hood Canal-only implementation.
  // ══════════════════════════════════════════════════════════════
  var winterPeak = seas(yf, 1.0, 0.2); // strong in winter, weak in summer
  var totalRiverDischarge = 0;
  Object.keys(BASINS).forEach(function(id) {
    var lD2 = 0;
    (BASINS[id].rivers || []).forEach(function(r) { if (wsRivers[r]) lD2 += wsRivers[r].discharge; });
    if (id === "juanDeFuca" || id === "georgia") totalRiverDischarge += lD2;
  });
  // Compute total river discharge for river stratification scaling
  var globalRiverDischarge = 0;
  Object.keys(BASINS).forEach(function(id) {
    (BASINS[id].rivers || []).forEach(function(r) { if (wsRivers[r]) globalRiverDischarge += wsRivers[r].discharge; });
  });

  // Seasonal quarter for renewal event pseudo-random seeding
  var quarter = (yf !== undefined ? yf : 0) * 4;

  Object.keys(BASINS).forEach(function(id) {
    var def = BASINS[id];
    var hc = nb[id];
    var prevB = prevBasins[id];
    if (!hc || !prevB) return;

    // Get or initialize layers from previous state
    var prevSurf = prevB.surface !== undefined && prevB.surface !== null
      ? prevB.surface : { DO: 8.0, SST: 11.0, pH: 8.0, nutrients: 8, salinity: 28 };
    var prevDeep = prevB.deep !== undefined && prevB.deep !== null
      ? prevB.deep : { DO: 5.0, SST: 9.0, pH: 7.90, nutrients: 14, salinity: 31 };

    var surfaceDepth = def.surfaceDepth;
    var totalDepth = def.totalDepth;
    var surfFrac = surfaceDepth / totalDepth;
    var deepFrac = 1 - surfFrac;

    // ── Per-basin river discharge ──
    var basinRiverD = 0;
    (def.rivers || []).forEach(function(r) { if (wsRivers[r]) basinRiverD += wsRivers[r].discharge; });

    // ── Stratification ──
    // Density difference between layers drives stratification strength
    var densityDiff = (prevDeep.salinity - prevSurf.salinity) * 0.8
      + (prevSurf.SST - prevDeep.SST) * 0.2;
    var basinStrat = cl(densityDiff / 5, 0.1, 0.9);

    // River influence increases stratification (freshening the surface)
    var riverStrat = def.riverInfluence * cl(basinRiverD / 5000, 0, 1) * 0.2;
    basinStrat = cl(basinStrat + riverStrat, 0.1, 0.95);

    // ── Vertical mixing (basin-specific) ──
    var basinTidalMixing = def.tidalMixing;
    // tidalExchangeRate param (default 60%): user control over basin flushing/exchange
    // At 60% (default): no change. Higher = more exchange, faster flushing.
    var tidalExchangeAdj = (P.tidalExchangeRate !== undefined ? P.tidalExchangeRate : 60) / 60; // normalized to default
    // oceanCurrentStrength param (default 70%): controls overall current-driven mixing
    var currentAdj = (P.oceanCurrentStrength !== undefined ? P.oceanCurrentStrength : 70) / 70;
    // Apply spring-neap modulation, sill enhancement, and user adjustments
    var effectiveTidal = basinTidalMixing * springNeapMod * (sillEnhancement[id] !== undefined ? sillEnhancement[id] : 1.0) * tidalExchangeAdj * currentAdj;
    // Tidal energy extraction reduces mixing (up to 30% reduction)
    effectiveTidal *= (1 - tidalExtraction * 0.30);
    var tidalMix = cl(effectiveTidal, 0.02, 0.40);
    // Wind mixing: seasonal base (stronger in winter) + AR/storm boost + historical wind forcing
    var arWind = S.atmosphericRiver || 0;
    var stormWind = S.storm || 0;
    // Historical wind speed override from hindcast (NDBC buoy data, m/s, baseline ~4.5)
    var histWindAdj = oForcing && oForcing.windSpeed !== undefined ? cl(oForcing.windSpeed / 4.5, 0.7, 1.3) : 1.0;
    var windSpeed = cl((winterPeak * 0.6 + arWind * 0.3 + stormWind * 0.4) * histWindAdj, 0.1, 1.0);
    var windMix = (winterPeak * 0.08 + arWind * 0.03 + stormWind * 0.04) * histWindAdj; // wind drives surface mixing → DO renewal
    var vertExchange = cl((tidalMix + windMix) * (1 - basinStrat * 0.7), 0.02, 0.30);

    // ── Deep renewal events (sill basins only) ──
    // Basins with sills get episodic renewal when dense Pacific water floods over sill.
    // Juan de Fuca and San Juan are open — they exchange freely (no sill).
    var renewal = 0;
    if (def.sillDepth !== null && def.sillDepth !== undefined) {
      // Deeper sill = easier renewal; shallow sill = rare renewal
      var renewalEase = cl(def.sillDepth / 100, 0.1, 1.0);
      // Deterministic pseudo-random keyed on climate state + season + basin phyto
      var renewalSeed = Math.sin((climD.sstDelta || 0) * 100 + quarter * 37 + (hc.phyto !== undefined ? hc.phyto : 500) * 0.01
        + (id === "georgia" ? 1 : id === "whidbey" ? 2 : id === "mainBasin" ? 3 : id === "hoodCanal" ? 4 : id === "southSound" ? 5 : 0) * 73) * 0.5 + 0.5;
      var renewalProb = cl(0.05 + renewalEase * 0.15 + (oForcing ? (1 - oForcing.productivityMult) * 0.10 : 0), 0, 0.30);
      renewal = renewalSeed < renewalProb ? 1 : 0;
      if (renewal) vertExchange = cl(vertExchange + 0.15 * renewalEase, 0.02, 0.40);
    }

    // ── Surface layer physics ──
    // Reaeration (atmosphere -> surface): scales with wind and DO deficit
    // O2 saturation at typical Salish Sea SST (~11°C, salinity ~28): ~8.5 mg/L
    // Garcia & Gordon 1992 — reaeration coefficient ~0.15/quarter deficit
    var surfReaer = cl((8.5 - prevSurf.DO) * 0.15, -0.3, 0.5);
    // Photosynthetic O2
    var surfPhoto = (hc.phyto !== undefined ? hc.phyto : 500) / 1000 * 0.3;
    // Respiration from SOD — attenuated in surface layer (SOD mostly affects deep/benthic)
    var respiration = hc.sod !== undefined ? hc.sod : 0.3;
    // River freshening
    var riverFresh = def.riverInfluence * cl(basinRiverD / 5000, 0, 1);

    // Surface DO: restoring toward saturation. Surface waters stay well-oxygenated
    // because atmospheric reaeration is fast relative to biological consumption.
    // Only deep, sill-restricted basins (Hood Canal) develop hypoxia.
    // The 0.08 restoring coefficient provides thermal inertia — prevents
    // unrealistic DO crashes during MHW events (real surface DO doesn't crash
    // during The Blob because reaeration keeps pace with warming-driven solubility loss).
    var surfDOTarget = cl(8.5 - (hc.SST - 11.0) * 0.15, 6.5, 10.0); // lower saturation when warmer
    var surfDORestore = (surfDOTarget - prevSurf.DO) * 0.08;
    var surfDO = cl(
      prevSurf.DO + surfReaer + surfPhoto + surfDORestore
      - vertExchange * (prevSurf.DO - prevDeep.DO) * 0.5
      - respiration * surfFrac * 0.15,
      3.0, 12.0
    );

    var surfSST = prevSurf.SST + (hc.SST - prevSurf.SST) * 0.3;
    var surfSalinity = prevSurf.salinity + (hc.salinity - prevSurf.salinity) * 0.2;
    // River input freshens surface
    var seasonalRiverFresh = riverFresh * seas(yf, 1.2, 0.3); // more in winter
    surfSalinity = cl(surfSalinity - seasonalRiverFresh * 2, 15, 34);

    var surfNutrients = cl(
      prevSurf.nutrients
      - surfPhoto * 3
      + vertExchange * (prevDeep.nutrients - prevSurf.nutrients) * 0.3,
      1, 25
    );
    var surfpH = prevSurf.pH + (hc.pH - prevSurf.pH) * 0.2;

    // ── Deep layer physics ──
    // Hood Canal has elevated SOD from chronic benthic loading (Newton et al. 2011)
    var deepSOD = id === "hoodCanal" ? 0.25 : id === "southSound" ? 0.18 : 0.15;
    var deepBOD = (hc.phyto !== undefined ? hc.phyto : 500) / 1000 * 0.12;

    // Deep DO target: determined by balance of consumption vs. supply from mixing
    // Open basins (JdF, SanJuan) have higher deep DO; sill basins (HC) have lower
    var deepDOTarget = id === "hoodCanal" ? 3.5 : id === "southSound" ? 4.0
      : id === "whidbey" ? 4.5 : id === "georgia" ? 5.0
      : id === "mainBasin" ? 5.5 : id === "sanjuan" ? 7.5 : 6.0;
    // Restoring toward target at a rate modulated by vertical exchange (more mixing = faster restoring)
    // The restoring represents deep water renewal from the Pacific — a continuous process
    // that prevents most basins from developing sustained hypoxia (Hood Canal is the exception).
    // Minimum restoring rate 0.04 ensures non-sill basins don't crash during MHW events.
    // Hindcast calibration (2026-03-24): with 0.02 minimum, DO crashed to 3.6-4.5 in
    // non-Hood-Canal basins during MHW years — unrealistic (real PS avg stays 6.0-6.5).
    var deepRestoreRate = cl(vertExchange * 0.5, id === "hoodCanal" ? 0.02 : 0.04, 0.15);
    var deepRestore = (deepDOTarget - prevDeep.DO) * deepRestoreRate;
    var deepDO = cl(
      prevDeep.DO
      - deepSOD - deepBOD
      + vertExchange * (prevSurf.DO - prevDeep.DO) * 0.5
      + deepRestore,
      0.5, 10.0
    );

    var deepSST = prevDeep.SST + (8.5 - prevDeep.SST) * 0.05; // thermally stable
    if (renewal) deepSST = cl(deepSST + (hc.SST - 2 - deepSST) * 0.3, 7, 11);

    var deepSalinity = prevDeep.salinity; // stable unless renewal
    if (renewal) deepSalinity = cl(deepSalinity + (33 - deepSalinity) * 0.2, 29, 34);

    var deepNutrients = cl(
      prevDeep.nutrients
      + deepBOD * 5
      - vertExchange * (prevDeep.nutrients - prevSurf.nutrients) * 0.3,
      5, 30
    );

    var deeppH = cl(prevDeep.pH - deepBOD * 0.02 + (renewal ? 0.03 : 0), 7.5, 8.1);

    // ── DIC / TA EVOLUTION (2-layer carbonate chemistry) ──
    var prevSurfDIC = prevSurf.DIC !== undefined ? prevSurf.DIC : 1980;
    var prevSurfTA = prevSurf.TA !== undefined ? prevSurf.TA : 2150;
    var prevDeepDIC = prevDeep.DIC !== undefined ? prevDeep.DIC : 2200;
    var prevDeepTA = prevDeep.TA !== undefined ? prevDeep.TA : 2250;

    // River input (fresh, low DIC/TA — dilutes buffering capacity)
    var riverDICInput = cl(basinRiverD / 5000, 0, 1) * def.riverInfluence;
    // NOTE: Carbonate pump (CaCO3 precipitation/dissolution) now handled by
    // computeBiogeochem.js. These calculations are kept for backward compatibility.
    var riverDIC = 500; // umol/kg — rivers have low DIC
    var riverTA = 800;  // umol/kg — rivers have low TA

    // Wastewater DIC loading (urban runoff adds DIC)
    var wwDIC = (hc.wqi !== undefined ? (1 - hc.wqi) : 0.3) * 5; // small addition from urban

    // Air-sea CO2 flux: drives surface DIC toward equilibrium with atmosphere
    // Positive = ocean absorbs CO2 (DIC increases); negative = ocean outgasses
    var surfPCO2est = prevSurfDIC > 1800 ? cl(350 + (prevSurfDIC - 1900) * 1.5, 200, 1500) : 300;
    var co2Flux = (atmCO2 - surfPCO2est) * 0.003; // umol/kg/quarter, scaled

    // Photosynthesis removes DIC (surface); respiration adds DIC (deep)
    var photoRemoval = surfPhoto * 12; // Redfield: 6.6 mol C per mol O2 produced
    var respAddition = (deepSOD + deepBOD) * 14; // Redfield: ~1.1 mol DIC per mol O2 consumed

    // Vertical exchange of DIC/TA between layers
    var dicExchange = vertExchange * (prevDeepDIC - prevSurfDIC) * 0.3;
    var taExchange = vertExchange * (prevDeepTA - prevSurfTA) * 0.3;

    // Surface DIC evolution
    var surfDIC = cl(prevSurfDIC
      + co2Flux
      - photoRemoval
      + dicExchange
      + riverDICInput * (riverDIC - prevSurfDIC) * 0.05
      + wwDIC,
      1600, 2400);

    // Surface TA: modified by river dilution and nitrate uptake (small)
    var surfTA = cl(prevSurfTA
      + taExchange
      + riverDICInput * (riverTA - prevSurfTA) * 0.05
      + surfPhoto * 1.0, // nitrate uptake increases TA slightly
      1800, 2400);

    // Deep DIC: respiration adds DIC
    var deepDIC = cl(prevDeepDIC
      + respAddition
      - dicExchange,
      1800, 2500);

    // Deep TA: sediment buffering when omega < 1.0 (dissolution adds alkalinity)
    var deepOmegaEst = cl(2.5 * Math.pow(10, deeppH - 8.1) * (deepSalinity / 30), 0.3, 4.0);
    var sedBuffering = deepOmegaEst < 1.0 ? (1.0 - deepOmegaEst) * 3.0 : 0;
    var deepTA = cl(prevDeepTA
      - taExchange
      + sedBuffering
      - respAddition * 0.05, // respiration slightly decreases TA
      1900, 2500);

    // Compute pH and omega FROM DIC/TA using the carbonate solver
    var surfCarb = computeCarbonate(surfDIC, surfTA, surfSST, surfSalinity);
    var deepCarb = computeCarbonate(deepDIC, deepTA, deepSST, deepSalinity);

    // Use carbonate solver pH for the 2-layer model
    surfpH = surfCarb.pH;
    deeppH = deepCarb.pH;

    // ── UPWELLING: Pacific deep water floods into JdF deep layer ──
    // During upwelling, cold nutrient-rich Pacific water replaces JdF deep water.
    // This is the primary pathway by which corrosive, hypoxic water enters the Salish Sea.
    if (id === "juanDeFuca") {
      var upwellFrac = cl(upwellingIndex * 0.15, 0, 0.15);
      deepDO = deepDO * (1 - upwellFrac) + pacificSourceDO * upwellFrac;
      deepSST = deepSST * (1 - upwellFrac) + pacificSourceSST * upwellFrac;
      deepNutrients = deepNutrients * (1 - upwellFrac) + pacificSourceNutrients * upwellFrac;
      deepSalinity = deepSalinity * (1 - upwellFrac) + pacificSourceSalinity * upwellFrac;
      deepDIC = deepDIC * (1 - upwellFrac) + pacificSourceDIC * upwellFrac;
      deepTA = deepTA * (1 - upwellFrac) + pacificSourceTA * upwellFrac;
      // Recompute deep carbonate chemistry after Pacific source water mixes in.
      // pH is now derived from DIC/TA via CO2SYS — not mixed from pacificSourcepH.
      deepCarb = computeCarbonate(deepDIC, deepTA, deepSST, deepSalinity);
      deeppH = deepCarb.pH;
    }

    // ── CO2SYS AUTHORITATIVE OMEGA ──
    // Override parameterized proxy (set in first forEach loop) with thermodynamically-derived omega.
    // Use SURFACE omega for the single-layer biological output: pteropods, shellfish, and acid
    // stress indicators respond to conditions in the photic/shallow zone, not the deep layer.
    // Deep omega is stored in hc.deep.omega for any future deep-organism models.
    var co2sysOmega = cl(surfCarb.omega, 0.3, 4.0);
    hc.omegaAragonite = co2sysOmega;
    hc.shellfishViability = co2sysOmega > 1.5 ? 1.0 : co2sysOmega > 1.0 ? cl((co2sysOmega - 0.8) / 0.7, 0, 1) : cl(co2sysOmega / 1.0 * 0.3, 0, 0.3);

    // ── Store layers ──
    hc.surface = { DO: surfDO, SST: surfSST, pH: surfpH, nutrients: surfNutrients, salinity: surfSalinity, DIC: surfDIC, TA: surfTA, pCO2: surfCarb.pCO2 };
    hc.deep = { DO: deepDO, SST: deepSST, pH: deeppH, nutrients: deepNutrients, salinity: deepSalinity, DIC: deepDIC, TA: deepTA, omega: deepCarb.omega };
    hc.surfaceDepth = surfaceDepth;
    hc.totalDepth = totalDepth;
    hc.sillDepth = def.sillDepth;
    hc.stratification = basinStrat;
    hc.renewalEvent = renewal;
    hc.verticalExchange = vertExchange;
    // stratification-deficit (0=fully mixed, 1=fully isolated); 0.40 = uniform
    // sill-basin vertExchange upper-bound clamp from line 538 per pre-reg §11
    // Amendment 1; non-sill basins capped at 0.30 per line 524 — out-of-scope
    // caveat noted at Amendment 1.
    hc.stratDeficit = 1 - vertExchange / 0.40;

    // ── FRASER PLUME EFFECTS ON GEORGIA STRAIT ──
    if (id === "georgia") {
      // Fraser plume: shallow fresh layer covers up to 50% of Georgia Strait surface
      hc.surface.salinity -= fraserPlumeFrac * 8; // Fraser is fresh water
      hc.surface.salinity = cl(hc.surface.salinity, 12, 30);
      // Adds nutrients from Fraser watershed
      hc.surface.nutrients += fraserPlumeFrac * 5;
      hc.surface.nutrients = cl(hc.surface.nutrients, 1, 25);
      // Strengthens stratification
      hc.stratification = cl(hc.stratification + fraserPlumeFrac * 0.3, 0.1, 0.95);
      // Turbidity from Fraser sediment
      hc.turbidity = cl(hc.turbidity + fraserSediment * 3, 0, 50);
    }

    // ── FRASER PLUME REACHES SAN JUAN DURING FRESHET ──
    if (id === "sanjuan" && fraserDischarge > 4000) {
      var sjFraserEffect = cl((fraserDischarge - 4000) / 6000 * 0.05, 0, 0.05);
      hc.surface.salinity -= sjFraserEffect * 3;
      hc.surface.salinity = cl(hc.surface.salinity, 15, 34);
    }

    // ── Backward-compatible aggregates ──
    // The single-box computation (above) already produced calibrated aggregate values
    // for DO, SST, salinity, pH, nutrients. The 2-layer model adds surface/deep detail
    // WITHOUT overriding those aggregates — keeping calibration intact.
    // Only Hood Canal gets a modest DO adjustment from deep hypoxia (original behavior).
    if (id === "hoodCanal") {
      hc.DO = cl(surfDO * surfFrac + deepDO * deepFrac, 0, 14);
      // Recompute WQI with updated DO
      hc.wqi = cl(
        cl(hc.DO,0,14)/14*0.25 + (1-cl(hc.turbidity,0,50)/40)*0.15
        + (cl(hc.pH,7,8.3)-7)/1.3*0.15 + (1-cl(hc.noise,0,1))*0.1
        + (1-cl(hc.contam,0,1))*0.2 + (1-cl(hc.nutrients,0,50)/30)*0.15,
        0, 1
      );
    }
  });

  // ── INTER-BASIN DEEP WATER FLOW ──
  // Deep water cascades inward from Pacific:
  // Pacific -> JdF -> SanJuan -> {Main Basin, Whidbey, Georgia}
  // Main Basin -> {Hood Canal, South Sound}
  // Each step degrades DO slightly (transit time + consumption).
  // Pacific deep water source — represents tidal exchange with open ocean.
  // Upwelling-driven low-DO intrusion is now handled explicitly in the 2-layer loop,
  // so this represents the non-upwelling (tidal/estuarine) deep exchange pathway.
  // Now that upwelling handles the low-DO Pacific intrusion explicitly,
  // the tidal exchange pathway carries somewhat better-oxygenated water.
  var pacificDeepDO = cl(6.5 + upwellingIndex * 1.5, 6.5, 8.0);
  if (nb.juanDeFuca && nb.juanDeFuca.deep) {
    nb.juanDeFuca.deep.DO = cl(nb.juanDeFuca.deep.DO * 0.7 + pacificDeepDO * 0.3, 3, 9);
  }
  if (nb.sanjuan && nb.sanjuan.deep && nb.juanDeFuca && nb.juanDeFuca.deep) {
    nb.sanjuan.deep.DO = cl(nb.sanjuan.deep.DO * 0.7 + nb.juanDeFuca.deep.DO * 0.3, 3, 8);
  }
  if (nb.georgia && nb.georgia.deep && nb.sanjuan && nb.sanjuan.deep) {
    nb.georgia.deep.DO = cl(nb.georgia.deep.DO * 0.8 + nb.sanjuan.deep.DO * 0.2, 2, 8);
  }
  if (nb.whidbey && nb.whidbey.deep && nb.sanjuan && nb.sanjuan.deep) {
    nb.whidbey.deep.DO = cl(nb.whidbey.deep.DO * 0.8 + nb.sanjuan.deep.DO * 0.2, 2, 8);
  }
  if (nb.mainBasin && nb.mainBasin.deep && nb.sanjuan && nb.sanjuan.deep) {
    nb.mainBasin.deep.DO = cl(nb.mainBasin.deep.DO * 0.8 + nb.sanjuan.deep.DO * 0.2, 2, 8);
  }
  if (nb.hoodCanal && nb.hoodCanal.deep && nb.mainBasin && nb.mainBasin.deep) {
    // Hood Canal sill severely restricts deep water renewal — minimal influence from Main Basin
    nb.hoodCanal.deep.DO = cl(nb.hoodCanal.deep.DO * 0.95 + nb.mainBasin.deep.DO * 0.05, 0.5, 8);
  }
  if (nb.southSound && nb.southSound.deep && nb.mainBasin && nb.mainBasin.deep) {
    nb.southSound.deep.DO = cl(nb.southSound.deep.DO * 0.8 + nb.mainBasin.deep.DO * 0.2, 1, 8);
  }

  // After inter-basin deep flow, recompute Hood Canal volume-weighted DO
  // (other basins keep their single-box calibrated DO values)
  if (nb.hoodCanal && nb.hoodCanal.surface && nb.hoodCanal.deep) {
    var hcDef = BASINS.hoodCanal;
    var hcSf = hcDef.surfaceDepth / hcDef.totalDepth;
    var hcDf = 1 - hcSf;
    nb.hoodCanal.DO = cl(nb.hoodCanal.surface.DO * hcSf + nb.hoodCanal.deep.DO * hcDf, 0, 14);
  }

  var tV=0, ag={dissolvedOxygen:0,sst:0,salinity:0,nutrientConcentration:0,turbidity:0,pH:0,noiseIndex:0,contaminationLevel:0,waterQualityIndex:0,phyto:0,zoo:0,habIntensity:0,omegaAragonite:0,shellfishViability:0,pcb:0,pfas:0,microplastics:0,surfaceDIC:0,surfaceTA:0,surfacePCO2:0};
  var maxHab = 0, totalClosure = 0, minOmega = 4, maxAlexandrium = 0, maxPseudoNitzschia = 0, totalPSP = 0, totalASP = 0;
  Object.keys(BASINS).forEach(function(id){var v=BASINS[id].vol,b=nb[id];tV+=v;ag.dissolvedOxygen+=b.DO*v;ag.sst+=b.SST*v;ag.salinity+=b.salinity*v;ag.nutrientConcentration+=b.nutrients*v;ag.turbidity+=b.turbidity*v;ag.pH+=b.pH*v;ag.noiseIndex+=b.noise*v;ag.contaminationLevel+=b.contam*v;ag.waterQualityIndex+=b.wqi*v;ag.phyto+=b.phyto*v;ag.zoo+=b.zoo*v;ag.habIntensity+=b.habIntensity*v;ag.omegaAragonite+=b.omegaAragonite*v;ag.shellfishViability+=b.shellfishViability*v;ag.pcb+=(b.pcb||0)*v;ag.pfas+=(b.pfas||0)*v;ag.microplastics+=(b.microplastics||0)*v;ag.surfaceDIC+=(b.surface&&b.surface.DIC!==undefined?b.surface.DIC:1980)*v;ag.surfaceTA+=(b.surface&&b.surface.TA!==undefined?b.surface.TA:2150)*v;ag.surfacePCO2+=(b.surface&&b.surface.pCO2!==undefined?b.surface.pCO2:400)*v;if(b.habIntensity>maxHab)maxHab=b.habIntensity;if(b.omegaAragonite<minOmega)minOmega=b.omegaAragonite;totalClosure+=b.shellfishClosure;if((b.alexandriumIntensity||0)>maxAlexandrium)maxAlexandrium=b.alexandriumIntensity||0;if((b.pseudoNitzschiaIntensity||0)>maxPseudoNitzschia)maxPseudoNitzschia=b.pseudoNitzschiaIntensity||0;totalPSP+=b.pspClosure||0;totalASP+=b.aspClosure||0;});
  if (tV > 0) { Object.keys(ag).forEach(function(k){ag[k]/=tV;}); }
  ag.maxHabIntensity=maxHab; ag.shellfishClosureFrac=totalClosure/Object.keys(BASINS).length; ag.minOmegaAragonite=minOmega;
  ag.maxAlexandrium=maxAlexandrium; ag.maxPseudoNitzschia=maxPseudoNitzschia; ag.pspClosureFrac=totalPSP/Object.keys(BASINS).length; ag.aspClosureFrac=totalASP/Object.keys(BASINS).length;
  ag.pugetSoundDO=nb.hoodCanal.DO; ag.stratFactor=stratF; ag.navigationConditions=cl(1-ag.turbidity*0.005-st*0.4,0.2,1); ag.channelSedimentation=200*0.02;
  ag.mhwActive=mhwActive; ag.mhwIntensity=mhw?mhw.intensity:0; ag.mhwSSTAnomaly=mhwSSTAnomaly;
  ag.tidalExtraction=tidalExtraction; ag.mixingReduction=mixingReduction; ag.tidalStratBonus=tidalStratBonus;
  ag.hoodCanalBenthicLoad=nb.hoodCanal.benthicLoad; ag.hoodCanalSOD=nb.hoodCanal.sod;
  ag.hoodCanalSurfaceDO=nb.hoodCanal.surface?nb.hoodCanal.surface.DO:8; ag.hoodCanalDeepDO=nb.hoodCanal.deep?nb.hoodCanal.deep.DO:3.5;
  ag.hoodCanalStratification=nb.hoodCanal.stratification!==undefined?nb.hoodCanal.stratification:0.5; ag.hoodCanalRenewal=nb.hoodCanal.renewalEvent||0;
  // Per-basin layer aggregates for dashboard
  ag.juanDeFucaDeepDO=nb.juanDeFuca.deep?nb.juanDeFuca.deep.DO:6.0;
  ag.georgiaStratification=nb.georgia.stratification!==undefined?nb.georgia.stratification:0.3;
  ag.georgiaDeepDO=nb.georgia.deep?nb.georgia.deep.DO:5.0;
  ag.sanJuanDeepDO=nb.sanjuan.deep?nb.sanjuan.deep.DO:7.5;
  ag.whidbeyDeepDO=nb.whidbey.deep?nb.whidbey.deep.DO:4.5;
  ag.mainBasinDeepDO=nb.mainBasin.deep?nb.mainBasin.deep.DO:5.5;
  ag.southSoundDeepDO=nb.southSound.deep?nb.southSound.deep.DO:4.0;
  ag.upwellingIndex=upwellingIndex; ag.pacificSourceDO=pacificSourceDO; ag.pacificSourcepH=pacificSourcepH;
  ag.fraserDischarge=fraserDischarge; ag.fraserSediment=fraserSediment; ag.fraserPlumeFrac=fraserPlumeFrac;
  ag.tidalMixingIndex=springNeapMod; ag.springNeapPhase=lunarPhase;
  // Aggregate quake sediment across basins (max for risk flags)
  var maxQuakeSediment = 0;
  Object.keys(BASINS).forEach(function(id) { if (nb[id] && nb[id].quakeSediment > maxQuakeSediment) maxQuakeSediment = nb[id].quakeSediment; });
  ag.maxQuakeSediment = maxQuakeSediment;
  ag.earthquakeActive = eqIntensity;
  ag.coseismicSubsidence=coseismicSubsidence; ag.liquefactionIntensity=liquefactionIntensity; ag.earthquakeType=eqType;
  ag.laharActive=laharIntensity; ag.bakerActive=bakerIntensity; ag.ashfallActive=ashfallIntensity;
  ag.atmCO2=atmCO2;
  ag.windSpeed=cl(winterPeak * 0.6 + (S.atmosphericRiver||0) * 0.3 + (S.storm||0) * 0.4, 0.1, 1.0);
  ag.invasivePressure=portExp.invasivePressure||0; ag.wwDisturbance=portExp.wwDisturbance||0; ag.vesselSpeedZone=portExp.vesselSpeedZone||0; ag.noiseProfile=portExp.noiseProfile||null;

  // ═══════════════════════════════════════════════════════════
  // SUB-BASIN STATE DISTRIBUTION (Phase 2)
  // ═══════════════════════════════════════════════════════════
  // Distribute parent basin results to 18 sub-basins with spatial differentiation.
  // Each sub-basin inherits its parent's computed state but applies local modifiers
  // based on sub-basin properties (depth, tidal mixing, urban character, river inputs).
  // This preserves calibration at the 7-basin level while adding spatial detail.
  var prevSubBasins = prevBasins._subBasins || {};
  var subBasinState = {};

  for (var sbi = 0; sbi < SUB_BASIN_IDS.length; sbi++) {
    var sbId = SUB_BASIN_IDS[sbi];
    var sbDef = SUB_BASINS[sbId];
    var parentId = sbDef.parent;
    var parentState = nb[parentId];
    var parentDef = BASINS[parentId];
    var prevSb = prevSubBasins[sbId] || {};

    if (!parentState) continue;

    // Start with parent state as baseline
    var sbState = {};
    var pKeys = Object.keys(parentState);
    for (var pk = 0; pk < pKeys.length; pk++) {
      var pv = parentState[pKeys[pk]];
      if (typeof pv === 'object' && pv !== null && !Array.isArray(pv)) {
        sbState[pKeys[pk]] = {};
        var subKeys = Object.keys(pv);
        for (var sk = 0; sk < subKeys.length; sk++) sbState[pKeys[pk]][subKeys[sk]] = pv[subKeys[sk]];
      } else {
        sbState[pKeys[pk]] = pv;
      }
    }

    // ── Sub-basin-specific SST differentiation ──
    // Sub-basins with different SST offsets from parent
    var sstDiff = sbDef.sstOffset - (parentState.sstOffset || 0);
    sbState.SST = cl(parentState.SST + sstDiff * 0.5, 4, 25); // damped differentiation
    if (sbState.surface) sbState.surface.SST = cl(parentState.surface.SST + sstDiff * 0.5, 4, 25);

    // ── Sub-basin DO differentiation based on flushing ──
    // Sub-basins with longer flushing have lower DO (more respiration consumption)
    var flushRatio = parentDef.flushHalf > 0 ? sbDef.flushHalf / parentDef.flushHalf : 1;
    var doDiff = (1 - flushRatio) * 1.5; // poorly flushed = lower DO
    sbState.DO = cl(parentState.DO + doDiff, 0, 14);
    if (sbState.deep) {
      // Deep DO: more differentiation — poorly flushed sub-basins trap hypoxic deep water
      var deepDoDiff = (1 - flushRatio) * 2.5;
      sbState.deep.DO = cl(parentState.deep.DO + deepDoDiff, 0, 12);
    }

    // ── Sub-basin salinity differentiation from river inputs ──
    var sbRiverInfluence = sbDef.riverInfluence || 0;
    var parentRiverInfluence = parentDef.riverInfluence || 0;
    if (sbRiverInfluence > parentRiverInfluence) {
      var freshDiff = (sbRiverInfluence - parentRiverInfluence) * 8;
      sbState.salinity = cl(parentState.salinity - freshDiff, 10, 35);
      if (sbState.surface) sbState.surface.salinity = cl(parentState.surface.salinity - freshDiff, 10, 35);
      sbState.nutrients = cl(parentState.nutrients + (sbRiverInfluence - parentRiverInfluence) * 10, 0, 50);
    }

    // ── Sub-basin contamination differentiation ──
    sbState.contam = cl(sbDef.contaminationBaseline + (parentState.contam - (parentDef.contaminationBaseline || 0.15)) * 0.5, 0, 1);
    sbState.noise = cl(sbDef.urbanCharacter * 0.4 + (parentState.noise || 0) * 0.3, 0, 1);

    // ── Benthic load ──
    sbState.benthicLoad = sbDef.benthicLoad;

    // ── Structural properties ──
    sbState.surfaceDepth = sbDef.surfaceDepth;
    sbState.totalDepth = sbDef.totalDepth;
    sbState.sillDepth = sbDef.sillDepth;
    sbState.tidalMixing = sbDef.tidalMixing;
    sbState.volume = sbDef.volume;
    sbState.parent = parentId;

    subBasinState[sbId] = sbState;
  }

  // ── Inter-sub-basin exchange ──
  // Explicit exchange of state variables between connected sub-basins
  // Using forward Euler: flux = rate × dt × (neighbor - this), normalized by volume
  var exchangeKeys = ['DO', 'nutrients', 'salinity'];
  for (var exi = 0; exi < SUB_EXCHANGE.length; exi++) {
    var ex = SUB_EXCHANGE[exi];
    var sbA = subBasinState[ex.from];
    var sbB = subBasinState[ex.to];
    if (!sbA || !sbB) continue;
    var volA = SUB_BASINS[ex.from].volume;
    var volB = SUB_BASINS[ex.to].volume;
    var exRate = ex.rate * dt;

    for (var eki = 0; eki < exchangeKeys.length; eki++) {
      var ek = exchangeKeys[eki];
      var vA = sbA[ek] !== undefined ? sbA[ek] : 0;
      var vB = sbB[ek] !== undefined ? sbB[ek] : 0;
      var flux = exRate * (vB - vA);
      sbA[ek] = vA + flux * Math.min(volB, volA) / volA;
      sbB[ek] = vB - flux * Math.min(volB, volA) / volB;
    }

    // Deep layer exchange (sill-limited)
    if (sbA.deep && sbB.deep && ex.sillDepth !== null) {
      var sillFactor = cl((ex.sillDepth - Math.min(sbA.surfaceDepth || 30, sbB.surfaceDepth || 30)) /
        Math.max(sbA.totalDepth || 100, sbB.totalDepth || 100), 0, 1);
      if (sillFactor > 0.01) {
        var deepRate = exRate * sillFactor * 0.5; // deep exchange slower than surface
        for (var dki = 0; dki < exchangeKeys.length; dki++) {
          var dk = exchangeKeys[dki];
          var dA = sbA.deep[dk] !== undefined ? sbA.deep[dk] : 0;
          var dB = sbB.deep[dk] !== undefined ? sbB.deep[dk] : 0;
          var dFlux = deepRate * (dB - dA);
          sbA.deep[dk] = dA + dFlux * Math.min(volB, volA) / volA;
          sbB.deep[dk] = dB - dFlux * Math.min(volB, volA) / volB;
        }
      }
    }
  }

  // Clamp sub-basin values
  for (var sci = 0; sci < SUB_BASIN_IDS.length; sci++) {
    var scId = SUB_BASIN_IDS[sci];
    var sc = subBasinState[scId];
    if (sc) {
      sc.DO = cl(sc.DO, 0, 14);
      sc.salinity = cl(sc.salinity, 10, 35);
      sc.nutrients = cl(sc.nutrients, 0, 50);
      if (sc.deep) {
        sc.deep.DO = cl(sc.deep.DO, 0, 12);
        sc.deep.salinity = cl(sc.deep.salinity, 15, 35);
      }
    }
  }

  return {
    state: ag,
    basins: nb,
    subBasins: subBasinState,
    exports: {
      dissolvedOxygen: ag.dissolvedOxygen, seaSurfaceTemperature: ag.sst,
      salinity: ag.salinity, nutrientConcentration: ag.nutrientConcentration,
      turbidity: ag.turbidity, pH: ag.pH, noiseStressIndex: ag.noiseIndex,
      navigationConditions: ag.navigationConditions, channelSedimentation: ag.channelSedimentation
    },
  };
}
