'use client';
/* eslint-disable no-unused-vars */

import React, { memo } from 'react';
import AppImage from '@/components/shared/Image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, ExternalLink, Eye } from 'lucide-react';

interface CommunityItemProps {
  item: {
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
  };
  onApplySettings?: (payload: any) => void;
}

function CommunityItemInner({ item, onApplySettings }: CommunityItemProps) {

  const handleApplySettings = () => {
    if (item.applySettings && onApplySettings) {
      onApplySettings(item.applySettings);
    }
  };

  const hasApplySettings = !!item.applySettings && (
    item.applySettings.mode ||
    item.applySettings.roomType ||
    item.applySettings.style ||
    item.applySettings.prompt
  );

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-all duration-200 border border-border/50 hover:border-border">
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <AppImage
            src={item.thumbUrl || item.imageUrl}
            alt={`Community design ${item.id}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
            showLoader
          />

          {/* Overlay with Actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-background/90 hover:bg-background text-foreground"
                      onClick={() => window.open(item.imageUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View full size</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {hasApplySettings && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-primary/90 hover:bg-primary text-primary-foreground"
                        onClick={handleApplySettings}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Try this look</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Source Type Badge */}
          <div className="absolute top-2 left-2">
            {item.sourceType === 'external' && (
              <Badge variant="secondary" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                External
              </Badge>
            )}
          </div>

          {/* Apply Settings Badge */}
          {hasApplySettings && (
            <div className="absolute top-2 right-2">
              <Badge className="text-xs bg-primary/90 hover:bg-primary">
                <Sparkles className="h-3 w-3 mr-1" />
                Try Look
              </Badge>
            </div>
          )}
        </div>

        {/* Settings Preview */}
        {hasApplySettings && (
          <div className="p-3 bg-muted/50 space-y-1">
            <div className="flex flex-wrap gap-1 text-xs">
              {item.applySettings.mode && (
                <Badge variant="outline" className="text-xs">
                  {item.applySettings.mode}
                </Badge>
              )}
              {item.applySettings.roomType && (
                <Badge variant="outline" className="text-xs">
                  {item.applySettings.roomType}
                </Badge>
              )}
              {item.applySettings.style && (
                <Badge variant="outline" className="text-xs">
                  {item.applySettings.style}
                </Badge>
              )}
            </div>
            {item.applySettings.prompt && (
              <p className="text-xs text-muted-foreground overflow-hidden" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                &ldquo;{item.applySettings.prompt}&rdquo;
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const CommunityItem = memo(CommunityItemInner);
