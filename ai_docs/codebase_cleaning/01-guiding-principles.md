# Guiding Principles

## Non-Negotiables
- Consistent UI Tokens: Use only tokens from `app/globals.css` via Tailwind. No hardcoded colors, radii, fonts, or shadows in components.
- Modular Architecture: Route → Service → Repository → DB. No Server Actions. No direct DB calls from components.
- Single Source of Truth: Runtime product config in `libs/app-config/runtime.ts`. Do not re-encode presets/limits elsewhere.
- Clean Contracts: All APIs return `{ success, data?, error? }` using `libs/api-utils/responses`.
- Least Privilege: Service-role/admin only in webhooks; never in UI or general routes.
- Zero Tech Debt: If you touch code, align it to these rules or create a TODO with owner/date and a short-term resolution.

## Code Quality
- Pure Functions: Prefer stateless, typed functions over classes/singletons.
- Small Modules: Keep files focused; one responsibility per file.
- Type Safety: Avoid `any`. Use explicit types for inputs/outputs.
- Error Normalization: Map to canonical codes (VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, TOO_MANY_INFLIGHT, LIMIT_EXCEEDED, UPSTREAM_ERROR, INTERNAL_ERROR).
- Defensive Boundaries: Route validates and orchestrates; service applies business rules; repository does DB I/O.

## UI/UX Consistency
- Tokens-Only Styling: Tailwind utilities mapped to CSS variables; shadcn/ui components inherit tokens.
- Light/Dark Parity: All elements legible and accessible in both themes.
- Mobile-First: Controls sized for touch; no horizontal scroll; sticky primary CTAs on mobile.

## Configuration & Secrets
- Runtime Config: Presets/defaults/limits/plans/replicate in `libs/app-config/runtime.ts`.
- No Secrets in Client: Env secrets only on server; admin/service-role usage only under webhooks.

## Documentation & Enforcement
- Update Docs: Reflect changes here and in `ai_docs/spec/*` when relevant.
- Tooling: Typecheck, lint, build, and grep checks must pass before merging.

## Definition of Done (Cleanup)
- Aligns with these principles
- Adds/updates documentation here
- Passes validation in 10-validation-and-smoke-tests
