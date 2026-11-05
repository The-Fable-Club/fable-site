"use client";

import Image from "next/image";
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
const DWELL = 6500;

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
                  "absolute -inset-1.5 rounded-full border-2 border-dotted border-clay-deep transition-[opacity,transform] duration-500 ease-flow",
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

          {/* the people, side by side */}
          <AnimatePresence mode="wait" initial={false}>
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
                  <PersonCard member={m} index={i} active={i === p} timing={auto && i === p} />
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/** One person: a white card with a black border. The snapshot (a tilted photo, cut out
 * onto transparency) is kept near its real size, since the originals are small; without a
 * photo, a silhouette. The lit card lifts, its tab turns black and the timer runs along
 * the bottom. */
function PersonCard({ member: m, index, active, timing }: { member: Member; index: number; active: boolean; timing: boolean }) {
  const tags = [m.department, m.year, ...m.focus].filter(Boolean);
  return (
    <article
      className={cn(
        "relative flex h-full flex-col border-2 border-ink bg-paper text-ink transition-[transform,box-shadow,opacity] duration-700 ease-flow",
        active ? "-translate-y-2 shadow-[10px_10px_0_0_#d97757]" : "shadow-[6px_6px_0_0_rgb(20_20_19/0.85)]",
      )}
    >
      {/* tab: number and role */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b-2 border-ink px-4 py-2 transition-colors duration-700 ease-flow",
          active ? "bg-ink text-paper" : "bg-paper text-ink",
        )}
      >
        <span className="hud">{String(index + 1).padStart(2, "0")}</span>
        <span className="hud truncate">{m.role}</span>
      </div>

      {/* snapshot on a faint grid */}
      <div className="relative grid h-60 place-items-center overflow-hidden border-b-2 border-ink bg-paper-raised bg-[linear-gradient(rgb(20_20_19/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(20_20_19/0.06)_1px,transparent_1px)] bg-[size:24px_24px]">
        {m.photo ? (
          <div
            className={cn(
              "relative size-52 transition-[transform,filter] duration-700 ease-flow",
              active ? "scale-105 grayscale-0" : "scale-95 grayscale-[0.6]",
            )}
          >
            <Image src={m.photo} alt="" fill sizes="208px" className="object-contain drop-shadow-[5px_7px_0_rgb(20_20_19/0.3)]" />
          </div>
        ) : (
          <>
            <svg viewBox="0 0 200 240" aria-hidden className="h-52">
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
      <div className={cn("flex flex-1 flex-col p-5 transition-opacity duration-700 ease-flow", !active && "opacity-60")}>
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
          <a href={`mailto:${m.email}`} className="inline-flex min-w-0 items-center gap-2 hover:text-clay-deep">
            <Mail className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{m.email}</span>
          </a>
          <Link href={`/members?m=${m.slug}`} className="group/l inline-flex items-center gap-1.5 font-medium hover:text-clay-deep">
            Full profile
            <ArrowRight className="size-4 transition-transform duration-500 ease-flow group-hover/l:translate-x-1" aria-hidden />
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
