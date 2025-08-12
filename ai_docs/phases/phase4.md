# Phase 4: Storage & Asset Management
## File Uploads, Webhooks, and Asset Persistence

### Phase Overview
**Duration**: 1-2 days
**Dependencies**: Phases 1-3 completed
**Goal**: Implement complete storage system with uploads, webhooks, and asset management

### Required Reading Before Starting
1. `/ai_docs/spec/data_and_storage.md` - Storage conventions (Section 2)
2. `/ai_docs/spec/generation_engine_and_external_service.md` - Webhook spec (Section 5)
3. `/ai_docs/docs/01-handbook.md` - Section 8 (Storage Rules)
4. `/ai_docs/docs/02-playbooks-and-templates.md` - Storage template

---

## Task 4.1: Storage Helpers

### Create Upload Service
Location: `libs/storage/uploads.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import runtimeConfig from '@/libs/app-config/runtime'

export interface UploadResult {
  path: string
  url?: string
  size: number
}

export interface StorageContext {
  supabase: SupabaseClient
  userId: string
}

/**
 * Upload user input image to private bucket
 */
export async function uploadInputImage(
  ctx: StorageContext,
  file: File | Blob,
  mimeType: string
): Promise<UploadResult> {
  // Validate file type
  if (!runtimeConfig.limits.acceptedMimeTypes.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }
  
  // Validate file size
  const maxSizeBytes = runtimeConfig.limits.maxUploadsMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new Error(`File too large. Maximum size is ${runtimeConfig.limits.maxUploadsMB}MB`)
  }
  
  // Generate unique path
  const fileExt = getFileExtension(mimeType)
  const fileName = `${uuidv4()}.${fileExt}`
  const path = `${ctx.userId}/inputs/${fileName}`
  
  // Upload to private bucket
  const { error } = await ctx.supabase.storage
    .from('private')
    .upload(path, file, {
      contentType: mimeType,
      upsert: false
    })
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  
  return {
    path,
    size: file.size
  }
}

/**
 * Store render output to public bucket
 */
export async function storeRenderOutput(
  supabase: SupabaseClient,
  renderId: string,
  variantIndex: number,
  imageData: Blob | ArrayBuffer,
  isThumb = false
): Promise<string> {
  const suffix = isThumb ? '_thumb' : ''
  const fileName = `${variantIndex}${suffix}.webp`
  const path = `renders/${renderId}/${fileName}`
  
  // Upload to public bucket
  const { error } = await supabase.storage
    .from('public')
    .upload(path, imageData, {
      contentType: 'image/webp',
      upsert: true // Allow overwrite for retries
    })
  
  if (error) {
    throw new Error(`Failed to store output: ${error.message}`)
  }
  
  return path
}

/**
 * Generate signed URL for private assets
 */
export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresIn = 300 // 5 minutes default
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  
  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }
  
  return data.signedUrl
}

/**
 * Get public URL for public bucket assets
 */
export function getPublicUrl(
  supabase: SupabaseClient,
  path: string
): string {
  const { data } = supabase.storage
    .from('public')
    .getPublicUrl(path)
  
  return data.publicUrl
}

/**
 * Delete file from storage
 */
export async function deleteFile(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) {
    console.error('Failed to delete file:', error)
    // Non-critical, don't throw
  }
}

/**
 * Download file from URL
 */
export async function downloadFromUrl(
  url: string
): Promise<{ data: Blob; contentType: string }> {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`)
  }
  
  const blob = await response.blob()
  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  
  return { data: blob, contentType }
}

/**
 * Generate thumbnail (placeholder - actual implementation would use sharp or similar)
 */
export async function generateThumbnail(
  imageBlob: Blob,
  maxWidth = 400,
  maxHeight = 400
): Promise<Blob> {
  // For MVP, return the original image
  // In production, use sharp or canvas to resize
  return imageBlob
}

// Helper functions
function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  }
  return mimeToExt[mimeType] || 'jpg'
}

export function isValidImageMimeType(mimeType: string): boolean {
  return runtimeConfig.limits.acceptedMimeTypes.includes(mimeType)
}

export function getMaxUploadSize(): number {
  return runtimeConfig.limits.maxUploadsMB * 1024 * 1024
}
```

---

## Task 4.2: Replicate Webhook Handler

### Create Webhook Endpoint
Location: `app/api/v1/webhooks/replicate/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/libs/supabase/admin'
import * as jobsRepo from '@/libs/repositories/generation_jobs'
import * as rendersRepo from '@/libs/repositories/renders'
import * as storageHelpers from '@/libs/storage/uploads'
import { ok, serverError, unauthorized } from '@/libs/api-utils/responses'
import { serverEnv } from '@/libs/env'
import crypto from 'crypto'

interface ReplicateWebhookPayload {
  id: string // prediction_id
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string[] // Array of output URLs
  error?: string
  logs?: string
  metrics?: {
    predict_time?: number
  }
}

// Verify webhook signature (if configured)
function verifyWebhookSignature(
  req: NextRequest,
  body: string
): boolean {
  const env = serverEnv()
  const webhookSecret = env.REPLICATE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    // If no secret configured, skip verification (development)
    console.warn('No REPLICATE_WEBHOOK_SECRET configured')
    return true
  }
  
  const signature = req.headers.get('webhook-signature')
  if (!signature) return false
  
  // Replicate uses HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')
  
  return signature === expectedSignature
}

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const bodyText = await req.text()
    
    // Verify signature
    if (!verifyWebhookSignature(req, bodyText)) {
      console.error('Invalid webhook signature')
      return unauthorized('Invalid signature')
    }
    
    // Parse payload
    const payload: ReplicateWebhookPayload = JSON.parse(bodyText)
    
    console.log('Webhook received:', {
      predictionId: payload.id,
      status: payload.status,
      outputCount: payload.output?.length || 0
    })
    
    // Get admin client (service-role for webhook operations)
    const supabase = createClient()
    
    // Find job by prediction_id
    const job = await jobsRepo.findJobByPredictionId(supabase, payload.id)
    if (!job) {
      console.warn('Job not found for prediction:', payload.id)
      // Return success to prevent retries for unknown jobs
      return ok({ processed: false, reason: 'Job not found' })
    }
    
    // Process based on status
    switch (payload.status) {
      case 'succeeded':
        await handleSuccessfulGeneration(supabase, job, payload)
        break
        
      case 'failed':
      case 'canceled':
        await handleFailedGeneration(supabase, job, payload)
        break
        
      case 'processing':
      case 'starting':
        // Update status only
        await jobsRepo.updateJobStatus(supabase, job.id, {
          status: payload.status
        })
        break
    }
    
    return ok({ 
      processed: true, 
      jobId: job.id,
      status: payload.status 
    })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Return success to prevent infinite retries
    return ok({ 
      processed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

async function handleSuccessfulGeneration(
  supabase: SupabaseClient,
  job: jobsRepo.GenerationJob,
  payload: ReplicateWebhookPayload
) {
  if (!payload.output || payload.output.length === 0) {
    // No outputs, mark as failed
    await jobsRepo.updateJobStatus(supabase, job.id, {
      status: 'failed',
      error: 'No outputs generated',
      completed_at: new Date().toISOString()
    })
    return
  }
  
  try {
    // Create render record
    const render = await rendersRepo.createRender(supabase, {
      job_id: job.id,
      owner_id: job.owner_id,
      mode: job.mode,
      room_type: job.room_type,
      style: job.style,
      cover_variant: 0
    })
    
    // Process each output
    const variants: Array<{ index: number; path: string; thumbPath?: string }> = []
    
    for (let i = 0; i < payload.output.length; i++) {
      const outputUrl = payload.output[i]
      
      try {
        // Download image
        const { data: imageBlob } = await storageHelpers.downloadFromUrl(outputUrl)
        
        // Store main image
        const imagePath = await storageHelpers.storeRenderOutput(
          supabase,
          render.id,
          i,
          imageBlob,
          false
        )
        
        // Generate and store thumbnail
        const thumbBlob = await storageHelpers.generateThumbnail(imageBlob)
        const thumbPath = await storageHelpers.storeRenderOutput(
          supabase,
          render.id,
          i,
          thumbBlob,
          true
        )
        
        // Add variant record
        await rendersRepo.addVariant(supabase, {
          render_id: render.id,
          owner_id: job.owner_id,
          idx: i,
          image_path: imagePath,
          thumb_path: thumbPath
        })
        
        variants.push({
          index: i,
          path: imagePath,
          thumbPath
        })
        
      } catch (variantError) {
        console.error(`Failed to process variant ${i}:`, variantError)
        // Continue with other variants
      }
    }
    
    // Update job status
    await jobsRepo.updateJobStatus(supabase, job.id, {
      status: 'succeeded',
      completed_at: new Date().toISOString()
    })
    
    console.log('Generation completed successfully:', {
      jobId: job.id,
      renderId: render.id,
      variantCount: variants.length
    })
    
  } catch (error) {
    console.error('Failed to process successful generation:', error)
    
    // Mark job as failed
    await jobsRepo.updateJobStatus(supabase, job.id, {
      status: 'failed',
      error: 'Failed to process outputs',
      completed_at: new Date().toISOString()
    })
  }
}

async function handleFailedGeneration(
  supabase: SupabaseClient,
  job: jobsRepo.GenerationJob,
  payload: ReplicateWebhookPayload
) {
  const errorMessage = payload.error || 
    (payload.status === 'canceled' ? 'Generation was canceled' : 'Generation failed')
  
  await jobsRepo.updateJobStatus(supabase, job.id, {
    status: payload.status as 'failed' | 'canceled',
    error: errorMessage,
    completed_at: new Date().toISOString()
  })
  
  console.log('Generation failed:', {
    jobId: job.id,
    status: payload.status,
    error: errorMessage
  })
}

// OPTIONS for CORS if needed
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, webhook-signature'
    }
  })
}
```

### Create Admin Supabase Client
Location: `libs/supabase/admin.ts`

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { serverEnv } from '@/libs/env'

let adminClient: ReturnType<typeof createSupabaseClient> | null = null

/**
 * Create Supabase admin client with service role key
 * ONLY use in webhooks and server-side admin operations
 * NEVER expose to client or use in regular API routes
 */
export function createClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client can only be used on the server')
  }
  
  if (!adminClient) {
    const env = serverEnv()
    adminClient = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  
  return adminClient
}
```

---

## Task 4.3: Update Generation Service with Storage

### Update Generation Service
Location: Update `libs/services/generation.ts`

Add these functions to the existing service:

```typescript
import * as storageHelpers from '@/libs/storage/uploads'

// Update the generateSignedInputUrls function
async function generateSignedInputUrls(
  ctx: ServiceContext,
  request: GenerationRequest
): Promise<{ input1?: string; input2?: string }> {
  const urls: { input1?: string; input2?: string } = {}
  
  if (request.input1Path) {
    urls.input1 = await storageHelpers.getSignedUrl(
      ctx.supabase,
      'private',
      request.input1Path,
      600 // 10 minutes for Replicate to fetch
    )
  }
  
  if (request.input2Path) {
    urls.input2 = await storageHelpers.getSignedUrl(
      ctx.supabase,
      'private',
      request.input2Path,
      600
    )
  }
  
  return urls
}

// Add file upload handler for multipart requests
export async function handleFileUpload(
  ctx: ServiceContext,
  userId: string,
  file: File,
  inputNumber: 1 | 2
): Promise<string> {
  const storageCtx = {
    supabase: ctx.supabase,
    userId
  }
  
  // Validate file
  if (!storageHelpers.isValidImageMimeType(file.type)) {
    throw Errors.validation(`Invalid file type: ${file.type}`)
  }
  
  const maxSize = storageHelpers.getMaxUploadSize()
  if (file.size > maxSize) {
    throw Errors.validation(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
  }
  
  // Upload file
  const result = await storageHelpers.uploadInputImage(
    storageCtx,
    file,
    file.type
  )
  
  return result.path
}
```

---

## Task 4.4: Asset Serving Endpoint

### Create Asset Proxy
Location: `app/api/v1/assets/[...path]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { getPublicUrl } from '@/libs/storage/uploads'

interface Params {
  params: {
    path: string[]
  }
}

/**
 * Proxy for public bucket assets
 * Allows us to serve assets with our domain and add caching headers
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const path = params.path.join('/')
    
    // Only serve from public bucket paths
    if (!path.startsWith('renders/')) {
      return new NextResponse('Not found', { status: 404 })
    }
    
    const supabase = createServiceSupabaseClient()
    const publicUrl = getPublicUrl(supabase, path)
    
    // Fetch the asset
    const response = await fetch(publicUrl)
    
    if (!response.ok) {
      return new NextResponse('Asset not found', { status: 404 })
    }
    
    const blob = await response.blob()
    
    // Return with appropriate caching headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('Asset serving error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
```

---

## Task 4.5: Update Generation Submit with File Upload

### Update Generation API
Location: Update `app/api/v1/generations/route.ts`

```typescript
// Add to the existing POST handler
import * as generationService from '@/libs/services/generation'

// In the multipart handling section:
if (contentType.includes('multipart/form-data')) {
  const formData = await req.formData()
  
  // ... existing field extraction ...
  
  // Handle file uploads
  const input1File = formData.get('input1') as File | null
  const input2File = formData.get('input2') as File | null
  
  if (input1File) {
    input1Path = await generationService.handleFileUpload(
      ctx,
      user.id,
      input1File,
      1
    )
  }
  
  if (input2File) {
    input2Path = await generationService.handleFileUpload(
      ctx,
      user.id,
      input2File,
      2
    )
  }
}
```

---

## Task 4.6: Legacy Route Bridges

### Update Stripe Webhook Bridge
Location: Update `app/api/webhook/stripe/route.ts`

```typescript
// Re-export v1 webhook
export { 
  POST,
  OPTIONS 
} from '@/app/api/v1/webhooks/stripe/route'
```

---

## Verification Steps

### Step 1: Test File Upload
```javascript
// Test file upload
const formData = new FormData()
formData.append('mode', 'redesign')
formData.append('roomType', 'living_room')
formData.append('style', 'coastal_au')
formData.append('input1', fileInput.files[0])

fetch('/api/v1/generations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN'
  },
  body: formData
})
```

### Step 2: Test Webhook Processing
```bash
# Simulate webhook with curl
curl -X POST http://localhost:3000/api/v1/webhooks/replicate \
  -H "Content-Type: application/json" \
  -H "webhook-signature: test" \
  -d '{
    "id": "PREDICTION_ID",
    "status": "succeeded",
    "output": ["https://example.com/image1.png", "https://example.com/image2.png"]
  }'
```

### Step 3: Verify Storage Buckets
```sql
-- Check in Supabase SQL editor
SELECT * FROM storage.buckets;
-- Should show 'public' and 'private' buckets
```

### Step 4: Test Asset Serving
```bash
# After a successful generation
curl http://localhost:3000/api/v1/assets/renders/RENDER_ID/0.webp
```

---

## Success Criteria
- [ ] Files upload to correct storage buckets
- [ ] Signed URLs generated with expiry
- [ ] Webhook processes predictions
- [ ] Assets downloaded and stored
- [ ] Thumbnails generated
- [ ] Render records created with variants
- [ ] Public assets accessible via API
- [ ] Job status updates correctly

---

## Common Issues & Solutions

### Issue: Storage bucket not found
**Solution**: Run migration `004_storage_buckets.sql` from Phase 1

### Issue: Webhook signature fails
**Solution**: Set `REPLICATE_WEBHOOK_SECRET` or skip in development

### Issue: Failed to download from Replicate
**Solution**: Check output URLs are valid and accessible

### Issue: Admin client errors
**Solution**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

---

## Security Checklist
- [ ] Service-role key only used in webhooks
- [ ] File type validation enforced
- [ ] File size limits enforced
- [ ] Signed URLs have appropriate expiry
- [ ] Public assets served with cache headers
- [ ] Webhook signature verified in production

---

## Next Phase Preview
Phase 5 will implement:
- Complete collections API
- Renders management endpoints
- Community features
- Batch operations

Ensure storage and webhooks work end-to-end before proceeding.