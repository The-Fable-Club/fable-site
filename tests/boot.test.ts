import { describe, expect, it } from "vitest";
import { HOLD, bootProgress, span } from "@/lib/boot";

describe("bootProgress", () => {
  it("starts at 0 and never goes backwards", () => {
    expect(bootProgress(0, 2000, true)).toBe(0);
    let last = -1;
    for (let ms = 0; ms <= 2500; ms += 50) {
      const p = bootProgress(ms, 2000, true);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
  });

  it("takes the whole minimum time even when everything is already loaded", () => {
    expect(bootProgress(1000, 2000, true)).toBeLessThan(100);
    expect(bootProgress(2000, 2000, true)).toBe(100);
  });

  it("waits at the hold point until the page has really loaded", () => {
    expect(bootProgress(5000, 2000, false)).toBe(HOLD);
    expect(bootProgress(5000, 2000, true)).toBe(100);
  });

  it("ignores nonsense times", () => {
    expect(bootProgress(-50, 2000, true)).toBe(0);
    expect(bootProgress(1e9, 2000, true)).toBe(100);
  });
});

describe("span", () => {
  it("is 0 before, 1 after and linear between", () => {
    expect(span(10, 20, 40)).toBe(0);
    expect(span(50, 20, 40)).toBe(1);
    expect(span(30, 20, 40)).toBe(0.5);
  });
});
