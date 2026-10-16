"use client";

import { useState } from "react";
import { CalendarClock, FileText, Link2, Megaphone, Plus } from "lucide-react";
import type { HubItem } from "@/data/events";
import { Hud, Ph } from "@/components/hud";
import { cn } from "@/lib/utils";

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

// Participant feed + a board-side "post" form. There is no backend yet, so
// posts made here only live in this browser tab; the form says so.
export function HubFeed({ initial }: { initial: HubItem[] }) {
  const [items, setItems] = useState<HubItem[]>(initial);
  const [open, setOpen] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    if (!title) return;
    const href = String(f.get("href") ?? "").trim();
    setItems((cur) => [
      {
        id: crypto.randomUUID(),
        kind: String(f.get("kind")) as HubItem["kind"],
        title,
        body: String(f.get("body") ?? "").trim() || undefined,
        href: href || undefined,
        postedBy: "You (demo post)",
        postedAt: new Date().toISOString().slice(0, 10),
      },
      ...cur,
    ]);
    e.currentTarget.reset();
    setOpen(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Hud className="text-ink-faint">{items.length} posts from the board</Hud>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex h-10 items-center gap-2 border border-ink px-4 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
        >
          <Plus className={cn("size-4 transition-transform", open && "rotate-45")} aria-hidden />
          Board: post to participants
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 grid gap-4 border border-ink bg-paper-raised p-5">
          <Ph className="w-fit">Demo only — posts are not saved or sent anywhere yet</Ph>
          <div className="grid gap-4 md:grid-cols-[10rem_1fr]">
            <label className="grid gap-1.5">
              <span className="hud text-ink-faint">Type</span>
              <select
                name="kind"
                defaultValue="announcement"
                className="h-11 border border-ink/40 bg-paper px-3"
              >
                {Object.entries(kinds).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="hud text-ink-faint">Title</span>
              <input
                name="title"
                required
                className="h-11 border border-ink/40 bg-paper px-3"
                placeholder="e.g. Room change for Thursday"
              />
            </label>
          </div>
          <label className="grid gap-1.5">
            <span className="hud text-ink-faint">Message (optional)</span>
            <textarea name="body" rows={3} className="border border-ink/40 bg-paper px-3 py-2" />
          </label>
          <label className="grid gap-1.5">
            <span className="hud text-ink-faint">Link or file URL (optional)</span>
            <input
              name="href"
              type="url"
              className="h-11 border border-ink/40 bg-paper px-3"
              placeholder="https://"
            />
          </label>
          <div>
            <button
              type="submit"
              className="h-11 bg-ink px-6 font-medium text-paper transition-colors hover:bg-clay-deep"
            >
              Post
            </button>
          </div>
        </form>
      )}

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
