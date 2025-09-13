"use client";

import { MODES, ROOM_TYPES, STYLES, useTempForm } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Palette, UploadCloud, Wand2 } from "lucide-react";

export default function TempV10B() {
  const f = useTempForm();

  return (
    <div className="min-h-[100vh] grid grid-rows-[auto,1fr]">
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

      <main className="relative p-4 sm:p-6 grid gap-4">
        <section className="rounded-lg border bg-card p-4 min-h-[45vh]">
          <p className="text-sm text-muted-foreground">Results appear here.</p>
        </section>

        {/* Uploaders with clear icon affordance */}
        <section className="flex flex-wrap items-center gap-3">
          {(f.needsFile1 || f.needsFile2) && (
            <IconAttach icon={<Home className="h-4 w-4" />} label="Base room" onPick={f.setFile1} />
          )}
          {f.needsFile2 && (
            <IconAttach icon={<Palette className="h-4 w-4" />} label="Reference" onPick={f.setFile2} />
          )}
          <div className="grid grid-cols-2 gap-2">
            <select className="h-10 rounded-md border bg-background px-3" value={f.roomType} onChange={(e)=>f.setRoomType(e.target.value as any)}>{(ROOM_TYPES as any as string[]).map(r => <option key={r}>{r}</option>)}</select>
            <select className="h-10 rounded-md border bg-background px-3" value={f.style} onChange={(e)=>f.setStyle(e.target.value as any)}>{(STYLES as any as string[]).map(s => <option key={s}>{s}</option>)}</select>
          </div>
        </section>

        {/* Floating composer dock */}
        <ComposerDock
          value={f.prompt}
          required={f.needsPrompt}
          onChange={(v) => f.setPrompt(v)}
          onGenerate={f.onGenerate}
          disabled={!f.canGenerate}
        />
      </main>
    </div>
  );
}

function IconAttach({ icon, label, onPick }: { icon: React.ReactNode; label: string; onPick: (f: File | null) => void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border bg-background px-3 h-10 cursor-pointer text-sm hover:bg-accent">
      {icon}
      <Input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>onPick(e.target.files?.[0] ?? null)} />
      {label}
    </label>
  );
}

function ComposerDock({ value, required, onChange, onGenerate, disabled }: { value: string; required?: boolean; onChange: (v: string)=>void; onGenerate: () => void; disabled: boolean }) {
  return (
    <div className="fixed left-0 right-0 bottom-4 z-30">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-background shadow-md px-3 py-2">
        <div className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-muted-foreground" />
          <input
            className="flex-1 h-10 bg-transparent outline-none text-sm"
            placeholder={required ? "Describe your idea (required)…" : "Describe details (optional)…"}
            value={value}
            onChange={(e)=>onChange(e.target.value)}
          />
          <Button size="sm" disabled={disabled} onClick={onGenerate}>
            <Wand2 className="mr-2 h-4 w-4" /> Generate
          </Button>
        </div>
      </div>
    </div>
  );
}

