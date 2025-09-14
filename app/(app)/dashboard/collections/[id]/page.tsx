"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Trash2 } from "lucide-react";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { toast } from "sonner";
import { RenderCard } from "@/components/renders/RenderCard";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { CollectionPickerDialog } from "@/components/collections/CollectionPickerDialog";
import { apiFetch } from "@/libs/api/http";
import { ImageViewerDialog } from "@/components/shared/ImageViewerDialog";

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, items, loading, error, hasMore, loadingMore, fetchMore, refetch, removeItem } = useCollectionDetail(params?.id);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerItem, setPickerItem] = React.useState<{ type: 'render'|'community'; id: string } | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewer, setViewer] = React.useState<{ id: string; url: string; title?: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const onRemove = async (item: any) => {
    try {
      await removeItem(item);
      toast.success('Removed from collection');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove');
    }
  };

  const openViewer = (id: string, url: string, title?: string) => {
    setViewer({ id, url, title });
    setViewerOpen(true);
  };

  const handleViewerDelete = async () => {
    if (!viewer) return;
    try {
      setDeleting(true);
      await onRemove(viewer.id);
      setViewerOpen(false);
      setViewer(null);
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

      {loading && <div>Loading…</div>}
      {error && <div className="text-destructive">{error}</div>}

      {data && (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              it.type === 'render' ? (
                <RenderCard
                  key={`r-${it.renderId}-${it.addedAt}`}
                  id={it.render.id}
                  imageUrl={it.render.coverImageUrl || "/placeholder.png"}
                  title={`${it.render.mode || ''}${it.render.roomType ? ` • ${it.render.roomType}` : ''}${it.render.style ? ` • ${it.render.style}` : ''}`}
                  isFavorite={undefined}
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
                  onOpen={(id) => openViewer(id, it.render.coverImageUrl || "/placeholder.png", `${it.render.mode || ''}${it.render.roomType ? ` • ${it.render.roomType}` : ''}${it.render.style ? ` • ${it.render.style}` : ''}`)}
                  onDelete={async () => { await onRemove(it); }}
                />
              ) : (
                <Card key={`c-${it.communityImageId}-${it.addedAt}`} className="group overflow-hidden relative">
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-muted">
                      <Image src={it.imageUrl} alt="Community item" fill className="object-cover" />
                      <div className="absolute inset-x-2 bottom-2 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
                        <div className="flex items-center justify-end rounded-lg px-2 py-1.5 backdrop-blur-md bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 shadow-sm">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            aria-label="Delete"
                            onClick={async () => { await onRemove(it); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
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
            onOpenChange={(o) => { setViewerOpen(o); if (!o) setViewer(null); }}
            imageUrl={viewer?.url || ""}
            title={viewer?.title}
            onDelete={viewer ? handleViewerDelete : undefined}
            deleting={deleting}
          />
        </>
      )}
    </div>
  );
}
