"use client";
/* eslint-disable no-unused-vars */

import { useState, useEffect } from "react";
import { cn } from "@/libs/utils";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles } from "lucide-react";
import { Mode } from "@/libs/app-config/runtime";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  mode: Mode;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
}

const EXAMPLES_BY_MODE = {
  redesign: [
    "light oak floors, coastal color palette",
    "modern minimalist with warm textures",
    "industrial touches, exposed brick",
    "scandinavian style with natural light"
  ],
  staging: [
    "cozy living room with contemporary furniture",
    "elegant dining setup for entertaining",
    "productive home office with storage",
    "relaxing bedroom retreat"
  ],
  compose: [
    "incorporate the lighting from the reference",
    "match the color scheme and materials",
    "blend the furniture style seamlessly",
    "apply the texture and pattern elements"
  ],
  imagine: [
    "bright and airy coastal living room with white walls and blue accents",
    "modern kitchen with marble countertops and brass fixtures",
    "cozy reading nook with built-in shelving and natural light",
    "minimalist bedroom with warm wood tones and soft linens"
  ]
};

const MODE_LABELS = {
  redesign: "Redesign",
  staging: "Staging", 
  compose: "Compose",
  imagine: "Imagine"
};

export function PromptInput({
  value,
  onChange,
  mode,
  disabled = false,
  className,
  maxLength = 500
}: PromptInputProps) {
  const [charCount, setCharCount] = useState(0);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const isRequired = mode === 'imagine';
  const examples = EXAMPLES_BY_MODE[mode];
  const placeholder = mode === 'imagine' 
    ? "Describe the interior space you want to create..."
    : "Add any specific details or preferences (optional)...";

  const handleExampleClick = (example: string) => {
    onChange(example);
    setShowExamples(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Label and Description */}
      <div>
        <label className="text-sm font-medium leading-none">
          Description
          {isRequired && <span className="text-destructive ml-1">*</span>}
          {!isRequired && (
            <span className="text-muted-foreground ml-1 font-normal">(Optional)</span>
          )}
        </label>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'imagine' 
            ? "Describe the interior space you want to create in detail"
            : `Add specific details for your ${MODE_LABELS[mode].toLowerCase()} generation`
          }
        </p>
      </div>

      {/* Textarea */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            "min-h-[100px] resize-none",
            isRequired && !value && "border-destructive"
          )}
          aria-describedby={`prompt-char-count prompt-examples`}
        />
        
        {/* Character Counter */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {charCount}/{maxLength}
        </div>
      </div>

      {/* Examples Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            disabled={disabled}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lightbulb className="h-4 w-4" />
            {showExamples ? "Hide" : "Show"} example prompts
          </button>
          
          {isRequired && !value && (
            <Badge variant="destructive" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Required for {MODE_LABELS[mode]}
            </Badge>
          )}
        </div>

        {/* Example Prompts */}
        {showExamples && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Example prompts for {MODE_LABELS[mode]}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  disabled={disabled}
                  className={cn(
                    "text-left p-2 text-sm rounded-md transition-colors",
                    "bg-background hover:bg-muted border border-transparent",
                    "hover:border-border focus:outline-none focus:ring-2 focus:ring-ring",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
&ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {isRequired && (
        <p className="text-xs text-muted-foreground">
          💡 Tip: Be specific about colors, materials, lighting, and furniture style for best results.
        </p>
      )}
    </div>
  );
}
