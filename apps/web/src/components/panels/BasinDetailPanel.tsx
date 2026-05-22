import { useSyncExternalStore } from "react";
import { SUB_BASINS } from "@pnw/sim";
import { sim } from "@/sim-stub";

interface BasinDetailPanelProps {
  basinId: string | null;
  onClose: () => void;
}

/**
 * Click-through panel for a sub-basin polygon. Pulls the live engine
 * state for the parent basin and renders every modeled variable with
 * units, so the user can interrogate any point in the Salish Sea.
 */
export function BasinDetailPanel({ basinId, onClose }: BasinDetailPanelProps) {
  const result = useSyncExternalStore(
    (l) => sim.subscribe(l),
    () => sim.result,
    () => sim.result,
  );

  if (!basinId) return null;

  const meta = SUB_BASINS[basinId];
  const parentId = meta?.parent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const basins: Record<string, any> = (result as any)?.marine?.basins ?? {};
  const basin = parentId ? basins[parentId] : null;

  const rows: Array<[string, string, string]> = basin
    ? [
        ["SST", fmt(basin.SST, 1), "°C"],
        ["Dissolved O₂", fmt(basin.DO, 1), "mg/L"],
        ["pH", fmt(basin.pH, 2), ""],
        ["Salinity", fmt(basin.salinity, 1), "PSU"],
        ["Nutrients", fmt(basin.nutrients, 1), "µmol/L"],
        ["Turbidity", fmt(basin.turbidity, 2), "NTU"],
        ["Noise", fmt(basin.noise, 0), "dB"],
        ["Contamination", fmt(basin.contam, 2), "idx"],
        ["Aragonite Ω", fmt(basin.omegaAragonite, 2), ""],
        ["Phytoplankton", fmt(basin.phyto, 0), "mg/m³"],
        ["WQI", fmt(basin.wqi, 2), "0..1"],
        ["HAB intensity", fmt(basin.habIntensity, 2), "0..1"],
        ["Shellfish closure", fmt(basin.shellfishClosure, 2), "frac"],
        ["MHW active", basin.mhwActive ? "yes" : "no", ""],
      ]
    : [];

  return (
    <div
      className="panel"
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        width: 260,
        maxHeight: "calc(100vh - 80px)",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="panel-title">{meta?.name ?? basinId}</div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            color: "#cbd5e0",
            border: "1px solid #4a5568",
            borderRadius: 3,
            padding: "0 6px",
            cursor: "pointer",
            fontSize: 11,
          }}
        >
          ×
        </button>
      </div>
      {meta && (
        <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 8 }}>
          parent: {parentId} · area {meta.surfaceArea} km² · depth {meta.totalDepth} m
          {meta.tribalNations?.length ? ` · tribal: ${meta.tribalNations.join(", ")}` : ""}
        </div>
      )}
      {basin ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11 }}>
          {rows.map(([k, v, u]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.85 }}>{k}</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {v} <span style={{ opacity: 0.5 }}>{u}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ opacity: 0.6, fontSize: 11 }}>No engine state yet (booting).</div>
      )}
    </div>
  );
}

function fmt(x: unknown, decimals: number): string {
  return typeof x === "number" && Number.isFinite(x) ? x.toFixed(decimals) : "—";
}
