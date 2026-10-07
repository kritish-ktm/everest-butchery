begin;
do $$
declare
  owner_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  category bigint;
  product bigint;
  result jsonb;
  receipt jsonb;
  fixture_phone text := 'receipt-fixture-' || gen_random_uuid();
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  select id into category from public.categories limit 1;
  insert into public.products(category_id, name_en, unit, price_per_unit, is_visible, in_stock)
    values(category, 'Receipt fixture', 'kg', 149, true, true) returning id into product;
  result := public.create_order(jsonb_build_object('customer', jsonb_build_object('full_name', 'Original Customer', 'phone', fixture_phone),
    'fulfillment', 'delivery', 'payment_method', 'cash', 'items', jsonb_build_array(jsonb_build_object('product_id', product, 'quantity', 0.5))));
  receipt := public.get_order_receipt(result->>'order_number');
  assert (receipt->>'total')::numeric = 113.5, 'Receipt must use saved server total';
  assert (receipt->>'delivery_fee')::numeric = 39, 'Receipt must include delivery fee';
  assert jsonb_array_length(receipt->'items') = 1, 'Receipt must contain ordered items';
  update public.customers set full_name='Changed Customer' where customers.phone = fixture_phone;
  assert public.get_order_receipt(result->>'order_number')->'customer'->>'full_name' = 'Original Customer', 'Customer snapshot must not change';
  perform set_config('request.jwt.claims', jsonb_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  assert public.get_order_receipt(result->>'order_number') is null, 'Other accounts cannot read receipt';
  perform set_config('request.jwt.claims', '{}', true);
  assert public.get_order_receipt(result->>'order_number') is null, 'Anonymous users cannot read receipt';
end;
$$;
rollback;
