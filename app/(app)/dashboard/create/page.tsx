"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GenerationProvider } from "@/contexts/GenerationContext";
import { GenerationWorkspace } from "@/components/generation/GenerationWorkspace";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function CreatePage() {
  return (
    <GenerationProvider>
      <div className="space-y-6 p-6">
        <DashboardHeader 
          title="Create Design" 
          subtitle="Transform your space with AI-powered interior design"
        >
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Phase 6 Complete
          </Badge>
        </DashboardHeader>

        <GenerationWorkspace />
      </div>
    </GenerationProvider>
  );
}