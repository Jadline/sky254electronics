-- Product reviews. Customers write them on a product page; they appear once an admin
-- approves them under Reviews. Safe to run more than once.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  rating smallint not null check (rating between 1 and 5),
  title text check (title is null or char_length(title) <= 100),
  body text not null check (char_length(body) between 1 and 2000),
  -- Private: used to mark a "verified buyer" and to stop repeat reviews. Never shown.
  phone text not null check (phone ~ '^254[17][0-9]{8}$'),
  verified boolean not null default false,          -- the phone has an order for this product
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  unique (product_id, phone)
);
create index if not exists product_reviews_product_idx on public.product_reviews (product_id) where status = 'approved';
create index if not exists product_reviews_status_idx on public.product_reviews (status, created_at desc);

alter table public.product_reviews enable row level security;
revoke all on public.product_reviews from anon, authenticated;
-- Visitors can read approved reviews, but never the phone column.
grant select (id, product_id, name, rating, title, body, verified, status, created_at) on public.product_reviews to anon;
grant select, delete on public.product_reviews to authenticated;
grant update (status) on public.product_reviews to authenticated;
grant all on public.product_reviews to service_role;

drop policy if exists "product_reviews_public_read" on public.product_reviews;
create policy "product_reviews_public_read" on public.product_reviews
  for select to anon using (status = 'approved');

drop policy if exists "product_reviews_admin_read" on public.product_reviews;
create policy "product_reviews_admin_read" on public.product_reviews
  for select to authenticated using (public.is_admin());

drop policy if exists "product_reviews_admin_update" on public.product_reviews;
create policy "product_reviews_admin_update" on public.product_reviews
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "product_reviews_admin_delete" on public.product_reviews;
create policy "product_reviews_admin_delete" on public.product_reviews
  for delete to authenticated using (public.is_admin());
