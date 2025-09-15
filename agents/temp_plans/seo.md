Planning Brief

  ## Task Understanding

  - Replace current mixed SEO setup with a single, fast, App Router–native SEO system that ships with a high‑quality homepage and one authoritative article
  tailored to our product, and that stays easy to maintain as we grow.
  - Acceptance Criteria
      - Homepage and public marketing pages expose correct metadata (title, description, canonical, OG/Twitter, robots) and hit Lighthouse SEO ≥ 90
  (mobile).
      - /sitemap.xml and /robots.txt are generated via App Router file conventions (no postbuild generator) and include static and blog routes.
      - At least one production‑ready, product‑relevant article is live with correct OG image and JSON‑LD; no off‑topic template content remains.
      - Auth/private pages (e.g., /signin, /dashboard/*) are noindex and disallowed in robots.
      - LCP is optimized on the landing page (priority image, lighter format); fonts loaded via next/font to minimize CLS/FOIT.
      - Single “source of truth” for absolute URLs via NEXT_PUBLIC_APP_URL= https://quickdesignhome.com.
  - Locale Decision
      - Default to US English for broad English‑speaking reach, with AU‑relevant content in copy and future articles. Set og:locale=en_US. We can add en_AU
  targeting later via content and potential hreflang if we create locale variants.
  - Assumptions To Confirm
      - Canonical host: quickdesignhome.com (apex). www.quickdesignhome.com redirects to apex.
      - We can remove next-sitemap and public sitemap/robots artifacts.
      - Initial public “Community” content is thin; we will mark community pages noindex until content is robust.

  ## Constraints & Context

  - Current: Root metadata via libs/seo.tsx + app/layout.tsx; many pages lack explicit canonicals; next-sitemap runs postbuild and writes to public; blog
  templates are off-topic; article OG image path mismatches (.jpg vs .png).
  - Stack: Next.js App Router, TypeScript, Tailwind, no Server Actions. Marketing pages under app/(marketing).

  ## Option Set

  - Option A (recommended): Replace next-sitemap with native app/sitemap.ts and app/robots.ts, normalize page metadata, fix content and assets, optimize
  fonts/LCP. Pros: fewer moving parts, dynamic correctness, simpler ops. Cons: several edits across marketing pages.
  - Option B: Keep next-sitemap, patch content and metadata. Pros: smaller delta. Cons: extra tool, dynamic gaps persist.
  - Option C: Introduce next-seo library. Pros: helpers. Cons: overlaps with Next metadata; unnecessary dependency.

  ## Recommendation

  - Option A. Native Next file conventions simplify SEO, improve correctness for dynamic routes, and remove build coupling. Impact radius: medium
  (marketing pages + build scripts). Performance benefits from font/LCP improvements.

  ## Implementation Plan

  1. Research & Baseline (quick, official docs only)
      - Review Next.js App Router metadata, sitemap, robots, opengraph-image, image, and font optimizations; Google Search Essentials and Rich Results
  structured data basics.
      - Decide measurement: Lighthouse (mobile), Core Web Vitals (LCP < 2.5s target on home).
  2. Normalize Absolute URL Source
      - Establish NEXT_PUBLIC_APP_URL as the single base (dev fallback http://localhost:3000).
      - In app/layout.tsx: set metadataBase to new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').
      - In libs/seo.tsx: align to use NEXT_PUBLIC_APP_URL (stop inferring from config.domainName to avoid drift).
      - Acceptance: View page source → absolute OG URLs and canonical reflect quickdesignhome.com.
  3. Replace next-sitemap With App Router Conventions
      - Remove next-sitemap from package.json scripts (postbuild) and dependency list.
      - Delete next-sitemap.config.js and public/sitemap*.xml and public/robots.txt.
      - Add app/sitemap.ts:
          - Include: '/', '/privacy-policy', '/tos', '/blog'.
          - Include dynamic blog entries from app/(marketing)/blog/_assets/content.tsx (articles, authors, categories).
          - Option: exclude /community for now (thin content) or add only the index page later when content is richer.
      - Add app/robots.ts:
          - Allow: /
          - Disallow: /dashboard, /api, /signin, /checkout*, any other private segments.
          - Reference: sitemap at /sitemap.xml and host quickdesignhome.com.
      - Acceptance: GET /sitemap.xml and /robots.txt show correct output; no public/sitemap*.xml artifacts remain.
  4. Homepage SEO & Structured Data
      - In app/(marketing)/page.tsx, export metadata or generateMetadata:
          - title: “QuickDesignHome — AI Interior Design & Virtual Staging”
          - description: concise, product‑aligned (≤ 160 chars).
          - alternates.canonical: '/'
          - openGraph defaults derive from metadataBase; ensure proper images (opengraph-image.png, twitter-image.png).
          - robots: index, follow.
          - og:locale: 'en_US'
      - Add JSON‑LD:
          - Organization (name, url, logo), and WebSite with potentialSearchAction for branded search, or keep SoftwareApplication as a secondary schema
  if desired.
      - Acceptance: Rich Results test passes; Lighthouse SEO ≥ 90; canonical visible; OG/Twitter preview renders.
  5. Font Optimization
      - In app/layout.tsx, load Open Sans via next/font/google with display: 'swap' and subsets appropriate for English.
      - Apply the returned className on <html> and wire CSS variable (if needed) or drop the --font-open-sans indirection.
      - Acceptance: No FOIT/CLS warnings; fonts served locally; Lighthouse flags resolved.
  6. Image/LCP Optimization (Landing)
      - Convert hero/feature PNGs under public/landing to WebP or AVIF (keep PNG fallback if needed). Keep naming stable or update imports.
      - In Hero.tsx, ensure only the first visible image uses priority; keep sizes accurate; ensure alt is descriptive.
      - Check that no oversized images are downloaded above the fold; quality tuned for fast first paint.
      - Acceptance: LCP image is prioritized; LCP trend < 2.5s in local simulated 4G; Lighthouse performance improves.
  7. Blog System — Content & Metadata
      - Content reset:
          - Remove off‑topic templates; keep exactly one authoritative article:
              - slug: ai-virtual-staging-guide
              - title: “AI Virtual Staging & Redesign: 2025 Guide for Homeowners and Agents”
              - description: actionable, product‑relevant summary (≤ 160 chars).
              - categories: Tutorials (or “Guide” equivalent).
              - author: “QuickDesignHome Team” (add author record + team avatar or logo).
              - OG image: 1200×630, web-optimized (add file to public/blog/ai-virtual-staging-guide/header.png or .webp).
              - JSON‑LD Article already handled in blog/[articleId]/page.tsx; ensure image URL matches the actual file extension.
          - Update blog index copy to match product and category names.
      - Path fixes:
          - Fix current sample article OG image mismatch: use .png path if the file is .png, or add a .jpg asset to match path.
      - Acceptance: Visiting /blog and /blog/ai-virtual-staging-guide → correct metadata, OG card renders, JSON‑LD valid, content relevant.
  8. Canonicals & Robots Hygiene
      - /signin: set canonical to '/signin' and robots: noindex, nofollow (already exports metadata; adjust).
      - Private pages: ensure /dashboard/* has noindex via layout or route metadata (and is disallowed in robots.txt).
      - Community pages: until curated content is meaningful, set robots: noindex on /community and /community/[collectionId]; remove noindex later when
  content is strong and included in sitemap.
      - Acceptance: View page source → robots meta on these pages; URLs absent from sitemap.
  9. Consolidate SEO Helper
      - Keep libs/seo.tsx as a thin helper for per‑page metadata (title/description/canonical) now backed by NEXT_PUBLIC_APP_URL.
      - Remove unused exports (e.g., renderSchemaTags if not used) or modernize it to Organization/WebSite JSON‑LD and consume from home page.
      - Acceptance: No dead code; helper aligns with Next metadata patterns.
  10. Configuration & Domain Consistency

  - config.ts: ensure appName/appDescription tuned for SEO; domainName: "quickdesignhome.com".
  - Ensure NEXT_PUBLIC_APP_URL= https://quickdesignhome.com (prod) and is set in deployment envs.
  - If hosting supports, enforce apex as canonical via domain settings (301 from www to apex).

  11. Build, Validate, Iterate

  - npm run typecheck, npm run lint, npm run build.
  - Manual checks:
      - View source → canonical, OG, Twitter tags on home and article.
      - /sitemap.xml includes home, legal, blog, and the new article; not /dashboard; not /signin.
      - /robots.txt disallows private paths and points to the sitemap.
  - Lighthouse (mobile, home and the article pages): Performance and SEO ≥ 90; images lazy-load below the fold; no console errors.

  12. Integrations & Operations

  - Google Search Console: verify domain property; submit /sitemap.xml; set preferred domain; monitor coverage and enhancements.
  - Set up analytics (if desired) ensuring non‑blocking and privacy‑respecting; ensure no client secrets in public code.
  - Prepare redirects (www → apex) at DNS/host level.

  13. Rollout & Cutover

  - Single PR with all changes; preview deploy; perform all validations above.
  - Merge and deploy to prod; immediately verify:
      - /sitemap.xml & /robots.txt
      - Homepage meta, OG preview
      - Blog article meta, JSON‑LD
      - Lighthouse scores
  - Submit sitemap in Search Console; request indexing for home and the article.

  14. Legacy Cleanup

  - Remove next-sitemap: script, config file, dependency, and generated public files.
  - Remove off‑topic blog templates and unused assets.
  - Prune unused SEO helpers and comments.
  - Update README with the “SEO Playbook” (below).

  15. Risks & Mitigations

  - Base URL drift (config vs env): rely only on NEXT_PUBLIC_APP_URL; validate at runtime and log a warning in dev if missing.
  - Thin content indexing: community and auth pages explicitly noindex; sitemap excludes them.
  - LCP regressions due to carousel or heavy assets: only first hero uses priority; convert images; keep animation light above the fold.
  - OG image mistakes: add a checklist for image presence/size/URL extension before merge.

  16. Research Step (explicit)

  - Before coding, skim the latest official docs for any changes:
      - Next.js App Router: metadata, sitemap/robots, opengraph-image, images, fonts.
      - Google Search Central: basic SEO, structured data (Organization, WebSite, Article), image best practices.
      - web.dev Lighthouse guidance and Core Web Vitals.

  ## Quality Gates

  - Static
      - Typecheck, lint, and build pass.
      - No next-sitemap remnants; no public sitemap/robots files checked in.
  - Code Health
      - No TODO/FIXME left; helpers are minimal; dead code removed.
      - No duplicated SEO logic across pages; canonical consistently applied.
  - Manual Smoke
      - Inspect home and blog article: canonical/OG/Twitter/robots correct; JSON‑LD valid.
      - /sitemap.xml includes expected URLs only.
      - /robots.txt disallows /dashboard, /signin, /api; references sitemap.
      - Lighthouse mobile ≥ 90 for Performance and SEO on home and article.
  - Content
      - Article is genuinely helpful, product‑aligned, and internally links to the generator (CTA to /signin or /dashboard depending on auth).

  ## Observability & Ops

  - Optional log on app/sitemap.ts and app/robots.ts responses (server logs) for quick verification on deploy day.
  - Monitor Search Console coverage; fix any “Alternate page with proper canonical” or “Duplicate, submitted URL not selected as canonical” warnings by
  adjusting canonicals if needed.
  - Ensure DNS/host redirects in place for canonical domain.

  ## Rollout & Cutover

  - Merge PR, deploy preview, validate checklists, then deploy prod.
  - Immediately:
      - Verify site meta pages, robots/sitemap.
      - Submit sitemap in Search Console; request indexing for '/' and '/blog/ai-virtual-staging-guide'.
  - Rollback: revert PR to prior commit if critical issues; artifacts (sitemap/robots) will revert as well.

  ## Legacy Cleanup

  - Delete:
      - next-sitemap.config.js
      - public/sitemap.xml, public/sitemap-0.xml, public/robots.txt
      - package.json postbuild script for next-sitemap and dependency.
      - Off-topic blog content and unused images.
  - Update docs: README and ai_docs to reflect native App Router SEO conventions.

  ## Open Questions

  - Do we want to expose community pages in sitemap on day one, or hold until we publish 1–2 curated collections with descriptive copy?
  - Should we add dynamic OG generation for the homepage (opengraph-image.tsx) to include a title overlay for better CTR?

  ———

  SEO Playbook (Repository Documentation)

  - Purpose
      - Define a single, repeatable approach to SEO in this Next.js App Router codebase that covers metadata, sitemaps/robots, structured data, images, and
  content hygiene.
  - Canonical Domain & Base URL
      - Set NEXT_PUBLIC_APP_URL to the canonical HTTPS origin: https://quickdesignhome.com.
      - app/layout.tsx must set metadataBase using NEXT_PUBLIC_APP_URL.
      - Host‑level redirects: www → apex.
  - File Conventions
      - app/sitemap.ts: programmatically return all public routes. Include blog dynamic routes from app/(marketing)/blog/_assets/content.tsx. Exclude
  private/auth routes and thin pages.
      - app/robots.ts: Allow everything; Disallow /dashboard, /api, /signin (and other private areas). Reference sitemap at /sitemap.xml.
      - Page metadata: export metadata or generateMetadata per page. Always set alternates.canonical.
  - Metadata & Robots
      - Homepage:
          - Title: “QuickDesignHome — AI Interior Design & Virtual Staging”
          - Description: ≤160 chars, product‑specific.
          - Canonical: '/'
          - Robots: index, follow
          - og:locale: 'en_US'
      - Auth/Private:
          - Robots: noindex, nofollow
          - Disallow in robots.txt
      - Community (until content is ready):
          - Robots: noindex and omit from sitemap
      - Blog:
          - Article pages set canonical to '/blog/[slug]' and ensure OG images array.
  - Structured Data
      - Home: Organization + WebSite JSON‑LD. Optional SoftwareApplication schema referencing key product attributes.
      - Blog Article: Article JSON‑LD (author, headline, image, datePublished, mainEntityOfPage). Already scaffolded in article page.
  - Images & LCP
      - Use next/image; ensure LCP element (first large hero image) uses priority.
      - Convert large hero PNGs under public/landing to WebP/AVIF; keep accessible alt text.
      - OG/Twitter images: 1200×630; <= ~1MB preferred. Keep under app/ or public/ with stable paths.
  - Fonts
      - Load via next/font/google in app/layout.tsx (Open Sans, display: 'swap'); apply returned className to <html> to avoid FOIT/CLS.
  - Content Guidelines (Blog)
      - Write product‑relevant, helpful articles. Each article should:
          - Target a clear query (e.g., “AI virtual staging” or “AI interior design styles”).
          - Use clear headings, short paragraphs, images with alt text, and internal links to the product.
          - Include a compelling CTA to try the generator.
          - Provide an OG image (1200×630) and ensure metadata/generateMetadata is correct.
  - Sitemap Hygiene
      - Include only stable, indexable routes that users should land on.
      - Exclude private, thin, or paginated duplicates.
      - After deploy, submit /sitemap.xml in Search Console.
  - Verification Checklist (Pre‑Deploy)
      - metadataBase uses NEXT_PUBLIC_APP_URL.
      - Homepage: canonical '/', OG/Twitter tags, JSON‑LD Organization/WebSite.
      - /sitemap.xml enumerates home, blog, legal, and article(s).
      - /robots.txt disallows /dashboard, /api, /signin.
      - Lighthouse (mobile): SEO ≥ 90, Performance ≥ 90 on homepage and article.
      - OG previews render correctly on Slack/Twitter validators.
  - Post‑Deploy
      - Search Console: verify domain property, submit sitemap, check coverage after 24–48h.
      - Monitor Core Web Vitals and address regressions (especially LCP) if they appear.
  - Ongoing Maintenance
      - New pages must export metadata or generateMetadata and a canonical.
      - When adding blog articles, ensure:
          - OG image present and sized properly.
          - JSON‑LD Article fields filled.
          - app/sitemap.ts includes the new route (if pulling from a central content list, it will auto‑appear).

  ———

  If you want, I can turn this plan into a single, scoped PR with the exact file edits, ensuring quick iteration and review before deployment to
  quickdesignhome.com.
