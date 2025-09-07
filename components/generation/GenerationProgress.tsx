"use client";

import { useEffect, useState } from "react";
import { cn } from "@/libs/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Cog, 
  Wand2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2
} from "lucide-react";
import { useGeneration } from "@/contexts/GenerationContext";

interface GenerationStep {
  id: string;
  label: string;
  description: string;
  icon: any;
  duration?: number; // estimated duration in seconds
}

const GENERATION_STEPS: GenerationStep[] = [
  {
    id: 'uploading',
    label: 'Uploading',
    description: 'Uploading your images...',
    icon: Upload,
    duration: 5
  },
  {
    id: 'creating',
    label: 'Creating',
    description: 'Setting up generation...',
    icon: Cog,
    duration: 10
  },
  {
    id: 'processing',
    label: 'Rendering',
    description: 'AI is working on your design...',
    icon: Wand2,
    duration: 60
  }
];

interface GenerationProgressProps {
  className?: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function GenerationProgress({ 
  className, 
  onCancel, 
  showCancel = false 
}: GenerationProgressProps) {
  const { state, resetGeneration } = useGeneration();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  // Calculate estimated total time and progress
  useEffect(() => {
    const total = GENERATION_STEPS.reduce((sum, step) => sum + (step.duration || 0), 0);
    setEstimatedTotal(total);
  }, [state.generationStatus]);

  // Track elapsed time
  useEffect(() => {
    if (!state.isGenerating) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isGenerating]);

  // Reset elapsed time when generation starts
  useEffect(() => {
    if (state.generationStatus === 'uploading') {
      setElapsedTime(0);
    }
  }, [state.generationStatus]);

  if (!state.isGenerating && state.generationStatus === 'idle') {
    return null;
  }

  const currentStepIndex = GENERATION_STEPS.findIndex(
    step => step.id === state.generationStatus
  );

  const progress = currentStepIndex >= 0 
    ? ((currentStepIndex + 1) / GENERATION_STEPS.length) * 100
    : 0;

  const isCompleted = state.generationStatus === 'succeeded';
  const isFailed = state.generationStatus === 'failed';

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isCompleted ? (
              <>
                <CheckCircle className="h-5 w-5 text-primary" />
                Generation Complete!
              </>
            ) : isFailed ? (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Generation Failed
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Generating Design...
              </>
            )}
          </CardTitle>
          
          {(isCompleted || isFailed) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetGeneration()}
            >
              Start New
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {!isFailed && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {GENERATION_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCurrentStep = step.id === state.generationStatus;
            const isCompletedStep = currentStepIndex > index;
            const isPendingStep = currentStepIndex < index;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg transition-colors",
                  isCurrentStep && "bg-primary/5 border border-primary/20",
                  isCompletedStep && "bg-primary/5 border border-primary/20",
                  isPendingStep && "bg-muted/30"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2",
                  isCurrentStep && "border-primary bg-primary text-primary-foreground",
                  isCompletedStep && "border-primary bg-primary text-primary-foreground",
                  isPendingStep && "border-muted-foreground bg-background"
                )}>
                  {isCompletedStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isCurrentStep ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1">
                  <div className={cn(
                    "font-medium",
                    isCurrentStep && "text-primary",
                    isCompletedStep && "text-primary",
                    isPendingStep && "text-muted-foreground"
                  )}>
                    {step.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isCurrentStep ? step.description : step.label}
                  </div>
                </div>

                {isCurrentStep && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(elapsedTime)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <XCircle className="h-4 w-4" />
              Generation Error
            </div>
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        )}

        {/* Cancel Button */}
        {showCancel && state.isGenerating && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetGeneration();
                onCancel?.();
              }}
            >
              Cancel Generation
            </Button>
          </div>
        )}

        {/* Estimated Time */}
        {state.isGenerating && (
          <div className="text-center text-sm text-muted-foreground">
            This usually takes {formatTime(estimatedTotal)} to complete
          </div>
        )}
      </CardContent>
    </Card>
  );
}
