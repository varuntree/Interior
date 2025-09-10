"use client";
import React from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderHeart, Plus, Heart, Sparkles } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/libs/api/http";
import { toast } from "sonner";

export default function CollectionsPage() {
  const { items, refetch } = useCollections();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameName, setRenameName] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const favorites = items.find((c) => c.isDefaultFavorites);
  const others = items.filter((c) => !c.isDefaultFavorites);

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="Collections" 
        subtitle="Organize and manage your favorite interior designs"
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Your Library
          </Badge>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>
      </DashboardHeader>

      {/* Default Favorites Collection (Always Present) */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  My Favorites
                  <Badge variant="outline" className="text-xs">Default</Badge>
                </CardTitle>
                <CardDescription>Your automatically saved favorite designs</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">{favorites?.itemCount ?? 0} items</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Designs you mark as favorites will automatically appear here. This collection cannot be deleted.
          </p>
        </CardContent>
      </Card>

      {/* Other Collections */}
      <div className="border-t pt-6">
        {others.length === 0 ? (
          <EmptyState
            icon={<FolderHeart className="h-12 w-12" />}
            title="No custom collections yet"
            description="Create collections to organize your designs by project, room, or style. Each render can be added to multiple collections."
            action={{ label: "Create First Collection", onClick: () => {} }}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <CardDescription>{c.itemCount} items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/collections/${c.id}`}>
                        Open
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedId(c.id); setRenameName(c.name); setRenameOpen(true); }}>
                      Rename
                    </Button>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      try {
                        await apiFetch(`/api/v1/collections/${c.id}`, { method: 'DELETE' });
                        toast.success('Collection deleted');
                        await refetch();
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to delete');
                      }
                    }}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
          </DialogHeader>
          <Input placeholder="Collection name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                await apiFetch('/api/v1/collections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: createName.trim() }) });
                toast.success('Collection created');
                setCreateName("");
                setCreateOpen(false);
                await refetch();
              } catch (e: any) {
                toast.error(e?.message || 'Failed to create');
              }
            }} disabled={!createName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
          </DialogHeader>
          <Input placeholder="New name" value={renameName} onChange={(e) => setRenameName(e.target.value)} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!selectedId) return;
              try {
                await apiFetch(`/api/v1/collections/${selectedId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: renameName.trim() }) });
                toast.success('Collection renamed');
                setRenameOpen(false);
                await refetch();
              } catch (e: any) {
                toast.error(e?.message || 'Failed to rename');
              }
            }} disabled={!renameName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
