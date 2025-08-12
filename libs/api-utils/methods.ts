// libs/api-utils/methods.ts
import { NextRequest } from 'next/server'
import { fail } from './responses'

export function withMethods(
  methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>,
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    if (!methods.includes(req.method as any)) {
      return fail(405, 'METHOD_NOT_ALLOWED', `Use ${methods.join(', ')}`)
    }
    return handler(req)
  }
}