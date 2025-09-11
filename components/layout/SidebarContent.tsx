"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import { cn } from "@/libs/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { primaryNav, secondaryNav } from "./nav.config";
import { NavLink } from "./NavLink";

export function SidebarContent({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/admin/ensure', { method: 'POST' })
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (mounted && json?.success && json?.data?.isAdmin) setIsAdmin(true); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div className={cn("flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground", className)}>
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center space-x-2" onClick={onNavigate}>
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Interior AI</span>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-1">
        {primaryNav.map((item) => (
          <NavLink key={item.name} href={item.href} onClick={onNavigate}>
            <item.icon className={cn("h-5 w-5", item.primary && "text-sidebar-primary")} />
            <span>{item.name}</span>
            {item.primary && (
              <Badge variant="secondary" className="ml-auto text-xs">New</Badge>
            )}
          </NavLink>
        ))}

        <Separator className="my-4" />

        {isAdmin && (
          <NavLink href="/dashboard/admin/community" onClick={onNavigate}>
            <Wand2 className="h-5 w-5" />
            <span>Admin</span>
          </NavLink>
        )}

        {secondaryNav.map((item) => (
          <NavLink key={item.name} href={item.href} onClick={onNavigate}>
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-sidebar-foreground/70">
          <span>Generations used</span>
          <Badge variant="outline" className="text-xs">45/150</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

