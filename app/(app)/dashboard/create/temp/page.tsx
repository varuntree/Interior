"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import TempV10 from "./temp10";
import TempV10A from "./temp10a";
import TempV10B from "./temp10b";
import TempV10C from "./temp10c";
import TempV10D from "./temp10d";
import TempV10E from "./temp10e";
import TempV10F from "./temp10f";

type VComp = React.ComponentType<{}>;

const registry: { id: string; label: string; Comp: VComp }[] = [
  { id: "10", label: "Chat‑Like Composer (baseline)", Comp: TempV10 },
  { id: "10a", label: "Elevated Composer + Icon Uploaders", Comp: TempV10A },
  { id: "10b", label: "Floating Composer Dock", Comp: TempV10B },
  { id: "10c", label: "Compose Helper Cards", Comp: TempV10C },
  { id: "10d", label: "Uploader Tiles with Preview", Comp: TempV10D },
  { id: "10e", label: "Top Composer Bar", Comp: TempV10E },
  { id: "10f", label: "FAB Generate + Inline Prompt", Comp: TempV10F },
];

export default function TempCreateExplorationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [vid, setVid] = useState<string>("10");

  // Initialize from ?v= query if present
  useEffect(() => {
    const vStr = searchParams.get("v");
    if (vStr && registry.some((r) => r.id === vStr)) {
      setVid(vStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL on change (no scroll reset)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("v", String(vid));
    router.replace(`${pathname}?${params.toString()}`);
  }, [vid, pathname, router, searchParams]);

  const current = useMemo(() => registry.find((r) => r.id === vid) ?? registry[0], [vid]);
  const Comp = current.Comp;

  return (
    <div className="min-h-[100vh] grid grid-rows-[auto,1fr]">
      {/* Top switcher bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Exploration</span>
            <Badge variant="secondary">Temp</Badge>
            <Separator orientation="vertical" className="hidden sm:inline h-4" />
            <label className="text-sm">
              <span className="sr-only">Version</span>
              <select
                className="ml-0 sm:ml-1 h-9 rounded-md border bg-background px-3 text-sm"
                value={vid}
                onChange={(e) => setVid(e.target.value)}
              >
                {registry.map((r) => (
                  <option key={r.id} value={r.id}>{`v${r.id} — ${r.label}`}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="text-xs text-muted-foreground">Deep‑link any variant via ?v=10…10f.</div>
        </div>
      </div>

      {/* Selected exploration */}
      <div>
        <Comp />
      </div>
    </div>
  );
}
