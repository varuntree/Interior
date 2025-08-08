Below is Phase A — Change Spec (Part B).
It’s written for an AI code agent. Every step is explicit and scoped to the current repo structure you provided. Do not remove or rename anything unless the step says so.

Ground rules for the agent (same as Part A + a few more)

Do not delete existing pages/routes (marketing, blog, privacy-policy, tos, dashboard, signin).

Do not change URLs of existing pages.

No Server Actions. Route Handlers only for backend.

All DB access is behind APIs (Route Handlers) via Repositories and Services (pure functions, no classes).

npm only (no yarn/pnpm).

Keep existing /app/api/* endpoints in place; we will add versioned /app/api/v1/* endpoints and bridge the old endpoints to the new ones (do not break existing URLs).

Never expose SUPABASE_SERVICE_ROLE_KEY to the client. Use it only in server-only code (webhooks/admin).

Do not move SEO/images/icon files or global layout/error pages.

If a file already exists with the same purpose, modify it, don’t duplicate.

Phase A — Part B (Change Spec)
0) Scope of Part B
In this part we will:

Add Repositories and Services layers under libs/.

Version and refactor Stripe endpoints under /app/api/v1/… (create-checkout, create-portal, webhooks).
Keep the old endpoints and bridge them to the new ones.

Add an input validation helper for APIs.

Introduce a Storage repository and create SQL migrations for buckets & policies (create files only; do not apply).

Add SQL migrations for the profiles table + RLS + triggers (create files only; do not apply).

Harden security headers.

Make small adjustments to existing Stripe helper to use validated env.

Add minimal README snippets (cookbook) for future contributors/agents.

Do not modify the marketing/blog/tos/privacy-policy/signin/dashboard pages beyond what Part A already did.

1) Repositories layer (pure functions, no classes)
Create folder: libs/repositories/

Create file: libs/repositories/profiles.ts

ts
Copy
import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  email: string | null;
  customer_id: string | null;
  price_id: string | null;
  has_access: boolean;
  created_at: string | null;
};

// READ: by user id (current session)
export async function getProfileById(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Profile;
}

// READ: by email (used by webhook fallback)
export async function getProfileByEmail(db: SupabaseClient, email: string) {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();
  if (error) throw error;
  return data as Profile;
}

// UPDATE: set Stripe customer & plan, and access flag
export async function setBillingByUserId(
  db: SupabaseClient,
  params: { userId: string; customerId: string | null; priceId: string | null; hasAccess: boolean }
) {
  const { error } = await db
    .from("profiles")
    .update({
      customer_id: params.customerId,
      price_id: params.priceId,
      has_access: params.hasAccess,
    })
    .eq("id", params.userId);
  if (error) throw error;
}

// UPDATE: set access by customer_id (webhook path)
export async function setAccessByCustomerId(
  db: SupabaseClient,
  params: { customerId: string; hasAccess: boolean }
) {
  const { error } = await db
    .from("profiles")
    .update({ has_access: params.hasAccess })
    .eq("customer_id", params.customerId);
  if (error) throw error;
}
Do not import this file from Client Components. Repositories are for server-side use (Route Handlers/Services).

2) Services layer (business use-cases; composes repositories + external SDKs)
Create folder: libs/services/

Create file: libs/services/billing.ts

ts
Copy
import config from "@/config";
import { createCheckout, createCustomerPortal, findCheckoutSession } from "@/libs/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileById, getProfileByEmail, setBillingByUserId, setAccessByCustomerId } from "@/libs/repositories/profiles";

export async function startCheckoutService(db: SupabaseClient, args: {
  userId: string;
  priceId: string;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
}) {
  const profile = await getProfileById(db, args.userId);
  const url = await createCheckout({
    priceId: args.priceId,
    mode: args.mode,
    successUrl: args.successUrl,
    cancelUrl: args.cancelUrl,
    clientReferenceId: args.userId,
    user: {
      email: profile?.email ?? undefined,
      customerId: profile?.customer_id ?? undefined,
    },
  });
  if (!url) throw new Error("Failed to create Stripe Checkout Session");
  return { url };
}

export async function openCustomerPortalService(db: SupabaseClient, args: {
  userId: string;
  returnUrl: string;
}) {
  const profile = await getProfileById(db, args.userId);
  if (!profile?.customer_id) {
    throw new Error("You don't have a billing account yet. Make a purchase first.");
  }
  const url = await createCustomerPortal({
    customerId: profile.customer_id,
    returnUrl: args.returnUrl,
  });
  return { url };
}

/**
 * Handle Stripe webhook events (admin client should be passed in).
 * This function updates profiles and access flags according to the event.
 */
export async function handleStripeWebhookService(adminDb: SupabaseClient, event: any) {
  switch (event.type) {
    case "checkout.session.completed": {
      const stripeObject = event.data.object;
      const session = await findCheckoutSession(stripeObject.id);
      const customerId = session?.customer as string | null;
      const priceId = session?.line_items?.data?.[0]?.price?.id ?? null;
      const userId = stripeObject.client_reference_id as string | null;
      const customerEmail = (session?.customer_details?.email ||
                             stripeObject.customer_details?.email) as string | undefined;

      // Validate plan from config
      const plan = config.stripe.plans.find((p) => p.priceId === priceId);
      if (!plan) return;

      // Find user (prefer client_reference_id; fallback to email)
      let targetUserId = userId;
      if (!targetUserId && customerEmail) {
        try {
          const profile = await getProfileByEmail(adminDb, customerEmail);
          targetUserId = profile?.id;
        } catch {
          // ignore: might not exist yet
        }
      }
      if (!targetUserId) return;

      await setBillingByUserId(adminDb, {
        userId: targetUserId,
        customerId: customerId ?? null,
        priceId: priceId ?? null,
        hasAccess: true,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const stripeObject = event.data.object;
      const subscription = stripeObject; // already contains customer
      await setAccessByCustomerId(adminDb, {
        customerId: String(subscription.customer),
        hasAccess: false,
      });
      break;
    }

    case "invoice.paid": {
      const stripeObject = event.data.object;
      const priceId = stripeObject.lines.data[0]?.price?.id;
      const customerId = stripeObject.customer as string;
      // (Optional) ensure invoice price matches the subscription plan in DB
      // If you want to enforce same plan, you can read the profile and compare here
      await setAccessByCustomerId(adminDb, {
        customerId,
        hasAccess: true,
      });
      break;
    }

    // Other events can be handled later
    default:
      break;
  }
}
Services do not know about HTTP; they receive a Supabase client and values and return values or throw errors.

3) API input validation helper
Create file: libs/api-utils/validate.ts

ts
Copy
import { z } from "zod";
import { badRequest } from "./responses";

export function validate<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown
): { ok: true; data: z.infer<TSchema> } | { ok: false; res: Response } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map(i => i.message).join("; ");
    return { ok: false, res: badRequest(message) };
  }
  return { ok: true, data: result.data };
}
4) Versioned Stripe endpoints (add /api/v1 and bridge old routes)
Do not delete existing files in app/api/stripe/* or app/api/webhook/stripe/*.
We will create new versioned handlers and bridge the old ones to the new ones.

4.1 Create v1 handlers
Create folder: app/api/v1/stripe/create-checkout/

Create file: app/api/v1/stripe/create-checkout/route.ts

ts
Copy
import { z } from "zod";
import { withMethods } from "@/libs/api-utils/handler";
import { ok, unauthorized } from "@/libs/api-utils/responses";
import { validate } from "@/libs/api-utils/validate";
import { createClient } from "@/libs/supabase/server";
import { startCheckoutService } from "@/libs/services/billing";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  priceId: z.string().min(1),
  mode: z.enum(["payment", "subscription"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  // couponId?: string (optional for later)
});

export const POST = withMethods({
  POST: async (req: Request) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized("You must be logged in to checkout.");

    const body = await req.json().catch(() => ({}));
    const v = validate(BodySchema, body);
    if (!v.ok) return v.res;

    const { priceId, mode, successUrl, cancelUrl } = v.data;
    const result = await startCheckoutService(supabase, {
      userId: user.id,
      priceId,
      mode,
      successUrl,
      cancelUrl,
    });
    return ok(result);
  }
});
Create folder: app/api/v1/stripe/create-portal/

Create file: app/api/v1/stripe/create-portal/route.ts

ts
Copy
import { z } from "zod";
import { withMethods } from "@/libs/api-utils/handler";
import { ok, unauthorized } from "@/libs/api-utils/responses";
import { validate } from "@/libs/api-utils/validate";
import { createClient } from "@/libs/supabase/server";
import { openCustomerPortalService } from "@/libs/services/billing";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  returnUrl: z.string().url(),
});

export const POST = withMethods({
  POST: async (req: Request) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized("You must be logged in to view billing information.");

    const body = await req.json().catch(() => ({}));
    const v = validate(BodySchema, body);
    if (!v.ok) return v.res;

    const result = await openCustomerPortalService(supabase, {
      userId: user.id,
      returnUrl: v.data.returnUrl,
    });
    return ok(result);
  }
});
Create folder: app/api/v1/webhooks/stripe/

Create file: app/api/v1/webhooks/stripe/route.ts

ts
Copy
import { headers } from "next/headers";
import Stripe from "stripe";
import { withMethods } from "@/libs/api-utils/handler";
import { serverError } from "@/libs/api-utils/responses";
import { env } from "@/libs/env";
import { createAdminClient } from "@/libs/supabase/admin";
import { handleStripeWebhookService } from "@/libs/services/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(env.server.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-08-16",
  typescript: true,
});

export const POST = withMethods({
  POST: async (req: Request) => {
    try {
      const body = await req.text();
      const signature = headers().get("stripe-signature") || "";
      const webhookSecret = env.server.STRIPE_WEBHOOK_SECRET || "";
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

      // Admin client (service role)
      const adminDb = createAdminClient();
      await handleStripeWebhookService(adminDb, event);

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (e: any) {
      console.error("stripe webhook error:", e?.message || e);
      return serverError("Webhook error");
    }
  }
});
4.2 Bridge existing routes to v1
Edit file: app/api/stripe/create-checkout/route.ts
Replace entire content with:

ts
Copy
export { POST } from "@/app/api/v1/stripe/create-checkout/route";
Edit file: app/api/stripe/create-portal/route.ts
Replace entire content with:

ts
Copy
export { POST } from "@/app/api/v1/stripe/create-portal/route";
Edit file: app/api/webhook/stripe/route.ts
Replace entire content with:

ts
Copy
export { POST } from "@/app/api/v1/webhooks/stripe/route";
This preserves old URLs while standardizing on versioned v1 endpoints internally.

5) Storage repository (simple, secure defaults)
Create folder: libs/storage/

Create file: libs/storage/storageRepository.ts

ts
Copy
import type { SupabaseClient } from "@supabase/supabase-js";

// Public bucket: read by anyone; writes only by authenticated users
export async function uploadPublic(db: SupabaseClient, path: string, file: File | Blob) {
  const { error } = await db.storage.from("public").upload(path, file, { upsert: true });
  if (error) throw error;
  return getPublicUrl(db, path);
}

export function getPublicUrl(db: SupabaseClient, path: string) {
  const { data } = db.storage.from("public").getPublicUrl(path);
  return data.publicUrl;
}

// Private bucket: per-user folder, signed URLs for read
export async function uploadPrivate(
  db: SupabaseClient,
  userId: string,
  path: string,
  file: File | Blob
) {
  const key = `${userId}/${path}`;
  const { error } = await db.storage.from("private").upload(key, file, { upsert: true });
  if (error) throw error;
  return key;
}

export async function getPrivateSignedUrl(db: SupabaseClient, key: string, expiresInSeconds = 60) {
  const { data, error } = await db.storage.from("private").createSignedUrl(key, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
Do not wire these into any page yet. This is the baseline repository for future features.

6) SQL Migrations (create files only, do not apply)
Create folder (if not present): migrations/phase1/

6.1 Profiles table (if not present) + basic structure
Create file: migrations/phase1/001_create_profiles.sql

sql
Copy
-- Create profiles table (id matches auth.users.id)
create table if not exists public.profiles (
  id uuid primary key,
  email text unique,
  customer_id text,
  price_id text,
  has_access boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Ensure RLS is enabled
alter table public.profiles enable row level security;
6.2 Profiles policies (RLS)
Create file: migrations/phase1/002_profiles_policies.sql

sql
Copy
-- Allow users to read and update their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);
6.3 Auto-insert profile on user signup (trigger)
Create file: migrations/phase1/003_profiles_trigger.sql

sql
Copy
-- Function to create a profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
6.4 Storage buckets + policies
Create file: migrations/phase1/004_storage_buckets.sql

sql
Copy
-- Create buckets if not exist
insert into storage.buckets (id, name, public) values ('public', 'public', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('private', 'private', false)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (already enabled by default)
-- Policies for 'public' bucket
drop policy if exists "Public read" on storage.objects;
create policy "Public read"
on storage.objects for select
using (bucket_id = 'public');

drop policy if exists "Authenticated write public" on storage.objects;
create policy "Authenticated write public"
on storage.objects for insert
with check (bucket_id = 'public' and auth.role() = 'authenticated');

drop policy if exists "Update own public objects" on storage.objects;
create policy "Update own public objects"
on storage.objects for update
using (bucket_id = 'public' and owner = auth.uid())
with check (bucket_id = 'public' and owner = auth.uid());

-- Policies for 'private' bucket (owner-only)
drop policy if exists "Private read own" on storage.objects;
create policy "Private read own"
on storage.objects for select
using (bucket_id = 'private' and owner = auth.uid());

drop policy if exists "Private write own" on storage.objects;
create policy "Private write own"
on storage.objects for insert
with check (bucket_id = 'private' and owner = auth.uid());

drop policy if exists "Private update own" on storage.objects;
create policy "Private update own"
on storage.objects for update
using (bucket_id = 'private' and owner = auth.uid())
with check (bucket_id = 'private' and owner = auth.uid());
Do not apply these migrations yet. They are created as files only.

7) Security headers (safe defaults, no CSP yet)
Edit file: next.config.js
Add an async headers() export (do not remove existing config). Final file should look like:

js
Copy
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
We intentionally skip CSP here to avoid breaking dev UX. We can add a tailored CSP later.

8) Stripe helper: use validated env (no direct process.env lookups)
Edit file: libs/stripe.ts
Replace the three places where a new Stripe(process.env.STRIPE_SECRET_KEY, ...) is created with validated env from libs/env. Also guard against missing keys.

At the top:

ts
Copy
import { env } from "@/libs/env";
Change each Stripe client creation to:

ts
Copy
const secret = env.server.STRIPE_SECRET_KEY;
if (!secret) throw new Error("STRIPE_SECRET_KEY is not set");
const stripe = new Stripe(secret, {
  apiVersion: "2023-08-16",
  typescript: true,
});
Do not change functions’ exported signatures.

9) README (minimal contributor cookbook)
Edit file: README.md
Append the following section to the end (do not remove existing content):

md
Copy
## Contributor Cookbook (Baseline)

### Add a new API endpoint
1. Create a versioned Route Handler under `app/api/v1/<domain>/<name>/route.ts`.
2. Use `withMethods` from `libs/api-utils/handler`.
3. Validate input with Zod via `libs/api-utils/validate`.
4. Call a Service function (create one under `libs/services/`) and pass a Supabase server client from `libs/supabase/server`.
5. Services call Repositories in `libs/repositories/` for DB access.
6. If you must keep a legacy path working, create a tiny “bridge” file that re-exports the POST/GET from the new v1 route.

### Add a new Repository function
1. Create/modify a file under `libs/repositories/` (one file per entity).
2. Export **pure functions** that accept a `SupabaseClient` and return typed data.
3. **No HTTP logic** or `Request`/`Response` imports here.

### Add a new Service function
1. Create/modify a file under `libs/services/`.
2. Compose repositories + external SDKs (Stripe, etc.).
3. **No HTTP** here. Accept a `SupabaseClient` and plain arguments.

### Storage
- Use `libs/storage/storageRepository.ts` helpers.
- Public assets: use bucket `public`.
- Private assets: use bucket `private` with per-user path (e.g., `${userId}/file.ext`) and signed URLs.

### Migrations
- Place SQL files under `migrations/phaseX/` folders.
- **Do not apply** by default. Apply only when explicitly requested.

### Auth & Data Fetching
- Server and Client code must call **APIs** (Route Handlers).
- **No direct DB calls in pages/components** (except global auth refresh middleware).
10) Config audit (no functional change required in Part B)
config.ts stays as-is for now. Do not add feature flags or change Stripe plan IDs in this part.

Ensure config.colors.main remains used by the top loader and <Viewport>.

Ensure auth.loginUrl and auth.callbackUrl are unchanged.

Post‑Implementation Verification (for Part B)
Run these checks after all edits. If any check fails, stop and fix.

A) Repositories & Services
 libs/repositories/profiles.ts exists; functions compile.

 libs/services/billing.ts exists; functions compile and import only from repositories, config, and libs/stripe.

 No classes in repositories/services.

B) Versioned APIs
 app/api/v1/stripe/create-checkout/route.ts exists and uses withMethods, validate, server supabase, and startCheckoutService.

 app/api/v1/stripe/create-portal/route.ts exists and uses withMethods, validate, server supabase, and openCustomerPortalService.

 app/api/v1/webhooks/stripe/route.ts exists; exports runtime = "nodejs" and dynamic = "force-dynamic", reads raw body with await req.text(), verifies signature, and calls handleStripeWebhookService with admin client.

 Old routes bridge to v1 via re-exports:

app/api/stripe/create-checkout/route.ts re-exports POST from v1.

app/api/stripe/create-portal/route.ts re-exports POST from v1.

app/api/webhook/stripe/route.ts re-exports POST from v1.

C) Storage
 libs/storage/storageRepository.ts exists; functions compile.

 No usage yet in pages (intended).

D) Migrations (files only)
 migrations/phase1/001_create_profiles.sql exists with table + RLS enable.

 migrations/phase1/002_profiles_policies.sql exists with select/update self policies.

 migrations/phase1/003_profiles_trigger.sql exists with handle_new_user trigger.

 migrations/phase1/004_storage_buckets.sql exists with buckets + policies.

 No migration has been applied (files only).

E) Security headers
 next.config.js includes an async headers() that sets:

X-Frame-Options: DENY

X-Content-Type-Options: nosniff

Referrer-Policy: strict-origin-when-cross-origin

Permissions-Policy: camera=(), microphone=(), geolocation=()

Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

F) Stripe helper & env
 libs/stripe.ts imports from libs/env and throws a clear error if STRIPE_SECRET_KEY is missing.

 Build succeeds with missing Stripe keys if the Stripe code paths are not executed during build (expected).
(Runtime will throw if keys are missing and those handlers are invoked.)

G) No leakage of admin client
 Search grep -R "libs/supabase/admin" app | grep -v "api/v1/webhooks" — should show only webhook route (and possibly other server-only admin tasks in the future, but not pages/components).

H) Build & run
 npm run build succeeds.

 npm run dev runs.

 Hitting /api/stripe/create-checkout still works and now uses the v1 code via bridge.

 Hitting /api/v1/stripe/create-checkout works identically.

 Stripe webhook path at both /api/webhook/stripe and /api/v1/webhooks/stripe responds 2xx on a valid test event.

I) No DB access from pages/components
 Search grep -R "from \\"@/libs/supabase/" app | grep -v "/api/" | grep -v "middleware.ts" — you should not see repositories/services or admin client used in pages/components.

