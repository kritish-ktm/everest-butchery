import { useEffect, useState } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import Icon from "../components/Icon";
import { readOrderReceipt } from "../lib/checkout";
import { formatPrice } from "../lib/shopPresentation";
import { api } from "../lib/api";
import { receiptHtml, receiptFilename } from "../lib/receipt";

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order || readOrderReceipt();
  const [receipt, setReceipt] = useState(order?.receipt || null);
  const [receiptError, setReceiptError] = useState('');
  const [loadingReceipt, setLoadingReceipt] = useState(!order?.receipt);
  const [retry, setRetry] = useState(0);
  const reference = order?.order_number;
  const suppliedReceipt = order?.receipt;
  useEffect(() => {
    if (!reference || suppliedReceipt) return;
    let active = true;
    api.getReceipt(reference).then(result => {
      if (active) setReceipt(result.receipt);
    }).catch(() => {
      if (active) setReceiptError('Receipt unavailable. Sign in with the account used for this order and try again.');
    }).finally(() => { if (active) setLoadingReceipt(false); });
    return () => { active = false; };
  }, [reference, suppliedReceipt, retry]);
  function downloadReceipt() {
    const url = URL.createObjectURL(new Blob([receiptHtml(receipt)], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = receiptFilename(receipt);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
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
      <p role="status">{order.email_status === 'submitted'
        ? 'Receipt email submitted to your account email address. Check your inbox or spam folder.'
        : 'Your order is saved. Email confirmation is not available for this order; download your receipt below.'}</p>
      {loadingReceipt && <p role="status">Loading receipt...</p>}
      {receiptError && <div role="alert"><p>{receiptError}</p><button type="button" className="btn btn-outline" onClick={() => { setLoadingReceipt(true); setReceiptError(''); setRetry(value => value + 1); }}>Try again</button></div>}
      {receipt && <section className="confirmation-receipt" aria-label="Order receipt">
        {receipt.items.map((item, index) => <div className="summary-row" key={index}><span>{item.product_name} · {item.quantity} {item.unit}</span><span>{formatPrice(item.line_total)}</span></div>)}
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(receipt.subtotal)}</span></div>
        <div className="summary-row"><span>Delivery</span><span>{formatPrice(receipt.delivery_fee)}</span></div>
        <div className="summary-row summary-total"><span>Total</span><span>{formatPrice(receipt.total)}</span></div>
        <p>Payment: {receipt.payment_status}</p>
        <button type="button" className="btn btn-outline" onClick={downloadReceipt}><i className="bi bi-download" aria-hidden="true" /> Download receipt</button>
      </section>}
      <Link to="/menu" className="btn btn-primary">Continue Shopping</Link>
    </div>
  );
}
