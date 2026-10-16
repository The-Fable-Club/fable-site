import { createReader } from "@keystatic/core/reader";
import { cacheLife, cacheTag } from "next/cache";
import config from "../../keystatic.config";
import type { ClubEvent, EventStatus, HubItem } from "@/lib/events";
import type { Member } from "@/lib/members";

export type Club = {
  name: string;
  tagline: string;
  description: string;
  institution: string;
  office: string;
  contactEmail: string;
  disclaimer: string;
  socials: { label: string; href: string }[];
  stats: { label: string; value: string; note: string }[];
  phases: { name: string; span: string }[];
};

export type AimModel = "pages" | "book" | "blocks" | "steps" | "network";
export type Aim = { title: string; body: string; model: AimModel };

export type Content = {
  club: Club;
  aims: Aim[];
  events: ClubEvent[];
  members: Member[];
};

const reader = createReader(process.cwd(), config);

const art = (key: string) => `/art/${key || "sprouts"}.svg`;
const ymd = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d); // YYYY-MM-DD in IST

/**
 * Everything the site renders, read from ./content (the CMS files).
 * Cached for an hour, so event status (Live / Open / Past) follows the
 * calendar without a redeploy. The cache is tagged "content": in development
 * a small watcher (components/dev-content-refresh.tsx) clears it when a CMS
 * edit changes the files, so edits show up straight away.
 */
export async function getContent(): Promise<Content> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");

  const today = ymd(new Date());

  const [clubRaw, aimsRaw, eventEntries, memberEntries] = await Promise.all([
    reader.singletons.club.read(),
    reader.singletons.aims.read(),
    reader.collections.events.all(),
    reader.collections.members.all(),
  ]);

  const club: Club = {
    name: "The Fable Club",
    tagline: clubRaw?.tagline ?? "",
    description: clubRaw?.description ?? "",
    institution: clubRaw?.institution ?? "",
    office: clubRaw?.office ?? "",
    contactEmail: clubRaw?.contactEmail ?? "",
    disclaimer: clubRaw?.disclaimer ?? "",
    socials: (clubRaw?.socials ?? []).map((s) => ({ label: s.label, href: s.href })),
    stats: (clubRaw?.stats ?? []).map((s) => ({ label: s.label, value: s.value, note: s.note })),
    phases: (clubRaw?.phases ?? []).map((p) => ({ name: p.name, span: p.span })),
  };

  const aims: Aim[] = (aimsRaw?.aims ?? []).map((a) => ({
    title: a.title,
    body: a.body,
    model: a.model as AimModel,
  }));

  const events: ClubEvent[] = eventEntries.map(({ slug, entry: e }) => {
    const end = e.end ?? undefined;
    const last = end ?? e.start ?? today;
    const auto: EventStatus = !e.start
      ? "upcoming"
      : last < today
        ? "past"
        : e.start <= today
          ? "active"
          : "upcoming";
    const status = e.status === "auto" ? auto : (e.status as EventStatus);
    const hub: HubItem[] = (e.hub ?? [])
      .map((h, i) => ({
        id: `${slug}-${i}`,
        kind: h.kind as HubItem["kind"],
        title: h.title,
        body: h.body || undefined,
        href: h.href || undefined,
        postedBy: h.postedBy,
        postedAt: h.postedAt ?? today,
      }))
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    return {
      slug,
      title: e.title,
      kind: e.kind,
      phase: Number(e.phase) as ClubEvent["phase"],
      status,
      start: e.start ?? today,
      end,
      time: e.time,
      venue: e.venue,
      summary: e.summary,
      description: e.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
      highlights: [...e.highlights],
      art: art(e.art),
      photo: e.photo || undefined,
      applyUrl: e.applyUrl || undefined,
      seats: e.seats || undefined,
      hub,
    };
  });

  const members: Member[] = memberEntries
    .map(({ slug, entry: m }) => ({
      slug,
      name: m.name,
      role: m.role,
      group: m.group as Member["group"],
      order: m.order ?? 50,
      department: m.department,
      year: m.year || undefined,
      bio: m.bio,
      focus: [...m.focus],
      email: m.email,
      linkedin: m.linkedin || undefined,
      github: m.github || undefined,
      art: art(m.art),
      photo: m.photo || undefined,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return { club, aims, events, members };
}
