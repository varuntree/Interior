"use client";

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

  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      {!errored ? (
        <Image
          alt={alt}
          className={cn("object-cover transition-all duration-300", !loaded && "blur-sm", className)}
          onLoad={() => setLoaded(true)}
          onError={() => { setErrored(true); setLoaded(true); }}
          sizes={sizes}
          loading={loading}
          {...rest}
        />
      ) : (
        fallback ?? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <span className="text-sm">Image unavailable</span>
          </div>
        )
      )}

      {showLoader && !loaded && !errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}

export default AppImage;

