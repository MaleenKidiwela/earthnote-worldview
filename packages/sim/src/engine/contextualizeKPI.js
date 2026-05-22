import { cl } from './utils.js';

function contextualizeKPI(key, value, prevValue, year) {
  var delta = prevValue !== undefined ? value - prevValue : 0;
  var trend = Math.abs(delta) < 0.01 ? "stable" : delta > 0 ? "improving" : "declining";
  var pct = (value * 100).toFixed(0);
  switch (key) {
    case "waterQuality":
      var closures = cl(Math.round((1 - value) * 12), 0, 12);
      return { headline: pct + "% — " + (value > 0.7 ? "Good" : value > 0.5 ? "Fair" : "Poor"),
        detail: closures > 0 ? "~" + closures + " beach advisory days per summer in King County" : "No beach advisories expected",
        severity: value < 0.5 ? "critical" : value < 0.7 ? "warning" : "good" };
    case "orcaViability":
      return { headline: pct + "% viability",
        detail: value < 0.4 ? "SRKW population in decline — recovery actions urgently needed" : value < 0.7 ? "Population fragile — continued investment in prey and noise reduction needed" : "Population trajectory positive",
        severity: value < 0.4 ? "critical" : value < 0.7 ? "warning" : "good" };
    case "orcaPop":
      return { headline: Math.round(value) + " individuals",
        detail: value < 70 ? "Below 70 — emergency threshold for species viability" : value < 75 ? "Holding near current levels (~74) — not yet recovering" : "Growing — conservation measures showing results",
        severity: value < 70 ? "critical" : value < 75 ? "warning" : "good" };
    case "salmonRun":
      var v100 = typeof value === "number" ? value : 50;
      return { headline: v100.toFixed(0) + "/100 index",
        detail: v100 < 40 ? "Treaty fishery allocations at risk — tribal harvest severely impacted" : v100 < 60 ? "Below historical average — hatchery supplementation maintaining runs" : "Strong returns supporting tribal, commercial, and recreational harvest",
        severity: v100 < 40 ? "critical" : v100 < 60 ? "warning" : "good" };
    case "employment":
      var jobs = typeof value === "number" ? value : 30000;
      return { headline: (jobs / 1000).toFixed(0) + "k jobs",
        detail: "Across maritime, fisheries, tourism, military, tech, and ferry sectors",
        severity: jobs < 25000 ? "critical" : jobs < 40000 ? "warning" : "good" };
    case "equityIndex":
      return { headline: pct + "% equity score",
        detail: value < 0.5 ? "Environmental burdens concentrated in Duwamish Valley and South King County communities" : value < 0.7 ? "Moderate disparities in flood exposure and pollution burden across districts" : "Environmental benefits and burdens relatively balanced across communities",
        severity: value < 0.5 ? "critical" : value < 0.7 ? "warning" : "good" };
    case "coastalFloodRisk":
      var props = Math.round(value * 45000); // ~45k properties in FEMA flood zones
      return { headline: (value * 100).toFixed(0) + "% risk index",
        detail: props > 5000 ? "~" + (props/1000).toFixed(0) + "k properties in expanded flood zone — SLR compounding storm surge" : "Flood exposure within manageable range",
        severity: value > 0.4 ? "critical" : value > 0.2 ? "warning" : "good" };
    case "csoFrequency":
      var evts = typeof value === "number" ? value : 2;
      return { headline: evts.toFixed(1) + " events/quarter",
        detail: evts > 5 ? "Sewage overflows into Elliott Bay and Duwamish — public health concern" : evts > 2 ? "Above EPA targets — infrastructure investment needed" : "Within acceptable range",
        severity: evts > 5 ? "critical" : evts > 2 ? "warning" : "good" };
    case "dissolvedOxygen":
      return { headline: value.toFixed(1) + " mg/L average",
        detail: value < 5 ? "Hypoxic conditions — fish kills likely in Hood Canal" : value < 7 ? "Below healthy threshold in several sub-basins" : "Adequate oxygen levels for marine life",
        severity: value < 5 ? "critical" : value < 7 ? "warning" : "good" };
    case "biodiversity":
      return { headline: pct + "% index",
        detail: trend === "declining" ? "Ecosystem resilience weakening — less capacity to absorb shocks" : "Ecosystem health " + trend,
        severity: value < 0.4 ? "critical" : value < 0.7 ? "warning" : "good" };
    case "eelgrassEstablishment":
      return { headline: (value * 100).toFixed(0) + "% root establishment",
        detail: value < 0.3 ? "REGIME SHIFT — seedbank depleted, recovery functionally impossible on management timescales. Herring spawning habitat collapsing." : value < 0.5 ? "Declining toward regime shift threshold (30%). Prevention far cheaper than cure — act now." : value < 0.7 ? "Moderate establishment — recovery possible but slow (decades). Protect from further stressors." : "Healthy root system supporting herring spawning habitat",
        severity: value < 0.3 ? "critical" : value < 0.5 ? "warning" : "good" };
    default:
      return { headline: pct + "%", detail: trend, severity: value < 0.4 ? "critical" : value < 0.7 ? "warning" : "good" };
  }
}

export { contextualizeKPI };
