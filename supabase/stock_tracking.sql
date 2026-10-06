begin;
alter table public.products
  add column if not exists stock_quantity numeric(10,3),
  add column if not exists stock_reference numeric(10,3),
  add constraint products_stock_valid check (
    (stock_quantity is null and stock_reference is null)
    or (stock_quantity is not null and stock_reference is not null and stock_quantity >= 0 and stock_reference > 0)
  );
alter table public.order_items add column if not exists stock_reserved numeric(10,3) not null default 0;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.reserve_order_stock()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare available numeric; product_name text; product_unit text;
begin
  select stock_quantity, name_en, unit into available, product_name, product_unit
  from public.products where id = new.product_id for update;
  if new.quantity is null or new.quantity <= 0 or new.quantity > 1000
    or mod(new.quantity, case when product_unit = 'kg' then 0.25 else 1 end) <> 0 then
    raise exception 'Invalid quantity for %', product_name;
  end if;
  new.stock_reserved := 0;
  if available is not null then
    if available < new.quantity then
      raise exception 'Only % % of % remains. Please update your cart.', available, product_unit, product_name;
    end if;
    update public.products set stock_quantity = stock_quantity - new.quantity,
      in_stock = in_stock and stock_quantity - new.quantity > 0, updated_at = now()
    where id = new.product_id;
    new.stock_reserved := new.quantity;
  end if;
  return new;
end;
$$;
revoke all on function private.reserve_order_stock() from public, anon, authenticated;
create trigger reserve_order_stock before insert on public.order_items
for each row execute function private.reserve_order_stock();

create or replace function private.handle_cancelled_stock()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare item record; available numeric;
begin
  if (old.status = 'cancelled') = (new.status = 'cancelled') then return new; end if;
  for item in select product_id, sum(stock_reserved) quantity from public.order_items
    where order_id = new.id and stock_reserved > 0 group by product_id order by product_id loop
    select stock_quantity into available from public.products where id = item.product_id for update;
    if available is null then continue; end if;
    if new.status = 'cancelled' then
      update public.products set stock_quantity = stock_quantity + item.quantity,
        in_stock = in_stock or stock_quantity = 0, updated_at = now() where id = item.product_id;
    else
      if available < item.quantity then raise exception 'Insufficient stock to reopen this order'; end if;
      update public.products set stock_quantity = stock_quantity - item.quantity,
        in_stock = in_stock and stock_quantity - item.quantity > 0, updated_at = now() where id = item.product_id;
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function private.handle_cancelled_stock() from public, anon, authenticated;
create trigger handle_cancelled_stock before update of status on public.orders
for each row execute function private.handle_cancelled_stock();

create or replace function public.set_product_stock(product_id bigint, quantity numeric, reference numeric, expected_quantity numeric)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if quantity is null or reference is null or quantity < 0 or reference <= 0
    or quantity::text in ('NaN','Infinity','-Infinity') or reference::text in ('NaN','Infinity','-Infinity') then
    raise exception 'Enter a non-negative quantity and a positive stock reference';
  end if;
  update public.products set stock_quantity = quantity, stock_reference = reference,
    in_stock = quantity > 0, updated_at = now()
  where id = product_id and stock_quantity is not distinct from expected_quantity;
  if not found then raise exception 'Stock changed since you opened this form. Refresh and try again.'; end if;
end;
$$;
revoke all on function public.set_product_stock(bigint,numeric,numeric,numeric) from public, anon;
grant execute on function public.set_product_stock(bigint,numeric,numeric,numeric) to authenticated;
create or replace function private.prevent_stock_unit_change()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if old.stock_quantity is not null and new.unit is distinct from old.unit then
    raise exception 'This product has tracked inventory. Keep its unit or create a separate product.';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_stock_unit_change() from public, anon, authenticated;
create trigger prevent_stock_unit_change before update of unit on public.products
for each row execute function private.prevent_stock_unit_change();
commit;
