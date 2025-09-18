"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/libs/utils";

type Status = "idle" | "uploading" | "creating" | "processing" | "succeeded" | "failed" | "canceled";

type Step = {
  id: string;
  label: string;
};

interface GenerationStepperProps {
  status: Status;
  className?: string;
  isFailure?: boolean;
}

const STEP_SEQUENCE: Step[] = [
  { id: "prepare", label: "Preparing workspace" },
  { id: "upload", label: "Uploading inputs" },
  { id: "analyze", label: "Calibrating style" },
  { id: "render", label: "Rendering design" },
  { id: "final", label: "Finishing touches" },
];

function statusToTargetIndex(status: Status, stepsLength: number) {
  switch (status) {
    case "uploading":
      return 1;
    case "creating":
      return Math.min(2, stepsLength - 1);
    case "processing":
      return Math.min(stepsLength - 2, stepsLength - 1);
    case "succeeded":
    case "failed":
    case "canceled":
      return stepsLength - 1;
    case "idle":
    default:
      return 0;
  }
}

export function GenerationStepper({ status, className, isFailure = false }: GenerationStepperProps) {
  const steps = useMemo(() => STEP_SEQUENCE, []);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(activeIndex);

  const targetIndex = statusToTargetIndex(status, steps.length);
  const finished = status === "succeeded";
  const errored = status === "failed" || isFailure;

  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (status === "idle") {
      setActiveIndex(0);
      return;
    }

    if (status === "uploading") {
      setActiveIndex(0);
    }

    const current = activeRef.current;

    if (targetIndex <= current) {
      if (finished || errored) {
        setActiveIndex(steps.length - 1);
      } else {
        setActiveIndex(targetIndex);
      }
      return;
    }

    let remaining = targetIndex - current;
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = Math.min(prev + 1, targetIndex);
        if (next >= targetIndex) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
        return next;
      });
      remaining -= 1;
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, targetIndex, steps.length, finished, errored]);

  return (
    <ul className={cn("space-y-2", className)}>
      {steps.map((step, index) => {
        const isActive = index === activeIndex && !(finished || errored);
        const isCompleted = index < activeIndex || finished || errored;
        const isFinal = index === steps.length - 1;

        const circleClasses = cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
          errored && isFinal
            ? "border-destructive/80 bg-destructive/10 text-destructive"
            : isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : isActive
            ? "border-primary/60 bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground"
        );

        const textClasses = cn(
          "text-sm transition-colors",
          errored && isFinal
            ? "text-destructive"
            : isCompleted
            ? "text-foreground"
            : isActive
            ? "text-primary"
            : "text-muted-foreground"
        );

        return (
          <li key={step.id} className="flex items-center gap-3">
            <div className={circleClasses}>
              {errored && isFinal ? (
                <X className="h-4 w-4" />
              ) : isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
              {isActive && !isCompleted && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div
                className={cn(
                  "relative text-sm font-medium",
                  isActive ? "text-transparent bg-gradient-to-r from-primary/60 via-primary to-primary/60 bg-[length:200%_100%] bg-clip-text animate-step-glow" : textClasses
                )}
              >
                {step.label}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
