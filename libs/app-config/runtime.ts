// File: libs/app-config/runtime.ts
export type Mode = 'redesign' | 'staging' | 'compose' | 'imagine'

// AspectRatio/Quality removed for current provider

export interface PresetItem { id: string; label: string; promptSeed?: string }
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
  // Provider model (we only support Google nano-banana in this app)
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
    community: boolean
    collections: boolean
  }
  presets: Presets
  defaults: GenerationDefaults
  limits: GenerationLimits
  plans: Plans
  replicate: ReplicateConfig
  promptEngine: {
    version: string
    maxChars: number
    negatives: string[]
    modeDefaults: {
      redesign: { includeStructureGuardrails: boolean }
      staging: { retainColorMood: boolean }
      compose: { enforceBaseVsReference: boolean }
      imagine: { enforceInteriorOnly: boolean; fallbackStyleId?: string; fallbackRoomTypeId?: string }
    }
    styleSeeds: Record<string, string>
    roomSeeds?: Record<string, string>
  }
}

// ---- DEFAULT EXPORT (MVP baseline) ----
const runtimeConfig: RuntimeConfig = {
  featureFlags: { community: false, collections: false },

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
      { id: 'coastal_au',  label: 'Coastal AU', promptSeed: 'coastal style: light timbers, white walls, linen textures, pale blues/greens' },
      { id: 'contemporary_au', label: 'Contemporary AU', promptSeed: 'contemporary style: clean lines, matte finishes, warm neutral palette' },
      { id: 'japandi',     label: 'Japandi', promptSeed: 'japandi style: minimal forms, natural woods, soft contrast' },
      { id: 'scandi_au',   label: 'Scandi AU', promptSeed: 'scandinavian style: light oak, white, soft greys, cozy textiles' },
      { id: 'minimal_au',  label: 'Minimal AU', promptSeed: 'minimal style: restrained palette, functional layout' },
      { id: 'midcentury_au', label: 'Mid‑Century AU', promptSeed: 'mid-century style: teak, low profiles, muted color accents' },
      { id: 'industrial_au', label: 'Industrial AU', promptSeed: 'industrial style: concrete, metal accents, leather' },
      { id: 'hamptons_au', label: 'Hamptons AU', promptSeed: 'hamptons style: white timber, navy accents, coastal elegance' }
    ],
  },

  defaults: {
    mode: 'redesign'
  },

  limits: {
    maxUploadsMB: 15,
    acceptedMimeTypes: ['image/jpeg','image/png','image/webp']
  },

  // IMPORTANT: keep keys in sync with config.ts.stripe.plans[*].priceId
  plans: {
    // Weekly $6.99 (test priceId in dev)
    'price_1S782TCZJ3iopmxZOw8mbsOV': { label: 'Weekly',  monthlyGenerations: 20,  maxConcurrentJobs: 1 },
    // Monthly $24.99 (test priceId in dev)
    'price_1S7832CZJ3iopmxZN96mdDtb': { label: 'Monthly', monthlyGenerations: 100, maxConcurrentJobs: 1 },
    // Live priceIds
    'price_1S78OkCZJ3iopmxZpmXhaK1l': { label: 'Weekly',  monthlyGenerations: 20,  maxConcurrentJobs: 1 },
    'price_1S78PJCZJ3iopmxZuoOkwjdl': { label: 'Monthly', monthlyGenerations: 100, maxConcurrentJobs: 1 },
  },

  replicate: {
    model: 'google/nano-banana',
    webhookEnabled: true,
    webhookRelativePath: '/api/v1/webhooks/replicate',
    pollingIntervalMs: 2000,
    timeouts: { submitMs: 20000, overallMs: 180000 }
  },

  // Prompt Engine configuration (generalized, country-agnostic)
  promptEngine: {
    version: 'v2',
    maxChars: 560,
    negatives: ['no people','no humans','no person','no faces','no text','no captions','no watermark','no logos'],
    modeDefaults: {
      redesign: { includeStructureGuardrails: true },
      staging: { retainColorMood: true },
      compose: { enforceBaseVsReference: true },
      imagine: { enforceInteriorOnly: true }
    },
    styleSeeds: {},
    roomSeeds: {}
  }
}

export default runtimeConfig
