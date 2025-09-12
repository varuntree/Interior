"use client"

import * as React from "react"
import { cn } from "@/libs/utils"

// Minimal, dependency-free radio group components to satisfy build without adding packages.

type RadioGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  onValueChange?: (_: string) => void
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, value, onValueChange, ...props }, ref) => (
    <div ref={ref} className={cn("grid gap-2", className)} {...props}>
      {/* Pass context via props cloning */}
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child as any, {
          checked: (child as any).props.value === value,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onValueChange?.(e.target.value),
        })
      })}
    </div>
  )
)
RadioGroup.displayName = "RadioGroup"

type RadioItemProps = React.InputHTMLAttributes<HTMLInputElement>

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioItemProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="radio"
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-input text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
