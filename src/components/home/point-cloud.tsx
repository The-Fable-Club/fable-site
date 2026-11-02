"use client";

import { useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

// The "What we're for" wheel, after Endfield's lore model viewer.
//
// - A tick ring and a 3D point-cloud model share ONE rotation: they orbit
//   together, and dragging either turns both.
// - Rotation is horizontal only (like Endfield). The model is allowed to
//   leak well outside the ring.
// - First appearance: a laser scans the model into place, top to bottom.
// - Changing model: the points of one shape flow into the next. Each point
//   lifts off in turn (top first), swirls out and round the axis, and lands
//   in its place in the new shape, while the wheel spins up like a flywheel.
// - Performance: points are drawn in a handful of batched paths (not one fill
//   each), orbit speed is time-based, and quality scales itself down when
//   frames get slow (e.g. laptop on battery).
//
// Models are generated in code (no licences): the club's sprout mark, an open
// book, building blocks, a spiral stair and the network globe.

export type ModelKey = "sprout" | "book" | "blocks" | "steps" | "network";

export const MODEL_LABEL: Record<ModelKey, string> = {
  sprout: "Sprout",
  book: "Open book",
  blocks: "Building blocks",
  steps: "Spiral stair",
  network: "Network globe",
};

const N = 3600;
type V3 = [number, number, number];
/** A sampled point, and whether it is drawn in clay (accent) rather than paper. */
type P = [number, number, number, boolean];

const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const r3 = (n: number) => Math.round(n * 1000) / 1000; // Node/browser float digits differ, hydration warnings
const pick = <T,>(weights: [number, T][]): T => {
  let r = Math.random() * weights.reduce((s, [w]) => s + w, 0);
  for (const [w, v] of weights) if ((r -= w) <= 0) return v;
  return weights[weights.length - 1][1];
};
const withColor = (p: V3, clay: boolean): P => [p[0], p[1], p[2], clay];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const rotY = ([x, y, z]: V3, a: number): V3 => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];

/** A point on the surface of a sphere. */
function onSphere(c: V3, r: number): V3 {
  const u = rnd(-1, 1);
  const t = rnd(0, Math.PI * 2);
  const s = Math.sqrt(1 - u * u);
  return [c[0] + r * s * Math.cos(t), c[1] + r * u, c[2] + r * s * Math.sin(t)];
}

/** A point on a thin tube from a to b (a stem, a branch, a rail). */
function onTube(a: V3, b: V3, r: number): V3 {
  const t = Math.random();
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const n: V3 = [d[0] / len, d[1] / len, d[2] / len];
  const h: V3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u: V3 = [n[1] * h[2] - n[2] * h[1], n[2] * h[0] - n[0] * h[2], n[0] * h[1] - n[1] * h[0]];
  const ul = Math.hypot(u[0], u[1], u[2]) || 1;
  const e1: V3 = [u[0] / ul, u[1] / ul, u[2] / ul];
  const e2: V3 = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]];
  const ang = rnd(0, Math.PI * 2);
  const c = Math.cos(ang) * r;
  const sn = Math.sin(ang) * r;
  return [a[0] + d[0] * t + e1[0] * c + e2[0] * sn, a[1] + d[1] * t + e1[1] * c + e2[1] * sn, a[2] + d[2] * t + e1[2] * c + e2[2] * sn];
}

/** A point on a cube surface: mostly on its edges (so it reads as a solid), some on the faces. */
function onCube(c0: V3, s: number, edgeShare: number): V3 {
  const c = [rnd(-s, s), rnd(-s, s), rnd(-s, s)];
  const axis = Math.floor(rnd(0, 3));
  const a = (axis + 1) % 3;
  const b = (axis + 2) % 3;
  c[a] = Math.random() < 0.5 ? -s : s;
  if (Math.random() < edgeShare) c[b] = Math.random() < 0.5 ? -s : s;
  return [c0[0] + c[0], c0[1] + c[1], c0[2] + c[2]];
}

// The club sprout mark grown into 3D: a stem, two pairs of branches turned in
// different directions so it has depth, five clay seed-nodes and the halo.
const MK = 1 / 300; // mark units to model units, centred on the mark
const m = (x: number, y: number): [number, number] => [(x - 512) * MK, (560 - y) * MK];
const LOW = 0.55; // the lower pair of branches turns one way, the upper pair the other
const UP = -0.55;
const flat = (pt: [number, number], side: 1 | -1, turn: number): V3 => rotY([pt[0] * side, pt[1], 0], turn);
const S_BASE: V3 = [...m(512, 800), 0];
const S_FORK: V3 = [...m(512, 614), 0];
const S_TOP: V3 = [...m(512, 330), 0];
const NODE_R = 46 * MK;
const SEEDS: [V3, number][] = [
  [S_TOP, NODE_R],
  [flat(m(330, 682), -1, LOW), NODE_R * 1.05],
  [flat(m(330, 682), 1, LOW), NODE_R * 1.05],
  [flat(m(330, 492), -1, UP), NODE_R],
  [flat(m(330, 492), 1, UP), NODE_R],
];
const BRANCHES: [V3, V3][] = [
  [S_BASE, flat(m(364, 706), -1, LOW)],
  [S_BASE, flat(m(364, 706), 1, LOW)],
  [S_FORK, flat(m(364, 516), -1, UP)],
  [S_FORK, flat(m(364, 516), 1, UP)],
];
function sprout(): P {
  const part = pick<string>([
    [13, "stem"],
    [24, "branch"],
    [41, "seed"],
    [18, "halo"],
    [4, "dust"],
  ]);
  if (part === "stem") return withColor(onTube(S_BASE, [S_TOP[0], S_TOP[1] - NODE_R, 0], 0.028), false);
  if (part === "branch") {
    const [a, b] = BRANCHES[Math.floor(rnd(0, 4))];
    return withColor(onTube(a, b, 0.024), false);
  }
  if (part === "seed") {
    const [c, r] = SEEDS[Math.floor(rnd(0, 5))];
    return withColor(onSphere(c, r), true);
  }
  if (part === "halo") {
    // a torus around the top seed, facing the viewer
    const t = rnd(0, Math.PI * 2);
    const R = 106 * MK;
    const tube = rnd(0, Math.PI * 2);
    const rr = 0.022;
    const cy = m(512, 326)[1];
    return [(R + rr * Math.cos(tube)) * Math.cos(t), cy + (R + rr * Math.cos(tube)) * Math.sin(t), rr * Math.sin(tube), Math.random() < 0.08];
  }
  // a few motes drifting up from the base
  const a = rnd(0, Math.PI * 2);
  const r = rnd(0.1, 0.75);
  return [Math.cos(a) * r, S_BASE[1] + rnd(0, 0.5) * Math.random(), Math.sin(a) * r, Math.random() < 0.2];
}

// An open book: two bowed page blocks, ruled text lines, pages fanning over,
// and a clay ribbon falling from the spine.
const BW = 0.9;
const BH = 0.62;
/** A page leaving the spine at angle phi, bowing gently. */
const pagePoint = (side: number, phi: number, u: number, v: number): V3 => {
  const bow = 0.12 * Math.sin(Math.PI * u);
  return [side * u * BW * Math.cos(phi), v, -u * BW * Math.sin(phi) - bow * Math.cos(phi) + 0.12];
};
function book(): P {
  const part = pick<string>([
    [30, "text"],
    [26, "outline"],
    [20, "fan"],
    [10, "block"],
    [5, "spine"],
    [9, "ribbon"],
  ]);
  const side = Math.random() < 0.5 ? -1 : 1;
  if (part === "text") {
    // ruled text lines inside a margin, short last lines of paragraphs
    const row = Math.floor(rnd(0, 8));
    const lineEnd = row % 4 === 3 ? 0.55 : 0.88;
    return withColor(pagePoint(side, 0.3, rnd(0.14, lineEnd), BH - 0.2 - row * 0.15), false);
  }
  if (part === "outline") {
    // the page edges: top, bottom and the outer edge, so it reads as a page
    const e = Math.random();
    if (e < 0.36) return withColor(pagePoint(side, 0.3, rnd(0.02, 1), BH), false);
    if (e < 0.72) return withColor(pagePoint(side, 0.3, rnd(0.02, 1), -BH), false);
    return withColor(pagePoint(side, 0.3, 1, rnd(-BH, BH)), false);
  }
  if (part === "fan") {
    // three pages mid-turn on the right: outlines with a few lines
    const k = Math.floor(rnd(0, 3));
    const phi = 0.55 + k * 0.38;
    const e = Math.random();
    if (e < 0.3) return withColor(pagePoint(1, phi, rnd(0.02, 1), Math.random() < 0.5 ? BH : -BH), false);
    if (e < 0.5) return withColor(pagePoint(1, phi, 1, rnd(-BH, BH)), false);
    const row = Math.floor(rnd(0, 8));
    return withColor(pagePoint(1, phi, rnd(0.14, 0.85), BH - 0.2 - row * 0.15), false);
  }
  if (part === "block") {
    // the thickness of the page block under each side
    const p = pagePoint(side, 0.3, rnd(0.03, 1), Math.random() < 0.5 ? -BH : BH);
    return [p[0], p[1], p[2] + rnd(0.01, 0.08), false];
  }
  if (part === "spine") return [rnd(-0.015, 0.015), rnd(-BH - 0.03, BH + 0.03), 0.12 + rnd(0, 0.06), false];
  // ribbon: from the top of the spine, curling down past the bottom edge
  const t = Math.random();
  return [Math.sin(t * 3.2) * 0.12, BH + 0.02 - t * (2 * BH + 0.35), 0.16 + t * 0.12, true];
}

// Building blocks: a stepped tower of cubes, with two clay blocks still floating into place.
const CUBE = 0.18;
const TOWER: V3[] = (() => {
  const g = 0.39;
  const out: V3[] = [];
  for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) out.push([x * g, -0.55, z * g]);
  for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5]] as const) out.push([x * g, -0.16, z * g]);
  out.push([-0.5 * g, 0.23, -0.5 * g]);
  return out;
})();
const FLOATING: V3[] = [
  [0.2, 0.55, 0.2],
  [0.5, 0.12, 0.42],
];
function blocks(): P {
  if (Math.random() < 0.8) return withColor(onCube(TOWER[Math.floor(rnd(0, TOWER.length))], CUBE, 0.72), false);
  const c = FLOATING[Math.random() < 0.55 ? 0 : 1];
  if (Math.random() < 0.12) {
    // the dotted path each floating block is coming down
    const t = Math.random();
    return [c[0], c[1] - CUBE - t * 0.3, c[2], true];
  }
  return withColor(add(rotY(onCube([0, 0, 0], CUBE * 0.92, 0.8), 0.5), c), true);
}

// A spiral stair: treads winding round a column, a clay handrail and a goal at the top.
const TREADS = 15;
const tY = (k: number) => -0.78 + k * 0.095;
const tA = (k: number) => k * 0.52;
function steps(): P {
  const part = pick<string>([
    [58, "tread"],
    [12, "column"],
    [20, "rail"],
    [10, "goal"],
  ]);
  if (part === "tread") {
    const k = Math.floor(rnd(0, TREADS));
    const a0 = tA(k);
    const outline = Math.random() < 0.45;
    let a = a0 + rnd(-0.2, 0.2);
    let r = rnd(0.1, 0.72);
    if (outline) {
      if (Math.random() < 0.5) r = 0.72; // the outer edge
      else a = a0 + (Math.random() < 0.5 ? -0.2 : 0.2); // the two side edges
    }
    return [Math.cos(a) * r, tY(k) - (Math.random() < 0.25 ? rnd(0, 0.05) : 0), Math.sin(a) * r, false];
  }
  if (part === "column") {
    const a = rnd(0, Math.PI * 2);
    return [Math.cos(a) * 0.07, rnd(-0.92, tY(TREADS) + 0.05), Math.sin(a) * 0.07, false];
  }
  if (part === "rail") {
    const k = rnd(0, TREADS - 1);
    return [Math.cos(tA(k)) * 0.76, tY(k) + 0.26, Math.sin(tA(k)) * 0.76, true];
  }
  const a = tA(TREADS - 1);
  return withColor(onSphere([Math.cos(a) * 0.4, tY(TREADS - 1) + 0.2, Math.sin(a) * 0.4], 0.1), true);
}

// The network globe, kept as it was (the club likes it).
let globeI = 0;
function network(): P {
  const i = globeI++;
  const clay = i % 11 === 0;
  if (i % 3 === 0) {
    const k = i / 3;
    const phi = Math.acos(1 - (2 * (k + 0.5)) / (N / 3));
    const th = Math.PI * (1 + Math.sqrt(5)) * k;
    return [0.85 * Math.cos(th) * Math.sin(phi), 0.85 * Math.cos(phi), 0.85 * Math.sin(th) * Math.sin(phi), clay];
  }
  const t = rnd(0, Math.PI * 2);
  const c: V3 = [Math.cos(t) * 0.86, Math.sin(t) * 0.86, 0];
  return withColor(i % 3 === 1 ? [c[0], 0, c[1]] : rotY([c[0], c[1], 0], Math.PI / 2.4), clay);
}

const BUILDERS: Record<ModelKey, () => P> = { sprout, book, blocks, steps, network };

/** Points stored top to bottom (with jitter): the laser places them in that order, and a morph pairs points by height. */
type Built = { pts: Float32Array; clay: Uint8Array };

function build(key: ModelKey): Built {
  globeI = 0;
  const raw = Array.from({ length: N }, () => BUILDERS[key]());
  const order = raw.map((p, i) => [-p[1] + rnd(-0.07, 0.07), i] as const).sort((a, b) => a[0] - b[0]);
  const pts = new Float32Array(N * 3);
  const clay = new Uint8Array(N);
  order.forEach(([, i], r) => {
    const p = raw[i];
    pts[r * 3] = p[0];
    pts[r * 3 + 1] = p[1];
    pts[r * 3 + 2] = p[2];
    clay[r] = p[3] ? 1 : 0;
  });
  return { pts, clay };
}

const IN_MS = 1300; // first appearance: the laser scan
const MORPH_MS = 1900; // every change after that: the points flow into the next shape
const IDLE_SPIN = 0.4; // rad/s: a slow, clearly moving orbit (time based, so low fps does not slow it)
const YAW0 = 0.6; // the first model starts from this angle
const PITCH = -0.22; // fixed: horizontal rotation only
const CAM = 3.8; // camera distance: bigger = flatter perspective
const TICKS = 72;
const DEPTH_ALPHA = [0.4, 0.62, 0.82, 1] as const;

type Props = { model: ModelKey; label?: string; caption?: string; className?: string };

export function Dial3D({ model, label, caption, className }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ring = useRef<SVGSVGElement>(null);
  const want = useRef<ModelKey>(model);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    want.current = model;
  }, [model]);

  useEffect(() => {
    const cv = canvas.current;
    const box = wrap.current;
    const ringEl = ring.current;
    if (!cv || !box || !ringEl) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = prefersReducedMotion();

    const built = {} as Record<ModelKey, Built>;
    (Object.keys(BUILDERS) as ModelKey[]).forEach((k) => (built[k] = build(k)));

    let shown: ModelKey = want.current;
    let phase: "in" | "idle" | "morph" = reduce ? "idle" : "in";
    let phaseStart = performance.now();
    // What is on screen right now (so a change mid-morph starts from where the points are),
    // where a morph started from, and each point's own swirl for the trip.
    const cur = new Float32Array(built[shown].pts);
    const curClay = new Uint8Array(built[shown].clay);
    const from = new Float32Array(N * 3);
    const fromClay = new Uint8Array(N);
    const swirl = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = onSphere([0, 0, 0], rnd(0.25, 0.75));
      swirl.set(v, i * 3);
    }

    let yaw = YAW0;
    let vDrag = 0; // rad/s from a drag release
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;

    // ---- adaptive quality ----------------------------------------------
    let level = 0; // 0 full · 1 lighter · 2 lightest
    let minLevel = 0; // raised when the device reports it is on battery
    let ema = 16.7;
    let slow = 0;
    let fast = 0;
    let prev = performance.now();
    let lastDraw = 0;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      dpr = level >= 2 ? 0.75 : level === 1 ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(cv);

    // Battery hint: start lighter when unplugged.
    type BatteryManager = EventTarget & { charging: boolean };
    let battery: BatteryManager | null = null;
    const onCharge = () => {
      minLevel = battery && !battery.charging ? 1 : 0;
      if (level < minLevel) {
        level = minLevel;
        resize();
      }
    };
    (navigator as unknown as { getBattery?: () => Promise<BatteryManager> })
      .getBattery?.()
      .then((b) => {
        battery = b;
        b.addEventListener("chargingchange", onCharge);
        onCharge();
      })
      .catch(() => undefined);

    // ---- one pointer handler for the whole wheel: ring and model turn together
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastT = performance.now();
      vDrag = 0;
      box.setPointerCapture(e.pointerId);
      box.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const now = performance.now();
      yaw += dx * 0.011;
      vDrag = Math.max(-14, Math.min(14, (dx * 0.011) / Math.max((now - lastT) / 1000, 0.008)));
      lastX = e.clientX;
      lastT = now;
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      box.style.cursor = "grab";
      try {
        box.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };
    box.addEventListener("pointerdown", down);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerup", up);
    box.addEventListener("pointercancel", up);

    const paths = Array.from({ length: 8 }, () => null as Path2D | null);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const frameMs = now - prev;
      prev = now;
      if (!visible) return;
      // When the device can't hold 60, hold a steady 30 instead of an uneven 20-28:
      // even pacing reads as smooth, uneven pacing reads as stutter.
      if (level >= 1 && now - lastDraw < 30) return;
      lastDraw = now;
      const dt = Math.min(frameMs / 1000, 0.05);

      // quality governor
      ema += (Math.min(frameMs, 100) - ema) * 0.08;
      if (ema > 26) {
        slow++;
        fast = 0;
      } else if (ema < 19) {
        fast++;
        slow = 0;
      }
      if (slow > 40 && level < 2) {
        level++;
        slow = 0;
        resize();
      } else if (fast > 400 && level > minLevel) {
        level--;
        fast = 0;
        resize();
      }
      const stride = level + 1;

      // ---- phase machine -------------------------------------------------
      if (want.current !== shown) {
        from.set(cur);
        fromClay.set(curClay);
        shown = want.current;
        vDrag = 0;
        if (reduce) {
          cur.set(built[shown].pts);
          curClay.set(built[shown].clay);
          phase = "idle";
        } else {
          phase = "morph";
          phaseStart = now;
        }
      }
      if (phase === "in" && now - phaseStart >= IN_MS) phase = "idle";
      if (phase === "morph" && now - phaseStart >= MORPH_MS) {
        cur.set(built[shown].pts);
        curClay.set(built[shown].clay);
        phase = "idle";
      }

      let spin = IDLE_SPIN;
      const alphaMul = 1;
      let scaleMul = 1;
      let reveal = 1;
      let focus = 0; // 0..1: how "flywheel-fast" the wheel is right now
      let mt = 1; // morph progress
      if (phase === "morph") {
        mt = clamp01((now - phaseStart) / MORPH_MS);
        const k = Math.sin(Math.PI * mt);
        spin += 9 * k * k;
        scaleMul = 1 - 0.1 * k;
        focus = 0.8 * k;
      } else if (phase === "in") {
        const t = clamp01((now - phaseStart) / IN_MS);
        reveal = ease(t);
        spin += 11 * (1 - t) * (1 - t);
        focus = 1 - ease(t);
      }
      if (reduce) spin = 0;
      if (!dragging) {
        yaw += (spin + vDrag) * dt;
        vDrag *= Math.exp(-dt * 3);
      }

      // ring follows the same rotation; it shrinks slightly at high speed
      ringEl.style.transform = `rotate(${((yaw * 180) / Math.PI).toFixed(2)}deg) scale(${(1 - 0.1 * focus).toFixed(3)})`;

      // ---- model ---------------------------------------------------------
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const { pts: to, clay: toClay } = built[shown];
      // Morph: each point leaves in turn (top first), swirls out and round, and lands in the new shape.
      if (phase === "morph") {
        for (let i = 0; i < N; i++) {
          const local = clamp01((mt - (i / N) * 0.38) / 0.62);
          const e = ease(local);
          const lift = Math.sin(Math.PI * e);
          const j = i * 3;
          let x = from[j] + (to[j] - from[j]) * e + swirl[j] * lift;
          const y = from[j + 1] + (to[j + 1] - from[j + 1]) * e + swirl[j + 1] * lift * 0.6;
          let z = from[j + 2] + (to[j + 2] - from[j + 2]) * e + swirl[j + 2] * lift;
          const tw = lift * 1.1; // twist round the vertical axis while in flight
          const ct = Math.cos(tw);
          const st = Math.sin(tw);
          [x, z] = [x * ct + z * st, -x * st + z * ct];
          cur[j] = x;
          cur[j + 1] = y;
          cur[j + 2] = z;
          curClay[i] = e > 0.5 ? toClay[i] : fromClay[i];
        }
      }
      const pts = phase === "morph" ? cur : to;
      const clayOf = phase === "morph" ? curClay : toClay;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const pitch = PITCH + (reduce ? 0 : Math.sin(now / 2600) * 0.03);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const ringSize = Math.min(w, h) / 1.8; // canvas is 180% of the ring box
      const scale = ringSize * 0.54 * scaleMul;
      const cx0 = w / 2;
      const cy0 = h / 2;
      const emitX = cx0;
      const emitY = cy0 - ringSize * 0.6;
      const AGE = 0.07;
      const sizeK = Math.sqrt(stride);

      for (let b = 0; b < 8; b++) paths[b] = new Path2D();

      for (let i = 0; i < N; i += stride) {
        const age = phase === "in" ? (reveal - i / N) / AGE : 2;
        if (phase === "in" && age < 0) continue; // not placed yet

        const j = i * 3;
        const x = pts[j];
        const y = pts[j + 1];
        const z = pts[j + 2];
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const y2 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;
        const persp = CAM / (CAM + z2);
        const px = cx0 + x1 * scale * persp;
        const py = cy0 - y2 * scale * persp;
        const clay = clayOf[i] === 1;

        const fresh = age >= 0 && age < 1 ? 1 - age : 0;
        if (fresh > 0) {
          // laser beam from the emitter to a point being placed, plus a flash
          if (i % 6 === 0) {
            ctx.globalAlpha = fresh * 0.85;
            ctx.strokeStyle = clay ? "#d97757" : "#faf9f5";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(emitX, emitY);
            ctx.lineTo(px, py);
            ctx.stroke();
          }
          const s = ((clay ? 2.8 : 1.8) + fresh * 2.4) * persp * sizeK;
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(px - s / 2, py - s / 2, s, s);
          continue;
        }

        const depth = clamp01((z2 + 1.4) / 2.8); // 0 far .. 1 near
        const lvl = 3 - Math.min(3, Math.floor(depth * 4)); // near = brightest
        const s = (clay ? 2.8 : 1.8) * persp * sizeK;
        paths[(clay ? 4 : 0) + lvl]!.rect(px - s / 2, py - s / 2, s, s);
      }

      for (let b = 0; b < 8; b++) {
        ctx.globalAlpha = DEPTH_ALPHA[b % 4] * alphaMul;
        ctx.fillStyle = b >= 4 ? "#d97757" : "#faf9f5";
        ctx.fill(paths[b]!);
      }

      if (phase === "in") {
        const t = clamp01((now - phaseStart) / IN_MS);
        ctx.globalAlpha = 1 - t * 0.6;
        ctx.fillStyle = "#d97757";
        ctx.save();
        ctx.translate(emitX, emitY);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      battery?.removeEventListener("chargingchange", onCharge);
      box.removeEventListener("pointerdown", down);
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerup", up);
      box.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div
      ref={wrap}
      className={cn("relative touch-pan-y select-none", className)}
      style={{ cursor: "grab" }}
      onPointerDown={() => setTouched(true)}
    >
      {/* tick ring: rotates with the model */}
      <svg
        ref={ring}
        viewBox="-210 -210 420 420"
        aria-hidden
        className="absolute inset-0 size-full will-change-transform"
      >
        {Array.from({ length: TICKS }).map((_, k) => {
          const ang = (k / TICKS) * Math.PI * 2;
          const major = k % 12 === 0;
          const r1 = major ? 176 : 184;
          return (
            <line
              key={k}
              x1={r3(Math.sin(ang) * r1)}
              y1={r3(-Math.cos(ang) * r1)}
              x2={r3(Math.sin(ang) * 196)}
              y2={r3(-Math.cos(ang) * 196)}
              stroke={major ? "var(--color-clay)" : "var(--color-night-faint)"}
              strokeWidth={major ? 3 : 1.5}
            />
          );
        })}
        <circle r="164" fill="none" stroke="var(--color-night-faint)" strokeWidth="1" />
        <path d="M -150 -66 A 164 164 0 0 1 -60 -152" fill="none" stroke="var(--color-paper)" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        <path d="M 150 66 A 164 164 0 0 1 60 152" fill="none" stroke="var(--color-paper)" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      </svg>

      {/* fixed pointer so you can see the ring turning */}
      <svg aria-hidden viewBox="0 0 12 9" className="absolute -top-3 left-1/2 w-3 -translate-x-1/2">
        <path d="M0 0H12L6 9Z" fill="var(--color-clay)" />
      </svg>

      {/* model: bigger than the ring on purpose, so it can leak out of it */}
      <canvas
        ref={canvas}
        role="img"
        aria-label={label ?? "Rotating 3D point-cloud model. Drag to turn it."}
        className="pointer-events-none absolute -inset-[40%] size-[180%]"
      />

      {caption && (
        <p className="hud pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-night-faint">
          {caption}
        </p>
      )}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-[4%] left-1/2 flex -translate-x-1/2 items-center gap-2 bg-paper/10 px-3 py-1.5 text-paper transition-opacity duration-700 ease-flow",
          touched ? "opacity-0" : "opacity-100",
        )}
      >
        <MoveHorizontal className="size-4 animate-[nudge_2.4s_cubic-bezier(.65,0,.35,1)_infinite]" />
        <span className="hud">Drag to orbit</span>
      </div>
      <style>{`@keyframes nudge { 0%,100% { transform: translateX(-5px) } 50% { transform: translateX(5px) } }`}</style>
    </div>
  );
}
