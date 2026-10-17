"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Hud, Ph } from "@/components/hud";
import { prefersReducedMotion } from "@/lib/motion";
import { dateLabel, type ClubEvent } from "@/lib/events";
import type { Club } from "@/lib/content";

const STROKE = "var(--color-paper)";

// Critically-damped spring ("smooth damp"): the value glides to its target
// with no overshoot, and its velocity is continuous, so it always starts and
// ends gently no matter how far away the target jumps.
function smoothDamp(cur: number, target: number, vel: { v: number }, smoothTime: number, dt: number) {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = cur - target;
  const temp = (vel.v + omega * change) * dt;
  vel.v = (vel.v - omega * temp) * e;
  return target + (change + temp) * e;
}

// Hero stage. The sprout mark is split into depth layers that follow the
// cursor with a delay, so the mark reads as floating parts rather than a flat
// logo.
//
// The cursor is tracked across the whole window (clamped to the stage), and
// the mark always glides toward it with a spring. There is no "inside /
// outside" logic and nothing is predicted: wherever the pointer leaves or
// re-enters, the mark just accelerates smoothly from where it is.
export function Hero({ club, event }: { club: Club; event?: ClubEvent }) {
  const stage = useRef<HTMLElement>(null);
  const readout = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const vx = { v: 0 };
    const vy = { v: 0 };
    let last = performance.now();
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
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      if (reduce) {
        cur.x = target.x;
        cur.y = target.y;
      } else {
        cur.x = smoothDamp(cur.x, target.x, vx, 0.6, dt);
        cur.y = smoothDamp(cur.y, target.y, vy, 0.6, dt);
      }
      el.style.setProperty("--px", cur.x.toFixed(4));
      el.style.setProperty("--py", cur.y.toFixed(4));
      if (readout.current) {
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

  const layer = (d: number) =>
    ({
      transform: `translate(calc(var(--px, 0) * ${d}px), calc(var(--py, 0) * ${d}px))`,
    }) as React.CSSProperties;

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
                  className="animate-[draw_1.4s_cubic-bezier(.65,0,.35,1)_both]"
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
              <g key={i} style={layer(depth)}>
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
      {event && (
        <Link
          href={`/events/${event.slug}`}
          className="group relative z-10 mx-6 mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 border border-paper/25 bg-night/70 px-4 py-3 backdrop-blur transition-colors duration-500 ease-flow hover:border-clay md:mx-12 md:mb-10"
        >
          <span className="hud flex items-center gap-2 text-clay">
            <span className="size-2 animate-pulse bg-clay" aria-hidden />
            {event.status === "active" ? "Live now" : "Next up"}
          </span>
          <span className="font-medium">{event.title}</span>
          <Hud className="text-night-faint">{dateLabel(event)}</Hud>
          <ArrowRight
            className="ml-auto size-4 transition-transform duration-500 ease-flow group-hover:translate-x-1"
            aria-hidden
          />
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
