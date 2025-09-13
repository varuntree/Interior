"use client";

import { MODES, ROOM_TYPES, STYLES, useTempForm } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, Image as ImageIcon, Sparkles } from "lucide-react";

export default function TempV10D() {
  const f = useTempForm();

  return (
    <div className="min-h-[100vh] grid grid-rows-[auto,1fr,auto]">
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

      <main className="p-4 sm:p-6 grid gap-4">
        <section className="rounded-lg border bg-card p-4 min-h-[40vh]">
          <p className="text-sm text-muted-foreground">Results will appear here.</p>
        </section>

        {(f.needsFile1 || f.needsFile2) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TileWithPreview label="Base room" fileName={(f as any).file1?.name} onPick={f.setFile1} />
            {f.needsFile2 && <TileWithPreview label="Reference" fileName={(f as any).file2?.name} onPick={f.setFile2} />}
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-[1fr,1fr,auto] gap-3 items-center">
          <div className="grid grid-cols-2 gap-2">
            <select className="h-10 rounded-md border bg-background px-3" value={f.roomType} onChange={(e)=>f.setRoomType(e.target.value as any)}>{(ROOM_TYPES as any as string[]).map(r => <option key={r}>{r}</option>)}</select>
            <select className="h-10 rounded-md border bg-background px-3" value={f.style} onChange={(e)=>f.setStyle(e.target.value as any)}>{(STYLES as any as string[]).map(s => <option key={s}>{s}</option>)}</select>
          </div>
          <Button size="lg" disabled={!f.canGenerate} onClick={f.onGenerate}><Sparkles className="mr-2 h-4 w-4" /> Generate</Button>
        </section>
      </main>

      <footer className="border-t p-3 grid grid-cols-[1fr,auto] gap-2 items-center">
        <input className="h-11 rounded-md border bg-background px-3 text-sm" placeholder={f.needsPrompt ? "Prompt (required)…" : "Prompt (optional)…"} value={f.prompt} onChange={(e)=>f.setPrompt(e.target.value)} />
        <Button disabled={!f.canGenerate} onClick={f.onGenerate}>Generate</Button>
      </footer>
    </div>
  );
}

function TileWithPreview({ label, fileName, onPick }: { label: string; fileName?: string; onPick: (f: File | null)=>void }) {
  return (
    <label className="rounded-lg border border-dashed bg-background/60 p-4 grid place-items-center cursor-pointer min-h-[160px]">
      <Input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>onPick(e.target.files?.[0] ?? null)} />
      {fileName ? (
        <div className="grid gap-2 place-items-center">
          <ImageIcon className="h-6 w-6 text-primary" />
          <div className="text-xs text-muted-foreground max-w-[220px] truncate">{fileName}</div>
          <span className="rounded-md border px-2 h-8 grid place-items-center text-xs">Replace</span>
        </div>
      ) : (
        <div className="grid gap-2 place-items-center text-sm text-muted-foreground">
          <ImagePlus className="h-6 w-6" />
          {label}
        </div>
      )}
    </label>
  );
}
