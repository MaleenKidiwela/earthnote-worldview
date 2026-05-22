import { useEffect, useRef, useState } from "react";
import {
  Cartesian3,
  Color,
  PolylineCollection,
  Material,
  Math as CesiumMath,
  type Viewer,
} from "cesium";
import { fetchRiverBundle, type Flowline, type RiverBundle } from "@/feeds/rivers-bundle";
import { USGS_LATEST, USGS_SITES } from "@/feeds/usgs-streamflow";

interface Props {
  viewer: Viewer | null;
  /** sim.result identity — recolor on every engine tick. */
  tick: unknown;
}

/**
 * Renders NHDPlus HR rivers, colored by discharge.
 *
 * Each gauge in the bundle maps to a flowline via siteNo→reach/nhdplusId.
 * We snap the gauge to that flowline, then walk downstream via
 * FromNode/ToNode topology, painting every segment with the gauge's
 * live USGS discharge value until we hit another gauge or the network
 * ends. Segments outside any gauge's downstream cone fall back to mean
 * annual flow (qama) for a baseline color.
 */
export function RiverFlowLayer({ viewer, tick }: Props) {
  const [bundle, setBundle] = useState<RiverBundle | null>(null);
  const collectionRef = useRef<PolylineCollection | null>(null);
  // Precomputed: flowlineId → fromNode for downstream traversal.
  const topologyRef = useRef<{
    byFrom: Map<number, Flowline[]>;
    gaugeToFlowline: Map<string, Flowline>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRiverBundle().then((b) => {
      if (cancelled || !b) return;
      setBundle(b);
      const byFrom = new Map<number, Flowline[]>();
      for (const f of b.flowlines) {
        const list = byFrom.get(f.fromNode) ?? [];
        list.push(f);
        byFrom.set(f.fromNode, list);
      }
      // Map each gauge → its flowline by reachcode or nhdplusid.
      const byReach = new Map<string, Flowline>();
      const byId = new Map<string, Flowline>();
      for (const f of b.flowlines) {
        if (f.reach) byReach.set(f.reach, f);
        if (f.id) byId.set(f.id, f);
      }
      const gaugeToFlowline = new Map<string, Flowline>();
      for (const g of b.gauges) {
        const fl = (g.reach && byReach.get(g.reach)) || byId.get(String(g.nhdplusId));
        if (fl) gaugeToFlowline.set(g.siteNo, fl);
      }
      // Snap any USGS gauge that wasn't in NHDPlusGage to its nearest
      // flowline. ~115 of 240 gauges aren't in NHDPlusGage; without this
      // their live readings never color a river.
      const unmapped = USGS_SITES.filter((s) => !gaugeToFlowline.has(s.id));
      if (unmapped.length) {
        for (const site of unmapped) {
          const fl = nearestFlowline(site.lon, site.lat, b.flowlines);
          if (fl) gaugeToFlowline.set(site.id, fl);
        }
      }
      topologyRef.current = { byFrom, gaugeToFlowline };
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Bump on camera moveEnd so we re-render visible flowlines only.
  const [viewKey, setViewKey] = useState(0);
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const fn = () => setViewKey((k) => k + 1);
    const remove = viewer.camera.moveEnd.addEventListener(fn);
    return remove;
  }, [viewer]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !bundle || !topologyRef.current) return;
    void tick;
    void viewKey;

    // Viewport cull: skip flowlines whose centroid sits outside the camera
    // rectangle. 30k flowlines drop to ~1-3k at typical zoom.
    const rect = viewer.camera.computeViewRectangle();
    const view = rect
      ? {
          south: CesiumMath.toDegrees(rect.south),
          west: CesiumMath.toDegrees(rect.west),
          north: CesiumMath.toDegrees(rect.north),
          east: CesiumMath.toDegrees(rect.east),
        }
      : null;
    // Pad bbox 0.05° so polylines straddling the edge still render.
    const pad = 0.05;
    if (view) {
      view.south -= pad; view.north += pad; view.west -= pad; view.east += pad;
    }

    // Compute discharge per flowline by walking downstream from each gauge.
    const { byFrom, gaugeToFlowline } = topologyRef.current;
    const dischargePerFlow = new Map<string, number>();
    const gaugeNodes = new Set<number>();
    for (const fl of gaugeToFlowline.values()) gaugeNodes.add(fl.fromNode);

    for (const [siteNo, startFlow] of gaugeToFlowline.entries()) {
      const q = USGS_LATEST.get(siteNo);
      if (q == null) continue;
      // Walk downstream BFS until hitting another gauge or running out.
      const visited = new Set<string>([startFlow.id]);
      const queue: Flowline[] = [startFlow];
      dischargePerFlow.set(startFlow.id, q);
      while (queue.length) {
        const cur = queue.shift()!;
        const next = byFrom.get(cur.toNode) ?? [];
        for (const n of next) {
          if (visited.has(n.id)) continue;
          // Stop at a different gauge's flowline; that gauge will paint it.
          if (gaugeToFlowline.has(n.id) || gaugeNodes.has(n.fromNode)) continue;
          visited.add(n.id);
          // Override only if this segment doesn't already have a higher
          // (downstream-accumulated) value from another gauge.
          const prior = dischargePerFlow.get(n.id);
          if (prior == null || q > prior) dischargePerFlow.set(n.id, q);
          queue.push(n);
        }
      }
    }

    // Build the collection.
    if (collectionRef.current && !viewer.isDestroyed()) {
      viewer.scene.primitives.remove(collectionRef.current);
    }
    const coll = new PolylineCollection();
    let drawn = 0;
    for (const f of bundle.flowlines) {
      // Quick viewport reject by any vertex inside padded rect.
      if (view && !flowlineInBbox(f, view)) continue;
      const v = dischargePerFlow.get(f.id) ?? (f.qama ? f.qama * 0.0283168 : null);
      const color = riverColor(v);
      const w = widthFor(f.order, v);
      for (const seg of f.geom) {
        if (seg.length < 2) continue;
        coll.add({
          positions: Cartesian3.fromDegreesArray(seg.flat()),
          width: w,
          material: Material.fromType("Color", { color }),
        });
        drawn++;
      }
      if (drawn > 4000) break; // hard cap so a zoomed-out view can't tank the GPU
    }
    viewer.scene.primitives.add(coll);
    collectionRef.current = coll;

    return () => {
      if (!viewer || viewer.isDestroyed()) return;
      if (collectionRef.current) {
        viewer.scene.primitives.remove(collectionRef.current);
        collectionRef.current = null;
      }
    };
  }, [viewer, bundle, tick, viewKey]);

  return null;
}

/** Precomputed centroid per flowline; fast nearest-flowline lookup. */
let flowCentroids: { f: Flowline; cx: number; cy: number }[] | null = null;
function buildCentroids(flowlines: Flowline[]) {
  flowCentroids = flowlines.map((f) => {
    let sx = 0, sy = 0, n = 0;
    for (const seg of f.geom) {
      for (const [x, y] of seg) {
        sx += x; sy += y; n++;
      }
    }
    return { f, cx: n ? sx / n : 0, cy: n ? sy / n : 0 };
  });
}
function nearestFlowline(lon: number, lat: number, flowlines: Flowline[]): Flowline | null {
  if (!flowCentroids) buildCentroids(flowlines);
  let best: Flowline | null = null;
  let bestD2 = Infinity;
  for (const c of flowCentroids!) {
    const dx = c.cx - lon;
    const dy = c.cy - lat;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = c.f;
    }
  }
  return bestD2 < 0.04 ? best : null; // ~20km centroid cap
}

function flowlineInBbox(
  f: Flowline,
  b: { south: number; west: number; north: number; east: number },
): boolean {
  for (const seg of f.geom) {
    for (const [x, y] of seg) {
      if (x >= b.west && x <= b.east && y >= b.south && y <= b.north) return true;
    }
  }
  return false;
}

function widthFor(order: number, discharge: number | null): number {
  // Bigger rivers thicker; tiny tributaries thinner.
  const base = Math.max(1.2, order * 0.6);
  if (discharge == null) return base;
  // Add a touch of width with discharge so it visually pops.
  return base + Math.min(3, Math.log10(Math.max(1, discharge)) * 0.6);
}

function riverColor(v: number | null): Color {
  if (v == null) return Color.fromBytes(80, 110, 160, 130); // dim no-data
  // 1 → pale cyan, 1000+ → vivid white-blue.
  const t = Math.max(0, Math.min(1, Math.log10(Math.max(0.5, v)) / 3));
  const r = Math.round(63 + 192 * t);
  const g = Math.round(169 + 86 * t);
  const b = 255;
  return Color.fromBytes(r, g, b, 220);
}
