'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { CommunityItem } from './CommunityItem';

interface CommunityCollectionItem {
  id: string;
  imageUrl: string;
  thumbUrl?: string;
  sourceType: 'render' | 'external';
  applySettings?: {
    mode?: string;
    roomType?: string;
    style?: string;
    prompt?: string;
    aspectRatio?: string;
    quality?: string;
    variants?: number;
  };
  createdAt: string;
  render?: {
    id: string;
    mode?: string;
    roomType?: string;
    style?: string;
  };
}

interface CommunityCollectionProps {
  id: string;
  title: string;
  description?: string;
  isFeatured: boolean;
  itemCount: number;
  items: CommunityCollectionItem[];
  onApplySettings?: (settings: any) => void;
}

export function CommunityCollection({
  title,
  description,
  isFeatured,
  itemCount,
  items,
  onApplySettings
}: CommunityCollectionProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const currentItems = items.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Card className={`${isFeatured ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {isFeatured && <Star className="h-4 w-4 text-primary fill-primary" />}
              {title}
              {isFeatured && <Badge variant="secondary">Featured</Badge>}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{itemCount} items</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Palette className="h-3 w-3" />
                Try these looks
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Palette className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No items in this collection yet</p>
          </div>
        ) : (
          <>
            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {currentItems.map((item) => (
                <CommunityItem
                  key={item.id}
                  item={item}
                  onApplySettings={onApplySettings}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}