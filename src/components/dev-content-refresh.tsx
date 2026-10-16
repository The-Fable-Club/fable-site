"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { refreshContent } from "@/app/actions";

// Development only: when a CMS edit changes ./content, clear the content
// cache and re-render the page. Renders nothing and does nothing in production.
export function DevContentRefresh() {
  const router = useRouter();
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    let stop = false;
    const tick = async () => {
      try {
        const { v } = (await (await fetch("/api/dev/content-version", { cache: "no-store" })).json()) as { v: number };
        if (last.current !== null && v !== last.current) {
          await refreshContent();
          router.refresh();
        }
        last.current = v;
      } catch {
        /* server restarting: try again next tick */
      }
    };
    void tick();
    const id = setInterval(() => !stop && void tick(), 1500);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [router]);

  return null;
}
