import { useEffect, useRef, useState } from "react";
import type { Viewer } from "cesium";
import { Math as CesiumMath } from "cesium";
import type { RoadPolyline } from "@/types/osm";
import { fetchRoadPolylines, classStages, type BBox } from "@/feeds/osm";

/**
 * Viewport-driven road loader with progressive class staging.
 *
 * Each settled viewport runs through two Overpass calls in sequence:
 *   stage 0 — motorways/trunks: small payload, ~1 s, renders immediately
 *   stage 1 — primary/secondary: heavier, merges in when ready
 *
 * A new viewport change aborts in-flight stages so we don't paint stale
 * roads for a region the user already left.
 */
const DEBOUNCE_MS = 350;
const MAX_SPAN_DEG = 12;
const MIN_DELTA = 0.03;

export function useRoadData(enabled: boolean, viewer: Viewer | null) {
  const [roads, setRoads] = useState<RoadPolyline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastBboxRef = useRef<BBox | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  const triggerRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled) {
      setRoads([]);
      lastBboxRef.current = null;
      abortRef.current?.abort();
      return;
    }
    if (!viewer || viewer.isDestroyed()) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const bbox = viewportBbox(viewer);
        if (!bbox) return;
        const span = Math.max(bbox.north - bbox.south, bbox.east - bbox.west);
        if (span > MAX_SPAN_DEG) {
          lastBboxRef.current = null;
          return;
        }
        const last = lastBboxRef.current;
        if (last && !bboxChanged(last, bbox, MIN_DELTA)) return;
        lastBboxRef.current = bbox;

        // Cancel any prior fetch for the previous viewport.
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        const mySeq = ++seqRef.current;
        setLoading(true);
        setError(null);

        // Fire all stages in parallel. Each one merges into the visible road
        // set the instant it arrives — fast stages paint immediately, heavy
        // stages densify in the background. Total wall-clock = slowest stage.
        const stages = classStages(bbox);
        let accumulated: RoadPolyline[] = [];
        let outstanding = stages.length;
        await new Promise<void>((resolve) => {
          for (const classes of stages) {
            fetchRoadPolylines(bbox, classes, ac.signal)
              .then((data) => {
                if (ac.signal.aborted || mySeq !== seqRef.current) return;
                const seen = new Set(accumulated.map((r) => r.id));
                accumulated = accumulated.concat(data.filter((r) => !seen.has(r.id)));
                setRoads(accumulated);
              })
              .catch((err) => {
                if (ac.signal.aborted) return;
                setError(err instanceof Error ? err.message : "OSM fetch failed");
              })
              .finally(() => {
                if (--outstanding === 0) resolve();
              });
          }
        });
        if (mySeq === seqRef.current) setLoading(false);
      }, DEBOUNCE_MS);
    };

    triggerRef.current = () => {
      // Force a fresh fetch ignoring the bbox-change threshold.
      lastBboxRef.current = null;
      trigger();
    };
    trigger();
    const remove = viewer.camera.moveEnd.addEventListener(trigger);
    return () => {
      if (timer) clearTimeout(timer);
      remove();
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, viewer]);

  const refresh = () => triggerRef.current();
  return { roads, count: roads.length, loading, error, refresh };
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
