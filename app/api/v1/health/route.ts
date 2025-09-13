import { ok } from '@/libs/api-utils/responses';
import { withMethods } from '@/libs/api-utils/methods'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], withRequestContext(async (_req, ctx) => {
  const payload = {
    ok: true,
    time: new Date().toISOString(),
    versions: {
      next: process.env.npm_package_version || 'unknown'
    }
  }
  ctx?.logger.info('health.ok')
  return ok(payload);
}))
