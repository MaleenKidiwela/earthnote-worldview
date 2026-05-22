import { useState, useSyncExternalStore } from "react";
import { sim } from "@/sim-stub";

/**
 * Native scenario controls that fire the Cousin engine's shock vocabulary.
 * Each button queues a shock; the next sim.tick() consumes it. The engine's
 * own multi-quarter recovery logic (_m9QuartersSince, M9 macro shock,
 * spill stress decay) then propagates through subsequent ticks so the user
 * watches the model respond on the globe in place.
 */
interface ScenarioDef {
  id: string;
  label: string;
  shock: Record<string, number>;
  description: string;
  domain: "seismic" | "spill" | "climate";
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: "cascadia_m9",
    label: "Trigger Cascadia M9",
    shock: { cascadia_m9: 1, cascadia_megathrust: 1 },
    description: "Full megathrust rupture. Damages ports, ferries, tribal sites; macro shock + recovery over 8+ quarters.",
    domain: "seismic",
  },
  {
    id: "oilSpill",
    label: "Major oil spill",
    shock: { oilSpill: 0.7 },
    description: "Refinery-scale spill. Hits forage/orca/eelgrass; commercial fisheries impact.",
    domain: "spill",
  },
  {
    id: "dilbitSpill",
    label: "Dilbit pipeline spill",
    shock: { dilbitSpill: 0.6 },
    description: "Trans Mountain-style dilbit release. Distinct sediment/sinking behavior from oil.",
    domain: "spill",
  },
  {
    id: "slrHigh",
    label: "SLR scenario 3 (high)",
    shock: { slrScenarioOverride: 3 },
    description: "Override sea-level-rise pathway to the high projection (SSP5-8.5 + Antarctic instability).",
    domain: "climate",
  },
];

export function ScenariosPanel() {
  const [lastFired, setLastFired] = useState<string | null>(null);
  // Subscribe so the tick counter row updates.
  const result = useSyncExternalStore(
    (l) => sim.subscribe(l),
    () => sim.result,
    () => sim.result,
  );

  const fire = (s: ScenarioDef) => {
    sim.queueShock(s.shock);
    setLastFired(s.id);
    // Tick immediately so the user sees a response without waiting 30 s.
    sim.tick();
  };

  return (
    <div
      className="panel"
      style={{
        position: "absolute",
        top: 48,
        left: 16,
        width: 240,
        maxHeight: "calc(100vh - 80px)",
        overflowY: "auto",
      }}
    >
      <div className="panel-title">Scenarios</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SCENARIOS.map((s) => {
          const active = lastFired === s.id;
          return (
            <button
              key={s.id}
              onClick={() => fire(s)}
              title={s.description}
              style={{
                padding: "6px 10px",
                background: active ? "#3a4a6e" : "rgba(20, 25, 38, 0.85)",
                color: "#cbd5e0",
                border: `1px solid ${active ? "#7aa2f7" : "#4a5568"}`,
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 600 }}>{s.label}</div>
              <div style={{ opacity: 0.6, fontSize: 10, marginTop: 2 }}>{s.description}</div>
            </button>
          );
        })}
        <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4 }}>
          Engine ticks: {result ? "running" : "booting…"} ·{" "}
          {lastFired ? `last shock: ${lastFired}` : "no shocks queued"}
        </div>
      </div>
    </div>
  );
}
