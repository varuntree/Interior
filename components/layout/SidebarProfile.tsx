"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MoreVertical, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MeResponse = {
  success: boolean;
  data?: { id: string; email: string | null; createdAt: string };
  error?: any;
};

type UsageResponse = {
  success: boolean;
  data?: { usage?: { remaining?: number; monthlyLimit?: number; currentMonth?: { used?: number } } };
};

function localPart(email: string | null): string {
  if (!email) return "Account";
  const local = email.split("@")[0] || "account";
  return local || "Account";
}

function ringColor(remaining: number, limit: number): string {
  if (limit <= 0) return "var(--muted-foreground)";
  const pct = 1 - remaining / limit; // used ratio
  if (pct < 0.25) return "hsl(var(--chart-2))"; // green-ish (plenty left)
  if (pct < 0.75) return "hsl(var(--chart-3))"; // yellow
  return "hsl(var(--destructive))"; // red
}

export function SidebarProfile() {
  const { setTheme } = useTheme();
  const [email, setEmail] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // fetch minimal identity (email for labeling if needed)
        const res = await fetch("/api/v1/auth/me", { cache: "no-store" });
        if (res.ok) {
          const json: MeResponse = await res.json();
          if (mounted && json.success) setEmail(json.data?.email ?? null);
        }
      } catch (_err) {
        // Intentionally ignore network/unauth failures in sidebar profile fetch
        // eslint-disable-next-line no-useless-return
        return;
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/v1/usage", { cache: "no-store" });
        if (!res.ok) return;
        const json: UsageResponse = await res.json();
        if (mounted && json.success) {
          const rem = json.data?.usage?.remaining ?? null;
          const lim = json.data?.usage?.monthlyLimit ?? null;
          if (typeof rem === "number") setRemaining(rem);
          if (typeof lim === "number") setLimit(lim);
        }
      } catch (_err) {
        // Intentionally ignore network/unauth failures in usage fetch
        // eslint-disable-next-line no-useless-return
        return;
      }
    })();
    return () => { mounted = false; };
  }, []);

  const label = useMemo(() => localPart(email), [email]);
  const usedPct = useMemo(() => {
    if (remaining == null || limit == null || limit <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((limit - remaining) / limit) * 100)));
  }, [remaining, limit]);
  const ringFg = useMemo(() => {
    if (remaining == null || limit == null) return "hsl(var(--muted-foreground))";
    return ringColor(remaining, limit);
  }, [remaining, limit]);

  return (
    <div className="flex items-center justify-between">
      {/* Credits ring indicator */}
      <div className="flex items-center gap-3" aria-label="Credits status">
        <div
          className="relative h-10 w-10"
          title={limit != null && remaining != null ? `${remaining}/${limit} left` : "Credits"}
        >
          {/* Track */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: "conic-gradient(hsl(var(--border)) 0deg, hsl(var(--border)) 360deg)" }}
          />
          {/* Progress */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(${ringFg} ${usedPct * 3.6}deg, transparent 0deg)` }}
          />
          {/* Inner circle */}
          <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
            <span className="text-[10px] font-medium text-muted-foreground">
              {remaining != null && limit != null ? remaining : "—"}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate max-w-[9rem]">{label}</p>
          {limit != null && remaining != null && (
            <p className="text-[11px] text-muted-foreground">
              {remaining} left
            </p>
          )}
        </div>
      </div>

      {/* Three-dot menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open menu">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="h-4 w-4 mr-2" /> Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="h-4 w-4 mr-2" /> Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="h-4 w-4 mr-2" /> System
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">Profile settings</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
