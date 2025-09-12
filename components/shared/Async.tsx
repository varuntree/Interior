"use client";

import React from "react";
import { cn } from "@/libs/utils";
import { LoadingStates } from "@/components/dashboard/LoadingStates";

type AsyncState = "idle" | "submitting" | "processing" | "succeeded" | "failed";

export function AsyncStateBanner({ state, className }: { state: AsyncState; className?: string }) {
  const label = {
    idle: "",
    submitting: "Submitting…",
    processing: "Processing…",
    succeeded: "Completed",
    failed: "Failed",
  }[state];
  if (!label) return null;
  return (
    <div className={cn("rounded-md border bg-muted/40 px-3 py-2 text-sm", className)}>{label}</div>
  );
}

export function StandardLoading({ className }: { className?: string }) {
  return <LoadingStates.grid className={className} />;
}

export function StandardError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-md border p-4 text-sm">
      <div className="mb-2 text-destructive">{message || "Something went wrong"}</div>
      {onRetry && (
        <button onClick={onRetry} className="text-sm underline">
          Try again
        </button>
      )}
    </div>
  );
}

