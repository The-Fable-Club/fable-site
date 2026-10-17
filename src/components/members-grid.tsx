"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass, ExternalLink, GraduationCap, Landmark, LayoutGrid, Mail, Users } from "lucide-react";
import { initials, type Member } from "@/lib/members";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Hud, Ph } from "@/components/hud";
import { cn } from "@/lib/utils";

const FLOW = [0.65, 0, 0.35, 1] as const;

const groups = ["Faculty", "Board", "Leads", "Member"] as const;
const groupTitle = {
  Faculty: "Faculty coordinators",
  Board: "The board",
  Leads: "Leads",
  Member: "Members",
} as const;

// Member types as circle icons, like Endfield's operator class filters.
const filters = [
  { key: "All", label: "Everyone", icon: LayoutGrid },
  { key: "Faculty", label: "Faculty", icon: GraduationCap },
  { key: "Board", label: "Board", icon: Landmark },
  { key: "Leads", label: "Leads", icon: Compass },
  { key: "Member", label: "Members", icon: Users },
] as const;
type Filter = (typeof filters)[number]["key"];

export function MembersGrid({ members }: { members: Member[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [filter, setFilter] = useState<Filter>("All");

  // The open card is driven by the URL (?m=slug), so links from the home page
  // open it directly, the back button closes it, and a card can be shared.
  const slug = params.get("m");
  const current = members.find((m) => m.slug === slug);

  // A card opened by a click on another page can receive that same click's
  // trailing "outside press"; ignore closes in the first moments after opening.
  const openedAt = useRef(0);
  useEffect(() => {
    if (slug) openedAt.current = performance.now();
  }, [slug]);

  const show = (s: string | null) => {
    const url = s ? `${pathname}?m=${s}` : pathname;
    router.push(url, { scroll: false });
  };

  const count = (k: Filter) => (k === "All" ? members.length : members.filter((m) => m.group === k).length);

  return (
    <>
      {/* type filter */}
      <div role="tablist" aria-label="Filter by member type" className="mb-14 flex flex-wrap gap-x-8 gap-y-4">
        {filters.map((f) => {
          const on = filter === f.key;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.key)}
              className="group flex items-center gap-3 text-left"
            >
              <span
                className={cn(
                  "relative grid size-14 place-items-center rounded-full border-2 transition-colors duration-700 ease-flow",
                  on
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/30 bg-paper text-ink group-hover:border-ink",
                )}
              >
                <Icon className="size-6" strokeWidth={1.6} aria-hidden />
                {on && (
                  <motion.span
                    layoutId="filter-ring"
                    aria-hidden
                    className="absolute -inset-1.5 rounded-full border border-clay-deep"
                    transition={{ duration: 0.7, ease: FLOW }}
                  />
                )}
              </span>
              <span>
                <span className="block font-display text-xl leading-none">{f.label}</span>
                <Hud className="text-ink-faint">{count(f.key)}</Hud>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.55, ease: FLOW }}
          className="space-y-20"
        >
          {groups.map((g) => {
            if (filter !== "All" && filter !== g) return null;
            const list = members.filter((m) => m.group === g);
            if (!list.length) return null;
            return (
              <section key={g} aria-labelledby={`g-${g}`}>
                <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
                  <h2 id={`g-${g}`} className="font-display text-3xl leading-none md:text-4xl">
                    {groupTitle[g]}
                  </h2>
                  <Hud className="text-ink-faint">{list.length}</Hud>
                </div>
                <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((m) => (
                    <li key={m.slug}>
                      <button
                        onClick={() => show(m.slug)}
                        className="group block w-full text-left"
                        aria-haspopup="dialog"
                      >
                        <span className="relative block aspect-[4/3] overflow-hidden bg-paper-raised">
                          {m.photo ? (
                            <Image
                              src={m.photo}
                              alt=""
                              fill
                              sizes="(min-width:1024px) 33vw, 50vw"
                              className="object-cover transition-transform duration-[900ms] ease-flow group-hover:scale-105"
                            />
                          ) : (
                            <Image
                              src={m.art}
                              alt=""
                              width={320}
                              height={240}
                              className="absolute inset-0 m-auto size-3/5 object-contain transition-transform duration-[900ms] ease-flow group-hover:-translate-y-1 group-hover:rotate-[-3deg] group-hover:scale-110"
                            />
                          )}
                          <span className="absolute left-0 top-0 grid size-12 place-items-center bg-ink font-display text-lg text-paper transition-colors duration-700 ease-flow group-hover:bg-clay-deep">
                            {initials(m.name)}
                          </span>
                          <span
                            aria-hidden
                            className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-clay transition-transform duration-700 ease-flow group-hover:scale-x-100"
                          />
                        </span>
                        <span className="mt-4 block font-display text-2xl leading-tight">{m.name}</span>
                        <span className="hud mt-1 block text-ink-faint">{m.role}</span>
                        <span className="mt-3 flex flex-wrap gap-1.5">
                          {m.focus.map((f) => (
                            <span key={f} className="border border-ink/25 px-2 py-0.5 text-xs text-ink-soft">
                              {f}
                            </span>
                          ))}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <Dialog open={!!current} onOpenChange={(o) => {
          if (!o && performance.now() - openedAt.current > 500) show(null);
        }}>
        <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto rounded-none bg-paper p-0 text-ink ring-1 ring-ink sm:max-w-3xl">
          {current && (
            <div className="grid md:grid-cols-[0.8fr_1.2fr]">
              <div className="relative grid min-h-56 place-items-center overflow-hidden bg-clay p-8">
                {current.photo ? (
                  <Image src={current.photo} alt="" fill sizes="320px" className="object-cover" />
                ) : (
                  <Image
                    src={current.art}
                    alt=""
                    width={260}
                    height={260}
                    className="size-44 object-contain mix-blend-multiply md:size-56"
                  />
                )}
                <span className="absolute left-0 top-0 grid size-14 place-items-center bg-ink font-display text-xl text-paper">
                  {initials(current.name)}
                </span>
              </div>
              <div className="p-6 md:p-9">
                <Hud className="text-ink-faint">{current.role}</Hud>
                <DialogTitle className="mt-1 font-display text-4xl leading-tight">{current.name}</DialogTitle>
                <p className="hud mt-1 text-ink-faint">
                  {[current.department, current.year].filter(Boolean).join(" · ")}
                </p>
                <DialogDescription className="mt-5 font-serif text-lg leading-relaxed text-ink-soft">
                  {current.bio}
                </DialogDescription>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {current.focus.map((f) => (
                    <span key={f} className="bg-paper-field px-2.5 py-1 text-sm">
                      {f}
                    </span>
                  ))}
                </div>
                <div className="mt-7 grid gap-2 border-t border-ink/20 pt-5 text-sm">
                  <a href={`mailto:${current.email}`} className="inline-flex items-center gap-2 hover:text-clay-deep">
                    <Mail className="size-4" aria-hidden />
                    {current.email}
                  </a>
                  {current.linkedin && (
                    <a href={current.linkedin} className="inline-flex items-center gap-2 hover:text-clay-deep">
                      <ExternalLink className="size-4" aria-hidden />
                      LinkedIn
                    </a>
                  )}
                  {current.github && (
                    <a href={current.github} className="inline-flex items-center gap-2 hover:text-clay-deep">
                      <ExternalLink className="size-4" aria-hidden />
                      GitHub
                    </a>
                  )}
                </div>
                <Ph className="mt-6">Placeholder profile</Ph>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
