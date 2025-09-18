"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Wand2 } from "lucide-react";
import AppImage from "@/components/shared/Image";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";

const prompts = [
  "Introduce boucle lounge chairs",
  "Paint walls warm white",
  "Add sculptural pendant lighting",
  "Layer linen curtains"
];

type Phase = "idle" | "analyzing" | "redesign" | "complete";

function useReveal(ref: RefObject<Element>, threshold = 0.35) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, threshold, visible]);

  return visible;
}

export function FeatureAiBentoV4() {
  const redesignRef = useRef<HTMLDivElement | null>(null);
  const promptRef = useRef<HTMLDivElement | null>(null);
  const placementRef = useRef<HTMLDivElement | null>(null);

  const redesignVisible = useReveal(redesignRef, 0.45);
  const promptVisible = useReveal(promptRef, 0.3);
  const placementVisible = useReveal(placementRef, 0.25);

  const [phase, setPhase] = useState<Phase>("idle");
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const loaderStartedRef = useRef(false);

  useEffect(() => {
    if (!redesignVisible) {
      loaderStartedRef.current = false;
      setPhase("idle");
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      return;
    }

    if (loaderStartedRef.current) return;
    loaderStartedRef.current = true;
    setPhase("analyzing");
    const timers: Array<ReturnType<typeof setTimeout>> = [
      setTimeout(() => setPhase("redesign"), 1000),
      setTimeout(() => setPhase("complete"), 1300),
    ];
    timeoutsRef.current = timers;

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [redesignVisible]);

  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    loaderStartedRef.current = false;
  }, []);

  const [promptIndex, setPromptIndex] = useState(0);
  useEffect(() => {
    if (!promptVisible) return;
    const id = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length);
    }, 2400);
    return () => clearInterval(id);
  }, [promptVisible]);

  const prompt = useMemo(() => prompts[promptIndex], [promptIndex]);

  return (
    <section className="relative overflow-hidden py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-3">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Fine-tuned interactions that make AI feel like a co-designer
          </h2>
          <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
            View sequential loading, inline editing, and staged placement in a refined layout with generous spacing.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <article
            ref={redesignRef}
            className="relative grid gap-6 rounded-[36px] border border-border/70 bg-background/95 p-6 shadow-[0_56px_120px_-60px_rgba(10,37,64,0.45)] backdrop-blur md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <figure className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60">
              <AppImage
                src="/landing/f11.png"
                alt="Before redesign"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 48vw, 520px"
                className="object-cover"
              />
              <figcaption className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium shadow ring-1 ring-border">
                Before
              </figcaption>
            </figure>
            <figure className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-primary/30">
              <AppImage
                src="/landing/f12.png"
                alt="After redesign"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 48vw, 520px"
                className={cn(
                  "object-cover transition-opacity duration-400",
                  phase === "idle" || phase === "analyzing" ? "opacity-0" : "opacity-100"
                )}
              />
              <figcaption className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium shadow ring-1 ring-border">
                After
              </figcaption>
              <LoaderPanel phase={phase} />
            </figure>
          </article>

          <article
            ref={promptRef}
            className="relative overflow-hidden rounded-[32px] border border-border/60 bg-background/95 shadow-[0_56px_120px_-60px_rgba(10,37,64,0.45)] backdrop-blur"
          >
            <div className="grid gap-0 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground">Edit with AI</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prompt a tweak and the interface shows the adjustments before you commit — fast, readable, and grounded.
                </p>
                <PromptPanel active={promptVisible} prompt={prompt} />
              </div>
              <div className="relative h-[260px] w-full overflow-hidden">
                <AppImage
                  src="/landing/edit_image.png"
                  alt="AI edit console"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 420px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-background/10" aria-hidden />
              </div>
            </div>
          </article>

          <article
            ref={placementRef}
            className="grid gap-6 rounded-[34px] border border-border/70 bg-background/95 p-6 shadow-[0_56px_120px_-60px_rgba(10,37,64,0.45)] backdrop-blur"
          >
            <header className="mb-4 flex flex-col gap-2 text-left md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-semibold text-foreground">Object placement</h3>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Follow the journey from object selection to realistic staging — scale, lighting, and reflections accounted for at each step.
                </p>
              </div>
            </header>
            <div className="grid gap-6 md:grid-cols-3">
              <PlacementStep
                step="01"
                title="Select object"
                copy="Drop curated furniture or decor assets into the workflow."
                image="/landing/object.png"
                highlight
                active={placementVisible}
              />
              <PlacementStep
                step="02"
                title="Match the room"
                copy="We align scale, vanishing points, and light to your capture."
                image="/landing/object_room.png"
                active={placementVisible}
              />
              <PlacementStep
                step="03"
                title="Preview blend"
                copy="See the room with the object rendered in — ready to save to collections."
                image="/landing/room_with_object.png"
                active={placementVisible}
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function LoaderPanel({ phase }: { phase: Phase }) {
  const overlayVisible = phase !== "complete";
  const showAnalyzing = phase === "analyzing";
  const showRedesign = phase === "redesign" || phase === "complete";

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/90 px-6 text-center backdrop-blur-xl transition-opacity duration-200",
        overlayVisible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      role="status"
      aria-live="polite"
    >
      <p className={cn("text-sm font-medium text-foreground transition-opacity duration-150", showAnalyzing ? "opacity-100" : "opacity-40")}>AI analyzing…</p>
      <p className={cn("text-sm font-medium text-foreground transition-opacity duration-150", showRedesign ? "opacity-100" : "opacity-0")}>AI redesign…</p>
      <p className="text-xs text-muted-foreground">Showing final render…</p>
    </div>
  );
}

function PromptPanel({ active, prompt }: { active: boolean; prompt: string }) {
  return (
    <div
      className={cn(
        "mt-5 flex flex-col gap-3 rounded-2xl border border-white/20 bg-background/75 p-4 shadow-xl backdrop-blur-xl transition duration-500",
        active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
    >
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Prompt assistant
      </label>
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/90">
        <textarea
          value={prompt}
          readOnly
          className="h-24 w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground outline-none"
        />
        <span className="pointer-events-none absolute bottom-4 left-4 h-4 w-[2px] animate-[blink_1.2s_steps(2,_jump-none)_infinite] bg-primary" />
      </div>
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          className="relative overflow-hidden rounded-full border-2 border-primary/70 bg-primary px-6 py-2.5 text-primary-foreground shadow-[0_0_42px_rgba(71,179,255,0.65)] backdrop-blur-md transition hover:border-primary/80 hover:bg-primary/90 hover:shadow-[0_0_64px_rgba(71,179,255,0.75)]"
        >
          <Wand2 className="mr-1.5 h-4 w-4" /> Magic Generate
        </Button>
        <p className="text-xs text-muted-foreground">Keep typing — suggestions evolve with your edits.</p>
      </div>
    </div>
  );
}

function PlacementStep({
  step,
  title,
  copy,
  image,
  highlight,
  active,
}: {
  step: string;
  title: string;
  copy: string;
  image: string;
  highlight?: boolean;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-3xl border p-5 shadow-lg",
        highlight ? "border-primary/25 bg-white/85 backdrop-blur-xl dark:bg-background/85" : "border-border/60 bg-card/90"
      )}
    >
      <span className={cn("text-xs font-semibold tracking-[0.24em] text-muted-foreground", highlight && "text-primary")}>STEP {step}</span>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/40">
        <AppImage
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 45vw, 300px"
          className="object-cover"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium shadow ring-1 ring-border">
          {title}
        </span>
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{copy}</p>
      <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowRight className={cn("h-4 w-4", active ? "text-primary" : "")}
        />
        <span>{active ? "Live AI preview ready" : "Waiting for interaction"}</span>
      </div>
    </div>
  );
}

export default FeatureAiBentoV4;
