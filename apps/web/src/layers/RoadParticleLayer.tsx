import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Color,
  PointPrimitiveCollection,
  Viewer,
} from "cesium";
import type { RoadPolyline } from "@/types/osm";

interface RoadParticleLayerProps {
  roads: RoadPolyline[];
  viewer: Viewer | null;
  /** Particles per kilometer of road. 0.05 ≈ one every 20 km. */
  density?: number;
  /** Particle velocity along road (m/s). Highway-ish. */
  speedMps?: number;
}

interface ActiveCollection {
  collection: PointPrimitiveCollection;
  particles: { roadIdx: number; offset: number }[];
  roads: RoadPolyline[];
  /** Per-particle base alpha so we can crossfade without re-allocating. */
  baseAlpha: number[];
  /** 0..1, multiplied into baseAlpha each frame. */
  fadeIn: number;
  fadeOut: number | null;
  removeAt: number | null;
}

/**
 * Animates particles flowing along OSM polylines as a Cesium
 * PointPrimitiveCollection. One collection per snapshot of `roads`;
 * when the roads prop changes (e.g. bundle refresh or viewport pan), we
 * fade the new collection in while the old one fades out so the
 * transition is seamless — no blank frame.
 */
export function RoadParticleLayer({
  roads,
  viewer,
  density = 0.05,
  speedMps = 28,
}: RoadParticleLayerProps) {
  const activeRef = useRef<ActiveCollection[]>([]);
  const lastTRef = useRef(0);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || roads.length === 0) return;

    // Start fade-out on whatever is currently visible.
    for (const a of activeRef.current) {
      if (a.fadeOut == null) a.fadeOut = 1;
    }
    const newActive = buildCollection(viewer, roads, density);
    activeRef.current = [...activeRef.current, newActive];
    if (lastTRef.current === 0) lastTRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = (now - lastTRef.current) / 1000;
      lastTRef.current = now;
      const advance = dt * speedMps;
      const fadeStep = dt / 0.35; // 350ms crossfade

      const alive: ActiveCollection[] = [];
      for (const a of activeRef.current) {
        // Drive fades.
        if (a.fadeIn < 1) a.fadeIn = Math.min(1, a.fadeIn + fadeStep);
        if (a.fadeOut != null) {
          a.fadeOut = Math.max(0, a.fadeOut - fadeStep);
          if (a.fadeOut === 0 && a.removeAt == null) a.removeAt = now;
        }

        // Drop fully faded-out collections one frame later.
        if (a.removeAt != null && now - a.removeAt > 50) {
          if (!viewer.isDestroyed()) viewer.scene.primitives.remove(a.collection);
          continue;
        }
        alive.push(a);

        const items = a.particles;
        const alphaMul = (a.fadeOut ?? 1) * a.fadeIn;
        for (let i = 0; i < items.length; i++) {
          const p = items[i]!;
          const road = a.roads[p.roadIdx]!;
          p.offset = (p.offset + advance) % road.totalLength;
          const [lon, lat] = sampleAlong(road, p.offset);
          const prim = a.collection.get(i);
          if (prim) {
            prim.position = Cartesian3.fromDegrees(lon, lat, 200);
            const baseA = a.baseAlpha[i] ?? 0.9;
            const c = prim.color;
            prim.color = new Color(c.red, c.green, c.blue, baseA * alphaMul);
          }
        }
      }
      activeRef.current = alive;
    };
    viewer.scene.preRender.addEventListener(tick);

    return () => {
      if (!viewer.isDestroyed()) viewer.scene.preRender.removeEventListener(tick);
    };
  }, [viewer, roads, density, speedMps]);

  // Final cleanup on unmount.
  useEffect(() => {
    return () => {
      const v = viewer;
      if (!v || v.isDestroyed()) return;
      for (const a of activeRef.current) v.scene.primitives.remove(a.collection);
      activeRef.current = [];
    };
  }, [viewer]);

  return null;
}

function buildCollection(
  viewer: Viewer,
  roads: RoadPolyline[],
  density: number,
): ActiveCollection {
  const particles: { roadIdx: number; offset: number }[] = [];
  for (let i = 0; i < roads.length; i++) {
    const road = roads[i]!;
    const km = road.totalLength / 1000;
    const count = Math.max(1, Math.floor(km * density));
    for (let k = 0; k < count; k++) {
      particles.push({
        roadIdx: i,
        offset: ((k + Math.random()) * road.totalLength) / count,
      });
    }
  }
  const collection = new PointPrimitiveCollection();
  viewer.scene.primitives.add(collection);
  const base = Color.fromCssColorString("#ffd166");
  const baseAlpha: number[] = [];
  for (const p of particles) {
    const road = roads[p.roadIdx]!;
    const [lon, lat] = sampleAlong(road, p.offset);
    const a = alphaFor(road.classification);
    baseAlpha.push(a);
    collection.add({
      position: Cartesian3.fromDegrees(lon, lat, 200),
      color: new Color(base.red, base.green, base.blue, 0), // start invisible
      pixelSize: pixelSize(road.classification),
    });
  }
  return {
    collection,
    particles,
    roads,
    baseAlpha,
    fadeIn: 0,
    fadeOut: null,
    removeAt: null,
  };
}

function sampleAlong(road: RoadPolyline, offset: number): readonly [number, number] {
  const { points, cumulative, totalLength } = road;
  const s = ((offset % totalLength) + totalLength) % totalLength;
  let lo = 0;
  let hi = cumulative.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid]! <= s) lo = mid;
    else hi = mid;
  }
  const a = points[lo]!;
  const b = points[hi]!;
  const segLen = (cumulative[hi]! - cumulative[lo]!) || 1;
  const t = (s - cumulative[lo]!) / segLen;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function pixelSize(cls: RoadPolyline["classification"]): number {
  if (cls === "motorway") return 5;
  if (cls === "trunk") return 4;
  return 3;
}
function alphaFor(cls: RoadPolyline["classification"]): number {
  if (cls === "motorway") return 0.9;
  if (cls === "trunk") return 0.75;
  return 0.55;
}
