export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

const money = value => `${Number(value).toFixed(2)} DKK`;
export function receiptFilename(order) {
  return `Everest-${String(order.order_number).replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
}

export function receiptHtml(order) {
  const e = escapeHtml;
  const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Copenhagen' }).format(new Date(order.created_at));
  const customer = order.customer || {};
  const rows = order.items.map(item => `<tr><td>${e(item.product_name)}</td><td>${e(item.quantity)} ${e(item.unit)}</td><td>${money(item.unit_price)}</td><td>${money(item.line_total)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Receipt ${e(order.order_number)}</title><style>body{font:16px/1.6 Arial,sans-serif;color:#222;margin:0;padding:32px}main{max-width:760px;margin:auto}h1{color:#b91c35;font-size:26px}h2{font-size:20px}table{width:100%;border-collapse:collapse;margin:24px 0;font-size:14px}th,td{text-align:left;padding:10px 6px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}td:last-child,th:last-child{text-align:right}.totals{margin-left:auto;max-width:300px}.totals p{display:flex;justify-content:space-between;gap:20px}.total{font-weight:bold;border-top:2px solid #333;padding-top:12px}footer{border-top:1px solid #ddd;padding-top:20px;font-size:13px;color:#555}@media(max-width:500px){body{padding:16px}table{font-size:12px}th,td{padding:8px 4px}}@media print{body{padding:0}tr{break-inside:avoid}}</style></head><body><main>
<h1>Everest Butchery</h1><h2>Order receipt</h2><p><strong>${e(order.order_number)}</strong><br>${e(date)} (Copenhagen time)</p>
<p>${e(customer.full_name)}<br>${e(order.fulfillment === 'delivery' ? [customer.address, customer.postal_code, customer.city].filter(Boolean).join(', ') : 'Pickup')}</p>
<p>Order status: ${e(order.status)}<br>Payment: ${e(order.payment_method)} - ${e(order.payment_status)}</p>
<table><thead><tr><th>Item</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
<div class="totals"><p><span>Subtotal</span><span>${money(order.subtotal)}</span></p><p><span>Delivery</span><span>${money(order.delivery_fee)}</span></p><p class="total"><span>Total</span><span>${money(order.total)}</span></p></div>
<footer><p>Your order has been received. Shop approval and pickup or delivery time will be confirmed separately. This receipt is not proof of payment unless the payment status is paid.</p><p>+45 71 33 83 50 | hello@everestbutchery.dk</p></footer></main></body></html>`;
}
