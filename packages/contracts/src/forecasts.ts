import type { HazardKind } from './events.js';

export type ForecastModel =
  | 'HRRR'
  | 'GFS'
  | 'ECMWF'
  | 'WaveWatch3'
  | 'NWS'
  | 'surge';

export interface Forecast {
  id: string;
  metricId?: string;
  hazardKind?: HazardKind;
  issuedAt: number;
  validStart: number;
  validEnd: number;
  leadTimeHours: number;
  value?: number;
  probability?: number;
  model: ForecastModel;
  skill?: Record<string, number>;
}
