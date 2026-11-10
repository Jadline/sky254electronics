-- A short description per category, shown at the top of its shop page and used as its
-- description in Google results. Safe to run more than once.

alter table public.categories
  add column if not exists description text check (description is null or char_length(description) <= 300);
