"use client";

import { useState, useEffect } from "react";
import { useGeneration } from "@/contexts/GenerationContext";
import { useGenerationSubmit } from "@/hooks/useGenerationSubmit";
import { useGenerationStatus } from "@/hooks/useGenerationStatus";
import runtimeConfig from "@/libs/app-config/runtime";
import { Button } from "@/components/ui/button";
import { Home, Layers, Palette, Sparkles, Wand2, UploadCloud, X } from "lucide-react";
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
      <div className="px-4 sm:px-6 py-3 border-b sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <div className="fixed left-0 right-0 bottom-28 z-30">
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
      <div className="fixed left-0 right-0 bottom-4 z-40">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 shadow-md px-3 py-2">
          <div className="flex items-center gap-2">
            {showInput1 && (
              <Pill icon={<Home className="h-4 w-4" />} label="Base" onPick={setInput1File} />
            )}
            {showInput2 && (
              <Pill icon={<Palette className="h-4 w-4" />} label="Ref" onPick={setInput2File} />
            )}
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
    <div className="rounded-md border bg-background overflow-hidden min-h-[22vh] grid place-items-center">
      {cover ? (
        // Using img to avoid Next Image config concerns here
        <img src={cover} alt="Generated result" className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm text-muted-foreground">
          {hasResult ? "Generated result" : "Results will appear here"}
        </span>
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

function Pill({ icon, label, onPick }: { icon: React.ReactNode; label: string; onPick: (f: File | null) => void }) {
  // Determine active by label and file presence could be passed; quick heuristic relies on label
  // Caller always renders correct pills for current mode
  const isBase = label.toLowerCase().startsWith("base") || label.toLowerCase().startsWith("room");
  const { state } = useGeneration();
  const active = isBase ? !!state.input1File : !!state.input2File;
  return (
    <label className={[
      "inline-flex items-center gap-2 rounded-full px-3 h-9 cursor-pointer text-xs backdrop-blur",
      active ? "bg-primary/10 border border-primary/30" : "border bg-card hover:bg-accent/80",
    ].join(" ")}>
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-background border">{icon}</span>
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
