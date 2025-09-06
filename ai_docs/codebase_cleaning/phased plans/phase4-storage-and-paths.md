# Phase 4 — Storage Paths & Asset Management (Plan → Complete)

Objective: Standardize storage usage: enforce bucket conventions, path formats, helper usage, and least-privilege boundaries.

Actions taken
- Inputs:
  - `libs/services/storage/uploads`: returns both `path` (bucket-relative for API calls) and `dbPath` (`private/<userId>/inputs/<filename>`).
  - `libs/services/generation`: stores `input1_path`/`input2_path` using `dbPath` to match validation rule (private/* prefix).
- Outputs:
  - Continue using `renders/<renderId>/<idx>.webp` under public bucket.
  - Public URLs consistently generated via `getPublicUrl` or centralized builders; no change needed.
- Least privilege:
  - Admin/service-role client used only in webhook path; all other routes use standard service client.
- Helpers only:
  - Routes do not perform storage ops directly; all storage access via services.

Validation
- Scripts pass: `typecheck`, `lint`, `build`, `verify:grep`.
- Path validator expectations:
  - Inputs now stored as `private/<userId>/inputs/...` in DB.
  - Outputs stored as `renders/<renderId>/...` and accessed via public URLs.

Exit criteria (met)
- Storage paths follow conventions for inputs/outputs.
- No service-role usage outside webhooks.
- All storage interactions go through services/helpers.
