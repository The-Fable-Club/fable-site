import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Hud } from "@/components/hud";
import { getContent } from "@/lib/content";
import { bySlug, isOpen } from "@/lib/events";

// UI ONLY. Where a student marks attendance at the event: registration number + the code shown on the
// organiser's screen. Nothing is sent yet (every control is disabled) and nothing links here.
// The backend is being built separately; see the CMS repo's docs/ATTENDANCE-FEASIBILITY.md.

export async function generateStaticParams() {
  const { events } = await getContent();
  const slugs = events.filter(isOpen).map((e) => ({ slug: e.slug }));
  return slugs.length ? slugs : [{ slug: "_none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  return e ? { title: `${e.title}: attendance`, robots: { index: false } } : {};
}

const input = "mt-1.5 h-14 w-full cursor-not-allowed border border-ink/30 bg-paper px-4 font-mono text-2xl tracking-widest text-ink-faint";

async function AttendanceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  if (!e || !isOpen(e)) notFound();

  return (
    <section className="min-h-[80dvh] bg-paper">
      <div className="mx-auto max-w-xl px-6 pb-20 pt-8 md:px-12">
        <Link
          href={`/events/${e.slug}`}
          className="inline-flex h-11 items-center gap-2 bg-ink px-5 font-medium text-paper transition-colors duration-500 ease-flow hover:bg-clay-deep"
        >
          <ArrowLeft className="size-4" aria-hidden /> {e.title}
        </Link>

        <Hud className="mt-10 block text-ink-faint">Attendance</Hud>
        <h1 className="mt-2 font-display text-5xl leading-[1.02]">Mark your attendance</h1>
        <p className="mt-4 font-serif text-lg text-ink-soft">
          At the event, enter your registration number and the code on the organisers&apos; screen. Each check-in is only open for a short time.
        </p>

        <div role="status" className="mt-8 border border-dashed border-clay-deep p-4 text-sm text-clay-deep">
          Attendance is not open yet. This page will work during the event.
        </div>

        <form aria-disabled className="mt-8 grid gap-6" action="#">
          <label className="block">
            <span className="hud text-ink-faint">Registration number</span>
            <input disabled placeholder="25ABC1234" className={input} />
          </label>
          <label className="block">
            <span className="hud text-ink-faint">Code on the screen</span>
            <input disabled inputMode="numeric" placeholder="••••••" className={input} />
          </label>
          <button type="button" disabled className="h-14 cursor-not-allowed bg-ink/30 px-10 text-lg font-medium text-paper">
            Mark me present
          </button>
        </form>
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
