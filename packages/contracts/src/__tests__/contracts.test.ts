import { describe, it, expect } from 'vitest';
import {
  PNW,
  inPNW,
  SOURCES,
  sourcesByPlane,
  createEventBus,
  type HazardEvent,
  type Forecast,
} from '../index.js';

describe('region', () => {
  it('the PNW bbox covers OR, WA, and BC', () => {
    expect(inPNW(-122.33, 47.61)).toBe(true); // Seattle
    expect(inPNW(-123.12, 49.28)).toBe(true); // Vancouver BC
    expect(inPNW(-122.68, 45.52)).toBe(true); // Portland
    expect(inPNW(-118.24, 34.05)).toBe(false); // Los Angeles
    expect(inPNW(-73.93, 40.73)).toBe(false); // New York
  });
});

describe('sources registry', () => {
  it('every solid-earth and ocean source is observational, not predictive', () => {
    const observationalPlanes = ['solidEarth', 'oceanOffshore', 'humanPulse', 'ecologyEconomy'] as const;
    for (const plane of observationalPlanes) {
      for (const s of sourcesByPlane(plane)) {
        expect(s.isPrediction, `${s.id} must not be predictive`).toBe(false);
      }
    }
  });

  it('only weather/hydromet sources may be predictive', () => {
    for (const s of SOURCES) {
      if (s.isPrediction) {
        expect(s.plane).toBe('weatherHydromet');
      }
    }
  });

  it('has unique ids', () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('two-contract prediction principle', () => {
  it('HazardEvent.isPrediction is the literal false', () => {
    const e: HazardEvent = {
      id: 'eq.test',
      kind: 'seismic',
      t0: 0,
      status: 'open',
      entityIds: [],
      metricIds: [],
      isPrediction: false,
    };
    expect(e.isPrediction).toBe(false);
    // @ts-expect-error - a seismic HazardEvent cannot be a prediction
    const bad: HazardEvent = { ...e, isPrediction: true };
    void bad;
  });

  it('Forecast carries lead time and a model', () => {
    const f: Forecast = {
      id: 'hrrr.precip.1',
      issuedAt: 0,
      validStart: 3_600_000,
      validEnd: 7_200_000,
      leadTimeHours: 1,
      model: 'HRRR',
      probability: 0.42,
    };
    expect(f.model).toBe('HRRR');
    expect(f.leadTimeHours).toBeGreaterThan(0);
  });
});

describe('event bus', () => {
  it('routes typed events and supports unsubscribe', () => {
    const bus = createEventBus();
    const ticks: number[] = [];
    const off = bus.on('clock.tick', (e) => ticks.push(e.clock.now));
    bus.emit({ type: 'clock.tick', clock: { now: 1, mode: 'live', rangeStart: 0, rangeEnd: 1 } });
    bus.emit({ type: 'clock.tick', clock: { now: 2, mode: 'live', rangeStart: 0, rangeEnd: 2 } });
    off();
    bus.emit({ type: 'clock.tick', clock: { now: 3, mode: 'live', rangeStart: 0, rangeEnd: 3 } });
    expect(ticks).toEqual([1, 2]);
  });
});

describe('PNW constant', () => {
  it('lists OR, WA, BC and nothing else', () => {
    expect(PNW.jurisdictions).toEqual(['US-OR', 'US-WA', 'CA-BC']);
  });
});
