import { useEffect, useState } from "react";
import type { GnssStation } from "@/types/gnss";
import { fetchGnssStations } from "@/feeds/gnss";

export function useGnssData(enabled: boolean) {
  const [stations, setStations] = useState<GnssStation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchGnssStations();
        if (!cancelled) setStations(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "GNSS load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { stations, count: stations.length, error };
}
