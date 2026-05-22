import { useEffect } from "react";
import {
  Cartesian3,
  Color,
  PolygonHierarchy,
  type Viewer,
} from "cesium";
import { SUB_BASINS, getClippedBasins } from "@pnw/sim";
import { sim } from "@/sim-stub";

export type BasinVariable = "SST" | "DO" | "pH" | "noise" | "omega" | "wqi";

interface BasinHealthLayerProps {
  viewer: Viewer | null;
  variable: BasinVariable;
  /** result identity from useSimClock — forces redraw on tick. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tick: any;
}

/**
 * Renders the 18 Cousin sub-basin polygons as live, color-coded surfaces
 * on the globe. Color comes from the engine's per-basin marine state
 * (sst, dissolved oxygen, pH, broadband noise, aragonite saturation, or
 * the aggregate water-quality index). Each tick redraws the colors so
 * users see the model evolve in place.
 */
export function BasinHealthLayer({ viewer, variable, tick }: BasinHealthLayerProps) {
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    void tick; // dependency only

    // Clean any leftover polygons from a previous render.
    const stale: string[] = [];
    for (let i = 0; i < viewer.entities.values.length; i++) {
      const e = viewer.entities.values[i];
      if (e?.id?.startsWith("basin-")) stale.push(e.id);
    }
    for (const id of stale) viewer.entities.removeById(id);

    const result = sim.result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const basins: Record<string, any> = (result as any)?.marine?.basins ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const marine: any = (result as any)?.marine?.state ?? {};

    // Clipped against the real coastline (mainland + Vancouver Island +
    // smaller islands) so the basins hug the shore instead of overlapping
    // land. Computed once and cached inside @pnw/sim.
    const clipped = getClippedBasins();
    for (const [subId, pieces] of Object.entries(clipped)) {
      const parentId = SUB_BASINS[subId]?.parent ?? null;
      const parent = parentId ? basins[parentId] : null;
      const value = readVariable(variable, parent, marine);
      const health = normalize(variable, value);
      const extrudedHeight = health == null ? 0 : 200 + (1 - health) * 6000;
      const color = healthColor(health);
      pieces.forEach((piece, idx) => {
        const [exterior, ...holes] = piece.rings;
        if (!exterior || exterior.length < 3) return;
        const outer = Cartesian3.fromDegreesArray(exterior.flat());
        const innerHoles = holes
          .filter((h) => h.length >= 3)
          .map((h) => new PolygonHierarchy(Cartesian3.fromDegreesArray(h.flat())));
        viewer.entities.add({
          id: `basin-${subId}${idx === 0 ? "" : `-${idx}`}`,
          name: SUB_BASINS[subId]?.name ?? subId,
          polygon: {
            hierarchy: new PolygonHierarchy(outer, innerHoles),
            material: color.withAlpha(0.7),
            outline: true,
            outlineColor: color.withAlpha(0.9),
            extrudedHeight,
            height: 0,
          },
        });
      });
    }

    return () => {
      if (!viewer || viewer.isDestroyed()) return;
      const ids: string[] = [];
      for (let i = 0; i < viewer.entities.values.length; i++) {
        const e = viewer.entities.values[i];
        if (e?.id?.startsWith("basin-")) ids.push(e.id);
      }
      for (const id of ids) viewer.entities.removeById(id);
    };
  }, [viewer, variable, tick]);

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readVariable(v: BasinVariable, parent: any, marine: any): number | null {
  if (parent) {
    if (v === "SST") return num(parent.SST);
    if (v === "DO") return num(parent.DO);
    if (v === "pH") return num(parent.pH);
    if (v === "noise") return num(parent.noise);
    if (v === "wqi") return num(parent.wqi);
    if (v === "omega") return num(parent.omegaAragonite ?? marine.omegaAragonite);
  }
  // Fall back to aggregate state.
  if (v === "SST") return num(marine.sst);
  if (v === "DO") return num(marine.dissolvedOxygen);
  if (v === "pH") return num(marine.pH);
  if (v === "noise") return num(marine.noiseIndex);
  if (v === "wqi") return num(marine.waterQualityIndex);
  if (v === "omega") return num(marine.omegaAragonite);
  return null;
}

function num(x: unknown): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

/** Normalize variable value to a 0..1 health score. Cool=green, stressed=red. */
function normalize(v: BasinVariable, value: number | null): number | null {
  if (value == null) return null;
  switch (v) {
    case "SST":
      // 8°C = healthy (cool), 18°C = stressed (warm). Higher = redder.
      return clamp01(1 - (value - 8) / (18 - 8));
    case "DO":
      // 8 mg/L = healthy, 2 = hypoxic. Higher = greener.
      return clamp01((value - 2) / (8 - 2));
    case "pH":
      // 8.1 = healthy, 7.6 = acidified. Higher = greener.
      return clamp01((value - 7.6) / (8.1 - 7.6));
    case "noise":
      // 100 dB = quiet, 145 dB = saturated. Lower = greener.
      return clamp01(1 - (value - 100) / (145 - 100));
    case "omega":
      // ≥ 2 saturated, < 1 undersaturated. Higher = greener.
      return clamp01((value - 1) / 1);
    case "wqi":
      // Already 0..1.
      return clamp01(value);
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function healthColor(health: number | null): Color {
  if (health == null) return Color.fromBytes(74, 85, 104, 255); // grey
  const r = Math.round(247 * (1 - health) + 158 * health);
  const g = Math.round(118 * (1 - health) + 206 * health);
  const b = Math.round(142 * (1 - health) + 106 * health);
  return Color.fromBytes(r, g, b, 255);
}
