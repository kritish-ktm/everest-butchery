import test from "node:test";
import assert from "node:assert/strict";
import { CONSENT_KEY, SORT_KEY, CONSENT_LIFETIME, readConsent, saveConsent, readMenuSort, saveMenuSort } from "../src/lib/cookiePreferences.js";

function storage() {
  const values = new Map();
  return { values, getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}
test("optional preferences are not read or written before consent", () => {
  const store = { getItem() { assert.fail("Optional storage read without consent"); }, setItem() { assert.fail("Optional storage write without consent"); } };
  assert.equal(readMenuSort(null, store), null);
  saveMenuSort("name", null, store);
  saveMenuSort("name", { preferences: false }, store);
});
test("accept enables preference saving and rejection deletes only optional data", () => {
  const store = storage();
  store.setItem("eb_supabase_auth", "essential-login");
  const accepted = saveConsent(true, store, 1000);
  saveMenuSort("price-low", accepted, store, 2000);
  assert.equal(readMenuSort(readConsent(store, 2000), store, 2000), "price-low");
  saveConsent(false, store, 3000);
  assert.equal(store.getItem(SORT_KEY), null);
  assert.equal(readConsent(store, 3000).preferences, false);
  assert.equal(store.getItem("eb_supabase_auth"), "essential-login");
});
test("consent expires and malformed or outdated choices never enable preferences", () => {
  const store = storage();
  saveConsent(true, store, 1000);
  store.setItem(SORT_KEY, "name");
  assert.equal(readConsent(store, 1000 + CONSENT_LIFETIME), null);
  assert.equal(store.getItem(SORT_KEY), null);
  for (const value of ["bad json", JSON.stringify({ version: 2, preferences: true, savedAt: 1 }), JSON.stringify({ version: 1, preferences: "true", savedAt: 1 })]) {
    store.setItem(CONSENT_KEY, value);
    assert.equal(readConsent(store, 2000), null);
  }
});
test("blocked storage does not crash consent choices", () => {
  const store = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.equal(readConsent(store), null);
  assert.equal(saveConsent(false, store).preferences, false);
});
