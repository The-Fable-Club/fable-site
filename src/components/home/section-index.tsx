"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

const sections = [
  { id: "top", label: "Start" },
  { id: "about", label: "About" },
  { id: "events", label: "Events" },
  { id: "people", label: "People" },
  { id: "join", label: "Join" },
  { id: "contact", label: "Contact" },
] as const;
const ids = sections.map((s) => s.id);

/** Perceived brightness of a CSS colour string, 0 (black) to 1 (white); null if transparent. */
function lightness(css: string): number | null {
  const m = css.match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  const a = m.length > 3 ? parseFloat(m[3]) : 1;
  if (a < 0.6) return null;
  return (0.2126 * +m[0] + 0.7152 * +m[1] + 0.0722 * +m[2]) / 255;
}

// Right-edge section tracker for the home page: shows where you are and
// jumps between stages. No backing plate: the dashes and labels recolour
// themselves to contrast with whatever section is behind them.
export function SectionIndex() {
  const pathname = usePathname();
  const current = useActiveSection(ids, pathname);
  const nav = useRef<HTMLElement>(null);
  const [onDark, setOnDark] = useState(true);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const n = nav.current;
      if (!n) return;
      const r = n.getBoundingClientRect();
      const els = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      for (const el of els) {
        if (n.contains(el)) continue;
        for (let cur: Element | null = el; cur; cur = cur.parentElement) {
          const l = lightness(getComputedStyle(cur).backgroundColor);
          if (l !== null) {
            setOnDark(l < 0.5);
            return;
          }
        }
      }
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    schedule();
    const t = setTimeout(schedule, 400); // after fonts/layout settle
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  return (
    <nav
      ref={nav}
      aria-label="Sections on this page"
      className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <ul className="flex flex-col items-end gap-3">
        {sections.map((s) => {
          const on = current === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={on ? "true" : undefined}
                className="group flex items-center gap-2"
              >
                <span
                  className={cn(
                    "hud px-1.5 py-0.5 transition-[transform,opacity,background-color,color] duration-500 ease-flow",
                    onDark ? "bg-paper text-ink" : "bg-ink text-paper",
                    on
                      ? "translate-x-0 opacity-100"
                      : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                  )}
                >
                  {s.label}
                </span>
                <span
                  className={cn(
                    "block h-[3px] transition-[width,background-color] duration-700 ease-flow",
                    on
                      ? "w-8 bg-clay"
                      : cn(
                          "w-3 group-hover:w-6",
                          onDark ? "bg-paper/60 group-hover:bg-paper" : "bg-ink/45 group-hover:bg-ink",
                        ),
                  )}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
