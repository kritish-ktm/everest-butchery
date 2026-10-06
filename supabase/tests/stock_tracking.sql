begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"admin"}}', true);
do $test$
declare
  cat bigint; sku bigint; first_order bigint; second_order bigint; final_order bigint;
  result jsonb; remaining numeric; count_before integer; blocked boolean := false;
begin
  insert into public.categories(name_en) values ('Inventory regression fixture') returning id into cat;
  insert into public.products(category_id,name_en,unit,price_per_unit)
  values(cat,'Inventory regression fixture','kg',10) returning id into sku;
  perform public.set_product_stock(sku,100,100,null);
  begin
    update public.products set unit='pack' where id=sku;
  exception when others then
    if sqlerrm not like 'This product has tracked inventory%' then raise; end if;
    blocked := true;
  end;
  assert blocked, 'Tracked product units must not change';
  blocked := false;
  result := public.create_order(jsonb_build_object('customer',jsonb_build_object('full_name','Inventory regression fixture','phone','inventory-test-' || sku),
    'items',jsonb_build_array(jsonb_build_object('product_id',sku,'quantity',60))));
  first_order := (result->>'id')::bigint;
  select stock_quantity into remaining from public.products where id=sku;
  assert remaining=40, 'First order must reduce 100 kg to 40 kg';
  result := public.create_order(jsonb_build_object('customer',jsonb_build_object('full_name','Inventory regression fixture','phone','inventory-test-' || sku),
    'items',jsonb_build_array(jsonb_build_object('product_id',sku,'quantity',21))));
  second_order := (result->>'id')::bigint;
  select stock_quantity into remaining from public.products where id=sku;
  assert remaining=19, 'Second order must reduce remaining stock to 19 kg';
  update public.orders set status='cancelled' where id=second_order;
  select stock_quantity into remaining from public.products where id=sku;
  assert remaining=40, 'Cancellation must return reserved stock';
  update public.orders set status='cancelled' where id=second_order;
  select stock_quantity into remaining from public.products where id=sku;
  assert remaining=40, 'Repeated cancellation must not return stock twice';
  update public.orders set status='confirmed' where id=second_order;
  select stock_quantity into remaining from public.products where id=sku;
  assert remaining=19, 'Reopening must reserve stock again';
  select count(*) into count_before from public.orders;
  begin
    perform public.create_order(jsonb_build_object('customer',jsonb_build_object('full_name','Inventory regression fixture','phone','inventory-test-' || sku),
      'items',jsonb_build_array(jsonb_build_object('product_id',sku,'quantity',25))));
  exception when others then
    if sqlerrm not like 'Only %' then raise; end if;
    blocked := true;
  end;
  assert blocked, 'Overselling must be rejected';
  assert (select count(*) from public.orders)=count_before, 'Rejected order must not remain in database';
  assert (select stock_quantity from public.products where id=sku)=19, 'Failed order must not change stock';
  blocked := false;
  begin perform public.set_product_stock(sku,200,200,100);
  exception when others then
    if sqlerrm not like 'Stock changed%' then raise; end if;
    blocked := true;
  end;
  assert blocked, 'Stale inventory edits must be rejected';
  update public.orders set status='cancelled' where id=first_order;
  result := public.create_order(jsonb_build_object('customer',jsonb_build_object('full_name','Inventory regression fixture','phone','inventory-test-' || sku),
    'items',jsonb_build_array(jsonb_build_object('product_id',sku,'quantity',79))));
  final_order := (result->>'id')::bigint;
  assert (select stock_quantity from public.products where id=sku)=0, 'Exact remaining stock may be purchased';
  assert not (select in_stock from public.products where id=sku), 'Sold-out product must become unavailable';
  update public.orders set status='cancelled' where id=final_order;
  assert (select stock_quantity from public.products where id=sku)=79, 'Sold-out cancellation must restore stock';
  assert (select in_stock from public.products where id=sku), 'Restored stock must become available';
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","app_metadata":{}}',true);
  blocked := false;
  begin perform public.set_product_stock(sku,200,200,79);
  exception when others then
    if sqlerrm <> 'Admin access required' then raise; end if;
    blocked := true;
  end;
  assert blocked, 'Non-admin inventory updates must be rejected';
end;
$test$;
rollback;
select 'Passed: deductions, sold-out handling, cancellation, reopening, oversell rollback, stale edits and admin authorization. All fixtures rolled back.' as test_result;
