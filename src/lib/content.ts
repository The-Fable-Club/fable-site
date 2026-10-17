import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { Snapshot, type SnapshotEvent, type SnapshotMember } from "@/lib/contract";
import { dateLabel, deriveStatus, eventWindow, registrationState } from "@/lib/event-logic";
import type { ClubEvent, HubItem } from "@/lib/events";
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
  /** Faculty and board: written in this repo (content/members), not the CMS. */
  members: Member[];
  /** General members: published from the CMS (the /members page). */
  community: Member[];
};

const root = process.cwd();
const art = (key: string) => `/art/${key || "sprouts"}.svg`;
const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d); // YYYY-MM-DD in IST
const readJson = <T>(...p: string[]) => JSON.parse(readFileSync(path.join(/*turbopackIgnore: true*/ root, ...p), "utf8")) as T;

/** The release fetched at build time (scripts/pull-snapshot.mjs), else the committed seed. Checked against the contract. */
export function loadSnapshot(): Snapshot {
  let raw: unknown;
  try {
    raw = readJson(".snapshot", "release.json");
  } catch {
    raw = readJson("content", "seed", "snapshot.json");
  }
  const parsed = Snapshot.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`The published release does not match the data contract:\n  ${first.join("\n  ")}`);
  }
  return parsed.data;
}

export function toClubEvent(e: SnapshotEvent, today: string): ClubEvent {
  const status = deriveStatus(e.date, today, e.status_override);
  const win = eventWindow(e.date);
  const apply = e.apply;
  const hub: HubItem[] = e.hub.map((h, i) => ({
    id: `${e.slug}-${i}`,
    kind: h.kind,
    title: h.title,
    body: h.body || undefined,
    href: h.href || undefined,
    postedBy: h.posted_by,
    postedAt: h.posted_at,
  }));
  return {
    slug: e.slug,
    title: e.title,
    kind: e.kind,
    phase: e.phase as ClubEvent["phase"],
    status,
    start: win?.start,
    end: win?.end ?? undefined,
    tentative: win?.tentative ?? e.date.mode !== "exact",
    dateText: dateLabel(e.date),
    time: e.time.mode === "text" ? e.time.text : "Time to be announced",
    venue:
      e.venue.mode === "text"
        ? e.venue.text
        : e.venue.mode === "online"
          ? e.venue.text
            ? `Online · ${e.venue.text}`
            : "Online"
          : "Venue to be announced",
    seats: e.seats.mode === "text" ? e.seats.text : e.seats.mode === "open" ? "Open to all" : "To be announced",
    summary: e.summary,
    description: e.description,
    highlights: e.highlights,
    art: art(e.art),
    photo: e.photo ?? undefined,
    apply,
    registration: registrationState(apply, status),
    applyUrl: apply.mode === "link" ? apply.url : undefined,
    hub,
  };
}

export function toCommunityMember(m: SnapshotMember, i: number): Member {
  return {
    slug: m.slug,
    name: m.name,
    role: m.role,
    group: "Member",
    order: i,
    department: m.department,
    year: m.year.mode === "none" ? undefined : m.year.text,
    bio: m.bio,
    focus: m.focus,
    email: m.links.email ?? "",
    linkedin: m.links.linkedin ?? undefined,
    github: m.links.github ?? undefined,
    art: art(m.art),
    photo: m.photo ?? undefined,
  };
}

type RawBoardMember = Omit<Member, "slug" | "year" | "linkedin" | "github" | "photo"> & {
  year?: string;
  linkedin?: string;
  github?: string;
  photo?: string | null;
};

function boardAndFaculty(): Member[] {
  const dir = path.join(/*turbopackIgnore: true*/ root, "content", "members");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f): Member => {
      const m = readJson<RawBoardMember>("content", "members", f);
      return {
        ...m,
        slug: f.replace(/\.json$/, ""),
        year: m.year || undefined,
        linkedin: m.linkedin || undefined,
        github: m.github || undefined,
        art: art(m.art),
        photo: m.photo || undefined,
      };
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/**
 * Everything the site renders. Events and general members come from the
 * published release; the club text, aims, board and faculty from this repo.
 * Cached for an hour so Live / Open / Past follow the calendar without a rebuild.
 */
export async function getContent(): Promise<Content> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");

  const today = ymd(new Date());
  const snap = loadSnapshot();
  const clubRaw = readJson<Omit<Club, "name">>("content", "club.json");
  const aimsRaw = readJson<{ aims: Aim[] }>("content", "aims.json");

  return {
    club: { name: "The Fable Club", ...clubRaw },
    aims: aimsRaw.aims,
    events: snap.events.map((e) => toClubEvent(e, today)),
    members: boardAndFaculty(),
    community: snap.members.map(toCommunityMember),
  };
}
