"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GenerationProvider } from "@/contexts/GenerationContext";
import { GenerationWorkspace } from "@/components/generation/GenerationWorkspace";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Info } from "lucide-react";

export default function CreatePage() {
  const searchParams = useSearchParams();
  const [prefillData, setPrefillData] = useState<any>(null);
  const [showCommunityAlert, setShowCommunityAlert] = useState(false);

  useEffect(() => {
    // Check for community prefill parameters
    const source = searchParams.get('source');
    
    if (source === 'community') {
      const prefill: any = {};
      
      // Extract all possible parameters
      if (searchParams.get('mode')) prefill.mode = searchParams.get('mode');
      if (searchParams.get('roomType')) prefill.roomType = searchParams.get('roomType');
      if (searchParams.get('style')) prefill.style = searchParams.get('style');
      if (searchParams.get('prompt')) prefill.prompt = searchParams.get('prompt');
      if (searchParams.get('aspectRatio')) prefill.aspectRatio = searchParams.get('aspectRatio');
      if (searchParams.get('quality')) prefill.quality = searchParams.get('quality');
      if (searchParams.get('variants')) prefill.variants = parseInt(searchParams.get('variants') || '2');

      if (Object.keys(prefill).length > 0) {
        setPrefillData(prefill);
        setShowCommunityAlert(true);
        
        // Auto-hide alert after 5 seconds
        setTimeout(() => setShowCommunityAlert(false), 5000);
      }
    }
  }, [searchParams]);

  return (
    <GenerationProvider initialValues={prefillData}>
      <div className="space-y-6 p-6">
        <DashboardHeader 
          title="Create Design" 
          subtitle="Transform your space with AI-powered interior design"
        >
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Phase 7 Complete
          </Badge>
        </DashboardHeader>

        {/* Community Settings Applied Alert */}
        {showCommunityAlert && prefillData && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Community settings applied!</span>{' '}
              We&apos;ve prefilled the form with settings from the community design you selected.{' '}
              Feel free to modify them as needed.
            </AlertDescription>
          </Alert>
        )}

        <GenerationWorkspace />
      </div>
    </GenerationProvider>
  );
}