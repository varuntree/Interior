"use client";

import { cn } from "@/libs/utils";
import { ResultCard } from "./ResultCard";
import { GenerationResult } from "@/contexts/GenerationContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Download } from "lucide-react";

interface ResultsGridProps {
  results: GenerationResult[];
  mode?: string;
  roomType?: string;
  style?: string;
  prompt?: string;
  isLoading?: boolean;
  onAddToFavorites?: (resultId: string) => Promise<void>;
  onAddToCollection?: (resultId: string) => void;
  onRerun?: () => void;
  onDownload?: (result: GenerationResult) => void;
  className?: string;
}

function ResultCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Skeleton className="aspect-square w-full" />
        <div className="p-3 border-t">
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResultsGrid({
  results,
  mode,
  roomType,
  style,
  prompt,
  isLoading = false,
  onAddToFavorites,
  onAddToCollection,
  onRerun,
  onDownload,
  className
}: ResultsGridProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold mb-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            Generating Your Design...
          </div>
          <p className="text-sm text-muted-foreground">
            This usually takes 60-90 seconds to complete
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ResultCardSkeleton />
          <ResultCardSkeleton />
          <ResultCardSkeleton />
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          Your Generated Designs
        </div>
        <p className="text-sm text-muted-foreground">
          {results.length} variant{results.length !== 1 ? 's' : ''} generated
          {mode && ` • ${mode.charAt(0).toUpperCase() + mode.slice(1)} mode`}
        </p>
      </div>

      {/* Results Grid */}
      <div className={cn(
        "grid gap-4",
        results.length === 1 && "grid-cols-1 max-w-md mx-auto",
        results.length === 2 && "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto",
        results.length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            mode={mode}
            roomType={roomType}
            style={style}
            prompt={prompt}
            onAddToFavorites={onAddToFavorites}
            onAddToCollection={onAddToCollection}
            onRerun={onRerun}
            onDownload={onDownload}
          />
        ))}
      </div>

      {/* Bulk Actions */}
      {results.length > 1 && (
        <div className="flex justify-center gap-2 pt-4 border-t">
          <button
            onClick={() => {
              results.forEach((result) => {
                const link = document.createElement('a');
                link.href = result.url;
                link.download = `interior-design-${result.index + 1}.webp`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              });
            }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="h-4 w-4" />
            Download All ({results.length})
          </button>
        </div>
      )}
    </div>
  );
}