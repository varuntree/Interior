"use client";

import { MODES, ROOM_TYPES, STYLES, useTempForm } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Palette, Plus, Sparkles } from "lucide-react";

export default function TempV10F() {
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
        <section className="rounded-lg border bg-card p-4 min-h-[42vh]">
          <p className="text-sm text-muted-foreground">Results will appear here.</p>
        </section>

        <section className="flex flex-wrap items-center gap-2">
          {(f.needsFile1 || f.needsFile2) && (
            <AttachAction icon={<Home className="h-4 w-4" />} label="Add Base" onPick={f.setFile1} />
          )}
          {f.needsFile2 && (
            <AttachAction icon={<Palette className="h-4 w-4" />} label="Add Reference" onPick={f.setFile2} />
          )}
          <select className="h-10 rounded-md border bg-background px-3" value={f.roomType} onChange={(e)=>f.setRoomType(e.target.value as any)}>{(ROOM_TYPES as any as string[]).map(r => <option key={r}>{r}</option>)}</select>
          <select className="h-10 rounded-md border bg-background px-3" value={f.style} onChange={(e)=>f.setStyle(e.target.value as any)}>{(STYLES as any as string[]).map(s => <option key={s}>{s}</option>)}</select>
        </section>

        {/* Collapsible inline prompt with floating FAB */}
        <section className="grid gap-2">
          <label className="text-xs text-muted-foreground">Prompt {f.needsPrompt ? "(required)" : "(optional)"}</label>
          <input className="h-11 rounded-md border bg-background px-3 text-sm" placeholder="Write a short prompt…" value={f.prompt} onChange={(e)=>f.setPrompt(e.target.value)} />
        </section>

        <Button
          size="lg"
          disabled={!f.canGenerate}
          onClick={f.onGenerate}
          className="fixed right-5 bottom-5 rounded-full h-12 w-12 p-0 shadow-md"
          aria-label="Generate"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </main>
    </div>
  );
}

function AttachAction({ icon, label, onPick }: { icon: React.ReactNode; label: string; onPick: (f: File | null)=>void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border bg-background px-3 h-10 cursor-pointer text-sm hover:bg-accent">
      <Plus className="h-4 w-4" />
      {icon}
      <Input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>onPick(e.target.files?.[0] ?? null)} />
      {label}
    </label>
  );
}

