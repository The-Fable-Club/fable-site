"use client";

import Image from "next/image";
import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

// Easing for things that answer the pointer: quick to start, long soft landing.
const SOFT = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const stroke = { fill: "none", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };

// ---- the photo's own frame: hand-drawn, different for every member ------------------
// A line draws a slightly wobbly rectangle round the photo and, on its way, grows little
// doodles off the edges (a sprouting heart, a caterpillar, thorns, a leaf, ...). Which
// doodles, on which edges and where, plus the tilt, all come from the member's slug, so
// each person keeps the same frame between visits. Doodles use the same baseline
// convention as the panel motifs: start (0, 0), end (width, 0), negative y points outward.
type Seg = (string | number)[];
type Doodle = { w: number; segs: Seg[] };
const DOODLES: Doodle[] = [
  // sprouting heart
  { w: 40, segs: [["L", 20, 0], ["L", 20, -12], ["C", 20, -22, 6, -24, 8, -32], ["C", 10, -40, 20, -38, 20, -30], ["C", 20, -38, 30, -40, 32, -32], ["C", 34, -24, 20, -22, 20, -12], ["L", 20, 0], ["L", 40, 0]] },
  // caterpillar climbing out
  { w: 26, segs: [["L", 4, 0], ["L", 4, -4], ["A", 5, 5, 0, 0, 1, 4, -14], ["A", 5, 5, 0, 0, 1, 4, -24], ["A", 5, 5, 0, 0, 1, 4, -34], ["A", 7, 7, 0, 1, 1, 16, -34], ["L", 16, -4], ["L", 20, 0], ["L", 26, 0]] },
  // thorns
  { w: 40, segs: [["L", 4, 0], ["L", 10, -13], ["L", 15, 0], ["L", 23, 0], ["L", 29, -13], ["L", 34, 0], ["L", 40, 0]] },
  // leaf on a stalk
  { w: 40, segs: [["L", 8, 0], ["C", 10, -18, 26, -30, 40, -30], ["C", 38, -16, 26, -6, 12, -4], ["L", 40, 0]] },
  // curl
  { w: 40, segs: [["L", 8, 0], ["C", 8, -18, 30, -22, 30, -10], ["C", 30, -2, 18, -2, 18, -10], ["C", 18, -15, 24, -16, 25, -12], ["C", 26, -6, 32, -2, 40, 0]] },
  // tulip
  { w: 36, segs: [["L", 18, 0], ["L", 18, -16], ["C", 8, -18, 8, -34, 12, -36], ["L", 18, -28], ["L", 24, -36], ["C", 28, -34, 28, -18, 18, -16], ["L", 18, 0], ["L", 36, 0]] },
  // cloud bumps
  { w: 40, segs: [["A", 6, 6, 0, 0, 1, 12, 0], ["A", 8, 8, 0, 0, 1, 28, 0], ["A", 6, 6, 0, 0, 1, 40, 0]] },
  // sparkle
  { w: 40, segs: [["L", 16, 0], ["L", 20, -6], ["Q", 21, -14, 30, -16], ["Q", 21, -18, 20, -28], ["Q", 19, -18, 10, -16], ["Q", 19, -14, 20, -6], ["L", 24, 0], ["L", 40, 0]] },
  // lightning
  { w: 30, segs: [["L", 8, 0], ["L", 14, -14], ["L", 9, -14], ["L", 18, -30], ["L", 16, -17], ["L", 21, -17], ["L", 14, 0], ["L", 30, 0]] },
  // cat ears
  { w: 44, segs: [["L", 6, 0], ["L", 10, -14], ["L", 18, -6], ["L", 26, -6], ["L", 34, -14], ["L", 38, 0], ["L", 44, 0]] },
  // little wave
  { w: 44, segs: [["C", 6, -12, 14, -12, 16, 0], ["C", 18, -12, 26, -12, 28, 0], ["C", 30, -12, 38, -12, 44, 0]] },
  // mushroom
  { w: 36, segs: [["L", 14, 0], ["L", 14, -10], ["C", 2, -10, 4, -28, 18, -28], ["C", 32, -28, 34, -10, 22, -10], ["L", 22, 0], ["L", 36, 0]] },
];

/** A small seeded random generator, so a member's frame is the same on every visit. */
function seeded(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

/** Doodle segments laid along an edge: u runs along `t`, outward (-v) along `n`, scaled by k. */
function alongEdge(segs: Seg[], o: Pt, t: Pt, n: Pt, k: number): string {
  const at = (u: number, v: number) => `${(o[0] + u * k * t[0] - v * k * n[0]).toFixed(1)} ${(o[1] + u * k * t[1] - v * k * n[1]).toFixed(1)}`;
  return segs
    .map(([cmd, ...raw]) => {
      const v = raw as number[];
      if (cmd === "A") return `A${(v[0] * k).toFixed(1)} ${(v[1] * k).toFixed(1)} ${v[2]} ${v[3]} ${v[4]} ${at(v[5], v[6])}`;
      const pairs: string[] = [];
      for (let i = 0; i < v.length; i += 2) pairs.push(at(v[i], v[i + 1]));
      return cmd + pairs.join(" ");
    })
    .join(" ");
}

const PF = 264; // design size of the frame's box; the photo sits at 20..244 inside it

/** The frame path and tilt for one member. */
function photoFrameFor(slug: string): { d: string; tilt: number } {
  const rnd = seeded(slug);
  const m = 12; // the frame line sits 8 design units outside the photo
  const j = () => (rnd() - 0.5) * 5; // hand-drawn wobble at the corners
  const c: Pt[] = [
    [m + j(), m + j()],
    [PF - m + j(), m + j()],
    [PF - m + j(), PF - m + j()],
    [m + j(), PF - m + j()],
  ];
  // three doodles on three different edges
  const pool = [...DOODLES.keys()];
  const edges = [0, 1, 2, 3].sort(() => rnd() - 0.5).slice(0, 3);
  const k = 1.55; // doodles big enough to read as drawings, not bumps
  let d = `M${c[0][0].toFixed(1)} ${c[0][1].toFixed(1)}`;
  for (let e = 0; e < 4; e++) {
    const a = c[e];
    const b = c[(e + 1) % 4];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t: Pt = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const n: Pt = [t[1], -t[0]]; // outward, for a clockwise loop on screen
    if (edges.includes(e)) {
      const doodle = DOODLES[pool.splice(Math.floor(rnd() * pool.length), 1)[0]];
      const span = doodle.w * k;
      const pos = 24 + rnd() * (len - span - 48);
      const o: Pt = [a[0] + t[0] * pos, a[1] + t[1] * pos];
      d += ` L${o[0].toFixed(1)} ${o[1].toFixed(1)} ${alongEdge(doodle.segs, o, t, n, k)}`;
    }
    d += ` L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  const tilt = (rnd() < 0.5 ? -1 : 1) * (2.5 + rnd() * 3.5);
  return { d, tilt };
}

/** The member's photo inside its hand-drawn frame. The line draws itself when `active`
 * turns on, or (with `drawInView`) the first time it scrolls into view. */
export function FramedPhoto({
  slug,
  src,
  active = true,
  drawInView = false,
  sizes = "224px",
  className,
}: {
  slug: string;
  src: string;
  active?: boolean;
  drawInView?: boolean;
  sizes?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { d, tilt } = useMemo(() => photoFrameFor(slug), [slug]);
  const draw = active && !reduce;
  const line = { duration: 2.6, delay: 0.25, ease: [0.45, 0, 0.25, 1] as const };
  return (
    <div
      className={cn("pointer-events-none transition-[rotate,scale] duration-[1100ms]", SOFT, className)}
      style={{ rotate: `${(active && !drawInView ? tilt * 0.45 : tilt).toFixed(2)}deg` }}
    >
      <div className={cn("absolute inset-0 border-[5px] border-paper bg-paper outline-2 outline-ink transition-[filter] duration-1000", SOFT, active ? "grayscale-0" : "grayscale-[0.6]")}>
        <div className="relative size-full overflow-hidden">
          <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
        </div>
      </div>
      {/* the frame box is PF wide with the photo at 20..PF-20: 118% of the photo, offset 9% */}
      <svg aria-hidden viewBox={`0 0 ${PF} ${PF}`} className="absolute -inset-[9%] size-[118%] overflow-visible">
        {drawInView ? (
          <motion.path
            d={d}
            {...stroke}
            className="stroke-ink"
            initial={{ pathLength: reduce ? 1 : 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={line}
          />
        ) : (
          <motion.path
            key={String(draw)}
            d={d}
            {...stroke}
            className={active ? "stroke-ink" : "stroke-ink/40"}
            // keyframes (not `initial`), so the draw still runs inside an AnimatePresence with initial={false}
            animate={{ pathLength: draw ? [0, 1] : 1 }}
            transition={draw ? line : { duration: 0 }}
          />
        )}
      </svg>
    </div>
  );
}
