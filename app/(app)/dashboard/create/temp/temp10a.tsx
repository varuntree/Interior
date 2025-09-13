"use client";

import { MODES, ROOM_TYPES, STYLES, useTempForm } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Home, Palette, Layers, Paperclip, Sparkles, Send } from "lucide-react";

export default function TempV10A() {
  const f = useTempForm();

  return (
    <div className="min-h-[100vh] grid grid-rows-[auto,1fr,auto]">
      {/* Header: compact modes */}
      <header className="px-4 sm:px-6 py-3 border-b flex items-center gap-2 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => f.setMode(m.id)}
            className={[
              "h-8 rounded-full px-3 text-xs",
              f.mode === m.id ? "bg-primary text-primary-foreground" : "bg-accent",
            ].join(" ")}
          >
            {m.label}
          </button>
        ))}
      </header>

      {/* Main: results + controls row above composer */}
      <main className="p-4 sm:p-6 grid gap-4">
        <section className="rounded-lg border bg-card p-4 min-h-[40vh]">
          <p className="text-sm text-muted-foreground">Results will appear here.</p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[auto,auto,1fr,auto] gap-3 items-center">
          {(f.needsFile1 || f.needsFile2) && (
            <UploaderButton
              icon={<Home className="h-4 w-4" />}
              label="Base room"
              onPick={f.setFile1}
              required={f.needsFile1}
              hint="We keep this room's architecture"
            />
          )}
          {f.needsFile2 && (
            <UploaderButton
              icon={<Palette className="h-4 w-4" />}
              label="Reference"
              onPick={f.setFile2}
              required
              hint="We transfer style/objects from this"
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={f.roomType}
              onChange={(e) => f.setRoomType(e.target.value as any)}
            >
              {ROOM_TYPES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={f.style}
              onChange={(e) => f.setStyle(e.target.value as any)}
            >
              {STYLES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <Button size="lg" disabled={!f.canGenerate} onClick={f.onGenerate}>
            <Send className="mr-2 h-4 w-4" /> Send
          </Button>
        </section>

        {f.mode === "compose" && (
          <aside className="rounded-md border bg-card/80 p-3 text-xs text-muted-foreground flex items-center gap-3">
            <Layers className="h-4 w-4 text-primary" />
            <span>
              Compose keeps your <b>Base room</b> intact and applies palette/materials or a specific object from <b>Reference</b>.
            </span>
          </aside>
        )}
      </main>

      {/* Elevated/sticky composer: more discoverable */}
      <footer className="sticky bottom-0 z-20 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-3">
          <Label className="sr-only">Prompt</Label>
          <div className="relative grid grid-cols-[auto,1fr,auto] items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <input
              className="h-11 w-full rounded-md border bg-background px-3 text-sm"
              placeholder={f.needsPrompt ? "Describe your idea (required)…" : "Describe details (optional)…"}
              value={f.prompt}
              onChange={(e) => f.setPrompt(e.target.value)}
            />
            <Button size="lg" disabled={!f.canGenerate} onClick={f.onGenerate}>
              <Sparkles className="mr-2 h-4 w-4" /> Generate
            </Button>
          </div>
          <Separator className="mt-3 opacity-0" />
        </div>
      </footer>
    </div>
  );
}

function UploaderButton({
  icon,
  label,
  hint,
  required,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  required?: boolean;
  onPick: (f: File | null) => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <label className="inline-flex items-center gap-2 rounded-md border bg-background px-3 h-10 cursor-pointer text-sm hover:bg-accent">
            {icon}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            />
            <span>{label}{required ? "*" : ""}</span>
          </label>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {hint}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

