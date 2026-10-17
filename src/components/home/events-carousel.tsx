"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, type Variants } from "motion/react";
import { useReducedMotion } from "@/lib/motion";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { dateLabel, type ClubEvent } from "@/lib/events";
import { ArrowBtn, Hud } from "@/components/hud";
import { StatusDot } from "@/components/timeline";
import { cn } from "@/lib/utils";

const FLOW = [0.65, 0, 0.35, 1] as const;

const tones = [
  { bg: "bg-night text-paper", soft: "text-night-soft", rule: "border-paper/30", btn: "bg-clay text-ink hover:bg-paper" },
  { bg: "bg-clay text-ink", soft: "text-ink/75", rule: "border-ink/30", btn: "bg-ink text-paper hover:bg-paper hover:text-ink" },
  { bg: "bg-manilla text-ink", soft: "text-ink/70", rule: "border-ink/25", btn: "bg-ink text-paper hover:bg-clay-deep" },
  { bg: "bg-cactus text-ink", soft: "text-ink/70", rule: "border-ink/25", btn: "bg-ink text-paper hover:bg-clay-deep" },
  { bg: "bg-heather text-ink", soft: "text-ink/70", rule: "border-ink/25", btn: "bg-ink text-paper hover:bg-clay-deep" },
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parts = (d: string) => ({ day: Number(d.slice(8, 10)), mon: MONTHS[Number(d.slice(5, 7)) - 1] });

const group: Variants = {
  out: {},
  in: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } },
};
const rise: Variants = {
  out: { opacity: 0, y: 24 },
  in: { opacity: 1, y: 0, transition: { duration: 0.75, ease: FLOW } },
};

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/** Outline that draws itself around its parent when `on`. */
function DrawFrame({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg aria-hidden className={cn("pointer-events-none absolute -inset-2.5 size-[calc(100%+1.25rem)] overflow-visible", className)}>
      <motion.rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        pathLength={1}
        strokeDasharray={1}
        initial={false}
        animate={{ strokeDashoffset: on ? 0 : 1, opacity: on ? 1 : 0 }}
        transition={{ duration: on ? 1.3 : 0.5, ease: FLOW }}
      />
    </svg>
  );
}

/** The path between two cards: dashed track, with a solid line that fills once you've travelled it. */
function Connector({ reached }: { reached: boolean }) {
  return (
    <div aria-hidden className="relative z-10 h-6 w-[4.5rem] shrink-0 self-center md:w-24">
      <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-ink/30" />
      <motion.span
        className="absolute inset-x-0 top-1/2 h-[2px] origin-left -translate-y-1/2 bg-clay-deep"
        initial={false}
        animate={{ scaleX: reached ? 1 : 0 }}
        transition={{ duration: 1, ease: FLOW }}
      />
      <motion.span
        className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-clay-deep"
        initial={false}
        animate={{ backgroundColor: reached ? "#c6613f" : "#faf9f5", scale: reached ? 1.15 : 1 }}
        transition={{ duration: 0.7, ease: FLOW }}
      />
    </div>
  );
}

// Highlighted events as a path of cards. Swipe, drag, scroll, or use the
// arrows: every move settles with a soft ease (never a hard snap). The
// centred card is full size, neighbours stay visible so you can see there
// is more, and the path between cards fills in as you travel along it.
export function EventsCarousel({ events }: { events: ClubEvent[] }) {
  const root = useRef<HTMLDivElement>(null);
  const onScreen = useInView(root); // endless motion only runs while the carousel is visible
  const scroller = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const anim = useRef(0);
  const animating = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false, startActive: 0, samples: [] as [number, number][] });
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const reduce = useReducedMotion();
  const total = events.length + 1; // + the "all events" end card

  const update = useCallback(() => {
    const sc = scroller.current;
    if (!sc) return;
    const mid = sc.scrollLeft + sc.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    items.current.forEach((el, i) => {
      if (!el) return;
      const c = el.offsetLeft + el.offsetWidth / 2;
      const signed = (c - mid) / el.offsetWidth;
      el.style.setProperty("--d", Math.min(Math.abs(signed), 1).toFixed(3));
      el.style.setProperty("--s", Math.max(-1, Math.min(1, signed)).toFixed(3));
      if (Math.abs(signed) < bestD) {
        bestD = Math.abs(signed);
        best = i;
      }
    });
    activeRef.current = best;
    setActive((a) => (a === best ? a : best));
  }, []);

  const leftFor = useCallback((i: number) => {
    const sc = scroller.current;
    const el = items.current[Math.max(0, Math.min(total - 1, i))];
    if (!sc || !el) return 0;
    return el.offsetLeft - (sc.clientWidth - el.offsetWidth) / 2;
  }, [total]);

  /** Eased scroll: slow start, quick middle, soft landing. */
  const tweenTo = useCallback(
    (left: number, dur = 950) => {
      const sc = scroller.current;
      if (!sc) return;
      cancelAnimationFrame(anim.current);
      const from = sc.scrollLeft;
      const dist = left - from;
      if (Math.abs(dist) < 1) return;
      if (reduce) {
        sc.scrollLeft = left;
        return;
      }
      const t0 = performance.now();
      animating.current = true;
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        sc.scrollLeft = from + dist * easeInOut(p);
        if (p < 1) anim.current = requestAnimationFrame(step);
        else animating.current = false;
      };
      anim.current = requestAnimationFrame(step);
    },
    [reduce],
  );

  const goTo = useCallback((i: number) => tweenTo(leftFor(i)), [tweenTo, leftFor]);

  useEffect(() => {
    update();
    const sc = scroller.current;
    if (!sc) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
      // after a free scroll (trackpad, touch, wheel) ease to the nearest card
      if (animating.current || drag.current.down) return;
      clearTimeout(settle.current);
      settle.current = setTimeout(() => tweenTo(leftFor(activeRef.current), 700), 170);
    };
    const cancelTween = () => {
      cancelAnimationFrame(anim.current);
      animating.current = false;
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    sc.addEventListener("wheel", cancelTween, { passive: true });
    sc.addEventListener("touchstart", cancelTween, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      sc.removeEventListener("scroll", onScroll);
      sc.removeEventListener("wheel", cancelTween);
      sc.removeEventListener("touchstart", cancelTween);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(anim.current);
      clearTimeout(settle.current);
    };
  }, [update, tweenTo, leftFor]);

  const onDown = (e: React.PointerEvent) => {
    const sc = scroller.current;
    if (e.pointerType !== "mouse" || !sc || e.button !== 0) return;
    cancelAnimationFrame(anim.current);
    animating.current = false;
    clearTimeout(settle.current);
    drag.current = {
      down: true,
      x: e.clientX,
      left: sc.scrollLeft,
      moved: false,
      startActive: activeRef.current,
      samples: [[performance.now(), e.clientX]],
    };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const sc = scroller.current;
    if (!d.down || !sc) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true;
      sc.setPointerCapture(e.pointerId);
    }
    if (d.moved) {
      sc.scrollLeft = d.left - dx;
      const now = performance.now();
      d.samples.push([now, e.clientX]);
      while (d.samples.length > 2 && now - d.samples[0][0] > 120) d.samples.shift();
    }
  };
  const onUp = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    if (!d.moved) return;
    // A short flick is enough: ~45px of travel, or a quick throw.
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const v = last && first && last[0] > first[0] ? (last[1] - first[1]) / (last[0] - first[0]) : 0; // px/ms
    const travelled = scroller.current ? scroller.current.scrollLeft - d.left : 0;
    let target = activeRef.current;
    if (Math.abs(travelled) > 45 || Math.abs(v) > 0.35) {
      const dir = travelled > 0 || v < -0.35 ? 1 : -1;
      target = d.startActive + dir;
    } else {
      target = d.startActive;
    }
    goTo(Math.max(0, Math.min(total - 1, target)));
    setTimeout(() => (drag.current.moved = false), 0);
  };

  const shown = Math.min(active, events.length - 1);

  return (
    <div ref={root}>
      <div className="mb-4 flex items-center justify-between gap-4 px-6 md:px-12">
        <div className="flex items-center gap-4">
          <span className="font-display text-3xl tabular-nums">
            {String(shown + 1).padStart(2, "0")}
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
                    "absolute inset-x-0 bottom-2 h-[3px] transition-all duration-700 ease-flow",
                    i === active ? "bg-clay-deep" : i < active ? "bg-ink/60" : "bg-ink/20 group-hover:bg-ink/50",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hud hidden text-ink-faint md:inline">Drag, swipe or use the arrows</span>
          <ArrowBtn onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous event">
            <ChevronLeft className="size-5" aria-hidden />
          </ArrowBtn>
          <ArrowBtn onClick={() => goTo(active + 1)} disabled={active >= total - 1} aria-label="Next event">
            <ChevronRight className="size-5" aria-hidden />
          </ArrowBtn>
        </div>
      </div>

      <div
        ref={scroller}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") goTo(active + 1);
          if (e.key === "ArrowLeft") goTo(active - 1);
        }}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Highlighted events"
        className="hide-scrollbar flex cursor-grab touch-pan-x items-center overflow-x-auto overscroll-x-contain px-[max(1rem,calc(50%-min(40vw,27rem)))] py-10 outline-offset-[-4px] active:cursor-grabbing"
      >
        {events.map((e, i) => {
          const t = tones[i % tones.length];
          const on = i === active;
          const { day, mon } = parts(e.start);
          const tag = i === active - 1 ? "Last" : i === active + 1 ? "Next" : null;
          return (
            <Fragment key={e.slug}>
              <div
                ref={(el) => {
                  items.current[i] = el;
                }}
                aria-label={`${i + 1} of ${events.length}`}
                aria-roledescription="slide"
                onClickCapture={(ev) => {
                  if (i !== activeRef.current && !drag.current.moved) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    goTo(i);
                  }
                }}
                className={cn(
                  "relative w-[min(80vw,54rem)] shrink-0",
                  "origin-center [transform:scale(calc(1_-_var(--d,0)*0.06))] [opacity:calc(1_-_var(--d,0)*0.38)]",
                  !on && "cursor-pointer",
                )}
              >
                <DrawFrame on={on} className="text-clay-deep" />
                <div className={cn("relative grid overflow-hidden md:min-h-[26rem] md:grid-cols-[1.15fr_0.85fr]", t.bg)}>
                  {tag && (
                    <span className="hud absolute left-0 top-0 z-30 flex items-center gap-1.5 bg-ink px-2.5 py-1 text-paper">
                      {tag === "Last" ? "◂ Last" : "Next ▸"}
                      <span className="opacity-60">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                  )}
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
                      className="mt-4 max-w-[15ch] font-display text-4xl leading-[1.02] md:text-[3.2rem]"
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
                      {e.applyUrl && e.status !== "past" && (
                        <a
                          href={e.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("inline-flex h-12 items-center gap-2 px-6 font-medium transition-colors duration-500 ease-flow", t.btn)}
                        >
                          Apply
                          <ArrowUpRight className="size-4" aria-hidden />
                        </a>
                      )}
                      <Link
                        href={`/events/${e.slug}`}
                        className={cn(
                          "inline-flex h-12 items-center gap-2 border px-6 font-medium transition-colors duration-500 ease-flow hover:bg-current/10",
                          t.rule,
                        )}
                      >
                        Details
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </motion.div>
                  </motion.div>

                  {/* art side: paper plate + calendar-leaf date; the plate drifts against the scroll */}
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
                      className="relative grid size-[17rem] place-items-center overflow-hidden bg-paper"
                      style={{
                        transform: "translateX(calc(var(--s, 0) * -48px)) rotate(calc(-3deg + var(--s, 0) * 5deg))",
                      }}
                    >
                      {e.photo ? (
                        <Image src={e.photo} alt="" fill sizes="272px" className="object-cover" />
                      ) : (
                        <motion.div
                          animate={on && onScreen && !reduce ? { y: [0, -9, 0], rotate: [0, 1.5, 0] } : { y: 0, rotate: 0 }}
                          transition={{ duration: 6, repeat: Infinity, ease: FLOW }}
                          className="size-[78%]"
                        >
                          <Image src={e.art} alt="" width={260} height={260} className="size-full object-contain" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Connector reached={active > i} />
            </Fragment>
          );
        })}

        {/* end of the path */}
        <div
          ref={(el) => {
            items.current[events.length] = el;
          }}
          aria-roledescription="slide"
          aria-label="All events"
          className="relative w-[min(70vw,24rem)] shrink-0 origin-center [transform:scale(calc(1_-_var(--d,0)*0.06))] [opacity:calc(1_-_var(--d,0)*0.38)]"
        >
          <DrawFrame on={active === events.length} className="text-ink" />
          <Link
            href="/events"
            className="group relative flex min-h-[26rem] flex-col justify-between bg-paper p-8 text-ink"
          >
            <Hud className="text-ink-faint">End of the path</Hud>
            <div>
              <p className="font-display text-4xl leading-tight">That’s what’s coming. Want the whole year?</p>
              <span className="mt-6 inline-flex h-12 items-center gap-2 bg-ink px-6 font-medium text-paper transition-colors duration-500 ease-flow group-hover:bg-clay-deep">
                All events and history
                <ArrowRight className="size-4 transition-transform duration-500 ease-flow group-hover:translate-x-1" aria-hidden />
              </span>
            </div>
          </Link>
        </div>
        <div aria-hidden className="w-6 shrink-0" />
      </div>
    </div>
  );
}
