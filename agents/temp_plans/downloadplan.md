 Here’s the best, production‑grade approach after a second research pass with Safari/iOS and our stack in mind.

  First Principles

  - Goal: one‑click, reliable download that doesn’t open a new tab, especially on iOS Safari.
  - Constraint: our render images live in Supabase Storage public bucket at public/renders/<renderId>/<idx>.jpg (cross‑origin to app domain).
  - Browser reality: the HTML download attribute is unreliable for cross‑origin URLs and historically not honored on iOS Safari; it can open a new tab/
  preview instead. Using Content‑Disposition: attachment is the reliable, cross‑browser way to force a download. (developer.mozilla.org (https://
  developer.mozilla.org/docs/Web/HTML/Reference/Elements/a?utm_source=openai))
  - Supabase feature: public Storage URLs support a built‑in “download” mode via the query param ?download or ?download=<filename>, which sets appropriate
  headers (Content‑Disposition) on their CDN response. This is designed exactly for our use case. (supabase.com (https://supabase.com/docs/guides/storage/
  serving/downloads?utm_source=openai))

  Recommended Approach

  - Use Supabase’s “download URL” directly in the client by appending ?download=<sanitized-filename>.jpg to the public render URL we already expose.
  - Trigger the download from a user‑gesture click by creating an in‑page <a> with the Supabase download URL and calling click() synchronously inside
  the handler. Do not rely on the download attribute; the server header will drive correct behavior across browsers, including iOS Safari. (supabase.com
  (https://supabase.com/docs/guides/storage/serving/downloads?utm_source=openai))

  Why this is best for us

  - Simple and fast: no new backend or proxy route; zero infra changes. We keep using our public bucket and existing URL builder.
  - Cross‑platform reliable: Supabase serves Content‑Disposition: attachment; browsers download instead of navigating. iOS Safari behaves correctly with
  header‑driven downloads (shows Save dialog/sheet). (supabase.com (https://supabase.com/docs/guides/storage/serving/downloads?utm_source=openai))
  - Secure and scalable: no service‑role keys, no additional egress through our app servers; CDN handles bytes. Access model unchanged.
  - Clean UX: per‑image Download button on card overlays and the image viewer; optional “Download All” can stay but should use the same URLs.

  Implementation Plan

  - Add a tiny helper to build a download URL:
      - Input: base public URL (e.g., https://<project>.supabase.co/storage/v1/object/public/public/renders/<id>/<idx>.jpg) and a safe filename (e.g.,
  interior-design-<idx>.jpg).
      - Output: new URL with ?download=<filename>. If URL already has a query, append &download=.
  - UI updates:
      - ImageCard: add a Download button to the desktop hover toolbar and the mobile action bar. On click, create an anchor, set href to the Supabase
  download URL, call click() within the same tick.
      - ImageViewerDialog: add a Download button next to Close/Delete.
      - ResultsGrid bulk action: switch to the Supabase download URL (stop inferring extensions). Fire sequential clicks with a short micro‑delay to avoid
  throttling. For now, we won’t ZIP; keep it simple.
  - Filenames:
      - Use deterministic names: interior-design-<renderId>-<index>.jpg or interior-design-<timestamp>.jpg.
      - Sanitize to [a‑z0‑9-_.]; always end with .jpg (our pipeline writes JPG).
  - Accessibility and UI polish:
      - aria-label="Download" and tooltips.
      - Show toast on failure (rare).
  - Testing matrix:
      - iOS Safari (latest): single image download from ImageCard and from Viewer.
      - Chrome/Firefox/Edge macOS + Windows.
      - Mobile Chrome/Android.
      - Confirm no new tab flashes and file lands with expected name.

  Alternatives Considered (and why we’re not choosing them now)

  - Client “blob” download (fetch → blob → object URL → download): adds CORS and memory pressure, still hit‑or‑miss on iOS. Not necessary since Supabase
  provides header‑driven download. (developer.mozilla.org (https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/a?utm_source=openai))
  - Server proxy route (Next.js Route Handler streams bytes with Content‑Disposition): reliable but adds server egress, complexity, and latency;
  unnecessary given Supabase’s ?download support. Keep as a future option for private buckets or if we later hide storage origin. (nextjs.org (https://
  nextjs.org/docs/14/app/building-your-application/routing/route-handlers?utm_source=openai))

  Key References

  - Supabase Storage “Downloading”: use ?download or ?download=<name>. (supabase.com (https://supabase.com/docs/guides/storage/serving/downloads?
  utm_source=openai))
  - Supabase getPublicUrl with download option. (supabase.com (https://supabase.com/docs/reference/javascript/storage-from-getpublicurl?utm_source=openai))
  - MDN: <a download> works only same‑origin; not reliable cross‑origin. (developer.mozilla.org (https://developer.mozilla.org/docs/Web/HTML/Reference/
  Elements/a?utm_source=openai))
  - Chrome blocks cross‑origin <a download> (historical, still relevant): prefer server header. (stackoverflow.com (https://stackoverflow.com/
  questions/49474775/chrome-65-blocks-cross-origin-a-download-client-side-workaround-to-force-down?utm_source=openai))
  - MDN: Content‑Disposition: attachment triggers download with filename. (developer.mozilla.org (https://developer.mozilla.org/en-US/docs/Web/HTTP/
  Headers/Content-Disposition.?utm_source=openai))

  If this plan looks good, I’ll prepare a targeted patch:

  - Add the helper (e.g., libs/url/download.ts).
  - Wire the new Download buttons in ImageCard and ImageViewerDialog.
  - Switch ResultsGrid “Download All” to ?download URLs.
  - Keep changes minimal and consistent with our component style.