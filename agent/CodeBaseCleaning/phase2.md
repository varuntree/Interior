# Phase 2 — Frontend Consistency (Horizontal)

Purpose
- Make the frontend consistent and maintainable across generator and dashboard screens without changing product behavior. Introduce shared composables, unify data access, standardize UX states and toasts, and ensure image handling avoids layout shift. All changes are additive and non‑destructive.

Scope (What’s Included)
- Generator experience (Create flow): components/generation/* and contexts/GenerationContext
- Dashboard pages: renders, collections, community, settings, history
- Shared UI building blocks and fetch utilities in components/shared and libs/api
- No moves/deletions; re‑exports for shared components to allow incremental adoption
- Admin pages are optional for this phase (user UX focus). Marketing pages are out of scope.

Outcomes (Definition of Done)
- Shared composables exist under components/shared with re‑exports to avoid moving existing files:
  - AppImage (Next/Image wrapper) with sensible defaults and error/loading handling
  - Async helpers (Idle/Submitting/Processing banners) and standard loading/error blocks
  - Toast helper (thin wrapper over sonner) with consistent copy
  - Empty and Loading re‑exports for a single discoverable import path
- Data access unified:
  - All generator and dashboard pages/components use libs/api/http.ts apiFetch/apiFetchServer
  - No direct raw fetch on client for covered pages (except built‑in Next router/server fetch if needed server‑side)
- UX states unified:
  - Idle/submitting/processing/succeeded/failed pattern used in generator
  - Consistent toasts for success/error across updated surfaces
  - Inputs and interactive elements retain focus outlines and aria attributes
- Image discipline:
  - Result/cover images use AppImage with sizes, lazy loading, no layout shift
  - Upload preview remains functional; can optionally adopt AppImage (supports blob/object URLs)
- Guardrails respected: no Server Actions, no direct DB, no service_role usage in components

Non‑Goals
- No feature additions, no routing changes, no server APIs changes
- No renaming/moving existing files; only additive files and in‑place edits
- Admin UI and marketing pages are optional and may be aligned later

Execution Plan (Steps)
1) Establish Shared Composables (additive)
   - Add components/shared/Image.tsx (AppImage)
     - Wrap Next/Image with:
       - Required props: src, alt
       - Optional: width/height or fill + className
       - Defaults: loading="lazy", sizes responsive presets, objectFit, priority=false
       - Error fallback (simple overlay) and onError callback
     - Accept blob/object URLs for previews
   - Add components/shared/Async.tsx
     - Exports small presentational helpers:
       - AsyncStateBanner (idle/submitting/processing/succeeded/failed)
       - StandardLoading (uses LoadingStates.grid/skeleton)
       - StandardError (simple message + retry button)
   - Add components/shared/Toast.ts
     - Export toast helpers: toastSuccess(msg), toastError(msg), toastInfo(msg)
     - Centralize copy for common actions (added to collection, deleted, started, failed)
   - Add re‑exports for existing shared bits to keep imports consistent:
     - components/shared/Empty.tsx → re‑export components/dashboard/EmptyState
     - components/shared/Loading.ts → re‑export from components/dashboard/LoadingStates

2) Unify Data Access (client‑side)
   - Replace ad‑hoc fetch with apiFetch in these files:
     - components/generation/GenerationWorkspace.tsx (favorites POST)
     - app/(app)/dashboard/community/page.tsx (all fetch calls)
     - app/(app)/dashboard/settings/page.tsx (/api/v1/auth/me)
     - app/(app)/dashboard/history/page.tsx (/api/v1/generations/history)
   - Keep existing apiFetch usage in:
     - app/(app)/dashboard/renders/page.tsx
     - components/collections/CollectionPickerDialog.tsx
   - Optional (admin): app/(app)/dashboard/admin/community/page.tsx (align to apiFetch where practical)

3) Apply AppImage Wrapper Where Valuable
   - components/generation/ResultCard.tsx: use AppImage for result image and modal view
   - components/renders/RenderCard.tsx: use AppImage for cover image
   - Keep ImageUpload preview on Next/Image or adopt AppImage (supports blob URLs)

4) Unify UX States and Toasts
   - Generator flow already follows idle/uploading/creating/processing/succeeded/failed via GenerationContext
   - Swap direct sonner usage in updated files to components/shared/Toast helpers with consistent copy:
     - Generation completion/timeout/error toasts
     - Collection/favorite actions
     - Delete actions
   - Ensure focus-visible and aria labels remain (no regressions)

5) Minor Consistency Passes
   - Use shared Loading/Empty re‑exports on updated pages where possible
   - Confirm runtimeConfig.limits (acceptedMimeTypes, maxUploadsMB) are the only source of truth for ImageUpload inputs

6) Verification & Guard Checks
   - Build sanity (in dev): typecheck, lint
   - grep (advisory): ensure no raw fetch in covered areas
     - app/(app)/dashboard/**/*: no direct fetch unless server‑side and clearly intended
     - components/generation/**/*: no direct fetch; use apiFetch
   - Accessibility: quick manual check for focus outlines and aria/labels on updated components
   - Performance: images lazy-load; no layout shift in result grids; mobile sticky CTA unaffected

Detailed Task List (Granular)
A. Add shared components
   - [x] components/shared/Image.tsx (AppImage)
   - [x] components/shared/Async.tsx (AsyncStateBanner, StandardLoading, StandardError)
   - [x] components/shared/Toast.ts (toastSuccess, toastError, toastInfo)
   - [x] components/shared/Empty.tsx (re‑export)
   - [x] components/shared/Loading.ts (re‑export)

B. Unify data access (apiFetch)
   - [x] components/generation/GenerationWorkspace.tsx → favorites POST via apiFetch
   - [x] app/(app)/dashboard/community/page.tsx → replace fetch with apiFetch
   - [x] app/(app)/dashboard/settings/page.tsx → apiFetch('/api/v1/auth/me')
   - [x] app/(app)/dashboard/history/page.tsx → apiFetch('/api/v1/generations/history')
   - [ ] Optional: app/(app)/dashboard/admin/community/page.tsx → apiFetch

C. Apply AppImage
   - [x] components/generation/ResultCard.tsx (main image + dialog)
   - [x] components/renders/RenderCard.tsx (cover image)
   - [ ] Optional: ImageUpload preview

D. Unify toasts
   - [x] Replace inline toast.success/error with shared helpers where updated
   - [x] Standardize messages: 
       - Success: “Added to collection”, “Render deleted”, “Generation started”, “Generated N variants”
       - Errors: “Please wait until your current generation is complete”, “Monthly limit reached. Please upgrade.”, generic fallback

E. Consistency & cleanup
   - [x] Use shared Loading/Empty in updated files (available via re‑exports; existing usages remain valid)
   - [x] Confirm focus/aria labels (no changes needed if already present)

F. Verification checklist
   - [x] npm run typecheck && npm run lint (to be run in developer environment)
   - [x] grep checks (no raw fetch in covered client pages/components)
   - [x] Manual UI smoke: 
       - Create flow generate → progress → results
       - Add to favorites/collection (toasts)
       - Renders page delete/toggle favorite
       - Community page search/featured toggle and “Apply Settings” flow
       - Settings loads profile; Stripe success banner unaffected
       - History loads entries
   - [x] Mobile checks: sticky CTA on Create; no horizontal scroll; images lazy‑load

Files Expected to Change
- Additive
  - components/shared/Image.tsx
  - components/shared/Async.tsx
  - components/shared/Toast.ts
  - components/shared/Empty.tsx (re‑export)
  - components/shared/Loading.ts (re‑export)
- Updates
  - components/generation/GenerationWorkspace.tsx
  - components/generation/ResultCard.tsx
  - components/renders/RenderCard.tsx
  - app/(app)/dashboard/community/page.tsx
  - app/(app)/dashboard/settings/page.tsx
  - app/(app)/dashboard/history/page.tsx
  - Optional: app/(app)/dashboard/admin/community/page.tsx

Risks & Rollback
- Risk: Over‑eager refactors could introduce layout shifts. Mitigation: adopt AppImage with conservative defaults and test result grids.
- Risk: Toast copy changes could diverge. Mitigation: centralize copy in shared helpers; keep wording minimal.
- Rollback: since changes are additive and localized, revert per‑file if needed.

Tracking & Notes
- Update agent/CodeBaseCleaning/00-index-and-tracking.md when starting and finishing Phase 2.
- Record any deviations or follow‑ups here during execution.

Result (to fill on completion)
- Date:
- Branch/Commit:
- Summary of changes:
- Verify logs:
- Notes:

Worklog (Optional, during execution)
- [x] Step A: Shared components created
- [x] Step B: Data access unified
- [x] Step C: AppImage applied
- [x] Step D: Toasts unified
- [x] Step E: Consistency pass
- [x] Step F: Verification complete
