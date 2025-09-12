## Summary

Describe the change briefly.

## Checklist (Phase 0 guardrails)

- [ ] Guardrail files untouched (no deletions/renames of app/layout.tsx, app/page.tsx, app/api legacy bridges, middleware.ts, config.ts, libs/**/* core utils)
- [ ] Typecheck and build pass locally (`npm run typecheck && npm run build`)
- [ ] Guard scripts pass (`npm run verify:phase0`)
- [ ] Routes call services only (no repository imports in app/api/**)
- [ ] No Server Actions (`use server`) added to app/ or libs/
- [ ] No DB/Supabase server client imported in components/
- [ ] No service-role/admin client usage outside webhooks/admin routes
- [ ] API responses normalized via `ok/fail` (or `accepted/created`) and sensible cache headers

## Notes

Add any relevant context, follow-ups, or docs updates.

