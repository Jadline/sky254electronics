-- Payment choices at checkout, manual payment records, and a stored Pesapal IPN id.
-- Safe to run more than once. Run it BEFORE deploying the new code.
--
-- orders.payment_method now means what the customer chose at checkout:
--   mpesa  = pay by M-Pesa (till/paybill) after we confirm the order  (was: "online before sending")
--   cash   = pay on delivery or on collection, cash or M-Pesa          (unchanged)
--   shop   = pay at the shop, pickup only                              (new)
--   online = "Pay now" through Pesapal, only offered when it's switched on (new)

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('mpesa', 'cash', 'shop', 'online'));

-- How an order was actually paid, filled in when the shop marks it paid by hand (or when
-- Pesapal confirms it). payment_reference is the M-Pesa confirmation code, e.g. "SKL4X9Q2AB".
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists paid_via text
  check (paid_via is null or paid_via in ('mpesa', 'cash', 'pesapal', 'other'));
alter table public.orders add column if not exists payment_reference text
  check (payment_reference is null or char_length(payment_reference) between 4 and 30);
-- One M-Pesa code can only ever pay one order.
create unique index if not exists orders_payment_reference_key
  on public.orders (upper(payment_reference)) where payment_reference is not null;

-- The Pesapal IPN registration, kept so the site registers its address once per environment.
create table if not exists public.pesapal_ipn (
  env text not null check (env in ('sandbox', 'live')),
  url text not null,
  ipn_id text not null,
  created_at timestamptz not null default now(),
  primary key (env, url)
);
alter table public.pesapal_ipn enable row level security;
revoke all on public.pesapal_ipn from anon, authenticated;
grant all on public.pesapal_ipn to service_role;
