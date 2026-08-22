import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="section container empty-state">
        <h2 style={{ marginBottom: 10 }}>Your Cart is Empty</h2>
        <p style={{ marginBottom: 20 }}>Add something fresh from the menu.</p>
        <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="section container">
      <h2 style={{ marginBottom: 20 }}>Your Cart</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 30, alignItems: "start" }}>
        <table className="cart-table">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.product_id}>
                <td>{i.name_en}{i.name_np && <span className="np" style={{ color: "#888" }}> · {i.name_np}</span>}</td>
                <td>
                  <input
                    className="qty-input"
                    type="number"
                    min={0}
                    step={i.unit === "kg" ? 0.25 : 1}
                    value={i.quantity}
                    onChange={(e) => updateQuantity(i.product_id, parseFloat(e.target.value) || 0)}
                  />
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>{i.unit}</span>
                </td>
                <td>{(i.quantity * i.price_per_unit).toFixed(0)} kr</td>
                <td><button className="remove-btn" onClick={() => removeItem(i.product_id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-summary">
          <div className="summary-row"><span>Subtotal</span><span>{subtotal.toFixed(0)} kr</span></div>
          <div className="summary-row" style={{ color: "#888" }}><span>Delivery fee</span><span>Calculated at checkout</span></div>
          <div className="summary-row summary-total"><span>Total (pickup)</span><span>{subtotal.toFixed(0)} kr</span></div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
