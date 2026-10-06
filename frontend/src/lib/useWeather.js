import { useEffect, useState } from "react";

export function useWeather() {
  const [weather, setWeather] = useState({ loading: true, error: "", data: null });
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/weather", { signal: controller.signal });
        if (!response.ok) throw new Error("Weather unavailable");
        const data = await response.json();
        if (!Number.isFinite(data.temperature) || !data.observedAt) throw new Error("Weather unavailable");
        setWeather({ loading: false, error: "", data });
      } catch {
        if (!controller.signal.aborted) setWeather({ loading: false, error: "Weather unavailable", data: null });
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 15 * 60 * 1000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);
  return weather;
}
