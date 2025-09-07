// File: libs/app-config/runtime.ts
export type Mode = 'redesign' | 'staging' | 'compose' | 'imagine'

// AspectRatio/Quality removed for current provider

export interface PresetItem { id: string; label: string }
export interface Presets {
  roomTypes: PresetItem[]        // AU‑oriented list
  styles: PresetItem[]           // AU‑oriented list
}

export interface GenerationDefaults {
  mode: Mode
}

export interface GenerationLimits {
  maxUploadsMB: number           // per image input
  acceptedMimeTypes: string[]    // e.g., ['image/jpeg','image/png','image/webp']
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
  // Supported models (kept as a union for potential toggling/rollback)
  model: 'google/nano-banana' | 'openai/gpt-image-1'
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
      { id: 'dining_room', label: 'Dining Room' },
      { id: 'home_office', label: 'Home Office' },
      { id: 'alfresco',    label: 'Alfresco / Patio' },       // AU-flavoured
      { id: 'granny_flat', label: 'Granny Flat' }             // AU-flavoured
    ],
    styles: [
      { id: 'coastal_au',  label: 'Coastal AU' },
      { id: 'contemporary_au', label: 'Contemporary AU' },
      { id: 'japandi',     label: 'Japandi' },
      { id: 'scandi_au',   label: 'Scandi AU' },
      { id: 'minimal_au',  label: 'Minimal AU' },
      { id: 'midcentury_au', label: 'Mid‑Century AU' },
      { id: 'industrial_au', label: 'Industrial AU' },
      { id: 'hamptons_au', label: 'Hamptons AU' }             // AU-flavoured
    ],
  },

  defaults: {
    mode: 'redesign'
  },

  limits: {
    maxUploadsMB: 15,
    acceptedMimeTypes: ['image/jpeg','image/png','image/webp']
  },

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
