import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderService } from '../server/orders.js';
import { receiptHtml, receiptFilename } from '../src/lib/receipt.js';

const receipt = { id: 1, order_number: 'DEMO-1001', created_at: '2026-10-07T12:00:00Z', status: 'pending', fulfillment: 'pickup',
  payment_status: 'unpaid', payment_method: 'cash', subtotal: 74.5, delivery_fee: 0, total: 74.5,
  customer: { full_name: '<script>alert(1)</script>' }, items: [{ product_name: 'Goat & rice', quantity: 0.5, unit: 'kg', unit_price: 149, line_total: 74.5 }] };
const env = { VITE_SUPABASE_URL: 'https://example.invalid', VITE_SUPABASE_ANON_KEY: 'public-key',
  BREVO_SMTP_LOGIN: 'smtp-user', BREVO_SMTP_PASSWORD: 'test-only-secret', ORDER_EMAIL_FROM: 'Everest <sender@example.invalid>' };
const request = () => new Request('http://localhost/api/orders', { method: 'POST', headers: { Authorization: 'Bearer test-token' }, body: JSON.stringify({ customer: { email: 'arbitrary@example.invalid' }, items: [{ product_id: 1, quantity: 0.5 }] }) });
function client({ denied = false } = {}) {
  return { auth: { getUser: async () => ({ data: { user: { email: 'verified@example.invalid', email_confirmed_at: '2026-01-01' } } }) },
    rpc: async name => ({ data: name === 'create_order' ? { id: 1, order_number: receipt.order_number, total: receipt.total } : denied ? null : receipt }) };
}

test('receipt escapes customer/item text and preserves honest payment status', () => {
  const html = receiptHtml(receipt);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('Goat &amp; rice'));
  assert.ok(html.includes('74.50 DKK'));
  assert.ok(html.includes('unpaid'));
  assert.ok(html.includes('not proof of payment'));
  assert.equal(receiptFilename({ order_number: '../bad/name' }), 'Everest-___bad_name.html');
});
test('receipt email uses authenticated recipient, saved totals, STARTTLS and attachment', async () => {
  let options; let message;
  const service = createOrderService({ env, clientFactory: () => client(), transportFactory: config => {
    options = config;
    return { sendMail: async value => { message = value; return { accepted: ['verified@example.invalid'] }; } };
  } });
  const response = await service(request());
  const data = await response.json();
  assert.equal(data.email_status, 'submitted');
  assert.equal(message.to, 'verified@example.invalid');
  assert.equal(options.requireTLS, true);
  assert.equal(options.port, 587);
  assert.equal(options.disableUrlAccess, true);
  assert.equal(message.attachments[0].filename, 'Everest-DEMO-1001.html');
  assert.ok(message.html.includes('74.50 DKK'));
  assert.ok(!JSON.stringify(data).includes('test-only-secret'));
});
test('SMTP failures and missing configuration preserve successful orders', async () => {
  for (const settings of [env, { ...env, BREVO_SMTP_PASSWORD: '' }]) {
    const service = createOrderService({ env: settings, clientFactory: () => client(), transportFactory: () => ({ sendMail: async () => { throw new Error('test-only-secret'); } }) });
    const response = await service(request());
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.order_number, receipt.order_number);
    assert.equal(data.email_status, 'not_sent');
    assert.equal(data.receipt.total, 74.5);
    assert.ok(!JSON.stringify(data).includes('test-only-secret'));
  }
});
test('unauthenticated and non-owned receipts are denied with no caching', async () => {
  const service = createOrderService({ env, clientFactory: () => client({ denied: true }) });
  assert.equal((await service(new Request('http://localhost/api/orders'))).status, 401);
  const response = await service(new Request('http://localhost/api/orders?reference=someone-else', { headers: { Authorization: 'Bearer token' } }));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
