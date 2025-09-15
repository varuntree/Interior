# SEO Playbook — QuickDesignHome

This repository uses the Next.js App Router metadata system for a fast, maintainable SEO setup. This file documents what we ship and how to extend it safely.

## Canonical Domain
- Production base URL: `https://quickdesignhome.com`
- Set `NEXT_PUBLIC_APP_URL` in all environments (preview deploys should set their own URL to avoid leaking production links).
- Host-level redirect: `www.quickdesignhome.com` → apex.

## Global Metadata
- Root file: `app/layout.tsx`
  - Sets `viewport.themeColor` from `config.colors.main`.
  - Loads Open Sans via `next/font/google` (display: swap) to reduce CLS.
  - Default SEO via `getSEOTags()` (see below).
- Helper: `libs/seo.tsx`
  - `getSEOTags({ title, description, canonicalUrlRelative, extraTags })` returns a Next `Metadata` object with sensible defaults.
  - Uses `NEXT_PUBLIC_APP_URL` to create absolute URLs (`metadataBase`), falling back to `https://quickdesignhome.com` in dev.
  - Open Graph defaults (locale `en_US`, type `website`) and Twitter card `summary_large_image`.

## Native Sitemap & Robots
- `app/sitemap.ts` — Dynamic sitemap that includes:
  - Home, blog index, legal pages.
  - All blog article, author, and category pages derived from `app/(marketing)/blog/_assets/content.tsx`.
- `app/robots.ts` — Robots policy:
  - Allow `/`.
  - Disallow `/dashboard`, `/api`, `/signin`, `/start-checkout`, `/checkout`.
  - Points `sitemap` to `NEXT_PUBLIC_APP_URL + /sitemap.xml`.
- Removed `next-sitemap` and all generated artifacts in `public/`.

## Page Metadata & Robots
- Homepage: `app/(marketing)/page.tsx`
  - Exports metadata with canonical `/` and product‑specific title/description.
  - Adds Organization and WebSite JSON‑LD.
- Sign-in: `app/(marketing)/signin/layout.tsx`
  - Canonical `/signin` and `robots: noindex, nofollow`.
- Dashboard (private): `app/(app)/dashboard/layout.tsx`
  - `robots: noindex, nofollow`.
- Community (thin until curated): `app/(marketing)/community/*`
  - `robots: noindex, nofollow` for now; remove when content is robust and include in sitemap.

## Blog System
- Content source: `app/(marketing)/blog/_assets/content.tsx`.
  - Authors: single `QuickDesignHome Team` entry.
  - Categories: `Features`, `Tutorials`.
  - Articles: one authoritative guide — `ai-virtual-staging-guide`.
  - OG image requirements: 1200×630, referenced by `image.urlRelative` (currently reusing `/blog/introducing-supabase/header.png`).
- Rendering:
  - Index: `app/(marketing)/blog/page.tsx` with updated copy.
  - Article: `app/(marketing)/blog/[articleId]/page.tsx`:
    - `generateMetadata()` sets canonical and OG images.
    - Injects JSON‑LD `Article` schema.
  - Author/category pages compute metadata dynamically.

### Adding a New Article
1) Add an OG image under `public/blog/<slug>/header.png` (1200×630, optimized).
2) In `content.tsx`:
   - Add an `article` entry with fields: `slug`, `title`, `description`, `categories`, `author`, `publishedAt`, `image` (src import + `urlRelative`), and `content` JSX.
3) Build and run:
   - `npm run build` → ensure `/blog/<slug>` appears in `/sitemap.xml`.
   - Validate OG/Twitter previews and JSON‑LD in Google’s Rich Results test.

## Images & LCP
- Use `next/image` and mark only the first above‑the‑fold hero image as `priority`.
- Prefer AVIF/WebP for large hero assets. If you replace images in `public/landing/*`, keep the same filenames or update imports in `components/marketing/Hero.tsx`.
- Provide meaningful `alt` for accessibility and SEO.

## Verification Checklist
- `npm run typecheck && npm run lint && npm run build` pass.
- View page source on `/` and `/blog/ai-virtual-staging-guide`:
  - Canonical present and correct.
  - OG/Twitter tags present with absolute URLs.
  - JSON‑LD present and valid.
- `/sitemap.xml` includes home, legal, blog index, and the article.
- `/robots.txt` disallows private paths and references the sitemap.
- Lighthouse (mobile): SEO ≥ 90 and Performance ≥ 90 on home and the article (in CI or locally).

## Search Console
- Verify the domain property once deployed.
- Submit `/sitemap.xml`.
- Use URL Inspection to request indexing for `/` and the latest article.

## Notes
- Default locale is `en_US` for broad English targeting. Australian content remains first‑class in copy and presets.
- Keep SEO logic minimal and centralized; new pages should export `metadata`/`generateMetadata` and set a canonical.

