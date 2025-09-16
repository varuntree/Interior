import {
  Sparkles,
  UploadCloud,
  SlidersHorizontal,
  BookmarkCheck,
  Layers,
  TimerReset,
  GaugeCircle,
  ScanText,
} from "lucide-react";
import AppImage from "@/components/shared/Image";
import runtimeConfig from "@/libs/app-config/runtime";

const steps = [
  {
    icon: UploadCloud,
    title: "Start with your space",
    description: "Snap a room photo or jot down a simple brief in under 30 seconds.",
  },
  {
    icon: SlidersHorizontal,
    title: "Dial in the vibe",
    description:
      "Choose Australian-inspired room types and styles, then fine-tune with your own notes.",
  },
  {
    icon: Sparkles,
    title: "Get living concepts",
    description: "Receive photoreal redesigns ready to save, share, or instantly iterate again.",
  },
];

const baseHighlights = [
  {
    icon: Layers,
    title: "80+ curated looks",
    description: "Coastal AU to Japandi—built-in palettes that feel at home down under.",
  },
  {
    icon: TimerReset,
    title: "Instant turnarounds",
    description: "Generations complete in seconds with webhook-paced reliability.",
  },
  {
    icon: GaugeCircle,
    title: "One-tap polish",
    description: "Swap modes or styles without rebuilding your project from scratch.",
  },
  {
    icon: ScanText,
    title: "Prompt assist built-in",
    description: "Structured presets keep prompts simple—no expert phrasing required.",
  },
];

const inspirationFaces = [
  { src: "/landing/f21.png", alt: "Styled living room inspiration" },
  { src: "/landing/f22.png", alt: "Decor detail close-up" },
  { src: "/landing/f23.png", alt: "Neutral sunlit bedroom concept" },
  { src: "/landing/f31.png", alt: "Modern dining nook render" },
];

export function HowItWorks() {
  const collectionsEnabled = !!runtimeConfig.featureFlags?.collections;
  const highlights = collectionsEnabled
    ? baseHighlights.concat({
        icon: BookmarkCheck,
        title: "Collections that stick",
        description: "Save favourites, group projects, and keep clients aligned effortlessly.",
      })
    : baseHighlights;

  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="relative overflow-hidden py-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-[520px] max-w-6xl rounded-[56px] bg-gradient-to-t from-primary/15 via-primary/5 to-transparent blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
            Made to feel effortless
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          >
            Transform any room in three guided steps
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Interior magic without the heavy lift—just upload, choose your aussie-inspired presets,
            and review designs tailored to your space.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3" role="list">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative flex flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white/90 p-6 shadow-[0_24px_60px_-30px_rgba(10,37,64,0.35)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_70px_-20px_rgba(10,37,64,0.42)] dark:bg-card"
            >
              <span className="absolute top-4 right-6 text-sm font-semibold text-primary/70">
                Step {index + 1}
              </span>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col justify-between rounded-3xl border border-primary/10 bg-primary/5 p-8 text-left shadow-[0_24px_60px_-30px_rgba(10,37,64,0.25)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">
                Trusted inspiration stream
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">
                2M+ render explorations and counting
              </h3>
              <p className="mt-3 text-base text-muted-foreground">
                Designers, agents, and home improvers rely on our collections to experiment with
                new looks before they commit. Join the community discovering what their rooms can
                become.
              </p>
            </div>
            <div className="mt-6 flex -space-x-3">
              {inspirationFaces.map((face) => (
                <div
                  key={face.src}
                  className="relative inline-flex h-12 w-12 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-[0_10px_20px_rgba(10,37,64,0.15)]"
                >
                  <AppImage
                    src={face.src}
                    alt={face.alt}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="48px"
                    showLoader={false}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="group flex h-full flex-col justify-between rounded-3xl border border-border/60 bg-card/80 p-6 shadow-[0_18px_40px_-24px_rgba(10,37,64,0.25)] transition duration-200 hover:-translate-y-1 hover:border-primary/50"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-foreground">{item.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
