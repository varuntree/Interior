# Phase 2: Runtime Config & Core Services
## Configuration System and Service Layer Foundation

### Phase Overview
**Duration**: 1 day
**Dependencies**: Phase 1 completed (repositories and migrations)
**Goal**: Implement centralized configuration and establish service layer patterns

### Required Reading Before Starting
1. `/ai_docs/spec/config_and_plans.md` - Runtime configuration specification
2. `/ai_docs/spec/system_architecture_and_api.md` - Service layer patterns
3. `/ai_docs/docs/01-handbook.md` - Section 5 (Services Standard)
4. `/ai_docs/docs/02-playbooks-and-templates.md` - Service template

---

## Task 2.1: Runtime Configuration System

### Create Runtime Config
Location: `libs/app-config/runtime.ts`

```typescript
// libs/app-config/runtime.ts

export type Mode = 'redesign' | 'staging' | 'compose' | 'imagine'
export type AspectRatio = '1:1' | '3:2' | '2:3'
export type Quality = 'auto' | 'low' | 'medium' | 'high'

export interface PresetItem {
  id: string
  label: string
}

export interface Presets {
  roomTypes: PresetItem[]
  styles: PresetItem[]
}

export interface GenerationDefaults {
  mode: Mode
  aspectRatio: AspectRatio
  quality: Quality
  variants: number
}

export interface GenerationLimits {
  maxVariantsPerRequest: number
  maxUploadsMB: number
  acceptedMimeTypes: string[]
}

export interface PlanConfig {
  label: string
  monthlyGenerations: number
  maxConcurrentJobs?: number
}

export interface Plans {
  [priceId: string]: PlanConfig
}

export interface ReplicateConfig {
  model: string
  webhookEnabled: boolean
  webhookRelativePath: string
  pollingIntervalMs: number
  timeouts: {
    submitMs: number
    overallMs: number
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
  collections: {
    defaultFavoritesName: string
  }
}

// Australian-oriented configuration
const runtimeConfig: RuntimeConfig = {
  featureFlags: {
    community: true,
    collections: true
  },

  presets: {
    roomTypes: [
      { id: 'living_room', label: 'Living Room' },
      { id: 'bedroom', label: 'Bedroom' },
      { id: 'kitchen', label: 'Kitchen' },
      { id: 'dining', label: 'Dining Room' },
      { id: 'bathroom', label: 'Bathroom' },
      { id: 'home_office', label: 'Home Office' },
      { id: 'outdoor_patio', label: 'Outdoor/Patio' },
      { id: 'entryway', label: 'Entryway' },
      { id: 'kids_room', label: "Kids' Room" },
      { id: 'granny_flat', label: 'Granny Flat' }
    ],
    styles: [
      { id: 'coastal_au', label: 'Coastal AU' },
      { id: 'contemporary_au', label: 'Contemporary AU' },
      { id: 'japandi', label: 'Japandi' },
      { id: 'scandi_au', label: 'Scandi AU' },
      { id: 'minimal_au', label: 'Minimal AU' },
      { id: 'midcentury_au', label: 'Mid-Century AU' },
      { id: 'industrial_au', label: 'Industrial AU' },
      { id: 'hamptons', label: 'Hamptons-inspired' },
      { id: 'modern_farmhouse', label: 'Modern Farmhouse' },
      { id: 'luxe_au', label: 'Luxe Australian' }
    ]
  },

  defaults: {
    mode: 'redesign',
    aspectRatio: '1:1',
    quality: 'auto',
    variants: 2
  },

  limits: {
    maxVariantsPerRequest: 3,
    maxUploadsMB: 15,
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },

  // Map these to your actual Stripe price IDs from config.ts
  plans: {
    // Development price IDs (from config.ts)
    'price_1Niyy5AxyNprDp7iZIqEyD2h': {
      label: 'Starter',
      monthlyGenerations: 150,
      maxConcurrentJobs: 1
    },
    'price_1O5KtcAxyNprDp7iftKnrrpw': {
      label: 'Advanced',
      monthlyGenerations: 600,
      maxConcurrentJobs: 1
    },
    // Free tier for users without a plan
    'free': {
      label: 'Free Trial',
      monthlyGenerations: 20,
      maxConcurrentJobs: 1
    }
  },

  replicate: {
    model: 'openai/gpt-image-1',
    webhookEnabled: true,
    webhookRelativePath: '/api/v1/webhooks/replicate',
    pollingIntervalMs: 2000,
    timeouts: {
      submitMs: 20000,
      overallMs: 600000 // 10 minutes
    }
  },

  collections: {
    defaultFavoritesName: 'My Favorites'
  }
}

export default runtimeConfig

// Helper functions
export function getModeLabel(mode: Mode): string {
  const labels: Record<Mode, string> = {
    redesign: 'Redesign',
    staging: 'Virtual Staging',
    compose: 'Compose',
    imagine: 'Imagine'
  }
  return labels[mode]
}

export function getRoomTypeLabel(id: string): string {
  const roomType = runtimeConfig.presets.roomTypes.find(rt => rt.id === id)
  return roomType?.label || id
}

export function getStyleLabel(id: string): string {
  const style = runtimeConfig.presets.styles.find(s => s.id === id)
  return style?.label || id
}

export function getPlanByPriceId(priceId: string | null): PlanConfig {
  if (!priceId) return runtimeConfig.plans.free
  return runtimeConfig.plans[priceId] || runtimeConfig.plans.free
}

export function getAllowedModes(): Mode[] {
  return ['redesign', 'staging', 'compose', 'imagine']
}

export function getAllowedAspectRatios(): AspectRatio[] {
  return ['1:1', '3:2', '2:3']
}

export function getAllowedQualities(): Quality[] {
  return ['auto', 'low', 'medium', 'high']
}
```

---

## Task 2.2: Update Main Config
Location: `config.ts`

Update the existing config.ts to align with Theme v2:

```typescript
// Add/update in config.ts
const config = {
  // ... existing config ...
  
  colors: {
    // Updated to match Theme v2 primary color
    main: "#47B3FF", // hsl(203.8863 88.2845% 53.1373%)
    // Add theme indicator for compatibility
    theme: 'light' as const
  },
  
  // ... rest of existing config ...
}
```

---

## Task 2.3: Core Service Layer

### Service Context Type
Create `libs/services/types.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/auth-helpers-shared'

export interface ServiceContext {
  supabase: SupabaseClient
  user?: User
}

export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

// Common error factories
export const Errors = {
  unauthorized: () => new ServiceError('UNAUTHORIZED', 'Unauthorized', 401),
  forbidden: () => new ServiceError('FORBIDDEN', 'Forbidden', 403),
  notFound: (resource: string) => new ServiceError('NOT_FOUND', `${resource} not found`, 404),
  validation: (message: string, details?: unknown) => 
    new ServiceError('VALIDATION_ERROR', message, 400, details),
  conflict: (message: string) => new ServiceError('CONFLICT', message, 409),
  limitExceeded: (message: string) => new ServiceError('LIMIT_EXCEEDED', message, 402),
  tooManyInflight: () => 
    new ServiceError('TOO_MANY_INFLIGHT', 'Please wait until current generation is complete', 409),
  upstream: (message: string) => new ServiceError('UPSTREAM_ERROR', message, 502),
  internal: (message: string) => new ServiceError('INTERNAL_ERROR', message, 500)
}
```

### Usage Service
Create `libs/services/usage.ts`:

```typescript
import { ServiceContext, ServiceError, Errors } from './types'
import * as usageRepo from '@/libs/repositories/usage'
import * as profilesRepo from '@/libs/repositories/profiles'
import runtimeConfig, { getPlanByPriceId } from '@/libs/app-config/runtime'

export async function getRemainingGenerations(
  ctx: ServiceContext,
  userId: string
): Promise<number> {
  // Get user's plan
  const profile = await profilesRepo.getProfile(ctx.supabase, userId)
  if (!profile) throw Errors.notFound('Profile')
  
  const plan = getPlanByPriceId(profile.price_id)
  
  // Calculate current month usage
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const usage = await usageRepo.getMonthlyUsage(
    ctx.supabase,
    userId,
    firstDayOfMonth.toISOString()
  )
  
  return Math.max(0, plan.monthlyGenerations - usage)
}

export async function checkGenerationLimit(
  ctx: ServiceContext,
  userId: string
): Promise<void> {
  const remaining = await getRemainingGenerations(ctx, userId)
  if (remaining <= 0) {
    throw Errors.limitExceeded('You have reached your monthly generation limit')
  }
}

export async function debitGeneration(
  ctx: ServiceContext,
  userId: string,
  jobId: string
): Promise<void> {
  await usageRepo.debitGeneration(ctx.supabase, userId, jobId, 1)
}

export async function getUsageStats(
  ctx: ServiceContext,
  userId: string
): Promise<{
  used: number
  remaining: number
  limit: number
  planLabel: string
}> {
  const profile = await profilesRepo.getProfile(ctx.supabase, userId)
  if (!profile) throw Errors.notFound('Profile')
  
  const plan = getPlanByPriceId(profile.price_id)
  const remaining = await getRemainingGenerations(ctx, userId)
  const used = plan.monthlyGenerations - remaining
  
  return {
    used,
    remaining,
    limit: plan.monthlyGenerations,
    planLabel: plan.label
  }
}
```

### Collections Service
Create `libs/services/collections.ts`:

```typescript
import { ServiceContext, Errors } from './types'
import * as collectionsRepo from '@/libs/repositories/collections'
import * as rendersRepo from '@/libs/repositories/renders'
import runtimeConfig from '@/libs/app-config/runtime'

export async function ensureDefaultFavorites(
  ctx: ServiceContext,
  userId: string
): Promise<string> {
  // Check if default favorites exists
  const existing = await collectionsRepo.getDefaultFavorites(ctx.supabase, userId)
  if (existing) return existing.id
  
  // Create if not exists
  const created = await collectionsRepo.createCollection(
    ctx.supabase,
    userId,
    runtimeConfig.collections.defaultFavoritesName
  )
  
  // Mark as default (would need to add this to repo)
  await ctx.supabase
    .from('collections')
    .update({ is_default_favorites: true })
    .eq('id', created.id)
  
  return created.id
}

export async function addToFavorites(
  ctx: ServiceContext,
  userId: string,
  renderId: string
): Promise<void> {
  // Verify render belongs to user
  const render = await rendersRepo.getRenderWithVariants(
    ctx.supabase,
    renderId,
    userId
  )
  if (!render) throw Errors.notFound('Render')
  
  // Get or create default favorites
  const favoritesId = await ensureDefaultFavorites(ctx, userId)
  
  // Add to collection (idempotent)
  await collectionsRepo.addToCollection(ctx.supabase, favoritesId, renderId)
}

export async function createCollection(
  ctx: ServiceContext,
  userId: string,
  name: string
): Promise<{ id: string; name: string }> {
  if (!name || name.trim().length === 0) {
    throw Errors.validation('Collection name is required')
  }
  
  if (name.length > 100) {
    throw Errors.validation('Collection name must be less than 100 characters')
  }
  
  const collection = await collectionsRepo.createCollection(
    ctx.supabase,
    userId,
    name.trim()
  )
  
  return {
    id: collection.id,
    name: collection.name
  }
}

export async function listCollections(
  ctx: ServiceContext,
  userId: string
): Promise<Array<{
  id: string
  name: string
  isDefault: boolean
  createdAt: string
}>> {
  const collections = await collectionsRepo.listCollections(ctx.supabase, userId)
  
  return collections.map(c => ({
    id: c.id,
    name: c.name,
    isDefault: c.is_default_favorites,
    createdAt: c.created_at
  }))
}

export async function deleteCollection(
  ctx: ServiceContext,
  userId: string,
  collectionId: string
): Promise<void> {
  // Get collection to check ownership and type
  const collections = await collectionsRepo.listCollections(ctx.supabase, userId)
  const collection = collections.find(c => c.id === collectionId)
  
  if (!collection) {
    throw Errors.notFound('Collection')
  }
  
  if (collection.is_default_favorites) {
    throw Errors.validation('Cannot delete default favorites collection')
  }
  
  await collectionsRepo.deleteCollection(ctx.supabase, collectionId, userId)
}
```

### Renders Service
Create `libs/services/renders.ts`:

```typescript
import { ServiceContext, Errors } from './types'
import * as rendersRepo from '@/libs/repositories/renders'

export interface RenderListItem {
  id: string
  coverUrl?: string
  coverThumbUrl?: string
  mode: string
  roomType?: string
  style?: string
  createdAt: string
}

export async function listRenders(
  ctx: ServiceContext,
  userId: string,
  filters?: {
    mode?: string
    roomType?: string
    style?: string
  },
  pagination?: {
    limit?: number
    cursor?: string
  }
): Promise<{
  items: RenderListItem[]
  nextCursor?: string
}> {
  const { items, nextCursor } = await rendersRepo.listRenders(
    ctx.supabase,
    userId,
    filters,
    pagination
  )
  
  // For each render, get the cover variant URL
  const renderItems: RenderListItem[] = []
  
  for (const render of items) {
    const { variants } = await rendersRepo.getRenderWithVariants(
      ctx.supabase,
      render.id,
      userId
    ) || { variants: [] }
    
    const coverVariant = variants.find(v => v.idx === render.cover_variant)
    
    renderItems.push({
      id: render.id,
      coverUrl: coverVariant ? `/api/v1/assets/${coverVariant.image_path}` : undefined,
      coverThumbUrl: coverVariant?.thumb_path ? `/api/v1/assets/${coverVariant.thumb_path}` : undefined,
      mode: render.mode,
      roomType: render.room_type,
      style: render.style,
      createdAt: render.created_at
    })
  }
  
  return {
    items: renderItems,
    nextCursor
  }
}

export async function getRenderDetails(
  ctx: ServiceContext,
  renderId: string,
  userId: string
): Promise<{
  id: string
  mode: string
  roomType?: string
  style?: string
  variants: Array<{
    index: number
    url: string
    thumbUrl?: string
  }>
  createdAt: string
} | null> {
  const result = await rendersRepo.getRenderWithVariants(
    ctx.supabase,
    renderId,
    userId
  )
  
  if (!result) return null
  
  const { render, variants } = result
  
  return {
    id: render.id,
    mode: render.mode,
    roomType: render.room_type,
    style: render.style,
    variants: variants.map(v => ({
      index: v.idx,
      url: `/api/v1/assets/${v.image_path}`,
      thumbUrl: v.thumb_path ? `/api/v1/assets/${v.thumb_path}` : undefined
    })),
    createdAt: render.created_at
  }
}

export async function deleteRender(
  ctx: ServiceContext,
  renderId: string,
  userId: string
): Promise<void> {
  // This will cascade delete variants and collection items
  await rendersRepo.deleteRender(ctx.supabase, renderId, userId)
}
```

### Generation Service (Stub)
Create `libs/services/generation.ts`:

```typescript
import { ServiceContext, Errors } from './types'
import * as jobsRepo from '@/libs/repositories/generation_jobs'
import * as usageService from './usage'
import runtimeConfig from '@/libs/app-config/runtime'

export interface GenerationRequest {
  mode: 'redesign' | 'staging' | 'compose' | 'imagine'
  prompt?: string
  roomType?: string
  style?: string
  aspectRatio?: '1:1' | '3:2' | '2:3'
  quality?: 'auto' | 'low' | 'medium' | 'high'
  variants?: number
  input1Path?: string
  input2Path?: string
  idempotencyKey?: string
}

export interface GenerationResult {
  id: string
  status: string
  mode: string
  settings: {
    roomType?: string
    style?: string
    aspectRatio: string
    quality: string
    variants: number
  }
  predictionId?: string
}

export async function submitGeneration(
  ctx: ServiceContext,
  userId: string,
  request: GenerationRequest
): Promise<GenerationResult> {
  // Check for in-flight jobs
  const inflightJob = await jobsRepo.findInflightJobForUser(ctx.supabase, userId)
  if (inflightJob) {
    throw Errors.tooManyInflight()
  }
  
  // Check generation limits
  await usageService.checkGenerationLimit(ctx, userId)
  
  // Check idempotency
  if (request.idempotencyKey) {
    const existingJob = await jobsRepo.findJobByIdempotencyKey(
      ctx.supabase,
      userId,
      request.idempotencyKey
    )
    if (existingJob) {
      return {
        id: existingJob.id,
        status: existingJob.status,
        mode: existingJob.mode,
        settings: {
          roomType: existingJob.room_type,
          style: existingJob.style,
          aspectRatio: existingJob.aspect_ratio,
          quality: existingJob.quality,
          variants: existingJob.variants
        },
        predictionId: existingJob.prediction_id
      }
    }
  }
  
  // Validate request
  validateGenerationRequest(request)
  
  // Apply defaults
  const settings = {
    aspectRatio: request.aspectRatio || runtimeConfig.defaults.aspectRatio,
    quality: request.quality || runtimeConfig.defaults.quality,
    variants: Math.min(
      request.variants || runtimeConfig.defaults.variants,
      runtimeConfig.limits.maxVariantsPerRequest
    )
  }
  
  // Create job (placeholder - Replicate integration in Phase 3)
  const job = await jobsRepo.createJob(ctx.supabase, {
    owner_id: userId,
    mode: request.mode,
    room_type: request.roomType,
    style: request.style,
    aspect_ratio: settings.aspectRatio,
    quality: settings.quality,
    variants: settings.variants,
    input1_path: request.input1Path,
    input2_path: request.input2Path,
    prompt: request.prompt,
    status: 'starting',
    idempotency_key: request.idempotencyKey
  })
  
  // Debit usage immediately
  await usageService.debitGeneration(ctx, userId, job.id)
  
  // TODO: Phase 3 - Replicate integration
  // For now, return the created job
  
  return {
    id: job.id,
    status: job.status,
    mode: job.mode,
    settings: {
      roomType: job.room_type,
      style: job.style,
      aspectRatio: job.aspect_ratio,
      quality: job.quality,
      variants: job.variants
    },
    predictionId: job.prediction_id
  }
}

export async function getGeneration(
  ctx: ServiceContext,
  jobId: string,
  userId: string
): Promise<GenerationResult | null> {
  const job = await jobsRepo.getJobById(ctx.supabase, jobId, userId)
  if (!job) return null
  
  // TODO: Phase 3 - Poll Replicate if stale
  
  return {
    id: job.id,
    status: job.status,
    mode: job.mode,
    settings: {
      roomType: job.room_type,
      style: job.style,
      aspectRatio: job.aspect_ratio,
      quality: job.quality,
      variants: job.variants
    },
    predictionId: job.prediction_id
  }
}

function validateGenerationRequest(request: GenerationRequest): void {
  // Mode validation
  const allowedModes = ['redesign', 'staging', 'compose', 'imagine'] as const
  if (!allowedModes.includes(request.mode)) {
    throw Errors.validation(`Invalid mode: ${request.mode}`)
  }
  
  // Mode-specific validation
  switch (request.mode) {
    case 'imagine':
      if (!request.prompt) {
        throw Errors.validation('Prompt is required for Imagine mode')
      }
      break
    case 'redesign':
    case 'staging':
      if (!request.input1Path) {
        throw Errors.validation('Input image is required for this mode')
      }
      break
    case 'compose':
      if (!request.input1Path || !request.input2Path) {
        throw Errors.validation('Two input images are required for Compose mode')
      }
      break
  }
  
  // Variants validation
  if (request.variants !== undefined) {
    if (request.variants < 1 || request.variants > runtimeConfig.limits.maxVariantsPerRequest) {
      throw Errors.validation(
        `Variants must be between 1 and ${runtimeConfig.limits.maxVariantsPerRequest}`
      )
    }
  }
}
```

### Community Service
Create `libs/services/community.ts`:

```typescript
import { ServiceContext } from './types'
import * as communityRepo from '@/libs/repositories/community'

export async function listCommunityCollections(
  ctx: ServiceContext
): Promise<Array<{
  id: string
  title: string
  description?: string
  isFeatured: boolean
  orderIndex: number
}>> {
  const collections = await communityRepo.listCommunityCollections(ctx.supabase)
  
  return collections.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    isFeatured: c.is_featured,
    orderIndex: c.order_index
  }))
}

export async function getCommunityCollection(
  ctx: ServiceContext,
  collectionId: string
): Promise<{
  collection: {
    id: string
    title: string
    description?: string
  }
  items: Array<{
    id: string
    imageUrl?: string
    applySettings?: Record<string, any>
  }>
} | null> {
  const result = await communityRepo.getCommunityCollectionWithItems(
    ctx.supabase,
    collectionId
  )
  
  if (!result) return null
  
  return {
    collection: {
      id: result.collection.id,
      title: result.collection.title,
      description: result.collection.description
    },
    items: result.items.map(item => ({
      id: item.id,
      imageUrl: item.external_image_url || undefined,
      applySettings: item.apply_settings || undefined
    }))
  }
}
```

---

## Task 2.4: Environment Variables

### Update Environment Types
Create/update `libs/env/index.ts`:

```typescript
import { z } from 'zod'

const envSchema = z.object({
  // Existing env vars
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  
  // Stripe
  STRIPE_PUBLIC_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  
  // Replicate (new)
  REPLICATE_API_TOKEN: z.string(),
  
  // Optional
  RESEND_API_KEY: z.string().optional(),
  PUBLIC_BASE_URL: z.string().url().optional()
})

export type Env = z.infer<typeof envSchema>

// Server-only env
export const serverEnv = (): Env => {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv should only be called on the server')
  }
  
  return envSchema.parse(process.env)
}

// Client-safe env
export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
}
```

### Update .env.example
Add to `.env.example`:

```bash
# Replicate
REPLICATE_API_TOKEN=your_replicate_api_token

# Optional: Public URL for webhooks
PUBLIC_BASE_URL=http://localhost:3000
```

---

## Verification Steps

### Step 1: Verify Runtime Config
```typescript
// Test file: test-config.ts
import runtimeConfig, { 
  getPlanByPriceId, 
  getRoomTypeLabel,
  getStyleLabel 
} from '@/libs/app-config/runtime'

console.log('Presets loaded:', {
  roomTypes: runtimeConfig.presets.roomTypes.length,
  styles: runtimeConfig.presets.styles.length
})

console.log('Default plan:', getPlanByPriceId(null))
console.log('Room label:', getRoomTypeLabel('living_room'))
console.log('Style label:', getStyleLabel('coastal_au'))
```

### Step 2: Test Services
```typescript
// Test file: test-services.ts
import { createClient } from '@/libs/supabase/server'
import * as usageService from '@/libs/services/usage'
import * as collectionsService from '@/libs/services/collections'

async function testServices() {
  const supabase = createClient()
  const ctx = { supabase }
  
  // Test usage service
  try {
    const stats = await usageService.getUsageStats(ctx, 'test-user-id')
    console.log('Usage stats:', stats)
  } catch (error) {
    console.error('Usage service error:', error)
  }
  
  // Test collections service
  try {
    const collections = await collectionsService.listCollections(ctx, 'test-user-id')
    console.log('Collections:', collections)
  } catch (error) {
    console.error('Collections service error:', error)
  }
}
```

### Step 3: Verify Type Safety
```bash
# Run type checking
npm run typecheck

# Should pass without errors
```

### Step 4: Build Verification
```bash
# Verify build succeeds
npm run build

# Check for any import errors or missing dependencies
```

---

## Success Criteria
- [ ] Runtime config created with Australian presets
- [ ] All service files created with pure functions
- [ ] Service context pattern implemented
- [ ] Error handling standardized
- [ ] Environment variables typed
- [ ] config.ts updated with Theme v2 color
- [ ] Type checking passes
- [ ] Build succeeds

---

## Common Issues & Solutions

### Issue: Import errors for repositories
**Solution**: Ensure Phase 1 repositories are complete and exported correctly

### Issue: Supabase client type errors
**Solution**: Check @supabase/supabase-js is installed and types match

### Issue: Config not found
**Solution**: Verify libs/app-config/runtime.ts exports default config

### Issue: Service errors not handled
**Solution**: Use try/catch in routes, convert ServiceError to API response

---

## Integration Notes

### For API Routes (Phase 3+)
```typescript
// Example usage in API route
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { getUserFromRequest } from '@/libs/api-utils/auth'
import * as generationService from '@/libs/services/generation'
import { ok, fail } from '@/libs/api-utils/responses'

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return unauthorized()
    
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    const result = await generationService.submitGeneration(
      ctx,
      user.id,
      requestData
    )
    
    return accepted(result)
  } catch (error) {
    if (error instanceof ServiceError) {
      return fail(error.statusCode, error.code, error.message, error.details)
    }
    return serverError()
  }
}
```

---

## Next Phase Preview
Phase 3 will implement:
- Replicate adapter with prompt building
- Complete generation service
- Generation API endpoints
- Webhook processing foundation

Ensure all Phase 2 services are working before proceeding to Phase 3.