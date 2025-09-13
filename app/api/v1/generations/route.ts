// app/api/v1/generations/route.ts
import { NextRequest } from 'next/server';
import { withMethods } from '@/libs/api-utils/methods';
import { accepted, fail } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { getApplicationUrl } from '@/libs/api-utils/url-validation';
import { submitGeneration } from '@/libs/services/generation';
import { createClient } from '@/libs/supabase/server';
import { generationRequestSchema, generationFormDataSchema, validateFile } from '@/libs/api-utils/schemas';
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic';

// Validation schemas are sourced from libs/api-utils/schemas to avoid duplication

export const POST = withMethods(['POST'], withRequestContext(async (req: NextRequest, ctx) => {
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const contentType = req.headers.get('content-type') || '';
    let parsedData: ReturnType<typeof generationRequestSchema.parse>;
    let files: { input1?: File; input2?: File } = {};

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data
      const formData = await req.formData();
      
      // Extract form fields
      const data = {
        mode: formData.get('mode') as string,
        prompt: formData.get('prompt') as string || undefined,
        roomType: formData.get('roomType') as string || undefined,
        style: formData.get('style') as string || undefined,
        idempotencyKey: formData.get('idempotencyKey') as string || undefined
      };

      // Validate form data  
      try {
        parsedData = generationFormDataSchema.parse(data) as any;
      } catch (error: any) {
        return fail(400, 'VALIDATION_ERROR', 'Invalid form data', error.flatten?.());
      }

      // Extract files
      const input1File = formData.get('input1') as File | null;
      const input2File = formData.get('input2') as File | null;
      
      // Server-side file validation (type/size) when provided
      try {
        if (input1File) {
          validateFile(input1File);
          files.input1 = input1File;
        }
        if (input2File) {
          validateFile(input2File);
          files.input2 = input2File;
        }
      } catch (err: any) {
        return fail(400, 'VALIDATION_ERROR', err?.message || 'Invalid file upload');
      }
    } else {
      // Handle JSON request
      const body = await req.json();
      try {
        parsedData = generationRequestSchema.parse(body);
      } catch (error: any) {
        return fail(400, 'VALIDATION_ERROR', 'Invalid JSON data', error.flatten?.());
      }

      // For JSON requests, we don't support direct file uploads
      // input1Url and input2Url would need to be converted to File objects
      // This is complex, so for MVP we'll focus on multipart support
      if (parsedData.input1Url || parsedData.input2Url) {
        return fail(400, 'VALIDATION_ERROR', 'JSON requests with file URLs not yet supported. Use multipart/form-data.');
      }
    }

    // Build submission object
    const submission = {
      mode: parsedData.mode,
      prompt: parsedData.prompt,
      roomType: parsedData.roomType,
      style: parsedData.style,
      input1: files.input1,
      input2: files.input2,
      idempotencyKey: parsedData.idempotencyKey
    };

    // Get base URL for webhook - prioritize environment variable
    const baseUrl = getApplicationUrl(req);

    // Submit generation
    const serviceSupabase = createServiceSupabaseClient();
    const result = await submitGeneration(
      { 
        supabase: serviceSupabase, 
        userId: user.id, 
        baseUrl 
      },
      submission
    );
    ctx?.logger?.info?.('generation.submit', { userId: user.id, mode: submission.mode })
    return accepted(result);

  } catch (error: any) {
    ctx?.logger?.error?.('generation.submit_error', { message: error?.message })

    // Handle known error types
    if (error.message === 'TOO_MANY_INFLIGHT') {
      return fail(409, 'TOO_MANY_INFLIGHT', 'Please wait until your current generation is complete.');
    }
    
    if (error.message === 'LIMIT_EXCEEDED') {
      return fail(402, 'LIMIT_EXCEEDED', 'You have reached your monthly generation limit. Please upgrade your plan.');
    }
    
    if (error.message.startsWith('VALIDATION_ERROR:')) {
      const message = error.message.replace('VALIDATION_ERROR: ', '');
      return fail(400, 'VALIDATION_ERROR', message);
    }

    // Handle URL configuration errors
    if (error.message.includes('NEXT_PUBLIC_APP_URL') || error.message.includes('HTTPS required')) {
      return fail(500, 'CONFIGURATION_ERROR', 
        'Application URL not configured properly. Please set NEXT_PUBLIC_APP_URL environment variable to your application\'s public HTTPS URL.');
    }

    // Generic server error
    return fail(500, 'INTERNAL_ERROR', 'An unexpected error occurred during generation submission.');
  }
}));

// GET method to list generations (optional for this route)
// eslint-disable-next-line no-unused-vars
export const GET = withMethods(['GET'], withRequestContext(async (req: NextRequest, ctx) => {
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // This could list recent generations for the user
    // For now, redirect to dedicated renders endpoint
    ctx?.logger?.info?.('generation.index_redirect', { userId: user.id })
    return fail(404, 'NOT_FOUND', 'Use /api/v1/renders to list generations');

  } catch (error: any) {
    ctx?.logger?.error?.('generation.index_error', { message: error?.message })
    return fail(500, 'INTERNAL_ERROR', 'Failed to process request');
  }
}));
