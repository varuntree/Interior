"use client";

import Autoplay from "embla-carousel-autoplay";
import { AnimatePresence, motion } from "framer-motion";
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

// Hero images sourced only from Feature 1 (Redesign)
// Iterate between these three images exclusively
const testimonials = [
  { id: 1, image: "/landing/f11.png" },
  { id: 2, image: "/landing/f12.png" },
  { id: 3, image: "/landing/f13.png" },
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
    <section className="bg-background pt-12 pb-14 md:pt-16 md:pb-16">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 text-center md:px-6 lg:px-8">
        <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-foreground md:px-9 md:text-6xl">
          <span className="relative inline-block align-baseline">
            <span className="relative z-10">Fire your interior designer</span>
            {/* Painted highlight for headline (warm → red), subtle skew, rounded */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[-0.25em] right-[-0.25em] bottom-[0.06em] h-[0.62em] -skew-x-3 rounded-[0.55em] bg-gradient-to-r from-chart-3/90 via-chart-3/80 to-destructive/90"
            />
          </span>
          —get <span className="font-serif italic">interior design</span> that <span className="font-serif italic">feels like you</span>.
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground/80 md:text-xl">
          Redesign your
          {" "}
          <span className="relative inline-block align-baseline">
            <span className="relative z-10">interior with AI</span>
            {/* Smooth, product-colored painted highlight (non-wavy) */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[-0.2em] right-[-0.2em] bottom-[0.02em] h-[0.66em] -skew-x-3 rounded-[0.5em] bg-gradient-to-r from-primary/70 via-primary/60 to-accent/80"
            />
          </span>
          {" "}
          in less than 30 seconds.
        </p>

        {/* Dynamic text chip that changes with the current image (placeholder content) */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`chip-${current}`}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="mt-2 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground"
            aria-live="polite"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
            <span>Style preview {current + 1}</span>
          </motion.div>
        </AnimatePresence>

        {/* CTAs above the animated label to avoid overlap */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={isAuthed ? "/dashboard" : "/signin"}>
              {isAuthed ? "Open Dashboard" : "Try it free"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/community">See examples</Link>
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
              {testimonials.map((item, index) => (
                <CarouselItem key={index} className="my-2 basis-full sm:basis-3/4 md:basis-1/2 lg:basis-1/2">
                  <div className="h-[clamp(14rem,36vh,22rem)] md:h-[clamp(18rem,40vh,26rem)] w-full overflow-hidden rounded-lg border bg-card shadow-sm">
                    <AppImage
                      alt={`Preview image ${index + 1}`}
                      src={item.image}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 90vw, (max-width: 1024px) 33vw, 320px"
                      priority={index === 0}
                      fallback={
                        <div className="absolute inset-0 grid place-items-center bg-muted">
                          <span className="text-xs text-muted-foreground">Image coming soon</span>
                        </div>
                      }
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Dots with progress synced to autoplay */}
          <div className="mt-4 flex w-full items-center gap-3 justify-center">
            {testimonials.map((_, i) => (
              <button key={`hero-dot-${i}`} onClick={() => api?.scrollTo(i)} className="h-3 w-12" aria-label={`Go to slide ${i+1}`}>
                <div className={cn("relative h-1 w-full overflow-hidden rounded-full bg-muted", current === i && "bg-primary/20")}> 
                  {current === i && (
                    <span className="absolute inset-y-0 left-0 bg-primary" style={{ animation: "heroProgress 2s linear infinite", width: 0 }} />
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
