import { useEffect, useState, useSyncExternalStore } from "react";
import {
  setMaxOverride,
  getMaxOverride,
  currentRange,
  subscribeScale,
} from "@/lib/dischargeScale";
import { USGS_LATEST } from "@/feeds/usgs-streamflow";

/**
 * Tiny slider that pins the red end of the discharge gradient. Defaults
 * to "Auto" = live max across the 240 gauges; dragging sets a manual
 * cap (log scale, 0.1..5000 m³/s). Used to focus the gradient on a
 * specific flow band (e.g. small streams) without one Columbia-class
 * gauge washing the rest cyan.
 */
const LOG_MIN = -1; // log10(0.1)
const LOG_MAX = 3.7; // log10(5000)

export function DischargeScalePanel() {
  // Re-render when scale changes or new gauge data arrives.
  useSyncExternalStore(subscribeScale, getMaxOverride, getMaxOverride);
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  const override = getMaxOverride();
  const { max: liveMax } = currentRange();
  const value = override ?? liveMax;
  const logVal = Math.log10(Math.max(0.1, value));
  const slider = ((logVal - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;

  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        right: 210, // sit just left of the layer panel
        background: "rgba(20, 25, 38, 0.92)",
        border: "1px solid #2d3748",
        borderRadius: 4,
        padding: "6px 10px",
        width: 200,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
        color: "#cbd5e0",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Red @ {value.toFixed(value < 10 ? 1 : 0)} m³/s</span>
        <button
          onClick={() => setMaxOverride(null)}
          disabled={override == null}
          style={{
            background: "transparent",
            border: "1px solid #4a5568",
            color: override == null ? "#4a5568" : "#7aa2f7",
            borderRadius: 3,
            padding: "1px 6px",
            cursor: override == null ? "default" : "pointer",
            fontSize: 9,
          }}
          title="Reset to live max across all gauges"
        >
          AUTO
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={slider}
        onChange={(e) => {
          const t = Number(e.target.value) / 100;
          const v = Math.pow(10, LOG_MIN + t * (LOG_MAX - LOG_MIN));
          setMaxOverride(v);
        }}
        style={{ width: "100%", margin: "4px 0", accentColor: "#e84a4a" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, opacity: 0.6 }}>
        <span>0.1</span>
        <span>10</span>
        <span>1000</span>
        <span>5000 m³/s</span>
      </div>
      <div style={{ fontSize: 9, opacity: 0.5, marginTop: 2 }}>
        live max: {liveMax.toFixed(liveMax < 10 ? 1 : 0)} m³/s · gauges: {USGS_LATEST.size}
      </div>
    </div>
  );
}
