"use client";
/* eslint-disable no-unused-vars */

import { Mode } from "@/libs/app-config/runtime";
import { cn } from "@/libs/utils";
import { Wand2, Upload, Settings2, Sparkles } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModeSelectorProps {
  selectedMode: Mode;
  onModeChange: (mode: Mode) => void;
  disabled?: boolean;
}

const modes = [
  {
    id: 'redesign' as Mode,
    label: 'Redesign',
    icon: Wand2,
    description: 'Keep room structure, restyle furnishings and decor with your chosen aesthetic',
    shortDesc: 'Keep structure, restyle furnishings'
  },
  {
    id: 'staging' as Mode,
    label: 'Staging',
    icon: Upload,
    description: 'Furnish empty or partly empty rooms with tasteful furniture and decor',
    shortDesc: 'Furnish empty or sparse rooms'
  },
  {
    id: 'compose' as Mode,
    label: 'Compose',
    icon: Settings2,
    description: 'Merge two inputs: use base room architecture with reference style/objects',
    shortDesc: 'Merge two inputs: room + reference'
  },
  {
    id: 'imagine' as Mode,
    label: 'Imagine',
    icon: Sparkles,
    description: 'Generate completely new interior concepts from text descriptions only',
    shortDesc: 'Text-only ideation mode'
  }
];

export function ModeSelector({ selectedMode, onModeChange, disabled = false }: ModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Generation Mode</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to transform your space
        </p>
      </div>
      
      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            
            return (
              <Tooltip key={mode.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !disabled && onModeChange(mode.id)}
                    disabled={disabled}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all duration-200",
                      "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      "text-left space-y-2 min-h-[120px]",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50 bg-card",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                    )}
                    
                    {/* Icon */}
                    <div className={cn(
                      "p-2 rounded-md w-fit",
                      isSelected ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    
                    {/* Content */}
                    <div>
                      <h4 className={cn(
                        "font-semibold text-sm",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {mode.label}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {mode.shortDesc}
                      </p>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">{mode.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
