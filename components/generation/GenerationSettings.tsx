"use client";

import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
type AspectRatio = '1:1' | '3:2' | '2:3'
type Quality = 'auto' | 'low' | 'medium' | 'high'
import { Settings2, Square, RectangleHorizontal, RectangleVertical, Minus, Plus } from "lucide-react";

interface GenerationSettingsProps {
  aspectRatio: AspectRatio;
  quality: Quality;
  variants: number;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onQualityChange: (quality: Quality) => void;
  onVariantsChange: (variants: number) => void;
  disabled?: boolean;
  className?: string;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: any; description: string }[] = [
  {
    value: '1:1',
    label: 'Square',
    icon: Square,
    description: 'Perfect for Instagram posts'
  },
  {
    value: '3:2',
    label: 'Landscape',
    icon: RectangleHorizontal,
    description: 'Standard landscape format'
  },
  {
    value: '2:3',
    label: 'Portrait',
    icon: RectangleVertical,
    description: 'Standard portrait format'
  }
];

const QUALITY_OPTIONS: { value: Quality; label: string; description: string; badge?: string }[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Balanced quality and speed',
    badge: 'Recommended'
  },
  {
    value: 'low',
    label: 'Low',
    description: 'Faster generation, lower quality'
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Good balance of quality and speed'
  },
  {
    value: 'high',
    label: 'High',
    description: 'Best quality, slower generation'
  }
];

export function GenerationSettings({
  aspectRatio,
  quality,
  variants,
  onAspectRatioChange,
  onQualityChange,
  onVariantsChange,
  disabled = false,
  className
}: GenerationSettingsProps) {
  const MAX_VARIANTS_UI = 3

  const handleVariantsChange = (delta: number) => {
    const newValue = variants + delta;
    if (newValue >= 1 && newValue <= MAX_VARIANTS_UI) {
      onVariantsChange(newValue);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Accordion type="single" collapsible defaultValue="settings">
        <AccordionItem value="settings" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="font-medium">Generation Settings</span>
              <Badge variant="secondary" className="text-xs">
                {aspectRatio} • {quality} • {variants} variant{variants !== 1 ? 's' : ''}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              {/* Aspect Ratio */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Aspect Ratio</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => {
                    const Icon = ratio.icon;
                    const isSelected = aspectRatio === ratio.value;
                    
                    return (
                      <button
                        key={ratio.value}
                        onClick={() => !disabled && onAspectRatioChange(ratio.value)}
                        disabled={disabled}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all",
                          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
                          "text-center space-y-2",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Icon className={cn(
                          "h-6 w-6 mx-auto",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )} />
                        <div>
                          <p className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {ratio.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ratio.value}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quality */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quality</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {QUALITY_OPTIONS.map((option) => {
                    const isSelected = quality === option.value;
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => !disabled && onQualityChange(option.value)}
                        disabled={disabled}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all",
                          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
                          "text-left space-y-1",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {option.label}
                          </p>
                          {option.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {option.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Number of Variants</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVariantsChange(-1)}
                    disabled={disabled || variants <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold">{variants}</div>
                    <div className="text-xs text-muted-foreground">
                      variant{variants !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVariantsChange(1)}
                    disabled={disabled || variants >= MAX_VARIANTS_UI}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Generate 1-3 different variations of your design
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
