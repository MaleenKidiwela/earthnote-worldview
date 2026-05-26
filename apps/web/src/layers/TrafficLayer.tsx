import { useEffect } from "react";
import { Cartesian3, Color, type Viewer } from "cesium";
import type { FlowStation, FlowReading } from "@/feeds/wsdot-traffic";

interface Props {
  viewer: Viewer | null;
  stations: FlowStation[];
}

/**
 * WSDOT traffic-flow sensors. One dot per detection station, colored by
 * the live FlowReadingValue. Renders alongside (not replacing) the
 * cosmetic Road particle layer — particles are pure animation on OSM
 * geometry; these dots are the actual live traffic state from WSDOT.
 */
export function TrafficLayer({ viewer, stations }: Props) {
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const ids: string[] = [];
    for (const s of stations) {
      const id = `wsdot-${s.id}`;
      ids.push(id);
      viewer.entities.add({
        id,
        position: Cartesian3.fromDegrees(s.lon, s.lat, 100),
        point: {
          pixelSize: 7,
          color: flowColor(s.reading),
          outlineColor: Color.BLACK,
          outlineWidth: 0.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="font:13px/1.5 system-ui;padding:4px 0">
            <div><b>${escape(s.description || s.stationName)}</b></div>
            <div>${s.direction} · MP ${s.milepost.toFixed(2)}</div>
            <div>Flow: <b style="color:${flowCss(s.reading)}">${flowLabel(s.reading)}</b></div>
            <div style="opacity:.55">${new Date(s.time).toLocaleString()}</div>
          </div>
        `,
      });
    }
    return () => {
      if (viewer.isDestroyed()) return;
      for (const id of ids) viewer.entities.removeById(id);
    };
  }, [viewer, stations]);

  return null;
}

const PALETTE: Record<FlowReading, [number, number, number]> = {
  0: [120, 120, 120], // Unknown
  1: [80, 220, 90],   // WideOpen — green
  2: [240, 210, 60],  // Moderate — yellow
  3: [240, 130, 50],  // Heavy — orange
  4: [230, 70, 60],   // StopAndGo — red
  5: [70, 70, 90],    // NoData
};

function flowColor(r: FlowReading): Color {
  const [R, G, B] = PALETTE[r];
  return Color.fromBytes(R, G, B, 230);
}
function flowCss(r: FlowReading): string {
  const [R, G, B] = PALETTE[r];
  return `rgb(${R},${G},${B})`;
}
function flowLabel(r: FlowReading): string {
  return ["Unknown", "WideOpen", "Moderate", "Heavy", "StopAndGo", "NoData"][r];
}
function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}
