-- New orders only: never infer ownership of old orders from a phone number.
alter table public.orders add column if not exists placed_by uuid;
alter table public.orders add column if not exists receipt_customer jsonb;

create or replace function private.capture_receipt_customer()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.placed_by := auth.uid();
  select jsonb_build_object('full_name', c.full_name, 'address', c.address,
    'postal_code', c.postal_code, 'city', c.city) into new.receipt_customer
    from public.customers c where c.id = new.customer_id;
  return new;
end;
$$;
revoke all on function private.capture_receipt_customer() from public, anon, authenticated;
create trigger capture_receipt_customer before insert on public.orders
for each row execute function private.capture_receipt_customer();

create or replace function public.get_order_receipt(order_ref text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', o.id, 'order_number', o.order_number,
    'created_at', o.created_at, 'fulfillment', o.fulfillment, 'status', o.status,
    'payment_method', o.payment_method, 'payment_status', o.payment_status,
    'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'total', o.total,
    'customer', o.receipt_customer, 'items', coalesce((
      select jsonb_agg(jsonb_build_object('product_name', i.product_name,
        'quantity', i.quantity, 'unit', i.unit, 'unit_price', i.unit_price,
        'line_total', i.line_total) order by i.id)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o where o.order_number = order_ref and o.placed_by = auth.uid()
    and auth.uid() is not null;
$$;
revoke all on function public.get_order_receipt(text) from public, anon;
grant execute on function public.get_order_receipt(text) to authenticated;
