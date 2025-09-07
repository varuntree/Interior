# Validation & Smoke Tests

## Quality Gates (must pass)
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run verify:grep` (forbidden patterns)

## Minimal Unit Tests
- Prompt builder: AU context and guardrails per mode; Imagine requires userPrompt
- Replicate adapter: aspect ratio → width/height; variants → num_outputs; quality → size tier

## Manual Smoke (dev)
1) Imagine flow submit (multipart or JSON), expect 202 `{ success: true, data: { id, predictionId, status } }`
2) Poll GET `/api/v1/generations/:id` until `succeeded | failed`
3) Verify render assets present and visible in UI; save to My Favorites

## Responsive & Theme Checks
- No horizontal scroll; sticky CTAs on mobile; touch targets ≥44px
- Light/Dark parity; tokens resolve (primary, radius, fonts, shadows)
