import test from "node:test";
import assert from "node:assert/strict";
import { createWeatherService, normalizeWeather } from "../server/weather.js";
import { storeTime, storeDate } from "../src/lib/storeTime.js";

const sample = { main: { temp: 12.5, feels_like: 11 }, wind: { speed: 5 }, weather: [{ id: 803, description: "broken clouds", icon: "04d" }], dt: 1791288000 };
test("metric weather is normalized and invalid data rejected", () => {
  assert.equal(normalizeWeather(sample).windKmh, 18);
  assert.equal(normalizeWeather(sample).temperature, 12.5);
  assert.equal(normalizeWeather(sample).rain, 0);
  assert.throws(() => normalizeWeather({ main: {} }));
});
test("shared weather cache and fixed location do not expose the key", async () => {
  let calls = 0; let time = 0;
  const service = createWeatherService({ env: { OPENWEATHER_API_KEY: "test-secret" }, now: () => time, fetchImpl: async (url) => {
    calls++; assert.equal(url.hostname, "api.openweathermap.org"); assert.equal(url.searchParams.get("lat"), "55.7059"); assert.equal(url.searchParams.get("units"), "metric");
    return Response.json(sample);
  } });
  const request = new Request("https://example.com/api/weather?lat=0");
  const responses = await Promise.all([service(request), service(request)]);
  assert.equal(calls, 1);
  assert.equal(responses[0].status, 200);
  assert.ok(!(await responses[0].text()).includes("test-secret"));
  await service(request); assert.equal(calls, 1);
  time = 900_001; await service(request); assert.equal(calls, 2);
  assert.equal((await service(new Request(request, { method: "POST" }))).status, 405);
});
test("missing keys and provider failures degrade without leaking secrets", async () => {
  const request = new Request("https://example.com/api/weather");
  const missing = createWeatherService({ env: {}, fetchImpl: () => assert.fail("Must not call without key") });
  assert.equal((await missing(request)).status, 503);
  let calls = 0;
  const denied = createWeatherService({ env: { OPENWEATHER_API_KEY: "test-secret" }, fetchImpl: async () => { calls++; return new Response("test-secret", { status: 401 }); } });
  const response = await denied(request);
  assert.equal(response.status, 503); assert.ok(!(await response.text()).includes("test-secret"));
  await denied(request); assert.equal(calls, 1);
});
test("Copenhagen clock follows midnight and daylight saving time", () => {
  assert.equal(storeTime(new Date("2026-07-01T12:00:00Z")), "14:00");
  assert.equal(storeTime(new Date("2026-12-01T12:00:00Z")), "13:00");
  assert.match(storeDate(new Date("2026-07-01T23:30:00Z")), /2 Jul 2026/);
});
