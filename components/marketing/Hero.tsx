"use client";

import Autoplay from "embla-carousel-autoplay";
import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import AppImage from "@/components/shared/Image";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const testimonials = [
  { id: 1, image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/lummi/person1.jpeg", name: "Joan Doe" },
  { id: 2, image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/lummi/person2.jpeg", name: "Jane Smith" },
  { id: 3, image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/lummi/person3.jpeg", name: "John Johnson" },
  { id: 4, image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/lummi/person4.jpeg", name: "Sarah William" },
  { id: 5, image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/lummi/person5.jpeg", name: "Michael Brown" },
  { id: 6, image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/lummi/bw3.jpeg", name: "Emily Davis" },
  { id: 7, image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/lummi/bw11.jpeg", name: "Joson White" },
];

export function Hero() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const isMobile = useIsMobile();

  const getRotation = useCallback(
    (index: number) => {
      if (index === current)
        return "md:-rotate-45 md:translate-x-40 md:scale-75 md:relative";
      if (index === current + 1) return "md:rotate-0 md:z-10 md:relative";
      if (index === current + 2)
        return "md:rotate-45 md:-translate-x-40 md:scale-75 md:relative";
      return undefined;
    },
    [current]
  );

  const scrollbarBars = useMemo(
    () =>
      [...Array(40)].map((_, item) => (
        <motion.div
          key={item}
          initial={{ opacity: item % 5 === 0 ? 0.2 : 0.2, filter: "blur(1px)" }}
          animate={{ opacity: item % 5 === 0 ? 1 : 0.2, filter: "blur(0px)" }}
          transition={{ duration: 0.2, delay: item % 5 === 0 ? (item / 5) * 0.05 : 0, ease: "easeOut" }}
          className={cn("w-[1px] bg-foreground", item % 5 === 0 ? "h-[15px]" : "h-[10px]")}
        />
      )),
    []
  );

  return (
    <section className="bg-background pt-12 pb-14 md:pt-16 md:pb-16">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 text-center md:px-6 lg:px-8">
        <h1 className="max-w-3xl text-4xl font-medium tracking-tighter text-foreground md:px-9 md:text-5xl">
          <span className="italic">The only</span> App you'll ever need to stay <span className="italic">inspired</span>
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground/80">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio delectus neque aliquid cumque.
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
            <Link href="/signin">Try it free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/community">See examples</Link>
          </Button>
        </div>

        <div className="relative mt-4 w-full max-w-5xl pb-12">
          <Carousel
            className="max-w-5xl"
            opts={{ loop: true }}
            plugins={[Autoplay({ delay: 1000, stopOnInteraction: true })]}
            setApi={setApi}
          >
            <CarouselContent>
              {Array.from({ length: isMobile ? testimonials.length : testimonials.length + 2 }).map((_, index) => (
                <CarouselItem key={index} className="my-4 md:basis-1/3">
                  <div className={cn("h-[clamp(14rem,36vh,22rem)] md:h-[clamp(18rem,40vh,26rem)] w-full overflow-hidden rounded-lg border bg-card shadow-sm transition-transform duration-500 ease-in-out", getRotation(index))}>
                    <AppImage
                      alt={`Preview image ${index + 1}`}
                      src={
                        index == testimonials.length
                          ? testimonials[0].image
                          : index == testimonials.length + 1
                          ? testimonials[1].image
                          : index == testimonials.length + 2
                          ? testimonials[2].image
                          : testimonials[index].image
                      }
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 90vw, (max-width: 1024px) 33vw, 320px"
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

          {/* Animated label and bars, positioned below carousel visuals */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full">
            <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-2">
              <div className="flex gap-2">{scrollbarBars}</div>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={`label-${current}`}
                  className="w-full text-lg font-medium"
                  initial={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(5px)" }}
                  transition={{ duration: 0.5 }}
                >
                  Design preview
                </motion.p>
              </AnimatePresence>
              <div className="flex gap-2">{scrollbarBars}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
