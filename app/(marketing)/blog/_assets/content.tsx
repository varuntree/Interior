import type { JSX } from "react";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import stagedHero from "@/public/blog/ai-virtual-staging-guide/header.png";
import livingBefore from "@/public/blog/ai-virtual-staging-guide/living_coastal_before.png";
import livingAfter from "@/public/blog/ai-virtual-staging-guide/living_coastal_after.png";
import bedroomBefore from "@/public/blog/ai-virtual-staging-guide/bedroom_hamptons_before.png";
import bedroomAfter from "@/public/blog/ai-virtual-staging-guide/bedroom_hamptons_after.png";
import kitchenBefore from "@/public/blog/ai-virtual-staging-guide/kitchen_japandi_before.png";
import kitchenAfter from "@/public/blog/ai-virtual-staging-guide/kitchen_japandi_after.png";
import bathroomBefore from "@/public/blog/ai-virtual-staging-guide/bathroom_scandi_before.png";
import bathroomAfter from "@/public/blog/ai-virtual-staging-guide/bathroom_scandi_after.png";
import officeBefore from "@/public/blog/ai-virtual-staging-guide/office_minimal_compose_before.png";
import officeAfter from "@/public/blog/ai-virtual-staging-guide/office_minimal_compose_after.png";
import officeReference from "@/public/blog/ai-virtual-staging-guide/office_minimal_compose_ref.png";
import cornerVsFlat from "@/public/blog/how-to-photograph-rooms-for-ai-virtual-staging/corner_vs_flat.png";
import daylightVsMixed from "@/public/blog/how-to-photograph-rooms-for-ai-virtual-staging/daylight_vs_mixed.png";
import declutterChecklist from "@/public/blog/how-to-photograph-rooms-for-ai-virtual-staging/declutter_checklist.png";
import heightDiagram from "@/public/blog/how-to-photograph-rooms-for-ai-virtual-staging/height_diagram.png";
import levelGrid from "@/public/blog/how-to-photograph-rooms-for-ai-virtual-staging/level_grid.png";

export type categoryType = {
  slug: string;
  title: string;
  titleShort?: string;
  description: string;
  descriptionShort?: string;
};

const categorySlugs: { [key: string]: string } = {
  feature: "feature",
  tutorial: "tutorial",
  styles: "styles",
};

export const categories: categoryType[] = [
  {
    slug: categorySlugs.feature,
    title: "New Features",
    titleShort: "Features",
    description:
      "Here are the latest features we've added to QuickDesignHome. We're constantly improving the product to help you design faster.",
    descriptionShort: "Latest product improvements and releases.",
  },
  {
    slug: categorySlugs.tutorial,
    title: "How Tos & Tutorials",
    titleShort: "Tutorials",
    description:
      "Learn how to use QuickDesignHome with these step-by-step tutorials. We'll show you how to design faster and save time.",
    descriptionShort: "Learn how to get the most out of QuickDesignHome.",
  },
  {
    slug: categorySlugs.styles,
    title: "Australian Styles",
    titleShort: "Styles",
    description:
      "Explore Australian-inspired looks, materials, and palettes that translate beautifully through AI staging.",
    descriptionShort: "Aussie-inspired palettes and styling tips.",
  },
];

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

const authorSlugs: {
  [key: string]: string;
} = {
  team: "team",
};

export const authors: authorType[] = [
  {
    slug: authorSlugs.team,
    name: "QuickDesignHome Team",
    job: "Interior AI & Product",
    description:
      "We build QuickDesignHome — practical guides on AI virtual staging, AU-inspired styling, and how to ship fast.",
    avatar: "/icon.png",
    socials: [],
  },
];

export type FAQItem = {
  question: string;
  answer: string;
};

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
  faq?: FAQItem[];
};

const styles: {
  [key: string]: string;
} = {
  h2: "text-2xl lg:text-4xl font-bold tracking-tight mb-4 text-foreground",
  h3: "text-xl lg:text-2xl font-semibold tracking-tight mb-3 text-foreground",
  p: "text-foreground/80 leading-relaxed",
  ul: "list-inside list-disc text-foreground/80 leading-relaxed space-y-2",
  li: "list-item",
  code: "text-sm font-mono bg-muted px-2 py-1 rounded",
};

const imageSizes = "(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 900px";

export const articles: articleType[] = [
  {
    slug: "ai-virtual-staging-guide",
    title: "AI Virtual Staging & Interior Redesign: 2025 Guide",
    description:
      "Learn a simple, repeatable workflow, smart prompts, and Aussie-friendly styles to turn plain rooms into polished interiors with AI.",
    categories: [categories.find((c) => c.slug === categorySlugs.tutorial)!, categories.find((c) => c.slug === categorySlugs.styles)!],
    author: authors.find((author) => author.slug === authorSlugs.team)!,
    publishedAt: "2025-09-16",
    image: {
      src: stagedHero,
      urlRelative: "/blog/ai-virtual-staging-guide/header.png",
      alt: "Before and after living room redesign in a Coastal Australian style",
    },
    content: (
      <article className="space-y-12">
        <Image
          src={stagedHero}
          alt="Freshly restyled Coastal Australian living room"
          priority
          placeholder="blur"
          className="w-full rounded-3xl border border-border/50 shadow-xl"
          sizes="(max-width: 1024px) 100vw, 900px"
        />

        <section className="grid gap-6">
          <p className={styles.p}>
            If you’ve stared at a tired listing photo and thought, “This could look brilliant,” you’re in the right place. AI virtual staging lets you restyle rooms, add furniture, or dream up concepts from scratch — fast, affordable, and believable. This guide walks through the exact workflow we use inside QuickDesignHome, plus smart prompts, photo tips, and the Australian styles that resonate globally.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>What “virtual staging” actually means</h2>
          <p className={styles.p}>
            Virtual staging takes a real room photo and re-furnishes or restyles it digitally. The walls, windows, and layout stay grounded in reality; the furniture, palette, and decor get a glow-up. Done right, buyers see potential rather than fantasy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>The four modes (which one suits your job?)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
              <h3 className={styles.h3}>Redesign</h3>
              <p className={styles.p}>Keep the bones; swap the furnishings, palette, and decor. Perfect for dated but furnished rooms.</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
              <h3 className={styles.h3}>Staging</h3>
              <p className={styles.p}>Furnish empty or under-styled rooms. Ideal for rentals, new builds, or properties mid-reno.</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
              <h3 className={styles.h3}>Compose</h3>
              <p className={styles.p}>Blend a base room with a reference photo — great for matching a moodboard or hero object.</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
              <h3 className={styles.h3}>Imagine</h3>
              <p className={styles.p}>No photo required. Describe the scene and we’ll generate a photoreal concept in seconds.</p>
            </div>
          </div>
          <p className={styles.p}>Tip: limit yourself to one job at a time. We queue a single in-flight generation per user so the status stays obvious.</p>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>A simple, repeatable workflow</h2>
          <ol className="list-decimal space-y-3 pl-6 text-foreground/80">
            <li>Start with a clean photo — chest-height (about 1.3 m), level camera, tidy frame.</li>
            <li>Choose the mode, room type, and style preset that fits your space.</li>
            <li>Add a short prompt: materials + mood + one hero detail.</li>
            <li>Generate, review, and tweak one element at a time if you need another pass.</li>
            <li>Save favourites or client-ready sets into Collections so you can share the whole pack.</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Photo prep checklist (2 minutes, tops)</h2>
          <ul className={styles.ul}>
            <li className={styles.li}>Remove bins, cords, pet beds, random mail — even AI likes a clean canvas.</li>
            <li className={styles.li}>Open curtains, but avoid harsh midday glare. Pick daylight or lamps, not both.</li>
            <li className={styles.li}>If you’ve got a tripod, park it at chest height and keep vertical lines straight.</li>
            <li className={styles.li}>Shoot two angles per room so you can pick the strongest base later.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Australian styles, distilled</h2>
          <p className={styles.p}>Copy each add-on straight into your prompt or presets. They’ll play nicely with international buyers too.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/40 bg-background p-5 shadow-sm">
              <h3 className={styles.h3}>Coastal AU</h3>
              <p className={styles.p}>Light timber, off-white walls, linen, pale blues/greens, relaxed indoor-outdoor flow.</p>
              <p className="text-sm text-foreground/60">Prompt add-on: “light oak, linen sofa, pale coastal blues, airy and bright.”</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-background p-5 shadow-sm">
              <h3 className={styles.h3}>Hamptons AU</h3>
              <p className={styles.p}>Crisp whites, shaker profiles, soft greys, rattan or jute accents, breezy but polished.</p>
              <p className="text-sm text-foreground/60">Prompt add-on: “crisp white, soft greys, rattan and jute accents, relaxed coastal.”</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-background p-5 shadow-sm">
              <h3 className={styles.h3}>Japandi</h3>
              <p className={styles.p}>Natural timber, stone, paper shades, warm neutrals, low and uncluttered silhouettes.</p>
              <p className="text-sm text-foreground/60">Prompt add-on: “natural wood, stone, low furniture, uncluttered, warm neutral palette.”</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-background p-5 shadow-sm">
              <h3 className={styles.h3}>Scandi AU</h3>
              <p className={styles.p}>Pale timber, off-white, gentle pattern, plenty of light — easy-living without fuss.</p>
              <p className="text-sm text-foreground/60">Prompt add-on: “scandi coastal, pale timber accents, off-white, subtle striped textile.”</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className={styles.h2}>Before & after library</h2>
          <div className="grid gap-8">
            <figure className="grid gap-3">
              <div className="grid gap-4 md:grid-cols-2">
                <Image src={livingBefore} alt="Original living room before restyling" placeholder="blur" className="rounded-2xl border border-border/40" sizes={imageSizes} />
                <Image src={livingAfter} alt="Living room redesigned in a Coastal Australian palette" placeholder="blur" className="rounded-2xl border border-border/40" sizes={imageSizes} />
              </div>
              <figcaption className="text-sm text-foreground/60">Coastal AU redesign — light oak, linen, pale blue accents. Architecture untouched.</figcaption>
            </figure>

            <figure className="grid gap-3">
              <div className="grid gap-4 md:grid-cols-2">
                <Image src={bedroomBefore} alt="Plain bedroom before staging" placeholder="blur" className="rounded-2xl border border-border/40" sizes={imageSizes} />
                <Image src={bedroomAfter} alt="Hamptons Australian bedroom staging" placeholder="blur" className="rounded-2xl border border-border/40" sizes={imageSizes} />
              </div>
              <figcaption className="text-sm text-foreground/60">Hamptons AU staging — layered bedding, rattan, soft greys, breezy art.</figcaption>
            </figure>

            <figure className="grid gap-3">
              <div className="grid gap-4 md:grid-cols-2">
                <Image src={kitchenBefore} alt="Basic kitchen before redesign" placeholder="blur" className="rounded-2xl border border-border/40" sizes={imageSizes} />
                <Image src={kitchenAfter} alt="Japandi kitchen redesign" placeholder="blur" className="rounded-2xl border border-border/40" sizes={imageSizes} />
              </div>
              <figcaption className="text-sm text-foreground/60">Japandi refresh — oak fronts, soft stone, paper lantern, minimal styling.</figcaption>
            </figure>

            <figure className="grid gap-3">
              <div className="grid gap-4 md:grid-cols-2">
                <Image src={bathroomBefore} alt="Bathroom before redesign" placeholder="blur" className="rounded-2xl border border-border/40" sizes={imageSizes} />
                <Image src={bathroomAfter} alt="Scandi Australian bathroom redesign" placeholder="blur" className="rounded-2xl border border-border/40" sizes={imageSizes} />
              </div>
              <figcaption className="text-sm text-foreground/60">Scandi AU bathroom — floating vanity, matte black, warm neutral lighting.</figcaption>
            </figure>

            <figure className="grid gap-3">
              <div className="grid gap-4 md:grid-cols-3">
                <Image src={officeBefore} alt="Home office before compose" placeholder="blur" className="rounded-2xl border border-border/40 md:col-span-1" sizes={imageSizes} />
                <Image src={officeReference} alt="Material reference for Minimal AU home office" placeholder="blur" className="rounded-2xl border border-border/40 md:col-span-1" sizes={imageSizes} />
                <Image src={officeAfter} alt="Minimal Australian home office after compose" placeholder="blur" className="rounded-2xl border border-border/40 md:col-span-1" sizes={imageSizes} />
              </div>
              <figcaption className="text-sm text-foreground/60">Compose mode — match a reference palette and keep the architecture true.</figcaption>
            </figure>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Mode-specific prompt templates</h2>
          <ul className={styles.ul}>
            <li className={styles.li}><strong>Redesign:</strong> “Restyle furnishings only. Keep walls/windows/floor. Coastal AU, light oak + linen, pale blues, airy.”</li>
            <li className={styles.li}><strong>Staging:</strong> “Furnish tastefully for Hamptons AU: crisp whites, soft greys, rattan accents. Architecture stays put.”</li>
            <li className={styles.li}><strong>Compose:</strong> “Base room keeps structure. Use reference palette for warm timber desk, minimal styling, harmonised lighting.”</li>
            <li className={styles.li}><strong>Imagine:</strong> “Outdoor alfresco in Japandi style — natural wood, stone, paper lanterns, low furniture, warm neutral palette.”</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Common pitfalls (and easy fixes)</h2>
          <ul className={styles.ul}>
            <li className={styles.li}>Overstuffed prompts → strip back to materials + mood + one hero detail.</li>
            <li className={styles.li}>Harsh lighting → reshoot at softer daylight or close certain blinds.</li>
            <li className={styles.li}>Unrealistic finishes → swap in materials you’d actually specify for the property.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Ready to try it?</h2>
          <p className={styles.p}>
            Upload a photo, pick your mode, and get a fresh set of renders in under a minute. Save your favourites, share collections, and run with it.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signin">
                Sign in to generate
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#pricing">
                View pricing
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </article>
    ),
    faq: [
      {
        question: "Does AI staging change my room dimensions?",
        answer: "No. Redesign and Staging keep walls, windows, and floor positions exactly where they are; we only update furnishings and finishes.",
      },
      {
        question: "What camera height works best?",
        answer: "Aim for roughly chest height (about 1.2–1.5 m) with the camera level so vertical lines stay straight.",
      },
      {
        question: "Can I request specific materials?",
        answer: "Yes — keep prompts short, e.g. ‘light oak dining table, matte black pendants, linen sofa’.",
      },
      {
        question: "Is this fine for Australian listings?",
        answer: "Virtual staging is common for marketing. Always keep at least one true photo in the listing and follow each portal’s disclosure rules.",
      },
    ],
  },
  {
    slug: "how-to-photograph-rooms-for-ai-virtual-staging",
    title: "How to Photograph Rooms for AI Virtual Staging (No Fancy Gear)",
    description:
      "Cleaner, brighter room photos with just your phone. Camera height, angles, light, and quick prep — the fast checklist.",
    categories: [categories.find((c) => c.slug === categorySlugs.tutorial)!],
    author: authors.find((author) => author.slug === authorSlugs.team)!,
    publishedAt: "2025-09-16",
    image: {
      src: cornerVsFlat,
      urlRelative: "/blog/how-to-photograph-rooms-for-ai-virtual-staging/corner_vs_flat.png",
      alt: "Comparison of corner vs flat camera angles for room photography",
    },
    content: (
      <article className="space-y-12">
        <p className={styles.p}>
          You don’t need a $5k camera to capture great base photos. Keep the lens steady, shoot at the right height, pick one lighting story, and your AI renders instantly look more believable. This guide is the fast, no-nonsense checklist we follow in the field.
        </p>

        <section className="space-y-4">
          <h2 className={styles.h2}>Gear you actually need</h2>
          <ul className={styles.ul}>
            <li className={styles.li}>Phone or camera with a wide lens (or the 0.5× ultra-wide on your phone for tight spaces).</li>
            <li className={styles.li}>Tripod if you’ve got one; otherwise brace on a shelf or door frame.</li>
            <li className={styles.li}>Microfibre cloth — clean glass = crisp photos.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Camera height is the secret sauce</h2>
          <p className={styles.p}>Set the lens around chest height (about 1.2–1.5 m) and keep verticals straight. Kitchens and bathrooms can sit a touch higher; bedrooms look natural about 40–50 cm above the mattress.</p>
          <Image
            src={heightDiagram}
            alt="Camera height guide for living, kitchen/bath, and bedroom"
            className="w-full rounded-2xl border border-border/40 bg-white p-4"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Angles that add depth</h2>
          <p className={styles.p}>Shoot into a corner to show two walls; it instantly makes rooms feel bigger. Flat-on walls tend to look cramped unless you’re highlighting a feature.</p>
          <Image
            src={cornerVsFlat}
            alt="Corner angle versus flat wall comparison"
            className="w-full rounded-2xl border border-border/40"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Pick one lighting story</h2>
          <p className={styles.p}>Daylight only? Turn lamps off. Going for a cosy evening mood? Close the blinds so the lamp colour doesn’t clash with daylight.</p>
          <Image
            src={daylightVsMixed}
            alt="Daylight only vs mixed lighting comparison"
            className="w-full rounded-2xl border border-border/40"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Declutter in two minutes</h2>
          <ul className={styles.ul}>
            <li className={styles.li}>Remove fridge magnets, shampoo bottles, stray cables.</li>
            <li className={styles.li}>Straighten bedding, fluff cushions, align dining chairs.</li>
            <li className={styles.li}>Decide which doors stay open for flow, and close the rest.</li>
          </ul>
          <Image
            src={declutterChecklist}
            alt="Before and after decluttered kitchen bench"
            className="w-full rounded-2xl border border-border/40"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Keep lines upright</h2>
          <p className={styles.p}>Use the camera grid. If the verticals lean, the AI output will inherit that tilt. Level the camera or fix it before uploading.</p>
          <Image
            src={levelGrid}
            alt="Straight vertical grid overlay on a hallway"
            className="w-full rounded-2xl border border-border/40"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>File tips for clean uploads</h2>
          <ul className={styles.ul}>
            <li className={styles.li}>Shoot at native resolution; export as JPG or PNG without heavy filters.</li>
            <li className={styles.li}>Name files simply (e.g. <code className={styles.code}>living_01.jpg</code>). It keeps collections tidy.</li>
            <li className={styles.li}>Don’t overwrite originals until you’ve checked the AI outputs.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Troubleshooting quick wins</h2>
          <ul className={styles.ul}>
            <li className={styles.li}>Wonky lines → reshoot with a tripod or use the grid overlay.</li>
            <li className={styles.li}>Harsh glare → wait for softer light or pivot the angle.</li>
            <li className={styles.li}>Tight spaces → step back, go slightly wider, keep foreground anchors.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={styles.h2}>Ready to shoot?</h2>
          <p className={styles.p}>Once you’ve got clean photos, jump back into QuickDesignHome, pick your mode, and see how much better your renders look.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signin">
                Sign in and generate
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/blog/ai-virtual-staging-guide">
                Read the staging guide
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </article>
    ),
  },
];
