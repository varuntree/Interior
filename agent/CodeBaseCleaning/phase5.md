# Phase 5 — Renders (Vertical Slice 2)

Purpose
- Deliver a fast, paginated, filterable “Renders” vertical that avoids N+1 queries, uses stable storage paths, and exposes a clean API consumed by the dashboard. No product scope changes; this phase focuses on correctness, performance, and consistency.

Scope (What’s Included)
- API: List and detail endpoints for user renders; update cover variant; delete render. Cursor pagination and filters (mode, roomType, style), optional search (lightweight).
- Services/Repos: Batch data access to eliminate N+1; owner-scoped via RLS; indexes used.
- Storage: Output paths use `public/renders/${renderId}/${variantIndex}.jpg` (thumb optional).
- Frontend: Renders page/grid and details page adopt image wrapper and lazy loading, add simple pagination (“Load more”).

Non‑Goals
- No feature additions beyond pagination and filters already planned.
- No admin UI or community changes.
- No heavy search/FTS; keep search minimal if used.

Current State (Audit Summary)
- API routes present:
  - `GET /api/v1/renders` supports filters, search, cursor; returns normalized payload with pagination and optional totalCount.
  - `GET|PATCH|DELETE /api/v1/renders/:id` returns details, allows cover update and deletion.
- Services:
  - `listUserRenders` composes list + favorites + cover URL, but fetches each cover variant individually (potential N+1).
  - `getRenderDetails` returns variants in a single query (good).
  - `searchRenders` filters client-side on fetched results (simple but acceptable for MVP).
- Repositories:
  - `listRenders` uses `(owner_id, created_at)` index and returns basic rows.
  - `getRenderWithVariants` fetches render + all variants in two queries.
  - `findVariantByRenderAndIdx` exists and is used in a loop (source of N+1 in list).
  - Indexes present: `idx_renders_owner_created`, `idx_variants_render_idx` (good).
- Storage/Webhook:
  - Assets written to `public/renders/${renderId}/${idx}.jpg` (idempotent), thumbs optional.
- Frontend:
  - Grid uses `AppImage` for lazy loading (good). Details page uses Next/Image directly (acceptable). Search UI disabled; no pagination UI yet.

Gaps To Close in Phase 5
- Eliminate N+1 on list (cover variant lookup per render).
- Add simple client pagination on the Renders page using API cursor.
- Keep filters consistent and efficient; maintain response DTO shape.
- Ensure storage URL building is stable and unified.

Outcomes (Definition of Done)
- List endpoint returns first page in ≤1.5s p95 for 50 items with cover URLs and favorites flags.
- No N+1 DB queries in list path (cover variants acquired via a single batch query).
- UI supports “Load more” pagination; images lazy-load; no layout shift.
- Storage paths and URLs consistent; outputs renderable.

---

Implementation Plan (Step‑by‑Step)

Step A — API Contract Confirmation (no breaking changes)
- Keep `GET /api/v1/renders` query params: `mode`, `roomType`, `style`, `limit` (1..100; default 24), `cursor`, `search`.
- Response keeps structure: `{ renders, pagination { nextCursor, hasMore, limit }, totalCount? }`.
- Ensure headers remain `Cache-Control: private, no-store` (already via helpers).

Step B — Repository: Batch Cover Variant Fetch (remove N+1)
- Add repository helper to fetch variants for a batch of renders in one call:
  - `getVariantsByRenderIds(supabase, renderIds: string[]): Promise<RenderVariant[]>` which returns rows for all provided renderIds and all idx’s.
  - Alternative signature: `getCoverVariantsForRenders(supabase, pairs: Array<{ renderId: string; coverIdx: number }>)` — optional; the simple “all variants” approach is fine and filtered in service.
- Keep existing indexes: `idx_variants_render_idx (render_id, idx)` already supports efficient lookup if we filter later.

Step C — Service: Rewrite listUserRenders to Use Batch Fetch
- After `listRenders` returns rows, collect `renderIds` and fetch variants in one call via `getVariantsByRenderIds`.
- Build an in-memory map: `variantsByRenderId: Map<string, RenderVariant[]>` and pick the cover variant `idx === render.cover_variant` for URL building.
- Keep favorites membership via `collectionsRepo.getFavoritesMembership` (already batched by `in (...)`).
- Return DTO items with `cover_variant_url`, `cover_thumb_url?`, `is_favorite?`.
- Keep `totalCount` only for the first page to avoid extra count queries later.

Step D — Optional: Light Server‑Side Search (if time allows)
- Enhance repo `listRenders` for optional ilike filters on `style` and `room_type` when `search` present:
  - e.g., `ilike('style', %q%)` OR `ilike('room_type', %q%)`.
- If added, wire `search` branch in route to call `listUserRenders` with a `search` parameter instead of client-side filter.
- Keep this step optional; MVP can retain current simple client-side search path to avoid scope creep.

Step E — Frontend: Pagination UI for Renders Page
- Update `hooks/useRenders` to support:
  - Internal state of `items`, `nextCursor`, `hasMore`, `loadingMore`.
  - `fetchMore()` that calls `/api/v1/renders?cursor=...&limit=...` and appends items.
- Update `app/(app)/dashboard/renders/page.tsx` to show a `Load more` button when `hasMore` is true.
- Keep current grid and `AppImage` usage. No layout shifts.

Step F — Frontend: Detail Page Sanity
- No changes required, but verify cover updates reflect immediately without reload (hook already refetches after PATCH).

Step G — Observability & Error Paths
- Ensure service logs (info/warn) remain minimal and redact PII (already the default in logger).
- Maintain normalized error codes on routes (`NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`).

Step H — Performance Validation
- Verify number of DB queries on `GET /api/v1/renders` first page:
  - 1 query: listRenders
  - 1 query: batch variants for listed renderIds
  - 1 query: favorites membership (IN on renderIds)
  - 1 count query (only for first page)
- Confirm p95 times with representative data sizes; adjust limit defaults if necessary.

Step I — Docs & Tracker Updates
- Update `agent/CodeBaseCleaning/00-index-and-tracking.md` Phase 5 section on completion:
  - Mark checkboxes; note N+1 removal, pagination added, any search decision.
- No changes required to `ai_docs` (contracts unchanged); add a line if server-side search was adopted.

---

Files Expected to Change
- `libs/repositories/renders.ts`
  - Add `getVariantsByRenderIds(supabase, renderIds)` (and/or `getCoverVariantsForRenders`).
- `libs/services/renders.ts`
  - Update `listUserRenders` to use batch variant lookup; remove per-item `findVariantByRenderAndIdx` loop.
- `app/api/v1/renders/route.ts`
  - No contract changes. Optionally switch search branch to call `listUserRenders` with `search` if Step D implemented.
- `hooks/useRenders.ts`
  - Support pagination state: `nextCursor`, `hasMore`, `fetchMore`.
- `app/(app)/dashboard/renders/page.tsx`
  - Render `Load more` when `hasMore`; wire `fetchMore`.

Risks & Rollback
- Batch variant query could increase payload sizes slightly; mitigated by limiting page size.
- If search enhancement complicates queries, keep existing client-side search and defer server-side ilike.
- Rollback is straightforward: revert service to per-item cover query (not preferred), and keep UI list without pagination.

Acceptance Checklist (Phase 5)
- API
  - [ ] `GET /api/v1/renders` returns in ≤1.5s p95 for 50 items.
  - [ ] No N+1 database round-trips for covers; only batch queries.
  - [ ] Filters (mode, roomType, style) work; optional search behaves as chosen.
- Services/Repos
  - [ ] New batch helper exists and is covered in service.
  - [ ] `totalCount` only computed for first page.
- Frontend
  - [ ] Grid uses lazy images; no layout shift.
  - [ ] “Load more” paginates correctly and preserves existing items.
  - [ ] Cover update reflects quickly on details page.
- Storage
  - [ ] Output URLs built consistently from `public/renders/${renderId}/${idx}.jpg`.

Notes / Decisions to Log During Execution
- Search approach chosen (client-side vs. ilike server-side).
- Any minor schema or index concerns encountered (none expected).
- Query counts measured and noted.

Result (to fill on completion)
- Date:
- Branch/Commit:
- Summary of changes:
- Verify logs:
- Notes:

