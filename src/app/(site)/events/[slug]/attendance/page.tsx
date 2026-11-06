import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Hud } from "@/components/hud";
import { getContent } from "@/lib/content";
import { bySlug } from "@/lib/events";
import { AttendanceForm } from "@/components/attendance-form";

export async function generateStaticParams() {
  const { events } = await getContent();
  return events.length ? events.map((e) => ({ slug: e.slug })) : [{ slug: "_none" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  return e ? { title: `${e.title}: Attendance Check-in`, robots: { index: false } } : {};
}

async function AttendanceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  if (!e) notFound();

  return (
    <section className="min-h-[80dvh] bg-paper">
      <div className="mx-auto max-w-xl px-6 pb-20 pt-8 md:px-12">
        <Link
          href={`/events/${e.slug}`}
          className="inline-flex h-11 items-center gap-2 bg-ink px-5 font-medium text-paper transition-colors duration-500 ease-flow hover:bg-clay-deep"
        >
          <ArrowLeft className="size-4" aria-hidden /> {e.title}
        </Link>

        <Hud className="mt-10 block text-ink-faint">Live Event Check-in</Hud>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] sm:text-5xl">
          Mark your attendance
        </h1>
        <p className="mt-4 font-serif text-lg text-ink-soft">
          At the event, enter your registration number and the 6-digit rolling code shown on the organisers&apos; presenter screen.
        </p>

        {e.venue && (
          <div className="mt-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/70">
            <span>Venue: {e.venue}</span>
            {e.dateText && <span>· {e.dateText}</span>}
          </div>
        )}

        <AttendanceForm eventSlug={e.slug} />
      </div>
    </section>
  );
}

export default function AttendancePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[80dvh] bg-paper" />}>
      <AttendanceDetail params={params} />
    </Suspense>
  );
}
