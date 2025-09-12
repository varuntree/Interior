-- 0002_webhook_events.sql
-- Persistent de-duplication store for inbound webhooks (Stripe/Replicate)
-- Safe to apply multiple times (idempotent constraints)

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe','replicate')),
  event_id text not null,
  received_at timestamptz not null default now(),
  payload jsonb,
  constraint uniq_webhook_event unique (provider, event_id)
);

-- Enable RLS; webhooks use service-role key to bypass policies
alter table public.webhook_events enable row level security;

