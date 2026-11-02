import { describe, expect, it } from "vitest";
import { closedReason, dayLabel, recruitmentState, todayIST } from "@/lib/recruitment";

describe("recruitmentState", () => {
  it("follows the status when there are no dates", () => {
    expect(recruitmentState({ status: "soon" }, "2026-11-02")).toBe("soon");
    expect(recruitmentState({ status: "open" }, "2026-11-02")).toBe("open");
    expect(recruitmentState({ status: "closed" }, "2026-11-02")).toBe("closed");
  });
  it("a soon intake opens by itself on its opening day", () => {
    const r = { status: "soon" as const, opens: "2026-11-10" };
    expect(recruitmentState(r, "2026-11-09")).toBe("soon");
    expect(recruitmentState(r, "2026-11-10")).toBe("open");
  });
  it("an open intake closes by itself after its last day", () => {
    const r = { status: "open" as const, closes: "2026-11-20" };
    expect(recruitmentState(r, "2026-11-20")).toBe("open");
    expect(recruitmentState(r, "2026-11-21")).toBe("closed");
  });
  it("open before the opening day still reads as soon", () => {
    expect(recruitmentState({ status: "open", opens: "2026-11-10" }, "2026-11-01")).toBe("soon");
  });
  it("closed always wins", () => {
    expect(recruitmentState({ status: "closed", opens: "2026-01-01" }, "2026-11-02")).toBe("closed");
  });
  it("a soon intake past its closing day is closed", () => {
    expect(recruitmentState({ status: "soon", opens: "2026-11-01", closes: "2026-11-05" }, "2026-11-06")).toBe("closed");
  });
});

describe("helpers", () => {
  it("todayIST uses India time", () => {
    expect(todayIST(new Date("2026-11-01T19:00:00Z"))).toBe("2026-11-02"); // 00:30 IST
  });
  it("dayLabel and closedReason", () => {
    expect(dayLabel("2026-11-12")).toBe("12 Nov 2026");
    expect(closedReason("open")).toBeNull();
    expect(closedReason("soon")).toMatch(/not open yet/);
    expect(closedReason("closed")).toMatch(/closed/);
  });
});
