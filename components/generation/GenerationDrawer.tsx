"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GenerationStepper } from "./GenerationStepper";
import { appendDownloadParam, sanitizeFilename, triggerDownload } from "@/libs/url/download";
import { cn } from "@/libs/utils";
import { X } from "lucide-react";

interface DrawerResult {
  url: string;
  thumbUrl?: string;
  renderId?: string;
  index?: number;
}

interface GenerationDrawerProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  baseImage?: string | null;
  referenceImage?: string | null;
  showReference?: boolean;
  mode: string;
  roomType: string;
  style: string;
  prompt: string;
  status: 'idle' | 'uploading' | 'creating' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  isGenerating: boolean;
  results?: DrawerResult[] | null;
  error?: string | null;
}

function formatLabel(value?: string) {
  if (!value) return undefined;
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function GenerationDrawer({
  open,
  onOpenChange,
  baseImage,
  referenceImage,
  showReference = false,
  mode,
  roomType,
  style,
  prompt,
  status,
  isGenerating,
  results,
  error,
}: GenerationDrawerProps) {
  const resultList = results ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);

  const primaryResult = resultList[selectedIndex] ?? resultList[0];

  const fallbackBackdrop = useMemo(() => {
    if (baseImage) return baseImage;
    if (results && results.length > 0) return results[0].url;
    if (referenceImage) return referenceImage;
    return null;
  }, [baseImage, referenceImage, results]);

  const readableMode = formatLabel(mode) ?? "Redesign";
  const readableRoom = roomType ? formatLabel(roomType) : undefined;
  const readableStyle = style ? formatLabel(style) : undefined;

  const isFailure = status === 'failed';
  const showResults = !isGenerating && !isFailure && resultList.length > 0;

  const handleDownload = (target: DrawerResult) => {
    if (!target?.url) return;
    const baseName = target.renderId
      ? `interior-design-${target.renderId}-${target.index ?? 0}`
      : `interior-design-${Date.now()}`;
    const filename = sanitizeFilename(baseName);
    const href = appendDownloadParam(target.url, filename);
    triggerDownload(href);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className="relative h-[86vh] w-full rounded-t-3xl border-none bg-background/85 px-0 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/70"
      >
        {fallbackBackdrop && (
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <img
              src={fallbackBackdrop}
              alt="Generation backdrop"
              className="h-full w-full scale-110 object-cover blur-2xl opacity-60"
            />
            <div className="absolute inset-0 bg-background/70" />
          </div>
        )}

        <div className="absolute left-1/2 top-2 h-1 w-12 -translate-x-1/2 rounded-full bg-foreground/20" />
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 h-9 w-9 rounded-full bg-background/80 backdrop-blur"
          aria-label="Close generation drawer"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="relative flex h-full flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <section className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur">
              <div className={cn('grid gap-3', showReference && referenceImage ? 'grid-cols-2' : 'grid-cols-1')}>
                <DrawerImagePreview
                  label={showReference && referenceImage ? 'Base room' : 'Input'}
                  src={baseImage}
                  fallbackLabel={mode === 'imagine' ? 'Text-only mode' : 'Awaiting upload'}
                />
                {showReference && (
                  <DrawerImagePreview
                    label="Reference"
                    src={referenceImage}
                    fallbackLabel="Reference pending"
                  />
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {readableMode}
                </Badge>
                {readableRoom && <Badge variant="outline">{readableRoom}</Badge>}
                {readableStyle && <Badge variant="outline">{readableStyle}</Badge>}
              </div>
              {prompt && (
                <p className="mt-3 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
                  “{prompt}”
                </p>
              )}
            </section>

            <section className="mt-5">
              {isGenerating && (
                <div className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-sm backdrop-blur">
                  <GenerationStepper status={status} isFailure={isFailure} />
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    We’ll keep this view updated as your design progresses.
                  </p>
                </div>
              )}

              {!isGenerating && isFailure && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
                    <GenerationStepper status={status} isFailure />
                  </div>
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error || 'Generation failed. Please adjust your inputs and try again.'}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {showResults && primaryResult && (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 shadow-sm backdrop-blur">
                    <div className="relative aspect-[4/5] w-full">
                      <img
                        src={primaryResult.url}
                        alt="Generated design"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {resultList.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto px-3 py-3">
                        {resultList.map((variant, idx) => (
                          <button
                            key={`${variant.renderId ?? 'result'}-${idx}`}
                            type="button"
                            onClick={() => setSelectedIndex(idx)}
                            className={cn(
                              'relative h-16 w-16 overflow-hidden rounded-lg border transition-all',
                              idx === selectedIndex
                                ? 'border-primary ring-2 ring-primary/40'
                                : 'border-border'
                            )}
                            aria-label={`View variant ${idx + 1}`}
                          >
                            <img
                              src={variant.thumbUrl ?? variant.url}
                              alt="Variant thumbnail"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(primaryResult)}>
                        Download
                      </Button>
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Close this drawer to continue refining your inputs or start a new design.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface DrawerImagePreviewProps {
  label: string;
  src?: string | null;
  fallbackLabel?: string;
}

function DrawerImagePreview({ label, src, fallbackLabel }: DrawerImagePreviewProps) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border/60 bg-muted/40">
      {src ? (
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
          {fallbackLabel || 'No image selected'}
        </span>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
