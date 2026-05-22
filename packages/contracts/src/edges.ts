export interface CausalEdge {
  id: string;
  sourceId: string;
  targetId: string;
  polarity: 1 | -1;
  weight: number;
  lagDays: number;
  mechanism: string;
  citation?: string;
  calibrated: boolean;
}
