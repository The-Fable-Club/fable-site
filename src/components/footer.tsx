import Link from "next/link";
import type { Club } from "@/lib/content";
import { Hud, Ph } from "@/components/hud";

const cols = [
  {
    title: "Site",
    links: [
      { label: "Home", href: "/" },
      { label: "Events", href: "/events" },
      { label: "Event history", href: "/events#history" },
      { label: "Members", href: "/members" },
    ],
  },
  {
    title: "Join",
    links: [
      { label: "Apply to the club", href: "/join" },
      { label: "Current events", href: "/events#current" },
      { label: "Contact", href: "/#contact" },
    ],
  },
] as const;

export function Footer({ club }: { club: Club }) {
  return (
    <footer className="bg-night text-night-soft">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:px-12">
        <div>
          <p className="font-display text-4xl leading-none text-paper">{club.name}</p>
          <p className="mt-4 max-w-[34ch] font-serif text-base leading-relaxed">
            A Claude club at {club.institution}. {club.office}.
          </p>
          <Ph className="mt-5 border-clay text-clay">Content is placeholder</Ph>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <Hud className="text-night-faint">{c.title}</Hud>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm transition-colors duration-500 ease-flow hover:text-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <Hud className="text-night-faint">Contact</Hud>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a href={`mailto:${club.contactEmail}`} className="transition-colors duration-500 ease-flow hover:text-paper">
                {club.contactEmail}
              </a>
            </li>
            {club.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="transition-colors duration-500 ease-flow hover:text-paper">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-night-faint md:flex-row md:justify-between md:px-12">
          <Hud>
            © 2026 {club.name} · {club.institution}
          </Hud>
          <Hud>{club.disclaimer}</Hud>
        </div>
      </div>
    </footer>
  );
}
