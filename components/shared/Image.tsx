"use client";
/* eslint-disable jsx-a11y/alt-text */

import Image, { ImageProps } from "next/image";
import React, { useState } from "react";
import { cn } from "@/libs/utils";

type AppImageProps = Omit<ImageProps, "placeholder"> & {
  containerClassName?: string;
  showLoader?: boolean;
  fallback?: React.ReactNode;
};

export function AppImage({
  className,
  containerClassName,
  showLoader = true,
  fallback,
  alt,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  loading = "lazy",
  ...rest
}: AppImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  // Extract props we need to intercept so we can keep behaviour consistent with next/image
  const {
    priority,
    onError: onErrorProp,
    onLoad: onLoadProp,
    onLoadingComplete: onLoadingCompleteProp,
    src,
    ...imgRest
  } = rest as {
    priority?: boolean;
    onError?: ImageProps["onError"];
    onLoad?: ImageProps["onLoad"];
    onLoadingComplete?: ImageProps["onLoadingComplete"];
    src: ImageProps["src"];
  } & Record<string, any>;

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setErrored(true);
    setLoaded(true);
    // Surface actionable information without masking issues.
    console.error("[AppImage] Failed to load image", { src });
    onErrorProp?.(event);
  };

  const common: any = {
    alt,
    className: cn(
      "object-cover transition-all duration-300",
      !loaded && !errored && "blur-sm",
      className,
    ),
    onLoad: (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setLoaded(true);
      onLoadProp?.(event);
      const target = event.currentTarget;
      if (target?.complete) {
        // Backwards compatibility for consumers relying on onLoadingComplete.
        onLoadingCompleteProp?.(target);
      }
    },
    onError: handleError,
    sizes,
    src,
    ...imgRest,
  };

  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      {!errored ? (
        priority ? (
          <Image {...common} priority />
        ) : (
          <Image {...common} loading={loading} />
        )
      ) : (
        fallback ?? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <span className="text-sm">Image unavailable</span>
          </div>
        )
      )}

      {showLoader && !loaded && !errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40 backdrop-blur-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}

export default AppImage;
