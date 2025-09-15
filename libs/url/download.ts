// libs/url/download.ts
// Small client-safe helpers for building Supabase download URLs and triggering downloads.

export function sanitizeFilename(name: string): string {
  const base = (name || 'interior-design')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');
  return base.endsWith('.jpg') ? base : `${base}.jpg`;
}

export function appendDownloadParam(baseUrl: string, filename: string): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('download', filename);
    return url.toString();
  } catch {
    // If URL constructor fails, fall back to appending query string directly
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}download=${encodeURIComponent(filename)}`;
  }
}

export function triggerDownload(href: string) {
  const a = document.createElement('a');
  a.href = href;
  // We do not rely on the download attribute for cross-origin; server headers will handle it.
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function triggerSequentialDownloads(urls: string[], delayMs = 100) {
  for (const u of urls) {
    triggerDownload(u);
    // Give the browser a tiny breather to register each download
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

