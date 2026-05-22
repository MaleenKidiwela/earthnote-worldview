import { useEffect, useState } from "react";
import {
  Cartesian3,
  Cartesian2,
  Color,
  LabelStyle,
  VerticalOrigin,
  DistanceDisplayCondition,
  type Viewer,
} from "cesium";
import { NOAA_STATIONS, NOAA_LATEST } from "@/feeds/noaa-tides";
import { USGS_SITES, USGS_LATEST } from "@/feeds/usgs-streamflow";
import { dischargeColor as scaledDischargeColor, subscribeScale } from "@/lib/dischargeScale";

interface Props {
  viewer: Viewer | null;
  /** Any value that changes per tick forces a redraw (sim.result identity). */
  tick: unknown;
}

/**
 * Plots the realtime observation stations that feed the Twin engine —
 * NOAA water-temp gauges and USGS streamflow gauges — directly on the
 * map with their latest measured value. Color reflects the variable so
 * the user can see WHAT the engine is being nudged by, not just that it
 * is being nudged.
 */
export function LiveStationsLayer({ viewer, tick }: Props) {
  // Force re-render when the user moves the discharge-scale slider.
  const [, setScaleKey] = useState(0);
  useEffect(() => subscribeScale(() => setScaleKey((k) => k + 1)), []);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    void tick;

    const ids: string[] = [];

    for (const s of NOAA_STATIONS) {
      const id = `noaa-${s.id}`;
      ids.push(id);
      const sst = NOAA_LATEST.get(s.id);
      const label =
        sst != null ? `${s.name}\n${sst.toFixed(1)}°C` : `${s.name}\n…`;
      viewer.entities.add({
        id,
        position: Cartesian3.fromDegrees(s.lon, s.lat, 100),
        point: {
          pixelSize: 9,
          color: sstColor(sst),
          outlineColor: Color.BLACK,
          outlineWidth: 1.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: label,
          font: "10px JetBrains Mono",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }

    // Hundreds of streamflow gauges across the Cascades — draw them as
    // small cyan dots, only show the label when zoomed in (< 200 km).
    for (const s of USGS_SITES) {
      const id = `usgs-${s.id}`;
      ids.push(id);
      const q = USGS_LATEST.get(s.id);
      const label =
        q != null ? `${shortName(s.name)}\n${q.toFixed(0)} m³/s` : shortName(s.name);
      viewer.entities.add({
        id,
        position: Cartesian3.fromDegrees(s.lon, s.lat, 100),
        point: {
          pixelSize: dischargeSize(q),
          color: dischargeColor(q),
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: label,
          font: "9px JetBrains Mono",
          fillColor: Color.fromCssColorString("#9ad1ff"),
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -10),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new DistanceDisplayCondition(0, 2e5),
        },
      });
    }

    return () => {
      if (viewer.isDestroyed()) return;
      for (const id of ids) viewer.entities.removeById(id);
    };
  }, [viewer, tick]);

  return null;
}

function sstColor(v: number | undefined): Color {
  if (v == null) return Color.GREY;
  // 8°C cool/green → 16°C warm/red.
  const t = Math.max(0, Math.min(1, (v - 8) / (16 - 8)));
  const r = Math.round(80 * (1 - t) + 247 * t);
  const g = Math.round(220 * (1 - t) + 118 * t);
  const b = Math.round(180 * (1 - t) + 142 * t);
  return Color.fromBytes(r, g, b, 255);
}

// Use the shared blue→red discharge scale (normalized to the live
// min/max across all 240 USGS gauges) so gauge dots and river polylines
// always agree.
function dischargeColor(v: number | undefined): Color {
  return scaledDischargeColor(v ?? null);
}

function dischargeSize(v: number | undefined): number {
  if (v == null) return 4;
  // 1 m³/s → 4 px; 100 m³/s → 7 px; 1000 → 10 px.
  return Math.max(4, Math.min(10, 4 + Math.log10(Math.max(1, v)) * 2));
}

function shortName(name: string): string {
  // USGS site names are long, e.g. "SAUK RIVER NEAR SAUK, WA". Trim.
  return name
    .replace(/^(NF|SF|EF|WF)\s+/i, "")
    .replace(/\b(NEAR|AT|BL|ABOVE|BELOW)\b.*$/i, "")
    .trim()
    .slice(0, 24);
}
