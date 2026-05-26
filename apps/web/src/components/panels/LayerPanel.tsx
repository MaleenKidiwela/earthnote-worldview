import { Toggle } from "@/components/ui/Toggle";

export interface LayerState {
  grid: boolean;
  earthquakes: boolean;
  ships: boolean;
  fires: boolean;
  weather: boolean;
  /** GNSS station deformation arrows */
  gnss: boolean;
  /** OSM motorway/trunk/primary road particles */
  roads: boolean;
  /** Cousin causal graph overlay (entities + edge traces on selection) */
  cousin: boolean;
  /** Google Photorealistic 3D Tiles. Off → flat dark road basemap. */
  photoreal: boolean;
  /** Engine-driven sub-basin health polygons (Salish Sea). */
  basins: boolean;
  /** Realtime observation stations (NOAA SST + USGS streamflow). */
  stations: boolean;
  /** NHDPlus rivers colored by gauge discharge, propagated downstream. */
  rivers: boolean;
  /** PNSN Cascadia tremor catalog (observed deep tremor). */
  tremor: boolean;
}

export type BasinVar = "SST" | "DO" | "pH" | "noise" | "omega" | "wqi";

interface LayerPanelProps {
  layers: LayerState;
  onToggle: (layer: keyof LayerState) => void;
  onRefreshRoads?: () => void;
  roadsLoading?: boolean;
  /** 0..1 progress when refreshing the static roads bundle; null = idle. */
  roadsDownloadProgress?: number | null;
  basinVar: BasinVar;
  onBasinVarChange: (v: BasinVar) => void;
}

export function LayerPanel({
  layers,
  onToggle,
  onRefreshRoads,
  roadsLoading,
  roadsDownloadProgress,
  basinVar,
  onBasinVarChange,
}: LayerPanelProps) {
  return (
    <div
      className="panel"
      style={{
        position: "absolute",
        top: 48,
        right: 16,
        width: 180,
        // Keep every toggle reachable even when other UI stacks tall.
        maxHeight: "calc(100vh - 80px)",
        overflowY: "auto",
      }}
    >
      <div className="panel-title">Layers</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Toggle label="Earthquakes" checked={layers.earthquakes} onChange={() => onToggle("earthquakes")} />
        <Toggle label="Tremor (PNSN)" checked={layers.tremor} onChange={() => onToggle("tremor")} />
        <Toggle label="Ships (AIS)" checked={layers.ships} onChange={() => onToggle("ships")} />
        <Toggle label="Fires" checked={layers.fires} onChange={() => onToggle("fires")} />
        <Toggle label="Weather" checked={layers.weather} onChange={() => onToggle("weather")} />
        <Toggle label="GNSS (deformation)" checked={layers.gnss} onChange={() => onToggle("gnss")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Toggle label="Roads (particles)" checked={layers.roads} onChange={() => onToggle("roads")} />
            {layers.roads && onRefreshRoads && (
              <button
                onClick={onRefreshRoads}
                disabled={roadsLoading}
                title="Refetch the static PNW roads bundle"
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "1px solid #4a5568",
                  color: "#cbd5e0",
                  borderRadius: 3,
                  padding: "1px 6px",
                  cursor: roadsLoading ? "wait" : "pointer",
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
              >
                {roadsLoading ? "…" : "↻"}
              </button>
            )}
          </div>
          {layers.roads && roadsLoading && (
            <div
              title={
                roadsDownloadProgress != null
                  ? `downloading bundle ${Math.round(roadsDownloadProgress * 100)}%`
                  : "downloading bundle"
              }
              style={{
                height: 3,
                background: "#1a1f2e",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width:
                    roadsDownloadProgress != null
                      ? `${Math.round(roadsDownloadProgress * 100)}%`
                      : "30%",
                  height: "100%",
                  background: "#7aa2f7",
                  transition: "width 200ms ease",
                  animation:
                    roadsDownloadProgress == null ? "rdLoad 1.4s linear infinite" : undefined,
                }}
              />
              <style>{`
                @keyframes rdLoad {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(280%); }
                }
              `}</style>
            </div>
          )}
        </div>
        <Toggle label="Causal graph" checked={layers.cousin} onChange={() => onToggle("cousin")} />
        <Toggle label="Basin health" checked={layers.basins} onChange={() => onToggle("basins")} />
        {layers.basins && (
          <select
            value={basinVar}
            onChange={(e) => onBasinVarChange(e.target.value as BasinVar)}
            style={{
              marginLeft: 20,
              background: "#1a1f2e",
              color: "#cbd5e0",
              border: "1px solid #4a5568",
              borderRadius: 3,
              padding: "2px 6px",
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            <option value="SST">SST (°C)</option>
            <option value="DO">Dissolved O₂</option>
            <option value="pH">pH</option>
            <option value="omega">Aragonite Ω</option>
            <option value="noise">Underwater noise</option>
            <option value="wqi">Water quality idx</option>
          </select>
        )}
        <Toggle label="Grid" checked={layers.grid} onChange={() => onToggle("grid")} />
        <Toggle label="Photorealistic 3D" checked={layers.photoreal} onChange={() => onToggle("photoreal")} />
        <Toggle label="Live obs stations" checked={layers.stations} onChange={() => onToggle("stations")} />
        <Toggle label="Rivers (discharge)" checked={layers.rivers} onChange={() => onToggle("rivers")} />
      </div>
    </div>
  );
}
