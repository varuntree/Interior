-- usage_ledger: track generation debits/credits
create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  kind text not null check (kind in ('generation_debit','credit_adjustment')),
  amount int not null,                -- positive integers
  meta jsonb,                         -- { jobId, reason, ... }
  created_at timestamptz not null default now()
);
alter table public.usage_ledger enable row level security;

-- RLS: owner can read their own
drop policy if exists "usage_owner_select" on public.usage_ledger;
create policy "usage_owner_select"
  on public.usage_ledger for select
  using (auth.uid() = owner_id);

-- Writes: from API/service only; users do not write directly
drop policy if exists "usage_owner_insert" on public.usage_ledger;
create policy "usage_owner_insert"
  on public.usage_ledger for insert
  with check (auth.uid() = owner_id);

create index if not exists idx_usage_owner_created on public.usage_ledger (owner_id, created_at desc);

