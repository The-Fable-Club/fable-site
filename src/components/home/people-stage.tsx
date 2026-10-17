"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import {
  Award,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { ArrowBtn, Hud, Ph } from "@/components/hud";
import { cn } from "@/lib/utils";

const FLOW = [0.65, 0, 0.35, 1] as const;

// Round "portraits" on the left are the member categories (portfolios).
const ICONS: Record<string, LucideIcon> = {
  Chairperson: Crown,
  "Vice-Chairperson": Award,
  Secretary: PenLine,
  "Co-Secretary": MessageSquare,
  Technical: Code,
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
  { label: "Technical", roles: ["Technical"], icon: Code },
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

// Endfield "Operators"-style stage:
//  - left: a strip of round portraits, one per category (portfolio)
//  - behind: a unique backdrop per category, which slides across on change
//  - right: that category's people as overlapping cards you can click, drag
//    or step through; the text on the left updates with the front card
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

  if (!cats.length) return null;
  const cat = cats[c];
  const n = cat.people.length;
  const person = cat.people[p];
  const bd = backdropFor(cat.backdrop);

  const goCat = (i: number) => {
    const next = (i + cats.length) % cats.length;
    if (next === c) return;
    setDir(next > c ? 1 : -1);
    setC(next);
    setP(0);
  };
  const goPerson = (d: number) => setP((v) => (v + d + n) % n);

  return (
    <div
      tabIndex={0}
      role="group"
      aria-label="Members by category"
      onKeyDown={(e) => {
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
      <div className="relative min-h-[46rem] overflow-hidden md:min-h-[44rem]">
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
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-[62%] transition-[background] duration-700"
          style={{ background: `linear-gradient(90deg, ${bd.bg}F2 0%, ${bd.bg}CC 45%, ${bd.bg}00 100%)` }}
        />
        <div className="relative z-10 grid h-full gap-6 p-6 md:grid-cols-[minmax(0,29rem)_1fr] md:gap-10 md:p-12">
          {/* text */}
          <div className={cn("flex flex-col transition-colors duration-700 ease-flow", bd.dark ? "text-paper" : "text-ink")}>
            <div className="flex items-center gap-4">
              <span className="hud tracking-wider">[ {person.role} ]</span>
              {n > 1 && (
                <span className="hud opacity-70">
                  {p + 1} / {n}
                </span>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={person.slug} variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.25 } }}>
                <div className="mt-6 overflow-hidden pb-1">
                  <motion.h3 variants={mask} className="font-display text-[clamp(2.25rem,1.5rem+2.6vw,3.9rem)] leading-[1] [overflow-wrap:anywhere]">
                    {person.name}
                  </motion.h3>
                </div>
                <motion.div
                  variants={rise}
                  aria-hidden
                  className="mt-4 h-[3px] w-full max-w-sm"
                  style={{ background: "linear-gradient(90deg,#d97757 0 33%,#6a9bcc 33% 66%,#788c5d 66%)" }}
                />
                <motion.div variants={rise} className="mt-5 flex flex-wrap gap-2">
                  {[person.department, person.year, ...person.focus].filter(Boolean).map((t) => (
                    <span
                      key={t}
                      className={cn("px-2.5 py-1 text-sm", bd.dark ? "bg-paper/15" : "bg-ink/10")}
                    >
                      {t}
                    </span>
                  ))}
                </motion.div>
                <motion.p variants={rise} className="mt-5 max-w-[46ch] font-serif text-lg leading-relaxed opacity-90">
                  {person.bio}
                </motion.p>
                <motion.a
                  variants={rise}
                  href={`mailto:${person.email}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                >
                  <Mail className="size-4" aria-hidden />
                  {person.email}
                </motion.a>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-auto">
              {n > 1 && (
                <div className="flex gap-2">
                  <ArrowBtn tone={bd.dark ? "paper" : "ink"} onClick={() => goPerson(-1)} aria-label="Previous person">
                    <ChevronLeft className="size-5" aria-hidden />
                  </ArrowBtn>
                  <ArrowBtn tone={bd.dark ? "paper" : "ink"} onClick={() => goPerson(1)} aria-label="Next person">
                    <ChevronRight className="size-5" aria-hidden />
                  </ArrowBtn>
                </div>
              )}
              <Link
                href={`/members?m=${person.slug}`}
                className={cn(
                  "inline-flex h-11 items-center px-5 text-sm font-medium transition-colors duration-500 ease-flow",
                  bd.dark ? "bg-paper text-ink hover:bg-clay" : "bg-ink text-paper hover:bg-clay-deep",
                )}
              >
                Full profile
              </Link>
              <Ph className={bd.dark ? "border-clay text-clay" : undefined}>Placeholder card</Ph>
            </div>
          </div>

          {/* overlapping cards */}
          <div className="relative mx-auto mt-2 h-[27rem] w-[19rem] self-center md:mx-0 md:justify-self-center">
            {cat.people.map((m, i) => {
              const order = (i - p + n) % n; // 0 = front card
              return (
                <motion.div
                  key={m.slug}
                  role={order > 0 ? "button" : undefined}
                  aria-label={order > 0 ? `Bring ${m.name} to the front` : undefined}
                  onClick={() => order > 0 && setP(i)}
                  drag={order === 0 && n > 1 ? "x" : false}
                  dragSnapToOrigin
                  dragElastic={0.35}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -50) goPerson(1);
                    else if (info.offset.x > 50) goPerson(-1);
                  }}
                  animate={{
                    x: order * 72,
                    y: order * -16,
                    rotate: order * 5,
                    scale: 1 - order * 0.06,
                    opacity: order > 2 ? 0 : 1,
                  }}
                  initial={false}
                  transition={{ duration: 0.85, ease: FLOW }}
                  style={{ zIndex: n - order }}
                  className={cn("absolute inset-0 touch-pan-y", order > 0 ? "cursor-pointer" : n > 1 ? "cursor-grab active:cursor-grabbing" : "")}
                >
                  <PersonCard member={m} front={order === 0} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Generic person card: silhouette placeholder until real photos arrive. */
function PersonCard({ member: m, front }: { member: Member; front: boolean }) {
  return (
    <div className="relative size-full overflow-hidden border-2 border-ink bg-paper shadow-[10px_10px_0_0_rgb(20_20_19/0.9)]">
      <div className="relative h-[78%] bg-[linear-gradient(160deg,#ebdbbc,#d4a27f)]">
        {m.photo ? (
          <Image src={m.photo} alt="" fill sizes="304px" className="object-cover" />
        ) : (
          <svg viewBox="0 0 200 240" aria-hidden className="absolute inset-0 size-full">
            <circle cx="100" cy="92" r="42" fill="#faf9f5" fillOpacity="0.9" />
            <path d="M20 240c0-56 36-92 80-92s80 36 80 92Z" fill="#faf9f5" fillOpacity="0.9" />
            <circle cx="100" cy="92" r="42" fill="none" stroke="#141413" strokeWidth="3" />
            <path d="M20 240c0-56 36-92 80-92s80 36 80 92" fill="none" stroke="#141413" strokeWidth="3" />
          </svg>
        )}
        <span className="absolute left-0 top-0 grid size-11 place-items-center bg-ink font-display text-lg text-paper">
          {initials(m.name)}
        </span>
      </div>
      <div className="flex h-[22%] flex-col justify-center border-t-2 border-ink px-4">
        <p className={cn("truncate font-display text-xl leading-tight", !front && "opacity-80")}>{m.name}</p>
        <Hud className="text-ink-faint">{m.role}</Hud>
      </div>
    </div>
  );
}
