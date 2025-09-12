# Phase 7 — Community (Vertical Slice 4)

Purpose
- Make the Community vertical clean and consistent: public, read‑only endpoints with proper caching; admin flows strictly server‑only and allowlisted; use centralized image handling components on the UI; keep storage paths and URLs stable (`public/community/*` and public render URLs). No feature creep.

Scope (What’s Included)
- API: `GET /api/v1/community` public feed with optional `featured` and `search`; keep normalized responses; ensure public cache headers.
- Services/Repos: read from `community_images` (public read), optional join/hydration for internal renders; no route→repo imports.
- Admin endpoints (server‑only): upload/delete community images under `/api/v1/admin/community/images/*`, allowlist‑gated, admin client only.
- Frontend: `/dashboard/community` uses shared image infrastructure; optional reuse of AppImage wrapper and consistent card patterns; “Try this look” prefill action preserved.
- Confirm prior work: Collections routes already reuse centralized components from Phase 6 (RenderCard/AppImage) — leave as is.

Non‑Goals
- No public write flows; no moderation UI.
- No complex search/FTS; keep simple ilike already present.
- No schema changes.

Current State (Audit Summary)
- Data model: `public.community_images` with public select policy; indexes on `(is_published, order_index, created_at)` and GIN on `tags`.
- Repositories: `libs/repositories/community_images.ts` has `listPublishedImages(limit)` and `searchImages(query, limit)` using `or()` with ilike on title/apply_settings fields.
- Services: `libs/services/community.ts` builds a synthetic single collection from `community_images` and formats URLs via public bucket; `searchCommunityContent` calls repo `searchImages`. Caching neutral at service layer.
- Public API: `app/api/v1/community/route.ts` parses `featured`/`itemsPerCollection`/`search`, uses `getCommunityGallery`/`getFeaturedCollections`/`searchCommunityContent`. Returns via `ok(..., CACHE_CONFIGS.PUBLIC)` — good public caching. No auth required.
- Admin API: `app/api/v1/admin/community/images/upload|delete` call `community_images_admin` service; allowlist via `ADMIN_EMAILS`; uses `createAdminClient` server‑side; storage path `public/community/<uuid>.<ext>`; DB insert/delete with idempotent-ish storage behavior.
- UI: `app/(app)/dashboard/community/page.tsx` renders collections and items using `components/community/{CommunityCollection,CommunityItem}`, which currently use `next/image` directly and their own Card UI (not AppImage). “Try this look” uses `useApplySettings` to navigate to Create with prefilled settings.

Gaps To Close in Phase 7
- Centralize image handling in Community UI: adopt `components/shared/Image` (AppImage) for consistent lazy loading and no layout shift (align with Renders and Phase 2 guidelines).
- Confirm/ensure caching headers are applied on public API (already using `CACHE_CONFIGS.PUBLIC`). Keep it.
- Confirm admin endpoints remain server‑only and allowlist‑gated (already implemented). Optionally add brief error normalization.
- Optional: add simple pagination to public list (parameter for item limits; already supported by itemsPerCollection; keep current behavior).

Outcomes (Definition of Done)
- `/api/v1/community` remains public with `CACHE_CONFIGS.PUBLIC` headers; outputs minimal, normalized payload.
- Community UI uses `AppImage` for item images; hover/overlay actions preserved; no layout shift; lazy loading on.
- Admin endpoints remain allowlist‑gated; no service‑role leakage in general routes/components.
- No route→repo imports; services act as the sole DB accessors.

Implementation Plan (Step‑by‑Step)

Step A — API/Public Contract Confirmation
- Keep `GET /api/v1/community?featured=&itemsPerCollection=&search=` contract; no changes.
- Ensure `CACHE_CONFIGS.PUBLIC` stays on responses; no store for search? OK to keep public cache with short TTL.

Step B — Repository/Service Cleanups (if needed)
- `community_images.ts` is fine. Optionally clamp limits and validate search string length (e.g., 1..100 chars) in service.
- Confirm no route→repo imports (already routes import services only).

Step C — UI Component Reuse (Community)
- Update `components/community/CommunityItem.tsx` to use `components/shared/Image` (AppImage) instead of `next/image` directly:
  - Preserve skeleton/loader behavior via AppImage’s built‑in loader overlay.
  - Keep overlay actions (View full size, Try this look) as they are.
  - Use sizes string consistent with Renders.
- Optionally, light refactor of `CommunityCollection` to keep grid and tiles consistent with Renders spacing.

Step D — Observability & Caching
- Keep API logging minimal; rely on existing logger if added elsewhere.
- Retain `CACHE_CONFIGS.PUBLIC` on community route and avoid adding auth checks.

Step E — Verification
- Typecheck/lint/build.
- Manual smoke:
  - Community page loads “All” and “Featured” with images lazy loaded.
  - Search returns results; clear search restores prior view.
  - “Try this look” fills generator settings.
  - Admin page (optional) can upload/delete images (if allowlisted) and items appear/disappear in community.

Files Expected to Change
- `components/community/CommunityItem.tsx` — switch to AppImage, keep overlay actions.
- (Optional) `components/community/CommunityCollection.tsx` — minor spacing/props cleanups.
- (Optional) `libs/services/community.ts` — clamp limits and validate search string.

Risks & Rollback
- Visual differences when switching to AppImage (loader overlay); verify visually.
- Public caching of search results is conservative; TTL is short via `PUBLIC` config; acceptable for MVP.

Acceptance Checklist (Phase 7)
- [ ] Community UI uses AppImage; lazy images; no layout shift.
- [ ] Public API remains read‑only with public cache headers.
- [ ] Admin endpoints strictly allowlisted and server‑side; no leakage.
- [ ] No route→repo imports; normalized responses.

Result (to fill on completion)
- Date:
- Branch/Commit:
- Summary of changes:
- Verify logs:
- Notes:

