# Standards & Conventions

## Directory Structure
- API: `app/api/v1/<domain>/<action>/route.ts`
- Services: `libs/services/<domain>.ts` or `libs/services/<domain>/<topic>.ts`
- Repositories: `libs/repositories/<entity>.ts`
- Storage: `libs/services/storage/*.ts`
- Runtime config: `libs/app-config/runtime.ts`
- UI: `components/*` (app-specific) and `components/ui/*` (shadcn)

## Naming
- Kebab-case for API route folders; camelCase for files in libs.
- DTOs and types use PascalCase.

## Imports
- Routes import services; services import repositories and SDKs; repositories import Supabase types only.
- No cross-imports that break boundaries.

## Coding Style
- Pure functions; avoid classes and singletons.
- Typed inputs/outputs; no `any`.
- Early returns for readability; small functions.

## Testing (minimal)
- Unit tests for prompt builder and replicate adapter.
- Manual smoke for API submit + poll + renders.

## Documentation
- Update `ai_docs/codebase_cleaning` when adding or changing patterns.
