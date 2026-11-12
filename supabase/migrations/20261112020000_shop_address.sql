-- The shop's address.
--
-- Fills in the address under Shop settings once, only if it's still empty. After this it's
-- edited in the dashboard (Shop settings > Contact details), and the About and Contact
-- pages, footer and map all follow it.
--
-- Safe to run more than once.

update public.shop_settings
set address = 'Shop G23, Beijing Shopping Center, 2nd Avenue, 5th Street, Eastleigh'
where id = 1 and (address is null or btrim(address) = '');
