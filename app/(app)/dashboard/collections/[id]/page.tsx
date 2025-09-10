"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { toast } from "sonner";

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error, removeItem } = useCollectionDetail(params?.id);

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
            {data?.items.length ?? 0} items
          </Badge>
        </DashboardHeader>
        <Button variant="outline" onClick={() => router.push('/dashboard/collections')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="text-destructive">{error}</div>}

      {data && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((it) => (
            <Card key={`${it.renderId}-${it.addedAt}`} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted">
                  {it.render?.coverImageUrl ? (
                    <Image src={it.render.coverImageUrl} alt={it.render?.mode || 'Render'} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No image</div>
                  )}
                </div>
                <div className="p-3 border-t flex items-center justify-between text-sm">
                  <span className="truncate">{it.render?.mode}{it.render?.roomType ? ` • ${it.render.roomType}` : ''}{it.render?.style ? ` • ${it.render.style}` : ''}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/dashboard/renders/${it.render?.id}`}>Open</a>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onRemove(it.renderId)}>
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

