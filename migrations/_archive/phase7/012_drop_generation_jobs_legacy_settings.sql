-- Drop legacy settings columns from generation_jobs
alter table if exists public.generation_jobs
  drop column if exists aspect_ratio,
  drop column if exists quality,
  drop column if exists variants;

