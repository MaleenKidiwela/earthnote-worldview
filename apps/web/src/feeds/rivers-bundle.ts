/**
 * Static PNW rivers bundle (NHDPlus HR flowlines + gauge cross-ref).
 */
export interface Flowline {
  id: string;
  fromNode: number;
  toNode: number;
  order: number;
  lengthKm: number;
  qama: number | null; // mean annual flow, cfs
  reach: string;
  geom: [number, number][][]; // array of linestrings
}

export interface NhdGauge {
  siteNo: string; // USGS gauge id (matches feeds/usgs-streamflow.ts)
  name: string;
  reach: string;
  nhdplusId: number;
  lon: number;
  lat: number;
}

export interface RiverBundle {
  built_at: string;
  source: string;
  bbox: { south: number; west: number; north: number; east: number };
  min_order: number;
  flowlines: Flowline[];
  gauges: NhdGauge[];
}

const URL = `${import.meta.env.BASE_URL}data/pnw-rivers.json`;

export async function fetchRiverBundle(
  cacheBust = false,
  onProgress?: (loaded: number, total: number | null) => void,
): Promise<RiverBundle | null> {
  try {
    const u = cacheBust ? `${URL}?t=${Date.now()}` : URL;
    const r = await fetch(u);
    if (!r.ok) return null;
    const totalHeader = r.headers.get("content-length");
    const total = totalHeader ? Number(totalHeader) : null;
    if (!r.body || !onProgress) return (await r.json()) as RiverBundle;
    const reader = r.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    onProgress(0, total);
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        onProgress(loaded, total);
      }
    }
    const buf = new Uint8Array(loaded);
    let off = 0;
    for (const c of chunks) {
      buf.set(c, off);
      off += c.length;
    }
    return JSON.parse(new TextDecoder().decode(buf)) as RiverBundle;
  } catch (err) {
    console.warn("[rivers] fetch failed", err);
    return null;
  }
}
