# Codebase Cleaning — Overview

## Purpose
Establish a single, authoritative workspace for codebase cleanup and organization. This folder defines guiding principles, audits, playbooks, and standards to enforce consistency, modularity, and zero tech‑debt across UI, APIs, services, repositories, and configuration.

## Scope
- UI token consistency and design system alignment
- Architectural boundaries (Route → Service → Repository → DB)
- API contracts, error normalization, and method enforcement
- Runtime configuration single source of truth
- Storage paths and RLS‑friendly conventions
- Tooling (typecheck, lint, build, grep checks) & commit hygiene
- Observability and minimal validation tests

## Outcomes
- Predictable, maintainable code with minimal surprises
- Strong compile‑time and lint guardrails
- Clean and well‑documented contracts
- Reduced operational risk and faster iteration

## How To Use
- Read 01‑guiding‑principles first
- Run audits in 02‑audits and file issues/PRs referencing specific sections here
- Apply changes using 04‑refactor‑playbooks
- Verify with 10‑validation‑and‑smoke‑tests
- Record notable changes in CHANGELOG.md

## References
- ai_docs/spec/* (product, system, data, design)
- libs/app-config/runtime.ts (runtime product config)
- libs/api-utils/* (helpers)
