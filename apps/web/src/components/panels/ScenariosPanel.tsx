import { useState, useSyncExternalStore } from "react";
import { sim } from "@/sim-stub";
import { SCEN } from "@pnw/sim";

/**
 * Collapsible left-edge drawer of engine scenarios + ad-hoc shocks.
 *
 * Two sections:
 *   - Worlds — full parameter-set scenarios from SCEN (Green transition,
 *     Hood Canal collapse, Blob returns, etc). Clicking re-warms the
 *     engine with that param set; persistent until you change it or
 *     hit reset in the time strip.
 *   - Shocks — one-shot events (M9 rupture, oil spill, dilbit spill, SLR
 *     override). Queued for the next tick, then cleared.
 */
interface ShockDef {
  id: string;
  label: string;
  shock: Record<string, number>;
  description: string;
}

const SHOCKS: ShockDef[] = [
  {
    id: "cascadia_m9",
    label: "Cascadia M9",
    shock: { cascadia_m9: 1, cascadia_megathrust: 1 },
    description: "Full megathrust rupture. Damages ports/ferries/tribal sites; multi-quarter recovery.",
  },
  {
    id: "oilSpill",
    label: "Oil spill",
    shock: { oilSpill: 0.7 },
    description: "Refinery-scale spill. Hits forage, orca, eelgrass; fisheries downstream.",
  },
  {
    id: "dilbitSpill",
    label: "Dilbit spill",
    shock: { dilbitSpill: 0.6 },
    description: "Trans Mountain dilbit release. Sinking sediment behavior differs from oil.",
  },
  {
    id: "slrHigh",
    label: "SLR scenario 3",
    shock: { slrScenarioOverride: 3 },
    description: "Override SLR pathway to SSP5-8.5 + Antarctic instability.",
  },
];

export function ScenariosPanel() {
  const [open, setOpen] = useState(false);
  const [lastShock, setLastShock] = useState<string | null>(null);
  useSyncExternalStore(
    (l) => sim.subscribe(l),
    () => sim.result,
    () => sim.result,
  );
  const activeScenario = sim.scenarioId;

  const worldEntries = Object.entries(SCEN);

  return (
    <div
      style={{
        position: "absolute",
        top: "20%",
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
            width: 280,
            maxHeight: "75vh",
            overflowY: "auto",
            margin: "-1px 0 0 -1px",
            borderRadius: "0 4px 4px 0",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 10,
          }}
        >
          <div className="panel-title">Worlds</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {worldEntries.map(([id, scen]) => {
              const active = activeScenario === id;
              return (
                <button
                  key={id}
                  onClick={() => sim.setScenario(id)}
                  title={scen.d ?? scen.l}
                  style={{
                    padding: "5px 8px",
                    background: active ? "#3a4a6e" : "rgba(20, 25, 38, 0.85)",
                    color: active ? "#fff" : "#cbd5e0",
                    border: `1px solid ${active ? "#7aa2f7" : "#4a5568"}`,
                    borderRadius: 3,
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "JetBrains Mono, monospace",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: active ? 600 : 400 }}>
                    {active ? "✓ " : ""}
                    {scen.l}
                  </div>
                  {scen.d && (
                    <div style={{ opacity: 0.55, fontSize: 9, marginTop: 2, lineHeight: 1.3 }}>
                      {scen.d}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="panel-title" style={{ marginTop: 6 }}>Shocks</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {SHOCKS.map((s) => {
              const recent = lastShock === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    sim.queueShock(s.shock);
                    setLastShock(s.id);
                    sim.tick();
                  }}
                  title={s.description}
                  style={{
                    padding: "5px 8px",
                    background: recent ? "#5d3a4a" : "rgba(20, 25, 38, 0.85)",
                    color: "#cbd5e0",
                    border: `1px solid ${recent ? "#f7768e" : "#4a5568"}`,
                    borderRadius: 3,
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "JetBrains Mono, monospace",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.label}</div>
                  <div style={{ opacity: 0.55, fontSize: 9, marginTop: 2 }}>
                    {s.description}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4 }}>
            Active world: <b>{SCEN[activeScenario]?.l ?? activeScenario}</b>
            {lastShock ? ` · last shock: ${lastShock}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
