"use client";

import { SidebarContent } from "./SidebarContent";

export function SidebarDesktop() {
  return (
    <aside className="hidden md:flex h-full border-r border-sidebar-border">
      <SidebarContent />
    </aside>
  );
}
