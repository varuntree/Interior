# Phase 6 — Collections (Vertical Slice 3)

Purpose
- Make the Collections vertical consistent with the Renders vertical, both in API/service performance and in UI component reuse. Reuse centralized components for render tiles/cards, remove N+1 patterns, keep contracts normalized, and preserve MVP scope.

Scope (What’s Included)
- API: Collections list, detail, and items add/remove; retain normalized responses and auth rules.
- Services/Repos: Batch data access for cover images (avoid N+1), idempotent add/remove, owner-scoped via RLS.
- Frontend: 
  - Collections List page (overview): minimal adjustments.
  - Collections Detail page (items grid): reuse the same centralized render card/image components used by “My Renders”.
  - Optional simple pagination for items (Load more).
- No new features beyond consistency, performance, and reuse.

Non‑Goals
- No redesign of flows, no admin UI changes.
- No server‑side FTS; keep search out of Collections for MVP.
- No change to existing API contracts beyond internal improvements and optional item pagination.

Current State (Audit Summary)
- API routes (normalized; withMethods/ok/fail in place):
  - `GET /api/v1/collections` — ensures default favorites; returns collections with itemCount.
  - `POST /api/v1/collections` — create collection.
  - `GET|PATCH|DELETE /api/v1/collections/:id` — read/rename/delete.
  - `GET|POST /api/v1/collections/:id/items` — list items (offset/limit; MVP), add items (single or batch). Special case `:id = 'favorites'` uses favorites path.
  - `DELETE /api/v1/collections/:id/items/:renderId` — remove item.
- Services (libs/services/collections.ts):
  - ensureDefaultFavorites, listUserCollections (counts by loading items), create/rename/delete, add/remove, batchAddToCollection, getCollectionWithItems.
  - getCollectionWithItems: queries collection_items with joined renders, then for each item fetches cover variant image (per‑item query) → N+1 risk.
- Repositories (libs/repositories/collections.ts):
  - CRUD collections and items; verifyRenderIds; getFavoritesMembership.
- UI:
  - Collections list page: app/(app)/dashboard/collections/page.tsx (Card‑based listing; fine).
  - Collection detail page: app/(app)/dashboard/collections/[id]/page.tsx renders each item with inline Card + next/image directly (not AppImage/RenderCard).
  - Renders vertical uses centralized components: components/renders/RenderCard.tsx and components/shared/Image.tsx (AppImage) with lazy loading.
- Hooks:
  - useCollections (list) and useCollectionDetail (detail) – detail returns all items up to a limit; no pagination, no component reuse with Renders.

Gaps To Close in Phase 6
- Eliminate N+1 cover lookup in getCollectionWithItems by batching variant fetches for all item renderIds.
- Reuse centralized render components in collections detail grid:
  - Replace inline Card + next/image with `RenderCard` + `AppImage` (consistent UX and lazy loading).
  - Ensure actions align: open render, remove from collection; optional toggle favorite and add‑to‑collection dialog for parity.
- Optional: add “Load more” pagination to collection items for large collections (align with Renders grid behavior).
- Keep contracts and security posture; maintain idempotency of add/remove.

Outcomes (Definition of Done)
- Collections detail grid uses the same visual components and image wrapper as the Renders grid; lazy loading and no layout shift.
- getCollectionWithItems does not perform per‑item variant queries; uses a single batch fetch to resolve cover image URLs.
- Collections list still loads quickly with accurate counts; no heavy queries or N+1.
- Optional: Load more pagination works on collection items with stable cursor/offset behavior.

---

Implementation Plan (Step‑by‑Step)

Step A — Repository Utilities (Batch Variants)
- Reuse `libs/repositories/renders.getVariantsByRenderIds(renderIds)` added in Phase 5.
- If needed, add a thin helper that selects only cover variants for each renderId+cover_idx pair (optional; batch all variants is acceptable for MVP).

Step B — Service: getCollectionWithItems (Remove N+1)
- Current: joins render basic fields, then for each item queries `render_variants` to get the cover image path.
- Update flow:
  1) Read `collection_items` joined with `renders` (as it does today), collect the `renderIds`.
  2) Batch fetch variants for `renderIds` using `getVariantsByRenderIds`.
  3) Build a map by renderId and pick the `idx === cover_variant` entry.
  4) Build image URLs via public bucket (consistent with Renders service).
  5) Return items with `cover_image_url` populated without N+1.
- Keep owner checks and RLS assumptions as is.

Step C — Service: listUserCollections efficiency (Advisory)
- Today: lists collections, then calls `listCollectionItems` per collection to compute counts → potential N+1 for many collections. For MVP volumes, this is acceptable; if needed, add an aggregated count query later. For Phase 6, leave as is unless it becomes a bottleneck.

Step D — UI Component Reuse (Collections Detail)
- Create a small adapter in the page (or a helper) that maps the collection item shape to `RenderCard` props.
- Replace inline Card + next/image with `RenderCard` using `AppImage` under the hood.
- Actions mapping:
  - onOpen → push(`/dashboard/renders/${id}`)
  - onDelete → remove from collection (existing removeItem hook)
  - onToggleFavorite → call `/api/v1/favorites/toggle` (optional, parity with Renders)
  - onAddToCollection → open `CollectionPickerDialog` (optional)
- Keep accessibility: aria labels, focus states come from `RenderCard`.

Step E — Optional Pagination for Items
- Add pagination handling in `useCollectionDetail` (cursor or offset), similar to `useRenders`:
  - Track `nextCursor`/`hasMore` (if we keep offset, track `offset` and compute hasMore from total).
  - Expose `fetchMore()` to append items.
- Update `GET /collections/:id/items` route to support cursor in future; for MVP use offset/limit (already supported) and add a “Load more” button.

Step F — Consistency & UX
- Use shared toast helpers where present (Toast.ts) for success/error.
- Keep `AppImage` sizes and lazy loading consistent with renders grid.
- Ensure copy and badges align with existing design tokens.

Step G — Verification
- Typecheck/lint/build.
- Manual smoke:
  - Collections list loads; create/rename/delete work.
  - Favorites collection opens; items render with lazy images; remove works.
  - (If implemented) Toggle favorite and add to collection work from the detail grid.
  - (If implemented) Load more appends items without layout shift.

---

Files Expected to Change
- `libs/services/collections.ts`
  - Update `getCollectionWithItems` to batch cover variant lookup using `renders.getVariantsByRenderIds`.
- `app/(app)/dashboard/collections/[id]/page.tsx`
  - Replace inline Card/next/image with `RenderCard` component and reuse centralized actions.
  - Optionally add `CollectionPickerDialog` and favorite toggle for parity.
- `hooks/useCollectionDetail.ts`
  - Optionally add pagination state (`hasMore`, `nextCursor` or `offset`) and `fetchMore`.
- (Optional) `components/renders/RenderCard.tsx`
  - If needed, allow an alternate “remove” action label or expose a prop to customize the destructive action.

Risks & Rollback
- Swapping UI components may reveal slight styling differences; we’ll validate visually.
- Batch variant fetch can increase payload in large collections; limit page size or only fetch cover idx if needed.
- If pagination is deferred, keep current behavior; changes remain minimal and easy to revert.

Acceptance Checklist (Phase 6)
- [ ] Collections detail grid uses `RenderCard` and `AppImage` (centralized components).
- [ ] No N+1 variant lookups in `getCollectionWithItems` (batch fetch).
- [ ] Add/remove operations remain idempotent and owner‑scoped.
- [ ] (Optional) Items pagination works and matches Renders UX.
- [ ] Normalized API responses and headers remain consistent.

Result (to fill on completion)
- Date:
- Branch/Commit:
- Summary of changes:
- Verify logs:
- Notes:

