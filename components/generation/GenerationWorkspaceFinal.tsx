"use client";
/* eslint-disable @next/next/no-img-element, no-unused-vars */

import { useState, useEffect, type ReactNode } from "react";
import { useGeneration } from "@/contexts/GenerationContext";
import { useGenerationSubmit } from "@/hooks/useGenerationSubmit";
import { useGenerationStatus } from "@/hooks/useGenerationStatus";
import runtimeConfig from "@/libs/app-config/runtime";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Layers, Palette, Sparkles, Wand2, UploadCloud, X, HelpCircle } from "lucide-react";
// Results grid is intentionally not used on this screen anymore.
// The right preview panel now handles display of results and loading overlay.
import { GenerationOverlay } from "./GenerationOverlay";
import { toastSuccess, toastError } from "@/components/shared/Toast";

export function GenerationWorkspaceFinal() {
  const {
    state,
    setMode,
    setInput1File,
    setInput2File,
    setRoomType,
    setStyle,
    setPrompt,
    resetForm,
    missingRequirements,
  } = useGeneration();

  const { submitGeneration, isSubmitting, canSubmit } = useGenerationSubmit({
    onSuccess: () => {},
    onError: () => {},
  });

  useGenerationStatus({
    onComplete: (results) => {
      toastSuccess(`Generated ${results.length} variant${results.length !== 1 ? "s" : ""}.`);
    },
    onError: (e) => toastError(`Generation failed: ${e}`),
  });

  const showInput1 = state.mode !== "imagine";
  const showInput2 = state.mode === "compose";
  const [hasResult, setHasResult] = useState(false);
  const basePreviewUrl = useObjectUrl(state.input1File);

  function onGenerate() {
    if (!canSubmit) return;
    submitGeneration();
    setHasResult(true);
  }

  return (
    <div className="relative">
      {/* Top: glass segmented modes with labels kept on mobile */}
      <div className="px-4 sm:px-6 py-3 sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative">
          <div className="mx-auto w-fit rounded-full border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 p-1 grid grid-cols-4 gap-1">
            {["redesign","staging","compose","imagine"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m as any)}
                className={[
                  "h-9 px-3 rounded-full text-sm flex items-center gap-2 transition-colors",
                  state.mode === m ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                ].join(" ")}
                aria-pressed={state.mode === m}
              >
                {m === "compose" ? (
                  <Layers className="h-4 w-4" />
                ) : m === "imagine" ? (
                  <Sparkles className="h-4 w-4" />
                ) : m === "redesign" ? (
                  <Wand2 className="h-4 w-4" />
                ) : (
                  <Home className="h-4 w-4" />
                )}
              <span className="capitalize">{m}</span>
              </button>
            ))}
          </div>
          {/* On-demand mode help: small glass help button at top-right */}
          <div className="absolute right-0 top-1">
            <Dialog>
              <TooltipProvider>
                <Tooltip>
                  <DialogTrigger asChild>
                    <button aria-label="Mode guide" className="inline-flex items-center justify-center h-8 w-8 rounded-full border bg-background/60 backdrop-blur hover:bg-accent">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <TooltipContent side="left">Mode guide</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>What do these modes do?</DialogTitle>
                </DialogHeader>
                <ul className="grid gap-2 text-sm">
                  <li><strong>Redesign</strong> — Keep the room’s structure; restyle furnishings, decor, and palette.</li>
                  <li><strong>Staging</strong> — Furnish an empty or under‑furnished room for a complete look.</li>
                  <li><strong>Compose</strong> — Keep your base room; apply style or objects from the reference image.</li>
                  <li><strong>Imagine</strong> — Create a new interior from text only (no input photos).</li>
                </ul>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Middle split: smaller to fit bottom bars */}
      <div className="p-4 sm:p-6 pb-44 grid gap-4">
        <section
          className={[
            "rounded-lg border bg-card p-4 grid gap-3",
            state.mode === "imagine"
              ? "grid-cols-1"
              : "grid-cols-1 lg:grid-cols-2",
          ].join(" ")}
        >
          {state.mode !== "imagine" && (
            <InputPreviewPanel
              mode={state.mode}
              input1={state.input1File}
              input2={state.input2File}
              onRemove1={() => setInput1File(null)}
              onRemove2={() => setInput2File(null)}
              onPick1={(f) => setInput1File(f)}
              onPick2={(f) => setInput2File(f)}
            />
          )}
          <ResultPreviewPanel
            results={state.results}
            hasResult={hasResult}
            isGenerating={state.isGenerating}
            status={state.generationStatus}
            mode={state.mode}
            baseUrl={basePreviewUrl}
          />
        </section>

      </div>

      {/* Presets bar above dock with labels */}
      <div className="fixed left-0 right-0 md:left-64 bottom-28 z-30">
        <div className="mx-auto max-w-3xl rounded-xl border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 px-4 py-2 shadow-sm">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="grid gap-1">
              <span className="text-muted-foreground">Room Type</span>
              <SelectPopover
                value={state.roomType}
                onChange={(v) => setRoomType(v)}
                items={runtimeConfig.presets.roomTypes.map((r) => r.label)}
                placeholder="Choose room type"
              />
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Style</span>
              <SelectPopover
                value={state.style}
                onChange={(v) => setStyle(v)}
                items={runtimeConfig.presets.styles.map((s) => s.label)}
                placeholder="Choose style"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom dock: uploader pills + prompt + generate */}
      <div className="fixed left-0 right-0 md:left-64 bottom-4 z-40">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 shadow-md px-3 py-2">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              {showInput1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pill icon={<Home className="h-4 w-4" />} label="Base room" kind="base" onPick={setInput1File} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    Upload the photo of your room. We keep the architecture (walls, windows, layout).
                  </TooltipContent>
                </Tooltip>
              )}
              {showInput2 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pill icon={<Palette className="h-4 w-4" />} label="Reference (style/object)" kind="reference" onPick={setInput2File} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    Add a style or object reference. We transfer palette/materials or a specific object.
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
            <input
              className="flex-1 h-10 bg-transparent outline-none text-sm"
              placeholder={"Prompt (optional)…"}
              value={state.prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button size="sm" disabled={!canSubmit || isSubmitting} onClick={onGenerate}>
              {isSubmitting ? (
                <Wand2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? "Starting…" : state.isGenerating ? "Generating…" : "Generate"}
            </Button>
          </div>
        </div>
      </div>

      {/* Loader is now overlaid inside the right ResultPreviewPanel */}
    </div>
  );
}

function modeHelp(mode: string): string {
  switch (mode) {
    case "redesign":
      return "Redesign: Keep the room’s structure; restyle furnishings, decor, and palette.";
    case "staging":
      return "Staging: Furnish an empty or under‑furnished room for a complete look.";
    case "compose":
      return "Compose: Keep your base room; apply style or objects from the reference image.";
    case "imagine":
      return "Imagine: Create a new interior from text only (no input photos).";
    default:
      return "Choose a mode to get started.";
  }
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const obj = URL.createObjectURL(file);
    setUrl(obj);
    return () => URL.revokeObjectURL(obj);
  }, [file]);
  return url;
}

function InputPreviewPanel({
  mode,
  input1,
  input2,
  onRemove1,
  onRemove2,
  onPick1,
  onPick2,
}: {
  mode: string;
  input1: File | null;
  input2: File | null;
  onRemove1: () => void;
  onRemove2: () => void;
  onPick1: (f: File | null) => void;
  onPick2: (f: File | null) => void;
}) {
  const url1 = useObjectUrl(input1);
  const url2 = useObjectUrl(input2);

  if (mode === "compose") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[22vh]">
        <PreviewBox
          label="Base"
          url={url1}
          placeholder="Upload the photo of your room"
          onRemove={input1 ? onRemove1 : undefined}
          onPick={onPick1}
        />
        <PreviewBox
          label="Reference"
          url={url2}
          placeholder="Add a style or object reference"
          onRemove={input2 ? onRemove2 : undefined}
          onPick={onPick2}
        />
      </div>
    );
  }
  // redesign or staging
  return (
    <PreviewBox
      label="Room"
      url={url1}
      placeholder={mode === "staging" ? "Upload an empty/sparse room" : "Upload the room to redesign"}
      onRemove={input1 ? onRemove1 : undefined}
      onPick={onPick1}
    />
  );
}

function ResultPreviewPanel({
  results,
  hasResult,
  isGenerating,
  status,
  mode,
  baseUrl,
}: {
  results: { url: string }[] | null;
  hasResult: boolean;
  isGenerating: boolean;
  status: 'idle' | 'uploading' | 'creating' | 'processing' | 'succeeded' | 'failed';
  mode: string;
  baseUrl: string | null;
}) {
  const cover = results && results.length > 0 ? results[0]?.url : null;
  const showBlurBase = isGenerating && mode !== 'imagine' && !!baseUrl;
  const isCompact = mode === 'imagine';

  return (
    <div className="relative rounded-md border bg-background overflow-hidden min-h-[22vh] grid place-items-center">
      {/* Image layer */}
      {cover ? (
        <img
          src={cover}
          alt="Generated result"
          className={[
            isCompact
              ? "max-h-[60vh] w-auto max-w-full object-contain mx-auto"
              : "w-full h-full object-cover",
            "transition-all duration-500 ease-out"
          ].join(" ")}
        />
      ) : showBlurBase ? (
        <img
          src={baseUrl!}
          alt="Generating preview"
          className="w-full h-full object-cover scale-105 blur-md transition-all duration-700 ease-out"
        />
      ) : (
        <span className="text-sm text-muted-foreground">
          {hasResult ? "Generated result" : "Results will appear on the right"}
        </span>
      )}

      {/* Subtle label when a cover is present */}
      {cover && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/35 text-primary-foreground px-2 py-1 text-xs">
          Latest result
        </div>
      )}

      {/* Overlay loader during generation */}
      {isGenerating && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] supports-[backdrop-filter]:bg-background/35">
          <GenerationOverlay status={status} mode={mode} />
        </div>
      )}
    </div>
  );
}

function PreviewBox({ label, url, placeholder, onRemove, onPick }: { label: string; url: string | null; placeholder: string; onRemove?: () => void; onPick?: (f: File | null) => void }) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!onPick || !files || files.length === 0) return;
    const file = files[0];
    const max = (runtimeConfig.limits.maxUploadsMB || 15) * 1024 * 1024;
    const accepted = runtimeConfig.limits.acceptedMimeTypes || [];
    if (file.size > max) {
      toastError(`File too large. Max ${runtimeConfig.limits.maxUploadsMB}MB`);
      return;
    }
    if (accepted.length > 0 && !accepted.includes(file.type)) {
      toastError("Unsupported file type");
      return;
    }
    onPick(file);
  };

  return (
    <div
      className={[
        "group relative rounded-md border bg-background overflow-hidden min-h-[22vh]",
        dragOver ? "ring-2 ring-primary/50" : ""
      ].join(" ")}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
    >
      {url ? (
        <>
          <img src={url} alt={`${label} preview`} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-black/35 text-primary-foreground px-2 py-1 text-xs flex items-center justify-between">
            <span className="font-medium">{label} preview</span>
            {onRemove && <span className="opacity-80 hidden sm:inline">Hover/tap × to remove</span>}
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${label} image`}
              className="absolute top-2 right-2 inline-flex items-center justify-center h-8 w-8 rounded-full bg-background/80 backdrop-blur border text-foreground shadow transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <label className="w-full h-full grid place-items-center text-sm text-muted-foreground p-4 text-center cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex items-center justify-center h-12 w-12 rounded-full border bg-background">
              <UploadCloud className="h-5 w-5" />
            </span>
            <span className="text-foreground font-medium">{label}</span>
            <span className="max-w-[28ch]">{placeholder}</span>
            <span className="text-xs text-muted-foreground">Click to upload or drag and drop</span>
          </div>
          <input
            type="file"
            accept={runtimeConfig.limits.acceptedMimeTypes.join(",")}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
    </div>
  );
}

function Pill({ icon, label, kind, onPick }: { icon: ReactNode; label: string; kind: 'base' | 'reference'; onPick: (f: File | null) => void }) {
  const { state } = useGeneration();
  const active = kind === 'base' ? !!state.input1File : !!state.input2File;
  return (
    <label className={[
      "inline-flex items-center gap-2 rounded-full px-3 h-9 cursor-pointer text-xs backdrop-blur transition-colors",
      active
        ? "bg-primary/20 border-2 border-primary/50 ring-1 ring-primary/30 shadow-sm"
        : "border bg-card hover:bg-accent/80",
    ].join(" ")}>
      <span className="relative inline-flex items-center justify-center h-6 w-6 rounded-full bg-background border">
        {icon}
        {active && (
          <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-primary border border-background" />
        )}
      </span>
      <span className="px-1">{label}</span>
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-background border">
        <UploadCloud className="h-3.5 w-3.5" />
      </span>
      <input
        type="file"
        accept={runtimeConfig.limits.acceptedMimeTypes.join(",")}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function SelectPopover({
  value,
  onChange,
  items,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  items: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = value || placeholder || 'Select';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-9 rounded-md border bg-background px-3 text-sm text-left w-full"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {display}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="p-0 w-[var(--radix-popover-trigger-width,12rem)]">
        <div role="listbox" className="max-h-64 overflow-auto py-1">
          {items.map((it) => (
            <button
              key={it}
              role="option"
              aria-selected={value === it}
              onClick={() => { onChange(it); setOpen(false); }}
              className={[
                'w-full text-left px-3 py-2 text-sm hover:bg-accent',
                value === it ? 'bg-accent' : ''
              ].join(' ')}
            >
              {it}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
