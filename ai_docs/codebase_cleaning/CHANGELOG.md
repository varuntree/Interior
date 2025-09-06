# Codebase Cleaning — Changelog

## [Unreleased]
- Initial creation of guiding principles, audits, standards, playbooks, and validation docs
- Established folder `ai_docs/codebase_cleaning` as the canonical workspace

## 2025-09-06 — Phase 0 Baseline
- Added scripts: `verify:grep` in package.json
- Harmonized API helpers: flexible `ok`/`fail` signatures; added `validateRequest` helper
- Introduced minimal service stubs to satisfy typecheck for existing routes:
  - `libs/services/admin.ts` (checkAdminStatus, bootstrapAdmin)
  - `libs/services/credits.ts` (getCreditsSummary placeholder)
  - `libs/services/favorites.ts` (toggleFavorite, listFavorites placeholders)
  - `libs/services/profile.ts` (get/update profile settings placeholders)
- Fixed UUID import to use Node `crypto.randomUUID` in storage uploads (removed `uuid` dependency usage)
- Verified: typecheck, lint (warnings only), build (Next 14) succeeded; grep checks clean

## 2025-09-06 — Phase 1 Design System & UI Tokens
- Generation UI: tokenized success/error states in `GenerationProgress` (removed hardcoded green/red classes)
- Community: replaced hardcoded `bg-white text-black` overlay button with tokenized `bg-background text-foreground`
- Generator: added mobile sticky CTA bar for the Generate button (md:hidden fixed bottom) while keeping desktop centered
- Settings: tokenized UsageDisplay warnings (`yellow-*` → `accent` tokens; remaining count color → `text-primary`)
- Audit: no remaining hardcoded color/radius/shadow classes; kept `bg-[length:200%_100%]` in LoadingStates as an allowed exception for shimmer
- Validation: typecheck, lint (warnings only), build all passing; light/dark and responsive behavior verified at key screens

## 2025-09-06 — Phase 2 API Contracts & Routes (Start → Complete)
- Removed repository usage from routes and enforced Route → Service boundaries:
  - Generations [id]: moved variant fetching/deletion to `libs/services/renders` (`getVariantsForJob`, `deleteRendersByJob`); added `cancelGeneration` in `libs/services/generation`; route now calls services only.
  - Replicate webhook: extracted handling to `libs/services/generation_webhooks.handleReplicateWebhook`; route only verifies signature and delegates.
  - Usage: replaced repository import with `libs/services/profile.getProfile`.
- Response helpers: routes already using `ok/fail`; preserved semantics.
- Validation: all scripts pass; grep checks clean.

## 2025-09-06 — Phase 3 Services & Repositories (Complete)
- Enforced boundaries: routes call services only; services compose repositories; repositories remain pure.
- Refactors:
  - Generations [id] → services for variants/deletion/cancel
  - Webhook → delegated to service handler
  - Usage → profile service wrapper
  - Analytics → service logger
  - Status → health service

## 2025-09-06 — Phase 4 Storage Paths & Asset Management (Complete)
- Uploads now return `dbPath` (`private/<uid>/inputs/...`) and store DB paths accordingly.
- Outputs continue under `renders/<renderId>/<idx>.webp` in public bucket with consistent URL generation.
- Verified least privilege: admin client only in webhook.

## 2025-09-06 — Phase 5 Runtime Config Consolidation (Complete)
- ImageUpload uses `runtimeConfig.limits.acceptedMimeTypes` and `maxUploadsMB`.
- GenerationSettings clamps variants using `runtimeConfig.limits.maxVariantsPerRequest`.
- No duplicated preset/limit constants remain in UI.

## 2025-09-06 — Phase 6 Generation Quality & Observability (Complete)
- Added Vitest unit tests for prompt builder and replicate adapter; `npm run test` passes.
- Added structured logs at generation submit/debit/poll and webhook transitions; capped error lengths and avoided PII.
- Verified idempotency on submit (idempotencyKey) and webhook safety.

## 2025-09-06 — Phase 8 Security & Secrets Review (Complete)
- Verified no server secrets in client code; components use only `NEXT_PUBLIC_*` and `NODE_ENV`.
- Confirmed `createAdminClient` usage only in webhooks; least-privilege respected.
- Storage & RLS usage aligned; inputs in `private/`, outputs in `public/renders/` and accessed via public URLs.
