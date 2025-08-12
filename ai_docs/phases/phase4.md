# Phase 4: API Surface

## Prerequisites
Before starting this phase, ensure Phases 1-3 are complete and load:
- `ai_docs/spec/system_architecture_and_api.md` - Complete API specifications
- `ai_docs/docs/02-playbooks-and-templates.md` - API route templates
- `ai_docs/docs/01-handbook.md` - API standards and patterns

## Goals
Implement all API endpoints with proper validation, error handling, and normalized responses to expose the complete application functionality.

## Dependencies from Previous Phases
- All services and repositories (Phases 2-3)
- API utilities and response helpers (Phase 1)
- Runtime configuration (Phase 1)

## Tasks

### 1. Authentication Endpoints

#### 1.1 Current User Endpoint
**File**: `app/api/v1/auth/me/route.ts`

Implement GET endpoint for authenticated user info:
- Verify authentication using Supabase session
- Return user ID and email
- Return 401 for unauthenticated requests
- Use normalized response format

This endpoint already exists but ensure it follows the specification in `system_architecture_and_api.md` section 6.1.

### 2. Generation API Completion

#### 2.1 Generation Routes Enhancement
**Files**: Already created in Phase 2, verify compliance

Ensure these endpoints match specifications exactly:
- POST `/api/v1/generations` - Submit generation
- GET `/api/v1/generations/[id]` - Get status

Verify error codes, response shapes, and validation rules.

### 3. Renders Management API

#### 3.1 List Renders Endpoint
**File**: `app/api/v1/renders/route.ts`

Implement GET endpoint with query parameters:
- Support cursor-based pagination
- Filter by mode, room type, style
- Return normalized list response
- Include cover variant URLs
- Implement proper query validation

Follow contract from `system_architecture_and_api.md` section 6.3.

#### 3.2 Get Single Render
**File**: `app/api/v1/renders/[id]/route.ts`

Implement GET endpoint for render details:
- Verify owner access
- Include all variant URLs
- Return full metadata
- Handle not found gracefully

#### 3.3 Delete Render
**File**: Add DELETE method to `app/api/v1/renders/[id]/route.ts`

Implement render deletion:
- Verify owner permission
- Cascade delete variants
- Return success confirmation
- Handle already deleted case

### 4. Collections API

#### 4.1 Collections CRUD
**File**: `app/api/v1/collections/route.ts`

Implement collection management:
- GET - List user's collections
- POST - Create new collection

Each method should:
- Validate input with Zod
- Use collections service
- Return normalized responses
- Handle default favorites specially

#### 4.2 Single Collection Operations
**File**: `app/api/v1/collections/[id]/route.ts`

Implement collection-specific operations:
- PATCH - Rename collection
- DELETE - Delete collection (prevent default favorites)

#### 4.3 Collection Items Management
**File**: `app/api/v1/collections/[id]/items/route.ts`

Implement collection items:
- GET - List items in collection
- POST - Add render to collection

#### 4.4 Remove Collection Item
**File**: `app/api/v1/collections/[id]/items/[renderId]/route.ts`

Implement DELETE to remove render from collection.

### 5. Community API

#### 5.1 Public Community Endpoint
**File**: `app/api/v1/community/route.ts`

Implement GET endpoint for community collections:
- No authentication required
- Return all curated collections with items
- Include apply_settings for prefill
- Support featured filtering
- Cache responses appropriately

Follow specification from `system_architecture_and_api.md` section 6.5.

### 6. Usage and Billing API

#### 6.1 Usage Endpoint
**File**: `app/api/v1/usage/route.ts`

Implement GET endpoint for usage info:
- Require authentication
- Calculate remaining generations
- Return current plan details
- Include billing period info

### 6.2 Stripe Integration Bridges
**Files**: Verify existing implementations

Ensure legacy routes properly delegate to v1:
- `/api/stripe/create-checkout` → `/api/v1/stripe/create-checkout`
- `/api/stripe/create-portal` → `/api/v1/stripe/create-portal`

The v1 routes should:
- Use billing service
- Validate plan selection
- Return proper checkout/portal URLs
- Handle Stripe errors gracefully

### 7. Webhook Routes Verification

#### 7.1 Stripe Webhook
**File**: Verify `/api/v1/webhooks/stripe/route.ts`

Ensure webhook properly:
- Verifies Stripe signature
- Updates user profile with plan
- Handles subscription events
- Uses admin client appropriately

#### 7.2 Legacy Webhook Bridge
**File**: Verify `/api/webhook/stripe/route.ts`

Ensure it delegates to v1 webhook properly.

### 8. API Middleware and Guards

#### 8.1 Authentication Middleware
Ensure all protected routes:
- Check for valid session
- Return consistent 401 responses
- Include proper error messages
- Set appropriate headers

#### 8.2 Rate Limiting (Optional for MVP)
If implementing:
- Add rate limit headers
- Return 429 for exceeded limits
- Implement per-user tracking

### 9. API Documentation

#### 9.1 Response Contracts
Verify all endpoints return the normalized shape specified in the handbook:
- success: boolean
- data?: T
- error?: { code, message, details }
- message?: string

#### 9.2 Error Codes
Ensure consistent error codes across all endpoints as specified in `system_architecture_and_api.md` section 5.

### 10. Verification Steps

#### 10.1 Endpoint Testing
- [ ] All GET endpoints return proper data
- [ ] POST endpoints validate input correctly
- [ ] PATCH/PUT endpoints update correctly
- [ ] DELETE endpoints handle cascades

#### 10.2 Error Handling
- [ ] Invalid input returns 400 with details
- [ ] Unauthorized returns 401
- [ ] Forbidden returns 403
- [ ] Not found returns 404
- [ ] Server errors return 500

#### 10.3 Response Format
- [ ] All responses use normalized format
- [ ] Cache-Control headers set correctly
- [ ] Content-Type is application/json
- [ ] Status codes match errors

## Success Criteria

This phase is complete when:
1. All API endpoints implemented per specification
2. Validation working on all inputs
3. Error handling consistent across endpoints
4. Authentication properly enforced
5. Legacy routes properly bridged
6. Webhooks processing correctly
7. Manual API testing passes

## Notes for Implementation

- Use withMethods helper for all routes
- Always validate with Zod schemas
- Return normalized responses via helpers
- Never call repositories directly from routes
- Maintain consistent error codes
- Test with curl or API client
- Ensure no Server Actions used

## Next Phase
After completing Phase 4, proceed to Phase 5: Dashboard UI Foundation, which will build the user interface infrastructure.