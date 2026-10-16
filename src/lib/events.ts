// Client-safe event types and helpers (no server imports). Data comes from
// src/lib/content.ts, which reads the CMS files.

export type EventStatus = "active" | "upcoming" | "past";

export type HubItem = {
  id: string;
  kind: "announcement" | "link" | "file" | "schedule";
  title: string;
  body?: string;
  href?: string;
  postedBy: string;
  postedAt: string; // ISO date
};

export type ClubEvent = {
  slug: string;
  title: string;
  kind: string;
  phase: 0 | 1 | 2 | 3 | 4;
  status: EventStatus;
  start: string; // YYYY-MM-DD
  end?: string;
  time: string;
  venue: string;
  summary: string;
  description: string[];
  highlights: string[];
  art: string; // path under /public
  photo?: string;
  applyUrl?: string;
  seats?: string;
  hub: HubItem[];
};

export const bySlug = (events: ClubEvent[], slug: string) => events.find((e) => e.slug === slug);
export const isOpen = (e: ClubEvent) => e.status !== "past";
export const openEvents = (events: ClubEvent[]) =>
  events.filter(isOpen).sort((a, b) => a.start.localeCompare(b.start));
export const pastEvents = (events: ClubEvent[]) =>
  events.filter((e) => e.status === "past").sort((a, b) => b.start.localeCompare(a.start));
export const featured = (events: ClubEvent[]) =>
  events.find((e) => e.status === "active") ?? openEvents(events)[0];

const fmt = (d: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o }).format(new Date(d + "T00:00:00Z"));

export const dateLabel = (e: Pick<ClubEvent, "start" | "end">) => {
  const s = fmt(e.start, { day: "numeric", month: "short", year: "numeric" });
  if (!e.end) return s;
  const a = fmt(e.start, { day: "numeric", month: "short" });
  const b = fmt(e.end, { day: "numeric", month: "short", year: "numeric" });
  return `${a} – ${b}`;
};
export const shortDate = (d: string) => fmt(d, { day: "numeric", month: "short" });
