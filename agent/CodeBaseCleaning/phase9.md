# Phase 9 — Performance & Build Health (Plan)

Purpose
- Drive p95 responsiveness and keep builds clean with zero warnings, without adding complexity. Trim unused deps, tighten image and API behavior, and remove Crisp. All changes are additive, minimal, and align with our route → service → repo boundaries and RLS posture.

Scope (What’s Included)
- Build health: zero Next.js warnings; small, lean bundles; no dead deps.
- Images: correct Next Image configuration; stable, lazy-loading UX; predictable CDN behavior.
- API/cache: sensible cache headers via existing helpers; no N+1; keep queries index-friendly.
- Upstream safety: timeouts + limited retries (already present); leave as-is unless noted.
- De-bloat: remove Crisp and other unused/heavy deps.

Non‑Goals
- No feature additions, no new UI widgets, no server actions, no schema changes.
- No introduction of new libraries unless they clearly replace/remove something heavier.

Definition of Done
- npm run build emits zero warnings.
- No route or component introduces N+1 or direct DB calls; existing guards stay green.
- Image domains configured correctly; grids render smoothly with lazy-loading and without layout shift.
- Crisp fully removed (code, config, deps) and no references remain.
- Unused heavy packages removed; install size reduced.
- Verify scripts updated; team can run one command to check Phase 9 compliance.

---

Current State (Quick Audit Summary)
- Images: Next Image configured; remotePatterns use wildcards that may not match all subdomains reliably; AppImage wrapper ensures lazy + blur.
- API: list/search endpoints batch variant lookups; cache helpers used (AUTH/SHORT/MEDIUM/PUBLIC); dynamic='force-dynamic' on private routes.
- Upstream: Replicate client has 3 retries + backoff; asset downloads have 20s timeout + retries.
- Deps: crisp-sdk-web, axios, @mdx-js/*, @next/mdx, react-hot-toast, react-syntax-highlighter, @types/mdx, @types/mongoose appear unused.
- Crisp: No active usage in components; config has crisp section; comment mentions Crisp in Layout but no actual integration.

---

Implementation Plan (Step‑by‑Step)

Step A — Zero Build Warnings (Next/Image tweaks)
1) next.config.js
   - Fix image domain globs for host matching:
     - Replace `hostname: '*.supabase.co'` → `hostname: '**.supabase.co'`.
     - Replace `hostname: '*.replicate.delivery'` → `hostname: '**.replicate.delivery'`.
   - Consider removing `contentDispositionType: 'attachment'` to avoid unintended download headers; default inline is preferable for perf/UX.
2) Run `npm run build`; capture and address any remaining warnings.

Step B — Remove Crisp (code + config + deps)
1) Remove Crisp dependency:
   - Delete `crisp-sdk-web` from package.json dependencies.
2) Remove Crisp config:
   - In `config.ts`, remove the entire `crisp` block.
   - Ensure support fallback remains via `config.resend.supportEmail` (already used in `app/error.tsx`).
3) Code references cleanup:
   - Update comments in `app/layout.tsx` and `components/LayoutClient.tsx` to drop Crisp mention.
   - Grep to ensure no leftover references:
     - `rg -n "crisp|Crisp|crisp-sdk-web"` across repo returns 0 occurrences after changes.
4) Verify build and run a quick smoke of pages relying on config (no runtime errors).

Step C — Trim Unused/Heavy Packages (reduce install/build time)
1) Remove unused deps from package.json:
   - `axios` (unused; we use native fetch in libs/api/http)
   - `react-hot-toast` (we use sonner)
   - `@mdx-js/loader`, `@mdx-js/react`, `@next/mdx` (not configured/used)
   - `react-syntax-highlighter` and `@types/react-syntax-highlighter` (not used; blog uses plain <pre>)
   - `@types/mdx` (not used)
   - `@types/mongoose` (not used)
2) Reinstall to validate lock shrink.
3) Build again to confirm no import errors and improved build logs.

Step D — Client Bundle Hygiene (light guardrails)
1) Add a Phase 9 verify script `verify:phase9` that runs:
   - `npm run build` and fails on warnings (via Next’s output or a simple grep of “Warning:”).
   - Grep blocks for unintended imports in client bundles:
     - `components|app/(app)/**` importing removed packages (`axios`, `react-hot-toast`, `react-syntax-highlighter`, `crisp-sdk-web`).
2) Keep existing Phase 0 guards; do not duplicate logic.

Step E — Images: Discipline + CDN behavior
1) Confirm AppImage keeps lazy-loading + no layout shift (already true). No code change.
2) Ensure sizes strings on grid components are reasonable (already set). No code change.
3) Confirm storage outputs are `.jpg` and public (already enforced in assets service).

Step F — API Perf Sanity
1) Renders list/search
   - Ensure count query only runs on first page (already implemented).
   - Keep `getVariantsByRenderIds` batching; avoid per-item variant lookups (already implemented).
2) Community endpoint
   - Continue using `CACHE_CONFIGS.PUBLIC` with short TTL; clamp search length (already clamped to 100 chars).
3) Usage endpoint
   - Keep `CACHE_CONFIGS.AUTH`; avoid heavy joins.

Step G — Optional small tunings (execute only if warnings persist)
1) Remove `minimumCacheTTL` if Next warns about it or it’s unnecessary.
2) Ensure no stray console warnings from third-party libs; if any, adjust minor config or replace with native APIs.

---

Files Expected to Change
- next.config.js (image domains; optionally remove contentDispositionType)
- package.json (remove crisp-sdk-web, axios, mdx stack, react-hot-toast, react-syntax-highlighter, unused @types)
- config.ts (remove crisp block)
- app/layout.tsx, components/LayoutClient.tsx (comment cleanup only)
- scripts (add `verify:phase9`)

Verification Checklist
- Build
  - [ ] `npm run build` passes with zero warnings.
  - [ ] `npm run verify:phase0` still passes.
  - [ ] `npm run verify:phase9` passes and reports no forbidden imports.
- Runtime
  - [ ] Dashboard pages render; images lazy-load; no layout shift.
  - [ ] Community loads with PUBLIC cache and proper images.
  - [ ] Renders API returns quickly; “Load more” works.
- Crisp removal
  - [ ] No Crisp references in code/config.
  - [ ] Build size/install time improved (lockfile diff smaller).

Risks & Rollback
- Removing deps can surface latent imports. Mitigation: remove in small batches and build after each change.
- Image domain changes must match actual hosts; validate URLs in dev after change.
- Changing content disposition: if any downstream relies on attachment headers, revert that single key.

Notes
- Keep changes surgical. Do not touch migrations, DB schema, or RLS. No Server Actions.
- If future bundle analysis is needed, add it behind an npm script (no default analyzer in CI to keep things light).

Result (to fill on completion)
- Date:
- Branch/Commit:
- Build warnings before → after:
- Deps removed and size delta:
- Notes:

