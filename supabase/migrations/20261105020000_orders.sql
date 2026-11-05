-- Orders and M-Pesa payments. Safe to run more than once.
--
-- Customers have no direct access to these tables. Orders are created and read on
-- the server, which recalculates every price from the catalogue. A customer views
-- their own order through a long random link. Admins can read and update orders.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  access_token text not null unique,               -- the private link for the customer's order page
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'out_for_delivery', 'completed', 'cancelled')),
  payment_method text not null check (payment_method in ('mpesa', 'cash')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_method text not null check (delivery_method in ('nairobi', 'countrywide', 'pickup')),
  delivery_address text,
  notes text,
  subtotal_kes integer not null check (subtotal_kes > 0),
  delivery_fee_kes integer check (delivery_fee_kes is null or delivery_fee_kes >= 0), -- null = to be confirmed
  total_kes integer not null check (total_kes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_customer_phone_idx on public.orders (customer_phone);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null, -- kept if the product is later deleted
  product_name text not null,                      -- as it was when ordered
  price_kes integer not null check (price_kes >= 0),
  qty integer not null check (qty between 1 and 99),
  line_total_kes integer not null check (line_total_kes >= 0)
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

create table if not exists public.mpesa_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  phone text not null,
  amount_kes integer not null check (amount_kes > 0),
  merchant_request_id text,
  checkout_request_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  result_code integer,
  result_desc text,
  receipt_number text unique,                      -- unique, so one M-Pesa receipt can't pay twice
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mpesa_payments_order_id_idx on public.mpesa_payments (order_id);
create index if not exists mpesa_payments_phone_created_idx on public.mpesa_payments (phone, created_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists mpesa_payments_set_updated_at on public.mpesa_payments;
create trigger mpesa_payments_set_updated_at
  before update on public.mpesa_payments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Security: no access for visitors. Admins can read everything and update an
-- order's progress. Payments can only be changed by the server, not the dashboard.
-- ----------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.mpesa_payments enable row level security;

revoke all on public.orders, public.order_items, public.mpesa_payments from anon, authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.mpesa_payments to authenticated;
grant all on public.orders, public.order_items, public.mpesa_payments to service_role;

drop policy if exists "orders_admin_read" on public.orders;
create policy "orders_admin_read" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items_admin_read" on public.order_items;
create policy "order_items_admin_read" on public.order_items
  for select to authenticated using (public.is_admin());

drop policy if exists "mpesa_payments_admin_read" on public.mpesa_payments;
create policy "mpesa_payments_admin_read" on public.mpesa_payments
  for select to authenticated using (public.is_admin());
