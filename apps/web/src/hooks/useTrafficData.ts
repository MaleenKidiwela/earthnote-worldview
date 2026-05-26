import { useEffect, useState } from "react";
import { fetchTrafficFlows, type FlowStation } from "@/feeds/wsdot-traffic";

const REFRESH_MS = 120_000; // 2 min

export function useTrafficData(enabled: boolean) {
  const [stations, setStations] = useState<FlowStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const s = await fetchTrafficFlows();
      if (cancelled) return;
      setStations(s);
      setLastUpdate(Date.now());
      setLoading(false);
    };
    run();
    const id = setInterval(run, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled]);

  return { stations, count: stations.length, loading, lastUpdate };
}
