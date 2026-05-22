export const PNW = {
  jurisdictions: ['US-OR', 'US-WA', 'CA-BC'] as const,
  bbox: { west: -125.5, south: 41.9, east: -114.0, north: 54.5 },
} as const;

export type Jurisdiction = (typeof PNW.jurisdictions)[number];

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function inPNW(lon: number, lat: number): boolean {
  const b = PNW.bbox;
  return lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north;
}
