import { useEffect } from "react";
import { Cartesian3, Color, type Viewer } from "cesium";
import type { TremorEvent } from "@/feeds/pnsn-tremor";

interface Props {
  viewer: Viewer | null;
  events: TremorEvent[];
}

/**
 * Cascadia tremor catalog dots.
 *
 * Color encodes recency: bright magenta = within last 24h, fading to
 * deep purple over the loaded window. Size encodes magnitude (small
 * tremor is mag 0.5–2). All events are tagged "tremor-" so the click
 * handler can route them to a detail panel.
 *
 * IMPORTANT (CLAUDE.md two-contract rule): this is observe-only data.
 * The dots represent past deep tremor detections. They do not predict
 * a future earthquake. UI strings reflect that.
 */
export function TremorLayer({ viewer, events }: Props) {
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const ids: string[] = [];
    const now = Date.now();
    const windowMs = 30 * 86_400_000; // 30 days

    for (const e of events) {
      const id = `tremor-${e.id}`;
      ids.push(id);
      const ageH = (now - e.time) / 3_600_000;
      const recency = Math.max(0, Math.min(1, 1 - (now - e.time) / windowMs));
      const color = tremorColor(recency);
      const px = Math.max(2.5, Math.min(7, 3 + e.magnitude * 1.6));
      viewer.entities.add({
        id,
        position: Cartesian3.fromDegrees(e.lon, e.lat, -e.depth * 1000),
        point: {
          pixelSize: px,
          color,
          outlineColor: Color.fromBytes(20, 5, 30, 200),
          outlineWidth: 0.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="font:13px/1.5 system-ui;padding:4px 0">
            <div><b>Cascadia tremor</b> · M${e.magnitude.toFixed(1)}</div>
            <div>Depth ${e.depth.toFixed(0)} km · ${e.duration.toFixed(0)} s</div>
            <div>${new Date(e.time).toUTCString()}</div>
            <div>${Math.round(ageH)} h ago</div>
            <div style="margin-top:6px;opacity:.65">
              Observed deep tremor (PNSN). Tremor loads the locked
              megathrust but is not a deterministic precursor to a
              great earthquake.
            </div>
          </div>
        `,
      });
    }

    return () => {
      if (viewer.isDestroyed()) return;
      for (const id of ids) viewer.entities.removeById(id);
    };
  }, [viewer, events]);

  return null;
}

function tremorColor(recency: number): Color {
  // 1.0 (now) → bright magenta; 0.0 (30 days ago) → deep purple.
  const r = Math.round(80 + 220 * recency);
  const g = Math.round(20 + 30 * recency);
  const b = Math.round(110 + 140 * recency);
  return Color.fromBytes(r, g, b, Math.round(80 + 175 * recency));
}
