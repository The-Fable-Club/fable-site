"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Hud, Ph } from "@/components/hud";
import { club } from "@/data/club";
import { dateLabel, featured } from "@/data/events";

const STROKE = "var(--color-paper)";

// Hero stage. The sprout mark is split into depth layers; pointer movement
// shifts each layer by a different amount, so the mark reads as floating
// parts rather than a flat logo. Movement is written to CSS variables
// directly (no React re-render per pointer event).
export function Hero() {
  const stage = useRef<HTMLElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const ev = featured();

  const onMove = (e: React.PointerEvent) => {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--px", (x * 2).toFixed(3));
    el.style.setProperty("--py", (y * 2).toFixed(3));
    if (readout.current) {
      readout.current.textContent = `X ${(x * 200).toFixed(0).padStart(4, " ")}  Y ${(y * 200).toFixed(0).padStart(4, " ")}`;
    }
  };
  const onLeave = () => {
    const el = stage.current;
    if (!el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
    if (readout.current) readout.current.textContent = "X    0  Y    0";
  };

  const layer = (d: number) =>
    ({
      transform: `translate(calc(var(--px, 0) * ${d}px), calc(var(--py, 0) * ${d}px))`,
      transition: "transform 380ms cubic-bezier(.2,.7,.2,1)",
    }) as React.CSSProperties;

  return (
    <section
      id="top"
      ref={stage}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-night text-paper"
    >
      {/* dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.16]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-night-soft) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at 70% 50%, black 10%, transparent 70%)",
        }}
      />

      <div className="flex items-start justify-between gap-6 px-6 pt-6 md:px-12">
        <Hud className="text-night-faint">
          {club.institution} / {club.office}
        </Hud>
        <Hud className="hidden text-night-faint md:inline">
          <span ref={readout} className="whitespace-pre">X    0  Y    0</span>
        </Hud>
      </div>

      <div className="grid flex-1 items-center gap-10 px-6 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-12">
        <div className="relative z-10">
          <Hud className="text-clay">Phase 1 · Foundations · Oct – Nov 2026</Hud>
          <h1 className="mt-5 font-display text-[clamp(3.5rem,1.6rem+9vw,9.5rem)] leading-[0.9] tracking-[-0.02em]">
            The Fable
            <br />
            Club
          </h1>
          <p className="mt-8 max-w-[34ch] font-serif text-[clamp(1.25rem,1.1rem+0.6vw,1.65rem)] leading-snug text-night-soft">
            {club.tagline}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/join"
              className="inline-flex h-12 items-center gap-2 bg-clay px-6 font-medium text-ink transition-colors hover:bg-paper"
            >
              Join the club
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/events"
              className="inline-flex h-12 items-center border border-paper/40 px-6 font-medium transition-colors hover:border-paper hover:bg-paper/10"
            >
              See the events
            </Link>
          </div>
        </div>

        {/* Sprout mark */}
        <div className="relative mx-auto aspect-[544/650] w-full max-w-[34rem] md:max-w-none">
          <svg
            viewBox="240 190 544 650"
            role="img"
            aria-label="The Fable Club mark: a sprout with five nodes"
            className="size-full overflow-visible"
            fill="none"
            stroke={STROKE}
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* stem + branches */}
            <g style={layer(4)}>
              {[
                "M512 800 V372",
                "M512 800 L364 706",
                "M512 800 L660 706",
                "M512 614 L364 516",
                "M512 614 L660 516",
              ].map((d) => (
                <path
                  key={d}
                  d={d}
                  pathLength={1}
                  strokeDasharray={1}
                  className="motion-safe:animate-[draw_1.4s_cubic-bezier(.6,0,.2,1)_both]"
                />
              ))}
            </g>
            {/* halo */}
            <g style={layer(22)}>
              <circle
                cx="512"
                cy="326"
                r="106"
                pathLength={1}
                strokeDasharray={1}
                className="motion-safe:animate-[draw_1.8s_cubic-bezier(.6,0,.2,1)_.3s_both]"
              />
            </g>
            {/* nodes */}
            {(
              [
                [512, 330, 10, 0.9],
                [330, 492, 14, 1.1],
                [696, 492, 14, 1.2],
                [330, 682, 18, 1.35],
                [696, 682, 18, 1.45],
              ] as const
            ).map(([cx, cy, depth, delay], i) => (
              <g key={i} style={layer(depth)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="46"
                  fill="var(--color-clay)"
                  className="origin-center motion-safe:animate-[pop_.7s_cubic-bezier(.3,1.5,.5,1)_both]"
                  style={{
                    animationDelay: `${delay}s`,
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* now-live strip */}
      {ev && (
        <Link
          href={`/events/${ev.slug}`}
          className="group relative z-10 mx-6 mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 border border-paper/25 bg-night/70 px-4 py-3 backdrop-blur transition-colors hover:border-clay md:mx-12 md:mb-10"
        >
          <span className="hud flex items-center gap-2 text-clay">
            <span className="size-2 animate-pulse bg-clay" aria-hidden />
            {ev.status === "active" ? "Live now" : "Next up"}
          </span>
          <span className="font-medium">{ev.title}</span>
          <Hud className="text-night-faint">{dateLabel(ev)}</Hud>
          <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
      <Ph className="absolute bottom-4 right-6 hidden border-clay text-clay md:inline-flex">
        Placeholder content
      </Ph>

      <style>{`
        @keyframes draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes pop { from { transform: scale(0); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
    </section>
  );
}
