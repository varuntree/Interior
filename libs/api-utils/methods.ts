// libs/api-utils/methods.ts
import { NextRequest } from 'next/server'
import { fail } from './responses'

export function withMethods(
  methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>,
  handler: any
) {
  return async (req: NextRequest, ctx?: any) => {
    if (!methods.includes(req.method as any)) {
      return fail(405, 'METHOD_NOT_ALLOWED', `Use ${methods.join(', ')}`)
    }
    return handler(req, ctx)
  }
}

// Variant that supports Next.js context parameter for dynamic routes
export function withMethodsCtx(
  methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>,
  handler: any
) {
  return async (req: NextRequest, ctx: any) => {
    if (!methods.includes(req.method as any)) {
      return fail(405, 'METHOD_NOT_ALLOWED', `Use ${methods.join(', ')}`)
    }
    return handler(req, ctx)
  }
}
