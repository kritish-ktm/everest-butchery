import { useLocation, Link, Navigate } from "react-router-dom";
import Icon from "../components/Icon";
import { readOrderReceipt } from "../lib/checkout";
import { formatPrice } from "../lib/shopPresentation";

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order || readOrderReceipt();
  if (!order) return <Navigate to="/" replace />;

  return (
    <div className="section container confirm-box page-shell">
      <div className="confirm-icon"><Icon name="check" size={34} /></div>
      <h2>Order Placed!</h2>
      <div className="order-number">{order.order_number}</div>
      <p style={{ color: "#666" }}>Total: {formatPrice(order.total)}</p>
      <p>Awaiting shop confirmation</p>
      <p style={{ color: "#666", maxWidth: 420, margin: "10px auto 24px" }}>
        We'll call you to confirm the pickup or delivery time. Thank you for shopping with Everest Butchery.
      </p>
      <Link to="/menu" className="btn btn-primary">Continue Shopping</Link>
    </div>
  );
}
