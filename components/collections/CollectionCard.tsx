"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/libs/utils";
import { FolderHeart, Heart } from "lucide-react";

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
  // Prefer whole-card click, with explicit Open button for clarity
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Link href={`/dashboard/collections/${id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      {children}
    </Link>
  );

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all border-border hover:border-primary/40 hover:shadow-md",
        isDefaultFavorites && "border-primary/30",
        className
      )}
    >
      <Wrapper>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-9 w-9 inline-flex items-center justify-center rounded-md border",
                isDefaultFavorites ? "bg-primary/10 border-primary/30 text-primary" : "bg-accent/40 border-border text-foreground"
              )}>
                {isDefaultFavorites ? <Heart className="h-4 w-4" /> : <FolderHeart className="h-4 w-4" />}
              </div>
              <CardTitle className="text-base truncate max-w-[16rem]" title={name}>
                {name}
              </CardTitle>
            </div>
            <Badge variant="secondary">{itemCount} {itemCount === 1 ? 'item' : 'items'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); onOpen ? onOpen(id) : null; }}>
              Open
            </Button>
            {!isDefaultFavorites && (
              <>
                <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); onRename?.(id); }}>
                  Rename
                </Button>
                <Button size="sm" variant="destructive" onClick={(e) => { e.preventDefault(); onDelete?.(id); }}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Wrapper>
    </Card>
  );
}

export default CollectionCard;

