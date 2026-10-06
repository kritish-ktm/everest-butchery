import { useEffect, useState } from "react";
import { useWeather } from "../lib/useWeather";
import { storeDate, storeTime, weatherIcon } from "../lib/storeTime";

export default function StoreConditions() {
  const [now, setNow] = useState(() => new Date());
  const weather = useWeather();
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const reading = weather.data;
  return <div className="store-conditions"><div className="container store-conditions-inner">
    <div className="store-clock"><i className="bi bi-clock" aria-hidden="true" /><span>Copenhagen</span><time dateTime={now.toISOString()}>{storeDate(now)} <strong>{storeTime(now)}</strong></time></div>
    <div className="store-weather"><i className={`bi ${reading ? weatherIcon(reading) : "bi-cloud"}`} aria-hidden="true" />
      {reading ? <><span><strong>{Math.round(reading.temperature)}&deg;C</strong> · {reading.description}</span><small title={`Observed ${storeDate(new Date(reading.observedAt))} ${storeTime(new Date(reading.observedAt))}`}>Observed {storeTime(new Date(reading.observedAt))} · <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer">OpenWeather</a></small></> : <span>{weather.loading ? "Loading weather..." : weather.error}</span>}
    </div>
  </div></div>;
}
