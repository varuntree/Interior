# Phase 2: Generation Engine Core

## Prerequisites
Before starting this phase, ensure Phase 1 is complete and load:
- `ai_docs/spec/generation_engine_and_external_service.md` - Generation engine specifications
- `ai_docs/spec/system_architecture_and_api.md` - API contracts and webhook flows
- `ai_docs/docs/02-playbooks-and-templates.md` - Service and repository templates

## Goals
Implement the complete generation pipeline with Replicate integration, webhook processing, and storage management for the AI image generation workflow.

## Dependencies from Phase 1
- Runtime configuration (`libs/app-config/runtime.ts`)
- Database migrations applied
- API utilities (`libs/api-utils/*`)
- Environment variables configured

## Tasks

### 1. Replicate Integration Layer

#### 1.1 Replicate Adapter
**File**: `libs/services/external/replicateAdapter.ts`

Create the adapter that translates internal requests to Replicate API format:
- Function to convert GenerationRequest to Replicate inputs
- Map aspect ratios to width/height dimensions
- Map quality settings to resolution tiers
- Handle variants to num_outputs mapping
- Build webhook URL from environment or request origin

Reference the parameter mapping logic in `generation_engine_and_external_service.md` section 3.

#### 1.2 Replicate Client Setup
**File**: `libs/services/external/replicateClient.ts`

Set up the Replicate API client:
- Initialize with REPLICATE_API_TOKEN from environment
- Configure retry logic for transient failures
- Set appropriate timeouts from runtime config
- Export functions for creating and polling predictions

### 2. Prompt Building System

#### 2.1 Prompt Templates
**File**: `libs/services/generation/prompts.ts`

Implement the prompt composition system following `generation_engine_and_external_service.md` section 2:
- Mode-specific templates (Redesign, Staging, Compose, Imagine)
- Australian context boosters
- Style and room type integration
- Guardrails for maintaining room architecture

Each mode should follow the exact templates specified in the generation engine spec.

#### 2.2 Content Moderation
**File**: `libs/services/generation/moderation.ts`

Implement lightweight content filtering:
- Basic text validation for inappropriate content
- Return validation errors with generic messages
- Keep implementation simple for MVP

### 3. Generation Service Implementation

#### 3.1 Core Generation Service
**File**: `libs/services/generation.ts`

Implement the main generation service following the flow in `generation_engine_and_external_service.md` section 4:

Key functions to implement:
- `submitGeneration` - Main submission flow
- `getGeneration` - Status retrieval with optional Replicate polling
- In-flight job checking
- Credit/quota verification
- Idempotency handling

The service should:
- Check for existing in-flight jobs
- Verify user has remaining generations
- Handle file uploads to Supabase Storage
- Create signed URLs for Replicate
- Build prompts using the prompt system
- Submit to Replicate with webhook URL
- Persist job in database
- Debit usage ledger

#### 3.2 Storage Service
**File**: `libs/services/storage/uploads.ts`

Implement storage handling for generation inputs:
- Upload user images to private bucket
- Generate signed URLs with appropriate expiry
- Follow path convention from `data_and_storage.md`
- Handle multiple file inputs for compose mode

### 4. Repository Implementations

#### 4.1 Generation Jobs Repository
**File**: `libs/repositories/generation_jobs.ts`

Implement database operations for generation jobs:
- Create new job with initial status
- Find in-flight jobs for a user
- Update job status and prediction ID
- Attach Replicate prediction ID
- Get job by ID with owner verification

Follow the pure function pattern from the handbook and templates.

#### 4.2 Renders Repository
**File**: `libs/repositories/renders.ts`

Implement render and variant management:
- Create render linked to job
- Add render variants with paths
- List renders with filtering and pagination
- Get render with all variants
- Delete render (soft delete or cascade)

#### 4.3 Usage Repository
**File**: `libs/repositories/usage.ts`

Implement usage tracking:
- Debit generation from ledger
- Calculate monthly usage for a user
- Support idempotent operations
- Query remaining generations

### 5. Webhook Processing

#### 5.1 Replicate Webhook Handler
**File**: `app/api/v1/webhooks/replicate/route.ts`

Implement the webhook endpoint following `generation_engine_and_external_service.md` section 5:
- Verify webhook signature or shared secret
- Parse Replicate payload
- Find job by prediction ID
- Process successful completions (download and store images)
- Handle failures with proper error recording
- Ensure idempotent processing

Use the admin Supabase client only in this webhook context.

#### 5.2 Asset Processing Service
**File**: `libs/services/storage/assets.ts`

Handle completed generation assets:
- Download images from Replicate URLs
- Convert to WebP if needed
- Store in public bucket with proper paths
- Generate thumbnails (optional for MVP)
- Create render variant records

### 6. API Route Implementation

#### 6.1 Generation Submission Route
**File**: `app/api/v1/generations/route.ts`

Implement POST endpoint for generation submission:
- Support both multipart/form-data and JSON
- Validate mode-specific required inputs
- Use the generation service
- Return normalized 202 response
- Include proper error codes

Follow the exact contract from `system_architecture_and_api.md` section 6.2.

#### 6.2 Generation Status Route
**File**: `app/api/v1/generations/[id]/route.ts`

Implement GET endpoint for status retrieval:
- Verify owner access
- Optional Replicate polling for stale jobs
- Return current status with variant URLs
- Handle not found and forbidden cases

### 7. Error Handling and Retries

#### 7.1 Retry Logic
Implement exponential backoff for:
- Replicate API submission failures
- Asset download failures
- Transient network errors

#### 7.2 Timeout Management
Handle stuck jobs:
- Jobs processing > 10 minutes marked as failed
- Late webhooks can still succeed (idempotent)
- Clear user feedback on timeouts

### 8. Verification Steps

#### 8.1 Integration Testing
- [ ] Replicate adapter correctly maps all parameters
- [ ] Prompt builder includes all required elements
- [ ] Webhook signature verification works
- [ ] Asset storage follows correct path conventions

#### 8.2 Flow Testing
- [ ] Submit generation request successfully
- [ ] In-flight check prevents concurrent jobs
- [ ] Webhook processes and stores results
- [ ] Status endpoint returns variant URLs

#### 8.3 Error Scenarios
- [ ] Quota exceeded returns proper error
- [ ] Invalid inputs return validation errors
- [ ] Replicate failures handled gracefully
- [ ] Timeouts release in-flight lock

## Success Criteria

This phase is complete when:
1. Full generation pipeline works end-to-end
2. Replicate integration properly configured
3. Webhooks process results reliably
4. Assets stored in correct buckets
5. All error scenarios handled
6. API contracts match specification
7. Manual test of "Imagine" mode succeeds

## Notes for Implementation

- Use templates from playbooks for service/repository structure
- Ensure webhook handler uses admin client appropriately
- Keep prompt templates exactly as specified
- Test with small images first
- Verify storage bucket policies are correct
- Monitor Replicate API usage during testing

## Next Phase
After completing Phase 2, proceed to Phase 3: Data Management Layer, which will complete all remaining repository implementations and service layers.