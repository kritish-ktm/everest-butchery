import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import QuantityControl from "../components/QuantityControl";
import { formatPrice } from "../lib/shopPresentation";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="section container empty-state page-shell">
        <h2 style={{ marginBottom: 10 }}>Your Cart is Empty</h2>
        <p style={{ marginBottom: 20 }}>Add something fresh from the menu.</p>
        <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="section container page-shell basket-page">
      <div className="page-heading compact-heading">
        <span className="page-kicker">READY WHEN YOU ARE</span>
        <h1>Your Cart</h1>
        <Link to="/menu" className="continue-shopping"><i className="bi bi-arrow-left" aria-hidden="true" /> Continue shopping</Link>
      </div>
      <div className="cart-layout">
        <table className="cart-table">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.product_id}>
                <td className="basket-product"><strong>{i.name_en}</strong>{i.name_np && <span className="np">{i.name_np}</span>}<small>{formatPrice(i.price_per_unit)} / {i.unit}</small></td>
                <td>
                  <QuantityControl value={i.quantity} unit={i.unit} name={i.name_en} onChange={(quantity) => updateQuantity(i.product_id, quantity)} />
                </td>
                <td className="basket-line-price">{formatPrice(i.quantity * i.price_per_unit)}</td>
                <td><button className="basket-remove" title={`Remove ${i.name_en}`} aria-label={`Remove ${i.name_en}`} onClick={() => removeItem(i.product_id)}><i className="bi bi-trash3" aria-hidden="true" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-summary">
          <h2 className="basket-summary-title">Order Summary</h2>
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="summary-row" style={{ color: "#888" }}><span>Delivery fee</span><span>Calculated at checkout</span></div>
          <div className="summary-row summary-total"><span>Total (pickup)</span><span>{formatPrice(subtotal)}</span></div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
          <p className="basket-payment-note"><i className="bi bi-person-check" aria-hidden="true" /> Sign in at checkout. Pay on pickup or delivery.</p>
        </div>
      </div>
    </div>
  );
}
