"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/libs/api/http";

export interface RenderVariant {
  id: string;
  index: number;
  imageUrl: string;
  thumbUrl?: string;
  imagePath?: string;
  createdAt: string;
}

export interface RenderDetails {
  id: string;
  jobId: string;
  mode: string;
  roomType?: string;
  style?: string;
  coverVariant: number;
  createdAt: string;
  variants: RenderVariant[];
}

export function useRenderDetails(renderId: string | undefined) {
  const [data, setData] = useState<RenderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!renderId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/v1/renders/${renderId}`);
      if (res.success) setData(res.data);
      else setError(res.error?.message || 'Failed to load render');
    } catch (e: any) {
      setError(e?.message || 'Failed to load render');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [renderId]);

  const setCover = async (index: number) => {
    if (!renderId) return;
    await apiFetch(`/api/v1/renders/${renderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverVariant: index })
    });
    await fetchDetails();
  };

  const remove = async () => {
    if (!renderId) return;
    await apiFetch(`/api/v1/renders/${renderId}`, { method: 'DELETE' });
  };

  return { data, loading, error, refetch: fetchDetails, setCover, remove };
}

