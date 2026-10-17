"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Hud, Ph } from "@/components/hud";
import { dateLabel, type HeroStrip } from "@/lib/events";
import type { Club } from "@/lib/content";

const STROKE = "var(--color-paper)";

// Hero stage. The sprout mark is split into depth layers that follow the
// cursor immediately, so the mark reads as floating parts rather than a flat
// logo.
//
// The cursor is tracked across the whole window (clamped to the stage), so
// leaving the section towards the rail or the next section just parks the
// mark at the edge; it never snaps back to the centre.
export function Hero({ club, strips }: { club: Club; strips: HeroStrip[] }) {
  const stage = useRef<HTMLElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    // Depth layers of the mark (tagged data-depth). Their transforms are written
    // directly each frame, instead of via a CSS variable on the section, which
    // forced the browser to restyle the whole hero subtree 60 times a second.
    const layers = Array.from(el.querySelectorAll<SVGGElement>("g[data-depth]")).map((g) => ({
      el: g,
      d: Number(g.dataset.depth),
    }));
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let lastX = NaN;
    let lastY = NaN;
    let lastReadout = 0;
    let raf = 0;
    let visible = true;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      target.x = Math.max(-1, Math.min(1, x * 2));
      target.y = Math.max(-1, Math.min(1, y * 2));
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      // Immediate follow: the mark sits exactly where the cursor puts it.
      cur.x = target.x;
      cur.y = target.y;
      // Unchanged since the last frame: nothing to write, so idle frames are free.
      if (cur.x === lastX && cur.y === lastY) return;
      lastX = cur.x;
      lastY = cur.y;
      for (const l of layers) {
        l.el.setAttribute("transform", `translate(${(cur.x * l.d).toFixed(2)} ${(cur.y * l.d).toFixed(2)})`);
      }
      el.dataset.px = cur.x.toFixed(4); // exposed for tests / debugging
      if (readout.current && now - lastReadout > 120) {
        lastReadout = now;
        readout.current.textContent = `X ${(cur.x * 100).toFixed(0).padStart(4, " ")}  Y ${(cur.y * 100).toFixed(0).padStart(4, " ")}`;
      }
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
    });
    io.observe(el);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section
      id="top"
      ref={stage}
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
              className="inline-flex h-12 items-center gap-2 bg-clay px-6 font-medium text-ink transition-colors duration-500 ease-flow hover:bg-paper"
            >
              Join the club
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/events"
              className="inline-flex h-12 items-center border border-paper/40 px-6 font-medium transition-colors duration-500 ease-flow hover:border-paper hover:bg-paper/10"
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
            <g data-depth={4}>
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
                  className="animate-[draw_1.4s_cubic-bezier(.65,0,.35,1)_both]"
                />
              ))}
            </g>
            {/* halo */}
            <g data-depth={22}>
              <circle
                cx="512"
                cy="326"
                r="106"
                pathLength={1}
                strokeDasharray={1}
                className="animate-[draw_1.8s_cubic-bezier(.65,0,.35,1)_.3s_both]"
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
              <g key={i} data-depth={depth}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="46"
                  fill="var(--color-clay)"
                  className="origin-center animate-[pop_.8s_cubic-bezier(.65,0,.35,1)_both]"
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
      {strips.length > 0 && (
        <div className="relative z-10 mx-6 mb-6 grid gap-2 md:mx-12 md:mb-10">
          {strips.map(({ label, event }) => (
            <Link
              key={label}
              href={`/events/${event.slug}`}
              className="group flex flex-wrap items-center gap-x-6 gap-y-1 border border-paper/25 bg-night/90 px-4 py-3 transition-colors duration-500 ease-flow hover:border-clay"
            >
              <span className="hud flex items-center gap-2 text-clay">
                <span className="size-2 animate-pulse bg-clay" aria-hidden />
                {label}
              </span>
              <span className="font-medium">{event.title}</span>
              <Hud className="text-night-faint">{dateLabel(event)}</Hud>
              <ArrowRight
                className="ml-auto size-4 transition-transform duration-500 ease-flow group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          ))}
        </div>
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
