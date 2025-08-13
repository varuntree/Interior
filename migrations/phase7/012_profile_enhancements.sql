-- Add profile settings fields
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists preferences jsonb default '{}'::jsonb;

-- Update existing RLS policies for new fields
create policy "profiles_self_select_enhanced"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_self_update_enhanced"  
on public.profiles for update
using (auth.uid() = id);