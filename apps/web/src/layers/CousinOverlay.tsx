import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  Cartesian3,
  Cartesian2,
  Color,
  ConstantProperty,
  VerticalOrigin,
  LabelStyle,
  PolylineArrowMaterialProperty,
  Viewer,
} from "cesium";
import { sim } from "@/sim-stub";

/**
 * Two-tone health gradient. Health 0 → red (#f7768e), 1 → green (#9ece6a).
 * Entities the engine doesn't model fall back to the dim blue base color.
 */
function healthColor(health: number | null): Color {
  if (health == null) return Color.fromCssColorString("#7aa2f7");
  const r = Math.round(255 * (1 - health) + 158 * health);
  const g = Math.round(118 * (1 - health) + 206 * health);
  const b = Math.round(142 * (1 - health) + 106 * health);
  return Color.fromBytes(r, g, b, 255);
}

interface CousinOverlayProps {
  viewer: Viewer | null;
  selectedEntityId: string | null;
}

/**
 * Renders the Cousin entity graph on the globe.
 * - Always: faint, small dots for every Entity, ids prefixed "cousin-".
 * - On selection (selectedEntityId): the traced subgraph is brightened and
 *   the edges between them drawn as arrows.
 *
 * Entities are stable across renders; we only redraw the trace highlight
 * when the selection changes.
 */
export function CousinOverlay({ viewer, selectedEntityId }: CousinOverlayProps) {
  const entityList = useMemo(() => Array.from(sim.entities.values()), []);
  // Subscribe to engine ticks; `result` changes identity on each tick.
  // The clock itself is driven from GlobeViewer (with realtime feed access).
  const result = useSyncExternalStore(
    (l) => sim.subscribe(l),
    () => sim.result,
    () => sim.result,
  );

  // Base layer: dim markers for every entity (mount once per viewer).
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const baseIds: string[] = [];
    for (const e of entityList) {
      const id = `cousin-${e.id}`;
      baseIds.push(id);
      const health = sim.getValue(e.id);
      const base = healthColor(health);
      viewer.entities.add({
        id,
        position: Cartesian3.fromDegrees(e.lonLat[0], e.lonLat[1]),
        point: {
          pixelSize: health == null ? 6 : 9,
          color: base.withAlpha(health == null ? 0.35 : 0.85),
          outlineColor: Color.BLACK,
          outlineWidth: 1,
        },
        label: {
          text: e.label,
          font: "10px JetBrains Mono",
          fillColor: Color.fromCssColorString("#7aa2f7").withAlpha(0.55),
          style: LabelStyle.FILL,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -8),
          show: false, // labels appear only on selection
        },
      });
    }
    return () => {
      if (viewer.isDestroyed()) return;
      for (const id of baseIds) viewer.entities.removeById(id);
    };
  }, [viewer, entityList]);

  // Trace highlight: redraw when selection changes.
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const tempIds: string[] = [];

    function clearTemp() {
      if (!viewer || viewer.isDestroyed()) return;
      for (const id of tempIds) viewer.entities.removeById(id);
    }

    // Reset every base entity to its current health-driven color. Engine
    // ticks change those colors; this also clears the prior selection
    // highlight.
    for (const e of entityList) {
      const ent = viewer.entities.getById(`cousin-${e.id}`);
      if (!ent || !ent.point) continue;
      const health = sim.getValue(e.id);
      const base = healthColor(health);
      ent.point.color = new ConstantProperty(
        base.withAlpha(health == null ? 0.35 : 0.85),
      );
      ent.point.pixelSize = new ConstantProperty(health == null ? 6 : 9);
      if (ent.label) ent.label.show = new ConstantProperty(false);
    }

    if (!selectedEntityId) {
      return () => clearTemp();
    }

    // selectedEntityId may be prefixed (vessel:, quake:, etc.). Cousin Entities
    // are bare ids. We trace whichever the id resolves to in sim.
    const cousinId = selectedEntityId.includes(":") ? null : selectedEntityId;
    if (!cousinId) {
      return () => clearTemp();
    }

    const result = sim.trace(cousinId, 4);
    const hot = new Set(result.entityIds);

    // Brighten traced entities, show their labels.
    for (const id of hot) {
      const ent = viewer.entities.getById(`cousin-${id}`);
      if (!ent) continue;
      const isRoot = id === cousinId;
      if (ent.point) {
        ent.point.color = new ConstantProperty(
          isRoot
            ? Color.fromCssColorString("#ffc857")
            : Color.fromCssColorString("#7aa2f7"),
        );
        ent.point.pixelSize = new ConstantProperty(
          isRoot ? 14 : 10,
        );
      }
      if (ent.label) {
        ent.label.show = new ConstantProperty(true);
      }
    }

    // Draw arrows for the traced edges.
    for (const edge of result.edges) {
      const src = sim.get(edge.sourceId);
      const dst = sim.get(edge.targetId);
      if (!src || !dst) continue;
      const arrowId = `cousin-edge-${edge.id}`;
      tempIds.push(arrowId);
      const color =
        edge.polarity === 1
          ? Color.fromCssColorString("#9ece6a")
          : Color.fromCssColorString("#f7768e");
      viewer.entities.add({
        id: arrowId,
        polyline: {
          positions: [
            Cartesian3.fromDegrees(src.lonLat[0], src.lonLat[1], 1000),
            Cartesian3.fromDegrees(dst.lonLat[0], dst.lonLat[1], 1000),
          ],
          width: 4,
          material: new PolylineArrowMaterialProperty(color.withAlpha(0.7)),
        },
      });
    }

    return () => clearTemp();
  }, [viewer, selectedEntityId, entityList, result]);

  return null;
}
