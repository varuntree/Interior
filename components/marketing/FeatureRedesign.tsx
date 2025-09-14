"use client";

import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import AppImage from "@/components/shared/Image";

export function FeatureRedesign() {
  // Refs for precise anchoring
  const gridRef = useRef<HTMLDivElement | null>(null);
  const leftCardRef = useRef<HTMLDivElement | null>(null);
  const topCardRef = useRef<HTMLDivElement | null>(null);
  const bottomCardRef = useRef<HTMLDivElement | null>(null);

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [paths, setPaths] = useState<{ top: string; bottom: string }>({
    top: "",
    bottom: "",
  });

  useEffect(() => {
    const container = gridRef.current;
    const left = leftCardRef.current;
    const top = topCardRef.current;
    const bottom = bottomCardRef.current;
    if (!container || !left || !top || !bottom) return;

    const compute = () => {
      const c = container.getBoundingClientRect();
      const L = left.getBoundingClientRect();
      const T = top.getBoundingClientRect();
      const B = bottom.getBoundingClientRect();

      // Convert to container-local coordinates
      const toLocal = (r: DOMRect) => ({
        left: r.left - c.left,
        right: r.right - c.left,
        top: r.top - c.top,
        bottom: r.bottom - c.top,
        width: r.width,
        height: r.height,
      });

      const l = toLocal(L);
      const t = toLocal(T);
      const b = toLocal(B);

      // Start points: two points along the right edge of the left card
      const startX = l.right - 8; // slight inset to avoid touching the border
      const startYTop = l.top + l.height * 0.35;
      const startYBottom = l.top + l.height * 0.65;

      // End points: center-left of each right card, pulled slightly inside
      const endInset = 10;
      const endXTop = t.left + endInset;
      const endYTop = t.top + t.height * 0.5;
      const endXBottom = b.left + endInset;
      const endYBottom = b.top + b.height * 0.5;

      // Gentle bezier shaping based on horizontal gap
      const gapTop = endXTop - startX;
      const gapBottom = endXBottom - startX;

      const c1TopX = startX + gapTop * 0.45;
      const c1TopY = startYTop;
      const c2TopX = endXTop - gapTop * 0.35;
      const c2TopY = endYTop;

      const c1BottomX = startX + gapBottom * 0.45;
      const c1BottomY = startYBottom;
      const c2BottomX = endXBottom - gapBottom * 0.35;
      const c2BottomY = endYBottom;

      const topPath = `M ${startX} ${startYTop} C ${c1TopX} ${c1TopY}, ${c2TopX} ${c2TopY}, ${endXTop} ${endYTop}`;
      const bottomPath = `M ${startX} ${startYBottom} C ${c1BottomX} ${c1BottomY}, ${c2BottomX} ${c2BottomY}, ${endXBottom} ${endYBottom}`;

      setBox({ w: c.width, h: c.height });
      setPaths({ top: topPath, bottom: bottomPath });
    };

    // Initial compute
    compute();

    // Keep perfectly aligned as layout changes
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    ro.observe(left);
    ro.observe(top);
    ro.observe(bottom);
    window.addEventListener("resize", compute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col items-start gap-2 md:mb-10">
          <span className="inline-flex items-center rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-primary">
            Feature 1 — Redesign
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Keep the room, change the look
          </h2>
          <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
            Upload a photo and instantly restyle it in Australian‑inspired looks — no walls moved, just taste.
          </p>
        </div>

        {/* Layout */}
        <div
          ref={gridRef}
          className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-2"
        >
          {/* Left — Before */}
          <div className="relative">
            <div
              ref={leftCardRef}
              className="relative mx-auto w-full max-w-[24rem] overflow-hidden rounded-2xl border bg-background shadow-sm aspect-[16/10]"
            >
              <AppImage
                alt="Before redesign"
                src="/landing/F11.png"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 42vw, 480px"
                fallback={
                  <div className="absolute inset-0 grid place-items-center bg-muted">
                    <span className="text-xs text-muted-foreground">F11 preview</span>
                  </div>
                }
              />
            </div>

            {/* Floating pill */}
            <div className="pointer-events-none absolute -bottom-4 left-2 z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-sm shadow-md ring-1 ring-border">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">Instantly Redesign</span>
              </div>
            </div>
          </div>

          {/* Right — After (two variants) */}
          <div className="relative grid grid-cols-1 gap-4">
            <div
              ref={topCardRef}
              className="relative w-full overflow-hidden rounded-2xl border bg-background shadow-sm aspect-[16/10] max-w-[24rem]"
            >
              <AppImage
                alt="After redesign variant 1"
                src="/landing/F12.png"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 42vw, 480px"
                fallback={
                  <div className="absolute inset-0 grid place-items-center bg-muted">
                    <span className="text-xs text-muted-foreground">F12 preview</span>
                  </div>
                }
              />
            </div>
            <div
              ref={bottomCardRef}
              className="relative w-full overflow-hidden rounded-2xl border bg-background shadow-sm aspect-[16/10] max-w-[24rem]"
            >
              <AppImage
                alt="After redesign variant 2"
                src="/landing/F13.png"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 42vw, 480px"
                fallback={
                  <div className="absolute inset-0 grid place-items-center bg-muted">
                    <span className="text-xs text-muted-foreground">F13 preview</span>
                  </div>
                }
              />
            </div>
          </div>

          {/* Responsive, measured connectors (md+ only) */}
          <svg
            className={`pointer-events-none absolute inset-0 z-[5] hidden md:block transition-opacity duration-150 ${
              paths.top && paths.bottom ? "opacity-100" : "opacity-0"
            }`}
            width="100%"
            height="100%"
            viewBox={`0 0 ${box.w} ${box.h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              {/* Clean, consistent arrowhead that respects currentColor */}
              <marker
                id="fr-arrow"
                viewBox="0 0 16 16"
                refX="13"
                refY="8"
                markerWidth="16"
                markerHeight="16"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,0 L16,8 L0,16 L4.5,8 Z" fill="hsl(var(--primary))" />
              </marker>
              {/* Subtle glow to lift arrows off backgrounds */}
              <filter id="fr-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodOpacity="0.35" />
              </filter>
            </defs>

            <g
              className="text-primary/85"
              style={{ filter: "url(#fr-glow)" }}
            >
              <path
                d={paths.top}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                markerEnd="url(#fr-arrow)"
              />
              <path
                d={paths.bottom}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                markerEnd="url(#fr-arrow)"
              />
            </g>
          </svg>
          {/* Container-wide arrows used; old anchored arrows removed */}
        </div>
      </div>
    </section>
  );
}

export default FeatureRedesign;
