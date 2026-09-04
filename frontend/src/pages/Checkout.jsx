import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";

const DELIVERY_FEE = 39;

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { search } = useLocation();
  const campaign = new URLSearchParams(search).get("campaign")
    || sessionStorage.getItem("everest-order-campaign")
    || "";
  const [fulfillment, setFulfillment] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", address: "", postal_code: "", city: "", notes: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="section container empty-state page-shell">
        <p style={{ marginBottom: 20 }}>Your cart is empty.</p>
        <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
      </div>
    );
  }

  const total = subtotal + (fulfillment === "delivery" ? DELIVERY_FEE : 0);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.full_name || !form.phone) {
      setError("Please provide your name and phone number.");
      return;
    }
    if (fulfillment === "delivery" && !form.address) {
      setError("Please provide a delivery address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createOrder({
        source: "online",
        campaign: campaign || undefined,
        fulfillment,
        payment_method: paymentMethod,
        customer: form,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        notes: form.notes,
      });
      clearCart();
      if (campaign) sessionStorage.removeItem("everest-order-campaign");
      navigate("/order-confirmation", { state: { order: res } });
    } catch (err) {
      setError(err.message || "Something went wrong placing your order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="section container page-shell">
      <div className="page-heading compact-heading">
        <span className="page-kicker">PICKUP OR DELIVERY</span>
        <h2>Checkout</h2>
        <p>{campaign === "dashain"
          ? "Your Dashain booking will receive a dedicated reference number for easy pickup."
          : "No account required. Complete your order as a guest."}</p>
      </div>
      <div className="checkout-grid">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="checkout-mode">
            <i className={`bi ${campaign === "dashain" ? "bi-stars" : "bi-person-check"}`} aria-hidden="true" />
            <div>
              <strong>{campaign === "dashain" ? "Dashain booking" : "Guest checkout"}</strong>
              <span>{campaign === "dashain"
                ? "Your order will be labelled DASH- with your customer code."
                : "You can place this order without creating an account."}</span>
            </div>
          </div>
          {error && <div className="error-box">{error}</div>}

          <div className="toggle-row">
            <button type="button" className={"toggle-btn" + (fulfillment === "pickup" ? " active" : "")} onClick={() => setFulfillment("pickup")}>Pickup</button>
            <button type="button" className={"toggle-btn" + (fulfillment === "delivery" ? " active" : "")} onClick={() => setFulfillment("delivery")}>Delivery</button>
          </div>

          <div className="field">
            <label>Full name</label>
            <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          </div>
          <div className="field">
            <label>Email (optional)</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>

          {fulfillment === "delivery" && (
            <>
              <div className="field">
                <label>Delivery address</label>
                <input value={form.address} onChange={(e) => update("address", e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Postal code</label>
                  <input value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} />
                </div>
                <div className="field" style={{ flex: 2 }}>
                  <label>City</label>
                  <input value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className="field">
            <label>Payment method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash on {fulfillment === "delivery" ? "delivery" : "pickup"}</option>
              <option value="card">Card on {fulfillment === "delivery" ? "delivery" : "pickup"}</option>
              <option value="mobilepay">MobilePay</option>
            </select>
          </div>

          <div className="field">
            <label>Notes (optional)</label>
            <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="E.g. cut preference, preferred pickup time..." />
          </div>

          <button className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Placing order…" : `Place Order — ${total.toFixed(0)} kr`}
          </button>
        </form>

        <div className="cart-summary">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Order Summary</h3>
          {items.map((i) => (
            <div className="summary-row" key={i.product_id}>
              <span>{i.name_en} × {i.quantity}{i.unit}</span>
              <span>{(i.quantity * i.price_per_unit).toFixed(0)} kr</span>
            </div>
          ))}
          <div className="summary-row"><span>Subtotal</span><span>{subtotal.toFixed(0)} kr</span></div>
          <div className="summary-row"><span>Delivery</span><span>{fulfillment === "delivery" ? `${DELIVERY_FEE} kr` : "—"}</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>{total.toFixed(0)} kr</span></div>
        </div>
      </div>
    </div>
  );
}
