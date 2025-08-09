PHASE_02__generation-core.md
1) Title & Goal
Prompt-only generation: let a user submit a prompt and retrieve the finished image via polling; enforce single in‑flight job per user; keep credits check stubbed (real enforcement arrives in Phase 5).

2) Scope (In/Out)
In

API (new):

POST /api/v1/generations/submit → returns { id }

GET /api/v1/generations/:id → returns { status, url? }

Service orchestration:

submitGeneration({ prompt, userId }): enforce single in‑flight per user; create DB row; call Replicate (real call, no webhook); return id.

getGeneration({ id, userId }): read DB; if processing, opportunistically poll Replicate once and update row; return latest state.

Repository:

libs/repositories/generations.ts: create, getById, findActiveByUserWithinTTL, updateStatusAndUrl.

DB migration:

public.generations table (RLS owner‑scoped) with minimal columns.

UI (new protected page):

/app/(app)/dashboard/generate/page.tsx: textarea for prompt; Generate button; disabled & toast when in‑flight; loading indicator; result card when done.

Apply Theme v2 tokens in app/globals.css with Open Sans font, 1.3rem radius, minimal shadows

Ensure NextTopLoader uses primary color (#47B3FF)

Verify dark mode functionality with proper contrast and visibility

Credits:

Stub check: checkUserHasCredits() in service returns true (placeholder for Phase 5).

Out

Image-to-image, aspect ratios, room/style presets, and variants (Phase 3).

Favorites/collections (Phase 4).

Community (Phase 6).

3) Spec References
ai_docs/specs/01-prd.md — Core generation flow.

ai_docs/specs/02-system-architecture-and-api.md — Route → Service → Repo boundaries; normalized responses; Replicate guide summary.

ai_docs/specs/03-data-model-and-storage.md — Generations entity (minimal).

ai_docs/specs/04-ui-ux.md — Generate page skeleton, loading/empty states, single in‑flight.

ai_docs/specs/06-testing-and-quality.md — Happy/invalid smoke tests.

4) Planned Changes (by layer)
API routes
Add app/api/v1/generations/submit/route.ts

Method: POST only (withMethods(['POST'])).

Body (Zod):

ts
Copy
const Body = z.object({
  prompt: z.string().min(1).max(800),
})
Steps:

Parse body; on error → fail(400, 'VALIDATION_ERROR', ...).

Read session userId (via service client).

Single in‑flight check: call repo findActiveByUserWithinTTL(userId, ttlMinutes=6); if exists → fail(409, 'GENERATION_IN_FLIGHT', 'Please wait until the current generation completes.').

Credits (stub): call local helper checkUserHasCredits(userId) → currently always true. If false in future → fail(402, 'NO_CREDITS', 'Upgrade or wait for reset.').

Create generations row with status='processing'.

Call service submitGeneration(...) (which triggers Replicate and stores external_id).

ok({ id }).

Add app/api/v1/generations/[id]/route.ts

Method: GET only.

Steps:

Validate id (UUID).

Load row by id + owner; if not found → fail(404, 'NOT_FOUND', ...).

If status='processing' and external_id present, try one non-blocking poll to Replicate (short timeout). If finished, update DB.

ok({ status, url }) (url only when succeeded).

Response shape (normalized):

ts
Copy
type SubmitRes = { id: string }
type GetRes    = { status: 'processing'|'succeeded'|'failed'; url?: string }
Services
Add libs/services/generations.ts

submitGeneration(ctx, { prompt, userId }): Promise<{ id: string }>

Create row: { id, owner_id, prompt, status:'processing', created_at }

Call Replicate (via adapter) to start prediction:

Save external_id (prediction id).

Do not wait for completion here.

getGeneration(ctx, { id, userId }): Promise<{ status, url? }>

Read row; if processing and external_id, call Replicate once (short timeout); if succeeded, persist result_url.

Update libs/services/replicate.ts (replace stub with real call in this phase):

startPrediction(args: { prompt: string }): Promise<{ externalId: string }>

fetchPrediction(externalId: string): Promise<{ status: 'processing'|'succeeded'|'failed'; url?: string }>

Keep the module boundary stable so later phases (image-to-image, variants) just extend args.

Helper inside generations service:

checkUserHasCredits(userId): Promise<boolean> → returns true for now (Phase 5 will replace).

Repositories / DB
Add migrations/phase2/005_create_generations.sql

sql
Copy
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  prompt text not null,
  external_id text,              -- provider prediction id
  status text not null check (status in ('processing','succeeded','failed')),
  result_url text,               -- final image URL (provider-hosted for now)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.generations enable row level security;

-- Owner-only access
drop policy if exists "generations_owner_select" on public.generations;
create policy "generations_owner_select"
  on public.generations for select
  using (auth.uid() = owner_id);

drop policy if exists "generations_owner_insert" on public.generations;
create policy "generations_owner_insert"
  on public.generations for insert
  with check (auth.uid() = owner_id);

drop policy if exists "generations_owner_update" on public.generations;
create policy "generations_owner_update"
  on public.generations for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Simple updated_at trigger (optional if you want)
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generations_touch on public.generations;
create trigger trg_generations_touch
  before update on public.generations
  for each row execute function public.touch_updated_at();
Add libs/repositories/generations.ts

create(supabase, row: { owner_id, prompt, status, external_id? }): Promise<Generation>

getById(supabase, id: string): Promise<Generation>

updateStatusAndUrl(supabase, id: string, status, url?): Promise<void>

findActiveByUserWithinTTL(supabase, ownerId: string, minutes: number): Promise<Generation | null>

Definition: active = status='processing' and created_at > now() - interval 'X minutes'

This TTL prevents “stuck forever” in-flight.

Storage
None (we will use provider URL in this phase; local storage arrives later if needed).

UI
Add app/(app)/dashboard/generate/page.tsx

Components:

Prompt textarea, “Generate” button.

Disabled state + toast “Please wait until this generation completes” if 409 returned.

Loading indicator while polling GET /api/v1/generations/:id.

Result card (image) on success; concise failure message with “Try again” button.

Do not touch existing /dashboard/page.tsx (guardrail).

Config
None. Hardcode in-flight TTL = 6 minutes in service for now (or export from a small libs/constants/generation.ts if desired).

5) Replicate usage (this phase)
Model: OpenAI gpt-image-1 via Replicate platform (no webhooks yet).

Start: startPrediction({ prompt }) → returns externalId.

Poll: fetchPrediction(externalId) on GET route (single opportunistic check).

Statuses: map provider → 'processing'|'succeeded'|'failed'.

Result: use provider-hosted image URL in result_url. (Later we may download to Supabase Storage.)

6) Constraints & Guardrails
Repeat Handbook §0 do‑not‑touch list.

No Server Actions; no DB in components; all routes return normalized JSON.

Single in‑flight per user: enforced both client (button disabled) and server (409).

Do not introduce queues or webhooks in this phase.

7) Acceptance Criteria (Verifier will check)
Build + greps green (same checks as Phase 1).

Happy path:

POST submit with { prompt: '…' } → 200 { success:true, data:{ id } }.

UI sees id → polls GET until succeeded → displays image.

Invalid:

Empty prompt → 400 VALIDATION_ERROR (details flattened).

In‑flight:

Submit again before previous completion → 409 GENERATION_IN_FLIGHT and UI shows toast.

Failure path:

Simulate provider failure (force service to set failed) → UI shows friendly error; “Try again” resets state.

Security:

Try to GET a generation from another user → 404 NOT_FOUND (due to RLS + owner check).

8) Artifacts (per phase)
Planner output → ai_docs/changes/PHASE_02__change_spec.md (lists all new files with full content, including the SQL migration).

Verifier output → ai_docs/reports/PHASE_02__qa-report.md (build/greps + smoke results + notes on in‑flight and failure path).

