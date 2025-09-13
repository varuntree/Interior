"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import TempV10I from "./temp10i";
import TempV10N from "./temp10n";
import TempV10L from "./temp10l";

type VComp = React.ComponentType<{}>;

const registry: { id: string; label: string; Comp: VComp }[] = [
  { id: "10i", label: "Big Dropzones + Split Result", Comp: TempV10I },
  { id: "10l", label: "Bottom Dock Uploaders (pills above dock)", Comp: TempV10L },
  { id: "10n", label: "Responsive Tabs Mobile", Comp: TempV10N },
];

export default function TempCreateExplorationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [vid, setVid] = useState<string>("10i");

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
          <div className="text-xs text-muted-foreground">Deep‑link via ?v=10i or ?v=10n.</div>
        </div>
      </div>

      {/* Selected exploration */}
      <div>
        <Comp />
      </div>
    </div>
  );
}
