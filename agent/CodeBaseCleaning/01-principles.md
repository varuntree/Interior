# Core Engineering Principles — Interior Design Generator

Purpose: A focused playbook of concepts that matter for this project, tuned to our Next.js + Supabase + Stripe + Replicate stack and indie‑friendly constraints. No features are added by following these principles — they guide structure, quality, and maintainability.

## Core Philosophy
- Minimize accidental complexity: simple defaults, small modules, predictable flows.
- Keep side effects at the edges (routes, webhooks); everything else pure.
- Prefer composition over inheritance; functions over classes for services/repos.
- Choose boring tech: Next.js App Router + route handlers + Supabase + Stripe + Replicate.

## Layering & Separation
- Direction: UI → `app/api/**` (validate/orchestrate) → `libs/services/**` (business rules) → `libs/repositories/**` (DB) → Supabase.
- No Server Actions; no DB calls from components.
- Services never validate inputs (assume routes validated); repositories never encode business logic.
- Keep each module single‑purpose; aim for 150–200 lines per file for readability.

## API Contracts
- Zod‑validate inputs; enforce method via a `withMethods([...])` wrapper.
- Return normalized `ApiResponse<T>`; map errors to codes (`VALIDATION_ERROR`, `LIMIT_EXCEEDED`, etc.).
- Idempotency for creates via `idempotencyKey` + partial unique index.
- Stable paths under `app/api/v1/**`; thin legacy shims if needed.

## Domain Modeling
- Separate transport types (request/response DTOs) from domain types; add small mappers.
- Narrow types: prefer unions (`'redesign'|'staging'|'compose'|'imagine'`) and branded ids for clarity.
- Keep domain invariants in services (e.g., “one in‑flight job per user”).
- Avoid implicit state; pass explicit context (`{ supabase, now, logger }`).

## Data & Storage
- RLS‑first design: rows always tagged with `owner_id`; never trust client user id.
- Repositories: tiny, pure functions with explicit selects/filters; return typed records.
- Storage paths consistent and enumerable: inputs → `private/${userId}/inputs/...`, outputs → `public/renders/${renderId}/...`.
- Migrations are files‑only, idempotent, small, and include policies + indexes.

## Auth & Security
- SSR client for gating in layouts; browser client only for auth UI.
- Webhooks only use service‑role; verify signatures; log minimal PII.
- Never expose secrets in client bundles; parse env on startup using a strict parser.
- Deny‑by‑default: route handlers check session; repos assume RLS enforces.

## Error Handling
- Centralize error taxonomy and mapping to HTTP status.
- Early‑return guard style; avoid deep nested conditionals.
- Log with context (`jobId`, `predictionId`, `userId`); avoid leaking stack traces to clients.
- Normalize upstream failures to `UPSTREAM_ERROR` with a short user‑safe message.

## Performance & Efficiency
- Avoid N+1: batch reads in repos; index for frequent queries.
- Image handling: stream uploads, avoid base64 in JSON, lazy‑load in UI.
- Caching headers: default `private, no-store`; allow explicit `stale-while-revalidate` for public read endpoints if added later.
- Keep bundle lean: avoid heavy client libs; prefer native APIs and shadcn/ui primitives.

## Reliability & Idempotency
- Concurrency guard: enforce “one in‑flight” via repo query + status check.
- Timeouts and minimal retries with jitter at service boundaries; treat Replicate as flaky.
- Webhook handlers idempotent (upsert by `prediction_id`; ignore duplicates).
- Background consistency: poll‑if‑stale in `GET /generations/:id`.

## Configuration & Env
- Central `config.ts` for non‑secrets (plans, presets, product defaults).
- Secrets only in env; never imported client‑side except public Supabase URL/anon key.
- Single source of truth for plans/limits; services read from `config`.
- Feature flags kept simple: booleans in config, not a framework.

## UI/UX Consistency
- Design tokens in `app/globals.css`; shadcn/ui only; accessible defaults.
- Clear states: idle/submitting/processing/succeeded/failed; explicit disable conditions.
- Deterministic layouts: predictable sidebar, sticky primary CTA on mobile.
- Image components: constrain sizes, lazy‑load, avoid layout shift.

## Developer Experience
- Consistent file/folder naming and exports; one module = one responsibility.
- Avoid over‑abstraction; extract only when duplication hurts or rules emerge.
- Logically grouped helpers under `libs/**` (api‑utils, storage, supabase, logging, http, mappers).
- Small PR‑sized changes; update specs/docs alongside code.

## Indie Hacker Tradeoffs
- No containers/workers until necessary; lean on Replicate/Supabase primitives.
- Defer complex queueing; use optimistic UI and clear retry paths.
- Keep observability lightweight: structured logs now; metrics later.
- Bias to fewer dependencies; every new lib must pay its rent.

