-- Removes coupons: the codes table and the coupon columns on orders.
-- Deploy the code that no longer uses coupons BEFORE running this, otherwise the old
-- checkout will fail. Safe to run more than once.
--
-- Orders keep their total_kes, so past totals stay correct. The record of which code was
-- used, and the shillings it took off, is deleted by the two column drops below.

drop index if exists public.orders_coupon_code_idx;
alter table public.orders drop column if exists coupon_code;
alter table public.orders drop column if exists discount_kes;

drop policy if exists "coupons_admin_all" on public.coupons;
drop table if exists public.coupons;
