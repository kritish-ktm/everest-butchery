// Dev-only mock checkout. Use 127.0.0.1 to keep browser storage separate from localhost.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { CartProvider, useCart } from "../src/context/CartContext";
import Checkout from "../src/pages/Checkout";
import OrderConfirmation from "../src/pages/OrderConfirmation";
import { api } from "../src/lib/api";
import { supabase } from "../src/lib/supabase";
import "../src/index.css";
import "../src/shopping.css";

if (!import.meta.env.DEV) throw new Error("Development fixture only");
if (!supabase) throw new Error("Local Supabase configuration needed for mock auth fixture");
const mockUser = { id: "demo", email: "demo@example.invalid", user_metadata: { full_name: "Demo Customer", phone: "12345678" } };
supabase.auth.getSession = async () => ({ data: { session: { user: mockUser } } });
supabase.auth.onAuthStateChange = () => ({ data: { subscription: { unsubscribe() {} } } });
let requests = 0;
export function Fixture() {
  const { addItem, items } = useCart();
  const [fail, setFail] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
  api.createOrder = async (payload) => {
    requests++;
    setCount(requests);
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (fail) throw new Error("Demo stock unavailable. Please update your cart.");
    return { order_number: "DEMO-1001", total: 74.5 + (payload.fulfillment === "delivery" ? 39 : 0) };
  };
  }, [fail]);
  return <><header className="container"><p>Mock checkout: no real orders, payment, or stock changes.</p><button disabled={items.length > 0} onClick={() => addItem({ id: 1, name_en: "Demo Goat", unit: "kg", price_per_unit: 149 }, 0.5)}>Add demo item</button><label><input type="checkbox" checked={fail} onChange={(event) => setFail(event.target.checked)} /> Simulate stock error</label><p>Order requests: {count}</p><Link to="/checkout">Open mock checkout</Link></header><Routes><Route path="/checkout" element={<Checkout />} /><Route path="/order-confirmation" element={<OrderConfirmation />} /><Route path="*" element={<p className="container">Choose Open mock checkout.</p>} /></Routes></>;
}
createRoot(document.getElementById("root")).render(<HashRouter><CartProvider><Fixture /></CartProvider></HashRouter>);
