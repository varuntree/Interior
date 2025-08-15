import { NextRequest } from 'next/server';
import { ok } from '@/libs/api-utils/responses';

export async function GET(req: NextRequest) {
  return ok({
    ok: true,
    time: new Date().toISOString(),
    versions: {
      next: process.env.npm_package_version || 'unknown'
    }
  });
}