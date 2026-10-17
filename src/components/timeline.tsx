"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateLabel, type ClubEvent } from "@/lib/events";
import { ArrowBtn, Hud } from "@/components/hud";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;
const VISIBLE_DAYS = 62; // scale: about two months fit on screen; the rest scrolls
const MIN_PX = 9; // never squeeze tighter than this (pixels per day)
const CARD_W = 232;
const LANE_H = 124;
const RULER_H = 64;

const t = (d: string) => Date.parse(d + "T00:00:00Z");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const subscribeNever = () => () => {};
const todayUtc = () => {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
};

// Horizontal "version calendar": a date ruler with each event pinned to its
// start date. Drag, scroll or use the arrows to move along it.
export function Timeline({
  events,
  className,
  bleed = false,
}: {
  events: ClubEvent[];
  className?: string;
  /** Run to the right edge of the page instead of stopping at the content column. */
  bleed?: boolean;
}) {
  const outer = useRef<HTMLDivElement>(null);
  // Bleed: stretch to both edges of the page area (right up to the rail on the
  // left, to the window edge on the right), not just the content column.
  const [bleedBox, setBleedBox] = useState<{ ml: number; w: number } | null>(null);
  useEffect(() => {
    if (!bleed) return;
    const fit = () => {
      const el = outer.current;
      if (!el) return;
      const page = (el.closest("main") ?? document.body).getBoundingClientRect();
      // `el` may already be shifted by a previous fit; undo that to find its natural left.
      const natural = el.getBoundingClientRect().left - (parseFloat(el.style.marginLeft) || 0);
      setBleedBox({ ml: page.left - natural, w: page.width });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [bleed]);
  const scroller = useRef<HTMLDivElement>(null);
  const scrollerId = useId();
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });
  // Read on the client only so the server render stays static.
  const today = useSyncExternalStore(subscribeNever, todayUtc, () => null);

  // Scale follows the container so ~two months are visible at once.
  const [viewW, setViewW] = useState(0);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setViewW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const PX = Math.max(viewW / VISIBLE_DAYS, MIN_PX);

  const layout = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
    const min = t(sorted[0].start) - 12 * DAY;
    const max = Math.max(...sorted.map((e) => t(e.end ?? e.start))) + 30 * DAY;
    const days = Math.ceil((max - min) / DAY);
    const laneRight: number[] = [];
    const items = sorted.map((e) => {
      const left = ((t(e.start) - min) / DAY) * PX;
      const width = Math.max(((t(e.end ?? e.start) - t(e.start)) / DAY) * PX, 6);
      let lane = laneRight.findIndex((r) => r + 16 <= left);
      if (lane === -1) lane = laneRight.length;
      laneRight[lane] = left + CARD_W;
      return { e, left, width, lane };
    });
    const months: { label: string; left: number; year?: number }[] = [];
    const cur = new Date(min);
    cur.setUTCDate(1);
    cur.setUTCMonth(cur.getUTCMonth() + 1);
    while (cur.getTime() < max) {
      months.push({
        label: MONTHS[cur.getUTCMonth()],
        year: cur.getUTCMonth() === 0 || months.length === 0 ? cur.getUTCFullYear() : undefined,
        left: ((cur.getTime() - min) / DAY) * PX,
      });
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return { items, months, min, width: days * PX, lanes: Math.max(laneRight.length, 1) };
  }, [events, PX]);

  const todayLeft = today === null ? null : ((today - layout.min) / DAY) * PX;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // Start with the next relevant event (or today) in view.
    const focus =
      todayLeft !== null && todayLeft > 0 && todayLeft < layout.width ? todayLeft : 0;
    el.scrollLeft = Math.max(focus - el.clientWidth * 0.18, 0);
  }, [todayLeft, layout.width]);

  const nudge = (d: number) =>
    scroller.current?.scrollBy({ left: d * 30 * PX, behavior: "smooth" });

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !scroller.current) return;
    drag.current = { down: true, x: e.clientX, left: scroller.current.scrollLeft, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down || !scroller.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    scroller.current.scrollLeft = d.left - dx;
  };
  const end = () => {
    drag.current.down = false;
  };

  // ---- scroll track: a minimap with a draggable window, so it is obvious the
  // timeline can be dragged. Pins show where the events are.
  const track = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ pos: 0, view: 1 });
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setMetrics({ pos: el.scrollLeft / el.scrollWidth, view: Math.min(1, el.clientWidth / el.scrollWidth) });
      });
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [layout.width, viewW]);

  const thumbDrag = useRef({ down: false, x: 0, scroll: 0 });
  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scroller.current) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    thumbDrag.current = { down: true, x: e.clientX, scroll: scroller.current.scrollLeft };
    setTouched(true);
  };
  const onThumbMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = thumbDrag.current;
    const el = scroller.current;
    const tr = track.current;
    if (!d.down || !el || !tr) return;
    el.scrollLeft = d.scroll + ((e.clientX - d.x) / tr.clientWidth) * el.scrollWidth;
  };
  const onThumbUp = () => {
    thumbDrag.current.down = false;
  };
  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    const tr = track.current;
    if (!el || !tr) return;
    const r = tr.getBoundingClientRect();
    const ratio = (e.clientX - r.left) / r.width;
    el.scrollTo({ left: ratio * el.scrollWidth - el.clientWidth / 2, behavior: "smooth" });
    setTouched(true);
  };

  return (
    <div
      ref={outer}
      className={cn("relative", className)}
      style={bleed && bleedBox ? { width: bleedBox.w, marginLeft: bleedBox.ml } : undefined}
    >
      <div className={cn("absolute top-0 z-20 flex gap-2 md:-top-14", bleed ? "right-6 md:right-12" : "right-0")}>
        <ArrowBtn onClick={() => nudge(-1)} aria-label="Scroll timeline back">
          <ChevronLeft className="size-5" aria-hidden />
        </ArrowBtn>
        <ArrowBtn onClick={() => nudge(1)} aria-label="Scroll timeline forward">
          <ChevronRight className="size-5" aria-hidden />
        </ArrowBtn>
      </div>

      {layout.width > viewW + 2 && (
        <div className={cn("relative mb-4 flex items-center gap-4", bleed ? "px-6 md:px-12" : "")}>
          <div
            ref={track}
            onPointerDown={onTrackDown}
            role="scrollbar"
            aria-orientation="horizontal"
            aria-controls={scrollerId}
            aria-label="Timeline position: drag to scroll"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(metrics.pos * 100)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") nudge(1);
              if (e.key === "ArrowLeft") nudge(-1);
            }}
            className="group relative h-9 flex-1 cursor-pointer touch-none select-none"
          >
            {/* rail */}
            <span aria-hidden className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-ink/15" />
            {/* event pins */}
            {layout.items.map(({ e, left }) => (
              <span
                key={e.slug}
                aria-hidden
                title={e.title}
                className={cn(
                  "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45",
                  e.status === "past" ? "bg-ink/35" : e.status === "active" ? "bg-clay-deep" : "bg-ink",
                )}
                style={{ left: `${(left / layout.width) * 100}%` }}
              />
            ))}
            {/* today */}
            {todayLeft !== null && todayLeft > 0 && todayLeft < layout.width && (
              <span
                aria-hidden
                className="absolute top-1/2 h-5 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-clay-deep"
                style={{ left: `${(todayLeft / layout.width) * 100}%` }}
              />
            )}
            {/* the window: what is on screen right now. Drag it. */}
            <div
              onPointerDown={onThumbDown}
              onPointerMove={onThumbMove}
              onPointerUp={onThumbUp}
              onPointerCancel={onThumbUp}
              className="absolute top-0 flex h-full min-w-12 cursor-grab items-center justify-between border-2 border-ink bg-ink/10 px-1.5 transition-colors duration-300 ease-flow hover:bg-clay/25 active:cursor-grabbing active:bg-clay/30"
              style={{ left: `${metrics.pos * 100}%`, width: `${metrics.view * 100}%` }}
            >
              <span aria-hidden className="h-4 w-[3px] bg-ink" />
              <span aria-hidden className="h-4 w-[3px] bg-ink" />
            </div>
          </div>
          {!touched && (
            <span className="hud hidden shrink-0 text-ink-faint md:inline">Drag the bar or the timeline</span>
          )}
        </div>
      )}

      <div
        ref={scroller}
        id={scrollerId}
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
        aria-label="Event timeline, scrollable"
        className="hide-scrollbar relative cursor-grab select-none overflow-x-auto overscroll-x-contain pt-12 active:cursor-grabbing md:pt-0"
      >
        <div
          className="relative"
          style={{ width: layout.width, height: RULER_H + layout.lanes * LANE_H + 28 }}
        >
          {/* ruler */}
          <div
            className="absolute inset-x-0 top-0 border-y border-ink/25 bg-paper-raised"
            style={{ height: RULER_H }}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2.5"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, var(--color-ink-faint) 0 1px, transparent 1px " +
                  PX +
                  "px)",
              }}
            />
            {layout.months.map((m) => (
              <div key={m.left} className="absolute inset-y-0" style={{ left: m.left }}>
                <span aria-hidden className="absolute inset-y-0 w-px bg-ink" />
                <span className="absolute left-2 top-2 font-display text-2xl leading-none">
                  {m.label}
                </span>
                {m.year && <Hud className="absolute left-2 top-9 text-ink-faint">{m.year}</Hud>}
              </div>
            ))}
          </div>

          {/* today marker */}
          {todayLeft !== null && todayLeft > 0 && todayLeft < layout.width && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 z-0 w-px bg-clay-deep"
              style={{ left: todayLeft, height: RULER_H + layout.lanes * LANE_H + 28 }}
            >
              <span className="hud absolute left-1 top-[calc(100%-1.25rem)] bg-clay-deep px-1.5 py-0.5 text-paper">
                Today
              </span>
            </div>
          )}

          {/* events */}
          {layout.items.map(({ e, left, width, lane }) => {
            const past = e.status === "past";
            return (
              <div key={e.slug}>
                {/* span bar on the ruler */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute h-2.5",
                    past ? "bg-ink-faint" : e.status === "active" ? "bg-clay-deep" : "bg-ink",
                  )}
                  style={{ left, width, top: RULER_H - 10 }}
                />
                {/* stem */}
                <span
                  aria-hidden
                  className="absolute w-px bg-ink/40"
                  style={{ left, top: RULER_H, height: lane * LANE_H + 18 }}
                />
                <Link
                  href={`/events/${e.slug}`}
                  draggable={false}
                  className={cn(
                    "group absolute z-10 block border-l-[3px] bg-paper p-3 pr-2 shadow-[0_0_0_1px_var(--color-border)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-ink)]",
                    past
                      ? "border-ink-faint text-ink-faint"
                      : e.status === "active"
                        ? "border-clay-deep"
                        : "border-ink",
                  )}
                  style={{
                    left,
                    top: RULER_H + lane * LANE_H + 18,
                    width: CARD_W,
                    height: LANE_H - 14,
                  }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <Hud className={past ? "" : "text-ink-faint"}>{dateLabel(e)}</Hud>
                    <StatusDot status={e.status} />
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 line-clamp-2 block font-display text-[1.15rem] leading-tight",
                      !past && "text-ink",
                    )}
                  >
                    {e.title}
                  </span>
                  <span className="hud mt-2 block">{e.kind}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export function StatusDot({ status }: { status: ClubEvent["status"] }) {
  const map = {
    active: { label: "Live", cls: "bg-clay-deep text-paper" },
    upcoming: { label: "Open", cls: "bg-ink text-paper" },
    past: { label: "Past", cls: "bg-paper-field text-ink-soft" },
  } as const;
  const m = map[status];
  return <span className={cn("hud px-1.5 py-0.5", m.cls)}>{m.label}</span>;
}
