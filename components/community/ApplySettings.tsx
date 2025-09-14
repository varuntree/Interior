'use client';

import { useRouter } from 'next/navigation';

interface ApplySettingsProps {
  settings: {
    mode?: string;
    roomType?: string;
    style?: string;
    prompt?: string;
    aspectRatio?: string;
    quality?: string;
    variants?: number;
  };
}

export function useApplySettings() {
  const router = useRouter();

  const applySettings = (settings: ApplySettingsProps['settings']) => {
    try {
      // Build query parameters from settings
      const params = new URLSearchParams();
      
      if (settings.mode) params.set('mode', settings.mode);
      if (settings.roomType) params.set('roomType', settings.roomType);
      if (settings.style) params.set('style', settings.style);
      if (settings.prompt) params.set('prompt', settings.prompt);
      if (settings.aspectRatio) params.set('aspectRatio', settings.aspectRatio);
      if (settings.quality) params.set('quality', settings.quality);
      if (settings.variants) params.set('variants', settings.variants.toString());

      // Add source tracking
      params.set('source', 'community');

      // Navigate to create page with prefilled settings
      const createUrl = `/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
      router.push(createUrl);

    } catch (error) {
      console.error('Failed to apply settings:', error);
      // Could show an alert or handle error differently
      alert('Failed to apply settings. Please try again.');
    }
  };

  return { applySettings };
}

// Export a component version as well for direct use
export function ApplySettings({ settings }: ApplySettingsProps) {
  const { applySettings } = useApplySettings();

  return {
    onClick: () => applySettings(settings)
  };
}
