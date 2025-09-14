'use client';

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommunityItem, useApplySettings } from "@/components/community";
import { Sparkles } from "lucide-react";
import { apiFetch } from "@/libs/api/http";
import { toast } from "sonner";
import { CollectionPickerDialog } from "@/components/collections/CollectionPickerDialog";

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
  const [items, setItems] = useState<CommunityItemDTO[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { applySettings } = useApplySettings();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerItem, setPickerItem] = useState<{ type: 'render'|'community'; id: string } | null>(null);

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

  useEffect(() => { fetchPage(); }, []);

  const onApplySettings = (settings: any) => applySettings(settings);

  const onToggleFavorite = async (renderIdOrCommunityId: string, isCommunity = false) => {
    try {
      await apiFetch('/api/v1/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isCommunity ? { communityImageId: renderIdOrCommunityId } : { generationId: renderIdOrCommunityId })
      });
      toast.success('Updated favorites');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update favorites');
    }
  };

  const onAddToCollection = (id: string, isCommunity = false) => {
    setPickerItem({ type: isCommunity ? 'community' : 'render', id });
    setPickerOpen(true);
  };

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
          {items.map((item) => (
            <CommunityItem
              key={item.id}
              item={item as any}
              onApplySettings={onApplySettings}
              onToggleFavorite={(id) => onToggleFavorite(item.render?.id || item.id, !item.render?.id)}
              onAddToCollection={(id) => onAddToCollection(item.render?.id || item.id, !item.render?.id)}
            />
          ))}
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

      <CollectionPickerDialog
        open={pickerOpen}
        onOpenChange={(o) => { setPickerOpen(o); if (!o) setPickerItem(null); }}
        item={pickerItem}
        onAdded={() => { toast.success('Added to collection'); }}
      />
    </div>
  );
}
