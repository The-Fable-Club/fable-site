"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { dateLabel, type ClubEvent } from "@/data/events";
import { Hud } from "@/components/hud";
import { StatusDot } from "@/components/timeline";
import { cn } from "@/lib/utils";

const tones = [
  { bg: "bg-night text-paper", soft: "text-night-soft", rule: "border-paper/25", btn: "bg-clay text-ink hover:bg-paper" },
  { bg: "bg-clay text-ink", soft: "text-ink/75", rule: "border-ink/30", btn: "bg-ink text-paper hover:bg-paper hover:text-ink" },
  { bg: "bg-manilla text-ink", soft: "text-ink/70", rule: "border-ink/25", btn: "bg-ink text-paper hover:bg-clay-deep" },
  { bg: "bg-cactus text-ink", soft: "text-ink/70", rule: "border-ink/25", btn: "bg-ink text-paper hover:bg-clay-deep" },
  { bg: "bg-heather text-ink", soft: "text-ink/70", rule: "border-ink/25", btn: "bg-ink text-paper hover:bg-clay-deep" },
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parts = (d: string) => ({ day: Number(d.slice(8, 10)), mon: MONTHS[Number(d.slice(5, 7)) - 1] });

const group: Variants = {
  out: {},
  in: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};
const rise: Variants = {
  out: { opacity: 0, y: 22 },
  in: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] } },
};

// Highlighted events as a scrollable stage. Swipe, drag, use the arrows or
// the segments. The centred card is full size; neighbours recede, and the
// artwork drifts against the scroll for depth.
export function EventsCarousel({ events }: { events: ClubEvent[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  // Per-card depth values written straight to CSS variables on scroll.
  const update = useCallback(() => {
    const sc = scroller.current;
    if (!sc) return;
    const mid = sc.scrollLeft + sc.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    cards.current.forEach((el, i) => {
      if (!el) return;
      const c = el.offsetLeft + el.offsetWidth / 2;
      const signed = (c - mid) / el.offsetWidth; // -1..1 about the centre
      const d = Math.min(Math.abs(signed), 1);
      el.style.setProperty("--d", d.toFixed(3));
      el.style.setProperty("--s", Math.max(-1, Math.min(1, signed)).toFixed(3));
      if (Math.abs(signed) < bestD) {
        bestD = Math.abs(signed);
        best = i;
      }
    });
    setActive((a) => (a === best ? a : best));
  }, []);

  useEffect(() => {
    update();
    const sc = scroller.current;
    if (!sc) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [update]);

  const goTo = (i: number) => {
    const sc = scroller.current;
    const el = cards.current[Math.max(0, Math.min(events.length - 1, i))];
    if (!sc || !el) return;
    sc.scrollTo({
      left: el.offsetLeft - (sc.clientWidth - el.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !scroller.current) return;
    drag.current = { down: true, x: e.clientX, left: scroller.current.scrollLeft, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const sc = scroller.current;
    if (!d.down || !sc) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4 && !d.moved) {
      d.moved = true;
      sc.style.scrollSnapType = "none";
    }
    if (d.moved) sc.scrollLeft = d.left - dx;
  };
  const end = () => {
    const sc = scroller.current;
    if (drag.current.down && sc) sc.style.scrollSnapType = "";
    drag.current.down = false;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 px-6 md:px-12">
        <div className="flex items-center gap-4">
          <span className="font-display text-3xl tabular-nums">
            {String(active + 1).padStart(2, "0")}
            <span className="text-ink-faint"> / {String(events.length).padStart(2, "0")}</span>
          </span>
          <div className="hidden gap-1.5 sm:flex" role="tablist" aria-label="Choose an event">
            {events.map((e, i) => (
              <button
                key={e.slug}
                role="tab"
                aria-selected={i === active}
                aria-label={e.title}
                onClick={() => goTo(i)}
                className="group relative h-6 w-7"
              >
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-2 h-[3px] transition-all duration-300",
                    i === active ? "bg-clay-deep" : "bg-ink/20 group-hover:bg-ink/50",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous event"
            className="grid size-11 place-items-center border border-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            onClick={() => goTo(active + 1)}
            disabled={active === events.length - 1}
            aria-label="Next event"
            className="grid size-11 place-items-center border border-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={end}
        onPointerLeave={end}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = false;
          }
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Highlighted events"
        className="hide-scrollbar flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain px-[max(1.5rem,calc(50vw-min(43vw,30rem)))] py-6 active:cursor-grabbing"
      >
        {events.map((e, i) => {
          const t = tones[i % tones.length];
          const on = i === active;
          const { day, mon } = parts(e.start);
          return (
            <div
              key={e.slug}
              ref={(el) => {
                cards.current[i] = el;
              }}
              aria-label={`${i + 1} of ${events.length}`}
              aria-roledescription="slide"
              className={cn(
                "relative grid w-[min(86vw,60rem)] shrink-0 snap-center overflow-hidden md:min-h-[27rem] md:grid-cols-[1.15fr_0.85fr]",
                "origin-center [transform:scale(calc(1_-_var(--d,0)*0.07))] [opacity:calc(1_-_var(--d,0)*0.5)] transition-[box-shadow] duration-300",
                t.bg,
              )}
            >
              <motion.div
                variants={group}
                initial="out"
                animate={on || reduce ? "in" : "out"}
                className="relative z-10 flex flex-col p-7 md:p-11"
              >
                <motion.div variants={rise} className="flex items-center gap-3">
                  <StatusDot status={e.status} />
                  <Hud className="opacity-70">
                    {e.kind}
                    {e.phase > 0 && ` · Phase ${e.phase}`}
                  </Hud>
                </motion.div>
                <motion.h3
                  variants={rise}
                  className="mt-4 max-w-[15ch] font-display text-4xl leading-[1.02] md:text-[3.4rem]"
                >
                  {e.title}
                </motion.h3>
                <motion.p variants={rise} className={cn("mt-4 max-w-[44ch] font-serif text-lg leading-relaxed", t.soft)}>
                  {e.summary}
                </motion.p>
                <motion.dl variants={rise} className={cn("mt-5 grid gap-1.5 text-sm", t.soft)}>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    <dt className="sr-only">When</dt>
                    <dd>
                      {dateLabel(e)} · {e.time}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0" aria-hidden />
                    <dt className="sr-only">Where</dt>
                    <dd>{e.venue}</dd>
                  </div>
                </motion.dl>
                <motion.div variants={rise} className="mt-auto flex flex-wrap gap-3 pt-7">
                  {e.applyUrl && (
                    <a
                      href={e.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("inline-flex h-12 items-center gap-2 px-6 font-medium transition-colors", t.btn)}
                    >
                      Apply
                      <ArrowUpRight className="size-4" aria-hidden />
                    </a>
                  )}
                  <Link
                    href={`/events/${e.slug}`}
                    className={cn(
                      "inline-flex h-12 items-center gap-2 border px-6 font-medium transition-colors hover:bg-current/10",
                      t.rule,
                    )}
                  >
                    Details
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </motion.div>
              </motion.div>

              {/* art side: paper plate + calendar-leaf date, art drifts against scroll */}
              <div className="relative hidden items-center justify-center overflow-hidden md:flex">
                <div
                  aria-hidden
                  className="absolute right-6 top-6 z-20 w-20 bg-paper text-center text-ink shadow-[0_6px_0_-2px_rgb(20_20_19/0.18)]"
                >
                  <div className="bg-ink py-1 text-[0.7rem] font-medium tracking-widest text-paper">
                    {mon.toUpperCase()}
                  </div>
                  <div className="py-1 font-display text-5xl leading-none tabular-nums">{day}</div>
                </div>
                <div
                  className="relative grid size-[17rem] place-items-center bg-paper"
                  style={{
                    transform: "translateX(calc(var(--s, 0) * -48px)) rotate(calc(-3deg + var(--s, 0) * 5deg))",
                  }}
                >
                  <motion.div
                    animate={on && !reduce ? { y: [0, -9, 0], rotate: [0, 1.5, 0] } : { y: 0, rotate: 0 }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                    className="size-[78%]"
                  >
                    <Image src={e.art} alt="" width={260} height={260} className="size-full object-contain" />
                  </motion.div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
