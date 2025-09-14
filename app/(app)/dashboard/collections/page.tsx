"use client";
import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderHeart, Plus, Sparkles } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CollectionCardSkeleton } from "@/components/collections/CollectionCard.Skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/libs/api/http";
import { toast } from "sonner";

export default function CollectionsPage() {
  const { items, loading, error, refetch } = useCollections();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameName, setRenameName] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const favorites = items.find((c) => c.isDefaultFavorites);
  const others = items.filter((c) => !c.isDefaultFavorites);
  const all = favorites ? [favorites, ...others] : others;

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

      {!!error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Unified grid (Favorites + others) */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CollectionCardSkeleton key={i} />
          ))}
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon={<FolderHeart className="h-12 w-12" />}
          title="No collections yet"
          description="Create collections to organize your designs by project, room, or style. Each render can be added to multiple collections."
          action={{ label: "Create First Collection", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {all.map((c) => (
            <CollectionCard
              key={c.id}
              id={c.id}
              name={c.name}
              itemCount={c.itemCount}
              isDefaultFavorites={c.isDefaultFavorites}
              onRename={c.isDefaultFavorites ? undefined : () => { setSelectedId(c.id); setRenameName(c.name); setRenameOpen(true); }}
              onDelete={c.isDefaultFavorites ? undefined : async () => {
                try {
                  await apiFetch(`/api/v1/collections/${c.id}`, { method: 'DELETE' });
                  toast.success('Collection deleted');
                  await refetch();
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to delete');
                }
              }}
            />
          ))}
        </div>
      )}

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
