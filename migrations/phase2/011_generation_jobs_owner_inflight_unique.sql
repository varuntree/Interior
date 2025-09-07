-- Enforce at most one in-flight job per user (starting|processing)
-- Idempotent and safe to re-run

create unique index if not exists uniq_jobs_owner_inflight
on public.generation_jobs (owner_id)
where status in ('starting','processing');

