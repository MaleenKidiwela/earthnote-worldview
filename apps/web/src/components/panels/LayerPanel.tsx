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
}

interface LayerPanelProps {
  layers: LayerState;
  onToggle: (layer: keyof LayerState) => void;
  onRefreshRoads?: () => void;
  roadsLoading?: boolean;
}

export function LayerPanel({ layers, onToggle, onRefreshRoads, roadsLoading }: LayerPanelProps) {
  return (
    <div className="panel" style={{ position: "absolute", top: 48, right: 16, width: 180 }}>
      <div className="panel-title">Layers</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Toggle label="Earthquakes" checked={layers.earthquakes} onChange={() => onToggle("earthquakes")} />
        <Toggle label="Ships (AIS)" checked={layers.ships} onChange={() => onToggle("ships")} />
        <Toggle label="Fires" checked={layers.fires} onChange={() => onToggle("fires")} />
        <Toggle label="Weather" checked={layers.weather} onChange={() => onToggle("weather")} />
        <Toggle label="GNSS (deformation)" checked={layers.gnss} onChange={() => onToggle("gnss")} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Toggle label="Roads (particles)" checked={layers.roads} onChange={() => onToggle("roads")} />
          {layers.roads && onRefreshRoads && (
            <button
              onClick={onRefreshRoads}
              disabled={roadsLoading}
              title="Refetch roads for the current viewport"
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
        <Toggle label="Cousin graph" checked={layers.cousin} onChange={() => onToggle("cousin")} />
        <Toggle label="Grid" checked={layers.grid} onChange={() => onToggle("grid")} />
        <Toggle label="Photorealistic 3D" checked={layers.photoreal} onChange={() => onToggle("photoreal")} />
      </div>
    </div>
  );
}
