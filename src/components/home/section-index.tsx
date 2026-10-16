"use client";

import { usePathname } from "next/navigation";
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

// Right-edge section tracker for the home page: shows where you are and
// jumps between stages.
export function SectionIndex() {
  const pathname = usePathname();
  const current = useActiveSection(ids, pathname);

  return (
    <nav
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
                    "hud bg-ink px-1.5 py-0.5 text-paper transition-all duration-500 ease-flow",
                    on
                      ? "translate-x-0 opacity-100"
                      : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                  )}
                >
                  {s.label}
                </span>
                <span
                  className={cn(
                    "block h-[3px] transition-all duration-700 ease-flow mix-blend-difference",
                    on ? "w-8 bg-white" : "w-3 bg-white/70 group-hover:w-6",
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
