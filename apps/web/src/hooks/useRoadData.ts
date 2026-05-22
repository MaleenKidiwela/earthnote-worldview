import { useEffect, useRef, useState } from "react";
import type { Viewer } from "cesium";
import { Math as CesiumMath } from "cesium";
import type { RoadPolyline } from "@/types/osm";
import { fetchRoadPolylines, type BBox } from "@/feeds/osm";

/**
 * Viewport-driven road loader. On every camera moveEnd we compute the
 * current view bbox and refetch if it changed materially. Overpass cannot
 * serve PNW-wide motorway/trunk in one shot, so we always fetch only what
 * the user is looking at. Class set widens as the user zooms in.
 *
 * The hook intentionally has no global cache yet: each significant pan
 * triggers a fresh fetch. That keeps the path simple. If it becomes
 * painful, add a quadkey/tile cache here.
 */
const DEBOUNCE_MS = 600;
const MAX_SPAN_DEG = 12; // above this, view is so wide that even motorways 504.
const MIN_DELTA = 0.15; // pan/zoom must change a bbox edge by this many deg.

export function useRoadData(enabled: boolean, viewer: Viewer | null) {
  const [roads, setRoads] = useState<RoadPolyline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastBboxRef = useRef<BBox | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setRoads([]);
      lastBboxRef.current = null;
      return;
    }
    if (!viewer || viewer.isDestroyed()) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const bbox = viewportBbox(viewer);
        if (!bbox) return;
        const span = Math.max(bbox.north - bbox.south, bbox.east - bbox.west);
        if (span > MAX_SPAN_DEG) {
          // Too zoomed out, refuse to ask Overpass; clear any stale roads.
          if (roads.length) setRoads([]);
          lastBboxRef.current = null;
          return;
        }
        const last = lastBboxRef.current;
        if (last && !bboxChanged(last, bbox, MIN_DELTA)) return;
        lastBboxRef.current = bbox;

        const mySeq = ++seqRef.current;
        setLoading(true);
        fetchRoadPolylines(bbox)
          .then((data) => {
            if (mySeq !== seqRef.current) return; // stale
            setRoads(data);
            setError(null);
          })
          .catch((err) => {
            if (mySeq !== seqRef.current) return;
            setError(err instanceof Error ? err.message : "OSM fetch failed");
          })
          .finally(() => {
            if (mySeq === seqRef.current) setLoading(false);
          });
      }, DEBOUNCE_MS);
    };

    trigger();
    const remove = viewer.camera.moveEnd.addEventListener(trigger);
    return () => {
      if (timer) clearTimeout(timer);
      remove();
    };
    // roads.length is intentionally omitted: we only refetch on enabled/viewer
    // changes and on camera moveEnd. roads state changes from inside the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, viewer]);

  return { roads, count: roads.length, loading, error };
}

function viewportBbox(viewer: Viewer): BBox | null {
  const rect = viewer.camera.computeViewRectangle();
  if (!rect) return null;
  return {
    south: CesiumMath.toDegrees(rect.south),
    west: CesiumMath.toDegrees(rect.west),
    north: CesiumMath.toDegrees(rect.north),
    east: CesiumMath.toDegrees(rect.east),
  };
}

function bboxChanged(a: BBox, b: BBox, minDelta: number): boolean {
  return (
    Math.abs(a.south - b.south) > minDelta ||
    Math.abs(a.north - b.north) > minDelta ||
    Math.abs(a.west - b.west) > minDelta ||
    Math.abs(a.east - b.east) > minDelta
  );
}
