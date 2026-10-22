// Progress for the loading screen (components/boot-screen.tsx).
//
// It is part show, part real: the bar always takes at least `minMs` so the
// animation can be seen, but it will not pass HOLD until the page has really
// loaded (fonts and the window load event). On a slow connection it waits at
// HOLD instead of lying; on a fast one it just plays the animation through.
export const HOLD = 92;
/** First visit of a browser session: the full show. Later full loads: a short one. */
export const BOOT_FIRST_MS = 2800;
export const BOOT_REPEAT_MS = 1300;
/** Never keep someone waiting longer than this, whatever is still loading. */
export const BOOT_GIVE_UP_MS = 9000;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 0..100 for `elapsed` ms since the screen appeared. */
export function bootProgress(elapsed: number, minMs: number, ready: boolean): number {
  const t = Math.min(1, Math.max(0, elapsed / minMs));
  const timed = easeInOut(t) * 100;
  return Math.min(timed, ready ? 100 : HOLD);
}

/** Fraction (0..1) of a stage that spans from `a` to `b` percent. */
export const span = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
