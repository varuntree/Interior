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
}

export function useRenders(params?: { mode?: string; roomType?: string; style?: string; search?: string }) {
  const [items, setItems] = useState<RenderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams();
      if (params?.mode) qs.set('mode', params.mode);
      if (params?.roomType) qs.set('roomType', params.roomType);
      if (params?.style) qs.set('style', params.style);
      if (params?.search) qs.set('search', params.search);
      const url = `/api/v1/renders${qs.toString() ? `?${qs.toString()}` : ''}`;
      const res = await apiFetch(url);
      if (res.success) {
        setItems(res.data.renders || []);
      } else {
        setError(res.error?.message || 'Failed to load renders');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load renders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.mode, params?.roomType, params?.style, params?.search]);

  return { items, loading, error, refetch: fetchRenders };
}

