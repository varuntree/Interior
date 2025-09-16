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
- Content lives in `app/(marketing)/blog/_assets/content.tsx`.
  - Authors: currently a single `QuickDesignHome Team` profile (extend as we add specialists).
  - Categories: `Features`, `How Tos & Tutorials`, and `Australian Styles` (used for clustering AU-focused expertise).
  - Articles (September 2025):
    - `ai-virtual-staging-guide` (pillar, with FAQ schema and rich media gallery).
    - `how-to-photograph-rooms-for-ai-virtual-staging` (supporting shoot guide).
  - Each article supplies `faq?: FAQItem[]`; the page route injects `Article`, `BreadcrumbList`, and conditional `FAQPage` JSON-LD.
- Rendering:
  - Index: `app/(marketing)/blog/page.tsx` (sorts by `publishedAt`, surfaces up to six latest posts plus category tiles).
  - Article: `app/(marketing)/blog/[articleId]/page.tsx` (people-first layout, related links, structured data bundle, canonical + OG).
  - Author/category pages continue to compute metadata dynamically based on category definitions.

### Adding a New Article
1. Media
   - Add a hero asset at `public/blog/<slug>/header.(png|webp)` sized 1200×630 (≤300 KB). For galleries, import static assets via `next/image` to gain automatic blur placeholders.
2. Content entry
   - In `app/(marketing)/blog/_assets/content.tsx` add an object with `slug`, `title`, `description`, `categories`, `author`, `publishedAt`, `image`, and JSX `content`.
   - Optional: include a `faq` array (each `{ question, answer }`), which automatically emits FAQ schema.
3. Review
   - `npm run lint && npm run typecheck`.
   - Validate structured data in Google Rich Results tester.
   - Confirm `/sitemap.xml` now lists the article (Next.js handles this automatically off the content array).
4. Publish hygiene
   - Update internal links (pillar ↔ support) for topical authority.
   - Refresh publish dates in article copy if content is revised.

### Writing & layout guidelines (2025 Helpful Content alignment)
- **People-first detail**: weave real workflows, prompts, and AU-focused examples to demonstrate hands-on experience (E in E‑E‑A‑T).
- **Avoid over-optimisation**: keep language natural, skip thin listicles, and consolidate duplicate coverage—Google’s 2025 updates target generic or purely AI-spun content.
- **Structured data + architecture**: Article + Breadcrumb + FAQ schema and clear internal linking help crawlers understand topical depth. Keep content clustered and ensure mobile-friendly, fast pages.
- **Freshness & audits**: schedule quarterly reviews to update imagery, prompts, and stats so content stays accurate; stale assets drag engagement metrics.
- **UX polish**: maintain clean typography, accessible colour contrast, responsive image sizes via `next/image`, and compress assets (<300 KB) to protect LCP.

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
