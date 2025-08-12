# Phase 7: Testing, Polish & Completion
## Quality Assurance, Performance, and Final Touches

### Phase Overview
**Duration**: 1-2 days
**Dependencies**: Phases 1-6 completed
**Goal**: Ensure production readiness with testing, optimization, and polish

### Required Reading Before Starting
1. `/ai_docs/spec/testing_and_quality_minimal.md` - Testing requirements
2. `/ai_docs/spec/ops_runbook.md` - Operational checklist
3. `/ai_docs/docs/01-handbook.md` - Section 11 (Security & Testing)
4. `/ai_docs/spec/design_system.md` - Theme verification

---

## Task 7.1: Unit Testing

### Test Prompt Builder
Location: `__tests__/services/prompt-builder.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { buildPrompt } from '@/libs/services/external/replicateAdapter'

describe('Prompt Builder', () => {
  it('includes Australian context for redesign mode', () => {
    const prompt = buildPrompt({
      mode: 'redesign',
      roomType: 'living_room',
      style: 'coastal_au',
      aspectRatio: '1:1',
      quality: 'auto',
      variants: 2
    })
    
    expect(prompt).toContain('Australian')
    expect(prompt).toContain('Coastal Australian')
    expect(prompt).toContain('Keep existing room architecture')
  })
  
  it('requires user prompt for imagine mode', () => {
    const prompt = buildPrompt({
      mode: 'imagine',
      prompt: 'Modern minimalist bedroom',
      aspectRatio: '1:1',
      quality: 'auto',
      variants: 2
    })
    
    expect(prompt).toContain('Modern minimalist bedroom')
    expect(prompt).toContain('photorealistic')
  })
  
  it('includes both images context for compose mode', () => {
    const prompt = buildPrompt({
      mode: 'compose',
      roomType: 'bedroom',
      style: 'japandi',
      aspectRatio: '3:2',
      quality: 'high',
      variants: 1
    })
    
    expect(prompt).toContain('base room')
    expect(prompt).toContain('reference')
    expect(prompt).toContain('Japandi')
  })
  
  it('adds quality hints for high quality', () => {
    const prompt = buildPrompt({
      mode: 'staging',
      quality: 'high',
      aspectRatio: '1:1',
      variants: 2
    })
    
    expect(prompt).toContain('Ultra high quality')
    expect(prompt).toContain('professional')
  })
})
```

### Test Adapter Mapping
Location: `__tests__/services/adapter-mapping.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { toReplicateInputs } from '@/libs/services/external/replicateAdapter'

describe('Replicate Adapter', () => {
  it('maps aspect ratio to dimensions correctly', () => {
    const square = toReplicateInputs({
      mode: 'imagine',
      prompt: 'test',
      aspectRatio: '1:1',
      quality: 'medium',
      variants: 2
    })
    
    expect(square.size).toBe('1024x1024')
    
    const landscape = toReplicateInputs({
      mode: 'imagine',
      prompt: 'test',
      aspectRatio: '3:2',
      quality: 'medium',
      variants: 2
    })
    
    expect(landscape.size).toBe('1536x1024')
    
    const portrait = toReplicateInputs({
      mode: 'imagine',
      prompt: 'test',
      aspectRatio: '2:3',
      quality: 'medium',
      variants: 2
    })
    
    expect(portrait.size).toBe('1024x1536')
  })
  
  it('maps quality to resolution tiers', () => {
    const low = toReplicateInputs({
      mode: 'imagine',
      prompt: 'test',
      aspectRatio: '1:1',
      quality: 'low',
      variants: 1
    })
    
    expect(low.size).toBe('768x768')
    
    const high = toReplicateInputs({
      mode: 'imagine',
      prompt: 'test',
      aspectRatio: '1:1',
      quality: 'high',
      variants: 1
    })
    
    expect(high.size).toBe('1536x1536')
  })
  
  it('maps variants to num_outputs', () => {
    const result = toReplicateInputs({
      mode: 'imagine',
      prompt: 'test',
      aspectRatio: '1:1',
      quality: 'auto',
      variants: 3
    })
    
    expect(result.n).toBe(3)
  })
})
```

### Run Unit Tests
```bash
# Install test dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Add test script to package.json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}

# Run tests
npm test
```

---

## Task 7.2: API Smoke Tests

### Create Smoke Test Script
Location: `scripts/smoke-test.mjs`

```javascript
#!/usr/bin/env node

import fetch from 'node-fetch'
import { exit } from 'process'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''

const tests = []
let passed = 0
let failed = 0

// Helper to run test
async function test(name, fn) {
  tests.push({ name, fn })
}

// Helper to assert
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

// Define tests
test('Health check', async () => {
  const response = await fetch(`${BASE_URL}/api/health`)
  assert(response.ok, `Health check failed: ${response.status}`)
})

test('Submit generation (imagine mode)', async () => {
  const response = await fetch(`${BASE_URL}/api/v1/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({
      mode: 'imagine',
      prompt: 'Modern Australian living room',
      roomType: 'living_room',
      style: 'coastal_au',
      aspectRatio: '1:1',
      quality: 'auto',
      variants: 2
    })
  })
  
  assert(response.status === 202, `Expected 202, got ${response.status}`)
  const data = await response.json()
  assert(data.success === true, 'Response not successful')
  assert(data.data?.id, 'No job ID returned')
  
  return data.data.id
})

test('Check generation status', async (jobId) => {
  if (!jobId) {
    console.log('Skipping - no job ID from previous test')
    return
  }
  
  const response = await fetch(`${BASE_URL}/api/v1/generations/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  })
  
  assert(response.ok, `Status check failed: ${response.status}`)
  const data = await response.json()
  assert(data.success === true, 'Response not successful')
  assert(data.data?.status, 'No status returned')
})

test('List renders', async () => {
  const response = await fetch(`${BASE_URL}/api/v1/renders?limit=5`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  })
  
  assert(response.ok, `List renders failed: ${response.status}`)
  const data = await response.json()
  assert(data.success === true, 'Response not successful')
  assert(Array.isArray(data.data?.items), 'Items not an array')
})

test('Get usage', async () => {
  const response = await fetch(`${BASE_URL}/api/v1/usage`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  })
  
  assert(response.ok, `Get usage failed: ${response.status}`)
  const data = await response.json()
  assert(data.success === true, 'Response not successful')
  assert(typeof data.data?.remainingGenerations === 'number', 'Invalid usage data')
})

test('List collections', async () => {
  const response = await fetch(`${BASE_URL}/api/v1/collections`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  })
  
  assert(response.ok, `List collections failed: ${response.status}`)
  const data = await response.json()
  assert(data.success === true, 'Response not successful')
  assert(Array.isArray(data.data), 'Collections not an array')
})

test('Community endpoint (public)', async () => {
  const response = await fetch(`${BASE_URL}/api/v1/community`)
  
  assert(response.ok, `Community endpoint failed: ${response.status}`)
  const data = await response.json()
  assert(data.success === true, 'Response not successful')
})

// Run tests
async function runTests() {
  console.log('🚀 Running API smoke tests...\n')
  
  let lastResult = null
  
  for (const { name, fn } of tests) {
    try {
      process.stdout.write(`Testing: ${name}... `)
      lastResult = await fn(lastResult)
      console.log('✅ PASSED')
      passed++
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`)
      failed++
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    exit(1)
  }
}

runTests().catch(console.error)
```

### Run Smoke Tests
```bash
# Make executable
chmod +x scripts/smoke-test.mjs

# Run tests
AUTH_TOKEN=your_token_here node scripts/smoke-test.mjs
```

---

## Task 7.3: Quality Gates

### Run All Checks
Location: `scripts/quality-check.sh`

```bash
#!/bin/bash

echo "🔍 Running quality checks..."

# Type checking
echo "📝 Type checking..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed"
  exit 1
fi

# Linting
echo "🧹 Linting..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# Build
echo "🔨 Building..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

# Forbidden patterns
echo "🚫 Checking forbidden patterns..."

# No Server Actions
if grep -R "use server" app libs; then
  echo "❌ Found 'use server' - Server Actions are forbidden"
  exit 1
fi

# No direct DB in components
if grep -R "createServerClient" components; then
  echo "❌ Found direct DB access in components"
  exit 1
fi

# No service-role in non-webhook code
if grep -R "service_role" app/\(app\) app/api/v1/generations app/api/v1/renders; then
  echo "❌ Found service_role usage outside webhooks"
  exit 1
fi

echo "✅ All quality checks passed!"
```

---

## Task 7.4: UI Testing Checklist

### Manual Testing Flow

#### 1. Authentication Flow
- [ ] Sign in with Google OAuth works
- [ ] Unauthenticated users redirected to /signin
- [ ] Sign out works correctly
- [ ] Session persists across page refreshes

#### 2. Generation Flow (All Modes)
- [ ] **Redesign**: Upload image → Select style → Generate → View results
- [ ] **Staging**: Upload empty room → Generate → View furnished room
- [ ] **Compose**: Upload two images → Generate → View merged result
- [ ] **Imagine**: Enter prompt only → Generate → View created design
- [ ] In-flight limit blocks second generation
- [ ] Credit limit shows upgrade message when exceeded
- [ ] Results display correctly with all variants

#### 3. Organization Features
- [ ] Save to My Favorites (one-click)
- [ ] Create new collection
- [ ] Add render to collection
- [ ] Remove from collection
- [ ] Delete collection (except favorites)
- [ ] Delete render

#### 4. Community
- [ ] Browse community collections
- [ ] View collection items
- [ ] "Try this look" prefills Create page

#### 5. Responsive Testing
Test on these viewports:
- [ ] Mobile (375×812) - iPhone SE
- [ ] Tablet (768×1024) - iPad
- [ ] Desktop (1280×800) - Laptop

Check for each:
- [ ] No horizontal scroll
- [ ] Touch targets adequate (44×44px min)
- [ ] Images scale correctly
- [ ] Modals position correctly
- [ ] Navigation accessible

---

## Task 7.5: Performance Optimization

### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src={imageUrl}
  alt="Interior design"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL={thumbnailUrl}
/>
```

### Bundle Size Check
```bash
# Analyze bundle
npm run build
npm run analyze

# Check for large dependencies
npx bundle-buddy
```

### Lighthouse Audit
```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --view

# Target scores:
# Performance: >80
# Accessibility: >90
# Best Practices: >90
# SEO: >90
```

---

## Task 7.6: Error Handling

### Add Error Boundaries
Location: `app/(app)/dashboard/error.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])
  
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-xl font-semibold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6">
        We encountered an error while loading this page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

### Add Loading States
Location: `app/(app)/dashboard/loading.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  )
}
```

---

## Task 7.7: Documentation

### Create User Guide
Location: `docs/USER_GUIDE.md`

Include:
- Getting started
- How to use each mode
- Tips for best results
- Troubleshooting
- FAQ

### API Documentation
Location: `docs/API.md`

Document all endpoints with:
- Request/response examples
- Error codes
- Rate limits
- Authentication

---

## Task 7.8: Production Checklist

### Environment Setup
- [ ] All environment variables set
- [ ] Supabase production project configured
- [ ] Stripe production webhook configured
- [ ] Replicate production token set

### Database
- [ ] All migrations applied
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Storage buckets configured

### Security
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Webhook signatures verified
- [ ] Service-role key secure

### Monitoring
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured
- [ ] Uptime monitoring
- [ ] Log aggregation

### Performance
- [ ] CDN configured for assets
- [ ] Database connection pooling
- [ ] Redis cache (if needed)
- [ ] Image optimization

---

## Final Verification

### Complete Application Flow
1. **New User Journey**
   - Sign up → Create first design → Save to favorites → View in collections

2. **Returning User Journey**
   - Sign in → View past renders → Create new → Organize in collections

3. **Community Discovery**
   - Browse community → Find inspiration → Apply settings → Create own version

4. **Plan Upgrade**
   - Hit limit → See upgrade message → Complete checkout → Continue creating

### Success Metrics
- [ ] All 4 generation modes working
- [ ] Results display within 30 seconds
- [ ] Mobile experience smooth
- [ ] No console errors
- [ ] All tests passing
- [ ] Lighthouse scores meet targets

---

## Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Post-Deployment
1. Test all critical paths
2. Monitor error logs
3. Check performance metrics
4. Verify webhook endpoints
5. Test payment flow

---

## Congratulations! 🎉

The Interior Design AI Generator is now complete and ready for production!

### Summary of Achievements
- ✅ Complete data layer with RLS
- ✅ Replicate integration with 4 modes
- ✅ Storage and asset management
- ✅ Collections and organization
- ✅ Community features
- ✅ Responsive UI with Theme v2
- ✅ Testing and quality assurance
- ✅ Production ready

### Next Steps
1. Deploy to production
2. Monitor user feedback
3. Iterate based on usage
4. Consider additional features:
   - More AI models
   - Advanced editing tools
   - Collaboration features
   - Mobile app