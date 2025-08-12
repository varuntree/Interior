# Phase 3: Data Management Layer

## Prerequisites
Before starting this phase, ensure Phases 1-2 are complete and load:
- `ai_docs/spec/data_and_storage.md` - Complete data specifications
- `ai_docs/spec/system_architecture_and_api.md` - Service layer requirements
- `ai_docs/docs/02-playbooks-and-templates.md` - Repository templates

## Goals
Complete all repository implementations, service layers, and data management functions to support the full application feature set.

## Dependencies from Previous Phases
- Database schema and migrations (Phase 1)
- Generation service core (Phase 2)
- Storage handling basics (Phase 2)

## Tasks

### 1. Collections Management

#### 1.1 Collections Repository
**File**: `libs/repositories/collections.ts`

Implement all collection operations following `data_and_storage.md` section 4.3:
- List all collections for a user
- Get default favorites collection
- Create new collection with name
- Rename collection (except default favorites)
- Delete collection (prevent default favorites deletion)
- Add render to collection (idempotent)
- Remove render from collection
- List items in a collection with render details

Ensure all functions follow the pure function pattern with Supabase client parameter.

#### 1.2 Collections Service
**File**: `libs/services/collections.ts`

Build the business logic layer for collections:
- Ensure default favorites exists for user
- Handle collection creation with validation
- Manage collection items with proper checks
- Support batch operations for efficiency
- Implement "Add to Favorites" one-click flow

### 2. Community Collections

#### 2.1 Community Repository
**File**: `libs/repositories/community.ts`

Implement public community collection access:
- List all community collections with items
- Get specific collection with full details
- Support both internal renders and external images
- Include apply_settings for prefill feature
- Maintain order_index for curation

#### 2.2 Community Service
**File**: `libs/services/community.ts`

Create service layer for community features:
- Format community data for UI consumption
- Handle "Try this look" settings extraction
- Support featured collections
- Prepare data for public API responses

Note: Admin management functions will be implemented in a later phase if needed.

### 3. Enhanced Renders Management

#### 3.1 Extended Renders Repository
**File**: Update `libs/repositories/renders.ts`

Add advanced query capabilities:
- Filter by mode, room type, style
- Implement cursor-based pagination
- Support sorting by created date
- Include variant counts and cover images
- Batch fetch for performance

#### 3.2 Renders Service
**File**: `libs/services/renders.ts`

Implement render management logic:
- Format renders for API responses
- Generate signed URLs for private assets (if needed)
- Handle render deletion with cascade
- Support bulk operations
- Calculate render statistics

### 4. Usage and Billing Integration

#### 4.1 Usage Service
**File**: `libs/services/usage.ts`

Implement usage tracking and quota management:
- Calculate remaining generations for current month
- Get plan details from runtime config
- Check generation allowance before submission
- Format usage data for API responses
- Support usage history queries

The service should integrate with:
- Runtime config for plan definitions
- Profile data for user's price_id
- Usage ledger for consumption tracking

#### 4.2 Billing Service Enhancement
**File**: Update `libs/services/billing.ts`

Extend existing billing service:
- Map Stripe price IDs to plan features
- Calculate current billing period
- Prepare upgrade/downgrade flows
- Format billing data for settings page

### 5. Profile Management

#### 5.1 Profiles Repository Enhancement
**File**: Update `libs/repositories/profiles.ts`

Add additional profile operations:
- Get profile with plan details
- Update profile preferences (if any)
- Check admin role status
- Verify account access status

### 6. Storage Management Enhancement

#### 6.1 Storage Service Extensions
**File**: `libs/services/storage/management.ts`

Implement advanced storage operations:
- Calculate storage usage per user
- Clean up orphaned assets
- Generate batch signed URLs
- Implement asset versioning paths
- Handle different file types and sizes

### 7. Data Integrity and Maintenance

#### 7.1 Data Validation Service
**File**: `libs/services/data/validation.ts`

Create validation utilities:
- Verify render-job relationships
- Check collection item consistency
- Validate storage path references
- Ensure usage ledger accuracy

#### 7.2 Cleanup Service
**File**: `libs/services/data/cleanup.ts`

Implement cleanup operations:
- Mark stuck jobs as failed
- Remove orphaned render records
- Clean expired signed URLs from cache
- Archive old generation jobs (optional)

### 8. Caching Layer (Optional for MVP)

#### 8.1 Cache Utilities
**File**: `libs/services/cache/index.ts`

If implementing caching:
- Cache frequently accessed collections
- Store recent renders in memory
- Cache user quota calculations
- Implement cache invalidation strategies

Note: This is optional for MVP but improves performance.

### 9. Verification Steps

#### 9.1 Repository Testing
- [ ] All CRUD operations work correctly
- [ ] RLS policies properly enforced
- [ ] Pagination returns correct results
- [ ] Filtering works as expected

#### 9.2 Service Layer Testing
- [ ] Business logic correctly implemented
- [ ] Error handling covers edge cases
- [ ] Data formatting matches API contracts
- [ ] Integration with repositories smooth

#### 9.3 Data Integrity
- [ ] Default favorites auto-created
- [ ] Usage tracking accurate
- [ ] Collection items properly linked
- [ ] Community data publicly accessible

## Success Criteria

This phase is complete when:
1. All repository functions implemented and tested
2. Service layers handle business logic correctly
3. Collections system fully functional
4. Community collections accessible
5. Usage tracking and quotas working
6. Data integrity maintained across operations
7. All pure functions follow handbook patterns

## Notes for Implementation

- Maintain pure function pattern for repositories
- Services compose repositories, never direct DB access
- Follow exact naming from specifications
- Test pagination thoroughly
- Ensure RLS policies work as expected
- Handle edge cases gracefully

## Next Phase
After completing Phase 3, proceed to Phase 4: API Surface, which will expose all functionality through properly structured API endpoints.