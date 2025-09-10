"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/libs/api/http";

export interface CollectionItem {
  renderId: string;
  addedAt: string;
  render?: {
    id: string;
    mode: string;
    roomType?: string;
    style?: string;
    coverVariant: number;
    coverImageUrl?: string;
    createdAt: string;
  } | null;
}

export interface CollectionDetail {
  collection: {
    id: string;
    name: string;
    isDefaultFavorites: boolean;
    itemCount: number;
    createdAt: string;
  };
  items: CollectionItem[];
}

export function useCollectionDetail(collectionId: string | undefined) {
  const [data, setData] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!collectionId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/v1/collections/${collectionId}`);
      if (res.success) setData(res.data);
      else setError(res.error?.message || 'Failed to load collection');
    } catch (e: any) {
      setError(e?.message || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [collectionId]);

  const removeItem = async (renderId: string) => {
    if (!collectionId) return;
    await apiFetch(`/api/v1/collections/${collectionId}/items/${renderId}`, { method: 'DELETE' });
    await fetchDetail();
  };

  return { data, loading, error, refetch: fetchDetail, removeItem };
}

