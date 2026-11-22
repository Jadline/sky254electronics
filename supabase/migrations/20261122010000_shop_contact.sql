-- The shop's phone and WhatsApp number, editable under Shop settings.
-- Safe to run more than once. Run it BEFORE deploying the code that reads these columns.
-- Left empty, the site keeps using the number that was built into it, so nothing changes until you save.
alter table public.shop_settings add column if not exists phone text
  check (phone is null or char_length(phone) between 7 and 30);
-- Digits only with the country code, e.g. 254116236902. Empty means "use the phone number".
alter table public.shop_settings add column if not exists whatsapp text
  check (whatsapp is null or whatsapp ~ '^[0-9]{9,15}$');
