-- Add columns for image inputs and multiple outputs
alter table public.generations
  add column if not exists input_image_url text,
  add column if not exists reference_image_url text,
  add column if not exists inputs jsonb,
  add column if not exists result_urls text[];

-- Performance index for owner-scoped queries
create index if not exists idx_generations_owner_created_at
  on public.generations (owner_id, created_at desc);

-- Comments for documentation
comment on column public.generations.input_image_url is 'Path to uploaded base image in private storage';
comment on column public.generations.reference_image_url is 'Path to uploaded reference image in private storage';
comment on column public.generations.inputs is 'JSON object containing all input parameters (room type, style, aspect ratio, etc.)';
comment on column public.generations.result_urls is 'Array of result image URLs for multiple variants';

