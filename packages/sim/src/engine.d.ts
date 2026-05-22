// Ambient declarations for the JS engine modules. The engine is intentionally
// untyped (lifted as-is); consumers of @pnw/sim see these as `any` so they
// can be called without per-module .d.ts files.
declare module "*/engine/orchestrator.js" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const runOrchestrator: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const warmupState: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const runEnsemble: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const projectScenario: any;
}
declare module "*/engine/dataAssimilation.js" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const assimilateObservations: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const prepareObservations: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const computeSkillScores: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const NUDGE_CONFIG: any;
  export const NUDGE_VARIABLES: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const STATION_BASIN_MAP: any;
}
declare module "*/config/defaults.js" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const DEF: any;
}
