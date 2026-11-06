import type { Metadata } from "next";
import { pageMeta } from "@/lib/meta";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock, GraduationCap, Lock, MapPin, Users } from "lucide-react";
import { HomeCrumb, Hud, Ph } from "@/components/hud";
import { StatusDot } from "@/components/timeline";
import { getContent } from "@/lib/content";
import { bySlug, dateLabel, eventhubTarget, isOpen } from "@/lib/events";
import { RegisterForm } from "@/components/register-form";
import { EventMediaFigure } from "@/components/event-media-figure";
import { resolveEventMedia } from "@/lib/event-media";
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
  return e ? pageMeta(e.title, e.summary, `/events/${e.slug}`) : {};
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
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-12 md:py-10">
          <HomeCrumb crumb="Event" parent={{ href: "/events", label: "All events" }} />
          <div className="mt-6 grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-3">
                <StatusDot status={e.status} />
                <Hud className="text-ink-faint">
                  {e.kind}
                  {e.phase > 0 && ` · Phase ${e.phase}`}
                </Hud>
              </div>
              <h1 className="mt-4 max-w-[22ch] font-display text-[clamp(2.25rem,1.6rem+2.6vw,3.75rem)] leading-[1] tracking-tight">
                {e.title}
              </h1>
              <p className="mt-3 max-w-[60ch] font-serif text-base leading-relaxed text-ink-soft md:text-lg">
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
              width={140}
              height={140}
              className="hidden size-28 object-contain md:block lg:size-32"
            />
          </div>
        </div>
      </header>

      {/* Uploaded pictures or loop (schema 2). No uploads: the page keeps its art, as before. */}
      {(() => {
        const media = resolveEventMedia(e, 0);
        if (media.placeholder) return null;
        return (
          <div className="border-b border-ink/15 bg-paper">
            <div className="mx-auto max-w-6xl px-6 py-8 md:px-12">
              <EventMediaFigure media={media} title={e.title} />
            </div>
          </div>
        );
      })()}

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
                <div className="relative p-5 pl-[3.25rem]">
                  <dt className="hud text-ink-faint">
                    <Clock className="absolute left-5 top-[1.375rem] size-5 text-clay-deep" aria-hidden />
                    When
                    </dt>
                  <dd className="mt-1">
                    {dateLabel(e)}
                    {e.tentative && e.start && e.dateMode !== "tba" && <span className="hud ml-2 border border-dashed border-ink-faint px-1 py-0.5 text-ink-faint">Tentative</span>}
                  </dd>
                  <dd className="text-ink-soft">{e.time}</dd>
                </div>
                <div className="relative p-5 pl-[3.25rem]">
                  <dt className="hud text-ink-faint">
                    <MapPin className="absolute left-5 top-[1.375rem] size-5 text-clay-deep" aria-hidden />
                    Where
                    </dt>
                  <dd className="mt-1">{e.venue}</dd>
                </div>
                {e.seats && (
                  <div className="relative p-5 pl-[3.25rem]">
                    <dt className="hud text-ink-faint">
                      <Users className="absolute left-5 top-[1.375rem] size-5 text-clay-deep" aria-hidden />
                      Who
                      </dt>
                    <dd className="mt-1">{e.seats}</dd>
                  </div>
                )}
                {e.odSlots && e.odSlots.length > 0 && (
                  <div className="relative p-5 pl-[3.25rem]">
                    <dt className="hud text-ink-faint">
                      <GraduationCap className="absolute left-5 top-[1.375rem] size-5 text-clay-deep" aria-hidden />
                      On-Duty (OD)
                    </dt>
                    <dd className="mt-1 text-sm font-medium">Approved time slots:</dd>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {e.odSlots.map((s) => (
                        <span key={s} className="border border-ink/40 bg-paper px-2 py-0.5 font-mono text-xs text-ink/80">
                          {s}
                        </span>
                      ))}
                    </dd>
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
