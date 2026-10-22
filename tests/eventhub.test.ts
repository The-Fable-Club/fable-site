import { afterEach, describe, expect, it, vi } from "vitest";
import { eventhubTarget } from "@/lib/events";
import { countEventhubClick } from "@/lib/clicks";

afterEach(() => {
  vi.unstubAllGlobals();
});

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

describe("countEventhubClick", () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: "https://p.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "pk" } as unknown as NodeJS.ProcessEnv;
  it("calls the counting function with only the event slug", async () => {
    const f = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", f);
    expect(await countEventhubClick("my-event", env)).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://p.supabase.co/rest/v1/rpc/count_eventhub_click");
    expect(JSON.parse(init.body as string)).toEqual({ p_slug: "my-event" });
  });
  it("never throws: no configuration, network errors and bad answers just return false", async () => {
    expect(await countEventhubClick("x", {} as NodeJS.ProcessEnv)).toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect(await countEventhubClick("x", env)).toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 404 })));
    expect(await countEventhubClick("x", env)).toBe(false);
  });
});
