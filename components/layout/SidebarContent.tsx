"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/libs/utils";
import { Badge } from "@/components/ui/badge";
import { Wand2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarProfile } from "./SidebarProfile";
import { primaryNav, secondaryNav } from "./nav.config";
import { NavLink } from "./NavLink";
import { Logo } from "@/components/shared/Logo";

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
        <Link href="/dashboard" className="flex items-center" onClick={onNavigate}>
          <Logo />
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
      <div className="border-t border-sidebar-border p-4">
        <SidebarProfile />
      </div>
    </div>
  );
}
