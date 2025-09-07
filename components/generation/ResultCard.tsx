"use client";
/* eslint-disable no-unused-vars */

import React, { memo, useState } from "react";
import Image from "next/image";
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Download, 
  Heart, 
  FolderPlus, 
  RotateCcw, 
  Copy, 
  Eye,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import { GenerationResult } from "@/contexts/GenerationContext";
import { toast } from "sonner";

interface ResultCardProps {
  result: GenerationResult;
  mode?: string;
  roomType?: string;
  style?: string;
  prompt?: string;
  onAddToFavorites?: (resultId: string) => void;
  onAddToCollection?: (resultId: string) => void;
  onRerun?: () => void;
  onDownload?: (result: GenerationResult) => void;
  className?: string;
}

function ResultCardInner({
  result,
  mode,
  roomType,
  style,
  prompt,
  onAddToFavorites,
  onAddToCollection,
  onRerun,
  onDownload,
  className
}: ResultCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);

  const handleAddToFavorites = async () => {
    if (!onAddToFavorites) return;
    
    setIsAddingToFavorites(true);
    try {
      await onAddToFavorites(result.id);
      toast.success('Added to My Favorites');
    } catch (error) {
      toast.error('Failed to add to favorites');
    } finally {
      setIsAddingToFavorites(false);
    }
  };

  const handleCopyPrompt = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied to clipboard');
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(result);
    } else {
      // Default download behavior with inferred extension
      const link = document.createElement('a');
      link.href = result.url;
      const extMatch = result.url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      link.download = `interior-design-${result.index + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className={cn("group overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square bg-muted">
          {!imageError ? (
            <Image
              src={result.thumbUrl || result.url}
              alt={`Generated design variant ${result.index + 1}`}
              fill
              className={cn(
                "object-cover transition-all duration-300",
                "group-hover:scale-105",
                imageLoading && "blur-sm"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Eye className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Failed to load image</p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute top-2 right-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0">
                  <div className="relative aspect-square">
                    <Image
                      src={result.url}
                      alt={`Generated design variant ${result.index + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 80vw"
                      loading="lazy"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="p-3 bg-background border-t">
          <div className="flex items-center justify-between">
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddToFavorites}
                disabled={isAddingToFavorites}
                className="h-8 px-2"
              >
                {isAddingToFavorites ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
                <span className="sr-only">Add to favorites</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                className="h-8 px-2"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download</span>
              </Button>
            </div>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddToCollection?.(result.id)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Add to Collection
                </DropdownMenuItem>
                
                {prompt && (
                  <DropdownMenuItem onClick={handleCopyPrompt}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={onRerun}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Generate Similar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Metadata */}
          {(mode || roomType || style) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {mode && (
                <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                  {mode}
                </span>
              )}
              {roomType && (
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {roomType}
                </span>
              )}
              {style && (
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {style}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function propsEqual(prev: ResultCardProps, next: ResultCardProps) {
  return (
    prev.result.id === next.result.id &&
    prev.result.url === next.result.url &&
    prev.result.thumbUrl === next.result.thumbUrl &&
    prev.result.index === next.result.index &&
    prev.mode === next.mode &&
    prev.roomType === next.roomType &&
    prev.style === next.style &&
    prev.prompt === next.prompt &&
    prev.onAddToFavorites === next.onAddToFavorites &&
    prev.onAddToCollection === next.onAddToCollection &&
    prev.onRerun === next.onRerun &&
    prev.onDownload === next.onDownload &&
    prev.className === next.className
  );
}

export const ResultCard = memo(ResultCardInner, propsEqual);
