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
  Phase 3 — Usage & Plans
      - Repo/Service: usage_ledger + monthly usage computation
      - API: GET /api/v1/usage
      - Enforce plan caps + “one in‑flight” on submit
      - Verify Stripe bridges (checkout/portal) and plan mapping from profiles.price_id
  -
  Phase 4 — Community (Public Read)
      - Repos/Service: community_collections + community_items (public read)
      - API: GET /api/v1/community
      - UI: “Apply Settings” prefill in Create
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