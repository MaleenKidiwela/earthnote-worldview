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

/**
 * Animates particles flowing along OSM polylines as a Cesium
 * PointPrimitiveCollection. One collection holds all particles; per frame
 * we advance each particle's arc-length offset along its assigned road and
 * write its new world position. No per-particle entities, no GC.
 *
 * Density × total road length sets particle count. Stays under a few
 * thousand even with all PNW motorways loaded.
 */
export function RoadParticleLayer({
  roads,
  viewer,
  density = 0.05,
  speedMps = 28,
}: RoadParticleLayerProps) {
  const collectionRef = useRef<PointPrimitiveCollection | null>(null);
  const stateRef = useRef<{
    particles: { roadIdx: number; offset: number }[];
    lastT: number;
  }>({ particles: [], lastT: 0 });

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || roads.length === 0) return;

    // Build particle list: density particles per km, distributed uniformly.
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
    stateRef.current.particles = particles;
    stateRef.current.lastT = performance.now();

    const collection = new PointPrimitiveCollection();
    viewer.scene.primitives.add(collection);
    collectionRef.current = collection;

    // Pre-allocate one primitive per particle.
    const baseColor = Color.fromCssColorString("#ffd166").withAlpha(0.9);
    for (const p of particles) {
      const road = roads[p.roadIdx]!;
      const [lon, lat] = sampleAlong(road, p.offset);
      collection.add({
        position: Cartesian3.fromDegrees(lon, lat, 200),
        color: classColor(road.classification, baseColor),
        pixelSize: pixelSize(road.classification),
      });
    }

    // Per-frame tick.
    const tick = (_scene: unknown, time: { secondsOfDay: number }) => {
      void time;
      const now = performance.now();
      const dt = (now - stateRef.current.lastT) / 1000;
      stateRef.current.lastT = now;
      const advance = dt * speedMps;
      const items = stateRef.current.particles;
      for (let i = 0; i < items.length; i++) {
        const p = items[i]!;
        const road = roads[p.roadIdx]!;
        p.offset = (p.offset + advance) % road.totalLength;
        const [lon, lat] = sampleAlong(road, p.offset);
        const prim = collection.get(i);
        if (prim) prim.position = Cartesian3.fromDegrees(lon, lat, 200);
      }
    };
    viewer.scene.preRender.addEventListener(tick);

    return () => {
      viewer.scene.preRender.removeEventListener(tick);
      if (!viewer.isDestroyed()) viewer.scene.primitives.remove(collection);
      collectionRef.current = null;
    };
  }, [viewer, roads, density, speedMps]);

  return null;
}

/** Walk the road's cumulative arc-length and lerp between vertices. */
function sampleAlong(road: RoadPolyline, offset: number): readonly [number, number] {
  const { points, cumulative, totalLength } = road;
  const s = ((offset % totalLength) + totalLength) % totalLength;
  // Binary search for the segment containing s.
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
function classColor(cls: RoadPolyline["classification"], base: Color): Color {
  if (cls === "motorway") return base;
  if (cls === "trunk") return base.withAlpha(0.75);
  return base.withAlpha(0.55);
}
