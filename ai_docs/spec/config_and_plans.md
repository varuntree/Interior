0) Purpose
One place to define modes, presets, defaults, and plan limits so UI + API + services all read the same “truth,” without scattering constants. This doc tells agents where config lives, what the shape is, and how enforcement works.

We will not modify config.ts directly (guardrail). Runtime product config will live in a new file under libs/app-config/ and be imported where needed.

1) Files & ownership
New: libs/app-config/runtime.ts — product/runtime config (this doc’s schema).

Existing: config.ts — marketing/brand/SEO/Stripe plan metadata only.

Existing: types/* — keep as-is unless we later add specific runtime types.

Existing: ai_docs/docs/CHANGE_SPEC.md — any edits must follow the change‑spec flow.

2) Runtime config schema (authoritative)
ts
Copy
// File: libs/app-config/runtime.ts
export type Mode = 'redesign' | 'staging' | 'compose' | 'imagine'

// AspectRatio and Quality removed for current provider

export interface PresetItem { id: string; label: string }
export interface Presets {
  roomTypes: PresetItem[]        // AU‑oriented list
  styles: PresetItem[]           // AU‑oriented list
}

export interface GenerationDefaults {
  mode: Mode
}

export interface GenerationLimits {
  maxUploadsMB: number
  acceptedMimeTypes: string[]
}

export interface Plans {
  // Keyed by Stripe priceId (from config.ts.stripe.plans[*].priceId)
  [priceId: string]: {
    label: string                 // "Starter", "Advanced", etc.
    monthlyGenerations: number    // soft limit; API enforces
    maxConcurrentJobs?: number    // default 1 for all plans
  }
}

export interface ReplicateConfig {
  model: 'google/nano-banana'
  webhookEnabled: boolean        // MVP: true (cheap, reliable)
  webhookRelativePath: '/api/v1/webhooks/replicate'
  pollingIntervalMs: number      // if we also poll as a fallback (e.g., 2000)
  timeouts: {
    submitMs: number             // request timeout
    overallMs: number            // hard cap before we mark job failed/timed_out
  }
}

export interface RuntimeConfig {
  featureFlags: {
    community: true
    collections: true
  }
  presets: Presets
  defaults: GenerationDefaults
  limits: GenerationLimits
  plans: Plans
  replicate: ReplicateConfig
}

// ---- DEFAULT EXPORT (MVP baseline) ----
const runtimeConfig: RuntimeConfig = {
  featureFlags: { community: true, collections: true },

  presets: {
    roomTypes: [
      { id: 'living_room', label: 'Living Room' },
      { id: 'kitchen',     label: 'Kitchen' },
      { id: 'bedroom',     label: 'Bedroom' },
      { id: 'bathroom',    label: 'Bathroom' },
      { id: 'home_office', label: 'Home Office' },
      { id: 'alfresco',    label: 'Alfresco / Patio' },       // AU-flavoured
      { id: 'granny_flat', label: 'Granny Flat' }             // AU-flavoured
    ],
    styles: [
      { id: 'coastal_au',  label: 'Coastal AU' },
      { id: 'modern',      label: 'Modern' },
      { id: 'minimal',     label: 'Minimal' },
      { id: 'scandi',      label: 'Scandinavian' },
      { id: 'midcentury',  label: 'Mid‑Century' },
      { id: 'industrial',  label: 'Industrial' },
      { id: 'hamptons',    label: 'Hamptons AU' }             // AU-flavoured
    ],
  },

  defaults: { mode: 'redesign' },

  limits: { maxUploadsMB: 15, acceptedMimeTypes: ['image/jpeg','image/png','image/webp'] },

  // IMPORTANT: fill these with YOUR Stripe priceIds from config.ts at deploy time.
  plans: {
    // examples using current dev priceIds; numbers are placeholders you can tweak anytime
    'price_1Niyy5AxyNprDp7iZIqEyD2h': { label: 'Starter',  monthlyGenerations: 150, maxConcurrentJobs: 1 },
    'price_1O5KtcAxyNprDp7iftKnrrpw': { label: 'Advanced', monthlyGenerations: 600, maxConcurrentJobs: 1 },
  },

  replicate: {
    model: 'google/nano-banana',
    webhookEnabled: true,
    webhookRelativePath: '/api/v1/webhooks/replicate',
    pollingIntervalMs: 2000,
    timeouts: { submitMs: 20000, overallMs: 180000 }
  }
}

export default runtimeConfig
You can freely add more presets later; all screens & API read from this. No migrations required for adding presets.

3) How the app consumes this config
3.1 UI (Create page)
Mode selector items derive from defaults.mode + static list in code.

Room/Style dropdowns are built from runtimeConfig.presets.

Advanced settings (aspect ratio, quality, variants) are hidden in MVP for the current provider.

File input accepts limits.acceptedMimeTypes, enforces limits.maxUploadsMB.

3.2 Prompt/adapter layer
Prompt builder composes Mode + Room + Style + user prompt, and enforces structural hints (keep architecture, AU vocabulary).

Replicate adapter maps current provider inputs:
- prompt → prompt
- input images → image_input (0–2)
- output_format → 'jpg'

3.3 API service (enforcement)
On POST /api/v1/generations:

Auth: must be signed in.

In‑flight guard: reject if a job is running for this user.

Plan check: find user’s price_id from profiles; look up plan in runtimeConfig.plans.

Quota check: count user renders for current month; if >= monthlyGenerations, return 402/429 with friendly message (“You’ve reached your monthly limit for the {Plan} plan.”).

Limits: enforce accepted image types and max upload size.

Submit to Replicate (webhook URL = origin + replicate.webhookRelativePath).

Persist job row immediately (status processing) with predictionId.

On webhook or poll completion: mark job succeeded/failed; increment usage only when succeeded.

If price_id is null (trial/free), you can map it to a pseudo plan like "free": { monthlyGenerations: 20 } by adding an entry in plans and mapping in service.

4) Stripe ↔ plans mapping
Source of truth for priceIds: config.ts.stripe.plans[*].priceId.

Source of truth for limits: runtimeConfig.plans[priceId].

On successful Stripe webhook subscription events, we set profiles.price_id and profiles.has_access accordingly. The API then uses that price_id to pick limits.

Changing plan limits does not require DB changes. Edit runtimeConfig.plans and redeploy.

5) Collections & Favorites
System collection “My Favorites” is not deletable and visible under /dashboard/collections.

Any result can be “Saved” to Favorites (one‑click) or to any user collection.

The display logic reads from stored items; config has no special knobs for Favorites beyond the UI label.

6) Replicate knobs (minimal)
replicate.webhookEnabled: keep true to avoid long polling; frontend still polls every 2s as a UI fallback.

timeouts.overallMs: if exceeded, mark job timed_out and free the in‑flight lock.

These are cheap, reliable defaults; we’re not adding a distributed queue for MVP.

7) Change management
Any change to libs/app-config/runtime.ts must be proposed via CHANGE SPEC (paste the full new file content in §4.1 Add/Modify), then applied.

No other code paths should hardcode presets/limits—always import from runtime config.

8) Acceptance checklist (config)
✅ UI dropdowns and defaults match runtimeConfig.

✅ API enforces accepted MIME types and max upload size.

✅ Plan limits enforced per priceId.

✅ Favorites exists and works out of the box.

✅ Replicate webhook and polling intervals reflect config values.

9) Theme and Branding Alignment

The `config.colors.main` value in `config.ts` should be aligned with the Theme v2 primary color for consistency across loaders, Chrome tabs, and other browser UI elements.

**Recommended value:** `#47B3FF` (hex equivalent of `hsl(203.8863 88.2845% 53.1373%)`)

This ensures visual consistency between:
- NextTopLoader progress bar
- Browser tab theme color
- PWA splash screens (if applicable)
- Any other components reading from config.colors.main

The actual component styling should use the CSS variable `--primary` from the design tokens for maintainability.
