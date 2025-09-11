import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { SidebarDesktop } from "@/components/layout/SidebarDesktop";
import { SidebarMobile } from "@/components/layout/SidebarMobile";

export default async function LayoutPrivate({ children }: { children: ReactNode }) {
  // Use the same pattern as the /api/v1/auth/me route
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <SidebarDesktop />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarMobile />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">IA</span>
            </div>
            <span className="font-semibold text-foreground">Interior AI</span>
          </div>
          <div className="w-10" /> {/* Spacer for balance */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
