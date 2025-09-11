"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, FolderPlus, Eye, Trash2 } from "lucide-react";
import { cn } from "@/libs/utils";

interface RenderCardProps {
  id: string;
  imageUrl: string;
  title?: string;
  meta?: string;
  isFavorite?: boolean;
  onToggleFavorite: (id: string) => Promise<void> | void;
  onAddToCollection: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void> | void;
  className?: string;
}

export function RenderCard({
  id,
  imageUrl,
  title,
  meta,
  isFavorite,
  onToggleFavorite,
  onAddToCollection,
  onOpen,
  onDelete,
  className,
}: RenderCardProps) {
  return (
    <Card className={cn("group overflow-hidden relative", className)}>
      <CardContent className="p-0">
        <div className={cn(
          "relative aspect-square bg-muted",
          isFavorite && "ring-2 ring-primary/50"
        )}>
          <Image
            src={imageUrl}
            alt={title || "Render"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />

          {/* Favorite badge (subtle) */}
          {isFavorite && (
            <div className="absolute top-2 left-2 px-2 py-0.5 text-xs rounded-md bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/30 dark:border-white/10 text-primary">
              Favorite
            </div>
          )}

          {/* Glass-morphic controls (bottom overlay) */}
          <div className="absolute inset-x-2 bottom-2 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
            <div className="flex items-center justify-between rounded-lg px-2 py-1.5 backdrop-blur-md bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("h-8 w-8 p-0", isFavorite && "text-primary")}
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  onClick={() => onToggleFavorite(id)}
                >
                  <Heart className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label="Add to collection"
                  onClick={() => onAddToCollection(id)}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label="Open"
                  onClick={() => onOpen(id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  aria-label="Delete"
                  onClick={() => onDelete(id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Meta text (optional) */}
        {(title || meta) && (
          <div className="p-3 text-sm text-muted-foreground">
            <span className="truncate block">{title}</span>
            {meta && <span className="truncate block text-xs">{meta}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

