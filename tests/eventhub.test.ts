import { describe, expect, it } from "vitest";
import { eventhubTarget } from "@/lib/events";

describe("eventhubTarget (where the register button may send people)", () => {
  const ok = "https://eventhubcc.vit.ac.in/EventHub/e/1";
  it("forwards only to the real EventHub while registration is open", () => {
    expect(eventhubTarget({ eventhubUrl: ok, registration: "open" })).toBe(ok);
    expect(eventhubTarget({ eventhubUrl: ok, registration: "closed" })).toBeNull();
    expect(eventhubTarget({ eventhubUrl: undefined, registration: "open" })).toBeNull();
    expect(eventhubTarget(undefined)).toBeNull();
  });
  it("refuses anything else even if it slipped into a release", () => {
    for (const bad of ["http://eventhubcc.vit.ac.in/x", "https://eventhubcc.vit.ac.in.evil.example/x", "https://evil.example/", "javascript:alert(1)", "not a url"])
      expect(eventhubTarget({ eventhubUrl: bad, registration: "open" }), bad).toBeNull();
  });
});
