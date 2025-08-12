# Multi-Phase Implementation Plan
## Interior Design AI Generator - Complete Build Roadmap

### Overview
This document outlines the complete implementation of the Interior Design AI Generator application in 7 logical, sequential phases. Each phase builds upon the previous one and includes specific deliverables, acceptance criteria, and verification steps.

**Critical References:**
- Primary Specifications: `/ai_docs/spec/*`
- Coding Standards: `/ai_docs/docs/01-handbook.md`
- Implementation Templates: `/ai_docs/docs/02-playbooks-and-templates.md`

**Core Principles (MUST FOLLOW):**
1. **Golden Path**: UI → API Routes → Services → Repositories → DB
2. **No Server Actions** - Use API routes only
3. **No direct DB calls from components**
4. **Pure functions** for services and repositories
5. **Normalized API responses**: `{ success, data?, error?, message? }`
6. **Admin (service-role)** only in webhooks
7. **Files-only migrations** - no auto-apply

---

## Phase 1: Foundation & Data Layer
**Goal**: Establish database schema, repositories, and core API structure

### Prerequisites
- Existing ShipFast template is functional
- Supabase project configured
- Environment variables set

### Deliverables

#### 1.1 Database Migrations
Create migration files under `migrations/phase2/`:

**Files to create:**
- `005_generation_jobs.sql` - Main job tracking table
- `006_renders.sql` - Renders and variants tables
- `007_collections.sql` - Collections and items
- `008_community.sql` - Community collections
- `009_usage_ledger.sql` - Usage tracking
- `010_default_favorites_trigger.sql` - Auto-create favorites

**Key requirements:**
- All tables must have RLS policies
- Owner-scoped access patterns
- Idempotent SQL (CREATE IF NOT EXISTS)
- Follow exact schema from `ai_docs/spec/data_and_storage.md`

#### 1.2 Repository Layer
Create pure function repositories in `libs/repositories/`:

**Files to create:**
- `generation_jobs.ts` - Job CRUD operations
- `renders.ts` - Render management
- `collections.ts` - Collection operations
- `community.ts` - Community read operations
- `usage.ts` - Usage tracking

**Repository pattern:**
```typescript
export async function getEntity(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('entity')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
```

#### 1.3 API Response Utilities
Enhance `libs/api-utils/`:

**Files to update/create:**
- `responses.ts` - Ensure ok/fail helpers with normalized format
- `methods.ts` - HTTP method enforcement
- `supabase.ts` - Server client creation helper

### Verification Checklist
- [ ] All migrations apply cleanly to Supabase
- [ ] RLS policies verified with test queries
- [ ] Repository functions tested with mock client
- [ ] Response utilities return normalized format
- [ ] No direct Supabase imports in components

---

## Phase 2: Runtime Config & Core Services
**Goal**: Implement configuration system and service layer foundation

### Deliverables

#### 2.1 Runtime Configuration
Create `libs/app-config/runtime.ts`:

**Requirements:**
- Australian-oriented presets (room types, styles)
- Generation defaults and limits
- Plan configurations with monthly caps
- Replicate model settings
- Follow schema from `ai_docs/spec/config_and_plans.md`

#### 2.2 Core Service Structure
Create service foundations in `libs/services/`:

**Files to create:**
- `generation.ts` - Stub for generation logic
- `renders.ts` - Render service operations
- `collections.ts` - Collection management
- `usage.ts` - Usage tracking and limits

**Service pattern:**
```typescript
export async function serviceFunction(
  ctx: { supabase: SupabaseClient },
  args: TypedArgs
): Promise<ReturnType> {
  // Business logic composing repositories
}
```

#### 2.3 Update config.ts
Align `config.ts` with Theme v2:
- Set `colors.main: "#47B3FF"`
- Ensure theme compatibility
- Keep existing Stripe plan metadata

### Verification Checklist
- [ ] Runtime config imported successfully
- [ ] Presets accessible from services
- [ ] Services follow pure function pattern
- [ ] No business logic in repositories
- [ ] Config values match design system

---

## Phase 3: Generation Engine & Replicate Integration
**Goal**: Implement core generation flow with Replicate

### Deliverables

#### 3.1 Replicate Adapter
Create `libs/services/external/replicateAdapter.ts`:

**Functions:**
- `toReplicateInputs()` - Map internal format to Replicate
- `buildPrompt()` - Compose mode-specific prompts
- Parameter mapping (aspect ratio, quality, variants)

**Prompt templates:**
- Include Australian context
- Mode-specific guardrails
- Follow templates from `ai_docs/spec/generation_engine_and_external_service.md`

#### 3.2 Generation Service
Complete `libs/services/generation.ts`:

**Core functions:**
- `submitGeneration()` - Main submission flow
- `getGeneration()` - Status checking with optional poll
- In-flight checking
- Credit validation
- Idempotency handling

#### 3.3 Generation API Endpoints
Create routes in `app/api/v1/generations/`:

**Routes:**
- `POST /api/v1/generations/route.ts` - Submit generation
- `GET /api/v1/generations/[id]/route.ts` - Check status

**Requirements:**
- Multipart form data support
- Validation with Zod
- One in-flight job enforcement
- Credit checking
- Return normalized responses

### Verification Checklist
- [ ] Replicate predictions created successfully
- [ ] Prompts include AU context
- [ ] In-flight limit enforced
- [ ] Credits properly checked
- [ ] Idempotency prevents duplicates

---

## Phase 4: Storage & Asset Management
**Goal**: Handle uploads, webhooks, and asset persistence

### Deliverables

#### 4.1 Storage Helpers
Create `libs/storage/uploads.ts`:

**Functions:**
- `uploadInput()` - Store user uploads to private bucket
- `storeRenderOutput()` - Save to public bucket
- `getSignedUrl()` - Generate time-limited URLs
- Path conventions: `private/${userId}/inputs/`, `public/renders/${renderId}/`

#### 4.2 Replicate Webhook
Create `app/api/v1/webhooks/replicate/route.ts`:

**Requirements:**
- Service-role client usage (webhook only)
- HMAC/signature verification
- Download and store outputs
- Update job status
- Create render records
- Idempotent processing

#### 4.3 Legacy Route Bridges
Update existing routes to delegate to v1:
- `/api/webhook/stripe/route.ts` → re-export v1
- Keep legacy routes functional

### Verification Checklist
- [ ] Files upload to correct buckets
- [ ] Signed URLs generated with expiry
- [ ] Webhook processes successfully
- [ ] Assets stored in public bucket
- [ ] Job status updates correctly

---

## Phase 5: Collections & Organization
**Goal**: Implement renders list, collections, and favorites

### Deliverables

#### 5.1 Renders API
Create routes in `app/api/v1/renders/`:

**Endpoints:**
- `GET /api/v1/renders` - List with pagination
- `GET /api/v1/renders/[id]` - Get single render
- `DELETE /api/v1/renders/[id]` - Soft delete

#### 5.2 Collections API
Create routes in `app/api/v1/collections/`:

**Endpoints:**
- CRUD for collections
- Add/remove items
- Default favorites handling

#### 5.3 Community API
Create `app/api/v1/community/`:

**Endpoints:**
- `GET /api/v1/community` - Public read
- Admin-only write endpoints

### Verification Checklist
- [ ] My Favorites auto-created for users
- [ ] Renders paginate correctly
- [ ] Collections CRUD works
- [ ] Items can be added/removed
- [ ] Community publicly readable

---

## Phase 6: Dashboard UI & Core Flows
**Goal**: Build the complete dashboard interface

### Deliverables

#### 6.1 Dashboard Layout
Update `app/(app)/dashboard/`:

**Components:**
- Sidebar navigation
- Theme-aware styling
- Mobile-responsive layout
- Usage badge

#### 6.2 Create Page
Build `app/(app)/dashboard/create/page.tsx`:

**Features:**
- Mode selector (4 modes)
- Image dropzones
- Preset dropdowns
- Settings accordion
- Generate button with states
- Result display grid
- One-click save to favorites

#### 6.3 My Renders Page
Build `app/(app)/dashboard/renders/page.tsx`:

**Features:**
- Grid layout
- Filtering by mode/style
- Pagination
- Empty state

#### 6.4 Collections Pages
Build collection management UI:
- List view
- Collection details
- Add/remove flows

### Verification Checklist
- [ ] All 4 modes functional
- [ ] Dropzones accept images
- [ ] Results display correctly
- [ ] Save to favorites works
- [ ] Mobile responsive
- [ ] Theme v2 tokens applied

---

## Phase 7: Community, Polish & Testing
**Goal**: Complete remaining features and ensure quality

### Deliverables

#### 7.1 Community Page
Build `app/(app)/dashboard/community/page.tsx`:
- Curated collections display
- "Try this look" prefill
- Admin management (later phase)

#### 7.2 Settings & Profile
Update `app/(app)/dashboard/settings/page.tsx`:
- Plan display
- Billing management
- Usage tracking

#### 7.3 Testing Implementation
Create test files:

**Unit tests:**
- Prompt builder tests
- Adapter mapping tests

**Quality checks:**
- Typecheck passing
- Build succeeding
- Grep checks (no forbidden patterns)
- Responsive testing

#### 7.4 Polish & Optimization
- Error boundaries
- Loading states
- Empty states
- Performance optimization
- Mobile gestures

### Verification Checklist
- [ ] Community page functional
- [ ] Settings show plan info
- [ ] All tests passing
- [ ] Responsive on all viewports
- [ ] No console errors
- [ ] Lighthouse scores acceptable

---

## Implementation Guidelines

### For Each Phase:
1. **Start by reading** referenced spec files
2. **Use templates** from playbooks document
3. **Test incrementally** - don't wait until end
4. **Verify checklist** before moving to next phase
5. **Commit working code** at phase boundaries

### Common Pitfalls to Avoid:
- Don't skip repository layer
- Don't put business logic in routes
- Don't use Server Actions
- Don't hardcode values (use config)
- Don't skip RLS policies
- Don't modify guardrail files

### Success Metrics:
- Each phase independently verifiable
- No regressions between phases
- All specs requirements met
- Clean architecture maintained
- Tests passing