-- Cookie policy.
--
-- Adds the Cookie policy to the pages edited under Legal pages. Until it's saved there,
-- the website shows the starter text from src/lib/legal-starters.ts, so nothing is
-- inserted here.
--
-- Safe to run more than once.

alter table public.site_pages drop constraint if exists site_pages_slug_check;
alter table public.site_pages add constraint site_pages_slug_check
  check (slug in ('delivery', 'returns', 'privacy', 'terms', 'cookies'));
