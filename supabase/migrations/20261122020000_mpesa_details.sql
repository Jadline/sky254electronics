-- Where customers pay by M-Pesa (edited under Shop settings), and the code a customer sends after paying.
-- Safe to run more than once. Run it BEFORE deploying the code that reads these columns.
alter table public.shop_settings add column if not exists mpesa_till text
  check (mpesa_till is null or mpesa_till ~ '^[0-9]{5,8}$');
alter table public.shop_settings add column if not exists mpesa_paybill text
  check (mpesa_paybill is null or mpesa_paybill ~ '^[0-9]{5,8}$');
alter table public.shop_settings add column if not exists mpesa_phone text
  check (mpesa_phone is null or char_length(mpesa_phone) between 7 and 30);

-- The M-Pesa code the customer typed on the order page. The shop checks it, then marks the order paid.
alter table public.orders add column if not exists payment_claim_code text
  check (payment_claim_code is null or payment_claim_code ~ '^[A-Z0-9]{8,12}$');
alter table public.orders add column if not exists payment_claimed_at timestamptz;
