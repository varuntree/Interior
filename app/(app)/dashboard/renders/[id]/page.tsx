"use client";

import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useRenderDetails } from "@/hooks/useRenderDetails";
import { toast } from "sonner";

export default function RenderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error, setCover, remove } = useRenderDetails(params?.id);

  const onDelete = async () => {
    try {
      await remove();
      toast.success('Render deleted');
      router.push('/dashboard/renders');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  };

  const onSetCover = async (idx: number) => {
    try {
      await setCover(idx);
      toast.success('Cover updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update cover');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <DashboardHeader title="Render Details" subtitle="Manage variants and cover" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/renders')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="text-destructive">{error}</div>}

      {data && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data.variants.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted">
                  <Image src={v.imageUrl} alt={`Variant ${v.index}`} fill className="object-cover" />
                  {data.coverVariant === v.index && (
                    <Badge className="absolute top-2 left-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Cover
                    </Badge>
                  )}
                </div>
                <div className="p-3 border-t flex items-center justify-between text-sm">
                  <span>Variant {v.index + 1}</span>
                  {data.coverVariant !== v.index && (
                    <Button size="sm" onClick={() => onSetCover(v.index)}>Make cover</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

