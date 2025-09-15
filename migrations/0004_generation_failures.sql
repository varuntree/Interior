-- generation_failures table for durable error breadcrumbs
create table if not exists public.generation_failures (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.generation_jobs(id) on delete cascade,
  stage text not null, -- 'submit' | 'webhook' | 'storage'
  code text not null,  -- our normalized code
  provider_code text,  -- e.g., 'PA', 'E6716'
  message text,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.generation_failures enable row level security;

-- owner can select failures for their own jobs
drop policy if exists "gen_failures_owner_select" on public.generation_failures;
create policy "gen_failures_owner_select"
  on public.generation_failures for select
  using (
    exists(
      select 1 from public.generation_jobs j
      where j.id = job_id and j.owner_id = auth.uid()
    )
  );

-- owner can insert for their own jobs (inserts occur in server routes under user context)
drop policy if exists "gen_failures_owner_insert" on public.generation_failures;
create policy "gen_failures_owner_insert"
  on public.generation_failures for insert
  with check (
    exists(
      select 1 from public.generation_jobs j
      where j.id = job_id and j.owner_id = auth.uid()
    )
  );

create index if not exists idx_gen_failures_job_created on public.generation_failures (job_id, created_at desc);
create index if not exists idx_gen_failures_code_created on public.generation_failures (code, created_at desc);

