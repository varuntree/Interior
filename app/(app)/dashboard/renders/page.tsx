"use client";

import Image from "next/image";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Search, Filter, Plus, Sparkles } from "lucide-react";
import { useRenders } from "@/hooks/useRenders";
import { apiFetch } from "@/libs/api/http";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function RendersPage() {
  const { items, loading, refetch } = useRenders();

  const onDelete = async (renderId: string) => {
    try {
      await apiFetch(`/api/v1/renders/${renderId}`, { method: 'DELETE' });
      toast.success('Render deleted');
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
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
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={r.cover_variant_url}
                    alt={`${r.mode} • ${r.room_type || ''} • ${r.style || ''}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                </div>
                <div className="p-3 border-t text-sm text-muted-foreground flex items-center justify-between">
                  <span className="truncate">
                    {r.mode}{r.room_type ? ` • ${r.room_type}` : ''}{r.style ? ` • ${r.style}` : ''}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/dashboard/renders/${r.id}`}>Open</a>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
