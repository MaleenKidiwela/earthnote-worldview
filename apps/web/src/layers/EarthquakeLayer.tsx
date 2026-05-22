import { useEffect } from "react";
import {
  Cartesian3,
  Cartesian2,
  Color,
  VerticalOrigin,
  NearFarScalar,
  DistanceDisplayCondition,
  LabelStyle,
} from "cesium";
import type { Earthquake } from "@/types/usgs";

interface EarthquakeLayerProps {
  earthquakes: Earthquake[];
  viewer: import("cesium").Viewer | null;
}

function magToSize(mag: number): number {
  return Math.max(14, Math.min(36, mag * 5));
}

function depthToColor(depth: number): Color {
  if (depth < 70) return Color.fromCssColorString("#ff3333");
  if (depth < 300) return Color.fromCssColorString("#ff8800");
  return Color.fromCssColorString("#3388ff");
}

export function EarthquakeLayer({ earthquakes, viewer }: EarthquakeLayerProps) {
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    try {
      const idsToRemove: string[] = [];
      for (let i = 0; i < viewer.entities.values.length; i++) {
        const e = viewer.entities.values[i];
        if (e?.id?.startsWith("quake-")) idsToRemove.push(e.id);
      }
      for (const id of idsToRemove) viewer.entities.removeById(id);

      for (const q of earthquakes) {
        const color = depthToColor(q.depth);
        viewer.entities.add({
          id: `quake-${q.id}`,
          position: Cartesian3.fromDegrees(q.longitude, q.latitude, 500),
          point: {
            pixelSize: magToSize(q.magnitude),
            color: color.withAlpha(0.7),
            outlineColor: color,
            outlineWidth: 1,
            scaleByDistance: new NearFarScalar(5e3, 1.0, 1e7, 0.4),

          },
          label: {
            text: `M${q.magnitude.toFixed(1)}`,
            font: "14px JetBrains Mono",
            fillColor: Color.WHITE,
            style: LabelStyle.FILL,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -18),
            scaleByDistance: new NearFarScalar(5e3, 1.2, 8e6, 0.9),
            distanceDisplayCondition: new DistanceDisplayCondition(0, 5e6),
          },
        });
      }
    } catch (err) {
      console.warn("EarthquakeLayer error:", err);
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        const ids: string[] = [];
        for (let i = 0; i < viewer.entities.values.length; i++) {
          const e = viewer.entities.values[i];
          if (e?.id?.startsWith("quake-")) ids.push(e.id);
        }
        for (const id of ids) viewer.entities.removeById(id);
      }
    };
  }, [earthquakes, viewer]);

  return null;
}
