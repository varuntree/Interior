"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/libs/api/http";

export interface CollectionListItem {
  id: string;
  name: string;
  isDefaultFavorites: boolean;
  itemCount: number;
  createdAt: string;
}

export function useCollections() {
  const [items, setItems] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/v1/collections');
      if (res.success) {
        setItems(res.data.collections || []);
      } else {
        setError(res.error?.message || 'Failed to load collections');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCollections(); }, []);

  return { items, loading, error, refetch: fetchCollections };
}

