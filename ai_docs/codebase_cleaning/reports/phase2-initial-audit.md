# Phase 2 — Initial Audit Report (Routes)

Date: 2025-09-06

Summary
- withMethods usage: present across all v1 routes (object-style and array-style variants).
- Zod presence: present in most routes; a few rely on helper or do not require body validation.
- Response helpers: mix of `ok/fail` and legacy `badRequest/unauthorized/forbidden/serverError`.
- Repository imports in routes: found in 3 routes (must move to services).

Details
- Routes using withMethods (sample):
  - stripe/create-checkout, stripe/create-portal, webhooks/stripe, profile/settings (GET/PATCH), analytics/event, credits/summary, webhooks/replicate, collections/items/toggle, community/collections, community, collections/upsert, collections (GET/POST), generations (POST/GET), community/collections/[id]/items, usage, admin/ensure, renders (GET), favorites/list, favorites/toggle, auth/me, admin/community/* (upsert/publish/delete).
- Routes importing repositories directly (target for refactor):
  - app/api/v1/generations/[id]/route.ts → imports `libs/repositories/renders`
  - app/api/v1/webhooks/replicate/route.ts → imports `libs/repositories/generation_jobs`
  - app/api/v1/usage/route.ts → imports `libs/repositories/profiles`
- Legacy response helpers present in:
  - admin/community/* routes (badRequest/forbidden)
  - credits/summary (unauthorized/serverError)
  - favorites/* (unauthorized)
  - renders/[id] (fail used; OK)
  - collections routes: mixed ok/fail; ensure consistency

Plan of action
1) Replace legacy helpers with `fail()` equivalents keeping messages/codes consistent.
2) Add/confirm Zod schemas and use `validateRequest` for JSON bodies.
3) Create service shims for routes importing repositories; update routes to call services.
4) Remove unused imports/vars flagged by ESLint during the edit passes.

Validation
- After each PR: `npm run typecheck && npm run lint && npm run build && npm run verify:grep`.
- Spot-test 1–2 endpoints per domain where changes were made.
