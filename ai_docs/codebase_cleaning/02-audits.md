# Audits & Checklists

Run these audits before refactors. Open issues/PRs referencing findings.

## 1) UI Tokens Audit
- Find inline tokens: colors, radii, shadows, fonts, spacing hardcoded in `components/**/*`.
- Replace with Tailwind utilities backed by tokens from `app/globals.css`.

Commands
```
rg -n "bg-\[(#|rgb|hsl)" components
rg -n "text-\[(#|rgb|hsl)" components
rg -n "rounded-\[(.+)\]" components
rg -n "shadow-\[(.+)\]" components
rg -n "className=\\\".*(#[0-9a-fA-F]{3,6}).*\\\"" components
```

Expected
- No hardcoded color/radius/shadow usage; only token-based classes.

## 2) Architectural Boundaries
- Routes call services only (not repositories).
- Services compose repos/SDKs (no request parsing, minimal validation assumptions).
- Repositories perform DB I/O only (pure, typed).

Commands
```
rg -n "from '@/libs/repositories/" app/api/v1 | wc -l   # should be 0
rg -n "createServerClient" components || true         # should be 0
```

## 3) API Contract Consistency
- All responses via `ok`/`fail` helpers.
- Method enforcement via `withMethods`.
- Zod validation present for inputs.

Commands
```
rg -n "ok\(|fail\(" app/api/v1
rg -n "withMethods\(" app/api/v1
rg -n "from 'zod'" app/api/v1
```

Expected
- Every route includes `withMethods`, zod schema, and uses `ok`/`fail`.

## 4) Storage Paths & RLS
- Inputs → `private/<uid>/inputs/*`
- Outputs → `public/renders/<renderId>/<idx>.webp`
- Thumbs → `public/renders/<renderId>/<idx>_thumb.webp` (optional)
- Access via storage helpers; no raw admin calls outside webhooks.

Checklist
- [ ] Upload helpers used in services
- [ ] No service-role usage outside webhooks

## 5) Config & Env
- Presets/defaults/limits read from `libs/app-config/runtime.ts`.
- No duplicated constants in UI/hooks/services.
- No secrets imported on the client.

Commands
```
rg -n "presets|roomTypes|styles|variants|aspectRatio" components hooks libs/services | rg -v "libs/app-config/runtime"
rg -n "process\.env\.(STRIPE|SUPABASE|REPLICATE|SERVICE_ROLE)" components
```

## 6) Forbidden Patterns (must be zero)
```
grep -R "use server" app libs || true
grep -R "createServerClient" components || true
grep -R "service_role" app components || true
```

## 7) Dead Code & Drift
- Unused exports and files
- Admin guide vs. specs naming drift

Commands
```
rg -n "export .* function" | rg -v "node_modules|.next" | xargs -I{} sh -c 'true'  # inspect selectively
rg -n "TODO|FIXME|HACK" -S
```

Deliverable
- Summarized report of findings with file/line references and proposed fixes.

Exceptions (documented)
- Intentional shimmer utility: `bg-[length:200%_100%]` in `components/dashboard/LoadingStates.tsx` retained for loading effect.
- Image overlays use semi-transparent black (e.g., `bg-black/20|60`) to ensure consistent contrast over photos across themes; acceptable until a dedicated overlay token is introduced.
