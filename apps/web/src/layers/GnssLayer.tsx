import { useEffect } from "react";
import {
  Cartesian3,
  Cartesian2,
  Color,
  PolylineArrowMaterialProperty,
  VerticalOrigin,
  LabelStyle,
  Viewer,
} from "cesium";
import type { GnssStation } from "@/types/gnss";

interface GnssLayerProps {
  stations: GnssStation[];
  viewer: Viewer | null;
}

/**
 * Visualization choices, tuned for legibility on a regional map:
 *
 *   • Station marker: small pulsing dot, anchored to the station.
 *   • Velocity arrow: starts at station, length scaled by horizontal speed
 *     (mm/yr → on-ground km), bearing from atan2(vEast, vNorth). Cascadia's
 *     interseismic field falls out immediately: outer-coast sites point ENE
 *     at ~12 mm/yr, inland sites are short and mostly motionless.
 *   • Color ramp: cool teal at low speed, warm amber at high speed.
 *   • Calibration tag: anything calibrated:false renders with a dashed
 *     outline ring so the viewer knows it's a layout estimate, not a fit.
 */
export function GnssLayer({ stations, viewer }: GnssLayerProps) {
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    // Wipe prior gnss-* entities first.
    const prior: string[] = [];
    for (let i = 0; i < viewer.entities.values.length; i++) {
      const e = viewer.entities.values[i];
      if (e?.id?.startsWith("gnss-")) prior.push(e.id);
    }
    for (const id of prior) viewer.entities.removeById(id);

    for (const s of stations) {
      const speed = Math.hypot(s.vEast, s.vNorth); // mm/yr
      const color = velocityColor(speed);
      const start = Cartesian3.fromDegrees(s.longitude, s.latitude, 100);

      // Project the velocity vector to a geographic offset.
      // 1 mm/yr → ~6 km arrow length (visual scale).
      const ARROW_SCALE_KM_PER_MMYR = 6;
      const dxKm = s.vEast * ARROW_SCALE_KM_PER_MMYR;
      const dyKm = s.vNorth * ARROW_SCALE_KM_PER_MMYR;
      const dLon = dxKm / (111.32 * Math.cos((s.latitude * Math.PI) / 180));
      const dLat = dyKm / 110.574;
      const endLon = s.longitude + dLon;
      const endLat = s.latitude + dLat;
      const end = Cartesian3.fromDegrees(endLon, endLat, 100);

      // Station dot
      viewer.entities.add({
        id: `gnss-station-${s.id}`,
        position: start,
        point: {
          pixelSize: 7,
          color: Color.WHITE.withAlpha(0.95),
          outlineColor: s.calibrated ? color : color.withAlpha(0.6),
          outlineWidth: 2,
        },
        label: {
          text: s.id,
          font: "10px JetBrains Mono",
          fillColor: color,
          style: LabelStyle.FILL,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -10),
        },
      });

      // Velocity arrow
      viewer.entities.add({
        id: `gnss-arrow-${s.id}`,
        polyline: {
          positions: [start, end],
          width: 6,
          material: new PolylineArrowMaterialProperty(color.withAlpha(0.85)),
          clampToGround: false,
        },
      });
    }

    return () => {
      if (viewer.isDestroyed()) return;
      const ids: string[] = [];
      for (let i = 0; i < viewer.entities.values.length; i++) {
        const e = viewer.entities.values[i];
        if (e?.id?.startsWith("gnss-")) ids.push(e.id);
      }
      for (const id of ids) viewer.entities.removeById(id);
    };
  }, [viewer, stations]);

  return null;
}

/** Cool → warm ramp keyed to horizontal speed in mm/yr. */
function velocityColor(speedMmPerYr: number): Color {
  // Cascadia outer-coast sites peak around 13–14 mm/yr in NA-fixed.
  const t = Math.max(0, Math.min(1, speedMmPerYr / 14));
  // Interpolate teal (#7dd3fc) → amber (#ffc857)
  const r = lerp(0x7d, 0xff, t);
  const g = lerp(0xd3, 0xc8, t);
  const b = lerp(0xfc, 0x57, t);
  return Color.fromBytes(r, g, b, 255);
}
function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}
