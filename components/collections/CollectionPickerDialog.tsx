"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/libs/api/http";
import { toast } from "sonner";

interface CollectionItem {
  id: string;
  name: string;
  isDefaultFavorites: boolean;
  itemCount: number;
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  renderId: string | null;
  onAdded?: () => void;
}

export function CollectionPickerDialog({ open, onOpenChange, renderId, onAdded }: Props) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCollections = async () => {
    try {
      const res = await apiFetch('/api/v1/collections');
      if (res.success) {
        setCollections(res.data.collections || []);
      }
    } catch (e) {
      // no-op
    }
  };

  useEffect(() => {
    if (open) {
      setSelected(null);
      setNewName("");
      loadCollections();
    }
  }, [open]);

  const createCollection = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await apiFetch('/api/v1/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      setNewName("");
      await loadCollections();
      toast.success('Collection created');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  const addToCollection = async () => {
    if (!renderId || !selected) return;
    setLoading(true);
    try {
      await apiFetch(`/api/v1/collections/${selected}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderId })
      });
      toast.success('Added to collection');
      onAdded?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Your Collections</Label>
            <ScrollArea className="h-48 border rounded-md p-2">
              <RadioGroup value={selected || ''} onValueChange={(v) => setSelected(v)}>
                {collections.map((c) => (
                  <div key={c.id} className="flex items-center space-x-2 py-1">
                    <RadioGroupItem value={c.id} id={`c_${c.id}`} />
                    <Label htmlFor={`c_${c.id}`}>{c.name} {c.isDefaultFavorites && <span className="text-xs text-muted-foreground">(default)</span>}</Label>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          </div>

          <div className="flex gap-2">
            <Input placeholder="New collection name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button variant="outline" onClick={createCollection} disabled={loading || !newName.trim()}>Create</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={addToCollection} disabled={loading || !selected || !renderId}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
