/** OSM way reduced to a single polyline. */
export interface RoadPolyline {
  id: string;
  classification: "motorway" | "trunk" | "primary";
  /** [lon, lat] pairs, ordered along the way. */
  points: readonly (readonly [number, number])[];
  /** Pre-computed cumulative arc length per vertex (meters), length = points.length. */
  cumulative: number[];
  /** Total length of the way (meters). */
  totalLength: number;
}
