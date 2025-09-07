# Generation Provider Integration Guide

This guide explains how to add or swap a generation provider while keeping the app’s API, services, and repositories unchanged.

## Principles

- Provider-agnostic service: business rules live in `libs/services/generation.ts`.
- Provider-specific logic lives behind the `GenerationProvider` interface.
- All external model inputs/outputs are mapped inside the provider.

## Key Interfaces

File: `libs/services/generation/types.ts`

- `GenerationRequest`: internal, provider-agnostic.
- `ProviderSubmitArgs` / `ProviderSubmitResult` / `ProviderStatusResult`.

File: `libs/services/providers/generationProvider.ts`

```ts
export interface GenerationProvider {
  submit(args: ProviderSubmitArgs): Promise<ProviderSubmitResult>
  getStatus(predictionId: string): Promise<ProviderStatusResult>
  cancel?(predictionId: string): Promise<void>
}

export function getGenerationProvider(): GenerationProvider
```

## Steps to Add a New Provider

1) Implement Provider

- Create `libs/services/providers/<yourProvider>.ts` and implement `GenerationProvider`.
- Map `GenerationRequest` to provider inputs.
- Handle upstream idempotency (e.g., `Idempotency-Key`).
- Normalize status/output/error in `getStatus`.

2) Switch Factory

- Update `getGenerationProvider()` to return your provider, optionally using runtime config to select by environment.

3) Webhooks

- If the provider supports webhooks, wire its route to call the existing webhook service `handleReplicateWebhook` or create an equivalent handler that updates `generation_jobs` and persists assets.
- Verify signatures where supported.

4) Tests

- Add unit tests for your adapter mapping if needed (mirroring `tests/replicate-adapter.test.ts`).

## Idempotency and Concurrency

- Always pass a unique idempotency key to upstream on submit.
- The app enforces one in-flight job per user at the DB level; handle DB constraint errors by returning a 409-equivalent error.

## Storage

- Persist outputs to Supabase public bucket via `libs/services/storage/assets.ts`.
- The pipeline is idempotent: reprocessing the same prediction should be a no-op.

