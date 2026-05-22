import { useSyncExternalStore } from "react";
import { sim } from "@/sim-stub";

/**
 * Live readout of the Cousin engine state. Subscribes to sim ticks
 * (driven by useSimClock from GlobeViewer) and renders headline values
 * each tick. Acts as the dashboard for the mechanistic model so you can
 * see what the engine is computing without having to click every dot.
 */
export function CousinPanel() {
  const result = useSyncExternalStore(
    (l) => sim.subscribe(l),
    () => sim.result,
    () => sim.result,
  );

  if (!result) {
    return (
      <div className="panel" style={panelStyle}>
        <div className="panel-title">Cousin engine</div>
        <div style={{ opacity: 0.6, fontSize: 12 }}>Booting…</div>
      </div>
    );
  }

  const eco = result.ecosystem?.state ?? {};
  const port = result.port?.state ?? {};
  const marine = result.marine?.state ?? {};
  const bgc = result.biogeochem?.state ?? {};

  const rows: Array<[string, string, number | null]> = [
    ["Orca viability", "SRKW", clamp01(eco.orcaViability)],
    ["Orca pop", "SRKW", normalize(eco.orcaPopulation, 100)],
    ["Salmon run strength", "regional", clamp01(eco.salmonRunStrength)],
    ["Eelgrass health", "regional", clamp01(eco.eelgrassHealth)],
    ["Herring (Cherry Pt)", "k tons", normalize(numericish(eco.cherryPointHerring), 5000)],
    ["Aragonite Ω", "min", normalize(eco.minOmega ?? marine.omegaAragonite, 3)],
    ["Atmospheric CO₂", "ppm", normalize(bgc.atmosphericCO2, 600, 280, true)],
    ["Port op capacity", "agg", clamp01(port.opCap)],
    ["Vessel density", "norm", clamp01(port.vesselDensity)],
    ["Underwater noise", "idx", clamp01(port.underwaterNoise)],
  ];

  return (
    <div className="panel" style={panelStyle}>
      <div className="panel-title">Cousin engine</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
        {rows.map(([label, unit, v]) => (
          <Row key={label} label={label} unit={unit} value={v} />
        ))}
      </div>
    </div>
  );
}

function Row({ label, unit, value }: { label: string; unit: string; value: number | null }) {
  const bar = value == null ? 0 : value;
  const color = healthHex(value);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.85 }}>{label}</span>
        <span style={{ opacity: 0.55 }}>{unit}</span>
      </div>
      <div
        style={{
          height: 6,
          background: "#1a1f2e",
          borderRadius: 3,
          overflow: "hidden",
          marginTop: 2,
        }}
      >
        <div
          style={{
            width: `${Math.round(bar * 100)}%`,
            height: "100%",
            background: color,
            transition: "width 600ms ease, background 600ms ease",
          }}
        />
      </div>
    </div>
  );
}

const panelStyle = {
  position: "absolute" as const,
  bottom: 16,
  left: 16,
  width: 220,
  maxHeight: "calc(100vh - 80px)",
  overflowY: "auto" as const,
};

function clamp01(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function normalize(v: unknown, max: number, min = 0, inverted = false): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const t = (v - min) / (max - min);
  const clipped = Math.max(0, Math.min(1, t));
  return inverted ? 1 - clipped : clipped;
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

function healthHex(v: number | null): string {
  if (v == null) return "#4a5568";
  const r = Math.round(255 * (1 - v) + 158 * v);
  const g = Math.round(118 * (1 - v) + 206 * v);
  const b = Math.round(142 * (1 - v) + 106 * v);
  return `rgb(${r}, ${g}, ${b})`;
}
