"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/libs/utils";
import { Check, Loader2, Upload, ScanLine, Settings2, Sparkles } from "lucide-react";

type Status = 'idle' | 'uploading' | 'creating' | 'processing' | 'succeeded' | 'failed';

interface Props {
  status: Status;
  mode: string;
}

interface StepDef {
  id: string;
  label: string;
  icon: any;
}

// Display-only steps to convey progress smoothly
const BASE_STEPS: StepDef[] = [
  { id: 'uploading',  label: 'Uploading your image',       icon: Upload },
  { id: 'understand', label: 'Understanding the space',    icon: ScanLine },
  { id: 'planning',   label: 'Preparing the design plan',  icon: Settings2 },
  { id: 'rendering',  label: 'Rendering ideas',            icon: Sparkles },
  { id: 'finalize',   label: 'Final touches',              icon: Settings2 },
];

export function GenerationOverlay({ status, mode }: Props) {
  // Smooth step sequencing while `processing` to create a multi-stop feel
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const steps = useMemo(() => BASE_STEPS, []);

  // Map server status to a floor index; we then animate within the phase
  const floorIndex = useMemo(() => {
    switch (status) {
      case 'uploading':
        return 0; // uploading
      case 'creating':
        return 1; // understanding/planning
      case 'processing':
        return 2; // planning/rendering/finalize (we'll animate forward)
      case 'succeeded':
      case 'failed':
        return steps.length - 1;
      default:
        return 0;
    }
  }, [status, steps.length]);

  useEffect(() => {
    // Cancel any previous timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Start from floor index when status changes
    setActiveIndex(floorIndex);

    // While processing, advance through remaining steps smoothly
    if (status === 'processing') {
      timerRef.current = setInterval(() => {
        setActiveIndex((i) => Math.min(i + 1, steps.length - 1));
      }, 1600);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, floorIndex, steps.length]);

  // Headline text varies a little by mode
  const headline = mode === 'imagine'
    ? 'AI is shaping your concept'
    : 'AI is understanding your image';
  const sub = 'coming up with the best designs.';

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/50 shadow-sm px-4 py-5 animate-in fade-in duration-300">
        <div className="text-center mb-4">
          <div className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {headline}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{sub}</div>
        </div>

        <ul className="space-y-2" aria-live="polite">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isDone = idx < activeIndex;
            const isActive = idx === activeIndex;
            return (
              <li key={s.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                    isActive && 'bg-primary/5 border border-primary/20',
                    isDone && 'bg-primary/5 border border-primary/20',
                    !isDone && !isActive && 'bg-muted/30'
                  )}
              >
                <div className={cn(
                  'flex items-center justify-center h-7 w-7 rounded-full border-2',
                  isActive && 'border-primary bg-primary text-primary-foreground',
                  isDone && 'border-primary bg-primary text-primary-foreground',
                  !isDone && !isActive && 'border-muted-foreground bg-background'
                )}>
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className={cn(
                  'text-sm',
                  isActive || isDone ? 'text-foreground' : 'text-muted-foreground'
                )}>{s.label}</div>
              </li>
            );
          })}
        </ul>

        <div className="text-center text-[11px] text-muted-foreground mt-3">
          Smoothly preparing your render…
        </div>
      </div>
    </div>
  );
}

