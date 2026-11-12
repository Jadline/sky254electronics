-- Legal pages and FAQs.
--
-- The dashboard no longer edits About and Contact: their wording is part of the site, and
-- the details on them (address, hours, email) come from Shop settings. The FAQs move into
-- Shop settings as a list of questions and answers. What's left in site_pages is edited
-- under Legal pages: Privacy, Terms, Returns & warranty and Delivery.
--
-- Safe to run more than once.

-- ----------------------------------------------------------------------------
-- FAQs: a list of { "question": "...", "answer": "..." } in the order they're shown.
-- ----------------------------------------------------------------------------
alter table public.shop_settings add column if not exists faqs jsonb not null default '[]'::jsonb;

alter table public.shop_settings drop constraint if exists shop_settings_faqs_list;
alter table public.shop_settings add constraint shop_settings_faqs_list
  check (jsonb_typeof(faqs) = 'array' and jsonb_array_length(faqs) <= 50);

-- Copy the questions from the old FAQs page once: each "## Question" line and the text
-- under it becomes one item. Skipped if the FAQs page is gone or FAQs are already set.
update public.shop_settings s
set faqs = coalesce((
  select jsonb_agg(
           jsonb_build_object(
             'question', btrim(split_part(chunk, E'\n', 1), E' \t\r\n'),
             'answer', btrim(substr(chunk, length(split_part(chunk, E'\n', 1)) + 2), E' \t\r\n')
           )
           order by n
         )
  from public.site_pages p,
       regexp_split_to_table(E'\n' || replace(p.body, E'\r', ''), E'\n##[ \t]+') with ordinality as t(chunk, n)
  where p.slug = 'faqs'
    and n > 1  -- the text before the first question
    and btrim(split_part(chunk, E'\n', 1)) <> ''
), '[]'::jsonb)
where s.id = 1
  and s.faqs = '[]'::jsonb
  and exists (select 1 from public.site_pages where slug = 'faqs');

-- ----------------------------------------------------------------------------
-- Only the legal pages stay editable.
-- ----------------------------------------------------------------------------
delete from public.site_pages where slug in ('about', 'contact', 'faqs');

alter table public.site_pages drop constraint if exists site_pages_slug_check;
alter table public.site_pages add constraint site_pages_slug_check
  check (slug in ('delivery', 'returns', 'privacy', 'terms'));
