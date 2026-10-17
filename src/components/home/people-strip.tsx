"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useReducedMotion } from "@/lib/motion";
import { ArrowUpRight, Mail } from "lucide-react";
import { initials, type Member } from "@/lib/members";
import { Hud } from "@/components/hud";
import { cn } from "@/lib/utils";

const FLOW = [0.65, 0, 0.35, 1] as const;

const query = "(min-width: 768px)";
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useDesktop = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => true,
  );

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: FLOW } },
};
// text that slides up out of a mask
const mask: Variants = {
  hidden: { y: "108%" },
  show: { y: 0, transition: { duration: 0.9, ease: FLOW } },
};

// Expanding panels: the active panel grows while the rest compress into
// labelled slats. The width change is a slow ease-in-out, a short hover
// delay stops it thrashing when the pointer sweeps across several tabs, and
// once a panel is open its colour block fills, an accent bar rises along
// the edge and the content builds in piece by piece.
// Below the md breakpoint every panel is shown open, stacked.
export function PeopleStrip({ people }: { people: Member[] }) {
  const [active, setActive] = useState(Math.min(2, people.length - 1));
  const desktop = useDesktop();
  const reduce = useReducedMotion();
  const intent = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const choose = (i: number, delay = 140) => {
    clearTimeout(intent.current);
    intent.current = setTimeout(() => setActive(i), delay);
  };

  return (
    <div
      className="grid gap-px border-y border-ink/20 bg-ink/20 md:h-[30rem] md:[grid-template-columns:var(--cols)] md:transition-[grid-template-columns] md:duration-[1100ms] md:ease-flow"
      style={
        {
          "--cols": people.map((_, i) => (i === active ? "3.4fr" : "1fr")).join(" "),
        } as React.CSSProperties
      }
      onMouseLeave={() => clearTimeout(intent.current)}
    >
      {people.map((m, i) => {
        const open = i === active;
        const showContent = open || !desktop;
        return (
          <Link
            key={m.slug}
            href={`/members?m=${m.slug}`}
            onMouseEnter={() => choose(i)}
            onFocus={() => choose(i, 0)}
            aria-label={`${m.name}, ${m.role}`}
            className={cn(
              "group relative flex min-h-48 flex-col justify-between overflow-hidden p-5 transition-colors duration-[900ms] ease-flow [contain:layout_paint_style]",
              open ? "bg-paper" : "bg-paper-raised hover:bg-paper-sunken",
            )}
          >
            {/* accent bar rising along the left edge */}
            <motion.span
              aria-hidden
              className="absolute inset-y-0 left-0 hidden w-1 origin-bottom bg-clay md:block"
              initial={false}
              animate={{ scaleY: open ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 1, ease: FLOW }}
            />

            <div className="flex items-start justify-between gap-3">
              <motion.span
                className="grid size-12 shrink-0 place-items-center font-display text-xl"
                initial={false}
                animate={{
                  backgroundColor: open ? "#d97757" : "#141413",
                  color: open ? "#141413" : "#faf9f5",
                  rotate: open && desktop && !reduce ? [0, -8, 0] : 0,
                  scale: open && desktop && !reduce ? [1, 1.14, 1] : 1,
                }}
                transition={{ duration: 0.9, ease: FLOW }}
              >
                {initials(m.name)}
              </motion.span>
              <ArrowUpRight
                aria-hidden
                className={cn(
                  "size-5 transition-all duration-700 ease-flow",
                  open ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 md:opacity-30",
                )}
              />
            </div>

            {/* collapsed slat label (desktop) */}
            <span
              aria-hidden
              className={cn(
                "absolute bottom-5 left-5 hidden font-display text-2xl leading-none transition-all duration-700 ease-flow md:block",
                "[writing-mode:vertical-rl] rotate-180",
                open ? "translate-y-3 opacity-0" : "opacity-100 delay-300",
              )}
            >
              {m.name}
            </span>

            <AnimatePresence initial={false}>
              {showContent && (
                <motion.div
                  key="detail"
                  variants={stagger}
                  initial={desktop && !reduce ? "hidden" : false}
                  animate="show"
                  exit={{ opacity: 0, transition: { duration: 0.35, ease: FLOW } }}
                  className="md:absolute md:inset-x-5 md:bottom-5"
                >
                  {desktop && (
                    <motion.div
                      className="absolute -top-32 right-0 hidden md:block"
                      variants={{
                        hidden: { opacity: 0, scale: 0.55, rotate: -14, x: 36 },
                        show: {
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                          x: 0,
                          transition: { type: "spring", stiffness: 90, damping: 15, delay: 0.5 },
                        },
                      }}
                    >
                      {m.photo ? (
                        <Image src={m.photo} alt="" width={112} height={112} className="size-28 object-cover" />
                      ) : (
                        <Image src={m.art} alt="" width={120} height={120} className="size-28 object-contain" />
                      )}
                    </motion.div>
                  )}
                  <motion.div variants={rise}>
                    <Hud className="text-ink-faint">{m.role}</Hud>
                  </motion.div>
                  <div className="overflow-hidden pb-1">
                    <motion.p variants={mask} className="mt-1 font-display text-3xl leading-tight">
                      {m.name}
                    </motion.p>
                  </div>
                  <motion.p variants={rise} className="mt-3 line-clamp-3 max-w-[42ch] font-serif text-ink-soft">
                    {m.bio}
                  </motion.p>
                  <motion.p variants={rise} className="mt-4 flex items-center gap-2 text-sm font-medium">
                    <Mail className="size-4 text-clay-deep" aria-hidden />
                    {m.email}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        );
      })}
    </div>
  );
}
