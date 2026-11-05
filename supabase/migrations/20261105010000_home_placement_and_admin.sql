-- Lets the Home page choose products from data, and adds the admin dashboard's
-- access rules. Safe to run more than once.

-- ----------------------------------------------------------------------------
-- 1. Where a product appears on the Home page
--    The initial values and dates are set only the first time this runs, so
--    running it again never overwrites later edits.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'is_featured'
  ) then
    alter table public.products
      add column short_name text,                                 -- shorter title for hero and banners
      add column is_featured boolean not null default false,      -- Top picks and Featured products
      add column show_in_hero boolean not null default false,     -- Home page slider
      add column show_in_banner boolean not null default false;   -- Home page promo banners

    -- All products were loaded at once, so give New arrivals a real order.
    update public.products set created_at = '2026-11-01 08:00:00+00';
    update public.products p
    set created_at = '2026-11-04 08:00:00+00'::timestamptz - (v.position * interval '1 minute')
    from (values
      ('samsung-galaxy-s26-ultra-8gb-256gb', 1), ('samsung-galaxy-a57-5g-8gb-256gb', 2),
      ('samsung-galaxy-a17-4gb-128gb', 3), ('tcl-55-inch-v6d-4k-google-tv', 4),
      ('hisense-203l-double-door-fridge', 5), ('imou-cue-2-3mp-wi-fi-camera', 6),
      ('dahua-cube-a1-3mp-wi-fi-camera', 7), ('tenda-tx2-pro-wi-fi-6-router', 8),
      ('sonar-b7c-3-tap-water-dispenser', 9), ('18-inch-led-ring-light-kit', 10)
    ) as v (slug, position)
    where p.slug = v.slug;

    update public.products set is_featured = true where slug in (
      'samsung-galaxy-a56-5g-8gb-256gb', 'samsung-galaxy-a26-5g-8gb-256gb',
      'hisense-55-inch-a6q-4k-uhd-vidaa-smart-tv', 'tcl-43-inch-s5k-qled-google-tv',
      'lg-234l-top-freezer-fridge', 'hisense-154l-double-door-fridge',
      'dahua-4-channel-wizsense-dvr', 'hp-65w-usb-c-laptop-charger',
      'h-and-f-hf-f226-wireless-speaker', 'geemy-gm-6008-hair-clipper',
      'samsung-galaxy-a07-4gb-128gb', 'tcl-50-inch-v6d-4k-google-tv',
      'dahua-2mp-dual-light-bullet-camera'
    );

    update public.products set show_in_hero = true where slug in (
      'samsung-galaxy-s26-ultra-8gb-256gb', 'hisense-55-inch-a6q-4k-uhd-vidaa-smart-tv', 'lg-234l-top-freezer-fridge'
    );

    update public.products set show_in_banner = true where slug in (
      'samsung-galaxy-a57-5g-8gb-256gb', 'samsung-galaxy-s25-ultra-256gb',
      'tcl-50-inch-v6d-4k-google-tv', 'imou-cue-2-3mp-wi-fi-camera'
    );

    update public.products p set short_name = v.short_name
    from (values
      ('samsung-galaxy-s26-ultra-8gb-256gb', 'Galaxy S26 Ultra'),
      ('hisense-55-inch-a6q-4k-uhd-vidaa-smart-tv', 'Hisense 55" 4K VIDAA'),
      ('lg-234l-top-freezer-fridge', 'LG 234L Top Freezer'),
      ('samsung-galaxy-a57-5g-8gb-256gb', 'Galaxy A57 5G'),
      ('samsung-galaxy-s25-ultra-256gb', 'Galaxy S25 Ultra'),
      ('tcl-50-inch-v6d-4k-google-tv', 'TCL 50" 4K Google TV'),
      ('imou-cue-2-3mp-wi-fi-camera', 'Imou Cue 2 Camera')
    ) as v (slug, short_name)
    where p.slug = v.slug;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Who counts as an admin. Being signed in is not enough: the user must be
--    listed here. Nobody can read or change this table from the browser.
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
grant all on public.admins to service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. Admins can manage the catalogue, including hidden products. Everyone else
--    keeps read-only access to the live catalogue.
-- ----------------------------------------------------------------------------
grant insert, update, delete on public.categories, public.products, public.product_images to authenticated;

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "product_images_admin_all" on public.product_images;
create policy "product_images_admin_all" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. Only admins can add, replace or delete product photos.
-- ----------------------------------------------------------------------------
drop policy if exists "products_bucket_admin_insert" on storage.objects;
create policy "products_bucket_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and public.is_admin());

drop policy if exists "products_bucket_admin_update" on storage.objects;
create policy "products_bucket_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'products' and public.is_admin());

drop policy if exists "products_bucket_admin_delete" on storage.objects;
create policy "products_bucket_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'products' and public.is_admin());
