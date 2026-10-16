"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight, Clock, MapPin } from "lucide-react";
import { dateLabel, type ClubEvent } from "@/data/events";
import { Hud } from "@/components/hud";
import { StatusDot } from "@/components/timeline";

// Highlighted event. A soft spotlight follows the pointer across the panel.
export function FeaturedEvent({ event: e }: { event: ClubEvent }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (ev: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${ev.clientX - r.left}px`);
    el.style.setProperty("--my", `${ev.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      className="group relative isolate grid overflow-hidden bg-night text-paper md:grid-cols-[1.2fr_0.8fr]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--color-clay) 28%, transparent), transparent 70%)",
        }}
      />
      <div className="p-8 md:p-12">
        <div className="flex items-center gap-3">
          <StatusDot status={e.status} />
          <Hud className="text-night-faint">
            {e.kind} · Phase {e.phase}
          </Hud>
        </div>
        <h3 className="mt-5 max-w-[16ch] font-display text-4xl leading-[1.02] md:text-6xl">
          {e.title}
        </h3>
        <p className="mt-5 max-w-[46ch] font-serif text-lg leading-relaxed text-night-soft">
          {e.summary}
        </p>
        <dl className="mt-6 grid gap-2 text-sm text-night-soft">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-clay" aria-hidden />
            <dt className="sr-only">When</dt>
            <dd>
              {dateLabel(e)} · {e.time}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-clay" aria-hidden />
            <dt className="sr-only">Where</dt>
            <dd>{e.venue}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          {e.applyUrl && (
            <a
              href={e.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 bg-clay px-6 font-medium text-ink transition-colors hover:bg-paper"
            >
              Apply for this event
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          )}
          <Link
            href={`/events/${e.slug}`}
            className="inline-flex h-12 items-center gap-2 border border-paper/40 px-6 font-medium transition-colors hover:border-paper hover:bg-paper/10"
          >
            Event details
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="relative grid min-h-64 place-items-center bg-paper p-10 text-ink">
        <Image
          src={e.art}
          alt=""
          width={320}
          height={320}
          className="size-full max-h-72 object-contain transition-transform duration-500 group-hover:scale-[1.04] group-hover:-rotate-1"
        />
        <span aria-hidden className="absolute left-3 top-3 size-3 border-l border-t border-ink" />
        <span aria-hidden className="absolute bottom-3 right-3 size-3 border-b border-r border-ink" />
      </div>
    </div>
  );
}
