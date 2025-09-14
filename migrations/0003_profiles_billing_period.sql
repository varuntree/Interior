-- 0003_profiles_billing_period.sql
-- Forward-only migration to add subscription billing period fields to profiles.
-- Safe to apply multiple times via IF NOT EXISTS guards.

alter table if not exists public.profiles
  add column if not exists subscription_id text;

alter table if not exists public.profiles
  add column if not exists current_period_start timestamptz;

alter table if not exists public.profiles
  add column if not exists current_period_end timestamptz;

