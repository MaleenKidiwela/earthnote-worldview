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
}

interface LayerPanelProps {
  layers: LayerState;
  onToggle: (layer: keyof LayerState) => void;
}

export function LayerPanel({ layers, onToggle }: LayerPanelProps) {
  return (
    <div className="panel" style={{ position: "absolute", top: 48, right: 16, width: 180 }}>
      <div className="panel-title">Layers</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Toggle label="Earthquakes" checked={layers.earthquakes} onChange={() => onToggle("earthquakes")} />
        <Toggle label="Ships (AIS)" checked={layers.ships} onChange={() => onToggle("ships")} />
        <Toggle label="Fires" checked={layers.fires} onChange={() => onToggle("fires")} />
        <Toggle label="Weather" checked={layers.weather} onChange={() => onToggle("weather")} />
        <Toggle label="GNSS (deformation)" checked={layers.gnss} onChange={() => onToggle("gnss")} />
        <Toggle label="Roads (particles)" checked={layers.roads} onChange={() => onToggle("roads")} />
        <Toggle label="Cousin graph" checked={layers.cousin} onChange={() => onToggle("cousin")} />
        <Toggle label="Grid" checked={layers.grid} onChange={() => onToggle("grid")} />
      </div>
    </div>
  );
}
