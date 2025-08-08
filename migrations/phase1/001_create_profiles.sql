-- Create profiles table (id matches auth.users.id)
create table if not exists public.profiles (
  id uuid primary key,
  email text unique,
  customer_id text,
  price_id text,
  has_access boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Ensure RLS is enabled
alter table public.profiles enable row level security;