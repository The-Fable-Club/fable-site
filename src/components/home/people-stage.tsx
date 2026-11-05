"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { animate, AnimatePresence, motion, useInView, useMotionValue, useTransform, type MotionValue, type Variants } from "motion/react";
import {
  ArrowRight,
  Award,
  Bot,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Code,
  Crown,
  Mail,
  Megaphone,
  MessageSquare,
  Monitor,
  Pause,
  PenLine,
  Play,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { initials, type Member } from "@/lib/members";
import { alongEdge, FramedPhoto, PF, photoFrameFor, type Pt } from "@/components/framed-photo";
import { backdropFor, BackdropSvg } from "@/components/home/people-backdrops";
import { ArrowBtn, Ph } from "@/components/hud";
import { cn } from "@/lib/utils";

const FLOW = [0.65, 0, 0.35, 1] as const;

// Round "portraits" on the left are the member categories (portfolios).
const ICONS: Record<string, LucideIcon> = {
  Chairperson: Crown,
  "Vice-Chairperson": Award,
  Secretary: PenLine,
  "Co-Secretary": MessageSquare,
  Projects: Code,
  "Web Development": Monitor,
  "Agentic AI": Bot,
  Operations: ClipboardList,
  Finance: Wallet,
  "Creative & Communications": Megaphone,
};

type Category = { label: string; icon: LucideIcon; backdrop: string; people: Member[] };

// How roles are grouped into the round portraits, in display order. The
// office bearers are merged into two circles; everything after that follows
// the order the club asked for. Roles not listed here still appear, after
// these, in the order they first show up.
const GROUPS: { label: string; roles: string[]; icon: LucideIcon; backdrop?: string }[] = [
  { label: "Chairperson & Vice-Chairperson", roles: ["Chairperson", "Vice-Chairperson"], icon: Crown, backdrop: "Chairperson" },
  { label: "Secretary & Co-Secretary", roles: ["Secretary", "Co-Secretary"], icon: PenLine, backdrop: "Secretary" },
  { label: "Web Development", roles: ["Web Development"], icon: Monitor },
  { label: "Agentic AI", roles: ["Agentic AI"], icon: Bot },
  { label: "Projects", roles: ["Projects"], icon: Code },
];

const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: FLOW } },
};
const mask: Variants = {
  hidden: { y: "105%" },
  show: { y: 0, transition: { duration: 0.8, ease: FLOW } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

/** How long each card stays highlighted before the next one takes over. */
const DWELL = 4500;
/** The last card of a team stays longer, so its frame finishes and there is time to read it. */
const DWELL_LAST = 9000;

// Endfield "Operators"-style stage, re-cut for small photos:
//  - left: a strip of round portraits, one per category (portfolio)
//  - behind: a unique backdrop per category, which slides across on change
//  - right: that category's people side by side, each on a white card with its
//    snapshot (shown near its real size), details and bio. One card is lit at a
//    time, left first; a timer moves to the next card, then the next category.
//    Hovering or focusing a card lights it and holds the timer.
export function PeopleStage({ people }: { people: Member[] }) {
  const cats = useMemo<Category[]>(() => {
    const sorted = [...people].sort((a, b) => a.order - b.order);
    const used = new Set<string>();
    const out: Category[] = [];
    for (const g of GROUPS) {
      // within a group, roles keep the listed order (Chairperson before Vice-Chairperson)
      const ppl = g.roles.flatMap((r) => sorted.filter((m) => m.role === r));
      if (!ppl.length) continue;
      g.roles.forEach((r) => used.add(r));
      out.push({ label: g.label, icon: g.icon, backdrop: g.backdrop ?? g.label, people: ppl });
    }
    // everything else (Operations, Finance, ...) in first-appearance order
    const rest: string[] = [];
    sorted.forEach((m) => {
      if (!used.has(m.role) && !rest.includes(m.role)) rest.push(m.role);
    });
    rest.forEach((r) =>
      out.push({ label: r, icon: ICONS[r] ?? User, backdrop: r, people: sorted.filter((m) => m.role === r) }),
    );
    return out;
  }, [people]);

  const [c, setC] = useState(0);
  const [p, setP] = useState(0);
  const [dir, setDir] = useState(1);
  const [held, setHeld] = useState(false); // pointer or focus is on a card
  const [paused, setPaused] = useState(false); // the pause button
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.3 });

  const total = cats.length;
  const n = cats[c]?.people.length ?? 0;
  // Runs with reduced motion too: it swaps content rather than moving things about, and the
  // pause button (plus hover and focus) stops it, so the rotation is always under the reader's control.
  const auto = !paused && !held && inView && total > 0;

  const goCat = (i: number) => {
    const next = (i + total) % total;
    if (next === c) return;
    setDir(next > c ? 1 : -1);
    setC(next);
    setP(0);
    setHeld(false); // the hovered card is gone; don't stay stuck on hold
  };

  // the timer: next card, then the first card of the next category
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => {
      if (p + 1 < n) setP(p + 1);
      else if (total > 1) {
        setDir(1);
        setC((c + 1) % total);
        setP(0);
      } else setP(0);
    }, p + 1 < n ? DWELL : DWELL_LAST);
    return () => clearTimeout(t);
  }, [auto, p, c, n, total]);

  if (!total) return null;
  const cat = cats[c];
  const bd = backdropFor(cat.backdrop);
  const goPerson = (d: number) => setP((v) => (v + d + n) % n);

  return (
    <div
      ref={root}
      tabIndex={0}
      role="group"
      aria-label="Members by category"
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          goCat(c + 1);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          goCat(c - 1);
        }
        if (e.key === "ArrowRight") goPerson(1);
        if (e.key === "ArrowLeft") goPerson(-1);
      }}
      onPointerLeave={() => setHeld(false)}
      className="relative grid overflow-hidden border-y border-ink/20 bg-paper outline-offset-[-4px] md:grid-cols-[5.5rem_1fr]"
    >
      {/* category portraits */}
      <div className="relative z-20 flex items-center gap-3 overflow-x-auto bg-paper px-4 py-4 md:flex-col md:overflow-visible md:px-0 md:py-5">
        <ArrowBtn onClick={() => goCat(c - 1)} aria-label="Previous category" className="hidden size-9 md:grid">
          <ChevronUp className="size-4" aria-hidden />
        </ArrowBtn>
        {cats.map((k, i) => {
          const Icon = k.icon;
          const on = i === c;
          return (
            <button
              key={k.label}
              onClick={() => goCat(i)}
              aria-label={k.label}
              aria-pressed={on}
              className="group relative shrink-0"
            >
              {/* dotted halo, like the reference's active portrait */}
              <span
                aria-hidden
                className={cn(
                  "absolute -inset-1.5 rounded-full border-2 border-dotted border-clay-deep transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  on ? "scale-100 opacity-100" : "scale-90 opacity-0",
                )}
              />
              <span
                className={cn(
                  "relative grid size-12 place-items-center rounded-full border-2 transition-colors duration-500 ease-flow md:size-14",
                  on ? "border-clay bg-ink text-paper" : "border-ink/25 bg-paper text-ink group-hover:border-ink",
                )}
              >
                <Icon className="size-5" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="hud pointer-events-none absolute left-full top-1/2 z-30 ml-3 hidden -translate-y-1/2 whitespace-nowrap bg-ink px-2 py-1 text-paper opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block">
                {k.label}
              </span>
            </button>
          );
        })}
        <ArrowBtn onClick={() => goCat(c + 1)} aria-label="Next category" className="hidden size-9 md:grid">
          <ChevronDown className="size-4" aria-hidden />
        </ArrowBtn>
      </div>

      {/* stage */}
      <div className="relative overflow-hidden md:min-h-[44rem]">
        {/* backdrop slides between categories */}
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={cat.label}
            custom={dir}
            initial={{ x: dir * 90, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -90, opacity: 0 }}
            transition={{ duration: 0.9, ease: FLOW }}
            className="absolute inset-0"
          >
            <BackdropSvg role={cat.backdrop} />
          </motion.div>
        </AnimatePresence>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] transition-[background] duration-700"
          style={{ background: `linear-gradient(90deg, ${bd.bg}E6 0%, ${bd.bg}99 55%, ${bd.bg}33 100%)` }}
        />
        <div className="relative z-10 flex h-full flex-col gap-8 p-6 md:p-12">
          {/* category heading */}
          <div className={cn("flex flex-wrap items-end justify-between gap-4 transition-colors duration-700 ease-flow", bd.dark ? "text-paper" : "text-ink")}>
            <div>
              <div className="flex items-center gap-4">
                <span className="hud tracking-wider">[ Team ]</span>
                <span className="hud opacity-70">
                  {String(c + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={cat.label}
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  className="mt-3 overflow-hidden pb-1"
                >
                  <motion.h3 variants={mask} className="font-display text-[clamp(2rem,1.4rem+2vw,3.4rem)] leading-[1] [overflow-wrap:anywhere]">
                    {cat.label}
                  </motion.h3>
                </motion.div>
              </AnimatePresence>
              <div aria-hidden className="mt-4 h-[3px] w-40" style={{ background: "linear-gradient(90deg,#d97757 0 33%,#6a9bcc 33% 66%,#788c5d 66%)" }} />
            </div>
            <div className="flex items-center gap-3">
              <Ph className={bd.dark ? "border-clay text-clay" : undefined}>Placeholder bios</Ph>
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                aria-pressed={paused}
                aria-label={paused ? "Play the people slideshow" : "Pause the people slideshow"}
                className={cn(
                  "grid size-9 place-items-center border-2 transition-colors duration-500",
                  bd.dark ? "border-paper/60 text-paper hover:bg-paper hover:text-ink" : "border-ink/60 text-ink hover:bg-ink hover:text-paper",
                )}
              >
                {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
              </button>
            </div>
          </div>

          {/* the people, side by side. No initial={false} here: it would also stop the frame
              drawings and the timer, which mount inside, from animating */}
          <AnimatePresence mode="wait">
            <TeamRow
              key={cat.label}
              people={cat.people}
              lit={p}
              inView={inView}
              auto={auto}
              onLight={(i) => {
                setP(i);
                setHeld(true);
              }}
              onRelease={() => setHeld(false)}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ---- self-drawing frame ------------------------------------------------------------
// A line runs along the bottom of the photo panel, sketches a small motif for the role
// (crown, quill, </>, ...), then carries on round the frame. Motifs are drawn in a 72 x 50
// box on the baseline: they start at (0, 0) and end at (72, 0); negative y is up.
type Seg = (string | number)[];
type Motif = { main: Seg[]; extra?: Seg[] };
const MW = 72;

const star = (): Seg[] => {
  const pt = (k: number): [number, number] => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    return [36 + 22 * Math.cos(a), -26 + 22 * Math.sin(a)];
  };
  return [["L", 36, 0], ["L", ...pt(3)], ["L", ...pt(0)], ["L", ...pt(2)], ["L", ...pt(4)], ["L", ...pt(1)], ["L", ...pt(3)], ["L", 36, 0], ["L", MW, 0]];
};

const MOTIFS: Record<string, Motif> = {
  crown: { main: [["L", 8, 0], ["L", 8, -30], ["L", 22, -16], ["L", 36, -42], ["L", 50, -16], ["L", 64, -30], ["L", 64, 0], ["L", MW, 0]], extra: [["M", 20, -6], ["L", 52, -6]] },
  quill: { main: [["L", 10, 0], ["C", 16, -24, 34, -46, 62, -54], ["C", 56, -30, 42, -14, 22, -8], ["L", 30, -2], ["L", MW, 0]], extra: [["M", 24, -10], ["L", 50, -38]] },
  code: { main: [["L", 18, -12], ["L", 4, -26], ["L", 18, -40], ["L", 30, -8], ["L", 42, -44], ["L", 54, -40], ["L", 68, -26], ["L", 54, -12], ["L", MW, 0]] },
  robot: { main: [["L", 14, 0], ["L", 14, -30], ["L", 36, -30], ["L", 36, -44], ["L", 36, -30], ["L", 58, -30], ["L", 58, 0], ["L", MW, 0]], extra: [["M", 25, -18], ["L", 29, -18], ["M", 43, -18], ["L", 47, -18], ["M", 31, -46], ["L", 41, -46]] },
  cube: { main: [["L", 14, -12], ["L", 14, -36], ["L", 36, -48], ["L", 58, -36], ["L", 58, -12], ["L", 36, 0], ["L", MW, 0]], extra: [["M", 14, -36], ["L", 36, -24], ["L", 58, -36], ["M", 36, -24], ["L", 36, 0], ["M", 14, -12], ["L", 36, 0]] },
  clipboard: { main: [["L", 12, 0], ["L", 12, -44], ["L", 26, -44], ["L", 26, -50], ["L", 46, -50], ["L", 46, -44], ["L", 60, -44], ["L", 60, 0], ["L", MW, 0]], extra: [["M", 22, -24], ["L", 30, -16], ["L", 48, -34]] },
  coin: { main: [["L", 36, 0], ["A", 24, 24, 0, 0, 1, 36, -48], ["A", 24, 24, 0, 0, 1, 36, 0], ["L", MW, 0]], extra: [["M", 29, -34], ["L", 43, -34], ["M", 29, -28], ["L", 43, -28], ["M", 32, -34], ["C", 44, -34, 44, -21, 32, -21], ["L", 43, -12]] },
  star: { main: star() },
  sprout: { main: [["L", 36, 0], ["L", 36, -26], ["C", 36, -44, 18, -48, 8, -42], ["C", 14, -30, 28, -26, 36, -26], ["C", 44, -40, 60, -44, 66, -36], ["C", 58, -26, 46, -24, 36, -26], ["L", 36, 0], ["L", MW, 0]] },
};

const MOTIF_FOR: Record<string, keyof typeof MOTIFS> = {
  Chairperson: "crown",
  "Vice-Chairperson": "crown",
  Secretary: "quill",
  "Co-Secretary": "quill",
  "Web Development": "code",
  "Agentic AI": "robot",
  Projects: "cube",
  Operations: "clipboard",
  Finance: "coin",
  "Creative & Communications": "star",
};

/** Motif segments as absolute path commands, scaled by k, with their baseline start at (ox, oy). */
function place(segs: Seg[], ox: number, oy: number, k: number): string {
  return segs
    .map(([cmd, ...n]) => {
      const v = n as number[];
      if (cmd === "A") return `A${v[0] * k} ${v[1] * k} ${v[2]} ${v[3]} ${v[4]} ${(v[5] * k + ox).toFixed(1)} ${(v[6] * k + oy).toFixed(1)}`;
      return cmd + v.map((x, i) => (x * k + (i % 2 ? oy : ox)).toFixed(1)).join(" ");
    })
    .join(" ");
}

function framePaths(w: number, h: number, motif: Motif) {
  const i = 12; // inset from the panel edge
  const x0 = i + 22; // where the motif starts on the bottom edge
  const b = h - i;
  const k = w >= 400 ? 1.55 : 1.25; // bigger motif on wide cards
  const main = `M${i} ${b} L${x0} ${b} ${place(motif.main, x0, b, k)} L${w - i} ${b} L${w - i} ${i} L${i} ${i} L${i} ${b}`;
  const extra = motif.extra ? place(motif.extra, x0, b, k) : null;
  return { main, extra };
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // the padding box (not contentRect): the frame is drawn over the padding too, and a viewBox
    // smaller than the drawn area would scale the line, which breaks the dash-based drawing
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function DrawnFrame({ role, active, w, h, progress }: { role: string; active: boolean; w: number; h: number; progress: MotionValue<number> }) {
  // driven by the same forward-only progress as the photo's frame (see TeamRow), so it draws
  // alongside it and nothing (hovering out, the highlight moving on) can stop or restart it
  const main = useTransform(progress, [0, 0.85], [0, 1]);
  const extraLen = useTransform(progress, [0.7, 1], [0, 1]);
  const extraShow = useTransform(progress, [0.68, 0.7], [0, 1]);
  if (!w || !h) return null;
  const paths = framePaths(w, h, MOTIFS[MOTIF_FOR[role] ?? "sprout"]);
  const common = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full overflow-visible transition-opacity duration-[900ms]", !active && "opacity-30")}
      viewBox={`0 0 ${w} ${h}`}
    >
      <motion.path d={paths.main} {...common} strokeWidth={2} className={cn("transition-colors duration-700", active ? "stroke-clay-deep" : "stroke-ink")} style={{ pathLength: main }} />
      {paths.extra && (
        <motion.path
          d={paths.extra}
          {...common}
          strokeWidth={1.75}
          className={cn("transition-colors duration-700", active ? "stroke-clay-deep" : "stroke-ink")}
          style={{ pathLength: extraLen, opacity: extraShow }}
        />
      )}
    </svg>
  );
}

// Easing for things that answer the pointer: quick to start, long soft landing.
const SOFT = "ease-[cubic-bezier(0.22,1,0.36,1)]";

// ---- one team's cards, with one line running through all their frames ---------------
// The drawing is a single progress value for the whole team, from 0 to 2n-1: frame 0 is
// 0..1, the line across to the next person is 1..2, frame 1 is 2..3, and so on. It only ever
// moves forward, so nothing that has begun is stopped or drawn again. Left alone it runs at
// a slow, even pace (one frame, then the line across, then the next frame). Lighting a card
// whose turn hasn't come yet (hover, focus, the timer) runs quickly up to the start of its
// frame and carries on at the normal pace from there.
const FRAME_S = 3.2;
const BRIDGE_S = 1.4;
const CATCH_UP_S = 0.6;

function useStacked() {
  // the cards sit side by side from the sm breakpoint (sm:grid-cols-2)
  const [stacked, setStacked] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639.98px)");
    const on = () => setStacked(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return stacked;
}

/** Where each person's frame starts and ends: where the line comes in or goes out. Side by
 * side the line leaves the first photo on its right edge and enters the next on its left;
 * stacked, it runs down the right-hand margin, so both use the right edge. */
const startEdgeFor = (i: number, n: number, stacked: boolean) => (stacked || (i === 0 && n > 1) ? 1 : 3);

function Bridge({ d, prog, at }: { d: string; prog: MotionValue<number>; at: number }) {
  const pathLength = useTransform(prog, [at, at + 1], [0, 1]);
  const common = { d, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <>
      {/* a paper halo under the ink, so the line reads over the dark gap and the light cards alike */}
      <motion.path {...common} strokeWidth={7} className="stroke-paper" style={{ pathLength }} />
      <motion.path {...common} strokeWidth={2} className="stroke-ink" style={{ pathLength }} />
    </>
  );
}

// ---- the line from one person's frame to the next: a little drawing for each team ------
// Same convention as the doodles: start (0, 0), end (w, 0), negative y is "up" (to the left
// of the direction of travel). The line waves in, draws the motif, and waves out.
const dot = (x: number, y: number, r: number): Seg[] => [["M", x, y], ["A", r, r, 0, 0, 1, x, y - 2 * r], ["A", r, r, 0, 0, 1, x, y]];
const BRIDGE_MOTIFS: Record<string, { w: number; segs: Seg[] }> = {
  // a crown with jewels
  crown: { w: 90, segs: [["L", 8, 0], ["L", 14, -30], ["L", 28, -12], ["L", 45, -44], ["L", 62, -12], ["L", 76, -30], ["L", 82, 0], ["L", 90, 0], ...dot(45, -44, 3.5), ...dot(14, -30, 2.5), ...dot(76, -30, 2.5), ["M", 90, 0]] },
  // a run of joined-up loops, like a signature
  quill: { w: 80, segs: [0, 20, 40, 60].flatMap((x): Seg[] => [["C", x + 16, 0, x + 18, -24, x + 9, -24], ["C", x, -24, x + 2, 0, x + 20, 0]]) },
  // a circuit trace with a via
  code: { w: 80, segs: [["L", 0, -18], ["L", 22, -18], ["L", 22, 14], ["L", 44, 14], ["L", 44, -30], ["A", 4, 4, 0, 0, 1, 44, -38], ["A", 4, 4, 0, 0, 1, 44, -30], ["L", 66, -30], ["L", 66, 0], ["L", 80, 0]] },
  // a zigzag through little nodes, like a network
  robot: {
    w: 84,
    segs: ([[18, -24], [36, 12], [54, -28], [72, 8]] as Pt[])
      .flatMap(([x, y]): Seg[] => [["L", x, y], ["A", 3.5, 3.5, 0, 0, 1, x, y - 7], ["A", 3.5, 3.5, 0, 0, 1, x, y]])
      .concat([["L", 84, 0]]),
  },
  // a rocket taking off, with a porthole and a flame
  cube: { w: 64, segs: [["L", 18, 0], ["L", 24, -10], ["L", 24, -32], ["Q", 24, -44, 32, -52], ["Q", 40, -44, 40, -32], ["L", 40, -10], ["L", 46, 0], ["L", 64, 0], ...dot(32, -27, 3.5), ["M", 27, 0], ["L", 32, 11], ["L", 37, 0], ["M", 64, 0]] },
  // a conveyor of arrows
  clipboard: { w: 80, segs: [["L", 80, 0], ...[14, 34, 54].flatMap((x): Seg[] => [["M", x, -10], ["L", x + 10, 0], ["L", x, 10]]), ["M", 80, 0]] },
  // a chart going up, arrow at the top
  coin: { w: 80, segs: [["L", 12, -8], ["L", 22, 2], ["L", 36, -20], ["L", 46, -12], ["L", 62, -40], ["L", 53, -39], ["M", 62, -40], ["L", 61, -31], ["M", 62, -40], ["C", 70, -30, 74, -8, 80, 0]] },
  // a spiral, then a sparkle
  star: { w: 80, segs: [["C", 0, -20, 24, -28, 28, -12], ["C", 30, -2, 16, 0, 16, -10], ["C", 16, -16, 24, -16, 22, -10], ["C", 20, -4, 30, 0, 40, 0], ["L", 56, 0], ["L", 60, -6], ["Q", 61, -14, 70, -16], ["Q", 61, -18, 60, -28], ["Q", 59, -18, 50, -16], ["Q", 59, -14, 60, -6], ["L", 64, 0], ["L", 80, 0]] },
  // two hearts, for anyone else
  sprout: {
    w: 72,
    segs: [0, 36]
      .flatMap((x): Seg[] => [["L", x + 18, 0], ["C", x + 8, -8, x + 2, -16, x + 5, -24], ["C", x + 8, -31, x + 17, -31, x + 18, -24], ["C", x + 19, -31, x + 28, -31, x + 31, -24], ["C", x + 34, -16, x + 28, -8, x + 18, 0]])
      .concat([["L", 72, 0]]),
  },
};

/** Scale and shift motif segments along the baseline. */
const shift = (segs: Seg[], dx: number, k: number): Seg[] =>
  segs.map(([cmd, ...raw]) => {
    const v = raw as number[];
    if (cmd === "A") return ["A", v[0] * k, v[1] * k, v[2], v[3], v[4], v[5] * k + dx, v[6] * k];
    return [cmd, ...v.map((n, i) => (i % 2 ? n * k : n * k + dx))];
  });

function bridgePath(A: Pt, B: Pt, motif: string): string {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  if (L < 1) return "";
  const t: Pt = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
  const n: Pt = [t[1], -t[0]];
  const m = BRIDGE_MOTIFS[motif] ?? BRIDGE_MOTIFS.sprout;
  const k = Math.max(0.5, Math.min(1.25, (L - 70) / m.w));
  const x0 = (L - m.w * k) / 2;
  const x1 = x0 + m.w * k;
  const segs: Seg[] = [["C", x0 * 0.35, -26, x0 * 0.65, 22, x0, 0], ...shift(m.segs, x0, k), ["C", x1 + (L - x1) * 0.35, 22, x1 + (L - x1) * 0.65, -26, L, 0]];
  return `M${A[0].toFixed(1)} ${A[1].toFixed(1)} ` + alongEdge(segs, A, t, n, 1);
}

function TeamRow({
  people,
  lit,
  inView,
  auto,
  onLight,
  onRelease,
}: {
  people: Member[];
  lit: number;
  inView: boolean;
  auto: boolean;
  onLight: (i: number) => void;
  onRelease: () => void;
}) {
  const n = people.length;
  const end = Math.max(1, 2 * n - 1);
  const prog = useMotionValue(0);
  const stacked = useStacked();
  const box = useRef<HTMLDivElement>(null);
  const svgs = useRef<(SVGSVGElement | null)[]>([]);
  const [bridges, setBridges] = useState<string[]>([]);

  // the sequencer: restarts its loop whenever the lit card changes, but never moves backwards
  useEffect(() => {
    if (!inView) return;
    let alive = true;
    let ctl: { stop: () => void } | undefined;
    const go = async () => {
      const target = Math.min(2 * lit, end);
      if (prog.get() < target) {
        const a = animate(prog, target, { duration: CATCH_UP_S, ease: "easeIn" });
        ctl = a;
        await a;
      }
      while (alive && prog.get() < end - 1e-4) {
        const v = prog.get();
        const seg = Math.floor(v + 1e-4);
        const a = animate(prog, Math.min(seg + 1, end), { duration: (seg % 2 ? BRIDGE_S : FRAME_S) * (seg + 1 - v), ease: "linear" });
        ctl = a;
        await a;
      }
    };
    void go();
    return () => {
      alive = false;
      ctl?.stop();
    };
  }, [inView, lit, end, prog]);

  // the joining lines, in this box's coordinates, from each frame's start point to the next
  const anchors = useMemo(() => people.map((m, i) => photoFrameFor(m.slug, startEdgeFor(i, n, stacked)).start), [people, n, stacked]);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const b = el.getBoundingClientRect();
      const at = (i: number) => {
        const s = svgs.current[i];
        if (!s) return null;
        const r = s.getBoundingClientRect();
        return { x: r.left - b.left + (anchors[i][0] / PF) * r.width, y: r.top - b.top + (anchors[i][1] / PF) * r.height, card: s.closest("article")?.getBoundingClientRect() };
      };
      const out: string[] = [];
      for (let i = 0; i < n - 1; i++) {
        const A = at(i);
        const B = at(i + 1);
        if (!A || !B) continue;
        if (stacked) {
          // out to the right-hand margin, down it, and back in
          const gx = Math.max(A.card ? A.card.right - b.left : A.x, B.card ? B.card.right - b.left : B.x) + 16;
          out.push(`M${A.x} ${A.y} C${gx - 8} ${A.y} ${gx} ${A.y + 18} ${gx} ${A.y + 60} L${gx} ${B.y - 60} C${gx} ${B.y - 18} ${gx - 8} ${B.y} ${B.x} ${B.y}`);
        } else {
          // across the gap, sketching the team's motif on the way (bridgePath)
          out.push(bridgePath([A.x, A.y], [B.x, B.y], MOTIF_FOR[people[0]?.role ?? ""] ?? "sprout"));
        }
      }
      setBridges(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // again once the lit card has finished lifting (it moves 8px)
    const t = setTimeout(measure, 1000);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [anchors, n, stacked, lit, people]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}
      onPointerLeave={onRelease}
      ref={box}
      className="relative max-w-5xl"
    >
      <ul className={cn("grid items-stretch gap-6 md:gap-8", n > 1 && "sm:grid-cols-2")}>
        {people.map((m, i) => (
          <motion.li
            key={m.slug}
            variants={rise}
            className="min-w-0"
            onPointerEnter={() => onLight(i)}
            onFocus={() => onLight(i)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onRelease();
            }}
          >
            {/* nothing is lit until the stage is on screen, so the frames draw when you get there */}
            <PersonCard
              member={m}
              index={i}
              active={inView && i === lit}
              timing={auto && i === lit}
              prog={prog}
              startEdge={startEdgeFor(i, n, stacked)}
              svgRef={(s) => {
                svgs.current[i] = s;
              }}
            />
          </motion.li>
        ))}
      </ul>
      {bridges.length > 0 && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 size-full overflow-visible">
          {bridges.map((d, i) => (
            <Bridge key={i} d={d} prog={prog} at={2 * i + 1} />
          ))}
        </svg>
      )}
    </motion.div>
  );
}

/** One person: a white card with a black border, and the whole card opens the full
 * profile. The photo is kept near its real
 * size, since the originals are small, inside its own hand-drawn frame; a second line draws
 * the panel's frame with the role's motif. The lit card lifts, its tab turns black and the
 * timer runs along the bottom. */
function PersonCard({
  member: m,
  index,
  active,
  timing,
  prog,
  startEdge,
  svgRef,
}: {
  member: Member;
  index: number;
  active: boolean;
  timing: boolean;
  prog: MotionValue<number>;
  startEdge: number;
  svgRef: Ref<SVGSVGElement>;
}) {
  // this person's share of the team's drawing (see TeamRow)
  const frame = useTransform(prog, [2 * index, 2 * index + 1], [0, 1]);
  const tags = [m.department, m.year, ...m.focus].filter(Boolean);
  const [panel, size] = useSize<HTMLDivElement>();
  return (
    <article
      className={cn(
        "relative flex h-full flex-col border-2 border-ink bg-paper text-ink transition-[translate,box-shadow] duration-[900ms]",
        SOFT,
        active ? "-translate-y-2 shadow-[10px_10px_0_0_#d97757]" : "translate-y-0 shadow-[6px_6px_0_0_rgb(20_20_19/0.85)]",
      )}
    >
      {/* tab: number and role */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b-2 border-ink px-4 py-2 transition-colors duration-700",
          SOFT,
          active ? "bg-ink text-paper" : "bg-paper text-ink",
        )}
      >
        <span className="hud">{String(index + 1).padStart(2, "0")}</span>
        <span className="hud truncate">{m.role}</span>
      </div>

      {/* photo panel: faint grid, the role motif along the bottom, the framed photo */}
      <div
        ref={panel}
        className="relative h-64 border-b-2 border-ink bg-paper-raised bg-[linear-gradient(rgb(20_20_19/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(20_20_19/0.06)_1px,transparent_1px)] bg-[size:24px_24px] sm:h-72"
      >
        <DrawnFrame role={m.role} active={active} w={size.w} h={size.h} progress={frame} />
        {m.photo ? (
          // 1.2x the old photo, in the old-sized panel: the frame and doodles leak past it. Centred
          // with inset + auto margins, not a transform, so the line's blend still sees the card.
          <FramedPhoto
            slug={m.slug}
            src={m.photo}
            active={active}
            blend
            progress={frame}
            startEdge={startEdge}
            svgRef={svgRef}
            sizes="270px"
            className="absolute inset-y-0 right-6 my-auto size-[13.2rem] sm:right-[8%] sm:size-[16.8rem]"
          />
        ) : (
          <>
            <svg viewBox="0 0 200 240" aria-hidden className="absolute bottom-0 right-[10%] h-48">
              <circle cx="100" cy="92" r="42" fill="#faf9f5" />
              <path d="M20 240c0-56 36-92 80-92s80 36 80 92Z" fill="#faf9f5" />
              <circle cx="100" cy="92" r="42" fill="none" stroke="#141413" strokeWidth="3" />
              <path d="M20 240c0-56 36-92 80-92s80 36 80 92" fill="none" stroke="#141413" strokeWidth="3" />
            </svg>
            <span aria-hidden className="absolute left-0 top-0 grid size-11 place-items-center bg-ink font-display text-lg text-paper">
              {initials(m.name)}
            </span>
          </>
        )}
      </div>

      {/* details and bio */}
      <div className={cn("flex flex-1 flex-col p-5 transition-opacity duration-700", SOFT, !active && "opacity-60")}>
        <h4 className="font-display text-2xl leading-tight md:text-[1.7rem]">{m.name}</h4>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="bg-paper-field px-2 py-0.5 text-xs text-ink-soft">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="mt-4 line-clamp-5 font-serif leading-relaxed text-ink-soft">{m.bio}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5 text-sm">
          {/* sits above the card-wide link, so the address still opens mail */}
          <a href={`mailto:${m.email}`} className="relative z-20 inline-flex min-w-0 items-center gap-2 hover:text-clay-deep">
            <Mail className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{m.email}</span>
          </a>
          {/* the whole card is this link (its ::after covers the card) */}
          <Link
            href={`/members?m=${m.slug}`}
            className="group/l inline-flex items-center gap-1.5 font-medium outline-none after:absolute after:inset-0 after:z-[5] after:content-[''] hover:text-clay-deep focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-clay-deep"
          >
            Full profile<span className="sr-only">: {m.name}</span>
            <ArrowRight className={cn("size-4 transition-[translate] duration-700", SOFT, active && "translate-x-1")} aria-hidden />
          </Link>
        </div>
      </div>

      {/* timer */}
      <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-1 overflow-hidden">
        {active && (
          <motion.span
            key={String(timing)}
            className="block h-full origin-left bg-clay-deep"
            initial={{ scaleX: timing ? 0 : 1 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: timing ? DWELL / 1000 : 0, ease: "linear" }}
          />
        )}
      </span>
    </article>
  );
}
