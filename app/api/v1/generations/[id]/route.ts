// app/api/v1/generations/[id]/route.ts
import { NextRequest } from 'next/server';
import { ok, fail } from '@/libs/api-utils/responses';
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { CACHE_CONFIGS } from '@/libs/api-utils/cache';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { createClient } from '@/libs/supabase/server';
import { getGeneration } from '@/libs/services/generation';
import * as rendersService from '@/libs/services/renders';
import { cancelGeneration } from '@/libs/services/generation';
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic';

interface Context {
  params: { id: string };
}

async function handleGET(req: NextRequest, ctx: Context & { logger?: any }) {
  try {
    const { id: jobId } = ctx.params;

    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // Validate job ID format
    if (!jobId || typeof jobId !== 'string') {
      return fail(400, 'VALIDATION_ERROR', 'Invalid job ID');
    }

    // Get generation status
    const serviceSupabase = createServiceSupabaseClient();
    const generation = await getGeneration(
      { supabase: serviceSupabase, userId: user.id },
      jobId
    );

    if (!generation) {
      return fail(404, 'NOT_FOUND', 'Generation not found');
    }

    // If generation is succeeded, fetch variant URLs
    let variants: Array<{ index: number; url: string; thumbUrl?: string; renderId: string }> = [];
    if (generation.status === 'succeeded') {
      try {
        variants = await rendersService.getVariantsForJob({ supabase: serviceSupabase }, jobId, user.id)
      } catch (error: any) {
        ctx?.logger?.warn?.('generation.variants_error', { jobId, message: error?.message })
      }
    }

    // Build response
    const response = {
      id: generation.id,
      status: generation.status,
      createdAt: generation.createdAt,
      completedAt: generation.completedAt,
      mode: generation.settings.roomType ? 
        `${generation.settings.roomType} - ${generation.settings.style}` : 
        'Generation',
      settings: generation.settings,
      variants: variants.length > 0 ? variants : undefined,
      error: generation.error
    };

    // Use short cache for in-progress generations, longer for completed ones
    const cacheConfig = generation.status === 'succeeded' 
      ? CACHE_CONFIGS.MEDIUM 
      : CACHE_CONFIGS.SHORT;
    
    ctx?.logger?.info?.('generation.status', { userId: user.id, jobId, status: generation.status })
    return ok(response, undefined, cacheConfig);

  } catch (error: any) {
    ctx?.logger?.error?.('generation.status_error', { message: error?.message })
    
    if (error.message === 'Generation not found' || error.code === 'PGRST116') {
      return fail(404, 'NOT_FOUND', 'Generation not found');
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch generation status');
  }
}

async function handleDELETE(req: NextRequest, ctx: Context & { logger?: any }) {
  try {
    const { id: jobId } = ctx.params;

    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // Validate job ID
    if (!jobId || typeof jobId !== 'string') {
      return fail(400, 'VALIDATION_ERROR', 'Invalid job ID');
    }

    const serviceSupabase = createServiceSupabaseClient();

    // Check if generation exists and belongs to user
    const generation = await getGeneration(
      { supabase: serviceSupabase, userId: user.id },
      jobId
    );

    if (!generation) {
      return fail(404, 'NOT_FOUND', 'Generation not found');
    }

    // Only allow deletion of completed generations
    if (generation.status === 'starting' || generation.status === 'processing') {
      return fail(400, 'VALIDATION_ERROR', 'Cannot delete in-progress generation');
    }

    await rendersService.deleteRendersByJob({ supabase: serviceSupabase }, jobId, user.id)
    ctx?.logger?.info?.('generation.delete', { userId: user.id, jobId })
    return ok({ message: 'Generation deleted successfully' });

  } catch (error: any) {
    ctx?.logger?.error?.('generation.delete_error', { message: error?.message })
    return fail(500, 'INTERNAL_ERROR', 'Failed to delete generation');
  }
}

// PATCH method for updating generation (e.g., canceling)
async function handlePATCH(req: NextRequest, ctx: Context & { logger?: any }) {
  try {
    const { id: jobId } = ctx.params;

    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const body = await req.json();
    
    // For MVP, only support cancellation
    if (body.action === 'cancel') {
      const serviceSupabase = createServiceSupabaseClient();
      
      // Check if generation exists and belongs to user
      const generation = await getGeneration(
        { supabase: serviceSupabase, userId: user.id },
        jobId
      );

      if (!generation) {
        return fail(404, 'NOT_FOUND', 'Generation not found');
      }

      // Only allow cancellation of in-progress generations
      if (generation.status !== 'starting' && generation.status !== 'processing') {
        return fail(400, 'VALIDATION_ERROR', 'Cannot cancel completed generation');
      }

      await cancelGeneration({ supabase: serviceSupabase, userId: user.id }, jobId)
      ctx?.logger?.info?.('generation.cancel', { userId: user.id, jobId })
      return ok({ message: 'Generation canceled successfully' });
    }

    return fail(400, 'VALIDATION_ERROR', 'Unsupported action');

  } catch (error: any) {
    ctx?.logger?.error?.('generation.update_error', { message: error?.message })
    return fail(500, 'INTERNAL_ERROR', 'Failed to update generation');
  }
}

export const GET = withMethodsCtx(['GET'], withRequestContext(handleGET) as any)
export const DELETE = withMethodsCtx(['DELETE'], withRequestContext(handleDELETE) as any)
export const PATCH = withMethodsCtx(['PATCH'], withRequestContext(handlePATCH) as any)
