// libs/api-utils/url-validation.ts
import { NextRequest } from 'next/server';

/**
 * Gets the application's public URL in order of priority:
 * 1. NEXT_PUBLIC_APP_URL environment variable (recommended)
 * 2. Request headers (origin or host)
 * 3. Development fallback (localhost:3000)
 * 
 * Validates HTTPS requirement in production environments.
 */
export function getApplicationUrl(req?: NextRequest): string {
  // Priority 1: Environment variable (most reliable)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();
    
    // Validate the environment URL
    if (!isValidUrl(url)) {
      throw new Error(`Invalid NEXT_PUBLIC_APP_URL: "${url}". Must be a valid HTTP/HTTPS URL.`);
    }
    
    // Enforce HTTPS in production
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
    console.warn(
      '⚠️  No NEXT_PUBLIC_APP_URL set. Webhooks may fail in development.\n' +
      '   For local development with generation features:\n' +
      '   1. Install ngrok: npm install -g ngrok\n' +
      '   2. Run: ngrok http 3000\n' +
      '   3. Set NEXT_PUBLIC_APP_URL=https://your-subdomain.ngrok.io in .env.local\n' +
      '   4. Restart development server'
    );
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
  const baseUrl = getApplicationUrl(req);
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = webhookPath.startsWith('/') ? webhookPath : `/${webhookPath}`;
  
  return `${cleanBaseUrl}${cleanPath}`;
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
  
  // Default to HTTPS for other hosts (likely tunneling services)
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
    
    // Check for ngrok in production (common mistake)
    if (process.env.NODE_ENV === 'production' && url.includes('ngrok.io')) {
      warnings.push('ngrok URL detected in production - consider using a permanent domain');
    }
    
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