# API Contracts & Errors

## Standard Response
```
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
  message?: string
}
```

## Canonical Error Codes
- VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN
- NOT_FOUND, TOO_MANY_INFLIGHT, LIMIT_EXCEEDED
- UPSTREAM_ERROR, INTERNAL_ERROR, METHOD_NOT_ALLOWED

## Route Requirements
- Method enforcement via `withMethods(["GET","POST",...])`
- Zod schemas for inputs
- Call services only
- Use `ok()` / `fail()` helpers with default `Cache-Control: private, no-store`

## Examples
```
export const POST = withMethods(['POST'], async (req: NextRequest) => {
  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
  const supabase = createServiceSupabaseClient()
  const data = await serviceFn({ supabase }, parsed.data)
  return ok(data)
})
```

## Idempotency
- Deduplicate generation submits using per-owner idempotency keys where applicable.
- Webhooks must be idempotent; safe to replay.
