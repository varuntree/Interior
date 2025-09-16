"use client";

import Autoplay from "embla-carousel-autoplay";
import React from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import AppImage from "@/components/shared/Image";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

// Hero carousel slides are ordered desktop-first, optimized for responsive crops
const slides = [
  {
    id: 1,
    image: "/landing/f11.png",
    alt: "Living room redesign generated with warm coastal palette",
  },
  {
    id: 2,
    image: "/landing/f12.png",
    alt: "Minimalist bedroom concept showcasing timber textures",
  },
  {
    id: 3,
    image: "/landing/f13.png",
    alt: "Modern dining area staged with sculptural lighting",
  },
];

export function Hero() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const { authed: isAuthed } = useAuthStatus();

  React.useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Auth status handled by useAuthStatus

  return (
    <section className="relative overflow-hidden bg-background pt-12 pb-14 md:pt-16 md:pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-18%] h-[620px]"
        style={{
          background:
            "linear-gradient(0deg, hsl(var(--primary) / 0.42) 0%, hsl(var(--primary) / 0.3) 45%, hsl(var(--primary) / 0.14) 78%, transparent 100%)",
        }}
      />
      <div className="container relative mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 text-center md:px-6 lg:px-8">
        <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-foreground md:px-9 md:text-6xl">
          <span className="block md:inline">
            Fire your interior
            {" "}
            <span className="relative inline-block align-baseline">
              <span className="relative z-10">designer</span>
              {/* Painted highlight for key word (warm → primary) */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-[-0.2em] right-[-0.2em] bottom-[0.02em] h-[0.66em] -skew-x-2 rounded-[0.55em] bg-gradient-to-r from-chart-3/80 via-primary/80 to-primary/60"
              />
            </span>
          </span>
          {" "}—get <span className="font-serif italic">interior design</span> that <span className="font-serif italic">feels like you</span>.
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground/80 md:text-xl">
          Redesign your
          {" "}
          <span className="relative inline-block align-baseline">
            <span className="relative z-10">interior with AI</span>
            {/* Smooth, product-colored painted highlight (non-wavy) */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[-0.2em] right-[-0.2em] bottom-[0.02em] h-[0.66em] -skew-x-2 rounded-[0.5em] bg-gradient-to-r from-primary/60 via-primary/40 to-accent/60"
            />
          </span>
          {" "}
          in less than 30 seconds.
        </p>

        {/* Primary calls-to-action */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full shadow-md shadow-primary/10 sm:w-auto">
            <Link href={isAuthed ? "/dashboard" : "/signin"}>
              {isAuthed ? "Open Dashboard" : "Try it free"}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full border-primary/30 bg-background/70 backdrop-blur transition hover:border-primary/60 hover:bg-primary/5 sm:w-auto"
          >
            <Link href="/#pricing">View pricing</Link>
          </Button>
        </div>

        <div className="relative mt-4 w-full max-w-5xl">
          <Carousel
            className="max-w-5xl"
            opts={{ loop: true, align: "start", containScroll: "trimSnaps" }}
            plugins={[Autoplay({ delay: 2000, stopOnInteraction: true })]}
            setApi={setApi}
          >
            <CarouselContent>
              {slides.map((item, index) => (
                <CarouselItem
                  key={item.id}
                  className="my-2 basis-full sm:basis-3/4 md:basis-1/2 lg:basis-1/2"
                >
                  <div className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5">
                    <div className="relative aspect-[4/3] sm:aspect-[3/2] md:aspect-[5/3]">
                      <AppImage
                        alt={item.alt}
                        src={item.image}
                        fill
                        quality={90}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 520px"
                        priority={index === 0}
                        fallback={
                          <div className="absolute inset-0 grid place-items-center bg-muted">
                            <span className="text-xs text-muted-foreground">Image coming soon</span>
                          </div>
                        }
                    />
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" aria-hidden />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Dots with progress synced to autoplay */}
          <div className="mt-4 flex w-full items-center gap-3 justify-center">
            {slides.map((_, i) => (
              <button
                key={`hero-dot-${i}`}
                onClick={() => api?.scrollTo(i)}
                className="h-3 w-12"
                aria-label={`Go to slide ${i + 1}`}
              >
                <div
                  className={cn(
                    "relative h-1 w-full overflow-hidden rounded-full bg-muted",
                    current === i && "bg-primary/20",
                  )}
                >
                  {current === i && (
                    <span
                      className="absolute inset-y-0 left-0 bg-primary"
                      style={{ animation: "heroProgress 2s linear infinite", width: 0 }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
          <style jsx>{`
            @keyframes heroProgress { from { width: 0% } to { width: 100% } }
          `}</style>
        </div>
      </div>
    </section>
  );
}

export default Hero;
