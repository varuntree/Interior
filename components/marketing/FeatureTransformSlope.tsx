"use client";

import { Compare } from "@/components/marketing/Compare";
import { cn } from "@/libs/utils";

const compares = [
  {
    id: "materials",
    title: "Material makeover",
    description:
      "Slide to see how swapping timber tones and finishes can reset the whole mood of a room in seconds.",
    before: "/landing/f21.png",
    after: "/landing/f22.png",
  },
  {
    id: "staging",
    title: "From empty to styled",
    description:
      "Drag the handle to watch an empty shell turn into a styled listing that feels lived in and welcoming.",
    before: "/landing/f32.png",
    after: "/landing/f31.png",
  },
] as const;

export function FeatureTransformSlope() {
  return (
    <section className="relative overflow-hidden py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-3">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            See the change in real time
          </h2>
          <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
            Use the slider on each card to compare the before and after — it’s the easiest way to sense how a space will feel once QuickDesignHome works its magic.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {compares.map((item) => (
            <article
              key={item.id}
              className={cn(
                "flex h-full flex-col gap-5 rounded-[32px] border border-border/70 bg-background/95 p-6 shadow-[0_48px_110px_-55px_rgba(10,37,64,0.45)] backdrop-blur"
              )}
            >
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Compare
                firstImage={item.before}
                secondImage={item.after}
                className="w-full"
                slideMode="drag"
                showHandlebar
                autoplay={false}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureTransformSlope;
