# Playbooks & Templates — QuickDesignHome

This file contains step‑by‑step recipes and **copy‑paste templates**. Keep edits scoped and explicit.

---

## Playbook A — Add an API endpoint

**Goal**: Create a versioned route under `/app/api/v1/<domain>/<action>/route.ts` that validates input, calls a service, and returns normalized JSON.

**Steps**
1) **Create file**: `app/api/v1/<domain>/<action>/route.ts`  
   - Do **not** delete or move any existing `app/api/**` routes.
2) **Implement** using **API_ROUTE template** (below):  
   - Restrict methods (`withMethods`).
   - Validate input with Zod.
   - Call the corresponding service function.
   - Return `ok()` / `fail()` from `responses`.
3) **(Optional) Legacy bridge**: if a legacy path exists (e.g., `app/api/stripe/create-checkout/route.ts`), keep it and **delegate** to the new v1 route (import the v1 handler or re-export its HTTP method function). Do **not** delete legacy files without a change spec.
4) **Headers**: default to `Cache-Control: private, no-store`.

**Post‑verify**
- `npm run build` passes.
- Call endpoint with valid and invalid payloads; expect normalized JSON.
- Grep: route file contains **no** repository imports (must call a service instead).

---

## Playbook B — Add a DB entity

**Goal**: Introduce a new table/entity with a repository file and migrations.

**Steps**
1) **Create migration file** under `migrations/phaseX/NNN_<name>.sql`:
   - Table definition, indexes, RLS policies.
   - **Do not apply** automatically.
2) **Create repository** `libs/repositories/<entity>.ts`:
   - Pure functions: `get<Entity>`, `list<Entity>`, `create<Entity>`, `update<Entity>`, etc.
   - All functions accept `supabase: SupabaseClient`.
3) **(Optional)** Create or update a service to use the repository.
4) **No UI changes yet** unless explicitly requested.

**Post‑verify**
- Migration file exists; not applied automatically.
- Repository has no HTTP or Next imports, only `@supabase/*` types.
- Grep: no repository imports in components; routes call **services**, not repos.

---

## Playbook C — Add file upload (Supabase Storage)

**Goal**: Upload to `public` or `private` bucket with signed URL retrieval.

**Steps**
1) **Create/extend** `libs/storage/<feature>.ts` with functions:
   - `uploadFile(ctx, { bucket, path, file, contentType })`
   - `getSignedUrl(ctx, { bucket, path, expiresIn })`
2) **RLS**:  
   - `public` bucket: public read; write requires auth.  
   - `private` bucket: owner-scoped via RLS; paths start with `${userId}/...`.
3) **API route**: create `app/api/v1/<feature>/upload/route.ts` that:
   - Asserts auth.
   - Accepts `multipart/form-data`.
   - Calls storage helper.
4) **UI**: Form posts to the API route.

**Post‑verify**
- No service-role key usage.
- Signed URL expiration sensible (e.g., 60–600s).
- Grep: no direct storage admin calls in components.

---

## Playbook D — Add a protected page

**Goal**: New private area under `/dashboard` (or other private section) guarded at layout.

**Steps**
1) **Add page** under `app/dashboard/<subpage>/page.tsx`.
2) **Ensure layout guard** in `app/dashboard/layout.tsx` remains intact.
3) **UI data**: fetch via API calls (client) or server-side fetch to API (no direct DB).

**Post‑verify**
- Unauthenticated request redirects to `/signin`.
- Page renders for authenticated users.
- No DB usage in components.

---

# TEMPLATES (Copy‑Paste)

> Replace `__TOKENS__` carefully. Keep file locations as shown.

---

## Template — API_ROUTE.ts

```ts
// File: app/api/v1/__domain__/__action__/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase' // server client (non-admin)
import { __serviceFn__ } from '@/libs/services/__domain__'
import { withRequestContext } from '@/libs/observability/request'

// 1) schema
const BodySchema = z.object({
  // example fields
  id: z.string().min(1),
})

export const POST = withMethods(['POST'], withRequestContext(async (req: NextRequest, ctx?: any) => {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
    }

    // 2) create standard server client (non-admin)
    const supabase = createServiceSupabaseClient()

    // 3) call service
    const data = await __serviceFn__({ supabase }, parsed.data)

    // 4) respond
    ctx?.logger?.info?.('__domain__.__action__', { ok: true })
    return ok(data)
  } catch (err: any) {
    ctx?.logger?.error?.('__domain__.__action___error', { message: err?.message })
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
}))
```

---

## Template — SERVICE.ts

```ts
// File: libs/services/__domain__.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import * as repo from '@/libs/repositories/__entity__'

export async function __serviceFn__(
  ctx: { supabase: SupabaseClient },
  args: { id: string }
): Promise<any> {
  // business logic sample
  const item = await repo.get__Entity__(ctx.supabase, args.id)
  // do additional checks/transforms
  return item
}
```

---

## Template — REPOSITORY.ts

```ts
// File: libs/repositories/__entity__.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function get__Entity__(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('__entity__')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function upsert__Entity__(supabase: SupabaseClient, row: any) {
  const { data, error } = await supabase
    .from('__entity__')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}
```

---

## Template — STORAGE.ts

```ts
// File: libs/storage/__feature__.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function uploadFile(
  supabase: SupabaseClient,
  params: { bucket: string; path: string; file: File | Blob; contentType?: string }
) {
  const { error } = await supabase.storage
    .from(params.bucket)
    .upload(params.path, params.file, { contentType: params.contentType })
  if (error) throw error
  return { path: params.path }
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  params: { bucket: string; path: string; expiresIn: number }
) {
  const { data, error } = await supabase.storage
    .from(params.bucket)
    .createSignedUrl(params.path, params.expiresIn)
  if (error) throw error
  return { url: data.signedUrl }
}
```

---

## Template — MIGRATION.sql

```sql
-- File: migrations/phase1/001__create___entity__.sql

create table if not exists public.__entity__ (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  created_at timestamp with time zone default now()
);

alter table public.__entity__ enable row level security;

create policy "__entity___owner_select"
on public.__entity__ for select
using ( auth.uid() = owner_id );

create policy "__entity___owner_ins"
on public.__entity__ for insert
with check ( auth.uid() = owner_id );

create policy "__entity___owner_upd"
on public.__entity__ for update
using ( auth.uid() = owner_id )
with check ( auth.uid() = owner_id );

create policy "__entity___owner_del"
on public.__entity__ for delete
using ( auth.uid() = owner_id );
```

---

## Helper snippets (API utilities)

> If not already present, these are the expected helpers in `libs/api-utils/*`.

**responses.ts**
```ts
// libs/api-utils/responses.ts
import { NextResponse } from 'next/server'

export function ok<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message } as const, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

export function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { code, message, details } } as const,
    { status, headers: { 'Cache-Control': 'private, no-store' } }
  )
}
```

**methods.ts**
```ts
// libs/api-utils/methods.ts
import { NextRequest } from 'next/server'
import { fail } from './responses'

export function withMethods(
  methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>,
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    if (!methods.includes(req.method as any)) {
      return fail(405, 'METHOD_NOT_ALLOWED', `Use ${methods.join(', ')}`)
    }
    return handler(req)
  }
}
```

**supabase.ts (server client for services)**
```ts
// libs/api-utils/supabase.ts
import { createClient } from '@/libs/supabase/server'
export function createServiceSupabaseClient() {
  return createClient()
}
```

> Admin client (service role) must only be used in webhooks. If you add `libs/supabase/admin.ts`, ensure it is **only** imported under `app/api/webhook/**`.

---

# Global post‑implementation verify (for any playbook)

* `npm run build` passes.
* New files created under the exact paths specified.
* No Server Actions added.
* No direct DB calls in components.
* For browser code, no `next/navigation` redirects in axios interceptors.
* Existing routes/pages untouched (see Handbook §0).
