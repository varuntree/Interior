# CHANGE SPEC — ShipFast (Strict Format)

> The code agent MUST follow this exact structure. Be explicit and conservative. Do not assume. Do not delete existing files unless instructed.

## 1) Title
Short imperative summary, e.g., "Add v1 endpoint for invoices.create".

## 2) Scope
- What we will add/change.
- What we will NOT touch.

## 3) Do-Not-Touch List (repeat from handbook §0)
- Keep these files intact:
  - app/layout.tsx, app/page.tsx, app/error.tsx, app/not-found.tsx
  - app/signin/**/*, app/dashboard/**/*, app/blog/**/*, app/privacy-policy/page.tsx, app/tos/page.tsx
  - app/api/auth/callback/route.ts
  - app/api/stripe/create-checkout/route.ts
  - app/api/stripe/create-portal/route.ts
  - app/api/webhook/stripe/route.ts
  - middleware.ts, config.ts, components/**/*, libs/**/*, types/**/*

## 4) File Operations (explicit)
List every new/modified file with absolute repo‑relative path. No deletions unless explicitly listed.

### 4.1 Add
- `app/api/v1/<domain>/<action>/route.ts`  
  - Content: (paste full file content)
- `libs/services/<domain>.ts` (if newly added)  
  - Content: (paste full file content)
- `libs/repositories/<entity>.ts` (if newly added)  
  - Content: (paste full file content)
- `migrations/phaseX/NNN_<name>.sql` (if needed)  
  - Content: (paste full SQL)
- (any storage helpers under `libs/storage/*` as needed)

### 4.2 Modify
- (If bridging a legacy route) `app/api/stripe/create-checkout/route.ts`  
  - Change: Re-export POST from `app/api/v1/billing/checkout/route.ts`.  
  - Do not change any other lines.
  - Patch: (show unified diff or full new content)

> **Never** modify files not listed here.

## 5) Implementation Notes
- Validation with Zod in route.
- Use `withMethods`, `ok()/fail()` helpers.
- Use `createServiceSupabaseClient()` (non-admin) in services.  
- Do not use Server Actions or direct DB calls in routes.

## 6) Post‑Apply Checks (agent must run)
1. `npm run build` passes.
2. Hitting the new endpoint with valid/invalid payload returns normalized JSON.
3. Grep checks:
   - `grep -R "use server" app libs` → 0
   - `grep -R "createServerClient" components` → 0
   - `grep -R "service_role" app components` → 0
4. Existing guardrail routes/pages still reachable:
   - `/` (home), `/signin`, `/dashboard`, `/privacy-policy`, `/tos`, `/blog`.
5. Legacy Stripe routes still respond (if bridged).

## 7) Rollback Plan
- Remove added files.
- Revert modified files to previous content (paste backup content here).
- Confirm `npm run build` still passes.