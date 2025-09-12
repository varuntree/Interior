"use client";

import { toast } from "sonner";

export function toastSuccess(message: string) {
  toast.success(message);
}

export function toastError(message: string) {
  toast.error(message);
}

export function toastInfo(message: string) {
  toast(message);
}

export const ToastCopy = {
  addedToCollection: "Added to collection",
  addedToFavorites: "Added to My Favorites",
  renderDeleted: "Render deleted",
  generationStarted: "Starting generation…",
  generationCompleted: (n: number) => `Generated ${n} variant${n !== 1 ? "s" : ""}!`,
  inflight: "Please wait until your current generation is complete",
  limitReached: "You have reached your monthly generation limit. Please upgrade your plan.",
};

