import test from "node:test";
import assert from "node:assert/strict";
import { withMinimumDuration } from "../src/lib/adminOperations.js";

test("fast admin requests keep loading visible for 1.5 seconds", async () => {
  const start = performance.now();
  assert.equal(await withMinimumDuration(() => 42), 42);
  assert.ok(performance.now() - start >= 1490);
});
test("failures wait for the minimum duration and preserve the error", async () => {
  const failure = new Error("Save failed");
  const start = performance.now();
  await assert.rejects(withMinimumDuration(() => { throw failure; }, 50), (error) => error === failure);
  assert.ok(performance.now() - start >= 45);
});
test("slow requests stay pending until the actual operation completes", async () => {
  const start = performance.now();
  const value = await withMinimumDuration(() => new Promise((resolve) => setTimeout(() => resolve("saved"), 80)), 20);
  assert.equal(value, "saved");
  assert.ok(performance.now() - start >= 75);
});
