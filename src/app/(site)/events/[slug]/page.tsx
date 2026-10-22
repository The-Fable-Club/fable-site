import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, Lock, MapPin, Users } from "lucide-react";
import { Hud, Ph } from "@/components/hud";
import { StatusDot } from "@/components/timeline";
import { getContent } from "@/lib/content";
import { bySlug, dateLabel, eventhubTarget, isOpen } from "@/lib/events";
import { RegisterForm } from "@/components/register-form";
import { AskForm } from "@/components/ask-form";

export async function generateStaticParams() {
  const { events } = await getContent();
  const slugs = events.map((e) => ({ slug: e.slug }));
  // Cache Components needs at least one param; with no events this one just 404s.
  return slugs.length ? slugs : [{ slug: "_none" }];
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

async function EventDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  if (!e) notFound();
  const open = isOpen(e);
  // Only ever the event's own link, only while open, only on the real EventHub host.
  const eventhub = eventhubTarget(e);

  return (
    <>
      <header className="border-b border-ink/15 bg-paper">
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-8 md:px-12 md:pb-20">
          <Link
            href="/events"
            className="inline-flex h-11 items-center gap-2 bg-ink px-5 font-medium text-paper transition-colors duration-500 ease-flow hover:bg-clay-deep"
          >
            <ArrowLeft className="size-4" aria-hidden /> All events
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
              {/* Phones: the register button would otherwise sit below the whole page; repeat it up here. */}
              {eventhub && (
                <a
                  href={eventhub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 flex h-14 items-center justify-between bg-clay px-5 text-lg font-medium text-ink transition-colors duration-500 ease-flow hover:bg-clay-deep hover:text-paper md:hidden"
                >
                  Register on EventHub
                  <ArrowUpRight className="size-5" aria-hidden />
                </a>
              )}
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

            {e.faq.length > 0 && (
              <>
                <h2 className="mt-14 font-display text-3xl leading-none">Questions people asked</h2>
                <dl className="mt-6 divide-y divide-ink/15 border-y border-ink/15">
                  {e.faq.map((f, i) => (
                    <div key={i} className="py-5">
                      <dt className="font-display text-xl leading-snug">{f.question}</dt>
                      <dd className="mt-2 max-w-[62ch] whitespace-pre-line font-serif text-lg leading-relaxed text-ink-soft">{f.answer}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}

            {open && (
              <div id="ask" className="mt-14 max-w-xl">
                <h2 className="font-display text-3xl leading-none">Have a question?</h2>
                <div className="mt-6">
                  <AskForm slug={e.slug} />
                </div>
              </div>
            )}
          </div>

          <aside className="md:sticky md:top-8 md:self-start">
            <div className="border border-ink bg-paper-raised">
              <dl className="divide-y divide-ink/15">
                <div className="flex gap-3 p-5">
                  <Clock className="mt-0.5 size-5 shrink-0 text-clay-deep" aria-hidden />
                  <div>
                    <dt className="hud text-ink-faint">When</dt>
                    <dd className="mt-1">
                      {dateLabel(e)}
                      {e.tentative && e.start && e.dateMode !== "tba" && <span className="hud ml-2 border border-dashed border-ink-faint px-1 py-0.5 text-ink-faint">Tentative</span>}
                    </dd>
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
                    {eventhub && (
                      <div>
                        <a
                          href={eventhub}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-14 items-center justify-between bg-clay px-5 text-lg font-medium text-ink transition-colors duration-500 ease-flow hover:bg-clay-deep hover:text-paper"
                        >
                          Register on EventHub
                          <ArrowUpRight className="size-5" aria-hidden />
                        </a>
                        <p className="mt-2 text-xs text-ink-faint">The official VIT registration (eventhubcc.vit.ac.in). It asks for your VTOP login there, never here.</p>
                      </div>
                    )}
                    {e.registration === "open" && !e.eventhubUrl && e.applyUrl && (
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
                    {e.registration === "soon" && (
                      <p className="border border-dashed border-ink/50 p-3 text-sm text-ink-soft">Registration opens soon. Check back here.</p>
                    )}
                    {e.registration === "closed" && (
                      <p className="border border-ink/30 p-3 text-sm text-ink-soft">Registration is closed for this event.</p>
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
            {e.registration === "open" && e.apply.mode === "form" && (
              <div className="mt-6">
                <RegisterForm slug={e.slug} title={e.title} heading={e.eventhubUrl ? "On-spot / club sign-up" : undefined} />
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

// `params` is read inside a Suspense boundary so navigation to this page can
// show instantly while the event data resolves.
export default function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[70dvh] bg-paper" />}>
      <EventDetail params={params} />
    </Suspense>
  );
}
