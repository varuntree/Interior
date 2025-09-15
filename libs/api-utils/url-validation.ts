// libs/api-utils/url-validation.ts
import { NextRequest } from 'next/server';
import { logger } from '@/libs/observability/logger'

/**
 * Gets the application's public URL in order of priority:
 * 1. NEXT_PUBLIC_APP_URL environment variable (recommended)
 * 2. Request headers (origin or host)
 * 3. Development fallback (localhost:3000)
 * 
 * Validates HTTPS requirement in production environments.
 */
export function getApplicationUrl(req?: NextRequest): string {
  // Priority 1: PUBLIC_BASE_URL (explicit server-side base, preferred for webhooks and canonical URLs)
  if (process.env.PUBLIC_BASE_URL) {
    const url = process.env.PUBLIC_BASE_URL.trim();

    if (!isValidUrl(url)) {
      throw new Error(`Invalid PUBLIC_BASE_URL: "${url}". Must be a valid HTTP/HTTPS URL.`);
    }

    // Enforce HTTPS in production
    if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
      throw new Error(`HTTPS required in production. Got: "${url}". Update PUBLIC_BASE_URL to use HTTPS.`);
    }

    return url;
  }

  // Priority 2: NEXT_PUBLIC_APP_URL (fallback, also used by client)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();

    if (!isValidUrl(url)) {
      throw new Error(`Invalid NEXT_PUBLIC_APP_URL: "${url}". Must be a valid HTTP/HTTPS URL.`);
    }

    if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
      throw new Error(`HTTPS required in production. Got: "${url}". Update NEXT_PUBLIC_APP_URL to use HTTPS.`);
    }

    return url;
  }

  // Priority 2: Request headers (fallback)
  if (req) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    if (origin && isValidUrl(origin)) {
      return origin;
    }
    
    if (host) {
      // Determine protocol based on environment and host
      const protocol = shouldUseHttps(host) ? 'https://' : 'http://';
      const url = `${protocol}${host}`;
      
      if (isValidUrl(url)) {
        return url;
      }
    }
  }
  
  // Priority 3: Development fallback only
  if (process.env.NODE_ENV === 'development') {
    logger.warn('url.dev_default_used', { url: 'http://localhost:3000' })
    return 'http://localhost:3000';
  }
  
  // No valid URL found and not in development
  throw new Error(
    'NEXT_PUBLIC_APP_URL environment variable is required. ' +
    'Set it to your application\'s public URL (e.g., https://your-domain.com)'
  );
}

/**
 * Builds a webhook URL for external services like Replicate
 * Uses the application URL and appends the webhook path
 */
export function buildWebhookUrl(webhookPath: string, req?: NextRequest): string {
  const baseUrl = getWebhookBaseUrl(req);
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = webhookPath.startsWith('/') ? webhookPath : `/${webhookPath}`;
  
  return `${cleanBaseUrl}${cleanPath}`;
}

/**
 * Returns a base URL that is safe for public webhooks.
 * Order of preference:
 * 1) PUBLIC_BASE_URL (must be HTTPS)
 * 2) NEXT_PUBLIC_APP_URL (must be HTTPS)
 * 3) Request origin/host (must be HTTPS and not localhost)
 * Throws with a clear configuration error message otherwise.
 */
export function getWebhookBaseUrl(req?: NextRequest): string {
  const envPublic = (process.env.PUBLIC_BASE_URL || '').trim();
  const envNext = (process.env.NEXT_PUBLIC_APP_URL || '').trim();

  const candidates = [envPublic, envNext].filter(Boolean) as string[];
  for (const url of candidates) {
    if (!isValidUrl(url)) continue;
    if (!url.startsWith('https://')) continue; // webhooks require HTTPS always
    if (isLocalhost(url)) continue;
    return url;
  }

  // Fall back to request headers but still enforce HTTPS + non-localhost
  if (req) {
    const origin = req.headers.get('origin') || '';
    if (origin && isValidUrl(origin) && origin.startsWith('https://') && !isLocalhost(origin)) {
      return origin;
    }

    const host = req.headers.get('host') || '';
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `https://${host}`;
    }
  }

  throw new Error(
    'HTTPS public base URL required for webhooks. Set PUBLIC_BASE_URL (recommended) or NEXT_PUBLIC_APP_URL to your ngrok/Vercel HTTPS URL.'
  );
}

/**
 * Gets the application URL for use in emails, OAuth callbacks, etc.
 * Same as getApplicationUrl but with additional context for specific use cases
 */
export function getPublicUrl(req?: NextRequest): string {
  return getApplicationUrl(req);
}

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLocalhost(urlString: string): boolean {
  try {
    const { hostname } = new URL(urlString);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Determines if HTTPS should be used based on the host
 */
function shouldUseHttps(host: string): boolean {
  // Always use HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  
  // Use HTTP for localhost in development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return false;
  }
  
  // Default to HTTPS for other hosts
  return true;
}

/**
 * Validates the current URL configuration and provides helpful error messages
 */
export function validateUrlConfiguration(): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    const url = getApplicationUrl();
    
    // Check for localhost in production
    if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
      errors.push('Localhost URL detected in production environment');
    }
    
    // Check for HTTP in production
    if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
      errors.push('HTTP URL detected in production - HTTPS is required');
    }
    // No special cases for temporary tunnel URLs

    // Check for default example URLs
    if (url.includes('your-url-here') || url.includes('example.com')) {
      errors.push('Example URL detected - please set a real URL in NEXT_PUBLIC_APP_URL');
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown URL validation error');
    
    return {
      isValid: false,
      warnings,
      errors
    };
  }
}
