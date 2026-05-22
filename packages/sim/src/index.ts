/**
 * @pnw/sim — the Cousin mechanistic engine, lifted from
 * salish-sea-digital-cousin v5 into the PNW monorepo.
 *
 * Phase 3 surface:
 *   - taxonomy: ENTITIES, EDGES, SCENARIOS
 *   - SimStore: live, tickable engine wrapper with subscribe/getValue
 *   - assimilation re-exports for realtime feeds to nudge state
 *
 * The engine modules use plain ESM JS and depend on browser globals
 * (window, fetch, console). They run unmodified in the browser and in a
 * Web Worker.
 */
import type { CausalEdge } from "@pnw/contracts";
import {
  ENTITIES,
  EDGES,
  SCENARIOS,
  type EntityWithGeo,
  type ScenarioSpec,
} from "./taxonomy.js";
import { runOrchestrator, warmupState } from "./engine/orchestrator.js";
import {
  assimilateObservations,
  prepareObservations,
} from "./engine/dataAssimilation.js";
import { DEF } from "./config/defaults.js";
import { SCEN } from "./config/scenarios.js";

export { ENTITIES, EDGES, SCENARIOS } from "./taxonomy.js";
export type { EntityWithGeo, ScenarioSpec } from "./taxonomy.js";
// Sub-basin geometry + parent-basin mapping. These power the
// BasinHealthLayer that paints engine state directly onto the map.
export { SUB_BASIN_WATER_POLYGONS } from "./geo/subBasinPolygonsGenerated.js";
export { SUB_BASINS, PARENT_BASINS, BASIN_NAMES } from "./engine/basins.js";
// Engine scenarios: full parameter-set "worlds" (climate stress, green
// transition, hood canal collapse, blob returns, perfect storm, etc).
// Each is a complete allParams override; some have autoTrigger shocks.
export { SCEN, M9_SCENARIOS } from "./config/scenarios.js";
export {
  runOrchestrator,
  warmupState,
  runEnsemble,
  projectScenario,
} from "./engine/orchestrator.js";
export {
  assimilateObservations,
  prepareObservations,
  computeSkillScores,
  NUDGE_CONFIG,
  NUDGE_VARIABLES,
  STATION_BASIN_MAP,
} from "./engine/dataAssimilation.js";

/** Engine state. Treated as opaque outside the engine modules. */
export type EngineState = unknown;

/** Full orchestrator result — has marine, ecosystem, port, etc. state branches. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EngineResult = any;

/** Normalized observation for assimilation. */
export interface Observation {
  variable: string;
  value: number;
  basin?: string;
  station?: string;
  timestamp?: number;
}

export interface TraceResult {
  entityIds: string[];
  edges: CausalEdge[];
}

export interface SimModel {
  readonly entities: ReadonlyMap<string, EntityWithGeo>;
  readonly edges: ReadonlyArray<CausalEdge>;
  readonly scenarios: ReadonlyArray<ScenarioSpec>;
  readonly result: EngineResult | null;
  /** Number of ticks that have completed since boot. */
  readonly ticks: number;
  /** Simulated years elapsed since the t=0 reference (2026). */
  readonly years: number;
  trace(entityId: string, depth?: number): TraceResult;
  get(entityId: string): EntityWithGeo | undefined;
  /** A 0..1 health value for the entity, or null if not modeled. */
  getValue(entityId: string): number | null;
  /** Force-advance the engine by one tick. */
  tick(observations?: Observation[]): void;
  /** Subscribe to post-tick state changes. Returns unsubscribe. */
  subscribe(listener: () => void): () => void;
  /**
   * Queue a shock to apply on the NEXT tick. Examples:
   *   sim.queueShock({ cascadia_m9: 1 })
   *   sim.queueShock({ oilSpill: 0.5 })
   * Shocks merge with any already queued; cleared after the tick that
   * consumes them.
   */
  queueShock(shock: Record<string, number>): void;
  /** Re-warmup the engine and clear ticks/shocks. Drops to t=0. */
  reset(): void;
  /**
   * "Nowcast" reset. Re-warmup, then run several silent quarters of
   * assimilation against the provided realtime observations so the
   * engine starts from today's measured conditions instead of t=0
   * defaults. Clock is set to the current calendar month.
   */
  nowcast(observations: Observation[]): void;
  /**
   * Switch the persistent parameter set to a named scenario from SCEN
   * (e.g. "green", "collapse", "hood_canal_collapse", "blob_returns").
   * Re-warms up the engine with the new params and queues any
   * autoTrigger shocks. Pass "baseline" to return to defaults.
   */
  setScenario(scenarioId: string): void;
  /** Current scenario id (defaults to "baseline"). */
  readonly scenarioId: string;
}

export interface CreateSimOptions {
  /** When true, runs warmupState on construction. Default true. */
  bootEngine?: boolean;
  /** Default monthly (true) or quarterly (false) tick. Default monthly. */
  monthly?: boolean;
}

/** Warm up the engine with default parameters. */
export function boot(monthly = true): EngineState {
  return warmupState(DEF, monthly);
}

/** Construct a tickable SimStore. */
export function createSim(opts: CreateSimOptions = {}): SimModel {
  return new SimStore(opts);
}

class SimStore implements SimModel {
  readonly entities = ENTITIES;
  readonly edges = EDGES;
  readonly scenarios = SCENARIOS;
  private _state: EngineState | null = null;
  private _result: EngineResult | null = null;
  private _listeners = new Set<() => void>();
  private _adjacency: Map<string, CausalEdge[]>;
  private _monthly: boolean;
  private _yf = 0; // years forward, advances per tick
  private _ticks = 0;
  private _pendingShocks: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _params: any = DEF;
  private _scenarioId = "baseline";
  // Most recent observation batch fed to tick(). reset / setScenario reuse
  // these so a fresh world automatically anchors to today's conditions
  // instead of dropping back to t=0 defaults.
  private _lastObservations: Observation[] = [];

  constructor(opts: CreateSimOptions = {}) {
    this._monthly = opts.monthly ?? true;
    this._adjacency = new Map();
    for (const edge of EDGES) {
      const list = this._adjacency.get(edge.sourceId) ?? [];
      list.push(edge);
      this._adjacency.set(edge.sourceId, list);
    }
    if (opts.bootEngine ?? true) {
      try {
        this._state = boot(this._monthly);
        // Run one tick so .result is populated for getValue().
        this.tick();
      } catch (err) {
        console.warn("[sim] engine boot failed:", err);
      }
    }
  }

  get result() {
    return this._result;
  }
  get ticks() {
    return this._ticks;
  }
  get years() {
    return this._yf;
  }

  trace(entityId: string, depth = 3): TraceResult {
    const seen = new Set<string>([entityId]);
    const collected: CausalEdge[] = [];
    let frontier: string[] = [entityId];
    for (let i = 0; i < depth; i++) {
      const next: string[] = [];
      for (const id of frontier) {
        const out = this._adjacency.get(id) ?? [];
        for (const edge of out) {
          if (!seen.has(edge.targetId)) {
            seen.add(edge.targetId);
            next.push(edge.targetId);
            collected.push(edge);
          }
        }
      }
      if (next.length === 0) break;
      frontier = next;
    }
    return { entityIds: [...seen], edges: collected };
  }

  get(id: string) {
    return ENTITIES.get(id);
  }

  getValue(entityId: string): number | null {
    if (!this._result) return null;
    return extractEntityValue(entityId, this._result);
  }

  tick(observations?: Observation[]): void {
    if (!this._state) {
      try {
        this._state = boot(this._monthly);
      } catch (err) {
        console.warn("[sim] boot in tick failed:", err);
        return;
      }
    }
    const dt = this._monthly ? 1 / 3 : 1;
    try {
      if (observations && observations.length) {
        this._lastObservations = observations;
        const prepped = prepareObservations(observations);
        assimilateObservations(prepped, this._state, dt);
      }
      const shocks = this._pendingShocks;
      this._pendingShocks = {};
      const result = runOrchestrator(this._params, shocks, this._yf, this._state, dt, this._yf);
      this._state = result._state;
      this._result = result;
      this._yf += dt / 4; // quarters/tick → years
      this._ticks += 1;
      for (const fn of this._listeners) fn();
    } catch (err) {
      console.warn("[sim] tick failed:", err);
    }
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  queueShock(shock: Record<string, number>): void {
    Object.assign(this._pendingShocks, shock);
  }

  reset(): void {
    this._pendingShocks = {};
    this._yf = 0;
    this._ticks = 0;
    this._params = DEF;
    this._scenarioId = "baseline";
    // Anchor reset state to current observations so the user sees today's
    // conditions, not a t=0 baseline.
    this.nowcast(this._lastObservations);
  }

  get scenarioId() {
    return this._scenarioId;
  }

  nowcast(observations: Observation[]): void {
    // Pending shocks are preserved — autoTrigger scenarios queue them
    // before calling nowcast and want them fired on the visible tick.
    try {
      // Re-warmup with current params.
      this._state = warmupState(this._params, this._monthly);
      // Drive 6 silent ticks of assimilation against the observations to
      // pull state toward today's conditions (each tick = 1 month, so
      // 6 months of nudging — fast variables converge, slow ones partial).
      const prepped = observations.length ? prepareObservations(observations) : [];
      const dt = this._monthly ? 1 / 3 : 1;
      for (let i = 0; i < 6; i++) {
        if (prepped.length) assimilateObservations(prepped, this._state, dt);
        const r = runOrchestrator(this._params, {}, 0, this._state, dt, 0);
        this._state = r._state;
      }
      // Final tick produces visible result and fires listeners.
      this._yf = 0;
      this._ticks = 0;
      this.tick(observations);
    } catch (err) {
      console.warn("[sim] nowcast failed:", err);
    }
  }

  setScenario(id: string): void {
    const scen = SCEN[id];
    if (!scen) {
      console.warn(`[sim] unknown scenario: ${id}`);
      return;
    }
    this._params = scen.p ?? DEF;
    this._scenarioId = id;
    this._pendingShocks = {};
    this._yf = 0;
    this._ticks = 0;
    if (scen.autoTrigger) {
      for (const [k, v] of Object.entries(scen.autoTrigger)) {
        this._pendingShocks[k] = typeof v === "number" ? v : v ? 1 : 0;
      }
    }
    // Warmup under the scenario params, then nudge state to current
    // observations so the scenario starts from today's measured world
    // (SST, river flow, vessel noise, etc.) instead of t=0 defaults.
    this.nowcast(this._lastObservations);
  }
}

/**
 * Extract a normalized 0..1 health value for an entity from an engine
 * result. The mapping is hand-curated: each taxonomy id points at the
 * engine state field that best represents its current condition. Returns
 * null when the engine has nothing to say about that entity (e.g. tribal
 * sovereignty markers, generic hazard nodes).
 */
function extractEntityValue(entityId: string, result: EngineResult): number | null {
  const eco = result.ecosystem?.state;
  const port = result.port?.state;
  const bgc = result.biogeochem?.state;
  const marine = result.marine?.state;

  // Port entities → operational capacity (0..1).
  if (entityId.startsWith("port.")) {
    return clamp01(port?.opCap ?? null);
  }
  if (entityId.startsWith("term.van.")) {
    return clamp01(port?.opCap ?? null);
  }

  // Orca pods → orcaViability / baseline 100.
  if (entityId === "orca.srkw") {
    if (eco?.orcaViability != null) return clamp01(eco.orcaViability);
    if (eco?.orcaPopulation != null) return clamp01(eco.orcaPopulation / 100);
    return null;
  }
  if (entityId === "orca.bigg") {
    if (eco?.biggsOrcaPop != null) return clamp01(eco.biggsOrcaPop / 350);
    return null;
  }

  // Salmon runs → salmonRunStrength (0..1) or salmonHealth (0..1).
  if (entityId.startsWith("salmon.")) {
    if (eco?.salmonRunStrength != null) return clamp01(eco.salmonRunStrength);
    if (eco?.salmonHealth != null) return clamp01(eco.salmonHealth);
    return null;
  }

  // Forage / habitat.
  if (entityId === "forage.herring.cherrypoint") {
    if (eco?.cherryPointHerring != null) {
      const v = typeof eco.cherryPointHerring === "object"
        ? (eco.cherryPointHerring.total ?? eco.cherryPointHerring.adult ?? 0)
        : eco.cherryPointHerring;
      return clamp01(v / 5000);
    }
    return null;
  }
  if (entityId.startsWith("habitat.eelgrass.")) {
    return clamp01(eco?.eelgrassHealth ?? null);
  }
  if (entityId.startsWith("habitat.estuary.")) {
    return clamp01(eco?.beachHealth ?? null);
  }

  // Carbonate chain.
  if (entityId === "driver.atm_co2") {
    const co2 = bgc?.atmosphericCO2 ?? 420;
    // 280ppm pre-industrial = 1.0 health, 600ppm = 0.0.
    return clamp01(1 - (co2 - 280) / (600 - 280));
  }
  if (entityId === "state.ocean_dic") {
    return clamp01(bgc?.aragoniteOmega ? bgc.aragoniteOmega / 3 : null);
  }
  if (entityId === "state.aragonite_sat" || entityId === "state.shellfish_larvae") {
    const omega = eco?.omegaAragonite ?? marine?.omegaAragonite;
    if (omega == null) return null;
    // Healthy ≥2, undersaturated <1. Map 1→0, 2→1.
    return clamp01((omega - 1) / 1);
  }

  // Hazards / drivers / tribes / volcanoes → no live value.
  return null;
}

function clamp01(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
