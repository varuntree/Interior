"use client";

import * as React from "react";
import useEmblaCarousel, {
  type EmblaCarouselType as CarouselApi,
  type EmblaOptionsType as CarouselOptions,
  type EmblaPluginType as CarouselPlugin,
} from "embla-carousel-react";
import { cn } from "@/libs/utils";

type CarouselContextProps = {
  carouselRef: (node: HTMLElement | null) => void;
  api: CarouselApi | undefined;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarouselContext() {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) throw new Error("Carousel.* must be used within <Carousel>");
  return ctx;
}

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin[];
  setApi?: (api: CarouselApi) => void;
}

export function Carousel({ className, children, opts, plugins, setApi, ...props }: CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel({ align: "start", ...opts }, plugins);

  React.useEffect(() => {
    if (api && setApi) setApi(api);
  }, [api, setApi]);

  return (
    <div className={cn("relative", className)} {...props}>
      <CarouselContext.Provider value={{ carouselRef: (carouselRef as any), api }}>
        <div className="overflow-hidden" ref={carouselRef as any}>
          {children}
        </div>
      </CarouselContext.Provider>
    </div>
  );
}

export interface CarouselContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CarouselContent({ className, ...props }: CarouselContentProps) {
  return (
    <div
      className={cn(
        "-ml-4 flex",
        className
      )}
      {...props}
    />
  );
}

export interface CarouselItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CarouselItem({ className, ...props }: CarouselItemProps) {
  return (
    <div
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full pl-4",
        className
      )}
      {...props}
    />
  );
}

export type { CarouselApi, CarouselOptions, CarouselPlugin };

