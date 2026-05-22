export type GeoProductKind =
  | 'dvvMatrix'
  | 'hvsrCurve'
  | 'rfStack'
  | 'rfTimeSeries'
  | 'tremorCatalog'
  | 'gnssSeries'
  | 'noiseCorrelation'
  | 'radarSweep'
  | 'forecastGrid'
  | 'subsurfaceVolume'
  | 'gnssAcoustic'
  | 'fishingEffort'
  | 'sarDetections'
  | 'sstField';

export interface GeoProduct {
  id: string;
  kind: GeoProductKind;
  uri: string;
  t0: number;
  t1: number;
  entityId?: string;
  uncertainty?: Record<string, number>;
  method: string;
}
