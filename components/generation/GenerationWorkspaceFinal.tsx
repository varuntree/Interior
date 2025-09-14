"use client";

import { useState, useEffect } from "react";
import { useGeneration } from "@/contexts/GenerationContext";
import { useGenerationSubmit } from "@/hooks/useGenerationSubmit";
import { useGenerationStatus } from "@/hooks/useGenerationStatus";
import runtimeConfig from "@/libs/app-config/runtime";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Layers, Palette, Sparkles, Wand2, UploadCloud, X, HelpCircle } from "lucide-react";
import { ResultsGrid } from "./ResultsGrid";
import { GenerationProgress } from "./GenerationProgress";
import { toastSuccess, toastError } from "@/components/shared/Toast";
import { apiFetch } from "@/libs/api/http";

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

  async function handleAddToFavorites(renderId: string) {
    await apiFetch("/api/v1/collections/favorites/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ renderId }),
    });
  }
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
            />
          )}
          <ResultPreviewPanel results={state.results} hasResult={hasResult} />
        </section>

        {/* Results section using real component */}
        {state.results && state.results.length > 0 && (
          <ResultsGrid
            results={state.results}
            mode={state.mode}
            roomType={state.roomType}
            style={state.style}
            prompt={state.prompt}
            onAddToFavorites={handleAddToFavorites}
            onAddToCollection={() => {}}
            onRerun={() => {
              resetForm();
              if (canSubmit) submitGeneration();
            }}
          />
        )}
      </div>

      {/* Presets bar above dock with labels */}
      <div className="fixed left-0 right-0 md:left-64 bottom-28 z-30">
        <div className="mx-auto max-w-3xl rounded-xl border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 px-4 py-2 shadow-sm">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="grid gap-1">
              <span className="text-muted-foreground">Room Type</span>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={state.roomType}
                onChange={(e) => setRoomType(e.target.value as any)}
              >
                {runtimeConfig.presets.roomTypes.map((r) => (
                  <option key={r.id} value={r.label}>{r.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-muted-foreground">Style</span>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={state.style}
                onChange={(e) => setStyle(e.target.value as any)}
              >
                {runtimeConfig.presets.styles.map((s) => (
                  <option key={s.id} value={s.label}>{s.label}</option>
                ))}
              </select>
            </label>
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
              placeholder={state.mode === "imagine" ? "Prompt (required)…" : "Prompt (optional)…"}
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

      {state.isGenerating && (
        <GenerationProgress onCancel={() => {}} showCancel={false} />
      )}
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
}: {
  mode: string;
  input1: File | null;
  input2: File | null;
  onRemove1: () => void;
  onRemove2: () => void;
}) {
  const url1 = useObjectUrl(input1);
  const url2 = useObjectUrl(input2);

  if (mode === "compose") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[22vh]">
        <PreviewBox label="Base" url={url1} placeholder="Add a base room via the Base pill" onRemove={input1 ? onRemove1 : undefined} />
        <PreviewBox label="Reference" url={url2} placeholder="Add a reference via the Ref pill" onRemove={input2 ? onRemove2 : undefined} />
      </div>
    );
  }
  // redesign or staging
  return (
    <PreviewBox
      label="Room"
      url={url1}
      placeholder={mode === "staging" ? "Upload an empty/sparse room"
        : "Upload the room to redesign"}
      onRemove={input1 ? onRemove1 : undefined}
    />
  );
}

function ResultPreviewPanel({
  results,
  hasResult,
}: {
  results: { url: string }[] | null;
  hasResult: boolean;
}) {
  const cover = results && results.length > 0 ? results[0]?.url : null;
  return (
    <div className="rounded-md border bg-background overflow-hidden min-h-[22vh] grid place-items-center relative">
      {cover ? (
        // Using img to avoid Next Image config concerns here
        <img src={cover} alt="Generated result" className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm text-muted-foreground">
          {hasResult ? "Generated result" : "Results will appear here"}
        </span>
      )}
      {cover && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/35 text-primary-foreground px-2 py-1 text-xs">
          Latest result
        </div>
      )}
    </div>
  );
}

function PreviewBox({ label, url, placeholder, onRemove }: { label: string; url: string | null; placeholder: string; onRemove?: () => void }) {
  return (
    <div className="group relative rounded-md border bg-background overflow-hidden min-h-[22vh]">
      {url ? (
        <>
          <img src={url} alt={`${label} preview`} className="w-full h-full object-cover" />
          {/* Caption bar */}
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
        <div className="w-full h-full grid place-items-center text-sm text-muted-foreground p-4 text-center">
          {placeholder}
        </div>
      )}
    </div>
  );
}

function Pill({ icon, label, kind, onPick }: { icon: React.ReactNode; label: string; kind: 'base' | 'reference'; onPick: (f: File | null) => void }) {
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
