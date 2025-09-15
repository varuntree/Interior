"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type UsageResponse = {
  success: boolean;
  data?: {
    usage?: { remaining?: number };
  };
};

export function UsageSummaryPill() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/v1/usage", { cache: "no-store" });
        if (!res.ok) return;
        const json: UsageResponse = await res.json();
        if (mounted && json.success) {
          const rem = json.data?.usage?.remaining;
          if (typeof rem === "number") setRemaining(rem);
        }
      } catch {
        // swallow errors; pill is optional UI
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (remaining === null) return null;
  return (
    <Badge variant="secondary" aria-label={`Generations left: ${remaining}`}>
      Generations left: {remaining}
    </Badge>
  );
}

