"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/libs/api/http";

export interface RenderListItem {
  id: string;
  mode: string;
  room_type?: string;
  style?: string;
  cover_variant: number;
  created_at: string;
  cover_variant_url: string;
  is_favorite?: boolean;
}

export function useRenders(params?: { mode?: string; roomType?: string; style?: string; search?: string; limit?: number }) {
  const [items, setItems] = useState<RenderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const buildBaseQuery = () => {
    const qs = new URLSearchParams();
    if (params?.mode) qs.set('mode', params.mode);
    if (params?.roomType) qs.set('roomType', params.roomType);
    if (params?.style) qs.set('style', params.style);
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', String(params.limit));
    return qs;
  };

  const fetchRenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = buildBaseQuery();
      const url = `/api/v1/renders${qs.toString() ? `?${qs.toString()}` : ''}`;
      const res = await apiFetch(url);
      if (res.success) {
        setItems(res.data.renders || []);
        const pg = res.data.pagination || {};
        setNextCursor(pg.nextCursor ?? null);
        setHasMore(!!pg.hasMore);
      } else {
        setError(res.error?.message || 'Failed to load renders');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load renders');
    } finally {
      setLoading(false);
    }
  };

  const fetchMore = async () => {
    if (!hasMore || !nextCursor) return;
    try {
      setLoadingMore(true);
      const qs = buildBaseQuery();
      qs.set('cursor', nextCursor);
      const url = `/api/v1/renders?${qs.toString()}`;
      const res = await apiFetch(url);
      if (res.success) {
        const newItems: RenderListItem[] = res.data.renders || [];
        setItems(prev => [...prev, ...newItems]);
        const pg = res.data.pagination || {};
        setNextCursor(pg.nextCursor ?? null);
        setHasMore(!!pg.hasMore);
      }
    } catch (e: any) {
      // keep prior items; optionally surface toast from caller
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // reset list when filters/search change
    setItems([]);
    setNextCursor(null);
    setHasMore(false);
    fetchRenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.mode, params?.roomType, params?.style, params?.search, params?.limit]);

  return { items, loading, loadingMore, error, hasMore, nextCursor, refetch: fetchRenders, fetchMore };
}
