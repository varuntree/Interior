import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { categories, articles } from "./_assets/content";
import CardArticle from "./_assets/components/CardArticle";
import CardCategory from "./_assets/components/CardCategory";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";
import { Button } from "@/components/ui/button";

export const metadata = getSEOTags({
  title: `${config.appName} Blog | AI Interior Design Guides`,
  description:
    "Tips and tutorials on AI virtual staging, interior redesign, and styles — plus product updates.",
  canonicalUrlRelative: "/blog",
});

export default async function Blog() {
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf()
  );

  const [featuredArticle, ...otherArticles] = sortedArticles;
  const secondaryArticles = otherArticles.slice(0, 5);

  return (
    <div className="space-y-24">
      <header className="relative isolate overflow-hidden rounded-[2.5rem] border border-border/40 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-16 md:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,var(--primary)/25%,transparent_55%)]" aria-hidden />
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-6 text-left">
          <span className="rounded-full border border-primary/30 bg-background/80 px-4 py-1 text-sm font-medium text-primary shadow-sm">
            Insights & real workflows
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            The QuickDesignHome Journal
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-foreground/80">
            Practical guides on AI virtual staging, Australian-inspired interiors, and shipping faster with the right workflows. Every article is written from hands-on experience.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="shadow-md shadow-primary/20">
              <Link href="/signin">
                Start generating
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              View plans
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {featuredArticle && (
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
          <article className="flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-background shadow-xl shadow-black/5">
            <div className="relative aspect-[4/3] bg-muted">
              {featuredArticle.image?.src ? (
                <Image
                  src={featuredArticle.image.src}
                  alt={featuredArticle.image.alt}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
              ) : null}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/10" aria-hidden />
            </div>
            <div className="flex flex-1 flex-col gap-5 p-8">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-primary">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Featured</span>
                <time className="text-foreground/60" dateTime={featuredArticle.publishedAt}>
                  {new Date(featuredArticle.publishedAt).toLocaleDateString("en-AU", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>
              <div className="space-y-4">
                <h2 className="text-balance text-3xl font-semibold text-foreground sm:text-4xl">
                  {featuredArticle.title}
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  {featuredArticle.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {featuredArticle.categories.map((category) => (
                  <span
                    key={category.slug}
                    className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground/80"
                  >
                    {category.titleShort ?? category.title}
                  </span>
                ))}
              </div>
              <div className="mt-auto">
                <Button asChild variant="secondary" size="lg">
                  <Link href={`/blog/${featuredArticle.slug}`}>
                    Read the full guide
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </article>

          <aside className="flex flex-col gap-6 rounded-3xl border border-border/40 bg-muted/30 p-8 shadow-inner">
            <h2 className="text-lg font-semibold uppercase tracking-wide text-foreground/80">
              Why this guide matters
            </h2>
            <ul className="space-y-4 text-sm leading-relaxed text-foreground/75">
              <li>Step-by-step workflow for AI staging that mirrors production use.</li>
              <li>Original before/after imagery shot to Australian real-estate standards.</li>
              <li>FAQ schema and prompt templates ready to reuse in your projects.</li>
            </ul>
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-sm text-foreground/80">
              Want crisper renders? Pair it with our photography checklist below.
            </div>
            <Link
              href="/blog/how-to-photograph-rooms-for-ai-virtual-staging"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              Open the shooting guide
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </aside>
        </section>
      )}

      <section className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">Latest insights</h2>
            <p className="text-sm text-foreground/70">Fresh tutorials, product updates, and Aussie styling tips.</p>
          </div>
          <Link
            href="/blog/category/tutorial"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
          >
            Browse tutorials
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <ol className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3" itemScope itemType="https://schema.org/ItemList">
          {secondaryArticles.map((article, index) => (
            <li
              key={article.slug}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              <meta itemProp="position" content={`${index + 1}`} />
              <CardArticle article={article} tag="h3" />
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">Explore by topic</h2>
            <p className="text-sm text-foreground/70">Curated clusters make it easy to dive into the style or workflow you need.</p>
          </div>
        </div>
        <nav aria-label="Blog categories">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <CardCategory key={category.slug} category={category} tag="div" />
            ))}
          </div>
        </nav>
      </section>

      <section className="rounded-3xl border border-border/50 bg-muted/30 p-10 text-center shadow-inner">
        <h2 className="text-2xl font-semibold text-foreground">Stay in the loop</h2>
        <p className="mt-3 text-foreground/70">
          New breakdowns land monthly. Bookmark this page or sign in and we’ll remind you inside the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/signin">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go to homepage</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
