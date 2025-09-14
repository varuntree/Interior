"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/libs/api/http";

export type CollectionItem =
  | {
      type: 'render';
      renderId: string;
      addedAt: string;
      render: {
        id: string;
        mode: string;
        roomType?: string;
        style?: string;
        coverVariant: number;
        coverImageUrl?: string;
        createdAt: string;
      };
    }
  | {
      type: 'community';
      communityImageId: string;
      addedAt: string;
      imageUrl: string;
      thumbUrl?: string;
      applySettings?: any;
    };

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

export function useCollectionDetail(collectionId: string | undefined, pageSize: number = 24) {
  const [data, setData] = useState<CollectionDetail | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchDetail = async () => {
    if (!collectionId) return;
    try {
      setLoading(true);
      setError(null);
      // Fetch collection metadata and initial page of items in one request
      const res = await apiFetch(`/api/v1/collections/${collectionId}?limit=${pageSize}`);
      if (!res.success) throw new Error(res.error?.message || 'Failed to load collection');
      setData(res.data);
      const initialItems: CollectionItem[] = res.data.items || [];
      setItems(initialItems);
      setOffset(initialItems.length);
      setHasMore(initialItems.length === pageSize);
    } catch (e: any) {
      setError(e?.message || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const fetchMore = async () => {
    if (!collectionId || !hasMore) return;
    try {
      setLoadingMore(true);
      const res = await apiFetch(`/api/v1/collections/${collectionId}/items?limit=${pageSize}&offset=${offset}`);
      if (!res.success) throw new Error(res.error?.message || 'Failed to load items');
      const pageItems: CollectionItem[] = res.data.items || [];
      setItems(prev => [...prev, ...pageItems]);
      const pg = res.data.pagination || {};
      setHasMore(!!pg.hasMore);
      setOffset(offset + pageSize);
    } catch (e: any) {
      // noop; keep prior list
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(false);
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId, pageSize]);

  const removeItem = async (item: CollectionItem) => {
    if (!collectionId) return;
    if (item.type === 'render') {
      await apiFetch(`/api/v1/collections/${collectionId}/items/${item.renderId}`, { method: 'DELETE' });
    } else {
      await apiFetch(`/api/v1/collections/${collectionId}/community-items/${item.communityImageId}`, { method: 'DELETE' });
    }
    // refetch from start to keep pagination accurate
    await fetchDetail();
  };

  return { data, items, loading, loadingMore, error, hasMore, fetchMore, refetch: fetchDetail, removeItem };
}
