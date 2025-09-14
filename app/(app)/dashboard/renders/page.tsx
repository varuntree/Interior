"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Search, Filter, Plus, Sparkles } from "lucide-react";
import { useRenders } from "@/hooks/useRenders";
import { apiFetch } from "@/libs/api/http";
import { toast } from "sonner";
import { RenderCard } from "@/components/renders/RenderCard";
import React from "react";
import { CollectionPickerDialog } from "@/components/collections/CollectionPickerDialog";
import { ImageViewerDialog } from "@/components/shared/ImageViewerDialog";

export default function RendersPage() {
  const { items, loading, loadingMore, hasMore, fetchMore, refetch } = useRenders();
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
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="My Renders" 
        subtitle="Browse and manage all your generated interior designs"
      >
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Gallery
        </Badge>
      </DashboardHeader>

      {/* Search and Filters (disabled for MVP) */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search your renders..." className="pl-10" disabled />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" asChild>
            <a href="/dashboard/create">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </a>
          </Button>
        </div>
      </div>

      {/* Grid */}
      {!loading && items.length === 0 && (
        <EmptyState
          icon={<ImageIcon className="h-12 w-12" />}
          title="No renders yet"
          description="Start creating beautiful interior designs to see them here."
          action={{ label: "Create Your First Design", href: "/dashboard/create" }}
        />
      )}

      {items.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((r) => (
            <RenderCard
              key={r.id}
              id={r.id}
              imageUrl={r.cover_variant_url}
              title={`${r.mode}${r.room_type ? ` • ${r.room_type}` : ''}${r.style ? ` • ${r.style}` : ''}`}
              isFavorite={!!r.is_favorite}
              onToggleFavorite={onToggleFavorite}
              onAddToCollection={onAddToCollection}
              onOpen={(id) => openViewer(id, r.cover_variant_url, `${r.mode}${r.room_type ? ` • ${r.room_type}` : ''}${r.style ? ` • ${r.style}` : ''}`)}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

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
        onOpenChange={(o) => { setViewerOpen(o); if (!o) setViewer(null); }}
        imageUrl={viewer?.url || ""}
        title={viewer?.title}
        onDelete={viewer ? handleViewerDelete : undefined}
        deleting={deleting}
      />
    </div>
  );
}
