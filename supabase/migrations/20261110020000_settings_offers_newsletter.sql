-- Shop details and delivery fees the owner edits in the dashboard, "was" prices for
-- offers, and newsletter sign-ups. Safe to run more than once.

-- ----------------------------------------------------------------------------
-- 1. Shop settings: a single row. Empty fields are left out of the site.
-- ----------------------------------------------------------------------------
create table if not exists public.shop_settings (
  id smallint primary key default 1 check (id = 1),
  email text,
  address text,                                    -- e.g. "Shop 12, Luthuli Avenue"
  hours text,                                      -- e.g. "Mon–Sat, 8am – 7pm"
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  nairobi_fee_kes integer check (nairobi_fee_kes is null or nairobi_fee_kes >= 0),         -- null = confirm by phone
  countrywide_fee_kes integer check (countrywide_fee_kes is null or countrywide_fee_kes >= 0),
  free_delivery_over_kes integer check (free_delivery_over_kes is null or free_delivery_over_kes > 0),
  updated_at timestamptz not null default now()
);
insert into public.shop_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists shop_settings_set_updated_at on public.shop_settings;
create trigger shop_settings_set_updated_at
  before update on public.shop_settings
  for each row execute function public.set_updated_at();

alter table public.shop_settings enable row level security;
revoke all on public.shop_settings from anon, authenticated;
grant select on public.shop_settings to anon, authenticated;
grant update on public.shop_settings to authenticated;
grant all on public.shop_settings to service_role;

drop policy if exists "shop_settings_public_read" on public.shop_settings;
create policy "shop_settings_public_read" on public.shop_settings
  for select to anon, authenticated using (true);

drop policy if exists "shop_settings_admin_update" on public.shop_settings;
create policy "shop_settings_admin_update" on public.shop_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. Offers: the price before the discount, shown crossed out.
-- ----------------------------------------------------------------------------
alter table public.products
  add column if not exists was_price_kes integer check (was_price_kes is null or was_price_kes > 0);

-- ----------------------------------------------------------------------------
-- 3. Newsletter sign-ups. Written only by the server; admins can read and remove them.
-- ----------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and char_length(email) <= 200),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon, authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;

drop policy if exists "newsletter_admin_read" on public.newsletter_subscribers;
create policy "newsletter_admin_read" on public.newsletter_subscribers
  for select to authenticated using (public.is_admin());

drop policy if exists "newsletter_admin_delete" on public.newsletter_subscribers;
create policy "newsletter_admin_delete" on public.newsletter_subscribers
  for delete to authenticated using (public.is_admin());
