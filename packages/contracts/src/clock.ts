export interface SimClock {
  now: number;
  mode: 'live' | 'replay' | 'scenario';
  rangeStart: number;
  rangeEnd: number;
}

export function liveClock(now: number = Date.now()): SimClock {
  const day = 24 * 60 * 60 * 1000;
  return { now, mode: 'live', rangeStart: now - 7 * day, rangeEnd: now };
}
