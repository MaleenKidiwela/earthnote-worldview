import { useState, useRef, useEffect } from "react";
import type { Alert } from "@/types/alerts";
import type { Earthquake } from "@/types/usgs";
import type { WeatherAlert } from "@/types/nws";
import { ALERT_THRESHOLDS } from "@/lib/constants";

const MAX_ALERTS = 20;

interface AlertSources {
  earthquakes: Earthquake[];
  weatherAlerts: WeatherAlert[];
}

export function useAlerts(sources: AlertSources) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    const newAlerts: Alert[] = [];

    for (const eq of sources.earthquakes) {
      const key = `eq-${eq.id}`;
      if (seenRef.current.has(key)) continue;
      if (eq.magnitude >= ALERT_THRESHOLDS.EARTHQUAKE_MIN_MAG) {
        seenRef.current.add(key);
        newAlerts.push({
          id: key,
          type: "earthquake",
          title: `M${eq.magnitude.toFixed(1)} — ${eq.place}`,
          description: `Magnitude ${eq.magnitude.toFixed(1)} earthquake detected near ${eq.place}`,
          severity:
            eq.magnitude >= 7.5
              ? "critical"
              : eq.magnitude >= 6.5
                ? "high"
                : "medium",
          latitude: eq.latitude,
          longitude: eq.longitude,
          timestamp: eq.time,
        });
      }
    }

    for (const wx of sources.weatherAlerts) {
      const key = `wx-${wx.id}`;
      if (seenRef.current.has(key)) continue;
      if (wx.severity === ALERT_THRESHOLDS.WEATHER_SEVERITY) {
        seenRef.current.add(key);
        newAlerts.push({
          id: key,
          type: "weather",
          title: wx.event,
          description: wx.headline || wx.areaDesc,
          severity: "critical",
          latitude: wx.latitude,
          longitude: wx.longitude,
          timestamp: Date.now(),
        });
      }
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, MAX_ALERTS));
    }
  }, [sources.earthquakes, sources.weatherAlerts]);

  const dismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };
  const dismissAll = () => setAlerts([]);

  return { alerts, dismiss, dismissAll };
}
