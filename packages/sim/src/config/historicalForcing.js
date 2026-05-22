// ═══════════════════════════════════════════════════════════
// HISTORICAL FORCING — Real climate/event data 2010-2025
// ═══════════════════════════════════════════════════════════
// Enables hindcasting: run the model against known history to assess skill.
// Sources: NOAA CPC (ONI), NOAA NCEI (PDO), Bond et al. 2015 (Blob),
// WSDOT/USGS/EC (events). All values are annual means or event dates.

// ENSO ONI values (annual mean, °C anomaly)
// Source: NOAA CPC Climate Prediction Center ONI time series
export const ENSO_HISTORY = {
  2010: -1.4, 2011: -0.8, 2012: 0.0, 2013: -0.2, 2014: 0.2,
  2015: 1.6,  2016: -0.5, 2017: -0.4, 2018: 0.4,  2019: 0.2,
  2020: -0.8, 2021: -0.7, 2022: -0.8, 2023: 1.2,  2024: 0.6, 2025: 0.0,
};

// PDO monthly index (annual mean)
// Source: NOAA NCEI ERSST v5 PDO
export const PDO_HISTORY = {
  2010: -0.8, 2011: -1.2, 2012: -0.5, 2013: 0.2,  2014: 0.9,
  2015: 1.8,  2016: 1.0,  2017: 0.2,  2018: 0.4,  2019: -0.1,
  2020: 0.1,  2021: -0.3, 2022: -0.2, 2023: 0.7,  2024: 0.3, 2025: 0.0,
};

// Marine Heat Wave events
// Source: Bond et al. 2015, Hobday et al. 2018, NOAA MHW tracker
export const MHW_HISTORY = [
  { startYear: 2014, startMonth: 1, endYear: 2016, endMonth: 6, peakAnomaly: 2.5, name: 'The Blob' },
  { startYear: 2019, startMonth: 7, endYear: 2019, endMonth: 10, peakAnomaly: 1.2, name: 'Moderate MHW' },
  { startYear: 2021, startMonth: 6, endYear: 2021, endMonth: 7, peakAnomaly: 3.5, name: 'PNW Heat Dome' },
];

// Major events timeline
export const EVENTS_HISTORY = [
  { year: 2012, month: 9,  type: 'dam_removal', desc: 'Elwha dam removal complete', basin: 'juanDeFuca' },
  { year: 2014, month: 3,  type: 'landslide', desc: 'Oso landslide (SR-530)', magnitude: 0.9 },
  { year: 2017, month: 8,  type: 'smoke', desc: 'Severe wildfire smoke season', intensity: 0.8 },
  { year: 2018, month: 7,  type: 'orca_event', desc: 'J35 Talequah carries dead calf 17 days' },
  { year: 2017, month: 2,  type: 'wastewater_failure', desc: 'West Point WWTP catastrophic flooding — months of raw sewage into Elliott Bay. Duwamish/Muckleshoot waters contaminated.', magnitude: 0.8 },
  { year: 2019, month: 6,  type: 'landslide', desc: 'Big Bar landslide on Fraser River — blocked salmon migration. Nlaka\'pamux, Secwepemc, St\'at\'imc nations affected.', magnitude: 0.7 },
  { year: 2019, month: 9,  type: 'salmon_collapse', desc: 'Fraser sockeye collapse (~300K return, lowest on record). Tribal treaty fisheries closed. Lummi, Tulalip, Muckleshoot devastated.' },
  { year: 2020, month: 3,  type: 'covid', desc: 'COVID-19 reduced vessel traffic 30-50%. Orca foraging efficiency improved (less noise). Tribal communities disproportionately affected.' },
  { year: 2021, month: 6,  type: 'heat_dome', desc: 'PNW heat dome — record temperatures (49.6\u00B0C Lytton BC). Billion shellfish killed. Fraser salmon die-offs. Tribal shellfish harvest devastated.', intensity: 1.0 },
  { year: 2021, month: 11, type: 'atmospheric_river', desc: 'BC AR destroys Highway 1, Sumas flood. Nooksack delta inundated.', intensity: 1.0 },
  { year: 2023, month: 1,  type: 'enso', desc: 'Strong El Nino develops' },
  { year: 2023, month: 7,  type: 'pink_record', desc: 'Record Puget Sound pink salmon return (~7.2M). Treaty harvest strong for Lummi, Tulalip.' },
  { year: 2026, month: 3,  type: 'landslide', desc: 'I-5 Chuckanut landslide MP 248-249', magnitude: 0.6 },
];

// Annual mean wind speed (m/s) at NOAA NDBC Station 46088 (New Dungeness)
// Source: NDBC historical data, Smith Island/New Dungeness buoy
// Higher wind → more mixing → higher deep DO (breaks stratification)
export const WIND_HISTORY = {
  2010: 4.8, 2011: 4.6, 2012: 5.0, 2013: 4.7, 2014: 4.3,
  2015: 4.1, 2016: 4.5, 2017: 4.8, 2018: 4.6, 2019: 4.4,
  2020: 4.2, 2021: 4.0, 2022: 4.5, 2023: 4.7, 2024: 4.6, 2025: 4.5,
};

// ── FRASER BASIN PRECIPITATION ANOMALY (multiplier, 1.0 = mean) ──
// Source: WSC 08MH024 (Hope gauge) annual discharge anomalies used as proxy
// for basin-integrated precipitation. High discharge years = high precip.
// Derived: divide observed annual discharge by long-term mean (2800 m³/s)
// to get precipitation multiplier. Not pure precip but captures the
// integrated basin water balance that drives discharge variability.
// Confidence: MEDIUM — discharge is precipitation's integral, not precipitation itself
export const FRASER_PRECIP_HISTORY = {
  2010: 1.02, 2011: 1.11, 2012: 1.18, 2013: 1.04, 2014: 0.98,
  2015: 0.79, 2016: 0.95, 2017: 1.00, 2018: 1.07, 2019: 0.96,
  2020: 1.14, 2021: 0.93, 2022: 1.04, 2023: 0.98, 2024: 1.00, 2025: 0.96,
};

// ── PS CHINOOK RECOVERY INDEX (multiplier on baseline spawner capacity) ──
// Source: WDFW SPI Escapement database (data.wa.gov) — natural-origin spawners
// PS Chinook have been *increasing* since ~2012 due to:
//   - Elwha dam removal (2012): +1-2K spawners by 2018 (Duda et al. 2021)
//   - Hatchery supplementation & harvest reductions (NOAA 2007 Recovery Plan)
//   - Floodplain reconnection (Skagit, Nooksack, Nisqually)
// This trajectory is OPPOSITE to Fraser sockeye decline.
// Multiplier: 1.0 = 2010 baseline (~6.4K spawners), 1.7 = 2022 peak (~13.1K)
// Confidence: HIGH — WDFW census data with known management drivers
export const CHINOOK_RECOVERY_HISTORY = {
  2010: 1.00, 2011: 0.84, 2012: 1.38, 2013: 1.14, 2014: 0.97,
  2015: 1.33, 2016: 1.58, 2017: 1.47, 2018: 1.25, 2019: 1.20,
  2020: 1.55, 2021: 1.61, 2022: 2.05, 2023: 1.61, 2024: 1.81, 2025: 1.56,
};

// ── REGIONAL TRADE VOLUME (multiplier on baseline TEU, 1.0 = 3500K TEU) ──
// Source: NWSA cargo statistics (nwseaportalliance.com), VFPA annual reports
// Combined NWSA + Vancouver TEU, normalized to ~3500K baseline.
// Captures: COVID (2020 -12%), supply chain crisis (2022-2023 -10-15%),
// 2024 recovery (+12%), trade war impacts, ILWU slowdowns.
// Confidence: HIGH — published port authority statistics
export const TRADE_VOLUME_HISTORY = {
  2010: 1.00, 2011: 1.00, 2012: 1.00, 2013: 1.00, 2014: 0.97,
  2015: 1.01, 2016: 1.03, 2017: 1.06, 2018: 1.09, 2019: 1.08,
  2020: 0.95, 2021: 1.07, 2022: 0.97, 2023: 0.85, 2024: 0.95, 2025: 0.97,
};

// SSP forcing override for hindcast (observed warming, not projected)
// Source: NOAA ESRL global mean temperature anomaly
export const SST_ANOMALY_HISTORY = {
  2010: 0.0, 2011: 0.0, 2012: 0.05, 2013: 0.08, 2014: 0.15,
  2015: 0.30, 2016: 0.35, 2017: 0.25, 2018: 0.20, 2019: 0.25,
  2020: 0.30, 2021: 0.30, 2022: 0.28, 2023: 0.40, 2024: 0.45, 2025: 0.42,
};

// ── HOUSING STARTS (US national, thousands SAAR, annual mean) ──
// Source: U.S. Census Bureau and U.S. Department of Housing and Urban Development,
// Total Housing Starts (HOUST). Retrieved via FRED, Federal Reserve Bank of St. Louis.
// https://fred.stlouisfed.org/series/HOUST
// Monthly source data aggregated to calendar-year mean for annual hindcast resolution.
// Captures: 2010 post-crisis trough, 2012-2019 recovery, 2020 COVID dip + rebound,
// 2021-2022 boom (rate-driven), 2023-2024 cooldown (rate-spike-driven).
// Confidence: HIGH — FRED-canonical Census/HUD published series.
export const HOUSING_HISTORY = {
  2010: 590,  2011: 610,  2012: 780,  2013: 930,  2014: 1000,
  2015: 1110, 2016: 1180, 2017: 1210, 2018: 1250, 2019: 1290,
  2020: 1380, 2021: 1610, 2022: 1550, 2023: 1420, 2024: 1370, 2025: 1380,
};

// ── 30-YEAR FIXED MORTGAGE AVERAGE (%, annual mean) ──
// Source: Freddie Mac, 30-Year Fixed Rate Mortgage Average in the United States
// (MORTGAGE30US). Retrieved via FRED, Federal Reserve Bank of St. Louis.
// https://fred.stlouisfed.org/series/MORTGAGE30US
// Weekly source data aggregated to calendar-year mean for annual hindcast resolution.
// Methodology change 2022-11-17: pre-change was Primary Mortgage Market Survey
// (PMMS) lender survey; post-change is Loan Product Advisor application data.
// FRED treats series as continuous; hindcast accepts continuity as a known caveat.
// Captures: 2010-2019 historic-low era, 2020-2021 ZIRP trough (~3.0%), 2022-2024
// rate-spike (mortgage > 6%), partial 2025 normalization.
// Confidence: HIGH — FRED-canonical Freddie Mac published series.
export const MORTGAGE_HISTORY = {
  2010: 4.69, 2011: 4.45, 2012: 3.66, 2013: 3.98, 2014: 4.17,
  2015: 3.85, 2016: 3.65, 2017: 3.99, 2018: 4.54, 2019: 3.94,
  2020: 3.11, 2021: 2.96, 2022: 5.34, 2023: 6.80, 2024: 6.72, 2025: 6.50,
};
