"use client";
/* eslint-disable no-unused-vars */

import React, { memo, useMemo } from "react";
import { cn } from "@/libs/utils";
import { ImageCard } from "@/components/shared/ImageCard";
import { ImageViewerDialog } from "@/components/shared/ImageViewerDialog";
import { GenerationResult } from "@/contexts/GenerationContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Download } from "lucide-react";
import runtimeConfig from "@/libs/app-config/runtime";

interface ResultsGridProps {
  results: GenerationResult[];
  mode?: string;
  roomType?: string;
  style?: string;
  prompt?: string;
  isLoading?: boolean;
  onAddToFavorites?: (renderId: string) => Promise<void>;
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

function ResultsGridInner({
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
  const collectionsEnabled = !!runtimeConfig.featureFlags?.collections;
  const count = results?.length ?? 0;
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewer, setViewer] = React.useState<{ id: string; url: string } | null>(null);

  const gridClass = useMemo(() => cn(
    "grid gap-4",
    count === 1 && "grid-cols-1 max-w-md mx-auto",
    count === 2 && "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto",
    count >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  ), [count]);

  const items = useMemo(() => (results || []).map((result) => (
    <ImageCard
      key={result.id}
      id={result.id}
      imageUrl={result.thumbUrl || result.url}
      canFavorite={collectionsEnabled && !!onAddToFavorites && !!result.renderId}
      canAddToCollection={collectionsEnabled && !!onAddToCollection && !!result.renderId}
      canDelete={false}
      showMeta={false}
      onToggleFavorite={collectionsEnabled && result.renderId && onAddToFavorites ? () => onAddToFavorites(result.renderId!) : undefined}
      onAddToCollection={collectionsEnabled && result.renderId && onAddToCollection ? () => onAddToCollection(result.renderId!) : undefined}
      onOpen={() => { setViewer({ id: result.id, url: result.url }); setViewerOpen(true); }}
    />
  )), [results, onAddToFavorites, onAddToCollection, collectionsEnabled]);

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
      <div className={gridClass}>{items}</div>

      <ImageViewerDialog
        open={viewerOpen}
        onOpenChange={(o) => { setViewerOpen(o); if (!o) setViewer(null); }}
        imageUrl={viewer?.url || ''}
        title={undefined}
      />

      {/* Bulk Actions */}
      {results.length > 1 && (
        <div className="flex justify-center gap-2 pt-4 border-t">
          <button
            onClick={() => {
              results.forEach((result) => {
                const link = document.createElement('a');
                link.href = result.url;
                // Infer extension from URL; default to jpg
                const extMatch = result.url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
                const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
                link.download = `interior-design-${result.index + 1}.${ext}`;
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

export const ResultsGrid = memo(ResultsGridInner);
