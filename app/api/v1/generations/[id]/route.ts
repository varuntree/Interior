// app/api/v1/generations/[id]/route.ts
import { NextRequest } from 'next/server';
// Removed unused withMethods import
import { ok, fail } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { createClient } from '@/libs/supabase/server';
import { getGeneration } from '@/libs/services/generation';
import * as rendersRepo from '@/libs/repositories/renders';
import { getAssetUrls } from '@/libs/services/storage/assets';

export const dynamic = 'force-dynamic';

interface Context {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const { id: jobId } = params;

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
    let variants: Array<{ index: number; url: string; thumbUrl?: string }> = [];
    
    if (generation.status === 'succeeded') {
      try {
        // Find render by job_id first
        const { data: renders } = await serviceSupabase
          .from('renders')
          .select('id')
          .eq('job_id', jobId)
          .eq('owner_id', user.id)
          .limit(1);
        
        if (renders && renders.length > 0) {
          const renderData = await rendersRepo.getRenderWithVariants(serviceSupabase, renders[0].id, user.id);
        
          if (renderData) {
            // Build variant URLs
            for (const variant of renderData.variants) {
              const urls = await getAssetUrls(serviceSupabase, variant.image_path, variant.thumb_path);
              variants.push({
                index: variant.idx,
                url: urls.imageUrl,
                thumbUrl: urls.thumbUrl
              });
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch variants for job ${jobId}:`, error);
        // Continue with empty variants array
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

    return ok(response);

  } catch (error: any) {
    console.error('Generation status error:', error);
    
    if (error.message === 'Generation not found' || error.code === 'PGRST116') {
      return fail(404, 'NOT_FOUND', 'Generation not found');
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch generation status');
  }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    const { id: jobId } = params;

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

    // Delete the render and its variants (this will cascade)
    const { data: renders } = await serviceSupabase
      .from('renders')
      .select('id')
      .eq('job_id', jobId)
      .eq('owner_id', user.id);
    
    if (renders && renders.length > 0) {
      for (const render of renders) {
        await rendersRepo.deleteRender(serviceSupabase, render.id, user.id);
      }
    }

    return ok({ message: 'Generation deleted successfully' });

  } catch (error: any) {
    console.error('Generation deletion error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Failed to delete generation');
  }
}

// PATCH method for updating generation (e.g., canceling)
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { id: jobId } = params;

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

      // Cancel the prediction on Replicate (if we want to implement this)
      // For MVP, we'll just mark it as canceled in our DB
      
      // Update job status
      const { updateJobStatus } = await import('@/libs/repositories/generation_jobs');
      await updateJobStatus(serviceSupabase, jobId, {
        status: 'canceled',
        completed_at: new Date().toISOString()
      });

      return ok({ message: 'Generation canceled successfully' });
    }

    return fail(400, 'VALIDATION_ERROR', 'Unsupported action');

  } catch (error: any) {
    console.error('Generation update error:', error);
    return fail(500, 'INTERNAL_ERROR', 'Failed to update generation');
  }
}