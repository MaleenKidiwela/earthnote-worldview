import type { Jurisdiction } from './region.js';

export type EntityKind =
  | 'orcaPod'
  | 'salmonRun'
  | 'port'
  | 'tribe'
  | 'station'
  | 'fault'
  | 'volcano'
  | 'fluidReservoir'
  | 'watershed'
  | 'riverGauge'
  | 'noiseSource'
  | 'climateDriver'
  | 'population'
  | 'infrastructure'
  | 'seafloorStation'
  | 'fishery'
  | 'offshoreInfra';

export interface Entity {
  id: string;
  kind: EntityKind;
  label: string;
  jurisdiction?: Jurisdiction;
  geom?: GeoJSON.Geometry;
  sensitive?: boolean;
  sovereign?: boolean;
}
