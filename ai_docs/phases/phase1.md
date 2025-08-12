# Phase 1: Foundation & Configuration

## Prerequisites
Before starting this phase, load and understand:
- `ai_docs/docs/01-handbook.md` - Architecture rules and guardrails
- `ai_docs/docs/02-playbooks-and-templates.md` - Implementation templates
- `ai_docs/spec/config_and_plans.md` - Configuration requirements
- `ai_docs/spec/data_and_storage.md` - Database schema specifications

## Goals
Establish the foundational infrastructure for the Interior Design AI Generator application with proper configuration, database schema, and core utilities.

## Tasks

### 1. Runtime Configuration System

#### 1.1 Create Runtime Configuration
**File**: `libs/app-config/runtime.ts`

Create the runtime configuration following the schema from `config_and_plans.md`. This includes:
- Mode types and aspect ratios
- Australian-oriented room types and styles presets
- Generation defaults and limits
- Plan definitions with monthly generation quotas
- Replicate configuration settings

Key requirements:
- Export proper TypeScript interfaces
- Include AU-specific room types (Alfresco/Patio, Granny Flat)
- Include AU-specific styles (Coastal AU, Hamptons AU, etc.)
- Map Stripe price IDs to generation limits
- Set proper timeouts for Replicate operations

#### 1.2 Update Main Configuration
**File**: `config.ts`

Update the colors configuration to align with Theme v2:
- Set `colors.main` to `#47B3FF` (matches primary design token)
- Ensure `colors.theme` is set to `'light'` (required by types)

### 2. Database Migrations

Create migration files under `migrations/phase2/` following the schema from `data_and_storage.md`.

#### 2.1 Generation Jobs Table
**File**: `migrations/phase2/005_generation_jobs.sql`

Create the generation_jobs table with:
- Mode enum (redesign, staging, compose, imagine)
- Input paths for storage references
- Replicate prediction tracking
- Status management
- Idempotency support
- Proper RLS policies (owner read-only)

#### 2.2 Renders and Variants
**File**: `migrations/phase2/006_renders.sql`

Create renders and render_variants tables:
- Link renders to generation jobs
- Support multiple variants per render
- Store image paths (public bucket)
- Cover variant selection
- Owner-scoped RLS policies

#### 2.3 Collections System
**File**: `migrations/phase2/007_collections.sql`

Create collections and collection_items:
- Support for user collections
- Special handling for "My Favorites" (is_default_favorites flag)
- Many-to-many relationship with renders
- Prevent deletion of default favorites
- Proper RLS for owner access

#### 2.4 Community Collections
**File**: `migrations/phase2/008_community.sql`

Create community_collections and community_items:
- Admin-curated collections
- Support for both internal renders and external images
- Apply settings for "Try this look" feature
- Public read access (no auth required)
- Order index for curation

#### 2.5 Usage Tracking
**File**: `migrations/phase2/009_usage_ledger.sql`

Create usage_ledger table:
- Track generation debits
- Support credit adjustments
- JSON metadata for audit trail
- Owner read-only access

#### 2.6 Default Favorites Trigger
**File**: `migrations/phase2/010_default_favorites_trigger.sql`

Create trigger to auto-create "My Favorites" collection:
- Fires after profile creation
- Ensures every user has default collection
- Idempotent (on conflict do nothing)

### 3. API Utilities Setup

#### 3.1 Response Helpers
**File**: `libs/api-utils/responses.ts`

Implement standardized response functions:
- `ok<T>(data: T, message?: string)` - Success responses
- `fail(status, code, message, details?)` - Error responses
- Include proper Cache-Control headers
- Follow normalized response shape from spec

#### 3.2 Method Guards
**File**: `libs/api-utils/methods.ts`

Create HTTP method enforcement:
- `withMethods(methods[], handler)` wrapper
- Return 405 for unsupported methods
- Use in all route handlers

#### 3.3 Validation Helpers
**File**: `libs/api-utils/validate.ts`

Set up Zod validation utilities:
- Safe parsing helpers
- Error formatting for API responses
- Reusable validation schemas

#### 3.4 Supabase Client Helper
**File**: `libs/api-utils/supabase.ts`

Create service client factory:
- `createServiceSupabaseClient()` for API routes
- Uses server-side client (not admin)
- Consistent client creation

### 4. Environment Configuration

#### 4.1 Environment Variables
**File**: Update `.env.local.example` or document in ops_runbook.md

Required environment variables:
- Supabase URLs and keys
- Stripe keys and webhook secret
- Replicate API token
- Optional: PUBLIC_BASE_URL for webhooks

#### 4.2 Environment Validation
**File**: `libs/env/index.ts` (if not exists)

Add server-side environment validation:
- Parse required variables with Zod
- Include REPLICATE_API_TOKEN
- Fail fast on missing variables
- Export typed environment object

### 5. Repository Layer Foundation

#### 5.1 Repository Type Definitions
**File**: `types/database.ts`

Define TypeScript types for all database entities:
- GenerationJob
- Render and RenderVariant
- Collection and CollectionItem
- CommunityCollection and CommunityItem
- UsageLedger entry

Follow the exact schema from migrations.

### 6. Verification Steps

After implementation, verify:

#### 6.1 Configuration
- [ ] Runtime config exports all required presets
- [ ] AU-specific room types and styles present
- [ ] Plan limits properly defined
- [ ] Replicate timeouts configured

#### 6.2 Database
- [ ] All migrations are idempotent (IF NOT EXISTS)
- [ ] RLS policies correctly scoped
- [ ] Indexes created for performance
- [ ] Unique constraints in place

#### 6.3 Code Quality
- [ ] TypeScript compilation succeeds
- [ ] No use of Server Actions
- [ ] Response helpers return normalized format
- [ ] Environment variables documented

#### 6.4 Handbook Compliance
Run the grep checks specified in the handbook section 11 to ensure no forbidden patterns exist.

## Success Criteria

This phase is complete when:
1. Runtime configuration system is fully implemented
2. All database migrations are created (not applied yet)
3. API utility functions are ready for use
4. Environment configuration is documented
5. TypeScript types match database schema
6. All handbook compliance checks pass
7. The foundation is ready for Phase 2 implementation

## Notes for Implementation

- DO NOT modify existing routes in `app/api/*` unless specified
- DO NOT delete any existing files
- Follow exact naming conventions from specs
- Use templates from playbooks for consistency
- Keep migrations idempotent for safe re-runs
- Test TypeScript compilation after each major change

## Next Phase
After completing Phase 1, proceed to Phase 2: Generation Engine Core, which will build upon this foundation to implement the Replicate integration and generation workflow.