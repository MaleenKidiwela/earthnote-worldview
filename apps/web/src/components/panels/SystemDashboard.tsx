import { useState, useSyncExternalStore } from "react";
import { sim } from "@/sim-stub";

/**
 * Single, tabbed dashboard for every Twin engine subsystem. Replaces the
 * scattered CousinPanel sidebar so the user has ONE place to read engine
 * state, organized by domain. Each tab maps to a subsystem the engine
 * already computes per tick: marine biogeochem, ecology, economy, public
 * health, tribal sovereignty, infrastructure.
 */
type Tab = "marine" | "ecology" | "economy" | "health" | "tribal" | "infra";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "marine", label: "Marine" },
  { id: "ecology", label: "Ecology" },
  { id: "economy", label: "Economy" },
  { id: "health", label: "Public health" },
  { id: "tribal", label: "Tribal" },
  { id: "infra", label: "Infra" },
];

export function SystemDashboard() {
  const [tab, setTab] = useState<Tab>("marine");
  const result = useSyncExternalStore(
    (l) => sim.subscribe(l),
    () => sim.result,
    () => sim.result,
  );

  return (
    <div
      className="panel"
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        width: 280,
        maxHeight: "calc(100vh - 200px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div className="panel-title">Twin engine</div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          marginBottom: 4,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: "1 1 auto",
              padding: "3px 6px",
              fontSize: 10,
              fontFamily: "JetBrains Mono, monospace",
              background: tab === t.id ? "#3a4a6e" : "transparent",
              color: tab === t.id ? "#fff" : "#7aa2f7",
              border: `1px solid ${tab === t.id ? "#7aa2f7" : "#2d3748"}`,
              borderRadius: 3,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {result ? <TabBody tab={tab} result={result} /> : (
        <div style={{ opacity: 0.6, fontSize: 11 }}>Booting engine…</div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabBody({ tab, result }: { tab: Tab; result: any }) {
  const marine = result.marine?.state ?? {};
  const eco = result.ecosystem?.state ?? {};
  const port = result.port?.state ?? {};
  const urban = result.urban?.state ?? {};
  const ph = result.publicHealth?.state ?? {};
  const trb = result.tribal?.state ?? {};
  const infra = result.infrastructure?.state ?? {};
  const macro = result.macroEconomy?.state ?? {};
  const ecoSvc = result.ecoServices?.state ?? {};
  const fish = result.fisheries?.state ?? {};

  switch (tab) {
    case "marine":
      return (
        <Rows
          rows={[
            ["SST", marine.sst, "°C", { good: 9, bad: 18 }],
            ["Dissolved O₂", marine.dissolvedOxygen, "mg/L", { good: 8, bad: 2 }],
            ["pH", marine.pH, "", { good: 8.1, bad: 7.6 }],
            ["Salinity", marine.salinity, "PSU", null],
            ["Nutrients", marine.nutrientConcentration, "µmol/L", null],
            ["Aragonite Ω", marine.omegaAragonite, "", { good: 2, bad: 1 }],
            ["Noise idx", marine.noiseIndex, "", { good: 0, bad: 1 }],
            ["WQI", marine.waterQualityIndex, "", { good: 1, bad: 0 }],
            ["Phytoplankton", marine.phyto, "mg/m³", null],
            ["HAB intensity", marine.habIntensity, "", { good: 0, bad: 1 }],
          ]}
        />
      );
    case "ecology":
      return (
        <Rows
          rows={[
            ["Orca viability", eco.orcaViability, "", { good: 1, bad: 0 }],
            ["SRKW population", eco.orcaPopulation, "", null],
            ["Bigg's orca", eco.biggsOrcaPop, "", null],
            ["Salmon run strength", eco.salmonRunStrength, "", { good: 1, bad: 0 }],
            ["Salmon health", eco.salmonHealth, "", { good: 1, bad: 0 }],
            ["Herring (Cherry Pt)", numericish(eco.cherryPointHerring), "k tons", null],
            ["Eelgrass health", eco.eelgrassHealth, "", { good: 1, bad: 0 }],
            ["Bull kelp", eco.bullKelpHealth, "", { good: 1, bad: 0 }],
            ["Forage fish idx", eco.forageFishIndex, "", { good: 1, bad: 0 }],
            ["Biodiversity", eco.biodiversityIndex, "", { good: 1, bad: 0 }],
            ["Dungeness crab", eco.dungenessCrabPop, "", null],
            ["Sea otter", eco.seaOtterPop, "", null],
            ["Gray whale", eco.grayWhalePop, "", null],
            ["Humpback", eco.humpbackPop, "", null],
            ["Pteropod", eco.pteropodPop, "", null],
            ["Sunflower star", eco.sunflowerStarPop, "", null],
            ["MHW active", eco.mhwActive ? 1 : 0, "yes/no", null],
          ]}
        />
      );
    case "economy":
      return (
        <Rows
          rows={[
            ["Port revenue", port.revenue, "$M/yr", null],
            ["Port employment", port.employment, "jobs", null],
            ["Tourism revenue", port.tourismRev, "$M/yr", null],
            ["Fisheries employment", fish.fisheriesEmployment, "jobs", null],
            ["Vessel density", port.vesselDensity, "norm", null],
            ["Op capacity", port.opCap, "0..1", { good: 1, bad: 0 }],
            ["Supply chain eff", port.supplyChainEff, "0..1", { good: 1, bad: 0 }],
            ["Eco services total", ecoSvc.total?.value ?? ecoSvc.total, "$M/yr", null],
            ["Insurance premium", urban.insurancePremiumIndex, "× base", { good: 1, bad: 3 }],
            ["Electricity price", macro._carry?.electricityPrice, "$/kWh", null],
            ["Community stress", fish.communityStress, "0..1", { good: 0, bad: 1 }],
          ]}
        />
      );
    case "health":
      return (
        <Rows
          rows={[
            ["Total health cost", ph.totalHealthCost, "$M/yr", null],
            ["Exposure idx", ph.exposureIndex, "0..1", { good: 0, bad: 1 }],
            ["Respiratory burden", ph.respiratoryBurden, "0..1", { good: 0, bad: 1 }],
            ["HAB shellfish closure", ph.shellfishClosureFrac, "frac", { good: 0, bad: 1 }],
            ["Air quality idx", ph.airQuality, "0..1", { good: 1, bad: 0 }],
            ["Water-borne illness", ph.waterIllnessRate, "per 100k", null],
          ]}
        />
      );
    case "tribal":
      return (
        <Rows
          rows={[
            ["Treaty fishery health", eco.treatyFisheryHealth, "0..1", { good: 1, bad: 0 }],
            ["Cultural loss", eco.indigenousCulturalLoss, "0..1", { good: 0, bad: 1 }],
            ["Food sovereignty", eco.indigenousFoodSovereignty, "0..1", { good: 1, bad: 0 }],
            ["Ceremonial access", eco.ceremonialAccess, "0..1", { good: 1, bad: 0 }],
            ["Cultural keystone", eco.culturalKeystoneHealth, "0..1", { good: 1, bad: 0 }],
            ["Climate displacement", eco.climateDisplacementRisk, "0..1", { good: 0, bad: 1 }],
            ["Tribal coordination", trb.coManagementIndex, "0..1", { good: 1, bad: 0 }],
          ]}
        />
      );
    case "infra":
      return (
        <Rows
          rows={[
            ["Ferry sailings", port.ferrySailings, "/day", null],
            ["Ferry noise", port.ferryNoise, "norm", { good: 0, bad: 1 }],
            ["Chokepoint risk", port.chokepointRisk, "0..1", { good: 0, bad: 1 }],
            ["Emissions index", port.emissionsIndex, "0..1", { good: 0, bad: 1 }],
            ["Oil spill risk", port.oilSpillRisk, "0..1", { good: 0, bad: 1 }],
            ["Stormwater age", urban.stormwaterInfraAge, "yrs", null],
            ["Sensor degradation", infra.sensorDegradation, "0..1", { good: 0, bad: 1 }],
            ["Cross-border coord", urban.crossBorderCoord, "0..1", { good: 1, bad: 0 }],
            ["Autonomous frac", port.autonomousFrac, "0..1", null],
            ["Alt fuel frac", port.altFuelFraction, "0..1", { good: 1, bad: 0 }],
          ]}
        />
      );
  }
}

interface Range {
  good: number;
  bad: number;
}

function Rows({ rows }: { rows: Array<[string, unknown, string, Range | null]> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
      {rows.map(([k, v, u, range]) => (
        <Row key={k} label={k} value={v} unit={u} range={range} />
      ))}
    </div>
  );
}

function Row({
  label,
  value,
  unit,
  range,
}: {
  label: string;
  value: unknown;
  unit: string;
  range: Range | null;
}) {
  const v = typeof value === "number" && Number.isFinite(value) ? value : null;
  const health = v != null && range ? normalize(v, range) : null;
  const color = healthCss(health);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.85 }}>{label}</span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", color }}>
          {v == null ? "—" : v.toFixed(Math.abs(v) > 10 ? 0 : 2)}{" "}
          <span style={{ opacity: 0.5 }}>{unit}</span>
        </span>
      </div>
      {range && (
        <div style={{ height: 4, background: "#1a1f2e", borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
          <div
            style={{
              width: `${Math.round((health ?? 0) * 100)}%`,
              height: "100%",
              background: color,
              transition: "width 600ms ease, background 600ms ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

function normalize(v: number, { good, bad }: Range): number {
  const t = (v - bad) / (good - bad);
  return Math.max(0, Math.min(1, t));
}

function healthCss(v: number | null): string {
  if (v == null) return "#cbd5e0";
  const r = Math.round(247 * (1 - v) + 158 * v);
  const g = Math.round(118 * (1 - v) + 206 * v);
  const b = Math.round(142 * (1 - v) + 106 * v);
  return `rgb(${r},${g},${b})`;
}

function numericish(x: unknown): number | null {
  if (typeof x === "number") return x;
  if (x && typeof x === "object") {
    const obj = x as Record<string, unknown>;
    if (typeof obj.total === "number") return obj.total;
    if (typeof obj.adult === "number") return obj.adult;
  }
  return null;
}
