import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Hud, Ph } from "@/components/hud";
import { HubFeed } from "@/components/hub-feed";
import { StatusDot } from "@/components/timeline";
import { getContent } from "@/lib/content";
import { bySlug, dateLabel, isOpen } from "@/lib/events";

// Hubs only exist for active and upcoming events.
export async function generateStaticParams() {
  const { events } = await getContent();
  return events.filter(isOpen).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  return e ? { title: `${e.title} — participant hub`, robots: { index: false } } : {};
}

async function HubDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  if (!e || !isOpen(e)) notFound();

  return (
    <>
      <header className="border-b border-ink/15 bg-night text-paper">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-8 md:px-12 md:pb-16">
          <Link
            href={`/events/${e.slug}`}
            className="hud inline-flex items-center gap-1.5 text-night-faint transition-colors hover:text-paper"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> {e.title}
          </Link>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <StatusDot status={e.status} />
            <Hud className="text-night-faint">Participant hub · {dateLabel(e)}</Hud>
          </div>
          <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(2.5rem,1.6rem+3.8vw,5rem)] leading-[0.98]">
            {e.title}
          </h1>
          <p className="mt-5 max-w-[56ch] font-serif text-lg leading-relaxed text-night-soft">
            Everything the board shares with participants of this event: updates, links, files
            and schedules. Check back before each session.
          </p>
          <Ph className="mt-6 border-clay text-clay">
            Placeholder: no sign-in yet, so this page is open to anyone with the link
          </Ph>
        </div>
      </header>
      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-14 md:px-12 md:py-20">
          <HubFeed initial={e.hub} />
        </div>
      </section>
    </>
  );
}

// `params` is read inside a Suspense boundary so navigation to this page can
// show instantly while the event data resolves.
export default function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[70dvh] bg-paper" />}>
      <HubDetail params={params} />
    </Suspense>
  );
}
