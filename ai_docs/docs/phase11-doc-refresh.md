# Phase 11 — Documentation Refresh (Changelog)

Purpose
- Capture the final pass of documentation updates after codebase cleanup (Phases 1–10 completed). This serves as a quick map for new contributors to the latest truth and what changed.

What changed (high level)
- Provider finalized as Replicate (google/nano‑banana). No OpenAI model references.
- Generation request contracts simplified: no aspect ratio, quality, or variants knobs at the API level for MVP.
- Webhook path unified to `/api/v1/webhooks/replicate` with `X-Replicate-Signature` verification (`REPLICATE_WEBHOOK_SECRET`).
- Storage outputs are JPG under `public/renders/<renderId>/<idx>.jpg`; thumbnails optional.
- Community data model uses a flat `community_images` table; public gallery is `GET /api/v1/community`.
 - Community gallery flattened further: `GET /api/v1/community?limit=&cursor=` returns a flat list (no search/featured). Community images can be saved to user collections/favorites via new `collection_community_items`.
- Migrations consolidated: `0001_baseline.sql` (core schema, RLS, buckets, triggers) + `0002_webhook_events.sql` (event store).
- Observability standard enforced via `withRequestContext` with `x-request-id` header and structured logs.
- Added analytics endpoint `POST /api/v1/analytics/event` (non‑blocking; logs to `logs_analytics`).

 Key doc updates
- spec/system_architecture_and_api.md
  - Removed community search/featured branching; `/api/v1/community` is a flat, cursor-paginated list; noted marketing summary endpoint remains.
- spec/generation_engine_and_external_service.md
  - Adapter now `googleNanoBananaAdapter`; removed unused knobs; clarified normalization of webhook outputs.
- spec/data_and_storage.md
  - Added `collection_community_items` table and RLS to allow saving community images in collections/favorites.
- spec/config_and_plans.md
  - Webhook path fixed; removed variants/AR mapping; UI settings hidden in MVP for current provider.
- spec/ops_runbook.md and docs/deployment.md
  - Migration steps clarified; webhook env and path corrected; buckets created by migrations.
- core/* (Overview, Architecture, API, Ops)
  - Provider/storage/env/observability updates and cross‑references.
- docs/admin-guide.md
  - SQL queries use `generation_jobs` and `usage_ledger`; troubleshooting aligned.

Where to look first (for new contributors)
- core/01-overview-and-ux.md — Product and UX flows.
- core/02-architecture-and-guidelines.md — Layering, env, storage, webhooks, observability.
- core/05-api.md — Endpoint contracts.
  - `/api/v1/community` flattened to `{ items, nextCursor }`.
  - `/api/v1/favorites/toggle` accepts `{ communityImageId }`.
  - `/api/v1/collections/:id/items` accepts `{ communityImageId }`.
- spec/system_architecture_and_api.md — Full topology and API details.
- spec/data_and_storage.md — Schema, storage paths, RLS, migrations.
- spec/generation_engine_and_external_service.md — Prompting, adapter mapping, webhook.

Notes
- Advanced generation knobs (aspect ratio, quality, variants) are intentionally omitted for the current model. The UI may present minimal placeholders, but the service ignores them.
- If a future provider requires these knobs, reintroduce them at the adapter level and revise the contracts accordingly.
