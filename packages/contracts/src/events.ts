export type HazardKind =
  | 'seismic'
  | 'volcanic'
  | 'tsunami'
  | 'flood'
  | 'wildfire'
  | 'marineHeatwave'
  | 'hab'
  | 'weather'
  | 'spaceWeather'
  | 'anomaly';

export interface HazardEvent {
  id: string;
  kind: HazardKind;
  t0: number;
  status: 'open' | 'ack' | 'resolved';
  entityIds: string[];
  metricIds: string[];
  characterization?: Record<string, unknown>;
  isPrediction: false;
  officialSource?: string;
}
