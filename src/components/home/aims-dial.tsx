"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Aim } from "@/lib/content";
import { ArrowBtn, Hud, Ph } from "@/components/hud";
import { Dial3D, MODEL_LABEL } from "@/components/home/point-cloud";
import { cn } from "@/lib/utils";

const FLOW = [0.65, 0, 0.35, 1] as const;

// Carousel stage with a rotating dial and a 3D model viewer, after
// Endfield's "Lore" panel. Changing slide turns the dial one step, swaps the
// copy, and re-forms the 3D model with a laser scan.
export function AimsDial({ aims }: { aims: Aim[] }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const n = aims.length;

  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!n) return null;
  const a = aims[i];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What the club is for"
      className="relative overflow-hidden bg-night-sunken text-paper"
    >
      <div className="mx-auto grid min-h-[min(46rem,90dvh)] max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-[1fr_auto_1fr] md:px-12">
        {/* left: heading */}
        <div className="relative z-10 md:self-start md:pt-6">
          <Hud className="text-night-faint">What we’re for</Hud>
          <h3 className="mt-3 font-display text-4xl leading-none md:text-5xl">
            One assistant,
            <br />
            learned properly.
          </h3>
          <p className="mt-5 max-w-[30ch] font-serif text-night-soft">
            Most students meet AI as a chat box. We treat Claude as a tool worth learning well.
          </p>
          <Ph className="mt-5 border-clay text-clay">Placeholder copy</Ph>
        </div>

        {/* centre: one wheel (ring + 3D model share a single rotation) */}
        <Dial3D
          model={a.model}
          label={`3D model for "${a.title}": ${MODEL_LABEL[a.model]}. Drag to turn it.`}
          caption={`Model ${String(i + 1).padStart(2, "0")} · ${MODEL_LABEL[a.model]}`}
          className="mx-auto size-[min(78vw,26rem)]"
        />

        {/* right: copy + controls */}
        <div className="relative z-10 md:pl-4">
          <Hud className="text-night-faint">
            {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </Hud>
          <div aria-live="polite" className="min-h-[13rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={i}
                initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -10 }}
                transition={{ duration: 0.55, ease: FLOW }}
              >
                <h3 className="mt-3 font-display text-3xl leading-tight md:text-4xl">{a.title}</h3>
                <p className="mt-4 max-w-[40ch] font-serif text-lg leading-relaxed text-night-soft">
                  {a.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center gap-5">
            <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Choose an aim">
              {aims.map((x, k) => (
                <button
                  key={x.title}
                  role="tab"
                  aria-selected={k === i}
                  aria-label={x.title}
                  onClick={() => setI(k)}
                  className="group relative h-6 flex-1"
                >
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-1.5 h-[3px] transition-colors duration-500 ease-flow",
                      k === i ? "bg-clay" : "bg-paper/25 group-hover:bg-paper/50",
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <ArrowBtn tone="paper" onClick={() => go(-1)} aria-label="Previous">
                <ChevronLeft className="size-5" aria-hidden />
              </ArrowBtn>
              <ArrowBtn tone="paper" onClick={() => go(1)} aria-label="Next">
                <ChevronRight className="size-5" aria-hidden />
              </ArrowBtn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
