# Handbook — QuickDesignHome Engineering Guide (Single Source of Truth)

Note: For a summary of the Phase 11 documentation refresh aligning specs with current implementation, see `ai_docs/docs/phase11-doc-refresh.md`.

This handbook defines **how this repo works**, the **non‑negotiable rules**, and the **golden path** your code agent MUST follow.

---

## 0) DO NOT TOUCH (Guardrails)

**Never delete, rename, or move** these existing files/routes. Add new files alongside them only.

- `app/layout.tsx`, `app/page.tsx`, `app/error.tsx`, `app/not-found.tsx`
- `app/signin/layout.tsx`, `app/signin/page.tsx`
- `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`
- `app/privacy-policy/page.tsx`, `app/tos/page.tsx`
- `app/blog/**/*` (layout, pages, dynamic article/author/category)
- `app/api/auth/callback/route.ts`
- `app/api/stripe/create-checkout/route.ts`
- `app/api/stripe/create-portal/route.ts`
- `app/api/webhook/stripe/route.ts`
- `middleware.ts`, `config.ts`, `tailwind.config.js`, `components/**/*`, `libs/**/*`, `types/**/*`

> Additions must be non-destructive: **never** remove these, **never** inline‑modify their behavior unless explicitly specified in a change spec.

---

## 1) Golden Path (High-Level Flow)

**Page/Component → API Route (Route Handler) → Service → Repository → DB**

```
UI (server/client)
|
v
/app/api/v1/.../route.ts  (validation + orchestration only)
|
v
libs/services/<domain>.ts (business logic; composes repos + SDKs)
|
v
libs/repositories/<entity>.ts (DB access with Supabase client)
|
v
Supabase (RLS on, server or admin client as allowed)
```

**Absolutely NO Server Actions.**  
**Absolutely NO direct DB calls from components (client or server).**  
**All reads/writes go through API route → service → repository.**

---

## 2) Non‑Negotiable Decisions

- **Package manager**: `npm` only.
- **Data edge**: **Route Handlers** only (`app/api/**/route.ts`). No Server Actions.
- **Auth**: Supabase (Google OAuth in UI). Middleware refresh only.
- **DB**: Supabase. Access via **pure function repositories** only.
- **Payments**: Stripe via services + webhooks. Admin client **webhook only**.
- **Storage**: Supabase Storage via storage helpers (no direct service role outside webhooks).
- **Rendering**: Keep simple. Marketing pages can be static. Private pages use server components with redirect guards; data still fetched via API.
- **UI**: Tailwind (design tokens in `app/globals.css`) + shadcn/ui. No DaisyUI.
- **Migrations**: Files‑only until explicit approval.
- **Testing**: Minimal (typecheck + smoke). No CI/CD for now.

---

## 3) Architecture Boundaries

### Clients
- **Browser client** (no secrets).  
  - Allowed: Supabase Auth client for OAuth/magic link UI.  
  - NOT allowed: direct reads/writes of app data — use API.
- **Server SSR** (standard server client).  
  - Use for **auth checking/redirects only** in layouts. Data via API.
- **Admin (service‑role client)**: **webhooks only** (e.g., Stripe). Never in UI or general APIs.

### API versioning
- New endpoints live under: `app/api/v1/<domain>/<action>/route.ts`.
- Legacy paths (like `/api/stripe/create-checkout`) remain but should **delegate** to v1 (thin re-export or internal call). **Do not delete legacy routes** without explicit change spec.

---

## 4) API Standard

**Route handler responsibilities:**
- Validate input with Zod.
- Enforce method with `withMethods(['GET'|'POST'|...])`.
- Call a **service** (not repositories directly).
- Return **normalized JSON** via response helpers.

**Do:**
- `Cache-Control: private, no-store` by default.
- Map known error types to HTTP codes in one place.
- Keep business logic out of routes.

**Don't:**
- Don't call Supabase directly from routes (except auth read of session if needed). Use services.
- Don't throw raw errors to the client.

**Response shape (contract):**
```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
  message?: string
}
```

---

## 5) Services Standard (Business Logic)

* File: `libs/services/<domain>.ts` or `libs/services/<domain>/<topic>.ts`.
* **Pure functions**, no classes. Stateless. No global singletons.
* Accept a standard context (e.g., `{ supabase: SupabaseClient }`) plus typed args.
* Compose repositories, call Stripe SDK, apply business rules.
* **Do not** perform input validation here (assume API already validated).

Example signature:
```ts
export async function createCheckoutService(
  ctx: { supabase: SupabaseClient },
  args: { priceId: string; mode: 'payment'|'subscription'; successUrl: string; cancelUrl: string }
): Promise<{ url: string }> { /* ... */ }
```

---

## 6) Repositories Standard (DB Access)

* Folder: `libs/repositories/`
* One file per entity: `profiles.ts`, `invoices.ts`, etc.
* **Pure functions** only; accept a `SupabaseClient`.
* No HTTP calls. No services logic.

Examples:
```ts
export async function getProfile(supabase: SupabaseClient, id: string) { /* ... */ }
export async function updateProfile(supabase: SupabaseClient, id: string, patch: Partial<Profile>) { /* ... */ }
```

**Never** auto-detect client type (`if (typeof window) ...`); caller passes the correct client.

---

## 7) Auth Rules (Supabase)

* Middleware (`middleware.ts`) refreshes session via `libs/supabase/middleware`.
* Private pages (e.g., `/dashboard/*`) gate at **layout** with server client:
  * If no user → redirect to `config.auth.loginUrl`.
* UI **can** use Supabase Auth client for **login flows only** (e.g., Google OAuth, magic link).
  All app data reads/writes use API routes.

---

## 8) Storage Rules (Supabase Storage)

* Buckets: prefer two patterns
  * `public` (read-anyone; authenticated writes)
  * `private` (owner‑scoped via RLS)
* Access via storage helpers in `libs/storage/*` (upload, getSignedUrl).
* Path convention: `${userId}/<feature>/<fileName>`.
* Never expose service role keys outside webhooks.

---

## 9) Config & Env Contract

* **App config** is centralized in `config.ts`. It must contain only **non-secret** app settings:
  * `appName`, `appDescription`, `domainName`
  * `colors.main`
  * `auth.loginUrl`, `auth.callbackUrl`
  * Stripe plans metadata (non‑secret)
  * Resend identifiers (non‑secret)
* **Secrets** are env only (`.env.local`), never imported in client code:
  * `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  * `SUPABASE_SERVICE_ROLE_KEY`
  * `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public but still env)
* Optional: a `libs/env.ts` that `zod`-parses required env on server start and throws fast (recommended).

---

## 10) Migrations Workflow (Files‑Only)

* Create SQL files under `migrations/phaseX/NNN_<name>.sql`.
* Do not apply automatically. Human approval required before apply.
* Aim for idempotent, small steps. Include RLS policy statements.

**Profiles baseline (example):**
```sql
-- table
create table if not exists public.profiles (
  id uuid primary key,
  email text unique,
  customer_id text,
  price_id text,
  has_access boolean default false,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "profiles_self_select"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_self_update"
on public.profiles for update
using (auth.uid() = id);
```

---

## 11) Security & Minimal Testing

* Default API headers: `Cache-Control: private, no-store`; `Content-Type: application/json`.
* Service role usage is limited to webhooks only (`app/api/webhook/**`).
* Never import `next/navigation`'s `redirect` in code that can run in the browser (e.g., axios interceptors). If a 401 happens in the browser, use `window.location.href = config.auth.loginUrl`.

**Minimal checks (required before merge):**
* Typecheck and build pass: `npm run build`.
* Grep for forbidden patterns:
  * `grep -R "use server" app libs` → **must be 0** (we don't use Server Actions).
  * `grep -R "createServerClient" components` → **must be 0** (no DB from components).
  * `grep -R "SupabaseClient(" app/components` → **must be 0** except auth UI flows.
  * `grep -R "service_role" app components` → **must be 0** (admin keys only in webhooks).
* All v1 routes return normalized shape `{ success: boolean, ... }`.

---

## 12) Rendering Policy (Keep It Simple)

* **Marketing/public pages**: static (default). No data fetch or fetch via API with no-store.
* **Private pages**: server component layout guard + UI invokes API for data.
* **Caching**: default to non‑cached API responses; add caching only when explicitly needed.

---

## 13) Naming & Organization

* **API**: `app/api/v1/<domain>/<action>/route.ts` (lowercase kebab).
  Legacy re-exports live under previous paths when required.
* **Services**: `libs/services/<domain>.ts` (or subfile per topic).
* **Repositories**: `libs/repositories/<entity>.ts`.
* **Storage**: `libs/storage/<feature>.ts`.
* **UI**:
  * `components/ui/*` → shadcn components (library)
  * `components/*` → app-specific components (ButtonSignin, Footer, Theme*…)
* **Types**: `types/*`.

---

## Repo‑wide Verification Checklist (Run After Any Changes)

1. ✅ **No deletions/renames** of the guardrail files (see section 0).
2. ✅ `npm run build` passes without warnings/errors.
3. ✅ All new APIs live under `app/api/v1/**` and return normalized JSON.
4. ✅ Services call repositories; routes call services (never repos directly).
5. ✅ No Server Actions; no direct DB calls from components.
6. ✅ No admin/service-role usage outside `app/api/webhook/**`.
7. ✅ `config.ts` unchanged except for allowed keys; secrets stay in env.
8. ✅ Grep checks in section 11 return **0** forbidden matches.
9. ✅ Private pages still redirect unauthenticated users to `config.auth.loginUrl`.
10. ✅ Legacy routes (Stripe create‑checkout/portal) still work.
