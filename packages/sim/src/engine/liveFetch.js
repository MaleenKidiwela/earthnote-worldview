// ═══════════════════════════════════════════════════════════
// LIVE DATA FETCHING — Real-time observations from the Salish Sea region
// ═══════════════════════════════════════════════════════════
// Sources: NOAA CO-OPS, USGS NWIS, NOAA NDBC, NANOOS ERDDAP,
// NOAA NWS, NOAA CPC (ENSO/PDO), Environment Canada, AirNow,
// WSDOT, WSF, SNOTEL, DART, DOH, NSF OOI, ONC VENUS/NEPTUNE
// CORS-blocked endpoints are routed through a serverless proxy function
// when deployed (Cloudflare Pages Functions at /api/proxy).
// On localhost, Vite dev server proxy handles CORS-blocked domains.
// ES5 convention (engine file). export/async required for module loading.

// ── CORS Proxy helper ──
// On deployment: route through /api/proxy?url=ENCODED (Cloudflare Pages Function)
// On localhost: route through Vite dev server proxy (/proxy/*)
// Direct: for endpoints with native CORS headers (USGS, NOAA CO-OPS)
var _isLocalhost = (typeof window !== 'undefined') &&
  window.location && window.location.hostname &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

var _isDeployed = (typeof window !== 'undefined') &&
  window.location && window.location.hostname &&
  !_isLocalhost;

// Map of CORS-blocked domains → Vite dev proxy path prefixes
var _devProxyMap = [
  { domain: 'www.ndbc.noaa.gov', prefix: '/proxy/ndbc', origin: 'https://www.ndbc.noaa.gov' },
  { domain: 'www.cpc.ncep.noaa.gov', prefix: '/proxy/cpc', origin: 'https://www.cpc.ncep.noaa.gov' },
  { domain: 'www.ncei.noaa.gov', prefix: '/proxy/ncei', origin: 'https://www.ncei.noaa.gov' },
  { domain: 'wcc.sc.egov.usda.gov', prefix: '/proxy/snotel', origin: 'https://wcc.sc.egov.usda.gov' },
  { domain: 'www.cbr.washington.edu', prefix: '/proxy/cbr', origin: 'https://www.cbr.washington.edu' },
  { domain: 'wateroffice.ec.gc.ca', prefix: '/proxy/envcan', origin: 'https://wateroffice.ec.gc.ca' },
  { domain: 'erddap.dataexplorer.oceanobservatories.org', prefix: '/proxy/ooi', origin: 'https://erddap.dataexplorer.oceanobservatories.org' },
  { domain: 'data.oceannetworks.ca', prefix: '/proxy/onc', origin: 'https://data.oceannetworks.ca' },
  { domain: 'data.nanoos.org', prefix: '/proxy/nanoos', origin: 'https://data.nanoos.org' },
];

// ── API key helpers ──
// Vite injects import.meta.env.VITE_* at build time. Fall back to window globals.
var _env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
var _fredKey = _env.VITE_FRED_API_KEY || (typeof window !== 'undefined' && window.FRED_API_KEY) || '';
var _airnowKey = _env.VITE_AIRNOW_API_KEY || (typeof window !== 'undefined' && window.AIRNOW_API_KEY) || '';
var _wsdotKey = _env.VITE_WSDOT_API_KEY || (typeof window !== 'undefined' && window.WSDOT_API_KEY) || '';
// Debug: verify API keys are present at build time (does NOT log key values)
if (typeof console !== 'undefined') {
  console.log('[liveFetch] API keys present — FRED:', !!_fredKey, ', AirNow:', !!_airnowKey, ', WSDOT:', !!_wsdotKey);
}

export function proxyUrl(rawUrl) {
  if (!rawUrl) return rawUrl;

  // On localhost: use Vite dev proxy for CORS-blocked domains
  if (_isLocalhost) {
    for (var i = 0; i < _devProxyMap.length; i++) {
      var entry = _devProxyMap[i];
      if (rawUrl.indexOf(entry.domain) >= 0) {
        return rawUrl.replace(entry.origin, entry.prefix);
      }
    }
    // Not in proxy map — try direct (works for CORS-enabled endpoints like USGS, NOAA CO-OPS)
    return rawUrl;
  }

  // On deployment (Cloudflare Pages, etc.): use serverless proxy function
  if (_isDeployed) {
    return '/api/proxy?url=' + encodeURIComponent(rawUrl);
  }

  return rawUrl;
}

// Mark a URL as needing proxy (CORS-blocked direct from browser)
function corsUrl(rawUrl) {
  return { _raw: rawUrl, _needsProxy: true };
}

// Domains that send Access-Control-Allow-Origin: * — fetch directly, no proxy needed
var _corsEnabledDomains = [
  'waterservices.usgs.gov',
  'api.tidesandcurrents.noaa.gov',
  'earthquake.usgs.gov',
  'api.weather.gov',
  'volcanoes.usgs.gov',
];

function _needsProxy(url) {
  for (var i = 0; i < _corsEnabledDomains.length; i++) {
    if (url.indexOf(_corsEnabledDomains[i]) >= 0) return false;
  }
  return true;
}

// Resolve a URL value: handles strings, functions, and corsUrl objects.
// On deployment, CORS-blocked URLs route through the proxy; CORS-enabled domains are fetched directly.
function resolveUrl(urlVal) {
  if (!urlVal) return null;
  if (typeof urlVal === 'function') urlVal = urlVal();
  if (!urlVal) return null;
  if (typeof urlVal === 'object' && urlVal._needsProxy) {
    return proxyUrl(urlVal._raw);
  }
  // On deployment: proxy only CORS-blocked domains
  if (_isDeployed && typeof urlVal === 'string' && urlVal.indexOf('https://') === 0 && _needsProxy(urlVal)) {
    return proxyUrl(urlVal);
  }
  return urlVal;
}

// ── Parse helpers ──

// NOAA CO-OPS water temperature
var parseNOAA_SST = function(stationName, basin) {
  return function(data) {
    var d = data && data.data && data.data[0] ? data.data[0] : {};
    return {
      value: parseFloat(d.v), timestamp: d.t,
      unit: '\u00B0C', parameter: 'SST', category: 'ocean',
      modelKey: 'marine.state.sst', basin: basin, stationName: stationName,
    };
  };
};

// NOAA CO-OPS water level
var parseNOAA_WL = function(stationName, basin) {
  return function(data) {
    var d = data && data.data && data.data[0] ? data.data[0] : {};
    return {
      value: parseFloat(d.v), timestamp: d.t,
      unit: 'm', parameter: 'Water Level', category: 'tides',
      modelKey: 'marine.state.waterLevel', basin: basin, stationName: stationName,
    };
  };
};

// NOAA CO-OPS tide predictions
var parseNOAA_Tide = function(stationName, basin) {
  return function(data) {
    var preds = data && data.predictions ? data.predictions : [];
    // Find today's highest predicted tide
    var maxTide = -999;
    var maxTime = null;
    for (var i = 0; i < preds.length; i++) {
      var v = parseFloat(preds[i].v);
      if (v > maxTide) { maxTide = v; maxTime = preds[i].t; }
    }
    var isKingTide = maxTide > 3.5; // 3.5m MLLW = king tide threshold for Seattle
    return {
      value: maxTide > -999 ? maxTide : NaN,
      timestamp: maxTime,
      unit: 'm MLLW', parameter: isKingTide ? 'King Tide!' : 'High Tide', category: 'tides',
      modelKey: 'marine.state.tidePrediction', basin: basin, stationName: stationName,
      isKingTide: isKingTide,
    };
  };
};

// USGS stream gauge — discharge (00060) cfs→m³/s + temperature (00010) °C
var parseUSGS = function(stationName, basin, modelKey) {
  return function(data) {
    var ts = data && data.value && data.value.timeSeries ? data.value.timeSeries : [];
    var discharge = null;
    var temp = null;
    var timestamp = null;
    for (var i = 0; i < ts.length; i++) {
      var paramCode = ts[i].variable && ts[i].variable.variableCode ? ts[i].variable.variableCode[0].value : '';
      var latest = ts[i].values && ts[i].values[0] && ts[i].values[0].value ? ts[i].values[0].value[0] : null;
      if (!latest) continue;
      if (!timestamp) timestamp = latest.dateTime;
      if (paramCode === '00060') {
        discharge = parseFloat(latest.value) * 0.0283168;
      } else if (paramCode === '00010') {
        temp = parseFloat(latest.value);
      }
    }
    return {
      value: discharge, temperature: temp, timestamp: timestamp,
      unit: 'm\u00B3/s', parameter: 'Discharge' + (temp !== null ? ' / ' + temp.toFixed(1) + '\u00B0C' : ''),
      category: 'river', modelKey: modelKey || 'watershed.state.freshwaterDischarge',
      basin: basin, stationName: stationName,
    };
  };
};

// NANOOS ERDDAP — DO, pH, chlorophyll from Puget Sound moorings
var parseNANOOS = function(stationName, basin, primaryParam) {
  return function(data) {
    // ERDDAP tabledap JSON format: { table: { columnNames: [...], rows: [[...], ...] } }
    var tbl = data && data.table ? data.table : null;
    if (!tbl || !tbl.rows || tbl.rows.length === 0) return { value: NaN };
    var cols = tbl.columnNames || [];
    var lastRow = tbl.rows[tbl.rows.length - 1];
    var timeIdx = cols.indexOf('time');
    var oxyIdx = cols.indexOf('oxygen');
    var phIdx = cols.indexOf('pH');

    var val = NaN;
    var unit = '';
    var param = primaryParam;
    if (primaryParam === 'DO' && oxyIdx >= 0) {
      val = parseFloat(lastRow[oxyIdx]);
      unit = 'mg/L';
    } else if (primaryParam === 'pH' && phIdx >= 0) {
      val = parseFloat(lastRow[phIdx]);
      unit = '';
    }

    return {
      value: val,
      timestamp: timeIdx >= 0 ? lastRow[timeIdx] : null,
      unit: unit, parameter: param, category: 'waterQuality',
      modelKey: primaryParam === 'DO' ? 'marine.state.dissolvedOxygen' : 'marine.state.pH',
      basin: basin, stationName: stationName,
    };
  };
};

// NOAA NDBC buoy — space-delimited text, first non-header row is latest
var parseNDBC = function(stationName, basin) {
  return function(text) {
    if (typeof text !== 'string') return { value: NaN };
    var lines = text.split('\n');
    // First two lines are headers (#YY MM DD hh mm ... and #yr mo dy hr mn ...)
    var headerLine = '';
    var dataLine = '';
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#')) {
        headerLine = lines[i].replace(/^#/, '').trim();
      } else if (lines[i].trim()) {
        dataLine = lines[i].trim();
        break;
      }
    }
    if (!dataLine) return { value: NaN };

    var headers = headerLine.split(/\s+/);
    var values = dataLine.split(/\s+/);
    var get = function(name) {
      var idx = headers.indexOf(name);
      if (idx >= 0 && idx < values.length) {
        var v = parseFloat(values[idx]);
        return (v === 999 || v === 99 || v === 9999) ? null : v; // NDBC missing markers
      }
      return null;
    };

    var wtmp = get('WTMP');
    var wvht = get('WVHT');
    var wspd = get('WSPD');
    var atmp = get('ATMP');

    var parts = [];
    if (wtmp !== null) parts.push('SST ' + wtmp.toFixed(1) + '\u00B0C');
    if (wvht !== null) parts.push('Waves ' + wvht.toFixed(1) + 'm');
    if (wspd !== null) parts.push('Wind ' + wspd.toFixed(0) + 'm/s');

    return {
      value: wtmp, // primary value is water temperature
      waveHeight: wvht, windSpeed: wspd, airTemp: atmp,
      timestamp: values.length >= 5 ? values[0] + '-' + values[1] + '-' + values[2] + 'T' + values[3] + ':' + values[4] + 'Z' : null,
      unit: '\u00B0C', parameter: parts.join(', ') || 'Buoy', category: 'ocean',
      modelKey: 'pacific.state.sourceTemp', basin: basin, stationName: stationName,
    };
  };
};

// NOAA NWS weather observation
var parseNWS = function(stationName) {
  return function(data) {
    var props = data && data.properties ? data.properties : {};
    var temp = props.temperature && props.temperature.value;
    var wind = props.windSpeed && props.windSpeed.value;
    var precip = props.precipitationLastHour && props.precipitationLastHour.value;

    var parts = [];
    if (temp !== null && temp !== undefined) parts.push(parseFloat(temp).toFixed(1) + '\u00B0C');
    if (wind !== null && wind !== undefined) parts.push('Wind ' + (parseFloat(wind) * 0.277778).toFixed(0) + 'm/s'); // km/h → m/s
    if (precip !== null && precip !== undefined && precip > 0) parts.push('Precip ' + parseFloat(precip).toFixed(1) + 'mm');

    return {
      value: temp !== null && temp !== undefined ? parseFloat(temp) : NaN,
      windSpeed: wind !== null ? parseFloat(wind) * 0.277778 : null,
      precipitation: precip !== null ? parseFloat(precip) : null,
      timestamp: props.timestamp || null,
      unit: '\u00B0C', parameter: parts.join(', ') || 'Weather', category: 'weather',
      modelKey: 'climate.state.regionalTemp', stationName: stationName,
    };
  };
};

// NOAA CPC ONI (ENSO) — plain text
var parseONI = function(text) {
  if (typeof text !== 'string') return { value: NaN };
  var lines = text.trim().split('\n');
  // Find last non-empty line with numeric data
  for (var i = lines.length - 1; i >= 0; i--) {
    var parts = lines[i].trim().split(/\s+/);
    if (parts.length >= 8) {
      // Format: YEAR SEAS TOTAL CLIM ANOM (last column is anomaly)
      var anom = parseFloat(parts[parts.length - 1]);
      if (!isNaN(anom)) {
        var phase = anom > 0.5 ? 'El Ni\u00F1o' : anom < -0.5 ? 'La Ni\u00F1a' : 'Neutral';
        return {
          value: anom, timestamp: parts[0] + ' ' + parts[1],
          unit: '\u00B0C', parameter: 'ENSO: ' + phase + ' (' + (anom >= 0 ? '+' : '') + anom.toFixed(1) + ')',
          category: 'climate', modelKey: 'climate.state.ensoValue',
          stationName: 'NOAA CPC ONI', phase: phase,
        };
      }
    }
  }
  return { value: NaN };
};

// NOAA PDO index — plain text
var parsePDO = function(text) {
  if (typeof text !== 'string') return { value: NaN };
  var lines = text.trim().split('\n');
  // Find the last line with valid data
  for (var i = lines.length - 1; i >= 0; i--) {
    var parts = lines[i].trim().split(/\s+/);
    // Look for a line that starts with a 4-digit year
    if (parts.length >= 2 && /^\d{4}$/.test(parts[0])) {
      // Find last non-99.99 value in the row (months are columns 1-12)
      for (var j = parts.length - 1; j >= 1; j--) {
        var v = parseFloat(parts[j]);
        if (!isNaN(v) && Math.abs(v) < 10) {
          var phase = v > 0.5 ? 'Warm' : v < -0.5 ? 'Cool' : 'Neutral';
          return {
            value: v, timestamp: parts[0],
            unit: '', parameter: 'PDO: ' + phase + ' (' + (v >= 0 ? '+' : '') + v.toFixed(2) + ')',
            category: 'climate', modelKey: 'climate.state.pdoValue',
            stationName: 'NOAA NCEI PDO', phase: phase,
          };
        }
      }
    }
  }
  return { value: NaN };
};

// AirNow AQI
var parseAirNow = function(locationName) {
  return function(data) {
    if (!Array.isArray(data) || data.length === 0) return { value: NaN };
    // Find PM2.5 observation (most relevant for wildfire smoke)
    var pm25 = null;
    for (var i = 0; i < data.length; i++) {
      if (data[i].ParameterName === 'PM2.5') { pm25 = data[i]; break; }
    }
    if (!pm25) pm25 = data[0]; // fallback to first available
    return {
      value: pm25.AQI !== undefined ? pm25.AQI : NaN,
      timestamp: pm25.DateObserved || null,
      unit: 'AQI', parameter: 'AQI: ' + (pm25.Category ? pm25.Category.Name : ''),
      category: 'airQuality', modelKey: 'climate.state.smokeIndex',
      stationName: locationName,
    };
  };
};

// WSDOT Highway Alerts — I-5 closures validate infrastructure module
// Requires free API key from https://wsdot.wa.gov/traffic/api/
// Set window.WSDOT_API_KEY to enable
var parseWSDOT_Alerts = function(data) {
  if (!Array.isArray(data)) return { value: NaN };
  // Filter for I-5 alerts in Salish Sea corridor (MP 0-280) and SR-11 (Chuckanut)
  var i5Closures = 0;
  var i5Alerts = [];
  var sr11Status = 'open';
  for (var i = 0; i < data.length; i++) {
    var a = data[i];
    var road = (a.StartRoadwayLocation && a.StartRoadwayLocation.RoadName) || '';
    var mp = (a.StartRoadwayLocation && a.StartRoadwayLocation.MilePost) || 0;
    var cat = a.EventCategory || '';
    if (road === 'I-5' && mp <= 280) {
      if (cat === 'Closure') i5Closures++;
      i5Alerts.push({ type: cat, mp: mp, desc: (a.HeadlineDescription || '').slice(0, 80) });
    }
    if (road === 'SR 11' || road === 'SR-11') {
      if (cat === 'Closure') sr11Status = 'closed';
    }
  }
  return {
    value: i5Closures, timestamp: new Date().toISOString(),
    unit: 'closures', parameter: i5Closures > 0 ? i5Closures + ' I-5 closure(s)' : 'I-5 open',
    category: 'infrastructure', modelKey: 'infrastructure.state.i5Status',
    stationName: 'WSDOT I-5 Corridor', i5Alerts: i5Alerts.slice(0, 5), sr11Status: sr11Status,
  };
};

// WSF Ferry vessel positions + route alerts
var parseWSF_Vessels = function(data) {
  if (!Array.isArray(data)) return { value: NaN };
  var active = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i].InService) active++;
  }
  return {
    value: active, timestamp: new Date().toISOString(),
    unit: 'vessels', parameter: active + ' ferries active',
    category: 'infrastructure', modelKey: 'infrastructure.state.ferryReliability',
    stationName: 'WA State Ferries', totalVessels: data.length,
  };
};

var parseWSF_Alerts = function(data) {
  if (!Array.isArray(data)) return { value: NaN };
  var cancelled = [];
  for (var i = 0; i < data.length; i++) {
    var a = data[i];
    if (a.AlertDescription && a.AlertDescription.toLowerCase().indexOf('cancel') >= 0) {
      cancelled.push(a.RouteBriefDescription || a.AlertDescription.slice(0, 50));
    }
  }
  return {
    value: cancelled.length, timestamp: new Date().toISOString(),
    unit: 'routes', parameter: cancelled.length > 0 ? cancelled.length + ' cancelled route(s)' : 'All routes running',
    category: 'infrastructure', modelKey: 'infrastructure.state.ferryReliability',
    stationName: 'WSF Route Alerts', cancelledRoutes: cancelled,
  };
};

// SNOTEL snowpack — CSV format: Date, SWE (in), Snow Depth (in), Avg Temp (F)
var parseSNOTEL = function(stationName) {
  return function(text) {
    if (typeof text !== 'string') return { value: NaN };
    var lines = text.split('\n');
    // Find last data line (skip headers starting with # or non-numeric)
    for (var i = lines.length - 1; i >= 0; i--) {
      var line = lines[i].trim();
      if (!line || line.startsWith('#') || line.startsWith('Date')) continue;
      var cols = line.split(',');
      if (cols.length >= 2) {
        var sweInches = parseFloat(cols[1]);
        if (!isNaN(sweInches)) {
          var sweMm = sweInches * 25.4; // inches → mm
          var snowDepthIn = cols.length >= 3 ? parseFloat(cols[2]) : null;
          var tempF = cols.length >= 4 ? parseFloat(cols[3]) : null;
          var tempC = tempF !== null && !isNaN(tempF) ? (tempF - 32) * 5 / 9 : null;
          var parts = [sweMm.toFixed(0) + 'mm SWE'];
          if (snowDepthIn !== null && !isNaN(snowDepthIn)) parts.push((snowDepthIn * 2.54).toFixed(0) + 'cm depth');
          if (tempC !== null) parts.push(tempC.toFixed(1) + '\u00B0C');
          return {
            value: sweMm, snowDepth: snowDepthIn !== null ? snowDepthIn * 2.54 : null,
            temperature: tempC, timestamp: cols[0],
            unit: 'mm SWE', parameter: parts.join(', '), category: 'snowpack',
            modelKey: 'watershed.state.snowpack', stationName: stationName,
          };
        }
      }
    }
    return { value: NaN };
  };
};

// DART Bonneville Dam adult fish counts — CSV with daily counts
var parseDART = function(text) {
  if (typeof text !== 'string') return { value: NaN };
  var lines = text.split('\n');
  // Find last line with data
  for (var i = lines.length - 1; i >= 0; i--) {
    var line = lines[i].trim();
    if (!line || line.startsWith('Year') || line.startsWith('#') || line.startsWith(',')) continue;
    var cols = line.split(',');
    // Format varies; look for a numeric count
    for (var j = cols.length - 1; j >= 0; j--) {
      var v = parseInt(cols[j], 10);
      if (!isNaN(v) && v >= 0 && v < 100000) {
        var status = v > 0 ? 'active' : 'off-season';
        return {
          value: v, timestamp: cols[0] || null,
          unit: 'fish/day', parameter: v > 0 ? v + ' Chinook/day' : 'Off-season',
          category: 'ecological', modelKey: 'ecosystem.state.salmonRunStrength',
          stationName: 'Bonneville Dam Chinook (DART)', status: status,
        };
      }
    }
  }
  return { value: NaN };
};

// ── Known ecological reference points (not live feeds) ──
// Update annually from Center for Whale Research annual census
// As of Jul 2025: J=27, K=14, L=33, Total=74
// Post-Jul-2025 births (K pod +1, L pod +1 per Dec 2025 Orca Network update) fold
// into Jul 2026 census per CWR annual-census convention.
// Source: https://www.whaleresearch.com/orca-population
export var ORCA_REFERENCE = {
  total: 74, jPod: 27, kPod: 14, lPod: 33,
  censusYear: 2025, source: 'Center for Whale Research annual photo-ID census',
  url: 'https://www.whaleresearch.com/orca-population',
};

// USGS earthquake data — GeoJSON with events in Salish Sea bounding box
var parseUSGS_Earthquakes = function(data) {
  if (!data || !data.features) return { value: NaN };
  var events = data.features;
  var count = events.length;
  var maxMag = 0;
  var significant = [];
  var recent = null;
  var totalDepth = 0;

  for (var i = 0; i < events.length; i++) {
    var props = events[i].properties;
    var geo = events[i].geometry;
    var mag = props.mag || 0;
    var depth = geo && geo.coordinates ? geo.coordinates[2] : 0; // km
    if (mag > maxMag) maxMag = mag;
    totalDepth += depth;
    if (mag >= 3.0) {
      significant.push({ mag: mag, place: props.place, time: props.time, depth: depth,
        lat: geo ? geo.coordinates[1] : 0, lon: geo ? geo.coordinates[0] : 0 });
    }
    if (i === 0) {
      recent = {
        mag: mag, place: props.place || '', time: props.time,
        depth: depth, lat: geo ? geo.coordinates[1] : 0, lon: geo ? geo.coordinates[0] : 0,
      };
    }
  }

  var avgDepth = count > 0 ? totalDepth / count : 0;
  var level = count < 5 && maxMag < 2 ? 'low' : count < 20 && maxMag < 3 ? 'moderate' : maxMag >= 5 ? 'high' : 'elevated';
  var desc = count + ' quakes/30d, max M' + maxMag.toFixed(1);
  if (significant.length > 0) desc += ', ' + significant.length + ' M3.0+';

  return {
    value: count, timestamp: new Date().toISOString(),
    unit: 'events/30d', parameter: desc, category: 'seismic',
    modelKey: 'infrastructure.state.seismicActivity',
    stationName: 'USGS Earthquake Feed',
    count30d: count, maxMag: maxMag, recent: recent, significant: significant,
    seismicActivityLevel: level, avgDepth: avgDepth,
  };
};

// USGS volcano alerts — GeoJSON from USGS Volcano Hazards Program
var parseUSGS_Volcanoes = function(data) {
  if (!data || !data.features) return { value: NaN };
  // Find our 3 volcanoes by name
  var targets = { 'Mount Rainier': 'rainier', 'Mount Baker': 'baker', 'Glacier Peak': 'glacierPeak' };
  var volcanoes = {};
  for (var i = 0; i < data.features.length; i++) {
    var props = data.features[i].properties;
    var name = props.vName || props.name || '';
    for (var tgt in targets) {
      if (name.indexOf(tgt) >= 0) {
        volcanoes[targets[tgt]] = {
          alertLevel: props.alert_level || props.alertLevel || 'Normal',
          colorCode: props.color_code || props.colorCode || 'Green',
          lastUpdate: props.update_time || props.lastUpdate || null,
        };
      }
    }
  }
  var maxAlert = 'Normal';
  var alertOrder = { 'Normal': 0, 'Advisory': 1, 'Watch': 2, 'Warning': 3 };
  for (var vk in volcanoes) {
    if ((alertOrder[volcanoes[vk].alertLevel] || 0) > (alertOrder[maxAlert] || 0)) {
      maxAlert = volcanoes[vk].alertLevel;
    }
  }
  var desc = 'Volcanoes: ' + maxAlert;
  return {
    value: alertOrder[maxAlert] || 0, timestamp: new Date().toISOString(),
    unit: '', parameter: desc, category: 'volcanic',
    modelKey: 'disaster.volcanoAlert',
    stationName: 'USGS CVO Volcanoes',
    volcanoes: volcanoes, maxAlertLevel: maxAlert,
  };
};

// USGS enhanced water quality — parse multiple parameters from NWIS
var parseUSGS_WQ = function(stationName, basin) {
  return function(data) {
    var ts = data && data.value && data.value.timeSeries ? data.value.timeSeries : [];
    var result = { stationName: stationName, basin: basin };
    var primaryValue = null;
    var parts = [];

    for (var i = 0; i < ts.length; i++) {
      var paramCode = ts[i].variable && ts[i].variable.variableCode ? ts[i].variable.variableCode[0].value : '';
      var latest = ts[i].values && ts[i].values[0] && ts[i].values[0].value ? ts[i].values[0].value[0] : null;
      if (!latest) continue;
      var val = parseFloat(latest.value);
      if (isNaN(val) || val < 0) continue;

      if (paramCode === '00300') { // DO mg/L
        result.dissolvedOxygen = val;
        parts.push('DO ' + val.toFixed(1) + ' mg/L');
        if (primaryValue === null) primaryValue = val;
      } else if (paramCode === '00400') { // pH
        result.pH = val;
        parts.push('pH ' + val.toFixed(2));
      } else if (paramCode === '63680') { // Turbidity FNU
        result.turbidity = val;
        parts.push('Turb ' + val.toFixed(0) + ' FNU');
      } else if (paramCode === '00095') { // Specific conductance µS/cm
        result.conductance = val;
        parts.push('SC ' + val.toFixed(0) + ' \u00B5S/cm');
      }
    }

    return {
      value: primaryValue !== null ? primaryValue : NaN,
      timestamp: new Date().toISOString(),
      unit: 'mg/L', parameter: parts.join(', ') || 'Water Quality',
      category: 'waterQuality', modelKey: 'watershed.state.riverDO',
      basin: basin, stationName: stationName,
      dissolvedOxygen: result.dissolvedOxygen, pH: result.pH,
      turbidity: result.turbidity, conductance: result.conductance,
    };
  };
};

// USGS streamflow percentile — daily statistics
var parseUSGS_Percentile = function(stationName, basin) {
  return function(data) {
    // Stats API returns complex structure — extract the percentile for current day
    var ts = data && data.value && data.value.timeSeries ? data.value.timeSeries : [];
    if (ts.length === 0) return { value: NaN };

    // Find the current discharge value and its percentile
    var currentQ = null;
    var p50 = null; // median
    for (var i = 0; i < ts.length; i++) {
      var statCode = ts[i].variable && ts[i].variable.options && ts[i].variable.options.option
        ? ts[i].variable.options.option[0].value : '';
      var latest = ts[i].values && ts[i].values[0] && ts[i].values[0].value ? ts[i].values[0].value[0] : null;
      if (!latest) continue;
      var val = parseFloat(latest.value) * 0.0283168; // cfs → m³/s
      if (statCode === '00003') p50 = val; // mean
    }

    // Estimate percentile from current vs median
    var pct = p50 && currentQ ? Math.round((currentQ / p50) * 50) : 50;
    var status = pct < 25 ? 'low' : pct < 75 ? 'normal' : pct < 90 ? 'high' : 'flood';

    return {
      value: pct, timestamp: new Date().toISOString(),
      unit: '%ile', parameter: 'Flow: ' + status + ' (' + pct + 'th %ile)',
      category: 'river', modelKey: 'watershed.state.flowPercentile',
      basin: basin, stationName: stationName,
      percentile: pct, historicalMedian: p50, flowStatus: status,
    };
  };
};

// ═══════════════════════════════════════════════════════════
// ENDPOINT REGISTRY
// ═══════════════════════════════════════════════════════════

export var LIVE_ENDPOINTS = [
  // ════ OCEAN — NOAA CO-OPS SST ════
  { id: 'noaa_fridayharbor_sst', name: 'Friday Harbor SST', category: 'ocean',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9449880&product=water_temperature&units=metric&time_zone=gmt&format=json',
    lat: 48.5453, lon: -123.0125, parse: parseNOAA_SST('Friday Harbor (NOAA 9449880)', 'sanjuan') },
  { id: 'noaa_neahbay_sst', name: 'Neah Bay SST', category: 'ocean',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9443090&product=water_temperature&units=metric&time_zone=gmt&format=json',
    lat: 48.3707, lon: -124.6016, parse: parseNOAA_SST('Neah Bay (NOAA 9443090)', 'juanDeFuca') },
  { id: 'noaa_portangeles_sst', name: 'Port Angeles SST', category: 'ocean',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9444090&product=water_temperature&units=metric&time_zone=gmt&format=json',
    lat: 48.125, lon: -123.44, parse: parseNOAA_SST('Port Angeles (NOAA 9444090)', 'juanDeFuca') },
  { id: 'noaa_porttownsend_sst', name: 'Port Townsend SST', category: 'ocean',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9444900&product=water_temperature&units=metric&time_zone=gmt&format=json',
    lat: 48.1112, lon: -122.7597, parse: parseNOAA_SST('Port Townsend (NOAA 9444900)', 'sanjuan') },
  { id: 'noaa_tacoma_sst', name: 'Tacoma SST', category: 'ocean',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9446484&product=water_temperature&units=metric&time_zone=gmt&format=json',
    lat: 47.2667, lon: -122.4133, parse: parseNOAA_SST('Tacoma (NOAA 9446484)', 'mainBasin') },
  { id: 'noaa_seattle_sst', name: 'Seattle SST', category: 'ocean',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9447130&product=water_temperature&units=metric&time_zone=gmt&format=json',
    lat: 47.6027, lon: -122.3387, parse: parseNOAA_SST('Seattle (NOAA 9447130)', 'mainBasin') },

  // ════ OCEAN — NOAA CO-OPS Water Level ════
  { id: 'noaa_seattle_wl', name: 'Seattle Water Level', category: 'ocean',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9447130&product=water_level&datum=MLLW&units=metric&time_zone=gmt&format=json',
    lat: 47.6027, lon: -122.3387, parse: parseNOAA_WL('Seattle WL (NOAA 9447130)', 'mainBasin') },
  { id: 'noaa_cherrypoint_wl', name: 'Cherry Point WL', category: 'ocean',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9449424&product=water_level&datum=MLLW&units=metric&time_zone=gmt&format=json',
    lat: 48.8627, lon: -122.7582, parse: parseNOAA_WL('Cherry Point WL (NOAA 9449424)', 'georgia') },

  // ════ OCEAN — NOAA NDBC Offshore Buoys ════
  { id: 'ndbc_46087', name: 'NDBC Neah Bay Offshore', category: 'ocean',
    url: corsUrl('https://www.ndbc.noaa.gov/data/realtime2/46087.txt'),
    lat: 48.49, lon: -124.73, responseType: 'text',
    parse: parseNDBC('Neah Bay Offshore (NDBC 46087)', 'juanDeFuca') },
  { id: 'ndbc_46041', name: 'NDBC Cape Elizabeth', category: 'ocean',
    url: corsUrl('https://www.ndbc.noaa.gov/data/realtime2/46041.txt'),
    lat: 47.35, lon: -124.73, responseType: 'text',
    parse: parseNDBC('Cape Elizabeth (NDBC 46041)', 'juanDeFuca') },
  { id: 'ndbc_46029', name: 'NDBC Columbia River Bar', category: 'ocean',
    url: corsUrl('https://www.ndbc.noaa.gov/data/realtime2/46029.txt'),
    lat: 46.16, lon: -124.51, responseType: 'text',
    parse: parseNDBC('Columbia River Bar (NDBC 46029)', null) },

  // ════ TIDES — NOAA Predictions ════
  { id: 'noaa_seattle_tide', name: 'Seattle Tide Prediction', category: 'tides',
    url: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=9447130&product=predictions&datum=MLLW&units=metric&time_zone=lst_lke&format=json',
    lat: 47.6027, lon: -122.3387, parse: parseNOAA_Tide('Seattle Tide (NOAA 9447130)', 'mainBasin') },

  // ════ WATER QUALITY — NANOOS ERDDAP ════
  // NANOOS moorings — may be CORS-blocked; fails gracefully
  { id: 'nanoos_twanoh_do', name: 'NANOOS Twanoh DO', category: 'waterQuality',
    url: corsUrl('https://data.nanoos.org/erddap/tabledap/NANOOS_twanoh_nut_ct.json?time,oxygen,pH&time>=now-1day&orderBy(%22time%22)'),
    lat: 47.375, lon: -123.008, parse: parseNANOOS('Twanoh DO (NANOOS)', 'hoodCanal', 'DO') },
  { id: 'nanoos_twanoh_ph', name: 'NANOOS Twanoh pH', category: 'waterQuality',
    url: corsUrl('https://data.nanoos.org/erddap/tabledap/NANOOS_twanoh_nut_ct.json?time,oxygen,pH&time>=now-1day&orderBy(%22time%22)'),
    lat: 47.375, lon: -123.008, parse: parseNANOOS('Twanoh pH (NANOOS)', 'hoodCanal', 'pH') },
  { id: 'nanoos_dabob_do', name: 'NANOOS Dabob Bay DO', category: 'waterQuality',
    url: corsUrl('https://data.nanoos.org/erddap/tabledap/NANOOS_dabob_nut_ct.json?time,oxygen&time>=now-1day&orderBy(%22time%22)'),
    lat: 47.80, lon: -122.81, parse: parseNANOOS('Dabob Bay DO (NANOOS)', 'hoodCanal', 'DO') },
  { id: 'nanoos_pointwells_do', name: 'NANOOS Pt Wells DO', category: 'waterQuality',
    url: corsUrl('https://data.nanoos.org/erddap/tabledap/NANOOS_point_wells_nut_ct.json?time,oxygen,pH&time>=now-1day&orderBy(%22time%22)'),
    lat: 47.77, lon: -122.40, parse: parseNANOOS('Point Wells DO (NANOOS)', 'mainBasin', 'DO') },

  // ════ RIVER GAUGES — USGS ════
  { id: 'usgs_skagit', name: 'Skagit River', category: 'river',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12200500&parameterCd=00060,00010&period=P1D',
    lat: 48.4201, lon: -122.3358, parse: parseUSGS('Skagit at Mt Vernon (USGS 12200500)', 'whidbey', 'watershed.state.freshwaterDischarge') },
  { id: 'usgs_snohomish', name: 'Snohomish River', category: 'river',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12150800&parameterCd=00060,00010&period=P1D',
    lat: 47.8554, lon: -122.1763, parse: parseUSGS('Snohomish at Monroe (USGS 12150800)', 'whidbey') },
  { id: 'usgs_nooksack', name: 'Nooksack River', category: 'river',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12213100&parameterCd=00060,00010&period=P1D',
    lat: 48.8423, lon: -122.5969, parse: parseUSGS('Nooksack at Ferndale (USGS 12213100)', 'georgia') },
  { id: 'usgs_puyallup', name: 'Puyallup River', category: 'river',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12101500&parameterCd=00060,00010&period=P1D',
    lat: 47.2029, lon: -122.4002, parse: parseUSGS('Puyallup at Puyallup (USGS 12101500)', 'mainBasin') },
  { id: 'usgs_nisqually', name: 'Nisqually River', category: 'river',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12089500&parameterCd=00060,00010&period=P1D',
    lat: 46.9168, lon: -122.6812, parse: parseUSGS('Nisqually nr McKenna (USGS 12089500)', 'southSound') },
  { id: 'usgs_stillaguamish', name: 'Stillaguamish River', category: 'river',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12167000&parameterCd=00060,00010&period=P1D',
    lat: 48.1923, lon: -122.1785, parse: parseUSGS('Stillaguamish nr Arlington (USGS 12167000)', 'whidbey') },

  // ════ RIVER — Fraser at Hope (Environment Canada) ════
  // WSC real-time CSV — likely CORS-blocked from browser
  { id: 'ec_fraser_hope', name: 'Fraser at Hope', category: 'river',
    url: (function() {
      var d = new Date();
      var raw = 'https://wateroffice.ec.gc.ca/services/real_time_data/csv/inline?stations[]=08MF005&parameters[]=47&start_date=' +
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      return corsUrl(raw);
    })(),
    lat: 49.3808, lon: -121.4519, responseType: 'text',
    parse: function(data) {
      var lines = typeof data === 'string' ? data.split('\n') : [];
      var lastDataLine = null;
      for (var i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('ID')) {
          lastDataLine = lines[i]; break;
        }
      }
      if (!lastDataLine) return { value: NaN };
      var cols = lastDataLine.split(',');
      return {
        value: cols.length >= 4 ? parseFloat(cols[3]) : NaN,
        timestamp: cols.length >= 2 ? cols[1] : null,
        unit: 'm\u00B3/s', parameter: 'Discharge', category: 'river',
        modelKey: 'fraser.state.discharge', basin: 'georgia',
        stationName: 'Fraser at Hope (EC 08MF005)',
      };
    },
  },

  // ════ CLIMATE INDICES — ENSO and PDO ════
  { id: 'noaa_oni', name: 'ENSO ONI Index', category: 'climate',
    url: corsUrl('https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt'),
    lat: 0, lon: -170, responseType: 'text', parse: parseONI },
  { id: 'noaa_pdo', name: 'PDO Index', category: 'climate',
    url: corsUrl('https://www.ncei.noaa.gov/pub/data/cmb/ersst/v5/index/ersst.v5.pdo.dat'),
    lat: 45, lon: -140, responseType: 'text', parse: parsePDO },

  // ════ WEATHER — NOAA NWS ════
  // Free public API — requires User-Agent header
  { id: 'nws_seatac', name: 'SeaTac Weather', category: 'weather',
    url: 'https://api.weather.gov/stations/KSEA/observations/latest',
    lat: 47.4502, lon: -122.3088, headers: { 'User-Agent': 'SalishSeaDigitalCousin/1.0 (educational)' },
    parse: parseNWS('SeaTac (NWS KSEA)') },
  { id: 'nws_bellingham', name: 'Bellingham Weather', category: 'weather',
    url: 'https://api.weather.gov/stations/KBLI/observations/latest',
    lat: 48.7929, lon: -122.5375, headers: { 'User-Agent': 'SalishSeaDigitalCousin/1.0 (educational)' },
    parse: parseNWS('Bellingham (NWS KBLI)') },

  // ════ AIR QUALITY — AirNow ════
  // Requires free API key from airnowapi.org — set window.AIRNOW_API_KEY or skip
  // To get a key: https://docs.airnowapi.org/account/request/
  { id: 'airnow_seattle', name: 'Seattle AQI', category: 'airQuality',
    url: function() {
      var key = _airnowKey;
      if (!key) return null;
      return 'https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=47.6&longitude=-122.3&distance=50&API_KEY=' + key;
    },
    lat: 47.6062, lon: -122.3321, parse: parseAirNow('Seattle AQI (AirNow)') },
  { id: 'airnow_bellingham', name: 'Bellingham AQI', category: 'airQuality',
    url: function() {
      var key = _airnowKey;
      if (!key) return null;
      return 'https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=48.75&longitude=-122.48&distance=50&API_KEY=' + key;
    },
    lat: 48.7519, lon: -122.4787, parse: parseAirNow('Bellingham AQI (AirNow)') },
  { id: 'airnow_tacoma', name: 'Tacoma AQI', category: 'airQuality',
    url: function() {
      var key = _airnowKey;
      if (!key) return null;
      return 'https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=47.25&longitude=-122.44&distance=50&API_KEY=' + key;
    },
    lat: 47.2529, lon: -122.4443, parse: parseAirNow('Tacoma AQI (AirNow)') },

  // ════ INFRASTRUCTURE — WSDOT Road Closures ════
  // Requires free API key from https://wsdot.wa.gov/traffic/api/
  // Set window.WSDOT_API_KEY to enable
  { id: 'wsdot_i5_alerts', name: 'I-5 Corridor Alerts', category: 'infrastructure',
    url: function() {
      var key = _wsdotKey;
      if (!key) return null;
      return 'https://www.wsdot.wa.gov/Traffic/api/HighwayAlerts/HighwayAlertsREST.svc/GetAlertsAsJson?AccessCode=' + key;
    },
    lat: 48.25, lon: -122.45, parse: parseWSDOT_Alerts },

  // ════ INFRASTRUCTURE — WA State Ferries ════
  // Uses same WSDOT API key
  { id: 'wsf_vessels', name: 'WSF Active Vessels', category: 'infrastructure',
    url: function() {
      var key = _wsdotKey;
      if (!key) return null;
      return 'https://www.wsdot.wa.gov/Ferries/API/vessels/rest/vessellocations?apiaccesscode=' + key;
    },
    lat: 47.62, lon: -122.50, parse: parseWSF_Vessels },
  { id: 'wsf_alerts', name: 'WSF Route Alerts', category: 'infrastructure',
    url: function() {
      var key = _wsdotKey;
      if (!key) return null;
      return 'https://www.wsdot.wa.gov/Ferries/API/schedule/rest/alerts?apiaccesscode=' + key;
    },
    lat: 47.62, lon: -122.50, parse: parseWSF_Alerts },

  // ════ SNOWPACK — USDA SNOTEL ════
  // Real-time SWE from Cascade Range stations
  { id: 'snotel_stevens', name: 'Stevens Pass SNOTEL', category: 'snowpack',
    url: corsUrl('https://wcc.sc.egov.usda.gov/reportGenerator/view_csv/customSingleStationReport/daily/679:WA:SNTL/-1,0/WTEQ::value,SNWD::value,TAVG::value'),
    lat: 47.7367, lon: -121.0886, responseType: 'text',
    parse: parseSNOTEL('Stevens Pass (SNOTEL 679)') },
  { id: 'snotel_paradise', name: 'Paradise SNOTEL', category: 'snowpack',
    url: corsUrl('https://wcc.sc.egov.usda.gov/reportGenerator/view_csv/customSingleStationReport/daily/999:WA:SNTL/-1,0/WTEQ::value,SNWD::value,TAVG::value'),
    lat: 46.7856, lon: -121.7392, responseType: 'text',
    parse: parseSNOTEL('Paradise, Mt Rainier (SNOTEL 999)') },
  { id: 'snotel_hartspass', name: 'Harts Pass SNOTEL', category: 'snowpack',
    url: corsUrl('https://wcc.sc.egov.usda.gov/reportGenerator/view_csv/customSingleStationReport/daily/909:WA:SNTL/-1,0/WTEQ::value,SNWD::value,TAVG::value'),
    lat: 48.7167, lon: -120.6667, responseType: 'text',
    parse: parseSNOTEL('Harts Pass (SNOTEL 909)') },

  // ════ ECOLOGICAL — Salmon Counts ════
  // Bonneville Dam adult Chinook counts (DART, Columbia Basin Research)
  // Seasonal: mainly Mar-Nov. Empty data handled gracefully.
  { id: 'dart_bonneville_chin', name: 'Bonneville Chinook', category: 'ecological',
    url: (function() {
      var y = new Date().getFullYear();
      return corsUrl('https://www.cbr.washington.edu/dart/cs/php/rpt/adult_daily.php?sc=1&outputFormat=csvSingle&year=' + y + '&proj=BON&startday=1&lastday=365&species=1');
    })(),
    lat: 45.6443, lon: -121.9406, responseType: 'text',
    parse: parseDART },

  // ════ ECOLOGICAL — Shellfish Closures ════
  // TODO: WA DOH biotoxin/shellfish closure data
  // API endpoint not publicly documented as clean JSON.
  // Manual check: https://fortress.wa.gov/doh/eh/portal/odw/si/Biotoxin/BiotoxinData.aspx
  // Future: scrape closure count from DOH Shellfish Safety Map
  // For now, this is a placeholder that will skip gracefully.
  { id: 'doh_shellfish', name: 'DOH Shellfish Status', category: 'ecological',
    url: null, // No clean API available yet
    lat: 47.5, lon: -122.7,
    parse: function() { return { value: NaN }; } },

  // ════ ENERGY — BC Hydro ════
  // TODO: BC Hydro real-time generation/load data
  // https://www.bchydro.com/energy-in-bc/operations/transmission-system/actual-flow-data.html
  // No clean JSON API publicly documented. CORS likely blocked.
  // Future: parse the actual flow data if an API becomes available.
  { id: 'bchydro_load', name: 'BC Hydro Load', category: 'energy',
    url: null, // No clean API available yet
    lat: 49.25, lon: -123.1,
    parse: function() { return { value: NaN }; } },

  // ════ SEISMIC — USGS Earthquake Data (real-time, CORS-enabled) ════
  // Salish Sea bounding box: 46.5-49.5°N, 125.5-121.5°W
  // Fetches last 30 days of seismic events
  { id: 'usgs_earthquakes', name: 'Salish Sea Earthquakes', category: 'seismic',
    url: (function() {
      var now = new Date();
      var start = new Date(now.getTime() - 30 * 86400000);
      return 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson'
        + '&starttime=' + start.toISOString().slice(0, 10)
        + '&endtime=' + now.toISOString().slice(0, 10)
        + '&minlatitude=46.5&maxlatitude=49.5&minlongitude=-125.5&maxlongitude=-121.5'
        + '&minmagnitude=1.0&orderby=time&limit=50';
    })(),
    lat: 48.0, lon: -123.0, parse: parseUSGS_Earthquakes },

  // ════ VOLCANIC — USGS Cascade Volcano Observatory ════
  // May return 404 if API endpoint changes — handled gracefully
  { id: 'usgs_volcanoes', name: 'Cascade Volcanoes', category: 'volcanic',
    url: 'https://volcanoes.usgs.gov/vsc/api/volcanoApi/volcanoesGeoJSON',
    lat: 47.5, lon: -121.8, parse: parseUSGS_Volcanoes },

  // ════ WATER QUALITY — USGS Enhanced Parameters ════
  // Additional parameters beyond discharge+temp: DO, pH, turbidity, conductance
  // Not all gauges measure all params — missing data handled gracefully
  { id: 'usgs_skagit_wq', name: 'Skagit Water Quality', category: 'waterQuality',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12200500&parameterCd=00300,00400,63680,00095&period=P1D',
    lat: 48.4201, lon: -122.3358,
    parse: parseUSGS_WQ('Skagit WQ (USGS 12200500)', 'whidbey') },
  { id: 'usgs_puyallup_wq', name: 'Puyallup Water Quality', category: 'waterQuality',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12101500&parameterCd=00300,00400,63680,00095&period=P1D',
    lat: 47.2029, lon: -122.4002,
    parse: parseUSGS_WQ('Puyallup WQ (USGS 12101500)', 'mainBasin') },
  { id: 'usgs_nisqually_wq', name: 'Nisqually Water Quality', category: 'waterQuality',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12089500&parameterCd=00300,00400,63680,00095&period=P1D',
    lat: 46.9168, lon: -122.6812,
    parse: parseUSGS_WQ('Nisqually WQ (USGS 12089500)', 'southSound') },
  { id: 'usgs_nooksack_wq', name: 'Nooksack Water Quality', category: 'waterQuality',
    url: 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12213100&parameterCd=00300,00400,63680,00095&period=P1D',
    lat: 48.8423, lon: -122.5969,
    parse: parseUSGS_WQ('Nooksack WQ (USGS 12213100)', 'georgia') },

  // ════ STREAMFLOW STATISTICS — USGS Daily Percentiles ════
  // Current flow relative to historical record — "is today's flow unusual?"
  { id: 'usgs_skagit_stat', name: 'Skagit Flow Percentile', category: 'river',
    url: 'https://waterservices.usgs.gov/nwis/stat/?format=json&sites=12200500&statReportType=daily&statTypeCd=mean',
    lat: 48.4201, lon: -122.3358,
    parse: parseUSGS_Percentile('Skagit Percentile (USGS 12200500)', 'whidbey') },

  // ════ BIOACOUSTICS — Orcasound Hydrophones ════
  // Live underwater noise monitoring for SRKW habitat
  // Data processed via ambient-sound-analysis pipeline, stored in S3
  // NOTE: Orcasound does not have a simple REST API; these are placeholder endpoints.
  // When live data is available from the processing pipeline, the parse function
  // extracts broadband SPL and 1/3 octave band levels.
  // Static baselines from Veirs et al. 2016 used when live data unavailable.
  { id: 'orcasound_lab', name: 'Orcasound Lab (Haro Strait)', category: 'bioacoustics',
    url: null, // S3: streaming-orcasound-net/rpi_orcasound_lab/ — requires pipeline processing
    lat: 48.5155, lon: -123.2140,
    parse: function() {
      // Static baseline from Veirs et al. 2016 — median broadband when no ship
      return {
        value: 117, unit: 'dB re 1\u00B5Pa', parameter: 'Broadband SPL ~117 dB (baseline)',
        category: 'bioacoustics', modelKey: 'marine.state.noiseIndex',
        basin: 'sanjuan', stationName: 'Orcasound Lab (west San Juan Is.)',
        note: 'Static baseline — connect Orcasound pipeline for live data',
      };
    },
  },
  { id: 'orcasound_bush', name: 'Bush Point (Whidbey)', category: 'bioacoustics',
    url: null, // S3: streaming-orcasound-net/rpi_bush_point/
    lat: 48.0268, lon: -122.6122,
    parse: function() {
      return {
        value: 112, unit: 'dB re 1\u00B5Pa', parameter: 'Broadband SPL ~112 dB (baseline)',
        category: 'bioacoustics', stationName: 'Bush Point (Whidbey Is.)',
      };
    },
  },
  { id: 'orcasound_pt', name: 'Port Townsend Hydrophone', category: 'bioacoustics',
    url: null,
    lat: 48.1138, lon: -122.7605,
    parse: function() {
      return {
        value: 114, unit: 'dB re 1\u00B5Pa', parameter: 'Broadband SPL ~114 dB (baseline)',
        category: 'bioacoustics', stationName: 'Port Townsend (Admiralty Inlet)',
      };
    },
  },

  // ════ OOI — NSF Ocean Observatories Initiative ════
  // Endurance Array (CE) — Oregon/Washington shelf — Pacific boundary conditions
  // Regional Cabled Array (RS) — Slope Base — deep Pacific source water
  // ERDDAP API: https://erddap.dataexplorer.oceanobservatories.org/
  // All CORS-blocked from browser — routed through Netlify proxy.
  //
  // CE01ISSM: Oregon Inshore Surface Mooring (44.66°N, 124.09°W, 25m)
  //   → Closest OOI asset to Salish Sea entrance. Upwelling indicator.
  // CE04OSSM: Oregon Offshore Surface Mooring (44.37°N, 124.95°W, 588m)
  //   → Outer shelf — California Current properties, MHW detection.
  // RS01SBPS: Slope Base Profiler (44.53°N, 125.39°W, 2900m)
  //   → Deep Pacific source water: O₂, DIC, T at depth.
  //
  // Source: OOI Data Portal (oceanobservatories.org), Smith et al. 2018 (Oceanography)
  { id: 'ooi_ce01_ctd', name: 'OOI CE01 Inshore CTD', category: 'ooi',
    url: corsUrl(
      'https://erddap.dataexplorer.oceanobservatories.org/erddap/tabledap/ooi-ce01issm-rid16-03-ctdbpc000.json?time,sea_water_temperature,practical_salinity,sea_water_pressure&time>=now-1day&orderByMax(%22time%22)'
    ),
    lat: 44.6598, lon: -124.0957,
    parse: function(data) {
      var rows = data && data.table && data.table.rows;
      if (!rows || !rows.length) return { value: NaN };
      var row = rows[rows.length - 1];
      return {
        value: parseFloat(row[1]), timestamp: row[0], unit: '°C',
        parameter: 'SST: ' + parseFloat(row[1]).toFixed(1) + '°C',
        category: 'ooi', modelKey: 'pacific.sourceTemp',
        basin: 'juanDeFuca', stationName: 'OOI CE01 Inshore (Oregon shelf)',
        salinity: parseFloat(row[2]),
      };
    },
  },
  { id: 'ooi_ce01_do', name: 'OOI CE01 Inshore DO', category: 'ooi',
    url: corsUrl(
      'https://erddap.dataexplorer.oceanobservatories.org/erddap/tabledap/ooi-ce01issm-rid16-03-dofstk000.json?time,dissolved_oxygen&time>=now-1day&orderByMax(%22time%22)'
    ),
    lat: 44.6598, lon: -124.0957,
    parse: function(data) {
      var rows = data && data.table && data.table.rows;
      if (!rows || !rows.length) return { value: NaN };
      var row = rows[rows.length - 1];
      // OOI DO in µmol/kg → convert to mg/L (×0.032)
      var doMgL = parseFloat(row[1]) * 0.032;
      return {
        value: doMgL, timestamp: row[0], unit: 'mg/L',
        parameter: 'DO: ' + doMgL.toFixed(1) + ' mg/L',
        category: 'ooi', modelKey: 'pacific.sourceO2',
        basin: 'juanDeFuca', stationName: 'OOI CE01 Inshore DO',
      };
    },
  },
  { id: 'ooi_ce04_ctd', name: 'OOI CE04 Offshore CTD', category: 'ooi',
    url: corsUrl(
      'https://erddap.dataexplorer.oceanobservatories.org/erddap/tabledap/ooi-ce04ossm-rid27-03-ctdbpc000.json?time,sea_water_temperature,practical_salinity&time>=now-1day&orderByMax(%22time%22)'
    ),
    lat: 44.3695, lon: -124.9474,
    parse: function(data) {
      var rows = data && data.table && data.table.rows;
      if (!rows || !rows.length) return { value: NaN };
      var row = rows[rows.length - 1];
      return {
        value: parseFloat(row[1]), timestamp: row[0], unit: '°C',
        parameter: 'Temp: ' + parseFloat(row[1]).toFixed(1) + '°C (offshore)',
        category: 'ooi', modelKey: 'pacific.sourceTemp',
        basin: 'juanDeFuca', stationName: 'OOI CE04 Offshore (outer shelf)',
      };
    },
  },
  { id: 'ooi_ce04_ph', name: 'OOI CE04 Offshore pH', category: 'ooi',
    url: corsUrl(
      'https://erddap.dataexplorer.oceanobservatories.org/erddap/tabledap/ooi-ce04ossm-rid27-01-phsene101.json?time,seawater_ph&time>=now-1day&orderByMax(%22time%22)'
    ),
    lat: 44.3695, lon: -124.9474,
    parse: function(data) {
      var rows = data && data.table && data.table.rows;
      if (!rows || !rows.length) return { value: NaN };
      var row = rows[rows.length - 1];
      return {
        value: parseFloat(row[1]), timestamp: row[0], unit: 'pH',
        parameter: 'pH: ' + parseFloat(row[1]).toFixed(2) + ' (offshore)',
        category: 'ooi', modelKey: 'pacific.pH',
        basin: 'juanDeFuca', stationName: 'OOI CE04 Offshore pH',
      };
    },
  },
  { id: 'ooi_rs01_ctd', name: 'OOI RS01 Slope Base CTD', category: 'ooi',
    url: corsUrl(
      'https://erddap.dataexplorer.oceanobservatories.org/erddap/tabledap/ooi-rs01sbps-sf01a-2a-ctdpfa102.json?time,seawater_temperature,practical_salinity&time>=now-1day&orderByMax(%22time%22)'
    ),
    lat: 44.5292, lon: -125.3896,
    parse: function(data) {
      var rows = data && data.table && data.table.rows;
      if (!rows || !rows.length) return { value: NaN };
      var row = rows[rows.length - 1];
      return {
        value: parseFloat(row[1]), timestamp: row[0], unit: '°C',
        parameter: 'Deep Temp: ' + parseFloat(row[1]).toFixed(2) + '°C',
        category: 'ooi', modelKey: 'pacific.sourceTemp',
        basin: 'juanDeFuca', stationName: 'OOI RS01 Slope Base (2900m)',
        note: 'Deep Pacific source water — feeds Salish Sea via JdF upwelling',
      };
    },
  },
  { id: 'ooi_rs01_do', name: 'OOI RS01 Slope Base DO', category: 'ooi',
    url: corsUrl(
      'https://erddap.dataexplorer.oceanobservatories.org/erddap/tabledap/ooi-rs01sbps-sf01a-4a-dostad104.json?time,dissolved_oxygen&time>=now-1day&orderByMax(%22time%22)'
    ),
    lat: 44.5292, lon: -125.3896,
    parse: function(data) {
      var rows = data && data.table && data.table.rows;
      if (!rows || !rows.length) return { value: NaN };
      var row = rows[rows.length - 1];
      var doMgL = parseFloat(row[1]) * 0.032;
      return {
        value: doMgL, timestamp: row[0], unit: 'mg/L',
        parameter: 'Deep O₂: ' + doMgL.toFixed(1) + ' mg/L',
        category: 'ooi', modelKey: 'pacific.sourceO2',
        basin: 'juanDeFuca', stationName: 'OOI RS01 Slope Base DO (2900m)',
        note: 'Pacific OMZ source — declining O₂ trend drives Salish Sea hypoxia',
      };
    },
  },

  // ════ ONC — Ocean Networks Canada (VENUS/NEPTUNE) ════
  // Saanich Inlet (DDL) — world-class anoxic reference basin
  // Strait of Georgia / San Juan junction (SJIS)
  // ERDDAP API: https://data.oceannetworks.ca/
  // CORS-blocked — requires proxy.
  //
  // Source: Ocean Networks Canada, Matabos et al. 2022 (Front. Mar. Sci.)
  { id: 'onc_venus_ddl', name: 'ONC VENUS Saanich Inlet', category: 'onc',
    url: corsUrl(
      'https://data.oceannetworks.ca/erddap/tabledap/scalar7785-20201218T000000Z.json?time,Temperature,Salinity,Oxygen&time>=now-1day&orderByMax(%22time%22)'
    ),
    lat: 48.6500, lon: -123.5000,
    parse: function(data) {
      var rows = data && data.table && data.table.rows;
      if (!rows || !rows.length) return { value: NaN };
      var row = rows[rows.length - 1];
      return {
        value: parseFloat(row[1]), timestamp: row[0], unit: '°C',
        parameter: 'Temp: ' + parseFloat(row[1]).toFixed(1) + '°C (Saanich)',
        category: 'onc', modelKey: 'marine.state.sst',
        basin: 'georgia', stationName: 'ONC VENUS Saanich Inlet (DDL)',
        note: 'Saanich Inlet — naturally anoxic deep water, analog for climate-stressed basins',
      };
    },
  },
  { id: 'onc_venus_ddl_do', name: 'ONC VENUS Saanich Inlet DO', category: 'onc',
    url: corsUrl(
      'https://data.oceannetworks.ca/erddap/tabledap/scalar7785-20201218T000000Z.json?time,Oxygen&time>=now-1day&orderByMax(%22time%22)'
    ),
    lat: 48.6500, lon: -123.5000,
    parse: function(data) {
      var rows = data && data.table && data.table.rows;
      if (!rows || !rows.length) return { value: NaN };
      var row = rows[rows.length - 1];
      // ONC oxygen in mL/L → mg/L (×1.429)
      var doMgL = parseFloat(row[1]) * 1.429;
      return {
        value: doMgL, timestamp: row[0], unit: 'mg/L',
        parameter: 'DO: ' + doMgL.toFixed(1) + ' mg/L (Saanich deep)',
        category: 'onc', modelKey: 'marine.state.dissolvedOxygen',
        basin: 'georgia', stationName: 'ONC Saanich Inlet DO',
      };
    },
  },

  // ════ ECONOMIC — Federal Reserve (FRED API) ════
  // Free API key from https://fred.stlouisfed.org/docs/api/api_key.html
  // Set window.FRED_API_KEY to enable. Static defaults used otherwise.
  { id: 'fred_fedfunds', name: 'Fed Funds Rate', category: 'economic',
    url: function() {
      var key = _fredKey;
      if (!key) return null;
      return 'https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=' + key + '&file_type=json&sort_order=desc&limit=1';
    },
    lat: 38.63, lon: -90.20,
    parse: function(data) {
      var obs = data && data.observations && data.observations[0];
      if (!obs) return { value: NaN };
      return { value: parseFloat(obs.value), timestamp: obs.date, unit: '%',
        parameter: 'Fed Funds: ' + obs.value + '%', category: 'economic',
        stationName: 'FRED FEDFUNDS', modelKey: 'macro.fedFundsRate' };
    },
  },
  { id: 'fred_gdp', name: 'Real GDP Growth', category: 'economic',
    url: function() {
      var key = _fredKey;
      if (!key) return null;
      return 'https://api.stlouisfed.org/fred/series/observations?series_id=A191RL1Q225SBEA&api_key=' + key + '&file_type=json&sort_order=desc&limit=1';
    },
    lat: 38.63, lon: -90.20,
    parse: function(data) {
      var obs = data && data.observations && data.observations[0];
      if (!obs) return { value: NaN };
      return { value: parseFloat(obs.value), timestamp: obs.date, unit: '% ann.',
        parameter: 'GDP Growth: ' + obs.value + '%', category: 'economic',
        stationName: 'FRED GDP', modelKey: 'macro.gdpGrowth' };
    },
  },
  { id: 'fred_waur', name: 'WA Unemployment', category: 'economic',
    url: function() {
      var key = _fredKey;
      if (!key) return null;
      return 'https://api.stlouisfed.org/fred/series/observations?series_id=WAUR&api_key=' + key + '&file_type=json&sort_order=desc&limit=1';
    },
    lat: 47.04, lon: -122.90,
    parse: function(data) {
      var obs = data && data.observations && data.observations[0];
      if (!obs) return { value: NaN };
      return { value: parseFloat(obs.value), timestamp: obs.date, unit: '%',
        parameter: 'WA Unemployment: ' + obs.value + '%', category: 'economic',
        stationName: 'FRED WAUR', modelKey: 'macro.waUnemployment' };
    },
  },
  { id: 'fred_oil', name: 'WTI Crude Oil', category: 'economic',
    url: function() {
      var key = _fredKey;
      if (!key) return null;
      return 'https://api.stlouisfed.org/fred/series/observations?series_id=DCOILWTICO&api_key=' + key + '&file_type=json&sort_order=desc&limit=1';
    },
    lat: 38.63, lon: -90.20,
    parse: function(data) {
      var obs = data && data.observations && data.observations[0];
      if (!obs) return { value: NaN };
      return { value: parseFloat(obs.value), timestamp: obs.date, unit: '$/bbl',
        parameter: 'Oil: $' + parseFloat(obs.value).toFixed(0) + '/bbl', category: 'economic',
        stationName: 'FRED WTI', modelKey: 'macro.oilPrice' };
    },
  },
  { id: 'fred_houst', name: 'Housing Starts', category: 'economic',
    url: function() {
      var key = _fredKey;
      if (!key) return null;
      return 'https://api.stlouisfed.org/fred/series/observations?series_id=HOUST&api_key=' + key + '&file_type=json&sort_order=desc&limit=1';
    },
    lat: 38.63, lon: -90.20,
    parse: function(data) {
      var obs = data && data.observations && data.observations[0];
      if (!obs) return { value: NaN };
      return { value: parseFloat(obs.value), timestamp: obs.date, unit: 'K SAAR',
        parameter: 'Housing Starts: ' + obs.value + 'K', category: 'economic',
        stationName: 'FRED HOUST', modelKey: 'macro.housingStarts' };
    },
  },
  { id: 'fred_mortgage', name: '30-Yr Fixed Mortgage', category: 'economic',
    url: function() {
      var key = _fredKey;
      if (!key) return null;
      return 'https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=' + key + '&file_type=json&sort_order=desc&limit=1';
    },
    lat: 38.63, lon: -90.20,
    parse: function(data) {
      var obs = data && data.observations && data.observations[0];
      if (!obs) return { value: NaN };
      return { value: parseFloat(obs.value), timestamp: obs.date, unit: '%',
        parameter: '30-Yr Mortgage: ' + obs.value + '%', category: 'economic',
        stationName: 'FRED MORTGAGE30US', modelKey: 'macro.mortgageRate' };
    },
  },
];

// Total station count for display
export var STATION_COUNT = LIVE_ENDPOINTS.length;

// ═══════════════════════════════════════════════════════════
// FETCH PIPELINE
// ═══════════════════════════════════════════════════════════

export async function fetchLiveData() {
  var results = [];
  for (var i = 0; i < LIVE_ENDPOINTS.length; i++) {
    var endpoint = LIVE_ENDPOINTS[i];
    try {
      // Resolve URL: handles strings, functions, corsUrl objects
      var url = resolveUrl(endpoint.url);
      if (!url) continue; // Skip if URL resolved to null (e.g., no API key)

      var fetchOpts = {};
      if (endpoint.headers) fetchOpts.headers = endpoint.headers;

      var response = await fetch(url, fetchOpts);
      if (response.ok) {
        var data;
        if (endpoint.responseType === 'text' || (response.headers.get('content-type') || '').indexOf('text') >= 0) {
          data = await response.text();
        } else {
          data = await response.json();
        }
        var parsed = endpoint.parse(data);
        if (parsed.value != null && !isNaN(parsed.value)) {
          var entry = {
            value: parsed.value, timestamp: parsed.timestamp, unit: parsed.unit,
            parameter: parsed.parameter || '', category: parsed.category || endpoint.category || '',
            modelKey: parsed.modelKey, basin: parsed.basin,
            stationName: parsed.stationName,
            sourceId: endpoint.id, sourceName: endpoint.name,
            lat: endpoint.lat, lon: endpoint.lon, status: 'live'
          };
          if (parsed.temperature != null && !isNaN(parsed.temperature)) entry.temperature = parsed.temperature;
          if (parsed.waveHeight != null) entry.waveHeight = parsed.waveHeight;
          if (parsed.windSpeed != null) entry.windSpeed = parsed.windSpeed;
          if (parsed.phase) entry.phase = parsed.phase;
          if (parsed.isKingTide) entry.isKingTide = true;
          // Earthquake-specific fields
          if (parsed.count30d != null) entry.count30d = parsed.count30d;
          if (parsed.maxMag != null) entry.maxMag = parsed.maxMag;
          if (parsed.recent) entry.recent = parsed.recent;
          if (parsed.significant) entry.significant = parsed.significant;
          if (parsed.seismicActivityLevel) entry.seismicActivityLevel = parsed.seismicActivityLevel;
          if (parsed.avgDepth != null) entry.avgDepth = parsed.avgDepth;
          // Volcano-specific fields
          if (parsed.volcanoes) entry.volcanoes = parsed.volcanoes;
          results.push(entry);
        }
      }
    } catch (e) {
      // Silently skip CORS-blocked or failed endpoints
    }
  }
  return results;
}

export async function testLiveEndpoints() {
  var results = [];
  for (var i = 0; i < LIVE_ENDPOINTS.length; i++) {
    var endpoint = LIVE_ENDPOINTS[i];
    var start = Date.now();
    try {
      var url = resolveUrl(endpoint.url);
      if (!url) {
        results.push({ id: endpoint.id, name: endpoint.name, status: 'skipped_no_key', ms: 0 });
        continue;
      }
      var fetchOpts = {};
      if (endpoint.headers) fetchOpts.headers = endpoint.headers;
      var response = await fetch(url, fetchOpts);
      var elapsed = Date.now() - start;
      if (response.ok) {
        var data;
        if (endpoint.responseType === 'text' || (response.headers.get('content-type') || '').indexOf('text') >= 0) {
          data = await response.text();
        } else {
          data = await response.json();
        }
        var parsed = endpoint.parse(data);
        if (parsed.value != null && !isNaN(parsed.value)) {
          results.push({ id: endpoint.id, name: endpoint.name, status: 'ok', value: parsed.value, unit: parsed.unit, parameter: parsed.parameter, ms: elapsed });
        } else {
          results.push({ id: endpoint.id, name: endpoint.name, status: 'parse_error', ms: elapsed });
        }
      } else {
        results.push({ id: endpoint.id, name: endpoint.name, status: 'http_' + response.status, ms: elapsed });
      }
    } catch (e) {
      var elapsed2 = Date.now() - start;
      results.push({ id: endpoint.id, name: endpoint.name, status: 'cors_or_network', error: e.message, ms: elapsed2 });
    }
  }
  return results;
}

// Category labels for display grouping
export var LIVE_CATEGORIES = {
  ocean: 'Ocean Stations',
  tides: 'Tides & Water Level',
  waterQuality: 'Water Quality',
  river: 'River Gauges',
  climate: 'Climate Indices',
  weather: 'Weather',
  airQuality: 'Air Quality',
  infrastructure: 'Infrastructure & Transport',
  snowpack: 'Snowpack (SNOTEL)',
  ecological: 'Ecological Monitoring',
  energy: 'Energy Grid',
  seismic: 'Seismic Activity',
  volcanic: 'Volcano Monitoring',
  bioacoustics: 'Underwater Noise (Orcasound)',
  ooi: 'NSF Ocean Observatories (OOI)',
  onc: 'Ocean Networks Canada (ONC)',
  economic: 'Economic Indicators (FRED)',
};
