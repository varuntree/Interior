"use client";
/* eslint-disable no-unused-vars */

import React from "react";
import { cn } from "@/libs/utils";
import AppImage from "@/components/shared/Image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, FolderPlus, Eye, Trash2, Loader2, Download } from "lucide-react";
import { appendDownloadParam, sanitizeFilename, triggerDownload } from "@/libs/url/download";

export interface ImageCardProps {
  id: string;
  imageUrl: string;
  thumbUrl?: string;
  title?: string;
  meta?: string;
  className?: string;

  // Actions (all optional, visibility determined by presence or flags)
  onOpen?: (id: string) => void;
  onToggleFavorite?: (id: string) => Promise<void> | void;
  onAddToCollection?: (id: string) => void;
  onDelete?: (id: string) => Promise<void> | void;
  onApplySettings?: (id: string) => void;

  // State/visibility toggles
  isFavorite?: boolean;
  canFavorite?: boolean;
  canAddToCollection?: boolean;
  canDelete?: boolean;
  canApplySettings?: boolean;
  showMeta?: boolean;
}

export function ImageCard({
  id,
  imageUrl,
  thumbUrl,
  title,
  meta,
  className,
  onOpen,
  onToggleFavorite,
  onAddToCollection,
  onDelete,
  onApplySettings,
  isFavorite = false,
  canFavorite = true,
  canAddToCollection = true,
  canDelete = false,
  canApplySettings = false,
  showMeta = false,
}: ImageCardProps) {
  const [pendingFavorite, setPendingFavorite] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(false);

  const handleFavorite = async () => {
    if (!onToggleFavorite || pendingFavorite) return;
    try {
      const maybePromise = onToggleFavorite(id);
      if (maybePromise && typeof (maybePromise as any).then === "function") {
        setPendingFavorite(true);
        await maybePromise;
      }
    } finally {
      setPendingFavorite(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || pendingDelete) return;
    try {
      const maybePromise = onDelete(id);
      if (maybePromise && typeof (maybePromise as any).then === "function") {
        setPendingDelete(true);
        await maybePromise;
      }
    } finally {
      setPendingDelete(false);
    }
  };

  return (
    <Card className={cn("group overflow-hidden rounded-lg", className)}>
      <CardContent className="p-0">
        <div className={cn("relative aspect-square bg-muted", isFavorite && "ring-2 ring-primary/50")}>
          <AppImage
            src={thumbUrl || imageUrl}
            alt={title || "Image"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
            showLoader
          />

          {/* Favorite badge */}
          {isFavorite && (
            <div className="absolute top-2 left-2 px-2 py-0.5 text-xs rounded-md bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/30 dark:border-white/10 text-primary">
              Favorite
            </div>
          )}

          {/* Desktop hover dim overlay */}
          <div className="absolute inset-0 hidden md:block bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Desktop bottom actions (show on hover) */}
          <div className="absolute inset-x-2 bottom-2 hidden md:block">
            <div className="flex items-center justify-between rounded-lg px-2 py-1.5 backdrop-blur-md bg-popover/80 text-popover-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  {canFavorite && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className={cn("h-8 w-8 p-0", isFavorite && "text-primary")}
                      aria-pressed={isFavorite}
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      onClick={handleFavorite}
                      disabled={pendingFavorite}
                    >
                      {pendingFavorite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                    </Button>
                  )}

                  {canAddToCollection && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      aria-label="Add to collection"
                      onClick={() => onAddToCollection?.(id)}
                    >
                      <FolderPlus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Download */}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    aria-label="Download"
                    onClick={() => {
                      const filename = sanitizeFilename(`interior-design-${id}.jpg`);
                      const href = appendDownloadParam(imageUrl, filename);
                      triggerDownload(href);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    aria-label="View"
                    onClick={() => onOpen?.(id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {canDelete && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 text-destructive"
                      aria-label="Delete"
                      onClick={handleDelete}
                      disabled={pendingDelete}
                    >
                      {pendingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  )}

                  {canApplySettings && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      aria-label="Apply settings"
                      onClick={() => onApplySettings?.(id)}
                    >
                      {/* Reuse Eye icon for now if Sparkles not desired in core card */}
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
            </div>
          </div>

          {/* Mobile bottom actions (always visible, glassy, no dim overlay) */}
          <div className="absolute inset-x-2 bottom-2 md:hidden">
            <div className="flex items-center justify-between rounded-lg px-2 py-2 backdrop-blur-md bg-popover/90 text-popover-foreground border border-border shadow-sm">
              <div className="flex items-center gap-1">
                {canFavorite && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className={cn("h-8 w-8 p-0", isFavorite && "text-primary")}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    onClick={handleFavorite}
                    disabled={pendingFavorite}
                  >
                    {pendingFavorite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                  </Button>
                )}

                {canAddToCollection && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    aria-label="Add to collection"
                    onClick={() => onAddToCollection?.(id)}
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Download */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0"
                  aria-label="Download"
                  onClick={() => {
                    const filename = sanitizeFilename(`interior-design-${id}.jpg`);
                    const href = appendDownloadParam(imageUrl, filename);
                    triggerDownload(href);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0"
                  aria-label="View"
                  onClick={() => onOpen?.(id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>

                {canDelete && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 text-destructive"
                    aria-label="Delete"
                    onClick={handleDelete}
                    disabled={pendingDelete}
                  >
                    {pendingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                )}

                {canApplySettings && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    aria-label="Apply settings"
                    onClick={() => onApplySettings?.(id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {(showMeta && (title || meta)) && (
          <div className="p-3 text-sm text-muted-foreground">
            <span className="truncate block" title={title}>{title}</span>
            {meta && <span className="truncate block text-xs">{meta}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ImageCard;
