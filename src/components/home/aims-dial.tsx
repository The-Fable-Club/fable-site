"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { aims } from "@/data/club";
import { Hud, Ph } from "@/components/hud";
import { cn } from "@/lib/utils";

const TICKS = 72;

// Carousel stage with a rotating dial, after Endfield's "Lore" panel.
// Changing slide turns the dial one step and swaps the copy.
export function AimsDial() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const n = aims.length;

  const go = useCallback(
    (d: number) => {
      setDir(d);
      setI((v) => (v + d + n) % n);
    },
    [n],
  );

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

  const a = aims[i];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What the club is for"
      className="relative overflow-hidden bg-night-sunken text-paper"
    >
      <div className="mx-auto grid min-h-[min(46rem,90dvh)] max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-[1fr_auto_1fr] md:px-12">
        {/* left: heading */}
        <div className="md:self-start md:pt-6">
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

        {/* centre: dial */}
        <div className="relative mx-auto size-[min(78vw,26rem)]">
          <motion.svg
            viewBox="-210 -210 420 420"
            aria-hidden
            className="absolute inset-0 size-full"
            animate={{ rotate: reduce ? 0 : -i * (360 / n) }}
            transition={{ type: "spring", stiffness: 70, damping: 16 }}
          >
            {Array.from({ length: TICKS }).map((_, k) => {
              const ang = (k / TICKS) * Math.PI * 2;
              const major = k % (TICKS / n) === 0;
              const r1 = major ? 176 : 184;
              const r2 = 196;
              return (
                <line
                  key={k}
                  x1={Math.sin(ang) * r1}
                  y1={-Math.cos(ang) * r1}
                  x2={Math.sin(ang) * r2}
                  y2={-Math.cos(ang) * r2}
                  stroke={major ? "var(--color-clay)" : "var(--color-night-faint)"}
                  strokeWidth={major ? 3 : 1.5}
                />
              );
            })}
            <circle r="164" fill="none" stroke="var(--color-night-faint)" strokeWidth="1" />
            <path
              d="M -150 -66 A 164 164 0 0 1 -60 -152"
              fill="none"
              stroke="var(--color-paper)"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M 150 66 A 164 164 0 0 1 60 152"
              fill="none"
              stroke="var(--color-paper)"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.7"
            />
          </motion.svg>

          <div className="absolute inset-[17%] grid place-items-center overflow-hidden rounded-full bg-paper">
            <AnimatePresence mode="popLayout" custom={dir}>
              <motion.div
                key={i}
                custom={dir}
                initial={{ opacity: 0, x: reduce ? 0 : dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduce ? 0 : dir * -40 }}
                transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                className="size-[68%]"
              >
                <Image src={a.art} alt="" width={240} height={240} className="size-full object-contain" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* right: copy + controls */}
        <div className="md:pl-4">
          <Hud className="text-night-faint">
            {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </Hud>
          <div aria-live="polite" className="min-h-[13rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={i}
                initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -10 }}
                transition={{ duration: 0.25 }}
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
                  onClick={() => {
                    setDir(k > i ? 1 : -1);
                    setI(k);
                  }}
                  className="group relative h-6 flex-1"
                >
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-1.5 h-[3px] transition-colors",
                      k === i ? "bg-clay" : "bg-paper/25 group-hover:bg-paper/50",
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => go(-1)}
                aria-label="Previous"
                className="grid size-11 place-items-center border border-paper/40 transition-colors hover:bg-paper hover:text-ink"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                onClick={() => go(1)}
                aria-label="Next"
                className="grid size-11 place-items-center border border-paper/40 transition-colors hover:bg-paper hover:text-ink"
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
