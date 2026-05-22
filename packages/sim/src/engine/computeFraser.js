// ═══════════════════════════════════════════════════════════
// computeFraser.js — Fraser River Basin Hydrological Model
// ═══════════════════════════════════════════════════════════
// Fraser River: 233,000 km² basin, mean discharge 2,700 m³/s at Hope,
// largest undammed river on Pacific coast of southern BC.
// Dominant freshwater input to Georgia Strait (~50% of total Salish Sea inflow).
//
// Model structure: 3-band snowpack, glacier mass balance, Nechako diversion,
// freshet timing/magnitude, groundwater baseflow, routing delay,
// pine beetle legacy, wildfire, mining, forestry, agriculture, urbanization,
// integrated water quality.
//
// Key references:
//   Morrison et al. 2002 — Fraser River flow trends
//   Shrestha et al. 2012 — climate change impacts on Fraser hydrology
//   Clarke et al. 2015 — glacier retreat projections for western Canada
//   Stewart et al. 2005 — changes in snowmelt timing across western NA
//   Bolch et al. 2010 — glacier mass balance in BC
//   Déry et al. 2012 — Fraser River freshwater discharge trends
//   Ferrari et al. 2007 — Nechako River diversion effects
//   Wei & Zhang 2010 — pine beetle hydrological effects
//   Winkler et al. 2014 — forest disturbance and streamflow in BC
//   Flannigan et al. 2009 — wildfire and climate change in Canada
//   Shakesby & Doerr 2006 — post-fire hydrology and erosion
//   Petticrew et al. 2015 — Quesnel Lake / Mount Polley tailings failure
//
// ES5 convention (var, function) — matches engine convention.
// ═══════════════════════════════════════════════════════════

import { cl, seasonalPeak, seededRandom } from './utils.js';

export function computeFraser(P, prev, shocks, quarter, year, climD, coupling) {
  // ── UNPACK PARAMETERS ──
  // P contains Fraser-specific params; will come from config when wired
  var sstDelta = climD ? (climD.sstDelta !== undefined ? climD.sstDelta : 0) : 0;
  var precipDelta = climD ? (climD.precipDelta !== undefined ? climD.precipDelta : 1) : 1;

  // Nechako diversion: 0=full diversion (status quo), 100=dam removed (full natural flow)
  var nechakoDiversionFrac = P.nechakoDiversionFrac !== undefined ? P.nechakoDiversionFrac : 0;
  var nechakoRestored = nechakoDiversionFrac / 100; // 0=diverted, 1=restored

  // Land disturbance parameters
  var pineBeetleSeverity = (P.pineBeetleSeverity !== undefined ? P.pineBeetleSeverity : 60) / 100; // 60% default (peak epidemic)
  var fireSuppressionEffort = (P.fireSuppressionEffort !== undefined ? P.fireSuppressionEffort : 50) / 100;
  var miningIntensity = (P.miningIntensity !== undefined ? P.miningIntensity : 30) / 100;
  var forestryIntensity = (P.forestryIntensity !== undefined ? P.forestryIntensity : 40) / 100;
  var fraserAgIntensity = (P.fraserAgIntensity !== undefined ? P.fraserAgIntensity : 50) / 100;
  var fraserUrbanization = (P.fraserUrbanization !== undefined ? P.fraserUrbanization : 60) / 100;

  // Disaster shocks
  var fire = shocks.wildfire || 0;
  var atmoRiver = shocks.atmosphericRiver || 0;
  var volcano = shocks.volcano || 0;
  var earthquake = shocks.earthquake || 0;
  var heatDome = shocks.heatDome || 0;

  // Years since simulation start (used in pine beetle, fire models)
  var yearsSince2026 = year - 2026;

  // ── PREVIOUS STATE ──
  var _prev = prev || {};
  var prevSnowLow = _prev.snowLow !== undefined ? _prev.snowLow : 20;     // mm SWE
  var prevSnowMid = _prev.snowMid !== undefined ? _prev.snowMid : 280;    // mm SWE
  var prevSnowHigh = _prev.snowHigh !== undefined ? _prev.snowHigh : 520;  // mm SWE
  var prevGlacierMass = _prev.glacierMass !== undefined ? _prev.glacierMass : 1.0; // fraction of 2000 baseline
  var prevGWLevel = _prev.groundwaterLevel !== undefined ? _prev.groundwaterLevel : 0.7; // 0-1
  var prevRoutedFlow = _prev.routedFlow !== undefined ? _prev.routedFlow : 2700; // m³/s (routing lag buffer)
  var prevBurnScar = _prev.burnScar !== undefined ? _prev.burnScar : 0; // fraction of mid-elevation area burned
  var prevBurnAge = _prev.burnAge !== undefined ? _prev.burnAge : 0; // quarters since last major fire
  var prevTailingsContam = _prev.tailingsContam !== undefined ? _prev.tailingsContam : 0; // tailings failure decay

  // ═══════════════════════════════════════════════════════════
  // 1. ELEVATION-BAND SNOWPACK MODEL
  // ═══════════════════════════════════════════════════════════
  // Three bands represent Fraser Basin's hypsometry:
  //   Low  (<1000m): ~35% of basin area, Fraser Valley / Thompson lowlands
  //   Mid  (1000-2000m): ~40% of basin area, Interior Plateau, pine beetle zone
  //   High (>2000m): ~25% of basin area, Rockies, Cariboo, Coast Mountains
  //
  // Temperature at each band (lapse rate ~6.5°C/km, Shrestha et al. 2012):
  //   Valley baseline ~8°C mean annual, seasonal range ±12°C
  //   Mid baseline ~3°C, seasonal range ±10°C
  //   High baseline ~-3°C, seasonal range ±8°C
  // Climate warming applies uniformly (amplified at high elevation by ~20%, Pepin et al. 2015)

  // Seasonal temperature by band (quarter: 0=winter, 1=spring, 2=summer, 3=fall)
  var seasonalTemp = [
    [-4, 8, 18, 6],   // Low band: winter→summer
    [-8, 2, 12, 1],   // Mid band
    [-14, -4, 6, -5],  // High band
  ];

  var tLow = seasonalTemp[0][quarter] + sstDelta;
  var tMid = seasonalTemp[1][quarter] + sstDelta * 1.1; // slightly amplified
  var tHigh = seasonalTemp[2][quarter] + sstDelta * 1.2; // elevation-dependent amplification (Pepin et al. 2015)

  // Basin-average precipitation (mm/quarter)
  // Fraser Basin: ~600mm/yr mean, winter-wet pattern
  // Seasonal distribution: winter 35%, spring 20%, summer 15%, fall 30%
  var seasonalPrecip = [210, 120, 90, 180]; // mm per quarter at baseline
  var basePrecip = seasonalPrecip[quarter] * precipDelta;

  // AR events increase precipitation (Fraser Basin ARs: Neiman et al. 2008)
  // Basin-average AR precip boost: ARs dump extreme precip on 5-15% of the 233,000 km²
  // basin (typically windward slopes of Coast/Cascade ranges). Previous value (2.0×)
  // over-predicted because it treated the entire basin as receiving AR-scale precip.
  // Basin-average boost is ~40-60% above normal quarterly precip during an AR quarter.
  var arPrecipBoost = atmoRiver > 0.1 ? basePrecip * atmoRiver * 0.6 : 0;
  var totalPrecip = basePrecip + arPrecipBoost;

  // Volcanic ashfall reduces effective precipitation (interception)
  totalPrecip = totalPrecip * (1 - volcano * 0.3);

  // ── SNOW ACCUMULATION & MELT PER BAND ──

  // Low band (<1000m): rain-dominant; snow only when T < 2°C
  // Rain/snow partition (Kienzle 2008): linear transition 0-4°C
  var snowFracLow = tLow < 0 ? 1.0 : tLow < 4 ? cl(1 - tLow / 4, 0, 1) : 0;
  var accumLow = totalPrecip * 0.35 * snowFracLow; // 35% of basin precip falls in low band
  // Degree-day melt: ~4 mm SWE per degree-day above 0°C (Hock 2003)
  var meltDaysLow = tLow > 0 ? tLow * 91.25 : 0; // degree-days per quarter (91.25 days)
  var meltRateLow = 4; // mm SWE per degree-day
  var meltLow = cl(meltRateLow * meltDaysLow / 91.25, 0, prevSnowLow + accumLow); // can't melt more than exists
  // Rain-on-snow: AR events on existing snowpack cause rapid melt (Marks et al. 1998)
  var rosLow = (atmoRiver > 0.2 && prevSnowLow > 10) ? cl(atmoRiver * prevSnowLow * 0.4, 0, prevSnowLow * 0.5) : 0;
  var snowLow = cl(prevSnowLow + accumLow - meltLow - rosLow, 0, 200);

  // Mid band (1000-2000m): mixed rain/snow, critical transition zone
  // Warming pushes rain/snow line upward — this is the most climate-sensitive band
  var snowFracMid = tMid < -2 ? 1.0 : tMid < 2 ? cl(1 - (tMid + 2) / 4, 0, 1) : 0;

  // ── PINE BEETLE EFFECT ON MID-BAND SNOWPACK ──
  // Dead canopy intercepts less snow → more reaches ground (Wei & Zhang 2010)
  // Peak hydrological impact ~2010-2020 (15-25 years after epidemic onset ~2000)
  // Recovery over 40-60 years as forest regrows (Winkler et al. 2014)
  var beetleYears = cl(yearsSince2026 + 20, 0, 80); // years since epidemic onset (~2005)
  var beetlePeakYears = 15; // peak effect ~15 years after onset
  var beetleRecoveryHalf = 50; // ~50 years to half recovery
  // Rise to peak, then exponential decay: piecewise
  var pineBeetleEffect;
  if (beetleYears < beetlePeakYears) {
    pineBeetleEffect = pineBeetleSeverity * cl(beetleYears / beetlePeakYears, 0, 1);
  } else {
    pineBeetleEffect = pineBeetleSeverity * Math.exp(-(beetleYears - beetlePeakYears) / beetleRecoveryHalf);
  }
  pineBeetleEffect = cl(pineBeetleEffect, 0, 1);

  // More snow reaches ground in beetle-killed stands: +10-20% accumulation (Wei & Zhang 2010)
  var beetleSnowBoost = 1 + pineBeetleEffect * 0.15;
  var accumMid = totalPrecip * 0.40 * snowFracMid * beetleSnowBoost; // 40% of precip in mid band
  var meltDaysMid = tMid > 0 ? tMid * 91.25 : 0;
  var meltRateMid = 3.5; // slightly lower melt rate (less energy at elevation)
  var meltMid = cl(meltRateMid * meltDaysMid / 91.25, 0, prevSnowMid + accumMid);
  var rosMid = (atmoRiver > 0.3 && prevSnowMid > 30) ? cl(atmoRiver * prevSnowMid * 0.3, 0, prevSnowMid * 0.4) : 0;
  var snowMid = cl(prevSnowMid + accumMid - meltMid - rosMid, 0, 800);

  // High band (>2000m): snow-dominant, glacier zone
  // Accumulates Oct-May, melts Jun-Aug; some snow persists year-round (becomes glacier)
  var snowFracHigh = tHigh < -4 ? 1.0 : tHigh < 0 ? cl(1 - (tHigh + 4) / 4, 0, 1) : 0;
  var accumHigh = totalPrecip * 0.25 * snowFracHigh; // 25% of precip in high band (orographic enhancement partially offset by less total moisture)
  var meltDaysHigh = tHigh > 0 ? tHigh * 91.25 : 0;
  var meltRateHigh = 3.0; // lowest melt rate (high albedo, short days)
  var meltHigh = cl(meltRateHigh * meltDaysHigh / 91.25, 0, prevSnowHigh + accumHigh);
  // No rain-on-snow at high elevation (precip is almost always snow)
  var snowHigh = cl(prevSnowHigh + accumHigh - meltHigh, 0, 1500);

  // Total basin SWE (area-weighted)
  var totalSWE = snowLow * 0.35 + snowMid * 0.40 + snowHigh * 0.25;
  var totalSnowmelt = (meltLow + rosLow) * 0.35 + (meltMid + rosMid) * 0.40 + meltHigh * 0.25;

  // ═══════════════════════════════════════════════════════════
  // 2. GLACIER MODEL
  // ═══════════════════════════════════════════════════════════
  // Fraser Basin glaciers: ~25,000 km² at LIA maximum, ~15,000 km² circa 2000,
  // declining ~1%/yr under current warming (Bolch et al. 2010).
  // Glaciers provide 10-15% of August flow — critical for salmon (Déry et al. 2012).
  //
  // Mass balance: accumulation (winter snowfall at >2500m) minus melt (summer)
  // Loss accelerates nonlinearly above +2°C (Clarke et al. 2015):
  //   0-1°C: ~0.5%/yr loss
  //   1-2°C: ~1.0%/yr loss
  //   2-3°C: ~2.0%/yr loss (rapid disintegration of small glaciers)
  //   >3°C: ~3.5%/yr loss (committed loss of most BC glaciers by 2100)

  var glacierAccum = quarter <= 1 ? cl(accumHigh * 0.15, 0, 30) : 0; // winter/spring only
  var glacierMeltRate;
  if (sstDelta < 1) {
    glacierMeltRate = 0.005 + sstDelta * 0.003; // 0.5-0.8%/yr baseline
  } else if (sstDelta < 2) {
    glacierMeltRate = 0.008 + (sstDelta - 1) * 0.007; // 0.8-1.5%/yr
  } else if (sstDelta < 3) {
    glacierMeltRate = 0.015 + (sstDelta - 2) * 0.010; // 1.5-2.5%/yr (Clarke et al. 2015)
  } else {
    glacierMeltRate = 0.025 + (sstDelta - 3) * 0.012; // 2.5-3.7%/yr
  }
  // Quarterly mass balance
  var glacierMelt = prevGlacierMass * glacierMeltRate * 0.25; // quarterly fraction
  var glacierMass = cl(prevGlacierMass + glacierAccum * 0.0001 - glacierMelt, 0, 1.2); // 1.2 = could slightly exceed 2000 baseline in very cold scenarios

  // Glacier melt contribution to discharge (m³/s equivalent)
  // At full mass (1.0), peak summer contribution ~400 m³/s (Déry et al. 2012)
  // Contribution peaks in summer (Q2), minimal in winter
  var glacierSeasonality = seasonalPeak(quarter, 2, 0.8); // peaks summer
  var glacierDischarge = glacierMass * 400 * glacierSeasonality;

  // "Peak water" phenomenon: as glaciers shrink, summer flow initially maintained
  // by faster melt, then collapses when glacier mass drops below ~30%
  // (Huss & Hock 2018, Baraer et al. 2012)
  if (glacierMass < 0.3) {
    glacierDischarge = glacierDischarge * cl(glacierMass / 0.3, 0.1, 1);
  }

  // ═══════════════════════════════════════════════════════════
  // 3. FRESHET MODEL
  // ═══════════════════════════════════════════════════════════
  // Annual freshet driven by snowmelt from all three bands, sequentially:
  //   Low band melts first (March-April)
  //   Mid band follows (April-May)
  //   High band last (May-July) — drives the main peak
  //
  // Peak discharge at Hope: mean ~8,500 m³/s, range 5,000-12,000
  // (Morrison et al. 2002; WSC station 08MF005)
  //
  // Timing: historically peaks mid-June (~day 166)
  // Shift: ~1-2 weeks earlier per °C warming (Stewart et al. 2005)

  // Freshet peak timing (quarter units, 0-3):
  // Baseline: 1.5 = mid-June (quarter 1.5 = halfway through spring-summer transition)
  // Stewart et al. 2005: 5-10 days earlier per °C in Pacific Northwest
  var freshetPeakQ = cl(1.5 - sstDelta * 0.08, 0.8, 2.0); // shifts earlier with warming

  // Freshet seasonal shape: Gaussian pulse centered on freshetPeakQ
  var freshetPulse = seasonalPeak(quarter, freshetPeakQ, 0.6);

  // Freshet magnitude: proportional to peak SWE (which peaked in previous winter/spring)
  // Reference: 300mm SWE → ~8,500 m³/s peak discharge at Hope
  var peakSWE = snowMid + snowHigh * 0.7; // mid + high bands drive freshet
  var freshetMagnitude = cl(peakSWE / 300, 0.3, 2.0); // normalized to baseline

  // Snowmelt runoff from all bands (m³/s equivalent)
  // Convert mm SWE melt over 233,000 km² basin to m³/s:
  // 1mm over 233,000 km² = 233,000 * 1e6 * 1e-3 m³ = 2.33e8 m³
  // Over 91.25 days (quarter): 2.33e8 / (91.25 * 86400) ≈ 29.5 m³/s per mm melt
  var snowmeltDischarge = totalSnowmelt * 29.5;

  // ═══════════════════════════════════════════════════════════
  // 4. NECHAKO DIVERSION
  // ═══════════════════════════════════════════════════════════
  // Kenney Dam (1952) diverts ~50% of Nechako River flow westward to Kitimat
  // for Rio Tinto aluminum smelter power generation.
  // Effect: reduces Fraser mainstem by ~200 m³/s at Prince George (Ferrari et al. 2007).
  // Temperature: Nechako water is cold (snowmelt origin); diverting it warms Fraser downstream.
  // Restoration of Nechako would increase Fraser flow and cool downstream temperatures.

  var nechakoDiverted = 200 * (1 - nechakoRestored); // m³/s lost to diversion
  var nechakoTempEffect = (1 - nechakoRestored) * 0.5; // °C warming from diversion (Ferrari et al. 2007)

  // ═══════════════════════════════════════════════════════════
  // 5. BASEFLOW / GROUNDWATER
  // ═══════════════════════════════════════════════════════════
  // Winter/fall baseflow from groundwater discharge into tributaries.
  // Fraser Basin groundwater: large aquifers in Fraser Valley + Interior Plateau.
  // Recharge from infiltration (non-frozen, non-impervious surfaces).
  // Minimum flows critical for salmon: spawning (fall), rearing (winter).

  var gwRecharge = totalPrecip * (1 - snowFracMid) * 0.003; // infiltration from rainfall only
  var gwDischarge = prevGWLevel * 0.06; // Darcy-like baseflow proportional to level
  var gwLevel = cl(prevGWLevel + (gwRecharge - gwDischarge) * 0.25, 0, 1);
  // Fraser baseflow at Hope: ~1500-1800 m³/s during low flow (Déry et al. 2012).
  // This is the dominant flow component outside freshet season (Oct-Apr).
  // Previous value (800) was too low, causing ~35% discharge bias.
  var baseflowDischarge = gwLevel * 1800; // m³/s at full level (large basin)

  // Minimum ecological flow threshold: 1,000 m³/s at Hope (Shrestha et al. 2012)
  // Below this, salmon thermal stress increases rapidly
  var minEcoFlow = 1000;

  // ═══════════════════════════════════════════════════════════
  // 6. RAINFALL RUNOFF
  // ═══════════════════════════════════════════════════════════
  // Direct rainfall runoff (non-snow precipitation that runs off)
  var rainfallRunoff = totalPrecip * (1 - snowFracMid) * 0.35 * 15; // m³/s equivalent (runoff coefficient ~0.35)
  // AR events cause extreme runoff (flooding)
  // Basin-averaged response is modest: ARs typically affect 5-15% of the 233,000 km²
  // Fraser basin at any time (Neiman et al. 2008; Curry et al. 2019). Quarter-averaged
  // runoff increase is 20-50% (local hotspots much higher but brief).
  // Previous value (3×) grossly over-predicted because: (1) ARs are ~2-3 day events
  // treated as quarter-long, (2) 2021 AR was primarily coastal Nooksack, not full Fraser.
  if (atmoRiver > 0.3) {
    rainfallRunoff = rainfallRunoff * (1 + atmoRiver * 0.6);
  }
  // Wildfire: burn scars increase runoff coefficient (Shakesby & Doerr 2006)
  rainfallRunoff = rainfallRunoff * (1 + fire * 1.5);

  // Evapotranspiration loss (seasonal): summer ET is substantial in interior
  // Pine beetle-killed forests transpire nothing → reduced ET (Wei & Zhang 2010)
  var beetleETReduction = pineBeetleEffect * 0.15; // up to 15% ET reduction in affected areas
  var etLoss = quarter === 2 ? 300 : quarter === 1 || quarter === 3 ? 150 : 50; // m³/s equivalent
  etLoss = etLoss * (1 - beetleETReduction);
  // Heat dome: extreme heat causes massive ET increase (2021: 49.6°C at Lytton).
  // Soil moisture depleted rapidly, baseflow drops for months after.
  // Effect: +100-150% ET during heat dome quarter (most extreme drought in record).
  // Also accelerates snowmelt (freshet compressed into shorter period) and reduces
  // groundwater recharge for subsequent quarters.
  if (heatDome > 0.3) {
    etLoss = etLoss * (1 + heatDome * 1.5); // up to 150% more ET
    // Groundwater depletion from extreme drought: reduce GW level directly
    gwLevel = cl(gwLevel - heatDome * 0.15, 0, 1); // 15% GW depletion
    baseflowDischarge = gwLevel * 1800; // recompute baseflow with depleted GW
  }

  // ═══════════════════════════════════════════════════════════
  // 7. MOUNTAIN PINE BEETLE LEGACY (computed above, effects applied here)
  // ═══════════════════════════════════════════════════════════
  // Effects already integrated:
  //   - Mid-band snowpack increased by pineBeetleEffect (section 1)
  //   - ET reduced by beetleETReduction (section 6)
  //   - Additional runoff boost from dead-canopy interception loss
  var beetleRunoffBoost = pineBeetleEffect * 0.20; // up to 20% increased runoff (Wei & Zhang 2010: 10-25%)
  rainfallRunoff = rainfallRunoff * (1 + beetleRunoffBoost);
  // Salvage logging roads increase sediment (computed in section 9)
  var beetleSediment = pineBeetleEffect * forestryIntensity * 1500; // salvage logging × beetle severity

  // ═══════════════════════════════════════════════════════════
  // 8. WILDFIRE MODEL
  // ═══════════════════════════════════════════════════════════
  // Interior BC wildfire area increasing: 2017 burned 1.2M ha, 2018 burned 1.35M ha
  // (BC Wildfire Service records). Fire probability roughly doubles per +1°C
  // (Flannigan et al. 2009, Nat. Rev. Earth Environ.).
  //
  // Stochastic fire occurrence: probability per quarter scales with warming + season
  // Effects persist via burn scar carry-forward (Shakesby & Doerr 2006)

  var fireSeason = (quarter === 1 || quarter === 2) ? 1.0 : 0.15; // summer/spring fire season
  var fireBaseProbability = 0.06; // ~24% annual chance of significant fire at baseline
  var fireClimateBoost = Math.pow(2, cl(sstDelta, 0, 4)); // doubles per °C (Flannigan et al. 2009)
  var suppressionReduction = cl(1 - fireSuppressionEffort * 0.6, 0.4, 1); // max 60% reduction
  var fireProbability = cl(fireBaseProbability * fireClimateBoost * fireSeason * suppressionReduction, 0, 0.5);

  // Stochastic fire ignition (seeded for reproducibility)
  // In hindcast mode, only historical fire events drive fires (no stochastic generation)
  // to prevent over-accumulation of burn scars from both stochastic + historical sources
  var hindcastMode = coupling && coupling.hindcastMode;
  var fireSeed = seededRandom(year * 1000 + quarter * 250 + 31337);
  var newFireThisQuarter = hindcastMode ? 0 : (fireSeed < fireProbability && fire < 0.3) ? 1 : 0;

  // Fire area: stochastic magnitude when fire occurs
  // Typical: 50,000-200,000 ha. Big years: 500,000-1,500,000 ha
  var fireAreaFrac = 0; // fraction of mid-elevation area burned this quarter
  if (newFireThisQuarter || fire > 0.3) {
    var fireMagnitude = fire > 0.3 ? fire : cl(fireSeed * 2, 0.2, 1); // shock fires use shock intensity
    fireAreaFrac = cl(fireMagnitude * 0.05, 0, 0.08); // max 8% of mid area per quarter
  }

  // Burn scar persistence: scars take 15-30 years to revegetate (Shakesby & Doerr 2006)
  // Use max of previous scar and new fire (can't "unburn")
  var burnScar = cl(Math.max(prevBurnScar, fireAreaFrac), 0, 0.5); // cumulative, max 50% of mid area
  var burnAge = fireAreaFrac > prevBurnScar ? 0 : prevBurnAge + 1; // reset age on new fire

  // Active burn scar: exponential recovery over ~80 quarters (~20 years)
  var activeBurnScar = burnScar * Math.exp(-burnAge / 80);

  // Wildfire effects on hydrology:
  // 1-3 years post-fire: 30-50% increase in runoff from burned areas (Shakesby & Doerr 2006)
  // Basin-averaged effect: burn scar is fraction of mid-band area (0-50%), so total
  // basin runoff increase is modest (up to 50% of burned fraction).
  var fireRunoffBoost = activeBurnScar * 1.0; // up to 50% increase in burned fraction
  rainfallRunoff = rainfallRunoff * (1 + fireRunoffBoost);

  // Fire sediment: burned slopes erode aggressively, especially with rain
  // Moody & Martin 2001: sediment yield 10-100x post-fire
  var fireErosionSediment = activeBurnScar * 8000; // tonnes/day from fire erosion
  var fireARSediment = activeBurnScar * atmoRiver * 15000; // catastrophic when AR hits burn scar

  // Fire nutrient pulse: burned biomass releases N and P
  var fireNitrogen = activeBurnScar * 800; // kg/day N from ash and leaching
  var firePhosphorus = activeBurnScar * 120; // kg/day P

  // ═══════════════════════════════════════════════════════════
  // 9. MINING AND INDUSTRIAL
  // ═══════════════════════════════════════════════════════════
  // Fraser Basin mining: copper (Highland Valley), gold (Cariboo), coal (NE BC)
  // Historic placer mining left mercury contamination in some tributaries.
  // Mount Polley tailings dam failure (2014): 25M m³ into Quesnel Lake
  // (Petticrew et al. 2015, Geomorphology 227:11-21)
  //
  // Contaminant load: background metals + acid mine drainage + tailings risk

  // Background mining contamination (scales with intensity)
  var miningContam = miningIntensity * 0.15; // 0-0.15 contaminant index contribution
  var miningSediment = miningIntensity * 500; // tonnes/day from mine roads, tailings, processing

  // Stochastic tailings failure risk: low probability, high consequence
  // Probability increases with mining intensity and earthquake
  var tailingsFailureProb = cl(miningIntensity * 0.003 + earthquake * 0.05, 0, 0.1);
  var tailingsSeed = seededRandom(year * 1000 + quarter * 250 + 77701);
  var tailingsFailure = tailingsSeed < tailingsFailureProb ? 1 : 0;

  // Tailings failure: massive acute contamination pulse, decays over ~5 years
  var tailingsContam = prevTailingsContam;
  if (tailingsFailure) {
    tailingsContam = cl(tailingsContam + 0.4, 0, 0.8); // acute contamination spike
  }
  // Decay: ~10% per quarter (Petticrew et al. 2015: Quesnel Lake contamination persisted 3-5 years)
  tailingsContam = tailingsContam * 0.90;

  var tailingsSediment = tailingsContam * 5000; // tonnes/day (suspended tailings material)
  var tailingsMetals = tailingsContam * 0.3; // heavy metal contamination index

  // Mercury from historic placer mining (persistent, not decaying)
  var mercuryLegacy = miningIntensity * 0.05; // low-level chronic mercury

  // ═══════════════════════════════════════════════════════════
  // 10. FORESTRY
  // ═══════════════════════════════════════════════════════════
  // Interior BC forestry: clearcutting reduces canopy interception,
  // forest road networks deliver fine sediment to streams,
  // riparian harvest warms small tributaries.
  // Winkler et al. 2014: 10-20% streamflow increase from clearcutting in BC interior

  var forestryRunoffBoost = forestryIntensity * 0.15; // up to 15% runoff increase
  rainfallRunoff = rainfallRunoff * (1 + forestryRunoffBoost);

  // Road sediment: forest roads are the dominant anthropogenic sediment source in BC
  // (Reid & Dunne 1984: road erosion dominates managed watershed sediment budgets)
  var forestrySediment = forestryIntensity * 2000; // tonnes/day

  // Riparian harvest warms tributaries: up to 2°C in clearcut reaches
  // (Moore et al. 2005, JAWRA 41:813-831)
  var forestryTempEffect = forestryIntensity * 0.4; // °C contribution to mainstem (diluted by volume)

  // ═══════════════════════════════════════════════════════════
  // 11. FRASER VALLEY AGRICULTURE
  // ═══════════════════════════════════════════════════════════
  // Lower Fraser Valley: dairy, poultry, berry farms, greenhouses
  // Major nutrient source to Fraser estuary (Schreier et al. 1999)
  // Concentrated in a small area (~3,500 km²) but high loading per unit area

  // Nitrogen: dairy manure + fertilizer, seasonal application
  // Peak loading spring/fall (application seasons), lower in winter/summer
  var agSeasonality = (quarter === 1 || quarter === 3) ? 1.3 : 0.8; // spring/fall peaks
  var agNitrogen = fraserAgIntensity * 600 * agSeasonality; // kg/day
  var agPhosphorus = fraserAgIntensity * 100 * agSeasonality; // kg/day

  // Pesticide/contaminant contribution (neonicotinoids, older organochlorines)
  // Modest relative to mining but concentrated near estuary
  var agContam = fraserAgIntensity * 0.06; // contaminant index contribution

  // Agricultural runoff: adds to total discharge during rain events
  var agRunoff = fraserAgIntensity * totalPrecip * 0.001 * 5; // m³/s (small relative to Fraser)

  // ═══════════════════════════════════════════════════════════
  // 12. LOWER MAINLAND URBANIZATION
  // ═══════════════════════════════════════════════════════════
  // Metro Vancouver: 2.6M people on Fraser delta
  // Impervious surface → flashy runoff, CSO, stormwater contaminants
  // (Zandbergen 1998, Water Qual. Res. J. Canada)

  // Impervious surface fraction of lower basin
  var urbanImpervious = fraserUrbanization * 0.15; // up to 15% of low-elevation band
  // Reduced groundwater recharge from imperviousness
  gwRecharge = gwRecharge * (1 - urbanImpervious * 0.5);

  // Urban stormwater contaminants: PAHs, heavy metals, microplastics
  // Seasonal: worse in fall first-flush (summer accumulation washed by first rain)
  var urbanFirstFlush = quarter === 3 ? 1.5 : 1.0; // fall first-flush effect
  var urbanContam = fraserUrbanization * 0.10 * urbanFirstFlush; // contaminant index contribution
  var urbanMicroplastics = fraserUrbanization * 0.08; // microplastics index

  // CSO events: heavy rain on combined sewer systems
  // Metro Vancouver has significant CSO infrastructure (GVRD, 2010)
  var urbanCSOContrib = fraserUrbanization * atmoRiver * 0.05; // CSO during AR events

  // Urban nutrient contribution (small relative to agriculture but year-round)
  var urbanNitrogen = fraserUrbanization * 200; // kg/day
  var urbanPhosphorus = fraserUrbanization * 40; // kg/day

  // ═══════════════════════════════════════════════════════════
  // 13. DISCHARGE INTEGRATION & ROUTING (updated with land disturbance effects)
  // ═══════════════════════════════════════════════════════════
  // Sum all components including land disturbance runoff boosts

  var rawDischarge = snowmeltDischarge + glacierDischarge + rainfallRunoff + baseflowDischarge + agRunoff - nechakoDiverted - etLoss;
  rawDischarge = cl(rawDischarge, 200, 15000); // physical bounds: min baseflow to max flood

  // Routing delay: interior snowmelt takes ~1-2 weeks to reach Hope/delta
  // Model as exponential smoothing (1st-order linear reservoir, Déry et al. 2012)
  var routingAlpha = 0.6; // ~60% of flow arrives within the quarter, 40% carried to next
  var routedDischarge = prevRoutedFlow * (1 - routingAlpha) + rawDischarge * routingAlpha;
  routedDischarge = cl(routedDischarge, 200, 15000);

  // Peak discharge estimate for this quarter (above mean)
  var peakDischarge = routedDischarge * (1 + freshetPulse * freshetMagnitude * 0.8);
  peakDischarge = cl(peakDischarge, routedDischarge, 15000);

  // ═══════════════════════════════════════════════════════════
  // 8. WATER TEMPERATURE AT HOPE
  // ═══════════════════════════════════════════════════════════
  // Fraser temperature: seasonal range 2-20°C at Hope
  // Driven by: air temperature, snowmelt fraction (cold), glacier fraction (very cold),
  //            Nechako diversion (removes cold water → warming)
  // Patterson et al. 2007: Fraser summer temps approaching 20°C lethal threshold for sockeye

  var baseTemp = [3, 8, 17, 9]; // quarterly baseline at Hope
  var airTempContrib = baseTemp[quarter] + sstDelta * 0.6;
  // Cold water fraction from snowmelt + glacier
  var coldFraction = cl((snowmeltDischarge + glacierDischarge) / Math.max(routedDischarge, 200), 0, 0.8);
  var coldCooling = coldFraction * 4; // up to 4°C cooling from snowmelt/glacier input
  var waterTemp = cl(airTempContrib - coldCooling + nechakoTempEffect + forestryTempEffect, 1, 22);

  // Thermal stress index for salmon (Patterson et al. 2007):
  // Sockeye pre-spawn mortality accelerates above 18°C, lethal above 21°C
  var thermalStressIndex = waterTemp > 18 ? cl((waterTemp - 18) / 3, 0, 1) : 0;

  // ═══════════════════════════════════════════════════════════
  // 15. INTEGRATED SEDIMENT LOAD
  // ═══════════════════════════════════════════════════════════
  // Fraser carries ~17 million tonnes/yr sediment (McLean et al. 1999)
  // Sources: natural erosion + freshet + fire + forestry + mining + AR events

  var baseSediment = 2000; // tonnes/day natural baseline
  var freshetSediment = freshetPulse * freshetMagnitude * 12000; // tonnes/day during freshet
  var arSediment = atmoRiver > 0.3 ? atmoRiver * 5000 : 0; // AR-driven erosion
  var sedimentLoad = baseSediment + freshetSediment + arSediment
    + fireErosionSediment + fireARSediment // wildfire erosion (section 8)
    + beetleSediment                       // salvage logging (section 7)
    + forestrySediment                     // forest roads (section 10)
    + miningSediment                       // mine roads + tailings (section 9)
    + tailingsSediment;                    // acute tailings failure (section 9)
  sedimentLoad = cl(sedimentLoad, 500, 120000); // tonnes/day (higher max for fire+AR events)

  // ═══════════════════════════════════════════════════════════
  // 16. INTEGRATED NUTRIENT LOAD
  // ═══════════════════════════════════════════════════════════
  // Sources: natural + fire + agriculture + urban + freshet mobilization

  var baseNitrogen = 400; // kg/day natural baseline
  var freshetNitrogen = freshetPulse * 600; // flushing mobilizes stored N
  var totalNitrogen = (baseNitrogen + freshetNitrogen) * precipDelta
    + fireNitrogen     // ash/leaching from burns (section 8)
    + agNitrogen       // agricultural runoff (section 11)
    + urbanNitrogen;   // urban stormwater (section 12)
  totalNitrogen = cl(totalNitrogen, 100, 10000); // kg/day

  var totalPhosphorus = 80 * precipDelta // natural baseline P
    + firePhosphorus   // fire contribution
    + agPhosphorus     // agricultural P
    + urbanPhosphorus; // urban P
  totalPhosphorus = cl(totalPhosphorus, 20, 2000); // kg/day

  // ═══════════════════════════════════════════════════════════
  // 17. INTEGRATED WATER QUALITY INDEX
  // ═══════════════════════════════════════════════════════════
  // Aggregate contaminant sources for downstream coupling

  var totalContamIndex = cl(
    miningContam           // chronic mining (section 9)
    + tailingsMetals       // acute tailings failure (section 9)
    + mercuryLegacy        // historic placer mercury (section 9)
    + agContam             // agricultural pesticides (section 11)
    + urbanContam          // urban stormwater PAHs/metals (section 12)
    + urbanCSOContrib,     // CSO events (section 12)
    0, 1);

  // Turbidity: driven by sediment load, normalized to baseline
  // 17M tonnes/yr ≈ 46,500 tonnes/day mean → turbidity baseline ~1.0
  var fraserTurbidity = cl(sedimentLoad / 46500, 0.1, 3.0); // normalized, >1 = above baseline

  // ═══════════════════════════════════════════════════════════
  // 10. FRESHET TIMING INDEX
  // ═══════════════════════════════════════════════════════════
  // Index capturing how far freshet has shifted from historical:
  // 0 = normal timing, positive = earlier, negative = later
  var freshetShiftDays = sstDelta * 8; // ~8 days earlier per °C (Stewart et al. 2005)
  var freshetTimingIndex = cl(freshetShiftDays / 30, -1, 1); // normalized ±1 (30-day max shift)

  // ═══════════════════════════════════════════════════════════
  // 18. FRASER SALMON STOCKS
  // ═══════════════════════════════════════════════════════════
  // 5 species with distinct life histories, cyclicity, and threats.
  // These are FRASER-SPECIFIC populations — separate from the aggregate
  // Salish Sea salmon in computeEcosystem.js. The export variables couple
  // back into the Salish Sea model via orca prey, pinniped prey, etc.
  //
  // Key references:
  //   Peterman & Dorner 2012 — declining marine survival in Fraser sockeye
  //   Patterson et al. 2007, Hinch et al. 2012 — thermal en-route mortality
  //   Ford et al. 2010 (DFO) — SRKW ~90% Chinook July-August; Ford & Ellis 2006 (MEPS) — selective foraging mechanism
  //   Ruggerone & Irvine 2018 — pink-chum hatchery competition
  //   Cohen 2012 (Cohen Commission) — decline of Fraser River sockeye

  // ── SALMON PARAMETERS ──
  var bigBarPassage = (P.bigBarPassage !== undefined ? P.bigBarPassage : 70) / 100; // 70% baseline (partially remediated since 2019)
  var sockeyeHatchery = (P.sockeyeHatchery !== undefined ? P.sockeyeHatchery : 20) / 100;
  var chinookHatchery = (P.chinookHatchery !== undefined ? P.chinookHatchery : 30) / 100;
  var fraserFishingPressure = (P.fraserFishingPressure !== undefined ? P.fraserFishingPressure : 30) / 100;
  var habitatRestoration = (P.fraserHabitatRestoration !== undefined ? P.fraserHabitatRestoration : 20) / 100;

  // ── PREVIOUS SALMON STATE ──
  var prevSalmon = _prev.salmon || {};
  var prevSockeye = prevSalmon.sockeye || { spawners: 4000000, smolts: 80000000 };
  var prevChinook = prevSalmon.chinook || { spawners: 150000, smolts: 8000000 };
  var prevPink = prevSalmon.pink || { spawners: 8000000, smolts: 200000000 };
  var prevChum = prevSalmon.chum || { spawners: 2000000, smolts: 40000000 };
  var prevCoho = prevSalmon.coho || { spawners: 400000, smolts: 6000000 };

  // ── SHARED ENVIRONMENTAL DRIVERS ──

  // En-route mortality: Fraser water temperature drives pre-spawn death
  // Patterson et al. 2007: sockeye mortality approaches 100% above 21°C
  // Hinch et al. 2012: ~2% increase in en-route mortality per °C above 18°C
  // Only applies during migration season (Q2-Q3: summer-fall)
  var migrationSeason = (quarter === 2 || quarter === 3) ? 1 : 0;
  var enRouteMortBase = waterTemp > 18 ? cl((waterTemp - 18) / 4, 0, 0.8) : 0;
  // Sockeye are most vulnerable; Chinook somewhat less; pink/chum/coho least
  var enRouteMortSockeye = enRouteMortBase * 1.0 * migrationSeason;
  var enRouteMortChinook = enRouteMortBase * 0.7 * migrationSeason;
  var enRouteMortOther = enRouteMortBase * 0.4 * migrationSeason;

  // Big Bar landslide passage (2019): blocks upper Fraser migration
  // Affects ~60% of sockeye (upper stocks), ~40% of Chinook, ~20% of coho
  // Pink and chum mostly spawn below the slide
  var bigBarBlockSockeye = cl(1 - (1 - bigBarPassage) * 0.6, 0.4, 1);
  var bigBarBlockChinook = cl(1 - (1 - bigBarPassage) * 0.4, 0.6, 1);
  var bigBarBlockCoho = cl(1 - (1 - bigBarPassage) * 0.2, 0.8, 1);

  // Marine survival: declining since 1990s (Peterman & Dorner 2012)
  // Models as baseline × climate modifier. SSP warming further reduces
  var marineSurvBase = 0.04; // 4% baseline smolt-to-adult survival (modern degraded)
  var marineSurvClimate = cl(1 - sstDelta * 0.12, 0.3, 1); // ~12% decline per °C
  var marineSurvival = marineSurvBase * marineSurvClimate;

  // Freshwater habitat quality (aggregated)
  // Higher with restoration, lower with forestry, mining, low flows
  var habitatQuality = cl(
    0.5
    + habitatRestoration * 0.3          // restoration improves habitat
    - forestryIntensity * 0.15          // logging degrades streams
    - miningContam * 0.2               // contamination
    - activeBurnScar * 0.15            // fire degrades riparian
    + nechakoRestored * 0.1            // Nechako restoration helps
    - (routedDischarge < minEcoFlow ? 0.2 : 0), // low flow penalty
    0.1, 1.0);

  // Spawning success: temperature at spawning grounds + flow + habitat
  // Spawning occurs Q3 (fall) for most species
  var spawningSeason = quarter === 3 ? 1 : 0;
  var spawnTempPenalty = waterTemp > 16 ? cl((waterTemp - 16) / 6, 0, 0.5) : 0; // warm spawning water reduces egg survival
  var spawningSuccess = cl(habitatQuality * (1 - spawnTempPenalty) * (1 - totalContamIndex * 0.3), 0.1, 0.9);

  // Fishing harvest: applied to returning adults
  // bcFishingPressureAdj from macroEconomy: BC unemployment affects Fraser fishing effort
  var bcFishAdj = coupling && coupling.bcFishingPressureAdj !== undefined ? coupling.bcFishingPressureAdj : 0;
  var harvestRate = cl(fraserFishingPressure + bcFishAdj, 0, 1) * 0.6; // max ~60% harvest rate

  // Sea lice from aquaculture (affects smolts in Georgia Strait)
  // Uses fraserAgIntensity as proxy if aquaculture param not available
  var seaLiceMortality = cl(fraserAgIntensity * 0.06, 0, 0.08); // up to 8% smolt mortality

  // ── 18a. FRASER SOCKEYE ──
  // 4-year dominant cycle: Adams/Shuswap cycle years
  // Historic: 1958, 1962, 1966, ..., 2010, 2014, 2018, 2022, 2026, 2030...
  // Dominant cycle year: year mod 4 === 2 (2010, 2014, 2018, 2022, 2026, 2030...)
  // Amplitude: dominant runs 5-20x off years (Cohen 2012)
  // Uses absolute year mod 4, not relative to 2026, so hindcast years work correctly.
  var sockeyeCycleYear = ((year % 4) + 4) % 4; // safe positive modulo
  // Phase mapping: year%4 === 2 → dominant (2010=2, 2014=2, 2018=2, 2022=2, 2026=2)
  var sockeyeCycleAmplitude;
  if (sockeyeCycleYear === 2) {
    sockeyeCycleAmplitude = 8.0; // dominant year: 8x baseline (Adams/Shuswap)
  } else if (sockeyeCycleYear === 3) {
    sockeyeCycleAmplitude = 2.5; // sub-dominant: 2.5x
  } else if (sockeyeCycleYear === 1) {
    sockeyeCycleAmplitude = 1.2; // sub-off: 1.2x
  } else {
    sockeyeCycleAmplitude = 0.5; // off year: 0.5x
  }

  // Baseline modern return: ~4M in dominant years → ~500k average
  var sockeyeBaseReturn = 500000;
  var sockeyePreHarvest = sockeyeBaseReturn * sockeyeCycleAmplitude * marineSurvival / marineSurvBase;
  // Passage, en-route mortality, harvest
  var sockeyePostPassage = sockeyePreHarvest * bigBarBlockSockeye;
  var sockeyePostMortality = sockeyePostPassage * (1 - enRouteMortSockeye);
  var sockeyeHarvestCatch = sockeyePostMortality * harvestRate;
  var sockeyeSpawners = cl(sockeyePostMortality - sockeyeHarvestCatch, 0, 50000000);
  // Hatchery supplementation
  var sockeyeHatcheryFish = sockeyeHatchery * sockeyeBaseReturn * 0.5; // hatchery adds up to 50% of base
  sockeyeSpawners = sockeyeSpawners + sockeyeHatcheryFish * spawningSeason;
  // Spawning → smolt production (next generation)
  var sockeyeEggSurvival = spawningSuccess * 0.8; // sockeye: high egg-to-fry survival in lakes
  var sockeyeSmolts = sockeyeSpawners * 2500 * sockeyeEggSurvival * spawningSeason; // ~2500 eggs per female, 50% female
  sockeyeSmolts = cl(sockeyeSmolts * (1 - seaLiceMortality), 0, 500000000);
  // Return index for downstream coupling (normalized)
  var sockeyeReturn = cl(sockeyeSpawners / 1000000, 0, 50); // millions of fish

  // ── 18b. FRASER CHINOOK ──
  // No strong cyclicity, but spring vs fall run timing matters
  // Multiple COSEWIC-listed populations; heavily depleted
  // THE critical orca prey link (Ford et al. 2010 DFO; Ford & Ellis 2006 MEPS framework)
  var chinookBaseReturn = 150000; // modern depleted baseline
  var chinookMarineSurv = marineSurvival * 1.1; // slightly better marine survival than sockeye
  var chinookPreHarvest = chinookBaseReturn * chinookMarineSurv / marineSurvBase;
  var chinookPostPassage = chinookPreHarvest * bigBarBlockChinook;
  var chinookPostMortality = chinookPostPassage * (1 - enRouteMortChinook);
  var chinookHarvestCatch = chinookPostMortality * harvestRate * 0.8; // lower harvest rate (conservation closures)
  var chinookSpawners = cl(chinookPostMortality - chinookHarvestCatch, 0, 2000000);
  var chinookHatcheryFish = chinookHatchery * chinookBaseReturn * 0.7;
  chinookSpawners = chinookSpawners + chinookHatcheryFish * spawningSeason;
  var chinookSmolts = chinookSpawners * 3000 * spawningSuccess * 0.6 * spawningSeason; // Chinook: lower egg-fry survival (stream spawners)
  chinookSmolts = cl(chinookSmolts * (1 - seaLiceMortality * 1.3), 0, 50000000); // Chinook smolts slightly more sea-lice vulnerable
  var chinookReturn = cl(chinookSpawners / 100000, 0, 20); // hundreds of thousands

  // Chinook availability for SRKW: weighted by body size (large fish = more calories)
  // Ford et al. 2010 (DFO Can. Sci. Advis. Sec. Res. Doc.): ~90% Chinook July-August in critical habitat.
  // Hanson et al. 2010 (Endang. Species Res. 11:69-82): fecal DNA shows ~98% salmon July-August diet.
  // Ford & Ellis 2006 (Mar. Ecol. Prog. Ser. 316:185-199): selective foraging mechanism framework.
  // Code coefficient 0.3 reflects lower-bound / seasonal composite of the Ford 2010 peak 90% figure.
  // Availability peaks Q1-Q2 (spring/summer Chinook runs)
  var chinookRunTiming = seasonalPeak(quarter, 1.5, 1.0); // broad peak spring-summer
  var chinookAvailForOrca = cl(chinookReturn * chinookRunTiming * 0.3, 0, 5); // normalized orca prey index

  // ── 18c. FRASER PINK ──
  // Strict 2-year cycle: odd years dominant in Fraser
  // (year - 2026): 2027=odd=dominant, 2028=even=off, 2029=odd=dominant...
  var pinkCycleYear = (year % 2 === 1) ? 1 : 0; // 1=dominant (odd years)
  var pinkCycleAmplitude = pinkCycleYear ? 6.0 : 0.3; // 20:1 ratio odd:even

  var pinkBaseReturn = 5000000; // modern baseline average
  var pinkMarineSurv = marineSurvival * 1.3; // pinks have higher marine survival (shorter ocean residence)
  var pinkPreHarvest = pinkBaseReturn * pinkCycleAmplitude * pinkMarineSurv / marineSurvBase;
  // Pinks spawn low in watershed — less Big Bar effect, less en-route mortality
  var pinkPostMortality = pinkPreHarvest * (1 - enRouteMortOther * 0.5);
  var pinkHarvestCatch = pinkPostMortality * harvestRate * 0.5; // lower harvest (less targeted)
  var pinkSpawners = cl(pinkPostMortality - pinkHarvestCatch, 0, 80000000);
  // Pinks: fry migrate to sea immediately (no freshwater rearing)
  var pinkSmolts = pinkSpawners * 1800 * spawningSuccess * 0.9 * spawningSeason;
  pinkSmolts = cl(pinkSmolts, 0, 500000000);
  var pinkReturn = cl(pinkSpawners / 1000000, 0, 80); // millions

  // ── 18d. FRASER CHUM ──
  // Late-fall spawners, mostly lower tributaries
  // Harrison chum: one of largest populations
  // Relatively stable; less affected by upper Fraser conditions
  var chumBaseReturn = 2000000;
  var chumMarineSurv = marineSurvival * 1.05;
  var chumPreHarvest = chumBaseReturn * chumMarineSurv / marineSurvBase;
  var chumPostMortality = chumPreHarvest * (1 - enRouteMortOther * 0.3); // spawn low, less mortality
  var chumHarvestCatch = chumPostMortality * harvestRate * 0.4;
  var chumSpawners = cl(chumPostMortality - chumHarvestCatch, 0, 20000000);
  // Hatchery supplementation significant for chum
  var chumHatcheryFrac = 0.25; // ~25% hatchery origin
  chumSpawners = chumSpawners * (1 + chumHatcheryFrac);
  var chumSmolts = chumSpawners * 2000 * spawningSuccess * 0.85 * spawningSeason;
  chumSmolts = cl(chumSmolts, 0, 200000000);
  var chumReturn = cl(chumSpawners / 1000000, 0, 20);

  // ── 18e. FRASER COHO ──
  // 1+ year freshwater rearing — most habitat-dependent
  // Interior Fraser coho: COSEWIC Endangered
  // Very sensitive to stream quality: pool depth, riparian cover, LWD
  var cohoBaseReturn = 400000;
  var cohoMarineSurv = marineSurvival * 0.9; // slightly lower marine survival
  var cohoPreHarvest = cohoBaseReturn * cohoMarineSurv / marineSurvBase;
  var cohoPostPassage = cohoPreHarvest * bigBarBlockCoho;
  var cohoPostMortality = cohoPostPassage * (1 - enRouteMortOther);
  var cohoHarvestCatch = cohoPostMortality * harvestRate * 0.3; // conservation restrictions on coho
  var cohoSpawners = cl(cohoPostMortality - cohoHarvestCatch, 0, 5000000);
  // Coho rearing: 1 year in freshwater → habitat quality critical
  var cohoRearingSurvival = cl(habitatQuality * 0.8 + 0.2, 0.1, 0.8);
  var cohoSmolts = cohoSpawners * 2800 * spawningSuccess * cohoRearingSurvival * spawningSeason;
  cohoSmolts = cl(cohoSmolts * (1 - seaLiceMortality * 1.2), 0, 30000000);
  var cohoReturn = cl(cohoSpawners / 100000, 0, 50);

  // ── AGGREGATE SALMON METRICS ──
  var totalFraserReturn = sockeyeSpawners + chinookSpawners + pinkSpawners + chumSpawners + cohoSpawners;
  var totalFraserSmolts = sockeyeSmolts + chinookSmolts + pinkSmolts + chumSmolts + cohoSmolts;

  // En-route mortality percentage (dramatic indicator)
  var totalPreMort = sockeyePostPassage + chinookPostPassage + pinkPreHarvest + chumPreHarvest + cohoPostPassage;
  var totalPostMort = sockeyePostMortality + chinookPostMortality + pinkPostMortality + chumPostMortality + cohoPostMortality;
  var fraserEnRouteMortPct = totalPreMort > 0 ? cl((1 - totalPostMort / totalPreMort) * 100, 0, 100) : 0;

  // Nutrient cycling: salmon carcasses feed riparian ecosystems
  // ~3 kg N per spawning salmon (Naiman et al. 2002)
  var carcassNitrogen = totalFraserReturn * 3 / 365 * spawningSeason; // kg/day during spawning
  // Add to total nitrogen
  totalNitrogen = totalNitrogen + carcassNitrogen;

  // New salmon state for carry-forward
  var newSalmon = {
    sockeye: { spawners: sockeyeSpawners, smolts: sockeyeSmolts },
    chinook: { spawners: chinookSpawners, smolts: chinookSmolts },
    pink: { spawners: pinkSpawners, smolts: pinkSmolts },
    chum: { spawners: chumSpawners, smolts: chumSmolts },
    coho: { spawners: cohoSpawners, smolts: cohoSmolts },
  };

  // ═══════════════════════════════════════════════════════════
  // FRASER DELTA SUBMARINE GEOHAZARD
  // ═══════════════════════════════════════════════════════════
  // Tracks sediment accumulation on the delta foreslope and computes
  // turbidity current probability. Large failures generate tsunamis.
  // Sources: Lintern et al. NRCan, Rabinovich et al. 2003, Christian et al. 1997
  var prevDeltaSedLoad = _prev.deltaSedimentLoad !== undefined ? _prev.deltaSedimentLoad : 0;
  var prevDeltaStability = _prev.deltaStability !== undefined ? _prev.deltaStability : 0.85;

  // Sediment accumulation on delta foreslope — proportional to discharge and sediment load
  // Hart et al. 1992: Fraser delivers ~17 Mt/yr of sediment, most during freshet
  var deltaAccumRate = cl(sedimentLoad / 3000 * 0.3 + routedDischarge / 8000 * 0.2, 0, 0.5); // quarterly
  var deltaSedimentLoad = cl(prevDeltaSedLoad + deltaAccumRate, 0, 5.0);

  // Stability decreases with sediment loading, gas buildup over time
  // Christian et al. 1997: gas-charged sediments reduce effective stress
  var gasBuildup = cl(deltaSedimentLoad * 0.02, 0, 0.15); // gas accumulation
  var deltaStability = cl(prevDeltaStability - deltaAccumRate * 0.08 - gasBuildup, 0.1, 1.0);

  // Earthquake effect: seismic shaking dramatically reduces stability
  var eqShaking = shocks.earthquake || 0;
  if (eqShaking > 0.3) {
    deltaStability = cl(deltaStability - eqShaking * 0.4, 0.05, 1.0);
  }

  // Turbidity current probability — routine events during freshet
  // Lintern et al.: observed several TC events per year during peak discharge
  var tcProbability = cl(
    (1 - deltaStability) * 0.3 // instability drives probability
    + (routedDischarge > 7000 ? (routedDischarge - 7000) / 5000 * 0.15 : 0) // high freshet
    + eqShaking * 0.2, // earthquake triggers
    0, 0.4);

  // Catastrophic slope failure probability — very rare
  // Rabinovich et al. 2003: major failure produces 4-18m tsunami in Georgia Strait
  var collapseProb = cl(
    (1 - deltaStability) * 0.01 // baseline from instability
    + eqShaking * 0.05 // earthquake dramatically increases risk
    + (deltaSedimentLoad > 3 ? (deltaSedimentLoad - 3) * 0.02 : 0), // overloaded delta
    0, 0.10);

  // Stochastic event generation
  var tcSeed = seededRandom(year * 1000 + quarter * 250 + 88877);
  var tcEvent = tcSeed < tcProbability ? 1 : 0;
  var collapseSeed = seededRandom(year * 1000 + quarter * 250 + 99911);
  var collapseEvent = collapseSeed < collapseProb ? 1 : 0;

  // After failure: sediment load resets, stability partially recovers
  if (collapseEvent) {
    deltaSedimentLoad = cl(deltaSedimentLoad * 0.2, 0, 5); // massive release
    deltaStability = cl(0.5 + seededRandom(year * 1000 + quarter * 250 + 55219) * 0.2, 0.4, 0.8); // partially recovers
  } else if (tcEvent) {
    deltaSedimentLoad = cl(deltaSedimentLoad * 0.7, 0, 5); // partial release
    deltaStability = cl(deltaStability + 0.05, 0.1, 1.0); // slight improvement
  }

  // ═══════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════
  return {
    state: {
      // Discharge (m³/s at Hope)
      discharge: routedDischarge,
      peakDischarge: peakDischarge,
      rawDischarge: rawDischarge,

      // Snowpack (mm SWE per band)
      snowLow: snowLow,
      snowMid: snowMid,
      snowHigh: snowHigh,
      totalSWE: totalSWE,
      totalSnowmelt: totalSnowmelt,

      // Glacier
      glacierMass: glacierMass,
      glacierDischarge: glacierDischarge,
      glacierMeltRate: glacierMeltRate,

      // Freshet
      freshetPulse: freshetPulse,
      freshetMagnitude: freshetMagnitude,
      freshetPeakQ: freshetPeakQ,
      freshetTimingIndex: freshetTimingIndex,
      freshetShiftDays: freshetShiftDays,

      // Nechako
      nechakoDiverted: nechakoDiverted,
      nechakoRestored: nechakoRestored,
      nechakoTempEffect: nechakoTempEffect,

      // Temperature
      waterTemp: waterTemp,
      thermalStressIndex: thermalStressIndex,

      // Groundwater
      groundwaterLevel: gwLevel,
      baseflowDischarge: baseflowDischarge,

      // Pine beetle
      pineBeetleEffect: pineBeetleEffect,
      beetleSnowBoost: beetleSnowBoost,
      beetleRunoffBoost: beetleRunoffBoost,

      // Wildfire
      burnScar: burnScar,
      burnAge: burnAge,
      activeBurnScar: activeBurnScar,
      newFireThisQuarter: newFireThisQuarter,

      // Mining
      miningContam: miningContam,
      tailingsContam: tailingsContam,
      tailingsFailure: tailingsFailure,
      mercuryLegacy: mercuryLegacy,

      // Forestry
      forestrySediment: forestrySediment,
      forestryTempEffect: forestryTempEffect,

      // Agriculture
      agNitrogen: agNitrogen,
      agPhosphorus: agPhosphorus,
      agContam: agContam,

      // Urban
      urbanContam: urbanContam,
      urbanMicroplastics: urbanMicroplastics,

      // Integrated water quality
      sedimentLoad: sedimentLoad,
      totalNitrogen: totalNitrogen,
      totalPhosphorus: totalPhosphorus,
      totalContamIndex: totalContamIndex,
      fraserTurbidity: fraserTurbidity,

      // Band temperatures
      tempLow: tLow,
      tempMid: tMid,
      tempHigh: tHigh,

      // Flow status
      belowMinEcoFlow: routedDischarge < minEcoFlow ? 1 : 0,
      minEcoFlow: minEcoFlow,

      // Fraser salmon
      sockeyeReturn: sockeyeReturn,
      sockeyeSpawners: sockeyeSpawners,
      sockeyeSmolts: sockeyeSmolts,
      sockeyeCycleYear: sockeyeCycleYear,
      sockeyeCycleAmplitude: sockeyeCycleAmplitude,
      chinookReturn: chinookReturn,
      chinookSpawners: chinookSpawners,
      chinookSmolts: chinookSmolts,
      chinookAvailForOrca: chinookAvailForOrca,
      pinkReturn: pinkReturn,
      pinkSpawners: pinkSpawners,
      pinkSmolts: pinkSmolts,
      pinkCycleYear: pinkCycleYear,
      chumReturn: chumReturn,
      chumSpawners: chumSpawners,
      chumSmolts: chumSmolts,
      cohoReturn: cohoReturn,
      cohoSpawners: cohoSpawners,
      cohoSmolts: cohoSmolts,
      totalFraserReturn: totalFraserReturn,
      totalFraserSmolts: totalFraserSmolts,
      fraserEnRouteMortPct: fraserEnRouteMortPct,
      enRouteMortSockeye: enRouteMortSockeye,
      marineSurvival: marineSurvival,
      habitatQuality: habitatQuality,
      spawningSuccess: spawningSuccess,
      bigBarPassage: bigBarPassage,

      // Delta geohazard — Lintern et al. NRCan, Rabinovich et al. 2003
      deltaSedimentLoad: deltaSedimentLoad, // cumulative sediment on foreslope (normalized 0-5)
      deltaStability: deltaStability, // foreslope stability (0=unstable, 1=stable)
      tcProbability: tcProbability, // turbidity current probability this quarter
      collapseProb: collapseProb, // catastrophic failure probability this quarter
      tcEvent: tcEvent, // 1 if turbidity current occurred this quarter
      collapseEvent: collapseEvent, // 1 if catastrophic collapse occurred
    },

    // Carry-forward state for next quarter
    _carry: {
      snowLow: snowLow,
      snowMid: snowMid,
      snowHigh: snowHigh,
      glacierMass: glacierMass,
      groundwaterLevel: gwLevel,
      routedFlow: routedDischarge,
      burnScar: burnScar,
      burnAge: burnAge,
      tailingsContam: tailingsContam,
      salmon: newSalmon,
      deltaSedimentLoad: deltaSedimentLoad,
      deltaStability: deltaStability,
    },

    // Exports for downstream coupling (orchestrator spreads these into coupling object)
    exports: {
      // Discharge
      fraserDischarge: routedDischarge,
      fraserPeakDischarge: peakDischarge,
      fraserBelowMinFlow: routedDischarge < minEcoFlow ? 1 : 0,

      // Temperature
      fraserWaterTemp: waterTemp,
      fraserThermalStress: thermalStressIndex,

      // Freshet / snowpack / glacier
      fraserFreshetPulse: freshetPulse,
      fraserGlacierMass: glacierMass,
      fraserSWE: totalSWE,

      // Water quality (for computeMarineBasins coupling)
      fraserSediment: sedimentLoad,
      fraserTurbidity: fraserTurbidity,
      fraserNitrogen: totalNitrogen,
      fraserPhosphorus: totalPhosphorus,
      fraserContamIndex: totalContamIndex,
      fraserMicroplastics: urbanMicroplastics,

      // Land disturbance indicators
      fraserBurnScar: activeBurnScar,
      fraserPineBeetleEffect: pineBeetleEffect,
      fraserTailingsContam: tailingsContam,

      // Salmon (for computeEcosystem coupling)
      fraserSockeyeReturn: sockeyeReturn,
      fraserChinookAvail: chinookAvailForOrca,
      fraserPinkReturn: pinkReturn,
      fraserChumReturn: chumReturn,
      fraserCohoReturn: cohoReturn,
      fraserTotalSalmon: cl(totalFraserReturn / 1000000, 0, 100), // millions
      fraserSmoltProduction: cl(totalFraserSmolts / 1000000, 0, 500), // millions
      fraserEnRouteMortality: fraserEnRouteMortPct,
      // Delta geohazard exports for marine/infrastructure modules
      fraserDeltaTCEvent: tcEvent,
      fraserDeltaCollapseEvent: collapseEvent,
      fraserDeltaStability: deltaStability,
      fraserDeltaTurbidityPulse: tcEvent ? 0.4 : collapseEvent ? 1.0 : 0,
    },
  };
}
