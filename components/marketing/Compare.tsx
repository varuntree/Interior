"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/libs/utils";
import { GripVertical } from "lucide-react";

interface CompareProps {
  firstImage?: string;
  secondImage?: string;
  className?: string;
  firstImageClassName?: string;
  secondImageClassName?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
}

export const Compare: React.FC<CompareProps> = ({
  firstImage = "",
  secondImage = "",
  className,
  firstImageClassName,
  secondImageClassName,
  initialSliderPercentage = 50,
  slideMode = "drag",
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000,
}) => {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const startAutoplay = useCallback(() => {
    if (!autoplay) return;

    const animate = (time: number) => {
      const cycle = autoplayDuration * 2;
      const progress = (time % cycle) / autoplayDuration;
      const percentage = progress <= 1 ? progress * 100 : (2 - progress) * 100;
      setSliderXPercent(percentage);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [autoplay, autoplayDuration]);

  const stopAutoplay = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    startAutoplay();
    return () => {
      stopAutoplay();
    };
  }, [autoplay, startAutoplay, stopAutoplay]);

  const handlePosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = (x / rect.width) * 100;
      setSliderXPercent(Math.max(0, Math.min(100, percent)));
    },
    []
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
        event.preventDefault();
        handlePosition(event.clientX);
      }
    },
    [handlePosition, slideMode, isDragging]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (slideMode === "drag") {
        setIsDragging(true);
        handlePosition(event.clientX);
      }
    },
    [handlePosition, slideMode]
  );

  const handleMouseUp = useCallback(() => {
    if (slideMode === "drag") {
      setIsDragging(false);
    }
  }, [slideMode]);

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (autoplay) return;
      const touch = event.touches[0];
      handlePosition(touch.clientX);
    },
    [handlePosition, autoplay]
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (autoplay) return;
      const touch = event.touches[0];
      handlePosition(touch.clientX);
      if (slideMode === "drag") {
        setIsDragging(true);
      }
    },
    [autoplay, handlePosition, slideMode]
  );

  const handleTouchEnd = useCallback(() => {
    if (autoplay) return;
    setIsDragging(false);
  }, [autoplay]);

  const onRangeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSliderXPercent(Number(event.target.value));
  }, []);

  function mouseEnterHandler() {
    stopAutoplay();
  }

  function mouseLeaveHandler() {
    if (slideMode === "hover") {
      setSliderXPercent(initialSliderPercentage);
    }
    if (!autoplay) {
      setIsDragging(false);
    }
    startAutoplay();
  }

  const sliderBar = (
    <AnimatePresence initial={false}>
      <motion.div
        className="absolute top-0 h-full w-px bg-primary/70"
        style={{ left: `${sliderXPercent}%`, zIndex: 30 }}
        transition={{ duration: 0 }}
      >
        {showHandlebar && (
          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-background/90 text-primary shadow-lg">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className={cn("w-full select-none", className)}>
      <div
        ref={sliderRef}
        className="relative aspect-[16/10] w-full select-none overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg"
        style={{ cursor: slideMode === "drag" ? "grab" : "col-resize" }}
        onMouseMove={handleMouseMove}
        onMouseEnter={mouseEnterHandler}
        onMouseLeave={mouseLeaveHandler}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false}>
          {secondImage && (
            <motion.div className="absolute inset-0" transition={{ duration: 0 }}>
              <Image
                src={secondImage}
                alt="after"
                fill
                className={cn("object-cover", secondImageClassName)}
                draggable={false}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 48vw, 520px"
                priority={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {firstImage && (
            <motion.div
              className={cn(
                "absolute inset-0 overflow-hidden",
                firstImageClassName
              )}
              style={{ clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)` }}
              transition={{ duration: 0 }}
            >
              <Image
                src={firstImage}
                alt="before"
                fill
                className="object-cover"
                draggable={false}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 48vw, 520px"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {sliderBar}
      </div>

      <div className="mt-3 flex items-center gap-3 select-none">
        <input
          type="range"
          min={0}
          max={100}
          value={sliderXPercent}
          onChange={onRangeChange}
          className="h-1 w-full appearance-none rounded-full bg-primary/20"
          aria-label="Reveal transformation"
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
        <span>Before</span>
        <span>After</span>
      </div>
    </div>
  );
};

Compare.displayName = "Compare";
