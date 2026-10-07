import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { receiptHtml, receiptFilename } from '../src/lib/receipt.js';

export function createOrderService({ env = process.env, clientFactory = createClient, transportFactory = nodemailer.createTransport } = {}) {
  function json(value, status = 200) {
    return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
  }
  return async function orders(request) {
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return json({ error: 'Please sign in to access your order.' }, 401);
    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return json({ error: 'Ordering is unavailable.' }, 503);
    const client = clientFactory(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    let user;
    try {
      const result = await client.auth.getUser(token);
      if (result.error || !result.data.user) return json({ error: 'Please sign in again.' }, 401);
      user = result.data.user;
    } catch { return json({ error: 'Unable to check your account. Please try again.' }, 503); }
    if (request.method === 'GET') {
      try {
        const { data, error } = await client.rpc('get_order_receipt', { order_ref: new URL(request.url).searchParams.get('reference') || '' });
        if (error) return json({ error: 'Unable to load your receipt.' }, 503);
        if (!data) return json({ error: 'Receipt not found for this account.' }, 404);
        return json({ receipt: data });
      } catch { return json({ error: 'Unable to load your receipt.' }, 503); }
    }
    const raw = await request.text();
    if (raw.length > 32000) return json({ error: 'Order is too large.' }, 413);
    let payload;
    try { payload = JSON.parse(raw); } catch { return json({ error: 'Invalid order.' }, 400); }
    let order;
    try {
      const { data, error } = await client.rpc('create_order', { payload });
      if (error) return json({ error: error.message || 'Unable to place your order.' }, 400);
      order = data;
    } catch { return json({ error: 'Unable to place your order. Check with the shop before retrying.' }, 503); }
    // Once committed, receipt or SMTP failures must never report a failed checkout.
    let receipt = null;
    let emailStatus = 'not_sent';
    try {
      const result = await client.rpc('get_order_receipt', { order_ref: order.order_number });
      if (!result.error) receipt = result.data;
      if (receipt && env.BREVO_SMTP_PASSWORD && env.BREVO_SMTP_LOGIN && env.ORDER_EMAIL_FROM && user.email && user.email_confirmed_at) {
        const html = receiptHtml(receipt);
        const transport = transportFactory({ host: 'smtp-relay.brevo.com', port: 587, secure: false, requireTLS: true,
          auth: { user: env.BREVO_SMTP_LOGIN, pass: env.BREVO_SMTP_PASSWORD },
          connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000, dnsTimeout: 8000,
          disableFileAccess: true, disableUrlAccess: true });
        const sent = await transport.sendMail({ from: env.ORDER_EMAIL_FROM, to: user.email,
          subject: `Order received - ${order.order_number}`,
          text: `Your Everest Butchery order ${order.order_number} has been received. Total: ${Number(order.total).toFixed(2)} DKK. Awaiting shop confirmation. This is not proof of payment. Your itemised receipt is attached.`,
          html, attachments: [{ filename: receiptFilename(receipt), content: html, contentType: 'text/html; charset=utf-8' }] });
        if (sent.accepted?.length) emailStatus = 'submitted';
      }
    } catch { /* No provider errors, secrets, or customer details in responses/logs. */ }
    return json({ ...order, receipt, email_status: emailStatus });
  };
}
