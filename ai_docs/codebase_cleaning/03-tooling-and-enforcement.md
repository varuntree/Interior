# Tooling & Enforcement

## Required Scripts (package.json)
- `typecheck`: `tsc --noEmit`
- `lint`: `eslint .`
- `build`: `next build`
- `verify:grep`: forbidden pattern scan

Example
```
"scripts": {
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "build": "next build",
  "verify:grep": "grep -R 'use server' app libs || true && grep -R 'createServerClient' components || true && grep -R 'service_role' app components || true"
}
```

## TypeScript
- Prefer strict typing in touched modules
- Avoid `any`; define DTOs for API inputs/outputs

## ESLint & Prettier
- Enforce consistent formatting
- Disallow unused vars, implicit any, and unresolved imports

## Pre-commit (optional)
- Run `lint` and `typecheck` on staged files via `lint-staged`

## CI Consideration (later)
- Minimal CI to run typecheck/lint/build/grep on PRs
