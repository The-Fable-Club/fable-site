"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from "motion/react";
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
  PenLine,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { initials, type Member } from "@/lib/members";
import { FramedPhoto } from "@/components/framed-photo";
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
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.35 });
  const reduce = useReducedMotion();

  const total = cats.length;
  const n = cats[c]?.people.length ?? 0;
  const auto = !reduce && !held && inView && total > 0;

  const goCat = (i: number) => {
    const next = (i + total) % total;
    if (next === c) return;
    setDir(next > c ? 1 : -1);
    setC(next);
    setP(0);
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
    }, DWELL);
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
            <Ph className={bd.dark ? "border-clay text-clay" : undefined}>Placeholder bios</Ph>
          </div>

          {/* the people, side by side. No initial={false} here: it would also stop the frame
              drawings and the timer, which mount inside, from animating */}
          <AnimatePresence mode="wait">
            <motion.ul
              key={cat.label}
              variants={stagger}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}
              onPointerLeave={() => setHeld(false)}
              className={cn("grid max-w-5xl items-stretch gap-6 md:gap-8", n > 1 && "sm:grid-cols-2")}
            >
              {cat.people.map((m, i) => (
                <motion.li
                  key={m.slug}
                  variants={rise}
                  className="min-w-0"
                  onPointerEnter={() => {
                    setP(i);
                    setHeld(true);
                  }}
                  onFocus={() => {
                    setP(i);
                    setHeld(true);
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
                  }}
                >
                  {/* nothing is lit until the stage is on screen, so the frames draw when you get there */}
                  <PersonCard member={m} index={i} active={inView && i === p} timing={auto && i === p} />
                </motion.li>
              ))}
            </motion.ul>
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
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function DrawnFrame({ role, active, w, h }: { role: string; active: boolean; w: number; h: number }) {
  const reduce = useReducedMotion();
  if (!w || !h) return null;
  const { main, extra } = framePaths(w, h, MOTIFS[MOTIF_FOR[role] ?? "sprout"]);
  const draw = active && !reduce;
  const common = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox={`0 0 ${w} ${h}`}>
      <motion.path
        key={`m-${draw}`}
        d={main}
        {...common}
        strokeWidth={2}
        className={active ? "stroke-clay-deep" : "stroke-ink"}
        // keyframes (not `initial`), so the draw still runs inside an AnimatePresence with initial={false}
        animate={{ pathLength: draw ? [0, 1] : 1, opacity: active ? 1 : 0.28 }}
        transition={{ pathLength: { duration: 2.2, ease: [0.45, 0, 0.25, 1] }, opacity: { duration: 0.9, ease: "easeOut" } }}
      />
      {extra && (
        <motion.path
          key={`e-${draw}`}
          d={extra}
          {...common}
          strokeWidth={1.75}
          className={active ? "stroke-clay-deep" : "stroke-ink"}
          animate={{ pathLength: draw ? [0, 1] : 1, opacity: draw ? [0, 1] : active ? 1 : 0.28 }}
          transition={{ pathLength: { duration: 0.9, delay: draw ? 0.9 : 0, ease: "easeOut" }, opacity: { duration: 0.5, delay: draw ? 0.9 : 0 } }}
        />
      )}
    </svg>
  );
}

// Easing for things that answer the pointer: quick to start, long soft landing.
const SOFT = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/** One person: a white card with a black border, and the whole card opens the full
 * profile. The photo is kept near its real
 * size, since the originals are small, inside its own hand-drawn frame; a second line draws
 * the panel's frame with the role's motif. The lit card lifts, its tab turns black and the
 * timer runs along the bottom. */
function PersonCard({ member: m, index, active, timing }: { member: Member; index: number; active: boolean; timing: boolean }) {
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
        <DrawnFrame role={m.role} active={active} w={size.w} h={size.h} />
        {m.photo ? (
          <FramedPhoto
            slug={m.slug}
            src={m.photo}
            active={active}
            className={cn("absolute right-6 top-1/2 size-44 -translate-y-1/2 sm:right-[9%] sm:size-56", active ? "scale-100" : "scale-95")}
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
