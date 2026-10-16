"use client";

import { useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

// A small dependency-free 3D point-cloud viewer, after Endfield's lore
// model viewer.
//
// - Each aim has a procedural model; real models (GLB / scanned points)
//   can replace the generators below without touching the renderer.
// - It auto-orbits slowly; drag to turn it yourself.
// - Changing model: the old one spins up fast and vanishes, then a laser
//   scans down the new shape firing each point into place.

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
    if (k < 6) return edges(0.6, [0, 0, 0]);
    if (k < 9) return edges(0.3, [0.22, -0.2, 0.15]);
    return [rnd(-0.6, 0.6), rnd(-0.6, 0.6), rnd(-0.6, 0.6)];
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

const OUT_MS = 650;
const IN_MS = 1250;
const IDLE_SPIN = 0.0065; // rad / frame: a slow, clearly-moving orbit

type Props = { model: ModelKey; className?: string; label?: string };

export function PointCloud({ model, className, label }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const want = useRef<ModelKey>(model);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    want.current = model;
  }, [model]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = prefersReducedMotion();

    const built = {} as Record<ModelKey, Built>;
    (Object.keys(BUILDERS) as ModelKey[]).forEach((k) => (built[k] = build(k)));

    let shown: ModelKey = want.current;
    let phase: "in" | "idle" | "out" = reduce ? "idle" : "in";
    let phaseStart = performance.now();

    let yaw = 0.6;
    let pitchBase = -0.28;
    let vDrag = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      yaw += dx * 0.011;
      vDrag = dx * 0.0011;
      pitchBase = Math.max(-1.1, Math.min(1.1, pitchBase + dy * 0.008));
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      cv.style.cursor = "grab";
      try {
        cv.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;

      // ---- phase machine -------------------------------------------------
      if (phase === "idle" && want.current !== shown) {
        if (reduce) shown = want.current;
        else {
          phase = "out";
          phaseStart = now;
        }
      }
      if (phase === "out" && now - phaseStart >= OUT_MS) {
        shown = want.current;
        phase = "in";
        phaseStart = now;
      }
      if (phase === "in" && now - phaseStart >= IN_MS) phase = "idle";

      let spin = IDLE_SPIN;
      let alphaMul = 1;
      let scaleMul = 1;
      let reveal = 1;
      if (phase === "out") {
        const k = ease(clamp01((now - phaseStart) / OUT_MS));
        spin += 0.3 * k * k;
        alphaMul = 1 - k;
        scaleMul = 1 - 0.28 * k;
      } else if (phase === "in") {
        const t = clamp01((now - phaseStart) / IN_MS);
        reveal = ease(t);
        spin += 0.17 * (1 - t) * (1 - t);
      }
      if (reduce) spin = 0;
      if (!dragging) {
        yaw += spin + vDrag;
        vDrag *= 0.94;
      }
      const bob = reduce ? 0 : Math.sin(now / 2600) * 0.045;

      // ---- draw ----------------------------------------------------------
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const { pts, rank } = built[shown];
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const pitch = pitchBase + bob;
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const scale = Math.min(w, h) * 0.4 * scaleMul;
      const cx0 = w / 2;
      const cy0 = h / 2;
      const emitX = cx0;
      const emitY = cy0 - Math.min(w, h) * 0.5;
      const AGE = 0.07;

      for (let i = 0; i < N; i++) {
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
        const persp = 2.6 / (2.6 + z2);
        const px = cx0 + x1 * scale * persp;
        const py = cy0 - y2 * scale * persp;
        const depth = clamp01((z2 + 1.4) / 2.8);
        const clay = i % 11 === 0;

        const fresh = age >= 0 && age < 1 ? 1 - age : 0; // 1 = just placed
        // laser beam from the emitter to a point being placed
        if (fresh > 0 && i % 6 === 0) {
          ctx.globalAlpha = fresh * 0.85;
          ctx.strokeStyle = clay ? "#d97757" : "#faf9f5";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(emitX, emitY);
          ctx.lineTo(px, py);
          ctx.stroke();
        }

        const a = (0.35 + 0.65 * (1 - depth)) * alphaMul;
        const s = ((clay ? 2.8 : 1.8) + fresh * 2.4) * persp;
        ctx.globalAlpha = Math.min(1, a + fresh);
        ctx.fillStyle = fresh > 0.35 ? "#ffffff" : clay ? "#d97757" : "#faf9f5";
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }

      // emitter glint while the laser is working
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
      cv.removeEventListener("pointerdown", down);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      cv.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div className={cn("relative", className)} onPointerDown={() => setTouched(true)}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={label ?? "Rotating 3D point-cloud model. Drag to turn it."}
        className="size-full"
        style={{ cursor: "grab", touchAction: "pan-y" }}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-[1%] left-1/2 flex -translate-x-1/2 items-center gap-2 bg-paper/10 px-3 py-1.5 text-paper backdrop-blur-sm transition-opacity duration-700 ease-flow",
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
