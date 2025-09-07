# Runtime Config & Presets

## Source of Truth
`libs/app-config/runtime.ts` defines presets, defaults, limits, plans, and Replicate settings.

## Consumption Rules
- UI builds dropdowns and defaults from `runtimeConfig.presets` and `runtimeConfig.defaults`.
- File inputs enforce `runtimeConfig.limits.acceptedMimeTypes` and `maxUploadsMB`.
- Services enforce `limits.maxVariantsPerRequest` and plan quotas via `runtimeConfig.plans`.
- Replicate adapter uses `runtimeConfig.replicate` (model, timeouts, webhook path).

## Do / Don’t
- Do import runtimeConfig; don’t duplicate constants.
- Do read plan quotas from runtimeConfig; don’t hardcode plan logic in services.
- Do update this doc and CHANGELOG when changing runtimeConfig shape.

## Checklist on Changes
- [ ] UI reads new tokens/presets without compile errors
- [ ] Services enforce new limits
- [ ] Adapter still maps AR/quality/variants correctly
- [ ] Docs updated (this file + specs if needed)
