import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { articles } from "../_assets/content";
import BadgeCategory from "../_assets/components/BadgeCategory";
import Avatar from "../_assets/components/Avatar";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export async function generateMetadata({
  params,
}: {
  params: { articleId: string };
}) {
  const article = articles.find((entry) => entry.slug === params.articleId);
  if (!article) {
    return {};
  }

  return getSEOTags({
    title: article.title,
    description: article.description,
    canonicalUrlRelative: `/blog/${article.slug}`,
    extraTags: {
      openGraph: {
        title: article.title,
        description: article.description,
        url: `/blog/${article.slug}`,
        images: [
          {
            url: article.image.urlRelative,
            width: 1200,
            height: 630,
            alt: article.image.alt,
          },
        ],
      },
    },
  });
}

export default async function Article({
  params,
}: {
  params: { articleId: string };
}) {
  const article = articles.find((entry) => entry.slug === params.articleId);
  if (!article) {
    notFound();
  }

  const articlesRelated = articles
    .filter(
      (entry) =>
        entry.slug !== params.articleId &&
        entry.categories.some((c) =>
          article.categories.map((category) => category.slug).includes(c.slug)
        )
    )
    .sort(
      (a, b) =>
        new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf()
    )
    .slice(0, 3);

  const breadcrumbItems = [
    {
      name: "Home",
      item: `https://${config.domainName}/`,
    },
    {
      name: "Blog",
      item: `https://${config.domainName}/blog`,
    },
    {
      name: article.title,
      item: `https://${config.domainName}/blog/${article.slug}`,
    },
  ];

  return (
    <>
      <Script
        type="application/ld+json"
        id={`json-ld-article-${article.slug}`}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://${config.domainName}/blog/${article.slug}`,
            },
            name: article.title,
            headline: article.title,
            description: article.description,
            image: `https://${config.domainName}${article.image.urlRelative}`,
            datePublished: article.publishedAt,
            dateModified: article.publishedAt,
            author: {
              "@type": "Person",
              name: article.author.name,
            },
            publisher: {
              "@type": "Organization",
              name: config.appName,
              logo: {
                "@type": "ImageObject",
                url: `https://${config.domainName}/icon.png`,
              },
            },
          }),
        }}
      />

      <Script
        type="application/ld+json"
        id={`json-ld-breadcrumb-${article.slug}`}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbItems.map((crumb, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: crumb.name,
              item: crumb.item,
            })),
          }),
        }}
      />

      {article.faq && (
        <Script
          type="application/ld+json"
          id={`json-ld-faq-${article.slug}`}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: article.faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            }),
          }}
        />
      )}

      <div>
        <Link
          href="/blog"
          className="link !no-underline text-foreground/70 hover:text-foreground inline-flex items-center gap-1"
          title="Back to Blog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to Blog
        </Link>
      </div>

      <article>
        <section className="my-12 md:my-20 max-w-[800px]">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            {article.categories.map((category) => (
              <BadgeCategory
                category={category}
                key={category.slug}
                extraStyle="!badge-lg"
              />
            ))}
            <span className="text-foreground/70" itemProp="datePublished">
              {new Date(article.publishedAt).toLocaleDateString("en-AU", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 md:mb-8">
            {article.title}
          </h1>

          <p className="text-foreground/80 md:text-lg max-w-[700px]">
            {article.description}
          </p>
        </section>

        <div className="flex flex-col md:flex-row">
          <section className="max-md:pb-4 md:pl-12 max-md:border-b md:border-l md:order-last md:w-72 shrink-0 border-border/20">
            <p className="text-foreground/70 text-sm mb-2 md:mb-3">Posted by</p>
            <Avatar article={article} />

            {articlesRelated.length > 0 && (
              <div className="hidden md:block mt-12">
                <p className="text-foreground/70 text-sm mb-2 md:mb-3">
                  Related reading
                </p>
                <div className="space-y-3">
                  {articlesRelated.map((entry) => (
                    <div key={entry.slug}>
                      <p className="mb-0.5">
                        <Link
                          href={`/blog/${entry.slug}`}
                          className="link link-hover hover:link-primary font-medium"
                          title={entry.title}
                          rel="bookmark"
                        >
                          {entry.title}
                        </Link>
                      </p>
                      <p className="text-foreground/70 text-sm">
                        {entry.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="w-full max-md:pt-4 md:pr-20 space-y-12 md:space-y-20">
            {article.content}

            {article.faq && (
              <div className="space-y-6 rounded-3xl border border-border/40 bg-muted/20 p-8">
                <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
                <div className="space-y-4">
                  {article.faq.map((item) => (
                    <div key={item.question}>
                      <p className="font-medium text-foreground">{item.question}</p>
                      <p className="text-foreground/80 leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </article>
    </>
  );
}
