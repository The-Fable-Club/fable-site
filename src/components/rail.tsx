"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
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
  { id: "contact", label: "Contact", icon: Mail },
];
const ids = items.map((i) => i.id);

// Timings measured on the Endfield reference: everything moves in parallel
// at 0.3s `ease`; labels fade in over 0.2s while sliding in ~9px from the left.
const label =
  "opacity-0 -translate-x-2 [transition:opacity_.2s_ease,transform_.3s_ease] group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100";

// Endfield-style rail: icons only until hovered or focused, then it slides
// open over the page with labels. On the home page it follows the section
// you are scrolling through; on other pages it marks the current page.
export function Rail({ name }: { name: string }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const section = useActiveSection(ids, pathname);

  const active = (i: Item) =>
    onHome ? section === i.id : i.page ? pathname.startsWith(i.page) : false;

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
        "md:transition-[width,box-shadow] md:duration-300 md:ease-[ease]",
        "md:hover:w-64 md:hover:shadow-[12px_0_40px_-12px_rgb(20_20_19/0.25)] md:focus-within:w-64 md:focus-within:shadow-[12px_0_40px_-12px_rgb(20_20_19/0.25)]",
      )}
    >
      {/* brand */}
      <Link
        href="/"
        aria-label={`${name} — home`}
        className="hidden h-[4.25rem] shrink-0 items-center md:flex"
      >
        <span className="grid w-[var(--rail-w)] shrink-0 place-items-center">
          <Image src="/logo-light.jpg" alt="" width={44} height={44} className="size-11" priority />
        </span>
        <span className={cn("whitespace-nowrap font-display text-xl leading-none", label)}>{name}</span>
      </Link>

      <ul className="flex flex-1 md:mt-3 md:flex-none md:flex-col md:gap-0.5">
        {items.map((i) => {
          const on = active(i);
          const Icon = i.icon;
          return (
            <li key={i.id} className="flex-1 md:flex-none">
              <Link
                href={href(i)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors duration-300 ease-[ease] md:h-12 md:flex-row md:justify-start md:gap-0",
                  on ? "text-paper" : "text-ink-faint hover:bg-paper-raised hover:text-ink",
                )}
              >
                {/* The black plate is a single shared element: it slides from the
                    old section to the new one instead of fading out and in. */}
                {on && (
                  <motion.span
                    layoutId="rail-active"
                    aria-hidden
                    className="absolute inset-0 bg-ink"
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <span className="absolute left-0 top-0 hidden h-full w-[3px] bg-clay md:block" />
                  </motion.span>
                )}
                <span className="relative grid place-items-center md:w-[var(--rail-w)] md:shrink-0">
                  <Icon className="size-[1.2rem]" strokeWidth={1.6} aria-hidden />
                </span>
                <span className="relative hud text-[0.6rem] leading-none md:hidden">{i.label}</span>
                <span className={cn("relative hidden whitespace-nowrap text-sm md:inline", label)}>{i.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden flex-1 md:block" />

      {/* utilities, like Endfield's account / top-up group */}
      <ul className="mx-2 mb-3 hidden bg-paper-raised md:block">
        {[{ label: "Socials", icon: Share2, href: onHome ? "#contact" : "/#contact" }].map((u) => (
          <li key={u.label}>
            <Link
              href={u.href}
              className="flex h-11 items-center text-ink-soft transition-colors duration-300 ease-[ease] hover:bg-paper-field hover:text-ink"
            >
              <span className="grid w-[calc(var(--rail-w)-1rem)] shrink-0 place-items-center">
                <u.icon className="size-4" strokeWidth={1.7} aria-hidden />
              </span>
              <span className={cn("whitespace-nowrap text-sm", label)}>{u.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Call to action. One element: a vertical tab when the rail is slim that
          widens, shortens, turns its label upright and changes colour when it opens. */}
      <div className="relative mx-2 mb-5 hidden h-[8.5rem] md:block">
        <Link
          href="/join"
          aria-label="Join the club"
          className={cn(
            "absolute left-1/2 top-0 h-[8.5rem] w-11 -translate-x-1/2 overflow-hidden bg-ink text-paper",
            "transition-[width,height,background-color,color] duration-300 ease-[ease]",
            "group-hover/rail:h-14 group-hover/rail:w-full group-hover/rail:bg-clay group-hover/rail:text-ink",
            "group-focus-within/rail:h-14 group-focus-within/rail:w-full group-focus-within/rail:bg-clay group-focus-within/rail:text-ink",
            "hover:!bg-ink hover:!text-paper",
          )}
        >
          <span
            className={cn(
              "absolute left-1/2 top-1/2 whitespace-nowrap text-[0.8rem] font-medium tracking-wide",
              "[transform:translate(-50%,-50%)_rotate(90deg)] [transition:transform_.3s_ease,font-size_.3s_ease]",
              "group-hover/rail:[transform:translate(-50%,-50%)_rotate(0deg)] group-hover/rail:text-sm",
              "group-focus-within/rail:[transform:translate(-50%,-50%)_rotate(0deg)] group-focus-within/rail:text-sm",
            )}
          >
            Join the club
          </span>
          <UserPlus
            aria-hidden
            className={cn(
              "absolute right-4 top-1/2 size-4 -translate-y-1/2 opacity-0 [transition:opacity_.2s_ease]",
              "group-hover/rail:opacity-100 group-focus-within/rail:opacity-100",
            )}
          />
          <span
            aria-hidden
            className="absolute bottom-3 left-1/2 size-1.5 -translate-x-1/2 bg-clay transition-opacity duration-200 group-hover/rail:opacity-0 group-focus-within/rail:opacity-0"
          />
        </Link>
      </div>
    </nav>
  );
}
