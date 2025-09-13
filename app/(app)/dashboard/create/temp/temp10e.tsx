"use client";

import { MODES, ROOM_TYPES, STYLES, useTempForm } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Palette, Paperclip, Wand2 } from "lucide-react";

export default function TempV10E() {
  const f = useTempForm();

  return (
    <div className="min-h-[100vh] grid grid-rows-[auto,auto,1fr]">
      {/* Header modes */}
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

      {/* Top composer bar for visibility */}
      <div className="sticky top-[48px] z-20 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 py-2 grid grid-cols-[auto,1fr,auto] gap-2 items-center">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <input className="h-10 rounded-md border bg-background px-3 text-sm" placeholder={f.needsPrompt ? "Prompt (required)…" : "Prompt (optional)…"} value={f.prompt} onChange={(e)=>f.setPrompt(e.target.value)} />
          <Button size="sm" disabled={!f.canGenerate} onClick={f.onGenerate}><Wand2 className="mr-2 h-4 w-4" /> Generate</Button>
        </div>
      </div>

      <main className="p-4 sm:p-6 grid gap-4">
        <section className="rounded-lg border bg-card p-4 min-h-[40vh]">
          <p className="text-sm text-muted-foreground">Results render here.</p>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr,1fr,auto] gap-3 items-start">
          <div className="grid gap-3">
            {(f.needsFile1 || f.needsFile2) && (
              <div className="flex flex-wrap gap-2">
                <AttachPill icon={<Home className="h-4 w-4" />} label="Base" onPick={f.setFile1} />
                {f.needsFile2 && <AttachPill icon={<Palette className="h-4 w-4" />} label="Reference" onPick={f.setFile2} />}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="h-10 rounded-md border bg-background px-3" value={f.roomType} onChange={(e)=>f.setRoomType(e.target.value as any)}>{(ROOM_TYPES as any as string[]).map(r => <option key={r}>{r}</option>)}</select>
            <select className="h-10 rounded-md border bg-background px-3" value={f.style} onChange={(e)=>f.setStyle(e.target.value as any)}>{(STYLES as any as string[]).map(s => <option key={s}>{s}</option>)}</select>
          </div>
          <Button size="lg" disabled={!f.canGenerate} onClick={f.onGenerate}><Wand2 className="mr-2 h-4 w-4" /> Generate</Button>
        </section>
      </main>
    </div>
  );
}

function AttachPill({ icon, label, onPick }: { icon: React.ReactNode; label: string; onPick: (f: File | null)=>void }) {
  return (
    <label className="inline-flex items-center gap-2 h-10 rounded-full border bg-background px-3 cursor-pointer text-sm hover:bg-accent">
      {icon}
      <Input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>onPick(e.target.files?.[0] ?? null)} />
      {label}
    </label>
  );
}
