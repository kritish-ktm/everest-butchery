import test from "node:test";
import assert from "node:assert/strict";
import { stockStatus } from "../src/lib/inventory.js";
import { customerProfile } from "../src/lib/customerProfile.js";

test("inventory warnings use strict 50% and 20% boundaries", () => {
  for (const [quantity, level] of [[100, "good"], [50, "good"], [49.75, "warning"], [20, "warning"], [19.75, "critical"], [0, "critical"]]) {
    assert.equal(stockStatus({ stock_quantity: quantity, stock_reference: 100 }).level, level);
  }
  assert.equal(stockStatus({ stock_quantity: 0, stock_reference: 100 }).label, "Out of stock");
  assert.equal(stockStatus({ stock_quantity: 19, stock_reference: 100 }).label, "Limited stock available");
  assert.equal(stockStatus({ stock_quantity: null, stock_reference: null }).level, "untracked");
});

test("stock percentages work with database numeric strings and different baselines", () => {
  assert.equal(stockStatus({ stock_quantity: "49.000", stock_reference: "100.000" }).percent, 49);
  assert.equal(stockStatus({ stock_quantity: "10.000", stock_reference: "20.000" }).level, "good");
  assert.equal(stockStatus({ stock_quantity: "3.000", stock_reference: "20.000" }).level, "critical");
});

test("customer details use saved profile fields and provider fallbacks", () => {
  assert.deepEqual(customerProfile({ email: "demo@example.test", phone: "1234", user_metadata: { name: "Demo", phone: "5678", address: "Demo street", postal_code: "2700", city: "Copenhagen" } }), {
    full_name: "Demo", email: "demo@example.test", phone: "5678", address: "Demo street", postal_code: "2700", city: "Copenhagen",
  });
  assert.equal(customerProfile(null).full_name, "");
});
