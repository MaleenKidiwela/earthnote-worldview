// Typed event bus the 2D Cousin and the 3D globe both subscribe to.
// Same clock, same selection. This is the bridge Phase 0 owes Agent A.

import type { SimClock } from './clock.js';

export type BusEvent =
  | { type: 'clock.tick'; clock: SimClock }
  | { type: 'clock.modeChange'; clock: SimClock }
  | { type: 'selection.set'; entityId: string | null }
  | { type: 'selection.add'; entityId: string }
  | { type: 'layer.toggle'; layerId: string; visible: boolean }
  | { type: 'view.modeChange'; mode: 'explorer' | 'research' | 'policy' | 'globe' }
  | { type: 'hazard.opened'; eventId: string }
  | { type: 'hazard.resolved'; eventId: string }
  | { type: 'forecast.issued'; forecastId: string };

export type BusListener<E extends BusEvent = BusEvent> = (event: E) => void;

export interface EventBus {
  emit(event: BusEvent): void;
  on<T extends BusEvent['type']>(
    type: T,
    listener: BusListener<Extract<BusEvent, { type: T }>>,
  ): () => void;
  onAny(listener: BusListener): () => void;
}

export function createEventBus(): EventBus {
  const typed = new Map<string, Set<BusListener>>();
  const any = new Set<BusListener>();

  return {
    emit(event) {
      const ls = typed.get(event.type);
      if (ls) for (const fn of ls) fn(event);
      for (const fn of any) fn(event);
    },
    on(type, listener) {
      let set = typed.get(type);
      if (!set) {
        set = new Set();
        typed.set(type, set);
      }
      set.add(listener as BusListener);
      return () => set!.delete(listener as BusListener);
    },
    onAny(listener) {
      any.add(listener);
      return () => any.delete(listener);
    },
  };
}
