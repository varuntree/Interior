"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Loader2, Plus, Sparkles } from "lucide-react";
import { useRenders } from "@/hooks/useRenders";
import { apiFetch } from "@/libs/api/http";
import { toast } from "sonner";
import { ImageCard } from "@/components/shared/ImageCard";
import React from "react";
import { CollectionPickerDialog } from "@/components/collections/CollectionPickerDialog";
import { ImageViewerDialog } from "@/components/shared/ImageViewerDialog";
import runtimeConfig from "@/libs/app-config/runtime";

export default function RendersPage() {
  const collectionsEnabled = !!runtimeConfig.featureFlags?.collections;
  const { items, loading, loadingMore, hasMore, fetchMore, refetch, error } = useRenders();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerItem, setPickerItem] = React.useState<{ type: 'render'|'community'; id: string } | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewer, setViewer] = React.useState<{ id: string; url: string; title?: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const onDelete = async (renderId: string) => {
    try {
      await apiFetch(`/api/v1/renders/${renderId}`, { method: 'DELETE' });
      toast.success('Render deleted');
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  };

  const onToggleFavorite = async (renderId: string) => {
    if (!collectionsEnabled) return;
    try {
      await apiFetch('/api/v1/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: renderId })
      });
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to toggle favorite');
    }
  };

  const onAddToCollection = (renderId: string) => {
    if (!collectionsEnabled) return;
    setPickerItem({ type: 'render', id: renderId });
    setPickerOpen(true);
  };

  const openViewer = (id: string, url: string, title?: string) => {
    setViewer({ id, url, title });
    setViewerOpen(true);
  };

  const handleViewerDelete = async () => {
    if (!viewer) return;
    try {
      setDeleting(true);
      await onDelete(viewer.id);
      setViewerOpen(false);
      setViewer(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 px-4 pb-6 pt-2 sm:space-y-6 sm:px-6 sm:pt-3">
      <DashboardHeader 
        title="My Renders" 
        subtitle="Browse and manage all your generated interior designs"
      >
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Gallery
        </Badge>
      </DashboardHeader>

      {/* Actions */}
      <div className="flex justify-end">
        <Button size="sm" asChild>
          <a href="/dashboard">
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </a>
        </Button>
      </div>

      {/* Grid */}
      {loading && items.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`render-skeleton-${idx}`}
              className="rounded-lg border bg-card/60 p-3 shadow-sm"
            >
              <div className="aspect-square animate-pulse rounded-md bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <EmptyState
          icon={<ImageIcon className="h-12 w-12" />}
          title="No renders yet"
          description="Start creating beautiful interior designs to see them here."
          action={{ label: "Create Your First Design", href: "/dashboard" }}
        />
      )}

      {!loading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">We couldn’t load your renders right now.</p>
          <p className="mt-1">{error}</p>
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={refetch}>
              Try again
            </Button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((r) => {
            return (
              <ImageCard
                key={r.id}
                id={r.id}
                imageUrl={r.cover_variant_url}
                showMeta={false}
                isFavorite={collectionsEnabled ? !!r.is_favorite : false}
                canFavorite={collectionsEnabled}
                canAddToCollection={collectionsEnabled}
                canDelete
                onToggleFavorite={collectionsEnabled ? onToggleFavorite : undefined}
                onAddToCollection={collectionsEnabled ? onAddToCollection : undefined}
                onOpen={(id) => openViewer(id, r.cover_variant_url)}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}

      {items.length > 0 && hasMore && (
        <div className="flex justify-center py-6">
          <Button onClick={() => fetchMore()} disabled={loadingMore}>
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}

      {collectionsEnabled && (
      <CollectionPickerDialog
        open={pickerOpen}
        onOpenChange={(o) => { setPickerOpen(o); if (!o) setPickerItem(null); }}
        item={pickerItem}
        onAdded={() => { toast.success('Added to collection'); refetch(); }}
      />)}

      {/* Unified Image Viewer */}
      <ImageViewerDialog
        open={viewerOpen}
        onOpenChange={(o) => { setViewerOpen(o); if (!o) setViewer(null); }}
        imageUrl={viewer?.url || ""}
        title={viewer?.title}
        onDelete={viewer ? handleViewerDelete : undefined}
        deleting={deleting}
      />
    </div>
  );
}
