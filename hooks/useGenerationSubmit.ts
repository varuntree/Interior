"use client";

import { useState } from "react";
import { useGeneration } from "@/contexts/GenerationContext";
import { toast } from "sonner";

interface UseGenerationSubmitOptions {
  onSuccess?: (jobId: string) => void;
  onError?: (error: string) => void;
}

export function useGenerationSubmit({ onSuccess, onError }: UseGenerationSubmitOptions = {}) {
  const { state, startGeneration, setError, updateStatus } = useGeneration();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateSubmission = (): string[] => {
    const errors: string[] = [];

    // Mode-specific file validation
    if (state.mode === 'redesign' || state.mode === 'staging') {
      if (!state.input1File) {
        errors.push('Room image is required');
      }
    }

    if (state.mode === 'compose') {
      if (!state.input1File) {
        errors.push('Base room image is required');
      }
      if (!state.input2File) {
        errors.push('Reference image is required');
      }
    }

    // Prompt validation for imagine mode
    if (state.mode === 'imagine' && !state.prompt.trim()) {
      errors.push('Description is required for Imagine mode');
    }

    return errors;
  };

  const submitGeneration = async () => {
    // Validate before submission
    const validationErrors = validateSubmission();
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(', ');
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add basic generation parameters (simplified for google/nano-banana)
      formData.append('mode', state.mode);
      
      // Add optional parameters
      if (state.roomType) {
        formData.append('roomType', state.roomType);
      }
      if (state.style) {
        formData.append('style', state.style);
      }
      if (state.prompt.trim()) {
        formData.append('prompt', state.prompt.trim());
      }

      // Add files if present
      if (state.input1File) {
        formData.append('input1', state.input1File);
      }
      if (state.input2File) {
        formData.append('input2', state.input2File);
      }

      // Add idempotency key
      const idempotencyKey = crypto.randomUUID();
      formData.append('idempotencyKey', idempotencyKey);

      // Start generation tracking
      startGeneration('temp-' + idempotencyKey);
      updateStatus('uploading');

      // Submit to API
      const response = await fetch('/api/v1/generations', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error codes
        if (errorData.error?.code === 'TOO_MANY_INFLIGHT') {
          throw new Error('Please wait until your current generation is complete');
        } else if (errorData.error?.code === 'LIMIT_EXCEEDED') {
          throw new Error('You have reached your monthly generation limit. Please upgrade your plan.');
        } else if (errorData.error?.code === 'VALIDATION_ERROR') {
          throw new Error(errorData.error.message || 'Invalid submission data');
        } else {
          throw new Error(errorData.error?.message || 'Failed to start generation');
        }
      }

      const result = await response.json();
      
      if (!result.success || !result.data?.id) {
        throw new Error('Invalid response from generation API');
      }

      // Update with real job ID
      startGeneration(result.data.id);
      updateStatus('creating');
      
      toast.success('Generation started successfully!');
      onSuccess?.(result.data.id);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start generation';
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitGeneration,
    isSubmitting,
    canSubmit: !isSubmitting && !state.isGenerating && validateSubmission().length === 0,
    validationErrors: validateSubmission(),
  };
}
