// app/api/v1/generations/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMethods } from '@/libs/api-utils/methods';
import { fail } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { submitGeneration } from '@/libs/services/generation';
import { createClient } from '@/libs/supabase/server';

export const dynamic = 'force-dynamic';

// Validation schemas
const GenerationBodySchema = z.object({
  mode: z.enum(['redesign', 'staging', 'compose', 'imagine']),
  prompt: z.string().optional(),
  roomType: z.string().optional(),
  style: z.string().optional(),
  aspectRatio: z.enum(['1:1', '3:2', '2:3']).optional(),
  quality: z.enum(['auto', 'low', 'medium', 'high']).optional(),
  variants: z.number().min(1).max(3).optional(),
  idempotencyKey: z.string().uuid().optional(),
  // For JSON requests with signed URLs
  input1Url: z.string().url().optional(),
  input2Url: z.string().url().optional()
});

const FormDataSchema = z.object({
  mode: z.string(),
  prompt: z.string().optional(),
  roomType: z.string().optional(),
  style: z.string().optional(),
  aspectRatio: z.string().optional(),
  quality: z.string().optional(),
  variants: z.number().optional(),
  idempotencyKey: z.string().optional()
}).transform((data) => ({
  ...data,
  mode: data.mode as 'redesign' | 'staging' | 'compose' | 'imagine',
  aspectRatio: data.aspectRatio as '1:1' | '3:2' | '2:3' | undefined,
  quality: data.quality as 'auto' | 'low' | 'medium' | 'high' | undefined,
}));

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const contentType = req.headers.get('content-type') || '';
    let parsedData: z.infer<typeof GenerationBodySchema>;
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
        aspectRatio: formData.get('aspectRatio') as string || undefined,
        quality: formData.get('quality') as string || undefined,
        variants: formData.get('variants') ? parseInt(formData.get('variants') as string) : undefined,
        idempotencyKey: formData.get('idempotencyKey') as string || undefined
      };

      // Validate form data  
      try {
        parsedData = FormDataSchema.parse(data);
      } catch (error: any) {
        return fail(400, 'VALIDATION_ERROR', 'Invalid form data', error.flatten?.());
      }

      // Extract files
      const input1File = formData.get('input1') as File | null;
      const input2File = formData.get('input2') as File | null;
      
      if (input1File) files.input1 = input1File;
      if (input2File) files.input2 = input2File;
    } else {
      // Handle JSON request
      const body = await req.json();
      try {
        parsedData = GenerationBodySchema.parse(body);
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
      settings: {
        aspectRatio: parsedData.aspectRatio,
        quality: parsedData.quality,
        variants: parsedData.variants
      },
      input1: files.input1,
      input2: files.input2,
      idempotencyKey: parsedData.idempotencyKey
    };

    // Get base URL for webhook
    const origin = req.headers.get('origin') || req.headers.get('host') || 'http://localhost:3000';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

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

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      status: 202, // Accepted - processing will happen asynchronously
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store'
      }
    });

  } catch (error: any) {
    console.error('Generation submission error:', error);

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

    // Generic server error
    return fail(500, 'INTERNAL_ERROR', 'An unexpected error occurred during generation submission.');
  }
});

// GET method to list generations (optional for this route)
export const GET = withMethods(['GET'], async (req: NextRequest) => {
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // This could list recent generations for the user
    // For now, redirect to dedicated renders endpoint
    return fail(404, 'NOT_FOUND', 'Use /api/v1/renders to list generations');

  } catch (error: any) {
    return fail(500, 'INTERNAL_ERROR', 'Failed to process request');
  }
});