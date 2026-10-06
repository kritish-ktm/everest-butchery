import test from "node:test";
import assert from "node:assert/strict";
import { cartSubtotal, readOrderReceipt, saveOrderReceipt, validateCheckout } from "../src/lib/checkout.js";

const checkout = {
  customer: { full_name: "Test Customer", phone: "12345678", address: "Test Street 1", postal_code: "2700", city: "Copenhagen" },
  items: [{ product_id: 1, quantity: 0.5, unit: "kg", price_per_unit: 149 }],
  fulfillment: "pickup", paymentMethod: "cash", acceptedTerms: true,
};

test("checkout accepts valid pickup and delivery", () => {
  assert.equal(validateCheckout(checkout), "");
  assert.equal(validateCheckout({ ...checkout, fulfillment: "delivery" }), "");
});
test("checkout rejects missing consent, whitespace names, invalid delivery, and quantities", () => {
  assert.match(validateCheckout({ ...checkout, acceptedTerms: false }), /Terms/);
  assert.match(validateCheckout({ ...checkout, customer: { ...checkout.customer, full_name: "  " } }), /name/);
  assert.match(validateCheckout({ ...checkout, fulfillment: "delivery", customer: { ...checkout.customer, postal_code: "123" } }), /postal/);
  assert.match(validateCheckout({ ...checkout, fulfillment: "unknown" }), /pickup/);
  assert.match(validateCheckout({ ...checkout, paymentMethod: "unknown" }), /payment/);
  for (const quantity of [0, -1, 0.1, NaN, 1001]) {
    assert.match(validateCheckout({ ...checkout, items: [{ ...checkout.items[0], quantity }] }), /quantities/);
  }
  assert.match(validateCheckout({ ...checkout, items: [] }), /quantities/);
});
test("cart totals round each line to cents like the backend", () => {
  assert.equal(cartSubtotal([{ quantity: 0.25, price_per_unit: 10.01 }, { quantity: 0.25, price_per_unit: 10.01 }]), 5);
  assert.equal(cartSubtotal(checkout.items), 74.5);
});
test("receipt survives refresh without persisting customer information and expires", () => {
  let saved;
  const storage = { setItem: (_key, value) => { saved = value; }, getItem: () => saved };
  saveOrderReceipt({ order_number: "DEMO-1001", total: 74.5, customer: checkout.customer }, storage, 1000);
  assert.ok(!saved.includes("Test Customer"));
  assert.equal(readOrderReceipt(storage, 2000).order_number, "DEMO-1001");
  assert.equal(readOrderReceipt(storage, 1000 + 86400001), null);
  assert.equal(readOrderReceipt(storage, 999), null);
  saved = "invalid json";
  assert.equal(readOrderReceipt(storage), null);
});
test("unavailable storage never hides a successful order", () => {
  const storage = { setItem() { throw new Error("blocked"); }, getItem() { throw new Error("blocked"); } };
  assert.doesNotThrow(() => saveOrderReceipt({ order_number: "DEMO-1", total: 1 }, storage));
  assert.equal(readOrderReceipt(storage), null);
});
