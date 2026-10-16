import Link from "next/link";
import { Hud } from "@/components/hud";

export default function NotFound() {
  return (
    <section className="grid min-h-[70dvh] place-items-center bg-paper px-6 py-24">
      <div className="max-w-xl">
        <Hud className="text-ink-faint">404</Hud>
        <h1 className="mt-3 font-display text-6xl leading-none">That page isn’t here.</h1>
        <p className="mt-5 font-serif text-xl text-ink-soft">
          It may have moved, or the event it belonged to has ended. Participant hubs only exist
          for active and upcoming events.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className="inline-flex h-12 items-center bg-ink px-6 font-medium text-paper hover:bg-clay-deep">
            Back to home
          </Link>
          <Link href="/events" className="inline-flex h-12 items-center border border-ink px-6 font-medium hover:bg-ink hover:text-paper">
            See events
          </Link>
        </div>
      </div>
    </section>
  );
}
