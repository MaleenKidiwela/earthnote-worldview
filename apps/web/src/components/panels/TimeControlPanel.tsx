import { useState, useSyncExternalStore } from "react";
import { sim } from "@/sim-stub";

/**
 * Sim clock + speed control. The clock interval is owned by useSimClock
 * in GlobeViewer; this panel reads it back and lets the user crank it.
 * Each tick = 1 simulated month at default cadence (30 s wall-clock).
 */
interface TimeControlPanelProps {
  intervalMs: number;
  onIntervalChange: (ms: number) => void;
  paused: boolean;
  onPausedChange: (p: boolean) => void;
}

const SPEEDS: Array<{ label: string; ms: number }> = [
  { label: "1×", ms: 30_000 },
  { label: "2×", ms: 15_000 },
  { label: "5×", ms: 6_000 },
  { label: "10×", ms: 3_000 },
  { label: "30×", ms: 1_000 },
];

export function TimeControlPanel({
  intervalMs,
  onIntervalChange,
  paused,
  onPausedChange,
}: TimeControlPanelProps) {
  useSyncExternalStore(
    (l) => sim.subscribe(l),
    () => sim.result,
    () => sim.result,
  );
  const [year] = useState(() => 2026);
  const monthsElapsed = sim.ticks;
  const simYear = year + Math.floor(monthsElapsed / 12);
  const simMonth = monthsElapsed % 12;
  const monthName = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][simMonth];

  return (
    <div
      className="panel"
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 12px",
        fontSize: 12,
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      <button
        onClick={() => onPausedChange(!paused)}
        title={paused ? "Resume engine ticks" : "Pause engine"}
        style={btnStyle(paused)}
      >
        {paused ? "▶" : "❚❚"}
      </button>
      <span style={{ color: "#cbd5e0", minWidth: 100 }}>
        {monthName} {simYear} · tick {monthsElapsed}
      </span>
      <span style={{ color: "#7aa2f7", fontSize: 11 }}>speed</span>
      {SPEEDS.map((s) => (
        <button
          key={s.label}
          onClick={() => onIntervalChange(s.ms)}
          style={btnStyle(intervalMs === s.ms)}
        >
          {s.label}
        </button>
      ))}
      <button
        onClick={() => sim.tick()}
        title="Advance one month immediately"
        style={btnStyle(false)}
      >
        +1mo
      </button>
      <button
        onClick={() => sim.reset()}
        title="Reset engine to t=0 (clear all queued shocks, re-warmup)"
        style={{ ...btnStyle(false), color: "#f7768e", borderColor: "#7c2d3a" }}
      >
        ⟲ reset
      </button>
    </div>
  );
}

function btnStyle(active: boolean) {
  return {
    background: active ? "#3a4a6e" : "rgba(20, 25, 38, 0.85)",
    color: "#cbd5e0",
    border: `1px solid ${active ? "#7aa2f7" : "#4a5568"}`,
    borderRadius: 3,
    padding: "2px 8px",
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "JetBrains Mono, monospace",
  } as const;
}
