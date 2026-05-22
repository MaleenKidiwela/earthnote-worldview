import { useEffect, useSyncExternalStore } from "react";
import { sim } from "@/sim-stub";
import type { Observation } from "@pnw/sim";

/**
 * Drives sim.tick() on a wall-clock interval and lets components
 * re-render on each tick via useSyncExternalStore. Default cadence is
 * 30 s wall = 1 sim month, slow enough to watch state evolve without
 * pegging the main thread.
 *
 * `getObservations` is called immediately before each tick; the returned
 * Observations are fed into the engine's Newtonian-relaxation
 * assimilation. Return [] (or omit the prop) for a free-running model.
 */
export interface UseSimClockOptions {
  intervalMs?: number;
  getObservations?: () => Observation[];
  /** When false, no ticks are scheduled. Default true. */
  enabled?: boolean;
}

export function useSimClock(opts: UseSimClockOptions = {}) {
  const { intervalMs = 30_000, getObservations, enabled = true } = opts;

  // Force re-renders on each engine tick. The snapshot is the result
  // reference; tick() swaps it so React sees a new identity.
  const result = useSyncExternalStore(
    (listener) => sim.subscribe(listener),
    () => sim.result,
    () => sim.result,
  );

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      const obs = getObservations?.() ?? [];
      sim.tick(obs);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, getObservations, enabled]);

  return { sim, result };
}
