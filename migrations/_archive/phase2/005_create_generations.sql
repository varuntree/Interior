-- Create generations table with owner-scoped RLS
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  prompt text not null,
  external_id text,              -- provider prediction id
  status text not null check (status in ('processing','succeeded','failed')),
  result_url text,               -- final image URL (provider-hosted for now)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.generations enable row level security;

-- Owner-only access policies
drop policy if exists "generations_owner_select" on public.generations;
create policy "generations_owner_select"
  on public.generations for select
  using (auth.uid() = owner_id);

drop policy if exists "generations_owner_insert" on public.generations;
create policy "generations_owner_insert"
  on public.generations for insert
  with check (auth.uid() = owner_id);

drop policy if exists "generations_owner_update" on public.generations;
create policy "generations_owner_update"
  on public.generations for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Updated_at trigger function
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generations_touch on public.generations;
create trigger trg_generations_touch
  before update on public.generations
  for each row execute function public.touch_updated_at();

