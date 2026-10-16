"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/members", label: "People", icon: Users },
  { href: "/join", label: "Join", icon: UserPlus },
] as const;

// Fixed left rail on desktop, bottom bar on mobile.
// Layout idea taken from the Endfield reference: narrow icon column,
// active page shown as a solid ink square.
export function Rail() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed z-50 border-ink/15 bg-paper",
        "inset-x-0 bottom-0 flex h-16 border-t",
        "md:inset-y-0 md:left-0 md:right-auto md:h-auto md:w-[var(--rail-w)] md:flex-col md:border-r md:border-t-0",
      )}
    >
      <Link
        href="/"
        aria-label="The Fable Club — home"
        className="hidden h-[4.25rem] w-full shrink-0 items-center justify-center md:flex"
      >
        <Image
          src="/logo-light.jpg"
          alt=""
          width={44}
          height={44}
          className="size-11"
          priority
        />
      </Link>

      <ul className="flex flex-1 md:mt-4 md:flex-none md:flex-col md:gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors md:h-14",
                  active
                    ? "bg-ink text-paper"
                    : "text-ink-faint hover:bg-paper-raised hover:text-ink",
                )}
              >
                <Icon className="size-[1.15rem]" strokeWidth={1.6} aria-hidden />
                <span className="hud text-[0.6rem] leading-none">{label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 hidden h-full w-[3px] bg-clay md:block"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Endfield-style vertical call-to-action tab */}
      <Link
        href="/join"
        className="group mx-auto mb-6 hidden w-11 flex-col items-center gap-3 bg-ink py-4 text-paper transition-colors hover:bg-clay-deep md:flex"
      >
        <span
          className="font-sans text-[0.8rem] font-medium tracking-wide [text-orientation:mixed] [writing-mode:vertical-rl]"
        >
          Join the club
        </span>
        <span aria-hidden className="size-1.5 bg-clay group-hover:bg-paper" />
      </Link>
    </nav>
  );
}
