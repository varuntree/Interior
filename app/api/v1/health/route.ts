import { ok } from '@/libs/api-utils/responses';
import { withMethods } from '@/libs/api-utils/methods'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], async () => {
  return ok({
    ok: true,
    time: new Date().toISOString(),
    versions: {
      next: process.env.npm_package_version || 'unknown'
    }
  });
})
