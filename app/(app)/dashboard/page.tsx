"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GenerationProvider } from "@/contexts/GenerationContext";
import { GenerationWorkspaceFinal } from "@/components/generation/GenerationWorkspaceFinal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function DashboardCreatePage() {
  const searchParams = useSearchParams();
  const [prefillData, setPrefillData] = useState<any>(null);
  const [showCommunityAlert, setShowCommunityAlert] = useState(false);

  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'community') {
      const prefill: any = {};
      if (searchParams.get('mode')) prefill.mode = searchParams.get('mode');
      if (searchParams.get('roomType')) prefill.roomType = searchParams.get('roomType');
      if (searchParams.get('style')) prefill.style = searchParams.get('style');
      if (searchParams.get('prompt')) prefill.prompt = searchParams.get('prompt');

      if (Object.keys(prefill).length > 0) {
        const isDifferent = JSON.stringify(prefillData) !== JSON.stringify(prefill);
        if (isDifferent) {
          setPrefillData(prefill);
          setShowCommunityAlert(true);
          const timeout = setTimeout(() => setShowCommunityAlert(false), 5000);
          return () => clearTimeout(timeout);
        }
      }
    }
    return undefined;
  }, [searchParams, prefillData]);

  return (
    <GenerationProvider initialValues={prefillData}>
      <div className="space-y-6 p-6">
        <DashboardHeader
          title="Create Design"
          subtitle="Transform your space with AI-powered interior design"
        />

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

        <GenerationWorkspaceFinal />
      </div>
    </GenerationProvider>
  );
}
