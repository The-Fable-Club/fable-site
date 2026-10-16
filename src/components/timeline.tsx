"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateLabel, type ClubEvent } from "@/lib/events";
import { ArrowBtn, Hud } from "@/components/hud";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;
const WINDOW_DAYS = 62; // about two months: nobody plans further than that
const STEP_DAYS = 30;
const CARD_W = 232;
const LANE_H = 124;
const RULER_H = 64;
const FLOW = [0.65, 0, 0.35, 1] as const;

const t = (d: string) => Date.parse(d + "T00:00:00Z");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const subscribeNever = () => () => {};
const todayUtc = () => {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
};

// Two-month "version calendar": a date ruler with each event pinned to its
// start date (multi-day events show as a bar). Step through with the arrows
// or by swiping; the window starts around today, or at the next event if
// nothing is coming up.
export function Timeline({ events, className }: { events: ClubEvent[]; className?: string }) {
  const today = useSyncExternalStore(subscribeNever, todayUtc, () => null);
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [shift, setShift] = useState(0); // in STEP_DAYS
  const [dir, setDir] = useState(1);
  const swipe = useRef({ x: 0, down: false, moved: false });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const range = useMemo(() => {
    const starts = events.map((e) => t(e.start));
    const ends = events.map((e) => t(e.end ?? e.start));
    return { min: Math.min(...starts), max: Math.max(...ends) };
  }, [events]);

  // Where the window begins before any shifting.
  const base = useMemo(() => {
    if (today === null || !events.length) return null;
    const from = today - 10 * DAY;
    const inWindow = events.some((e) => t(e.end ?? e.start) >= from && t(e.start) <= from + WINDOW_DAYS * DAY);
    if (inWindow) return from;
    const next = events.map((e) => t(e.start)).filter((s) => s >= today).sort((a, b) => a - b)[0];
    if (next !== undefined) return next - 10 * DAY;
    return range.max - (WINDOW_DAYS - 10) * DAY;
  }, [today, events, range.max]);

  const winStart = base === null ? 0 : base + shift * STEP_DAYS * DAY;
  const winEnd = winStart + WINDOW_DAYS * DAY;
  const px = width ? width / WINDOW_DAYS : 0;

  const layout = useMemo(() => {
    if (base === null || !px) return null;
    const visible = events
      .filter((e) => t(e.end ?? e.start) + DAY > winStart && t(e.start) < winEnd)
      .sort((a, b) => a.start.localeCompare(b.start));
    const laneRight: number[] = [];
    const items = visible.map((e) => {
      const x = ((t(e.start) - winStart) / DAY) * px;
      const barW = Math.max(((t(e.end ?? e.start) - t(e.start)) / DAY + 1) * px, 8);
      const cardLeft = Math.max(0, Math.min(x, width - CARD_W));
      let lane = laneRight.findIndex((r) => r + 14 <= cardLeft);
      if (lane === -1) lane = laneRight.length;
      laneRight[lane] = cardLeft + CARD_W;
      return { e, x: Math.max(x, 0), barW, cardLeft, lane };
    });
    // month starts + window start label
    const months: { label: string; left: number; year?: number }[] = [];
    const first = new Date(winStart);
    months.push({ label: MONTHS[first.getUTCMonth()], left: 0, year: first.getUTCFullYear() });
    const cur = new Date(winStart);
    cur.setUTCDate(1);
    cur.setUTCMonth(cur.getUTCMonth() + 1);
    while (cur.getTime() < winEnd) {
      const left = ((cur.getTime() - winStart) / DAY) * px;
      if (left > 54) {
        months.push({ label: MONTHS[cur.getUTCMonth()], left, year: cur.getUTCMonth() === 0 ? cur.getUTCFullYear() : undefined });
      } else {
        months[0] = { label: MONTHS[cur.getUTCMonth()], left: 0, year: cur.getUTCFullYear() };
      }
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    // weekly date labels
    const weeks: { n: number; left: number }[] = [];
    for (let d = 3; d < WINDOW_DAYS; d += 7) {
      const date = new Date(winStart + d * DAY);
      weeks.push({ n: date.getUTCDate(), left: d * px });
    }
    return { items, months, weeks, lanes: Math.max(laneRight.length, 1) };
  }, [base, px, events, winStart, winEnd, width]);

  const canBack = base !== null && winStart > range.min - STEP_DAYS * DAY;
  const canFwd = base !== null && winEnd < range.max + STEP_DAYS * DAY;
  const move = (d: number) => {
    setDir(d);
    setShift((s) => s + d);
  };

  const label =
    base === null
      ? ""
      : `${MONTHS[new Date(winStart).getUTCMonth()]} ${new Date(winStart).getUTCFullYear()} – ${MONTHS[new Date(winEnd - DAY).getUTCMonth()]} ${new Date(winEnd - DAY).getUTCFullYear()}`;

  const todayLeft = today !== null && base !== null && px ? ((today - winStart) / DAY) * px : null;
  const height = RULER_H + (layout?.lanes ?? 1) * LANE_H + 28;

  return (
    <div className={cn("relative", className)}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Hud className="text-ink-faint">{label || " "}</Hud>
        <div className="flex gap-2">
          <ArrowBtn onClick={() => move(-1)} disabled={!canBack} aria-label="Earlier weeks">
            <ChevronLeft className="size-5" aria-hidden />
          </ArrowBtn>
          <ArrowBtn onClick={() => move(1)} disabled={!canFwd} aria-label="Later weeks">
            <ChevronRight className="size-5" aria-hidden />
          </ArrowBtn>
        </div>
      </div>

      <div
        ref={wrap}
        role="region"
        aria-label="Event timeline, about two months"
        className="relative select-none"
        style={{ height }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") swipe.current = { x: e.clientX, down: true, moved: false };
        }}
        onPointerMove={(e) => {
          const s = swipe.current;
          if (s.down && Math.abs(e.clientX - s.x) > 6) s.moved = true;
        }}
        onPointerUp={(e) => {
          const s = swipe.current;
          if (!s.down) return;
          s.down = false;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 70) {
            if (dx < 0 && canFwd) move(1);
            if (dx > 0 && canBack) move(-1);
          }
          setTimeout(() => (swipe.current.moved = false), 0);
        }}
        onClickCapture={(e) => {
          if (swipe.current.moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          {layout && (
            <motion.div
              key={shift}
              initial={{ opacity: 0, x: reduce ? 0 : dir * 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduce ? 0 : dir * -36 }}
              transition={{ duration: 0.55, ease: FLOW }}
              className="absolute inset-0"
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
                    backgroundImage: `repeating-linear-gradient(90deg, var(--color-ink-faint) 0 1px, transparent 1px ${px}px)`,
                  }}
                />
                {layout.months.map((m) => (
                  <div key={m.left} className="absolute inset-y-0" style={{ left: m.left }}>
                    <span aria-hidden className="absolute inset-y-0 w-px bg-ink" />
                    <span className="absolute left-2 top-2 font-display text-2xl leading-none">{m.label}</span>
                    {m.year && <Hud className="absolute left-2 top-9 text-ink-faint">{m.year}</Hud>}
                  </div>
                ))}
                {layout.weeks
                  .filter((w) => layout.months.every((m) => Math.abs(m.left - w.left) > 56))
                  .map((w) => (
                  <span
                    key={"w" + w.left}
                    className="hud absolute top-2 text-ink-faint"
                    style={{ left: w.left, transform: "translateX(-50%)" }}
                  >
                    {w.n}
                  </span>
                ))}
              </div>

              {/* today marker */}
              {todayLeft !== null && todayLeft >= 0 && todayLeft <= width && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-0 z-0 w-px bg-clay-deep"
                  style={{ left: todayLeft, height }}
                >
                  <span className="hud absolute left-1 top-[calc(100%-1.25rem)] bg-clay-deep px-1.5 py-0.5 text-paper">
                    Today
                  </span>
                </div>
              )}

              {/* events */}
              {layout.items.map(({ e, x, barW, cardLeft, lane }) => {
                const past = e.status === "past";
                return (
                  <div key={e.slug}>
                    <span
                      aria-hidden
                      className={cn(
                        "absolute h-2.5",
                        past ? "bg-ink-faint" : e.status === "active" ? "bg-clay-deep" : "bg-ink",
                      )}
                      style={{ left: x, width: Math.min(barW, width - x), top: RULER_H - 10 }}
                    />
                    <span
                      aria-hidden
                      className="absolute w-px bg-ink/40"
                      style={{ left: x, top: RULER_H, height: lane * LANE_H + 18 }}
                    />
                    <Link
                      href={`/events/${e.slug}`}
                      draggable={false}
                      className={cn(
                        "group absolute z-10 block border-l-[3px] bg-paper p-3 pr-2 shadow-[0_0_0_1px_var(--color-border)] transition-[transform,box-shadow] duration-500 ease-flow hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-ink)]",
                        past
                          ? "border-ink-faint text-ink-faint"
                          : e.status === "active"
                            ? "border-clay-deep"
                            : "border-ink",
                      )}
                      style={{
                        left: cardLeft,
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

              {layout.items.length === 0 && (
                <p className="absolute inset-x-0 top-24 text-center font-serif text-lg text-ink-soft">
                  Nothing scheduled in this stretch. Try the arrows.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
