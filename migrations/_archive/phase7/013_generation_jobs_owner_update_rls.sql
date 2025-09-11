-- Relax RLS update policy on generation_jobs to allow owners to update
-- Needed so the app (running as the owner) can attach prediction_id
-- and refresh non-terminal statuses during polling.
-- Idempotent and safe to re-run.

alter table if exists public.generation_jobs enable row level security;

-- Replace the strict owner update policy that previously blocked all updates
drop policy if exists "jobs_owner_update" on public.generation_jobs;
create policy "jobs_owner_update"
  on public.generation_jobs for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Note: Terminal status transitions are still enforced at the application layer.
-- Webhooks use the service-role admin client. This policy only allows
-- owners to update their own rows, which our routes require for:
--  - attaching prediction_id after submission
--  - refreshing status on stale polls (non-terminal updates)

