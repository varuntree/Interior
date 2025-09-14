"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/libs/utils";
import { Folder, Heart, Pencil, Trash2 } from "lucide-react";

interface Props {
  id: string;
  name: string;
  itemCount: number;
  isDefaultFavorites?: boolean;
  className?: string;
  onOpen?: (id: string) => void;
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function CollectionCard({
  id,
  name,
  itemCount,
  isDefaultFavorites,
  className,
  onOpen,
  onRename,
  onDelete,
}: Props) {
  return (
    <Link href={`/dashboard/collections/${id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card
        className={cn(
          "group overflow-hidden transition-all border-border hover:border-primary/40 hover:shadow-md",
          isDefaultFavorites && "border-primary/30",
          className
        )}
      >
        <CardContent className="p-0">
          <div className="relative aspect-square">
            {/* Tile base */}
            <div className={cn(
              "absolute inset-0 rounded-lg border bg-card flex items-center justify-center",
              isDefaultFavorites ? "bg-primary/5 border-primary/20" : "bg-accent/20 border-border"
            )}>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md",
                isDefaultFavorites ? "text-primary" : "text-foreground/80"
              )}>
                {isDefaultFavorites ? <Heart className="h-8 w-8" /> : <Folder className="h-8 w-8" />}
              </div>
            </div>

            {/* Name bar */}
            <div className="absolute inset-x-2 bottom-2">
              <div className={cn(
                "rounded-md px-1.5 py-1 border backdrop-blur-md",
                "bg-popover/85 text-popover-foreground border-border",
                "truncate"
              )} title={name}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium truncate">{name}</span>
                    {isDefaultFavorites && (
                      <span className="text-[9px] uppercase tracking-wide px-1 py-0.5 rounded bg-primary/15 text-primary border border-primary/20 whitespace-nowrap">
                        Default
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px] py-0.5">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Desktop hover actions */}
            <div className="absolute inset-x-2 top-2 hidden md:block z-10">
              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 rounded-md px-1.5 py-1 backdrop-blur-md bg-popover/90 border border-border">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-1.5"
                    onClick={(e) => { if (onOpen) { e.preventDefault(); e.stopPropagation(); onOpen(id); } }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onKeyDown={(e) => { e.stopPropagation(); }}
                  >
                    Open
                  </Button>
                  {!isDefaultFavorites && (
                    <>
                      <Button size="sm" variant="secondary" className="h-7 w-7 p-0" aria-label="Rename"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename?.(id); }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onKeyDown={(e) => { e.stopPropagation(); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-7 w-7 p-0 text-destructive" aria-label="Delete"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(id); }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onKeyDown={(e) => { e.stopPropagation(); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile actions */}
            <div className="absolute inset-x-2 top-2 md:hidden">
              <div className="flex justify-end">
                <div className="flex items-center gap-1 rounded-md px-1.5 py-1 backdrop-blur-md bg-popover/90 border border-border">
                  <Button size="sm" variant="secondary" className="h-7 px-1.5"
                    onClick={(e) => { if (onOpen) { e.preventDefault(); e.stopPropagation(); onOpen(id); } }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onKeyDown={(e) => { e.stopPropagation(); }}
                  >
                    Open
                  </Button>
                  {!isDefaultFavorites && (
                    <>
                      <Button size="sm" variant="secondary" className="h-7 w-7 p-0" aria-label="Rename"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename?.(id); }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onKeyDown={(e) => { e.stopPropagation(); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-7 w-7 p-0 text-destructive" aria-label="Delete"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(id); }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onKeyDown={(e) => { e.stopPropagation(); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default CollectionCard;
