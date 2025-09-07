# Phase 9 — Documentation & Handover (Complete)

Objective: Provide a clear, concrete, and self‑contained reference for the cleaned codebase so future work stays consistent and fast.

## Final State Summary
- Architecture: Route → Service → Repository → DB enforced; no Server Actions; no direct DB/storage in components.
- API contracts: `withMethods`, Zod validation, `ok/fail` responses, canonical error codes; legacy helpers normalized.
- Runtime config: Single source in `libs/app-config/runtime.ts` for presets, defaults, limits, plans, replicate.
- Storage: Inputs → `private/<uid>/inputs/*` (DB values), Outputs → `public/renders/<renderId>/*` with public URLs.
- Security: Service‑role client only in webhooks; no server secrets in client code; RLS on.
- Observability: Structured logs at key generation + webhook transitions; idempotency enforced.
- Performance: Memoized result cards/grid; lazy image loading; responsive improvements.

## How To Work In This Repo
- Scripts
  - `npm run typecheck` — TS no‑emit check
  - `npm run lint` — Lint (must be warnings only at minimum)
  - `npm run build` — Next.js build (App Router)
  - `npm run verify:grep` — Guardrails (forbidden patterns)
  - `npm run test` — Unit tests (Vitest)
- Guardrails (non‑negotiable)
  - No Server Actions; no direct DB/storage in components
  - Routes call services; services compose repositories; repositories use `SupabaseClient` only
  - Admin/service‑role only in webhooks
  - Use `ok/fail` and canonical error codes everywhere
  - Use tokens from `app/globals.css`; do not hardcode styles

## Adding A New API Endpoint (Checklist)
1) Create route: `app/api/v1/<domain>/<action>/route.ts` using `withMethods`.
2) Validate inputs with Zod (or `validateRequest`).
3) Call a service (do not import repositories in routes).
4) Return `ok(data)` / `fail(status, code, message, details?)`.
5) Run: typecheck, lint, build, verify:grep.

## Adding Business Logic
- Create/edit service: `libs/services/<domain>.ts`; accept `{ supabase }` and pure args, compose repos/SDKs.
- Create/edit repository: `libs/repositories/<entity>.ts`; no HTTP; only DB I/O.
- Use runtime config for presets/limits; avoid constants in services.

## Storage Usage
- Inputs: Upload via `libs/services/storage/uploads` → use returned `dbPath` for DB (`private/<uid>/inputs/*`).
- Outputs: Write to `public/renders/<renderId>/<idx>.webp` via storage helpers/services.
- Never use admin client outside webhook routes.

## Generation Engine Contracts
- Submit: Enforce inflight, quota, moderation, idempotency (idempotencyKey).
- Replicate adapter: `toReplicateInputs` maps aspect ratio/variants; clamps to runtime limits; includes `openai_api_key`.
- Webhook: Idempotent; processes assets; updates job status; logs structured events.

## Tests
- `tests/prompt-builder.test.ts`: Prompts include structural/AU guardrails; imagine requires user prompt.
- `tests/replicate-adapter.test.ts`: AR mapping; variant clamp; input images; webhook URL formation.

## Security Checklist (quick)
- Client code uses `NEXT_PUBLIC_*` only; server secrets never imported there.
- `createAdminClient` usage restricted to webhook paths.
- RLS enforced; inputs in private bucket; outputs public.

## Performance Tips
- Memoize heavy render grids; lazy load images with sizes set; avoid layout thrash.
- Keep components presentational; push logic to services.

## What Changed In Cleanup (high level)
- Normalized auth/collection/favorites/stripe webhook responses to `fail()`.
- Moved repo calls out of routes (generations [id], webhook, usage, analytics, status).
- Consolidated UI to design tokens; added mobile sticky CTA on generator.
- Enforced runtime config usage for uploads, limits, and settings.
- Added minimal tests and structured logs for the generation pipeline.

## Handover Notes
- When in doubt, check `ai_docs/codebase_cleaning/` (plans, audits, changelog).
- Keep future changes small and scoped; update docs alongside code.
