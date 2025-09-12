"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { toast } from "sonner";
import { RenderCard } from "@/components/renders/RenderCard";
import { CollectionPickerDialog } from "@/components/collections/CollectionPickerDialog";
import { apiFetch } from "@/libs/api/http";

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, items, loading, error, hasMore, loadingMore, fetchMore, refetch, removeItem } = useCollectionDetail(params?.id);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerRenderId, setPickerRenderId] = React.useState<string | null>(null);

  const onRemove = async (renderId: string) => {
    try {
      await removeItem(renderId);
      toast.success('Removed from collection');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove');
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
              <RenderCard
                key={`${it.renderId}-${it.addedAt}`}
                id={it.render?.id || it.renderId}
                imageUrl={it.render?.coverImageUrl || "/placeholder.png"}
                title={`${it.render?.mode || ''}${it.render?.roomType ? ` • ${it.render.roomType}` : ''}${it.render?.style ? ` • ${it.render.style}` : ''}`}
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
                onAddToCollection={(id) => { setPickerRenderId(id); setPickerOpen(true); }}
                onOpen={(id) => router.push(`/dashboard/renders/${id}`)}
                onDelete={async () => { await onRemove(it.renderId); }}
              />
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
            onOpenChange={(o) => { setPickerOpen(o); if (!o) setPickerRenderId(null); }}
            renderId={pickerRenderId}
            onAdded={() => { toast.success('Added to collection'); refetch(); }}
          />
        </>
      )}
    </div>
  );
}
