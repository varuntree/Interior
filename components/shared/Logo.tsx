"use client";

import { cn } from "@/libs/utils";
import { Home, Sparkles } from "lucide-react";
import React from "react";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg"; // controls the glyph box size
};

export function Logo({ className, showWordmark = true, size = "md" }: LogoProps) {
  const boxSize = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const homeSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-5 w-5" : "h-5 w-5";
  const sparklesSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg",
          "bg-gradient-to-br from-primary to-accent",
          "shadow-sm",
          boxSize
        )}
        aria-hidden
      >
        <Home className={cn(homeSize, "text-primary-foreground drop-shadow-sm") as string} />
        <Sparkles
          className={cn(
            sparklesSize,
            "text-yellow-400 absolute -top-1 -right-1 drop-shadow"
          )}
        />
      </span>
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight select-none">
          Interior AI
        </span>
      )}
    </span>
  );
}

export default Logo;
