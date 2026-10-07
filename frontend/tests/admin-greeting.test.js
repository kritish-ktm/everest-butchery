import test from "node:test";
import assert from "node:assert/strict";
import { timeGreeting, weatherGreeting } from "../src/lib/adminGreeting.js";

test("greetings use Copenhagen time including daylight saving", () => {
  assert.equal(timeGreeting(new Date("2026-07-01T09:59:00Z")), "Good morning");
  assert.equal(timeGreeting(new Date("2026-07-01T10:00:00Z")), "Good afternoon");
  assert.equal(timeGreeting(new Date("2026-07-01T16:00:00Z")), "Good evening");
  assert.equal(timeGreeting(new Date("2026-12-01T10:00:00Z")), "Good morning");
  assert.equal(timeGreeting(new Date("2026-12-01T11:00:00Z")), "Good afternoon");
  assert.equal(timeGreeting(new Date("2026-12-01T17:00:00Z")), "Good evening");
});

test("weather greetings handle rain, snow, storms, cold and clear nights", () => {
  const reading = { temperature: 16, feelsLike: 15, conditionId: 800, isDay: true };
  assert.match(weatherGreeting(reading), /sunny/);
  assert.match(weatherGreeting({ ...reading, isDay: false }), /Clear skies this evening/);
  assert.match(weatherGreeting({ ...reading, conditionId: 500 }), /raining/);
  assert.match(weatherGreeting({ ...reading, conditionId: 500, feelsLike: 3 }), /raining and cold/);
  assert.match(weatherGreeting({ ...reading, feelsLike: 3 }), /cold/);
  assert.match(weatherGreeting({ ...reading, conditionId: 600 }), /snowy/);
  assert.match(weatherGreeting({ ...reading, conditionId: 200 }), /Stormy/);
  assert.match(weatherGreeting({ ...reading, conditionId: 803 }), /cloudy/);
  assert.equal(weatherGreeting(null), "");
  assert.equal(weatherGreeting({ temperature: NaN }), "");
});
