// Motion policy: the club wants full motion everywhere, regardless of the
// OS "reduce motion" / "animation effects" setting. Every component reads
// these two helpers instead of the browser flag, so this is the one place
// to change if that decision is ever reversed (return the real media query).
export const HONOR_REDUCED_MOTION = false;

export const prefersReducedMotion = () =>
  HONOR_REDUCED_MOTION &&
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useReducedMotion = () => prefersReducedMotion();
