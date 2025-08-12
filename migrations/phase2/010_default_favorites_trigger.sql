-- Auto-create "My Favorites" collection on profile creation
create or replace function public.create_default_favorites()
returns trigger as $$
begin
  insert into public.collections (owner_id, name, is_default_favorites)
  values (new.id, 'My Favorites', true)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger after profile insert
drop trigger if exists on_profile_created_create_fav on public.profiles;
create trigger on_profile_created_create_fav
after insert on public.profiles
for each row execute function public.create_default_favorites();