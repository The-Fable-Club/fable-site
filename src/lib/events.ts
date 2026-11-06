// Client-safe event types and helpers (no server imports). Data comes from
// src/lib/content.ts, which turns the published release into these shapes.
import type { ApplyInfo } from "./contract";
import type { EventStatus, RegistrationState } from "./event-logic";

export type { EventStatus, RegistrationState };

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
  /** First/last day the event covers; absent when the date is "to be announced" or free text without a month. */
  start?: string;
  end?: string;
  /** The exact day is not decided (typed text, a legacy month, or "to be announced" with a hidden placeholder place). */
  tentative: boolean;
  /** How the date was entered. A "tba" event may still have a start: a hidden placeholder that only positions it on the timeline. */
  dateMode: "exact" | "month" | "text" | "tba";
  /** The date as shown to people ("20 Nov 2026", "January 2027", "Early February", "Date to be announced"). */
  dateText: string;
  /** Display strings: always something to show, "to be announced" when undecided. */
  time: string;
  venue: string;
  seats?: string;
  summary: string;
  description: string[];
  highlights: string[];
  art: string; // path under /public
  photo?: string;
  /** Uploaded media (schema 2): up to one loop video and two pictures, for the Events stage and the event page. */
  media?: { video?: string; pics: string[] };
  apply: ApplyInfo;
  registration: RegistrationState;
  /** Outside form link when apply.mode is "link". */
  applyUrl?: string;
  /** The event's official VIT EventHub page. When set, registration happens there; the button links straight to it. */
  eventhubUrl?: string;
  /** Answered questions the club chose to show. */
  faq: { question: string; answer: string }[];
  hub: HubItem[];
  /** Approved VIT On-Duty (OD) time slots. */
  odSlots?: string[];
};

export const bySlug = (events: ClubEvent[], slug: string) => events.find((e) => e.slug === slug);
export const isOpen = (e: ClubEvent) => e.status !== "past";
const byStart = (a: ClubEvent, b: ClubEvent) => (a.start ?? "9999").localeCompare(b.start ?? "9999") || a.title.localeCompare(b.title);
export const openEvents = (events: ClubEvent[]) => events.filter(isOpen).sort(byStart);
export const pastEvents = (events: ClubEvent[]) =>
  events.filter((e) => e.status === "past").sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""));
export const featured = (events: ClubEvent[]) =>
  events.find((e) => e.status === "active") ?? openEvents(events)[0];
/** Events where people can register right now (our form or an outside link). */
export const registrationOpen = (events: ClubEvent[]) => openEvents(events).filter((e) => e.registration === "open");

export type HeroStrip = { label: "Live now" | "Registrations open" | "Next up"; event: ClubEvent };
/**
 * What the home page announces: a live event, an event with registration open
 * (never the same one twice), or - when neither exists - the next one coming up.
 */
export function heroStrips(events: ClubEvent[]): HeroStrip[] {
  const open = openEvents(events);
  const live = open.find((e) => e.status === "active");
  const reg = open.find((e) => e.registration === "open" && e !== live);
  const strips: HeroStrip[] = [];
  if (live) strips.push({ label: "Live now", event: live });
  if (reg) strips.push({ label: "Registrations open", event: reg });
  if (strips.length === 0 && open[0]) strips.push({ label: "Next up", event: open[0] });
  return strips;
}

/**
 * Where the "Register on EventHub" button may send someone: the event's own EventHub page, only while
 * registration is open, and only on the real EventHub host (checked again here, not just in the CMS).
 */
export function eventhubTarget(e: Pick<ClubEvent, "eventhubUrl" | "registration"> | undefined): string | null {
  if (!e?.eventhubUrl || e.registration !== "open") return null;
  try {
    const u = new URL(e.eventhubUrl);
    return u.protocol === "https:" && u.hostname === "eventhubcc.vit.ac.in" ? u.toString() : null;
  } catch {
    return null;
  }
}

export const dateLabel = (e: Pick<ClubEvent, "dateText">) => e.dateText;
