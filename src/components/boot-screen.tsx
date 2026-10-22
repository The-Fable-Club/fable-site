"use client";

import { useEffect, useRef, useState } from "react";
import { BOOT_FIRST_MS, BOOT_GIVE_UP_MS, BOOT_REPEAT_MS, bootProgress, span } from "@/lib/boot";

// Loading screen, after Endfield's: a vertical bar and a big percentage on the
// left, the club mark drawing itself in the middle, a row of cells and the
// tagline along the bottom. When it reaches 100% the content falls away, a line
// draws across the seam and the two halves of the screen slide apart to reveal
// the site (the hero's own intro animation is held until that moment).
//
// It is rendered on the server, so it covers the page from the very first
// paint, and driven straight from requestAnimationFrame (no React renders while
// it counts). Without JavaScript the <noscript> rule hides it.

const STEMS = ["M512 800 V372", "M512 800 L364 706", "M512 800 L660 706", "M512 614 L364 516", "M512 614 L660 516"];
const STEM_SPANS: [number, number][] = [[0, 26], [10, 36], [10, 36], [24, 50], [24, 50]];
const NODES: [number, number][] = [[512, 330], [330, 492], [696, 492], [330, 682], [696, 682]];
const CELLS = 14;
const SEEN = "fable-boot-seen";

type Phase = "run" | "exit" | "open" | "gone";

export function BootScreen({ institution, tagline }: { institution: string; tagline: string }) {
  const [phase, setPhase] = useState<Phase>("run");
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const rule = useRef<HTMLSpanElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cells = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
    } catch {
      /* private mode: just show the full version */
    }
    const minMs = seen ? BOOT_REPEAT_MS : BOOT_FIRST_MS;

    let ready = false;
    const done = () => (ready = true);
    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true }));
    Promise.all([loaded, document.fonts?.ready ?? Promise.resolve()]).then(done, done);

    const stems = svg.current ? Array.from(svg.current.querySelectorAll<SVGPathElement>("[data-stem]")) : [];
    const halo = svg.current?.querySelector<SVGCircleElement>("[data-halo]");
    const nodes = svg.current ? Array.from(svg.current.querySelectorAll<SVGCircleElement>("[data-node]")) : [];
    const cellEls = cells.current ? Array.from(cells.current.children) : [];

    const t0 = performance.now();
    let shown = 0; // what is on screen; chases the target so a late "ready" never jumps
    let last = t0;
    let raf = 0;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const paint = (p: number) => {
      if (pct.current) pct.current.textContent = String(Math.round(p)).padStart(2, "0");
      if (bar.current) bar.current.style.transform = `scaleY(${p / 100})`;
      if (rule.current) rule.current.style.transform = `scaleX(${p / 100})`;
      stems.forEach((el, i) => (el.style.strokeDashoffset = String(1 - span(p, STEM_SPANS[i][0], STEM_SPANS[i][1]))));
      if (halo) halo.style.strokeDashoffset = String(1 - span(p, 40, 72));
      nodes.forEach((el, i) => {
        const s = span(p, 48 + i * 9, 60 + i * 9);
        el.style.transform = `scale(${s})`;
        el.style.opacity = s > 0 ? "1" : "0";
      });
      const lit = Math.floor((p / 100) * CELLS + 0.0001);
      cellEls.forEach((c, i) => ((c as HTMLElement).dataset.on = i < lit ? "1" : "0"));
    };

    const finish = () => {
      try {
        sessionStorage.setItem(SEEN, "1");
      } catch {
        /* ignore */
      }
      setPhase("exit");
      timers = [setTimeout(() => setPhase("open"), 750), setTimeout(() => setPhase("gone"), 750 + 1150)];
    };

    const tick = (now: number) => {
      const elapsed = now - t0;
      const target = bootProgress(elapsed, minMs, ready || elapsed > BOOT_GIVE_UP_MS);
      const dt = Math.min(64, now - last);
      last = now;
      shown += (target - shown) * (1 - Math.pow(0.0015, dt / 1000)); // ease toward the target
      if (target >= 100 && shown > 99.6) shown = 100;
      paint(shown);
      if (shown >= 100) return finish();
      raf = requestAnimationFrame(tick);
    };
    paint(0);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <>
      {/* While the screen is up: no scrolling, and the hero's intro waits (see .hero-intro). Gone once the screen opens. */}
      {phase !== "open" && (
        <style>{`html{overflow:hidden}.hero-intro *{animation-play-state:paused!important}`}</style>
      )}
      <noscript>
        <style>{`#boot{display:none!important}html{overflow:auto!important}.hero-intro *{animation-play-state:running!important}`}</style>
      </noscript>
      <div id="boot" role="status" aria-live="polite" aria-label="Loading The Fable Club" data-phase={phase} className="boot">
        <div className="boot-panel boot-top" />
        <div className="boot-panel boot-bottom" />
        <span aria-hidden className="boot-seam" />

        <div className="boot-content">
          {/* left: bar and percentage */}
          <div className="absolute left-6 top-6 flex items-start gap-5 md:left-10 md:top-10">
            <span aria-hidden className="relative block h-[min(52vh,22rem)] w-[6px] bg-paper/15">
              <span ref={bar} className="absolute inset-0 origin-top bg-clay" style={{ transform: "scaleY(0)" }} />
            </span>
            <div className="-mt-1">
              <p className="boot-pct font-display leading-none text-clay">
                <span ref={pct} className="text-[clamp(3.5rem,2.6rem+4vw,6.5rem)] tabular-nums">00</span>
                <span className="ml-1 text-[clamp(1.5rem,1.2rem+1.4vw,2.5rem)]">%</span>
              </p>
              <p className="hud mt-3 flex items-center gap-2 text-night-faint">
                <span className="boot-blink size-1.5 bg-night-faint" aria-hidden />
                <span className="boot-blink size-1.5 bg-night-faint [animation-delay:.3s]" aria-hidden />
                Loading
              </p>
            </div>
          </div>

          {/* centre: the mark draws itself */}
          <div className="absolute inset-0 grid place-items-center px-6">
            <div className="text-center">
              <p className="hud mb-5 text-night-faint">{institution}</p>
              <svg
                ref={svg}
                viewBox="240 190 544 650"
                aria-hidden
                className="mx-auto h-[min(34vh,17rem)] w-auto overflow-visible"
                fill="none"
                stroke="var(--color-paper)"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {STEMS.map((d) => (
                  <path key={d} data-stem d={d} pathLength={1} strokeDasharray={1} style={{ strokeDashoffset: 1 }} />
                ))}
                <circle data-halo cx="512" cy="326" r="106" pathLength={1} strokeDasharray={1} style={{ strokeDashoffset: 1 }} />
                {NODES.map(([cx, cy]) => (
                  <circle
                    key={`${cx}-${cy}`}
                    data-node
                    cx={cx}
                    cy={cy}
                    r="46"
                    fill="var(--color-clay)"
                    stroke="none"
                    style={{ transform: "scale(0)", opacity: 0, transformBox: "fill-box", transformOrigin: "center" }}
                  />
                ))}
              </svg>
              <p className="mt-7 font-display text-[clamp(1.75rem,1.3rem+1.6vw,2.75rem)] leading-none tracking-[0.02em] text-paper">
                The Fable Club
              </p>
            </div>
          </div>

          {/* bottom: cells, rule and tagline */}
          <div className="absolute inset-x-6 bottom-8 mx-auto max-w-[34rem] md:bottom-12">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-clay">▼</span>
                <span className="hud text-night-faint">Systems</span>
              </div>
              <div ref={cells} aria-hidden className="grid grid-cols-[repeat(14,0.55rem)] gap-1">
                {Array.from({ length: CELLS }, (_, i) => (
                  <span key={i} data-on="0" className="boot-cell h-2.5" />
                ))}
              </div>
            </div>
            <span aria-hidden className="relative mt-3 block h-px bg-paper/25">
              <span ref={rule} className="absolute inset-0 origin-left bg-clay" style={{ transform: "scaleX(0)" }} />
            </span>
            <p className="mt-4 text-center text-[0.8rem] font-medium uppercase tracking-[0.18em] text-night-soft">{tagline}</p>
          </div>
        </div>
      </div>
    </>
  );
}
