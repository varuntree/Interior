# Phase 11 — Documentation Refresh (Changelog)

Purpose
- Capture the final pass of documentation updates after codebase cleanup (Phases 1–10 completed). This serves as a quick map for new contributors to the latest truth and what changed.

What changed (high level)
- Provider finalized as Replicate (google/nano‑banana). No OpenAI model references.
- Generation request contracts simplified: no aspect ratio, quality, or variants knobs at the API level for MVP.
- Webhook path unified to `/api/v1/webhooks/replicate` with `X-Replicate-Signature` verification (`REPLICATE_WEBHOOK_SECRET`).
- Storage outputs are JPG under `public/renders/<renderId>/<idx>.jpg`; thumbnails optional.
- Community data model uses a flat `community_images` table; public gallery is `GET /api/v1/community`.
- Migrations consolidated: `0001_baseline.sql` (core schema, RLS, buckets, triggers) + `0002_webhook_events.sql` (event store).
- Observability standard enforced via `withRequestContext` with `x-request-id` header and structured logs.
- Added analytics endpoint `POST /api/v1/analytics/event` (non‑blocking; logs to `logs_analytics`).

Key doc updates
- spec/system_architecture_and_api.md
  - Removed legacy AR/quality/variants from request contracts; updated examples and webhook behavior; community endpoints aligned.
- spec/generation_engine_and_external_service.md
  - Adapter now `googleNanoBananaAdapter`; removed unused knobs; clarified normalization of webhook outputs.
- spec/data_and_storage.md
  - Storage JPG outputs; migrations consolidated; event store documented.
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
- spec/system_architecture_and_api.md — Full topology and API details.
- spec/data_and_storage.md — Schema, storage paths, RLS, migrations.
- spec/generation_engine_and_external_service.md — Prompting, adapter mapping, webhook.

Notes
- Advanced generation knobs (aspect ratio, quality, variants) are intentionally omitted for the current model. The UI may present minimal placeholders, but the service ignores them.
- If a future provider requires these knobs, reintroduce them at the adapter level and revise the contracts accordingly.

