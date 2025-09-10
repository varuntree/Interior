"use client";

import { useEffect, useRef } from "react";
import { useGeneration, GenerationResult } from "@/contexts/GenerationContext";

interface UseGenerationStatusOptions {
  pollInterval?: number; // in milliseconds
  maxPollDuration?: number; // in milliseconds
  onComplete?: (results: GenerationResult[]) => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
}

export function useGenerationStatus({
  pollInterval = 2000, // 2 seconds
  maxPollDuration = 10 * 60 * 1000, // 10 minutes
  onComplete,
  onError,
  onTimeout
}: UseGenerationStatusOptions = {}) {
  const { 
    state, 
    updateStatus, 
    setResults, 
    setError, 
    resetGeneration 
  } = useGeneration();
  
  const pollStartTime = useRef<number | null>(null);
  const pollInterval_ref = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const stopPolling = () => {
    if (pollInterval_ref.current) {
      clearInterval(pollInterval_ref.current);
      pollInterval_ref.current = null;
    }
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    pollStartTime.current = null;
  };

  const pollGenerationStatus = async (jobId: string) => {
    try {
      // Create new abort controller for this request
      abortController.current = new AbortController();
      
      const response = await fetch(`/api/v1/generations/${jobId}`, {
        signal: abortController.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Generation job not found');
        } else if (response.status === 403) {
          throw new Error('Access denied to generation job');
        } else {
          throw new Error(`Failed to fetch generation status: ${response.status}`);
        }
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get generation status');
      }

      const jobData = result.data;
      
      // Update status based on job status
      switch (jobData.status) {
        case 'starting':
        case 'processing':
          updateStatus('processing');
          break;
          
        case 'succeeded':
          if (jobData.variants && jobData.variants.length > 0) {
            const results: GenerationResult[] = jobData.variants.map((variant: any) => ({
              id: `${jobId}-${variant.index}`,
              url: variant.url,
              thumbUrl: variant.thumbUrl,
              index: variant.index,
              renderId: variant.renderId,
            }));
            
            setResults(results);
            stopPolling();
            onComplete?.(results);
          } else {
            throw new Error('Generation completed but no results were returned');
          }
          break;
          
        case 'failed':
        case 'canceled':
          const errorMessage = jobData.error || 'Generation failed';
          setError(errorMessage);
          stopPolling();
          onError?.(errorMessage);
          break;
          
        default:
          console.warn('Unknown generation status:', jobData.status);
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to check generation status';
      console.error('Polling error:', errorMessage);
      
      // Don't stop polling for network errors, but do stop for other errors
      if (errorMessage.includes('not found') || errorMessage.includes('Access denied')) {
        setError(errorMessage);
        stopPolling();
        onError?.(errorMessage);
      }
    }
  };

  const startPolling = (jobId: string) => {
    stopPolling(); // Stop any existing polling
    
    pollStartTime.current = Date.now();
    
    // Poll immediately, then at intervals
    pollGenerationStatus(jobId);
    
    pollInterval_ref.current = setInterval(() => {
      // Check if we've exceeded max poll duration
      if (pollStartTime.current && Date.now() - pollStartTime.current > maxPollDuration) {
        const timeoutMessage = 'Generation is taking longer than expected. Please check back later.';
        setError(timeoutMessage);
        stopPolling();
        onTimeout?.();
        return;
      }
      
      pollGenerationStatus(jobId);
    }, pollInterval);
  };

  // Start polling when a job ID is set and we're in a processing state
  useEffect(() => {
    if (
      state.currentJobId && 
      state.currentJobId !== 'idle' &&
      !state.currentJobId.startsWith('temp-') &&
      (state.generationStatus === 'creating' || state.generationStatus === 'processing')
    ) {
      startPolling(state.currentJobId);
    } else {
      stopPolling();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      stopPolling();
    };
  }, [state.currentJobId, state.generationStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    isPolling: pollInterval_ref.current !== null,
    stopPolling,
    startPolling,
  };
}
