"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PricingSection from "@/components/marketing/PricingSection";

type UsageResponse = {
  success: boolean;
  data?: { billing?: { hasAccess?: boolean } };
};

export function PaywallGate() {
  const [open, setOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/v1/usage", { cache: "no-store" });
        if (!res.ok) throw new Error("usage_fetch_failed");
        const json = (await res.json()) as UsageResponse;
        const access = json?.data?.billing?.hasAccess === true;
        if (mounted) {
          setHasAccess(access);
          setOpen(!access);
        }
      } catch {
        // Fail-closed: if usage check fails, require subscription
        if (mounted) {
          setHasAccess(false);
          setOpen(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Render nothing until we know access state or already subscribed
  if (hasAccess === null || hasAccess === true) return null;

  return (
    <Dialog open={open} onOpenChange={() => { /* hard paywall: non-dismissable */ }}>
      <DialogContent className="sm:max-w-4xl w-[95vw]" hideDefaultClose>
        {/* Reuse full pricing component inside the modal to show full plan details */}
        <div className="-mx-4 sm:mx-0">
          <PricingSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PaywallGate;
