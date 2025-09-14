"use client";

import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AppImage from "@/components/shared/Image";
import { cn } from "@/libs/utils";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-5xl p-0 sm:rounded-lg overflow-hidden", className)}>
        {title && (
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="truncate" title={title}>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="relative w-full min-h-[40vh] sm:min-h-[60vh] bg-background">
          <AppImage
            src={imageUrl}
            alt={title || "Rendered image"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority={false}
          />
        </div>
        <DialogFooter className="px-4 pb-4 pt-2">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} disabled={!!deleting}>
              {deleting ? "Deleting…" : deleteLabel}
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImageViewerDialog;

