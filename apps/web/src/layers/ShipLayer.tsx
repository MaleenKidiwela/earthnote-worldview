import { useEffect, useMemo } from "react";
import {
  Cartesian3,
  Cartesian2,
  Color,
  VerticalOrigin,
  HorizontalOrigin,
  NearFarScalar,
  DistanceDisplayCondition,
  LabelStyle,
  Math as CesiumMath,
} from "cesium";
import type { Vessel } from "@/types/ais";

interface ShipLayerProps {
  vessels: Vessel[];
  viewer: import("cesium").Viewer | null;
}

/**
 * Vessel class taxonomy and color palette modeled on MarineTraffic's
 * convention so the map reads the same way: cargo blue, tanker red,
 * passenger blue-grey, fishing brown, tug/special yellow.
 *
 * Codes follow the AIS shipType (ITU-R M.1371) ranges.
 */
type VesselClass =
  | "passenger"
  | "cargo"
  | "tanker"
  | "fishing"
  | "tugSpecial"
  | "highSpeed"
  | "pleasure"
  | "other";

const CLASS_COLOR: Record<VesselClass, string> = {
  passenger: "#3aa6ff",
  cargo: "#3bc77a",
  tanker: "#ff4d4d",
  fishing: "#c08a3e",
  tugSpecial: "#ffd23f",
  highSpeed: "#f368e0",
  pleasure: "#9b8cff",
  other: "#9ec5d8",
};

function classify(shipType: number): VesselClass {
  if (shipType >= 60 && shipType <= 69) return "passenger";
  if (shipType >= 70 && shipType <= 79) return "cargo";
  if (shipType >= 80 && shipType <= 89) return "tanker";
  if (shipType === 30) return "fishing";
  if (shipType === 31 || shipType === 32 || (shipType >= 50 && shipType <= 59))
    return "tugSpecial";
  if (shipType >= 40 && shipType <= 49) return "highSpeed";
  if (shipType === 36 || shipType === 37) return "pleasure";
  return "other";
}

// Directional pointer per color. SVG data URI generated once per color so we
// reuse the billboard image across vessels of the same class.
const SVG_CACHE = new Map<string, string>();
function arrowSvg(color: string): string {
  const cached = SVG_CACHE.get(color);
  if (cached) return cached;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><path d="M16 2 L28 28 L16 22 L4 28 Z" fill="${color}" stroke="#04111c" stroke-width="2" stroke-linejoin="round"/></svg>`;
  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  SVG_CACHE.set(color, uri);
  return uri;
}

export function ShipLayer({ vessels, viewer }: ShipLayerProps) {
  // Precompute per-vessel display fields once per vessels array change.
  const items = useMemo(
    () =>
      vessels.map((v) => {
        const cls = classify(v.shipType);
        const colorHex = CLASS_COLOR[cls];
        return {
          v,
          cls,
          colorHex,
          image: arrowSvg(colorHex),
        };
      }),
    [vessels],
  );

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    try {
      const idsToRemove: string[] = [];
      for (let i = 0; i < viewer.entities.values.length; i++) {
        const e = viewer.entities.values[i];
        if (e?.id?.startsWith("ship-")) idsToRemove.push(e.id);
      }
      for (const id of idsToRemove) viewer.entities.removeById(id);

      for (const { v, cls, colorHex, image } of items) {
        const labelColor = Color.fromCssColorString(colorHex);
        viewer.entities.add({
          id: `ship-${v.mmsi}`,
          name: v.name,
          // Description shows up in the default selection popup when the user
          // clicks a vessel. Keep it compact, MarineTraffic-style.
          description: `
            <div style="font:13px/1.5 system-ui;padding:4px 0">
              <div><b>${escape(v.name)}</b> <span style="opacity:.6">MMSI ${v.mmsi}</span></div>
              <div>Class: <b>${cls}</b> (AIS type ${v.shipType || "—"})</div>
              <div>Speed: ${v.sog.toFixed(1)} kn · Course: ${Math.round(v.cog)}°</div>
              <div>Destination: ${escape(v.destination || "—")}</div>
            </div>
          `,
          position: Cartesian3.fromDegrees(v.longitude, v.latitude, 100),
          billboard: {
            image,
            width: 32,
            height: 32,
            rotation: CesiumMath.toRadians(-v.heading),
            verticalOrigin: VerticalOrigin.CENTER,
            horizontalOrigin: HorizontalOrigin.CENTER,
            scaleByDistance: new NearFarScalar(5e3, 0.9, 5e7, 0.7),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: v.name,
            font: "12px JetBrains Mono",
            fillColor: labelColor,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -22),
            scaleByDistance: new NearFarScalar(5e3, 1.0, 4e6, 0.7),
            // Only show labels when zoomed in enough that they don't
            // overlap into a wall of text.
            distanceDisplayCondition: new DistanceDisplayCondition(0, 2e6),
          },
        });
      }
    } catch (err) {
      console.warn("ShipLayer error:", err);
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        const ids: string[] = [];
        for (let i = 0; i < viewer.entities.values.length; i++) {
          const e = viewer.entities.values[i];
          if (e?.id?.startsWith("ship-")) ids.push(e.id);
        }
        for (const id of ids) viewer.entities.removeById(id);
      }
    };
  }, [items, viewer]);

  return null;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}
