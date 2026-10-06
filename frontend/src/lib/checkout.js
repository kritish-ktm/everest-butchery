import { validQuantity } from "./shopPresentation.js";

const RECEIPT_KEY = "everest-last-order";
const RECEIPT_LIFETIME = 24 * 60 * 60 * 1000;

export function validateCheckout({ customer, items, fulfillment, paymentMethod, acceptedTerms }) {
  if (!acceptedTerms) return "Please agree to the Terms and Conditions.";
  if (!customer.full_name?.trim() || !customer.phone?.trim()) return "Please provide your name and phone number.";
  if (!["pickup", "delivery"].includes(fulfillment)) return "Please choose pickup or delivery.";
  if (!["cash", "card", "mobilepay"].includes(paymentMethod)) return "Please choose a payment method.";
  if (fulfillment === "delivery" && (!customer.address?.trim() || !customer.city?.trim() || !/^\d{4}$/.test(customer.postal_code?.trim() || ""))) {
    return "Please provide your delivery address, four-digit postal code, and city.";
  }
  if (!items.length || items.some((item) => !Number.isInteger(Number(item.product_id)) || Number(item.product_id) <= 0 || !validQuantity(item.quantity, item.unit) || item.quantity > 1000)) {
    return "Please check the quantities in your cart.";
  }
  return "";
}

export function cartSubtotal(items) {
  // Match the backend's per-line currency rounding before adding the total.
  return items.reduce((cents, item) => cents + Math.round(item.quantity * Number(item.price_per_unit) * 100), 0) / 100;
}

export function saveOrderReceipt(order, storage, now = Date.now()) {
  try {
    (storage || sessionStorage).setItem(RECEIPT_KEY, JSON.stringify({ order_number: order.order_number, total: Number(order.total), savedAt: now }));
  } catch { /* The router still carries the receipt when storage is unavailable. */ }
}

export function readOrderReceipt(storage, now = Date.now()) {
  try {
    const receipt = JSON.parse((storage || sessionStorage).getItem(RECEIPT_KEY));
    if (!receipt || typeof receipt.order_number !== "string" || !receipt.order_number || !Number.isFinite(receipt.total) || receipt.total < 0 || !Number.isFinite(receipt.savedAt) || now - receipt.savedAt > RECEIPT_LIFETIME || receipt.savedAt > now) return null;
    return receipt;
  } catch { return null; }
}
