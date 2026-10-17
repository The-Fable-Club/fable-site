import { describe, expect, it } from "vitest";
import type { SnapshotEvent } from "@/lib/contract";
import { toClubEvent } from "@/lib/content";
import { heroStrips, openEvents, pastEvents } from "@/lib/events";

const TODAY = "2026-10-17";
const base: SnapshotEvent = {
  slug: "e", title: "E", kind: "Workshop", phase: 1, status_override: null,
  date: { mode: "exact", start: "2026-11-20", end: null },
  time: { mode: "text", text: "4 pm" }, venue: { mode: "text", text: "Lab" }, seats: { mode: "open" },
  apply: { mode: "form" }, summary: "s", description: ["d"], highlights: [], art: "pointer", photo: null, hub: [],
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
