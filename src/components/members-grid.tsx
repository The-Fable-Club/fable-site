"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Mail } from "lucide-react";
import { initials, type Member } from "@/data/members";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Hud, Ph } from "@/components/hud";

const groups = ["Faculty", "Board", "Leads"] as const;
const groupTitle = {
  Faculty: "Faculty coordinators",
  Board: "The board",
  Leads: "Leads",
} as const;

export function MembersGrid({ members }: { members: Member[] }) {
  const params = useSearchParams();
  // Deep link: /members?m=<slug> opens that card on first render.
  const [slug, setSlug] = useState<string | null>(() => {
    const m = params.get("m");
    return m && members.some((x) => x.slug === m) ? m : null;
  });

  const show = (s: string | null) => {
    setSlug(s);
    const url = new URL(window.location.href);
    if (s) url.searchParams.set("m", s);
    else url.searchParams.delete("m");
    window.history.replaceState(null, "", url);
  };

  const current = members.find((m) => m.slug === slug);

  return (
    <>
      <div className="space-y-20">
        {groups.map((g) => {
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
                        <Image
                          src={m.art}
                          alt=""
                          width={320}
                          height={240}
                          className="absolute inset-0 m-auto size-3/5 object-contain transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:rotate-[-3deg] group-hover:scale-110"
                        />
                        <span className="absolute left-0 top-0 grid size-12 place-items-center bg-ink font-display text-lg text-paper transition-colors group-hover:bg-clay-deep">
                          {initials(m.name)}
                        </span>
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-clay transition-transform duration-300 group-hover:scale-x-100"
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
      </div>

      <Dialog open={!!current} onOpenChange={(o) => !o && show(null)}>
        <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto rounded-none bg-paper p-0 text-ink ring-1 ring-ink sm:max-w-3xl">
          {current && (
            <div className="grid md:grid-cols-[0.8fr_1.2fr]">
              <div className="relative grid min-h-56 place-items-center bg-clay p-8">
                <Image
                  src={current.art}
                  alt=""
                  width={260}
                  height={260}
                  className="size-44 object-contain mix-blend-multiply md:size-56"
                />
                <span className="absolute left-0 top-0 grid size-14 place-items-center bg-ink font-display text-xl text-paper">
                  {initials(current.name)}
                </span>
              </div>
              <div className="p-6 md:p-9">
                <Hud className="text-ink-faint">{current.role}</Hud>
                <DialogTitle className="mt-1 font-display text-4xl leading-tight">
                  {current.name}
                </DialogTitle>
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
