import { useState, useSyncExternalStore } from "react";
import { sim } from "@/sim-stub";

/**
 * Collapsible left-edge drawer of scenario shocks. Native React UI that
 * pushes shocks into the Twin engine. Tab label is always visible; the
 * drawer expands on click. Engine ticks immediately on fire so the user
 * sees the response without waiting for the next interval.
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
    label: "Cascadia M9",
    shock: { cascadia_m9: 1, cascadia_megathrust: 1 },
    description: "Full megathrust rupture. Damages ports/ferries/tribal sites; multi-quarter recovery.",
    domain: "seismic",
  },
  {
    id: "oilSpill",
    label: "Oil spill",
    shock: { oilSpill: 0.7 },
    description: "Refinery-scale spill. Hits forage, orca, eelgrass; fisheries downstream.",
    domain: "spill",
  },
  {
    id: "dilbitSpill",
    label: "Dilbit spill",
    shock: { dilbitSpill: 0.6 },
    description: "Trans Mountain dilbit release. Sinking sediment behavior differs from oil.",
    domain: "spill",
  },
  {
    id: "slrHigh",
    label: "SLR high",
    shock: { slrScenarioOverride: 3 },
    description: "Override SLR pathway to SSP5-8.5 + Antarctic instability.",
    domain: "climate",
  },
];

export function ScenariosPanel() {
  const [open, setOpen] = useState(false);
  const [lastFired, setLastFired] = useState<string | null>(null);
  useSyncExternalStore(
    (l) => sim.subscribe(l),
    () => sim.result,
    () => sim.result,
  );

  const fire = (s: ScenarioDef) => {
    sim.queueShock(s.shock);
    setLastFired(s.id);
    sim.tick();
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "30%",
        left: 0,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        zIndex: 10,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        title={open ? "Hide scenarios" : "Show scenarios"}
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          padding: "12px 6px",
          background: "rgba(20, 25, 38, 0.92)",
          color: open ? "#7aa2f7" : "#cbd5e0",
          border: "1px solid #2d3748",
          borderLeft: "none",
          borderRadius: "0 4px 4px 0",
          cursor: "pointer",
          fontSize: 11,
          fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 2,
        }}
      >
        SCENARIOS {open ? "◀" : "▶"}
      </button>
      {open && (
        <div
          className="panel"
          style={{
            width: 240,
            maxHeight: "60vh",
            overflowY: "auto",
            margin: "-1px 0 0 -1px",
            borderRadius: "0 4px 4px 0",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: 10,
          }}
        >
          <div className="panel-title">Scenarios</div>
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
          {lastFired && (
            <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4 }}>
              last shock: {lastFired}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
