import { useEffect, useState } from "react";
import type { RoadPolyline } from "@/types/osm";
import { fetchRoadPolylines } from "@/feeds/osm";

/**
 * One-shot fetch: OSM roads don't change minute-to-minute and Overpass is
 * rate-limited. Cache in component state for the session.
 */
export function useRoadData(enabled: boolean) {
  const [roads, setRoads] = useState<RoadPolyline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || roads.length > 0 || loading) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await fetchRoadPolylines();
        if (!cancelled) setRoads(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "OSM load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, roads.length, loading]);

  return { roads, count: roads.length, loading, error };
}
