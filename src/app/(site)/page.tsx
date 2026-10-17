import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Banner, Hud, Ph } from "@/components/hud";
import { Hero } from "@/components/home/hero";
import { AimsDial } from "@/components/home/aims-dial";
import { EventsCarousel } from "@/components/home/events-carousel";
import { PeopleStage } from "@/components/home/people-stage";
import { SectionIndex } from "@/components/home/section-index";
import { Timeline } from "@/components/timeline";
import CountUp from "@/components/CountUp";
import { getContent } from "@/lib/content";
import { heroStrips, openEvents } from "@/lib/events";
import { initials } from "@/lib/members";
import { cn } from "@/lib/utils";

const groupTone = {
  Faculty: "bg-ink text-paper",
  Board: "bg-clay text-ink",
  Leads: "bg-manilla text-ink",
  Member: "bg-paper text-ink",
} as const;

export default async function Home() {
  const { club, aims, events, members } = await getContent();
  const people = members.filter((m) => m.group !== "Faculty"); // faculty stay on /members and in Contact
  const faculty = members.filter((m) => m.group === "Faculty");
  const open = openEvents(events);

  return (
    <>
      <SectionIndex />
      <Hero club={club} strips={heroStrips(events)} />

      {/* About */}
      <div id="about">
        <Banner label="About the club" title="About" art="/art/sprouts.svg" />
        <section className="bg-paper">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:px-12 md:py-24">
            <div>
              <h2 className="max-w-[16ch] font-display text-[clamp(2.25rem,1.6rem+2.9vw,4.25rem)] leading-[1.02]">
                A student club for learning Claude properly.
              </h2>
              <Ph className="mt-5">Placeholder copy</Ph>
            </div>
            <div>
              <p className="font-serif text-xl leading-relaxed text-ink-soft">{club.description}</p>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {club.phases.map((p, i) => (
                  <div key={p.name} className="min-w-[10rem]">
                    <Hud className="text-ink-faint">Phase {i + 1}</Hud>
                    <p className="font-display text-xl leading-tight">{p.name}</p>
                    <Hud className="text-ink-faint">{p.span}</Hud>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <dl className="mx-auto grid max-w-6xl border-y border-ink/20 md:grid-cols-4 md:border-x">
            {club.stats.map((s) => (
              <div
                key={s.label}
                className="border-b border-ink/20 px-6 py-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <dt className="hud text-ink-faint">{s.label}</dt>
                <dd className="mt-2 font-display text-6xl leading-none">
                  {/^\d+$/.test(s.value) ? <CountUp to={Number(s.value)} duration={1.6} /> : s.value}
                </dd>
                <dd className="mt-3 max-w-[22ch] text-sm text-ink-soft">{s.note}</dd>
              </div>
            ))}
          </dl>
          <div className="h-16 md:h-24" />
        </section>
        <AimsDial aims={aims} />
      </div>

      {/* Events */}
      <div id="events">
        <Banner label="Highlighted and upcoming" title="Events" art="/art/party.svg" tone="manilla" />
        <section className="bg-paper-sunken py-16 md:py-24">
          <div className="mx-auto max-w-[90rem]">
            <EventsCarousel events={open} />
          </div>
          <div className="mx-auto max-w-6xl px-6 md:px-12">
            <div className="mt-20 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Hud className="text-ink-faint">Timeline</Hud>
                <h3 className="font-display text-4xl leading-none md:text-5xl">The year, in order</h3>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 border-b border-ink pb-0.5 font-medium transition-colors duration-500 ease-flow hover:text-clay-deep"
              >
                All events and history
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-24">
              <Timeline events={events} bleed />
            </div>
          </div>
        </section>
      </div>

      {/* People */}
      <div id="people">
        <Banner label="Board and contacts" title="People" art="/art/hands-together.svg" tone="ink" />
        <section className="bg-paper py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6 md:px-12">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <h3 className="max-w-[20ch] font-display text-4xl leading-none md:text-5xl">
                Write to us, or find us at a session.
              </h3>
              <Link
                href="/members"
                className="group inline-flex h-14 items-center gap-4 bg-ink pl-3 pr-5 font-medium text-paper transition-colors duration-500 ease-flow hover:bg-clay-deep"
              >
                <span className="flex -space-x-3" aria-hidden>
                  {members.slice(0, 4).map((m) => (
                    <span
                      key={m.slug}
                      className={cn(
                        "grid size-9 place-items-center rounded-full border-2 border-ink font-display text-sm transition-transform duration-500 ease-flow group-hover:translate-x-0.5",
                        groupTone[m.group],
                      )}
                    >
                      {initials(m.name)}
                    </span>
                  ))}
                </span>
                Everyone, with bios
                <ArrowRight className="size-4 transition-transform duration-500 ease-flow group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="mx-auto max-w-[90rem] px-6 md:px-12">
            <PeopleStage people={people} />
          </div>
          <p className="mx-auto mt-4 max-w-6xl px-6 md:px-12">
            <Ph>Names, bios and contacts are placeholders</Ph>
          </p>
        </section>
      </div>

      {/* Join */}
      <section id="join" className="relative overflow-hidden bg-clay text-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-20 md:grid-cols-[1fr_auto] md:px-12 md:py-28">
          <div>
            <Hud className="opacity-70">Recruitment</Hud>
            <h2 className="mt-3 max-w-[14ch] font-display text-[clamp(2.75rem,1.7rem+4.6vw,6rem)] leading-[0.96]">
              The best time to join is at the start.
            </h2>
            <p className="mt-5 max-w-[44ch] font-serif text-xl leading-relaxed">
              Foundations runs through October and November and assumes no prior experience. Any
              department is welcome.
            </p>
          </div>
          <Link
            href="/join"
            className="inline-flex h-14 items-center gap-3 bg-ink px-8 text-lg font-medium text-paper transition-colors duration-500 ease-flow hover:bg-paper hover:text-ink"
          >
            Apply to join
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-paper-raised">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.1fr_1fr] md:px-12 md:py-28">
          <div>
            <Hud className="text-ink-faint">Contact and socials</Hud>
            <h2 className="mt-3 max-w-[12ch] font-display text-[clamp(2.75rem,1.7rem+4.6vw,6rem)] leading-[0.96]">
              Say hello.
            </h2>
            <a
              href={`mailto:${club.contactEmail}`}
              className="mt-8 inline-flex items-center gap-3 border-b-2 border-ink pb-1 font-display text-3xl transition-colors duration-500 ease-flow hover:border-clay-deep hover:text-clay-deep md:text-4xl"
            >
              <Mail className="size-7" aria-hidden />
              {club.contactEmail}
            </a>
            <p className="mt-5 max-w-[40ch] font-serif text-lg text-ink-soft">
              Questions about joining, events or working with the club. We read everything.
            </p>
            <Ph className="mt-5">Email and links are placeholders</Ph>
          </div>
          <div className="space-y-10">
            <div>
              <Hud className="text-ink-faint">Find us online</Hud>
              <ul className="mt-3 border-t border-ink">
                {club.socials.map((s) => (
                  <li key={s.label} className="border-b border-ink/20">
                    <a
                      href={s.href}
                      className="group flex items-center justify-between py-4 font-display text-2xl transition-colors duration-500 ease-flow hover:text-clay-deep"
                    >
                      {s.label}
                      <ArrowRight className="size-5 transition-transform duration-500 ease-flow group-hover:translate-x-1" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {faculty.length > 0 && (
              <div>
                <Hud className="text-ink-faint">Faculty coordinators</Hud>
                <ul className="mt-3 space-y-3">
                  {faculty.map((f) => (
                    <li key={f.slug}>
                      <p className="font-medium">{f.name}</p>
                      <a
                        href={`mailto:${f.email}`}
                        className="text-sm text-ink-soft underline-offset-4 transition-colors duration-500 ease-flow hover:text-clay-deep hover:underline"
                      >
                        {f.email}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
