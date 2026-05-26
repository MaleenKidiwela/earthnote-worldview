/**
 * PNSN Cascadia tremor catalog.
 *
 * Network deep tremor (Wech & Creager) detected automatically from PNSN
 * stations. Tremor and Episodic Tremor and Slip (ETS) load the locked
 * portion of the Cascadia megathrust and are quasi-periodic, but they
 * are NOT a deterministic countdown to a great earthquake. Per the
 * project's two-contract rule (CLAUDE.md): these are observe-only. The
 * UI must not describe them as predictive.
 *
 * Source: https://tremorapi.pnsn.org/api/v3.0/events
 */

export interface TremorEvent {
  id: number;
  lon: number;
  lat: number;
  depth: number; // km
  magnitude: number;
  duration: number; // seconds
  energy: number;
  time: number; // unix ms
}

const API = "https://tremorapi.pnsn.org/api/v3.0/events";

/** Fetch tremor events in the given window. Default 30 days. */
export async function fetchTremor(daysBack = 30): Promise<TremorEvent[]> {
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 86_400_000);
  const url =
    `${API}?starttime=${start.toISOString().slice(0, 19)}` +
    `&endtime=${end.toISOString().slice(0, 19)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j: any = await r.json();
    const out: TremorEvent[] = [];
    for (const f of j.features ?? []) {
      const [lon, lat] = f.geometry?.coordinates ?? [];
      const p = f.properties ?? {};
      if (typeof lon !== "number" || typeof lat !== "number") continue;
      const t = Date.parse(p.time);
      if (!Number.isFinite(t)) continue;
      out.push({
        id: p.id,
        lon,
        lat,
        depth: p.depth,
        magnitude: p.magnitude,
        duration: p.duration,
        energy: p.energy,
        time: t,
      });
    }
    return out;
  } catch {
    return [];
  }
}
