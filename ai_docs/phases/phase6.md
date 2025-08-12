# Phase 6: Generation UI & Workflows

## Prerequisites
Before starting this phase, ensure Phases 1-5 are complete and load:
- `ai_docs/spec/ux_ui.md` - Detailed UI workflows and states
- `ai_docs/spec/generation_engine_and_external_service.md` - Generation modes and parameters
- `ai_docs/spec/design_system.md` - Component styling guidelines

## Goals
Implement the complete generation experience including all four modes, real-time status updates, results display, and collection management interfaces.

## Dependencies from Previous Phases
- Dashboard infrastructure (Phase 5)
- All API endpoints working (Phase 4)
- Generation engine functional (Phase 2)
- Runtime configuration (Phase 1)

## Tasks

### 1. Generation Workspace Implementation

#### 1.1 Create Page Core
**File**: Complete `app/(app)/dashboard/create/page.tsx`

Implement the main generation workspace following `ux_ui.md` section 4:
- Mode selector component integration
- Dynamic input areas based on mode
- Settings panel
- Generate button with states
- Results display area
- Mobile-responsive layout

#### 1.2 Mode Selector Component
**File**: `components/generation/ModeSelector.tsx`

Create the mode selection interface:
- Four modes: Redesign, Staging, Compose, Imagine
- Segmented button design
- Tooltips with descriptions
- Active mode highlighting
- Smooth transitions

#### 1.3 Image Upload Component
**File**: `components/generation/ImageUpload.tsx`

Implement file upload with drag-and-drop:
- Dropzone for drag-and-drop
- File input fallback
- Image preview with replace option
- File type validation (JPG/PNG/WebP)
- Size limit enforcement
- Multiple inputs for Compose mode

Requirements by mode:
- Redesign/Staging: Single input (required)
- Compose: Two inputs (both required)
- Imagine: No image inputs

#### 1.4 Preset Selectors
**File**: `components/generation/PresetSelectors.tsx`

Create dropdown components for presets:
- Room Type selector (from runtime config)
- Style selector (from runtime config)
- Searchable/filterable lists
- Mobile-optimized selection
- Default value handling

#### 1.5 Prompt Input Component
**File**: `components/generation/PromptInput.tsx`

Implement the prompt textarea:
- Placeholder text with examples
- Character limit (if any)
- Required indicator for Imagine mode
- Auto-resize option
- Mobile keyboard handling

#### 1.6 Generation Settings Panel
**File**: `components/generation/GenerationSettings.tsx`

Create the settings accordion:
- Aspect Ratio selection (1:1, 3:2, 2:3)
- Quality selection (Auto, Low, Medium, High)
- Variants counter (1-3)
- Collapsible on mobile
- Default values from config

### 2. Generation State Management

#### 2.1 Generation Store/Context
**File**: `contexts/GenerationContext.tsx` or state management solution

Manage generation state:
- Current mode selection
- Input files and URLs
- Selected presets
- Settings values
- Generation status
- Current job ID
- Results data

#### 2.2 Generation Submission Handler
**File**: `components/generation/GenerationSubmit.tsx`

Handle the generation submission flow:
- Validate required inputs per mode
- Check user quota
- Handle file uploads
- Submit to API
- Manage loading states
- Error handling and display

### 3. Real-time Status Updates

#### 3.1 Generation Progress Component
**File**: `components/generation/GenerationProgress.tsx`

Display generation progress:
- Step indicators (Uploading → Creating → Rendering)
- Progress animation/skeleton
- Estimated time remaining (optional)
- Cancel option (if applicable)
- Mobile-optimized display

#### 3.2 Status Polling Hook
**File**: `hooks/useGenerationStatus.ts`

Implement status polling:
- Poll generation endpoint every 2-3 seconds
- Update UI on status changes
- Stop polling on completion
- Handle timeout scenarios
- Error recovery

### 4. Results Display and Actions

#### 4.1 Results Grid Component
**File**: `components/generation/ResultsGrid.tsx`

Display generation results:
- Grid layout for 1-3 variants
- Full-size image preview on click
- Mobile-responsive grid
- Loading placeholders
- Error state handling

#### 4.2 Result Card Component
**File**: `components/generation/ResultCard.tsx`

Individual result variant display:
- Image with lazy loading
- Action buttons toolbar
- Download functionality
- Save to collection options
- Copy prompt feature
- Re-run with same settings

#### 4.3 Image Viewer Modal
**File**: `components/generation/ImageViewer.tsx`

Full-screen image viewer:
- Zoom capabilities
- Pan on mobile
- Download option
- Close on escape/backdrop
- Swipe between variants (mobile)

### 5. My Renders Gallery

#### 5.1 Renders Page Implementation
**File**: Complete `app/(app)/dashboard/renders/page.tsx`

Implement the renders gallery:
- Fetch and display user's renders
- Filter controls (Mode, Room Type, Style)
- Search functionality
- Grid layout with thumbnails
- Pagination or infinite scroll
- Empty state with CTA

#### 5.2 Render Filter Component
**File**: `components/renders/RenderFilters.tsx`

Create filtering interface:
- Mode filter dropdown
- Room type filter
- Style filter
- Clear filters option
- Mobile-responsive layout

#### 5.3 Render Grid Component
**File**: `components/renders/RenderGrid.tsx`

Display renders in grid:
- Responsive columns
- Lazy loading images
- Hover effects
- Click to view details
- Batch selection (optional)

#### 5.4 Render Detail Modal
**File**: `components/renders/RenderDetail.tsx`

Show render details:
- Larger image display
- Variant selector
- Metadata display
- Action buttons
- Delete option

### 6. Collections Interface

#### 6.1 Collections Page Implementation
**File**: Complete `app/(app)/dashboard/collections/page.tsx`

Implement collections management:
- Display all user collections
- "My Favorites" pinned first
- Create new collection
- Collection tiles/cards
- Empty state

#### 6.2 Collection Card Component
**File**: `components/collections/CollectionCard.tsx`

Display individual collection:
- Cover image (first item)
- Collection name
- Item count
- Actions menu
- Click to open

#### 6.3 Collection Detail View
**File**: `app/(app)/dashboard/collections/[id]/page.tsx`

Show collection contents:
- Collection header with actions
- Renders grid
- Remove from collection
- Rename collection (except favorites)
- Delete collection option

#### 6.4 Add to Collection Modal
**File**: `components/collections/AddToCollectionModal.tsx`

Collection selection interface:
- List existing collections
- "My Favorites" one-click option
- Create new collection inline
- Checkbox selection
- Confirm action

### 7. Error Handling and Edge Cases

#### 7.1 Quota Exceeded Handling
Show clear messaging when:
- No remaining generations
- Upgrade CTA button
- Link to billing page

#### 7.2 In-flight Job Blocking
Handle concurrent generation attempts:
- Disable Generate button
- Show toast message
- Display current job status

#### 7.3 Network Error Recovery
Implement resilient error handling:
- Retry mechanisms
- Offline detection
- Clear error messages
- Recovery actions

### 8. Mobile Optimizations

#### 8.1 Touch Interactions
Optimize for mobile:
- Swipe gestures for images
- Touch-friendly buttons (44px minimum)
- Pinch to zoom in viewer
- Pull to refresh (optional)

#### 8.2 Mobile-Specific Layouts
Adjust layouts for small screens:
- Stacked mode selector
- Bottom sheet for settings
- Floating action buttons
- Simplified navigation

### 9. Verification Steps

#### 9.1 Generation Flow Testing
- [ ] All four modes work correctly
- [ ] File uploads successful
- [ ] Status updates in real-time
- [ ] Results display properly

#### 9.2 Collections Testing
- [ ] Add to favorites works
- [ ] Create new collection
- [ ] Remove from collection
- [ ] Delete collection (not favorites)

#### 9.3 Mobile Testing
- [ ] Touch targets adequate size
- [ ] No horizontal scroll
- [ ] Modals work on mobile
- [ ] Image viewer touch-enabled

#### 9.4 Error Scenarios
- [ ] Quota exceeded message shows
- [ ] Network errors handled
- [ ] Invalid inputs validated
- [ ] Timeout handling works

## Success Criteria

This phase is complete when:
1. All four generation modes fully functional
2. Real-time status updates working
3. Results display with all actions
4. My Renders gallery complete
5. Collections management working
6. Mobile experience optimized
7. Error states handled gracefully

## Notes for Implementation

- Use runtime config for all presets
- Implement proper loading states
- Validate inputs on client and server
- Test file upload thoroughly
- Ensure mobile gestures work
- Handle edge cases gracefully
- No direct API calls - use fetch through services

## Next Phase
After completing Phase 6, proceed to Phase 7: Polish & Production Readiness, which will add the final features and prepare for deployment.