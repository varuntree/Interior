"use client";
/* eslint-disable no-unused-vars */

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AppImage from "@/components/shared/Image";
import { cn } from "@/libs/utils";
import { X, Trash2, Download } from "lucide-react";
import { appendDownloadParam, sanitizeFilename, triggerDownload } from "@/libs/url/download";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string;
  onDelete?: () => Promise<void> | void;
  deleting?: boolean;
  deleteLabel?: string;
  className?: string;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  imageUrl,
  title,
  onDelete,
  deleting,
  deleteLabel = "Delete",
  className,
}: ImageViewerDialogProps) {
  const descId = "image-viewer-desc";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideDefaultClose
        aria-describedby={descId}
        className={cn(
          "overflow-hidden sm:rounded-xl p-0 bg-card border border-border shadow-2xl w-[96vw] max-w-[min(96vw,1200px)]",
          className
        )}
      >
        <p id={descId} className="sr-only">Image viewer dialog</p>
        <div className="p-2 md:p-3">
          <div className="relative w-full" style={{ height: "min(85vh, 85svh)" }}>
          {/* Image */}
          <AppImage
            src={imageUrl}
            alt={title || "Image"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 90vw"
            priority={false}
          />

          {/* Floating controls — desktop */}
          <div className="hidden md:flex absolute top-3 right-3 items-center gap-2 z-10">
            {/* Download */}
            <Button
              size="sm"
              variant="secondary"
              className="h-9 w-9 p-0 rounded-full bg-popover/70 hover:bg-popover text-popover-foreground border border-border"
              onClick={() => {
                const base = title ? `interior-design-${title}` : 'interior-design';
                const filename = sanitizeFilename(base);
                const href = appendDownloadParam(imageUrl, filename);
                triggerDownload(href);
              }}
              aria-label="Download"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>

            {onDelete && (
              <Button
                size="sm"
                variant="secondary"
                className="h-9 w-9 p-0 rounded-full bg-red-600/85 hover:bg-red-600 text-white"
                onClick={onDelete}
                disabled={!!deleting}
                aria-label={deleteLabel}
                title={deleteLabel}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="h-9 w-9 p-0 rounded-full bg-popover/70 hover:bg-popover text-popover-foreground border border-border"
              onClick={() => onOpenChange(false)}
              aria-label="Close viewer"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Title chip — desktop */}
          {title && (
            <div className="hidden md:block absolute bottom-3 left-3 z-10">
              <div className="max-w-[60vw] truncate rounded-md bg-popover/80 text-popover-foreground text-xs px-2 py-1 border border-border">
                {title}
              </div>
            </div>
          )}

          {/* Bottom actions — mobile (bigger touch targets) */}
          <div className="md:hidden absolute inset-x-0 bottom-0 p-3 z-10">
            <div className="mx-auto max-w-md rounded-xl border border-border bg-popover/90 text-popover-foreground backdrop-blur px-3 py-2 flex items-center justify-end gap-2">
              {/* Download */}
              <Button
                size="sm"
                variant="secondary"
                className="h-10 w-10 p-0 rounded-full bg-popover/80 hover:bg-popover"
                onClick={() => {
                  const base = title ? `interior-design-${title}` : 'interior-design';
                  const filename = sanitizeFilename(base);
                  const href = appendDownloadParam(imageUrl, filename);
                  triggerDownload(href);
                }}
                aria-label="Download"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </Button>

              {onDelete && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-10 w-10 p-0 rounded-full bg-red-600/85 hover:bg-red-600"
                  onClick={onDelete}
                  disabled={!!deleting}
                  aria-label={deleteLabel}
                  title={deleteLabel}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="h-10 w-10 p-0 rounded-full bg-white/90 text-black hover:bg-white"
                onClick={() => onOpenChange(false)}
                aria-label="Close viewer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageViewerDialog;
