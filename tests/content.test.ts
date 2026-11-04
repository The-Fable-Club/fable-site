import { describe, expect, it } from "vitest";
import type { SnapshotEvent } from "@/lib/contract";
import { eventMediaInput, readTeams, toClubEvent, toMember } from "@/lib/content";
import { TEAMS } from "@/lib/submissions";
import { resolveEventMedia } from "@/lib/event-media";
import { heroStrips, openEvents, pastEvents } from "@/lib/events";

const TODAY = "2026-10-17";
const base: SnapshotEvent = {
  slug: "e", title: "E", kind: "Workshop", phase: 1, status_override: null,
  date: { mode: "exact", start: "2026-11-20", end: null },
  time: { mode: "text", text: "4 pm" }, venue: { mode: "text", text: "Lab" }, seats: { mode: "open" },
  apply: { mode: "form" }, summary: "s", description: ["d"], highlights: [], art: "pointer", photo: null, hub: [], eventhub: null, faq: [], media: [],
};
const ev = (o: Partial<SnapshotEvent>) => toClubEvent({ ...base, ...o }, TODAY);

describe("toClubEvent", () => {
  it("exact future date: upcoming, registration open, not tentative", () => {
    const e = ev({});
    expect(e.status).toBe("upcoming");
    expect(e.registration).toBe("open");
    expect(e.tentative).toBe(false);
    expect(e.dateText).toBe("20 Nov 2026");
    expect(e.art).toBe("/art/pointer.svg");
  });
  it("exact range around today is live", () => {
    expect(ev({ date: { mode: "exact", start: "2026-10-15", end: "2026-10-30" } }).status).toBe("active");
  });
  it("a placed TBA is positioned on the timeline but never shows its placeholder date", () => {
    const e = ev({ date: { mode: "tba", place: "2027-02-10" } });
    expect(e.start).toBe("2027-02-10");
    expect(e.dateMode).toBe("tba");
    expect(e.tentative).toBe(true);
    expect(e.dateText).toBe("Date to be announced");
    expect(e.dateText).not.toMatch(/2027|Feb/);
    expect(e.status).toBe("upcoming");
  });
  it("own text with a place keeps its words and is positioned by the place", () => {
    const e = ev({ date: { mode: "text", text: "Early February", place: "2027-02-05" } });
    expect(e).toMatchObject({ dateText: "Early February", start: "2027-02-05", dateMode: "text" });
  });
  it("month only is tentative and never live, even in its own month", () => {
    const e = ev({ date: { mode: "month", month: "2026-10" } });
    expect(e.tentative).toBe(true);
    expect(e.status).toBe("upcoming");
    expect(e.start).toBe("2026-10-01");
    expect(e.end).toBe("2026-10-31");
    expect(e.dateText).toBe("October 2026");
  });
  it("text date keeps the typed text; with a month it is placed, without it is not", () => {
    expect(ev({ date: { mode: "text", text: "Early March", month: "2027-03" } }).start).toBe("2027-03-01");
    const loose = ev({ date: { mode: "text", text: "After exams" } });
    expect(loose.start).toBeUndefined();
    expect(loose.dateText).toBe("After exams");
  });
  it("tba date has no window and says so", () => {
    const e = ev({ date: { mode: "tba" } });
    expect(e.start).toBeUndefined();
    expect(e.tentative).toBe(true);
    expect(e.dateText).toBe("Date to be announced");
  });
  it("display strings for undecided details", () => {
    const e = ev({ time: { mode: "tba" }, venue: { mode: "online", text: "Meet" }, seats: { mode: "tba" } });
    expect(e.time).toBe("Time to be announced");
    expect(e.venue).toBe("Online · Meet");
    expect(e.seats).toBe("To be announced");
    expect(ev({ venue: { mode: "online" } }).venue).toBe("Online");
    expect(ev({ venue: { mode: "tba" } }).venue).toBe("Venue to be announced");
  });
  it("registration state follows apply mode and status", () => {
    expect(ev({ apply: { mode: "soon" } }).registration).toBe("soon");
    expect(ev({ apply: { mode: "none" } }).registration).toBe("none");
    expect(ev({ apply: { mode: "closed" } }).registration).toBe("closed");
    const link = ev({ apply: { mode: "link", url: "https://x.example/f" } });
    expect(link.registration).toBe("open");
    expect(link.applyUrl).toBe("https://x.example/f");
    expect(ev({ date: { mode: "exact", start: "2026-01-01" } }).registration).toBe("closed");
  });
  it("a status override wins", () => {
    expect(ev({ status_override: "past" }).status).toBe("past");
    expect(ev({ status_override: "active" }).status).toBe("active");
  });
  it("hub posts come through newest first as given and get ids", () => {
    const e = ev({ hub: [{ kind: "link", title: "A", body: null, href: "https://a.example", posted_at: "2026-10-10", posted_by: "x" }] });
    expect(e.hub[0]).toMatchObject({ id: "e-0", title: "A", href: "https://a.example", body: undefined });
  });
});

describe("home page announcements", () => {
  const live = ev({ slug: "live", date: { mode: "exact", start: "2026-10-15", end: "2026-10-30" }, apply: { mode: "closed" } });
  const reg = ev({ slug: "reg" });
  const soon = ev({ slug: "soon", apply: { mode: "soon" } });
  const old = ev({ slug: "old", date: { mode: "exact", start: "2026-01-01" } });

  it("shows Live now and Registrations open together", () => {
    expect(heroStrips([reg, live, soon, old]).map((s) => [s.label, s.event.slug])).toEqual([
      ["Live now", "live"],
      ["Registrations open", "reg"],
    ]);
  });
  it("a live event that is also open is announced once, as live", () => {
    const both = ev({ slug: "both", date: { mode: "exact", start: "2026-10-15", end: "2026-10-30" }, apply: { mode: "form" } });
    expect(heroStrips([both]).map((s) => s.label)).toEqual(["Live now"]);
  });
  it("falls back to Next up, and to nothing", () => {
    expect(heroStrips([soon, old]).map((s) => [s.label, s.event.slug])).toEqual([["Next up", "soon"]]);
    expect(heroStrips([old])).toEqual([]);
    expect(heroStrips([])).toEqual([]);
  });
  it("lists open events by date with undated last, and past newest first", () => {
    const tba = ev({ slug: "tba", date: { mode: "tba" } });
    const m = ev({ slug: "m", date: { mode: "month", month: "2026-12" } });
    expect(openEvents([tba, m, reg, live]).map((e) => e.slug)).toEqual(["live", "reg", "m", "tba"]);
    const older = ev({ slug: "older", date: { mode: "exact", start: "2025-01-01" } });
    expect(pastEvents([older, old]).map((e) => e.slug)).toEqual(["old", "older"]);
  });
});

describe("toMember", () => {
  const m = { slug: "a", name: "Ada", role: "Chairperson", group: "Board" as const, order: 10, department: "CSE", year: { mode: "none" as const }, bio: "b", focus: ["x"], links: { email: "a@x.co", linkedin: null }, art: "party", photo: null };
  it("maps group, order, links and art", () => {
    expect(toMember(m)).toMatchObject({ group: "Board", order: 10, role: "Chairperson", email: "a@x.co", linkedin: undefined, art: "/art/party.svg", year: undefined, photo: undefined });
  });
  it("uses typed year text and an empty email when hidden", () => {
    const x = toMember({ ...m, year: { mode: "text" as const, text: "Final year" }, links: {} });
    expect(x).toMatchObject({ year: "Final year", email: "" });
  });
  it("shows the old Technical team under its new name, Projects", () => {
    expect(toMember({ ...m, role: "Technical" }).role).toBe("Projects");
  });
});

describe("team descriptions (content/teams.json)", () => {
  const teams = readTeams();
  it("describe exactly the teams the form offers, in the same order", () => {
    expect(teams.map((t) => t.name)).toEqual([...TEAMS]);
  });
  it("every real team says what it does and what it looks for", () => {
    for (const t of teams.filter((x) => x.name !== "Not sure yet")) {
      expect(t.short.length, t.name).toBeGreaterThan(10);
      expect(t.about.length, t.name).toBeGreaterThan(40);
      expect(t.lookingFor.length, t.name).toBeGreaterThan(0);
    }
  });
});

describe("EventHub link and FAQ", () => {
  it("an EventHub link opens registration until the event is past, whatever our own form says", () => {
    const e = ev({ apply: { mode: "none" }, eventhub: "https://eventhubcc.vit.ac.in/EventHub/e/1" });
    expect(e.registration).toBe("open");
    expect(e.eventhubUrl).toBe("https://eventhubcc.vit.ac.in/EventHub/e/1");
    expect(ev({ eventhub: "https://eventhubcc.vit.ac.in/x", date: { mode: "exact", start: "2026-01-01" } }).registration).toBe("closed");
    expect(ev({ eventhub: null }).eventhubUrl).toBeUndefined();
  });
  it("carries the FAQ through", () => {
    expect(ev({ faq: [{ question: "Free?", answer: "Yes." }] }).faq).toEqual([{ question: "Free?", answer: "Yes." }]);
  });
  it("an EventHub event is announced as Registrations open", () => {
    const hubEvent = ev({ slug: "hub", apply: { mode: "none" }, eventhub: "https://eventhubcc.vit.ac.in/x" });
    expect(heroStrips([hubEvent]).map((s) => s.label)).toEqual(["Registrations open"]);
  });
});

describe("event media (schema 2)", () => {
  const ik = "https://ik.imagekit.io/thefableclub/fable/events/e";
  const vid = { kind: "video" as const, url: `${ik}/loop.mp4`, width: 1280, height: 720, duration: 6, poster: `${ik}/loop.mp4/ik-thumbnail.jpg` };
  const pic = (n: string) => ({ kind: "image" as const, url: `${ik}/${n}.webp`, width: 1600, height: 900, duration: null, poster: null });

  it("no media: nothing, and the stage uses the generated placeholders", () => {
    const e = ev({});
    expect(e.media).toBeUndefined();
    expect(resolveEventMedia(e, 0).placeholder).toBe(true);
  });
  it("loop + two pictures: video, backdrop and thumbnail from the release", () => {
    const e = ev({ media: [vid, pic("a"), pic("b")] });
    expect(eventMediaInput({ ...base, media: [vid, pic("a"), pic("b")] })).toEqual({ video: vid.url, pics: [`${ik}/a.webp`, `${ik}/b.webp`] });
    expect(resolveEventMedia(e, 3)).toEqual({ video: vid.url, poster: `${ik}/a.webp`, thumb: `${ik}/b.webp`, placeholder: false });
  });
  it("video only: the clip's still stands in as the picture", () => {
    expect(resolveEventMedia(ev({ media: [vid] }), 0)).toEqual({ video: vid.url, poster: vid.poster, thumb: vid.poster, placeholder: false });
  });
  it("one picture, no video: a still backdrop", () => {
    expect(resolveEventMedia(ev({ media: [pic("a")] }), 0)).toEqual({ video: undefined, poster: `${ik}/a.webp`, thumb: `${ik}/a.webp`, placeholder: false });
  });
  it("an older release with only a photo still shows it", () => {
    const e = ev({ photo: `${ik}/old.webp` });
    expect(resolveEventMedia(e, 0)).toMatchObject({ poster: `${ik}/old.webp`, placeholder: false });
  });
});
