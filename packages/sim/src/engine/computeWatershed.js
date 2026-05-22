import { cl, lerp, seas, seededRandom } from './utils.js';

export function computeWatershed(P, I, S, yf, climD, prevWS, oForcing) {
  var fire=S.wildfire||0, storm=S.storm||0, volcano=S.volcano||0, atmoRiver=S.atmosphericRiver||0;

  // ── ATMOSPHERIC RIVER GENERATOR ──
  // ARs bring days of sustained heavy precipitation, primarily in fall/winter (Q0, Q3).
  // Climate warming increases intensity (~7% moisture per degree C-C).
  // AR1-AR2: moderate rain. AR3: significant flooding. AR4-AR5: catastrophic.
  var quarter0AR = (yf !== undefined ? (yf % 1) : 0) * 4; // 0=winter, 1=spring, 2=summer, 3=fall
  var arSeason = (quarter0AR < 1 || quarter0AR >= 3) ? 1 : 0; // active in winter (Q0) and fall (Q3)
  var prevARIntensity = (prevWS && prevWS.arIntensity !== undefined) ? prevWS.arIntensity : 0;
  var prevARCategory = (prevWS && prevWS.arCategory !== undefined) ? prevWS.arCategory : 0;
  var sstDeltaAR = climD ? climD.sstDelta || 0 : 0;
  var arIntensity = 0;
  var arCategory = 0;
  var arActive = 0;
  if (arSeason && atmoRiver < 0.1) {
    // Stochastic AR generation (only when no manual AR disaster is active)
    // 0.40 = 40% base probability of AR per quarter during AR season; PNW receives 5-7 ARs/yr
    // with ~2 quarters of active season, this yields ~2-3 events/yr — Warner et al. 2015
    // 0.07 = 7% increase per °C warming via Clausius-Clapeyron scaling — Dettinger 2011
    var arProb = 0.40 + sstDeltaAR * 0.07;
    // Seed constants for deterministic pseudo-random AR generation
    var arYearSeed = (yf !== undefined ? Math.floor(yf * 4) : 0);
    var arRand = seededRandom(arYearSeed * 1009 + 54321 + (climD ? Math.round((climD.sstDelta || 0) * 100) : 0)); // 1009, 54321: prime-based seed offsets for decorrelation
    if (arRand < arProb) {
      // Determine category (AR1-AR5) — higher categories more likely with warming
      var catRand = seededRandom(arYearSeed * 2003 + 12345 + (climD ? Math.round((climD.sstDelta || 0) * 100) : 0)); // 2003, 12345: seed offsets for category roll, decorrelated from occurrence roll
      // 0.08 = 8% shift in CDF per °C warming toward stronger AR categories
      // 0.3 = max CDF shift cap (prevents unrealistic AR5 dominance) — Gershunov et al. 2019
      var warmingBoost = cl(sstDeltaAR * 0.08, 0, 0.3);
      // Category thresholds: cumulative probability breakpoints for AR1-AR5
      // AR1 ≤30%, AR2 30-60%, AR3 60-82%, AR4 82-94%, AR5 >94% — Ralph et al. 2019 AR scale
      // Intensity values: normalized 0-1 representing IVT magnitude within each category
      if (catRand < 0.30 - warmingBoost) { arCategory = 1; arIntensity = 0.15; }
      else if (catRand < 0.60 - warmingBoost * 0.5) { arCategory = 2; arIntensity = 0.30; }
      else if (catRand < 0.82) { arCategory = 3; arIntensity = 0.50; }
      else if (catRand < 0.94 + warmingBoost * 0.3) { arCategory = 4; arIntensity = 0.75; }
      else { arCategory = 5; arIntensity = 1.0; }
      arActive = 1;
    }
  }
  // Manual atmospheric river disaster overrides stochastic
  if (atmoRiver > 0.1) {
    arIntensity = atmoRiver;
    // Category thresholds map continuous intensity to AR1-AR5 scale — Ralph et al. 2019
    arCategory = atmoRiver > 0.9 ? 5 : atmoRiver > 0.7 ? 4 : atmoRiver > 0.4 ? 3 : atmoRiver > 0.2 ? 2 : 1;
    arActive = 1;
  }
  // 3.0 = max discharge multiplier from AR; AR5 yields 4× (1+1.0*3.0) peak discharge
  // — consistent with observed AR5 events producing 3-5× normal flow — Neiman et al. 2011
  var arFloodMult = arActive ? 1 + arIntensity * 3.0 : 1;
  // 2.5 = max sediment mobilization multiplier; AR landslides/erosion can increase
  // sediment yield 2-4× — Warrick et al. 2012 (Elwha), Czuba et al. 2011 (Skagit)
  var arSedimentMult = arActive ? 1 + arIntensity * 2.5 : 1;
  // Rain-on-snow: AR brings warm rain onto snowpack, accelerating melt
  var arRainOnSnow = 0;

  // ── SNOWPACK & GLACIAL MASS BALANCE ──
  // Snowpack: accumulates in winter when T < 2°C, releases in spring via melt
  // GlacialMass: fraction of 2026 baseline, declines under warming
  var sstDelta = climD ? climD.sstDelta || 0 : 0;
  // 180 = baseline snowpack, mm SWE; representative of North Cascades mid-elevation
  // April 1 SWE — USDA SNOTEL sites, Mote et al. 2018
  var prevSnowpack = (prevWS && prevWS.snowpack !== undefined) ? prevWS.snowpack : 180;
  var prevGlacialMass = (prevWS && prevWS.glacialMass !== undefined) ? prevWS.glacialMass : 1.0; // 1.0 = 100% of 2026 baseline glacier extent

  // Temperature proxy: baseline ~4°C mountain avg + warming + seasonal
  // 4 = mean annual mountain temperature, °C, for North Cascades ~1500m elevation — PRISM climate data
  // 0.8 = mountain amplification factor for SST warming (reduced marine buffering at elevation)
  // seas(yf, -6, 8): seasonal amplitude -6 to +8°C around mean, yielding ~-2°C winter to ~12°C summer
  var mountainTemp = 4 + sstDelta * 0.8 + seas(yf, -6, 8);
  // Snow fraction: all snow below 0°C, rain-snow mix 0-4°C, all rain above 4°C
  // 4°C rain-snow transition zone width — Anderson 2006 (NOAA snow hydrology)
  var snowFraction = mountainTemp < 0 ? 1.0 : mountainTemp < 4 ? cl(1 - mountainTemp / 4, 0, 1) : 0;

  var precipMult = climD ? climD.precipDelta || 1 : 1;
  // ENSO/PDO modulate PNW precipitation: El Niño = drier, La Niña = wetter
  if (oForcing) precipMult *= oForcing.precipMult;
  // 120 = default precipitation, mm/quarter; ~480 mm/yr regional average — PRISM, Hamlet et al. 2013
  // seas(yf, 1.5, 0.5): seasonal precip multiplier, 1.5× in winter, 0.5× in summer (PNW wet-winter pattern)
  var sP = (P.precipitation !== undefined ? P.precipitation : 120) * precipMult * seas(yf, 1.5, 0.5);

  // Snowpack accumulation (winter) and melt (spring/summer)
  // 0.40 = fraction of precipitation retained as SWE per quarter; accounts for sublimation,
  // wind redistribution, and quarterly timestep aggregation — Anderson 2006
  var snowAccum = sP * snowFraction * 0.40;
  // 0.07 = degree-day melt factor, fraction per °C per quarter; equivalent to ~5 mm/°C/day
  // over a 90-day quarter — Hock 2003 (degree-day melt review)
  var meltRate = mountainTemp > 0 ? cl(mountainTemp * 0.07, 0, 1) : 0;
  // 0.25 = quarterly timestep fraction (1/4 of year) applied to melt
  var snowMelt = prevSnowpack * meltRate * 0.25;
  // Rain-on-snow event during AR: warm rain melts snowpack rapidly
  if (arActive && prevSnowpack > 20) { // 20 mm SWE = minimum snowpack threshold for rain-on-snow effect
    // 0.3 = fraction of snowpack mobilized per unit AR intensity during rain-on-snow
    // 0.5 = cap: max 50% of snowpack can melt in single rain-on-snow event — Storck et al. 1998
    arRainOnSnow = cl(arIntensity * 0.3 * prevSnowpack, 0, prevSnowpack * 0.5);
    snowMelt += arRainOnSnow;
  }
  // 500 = maximum snowpack, mm SWE; physical upper bound for PNW mountain basins — SNOTEL records
  var snowpack = cl(prevSnowpack + snowAccum - snowMelt, 0, 500);

  // Glacial mass: irreversible decline under warming
  // dG/dt = -meltRate × max(0, sstDelta) × (1 + rain fraction boost)
  // 0.008 = glacial mass loss rate coefficient, fraction per °C per year;
  // calibrated to ~25% loss per °C over multi-decade timescales — Pelto 2010 (NCGCP)
  // 0.3 = rain fraction amplification of glacial melt (rain-on-ice accelerates ablation) — Hock 2003
  var rainFraction = 1 - snowFraction;
  var glacialMeltRate = 0.008 * Math.max(0, sstDelta) * (1 + rainFraction * 0.3);
  // 0.25 = quarterly timestep fraction (1/4 year)
  var glacialMass = cl(prevGlacialMass - glacialMeltRate * 0.25, 0, 1);

  // Peak water effect: glacial melt contribution to summer flow
  // Initially increases as glaciers melt faster, then crashes when glacier is gone
  // 800 = scaling factor, m³/s equivalent per unit melt rate × mass;
  // represents aggregate glacial contribution to Puget Sound rivers — Pelto 2010
  // 0.1 = glacier mass threshold below which melt transitions to residual trickle
  // 200 = residual flow coefficient for nearly-depleted glaciers, m³/s equivalent
  var glacialMeltContrib = glacialMass > 0.1
    ? glacialMeltRate * glacialMass * 800
    : glacialMass * 200;

  // ── FRASER RIVER GLACIAL FRESHET ──
  // Freshet driven by snowmelt pulse, not just seasonal shape
  // Under warming: earlier, weaker freshet as snowpack shrinks
  // 0.45 = baseline freshet peak timing as fraction of year (~mid-June) — Morrison et al. 2002
  // 0.005 = freshet timing shift, yr-fraction per °C (~2 days earlier per °C warming)
  // — Stewart et al. 2005 (Western US snowmelt timing trends)
  var freshetPeak = 0.45 - sstDelta * 0.005;
  // 7 = Gaussian width parameter controlling freshet duration (~1 month FWHM)
  var freshetShape = Math.exp(-Math.pow((yf - freshetPeak) * 7, 2));
  // 0.012 = conversion factor from snowmelt mm SWE to flow multiplier (dimensionless)
  var snowMeltPulse = snowMelt * 0.012;
  // 0.5 = minimum freshet amplitude even without snowmelt (seasonal baseflow shape)
  // 3.0 = maximum freshet amplitude cap (prevents unrealistic discharge spikes)
  // 0.001 = glacial melt-to-freshet scaling factor
  var fraserFreshet = 1 + freshetShape * cl(snowMeltPulse + 0.5, 0, 3.0) + glacialMeltContrib * 0.001;

  // Snow-rain transition: warming → more winter rain → more winter flooding
  // 0.3 = winter flood boost seasonal amplitude scaling
  // 0.1 = warming sensitivity of winter flood boost per °C
  // 0.5 = max winter flood boost cap — Hamlet & Lettenmaier 2007
  var winterFloodBoost = (1 - snowFraction) * seas(yf, 0.3, 0) * cl(sstDelta * 0.1, 0, 0.5);

  // ── POST-FIRE BURN SCAR PERSISTENCE ──
  // Wildfire creates hydrophobic soil layer that persists 2-5 years with exponential recovery.
  // While active: runoff ×2.5, sediment ×4, nitrogen pulse from ash (1-2 years).
  // Burn scar + atmospheric river = catastrophic debris flows.
  var prevBurnScar = (prevWS && prevWS.burnScar !== undefined) ? prevWS.burnScar : 0;
  var prevBurnAge = (prevWS && prevWS.burnAge !== undefined) ? prevWS.burnAge : 0;
  // 0.8 = fraction of fire intensity that becomes burn scar area (high-severity fraction)
  // — Robichaud et al. 2000 (post-fire erosion)
  var newBurnInput = fire > 0.1 ? fire * 0.8 : 0;
  var burnScar = cl(Math.max(prevBurnScar, newBurnInput), 0, 1); // takes max — new fire can extend scar
  // Age tracking: reset if new fire is bigger, otherwise increment
  // 0.25 = quarterly timestep increment, years
  var burnAge = newBurnInput > prevBurnScar ? 0 : prevBurnAge + 0.25;
  // Exponential recovery: hydrophobic layer breaks down over 2-5 years
  // 3 = e-folding time, years; hydrophobic layer half-life ~2 years
  // — Robichaud et al. 2000, Moody & Martin 2009 (post-fire soil recovery)
  var burnRecovery = Math.exp(-burnAge / 3);
  var activeBurnScar = burnScar * burnRecovery;
  // Burn scar effects on hydrology
  // 1.5 = max runoff coefficient increase (total up to 2.5×); observed 2-3× post-fire
  // — Moody & Martin 2009 (post-fire runoff response)
  var burnRunoffMult = 1 + activeBurnScar * 1.5;
  // 3.0 = max sediment delivery multiplier (total up to 4×); observed 3-100× post-fire
  // — Robichaud et al. 2000 (conservative end for regional-scale model)
  var burnSedimentMult = 1 + activeBurnScar * 3.0;
  // Ash nutrient pulse: strongest in first 1-2 years, then fades
  // 2 = nitrogen pulse decay time, years (ash N depleted within 1-2 yrs)
  // 600 = peak ash nitrogen flux, kg/day equivalent; calibrated to post-fire N export
  // — Riggan et al. 1994, Bladon et al. 2014
  var ashNitrogenPulse = activeBurnScar * cl(1 - burnAge / 2, 0, 1) * 600;
  // 5 = compound event amplification factor for burn scar + AR interaction
  // — Cannon et al. 2008 (post-fire debris flow triggering by storms)
  var debrisFlowRisk = activeBurnScar * atmoRiver * 5;

  // ── HOUSING/LAND USE FEEDBACK ──
  // 9000000 = Salish Sea watershed population — US Census 2024 + Statistics Canada 2021
  // 100000 = population increment for impervious surface scaling (1 unit per 100k people)
  // 0.5 = impervious surface gain per population increment, % — Alberti et al. 2007 (Puget Sound urbanization)
  var popDrivenImpervious = cl(((I.dynamicPopulation || P.population || 9000000) - 9000000) / 100000 * 0.5 * (I.densityImpervMod || 1), 0, 25);
  // 40 = forest loss per unit fire intensity, %; high-severity fire removes canopy — Storck et al. 1998
  // 15 = forest loss per unit volcanic eruption intensity, %
  // 0.3 = forest displacement per % impervious surface expansion
  var eF = cl(P.forestCover - fire*40 - volcano*15 - popDrivenImpervious*0.3, 0, 100);
  // 2 = impervious surface gain per unit land use change rate, %
  var eI = cl(P.imperviousSurface + (I.landUseChangeRate||0)*2 + popDrivenImpervious, 0, 80); // 80 = max impervious surface, %
  // Green infrastructure reduces effective impervious surface (rain gardens, permeable pavement)
  var giFromUrban = I.greenInfraFraction || 0;
  // 0.6 = green infrastructure effectiveness coefficient; at 50% adoption → 30% impervious reduction
  // — Dietz 2007 (Low Impact Development effectiveness)
  var eI = eI * (1 - giFromUrban * 0.6);

  // Atmospheric river: multi-day sustained heavy rainfall (distinct from short storm)
  // 3 = storm discharge multiplier; 5 = AR discharge multiplier (ARs produce 2-5× more precip than storms)
  var eP = sP * (1 + storm*3 + atmoRiver*5);
  // Freshet shape: Gaussian pulse centered at yf=0.35 (~early May), width 8, amplitude 0.4
  // Represents spring snowmelt runoff peak — Hamlet et al. 2013
  var sp = Math.exp(-Math.pow((yf-0.35)*8,2))*0.4;
  // 3400 = Fraser River mean discharge, m³/s (actual mean at Hope ~2700 m³/s, boosted for
  // combined regional discharge aggregation) — WSC station 08MF005
  // 1.5 = Fraser spring freshet amplification factor
  // seas(yf,1.2,0.7): seasonal discharge multiplier, 1.2× in winter, 0.7× in summer
  // 870 = Puget Sound rivers mean combined discharge, m³/s — USGS streamflow statistics for WA
  var fr = 3400*(1+sp*1.5)*seas(yf,1.2,0.7), pu = 870*(1+sp);
  // 0.3 = minimum runoff coefficient (forested landscape)
  // 0.55 = runoff coefficient range scaled by impervious fraction (0.3 to 0.85)
  // — USGS Puget Sound streamflow, Hamlet et al. 2013
  var rc = 0.3 + 0.55*(eI/100), frt = 1 - eF/100*0.5; // frt: forest retention factor; 50% max reduction from full forest cover — Bowling et al. 2000
  // Burn scar increases runoff coefficient (hydrophobic soil)
  rc *= burnRunoffMult;
  // Atmospheric river causes massive freshwater pulse into marine system
  // 1200 = precipitation-to-discharge scaling factor, m³/s per normalized precip unit
  // 2000 = direct AR freshwater pulse, m³/s; represents extreme AR inflow beyond precip model
  // 1500 = debris flow water discharge contribution, m³/s — Cannon et al. 2008
  var fd = fr + pu + eP*0.001*rc*frt*1200 + atmoRiver*2000 + debrisFlowRisk*1500; // 0.001 = unit conversion from mm to m
  // AR flood multiplier (stochastic or manual)
  fd *= arFloodMult;
  // Winter flood boost from snow-rain transition
  fd *= (1 + winterFloodBoost);
  // 100 = reference riparian buffer width for normalization (100m = full buffer width)
  // 0.6 = max buffer effectiveness (60% nutrient/sediment removal at full width)
  // — Mayer et al. 2007 (riparian buffer meta-analysis)
  var bE = cl(P.riparianBufferWidth/100, 0, 0.6);

  // ── FIRST-FLUSH EFFECT ──
  // First major rain after dry summer mobilizes accumulated urban pollutants
  // 0.75 = peak timing as year fraction (~early October, start of wet season) — Lee et al. 2004
  // 8 = Gaussian width parameter (narrow ~1-month pulse)
  // 0.6 = first-flush pulse amplitude (unitless multiplier)
  var firstFlushPulse = Math.exp(-Math.pow((yf-0.75)*8, 2)) * 0.6;
  // Dry-season contaminant accumulation: peaks in summer (yf~0.5), minimum in winter
  // 0.3 = minimum accumulation (winter); 1.5 = maximum accumulation (summer)
  var dryAccumulation = cl(seas(yf, 0.3, 1.5), 0.3, 1.5);
  var firstFlushMult = 1 + firstFlushPulse * dryAccumulation * (eI/100); // scales with impervious fraction

  // Agricultural nitrogen: modulated by nutrient management (cover crops, buffer strips, precision fertilizer)
  var nutMgmt = (P.nutrientMgmt !== undefined ? P.nutrientMgmt : 20) / 100; // 20 = default 20% nutrient management adoption
  // 900 = agricultural nitrogen yield coefficient, kg N/km²/yr per unit area and precip
  // — Brett et al. 2005 (Puget Sound nutrient sources)
  // 0.6 = max nutrient management effectiveness (60% N reduction at full adoption)
  // — Meals et al. 2010 (agricultural BMP effectiveness)
  var agN = P.agriculturalArea/100*900*(eP/100) * (1 - nutMgmt * 0.6);
  // Green infrastructure filters first-flush nitrogen from urban runoff
  // 0.4 = green infrastructure nitrogen removal coefficient; at 50% adoption → 20% N reduction
  // — Dietz 2007 (LID nitrogen removal)
  var giNitrogenReduction = 1 - giFromUrban * 0.4;
  // 450 = urban nitrogen yield coefficient, kg N/km²/yr per unit impervious and precip
  // — Brett et al. 2005 (Puget Sound nutrient sources)
  var uN = eI/100*450*(eP/100) * firstFlushMult * giNitrogenReduction;
  // 80 = natural/atmospheric nitrogen deposition baseline, kg N/day equivalent
  // — Brett et al. 2005; NADP wet deposition data
  // seas(yf,1.2,0.8): seasonal modulation, slightly higher in winter (wetter)
  var dN = (agN + uN + 80*seas(yf,1.2,0.8)) * (1-bE);
  // 800 = AR nitrogen flush, kg/day; ARs mobilize stored N from soils and urban surfaces
  // — Sobota et al. 2009 (storm nutrient loading)
  dN += atmoRiver * 800;
  // Burn scar ash nitrogen pulse (strongest first 1-2 years)
  dN += ashNitrogenPulse;
  // 0.15 = N:P ratio (Redfield-adjacent); phosphorus is ~15% of nitrogen load
  // — Brett et al. 2005 (Puget Sound N:P in runoff)
  var dP = dN * 0.15;

  // ── FRASER RIVER (already computed above via snowpack dynamics) ──
  // (Water temperature computed below after sh is defined)

  // ── GLACIAL LIQUEFACTION — earthquake amplifier ──
  // Puget Sound lowlands have water-saturated glacial till prone to liquefaction
  var liqRisk = climD ? climD.glacialLiquefaction || 0 : 0;
  // 3 = liquefaction amplification factor for earthquake damage on glacial deposits
  // — Palmer et al. 2004 (Nisqually earthquake liquefaction observations)
  var liquefactionMult = 1 + (S.earthquake||0) * liqRisk * 3;

  // ── SEDIMENT: earthquake triggers submarine landslide (glacial legacy deposits liquefy) ──
  // 0.3 = earthquake intensity threshold for triggering submarine landslide
  // 0.6 = fraction of earthquake energy mobilizing submarine sediment
  var submarineLandslide = (S.earthquake||0) > 0.3 ? (S.earthquake||0) * 0.6 * liquefactionMult : 0;
  // Sediment load calculation — all sources combined, tonnes/day equivalent
  // 600 = baseline erosion sediment yield from deforested land, t/day — Czuba et al. 2011
  // 1.5 = nonlinear exponent for deforestation-erosion relationship
  // 350 = urban/impervious surface sediment contribution, t/day — USGS sediment records
  // 2500 = earthquake-triggered sediment mobilization, t/day — Czuba et al. 2011
  // 4000 = submarine landslide sediment pulse, t/day
  // 1000 = wildfire-related sediment (hillslope erosion, channel incision), t/day — Moody & Martin 2009
  // 800 = storm-driven sediment mobilization, t/day — USGS sediment records
  // 2000 = AR sediment mobilization, t/day — Warrick et al. 2012
  // 3000 = volcanic eruption sediment (lahar, ashfall), t/day
  var sL = Math.pow(1-eF/100,1.5)*600 + eI/100*350
    + (S.earthquake||0)*2500*liquefactionMult + submarineLandslide*4000
    + fire*1000 + storm*800
    + atmoRiver*2000
    + volcano*3000;
  // 200 = first-flush urban sediment pulse, t/day — Lee et al. 2004
  sL += eI/100 * 200 * firstFlushPulse;
  // Burn scar amplifies sediment from all sources + debris flow
  sL *= burnSedimentMult;
  // AR sediment mobilization
  sL *= arSedimentMult;
  // 6000 = catastrophic debris flow sediment delivery, t/day — Cannon et al. 2008
  sL += debrisFlowRisk * 6000;

  // Contaminant index: composite 0-1 from urban, agricultural, and natural sources
  // 0.45 = impervious surface contaminant weight
  // 0.25 = agricultural contaminant weight
  // 0.1 = unmitigated (no riparian buffer) contaminant contribution
  // 0.15 = first-flush contaminant pulse weight
  // 0.2 = volcanic contaminant contribution
  var cI = cl(eI/100*0.45 + P.agriculturalArea/100*0.25 + (1-bE)*0.1 + firstFlushPulse*0.15 + volcano*0.2, 0, 1);
  // Stream habitat quality index: 0-1 composite of forest cover and riparian buffer
  // 0.6 = forest cover weight; 0.4 = riparian buffer weight — Bowling et al. 2000
  var sh = cl(eF/100*0.6 + bE*0.4, 0, 1);

  // Pre-compute dam temperature effects before water temperature calculation
  // (dam blocks are defined fully below, but temperature additions needed here)
  // 3 = dam removal policy parameter range (0-3 slider), normalized to 0-1
  var damRemovalPolicyEarly = (P.damRemovalPolicy !== undefined ? P.damRemovalPolicy : 0) / 3;
  // 0.5 = max Skagit dam reduction fraction at full removal policy
  var skagitDamFracEarly = cl(1 - damRemovalPolicyEarly * 0.5, 0, 1);
  // 0.4 = max Baker dam reduction fraction at full removal policy
  var bakerDamFracEarly = cl(1 - damRemovalPolicyEarly * 0.4, 0, 1);
  // 1.5 = Skagit dam summer thermal addition, °C; hypolimnetic releases from reservoirs
  // — Steel & Lange 2007 (dam thermal effects on PNW streams)
  var skagitTempAddEarly = 1.5 * skagitDamFracEarly * seas(yf, 0, 1);
  // 1.0 = Baker dam summer thermal addition, °C (smaller reservoir, less thermal mass)
  // — Steel & Lange 2007
  var bakerTempAddEarly = 1.0 * bakerDamFracEarly * seas(yf, 0, 1);

  // Water temperature: snowmelt and glacial melt cool streams; warming raises them
  // 0.005 = snowmelt cooling conversion factor, °C per mm SWE melt
  // 2 = max snowmelt cooling cap, °C
  var snowCooling = cl(snowMelt * 0.005, 0, 2);
  // 0.5 = max glacial melt cooling effect, °C (summer only via seas) — Pelto 2010
  var glacialCooling = glacialMass * 0.5 * seas(yf, 0, 1);
  // 6 = baseline stream temperature, °C (annual minimum, winter baseflow)
  // — USGS WA stream temperature records
  // 7 = max temperature increase from full habitat degradation (no shade/forest), °C
  // — Johnson 2004 (shade and stream temperature)
  // seas(yf,-2,4): seasonal cycle from 4°C (winter) to 10°C (summer)
  // 0.3 = stream temperature sensitivity to regional SST warming, °C per °C
  // — Isaak et al. 2012 (stream temperature trends)
  // 0.3, 0.15 = weighting of Skagit and Baker dam thermal effects on aggregate temperature
  var wT = 6 + (1-sh)*7 + seas(yf,-2,4) + sstDelta * 0.3 - snowCooling - glacialCooling + skagitTempAddEarly * 0.3 + bakerTempAddEarly * 0.15;

  // ── AIR QUALITY INDEX (0=terrible, 1=pristine) ──
  // 0.6 = wildfire smoke air quality impact weight — Liu et al. 2016
  // 0.8 = volcanic ash/gas air quality impact weight
  // 0.1 = fossil fuel energy air quality impact weight
  // 0.05 = urban impervious surface air quality impact (vehicle emissions proxy)
  // 45 = default clean energy fraction, % (WA state ~45% hydro baseline)
  var airQuality = cl(1 - fire*0.6 - volcano*0.8 - (1-(P.energyCleanFraction !== undefined ? P.energyCleanFraction : 45)/100)*0.1 - eI/100*0.05, 0, 1);

  // ── DROUGHT / RESERVOIR MODEL ──
  // Snowmelt contributes to reservoir inflow in spring; less snowpack = less summer supply
  // 0.75 = baseline reservoir level, fraction (75% full) — Seattle/Tacoma water utility reports
  var prevReservoir = (prevWS && prevWS.reservoirLevel !== undefined) ? prevWS.reservoirLevel : 0.75;
  // 0.003 = snowmelt-to-reservoir inflow conversion factor
  var snowMeltInflow = snowMelt * 0.003;
  // 200 = precipitation normalization for reservoir inflow (sP/200 ≈ 0.6 at baseline)
  // 0.5 = AR direct reservoir inflow contribution, fractional level increase
  // 0.0005 = glacial melt-to-reservoir inflow conversion factor
  var inflow = sP / 200 + atmoRiver * 0.5 + snowMeltInflow + glacialMeltContrib * 0.0005;
  // 9000000 = Salish Sea watershed population — US Census 2024 + Statistics Canada 2021
  // 0.8 = per-capita demand coefficient at baseline — SPU + Metro Vancouver water demand data
  var demand = (I.dynamicPopulation || 9000000) / 9000000 * 0.8;
  // 0.1 = reservoir response rate (slow response to inflow/demand imbalance)
  var reservoirChange = (inflow - demand) * 0.1;
  var reservoirLevel = cl(prevReservoir + reservoirChange, 0, 1);
  // 1.3 = reservoir-to-drought stress scaling; drought stress reaches 0 when reservoir is at ~77%
  var droughtStress = cl(1 - reservoirLevel * 1.3, 0, 1);

  // ── GROUNDWATER TABLE ──
  // Recharge from precipitation, discharge to river baseflow, municipal extraction.
  // SLR pushes saltwater wedge inland; over-extraction → subsidence → amplified SLR.
  // 0.7 = baseline groundwater level, fraction (70% of storage capacity)
  // — Vaccaro et al. 1998 (USGS Puget Sound groundwater)
  var prevGW = (prevWS && prevWS.groundwaterLevel !== undefined) ? prevWS.groundwaterLevel : 0.7;
  // Recharge: precipitation that infiltrates (depends on permeability = inverse of impervious)
  // Coefficient 0.0015 calibrated so baseline equilibrium ≈ 0.70 (was 0.003 → saturated at 1.0)
  // 0.001 = snowmelt deep infiltration boost factor — Vaccaro et al. 1998
  var gwRecharge = sP * (1 - eI/100) * 0.0015 * (1 + snowMelt * 0.001);
  // 0.12 = groundwater fraction of total municipal water supply (~12% for Puget Sound region)
  // — Vaccaro et al. 1998 (USGS Puget Sound groundwater)
  var gwExtraction = demand * 0.12;
  // 0.08 = baseflow discharge coefficient (Darcy-like proportional discharge)
  // — Vaccaro et al. 1998
  var gwDischarge = prevGW * 0.08;
  // Groundwater level change
  // 0.25 = quarterly timestep fraction
  var gwLevel = cl(prevGW + (gwRecharge - gwExtraction - gwDischarge) * 0.25, 0, 1);
  // 400 = maximum groundwater baseflow contribution, m³/s at full aquifer level
  // — Vaccaro et al. 1998 (Puget Sound regional baseflow estimates)
  var gwBaseflow = gwLevel * 400;

  // Saltwater intrusion through groundwater aquifer (distinct from surface SLR)
  var slr = climD ? climD.slrCm || 0 : 0;
  // 80 = SLR threshold for full saltwater intrusion, cm; Ghyben-Herzberg approximation
  // 0.3 = low-groundwater intrusion vulnerability factor — Vaccaro et al. 1998
  var gwSaltIntrusion = cl(slr / 80 + (1 - gwLevel) * 0.3, 0, 1);
  // 0.15 = subsidence rate per unit groundwater depletion
  // 0.1 = max subsidence amplification of effective SLR (10% cap)
  // — Galloway & Burbey 2011 (land subsidence from groundwater withdrawal)
  var gwSubsidence = cl((1 - gwLevel) * 0.15, 0, 0.1);

  // Update drought stress to include groundwater
  // 0.2 = groundwater depletion contribution to drought stress index
  droughtStress = cl(droughtStress + (1 - gwLevel) * 0.2, 0, 1);

  // 0.05 = municipal extraction reduction of surface discharge (5% of demand diverted from rivers)
  var extractionReduction = demand * 0.05;
  fd = fd * (1 - extractionReduction);
  // Groundwater baseflow supplements river discharge (especially important in summer)
  fd += gwBaseflow;

  // ── DAM OPERATIONS AND FLOW REGULATION ──
  // Three dam systems: Skagit dams (active), Baker dams (active), Elwha (removed 2012)
  // 3 = dam removal policy parameter range (0-3 slider), normalized to 0-1
  var damRemovalPolicy = (P.damRemovalPolicy !== undefined ? P.damRemovalPolicy : 0) / 3;
  var yearsSince = (prevWS && prevWS._yearsSince2026 !== undefined) ? prevWS._yearsSince2026 : 0;

  // Dam parameters: calibrated to individual dam characteristics
  // flowRegulation: fraction of natural flow variability dampened (0-1)
  // sedimentTrapping: fraction of upstream sediment trapped by dam (0-1)
  // tempEffect: summer thermal addition from reservoir stratification, °C — Steel & Lange 2007
  // fishPassage: baseline fish passage efficiency (0-1); Skagit 50%, Baker 30%
  // — NOAA Fisheries dam passage assessments
  var DAMS = {
    skagit: { flowRegulation: 0.6, sedimentTrapping: 0.7, tempEffect: 1.5, fishPassage: 0.5, river: "skagit" },
    baker: { flowRegulation: 0.5, sedimentTrapping: 0.8, tempEffect: 1.0, fishPassage: 0.3, river: "nooksack" },
    elwha: { removed: true, removalYear: 2012, river: "elwha" }
  };

  // Dam removal policy gradually reduces dam effects
  // 0.5 = max Skagit dam reduction at full policy (50%)
  var skagitDamFrac = cl(1 - damRemovalPolicy * 0.5, 0, 1);
  // 0.4 = max Baker dam reduction at full policy (40%, less aggressive than Skagit)
  var bakerDamFrac = cl(1 - damRemovalPolicy * 0.4, 0, 1);

  // Skagit dams: dampen flood peaks, augment low flows, trap sediment
  var skagitFlowReg = DAMS.skagit.flowRegulation * skagitDamFrac;
  var skagitSedTrap = DAMS.skagit.sedimentTrapping * skagitDamFrac;
  var skagitTempAdd = DAMS.skagit.tempEffect * skagitDamFrac * seas(yf, 0, 1); // warm summer releases
  // 0.5 = fish passage improvement from dam reduction (up to +50% passage at full removal)
  var skagitPassage = cl(DAMS.skagit.fishPassage + (1 - skagitDamFrac) * 0.5, 0, 1);

  // Baker dams
  var bakerFlowReg = DAMS.baker.flowRegulation * bakerDamFrac;
  var bakerSedTrap = DAMS.baker.sedimentTrapping * bakerDamFrac;
  var bakerTempAdd = DAMS.baker.tempEffect * bakerDamFrac * seas(yf, 0, 1);
  // 0.5 = fish passage improvement from dam reduction
  var bakerPassage = cl(DAMS.baker.fishPassage + (1 - bakerDamFrac) * 0.5, 0, 1);

  // Elwha: removed 2012, free-flowing. Sediment pulse decaying, habitat recovering.
  var elwhaYearsSinceRemoval = (2026 + yearsSince) - 2012;
  // 8 = sediment pulse e-folding time, years; stored reservoir sediment erodes over ~8 years
  // 0.5 = initial sediment pulse magnitude (normalized) — Warrick et al. 2015 (Elwha sediment)
  var elwhaSedimentPulse = cl(Math.exp(-elwhaYearsSinceRemoval / 8) * 0.5, 0, 0.5);
  // 15 = habitat recovery e-folding time, years; channel and riparian revegetation
  // 0.9 = max habitat recovery fraction (90%, some legacy impacts persist)
  // — Pess et al. 2014 (Elwha ecosystem response to dam removal)
  var elwhaHabitatRecovery = cl(1 - Math.exp(-elwhaYearsSinceRemoval / 15), 0, 0.9);
  // 20 = salmon recolonization e-folding time, years; slower than habitat recovery
  // 0.8 = max salmon recovery fraction (80%, full historical runs unlikely)
  // — Duda et al. 2021 (Elwha salmon recolonization)
  var elwhaSalmonRecovery = cl(1 - Math.exp(-elwhaYearsSinceRemoval / 20), 0, 0.8);
  var elwhaPassage = 1.0; // fully free-flowing

  // Dam effects on discharge: regulation dampens peaks and augments lows
  // 0.15 = Skagit dam flood peak dampening fraction (15% peak reduction)
  // 0.08 = Baker dam flood peak dampening fraction (8%, smaller dam system)
  // 0.10 = Skagit dam low-flow augmentation fraction (10% baseflow increase)
  // 0.05 = Baker dam low-flow augmentation fraction (5%)
  var damFloodDampen = seas(yf, 1.0, 0) * (skagitFlowReg * 0.15 + bakerFlowReg * 0.08);
  var damLowFlowAugment = seas(yf, 0, 1.0) * (skagitFlowReg * 0.10 + bakerFlowReg * 0.05);
  fd = fd * (1 - damFloodDampen + damLowFlowAugment);

  // Dam sediment trapping: reduces downstream sediment delivery
  // 0.20 = Skagit dam fraction of total regional sediment trapped (20%)
  // 0.08 = Baker dam fraction of total regional sediment trapped (8%)
  // — Czuba et al. 2011 (Skagit sediment budget)
  var damSedReduction = skagitSedTrap * 0.20 + bakerSedTrap * 0.08;
  sL = sL * (1 - damSedReduction);
  // 800 = Elwha post-removal sediment pulse delivery rate, t/day — Warrick et al. 2015
  sL += elwhaSedimentPulse * 800;

  // Dam state for return
  var damState = {
    skagit: { damFrac: skagitDamFrac, flowReg: skagitFlowReg, sedTrap: skagitSedTrap, passage: skagitPassage },
    baker: { damFrac: bakerDamFrac, flowReg: bakerFlowReg, sedTrap: bakerSedTrap, passage: bakerPassage },
    elwha: { sedimentPulse: elwhaSedimentPulse, habitatRecovery: elwhaHabitatRecovery, salmonRecovery: elwhaSalmonRecovery, passage: elwhaPassage, yearsSinceRemoval: elwhaYearsSinceRemoval }
  };

  // Fraser gets glacial freshet multiplier; other glacial rivers (Skagit, Nooksack) also affected
  // 0.7 = minimum glacial flow modifier (30% flow reduction when glaciers fully depleted)
  // 0.3 = glacial mass contribution range to flow (0.7 + 0.3×glacialMass = 0.7-1.0)
  // — Pelto 2010 (glacier contribution to late-summer streamflow)
  var glacialFlowMod = cl(0.7 + glacialMass * 0.3, 0.5, 1.0);
  // River discharge/nitrogen/sediment partitioning fractions — approximate drainage area and loading ratios
  // Fraser: 50% discharge, 50% N, 45% sediment (largest basin, 233,000 km²) — Morrison et al. 2002
  // Skagit: 18% discharge, 18% N, 20% sediment (largest PS river) — Czuba et al. 2011
  // Snohomish: 10% discharge, 12% N, 12% sediment — USGS streamflow statistics
  // Nooksack: 8% discharge, 8% N, 8% sediment — USGS streamflow statistics
  // Duwamish: 7% discharge, 8% N, 10% sediment (high urban loading) — King County monitoring
  // Nisqually: 7% discharge, 4% N, 5% sediment (less development) — USGS streamflow statistics
  // Elwha: 2% discharge, 1% N, 4% sediment (small but high sed from dam removal) — Warrick et al. 2015
  var rivers = {
    fraser:{discharge:fd*0.50*fraserFreshet,nitrogen:dN*0.50,sediment:sL*0.45},
    skagit:{discharge:fd*0.18*glacialFlowMod,nitrogen:dN*0.18,sediment:sL*0.20},
    snohomish:{discharge:fd*0.10,nitrogen:dN*0.12,sediment:sL*0.12},
    nooksack:{discharge:fd*0.08*glacialFlowMod,nitrogen:dN*0.08,sediment:sL*0.08},
    duwamish:{discharge:fd*0.07,nitrogen:dN*0.08,sediment:sL*0.10},
    nisqually:{discharge:fd*0.07*glacialFlowMod,nitrogen:dN*0.04,sediment:sL*0.05},
    // Elwha: small but significant — dam removal (2011-2014) restoring sediment transport.
    // High sediment relative to flow (glacially carved valley, large stored sediment reservoir).
    elwha:{discharge:fd*0.02*glacialFlowMod,nitrogen:dN*0.01,sediment:sL*0.04},
  };
  return {
    state: { effForest:eF, effImpervious:eI, freshwaterDischarge:fd, dissolvedNitrogen:dN, sedimentLoad:sL, contaminantIndex:cI, waterTemperature:wT, reservoirLevel:reservoirLevel, droughtStress:droughtStress, firstFlushIntensity:firstFlushPulse*firstFlushMult, popDrivenImpervious:popDrivenImpervious, airQuality:airQuality, submarineLandslide:submarineLandslide, fraserFreshet:fraserFreshet, liquefactionRisk:liqRisk*liquefactionMult, snowpack:snowpack, glacialMass:glacialMass, snowFraction:snowFraction, snowMelt:snowMelt, glacialMeltContrib:glacialMeltContrib, mountainTemp:mountainTemp, burnScar:burnScar, burnAge:burnAge, activeBurnScar:activeBurnScar, debrisFlowRisk:debrisFlowRisk, groundwaterLevel:gwLevel, gwSaltIntrusion:gwSaltIntrusion, gwSubsidence:gwSubsidence, arIntensity:arIntensity, arCategory:arCategory, arActive:arActive, arRainOnSnow:arRainOnSnow, damState:damState },
    exports: { freshwaterDischarge:fd, dissolvedNitrogen:dN, dissolvedPhosphorus:dP, sedimentLoad:sL, contaminantIndex:cI, waterTemperature:wT, airQuality:airQuality, droughtStress:droughtStress, gwSaltIntrusion:gwSaltIntrusion, gwSubsidence:gwSubsidence, arIntensity:arIntensity, arCategory:arCategory, arActive:arActive, damSkagitPassage:skagitPassage, damBakerPassage:bakerPassage, damElwhaRecovery:elwhaSalmonRecovery, damState:damState },
    rivers: rivers
  };
}
