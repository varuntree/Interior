# Refactor Playbooks

## A) Tokenization Pass (UI)
1. Find hardcoded colors/radii/shadows/fonts in `components/**/*` (see 02-audits).
2. Replace with Tailwind utilities mapped to tokens:
   - Colors → `bg-primary`, `text-foreground`, `border-border`, etc.
   - Radius → `rounded-lg|md|sm` per tokenized mapping
   - Shadows → token-based `shadow-*` (flat per design system)
3. Verify light/dark parity and mobile layout.

## B) Route → Service → Repo Alignment
1. Move business logic out of routes into services.
2. Move DB queries into repositories; ensure services compose repos.
3. Ensure routes only orchestrate: validate → call service → respond.

## C) API Response Normalization
1. Replace ad hoc JSON with `ok/fail`.
2. Map errors to canonical codes.
3. Add `withMethods` and zod schemas where missing.

## D) Config Consolidation
1. Replace duplicated presets/limits with `runtimeConfig` imports.
2. Inputs (accept types/sizes) read from `runtimeConfig.limits`.
3. Mode/Style/Room lists read from `runtimeConfig.presets`.

## E) Storage Helper Adoption
1. Use storage helpers for uploads and signed URLs.
2. Ensure paths follow `private/<uid>/inputs/*` and `public/renders/<renderId>/*`.
3. No admin client outside webhooks.

## F) Observability & Errors
1. Log `{ jobId, predictionId, status }` transitions.
2. Normalize upstream errors; avoid leaking PII.
3. Cap error lengths and include minimal details.

## G) Performance & Simplicity
1. Eliminate unnecessary re-renders; memoize heavy UI lists where needed.
2. Avoid complex abstractions; prefer simple, typed utilities.
3. Defer heavy work to servers/services; keep components dumb.
