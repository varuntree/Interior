import { ok } from '@/libs/api-utils/responses';

export async function GET() {
  return ok({
    ok: true,
    time: new Date().toISOString(),
    versions: {
      next: process.env.npm_package_version || 'unknown'
    }
  });
}
