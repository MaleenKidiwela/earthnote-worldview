import { useEffect, useState } from "react";
import { fetchTremor, type TremorEvent } from "@/feeds/pnsn-tremor";

const REFRESH_MS = 30 * 60_000; // 30 min — PNSN catalog updates hourly

export function useTremorData(enabled: boolean, daysBack = 30) {
  const [events, setEvents] = useState<TremorEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const e = await fetchTremor(daysBack);
      if (cancelled) return;
      setEvents(e);
      setLoading(false);
    };
    run();
    const id = setInterval(run, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, daysBack]);

  return { events, count: events.length, loading };
}
