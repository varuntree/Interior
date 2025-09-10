Guiding Principles

  - Single flow: UI → API routes → Services → Repositories → DB/Storage
  - No Server Actions or direct DB calls from components
  - One source of truth: runtime config for presets/limits/plans
  - Contract-first APIs, normalized responses, idempotent operations
  - RLS everywhere; service role only in webhooks
  - Remove unused/legacy code as we prove it unreferenced

  Phases

  - Phase 0 — Groundwork & Audit
      - Map current code vs. specs; list missing, duplicate, and dead parts
      - Run forbidden greps; confirm middleware/auth guard in place
      - Introduce runtime config file scaffold (libs/app-config/runtime.ts)
      - Introduce runtime config file scaffold (libs/app-config/runtime.ts)
  -
  Phase 1 — Core Generation E2E
      - Repositories: generation_jobs, storage helpers
      - Services: generation.submit, generation.getById
      - Adapter: libs/services/external/replicateAdapter.ts
      - API: POST /api/v1/generations, GET /api/v1/generations/:id
      - Webhook: POST /api/v1/webhooks/replicate (admin client, idempotent)
      - UI: wire /dashboard/create to these endpoints; show status/variants
  -
  Phase 2 — Renders & Collections
      - Repos: renders, render_variants, collections, collection_items
      - Services: list/get/delete renders; CRUD collections; favorites toggle
      - API: renders and collections endpoints per spec
      - UI: wire My Renders and Collections flows (incl. “My Favorites”)
  -
  Phase 3 — Community (Public Read + Admin)
      - Public gallery endpoints and UI (search/featured)
      - Admin curation flows (ensure, upsert, publish, delete)
      - Cache headers for public content
  -
  Phase 4 — Quality & Hardening
      - Minimal tests (prompt builder, adapter mapping)
      - Smoke tests (submit + poll, renders, collections)
      - Forbidden greps, typecheck, build
      - Docs/readme touch-ups if needed
  -
  Phase 5 — Cleanup & Hardening
      - Prune dead routes/components/libs; align storage conventions
      - Apply phase2 migrations (manual; no auto-apply)
      - Minimal tests (prompt builder, adapter mapping)
      - Smoke tests, build, and forbidden grep checks; update docs

  Acceptance Criteria

  - Create page generates successfully via Replicate webhook, persists outputs, displays variants.
  - My Renders and Collections fully functional; default “My Favorites” present.
  - Usage limits and single in‑flight job enforced with clear UI feedback.
  - Community page loads curated sets and pre-fills Create.
  - All v1 routes return normalized JSON; no server actions; no direct DB calls from components.
  - Unused code removed; npm run build and greps pass.

---

Progress Update — Phase 1 and Phase 2 (complete)

- Phase 1 — Core Generation E2E: COMPLETED
  - Single provider: Google nano-banana only. Removed legacy OpenAI adapter and OPENAI_API_KEY.
  - End-to-end wired: UI → API → services → repos → Replicate → webhook → storage → UI.
  - Webhook idempotent; outputs persisted under public/renders; variants surfaced to UI.

- Phase 2 — Renders & Collections: COMPLETED
  - Favorites implemented via default "My Favorites" collection (toggle/list backed by collections).
  - Generation results include renderId; UI can favorite and add to collections directly.
  - Collections items return cover_image_url (resolved from cover variant).
  - Renders page wired (list, open, delete); render details (set cover, delete).
  - Collections page wired (list, create, rename, delete); detail page (list items, remove item).
  - Unified API wrapper to use libs/api-utils/methods across routes; removed handler.ts.

Verification so far

- Forbidden greps pass (no Server Actions; no service_role in UI).
- Admin client usage limited to webhooks.
- RLS policies align with current flows (owner updates allowed for non-terminal job fields).

Change: Defer Payments/Plans

- Subscriptions, plan pricing, and strict usage gating are deferred to the final phase.
- We will not integrate Stripe plan mapping or enforce plan limits until the app is otherwise complete.
