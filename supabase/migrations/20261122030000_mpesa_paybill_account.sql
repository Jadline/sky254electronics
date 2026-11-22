-- The account number customers enter with your paybill. Safe to run more than once. Run BEFORE deploying.
alter table public.shop_settings add column if not exists mpesa_paybill_account text
  check (mpesa_paybill_account is null or char_length(mpesa_paybill_account) between 1 and 40);
