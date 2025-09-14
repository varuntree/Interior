'use client';

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApplySettings } from "@/components/community";
import { ImageCard } from "@/components/shared/ImageCard";
import { ImageViewerDialog } from "@/components/shared/ImageViewerDialog";
import { Sparkles } from "lucide-react";
import { apiFetch } from "@/libs/api/http";
import { toast } from "sonner";
import { CollectionPickerDialog } from "@/components/collections/CollectionPickerDialog";
import runtimeConfig from "@/libs/app-config/runtime";
import { useRouter } from "next/navigation";

type CommunityItemDTO = {
  id: string;
  imageUrl: string;
  thumbUrl?: string;
  applySettings?: any;
  createdAt: string;
  // optional render linkage when available in future
  render?: { id: string } | null;
}

export default function CommunityPage() {
  const communityEnabled = !!runtimeConfig.featureFlags?.community;
  const collectionsEnabled = !!runtimeConfig.featureFlags?.collections;
  const router = useRouter();
  const [items, setItems] = useState<CommunityItemDTO[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { applySettings } = useApplySettings();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerItem, setPickerItem] = useState<{ type: 'render'|'community'; id: string } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewer, setViewer] = useState<{ id: string; url: string; title?: string } | null>(null);

  const fetchPage = async (next?: string) => {
    try {
      if (!next) setLoading(true); else setLoadingMore(true);
      const params = new URLSearchParams();
      params.set('limit', '24');
      if (next) params.set('cursor', next);
      const res = await apiFetch(`/api/v1/community?${params.toString()}`);
      if (!res.success) throw new Error(res.error?.message || 'Failed to load community');
      const data = res.data as { items: CommunityItemDTO[]; nextCursor?: string };
      setItems((prev) => next ? [...prev, ...data.items] : data.items);
      setCursor(data.nextCursor);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load community');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { if (communityEnabled) { fetchPage(); } }, [communityEnabled]);

  const onAddToCollection = (id: string, isCommunity = false) => {
    if (!collectionsEnabled) return;
    setPickerItem({ type: isCommunity ? 'community' : 'render', id });
    setPickerOpen(true);
  };

  if (!communityEnabled) {
    return (
      <div className="space-y-6 p-6">
        <DashboardHeader title="Community" subtitle="This feature is currently unavailable" />
        <Button onClick={() => router.replace('/dashboard')}>Back to Create</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="Community" 
        subtitle="A continuous gallery of curated inspiration"
      >
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Curated
        </Badge>
      </DashboardHeader>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const id = item.render?.id || item.id;
            const url = item.thumbUrl || item.imageUrl;
            return (
                <ImageCard
                  key={item.id}
                  id={id}
                  imageUrl={url}
                  canFavorite={false}
                  canAddToCollection={collectionsEnabled}
                  canDelete={false}
                  canApplySettings={false}
                  onAddToCollection={collectionsEnabled ? () => onAddToCollection(id, !item.render?.id) : undefined}
                  onOpen={() => { setViewer({ id, url: item.imageUrl, title: undefined }); setViewerOpen(true); }}
                />
              );
          })}
        </div>
      )}

      {/* Load more */}
      {cursor && (
        <div className="flex justify-center py-6">
          <Button onClick={() => fetchPage(cursor)} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}

      {collectionsEnabled && (
      <CollectionPickerDialog
        open={pickerOpen}
        onOpenChange={(o) => { setPickerOpen(o); if (!o) setPickerItem(null); }}
        item={pickerItem}
        onAdded={() => { toast.success('Added to collection'); }}
      />)}

      {/* Image viewer */}
      <ImageViewerDialog
        open={viewerOpen}
        onOpenChange={(o) => { setViewerOpen(o); if (!o) setViewer(null); }}
        imageUrl={viewer?.url || ''}
        title={viewer?.title}
      />
    </div>
  );
}
