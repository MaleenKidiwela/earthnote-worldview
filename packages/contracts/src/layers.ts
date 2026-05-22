export type GlobeLayerKind =
  | 'points'
  | 'primitives'
  | 'field'
  | 'volume'
  | 'video'
  | 'particles';

export type VisualMode = 'default' | 'bathyXray' | 'hydrophone' | 'causalWeb';

export interface GlobeLayer {
  id: string;
  title: string;
  kind: GlobeLayerKind;
  visualMode?: VisualMode;
  source: string;
}
