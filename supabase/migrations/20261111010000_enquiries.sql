-- Messages sent from the contact form. Written only by the server (which checks and
-- rate-limits them); admins read them in the dashboard under Enquiries.
-- Safe to run more than once.

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  phone text check (phone is null or phone ~ '^254[17][0-9]{8}$'),
  email text check (email is null or char_length(email) <= 200),
  topic text not null default 'general' check (topic in ('general', 'product', 'order', 'warranty')),
  message text not null check (char_length(message) between 1 and 3000),
  status text not null default 'new' check (status in ('new', 'done')),
  created_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);
create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);

alter table public.enquiries enable row level security;
revoke all on public.enquiries from anon, authenticated;
grant select, delete on public.enquiries to authenticated;
grant update (status) on public.enquiries to authenticated;
grant all on public.enquiries to service_role;

drop policy if exists "enquiries_admin_read" on public.enquiries;
create policy "enquiries_admin_read" on public.enquiries
  for select to authenticated using (public.is_admin());

drop policy if exists "enquiries_admin_update" on public.enquiries;
create policy "enquiries_admin_update" on public.enquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "enquiries_admin_delete" on public.enquiries;
create policy "enquiries_admin_delete" on public.enquiries
  for delete to authenticated using (public.is_admin());
