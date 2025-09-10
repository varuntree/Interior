"use client"

import * as React from "react"
import { cn } from "@/libs/utils"

// Minimal, dependency-free ScrollArea fallback to avoid adding new packages.
// Provides a styled overflow container compatible with existing usage.

type DivProps = React.HTMLAttributes<HTMLDivElement>

const ScrollArea = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative overflow-auto", className)} {...props}>
      {children}
    </div>
  )
)
ScrollArea.displayName = "ScrollArea"

const ScrollBar = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("hidden", className)} {...props} />
  )
)
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }
