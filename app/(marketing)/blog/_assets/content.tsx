import type { JSX } from "react";
import Image, { StaticImageData } from "next/image";
import stagingGuideImg from "@/public/blog/introducing-supabase/header.png";

// ==================================================================================================================================================================
// BLOG CATEGORIES 🏷️
// ==================================================================================================================================================================

export type categoryType = {
  slug: string;
  title: string;
  titleShort?: string;
  description: string;
  descriptionShort?: string;
};

// These slugs are used to generate pages in the /blog/category/[categoryI].js. It's a way to group articles by category.
const categorySlugs: { [key: string]: string } = {
  feature: "feature",
  tutorial: "tutorial",
};

// All the blog categories data display in the /blog/category/[categoryI].js pages.
export const categories: categoryType[] = [
  {
    // The slug to use in the URL, from the categorySlugs object above.
    slug: categorySlugs.feature,
    // The title to display the category title (h1), the category badge, the category filter, and more. Less than 60 characters.
    title: "New Features",
    // A short version of the title above, display in small components like badges. 1 or 2 words
    titleShort: "Features",
    // The description of the category to display in the category page. Up to 160 characters.
    description:
      "Here are the latest features we've added to QuickDesignHome. We're constantly improving the product to help you design faster.",
    // A short version of the description above, only displayed in the <Header /> on mobile. Up to 60 characters.
    descriptionShort: "Latest features added to QuickDesignHome.",
  },
  {
    slug: categorySlugs.tutorial,
    title: "How Tos & Tutorials",
    titleShort: "Tutorials",
    description:
      "Learn how to use QuickDesignHome with these step-by-step tutorials. We'll show you how to design faster and save time.",
    descriptionShort:
      "Learn how to use QuickDesignHome with these step-by-step tutorials.",
  },
];

// ==================================================================================================================================================================
// BLOG AUTHORS 📝
// ==================================================================================================================================================================

export type authorType = {
  slug: string;
  name: string;
  job: string;
  description: string;
  avatar: StaticImageData | string;
  socials?: {
    name: string;
    icon: JSX.Element;
    url: string;
  }[];
};

// (No social icons for now)

// These slugs are used to generate pages in the /blog/author/[authorId].js. It's a way to show all articles from an author.
const authorSlugs: {
  [key: string]: string;
} = {
  team: "team",
};

// All the blog authors data display in the /blog/author/[authorId].js pages.
export const authors: authorType[] = [
  {
    slug: authorSlugs.team,
    name: "QuickDesignHome Team",
    job: "Interior AI & Product",
    description:
      "We build QuickDesignHome — practical guides on AI virtual staging and redesign.",
    avatar: "/icon.png",
    socials: [],
  },
];

// ==================================================================================================================================================================
// BLOG ARTICLES 📚
// ==================================================================================================================================================================

export type articleType = {
  slug: string;
  title: string;
  description: string;
  categories: categoryType[];
  author: authorType;
  publishedAt: string;
  image: {
    src?: StaticImageData;
    urlRelative: string;
    alt: string;
  };
  content: JSX.Element;
};

// These styles are used in the content of the articles. When you update them, all articles will be updated.
const styles: {
  [key: string]: string;
} = {
  h2: "text-2xl lg:text-4xl font-bold tracking-tight mb-4 text-base-content",
  h3: "text-xl lg:text-2xl font-bold tracking-tight mb-2 text-base-content",
  p: "text-base-content/90 leading-relaxed",
  ul: "list-inside list-disc text-base-content/90 leading-relaxed",
  li: "list-item",
  // Altnernatively, you can use the library react-syntax-highlighter to display code snippets.
  code: "text-sm font-mono bg-neutral text-neutral-content p-6 rounded-box my-4 overflow-x-scroll select-all",
  codeInline:
    "text-sm font-mono bg-base-300 px-1 py-0.5 rounded-box select-all",
};

// All the blog articles data display in the /blog/[articleId].js pages.
export const articles: articleType[] = [
  {
    slug: "ai-virtual-staging-guide",
    title: "AI Virtual Staging & Interior Redesign: 2025 Guide",
    description:
      "Learn how to transform listing photos and room shots with AI virtual staging and redesign in minutes using QuickDesignHome.",
    categories: [
      categories.find((category) => category.slug === categorySlugs.tutorial)!,
    ],
    author: authors.find((author) => author.slug === authorSlugs.team)!,
    publishedAt: "2025-09-15",
    image: {
      src: stagingGuideImg,
      urlRelative: "/blog/introducing-supabase/header.png",
      alt: "Before and after virtual staging of a modern living room",
    },
    content: (
      <>
        <Image
          src={stagingGuideImg}
          alt="Before and after virtual staging of a modern living room"
          width={700}
          height={500}
          priority={true}
          className="rounded-box"
          placeholder="blur"
        />

        <section>
          <h2 className={styles.h2}>What is AI Virtual Staging?</h2>
          <p className={styles.p}>
            Virtual staging uses AI to furnish or restyle an empty or dated room
            photo so buyers can imagine living there. With QuickDesignHome, you can
            restyle existing spaces (Redesign), stage empty rooms (Staging), or
            start from text ideas (Imagine) — all in under a minute.
          </p>
        </section>

        <section>
          <h2 className={styles.h2}>How QuickDesignHome Works</h2>
          <ul className={styles.ul}>
            <li className={styles.li}><strong>Upload</strong> a room photo or start from a prompt.</li>
            <li className={styles.li}><strong>Pick a style</strong> (e.g., Coastal, Modern, Minimal) and room type.</li>
            <li className={styles.li}><strong>Generate</strong> and get photoreal images tailored to your inputs.</li>
            <li className={styles.li}><strong>Save</strong> results to Favorites or Collections for easy sharing.</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.h2}>Best Practices for Great Results</h2>
          <ul className={styles.ul}>
            <li className={styles.li}>Use bright, well‑lit photos with a clear view of the room.</li>
            <li className={styles.li}>Choose the correct <em>Room Type</em> so furniture scale looks right.</li>
            <li className={styles.li}>Keep prompts short and specific: materials, mood, and one or two accents.</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.h2}>Try It Now</h2>
          <p className={styles.p}>
            Sign in and generate your first redesign for free. Upload a living room
            photo, pick a style, and see it transform in seconds.
          </p>
        </section>
      </>
    ),
  },
];
