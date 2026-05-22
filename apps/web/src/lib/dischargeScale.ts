import { Color } from "cesium";
import { USGS_LATEST } from "@/feeds/usgs-streamflow";

/**
 * Shared blue→red discharge color scale, normalized to the live range
 * across all 240 USGS gauges at this instant. Lowest reading → pure
 * blue, highest → pure red. Gauge dots and river polylines call into
 * the same function so the legend reads consistently.
 *
 * Falls back to fixed bounds (0.1..1000 m³/s log-scaled) when fewer
 * than 2 readings exist yet (cold start before the first fetch).
 */
export interface DischargeRange {
  min: number;
  max: number;
  log: boolean;
}

// User-pinned max (red) override. null → auto from live data.
let userMaxOverride: number | null = null;
const listeners = new Set<() => void>();

export function setMaxOverride(v: number | null) {
  userMaxOverride = v;
  for (const fn of listeners) fn();
}
export function getMaxOverride() {
  return userMaxOverride;
}
export function subscribeScale(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function currentRange(): DischargeRange {
  let min = Infinity;
  let liveMax = -Infinity;
  for (const v of USGS_LATEST.values()) {
    if (v < min) min = v;
    if (v > liveMax) liveMax = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(liveMax) || liveMax <= min) {
    return { min: 0.1, max: userMaxOverride ?? 1000, log: true };
  }
  const max = userMaxOverride ?? liveMax;
  return { min, max, log: max / Math.max(min, 0.01) > 50 };
}

export function dischargeColor(v: number | null | undefined): Color {
  if (v == null || !Number.isFinite(v)) return Color.fromBytes(80, 110, 160, 100);
  const { min, max, log } = currentRange();
  let t: number;
  if (log) {
    const lo = Math.log10(Math.max(0.01, min));
    const hi = Math.log10(Math.max(lo + 0.01, max));
    t = (Math.log10(Math.max(0.01, v)) - lo) / (hi - lo);
  } else {
    t = (v - min) / (max - min);
  }
  t = Math.max(0, Math.min(1, t));
  // Blue (low) → cyan → green → yellow → red (high).
  const stops: Array<[number, [number, number, number]]> = [
    [0.0, [40, 80, 220]],     // blue
    [0.25, [40, 200, 220]],   // cyan
    [0.5, [80, 220, 90]],     // green
    [0.75, [240, 210, 60]],   // yellow
    [1.0, [230, 70, 60]],     // red
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i]!;
    const [b, cb] = stops[i + 1]!;
    if (t <= b) {
      const u = (t - a) / (b - a);
      return Color.fromBytes(
        Math.round(ca[0] + (cb[0] - ca[0]) * u),
        Math.round(ca[1] + (cb[1] - ca[1]) * u),
        Math.round(ca[2] + (cb[2] - ca[2]) * u),
        230,
      );
    }
  }
  return Color.fromBytes(230, 70, 60, 230);
}
