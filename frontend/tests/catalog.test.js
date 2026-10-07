import test from "node:test";
import assert from "node:assert/strict";
import { filterProducts, productAvailable } from "../src/lib/shopPresentation.js";

test("sold-out products remain searchable and filterable in the menu", () => {
  const soldOut = { id: 1, name_en: "Goat curry", category_id: 1, in_stock: false, stock_quantity: 0 };
  const available = { id: 2, name_en: "Chicken", category_id: 2, in_stock: true, stock_quantity: 10 };
  assert.equal(filterProducts([soldOut, available], {}).length, 2);
  assert.deepEqual(filterProducts([soldOut, available], { query: "goat", category: "1" }), [soldOut]);
});

test("availability respects stock flags and zero remaining quantity", () => {
  assert.equal(productAvailable({ in_stock: true, stock_quantity: "0.000" }), false);
  assert.equal(productAvailable({ in_stock: false, stock_quantity: 10 }), false);
  assert.equal(productAvailable({ in_stock: "0", stock_quantity: null }), false);
  assert.equal(productAvailable({ in_stock: 1, stock_quantity: "0.250" }), true);
  assert.equal(productAvailable({ in_stock: true, stock_quantity: null }), true);
  assert.equal(productAvailable({ stock_quantity: 0 }), false);
});
