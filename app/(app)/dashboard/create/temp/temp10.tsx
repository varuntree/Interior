"use client";

import { MODES, ROOM_TYPES, STYLES, useTempForm } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TempV10() {
  const f = useTempForm();

  return (
    <div className="min-h-[100vh] grid grid-rows-[auto,1fr,auto]">
      <header className="px-4 sm:px-6 py-4 border-b flex items-center gap-2 flex-wrap">
        {MODES.map(m => (
          <button key={m.id} onClick={()=>f.setMode(m.id)} className={[
            "h-8 rounded-full px-3 text-xs",
            f.mode === m.id ? "bg-primary text-primary-foreground" : "bg-accent",
          ].join(" ")}>{m.label}</button>
        ))}
      </header>

      {/* Chat-like area */}
      <main className="p-4 sm:p-6 grid grid-rows-[1fr,auto] gap-4">
        <div className="rounded-lg border bg-card p-4 overflow-auto">
          <div className="text-sm text-muted-foreground">Start by attaching images or set presets below. Your generated results will appear here as messages.</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,2fr,auto] gap-2 items-center">
          {(f.needsFile1 || f.needsFile2) && (
            <Attach label="Base" onPick={f.setFile1} required={f.needsFile1} />
          )}
          {f.needsFile2 && (
            <Attach label="Ref" onPick={f.setFile2} required />
          )}
          <div className="grid grid-cols-2 gap-2">
            <select className="h-10 rounded-md border bg-background px-3" value={f.roomType} onChange={(e)=>f.setRoomType(e.target.value as any)}>
              {ROOM_TYPES.map(r => <option key={r}>{r}</option>)}
            </select>
            <select className="h-10 rounded-md border bg-background px-3" value={f.style} onChange={(e)=>f.setStyle(e.target.value as any)}>
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Button size="lg" disabled={!f.canGenerate} onClick={f.onGenerate}>Send</Button>
        </div>
      </main>

      {/* Composer */}
      <footer className="border-t p-3">
        <Label className="sr-only">Prompt</Label>
        <div className="grid grid-cols-[1fr,auto] gap-2">
          <Input placeholder={f.needsPrompt ? "Describe your idea (required)…" : "Add details (optional)…"} value={f.prompt} onChange={(e)=>f.setPrompt(e.target.value)} />
          <Button disabled={!f.canGenerate} onClick={f.onGenerate}>Generate</Button>
        </div>
      </footer>
    </div>
  );
}

function Attach({ label, required, onPick }: { label: string; required?: boolean; onPick: (f: File | null) => void }) {
  return (
    <label className="h-10 rounded-md border bg-background px-3 grid place-items-center cursor-pointer text-sm">
      <Input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>onPick(e.target.files?.[0] ?? null)} />
      {label}{required ? "*" : ""}
    </label>
  );
}

