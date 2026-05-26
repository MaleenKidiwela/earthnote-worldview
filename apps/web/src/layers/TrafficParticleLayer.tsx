import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Color,
  PointPrimitiveCollection,
  type Viewer,
} from "cesium";
import type { FlowStation, FlowReading } from "@/feeds/wsdot-traffic";
import type { RoadPolyline } from "@/types/osm";

interface Props {
  viewer: Viewer | null;
  stations: FlowStation[];
  /** Road network to snap stations onto (same precomputed polylines the
   * cosmetic RoadParticleLayer uses). */
  roads: RoadPolyline[];
}

/**
 * Live traffic particles. Each WSDOT sensor snaps to the nearest OSM
 * way; we spawn a short trail of particles on that road segment and
 * animate them along it. Particle color = current FlowReadingValue
 * (green WideOpen → red StopAndGo), particle speed = the actual
 * vehicle speed implied by that reading. So congestion literally moves
 * slower in the visualization.
 */
const SPEED_MPS: Record<FlowReading, number> = {
  0: 5,   // Unknown — slow drift
  1: 30,  // WideOpen — ~67 mph
  2: 18,  // Moderate — ~40 mph
  3: 9,   // Heavy — ~20 mph
  4: 2.5, // StopAndGo — crawl
  5: 0,   // NoData — static
};

const COLOR: Record<FlowReading, [number, number, number]> = {
  0: [120, 120, 120],
  1: [80, 220, 90],
  2: [240, 210, 60],
  3: [240, 130, 50],
  4: [230, 70, 60],
  5: [70, 70, 90],
};

/** Particles spawned per station; trail length. */
const PARTICLES_PER_STATION = 5;
/** Max snap distance to a road (deg² ≈ 1.5 km). */
const SNAP_MAX_D2 = 0.0002;

interface Particle {
  station: FlowStation;
  road: RoadPolyline;
  offset: number; // arc-length along the road, meters
}

export function TrafficParticleLayer({ viewer, stations, roads }: Props) {
  const lastTRef = useRef(0);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || roads.length === 0 || stations.length === 0) return;

    // Build a coarse spatial index of road vertices for cheap snap.
    // Squared-deg distance is fine at PNW latitudes for ranking.
    const particles: Particle[] = [];
    for (const s of stations) {
      // Find nearest road by any vertex within SNAP_MAX_D2.
      let best: { road: RoadPolyline; offset: number; d2: number } | null = null;
      for (const r of roads) {
        for (let i = 0; i < r.points.length; i++) {
          const p = r.points[i]!;
          const dx = p[0] - s.lon;
          const dy = p[1] - s.lat;
          const d2 = dx * dx + dy * dy;
          if (d2 < (best?.d2 ?? Infinity)) {
            best = { road: r, offset: r.cumulative[i] ?? 0, d2 };
          }
        }
      }
      if (!best || best.d2 > SNAP_MAX_D2) continue;
      // Spawn PARTICLES_PER_STATION evenly spread along ~500m of road.
      const trailLen = Math.min(500, best.road.totalLength * 0.5);
      for (let k = 0; k < PARTICLES_PER_STATION; k++) {
        particles.push({
          station: s,
          road: best.road,
          offset: (best.offset + (k * trailLen) / PARTICLES_PER_STATION) % best.road.totalLength,
        });
      }
    }

    if (particles.length === 0) return;

    const coll = new PointPrimitiveCollection();
    viewer.scene.primitives.add(coll);
    for (const p of particles) {
      const [r, g, b] = COLOR[p.station.reading];
      const [lon, lat] = sampleAlong(p.road, p.offset);
      coll.add({
        position: Cartesian3.fromDegrees(lon, lat, 250),
        color: Color.fromBytes(r, g, b, 240),
        pixelSize: 6,
      });
    }

    lastTRef.current = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = (now - lastTRef.current) / 1000;
      lastTRef.current = now;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;
        const speed = SPEED_MPS[p.station.reading];
        p.offset = (p.offset + speed * dt) % p.road.totalLength;
        const [lon, lat] = sampleAlong(p.road, p.offset);
        const prim = coll.get(i);
        if (prim) prim.position = Cartesian3.fromDegrees(lon, lat, 250);
      }
    };
    viewer.scene.preRender.addEventListener(tick);

    return () => {
      if (!viewer.isDestroyed()) {
        viewer.scene.preRender.removeEventListener(tick);
        viewer.scene.primitives.remove(coll);
      }
    };
  }, [viewer, stations, roads]);

  return null;
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
