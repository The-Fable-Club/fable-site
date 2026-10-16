"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  House,
  Mail,
  Share2,
  Sprout,
  UserPlus,
  Users,
} from "lucide-react";
import { useActiveSection } from "@/hooks/use-active-section";
import { club } from "@/data/club";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  label: string;
  icon: typeof House;
  /** standalone page for this destination, if any */
  page?: string;
};

const items: Item[] = [
  { id: "top", label: "Home", icon: House },
  { id: "about", label: "About", icon: Sprout },
  { id: "events", label: "Events", icon: CalendarDays, page: "/events" },
  { id: "people", label: "People", icon: Users, page: "/members" },
  { id: "join", label: "Join", icon: UserPlus, page: "/join" },
];
const ids = items.map((i) => i.id);

// Endfield-style rail: icons only until hovered or focused, then it slides
// open over the page with labels. On the home page it follows the section
// you are scrolling through; on other pages it marks the current page.
export function Rail() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const section = useActiveSection(ids, pathname);

  const active = (i: Item) =>
    onHome
      ? section === i.id
      : i.page
        ? pathname.startsWith(i.page)
        : false;

  const href = (i: Item) =>
    onHome ? `#${i.id}` : (i.page ?? (i.id === "top" ? "/" : `/#${i.id}`));

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "group/rail fixed z-50 bg-paper text-ink",
        // mobile: bottom bar
        "inset-x-0 bottom-0 flex h-16 border-t border-ink/15",
        // desktop: slim rail that widens over the content
        "md:inset-y-0 md:left-0 md:right-auto md:h-auto md:w-[var(--rail-w)] md:flex-col md:overflow-hidden md:border-r md:border-t-0",
        "md:transition-[width,box-shadow] md:duration-300 md:ease-[cubic-bezier(.2,.7,.2,1)]",
        "md:hover:w-64 md:hover:shadow-[12px_0_40px_-12px_rgb(20_20_19/0.25)] md:focus-within:w-64 md:focus-within:shadow-[12px_0_40px_-12px_rgb(20_20_19/0.25)]",
      )}
    >
      {/* brand */}
      <Link
        href="/"
        aria-label="The Fable Club — home"
        className="hidden h-[4.25rem] shrink-0 items-center md:flex"
      >
        <span className="grid w-[var(--rail-w)] shrink-0 place-items-center">
          <Image src="/logo-light.jpg" alt="" width={44} height={44} className="size-11" priority />
        </span>
        <span className="whitespace-nowrap font-display text-xl leading-none opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
          {club.name}
        </span>
      </Link>

      <ul className="flex flex-1 md:mt-4 md:flex-none md:flex-col md:gap-1">
        {items.map((i) => {
          const on = active(i);
          const Icon = i.icon;
          return (
            <li key={i.id} className="flex-1 md:flex-none">
              <Link
                href={href(i)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors md:h-14 md:flex-row md:justify-start md:gap-0",
                  on ? "bg-ink text-paper" : "text-ink-faint hover:bg-paper-raised hover:text-ink",
                )}
              >
                <span className="grid place-items-center md:w-[var(--rail-w)] md:shrink-0">
                  <Icon className="size-[1.2rem]" strokeWidth={1.6} aria-hidden />
                </span>
                <span
                  className={cn(
                    "hud text-[0.6rem] leading-none",
                    "md:whitespace-nowrap md:text-sm md:tracking-normal md:font-sans md:opacity-0 md:transition-opacity md:duration-200",
                    "md:group-hover/rail:opacity-100 md:group-focus-within/rail:opacity-100",
                  )}
                >
                  {i.label}
                </span>
                {on && (
                  <span aria-hidden className="absolute left-0 top-0 hidden h-full w-[3px] bg-clay md:block" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden flex-1 md:block" />

      {/* utilities, like Endfield's account / top-up group */}
      <ul className="mx-2 mb-3 hidden bg-paper-raised md:block">
        {[
          { label: "Contact us", icon: Mail, href: `mailto:${club.contactEmail}` },
          { label: "Socials", icon: Share2, href: club.socials[0].href },
        ].map((u) => (
          <li key={u.label}>
            <a
              href={u.href}
              className="flex h-11 items-center text-ink-soft transition-colors hover:bg-paper-field hover:text-ink"
            >
              <span className="grid w-[calc(var(--rail-w)-1rem)] shrink-0 place-items-center">
                <u.icon className="size-4" strokeWidth={1.7} aria-hidden />
              </span>
              <span className="whitespace-nowrap text-sm opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
                {u.label}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* call to action: vertical tab when slim, button when open */}
      <div className="relative mx-2 mb-5 hidden h-[8.5rem] md:block">
        <Link
          href="/join"
          className={cn(
            "absolute left-1/2 top-0 flex w-11 -translate-x-1/2 flex-col items-center gap-3 bg-ink py-4 text-paper transition-opacity duration-200",
            "group-hover/rail:pointer-events-none group-hover/rail:opacity-0 group-focus-within/rail:pointer-events-none group-focus-within/rail:opacity-0",
          )}
        >
          <span className="text-[0.8rem] font-medium tracking-wide [writing-mode:vertical-rl]">
            Join the club
          </span>
          <span aria-hidden className="size-1.5 bg-clay" />
        </Link>
        <Link
          href="/join"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 flex h-14 items-center justify-between bg-clay px-4 font-medium text-ink opacity-0 transition-[opacity,background-color] duration-200 hover:bg-ink hover:text-paper",
            "group-hover/rail:pointer-events-auto group-hover/rail:opacity-100 group-focus-within/rail:pointer-events-auto group-focus-within/rail:opacity-100",
          )}
        >
          Join the club
          <UserPlus className="size-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
