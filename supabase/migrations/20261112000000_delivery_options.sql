-- Delivery options and pickup points, managed under Delivery in the dashboard.
-- Customers choose one at checkout. Safe to run more than once.

-- ----------------------------------------------------------------------------
-- 1. Delivery options: a name, the areas it covers, and its cost.
--    own_rider: the shop's own rider delivers, so the customer can pay on delivery.
--    Otherwise it's a courier or parcel service, and the customer pays by M-Pesa first.
-- ----------------------------------------------------------------------------
create table if not exists public.delivery_options (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  areas text check (areas is null or char_length(areas) <= 500),
  town text check (town is null or char_length(town) <= 80),
  cost_kes integer check (cost_kes is null or cost_kes >= 0),   -- null = confirmed by phone
  own_rider boolean not null default true,
  is_active boolean not null default true,                      -- shown at checkout
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. Pickup points: where customers can collect an order. Always free.
-- ----------------------------------------------------------------------------
create table if not exists public.pickup_points (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  address text check (address is null or char_length(address) <= 300),
  hours text check (hours is null or char_length(hours) <= 120),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists delivery_options_set_updated_at on public.delivery_options;
create trigger delivery_options_set_updated_at
  before update on public.delivery_options
  for each row execute function public.set_updated_at();

drop trigger if exists pickup_points_set_updated_at on public.pickup_points;
create trigger pickup_points_set_updated_at
  before update on public.pickup_points
  for each row execute function public.set_updated_at();

-- Visitors read the ones switched on; admins manage all of them.
alter table public.delivery_options enable row level security;
alter table public.pickup_points enable row level security;
revoke all on public.delivery_options, public.pickup_points from anon, authenticated;
grant select on public.delivery_options, public.pickup_points to anon;
grant select, insert, update, delete on public.delivery_options, public.pickup_points to authenticated;
grant all on public.delivery_options, public.pickup_points to service_role;

drop policy if exists "delivery_options_public_read" on public.delivery_options;
create policy "delivery_options_public_read" on public.delivery_options
  for select to anon using (is_active);
drop policy if exists "delivery_options_admin_all" on public.delivery_options;
create policy "delivery_options_admin_all" on public.delivery_options
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pickup_points_public_read" on public.pickup_points;
create policy "pickup_points_public_read" on public.pickup_points
  for select to anon using (is_active);
drop policy if exists "pickup_points_admin_all" on public.pickup_points;
create policy "pickup_points_admin_all" on public.pickup_points
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. Orders remember the option or pickup point chosen, and its name at the time.
--    delivery_method stays as the kind: 'nairobi' = own rider, 'countrywide' = courier.
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists delivery_option_id uuid references public.delivery_options (id) on delete set null,
  add column if not exists pickup_point_id uuid references public.pickup_points (id) on delete set null,
  add column if not exists delivery_option_name text;
create index if not exists orders_delivery_option_idx on public.orders (delivery_option_id);
create index if not exists orders_pickup_point_idx on public.orders (pickup_point_id);

-- ----------------------------------------------------------------------------
-- 4. Start with what Shop settings had: the two delivery fees and the shop itself.
-- ----------------------------------------------------------------------------
insert into public.delivery_options (name, town, cost_kes, own_rider, sort_order)
select v.name, v.town, v.cost, v.own_rider, v.sort_order
from public.shop_settings s,
  lateral (values
    ('Delivery within Nairobi', 'Nairobi', s.nairobi_fee_kes, true, 1),
    ('Countrywide courier', null, s.countrywide_fee_kes, false, 2)
  ) as v(name, town, cost, own_rider, sort_order)
where s.id = 1 and not exists (select 1 from public.delivery_options);

insert into public.pickup_points (name, address, hours, sort_order)
select 'Our shop', s.address, s.hours, 1
from public.shop_settings s
where s.id = 1 and not exists (select 1 from public.pickup_points);
