-- Coupon codes customers enter at checkout, managed under Coupons in the dashboard.
-- Safe to run more than once.

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{3,30}$'),   -- stored in capitals
  kind text not null check (kind in ('percent', 'amount')),
  value integer not null check (value > 0),
  min_subtotal_kes integer check (min_subtotal_kes is null or min_subtotal_kes > 0),
  max_discount_kes integer check (max_discount_kes is null or max_discount_kes > 0), -- caps a percentage
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),     -- across all customers
  once_per_customer boolean not null default false,               -- by phone number
  is_active boolean not null default true,
  note text check (note is null or char_length(note) <= 200),     -- for the shop, e.g. "Instagram giveaway"
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 90),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

alter table public.coupons enable row level security;
revoke all on public.coupons from anon, authenticated;
-- Customers never read this table: the server checks codes with the server-only key,
-- so nobody can list the shop's codes.
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;

drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- The code used on an order, and how much it took off. Uses are counted from orders
-- (cancelled ones don't count), so cancelling an order gives the use back.
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_kes integer not null default 0 check (discount_kes >= 0);
create index if not exists orders_coupon_code_idx on public.orders (coupon_code) where coupon_code is not null;

-- A coupon can bring a pickup order down to nothing to pay, so allow a total of 0.
alter table public.orders drop constraint if exists orders_total_kes_check;
alter table public.orders add constraint orders_total_kes_check check (total_kes >= 0);
