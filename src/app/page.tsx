import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Banner, Hud, Ph } from "@/components/hud";
import { Hero } from "@/components/home/hero";
import { AimsDial } from "@/components/home/aims-dial";
import { FeaturedEvent } from "@/components/home/featured-event";
import { PeopleStrip } from "@/components/home/people-strip";
import { SectionIndex } from "@/components/home/section-index";
import { Timeline } from "@/components/timeline";
import { club, phases, stats } from "@/data/club";
import { events, featured } from "@/data/events";
import { members } from "@/data/members";

export default function Home() {
  const hero = featured();
  const board = members.filter((m) => m.group !== "Leads");

  return (
    <>
      <SectionIndex />
      <Hero />

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
              <p className="font-serif text-xl leading-relaxed text-ink-soft">
                {club.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {phases.map((p) => (
                  <div key={p.n} className="min-w-[10rem]">
                    <Hud className="text-ink-faint">Phase {p.n}</Hud>
                    <p className="font-display text-xl leading-tight">
                      {p.name}
                    </p>
                    <Hud className="text-ink-faint">{p.span}</Hud>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <dl className="mx-auto grid max-w-6xl border-y border-ink/20 md:grid-cols-4 md:border-x">
            {stats.map((s) => (
              <div
                key={s.label}
                className="border-b border-ink/20 px-6 py-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <dt className="hud text-ink-faint">{s.label}</dt>
                <dd className="mt-2 font-display text-6xl leading-none">
                  {s.value}
                </dd>
                <dd className="mt-3 max-w-[22ch] text-sm text-ink-soft">
                  {s.note}
                </dd>
              </div>
            ))}
          </dl>
          <div className="h-16 md:h-24" />
        </section>
        <AimsDial />
      </div>

      {/* Events */}
      <div id="events">
        <Banner
          label="Highlighted and upcoming"
          title="Events"
          art="/art/party.svg"
          tone="manilla"
        />
        <section className="bg-paper-sunken py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6 md:px-12">
            {hero && <FeaturedEvent event={hero} />}

            <div className="mt-20 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Hud className="text-ink-faint">Timeline</Hud>
                <h3 className="font-display text-4xl leading-none md:text-5xl">
                  The year, in order
                </h3>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 border-b border-ink pb-0.5 font-medium transition-colors hover:text-clay-deep"
              >
                All events and history
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-[90rem] px-6 md:px-12">
            <Timeline events={events} />
          </div>
        </section>
      </div>

      {/* People */}
      <div id="people">
        <Banner
          label="Board and contacts"
          title="People"
          art="/art/hands-together.svg"
          tone="ink"
        />
        <section className="bg-paper py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6 md:px-12">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h3 className="max-w-[20ch] font-display text-4xl leading-none md:text-5xl">
                Write to us, or find us at a session.
              </h3>
              <Link
                href="/members"
                className="inline-flex items-center gap-2 border-b border-ink pb-0.5 font-medium transition-colors hover:text-clay-deep"
              >
                Everyone, with bios
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="mx-auto max-w-[90rem] px-6 md:px-12">
            <PeopleStrip people={board} />
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
              Foundations runs through October and November and assumes no prior
              experience. Any department is welcome.
            </p>
          </div>
          <Link
            href="/join"
            className="inline-flex h-14 items-center gap-3 bg-ink px-8 text-lg font-medium text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Apply to join
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
