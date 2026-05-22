export type Severity = 'info' | 'watch' | 'warning';

export interface Monitor {
  id: string;
  metricId: string;
  method: 'staLta' | 'zscore' | 'changePoint' | 'mlAnomaly';
  params: Record<string, number>;
  baselineWindow: string;
  severity: Severity;
  note: string;
}

export interface CompositeMonitor {
  id: string;
  metricIds: string[];
  method: 'composite';
  combine: string;
  emits: string;
  severity: Severity;
  note: string;
  isPrediction: false;
}
