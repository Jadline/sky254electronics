-- Cookie policy.
--
-- Adds the Cookie policy to the pages edited under Legal pages.
--
-- The dashboard can only update a page's row, never create one, so the row is added here
-- with an empty body. Until it's saved, the editor and the website both show the starter
-- text from src/lib/legal-starters.ts.
--
-- Safe to run more than once: an edited policy is never overwritten.

alter table public.site_pages drop constraint if exists site_pages_slug_check;
alter table public.site_pages add constraint site_pages_slug_check
  check (slug in ('delivery', 'returns', 'privacy', 'terms', 'cookies'));

insert into public.site_pages (slug, title, description, body)
values (
  'cookies',
  'Cookie policy',
  'What cookies and similar storage the Sky254 Electronics website uses, and how to manage them.',
  ''
)
on conflict (slug) do nothing;
