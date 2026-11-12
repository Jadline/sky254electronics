-- Visitors' carts and wishlists, kept here instead of in the browser. Safe to run more than once.
--
-- There are no customer accounts: a visitor's browser holds only a random cart id in an
-- httpOnly cookie. Rows are read and written by the server, which checks every product.
-- Prices are never stored here; they are read from the catalogue each time.

create table if not exists public.shop_carts (
  id uuid primary key default gen_random_uuid(),   -- the cookie value; random, so it can't be guessed
  cart jsonb not null default '[]'::jsonb           -- [{ "slug": "...", "name": "...", "qty": 1 }]
    check (jsonb_typeof(cart) = 'array' and jsonb_array_length(cart) <= 50),
  wishlist jsonb not null default '[]'::jsonb       -- ["slug", ...]
    check (jsonb_typeof(wishlist) = 'array' and jsonb_array_length(wishlist) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- For clearing out carts nobody has touched in a long time.
create index if not exists shop_carts_updated_at_idx on public.shop_carts (updated_at);

drop trigger if exists shop_carts_set_updated_at on public.shop_carts;
create trigger shop_carts_set_updated_at
  before update on public.shop_carts
  for each row execute function public.set_updated_at();

-- No access for visitors. Admins can read carts (for example, to see what's left unbought).
alter table public.shop_carts enable row level security;
revoke all on public.shop_carts from anon, authenticated;
grant select on public.shop_carts to authenticated;
grant all on public.shop_carts to service_role;

drop policy if exists "shop_carts_admin_read" on public.shop_carts;
create policy "shop_carts_admin_read" on public.shop_carts
  for select to authenticated using (public.is_admin());
