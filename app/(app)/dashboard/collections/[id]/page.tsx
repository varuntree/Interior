"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useCollectionDetail, type CollectionItem } from "@/hooks/useCollectionDetail";
import { toast } from "sonner";
import { ImageCard } from "@/components/shared/ImageCard";
import { CollectionPickerDialog } from "@/components/collections/CollectionPickerDialog";
import { apiFetch } from "@/libs/api/http";
import { ImageViewerDialog } from "@/components/shared/ImageViewerDialog";
import runtimeConfig from "@/libs/app-config/runtime";

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const collectionsEnabled = !!runtimeConfig.featureFlags?.collections;
  const { data, items, loading, error, hasMore, loadingMore, fetchMore, refetch, removeItem } = useCollectionDetail(params?.id);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerItem, setPickerItem] = React.useState<{ type: 'render'|'community'; id: string } | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerItem, setViewerItem] = React.useState<CollectionItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  if (!collectionsEnabled) {
    return (
      <div className="space-y-6 p-6">
        <DashboardHeader title="Collections" subtitle="This feature is currently unavailable" />
        <Button onClick={() => router.replace('/dashboard/renders')}>Go to My Renders</Button>
      </div>
    );
  }

  const onRemove = async (item: any) => {
    try {
      await removeItem(item);
      toast.success('Removed from collection');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove');
    }
  };

  const openViewer = (item: CollectionItem) => {
    setViewerItem(item);
    setViewerOpen(true);
  };

  const handleViewerDelete = async () => {
    if (!viewerItem) return;
    try {
      setDeleting(true);
      await removeItem(viewerItem);
      setViewerOpen(false);
      setViewerItem(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <DashboardHeader 
          title={data?.collection.name || 'Collection'} 
          subtitle="Manage items in this collection"
        >
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {items.length} items
          </Badge>
        </DashboardHeader>
        <Button variant="outline" onClick={() => router.push('/dashboard/collections')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      {loading && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg border" />
          ))}
        </div>
      )}
      {error && <div className="text-destructive">{error}</div>}

      {data && (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => {
              if (it.type === 'render') {
                return (
                  <ImageCard
                    key={`r-${it.renderId}-${it.addedAt}`}
                    id={it.render.id}
                    imageUrl={it.render.coverImageUrl || "/placeholder.png"}
                    showMeta={false}
                    canFavorite
                    canAddToCollection
                    canDelete
                    onToggleFavorite={async (id) => {
                      try {
                        await apiFetch('/api/v1/favorites/toggle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ generationId: id })
                        });
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to toggle favorite');
                      }
                    }}
                    onAddToCollection={(id) => { setPickerItem({ type: 'render', id }); setPickerOpen(true); }}
                    onOpen={() => openViewer(it)}
                    onDelete={() => onRemove(it)}
                  />
                );
              }
              // community item within a collection
              return (
                <ImageCard
                  key={`c-${it.communityImageId}-${it.addedAt}`}
                  id={it.communityImageId}
                  imageUrl={it.imageUrl}
                  canFavorite={false}
                  canAddToCollection
                  canDelete
                  onAddToCollection={(id) => { setPickerItem({ type: 'community', id }); setPickerOpen(true); }}
                  onOpen={() => openViewer(it)}
                  onDelete={() => onRemove(it)}
                />
              );
            })}
          </div>

          {items.length > 0 && hasMore && (
            <div className="flex justify-center py-6">
              <Button onClick={() => fetchMore()} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}

          <CollectionPickerDialog
            open={pickerOpen}
            onOpenChange={(o) => { setPickerOpen(o); if (!o) setPickerItem(null); }}
            item={pickerItem}
            onAdded={() => { toast.success('Added to collection'); refetch(); }}
          />

          {/* Unified Image Viewer */}
          <ImageViewerDialog
            open={viewerOpen}
            onOpenChange={(o) => { setViewerOpen(o); if (!o) setViewerItem(null); }}
            imageUrl={(viewerItem?.type === 'render' ? (viewerItem.render.coverImageUrl || "") : (viewerItem?.type === 'community' ? viewerItem.imageUrl : ""))}
            title={viewerItem?.type === 'community' ? 'Community image' : undefined}
            onDelete={viewerItem ? handleViewerDelete : undefined}
            deleting={deleting}
          />
        </>
      )}
    </div>
  );
}
