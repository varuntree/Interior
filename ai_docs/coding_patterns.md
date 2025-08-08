

# Coding Patterns & Rules

This document defines the implementation patterns for this SaaS template. These patterns work with the fixed technology decisions defined in [`development-decisions.md`](./development-decisions.md).

## 📋 Table of Contents

1. [🏗️ Database Access Pattern (Repository)](#️-database-access-pattern-repository)
2. [🗄️ Database Migration Pattern](#️-database-migration-pattern)
3. [🔒 Authentication Pattern](#-authentication-pattern)
4. [🚀 API Route Pattern](#-api-route-pattern)
5. [📁 File Storage Pattern](#-file-storage-pattern)
6. [🎨 Design System Pattern](#-design-system-pattern)
7. [🎨 Component Pattern](#-component-pattern)
8. [🚫 Prohibited Patterns](#-prohibited-patterns)
9. [✅ Code Review Checklist](#-code-review-checklist)

---

## 🏗️ Database Access Pattern (Pure Function Repositories)

### ✅ REQUIRED: Use Pure Function Pattern Only

**Clear separation between server and client usage.** Use pure functions with dependency injection.

#### Structure:
```
libs/repositories/
├── index.ts                   # Export all functions
├── auth.ts                    # Authentication functions  
├── profile.ts                 # User profile functions
└── [entity].ts                # Additional entity functions
```

#### Server-Side Implementation:
```typescript
// ✅ CORRECT - Server usage (API routes, Server Components)
import { createClient } from '@/libs/supabase/server'
import { getUser, signOut } from '@/libs/repositories/auth'

const supabase = createClient()
const user = await getUser(supabase)
await signOut(supabase)
```

#### Client-Side Implementation:
```typescript
// ✅ CORRECT - Client usage (Client Components)
import { createClient } from '@/libs/supabase/client'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
await supabase.auth.signOut()
```

#### Pure Function Example:
```typescript
export async function getUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}
```

---

## 🗄️ Database Migration Pattern

### ✅ REQUIRED: Two-Step Migration Process

**CRITICAL**: During phase development, migrations are created as files ONLY. They are NOT applied to the database until explicit user permission.

#### Migration Workflow:
1. **Phase Development**: Create migration SQL files only
2. **User Review**: User reviews all migration files
3. **Explicit Permission**: User gives permission to apply migrations
4. **Database Application**: Use MCP tools to apply migrations

#### File Structure:
```
migrations/
├── phase1/
│   ├── 001_create_users_table.sql
│   ├── 002_create_profiles_table.sql
│   └── 003_add_indexes.sql
├── phase2/
│   ├── 004_create_content_tables.sql
│   └── 005_add_relationships.sql
└── phase3/
    └── 006_create_analytics_tables.sql
```

#### During Phase Development:
```typescript
// ✅ CORRECT - Create migration file only
// File: migrations/phase1/001_create_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// ❌ NEVER DO THIS - Apply migration directly during development
await mcp__supabase__apply_migration({
  project_id: 'swingo',
  name: 'create_users_table',
  query: '...'
})
```

#### After User Permission:
```typescript
// ✅ CORRECT - Apply migrations only after explicit permission
// User: "Apply the phase 1 migrations"
// Assistant: Now applying the approved migrations...
await mcp__supabase__apply_migration({
  project_id: 'swingo',
  name: 'phase1_migrations',
  query: migrationContent
})
```

#### Important Rules:
- **NEVER** apply migrations automatically during phase development
- **ALWAYS** create migration files in organized phase folders
- **ALWAYS** wait for explicit user permission before applying
- **NEVER** modify the database schema without user approval
- Each migration file should be atomic and reversible when possible

#### Benefits:
- Enables autonomous code development without database dependencies
- Allows user to review all database changes before application
- Prevents accidental database modifications
- Maintains clear separation between development and deployment

---

## 🔒 Authentication Pattern

**Fixed Decision**: Google OAuth only (per `development-decisions.md`)

### Usage Patterns:
```typescript
// Server Component
const user = await authRepository.getUser()
if (!user) redirect('/signin')

// Client Component  
useEffect(() => {
  authRepository.getUser().then(setUser)
}, [])

// API Route
export const POST = withAuth(async (req, { user }) => {
  // user is guaranteed authenticated
})
```

---

## 🚀 API Route Pattern

### ✅ REQUIRED: Use API Utilities Only

**Never write raw API routes.** Always use standardized wrappers.

#### Structure:
```
libs/api-utils/
├── index.ts          # Export all utilities
├── responses.ts      # Standardized responses
├── errors.ts         # Error handling
├── helpers.ts        # Common helpers
└── middleware.ts     # Auth wrappers
```

#### Usage Patterns:
```typescript
// Public Route
import { withApiHandler, apiSuccess } from '@/libs/api-utils'
export const POST = withApiHandler(async (req) => {
  return apiSuccess(data, "Success message")
})

// Protected Route
import { withAuth } from '@/libs/api-utils'
export const POST = withAuth(async (req, { user }) => {
  return apiSuccess(data)
})
```

#### Standardized Response:
```typescript
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

---

## 📁 File Storage Pattern

### ✅ REQUIRED: Use Storage Repository Only

**Never handle uploads directly.** Always use storage repository.

#### Structure:
```
libs/storage/
├── index.ts              # Export utilities
├── storageRepository.ts  # Main operations
├── types.ts             # Upload types
├── validation.ts        # File validation
└── config.ts            # Configuration
```

#### Usage:
```typescript
// API Route
import { withAuth } from '@/libs/api-utils'
import { storageRepository, validateFile } from '@/libs/storage'

export const POST = withAuth(async (req, { user }) => {
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  validateFile(file)
  const result = await storageRepository.uploadFile(path, file)
  return apiSuccess(result)
})

// Frontend Hook
const { upload, loading, error } = useFileUpload()
```

---

## 🎨 Design System Pattern

### ✅ REQUIRED: Use CSS Variables for All Design Tokens

**All design values must use CSS variables.** Never hard-code spacing, colors, or sizes.

#### Design Token Structure:
```css
/* ✅ CORRECT - In globals.css */
:root {
  /* Spacing Scale */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-4: 1rem;     /* 16px */
  
  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  
  /* Colors (HSL format) */
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
}
```

#### Usage in Components:
```typescript
// ✅ CORRECT - Using design tokens
<div className="p-4 text-sm rounded-lg">
  {/* p-4 uses var(--space-4) */}
  {/* text-sm uses var(--font-size-sm) */}
  {/* rounded-lg uses var(--radius-lg) */}
</div>

// ❌ WRONG - Hard-coded values
<div style={{ padding: '16px', fontSize: '14px' }}>
```

#### Adding shadcn/ui Components:
```bash
# ✅ CORRECT - Use shadcn CLI
npx shadcn@latest add button

# Components automatically use CSS variables
```

#### Updating Design System:
When design specifications arrive:
1. Update values in `/app/globals.css`
2. Components automatically use new values
3. No component code changes needed

---

## 🎨 Component Pattern

### ✅ Component Structure Rules

**Fixed Decision**: Tailwind CSS + shadcn/ui only (per `development-decisions.md`)

#### File Organization:
```typescript
// ✅ CORRECT - Component structure
export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  return (
    <div className="tailwind-classes">
      {/* UI using shadcn/ui components */}
    </div>
  )
}

interface ComponentNameProps {
  prop1: string
  prop2?: number
}
```

#### Repository Usage in Components:
```typescript
// ✅ CORRECT - Repository in component
import { authRepository } from '@/libs/repositories/authRepository'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    authRepository.getUser().then(setUser)
  }, [])
  
  return <div>Dashboard content</div>
}
```

#### Naming Conventions:
- **Components**: PascalCase (`ButtonCheckout.tsx`)
- **Props Interface**: `ComponentNameProps`
- **Hooks**: camelCase starting with `use` (`useFileUpload.ts`)

---

## 🚫 Prohibited Patterns

### ❌ Class-Based Repositories:
```typescript
// NEVER DO THIS
class AuthRepository extends BaseRepository {
  async getUser() { /* ... */ }
}
```

### ❌ Auto-Detection Patterns:
```typescript
// NEVER DO THIS  
if (typeof window === 'undefined') {
  return serverClient()
} else {
  return browserClient()
}
```

### ❌ Raw API Routes:
```typescript
// NEVER DO THIS
export async function POST(req: NextRequest) {
  try {
    // Raw implementation
  } catch (error) {
    // Manual error handling
  }
}
```

### ❌ Client Components Using Repositories:
```typescript
// NEVER DO THIS - Client component importing server repositories
import { getUser } from '@/libs/repositories/auth'
// Use direct client instead in client components
```

### ❌ Non-Standard UI:
```typescript
// NEVER DO THIS - Wrong UI framework
import { Button } from 'react-bootstrap'
import { Spinner } from 'antd'

// NEVER DO THIS - DaisyUI classes (removed)
<button className="btn btn-primary">

// NEVER DO THIS - Hard-coded design values
<div style={{ padding: '16px', margin: '8px' }}>
```

---

## ✅ Code Review Checklist

**Before committing, verify:**

### Database & Repositories:
- [ ] No direct Supabase imports in components/pages
- [ ] All database operations use repositories
- [ ] Repository extends `BaseRepository`
- [ ] Components contain only UI logic
- [ ] Migration files created but NOT applied during development
- [ ] Migrations only applied after explicit user permission

### API Routes:
- [ ] All routes use `withApiHandler` or `withAuth`
- [ ] Standardized response format (`apiSuccess`/`apiError`)
- [ ] Input validation using helper functions

### File Storage:
- [ ] File uploads use storage repository
- [ ] File validation applied before upload
- [ ] Proper error handling for uploads

### Components:
- [ ] Uses only Tailwind + shadcn/ui
- [ ] All spacing/colors use CSS variables (design tokens)
- [ ] Repository pattern for data access
- [ ] Proper TypeScript interfaces
- [ ] Consistent naming conventions

### Technology Compliance:
- [ ] Follows all decisions in `development-decisions.md`
- [ ] No forbidden technologies or patterns
- [ ] Authentication uses Google OAuth only
- [ ] No testing or CI/CD code added

---

**Remember**: These patterns ensure consistent, maintainable code across all SaaS projects built with this template. Follow `development-decisions.md` for WHAT to use, and this file for HOW to implement it.