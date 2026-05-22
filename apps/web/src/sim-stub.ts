/**
 * Bridge from apps/web to @pnw/sim. Phase 3: the engine is now booted
 * here and exposed as a live, tickable singleton. The clock that calls
 * sim.tick() lives in apps/web/src/hooks/useSimClock.ts so a feed-aware
 * observation collector can be wired up later without touching this file.
 */
import { createSim, type SimModel } from "@pnw/sim";
export type { SimModel, EntityWithGeo, ScenarioSpec, TraceResult, Observation } from "@pnw/sim";

/** Shared singleton; the entire app reads from (and ticks) one Cousin model. */
export const sim: SimModel = createSim({ bootEngine: true, monthly: true });
