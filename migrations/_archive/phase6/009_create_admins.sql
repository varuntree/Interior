create table if not exists public.admins (
  owner_id uuid primary key,
  email text unique,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

-- Only owner can read/insert/delete their admin row (self‑service "ensure me admin")
create policy "admins_owner_select" on public.admins for select
  using (auth.uid() = owner_id);
create policy "admins_owner_insert" on public.admins for insert
  with check (auth.uid() = owner_id);
create policy "admins_owner_delete" on public.admins for delete
  using (auth.uid() = owner_id);

-- Helper view to check admin capability for the current user
create or replace view public.me_is_admin as
  select true as is_admin
  from public.admins a
  where a.owner_id = auth.uid();

