"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  Wand2, 
  Image, 
  FolderHeart, 
  Users, 
  Settings
} from "lucide-react";
import { cn } from "@/libs/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Create",
    href: "/dashboard/create",
    icon: Wand2,
    primary: true,
  },
  {
    name: "My Renders",
    href: "/dashboard/renders",
    icon: Image,
  },
  {
    name: "Collections",
    href: "/dashboard/collections",
    icon: FolderHeart,
  },
  {
    name: "Community",
    href: "/dashboard/community",
    icon: Users,
  },
];

const secondaryNavigation = [
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    // Check admin status in background; ignore errors
    fetch('/api/v1/admin/ensure', { method: 'POST' })
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (mounted && json?.success && json?.data?.isAdmin) setIsAdmin(true) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <div className={cn("flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border", className)}>
      {/* Logo/Brand Area */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            Interior AI
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                item.primary && "ring-1 ring-sidebar-primary/20"
              )}
            >
              <Icon className={cn("h-5 w-5", item.primary && "text-sidebar-primary")} />
              <span>{item.name}</span>
              {item.primary && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  New
                </Badge>
              )}
            </Link>
          );
        })}

        <Separator className="my-4" />

        {isAdmin && (
          <Link
            href="/dashboard/admin/community"
            className={cn(
              "flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
              pathname === '/dashboard/admin/community'
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <Users className="h-5 w-5" />
            <span>Admin</span>
          </Link>
        )}

        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-4 space-y-4">
        {/* Usage Badge - Placeholder for now */}
        <div className="flex items-center justify-between text-xs text-sidebar-foreground/70">
          <span>Generations used</span>
          <Badge variant="outline" className="text-xs">
            45/150
          </Badge>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-sidebar-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
