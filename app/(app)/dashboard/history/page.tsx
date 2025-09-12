'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from "@/libs/api/http";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters] = useState({
    mode: '',
    roomType: '',
    style: '',
    status: ''
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const data = await apiFetch(`/api/v1/generations/history?${params}`);
      if (data.success) setHistory((data.data as any)?.items || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No generations yet</p>
            <a href="/dashboard/generate" className="text-primary hover:underline">
              Create your first design
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item: any) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{item.mode}</Badge>
                    <Badge variant={item.status === 'succeeded' ? 'default' : 'destructive'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.roomType} • {item.style}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
