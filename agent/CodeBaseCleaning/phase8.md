# Phase 8 — Payments & Legacy Delegation (Vertical Slice 5)

Purpose
- Keep billing flows clean, consistent, and minimal: legacy routes delegate to v1, services centralize Stripe interactions and plan mapping, usage ledger side‑effects stay in one place, and the UI reads plan metadata from config without hard‑coded IDs. No scope creep.

Scope (What’s Included)
- Legacy → v1 delegation: keep `/api/stripe/create-checkout` and `/api/stripe/create-portal` as thin re‑exports of `/api/v1/stripe/**`.
- v1 endpoints: `POST /api/v1/stripe/create-checkout`, `POST /api/v1/stripe/create-portal` use services only.
- Webhook: `/api/v1/webhooks/stripe` (legacy `/api/webhook/stripe` re‑exports POST). Idempotent handling with event store.
- Usage gating/ledger: side effects stay centralized in usage services/repositories and generation service.
- UI: BillingSection reads from config-driven plan metadata; removes hard‑coded price IDs.
- Confirm (unchanged): collections use centralized components (RenderCard/AppImage) — already completed in Phase 6.

Non‑Goals
- No new billing features or plan management UI.
- No schema changes.
- No pricing model changes.

Current State (Audit Summary)
- Legacy routes: present and already delegate to v1
  - `app/api/stripe/create-checkout/route.ts` → re‑exports v1
  - `app/api/stripe/create-portal/route.ts` → re‑exports v1
- v1 routes (ok):
  - `app/api/v1/stripe/create-checkout/route.ts` → uses `startCheckoutService`
  - `app/api/v1/stripe/create-portal/route.ts` → uses `openCustomerPortalService`
- Webhook (ok):
  - `app/api/v1/webhooks/stripe/route.ts` → verifies signature and calls `handleStripeWebhookService`
  - `app/api/webhook/stripe/route.ts` → re‑exports v1 POST handler (legacy path)
  - `libs/services/billing.handleStripeWebhookService` → uses `recordWebhookEventIfNew` (idempotency), sets billing/access flags on profiles
- Stripe client wrapper: `libs/stripe.ts` (createCheckout, createCustomerPortal, findCheckoutSession)
- Plan metadata and mapping:
  - Marketing/config plans: `config.ts.stripe.plans[*].priceId`
  - Runtime caps: `libs/app-config/runtime.ts.plans[priceId]`
  - Services expose `getAllAvailablePlans`, `getPlanByPriceId`, and `getFreePlan`
- Usage/limits: `libs/services/usage` + `libs/repositories/usage` with debits/credits; generation service debits on accept; gating uses runtime config
- UI (gap):
  - `components/settings/BillingSection.tsx` posts to v1 endpoints (good) but uses a hard‑coded `price_pro_plan` for checkout, not config.stripe.plans priceId.

Gaps To Close in Phase 8
- Remove hard‑coded price IDs in BillingSection; use config.ts/runtime config to pick a plan to upgrade to (e.g., the featured plan or a specific priceId).
- Optional: surface a small helpers layer to fetch available plans client‑side if we want stricter decoupling (or import config directly since it’s non‑secret).
- Verify/ensure no service‑role usage outside webhooks/admin endpoints.
- Re‑verify collections component reuse from Phase 6 (no changes required).

Outcomes (Definition of Done)
- Legacy routes continue delegating to v1; no direct logic in legacy paths.
- Webhook remains idempotent, with event store enforced.
- BillingSection upgrades using a valid priceId from config (no hard‑coded price strings).
- Usage ledger side effects remain centralized in services; generation gating unchanged.
- Collections continue to use centralized components (RenderCard/AppImage) — verified.

Implementation Plan (Step‑by‑Step)

Step A — Legacy Delegation Sanity
- Confirm and keep:
  - `app/api/stripe/create-checkout/route.ts` → `export { POST } from '@/app/api/v1/stripe/create-checkout/route'`
  - `app/api/stripe/create-portal/route.ts` → `export { POST } from '@/app/api/v1/stripe/create-portal/route'`
  - `app/api/webhook/stripe/route.ts` → re‑export v1 POST

Step B — v1 Routes & Services Audit
- Ensure v1 routes use `withMethods`, `validate`, and service functions (already OK).
- Ensure services call only Stripe wrapper and repos; no secrets in client code.

Step C — UI (BillingSection) — Use Config‑Driven Plans
- Replace the hard‑coded `price_pro_plan` with a config-based priceId:
  - Option 1 (simplest): Import `config.ts` on the client and select the featured plan’s `priceId`.
  - Option 2: Add a small server endpoint `/api/v1/stripe/plans` to return displayable plans, then fetch it on the client (optional; not required for MVP).
- Keep POSTs to v1 endpoints unchanged; pass the selected `priceId` into create-checkout payload.

Step D — Usage Ledger & Gating Sanity
- Confirm generation service debits usage on accept; keep idempotency (done).
- Confirm usage/limits are based on runtime config and ledger (done).

Step E — Collections Component Reuse Verification
- Verify collections pages still render using `RenderCard` + `AppImage` after phases 6/7 (no action needed).

Step F — Verification
- Typecheck/lint/build.
- Manual smoke:
  - Settings → Manage billing opens portal for users with a `customer_id`.
  - Settings → Upgrade Plan redirects to Stripe Checkout using config plan priceId; after checkout, webhook updates profile.
  - Usage endpoint `/api/v1/usage` reflects updated plan.
  - Legacy `/api/stripe/create-*` remain functional (delegate to v1).

Files Expected to Change
- `components/settings/BillingSection.tsx`
  - Replace hard‑coded `price_pro_plan` with a `config.ts` derived priceId (e.g., featured plan or by name).
- (Optional) `app/api/v1/stripe/plans/route.ts`
  - If we expose plans to the client via API instead of importing config directly.

Risks & Rollback
- If we import config in client, ensure it’s non‑secret (it is). If uncomfortable, use an API to serve displayable plans.
- If webhook configuration is missing in env, portal/checkout still work but billing state won’t update — verify env in ops.

Acceptance Checklist (Phase 8)
- [ ] Legacy routes delegate to v1; no logic duplication.
- [ ] Webhook idempotency enforced; event store used.
- [ ] BillingSection creates checkout sessions with a real `priceId` from config.
- [ ] Generation usage debits remain centralized and idempotent.
- [ ] Collections continue to use centralized components.

Result (to fill on completion)
- Date:
- Branch/Commit:
- Summary of changes:
- Verify logs:
- Notes:

