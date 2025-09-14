"use client";
/* eslint-disable no-unused-vars */

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/libs/utils";

type CarouselContextProps = {
  carouselRef: (node: HTMLElement | null) => void;
  api: any | undefined;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  opts?: any;
  plugins?: any[];
  setApi?: (api: any) => void;
}

export function Carousel({ className, children, opts, plugins, setApi, ...props }: CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel({ align: "start", ...(opts || {}) }, plugins as any);

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

// Provide loose type aliases to satisfy external imports without binding to a specific Embla version
export type CarouselApi = any;
export type CarouselOptions = any;
export type CarouselPlugin = any;
