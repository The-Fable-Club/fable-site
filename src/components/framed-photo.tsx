"use client";

import Image from "next/image";
import { useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// Easing for things that answer the pointer: quick to start, long soft landing.
const SOFT = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const stroke = { fill: "none", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };

// ---- the photo's own frame: hand-drawn, different for every member ------------------
// One line draws a slightly wobbly rectangle round the photo and, on its way, grows
// doodles off the edges (wings, ears, a heart, the mascot, ...). Which doodles, where, and
// the tilt all come from the slug (plus a few hand-picked ones in PICKS), so a person keeps
// the same frame between visits.
//
// Doodles are drawn on a baseline: they start at (0, 0) and end at (w, 0), and negative y
// points away from the photo. "M" moves without drawing (for eyes, antennae, a halo).
// Paths are traced in drawing order, so the line really does go out into the doodle and
// come back to carry on round the frame.
type Seg = (string | number)[];
type Doodle = { w: number; segs: Seg[]; edges?: number[] };

const DOODLES = {
  heartSprout: { w: 40, segs: [["L", 20, 0], ["L", 20, -12], ["C", 20, -22, 6, -24, 8, -32], ["C", 10, -40, 20, -38, 20, -30], ["C", 20, -38, 30, -40, 32, -32], ["C", 34, -24, 20, -22, 20, -12], ["L", 20, 0], ["L", 40, 0]] },
  heart: { w: 48, segs: [["L", 24, 0], ["C", 10, -10, 2, -20, 6, -30], ["C", 10, -40, 22, -40, 24, -30], ["C", 26, -40, 38, -40, 42, -30], ["C", 46, -20, 38, -10, 24, 0], ["L", 48, 0]] },
  catEars: { w: 56, edges: [0], segs: [["L", 6, 0], ["L", 12, -20], ["L", 22, -8], ["L", 34, -8], ["L", 44, -20], ["L", 50, 0], ["L", 56, 0], ["M", 14, -6], ["L", 14.5, -10], ["M", 42, -6], ["L", 41.5, -10], ["M", 56, 0]] },
  bunnyEars: { w: 48, edges: [0], segs: [["L", 8, 0], ["C", 4, -20, 6, -46, 14, -48], ["C", 22, -46, 22, -20, 18, 0], ["L", 30, 0], ["C", 26, -20, 28, -46, 36, -48], ["C", 44, -46, 44, -20, 40, 0], ["L", 48, 0], ["M", 14, -8], ["L", 14, -36], ["M", 36, -8], ["L", 36, -36], ["M", 48, 0]] },
  tiara: { w: 52, edges: [0], segs: [["L", 4, 0], ["L", 10, -12], ["L", 17, -6], ["L", 26, -26], ["A", 3.5, 3.5, 0, 0, 1, 26, -33], ["A", 3.5, 3.5, 0, 0, 1, 26, -26], ["L", 35, -6], ["L", 42, -12], ["L", 48, 0], ["L", 52, 0], ["M", 10, -12], ["A", 2, 2, 0, 1, 1, 10, -16], ["A", 2, 2, 0, 1, 1, 10, -12], ["M", 42, -12], ["A", 2, 2, 0, 1, 1, 42, -16], ["A", 2, 2, 0, 1, 1, 42, -12], ["M", 52, 0]] },
  halo: { w: 48, edges: [0], segs: [["L", 48, 0], ["M", 6, -34], ["A", 18, 6, 0, 1, 1, 42, -34], ["A", 18, 6, 0, 1, 1, 6, -34], ["M", 48, 0]] },
  // the little pixel critter (Claude Code's mascot, the club's too): body, side nubs, legs, eyes
  mascot: { w: 52, segs: [["L", 10, 0], ["L", 10, -6], ["L", 6, -6], ["L", 6, -16], ["L", 1, -16], ["L", 1, -23], ["L", 6, -23], ["L", 6, -34], ["L", 46, -34], ["L", 46, -23], ["L", 51, -23], ["L", 51, -16], ["L", 46, -16], ["L", 46, -6], ["L", 42, -6], ["L", 42, 0], ["L", 52, 0], ["M", 18, 0], ["L", 18, -6], ["M", 34, 0], ["L", 34, -6], ["M", 17, -26], ["L", 17, -20], ["M", 35, -26], ["L", 35, -20], ["M", 52, 0]] },
  caterpillar: { w: 26, segs: [["L", 4, 0], ["L", 4, -4], ["A", 5, 5, 0, 0, 1, 4, -14], ["A", 5, 5, 0, 0, 1, 4, -24], ["A", 5, 5, 0, 0, 1, 4, -34], ["A", 7, 7, 0, 1, 1, 16, -34], ["L", 16, -4], ["L", 20, 0], ["L", 26, 0], ["M", 8, -40], ["L", 4, -48], ["M", 13, -41], ["L", 16, -49], ["M", 26, 0]] },
  antlers: { w: 40, edges: [0], segs: [["L", 10, 0], ["L", 10, -14], ["L", 4, -24], ["L", 0, -36], ["L", 4, -24], ["L", 13, -31], ["L", 4, -24], ["L", 10, -14], ["L", 10, 0], ["L", 30, 0], ["L", 30, -14], ["L", 36, -24], ["L", 40, -36], ["L", 36, -24], ["L", 27, -31], ["L", 36, -24], ["L", 30, -14], ["L", 30, 0], ["L", 40, 0]] },
  butterfly: { w: 40, segs: [["L", 20, 0], ["L", 20, -12], ["C", 0, -14, -2, -42, 20, -24], ["C", 42, -42, 40, -14, 20, -12], ["M", 20, -24], ["L", 15, -36], ["M", 20, -24], ["L", 25, -36], ["M", 20, 0], ["L", 40, 0]] },
  tail: { w: 18, segs: [["C", 2, -18, -12, -28, -2, -42], ["C", 4, -50, 14, -46, 10, -38], ["M", 0, 0], ["L", 18, 0]] },
  thorns: { w: 40, segs: [["L", 4, 0], ["L", 10, -13], ["L", 15, 0], ["L", 23, 0], ["L", 29, -13], ["L", 34, 0], ["L", 40, 0]] },
  leaf: { w: 40, segs: [["L", 8, 0], ["C", 10, -18, 26, -30, 40, -30], ["C", 38, -16, 26, -6, 12, -4], ["L", 40, 0]] },
  curl: { w: 40, segs: [["L", 8, 0], ["C", 8, -18, 30, -22, 30, -10], ["C", 30, -2, 18, -2, 18, -10], ["C", 18, -15, 24, -16, 25, -12], ["C", 26, -6, 32, -2, 40, 0]] },
  tulip: { w: 36, segs: [["L", 18, 0], ["L", 18, -16], ["C", 8, -18, 8, -34, 12, -36], ["L", 18, -28], ["L", 24, -36], ["C", 28, -34, 28, -18, 18, -16], ["L", 18, 0], ["L", 36, 0]] },
  cloud: { w: 40, segs: [["A", 6, 6, 0, 0, 1, 12, 0], ["A", 8, 8, 0, 0, 1, 28, 0], ["A", 6, 6, 0, 0, 1, 40, 0]] },
  sparkle: { w: 40, segs: [["L", 16, 0], ["L", 20, -6], ["Q", 21, -14, 30, -16], ["Q", 21, -18, 20, -28], ["Q", 19, -18, 10, -16], ["Q", 19, -14, 20, -6], ["L", 24, 0], ["L", 40, 0]] },
  lightning: { w: 30, segs: [["L", 8, 0], ["L", 14, -14], ["L", 9, -14], ["L", 18, -30], ["L", 16, -17], ["L", 21, -17], ["L", 14, 0], ["L", 30, 0]] },
  mushroom: { w: 36, segs: [["L", 14, 0], ["L", 14, -10], ["C", 2, -10, 4, -28, 18, -28], ["C", 32, -28, 34, -10, 22, -10], ["L", 22, 0], ["L", 36, 0]] },
  note: { w: 32, segs: [["L", 16, 0], ["L", 16, -38], ["C", 24, -34, 30, -28, 25, -19], ["M", 16, -10], ["A", 4.5, 3.5, -20, 0, 1, 7, -10], ["A", 4.5, 3.5, -20, 0, 1, 16, -10], ["M", 16, 0], ["L", 32, 0]] },
} satisfies Record<string, Doodle>;
type DoodleName = keyof typeof DOODLES;

// A wing on each side edge, mirrored, at the same height: tip up on both.
const WING_UP_AT_END: Seg[] = [["C", 0, -22, 22, -42, 52, -46], ["C", 46, -38, 48, -33, 42, -31], ["C", 46, -27, 44, -22, 37, -21], ["C", 41, -17, 38, -12, 31, -12], ["C", 33, -7, 29, -2, 22, 0], ["L", 56, 0]];
const WING_UP_AT_START: Seg[] = [["L", 34, 0], ["C", 27, -2, 23, -7, 25, -12], ["C", 18, -12, 15, -17, 19, -21], ["C", 12, -22, 10, -27, 14, -31], ["C", 8, -33, 10, -38, 4, -46], ["C", 34, -42, 56, -22, 56, 0]];
const WING_W = 56;

/** Hand-picked doodles for some people (the rest are seeded from the slug). */
const PICKS: Record<string, (DoodleName | "wings")[]> = {
  "harsha-vardan-m-sakamuri": ["catEars", "heart"],
};

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
const f1 = (n: number) => n.toFixed(1);

/** Doodle segments laid along an edge: u runs along `t`, outward (-v) along `n`, scaled by k. */
function alongEdge(segs: Seg[], o: Pt, t: Pt, n: Pt, k: number): string {
  const at = (u: number, v: number) => `${f1(o[0] + u * k * t[0] - v * k * n[0])} ${f1(o[1] + u * k * t[1] - v * k * n[1])}`;
  const turn = (Math.atan2(t[1], t[0]) * 180) / Math.PI;
  return segs
    .map(([cmd, ...raw]) => {
      const v = raw as number[];
      if (cmd === "A") return `A${f1(v[0] * k)} ${f1(v[1] * k)} ${f1(v[2] + turn)} ${v[3]} ${v[4]} ${at(v[5], v[6])}`;
      const pairs: string[] = [];
      for (let i = 0; i < v.length; i += 2) pairs.push(at(v[i], v[i + 1]));
      return cmd + pairs.join(" ");
    })
    .join(" ");
}

const PF = 264; // design size of the frame's box; the photo sits at 20..244 inside it

type Placed = { edge: number; pos: number; segs: Seg[]; w: number };

/** The frame path and tilt for one member. Edges: 0 top, 1 right, 2 bottom, 3 left. */
function photoFrameFor(slug: string): { d: string; tilt: number } {
  const rnd = seeded(slug);
  const tilt = (rnd() < 0.5 ? -1 : 1) * (2.5 + rnd() * 3);
  const k = 1.35;
  const m = 12; // the frame line sits 8 design units outside the photo
  const j = () => (rnd() - 0.5) * 6; // hand-drawn wobble at the corners
  // corners, then the whole frame turned by the tilt (the photo is turned by CSS to match)
  const r = (tilt * Math.PI) / 180;
  const turn = ([x, y]: Pt): Pt => [PF / 2 + (x - PF / 2) * Math.cos(r) - (y - PF / 2) * Math.sin(r), PF / 2 + (x - PF / 2) * Math.sin(r) + (y - PF / 2) * Math.cos(r)];
  const c: Pt[] = ([[m + j(), m + j()], [PF - m + j(), m + j()], [PF - m + j(), PF - m + j()], [m + j(), PF - m + j()]] as Pt[]).map(turn);
  const len = (e: number) => Math.hypot(c[(e + 1) % 4][0] - c[e][0], c[(e + 1) % 4][1] - c[e][1]);

  // choose: the hand-picked ones first, then seeded picks until 3-4 doodles are placed
  const placed: Placed[] = [];
  const free = new Set([0, 1, 2, 3]);
  const place = (name: DoodleName | "wings") => {
    if (name === "wings") {
      if (!free.has(1) || !free.has(3)) return false;
      const L1 = len(1);
      const pos = 18 + rnd() * (L1 * 0.35);
      placed.push({ edge: 1, pos, segs: WING_UP_AT_START, w: WING_W }, { edge: 3, pos: len(3) - pos - WING_W * k, segs: WING_UP_AT_END, w: WING_W });
      free.delete(1);
      free.delete(3);
      return true;
    }
    const dd: Doodle = DOODLES[name];
    const options = [...free].filter((e) => !dd.edges || dd.edges.includes(e));
    if (!options.length) return false;
    const edge = options[Math.floor(rnd() * options.length)];
    const span = dd.w * k;
    placed.push({ edge, pos: 20 + rnd() * Math.max(0, len(edge) - span - 40), segs: dd.segs, w: dd.w });
    free.delete(edge);
    return true;
  };
  for (const p of PICKS[slug] ?? []) place(p);
  const names = [...(Object.keys(DOODLES) as DoodleName[]), "wings", "wings", "mascot"] as (DoodleName | "wings")[];
  const want = rnd() < 0.5 ? 3 : 4;
  for (let tries = 0; placed.length < want && free.size && tries < 40; tries++) {
    const name = names[Math.floor(rnd() * names.length)];
    if (placed.some((p) => p.segs === (name === "wings" ? WING_UP_AT_START : (DOODLES as Record<string, Doodle>)[name]?.segs))) continue;
    place(name);
  }

  let d = `M${f1(c[0][0])} ${f1(c[0][1])}`;
  for (let e = 0; e < 4; e++) {
    const a = c[e];
    const b = c[(e + 1) % 4];
    const L = len(e);
    const t: Pt = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const n: Pt = [t[1], -t[0]]; // outward, for a clockwise loop on screen
    for (const p of placed.filter((q) => q.edge === e).sort((x, y) => x.pos - y.pos)) {
      const o: Pt = [a[0] + t[0] * p.pos, a[1] + t[1] * p.pos];
      d += ` L${f1(o[0])} ${f1(o[1])} ${alongEdge(p.segs, o, t, n, k)}`;
    }
    d += ` L${f1(b[0])} ${f1(b[1])}`;
  }
  return { d, tilt };
}

/** The member's photo inside its hand-drawn frame. The line draws itself when `active`
 * turns on, or (with `drawInView`) the first time it scrolls into view.
 *
 * `blend`: draw the line in difference mode, so it stays visible over whatever it crosses
 * (dark over the paper panel, light where it runs into the black tab bar). That only works
 * if nothing between the line and the card makes a stacking context, which is why the
 * wrapper itself is never transformed: the photo is turned on its own, and the frame path
 * is computed already turned. */
export function FramedPhoto({
  slug,
  src,
  active = true,
  drawInView = false,
  blend = false,
  sizes = "336px",
  className,
}: {
  slug: string;
  src: string;
  active?: boolean;
  drawInView?: boolean;
  blend?: boolean;
  sizes?: string;
  className?: string;
}) {
  const { d, tilt } = useMemo(() => photoFrameFor(slug), [slug]);
  const line = { duration: 2.8, delay: 0.25, ease: [0.45, 0, 0.25, 1] as const };
  const tone = blend ? "stroke-paper" : "stroke-ink";
  return (
    <div className={cn("pointer-events-none", className)}>
      <div
        className={cn("absolute inset-0 border-[5px] border-paper bg-paper outline-2 outline-ink transition-[filter,scale] duration-1000", SOFT, active ? "scale-[1.015] grayscale-0" : "grayscale-[0.6]")}
        style={{ rotate: `${tilt.toFixed(2)}deg` }}
      >
        <div className="relative size-full overflow-hidden">
          <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
        </div>
      </div>
      {/* the frame box is PF wide with the photo at 20..PF-20: 118% of the photo, offset 9% */}
      <svg aria-hidden viewBox={`0 0 ${PF} ${PF}`} className={cn("absolute -inset-[9%] size-[118%] overflow-visible", blend && "mix-blend-difference")}>
        {drawInView ? (
          <motion.path d={d} {...stroke} className={tone} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, amount: 0.5 }} transition={line} />
        ) : (
          <motion.path
            key={String(active)}
            d={d}
            {...stroke}
            className={cn(tone, "transition-opacity duration-700", !active && "opacity-40")}
            // keyframes rather than `initial`, so the draw runs even where a parent turns initial animations off
            animate={{ pathLength: active ? [0, 1] : 1 }}
            transition={active ? line : { duration: 0 }}
          />
        )}
      </svg>
    </div>
  );
}
