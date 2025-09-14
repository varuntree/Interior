"use client";

import { Building2, Zap } from "lucide-react";
import AppImage from "@/components/shared/Image";

export default function FeatureStaging() {
  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col items-start gap-2 md:mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-primary">
            <Building2 className="h-3.5 w-3.5" /> Feature 3 — Virtual Staging
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Fill empty rooms with tasteful furniture — instantly
          </h2>
          <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
            Perfect for agents, landlords and designers. Stage listings and rentals in seconds — clean, modern looks that match Australian homes.
          </p>
        </div>

        {/* Simple side-by-side before/after */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Before */}
          <figure className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-background shadow-sm">
            <AppImage
              alt="Empty room before staging"
              src="/landing/f32.png"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              fallback={<div className="absolute inset-0 grid place-items-center bg-muted"><span className="text-xs text-muted-foreground">f31</span></div>}
            />
            <figcaption className="pointer-events-none absolute left-3 top-3">
              <span className="rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium shadow ring-1 ring-border">Before</span>
            </figcaption>
          </figure>

          {/* After */}
          <figure className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-background shadow-sm">
            <AppImage
              alt="Room staged with furniture"
              src="/landing/f31.png"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              fallback={<div className="absolute inset-0 grid place-items-center bg-muted"><span className="text-xs text-muted-foreground">f32</span></div>}
            />
            <figcaption className="pointer-events-none absolute left-3 top-3">
              <span className="rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium shadow ring-1 ring-border">Staged</span>
            </figcaption>
          </figure>
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-sm shadow-md ring-1 ring-border transition hover:bg-background"
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium">Virtually Stage This Room</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export { FeatureStaging };
