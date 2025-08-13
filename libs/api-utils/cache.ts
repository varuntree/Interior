// Cache configuration utilities for API responses

export interface CacheConfig {
  /**
   * Client cache time in seconds (browser cache)
   */
  maxAge?: number;
  
  /**
   * CDN/shared cache time in seconds
   */
  sMaxAge?: number;
  
  /**
   * Whether the response can be cached by shared caches (CDNs, proxies)
   */
  public?: boolean;
  
  /**
   * Whether the response must be revalidated with the server
   */
  mustRevalidate?: boolean;
  
  /**
   * Whether the response should not be cached at all
   */
  noCache?: boolean;
  
  /**
   * Whether the response should not be stored anywhere
   */
  noStore?: boolean;
  
  /**
   * ETag for cache validation
   */
  etag?: string;
  
  /**
   * Last modified timestamp
   */
  lastModified?: Date;
}

/**
 * Generate Cache-Control header value from configuration
 */
export function buildCacheControl(config: CacheConfig): string {
  const directives: string[] = [];
  
  if (config.noStore) {
    directives.push('no-store');
  } else if (config.noCache) {
    directives.push('no-cache');
  } else {
    if (config.public) {
      directives.push('public');
    } else {
      directives.push('private');
    }
    
    if (config.maxAge !== undefined) {
      directives.push(`max-age=${config.maxAge}`);
    }
    
    if (config.sMaxAge !== undefined) {
      directives.push(`s-maxage=${config.sMaxAge}`);
    }
    
    if (config.mustRevalidate) {
      directives.push('must-revalidate');
    }
  }
  
  return directives.join(', ');
}

/**
 * Build headers object with caching headers
 */
export function buildCacheHeaders(config: CacheConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Cache-Control': buildCacheControl(config)
  };
  
  if (config.etag) {
    headers['ETag'] = config.etag;
  }
  
  if (config.lastModified) {
    headers['Last-Modified'] = config.lastModified.toUTCString();
  }
  
  return headers;
}

/**
 * Predefined cache configurations for common use cases
 */
export const CACHE_CONFIGS = {
  /**
   * No caching - for sensitive or highly dynamic data
   */
  NO_CACHE: {
    noStore: true
  } satisfies CacheConfig,
  
  /**
   * Short cache - for frequently changing data (user stats, live data)
   * 30 seconds client, 1 minute CDN
   */
  SHORT: {
    public: false,
    maxAge: 30,
    sMaxAge: 60,
    mustRevalidate: true
  } satisfies CacheConfig,
  
  /**
   * Medium cache - for moderately changing data (user profiles, settings)
   * 5 minutes client, 10 minutes CDN
   */
  MEDIUM: {
    public: false,
    maxAge: 300,
    sMaxAge: 600,
    mustRevalidate: true
  } satisfies CacheConfig,
  
  /**
   * Long cache - for relatively stable data (generation results, collections)
   * 1 hour client, 24 hours CDN
   */
  LONG: {
    public: true,
    maxAge: 3600,
    sMaxAge: 86400
  } satisfies CacheConfig,
  
  /**
   * Public cache - for public content (community galleries, static data)
   * 5 minutes client, 1 hour CDN
   */
  PUBLIC: {
    public: true,
    maxAge: 300,
    sMaxAge: 3600
  } satisfies CacheConfig,
  
  /**
   * Static cache - for immutable content (generated images, assets)
   * 1 year cache
   */
  STATIC: {
    public: true,
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000
  } satisfies CacheConfig,
  
  /**
   * Auth cache - for authenticated user data
   * 2 minutes client, no shared cache
   */
  AUTH: {
    public: false,
    maxAge: 120,
    mustRevalidate: true
  } satisfies CacheConfig
};

/**
 * Enhanced response wrapper with caching
 */
export function createCachedResponse(
  data: any,
  options: {
    status?: number;
    cache?: CacheConfig;
    headers?: Record<string, string>;
  } = {}
): Response {
  const {
    status = 200,
    cache = CACHE_CONFIGS.NO_CACHE,
    headers: customHeaders = {}
  } = options;
  
  const cacheHeaders = buildCacheHeaders(cache);
  
  const headers = {
    'Content-Type': 'application/json',
    ...cacheHeaders,
    ...customHeaders
  };
  
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

/**
 * Check if request includes cache-busting parameters
 */
export function hasCacheBuster(request: Request): boolean {
  const url = new URL(request.url);
  return url.searchParams.has('_t') || 
         url.searchParams.has('nocache') ||
         url.searchParams.has('refresh');
}

/**
 * Generate ETag from content
 */
export function generateETag(content: string): string {
  // Simple hash function for ETag generation
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
}