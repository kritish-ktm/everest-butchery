import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { supabase } from "../lib/supabase";
import { formatPrice } from "../lib/shopPresentation";
import { customerProfile } from "../lib/customerProfile";

const DELIVERY_FEE = 39;

function savedBooking() {
  try {
    const value = sessionStorage.getItem("everest-dashain-booking");
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { search } = useLocation();
  const campaign = new URLSearchParams(search).get("campaign")
    || sessionStorage.getItem("everest-order-campaign")
    || "";
  const [fulfillment, setFulfillment] = useState(() => savedBooking().fulfillment || "pickup");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [form, setForm] = useState(() => ({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    postal_code: "",
    city: "",
    notes: "",
    requested_time: "",
    ...savedBooking(),
  }));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthUser(data.session?.user || null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
      setAuthReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser) return;
    setForm((current) => {
      const profile = customerProfile(authUser);
      return { ...current, ...Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, current[key] || value])) };
    });
  }, [authUser]);

  if (items.length === 0) {
    return (
      <div className="section container empty-state page-shell">
        <p style={{ marginBottom: 20 }}>Your cart is empty.</p>
        <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
      </div>
    );
  }

  if (!authReady) {
    return <div className="section container empty-state page-shell" role="status">Checking your account…</div>;
  }

  const total = subtotal + (fulfillment === "delivery" ? DELIVERY_FEE : 0);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleGoogleCredential(credential) {
    setError("");
    setAuthSubmitting(true);
    try {
      const { error: authError } = await supabase.auth.signInWithIdToken({ provider: "google", token: credential });
      if (authError) throw authError;
    } catch (err) {
      setError(err.message || "Google sign-in could not be completed.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleAccountLogin(event) {
    event.preventDefault();
    setError("");
    setAuthSubmitting(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError.message || "We could not sign you in.");
    } finally {
      setAuthSubmitting(false);
    }
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
        requested_time: form.requested_time ? form.requested_time.replace("T", " ") : undefined,
        customer: form,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        notes: form.notes,
      });
      clearCart();
      if (campaign) sessionStorage.removeItem("everest-order-campaign");
      sessionStorage.removeItem("everest-dashain-booking");
      navigate("/order-confirmation", { state: { order: res } });
    } catch (err) {
      setError(err.message || "Something went wrong placing your order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="section container page-shell checkout-page">
      <div className="page-heading compact-heading">
        <span className="page-kicker">PICKUP OR DELIVERY</span>
        <h1>Checkout</h1>
        <p>{campaign === "dashain"
          ? "Your Dashain booking will receive a dedicated reference number for easy pickup."
          : "Sign in to confirm your details and complete your order."}</p>
      </div>
      {!authUser ? (
        <section className="checkout-auth-gate" aria-labelledby="checkout-login-title">
          <div className="checkout-auth-copy">
            <span className="page-kicker">ACCOUNT REQUIRED</span>
            <h3 id="checkout-login-title">Sign in to continue</h3>
            <p>Your cart is saved while you sign in. After that, you can finish your order here.</p>
          </div>
          {error && <div className="error-box" role="alert">{error}</div>}
          {!supabase ? (
            <div className="error-box">Account sign-in is unavailable until Supabase is configured.</div>
          ) : (
            <>
              <form onSubmit={handleAccountLogin}>
                <div className="field">
                  <label htmlFor="checkout-email">Email</label>
                  <input id="checkout-email" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" required />
                </div>
                <div className="field">
                  <label htmlFor="checkout-password">Password</label>
                  <input id="checkout-password" type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} autoComplete="current-password" required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={authSubmitting}>
                  {authSubmitting ? "Signing in…" : "Log In"}
                </button>
              </form>
              <div className="account-divider"><span>or</span></div>
              <GoogleSignInButton onCredential={handleGoogleCredential} />
              <p className="checkout-create-account">New here? <Link to={`/account?returnTo=${encodeURIComponent(`/checkout${campaign ? `?campaign=${campaign}` : ""}`)}`}>Create an account</Link></p>
            </>
          )}
        </section>
      ) : (
      <div className="checkout-grid">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="checkout-mode">
            <i className={`bi ${campaign === "dashain" ? "bi-stars" : "bi-person-check"}`} aria-hidden="true" />
            <div>
              <strong>{campaign === "dashain" ? "Dashain booking" : "Signed in"}</strong>
              <span>{campaign === "dashain"
                ? "Your order will be labelled DASH- with your customer code."
                : `Signed in as ${authUser.email || "your account"}.`}</span>
            </div>
          </div>
          {error && <div className="error-box" role="alert">{error}</div>}

          <div className="toggle-row">
            <button type="button" aria-pressed={fulfillment === "pickup"} className={"toggle-btn" + (fulfillment === "pickup" ? " active" : "")} onClick={() => setFulfillment("pickup")}>Pickup</button>
            <button type="button" aria-pressed={fulfillment === "delivery"} className={"toggle-btn" + (fulfillment === "delivery" ? " active" : "")} onClick={() => setFulfillment("delivery")}>Delivery</button>
          </div>

          <div className="field">
            <label htmlFor="order-name">Full name</label>
            <input id="order-name" autoComplete="name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="order-phone">Phone</label>
            <input id="order-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="order-email">Email (optional)</label>
            <input id="order-email" type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>

          {fulfillment === "delivery" && (
            <>
              <div className="field">
                <label htmlFor="order-address">Delivery address</label>
                <input id="order-address" autoComplete="street-address" value={form.address} onChange={(e) => update("address", e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="order-postcode">Postal code</label>
                  <input id="order-postcode" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} required />
                </div>
                <div className="field" style={{ flex: 2 }}>
                  <label htmlFor="order-city">City</label>
                  <input id="order-city" autoComplete="address-level2" value={form.city} onChange={(e) => update("city", e.target.value)} required />
                </div>
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="order-payment">Payment method</label>
            <select id="order-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash on {fulfillment === "delivery" ? "delivery" : "pickup"}</option>
              <option value="card">Card on {fulfillment === "delivery" ? "delivery" : "pickup"}</option>
              <option value="mobilepay">MobilePay</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="order-time">Preferred date and time (optional)</label>
            <input id="order-time" type="datetime-local" value={form.requested_time} onChange={(e) => update("requested_time", e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="order-notes">Notes (optional)</label>
            <textarea id="order-notes" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="E.g. cut preference, preferred pickup time..." />
          </div>

          <div className="checkout-legal-consent">
            <input id="checkout-terms" type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required />
            <div>
              <label htmlFor="checkout-terms">I have read and agree to the Terms and Conditions.</label>
              <p><Link to="/terms">Terms and Conditions</Link> · <Link to="/privacy">Privacy Notice</Link></p>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: "100%" }} disabled={submitting || !acceptedTerms}>
            {submitting ? "Placing order…" : `Place Order - ${formatPrice(total)}`}
          </button>
        </form>

        <div className="cart-summary">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Order Summary</h3>
          <Link className="continue-shopping" to="/cart">Edit cart</Link>
          {items.map((i) => (
            <div className="summary-row" key={i.product_id}>
              <span>{i.name_en} × {i.quantity}{i.unit}</span>
              <span>{formatPrice(i.quantity * i.price_per_unit)}</span>
            </div>
          ))}
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{fulfillment === "delivery" ? `${DELIVERY_FEE} kr` : "-"}</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
        </div>
      </div>
      )}
    </div>
  );
}
