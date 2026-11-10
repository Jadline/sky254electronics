-- Stock: what the shop has, what confirmed orders have sold, and what remains.
-- Safe to run more than once, including over the earlier Inventory-tab version.
--
-- On the Products page an admin types a product's Stock: how many they have now.
-- From then on:
--   * confirming an order sells its units: Sold goes up, so Remaining = Stock - Sold goes down;
--   * the database refuses to confirm more than remain;
--   * cancelling a confirmed order, or moving it back to pending, gives its units back;
--   * "In stock" turns off when nothing remains, and back on when Stock is raised;
--   * typing a new Stock (a recount or a delivery) starts again from there, with Sold at 0.
-- New, unconfirmed orders take nothing. A product with no Stock typed in isn't counted,
-- and its "In stock" switch works by hand as before.

-- ----------------------------------------------------------------------------
-- 1. Remove the earlier version (stock taken at checkout, history table, Inventory tab).
-- ----------------------------------------------------------------------------
drop trigger if exists order_items_take_stock on public.order_items;
drop trigger if exists orders_status_stock on public.orders;
drop trigger if exists products_log_stock on public.products;
drop trigger if exists products_follow_stock on public.products;
drop function if exists public.take_stock_for_order_item();
drop function if exists public.order_status_stock();
drop function if exists public.log_stock_change();
drop function if exists public.products_follow_stock();
drop function if exists public.adjust_stock(uuid, text, integer, text, text);
drop function if exists public.stock_reason(text, text, uuid);
drop table if exists public.stock_movements;
alter table public.order_items drop column if exists stock_taken;

-- ----------------------------------------------------------------------------
-- 2. Columns.
-- ----------------------------------------------------------------------------
alter table public.products
  add column if not exists stock_qty integer check (stock_qty is null or stock_qty >= 0), -- null = not counted
  add column if not exists stock_sold integer not null default 0,                          -- sold since stock_qty was set
  add column if not exists stock_set_at timestamptz;                                       -- when stock_qty was last typed in

alter table public.products drop constraint if exists products_stock_sold_check;
alter table public.products add constraint products_stock_sold_check
  check (stock_sold >= 0 and (stock_qty is null or stock_sold <= stock_qty));

-- When this line's units were counted as sold; null = not sold (yet).
alter table public.order_items
  add column if not exists stock_counted_at timestamptz;

-- ----------------------------------------------------------------------------
-- 3. Typing a Stock starts the count again; "In stock" follows what remains.
-- ----------------------------------------------------------------------------
create or replace function public.products_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- A new Stock (or the same number typed again, which sends a new stock_set_at) is a fresh start.
  if new.stock_qty is distinct from old.stock_qty or new.stock_set_at is distinct from old.stock_set_at then
    new.stock_sold := 0;
    new.stock_set_at := case when new.stock_qty is null then null else now() end;
  end if;
  if new.stock_qty is not null
     and (new.stock_qty is distinct from old.stock_qty or new.stock_sold is distinct from old.stock_sold
          or new.stock_set_at is distinct from old.stock_set_at) then
    new.in_stock := new.stock_qty - new.stock_sold > 0;
  end if;
  return new;
end;
$$;

drop trigger if exists products_stock on public.products;
create trigger products_stock
  before update of stock_qty, stock_sold, stock_set_at on public.products
  for each row execute function public.products_stock();

-- ----------------------------------------------------------------------------
-- 4. Confirming an order sells its units; cancelling or reopening gives them back.
-- ----------------------------------------------------------------------------
create or replace function public.order_status_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  was_sold boolean := old.status in ('confirmed', 'out_for_delivery', 'completed');
  is_sold boolean := new.status in ('confirmed', 'out_for_delivery', 'completed');
  line record;
  product record;
begin
  if was_sold = is_sold then
    return null;
  end if;

  if is_sold then
    for line in
      select product_id, max(product_name) as product_name, sum(qty)::integer as qty
      from public.order_items
      where order_id = new.id and product_id is not null
      group by product_id
    loop
      select stock_qty, stock_sold into product from public.products where id = line.product_id for update;
      continue when product.stock_qty is null;     -- not counted
      if product.stock_qty - product.stock_sold < line.qty then
        raise exception 'Only % of % left, so this order can''t be confirmed', product.stock_qty - product.stock_sold, line.product_name
          using errcode = 'P0001', hint = 'out_of_stock';
      end if;
      update public.products set stock_sold = stock_sold + line.qty where id = line.product_id;
      update public.order_items set stock_counted_at = now() where order_id = new.id and product_id = line.product_id;
    end loop;
  else
    -- Give back only units sold from the current Stock. A recount since then already reflects them.
    for line in
      select product_id, sum(qty)::integer as qty, min(stock_counted_at) as counted_at
      from public.order_items
      where order_id = new.id and product_id is not null and stock_counted_at is not null
      group by product_id
    loop
      update public.products
        set stock_sold = greatest(stock_sold - line.qty, 0)
        where id = line.product_id and stock_qty is not null and stock_set_at <= line.counted_at;
    end loop;
    update public.order_items set stock_counted_at = null where order_id = new.id;
  end if;
  return null;
end;
$$;

drop trigger if exists orders_status_stock on public.orders;
create trigger orders_status_stock
  after update of status on public.orders
  for each row execute function public.order_status_stock();
