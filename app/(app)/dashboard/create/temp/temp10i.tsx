"use client";

import { MODES, ROOM_TYPES, STYLES, useTempForm } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Palette, UploadCloud, Sparkles } from "lucide-react";
import { useState } from "react";

export default function TempV10I() {
  const f = useTempForm();
  const [hasResult, setHasResult] = useState(false);
  function onGenerate(){ f.onGenerate(); setHasResult(true); }

  return (
    <div className="min-h-[100vh] grid grid-rows-[auto,1fr]">
      <header className="px-4 sm:px-6 py-3 border-b flex items-center gap-2 flex-wrap">
        {MODES.map((m)=>(
          <button key={m.id} onClick={()=>f.setMode(m.id)} className={["h-8 rounded-full px-3 text-xs", f.mode===m.id?"bg-primary text-primary-foreground":"bg-accent"].join(" ")}>{m.label}</button>
        ))}
      </header>

      <main className="p-4 sm:p-6 grid gap-4">
        {/* Canvas drop area spanning two inputs */}
        <section className="rounded-lg border bg-card p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <BigDrop icon={<Home className="h-6 w-6" />} label="Drop or click to add Base" onPick={f.setFile1} />
          {f.needsFile2 ? (
            <BigDrop icon={<Palette className="h-6 w-6" />} label="Drop or click to add Reference" onPick={f.setFile2} />
          ) : (
            <div className="rounded-md border bg-background grid place-items-center text-sm text-muted-foreground">No reference needed in this mode</div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-3 items-center">
          <div className="grid grid-cols-2 gap-2">
            <select className="h-10 rounded-md border bg-background px-3" value={f.roomType} onChange={(e)=>f.setRoomType(e.target.value as any)}>{(ROOM_TYPES as any as string[]).map(r=> <option key={r}>{r}</option>)}</select>
            <select className="h-10 rounded-md border bg-background px-3" value={f.style} onChange={(e)=>f.setStyle(e.target.value as any)}>{(STYLES as any as string[]).map(s=> <option key={s}>{s}</option>)}</select>
          </div>
          <Button size="lg" disabled={!f.canGenerate} onClick={onGenerate}><Sparkles className="mr-2 h-4 w-4" /> Generate</Button>
        </section>

        <section className="rounded-lg border bg-card p-4 min-h-[40vh] grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-md border bg-background grid place-items-center text-sm text-muted-foreground">Inputs preview</div>
          <div className="rounded-md border bg-background grid place-items-center text-sm text-muted-foreground">{hasResult?"Generated result placeholder":"Results will appear here"}</div>
        </section>

        <ComposerDock value={f.prompt} required={f.needsPrompt} onChange={(v)=>f.setPrompt(v)} onGenerate={onGenerate} disabled={!f.canGenerate} />
      </main>
    </div>
  );
}

function BigDrop({ icon, label, onPick }: { icon: React.ReactNode; label: string; onPick: (f: File | null)=>void }) {
  return (
    <label onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) onPick(file);}} className="aspect-[16/10] rounded-md border-2 border-dashed grid place-items-center bg-background cursor-pointer hover:bg-accent">
      <Input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>onPick(e.target.files?.[0] ?? null)} />
      <div className="grid place-items-center gap-2 text-sm text-muted-foreground">{icon}<span>{label}</span><span className="text-xs">Click or drop</span></div>
    </label>
  );
}

function ComposerDock({ value, required, onChange, onGenerate, disabled }: { value: string; required?: boolean; onChange: (v: string)=>void; onGenerate: () => void; disabled: boolean }) {
  return (
    <div className="fixed left-0 right-0 bottom-4 z-30">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-background shadow-md px-3 py-2">
        <div className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-muted-foreground" />
          <input className="flex-1 h-10 bg-transparent outline-none text-sm" placeholder={required?"Describe your idea (required)…":"Describe details (optional)…"} value={value} onChange={(e)=>onChange(e.target.value)} />
          <Button size="sm" disabled={disabled} onClick={onGenerate}><Sparkles className="mr-2 h-4 w-4" /> Generate</Button>
        </div>
      </div>
    </div>
  );
}

