"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which of the given element ids is crossing the middle of the
 * viewport. `resetKey` re-runs the observer after client navigation
 * (the home page's sections only exist while it is mounted).
 */
export function useActiveSection(ids: readonly string[], resetKey?: string) {
  const [current, setCurrent] = useState<string>(ids[0]);

  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setCurrent(vis.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.01] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, ids.join("|")]);

  return current;
}
