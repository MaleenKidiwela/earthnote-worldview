import type { GnssStation } from "@/types/gnss";

interface StationDetailPanelProps {
  station: GnssStation | null;
  onClose: () => void;
}

export function StationDetailPanel({ station, onClose }: StationDetailPanelProps) {
  if (!station) return null;
  const speed = Math.hypot(station.vEast, station.vNorth);
  const bearing = ((Math.atan2(station.vEast, station.vNorth) * 180) / Math.PI + 360) % 360;
  return (
    <div
      className="panel"
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        width: 320,
        padding: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="panel-title">{station.id} · {station.network}</div>
        <button onClick={onClose} style={{ background: "transparent", color: "var(--color-text-dim)", border: 0, cursor: "pointer" }}>×</button>
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-dim)", marginBottom: 8 }}>
        {station.name}
      </div>
      <Row k="Position" v={`${station.latitude.toFixed(3)}°, ${station.longitude.toFixed(3)}°`} />
      <Row k="vEast" v={`${station.vEast.toFixed(1)} mm/yr`} />
      <Row k="vNorth" v={`${station.vNorth.toFixed(1)} mm/yr`} />
      <Row k="vUp" v={`${station.vUp.toFixed(1)} mm/yr`} />
      <Row k="Speed (horiz)" v={`${speed.toFixed(1)} mm/yr`} />
      <Row k="Bearing" v={`${bearing.toFixed(0)}° (from N)`} />
      <Row k="1σ" v={`±${station.sigma.toFixed(1)} mm/yr`} />
      <div
        style={{
          marginTop: 8,
          padding: "6px 8px",
          fontSize: 10,
          background: station.calibrated ? "rgba(126,231,135,0.10)" : "rgba(255,200,87,0.10)",
          color: station.calibrated ? "var(--color-accent-good)" : "var(--color-accent-warn)",
          border: `1px solid ${station.calibrated ? "rgba(126,231,135,0.4)" : "rgba(255,200,87,0.4)"}`,
        }}
      >
        {station.calibrated
          ? "Calibrated: velocities loaded from primary source."
          : "Layout estimate: velocities are first-order interseismic values. Replace by fetching the station's Nevada Geodetic Lab tenv3 or EarthScope GAGE solution."}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
      <span style={{ color: "var(--color-text-dim)" }}>{k}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>
  );
}
