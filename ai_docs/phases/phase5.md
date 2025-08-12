# Phase 5: Dashboard UI Foundation

## Prerequisites
Before starting this phase, ensure Phases 1-4 are complete and load:
- `ai_docs/spec/ux_ui.md` - Complete UI specifications
- `ai_docs/spec/design_system.md` - Design tokens and theme system
- `ai_docs/docs/01-handbook.md` - UI architecture rules

## Goals
Build the core dashboard infrastructure with layouts, navigation, theme integration, and base components following mobile-first responsive design principles.

## Dependencies from Previous Phases
- All API endpoints functional (Phase 4)
- Runtime configuration available (Phase 1)
- Authentication system working (Phase 1-4)

## Tasks

### 1. Dashboard Layout Structure

#### 1.1 Dashboard Layout Enhancement
**File**: `app/(app)/dashboard/layout.tsx`

Enhance the existing dashboard layout:
- Implement sidebar navigation structure
- Add responsive mobile menu
- Integrate theme tokens from design system
- Ensure auth guard remains intact
- Add loading states and error boundaries

The layout should follow the structure defined in `ux_ui.md` section 3.

#### 1.2 Sidebar Component
**File**: `components/dashboard/Sidebar.tsx`

Create the persistent sidebar navigation:
- Navigation items as specified in UX doc
- Active state highlighting
- Mobile-responsive drawer version
- Plan/usage badge at bottom
- Consistent with design tokens

Navigation structure from spec:
- Overview
- Create (primary)
- My Renders
- Collections
- Community
- Settings (after divider)

### 2. Theme and Design System Integration

#### 2.1 Verify Theme Tokens
**File**: Check `app/globals.css`

Ensure all design tokens from `design_system.md` are present:
- Color variables for light/dark modes
- Border radius (1.3rem for modern look)
- Typography (Open Sans)
- Minimal shadow system (0.00 opacity)
- Chart colors for data visualization

#### 2.2 Theme Provider Setup
**File**: Verify `app/layout.tsx`

Ensure theme provider is configured:
- next-themes integration
- Class-based dark mode switching
- Theme persistence
- System preference detection

### 3. Base Component Library

#### 3.1 Dashboard Header Component
**File**: `components/dashboard/DashboardHeader.tsx`

Create reusable page header:
- Page title and optional subtitle
- Breadcrumb support
- Action buttons area
- Mobile-responsive layout
- Uses design tokens

#### 3.2 Empty State Component
**File**: `components/dashboard/EmptyState.tsx`

Create empty state for lists:
- Illustration/icon area
- Descriptive message
- Call-to-action button
- Responsive sizing
- Follows design system

#### 3.3 Loading States
**File**: `components/dashboard/LoadingStates.tsx`

Create loading components:
- Skeleton loaders for lists
- Spinner variations
- Progress indicators
- Shimmer effects
- Consistent with design tokens

### 4. Dashboard Pages Structure

#### 4.1 Dashboard Overview Page
**File**: Update `app/(app)/dashboard/page.tsx`

Implement the overview page:
- Welcome message
- Recent renders preview
- Quick action cards
- Usage summary
- Mobile-first layout

#### 4.2 Create Page Shell
**File**: `app/(app)/dashboard/create/page.tsx`

Create the page structure (content in Phase 6):
- Page header
- Container for generation workspace
- Proper spacing and layout
- Mobile-responsive structure

#### 4.3 Renders Page Shell
**File**: `app/(app)/dashboard/renders/page.tsx`

Create the renders listing page structure:
- Page header with filters
- Grid container
- Pagination area
- Empty state handling

#### 4.4 Collections Page Shell
**File**: `app/(app)/dashboard/collections/page.tsx`

Create collections page structure:
- Page header with "New Collection" action
- Collections grid container
- Default favorites handling

#### 4.5 Community Page Shell
**File**: `app/(app)/dashboard/community/page.tsx`

Create community page structure:
- Page header
- Sections for curated collections
- Public access (no auth required for viewing)

#### 4.6 Settings Page Shell
**File**: `app/(app)/dashboard/settings/page.tsx`

Create settings page structure:
- Profile section
- Plan/billing section
- Support section
- Form containers

### 5. Responsive Design Implementation

#### 5.1 Mobile Navigation
**File**: `components/dashboard/MobileNav.tsx`

Implement mobile navigation:
- Hamburger menu trigger
- Slide-out drawer
- Touch-optimized menu items
- Backdrop overlay
- Smooth animations

#### 5.2 Responsive Grid System
**File**: `components/dashboard/ResponsiveGrid.tsx`

Create responsive grid utilities:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns
- Proper spacing
- Container queries support

### 6. Data Fetching Patterns

#### 6.1 API Client Setup
**File**: Update `libs/api/http.ts`

Ensure API client is configured for dashboard:
- Authentication headers
- Error handling
- Base URL configuration
- Response type safety

#### 6.2 Data Hooks (Optional)
**File**: `hooks/useApi.ts`

Create reusable data fetching hooks:
- Loading states
- Error handling
- Refetch capabilities
- Cache management (if using SWR/React Query)

### 7. Accessibility Features

#### 7.1 Keyboard Navigation
Implement throughout dashboard:
- Focus management
- Skip links
- Keyboard shortcuts (optional)
- Escape key handling
- Tab order optimization

#### 7.2 ARIA Labels
Ensure all interactive elements have:
- Proper ARIA labels
- Role attributes
- Screen reader support
- Alt text for images

### 8. Performance Optimizations

#### 8.1 Code Splitting
Implement for dashboard routes:
- Dynamic imports for heavy components
- Route-based splitting
- Lazy loading for modals

#### 8.2 Image Optimization
Set up for renders:
- Next.js Image component usage
- Lazy loading
- Responsive sizes
- WebP format preference

### 9. Verification Steps

#### 9.1 Layout Testing
- [ ] Sidebar navigation works
- [ ] Mobile menu functions correctly
- [ ] Auth guard redirects properly
- [ ] Theme switching works

#### 9.2 Responsive Testing
- [ ] Mobile layout (375px)
- [ ] Tablet layout (768px)
- [ ] Desktop layout (1280px)
- [ ] No horizontal scroll

#### 9.3 Theme Testing
- [ ] Light mode renders correctly
- [ ] Dark mode has proper contrast
- [ ] Theme persists on refresh
- [ ] Design tokens applied

#### 9.4 Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Screen reader compatible

## Success Criteria

This phase is complete when:
1. Dashboard layout with sidebar navigation working
2. All page shells created and routable
3. Theme system fully integrated
4. Mobile-responsive design implemented
5. Base components ready for use
6. Loading and empty states available
7. Accessibility features in place

## Notes for Implementation

- Follow mobile-first approach
- Use Tailwind classes with design tokens
- Maintain consistent spacing
- Test on multiple viewport sizes
- Ensure smooth transitions
- Keep components reusable
- No direct API calls from components (use services)

## Next Phase
After completing Phase 5, proceed to Phase 6: Generation UI & Workflows, which will implement the complete generation experience and render management interfaces.