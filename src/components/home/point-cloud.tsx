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
// - Changing model: the wheel spins up like a high-speed flywheel and shrinks
//   a little while the old model vanishes; a laser then scans the new model
//   into place from a reset angle, and the wheel eases back to a slow orbit.
// - Performance: points are drawn in a handful of batched paths (not one fill
//   each), orbit speed is time-based, and quality scales itself down when
//   frames get slow (e.g. laptop on battery).
//
// Models are procedural stand-ins; real ones (GLB / scanned points) can
// replace the generators below without touching the renderer.

export type ModelKey = "pages" | "book" | "blocks" | "steps" | "network";

export const MODEL_LABEL: Record<ModelKey, string> = {
  pages: "Pages",
  book: "Open book",
  blocks: "Blocks",
  steps: "Steps",
  network: "Network",
};

const N = 3600;
type V3 = [number, number, number];

const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const r3 = (n: number) => Math.round(n * 1000) / 1000; // Node/browser float digits differ → hydration warnings

function fill(sampler: (i: number) => V3): Float32Array {
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const [x, y, z] = sampler(i);
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

const rotY = ([x, y, z]: V3, a: number): V3 => [
  x * Math.cos(a) + z * Math.sin(a),
  y,
  -x * Math.sin(a) + z * Math.cos(a),
];

// a stack of written pages
function pages(): Float32Array {
  return fill((i) => {
    const sheet = i % 6;
    const w = 0.62;
    const h = 0.82;
    let x: number;
    let y: number;
    if (Math.random() < 0.28) {
      const t = rnd(0, 4);
      if (t < 1) [x, y] = [rnd(-w, w), h];
      else if (t < 2) [x, y] = [rnd(-w, w), -h];
      else if (t < 3) [x, y] = [-w, rnd(-h, h)];
      else [x, y] = [w, rnd(-h, h)];
    } else {
      const row = Math.floor(rnd(0, 7));
      y = h - 0.28 - row * 0.19;
      x = rnd(-w + 0.14, w - 0.14 - (row % 3 === 2 ? 0.35 : 0));
    }
    return rotY([x, y, (sheet - 2.5) * 0.17], (sheet - 2.5) * 0.09);
  });
}

// open book: two pages meeting at a spine, with ruled lines
function book(): Float32Array {
  return fill((i) => {
    const side = i % 2 ? 1 : -1;
    const x = rnd(0.04, 0.95);
    const ruled = Math.random() < 0.8;
    const y = ruled ? -0.7 + Math.floor(rnd(0, 9)) * 0.175 : rnd(-0.75, 0.75);
    return [side * x, y, x * 0.42 - 0.2];
  });
}

// nested cubes (building blocks)
function blocks(): Float32Array {
  const edges = (s: number, offset: V3): V3 => {
    const axis = Math.floor(rnd(0, 3));
    const c = [rnd(-s, s), rnd(-s, s), rnd(-s, s)];
    const a = (axis + 1) % 3;
    const b = (axis + 2) % 3;
    c[a] = Math.random() < 0.5 ? -s : s;
    c[b] = Math.random() < 0.5 ? -s : s;
    return [c[0] + offset[0], c[1] + offset[1], c[2] + offset[2]];
  };
  return fill((i) => {
    const k = i % 10;
    if (k < 6) return edges(0.7, [0, 0, 0]);
    if (k < 9) return edges(0.34, [0.25, -0.22, 0.17]);
    return [rnd(-0.7, 0.7), rnd(-0.7, 0.7), rnd(-0.7, 0.7)];
  });
}

// staircase
function steps(): Float32Array {
  return fill(() => {
    const s = Math.floor(rnd(0, 5));
    const w = 0.5;
    const stepH = 0.34;
    const run = 0.34;
    const x0 = -0.85 + s * run;
    const top = -0.8 + (s + 1) * stepH;
    if (Math.random() < 0.55) return [rnd(x0, x0 + run), top, rnd(-w, w)];
    return [x0, rnd(top - stepH, top), rnd(-w, w)];
  });
}

// network globe
function network(): Float32Array {
  return fill((i) => {
    if (i % 3 === 0) {
      const k = i / 3;
      const phi = Math.acos(1 - (2 * (k + 0.5)) / (N / 3));
      const th = Math.PI * (1 + Math.sqrt(5)) * k;
      return [
        0.85 * Math.cos(th) * Math.sin(phi),
        0.85 * Math.cos(phi),
        0.85 * Math.sin(th) * Math.sin(phi),
      ];
    }
    const ring = i % 3;
    const t = rnd(0, Math.PI * 2);
    const c: V3 = [Math.cos(t) * 0.86, Math.sin(t) * 0.86, 0];
    if (ring === 1) return [c[0], 0, c[1]];
    return rotY([c[0], c[1], 0], Math.PI / 2.4);
  });
}

const BUILDERS: Record<ModelKey, () => Float32Array> = { pages, book, blocks, steps, network };

type Built = { pts: Float32Array; rank: Float32Array };

/** Rank each point top-to-bottom (with jitter) = the order the laser places them. */
function build(key: ModelKey): Built {
  const pts = BUILDERS[key]();
  const idx = Array.from({ length: N }, (_, i) => i);
  const score = idx.map((i) => -pts[i * 3 + 1] + rnd(-0.07, 0.07));
  idx.sort((a, b) => score[a] - score[b]);
  const rank = new Float32Array(N);
  idx.forEach((pi, r) => (rank[pi] = r / N));
  return { pts, rank };
}

const OUT_MS = 700;
const IN_MS = 1300;
const IDLE_SPIN = 0.4; // rad/s: a slow, clearly-moving orbit (time-based, so low fps doesn't slow it)
const YAW0 = 0.6; // every new model starts from this angle
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
    let phase: "in" | "idle" | "out" = reduce ? "idle" : "in";
    let phaseStart = performance.now();

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
      if (phase === "idle" && want.current !== shown) {
        if (reduce) {
          shown = want.current;
          yaw = YAW0;
        } else {
          phase = "out";
          phaseStart = now;
        }
      }
      if (phase === "out" && now - phaseStart >= OUT_MS) {
        shown = want.current;
        yaw = YAW0; // reset coords for the new object
        vDrag = 0;
        phase = "in";
        phaseStart = now;
      }
      if (phase === "in" && now - phaseStart >= IN_MS) phase = "idle";

      let spin = IDLE_SPIN;
      let alphaMul = 1;
      let scaleMul = 1;
      let reveal = 1;
      let focus = 0; // 0..1: how "flywheel-fast" the wheel is right now
      if (phase === "out") {
        const k = ease(clamp01((now - phaseStart) / OUT_MS));
        spin += 22 * k * k;
        alphaMul = 1 - k;
        scaleMul = 1 - 0.3 * k;
        focus = k;
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
      const { pts, rank } = built[shown];
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
        const age = phase === "in" ? (reveal - rank[i]) / AGE : 2;
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
        const clay = i % 11 === 0;

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
