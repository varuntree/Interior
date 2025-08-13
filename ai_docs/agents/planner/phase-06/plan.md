# Phase 6 Implementation Plan: Community & Admin Curation

## Scope

### What Will Change
- Add admin system with self-enrollment via email allowlist
- Add community collections & items tables with RLS for public read/admin write
- Add admin-only API routes for managing community content
- Add storage helpers for community image uploads to public bucket
- Add public marketing pages for browsing community collections
- Add simple admin dashboard under `/dashboard/admin/community`

### What Will NOT Change
- Existing generation system, favorites, or collections
- User-facing generation flow or billing
- Existing auth system (just adding admin capabilities)
- Service-role usage patterns (admin functions use standard user client with RLS)

## API Endpoints

### Public Routes (No Auth Required)
- `GET /api/v1/community/collections` - List published community collections
  - Response: `{ success: true, data: { collections: CommunityCollection[] } }`
- `GET /api/v1/community/collections/[id]/items` - Get items for a published collection  
  - Response: `{ success: true, data: { items: CommunityItem[] } }`

### Admin Routes (Admin Auth Required)
- `POST /api/v1/admin/ensure` - Self-enroll as admin if email on allowlist
  - Body: None (reads current user email)
  - Response: `{ success: true, data: { isAdmin: boolean } }`
- `POST /api/v1/admin/community/collections/upsert` - Create/update collection
  - Body: `{ id?: string, title: string, description?: string, coverImageUrl?: string, position?: number }`
  - Response: `{ success: true, data: { collection: CommunityCollection } }`
- `POST /api/v1/admin/community/collections/publish` - Toggle published status
  - Body: `{ id: string, isPublished: boolean }`
  - Response: `{ success: true, data: { collection: CommunityCollection } }`
- `POST /api/v1/admin/community/collections/delete` - Delete collection
  - Body: `{ id: string }`
  - Response: `{ success: true, data: null }`
- `POST /api/v1/admin/community/items/upsert` - Add/update collection item
  - Body: `{ id?: string, collectionId: string, title?: string, imageUrl: string, tags?: string[], position?: number }`
  - Response: `{ success: true, data: { item: CommunityItem } }`
- `POST /api/v1/admin/community/items/delete` - Delete collection item
  - Body: `{ id: string }`
  - Response: `{ success: true, data: null }`

## Services & Repositories

### New Services
- `libs/services/admin.ts` - Admin enrollment and permission checking
- `libs/services/community.ts` - Community content management

### New Repositories  
- `libs/repositories/admins.ts` - Admin user management
- `libs/repositories/community.ts` - Community collections & items CRUD

### Storage
- `libs/storage/community.ts` - Upload community images to public bucket at `community/{collectionId}/{filename}`

## Migrations

### `migrations/phase6/009_create_admins.sql`
- Create `admins` table with owner_id and email
- RLS policies for self-management 
- Helper view `me_is_admin` for permission checks

### `migrations/phase6/010_create_community.sql`
- Create `community_collections` table with published status and positioning
- Create `community_items` table with image URLs and tags
- Public read RLS policies
- Admin write RLS policies (checks admins membership)

## Storage Paths & Buckets
- Public bucket: `community/{collectionId}/{filename}` for curated images
- All community images are publicly readable
- Upload permissions via RLS (admin users only)

## UI Surfaces

### Public Pages (Marketing Layout)
- `/community` - Grid of published community collections with covers and titles
- `/community/[collectionId]` - Gallery view of collection items with titles and tags

### Admin Pages (Dashboard Layout)  
- `/dashboard/admin/community` - Admin management panel with:
  - "Ensure Admin" button for self-enrollment
  - Collection management (create, edit, publish/unpublish, delete)
  - Item management (add images, set titles/tags, reorder, delete)
  - Simple drag-and-drop or form-based interface

## External Services Usage
- No Replicate/OpenAI usage in this phase
- Uses Supabase Storage for community image uploads
- Uses standard Supabase client (no service-role) with RLS enforcement

## Acceptance Criteria

### Public Access
- [ ] `/community` page loads without authentication and shows published collections
- [ ] Collection detail pages show items with proper image display
- [ ] Unpublished collections are not visible to public users
- [ ] Public pages work for logged-out users

### Admin Functionality  
- [ ] Admin can self-enroll via `/api/v1/admin/ensure` if email in ADMIN_EMAILS env var
- [ ] Admin can create/edit community collections with title, description, cover image
- [ ] Admin can toggle collection published status to control public visibility
- [ ] Admin can add items to collections with image upload, title, and tags
- [ ] Admin can reorder collections and items (position field)
- [ ] Admin can delete collections and items

### Data Integrity
- [ ] RLS policies prevent non-admin writes to community tables
- [ ] Public users can read published content without auth
- [ ] Admin permissions are enforced at DB level via RLS
- [ ] Image uploads go to public bucket with correct paths

### Technical Requirements
- [ ] `npm run build` passes without errors
- [ ] All API routes return normalized JSON responses
- [ ] No service-role usage outside webhooks (uses RLS instead)
- [ ] Grep checks pass (no Server Actions, no direct DB in components)
- [ ] Existing routes and pages remain functional

## Risk Assessment
- **Low Risk**: Admin system uses email allowlist, minimal attack surface
- **Low Risk**: Uses existing RLS patterns, no new service-role requirements  
- **Medium Risk**: Public pages need to work without auth (test thoroughly)
- **Low Risk**: Community feature is isolated from existing generation system

## Implementation Notes
- Phase builds on existing auth/storage/API patterns
- Admin functionality is self-service (no manual user promotion)
- Community content is completely separate from user generations
- Uses standard client with RLS for all operations (no service-role bypass)
- Follows golden path: Route → Service → Repository → DB

HANDOFF: spec-executor
ARTIFACTS:
/Users/varunprasad/Desktop/Interior/ai_docs/agents/planner/phase-06/plan.md
/Users/varunprasad/Desktop/Interior/ai_docs/agents/planner/phase-06/change_spec.md