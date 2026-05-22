import { useEffect, useRef, useState } from "react";
import {
  Cartesian3,
  Color,
  PolylineCollection,
  Material,
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

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !bundle || !topologyRef.current) return;
    void tick;

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
    for (const f of bundle.flowlines) {
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
      }
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
  }, [viewer, bundle, tick]);

  return null;
}

function nearestFlowline(lon: number, lat: number, flowlines: Flowline[]): Flowline | null {
  let best: Flowline | null = null;
  let bestD2 = Infinity;
  // Cheap squared-degree distance — fine for tie-breaking nearest segment
  // and faster than haversine when we're snapping hundreds of gauges.
  for (const f of flowlines) {
    for (const seg of f.geom) {
      for (const [x, y] of seg) {
        const dx = x - lon;
        const dy = y - lat;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = f;
        }
      }
    }
  }
  // Reject if the nearest vertex is > ~10 km (0.1°) — probably a coastal
  // gauge we shouldn't pin to a random river.
  return bestD2 < 0.01 ? best : null;
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
