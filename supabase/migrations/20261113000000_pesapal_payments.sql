-- Online payments through Pesapal (M-Pesa, Airtel Money and cards). Safe to run more than once.
--
-- Each time a customer presses "Pay" on their order page, one row is added here and the
-- customer is sent to Pesapal. Pesapal then tells the site the result, and the site asks
-- Pesapal for the payment's status before it trusts it. Only the server writes these rows.
--
-- orders.payment_method keeps its two values: 'mpesa' now means "pay online before we send
-- it" (couriers), and 'cash' means the customer may pay cash or online.

create table if not exists public.pesapal_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  merchant_reference text not null unique,         -- sent to Pesapal: order number plus random text
  order_tracking_id text unique,                   -- Pesapal's id for the payment
  redirect_url text,                               -- Pesapal's payment page, reused if the customer comes back soon
  amount_kes integer not null check (amount_kes > 0), -- what we asked for
  paid_kes integer check (paid_kes is null or paid_kes >= 0), -- what Pesapal says was paid
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'reversed')),
  status_description text,                         -- Pesapal's wording, e.g. "Failed" or a reason
  pay_method text,                                 -- e.g. MPESA, Visa, Airtel
  pay_account text,                                -- masked phone number or card
  confirmation_code text,                          -- the M-Pesa receipt or card reference
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pesapal_payments_order_id_idx on public.pesapal_payments (order_id, created_at desc);

drop trigger if exists pesapal_payments_set_updated_at on public.pesapal_payments;
create trigger pesapal_payments_set_updated_at
  before update on public.pesapal_payments
  for each row execute function public.set_updated_at();

-- Admins can read payments. Nobody but the server can change them.
alter table public.pesapal_payments enable row level security;
revoke all on public.pesapal_payments from anon, authenticated;
grant select on public.pesapal_payments to authenticated;
grant all on public.pesapal_payments to service_role;

drop policy if exists "pesapal_payments_admin_read" on public.pesapal_payments;
create policy "pesapal_payments_admin_read" on public.pesapal_payments
  for select to authenticated using (public.is_admin());

-- The M-Pesa (Daraja) table was never used. Remove it, but only while it's empty.
do $$
begin
  if to_regclass('public.mpesa_payments') is not null
     and not exists (select 1 from public.mpesa_payments) then
    drop table public.mpesa_payments;
  end if;
end $$;
