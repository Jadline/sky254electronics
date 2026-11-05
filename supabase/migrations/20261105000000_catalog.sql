-- Sky254 catalogue: categories, products, product photos and the image bucket.
-- Safe to run more than once.

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text,
  category_id uuid not null references public.categories (id) on delete restrict,
  price_kes integer check (price_kes is null or price_kes >= 0), -- null = price not set yet
  warranty text,
  badge text,
  description text,
  in_stock boolean not null default true,
  is_active boolean not null default true, -- false hides the product from the shop
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_id_idx on public.products (category_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  kind text not null check (kind in ('product', 'box')), -- product alone, or in its box
  storage_path text not null unique,
  alt text not null,
  width integer not null,
  height integer not null,
  bytes integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_id_idx on public.product_images (product_id);

-- Keep products.updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Security: anyone can read the live catalogue. There are no write policies, so
-- only the server-side secret key can change data until admin login is added.
-- ----------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

revoke all on public.categories, public.products, public.product_images from anon, authenticated;
grant select on public.categories, public.products, public.product_images to anon, authenticated;
grant all on public.categories, public.products, public.product_images to service_role;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select to anon, authenticated using (is_active);

drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.is_active
    )
  );

-- ----------------------------------------------------------------------------
-- Storage: public bucket for compressed product photos, 8 MB limit per file.
-- No SELECT policy on purpose: a public bucket already serves files by URL, and
-- a broad SELECT would also let anyone list every file.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 8388608, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
