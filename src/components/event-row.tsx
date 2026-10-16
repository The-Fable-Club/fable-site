import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { dateLabel, type ClubEvent } from "@/data/events";
import { Hud } from "@/components/hud";
import { StatusDot } from "@/components/timeline";
import { cn } from "@/lib/utils";

export function EventRow({ event: e }: { event: ClubEvent }) {
  const past = e.status === "past";
  return (
    <Link
      href={`/events/${e.slug}`}
      className={cn(
        "group grid items-center gap-x-8 gap-y-3 border-b border-ink/20 px-1 py-7 transition-colors hover:bg-paper-raised md:grid-cols-[11rem_1fr_auto] md:px-4",
        past && "text-ink-soft",
      )}
    >
      <div>
        <Hud className="text-ink-faint">{dateLabel(e)}</Hud>
        <div className="mt-2 flex items-center gap-2">
          <StatusDot status={e.status} />
          <Hud className="text-ink-faint">{e.kind}</Hud>
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-2xl leading-tight text-ink md:text-3xl">{e.title}</h3>
        <p className="mt-2 max-w-[60ch] font-serif text-ink-soft">{e.summary}</p>
      </div>
      <div className="flex items-center gap-4">
        <Image
          src={e.art}
          alt=""
          width={72}
          height={72}
          className={cn(
            "hidden size-16 object-contain transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 md:block",
            past && "opacity-50 grayscale",
          )}
        />
        <ArrowUpRight
          aria-hidden
          className="size-6 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}
