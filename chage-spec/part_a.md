Below is **Phase A — Change Spec (Part A)**.
It’s written **for an AI code agent**. Every step is explicit and scoped to your current repo. Nothing is left to interpretation.

> **Ground rules for the agent**
>
> 1. **Never delete** existing routes or pages unless the instruction explicitly says “delete”.
> 2. When we “move under a route group”, **do not change URL paths**—Next.js route groups in parentheses do not affect the URL.
> 3. **Only npm** is allowed (no yarn/pnpm).
> 4. **No Server Actions**. Use **Route Handlers** (`app/**/route.ts`) as the only backend surface.
> 5. **All data access must go through our API** (Route Handlers). **Do not** query Supabase directly from Server Components (except the global middleware refresh function).
> 6. Keep `app/blog`, `app/privacy-policy`, `app/tos`, `app/dashboard`, `app/signin` pages **working exactly as before** after the refactor (same URLs).
> 7. Do **not** remove Stripe or webhook code in this part.

---

## Phase A – Part A (Change Spec)

### 0) What we are changing in Part A (scope)

* **Repository layout**: introduce **route groups** to separate public “marketing” pages from the authenticated app, **without changing URLs**.
* **Env & config hygiene**: add runtime env validation and correct aliases.
* **Supabase clients**: clarify and enforce where to use **browser**, **server/SSR**, and **admin** clients.
* **API standard library**: add a tiny, centralized API utility layer (responses, errors, wrappers).
* **Data fetching rule**: server/client code must call **internal API** (Route Handlers), not Supabase directly.
* **HTTP helper**: replace ad‑hoc Axios client with a tiny `fetch` wrapper usable on both server and client.
* **Auth guard**: route-guard the Dashboard **via an API endpoint** instead of directly reading Supabase in a Server Component.
* **UI organization (light touch)**: create a small `components/common` area and update imports.
* **No SEO changes**. **No rate limiting**. **No testing expansion** yet.

Where relevant, choices align with official guidance from **Next.js App Router (Route Handlers, caching & dynamic settings)** and **Supabase SSR with `@supabase/ssr`**. ([Next.js][1], [Supabase][2])

---

### 1) Introduce route groups to separate public vs. app (no URL change)

**Purpose**: Keep URLs identical while organizing code. In Next.js App Router, folders in parentheses are *ignored* in the URL, so this is safe. ([Next.js][3])

**Create two folders**:

* `app/(marketing)/`
* `app/(app)/`

**Move files/folders exactly as follows (preserve file contents):**

* `app/page.tsx` → `app/(marketing)/page.tsx`
* `app/signin/**` → `app/(marketing)/signin/**`
* `app/blog/**` → `app/(marketing)/blog/**`
* `app/privacy-policy/page.tsx` → `app/(marketing)/privacy-policy/page.tsx`
* `app/tos/page.tsx` → `app/(marketing)/tos/page.tsx`
* `app/dashboard/**` → `app/(app)/dashboard/**`

> **Do not move or delete** any of these assets in `/app`:
> `favicon.ico`, `icon.png`, `apple-icon.png`, `opengraph-image.png`, `twitter-image.png`, `globals.css`, `layout.tsx`, `error.tsx`, `not-found.tsx`.
> **Do not** move any paths under `app/api/**` in Part A.

**Add a segment-level layout for marketing routes (optional cache hint):**

* Create `app/(marketing)/layout.tsx` with:

  ```tsx
  export const revalidate = 3600; // allow static regeneration for public pages
  export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }
  ```

  This uses segment config to set a default revalidation policy for public pages. Server-only pages later will opt out using `dynamic = "force-dynamic"`. ([Next.js][4])

**Keep Dashboard dynamic**:

* Ensure `app/(app)/dashboard/page.tsx` still has:

  ```ts
  export const dynamic = "force-dynamic";
  ```

  This keeps the private area dynamic (no full-route cache). ([Next.js][4])

> **Why this is safe**: Route groups are ignored in the URL, so `/signin`, `/blog`, `/privacy-policy`, `/tos`, and `/dashboard` URLs remain unchanged. ([Next.js][3])

---

### 2) Unify *lib* vs *libs* and update aliases

You said we **only want `libs/`**. The repo still contains `lib/utils.ts`.

**Perform these exact changes:**

1. **Move file**:
   `lib/utils.ts` → `libs/utils.ts`

2. **Update imports**:
   Replace all occurrences of

   ```ts
   from "@/lib/utils"
   ```

   with

   ```ts
   from "@/libs/utils"
   ```

3. **Update `components.json` aliases** (file exists):

   ```json
   {
     "aliases": {
       "components": "@/components",
       "utils": "@/libs/utils",
       "ui": "@/components/ui",
       "lib": "@/libs",
       "hooks": "@/libs/hooks"
     }
   }
   ```

   (Add `"hooks": "@/libs/hooks"` only if missing; do not create the folder now.)

4. **Update `tsconfig.json` paths** (edit, don’t replace unrelated settings):

   * Ensure the base alias is present:

     ```json
     {
       "compilerOptions": {
         "baseUrl": ".",
         "paths": {
           "@/*": ["./*"]
         }
       }
     }
     ```

   (If other project-specific paths exist, **keep them**. We only guarantee `@/*`.)

---

### 3) Runtime env validation (server & client)

**Goal**: Fail fast if required env is missing and prevent accidental secret exposure.

1. **Install Zod (npm only)**:

   ```bash
   npm i zod
   ```

2. **Create** `libs/env/index.ts`:

   ```ts
   import { z } from "zod";

   // Public env (exposed to client)
   const publicSchema = z.object({
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
   });

   // Server-only env
   const serverSchema = z.object({
     SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(), // only used in server code (e.g., webhooks)
     STRIPE_SECRET_KEY: z.string().min(1).optional(),
     STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
     RESEND_API_KEY: z.string().min(1).optional(),
   });

   export const env = {
     public: publicSchema.parse({
       NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
       NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
     }),
     server: serverSchema.parse({
       SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
       STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
       STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
       RESEND_API_KEY: process.env.RESEND_API_KEY,
     }),
   };
   ```

3. **Sanitize `.env.example`**
   Replace the hard-coded Supabase project URL/keys with **placeholders**:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   STRIPE_PUBLIC_KEY=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   RESEND_API_KEY=
   ```

   > **Note**: The current file includes real keys. **Do not commit real keys**. Rotate your keys in Supabase after committing this change. (Server-role keys must be kept **server-side only**.) ([Supabase][5])

No changes to `config.ts` content in Part A (we’ll review optionals in Part B).

---

### 4) Supabase clients: enforce where each can be used

We’ll use **three** entry points and centralize them in `libs/supabase/` (these complement the files you already have):

* **Browser client** (client components only): `libs/supabase/client.ts` (**you already have this**)
  Uses `createBrowserClient` with NEXT\_PUBLIC env. No changes here.

* **Server/SSR client** (Route Handlers only): `libs/supabase/server.ts` (**you already have this**)
  Uses `createServerClient` with `cookies()` API for SSR sessions. Keep as-is.
  (This is the officially recommended SSR approach for Next.js App Router.) ([Supabase][2])

* **Admin client** (webhooks, cron, privileged ops only): **Add** `libs/supabase/admin.ts`

  ```ts
  import { createClient } from "@supabase/supabase-js";

  export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  ```

  > Use this **only** in Route Handlers that must bypass RLS (e.g., Stripe webhooks). Never import this in client or server components. Keep the service role key **off the client**. ([Supabase][5])

**Middleware exemption for webhooks** (to avoid auth refresh on raw webhook payloads):
Edit `middleware.ts` **matcher** to exclude webhook routes we currently have **and** the upcoming versioned path:

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhook/.*|api/v1/webhooks/.*).*)",
  ],
};
```

(This prevents the session-refresh middleware from touching webhooks.)

---

### 5) Add a tiny API utility layer (standardized handlers & responses)

**Create** folder `libs/api-utils/` with these files:

1. `libs/api-utils/responses.ts`

```ts
export function ok<T>(data: T, init: ResponseInit = {}) {
  return Response.json({ success: true, data }, { status: 200, ...init });
}
export function created<T>(data: T, init: ResponseInit = {}) {
  return Response.json({ success: true, data }, { status: 201, ...init });
}
export function badRequest(message = "Invalid request") {
  return Response.json({ success: false, error: message }, { status: 400 });
}
export function unauthorized(message = "Unauthorized") {
  return Response.json({ success: false, error: message }, { status: 401 });
}
export function forbidden(message = "Forbidden") {
  return Response.json({ success: false, error: message }, { status: 403 });
}
export function serverError(message = "Internal Server Error") {
  return Response.json({ success: false, error: message }, { status: 500 });
}
```

2. `libs/api-utils/errors.ts`

```ts
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
```

3. `libs/api-utils/handler.ts`

```ts
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export function withMethods(handlers: Partial<Record<HttpMethod, Function>>) {
  return async (req: Request) => {
    const method = (req.method || "GET").toUpperCase() as HttpMethod;
    const handler = handlers[method];
    if (!handler) {
      return new Response(null, { status: 405, headers: { Allow: Object.keys(handlers).join(",") } });
    }
    try {
      return await handler(req);
    } catch (e: any) {
      const message = e?.message || "Internal Server Error";
      const status = e?.status && Number.isInteger(e.status) ? e.status : 500;
      return Response.json({ success: false, error: message }, { status });
    }
  };
}
```

4. `libs/api-utils/auth.ts`

```ts
import { createClient } from "@/libs/supabase/server";
import { unauthorized } from "./responses";

export async function requireUser(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null as const, res: unauthorized() };
  return { user, res: null as const };
}
```

> These utilities standardize Route Handlers (App Router APIs) and errors. (Route Handlers are the App Router’s native API surface.) ([Next.js][1])

---

### 6) Replace the Axios helper with a tiny `fetch` wrapper

We will **remove** `libs/api.ts` and replace it with a minimal wrapper that works on both client and server. This avoids interceptors and keeps flows explicit.

1. **Delete** `libs/api.ts`.
   (Only delete this file. Do **not** delete anything else.)

2. **Create** `libs/api/http.ts`:

```ts
import config from "@/config";

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function handle(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (isJson ? body?.error : body) || `HTTP ${res.status}`;
    throw new ApiClientError(res.status, msg);
  }
  return isJson ? body : { success: true, data: body };
}

/** Client-side (browser) */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(path, { credentials: "include", ...init });
  try {
    return await handle(res);
  } catch (e: any) {
    if (e?.status === 401) {
      // redirect to login on unauthorized
      if (typeof window !== "undefined") window.location.assign(config.auth.loginUrl);
    }
    throw e;
  }
}

/** Server-side (RSC or server code) */
export async function apiFetchServer(path: string, init: RequestInit = {}) {
  const res = await fetch(path, { cache: "no-store", ...init });
  return handle(res);
}
```

3. **Search & replace usages** of the old client:

   * Replace imports of `@/libs/api` with `@/libs/api/http`.
   * Replace `apiClient.get/post/...` with `apiFetch('/api/...', { method: 'POST', body, headers })` or `apiFetchServer` as appropriate.

> **Note**: In Server Components, `fetch('/api/...')` forwards cookies by default; using `cache: 'no-store'` avoids caching sensitive data. ([Next.js][4])

---

### 7) Standardize authentication guard via API (no direct Supabase in Server Components)

**Create a small “who am I” API** and use it in the Dashboard layout.

1. **Create** `app/api/v1/auth/me/route.ts`:

```ts
import { withMethods } from "@/libs/api-utils/handler";
import { ok, unauthorized } from "@/libs/api-utils/responses";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic"; // never cache user session

export const GET = withMethods({
  GET: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized("Not signed in");
    // Return a minimal shape only (no secrets)
    return ok({ id: user.id, email: user.email });
  }
});
```

2. **Update** `app/(app)/dashboard/layout.tsx` to **remove** direct Supabase usage and **fetch the API**:

```tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";

export default async function LayoutPrivate({ children }: { children: ReactNode }) {
  // Relative path works in RSC; cookies are forwarded automatically.
  const res = await fetch("/api/v1/auth/me", { cache: "no-store" });
  if (res.status === 401) redirect("/signin");
  // We don't need user data here, only the auth check, so we don't parse.
  return <>{children}</>;
}
```

> This keeps **all reads/writes behind Route Handlers**.
>
> * Route Handlers are the App Router’s API surface. ([Next.js][1])
> * For private areas, opt out of caching (`dynamic="force-dynamic"` or `cache:"no-store"`). ([Next.js][4])
> * SSR cookie usage with Supabase follows the official `@supabase/ssr` pattern. ([Supabase][2])

**Do not** change the existing `/app/api/*` endpoints in Part A (Stripe, webhook, etc.). We’ll version and refactor them in Part B.

---

### 8) UI organization (light touch)

1. **Create** `components/common/`
2. **Move**:

   * `components/Footer.tsx` → `components/common/Footer.tsx`
   * `components/ButtonSignin.tsx` → `components/common/ButtonSignin.tsx`
3. **Update imports**:

   * Replace `@/components/Footer` → `@/components/common/Footer`
   * Replace `@/components/ButtonSignin` → `@/components/common/ButtonSignin`

> Do **not** move `components/ui/**`, `components/ThemeProvider.tsx`, `components/ThemeToggle.tsx`, or `components/LayoutClient.tsx`.

---

### 9) Package manager & scripts sanity

1. In `package.json`, set (or update) the package manager field:

```json
"packageManager": "npm@>=10"
```

2. Ensure scripts exist; **add them only if missing**:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

> Do **not** add yarn/pnpm files. Remove `pnpm-lock.yaml` or `yarn.lock` if they exist.

---

## Post‑Implementation Verification (for Part A)

Run these checks **in order**. If any check fails, stop and fix before proceeding.

### A) File/route structure checks

* [ ] `app/(marketing)/page.tsx` exists and renders the same homepage as before.
* [ ] `app/(marketing)/signin/**` exists and `/signin` still works.
* [ ] `app/(marketing)/blog/**` exists and `/blog` still works.
* [ ] `app/(marketing)/privacy-policy/page.tsx` exists and `/privacy-policy` still works.
* [ ] `app/(marketing)/tos/page.tsx` exists and `/tos` still works.
* [ ] `app/(app)/dashboard/**` exists and `/dashboard` still works.
* [ ] `app/layout.tsx`, `app/error.tsx`, `app/not-found.tsx`, and all icons/images remain in `app/`.
* [ ] Nothing under `app/api/**` was moved or deleted.

### B) Auth guard behavior

* [ ] `GET /api/v1/auth/me` returns **401** for a signed‑out session and **200** (`{ success:true, data:{ id, email } }`) for a signed‑in session.
* [ ] Visiting `/dashboard` when signed out **redirects to `/signin`**.
* [ ] Visiting `/dashboard` when signed in **renders the dashboard**.

### C) Supabase usage boundaries

* [ ] **No** imports of `@/libs/supabase/server` or `@supabase/*` appear in Server Components (files inside `app/**` except `app/api/**`, `middleware.ts`).

  * Run: `grep -R "supabase" app | grep -v "/api/" | grep -v "middleware.ts"` — expect **no server client usage** in RSC.
* [ ] `libs/supabase/admin.ts` exists and is **not** imported by any client component or non-API server component.

  * Run: `grep -R "libs/supabase/admin" -n .` — you should only see usage in webhooks or other Route Handlers (if any).

### D) Env and config

* [ ] `libs/env/index.ts` exists; project builds without missing env at runtime for local dev.
* [ ] `.env.example` contains **placeholders only** (no real keys).
* [ ] If real keys were previously committed, **keys were rotated** in Supabase.
* [ ] `components.json` aliases now point to `libs` (not `lib`).
* [ ] `tsconfig.json` has `"baseUrl": "."` and a `@/*` path.

### E) API utilities present and wired

* [ ] `libs/api-utils/{responses.ts,errors.ts,handler.ts,auth.ts}` exist.
* [ ] The new endpoint `app/api/v1/auth/me/route.ts` uses `withMethods` and `createClient()` (SSR client).
* [ ] `app/(app)/dashboard/layout.tsx` uses `fetch("/api/v1/auth/me", { cache: "no-store" })` and **no** direct Supabase calls.

### F) HTTP helper replacement

* [ ] `libs/api.ts` **no longer exists**.
* [ ] `libs/api/http.ts` exists and is (or can be) imported by client components when calling APIs.
* [ ] Search the codebase for `from "@/libs/api"` — **no** results remain.

### G) Middleware exclusions

* [ ] `middleware.ts` matcher excludes both `api/webhook/*` and `api/v1/webhooks/*`.

### H) Build & runtime

* [ ] `npm run build` succeeds.
* [ ] `npm run dev` runs and all URLs mentioned above behave as before (plus the new `/api/v1/auth/me`).
* [ ] No console errors for missing imports after the `lib` → `libs` change.

---

## Notes / Rationale (brief, with sources)

* **Route Handlers** are the App Router-native API layer. We’re consolidating on them (no Server Actions) and keeping logic consistent. ([Next.js][1])
* **Caching & dynamic**: public pages can be revalidated; private pages opt out (`dynamic="force-dynamic"` / `cache:"no-store"`). ([Next.js][4])
* **Cookies & SSR**: Reading cookies is allowed in Server Components, but mutating them must be done in Route Handlers or Server Actions. We keep all auth state transitions in Route Handlers and middleware. ([Next.js][6])
* **Supabase SSR**: The `@supabase/ssr` approach with cookies is the official method for App Router SSR; we use it only inside Route Handlers. ([Supabase][2])

---

### Anything *not* included in Part A (will handle in Part B)

* API versioning and grouping for Stripe endpoints (`/api/v1/stripe/*`) and webhooks (`/api/v1/webhooks/stripe`).
* Consolidated “service” or “repository” functions for DB access under `libs/` and wiring all endpoints to them.
* Storage and RLS policy scaffolding.
* Minimal test scaffolding (just enough to be a template for future agents).
* Security passes (headers, basic middleware hardening, etc.).
* CLI scripts and docs generation.

---

If you want, I can now produce **Phase A – Part B** (the remaining changes) in the same explicit format.

[1]: https://nextjs.org/docs/app/api-reference/file-conventions/route?utm_source=chatgpt.com "File-system conventions: route.js | Next.js"
[2]: https://supabase.com/docs/guides/auth/server-side/creating-a-client?utm_source=chatgpt.com "Creating a Supabase client for SSR | Supabase Docs"
[3]: https://nextjs.org/docs/14/app/building-your-application/routing?utm_source=chatgpt.com "Building Your Application: Routing | Next.js"
[4]: https://nextjs.org/docs/app/guides/caching?utm_source=chatgpt.com "Guides: Caching | Next.js"
[5]: https://supabase.com/docs/guides/auth/server-side?utm_source=chatgpt.com "Server-Side Rendering - Supabase Docs"
[6]: https://nextjs.org/docs/app/api-reference/functions/cookies?utm_source=chatgpt.com "Functions: cookies | Next.js"
