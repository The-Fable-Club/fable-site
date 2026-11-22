"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

// Easing for things that answer the pointer: quick to start, long soft landing.
const SOFT = "ease-[cubic-bezier(0.22,1,0.36,1)]";
// No vector-effect="non-scaling-stroke": the frame's svg is scaled (a 264-unit viewBox shown
// at ~200-320px), and with that setting browsers miscompute the dash a pathLength draw uses,
// so a half-drawn line showed gaps and jumped. 1.7 units comes out at about 2px.
const stroke = { fill: "none", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

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
export type Seg = (string | number)[];
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

// A bird's wing, raised: the trailing edge fans out into five primary feathers from the
// lower attachment to the tip, the leading edge curves back to the upper attachment, and
// three covert lines suggest the feather layers. Drawn with the tip toward the end of the
// edge (u = WING_W); the mirror puts it at the start, for the other side.
const WING_W = 52;
const WING_OUTLINE: Seg[] = [
  ["Q", -8, -10, -2, -20], ["Q", 4, -22, 6, -18],
  ["Q", 0, -30, 6, -36], ["Q", 12, -38, 14, -32],
  ["Q", 10, -46, 18, -52], ["Q", 24, -54, 26, -46],
  ["Q", 26, -60, 36, -64], ["Q", 42, -64, 42, -56],
  ["Q", 46, -70, 58, -74],
  ["C", 58, -50, 60, -22, 52, 0],
];
const WING_COVERTS: Seg[] = [["M", 10, -8], ["Q", 22, -18, 24, -34], ["M", 24, -6], ["Q", 36, -18, 40, -44], ["M", 38, -4], ["Q", 48, -14, 50, -34]];

/** The same outline drawn the other way round and flipped along the edge (L, Q and C only). */
function mirrored(segs: Seg[], w: number): Seg[] {
  const fx = (x: number) => w - x;
  const ends: Pt[] = [[0, 0]];
  for (const sg of segs) ends.push([sg[sg.length - 2] as number, sg[sg.length - 1] as number]);
  const out: Seg[] = [];
  for (let i = segs.length - 1; i >= 0; i--) {
    const [cmd, ...v] = segs[i] as [string, ...number[]];
    const to = ends[i];
    if (cmd === "Q") out.push(["Q", fx(v[0]), v[1], fx(to[0]), to[1]]);
    else if (cmd === "C") out.push(["C", fx(v[2]), v[3], fx(v[0]), v[1], fx(to[0]), to[1]]);
    else out.push(["L", fx(to[0]), to[1]]);
  }
  return out;
}
const flipM = (segs: Seg[], w: number): Seg[] => segs.map(([cmd, ...v]) => [cmd, ...(v as number[]).map((n, i) => (i % 2 ? n : w - n))]);
const WING_TIP_AT_END: Seg[] = [...WING_OUTLINE, ...WING_COVERTS, ["M", WING_W, 0]];
const WING_TIP_AT_START: Seg[] = [...mirrored(WING_OUTLINE, WING_W), ...flipM(WING_COVERTS, WING_W), ["M", WING_W, 0]];

// The left edge is drawn bottom to top and the right edge top to bottom, so "tip at the end"
// raises a wing on the left and "tip at the start" raises one on the right.
type Pick = DoodleName | "wings" | "wingL" | "wingR";

/** Hand-picked doodles for some people, optionally on a given edge ("heart@1"); the rest are
 * seeded from the slug. Edges: 0 top, 1 right, 2 bottom, 3 left. */
const PICKS: Record<string, `${Pick}${"" | `@${0 | 1 | 2 | 3}`}`[]> = {
  "harsha-vardan-m-sakamuri": ["catEars@0", "heart@1", "wingL@3"],
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

/** True from the first time `on` is true, and stays true: a drawing that has begun keeps
 * going when the highlight moves on, and isn't started again when it comes back. */
export function useStarted(on: boolean) {
  const [started, setStarted] = useState(on);
  if (on && !started) setStarted(true); // adjusting state from props during render, not in an effect
  return started;
}

export type Pt = [number, number];
const f1 = (n: number) => n.toFixed(1);

/** Doodle segments laid along an edge: u runs along `t`, outward (-v) along `n`, scaled by k. */
export function alongEdge(segs: Seg[], o: Pt, t: Pt, n: Pt, k: number): string {
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

// Events get their own set: things from a club event rather than from a person.
const dotS = (x: number, y: number, r: number): Seg[] => [["M", x, y], ["A", r, r, 0, 0, 1, x, y - 2 * r], ["A", r, r, 0, 0, 1, x, y]];
const EVENT_DOODLES: Record<string, Doodle> = {
  // a microphone on a stand
  mic: { w: 40, segs: [["L", 20, 0], ["L", 20, -16], ["M", 12, -26], ["A", 8, 8, 0, 0, 0, 28, -26], ["M", 15, -26], ["L", 15, -42], ["A", 5, 5, 0, 0, 1, 25, -42], ["L", 25, -26], ["A", 5, 5, 0, 0, 1, 15, -26], ["M", 40, 0]] },
  // a trophy with handles
  trophy: { w: 40, segs: [["L", 10, 0], ["L", 10, -5], ["L", 30, -5], ["L", 30, 0], ["M", 20, -5], ["L", 20, -14], ["M", 8, -38], ["L", 32, -38], ["C", 32, -22, 24, -16, 20, -14], ["C", 16, -16, 8, -22, 8, -38], ["M", 8, -34], ["C", 0, -34, 0, -24, 9, -24], ["M", 32, -34], ["C", 40, -34, 40, -24, 31, -24], ["M", 30, 0], ["L", 40, 0]] },
  // a burst of confetti
  confetti: { w: 40, segs: [["L", 20, 0], ["L", 20, -12], ["L", 10, -30], ["M", 20, -12], ["L", 20, -36], ["M", 20, -12], ["L", 30, -30], ["M", 6, -38], ["L", 9, -42], ["M", 33, -40], ["L", 30, -45], ["M", 19, -45], ["L", 22, -49], ["M", 2, -26], ["L", 5, -24], ["M", 38, -24], ["L", 35, -22], ["M", 20, 0], ["L", 40, 0]] },
  // a calendar page with its rings
  calendar: { w: 44, segs: [["L", 6, 0], ["L", 6, -34], ["L", 38, -34], ["L", 38, 0], ["M", 6, -26], ["L", 38, -26], ["M", 14, -38], ["L", 14, -30], ["M", 30, -38], ["L", 30, -30], ["M", 13, -18], ["L", 17, -18], ["M", 21, -18], ["L", 25, -18], ["M", 29, -18], ["L", 33, -18], ["M", 13, -10], ["L", 17, -10], ["M", 21, -10], ["L", 25, -10], ["M", 38, 0], ["L", 44, 0]] },
  // a ticket, notched, with its tear line
  ticket: { w: 46, segs: [["L", 4, 0], ["L", 4, -10], ["A", 4, 4, 0, 0, 0, 4, -18], ["L", 4, -28], ["L", 42, -28], ["L", 42, -18], ["A", 4, 4, 0, 0, 0, 42, -10], ["L", 42, 0], ["M", 30, -26], ["L", 30, -22], ["M", 30, -17], ["L", 30, -13], ["M", 30, -8], ["L", 30, -4], ["M", 42, 0], ["L", 46, 0]] },
  // a balloon on a wavy string
  balloon: { w: 36, segs: [["L", 18, 0], ["C", 14, -6, 22, -12, 18, -18], ["L", 15, -21], ["L", 21, -21], ["L", 18, -18], ["M", 18, -21], ["A", 10, 12, 0, 0, 1, 18, -45], ["A", 10, 12, 0, 0, 1, 18, -21], ["M", 13, -36], ["C", 13, -40, 15, -42, 17, -42], ["M", 18, 0], ["L", 36, 0]] },
  // a light bulb, for workshops
  bulb: { w: 40, segs: [["L", 14, 0], ["L", 14, -8], ["L", 26, -8], ["L", 26, 0], ["M", 14, -8], ["C", 6, -16, 6, -38, 20, -38], ["C", 34, -38, 34, -16, 26, -8], ["M", 16, -14], ["L", 24, -14], ["M", 20, -42], ["L", 20, -48], ["M", 8, -36], ["L", 4, -40], ["M", 32, -36], ["L", 36, -40], ["M", 26, 0], ["L", 40, 0]] },
  // a flag on a pole
  flag: { w: 36, segs: [["L", 8, 0], ["L", 8, -42], ["L", 30, -36], ["L", 8, -28], ["M", 8, 0], ["L", 36, 0]] },
  // a rocket taking off
  rocket: { w: 40, segs: [["L", 12, 0], ["L", 14, -8], ["L", 14, -30], ["Q", 14, -42, 20, -48], ["Q", 26, -42, 26, -30], ["L", 26, -8], ["L", 28, 0], ["M", 14, -12], ["L", 8, -4], ["M", 26, -12], ["L", 32, -4], ...dotS(20, -26, 3), ["M", 17, 0], ["L", 20, 7], ["L", 23, 0], ["M", 28, 0], ["L", 40, 0]] },
  // a speech bubble, for talks
  talk: { w: 44, segs: [["L", 10, 0], ["L", 14, -8], ["L", 40, -8], ["L", 40, -34], ["L", 6, -34], ["L", 6, -8], ["L", 10, -8], ["M", 13, -21], ["L", 33, -21], ["M", 13, -15], ["L", 26, -15], ["M", 14, -8], ["L", 10, 0], ["M", 10, 0], ["L", 44, 0]] },
};

export const PF = 264; // design size of a square frame's box; the photo sits at 20..244 inside it
const PAD = 20; // the photo sits PAD design units inside the frame's box on every side

type Placed = { edge: number; pos: number; segs: Seg[]; w: number };

/** The frame path and tilt for one member. Edges: 0 top, 1 right, 2 bottom, 3 left.
 * The loop starts (and ends) on `startEdge`, at a spot clear of doodles: that is where a line
 * from the previous person's frame arrives, or leaves for the next one. `start` is that
 * point, in the frame's design units. */
export type FrameOpts = {
  /** the frame box's width in design units (doodles are a fixed size in these units, so a
   * bigger box makes them smaller next to the photo); default PF */
  width?: number;
  /** width / height of the photo (square by default) */
  aspect?: number;
  /** which doodles: the people's (with the hand-picked ones) or the events' */
  set?: "people" | "events";
  /** straight: no tilt and no corner wobble (a card border rather than a snapshot) */
  flat?: boolean;
  /** doodle scale (default 1.35) */
  k?: number;
};

/** The frame box's size in design units for these options. */
export function frameBox(o: FrameOpts = {}) {
  const W = o.width ?? PF;
  const inner = W - 2 * PAD;
  return { W, H: inner / (o.aspect ?? 1) + 2 * PAD };
}

export function photoFrameFor(slug: string, startEdge = 0, opts: FrameOpts = {}): { d: string; tilt: number; start: Pt } {
  const rnd = seeded(slug);
  const { W, H } = frameBox(opts);
  const wide = W / H > 1.3;
  // wide pictures lean less, or their far corners swing a long way
  const lean = (rnd() < 0.5 ? -1 : 1) * (wide ? 0.8 + rnd() * 1.2 : 2.5 + rnd() * 3);
  const tilt = opts.flat ? 0 : lean;
  const k = opts.k ?? 1.35;
  const m = 12; // the frame line sits 8 design units outside the photo
  const j = () => (opts.flat ? (rnd(), 0) : (rnd() - 0.5) * 6); // hand-drawn wobble at the corners
  // corners, then the whole frame turned by the tilt (the photo is turned by CSS to match)
  const r = (tilt * Math.PI) / 180;
  const turn = ([x, y]: Pt): Pt => [W / 2 + (x - W / 2) * Math.cos(r) - (y - H / 2) * Math.sin(r), H / 2 + (x - W / 2) * Math.sin(r) + (y - H / 2) * Math.cos(r)];
  const c: Pt[] = ([[m + j(), m + j()], [W - m + j(), m + j()], [W - m + j(), H - m + j()], [m + j(), H - m + j()]] as Pt[]).map(turn);
  const events = opts.set === "events";
  const len = (e: number) => Math.hypot(c[(e + 1) % 4][0] - c[e][0], c[(e + 1) % 4][1] - c[e][1]);

  // choose: the hand-picked ones first, then seeded picks until 3-4 doodles are placed
  const placed: Placed[] = [];
  const free = new Set([0, 1, 2, 3]);
  const wingAt = (edge: number) => (edge === 3 ? WING_TIP_AT_END : WING_TIP_AT_START);
  const place = (name: Pick, onEdge?: number) => {
    if (name === "wings") {
      if (!free.has(1) || !free.has(3)) return false;
      const pos = 18 + rnd() * (len(1) * 0.3);
      placed.push({ edge: 1, pos, segs: wingAt(1), w: WING_W }, { edge: 3, pos: len(3) - pos - WING_W * k, segs: wingAt(3), w: WING_W });
      free.delete(1);
      free.delete(3);
      return true;
    }
    if (name === "wingL" || name === "wingR") {
      const edge = name === "wingL" ? 3 : 1;
      if (!free.has(edge)) return false;
      const pos = edge === 3 ? len(3) * (0.42 + rnd() * 0.2) : 18 + rnd() * len(1) * 0.3; // tip up near the top either way
      placed.push({ edge, pos, segs: wingAt(edge), w: WING_W });
      free.delete(edge);
      return true;
    }
    const dd: Doodle = events ? EVENT_DOODLES[name] : DOODLES[name as DoodleName];
    const options = [...free].filter((e) => (onEdge === undefined || e === onEdge) && (!dd.edges || dd.edges.includes(e)));
    if (!options.length) return false;
    const edge = options[Math.floor(rnd() * options.length)];
    const span = dd.w * k;
    placed.push({ edge, pos: 20 + rnd() * Math.max(0, len(edge) - span - 40), segs: dd.segs, w: dd.w });
    free.delete(edge);
    return true;
  };
  for (const pick of events ? [] : (PICKS[slug] ?? [])) {
    const [name, at] = pick.split("@");
    place(name as Pick, at === undefined ? undefined : Number(at));
  }
  // wings are Harsha's (PICKS): they stay out of everyone else's random mix
  const names = (events ? Object.keys(EVENT_DOODLES) : [...(Object.keys(DOODLES) as DoodleName[]), "mascot"]) as Pick[];
  const used = new Set<string>((events ? [] : (PICKS[slug] ?? [])).map((x) => x.split("@")[0]));
  const want = rnd() < 0.5 ? 3 : 4;
  for (let tries = 0; placed.length < want && free.size && tries < 40; tries++) {
    const name = names[Math.floor(rnd() * names.length)];
    if (used.has(name) || (name.startsWith("wing") && [...used].some((u) => u.startsWith("wing")))) continue;
    if (place(name)) used.add(name);
  }


  // the part of edge e between `from` and `to` (distances along it), doodles included
  const part = (e: number, from: number, to: number) => {
    const a = c[e];
    const b = c[(e + 1) % 4];
    const L = len(e);
    const t: Pt = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const n: Pt = [t[1], -t[0]]; // outward, for a clockwise loop on screen
    let out = "";
    for (const p of placed.filter((q) => q.edge === e && q.pos >= from && q.pos < to).sort((x, y) => x.pos - y.pos)) {
      const o: Pt = [a[0] + t[0] * p.pos, a[1] + t[1] * p.pos];
      out += ` L${f1(o[0])} ${f1(o[1])} ${alongEdge(p.segs, o, t, n, k)}`;
    }
    const end: Pt = [a[0] + t[0] * to, a[1] + t[1] * to];
    return out + ` L${f1(end[0])} ${f1(end[1])}`;
  };
  // where to start on that edge: the middle if it is free, else the nearest clear spot
  const e0 = ((startEdge % 4) + 4) % 4;
  const L0 = len(e0);
  const busy = placed.filter((q) => q.edge === e0).map((q) => [q.pos - 6, q.pos + q.w * k + 6]);
  const sPos = [0.5, 0.35, 0.65, 0.2, 0.8, 0.08].map((f) => f * L0).find((x) => !busy.some(([lo, hi]) => x > lo && x < hi)) ?? 0;
  const a0 = c[e0];
  const b0 = c[(e0 + 1) % 4];
  const start: Pt = [a0[0] + ((b0[0] - a0[0]) * sPos) / L0, a0[1] + ((b0[1] - a0[1]) * sPos) / L0];
  let d = `M${f1(start[0])} ${f1(start[1])}` + part(e0, sPos, L0);
  for (let i = 1; i < 4; i++) d += part((e0 + i) % 4, 0, len((e0 + i) % 4));
  d += part(e0, 0, sPos);
  return { d, tilt, start };
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
  startEdge = 0,
  progress,
  svgRef,
  outsideTone,
  aspect,
  width,
  doodles = "people",
  stroke: strokeClass,
  children,
  className,
}: {
  slug: string;
  /** the picture; or pass `children` to frame something else (a video, a figure) */
  src?: string;
  active?: boolean;
  drawInView?: boolean;
  blend?: boolean;
  sizes?: string;
  /** where the line starts and ends (see photoFrameFor) */
  startEdge?: number;
  /** drive the drawing from outside: 0..1 is how much of the frame is drawn */
  progress?: MotionValue<number>;
  /** the frame's svg, for lining up a line that joins it */
  svgRef?: (el: SVGSVGElement | null) => void;
  /** with `blend`: the stroke class for the parts of the line outside the card, where the
   * difference blend has nothing of the card under it (pale on dark backdrops, ink on light) */
  outsideTone?: string;
  /** width / height of the photo; give the wrapper the same aspect ratio (default square) */
  aspect?: number;
  /** frame box width in design units (see FrameOpts) */
  width?: number;
  doodles?: "people" | "events";
  /** the line's colour class when not blending (default ink; pale on dark cards) */
  stroke?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const opts = useMemo<FrameOpts>(() => ({ aspect, width, set: doodles }), [aspect, width, doodles]);
  const { d, tilt } = useMemo(() => photoFrameFor(slug, startEdge, opts), [slug, startEdge, opts]);
  // where the frame's svg sits around the photo: the photo is the box less PAD on each side
  const { W, H } = frameBox(opts);
  const box = {
    left: `${(-PAD / (W - 2 * PAD)) * 100}%`,
    top: `${(-PAD / (H - 2 * PAD)) * 100}%`,
    width: `${(W / (W - 2 * PAD)) * 100}%`,
    height: `${(H / (H - 2 * PAD)) * 100}%`,
  };
  const started = useStarted(active);
  const none = useMotionValue(0);
  const driven = useTransform(progress ?? none, (v) => Math.min(1, Math.max(0, v)));
  const line = { duration: 2.8, delay: 0.25, ease: [0.45, 0, 0.25, 1] as const };
  const tone = blend ? "stroke-paper" : (strokeClass ?? "stroke-ink");

  // The blend only sees the card (the card is its own stacking context), so beyond the card's
  // edge the blended line comes out pale whatever is behind it, and vanishes on a light
  // backdrop. So the line is drawn twice: blended and clipped to the card, and plain in
  // `outsideTone` and clipped to everything outside it. The card's box is measured in the
  // frame's units (it moves with the frame when the card lifts, so only resizes change it).
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);
  const setRef = useCallback(
    (el: SVGSVGElement | null) => {
      setSvgEl(el);
      svgRef?.(el);
    },
    [svgRef],
  );
  const split = Boolean(blend && outsideTone && progress);
  const [card, setCard] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useEffect(() => {
    const svg = svgEl;
    const art = svg?.closest("article");
    if (!split || !svg || !art) return;
    const measure = () => {
      const r = svg.getBoundingClientRect();
      const a = art.getBoundingClientRect();
      if (!r.width) return;
      const k = W / r.width;
      setCard({ x: (a.left - r.left) * k, y: (a.top - r.top) * k, w: a.width * k, h: a.height * k });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(art);
    return () => ro.disconnect();
  }, [split, svgEl, W]);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inId = `fin-${uid}`;
  const outId = `fout-${uid}`;
  return (
    <div className={cn("pointer-events-none", className)}>
      <div
        className={cn("absolute inset-0 border-[5px] border-paper bg-paper outline-2 outline-ink transition-[filter,scale] duration-1000", SOFT, active ? "scale-[1.015] grayscale-0" : "grayscale-[0.6]")}
        style={{ rotate: `${tilt.toFixed(2)}deg` }}
      >
        <div className="relative size-full overflow-hidden">
          {children ?? (src && <Image src={src} alt="" fill sizes={sizes} className="object-cover" />)}
        </div>
      </div>
      <svg ref={setRef} aria-hidden viewBox={`0 0 ${W} ${H}`} style={box} className={cn("absolute overflow-visible", blend && "mix-blend-difference")}>
        {split && card && (
          <defs>
            <clipPath id={inId}>
              <rect x={card.x} y={card.y} width={card.w} height={card.h} />
            </clipPath>
          </defs>
        )}
        {progress ? (
          <motion.path
            d={d}
            {...stroke}
            clipPath={split && card ? `url(#${inId})` : undefined}
            className={cn(tone, "transition-opacity duration-700", !active && "opacity-40")}
            style={{ pathLength: driven }}
          />
        ) : drawInView ? (
          <motion.path d={d} {...stroke} className={tone} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, amount: 0.5 }} transition={line} />
        ) : (
          // drawn once, the first time the card lights; dimming later doesn't stop or restart it
          <motion.path
            d={d}
            {...stroke}
            className={cn(tone, "transition-opacity duration-700", !active && "opacity-40")}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: started ? 1 : 0 }}
            transition={line}
          />
        )}
      </svg>
      {split && card && (
        <svg aria-hidden viewBox={`0 0 ${W} ${H}`} style={box} className="absolute overflow-visible">
          <defs>
            <clipPath id={outId}>
              {/* everything except the card: a huge box with the card cut out of it */}
              <path clipRule="evenodd" d={`M-4000 -4000H4000V4000H-4000Z M${card.x} ${card.y}h${card.w}v${card.h}h${-card.w}Z`} />
            </clipPath>
          </defs>
          <motion.path
            d={d}
            {...stroke}
            clipPath={`url(#${outId})`}
            className={cn(outsideTone, "transition-opacity duration-700", !active && "opacity-40")}
            style={{ pathLength: driven }}
          />
        </svg>
      )}
    </div>
  );
}
