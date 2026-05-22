export interface Metric {
  id: string;
  source: string;
  unit: string;
  cadenceSec: number;
  entityId?: string;
}

export interface Sample {
  metricId: string;
  t: number;
  v: number;
  quality?: number;
}
