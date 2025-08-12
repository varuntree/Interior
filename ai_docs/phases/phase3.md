# Phase 3: Generation Engine & Replicate Integration
## Core Generation Flow with OpenAI GPT-Image Model

### Phase Overview
**Duration**: 1-2 days
**Dependencies**: Phase 1 & 2 completed (repositories, services, config)
**Goal**: Implement complete generation flow with Replicate integration

### Required Reading Before Starting
1. `/ai_docs/spec/generation_engine_and_external_service.md` - Complete generation specification
2. `/ai_docs/spec/system_architecture_and_api.md` - API contracts (Section 6.2)
3. `/ai_docs/docs/01-handbook.md` - Section 4 (API Standard)
4. `/ai_docs/docs/02-playbooks-and-templates.md` - API route template

---

## Task 3.1: Replicate Client Setup

### Install Replicate SDK
```bash
npm install replicate
```

### Create Replicate Client
Location: `libs/external/replicate-client.ts`

```typescript
import Replicate from 'replicate'
import { serverEnv } from '@/libs/env'

let replicateClient: Replicate | null = null

export function getReplicateClient(): Replicate {
  if (!replicateClient) {
    const env = serverEnv()
    replicateClient = new Replicate({
      auth: env.REPLICATE_API_TOKEN
    })
  }
  return replicateClient
}

export interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string[]
  error?: string
  logs?: string
  created_at: string
  completed_at?: string
}

export async function createPrediction(
  model: string,
  input: Record<string, any>,
  webhookUrl?: string
): Promise<ReplicatePrediction> {
  const client = getReplicateClient()
  
  const prediction = await client.predictions.create({
    model,
    input,
    webhook: webhookUrl ? {
      url: webhookUrl,
      events: ['completed']
    } : undefined
  })
  
  return prediction as ReplicatePrediction
}

export async function getPrediction(
  predictionId: string
): Promise<ReplicatePrediction | null> {
  const client = getReplicateClient()
  
  try {
    const prediction = await client.predictions.get(predictionId)
    return prediction as ReplicatePrediction
  } catch (error) {
    console.error('Error fetching prediction:', error)
    return null
  }
}
```

---

## Task 3.2: Replicate Adapter

### Create Adapter
Location: `libs/services/external/replicateAdapter.ts`

```typescript
import runtimeConfig from '@/libs/app-config/runtime'

export interface InternalGenerationRequest {
  mode: 'redesign' | 'staging' | 'compose' | 'imagine'
  prompt?: string
  roomType?: string
  style?: string
  aspectRatio: '1:1' | '3:2' | '2:3'
  quality: 'auto' | 'low' | 'medium' | 'high'
  variants: number
  signedInput1Url?: string
  signedInput2Url?: string
}

// Prompt templates with Australian context
const PROMPT_TEMPLATES = {
  // Shared guardrails for structural modes
  structuralGuardrails: [
    'Photoreal interior render with correct perspective and realistic lighting.',
    'Keep existing room architecture: walls, windows, doors, floors, ceiling height and wall positions unchanged.',
    'Do not alter structural layout, view direction, or window positions.'
  ].join(' '),
  
  // Australian context
  australianContext: [
    'Use materials and furnishings commonly found in Australian homes.',
    'Respect local light quality: bright, airy daylight typical of Australian climate.',
    'Modern Australian interior design aesthetic.'
  ].join(' '),
  
  // Style descriptions
  styles: {
    coastal_au: 'Coastal Australian style with light timbers, white walls, linen textures, pale blues and greens, natural materials',
    contemporary_au: 'Contemporary Australian with clean lines, matte finishes, warm neutral palette, sophisticated urban feel',
    japandi: 'Japandi style combining Japanese minimalism with Scandinavian comfort, natural woods, soft contrast',
    scandi_au: 'Scandinavian Australian with light oak, white walls, soft greys, cozy textiles, hygge elements',
    minimal_au: 'Minimalist Australian with restrained palette, functional layout, clean lines, uncluttered spaces',
    midcentury_au: 'Mid-Century Australian with teak woods, low profile furniture, muted color pops, retro elements',
    industrial_au: 'Industrial Australian with exposed concrete, metal accents, leather, urban warehouse aesthetic',
    hamptons: 'Hamptons-inspired with white and navy palette, shiplap walls, natural textures, coastal elegance',
    modern_farmhouse: 'Modern Farmhouse with rustic wood elements, white walls, black accents, comfortable country style',
    luxe_au: 'Luxe Australian with premium materials, sophisticated palette, designer furniture, high-end finishes'
  }
}

export function buildPrompt(request: InternalGenerationRequest): string {
  const parts: string[] = []
  
  // Mode-specific base prompt
  switch (request.mode) {
    case 'redesign':
      parts.push(PROMPT_TEMPLATES.structuralGuardrails)
      parts.push('Restyle the furnishings, decor, color palette and finishes while keeping room structure intact.')
      break
      
    case 'staging':
      parts.push(PROMPT_TEMPLATES.structuralGuardrails)
      parts.push('Virtual staging: Add tasteful furniture and decor appropriate for the space.')
      parts.push('Assume the room may be empty or under-furnished.')
      break
      
    case 'compose':
      parts.push('Use the first image as the base room and keep its architecture completely intact.')
      parts.push('Apply style, palette, materials, or specific objects from the second reference image.')
      parts.push('Harmonize lighting and maintain realistic perspective.')
      break
      
    case 'imagine':
      parts.push('Generate a photorealistic interior design concept.')
      parts.push('Create a balanced composition with realistic materials and natural lighting.')
      break
  }
  
  // Add Australian context (except for imagine which might want other locations)
  if (request.mode !== 'imagine' || request.style?.includes('_au')) {
    parts.push(PROMPT_TEMPLATES.australianContext)
  }
  
  // Add room type if specified
  if (request.roomType) {
    const roomLabel = request.roomType.replace(/_/g, ' ')
    parts.push(`Room type: ${roomLabel}.`)
  }
  
  // Add style if specified
  if (request.style && PROMPT_TEMPLATES.styles[request.style as keyof typeof PROMPT_TEMPLATES.styles]) {
    const styleDesc = PROMPT_TEMPLATES.styles[request.style as keyof typeof PROMPT_TEMPLATES.styles]
    parts.push(`Style: ${styleDesc}.`)
  }
  
  // Add user prompt if provided
  if (request.prompt) {
    parts.push(`Additional requirements: ${request.prompt}`)
  }
  
  // Add quality hints based on quality setting
  if (request.quality === 'high') {
    parts.push('Ultra high quality, professional architectural photography, magazine quality.')
  } else if (request.quality === 'low') {
    parts.push('Quick concept visualization.')
  }
  
  return parts.join(' ').trim()
}

export function toReplicateInputs(
  request: InternalGenerationRequest
): Record<string, any> {
  const prompt = buildPrompt(request)
  
  // Map aspect ratio to dimensions
  const dimensions = mapAspectRatioToDimensions(request.aspectRatio, request.quality)
  
  // Build input object for OpenAI GPT-Image model
  const inputs: Record<string, any> = {
    prompt,
    n: request.variants,
    size: `${dimensions.width}x${dimensions.height}`
  }
  
  // Add image inputs if provided
  if (request.signedInput1Url) {
    // For models that support image inputs
    // Note: OpenAI DALL-E doesn't support image inputs directly
    // You might need to use a different model like stability-ai/sdxl
    inputs.image = request.signedInput1Url
    
    if (request.signedInput2Url && request.mode === 'compose') {
      // For compose mode with two images
      inputs.mask = request.signedInput2Url // or use a different field based on model
    }
  }
  
  return inputs
}

function mapAspectRatioToDimensions(
  aspectRatio: '1:1' | '3:2' | '2:3',
  quality: 'auto' | 'low' | 'medium' | 'high'
): { width: number; height: number } {
  // Base dimensions based on quality
  const qualityMap = {
    low: 768,
    medium: 1024,
    high: 1536,
    auto: 1024
  }
  
  const base = qualityMap[quality]
  
  // Calculate dimensions based on aspect ratio
  switch (aspectRatio) {
    case '1:1':
      return { width: base, height: base }
    case '3:2':
      return { 
        width: Math.round(base * 1.5), 
        height: base 
      }
    case '2:3':
      return { 
        width: base, 
        height: Math.round(base * 1.5) 
      }
    default:
      return { width: base, height: base }
  }
}

// Helper to validate model requirements
export function validateForModel(request: InternalGenerationRequest): string[] {
  const errors: string[] = []
  
  // Check mode-specific requirements
  switch (request.mode) {
    case 'imagine':
      if (!request.prompt) {
        errors.push('Prompt is required for Imagine mode')
      }
      break
    case 'redesign':
    case 'staging':
      if (!request.signedInput1Url) {
        errors.push('Input image is required for this mode')
      }
      break
    case 'compose':
      if (!request.signedInput1Url || !request.signedInput2Url) {
        errors.push('Two input images are required for Compose mode')
      }
      break
  }
  
  return errors
}
```

---

## Task 3.3: Complete Generation Service

### Update Generation Service
Location: `libs/services/generation.ts` (update existing)

```typescript
import { ServiceContext, Errors } from './types'
import * as jobsRepo from '@/libs/repositories/generation_jobs'
import * as rendersRepo from '@/libs/repositories/renders'
import * as usageService from './usage'
import * as replicateAdapter from './external/replicateAdapter'
import { createPrediction, getPrediction } from '@/libs/external/replicate-client'
import runtimeConfig from '@/libs/app-config/runtime'
import { serverEnv } from '@/libs/env'

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
  error?: string
  variants?: Array<{
    index: number
    url: string
    thumbUrl?: string
  }>
  createdAt: string
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
      return formatJobResult(existingJob)
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
  
  // Create job
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
  
  try {
    // Generate signed URLs for inputs (if provided)
    const signedUrls = await generateSignedInputUrls(ctx, request)
    
    // Build Replicate inputs
    const replicateInputs = replicateAdapter.toReplicateInputs({
      mode: request.mode,
      prompt: request.prompt,
      roomType: request.roomType,
      style: request.style,
      aspectRatio: settings.aspectRatio,
      quality: settings.quality,
      variants: settings.variants,
      signedInput1Url: signedUrls.input1,
      signedInput2Url: signedUrls.input2
    })
    
    // Build webhook URL
    const webhookUrl = buildWebhookUrl()
    
    // Create Replicate prediction
    const prediction = await createPrediction(
      runtimeConfig.replicate.model,
      replicateInputs,
      webhookUrl
    )
    
    // Update job with prediction ID
    await jobsRepo.updateJobStatus(ctx.supabase, job.id, {
      prediction_id: prediction.id,
      status: prediction.status === 'starting' ? 'processing' : prediction.status
    })
    
    return formatJobResult({
      ...job,
      prediction_id: prediction.id,
      status: prediction.status
    })
  } catch (error) {
    // Mark job as failed
    await jobsRepo.updateJobStatus(ctx.supabase, job.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to create prediction',
      completed_at: new Date().toISOString()
    })
    
    throw Errors.upstream('Failed to start generation')
  }
}

export async function getGeneration(
  ctx: ServiceContext,
  jobId: string,
  userId: string
): Promise<GenerationResult | null> {
  const job = await jobsRepo.getJobById(ctx.supabase, jobId, userId)
  if (!job) return null
  
  // If job is non-terminal and stale, poll Replicate
  if (shouldPollReplicate(job)) {
    await pollAndUpdateJob(ctx, job)
    // Refetch job after update
    const updatedJob = await jobsRepo.getJobById(ctx.supabase, jobId, userId)
    if (updatedJob) {
      return formatJobResultWithVariants(ctx, updatedJob)
    }
  }
  
  return formatJobResultWithVariants(ctx, job)
}

async function formatJobResultWithVariants(
  ctx: ServiceContext,
  job: jobsRepo.GenerationJob
): Promise<GenerationResult> {
  const result = formatJobResult(job)
  
  // If succeeded, get render variants
  if (job.status === 'succeeded') {
    // Find render for this job
    const renders = await rendersRepo.listRenders(
      ctx.supabase,
      job.owner_id,
      { mode: job.mode },
      { limit: 1 }
    )
    
    const render = renders.items.find(r => 
      // Match by job_id (would need to add job_id to renders query)
      true // Placeholder - need to enhance repository
    )
    
    if (render) {
      const renderDetails = await rendersRepo.getRenderWithVariants(
        ctx.supabase,
        render.id,
        job.owner_id
      )
      
      if (renderDetails) {
        result.variants = renderDetails.variants.map(v => ({
          index: v.idx,
          url: `/api/v1/assets/${v.image_path}`,
          thumbUrl: v.thumb_path ? `/api/v1/assets/${v.thumb_path}` : undefined
        }))
      }
    }
  }
  
  return result
}

function formatJobResult(job: jobsRepo.GenerationJob): GenerationResult {
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
    predictionId: job.prediction_id,
    error: job.error,
    createdAt: job.created_at
  }
}

function shouldPollReplicate(job: jobsRepo.GenerationJob): boolean {
  if (!job.prediction_id) return false
  if (['succeeded', 'failed', 'canceled'].includes(job.status)) return false
  
  // Check if stale (>5 seconds since last update)
  const lastUpdate = job.completed_at || job.created_at
  const staleTime = 5000 // 5 seconds
  const now = Date.now()
  const lastUpdateTime = new Date(lastUpdate).getTime()
  
  return (now - lastUpdateTime) > staleTime
}

async function pollAndUpdateJob(
  ctx: ServiceContext,
  job: jobsRepo.GenerationJob
): Promise<void> {
  if (!job.prediction_id) return
  
  try {
    const prediction = await getPrediction(job.prediction_id)
    if (!prediction) return
    
    // Update job status if changed
    if (prediction.status !== job.status) {
      const updates: Parameters<typeof jobsRepo.updateJobStatus>[2] = {
        status: prediction.status
      }
      
      if (prediction.status === 'failed') {
        updates.error = prediction.error || 'Generation failed'
        updates.completed_at = new Date().toISOString()
      } else if (prediction.status === 'succeeded') {
        updates.completed_at = new Date().toISOString()
        // Note: Actual output processing happens in webhook
      }
      
      await jobsRepo.updateJobStatus(ctx.supabase, job.id, updates)
    }
  } catch (error) {
    console.error('Error polling Replicate:', error)
  }
}

async function generateSignedInputUrls(
  ctx: ServiceContext,
  request: GenerationRequest
): Promise<{ input1?: string; input2?: string }> {
  // TODO: Implement in Phase 4 with storage helpers
  // For now, return empty (Imagine mode doesn't need inputs)
  return {}
}

function buildWebhookUrl(): string {
  const env = serverEnv()
  const baseUrl = env.PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}${runtimeConfig.replicate.webhookRelativePath}`
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
  
  // Prompt length validation
  if (request.prompt && request.prompt.length > 1000) {
    throw Errors.validation('Prompt must be less than 1000 characters')
  }
}

// Timeout protection
export async function checkAndTimeoutStuckJobs(
  ctx: ServiceContext
): Promise<void> {
  const timeout = runtimeConfig.replicate.timeouts.overallMs
  const cutoffTime = new Date(Date.now() - timeout).toISOString()
  
  // This would need a new repository method to find stuck jobs
  // For now, this is a placeholder for Phase 4
  console.log('Checking for stuck jobs older than:', cutoffTime)
}
```

---

## Task 3.4: Generation API Endpoints

### Create Generation Submit Endpoint
Location: `app/api/v1/generations/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/methods'
import { 
  accepted, 
  validationError, 
  unauthorized, 
  conflict,
  limitExceeded,
  serverError 
} from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as generationService from '@/libs/services/generation'
import { ServiceError } from '@/libs/services/types'
import runtimeConfig from '@/libs/app-config/runtime'

// Schema for JSON submission
const GenerationSchema = z.object({
  mode: z.enum(['redesign', 'staging', 'compose', 'imagine']),
  prompt: z.string().optional(),
  roomType: z.string().optional(),
  style: z.string().optional(),
  aspectRatio: z.enum(['1:1', '3:2', '2:3']).optional(),
  quality: z.enum(['auto', 'low', 'medium', 'high']).optional(),
  variants: z.number().min(1).max(3).optional(),
  idempotencyKey: z.string().uuid().optional(),
  // For JSON mode with pre-uploaded files
  input1Url: z.string().url().optional(),
  input2Url: z.string().url().optional()
})

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    // Parse request based on content type
    const contentType = req.headers.get('content-type') || ''
    let requestData: z.infer<typeof GenerationSchema>
    let input1Path: string | undefined
    let input2Path: string | undefined
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data
      const formData = await req.formData()
      
      // Extract fields
      requestData = {
        mode: formData.get('mode') as any,
        prompt: formData.get('prompt') as string | undefined,
        roomType: formData.get('roomType') as string | undefined,
        style: formData.get('style') as string | undefined,
        aspectRatio: formData.get('aspectRatio') as any,
        quality: formData.get('quality') as any,
        variants: formData.get('variants') ? 
          parseInt(formData.get('variants') as string) : undefined,
        idempotencyKey: formData.get('idempotencyKey') as string | undefined
      }
      
      // Handle file uploads (Phase 4 will implement actual upload)
      const input1File = formData.get('input1') as File | null
      const input2File = formData.get('input2') as File | null
      
      if (input1File) {
        // TODO: Upload to storage and get path
        input1Path = 'placeholder/path1'
      }
      if (input2File) {
        // TODO: Upload to storage and get path
        input2Path = 'placeholder/path2'
      }
    } else {
      // Handle JSON
      const body = await req.json()
      requestData = body
      
      // Map URLs to paths (if provided)
      if (body.input1Url) {
        // TODO: Validate and convert URL to storage path
        input1Path = 'placeholder/path1'
      }
      if (body.input2Url) {
        input2Path = 'placeholder/path2'
      }
    }
    
    // Validate request
    const parsed = GenerationSchema.safeParse(requestData)
    if (!parsed.success) {
      return validationError('Invalid request', parsed.error.flatten())
    }
    
    // Create service context
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    // Submit generation
    const result = await generationService.submitGeneration(
      ctx,
      user.id,
      {
        ...parsed.data,
        input1Path,
        input2Path
      }
    )
    
    // Return accepted status with job details
    return accepted(result, 'Generation started successfully')
    
  } catch (error) {
    if (error instanceof ServiceError) {
      switch (error.code) {
        case 'TOO_MANY_INFLIGHT':
          return conflict(error.message, error.code)
        case 'LIMIT_EXCEEDED':
          return limitExceeded(error.message)
        case 'VALIDATION_ERROR':
          return validationError(error.message, error.details)
        default:
          return serverError(error.message)
      }
    }
    
    console.error('Generation submission error:', error)
    return serverError('Failed to start generation')
  }
})

// Export OPTIONS for CORS if needed
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
```

### Create Generation Status Endpoint
Location: `app/api/v1/generations/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, unauthorized, notFound, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as generationService from '@/libs/services/generation'
import { ServiceError } from '@/libs/services/types'

interface Params {
  params: {
    id: string
  }
}

export const GET = withMethods(['GET'], async (req: NextRequest, { params }: Params) => {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    // Create service context
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    // Get generation status
    const generation = await generationService.getGeneration(
      ctx,
      params.id,
      user.id
    )
    
    if (!generation) {
      return notFound('Generation not found')
    }
    
    return ok(generation)
    
  } catch (error) {
    if (error instanceof ServiceError) {
      return serverError(error.message)
    }
    
    console.error('Error fetching generation:', error)
    return serverError('Failed to fetch generation')
  }
})
```

---

## Task 3.5: Usage Endpoint

### Create Usage API
Location: `app/api/v1/usage/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, unauthorized, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as usageService from '@/libs/services/usage'
import { ServiceError } from '@/libs/services/types'

export const GET = withMethods(['GET'], async (req: NextRequest) => {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    // Create service context
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    // Get usage stats
    const stats = await usageService.getUsageStats(ctx, user.id)
    
    return ok({
      remainingGenerations: stats.remaining,
      usedGenerations: stats.used,
      monthlyLimit: stats.limit,
      planId: stats.planLabel
    })
    
  } catch (error) {
    if (error instanceof ServiceError) {
      return serverError(error.message)
    }
    
    console.error('Error fetching usage:', error)
    return serverError('Failed to fetch usage')
  }
})
```

---

## Verification Steps

### Step 1: Test Prompt Building
Create test file: `test-prompts.ts`

```typescript
import { buildPrompt } from '@/libs/services/external/replicateAdapter'

const testCases = [
  {
    mode: 'redesign' as const,
    roomType: 'living_room',
    style: 'coastal_au',
    prompt: 'add more natural light'
  },
  {
    mode: 'imagine' as const,
    roomType: 'bedroom',
    style: 'minimal_au',
    prompt: 'serene and calming space'
  }
]

testCases.forEach(test => {
  const prompt = buildPrompt({
    mode: test.mode,
    roomType: test.roomType,
    style: test.style,
    prompt: test.prompt,
    aspectRatio: '1:1',
    quality: 'auto',
    variants: 2
  })
  
  console.log(`\n${test.mode} prompt:`)
  console.log(prompt)
  console.log('---')
})
```

### Step 2: Test API Endpoints (Manual)
```bash
# Test generation submission (Imagine mode - no images needed)
curl -X POST http://localhost:3000/api/v1/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mode": "imagine",
    "prompt": "Modern Australian living room with coastal influences",
    "roomType": "living_room",
    "style": "coastal_au",
    "aspectRatio": "1:1",
    "quality": "auto",
    "variants": 2
  }'

# Test status check
curl http://localhost:3000/api/v1/generations/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test usage check
curl http://localhost:3000/api/v1/usage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 3: Verify Type Safety
```bash
npm run typecheck
```

### Step 4: Build Verification
```bash
npm run build
```

---

## Success Criteria
- [ ] Replicate client configured
- [ ] Prompt builder includes Australian context
- [ ] Adapter maps internal format to Replicate
- [ ] Generation service handles full flow
- [ ] API endpoints return normalized responses
- [ ] In-flight job limit enforced
- [ ] Credit limits checked
- [ ] Idempotency works
- [ ] Build passes without errors

---

## Common Issues & Solutions

### Issue: Replicate API token not found
**Solution**: Add `REPLICATE_API_TOKEN` to `.env.local`

### Issue: Webhook URL incorrect in development
**Solution**: Set `PUBLIC_BASE_URL` in env or use ngrok

### Issue: Model not found on Replicate
**Solution**: Verify model string matches exactly (e.g., "openai/gpt-image-1")

### Issue: Authentication fails in API routes
**Solution**: Ensure Supabase session cookies are present

---

## Integration Testing

### End-to-End Test Flow
1. Submit an "imagine" generation
2. Check status returns "processing"
3. Wait for webhook (or simulate)
4. Check status returns "succeeded" with variants
5. Verify credits deducted
6. Try submitting while in-flight (should fail)

---

## Next Phase Preview
Phase 4 will implement:
- File upload handling
- Storage integration
- Webhook processing
- Asset management
- Signed URL generation

Ensure generation flow works end-to-end (minus actual file uploads) before proceeding.