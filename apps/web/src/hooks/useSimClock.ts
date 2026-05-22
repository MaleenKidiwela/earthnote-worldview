import { useEffect, useRef, useSyncExternalStore } from "react";
import { sim } from "@/sim-stub";
import type { Observation } from "@pnw/sim";
import { fetchSstObservations } from "@/feeds/noaa-tides";
import { fetchDischargeObservations } from "@/feeds/usgs-streamflow";

/**
 * Sim clock that ticks the Twin engine on a wall-clock interval and folds
 * realtime observations into each tick.
 *
 * Live feeds wired:
 *   - sst        ← NOAA Tides water-temp at 6 Salish Sea stations
 *   - discharge  ← USGS NWIS streamflow at 6 watershed gauges
 *   - noiseLevel ← AIS vessel density (passed in via getObservations)
 *
 * The expensive HTTP fetches run on a separate, slower schedule (5 min)
 * and the cached observations are reused across faster sim ticks. Each
 * batch goes through `prepareObservations` then `assimilateObservations`
 * (Newtonian-relaxation, Anthes 1974) before runOrchestrator advances.
 */
export interface UseSimClockOptions {
  intervalMs?: number;
  /** Extra observations to merge per tick (e.g., AIS-derived noise). */
  getObservations?: () => Observation[];
  enabled?: boolean;
}

const FEED_REFRESH_MS = 300_000; // 5 min — NOAA + USGS are courtesy-rate-limited

export function useSimClock(opts: UseSimClockOptions = {}) {
  const { intervalMs = 30_000, getObservations, enabled = true } = opts;

  const result = useSyncExternalStore(
    (listener) => sim.subscribe(listener),
    () => sim.result,
    () => sim.result,
  );

  const liveObsRef = useRef<Observation[]>([]);
  const lastFeedFetchRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const refreshFeeds = async () => {
      try {
        const [sst, discharge] = await Promise.all([
          fetchSstObservations(),
          fetchDischargeObservations(),
        ]);
        if (cancelled) return;
        liveObsRef.current = [...sst, ...discharge];
        lastFeedFetchRef.current = Date.now();
      } catch {
        // soft-fail
      }
    };
    refreshFeeds();

    const id = setInterval(() => {
      // Stale feeds → refresh in background.
      if (Date.now() - lastFeedFetchRef.current > FEED_REFRESH_MS) {
        refreshFeeds();
      }
      const ad = getObservations?.() ?? [];
      sim.tick([...liveObsRef.current, ...ad]);
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs, getObservations, enabled]);

  return {
    sim,
    result,
    liveObservations: liveObsRef.current,
    /** Re-warmup + nudge state to current realtime observations. */
    nowcast: () => sim.nowcast(liveObsRef.current),
  };
}
