-- Create buckets if not exist
insert into storage.buckets (id, name, public) values ('public', 'public', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('private', 'private', false)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (already enabled by default)
-- Policies for 'public' bucket
drop policy if exists "Public read" on storage.objects;
create policy "Public read"
on storage.objects for select
using (bucket_id = 'public');

drop policy if exists "Authenticated write public" on storage.objects;
create policy "Authenticated write public"
on storage.objects for insert
with check (bucket_id = 'public' and auth.role() = 'authenticated');

drop policy if exists "Update own public objects" on storage.objects;
create policy "Update own public objects"
on storage.objects for update
using (bucket_id = 'public' and owner = auth.uid())
with check (bucket_id = 'public' and owner = auth.uid());

-- Policies for 'private' bucket (owner-only)
drop policy if exists "Private read own" on storage.objects;
create policy "Private read own"
on storage.objects for select
using (bucket_id = 'private' and owner = auth.uid());

drop policy if exists "Private write own" on storage.objects;
create policy "Private write own"
on storage.objects for insert
with check (bucket_id = 'private' and owner = auth.uid());

drop policy if exists "Private update own" on storage.objects;
create policy "Private update own"
on storage.objects for update
using (bucket_id = 'private' and owner = auth.uid())
with check (bucket_id = 'private' and owner = auth.uid());