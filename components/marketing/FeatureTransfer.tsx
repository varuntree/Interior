"use client";

import { useEffect, useState } from "react";
import { Sparkles, Droplets, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CarouselApi } from "@/components/ui/carousel";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

type Feature = {
  title: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  background: string;
};

const FEATURES: Feature[] = [
  {
    title: "Transfer the look in seconds",
    label: "Wood",
    icon: Sparkles,
    description: "Carry over the feel of your reference — furnishings stay put, the vibe changes.",
    background: "/landing/F21.png",
  },
  {
    title: "Swap materials and textures",
    label: "White Marble",
    icon: Droplets,
    description: "Try timber, stone, linen or leather without lifting a finger.",
    background: "/landing/F22.png",
  },
  {
    title: "Try a new colour story",
    label: "Black Stone",
    icon: Palette,
    description: "Explore warm, cool or neutral palettes that fit your space.",
    background: "/landing/F23.png",
  },
];

export function FeatureTransfer() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  // Mobile auto-advance to hint sliding
  useEffect(() => {
    if (!api) return;
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;
    const id = setInterval(() => {
      const snaps = api.scrollSnapList().length;
      const next = (api.selectedScrollSnap() + 1) % snaps;
      api.scrollTo(next);
    }, 1200);
    return () => clearInterval(id);
  }, [api]);

  const goToSlide = (i: number) => api?.scrollTo(i);

  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col items-start gap-2 md:mb-10">
          <span className="inline-flex items-center rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-primary">
            Feature 2 — Style & Texture Transfer
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Change materials, textures or colours — keep the room
          </h2>
          <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
            Apply the feel of a reference to your room. No masking, no manual edits.
          </p>
        </div>

        <Carousel opts={{ align: "start" }} className="w-full" setApi={setApi}>
          <CarouselContent className="-ml-6 pt-6 md:pt-8">
            {FEATURES.map((card, index) => (
              <CarouselItem key={index} className="pl-6 md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
              <Card className="border-0 shadow-none">
                <CardContent className="group relative overflow-hidden rounded-[1.75rem] p-0 transition-transform duration-300 hover:shadow-2xl">
                  {/* Image layer */}
                      <div
                        style={{ backgroundImage: `url(${card.background})`, filter: "saturate(1.08) contrast(1.04) brightness(1.02)" }}
                        className="relative aspect-[16/10] w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.01]"
                        aria-label={card.title}
                      >
                    {/* Remove bottom white shade; keep transparent overlay for interactions */}
                    <div className="pointer-events-none absolute inset-0" />

                    {/* Glass bar across bottom */}
                    <div className="absolute inset-x-3 bottom-3">
                      <div className="backdrop-blur-2xl bg-background/25 ring-1 ring-white/15 shadow-lg rounded-2xl px-3.5 py-2 flex items-center gap-3">
                        <span className="bg-background/80 text-foreground flex h-7 w-7 items-center justify-center rounded-full border">
                          <card.icon className="h-4 w-4" />
                        </span>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                            card.label === "Wood"
                              ? "bg-amber-300"
                              : card.label === "White Marble"
                              ? "bg-gray-200"
                              : "bg-neutral-300"
                          }`} />
                          <span className={
                            card.label === "Wood"
                              ? "text-amber-100"
                              : card.label === "White Marble"
                              ? "text-gray-100"
                              : "text-neutral-100"
                          }>
                            {card.label}
                          </span>
                        </div>
                        <div className="ml-auto h-[1px] w-10 bg-white/40" />
                        <span className="text-[11px] text-white/80">Applied</span>
                      </div>
                    </div>
                  </div>

                  {/* Text area — simplified, consistent sizing, neutral styling */}
                  <div className="p-4">
                    <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm backdrop-blur-sm min-h-[110px]">
                      <h3 className="text-foreground text-lg font-medium leading-snug tracking-tight">{card.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-5 flex w-full items-center gap-2 md:hidden">
            {Array.from({ length: FEATURES.length }).map((_, i) => (
              <button key={`ft-dot-${i}`} onClick={() => goToSlide(i)} className="h-4 w-full">
                <div className={`${current === i ? "bg-primary/20" : "bg-muted"} relative my-auto h-1 w-full overflow-hidden rounded-full`}>
                  {current === i && (
                    <span className="absolute inset-y-0 left-0 bg-primary" style={{ animation: "ft2progress 1.2s linear infinite", width: 0 }} />
                  )}
                </div>
              </button>
            ))}
            <style jsx>{`
              @keyframes ft2progress { from { width: 0% } to { width: 100% } }
            `}</style>
          </div>
        </Carousel>
      </div>
    </section>
  );
}

export default FeatureTransfer;
