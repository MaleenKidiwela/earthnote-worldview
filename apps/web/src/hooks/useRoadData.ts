import { useEffect, useRef, useState } from "react";
import type { Viewer } from "cesium";
import { Math as CesiumMath } from "cesium";
import type { RoadPolyline } from "@/types/osm";
import {
  fetchRoadBundle,
  filterWaysToBbox,
  waysToPolylines,
  type RoadBundle,
} from "@/feeds/roads-bundle";

/**
 * Static-bundle road loader.
 *
 * Reads /data/pnw-roads.json once (entire PNW motorway+trunk+primary set,
 * pre-fetched by scripts/build-roads.mjs), keeps it in memory, and filters
 * to the current viewport bbox on every camera moveEnd. No Overpass calls
 * at runtime.
 *
 * Bundle refresh: every 30 min, re-fetch with cache-bust and compare
 * built_at. If a newer build is on disk we swap the in-memory bundle and
 * re-filter. The RoadParticleLayer rebuilds its primitive collection on
 * the new RoadPolyline[] identity — fast enough to feel seamless.
 */
const DEBOUNCE_MS = 200;
const MAX_SPAN_DEG = 12;
const MIN_DELTA = 0.03;
const REFRESH_INTERVAL_MS = 30 * 60_000;

interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface DownloadStatus {
  active: boolean;
  /** 0..1 if total is known; null when only bytes are available. */
  progress: number | null;
  loadedBytes: number;
  totalBytes: number | null;
}

export function useRoadData(enabled: boolean, viewer: Viewer | null) {
  const [roads, setRoads] = useState<RoadPolyline[]>([]);
  const [bundleStamp, setBundleStamp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [download, setDownload] = useState<DownloadStatus>({
    active: false,
    progress: null,
    loadedBytes: 0,
    totalBytes: null,
  });
  const bundleRef = useRef<RoadBundle | null>(null);
  const lastBboxRef = useRef<BBox | null>(null);
  const lastFilterRef = useRef<(() => void) | null>(null);

  // Bundle loader (mount + periodic refresh).
  useEffect(() => {
    if (!enabled) {
      setRoads([]);
      bundleRef.current = null;
      lastBboxRef.current = null;
      return;
    }
    let cancelled = false;

    const reportProgress = (loaded: number, total: number | null) => {
      if (cancelled) return;
      setDownload({
        active: true,
        loadedBytes: loaded,
        totalBytes: total,
        progress: total ? Math.min(1, loaded / total) : null,
      });
    };
    const clearProgress = () =>
      setDownload({ active: false, progress: null, loadedBytes: 0, totalBytes: null });

    const loadInitial = async () => {
      const b = await fetchRoadBundle(false, reportProgress);
      clearProgress();
      if (cancelled || !b) return;
      bundleRef.current = b;
      setBundleStamp(b.built_at);
      lastFilterRef.current?.();
    };
    loadInitial();

    const tick = setInterval(async () => {
      const fresh = await fetchRoadBundle(true, reportProgress);
      clearProgress();
      if (cancelled || !fresh) return;
      const current = bundleRef.current;
      if (current && fresh.built_at === current.built_at) return;
      // Seamless swap: bundle ref updates, viewport filter re-runs against
      // the same bbox so RoadParticleLayer gets a new roads identity. The
      // particle layer crossfades the old collection out and the new in.
      bundleRef.current = fresh;
      setBundleStamp(fresh.built_at);
      lastFilterRef.current?.();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [enabled]);

  // Viewport filter (mount + camera moveEnd).
  useEffect(() => {
    if (!enabled || !viewer || viewer.isDestroyed()) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const filterNow = () => {
      const view = viewportBbox(viewer);
      if (!view) return;
      const span = Math.max(view.north - view.south, view.east - view.west);
      if (span > MAX_SPAN_DEG) return;
      const last = lastBboxRef.current;
      if (last && !bboxChanged(last, view, MIN_DELTA)) return;
      lastBboxRef.current = view;
      const b = bundleRef.current;
      if (!b) return;
      try {
        const ways = filterWaysToBbox(b.ways, view);
        setRoads(waysToPolylines(ways));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "filter failed");
      }
    };

    const debounced = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(filterNow, DEBOUNCE_MS);
    };

    // Expose so the bundle-refresh effect can re-trigger after swap.
    lastFilterRef.current = () => {
      lastBboxRef.current = null;
      debounced();
    };

    debounced();
    const remove = viewer.camera.moveEnd.addEventListener(debounced);
    return () => {
      if (timer) clearTimeout(timer);
      remove();
      lastFilterRef.current = null;
    };
  }, [enabled, viewer]);

  const refresh = async () => {
    lastBboxRef.current = null;
    if (!bundleRef.current) {
      const b = await fetchRoadBundle(true);
      if (b) {
        bundleRef.current = b;
        setBundleStamp(b.built_at);
      }
    }
    lastFilterRef.current?.();
  };

  return {
    roads,
    count: roads.length,
    loading: download.active,
    error,
    refresh,
    builtAt: bundleStamp,
    download,
  };
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
