import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, Lock, MapPin, Users } from "lucide-react";
import { Hud, Ph } from "@/components/hud";
import { StatusDot } from "@/components/timeline";
import { getContent } from "@/lib/content";
import { bySlug, dateLabel, isOpen } from "@/lib/events";

export async function generateStaticParams() {
  const { events } = await getContent();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  return e ? { title: e.title, description: e.summary } : {};
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  if (!e) notFound();
  const open = isOpen(e);

  return (
    <>
      <header className="border-b border-ink/15 bg-paper">
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-8 md:px-12 md:pb-20">
          <Link
            href="/events"
            className="hud inline-flex items-center gap-1.5 text-ink-faint transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> All events
          </Link>
          <div className="mt-10 grid items-end gap-10 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-3">
                <StatusDot status={e.status} />
                <Hud className="text-ink-faint">
                  {e.kind}
                  {e.phase > 0 && ` · Phase ${e.phase}`}
                </Hud>
              </div>
              <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.75rem,1.7rem+4.6vw,5.5rem)] leading-[0.98] tracking-tight">
                {e.title}
              </h1>
              <p className="mt-6 max-w-[56ch] font-serif text-xl leading-relaxed text-ink-soft">
                {e.summary}
              </p>
            </div>
            <Image
              src={e.art}
              alt=""
              width={240}
              height={240}
              className="hidden size-48 object-contain md:block"
            />
          </div>
        </div>
      </header>

      <div className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 md:grid-cols-[1fr_22rem] md:px-12 md:py-20">
          <div>
            <h2 className="font-display text-3xl leading-none">About this event</h2>
            <div className="mt-6 space-y-5 font-serif text-lg leading-relaxed text-ink-soft">
              {e.description.map((p, i) => (
                <p key={i} className="max-w-[62ch]">
                  {p}
                </p>
              ))}
            </div>

            <h2 className="mt-14 font-display text-3xl leading-none">What happens</h2>
            <ul className="mt-6 divide-y divide-ink/15 border-y border-ink/15">
              {e.highlights.map((h) => (
                <li key={h} className="flex items-center gap-4 py-4">
                  <span aria-hidden className="size-2 shrink-0 bg-clay" />
                  <span className="text-lg">{h}</span>
                </li>
              ))}
            </ul>
            <Ph className="mt-8">Event details are placeholders</Ph>
          </div>

          <aside className="md:sticky md:top-8 md:self-start">
            <div className="border border-ink bg-paper-raised">
              <dl className="divide-y divide-ink/15">
                <div className="flex gap-3 p-5">
                  <Clock className="mt-0.5 size-5 shrink-0 text-clay-deep" aria-hidden />
                  <div>
                    <dt className="hud text-ink-faint">When</dt>
                    <dd className="mt-1">{dateLabel(e)}</dd>
                    <dd className="text-ink-soft">{e.time}</dd>
                  </div>
                </div>
                <div className="flex gap-3 p-5">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-clay-deep" aria-hidden />
                  <div>
                    <dt className="hud text-ink-faint">Where</dt>
                    <dd className="mt-1">{e.venue}</dd>
                  </div>
                </div>
                {e.seats && (
                  <div className="flex gap-3 p-5">
                    <Users className="mt-0.5 size-5 shrink-0 text-clay-deep" aria-hidden />
                    <div>
                      <dt className="hud text-ink-faint">Who</dt>
                      <dd className="mt-1">{e.seats}</dd>
                    </div>
                  </div>
                )}
              </dl>

              <div className="space-y-3 border-t border-ink p-5">
                {open ? (
                  <>
                    {e.applyUrl && (
                      <a
                        href={e.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-12 items-center justify-between bg-ink px-5 font-medium text-paper transition-colors hover:bg-clay-deep"
                      >
                        Apply for this event
                        <ArrowUpRight className="size-4" aria-hidden />
                      </a>
                    )}
                    <Link
                      href={`/events/${e.slug}/hub`}
                      className="flex h-12 items-center justify-between border border-ink px-5 font-medium transition-colors hover:bg-ink hover:text-paper"
                    >
                      Participant hub
                      <Lock className="size-4" aria-hidden />
                    </Link>
                    <p className="text-sm text-ink-faint">
                      The hub is where board members share links, files and updates with
                      participants.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-ink-soft">
                    This event has ended, so applications are closed. See{" "}
                    <Link href="/events#current" className="underline underline-offset-2">
                      what’s coming up
                    </Link>
                    .
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
