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
import { useRouter } from "next/navigation";
import React from "react";
import { CollectionPickerDialog } from "@/components/collections/CollectionPickerDialog";

export default function RendersPage() {
  const router = useRouter();
  const { items, loading, refetch } = useRenders();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerRenderId, setPickerRenderId] = React.useState<string | null>(null);

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
    setPickerRenderId(renderId);
    setPickerOpen(true);
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
              onOpen={(id) => router.push(`/dashboard/renders/${id}`)}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <CollectionPickerDialog
        open={pickerOpen}
        onOpenChange={(o) => { setPickerOpen(o); if (!o) setPickerRenderId(null); }}
        renderId={pickerRenderId}
        onAdded={() => { toast.success('Added to collection'); refetch(); }}
      />
    </div>
  );
}
