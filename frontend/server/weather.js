const CACHE_MS = 15 * 60 * 1000;

export function normalizeWeather(data) {
  if (!Number.isFinite(data?.main?.temp) || !Number.isFinite(data?.dt) || !data.weather?.[0]?.description) {
    throw new Error("Invalid weather response");
  }
  return {
    provider: "OpenWeather",
    location: "Copenhagen",
    temperature: data.main.temp,
    feelsLike: Number.isFinite(data.main.feels_like) ? data.main.feels_like : null,
    windKmh: Number.isFinite(data.wind?.speed) ? data.wind.speed * 3.6 : null,
    rain: Number.isFinite(data.rain?.["1h"]) ? data.rain["1h"] : 0,
    description: data.weather[0].description,
    conditionId: data.weather[0].id,
    isDay: !data.weather[0].icon?.endsWith("n"),
    observedAt: new Date(data.dt * 1000).toISOString(),
  };
}

function json(body, status, cacheSeconds = 0) {
  return new Response(JSON.stringify(body), { status, headers: {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": cacheSeconds ? `public, max-age=60, s-maxage=${cacheSeconds}` : "no-store",
  } });
}

export function createWeatherService({ env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  let cache;
  let pending;
  let retryAt = 0;
  return async function weather(request) {
    if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET" } });
    if (!env.OPENWEATHER_API_KEY) return json({ message: "Weather unavailable" }, 503);
    if (cache && now() - cache.fetchedAt < CACHE_MS) {
      return json(cache.data, 200, Math.max(1, Math.floor((CACHE_MS - (now() - cache.fetchedAt)) / 1000)));
    }
    if (now() < retryAt) return json({ message: "Weather temporarily unavailable" }, 503);
    try {
      // All visitors share the store location; never forward user-supplied API parameters.
      if (!pending) pending = (async () => {
        const url = new URL("https://api.openweathermap.org/data/2.5/weather");
        url.search = new URLSearchParams({ lat: "55.7059", lon: "12.5008", units: "metric", lang: "en", appid: env.OPENWEATHER_API_KEY });
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error(`Weather provider status ${response.status}`);
        const data = normalizeWeather(await response.json());
        cache = { data, fetchedAt: now() };
        return data;
      })();
      return json(await pending, 200, 900);
    } catch {
      retryAt = now() + 60_000;
      return json({ message: "Weather temporarily unavailable" }, 503);
    } finally { pending = null; }
  };
}
