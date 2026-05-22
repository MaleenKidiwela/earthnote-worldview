export interface GnssStation {
  /** Four-character site code, e.g. "P404" (NOTA convention). */
  id: string;
  /** Long-form label. */
  name: string;
  latitude: number;
  longitude: number;
  /** Network: NOTA (Network of the Americas), WCDA (Western Canada Deformation Array), etc. */
  network: string;
  /** Eastward horizontal velocity, mm/yr. */
  vEast: number;
  /** Northward horizontal velocity, mm/yr. */
  vNorth: number;
  /** Vertical velocity, mm/yr (positive = uplift). */
  vUp: number;
  /** 1-sigma uncertainty, mm/yr (horizontal). */
  sigma: number;
  /**
   * False until the station's velocities are loaded from a live provider
   * (Nevada Geodetic Lab tenv3 or EarthScope GAGE products). Seeded values
   * are first-order estimates of the interseismic field used for layout only.
   */
  calibrated: boolean;
}
