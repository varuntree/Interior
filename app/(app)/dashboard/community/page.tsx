'use client';

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingStates } from "@/components/dashboard/LoadingStates";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CommunityCollection, CommunityItem, useApplySettings } from "@/components/community";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Users, Star, Palette, Sparkles, Search, RefreshCw } from "lucide-react";
import { apiFetch } from "@/libs/api/http";

interface CommunityData {
  type: 'gallery' | 'featured' | 'search';
  collections?: Array<{
    id: string;
    title: string;
    description?: string;
    isFeatured: boolean;
    itemCount: number;
    items: Array<{
      id: string;
      imageUrl: string;
      thumbUrl?: string;
      sourceType: 'render' | 'external';
      applySettings?: any;
      createdAt: string;
    }>;
  }>;
  items?: Array<any>;
  query?: string;
}

export default function CommunityPage() {
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'featured'>('all');
  const { applySettings } = useApplySettings();

  const fetchCommunityData = async (featured = false, search = '') => {
    try {
      setLoading(search ? false : true);
      setSearchLoading(search ? true : false);
      setError(null);

      const params = new URLSearchParams();
      if (featured) params.set('featured', 'true');
      if (search) params.set('search', search);
      params.set('itemsPerCollection', '8');

      const result = await apiFetch(`/api/v1/community?${params.toString()}`);
      if (!result.success) throw new Error(result.error?.message || 'Failed to load community content');
      setData(result.data as CommunityData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData(viewMode === 'featured');
  }, [viewMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchCommunityData(false, searchQuery.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchCommunityData(viewMode === 'featured');
  };

  const handleApplySettings = (settings: any) => {
    applySettings(settings);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <DashboardHeader 
          title="Community Gallery" 
          subtitle="Discover inspiring interior designs curated by our team"
        />
        <LoadingStates.skeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <DashboardHeader 
          title="Community Gallery" 
          subtitle="Discover inspiring interior designs curated by our team"
        />
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Error Loading Community</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => fetchCommunityData(viewMode === 'featured')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="Community Gallery" 
        subtitle="Discover inspiring interior designs curated by our team"
      >
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          New!
        </Badge>
      </DashboardHeader>

      <ErrorBoundary>
        {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            placeholder="Search designs, styles, room types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={searchLoading}>
            {searchLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
          {data?.type === 'search' && (
            <Button variant="outline" onClick={handleClearSearch}>
              Clear
            </Button>
          )}
        </form>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => setViewMode('all')}
            size="sm"
          >
            All Collections
          </Button>
          <Button
            variant={viewMode === 'featured' ? 'default' : 'outline'}
            onClick={() => setViewMode('featured')}
            size="sm"
          >
            <Star className="h-4 w-4 mr-1" />
            Featured
          </Button>
        </div>
      </div>

      {/* Search Results Header */}
      {data?.type === 'search' && (
        <div className="text-sm text-muted-foreground">
          Search results for &ldquo;{data.query}&rdquo; • {data.items?.length || 0} items found
        </div>
      )}

      {/* Community Collections */}
      {data?.collections && data.collections.length > 0 ? (
        <div className="space-y-8">
          {data.collections.map((collection) => (
            <CommunityCollection
              key={collection.id}
              id={collection.id}
              title={collection.title}
              description={collection.description}
              isFeatured={collection.isFeatured}
              itemCount={collection.itemCount}
              items={collection.items}
              onApplySettings={handleApplySettings}
            />
          ))}
        </div>
      ) : data?.type === 'search' && data.items ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.items.map((item) => (
            <CommunityItem
              key={item.id}
              item={item}
              onApplySettings={handleApplySettings}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Collections Yet"
          description="Community collections will appear here once our team curates them."
          action={{
            label: "Refresh",
            onClick: () => fetchCommunityData(false)
          }}
        />
      )}

      {/* Info Cards for empty state */}
      {(!data?.collections || data.collections.length === 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Featured Collections</CardTitle>
                  <CardDescription>Admin-curated design inspiration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Explore professionally curated collections showcasing the best Australian interior design styles.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  • Coastal Australian Homes
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  • Modern Minimalist Spaces
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  • Hamptons-Inspired Interiors
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Palette className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle>&ldquo;Try This Look&rdquo; Feature</CardTitle>
                  <CardDescription>Apply community design settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Click the sparkle icon on any community design to automatically apply the same settings to your generation.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  • Auto-fill room type & style
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  • Copy prompt & settings
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  • Navigate to Create page
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </ErrorBoundary>
    </div>
  );
}
