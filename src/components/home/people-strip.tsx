"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { initials, type Member } from "@/data/members";
import { Hud } from "@/components/hud";
import { cn } from "@/lib/utils";

// Expanding panels: the active panel grows and shows contact details while
// the rest compress into labelled slats. Hover or keyboard focus selects.
// Below the md breakpoint every panel is shown open, stacked.
export function PeopleStrip({ people }: { people: Member[] }) {
  const [active, setActive] = useState(2);

  return (
    <div
      className="grid gap-px border-y border-ink/20 bg-ink/20 md:h-[30rem] md:[grid-template-columns:var(--cols)] md:transition-[grid-template-columns] md:duration-500 md:ease-[cubic-bezier(.2,.7,.2,1)]"
      style={
        {
          "--cols": people.map((_, i) => (i === active ? "3.4fr" : "1fr")).join(" "),
        } as React.CSSProperties
      }
    >
      {people.map((m, i) => {
        const open = i === active;
        return (
          <Link
            key={m.slug}
            href={`/members?m=${m.slug}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            aria-label={`${m.name}, ${m.role}`}
            className={cn(
              "group relative flex min-h-48 flex-col justify-between overflow-hidden p-5 transition-colors duration-300",
              open ? "bg-paper" : "bg-paper-raised hover:bg-paper-sunken",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center font-display text-xl transition-colors",
                  open ? "bg-clay text-ink" : "bg-ink text-paper",
                )}
              >
                {initials(m.name)}
              </span>
              <ArrowUpRight
                aria-hidden
                className={cn("size-5 transition-opacity", open ? "opacity-100" : "opacity-0 md:opacity-30")}
              />
            </div>

            {/* collapsed slat label (desktop) */}
            <span
              aria-hidden
              className={cn(
                "absolute bottom-5 left-5 hidden font-display text-2xl leading-none transition-opacity duration-200 md:block",
                "[writing-mode:vertical-rl] rotate-180",
                open ? "opacity-0" : "opacity-100",
              )}
            >
              {m.name}
            </span>

            <div
              className={cn(
                "transition-[opacity,transform] duration-300",
                "md:absolute md:inset-x-5 md:bottom-5",
                open
                  ? "opacity-100 md:translate-y-0 md:delay-150"
                  : "md:pointer-events-none md:translate-y-3 md:opacity-0",
              )}
            >
              <Image
                src={m.art}
                alt=""
                width={120}
                height={120}
                className="absolute -top-28 right-0 hidden size-24 object-contain opacity-90 md:block"
              />
              <Hud className="text-ink-faint">{m.role}</Hud>
              <p className="mt-1 font-display text-3xl leading-tight">{m.name}</p>
              <p className="mt-3 line-clamp-3 max-w-[42ch] font-serif text-ink-soft">{m.bio}</p>
              <p className="mt-4 flex items-center gap-2 text-sm font-medium">
                <Mail className="size-4 text-clay-deep" aria-hidden />
                {m.email}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
