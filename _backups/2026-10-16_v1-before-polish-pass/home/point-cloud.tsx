"use client";

import { useEffect, useRef } from "react";

// A small dependency-free 3D point-cloud viewer, after Endfield's lore
// model viewer. Each "aim" has a procedural model; changing `index`
// morphs the cloud into the next one. Drag to orbit; it idles in a slow
// spin. Real models (GLB / scanned points) can replace the generators
// below later without touching the renderer.

export const MODEL_NAMES = ["Pages", "Open book", "Blocks", "Steps", "Network"] as const;

const N = 3600;
type V3 = [number, number, number];

const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);

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

// 0. a stack of written pages
function pages(): Float32Array {
  return fill((i) => {
    const sheet = i % 6;
    const w = 0.62;
    const h = 0.82;
    let x: number;
    let y: number;
    const r = Math.random();
    if (r < 0.28) {
      // border
      const t = rnd(0, 4);
      if (t < 1) [x, y] = [rnd(-w, w), h];
      else if (t < 2) [x, y] = [rnd(-w, w), -h];
      else if (t < 3) [x, y] = [-w, rnd(-h, h)];
      else [x, y] = [w, rnd(-h, h)];
    } else {
      // lines of "text"
      const row = Math.floor(rnd(0, 7));
      y = h - 0.28 - row * 0.19;
      x = rnd(-w + 0.14, w - 0.14 - (row % 3 === 2 ? 0.35 : 0));
    }
    return rotY([x, y, (sheet - 2.5) * 0.17], (sheet - 2.5) * 0.09);
  });
}

// 1. open book: two pages meeting at a spine, with ruled lines
function book(): Float32Array {
  return fill((i) => {
    const side = i % 2 ? 1 : -1;
    const x = rnd(0.04, 0.95);
    const ruled = Math.random() < 0.8;
    const y = ruled ? -0.7 + Math.floor(rnd(0, 9)) * 0.175 : rnd(-0.75, 0.75);
    return [side * x, y, x * 0.42 - 0.2];
  });
}

// 2. nested cubes (building blocks)
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

// 3. staircase
function steps(): Float32Array {
  return fill(() => {
    const s = Math.floor(rnd(0, 5));
    const w = 0.5;
    const stepH = 0.34;
    const run = 0.34;
    const x0 = -0.85 + s * run;
    const top = -0.8 + (s + 1) * stepH;
    if (Math.random() < 0.55) {
      return [rnd(x0, x0 + run), top, rnd(-w, w)]; // tread
    }
    return [x0, rnd(top - stepH, top), rnd(-w, w)]; // riser
  });
}

// 4. network globe
function network(): Float32Array {
  return fill((i) => {
    if (i % 3 === 0) {
      // fibonacci sphere nodes
      const k = i / 3;
      const phi = Math.acos(1 - (2 * (k + 0.5)) / (N / 3));
      const th = Math.PI * (1 + Math.sqrt(5)) * k;
      return [
        0.85 * Math.cos(th) * Math.sin(phi),
        0.85 * Math.cos(phi),
        0.85 * Math.sin(th) * Math.sin(phi),
      ];
    }
    // three great circles
    const ring = i % 3;
    const t = rnd(0, Math.PI * 2);
    const c: V3 = [Math.cos(t) * 0.86, Math.sin(t) * 0.86, 0];
    if (ring === 1) return [c[0], 0, c[1]];
    return rotY([c[0], c[1], 0], Math.PI / 2.4);
  });
}

const BUILDERS = [pages, book, blocks, steps, network];

type Props = {
  index: number;
  className?: string;
  /** shown to assistive tech */
  label?: string;
};

export function PointCloud({ index, className, label }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef<Float32Array | null>(null);
  const models = useRef<Float32Array[] | null>(null);

  // swap target on slide change
  useEffect(() => {
    if (!models.current) models.current = BUILDERS.map((b) => b());
    target.current = models.current[index % models.current.length];
  }, [index]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!models.current) models.current = BUILDERS.map((b) => b());
    if (!target.current) target.current = models.current[index % models.current.length];

    // start scattered, so the first model "assembles"
    const cur = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) cur[i] = rnd(-1.6, 1.6);
    const speed = new Float32Array(N);
    for (let i = 0; i < N; i++) speed[i] = rnd(0.035, 0.12);

    let yaw = 0.6;
    let pitch = -0.28;
    let vYaw = reduce ? 0 : 0.0045;
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
      vYaw = dx * 0.0011;
      pitch = Math.max(-1.1, Math.min(1.1, pitch + dy * 0.008));
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

    const idle = reduce ? 0 : 0.0045;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const tgt = target.current!;
      for (let i = 0; i < N; i++) {
        const k = speed[i];
        const j = i * 3;
        cur[j] += (tgt[j] - cur[j]) * k;
        cur[j + 1] += (tgt[j + 1] - cur[j + 1]) * k;
        cur[j + 2] += (tgt[j + 2] - cur[j + 2]) * k;
      }
      if (!dragging) {
        yaw += vYaw;
        vYaw += (idle - vYaw) * 0.02;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const scale = Math.min(w, h) * 0.4;
      const cx0 = w / 2;
      const cy0 = h / 2;

      for (let i = 0; i < N; i++) {
        const j = i * 3;
        const x = cur[j];
        const y = cur[j + 1];
        const z = cur[j + 2];
        // yaw then pitch
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const y2 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;
        const persp = 2.6 / (2.6 + z2);
        const px = cx0 + x1 * scale * persp;
        const py = cy0 - y2 * scale * persp;
        const depth = (z2 + 1.4) / 2.8; // 0 far .. 1 near
        const a = 0.35 + 0.65 * (1 - Math.min(1, Math.max(0, depth)));
        const s = (i % 11 === 0 ? 2.8 : 1.8) * persp;
        ctx.globalAlpha = a;
        ctx.fillStyle = i % 11 === 0 ? "#d97757" : "#faf9f5";
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cv.removeEventListener("pointerdown", down);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      cv.removeEventListener("pointercancel", up);
    };
    // index handled by the other effect; renderer mounts once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={label ?? "Rotating 3D point-cloud model. Drag to turn it."}
      className={className}
      style={{ cursor: "grab", touchAction: "pan-y" }}
    />
  );
}
