import { CalendarClock, FileText, Link2, Megaphone } from "lucide-react";
import type { HubItem } from "@/lib/events";
import { Hud } from "@/components/hud";

const kinds = {
  announcement: { label: "Update", icon: Megaphone },
  link: { label: "Link", icon: Link2 },
  file: { label: "File", icon: FileText },
  schedule: { label: "Schedule", icon: CalendarClock },
} as const;

const fmt = (d: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(d + "T00:00:00Z"),
  );

// The participant feed: what the board posted for this event. Posts are written in the CMS
// (the event's hub) and reach the site with the next Publish; nothing is posted from here.
export function HubFeed({ items }: { items: HubItem[] }) {
  return (
    <div>
      <Hud className="text-ink-faint">
        {items.length} {items.length === 1 ? "post" : "posts"} from the board
      </Hud>

      {items.length === 0 ? (
        <p className="mt-8 border border-dashed border-ink/40 p-8 text-ink-soft">
          Nothing posted yet. Updates, links and files from the board will show up here before the
          event.
        </p>
      ) : (
        <ul className="mt-8 border-t border-ink">
          {items.map((it) => {
            const K = kinds[it.kind];
            return (
              <li key={it.id} className="grid gap-x-6 gap-y-2 border-b border-ink/20 py-6 md:grid-cols-[9rem_1fr]">
                <div className="flex items-center gap-2 md:flex-col md:items-start md:gap-1">
                  <span className="inline-flex items-center gap-2">
                    <K.icon className="size-4 text-clay-deep" aria-hidden />
                    <Hud>{K.label}</Hud>
                  </span>
                  <Hud className="text-ink-faint">{fmt(it.postedAt)}</Hud>
                </div>
                <div>
                  <h3 className="font-display text-2xl leading-tight">{it.title}</h3>
                  {it.body && <p className="mt-2 max-w-[60ch] font-serif text-ink-soft">{it.body}</p>}
                  {it.href && (
                    <a
                      href={it.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block border-b border-ink pb-0.5 text-sm font-medium hover:text-clay-deep"
                    >
                      Open {it.kind === "file" ? "file" : "link"}
                    </a>
                  )}
                  <Hud className="mt-3 block text-ink-faint">Posted by {it.postedBy}</Hud>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
