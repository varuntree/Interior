"use client";

import { GenerationStepper } from "./GenerationStepper";

type Status = 'idle' | 'uploading' | 'creating' | 'processing' | 'succeeded' | 'failed';

interface Props {
  status: Status;
  mode: string;
}

export function GenerationOverlay({ status, mode }: Props) {
  const isFailure = status === 'failed';

  const headline = isFailure
    ? 'Something went wrong'
    : mode === 'imagine'
      ? 'AI is shaping your concept'
      : 'AI is understanding your image';

  const subline = isFailure
    ? 'Please adjust your inputs and try again.'
    : 'Coming up with the best designs for your space.';

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-background/85 px-5 py-6 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mb-4 text-center">
          <div className="text-sm font-medium text-foreground">
            {headline}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {subline}
          </div>
        </div>
        <GenerationStepper status={status} isFailure={isFailure} />
      </div>
    </div>
  );
}
