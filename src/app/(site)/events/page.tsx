import type { Metadata } from "next";
import { Hud, PageHead, Ph } from "@/components/hud";
import { EventRow } from "@/components/event-row";
import { EventsCarousel } from "@/components/home/events-carousel";
import { Timeline } from "@/components/timeline";
import { getContent } from "@/lib/content";
import { openEvents, pastEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Current and upcoming events, the year’s timeline and event history.",
};

export default async function EventsPage() {
  const { events } = await getContent();
  const current = openEvents(events);
  const past = pastEvents(events);

  return (
    <>
      <PageHead
        crumb="Events"
        title="What’s on, and what already happened."
        lede={
          events.length === 0
            ? "No events are published yet. Check back soon."
            : `${events.length} event${events.length === 1 ? "" : "s"} so far. Open one to see the details and register.`
        }
        art="/art/party.svg"
      >
        <Ph className="mt-6">Dates, venues and links are placeholders</Ph>
      </PageHead>

      {current.length > 0 && (
        <section id="highlights" className="bg-paper-sunken py-16 md:py-24">
          <div className="mx-auto max-w-[90rem]">
            <EventsCarousel events={current} />
          </div>
        </section>
      )}

      <section id="current" className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-20">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-4xl leading-none md:text-5xl">Current and upcoming</h2>
            <Hud className="text-ink-faint">{current.length} open</Hud>
          </div>
          <div className="mt-8 border-t border-ink">
            {current.map((e) => (
              <EventRow key={e.slug} event={e} />
            ))}
            {current.length === 0 && <p className="py-8 font-serif text-ink-soft">Nothing is open right now. New events appear here as soon as they are published.</p>}
          </div>
        </div>
      </section>

      {events.length > 0 && (
      <section id="timeline" className="bg-paper-sunken">
        <div className="mx-auto max-w-6xl px-6 pt-16 md:px-12 md:pt-24">
          <Hud className="text-ink-faint">Timeline</Hud>
          <h2 className="font-display text-4xl leading-none md:text-5xl">The whole year</h2>
          <p className="mt-4 max-w-[52ch] font-serif text-ink-soft">
            Drag or scroll sideways. Each card opens that event.
          </p>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-24 md:px-12 md:pb-24">
          <Timeline events={events} bleed />
        </div>
      </section>
      )}

      <section id="history" className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-20">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-4xl leading-none md:text-5xl">Event history</h2>
            <Hud className="text-ink-faint">{past.length} past</Hud>
          </div>
          <div className="mt-8 border-t border-ink">
            {past.map((e) => (
              <EventRow key={e.slug} event={e} />
            ))}
            {past.length === 0 && <p className="py-8 font-serif text-ink-soft">No past events yet.</p>}
          </div>
        </div>
      </section>
    </>
  );
}
