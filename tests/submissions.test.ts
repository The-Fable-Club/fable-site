import { afterEach, describe, expect, it, vi } from "vitest";

// The applications route reads the recruitment settings from content/club.json; tests set them here.
const rec = vi.hoisted(() => ({ value: { status: "open", intake: "2026-27", taskPrompt: "t" } as Record<string, unknown> }));
vi.mock("@/lib/content", async (orig) => ({ ...(await orig<object>()), readRecruitment: () => rec.value }));
import { ApplicationInput, QuestionInput, RegistrationInput, fieldErrors, guardRequest, insertRow, mapDbError } from "@/lib/submissions";
import { POST as postQuestion } from "@/app/api/questions/route";
import { POST as postRegistration } from "@/app/api/registrations/route";
import { POST as postApplication } from "@/app/api/applications/route";

const person = { name: "Ada Lovelace", reg_no: "25abc1234", email: "ada@vit.ac.in", department: "CSE", year: "2nd", consent: true };
const reg = (o: Record<string, unknown> = {}) => ({ ...person, event_slug: "some-event", ...o });
const app = (o: Record<string, unknown> = {}) => ({
  ...person,
  email: "Ada.Lovelace2025@VITstudent.ac.in",
  phone: "+91 98765 43210",
  team: "Agentic AI",
  build: "An agent that plans my week.",
  why: "I want to build agents with Claude.",
  task: "I would hand it my lab-record formatting, with read access to my notes only.",
  ...o,
});

const env = { NEXT_PUBLIC_SUPABASE_URL: "https://p.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "pk" };
const request = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://thefableclub.com/api/x", {
    method: "POST",
    headers: { "content-type": "application/json", host: "thefableclub.com", origin: "https://thefableclub.com", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const stubDb = (status: number, body: object | null = null) => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const f = vi.fn(async () => new Response(body ? JSON.stringify(body) : null, { status }));
  vi.stubGlobal("fetch", f);
  return f;
};

describe("validation", () => {
  it("accepts a good registration and upper-cases the registration number", () => {
    const r = RegistrationInput.safeParse(reg());
    expect(r.success && r.data.reg_no).toBe("25ABC1234");
  });
  it("rejects each bad field with a readable message", () => {
    const bad = (o: Record<string, unknown>) => {
      const r = RegistrationInput.safeParse(reg(o));
      return r.success ? null : fieldErrors(r.error);
    };
    expect(bad({ name: "A" })?.name).toBeTruthy();
    expect(bad({ reg_no: "123" })?.reg_no).toMatch(/registration number/i);
    expect(bad({ email: "nope" })?.email).toBeTruthy();
    expect(bad({ year: "5th" })?.year).toBeTruthy();
    expect(bad({ consent: false })?.consent).toBeTruthy();
    expect(bad({ event_slug: "Bad Slug" })?.event_slug).toBeTruthy();
    expect(bad({ phone: "abc" })?.phone).toBeTruthy();
    expect(RegistrationInput.safeParse(reg({ phone: "" })).success).toBe(true);
    expect(RegistrationInput.safeParse(reg({ phone: "+91 98765 43210" })).success).toBe(true);
  });
  it("application: every answer the club asked for, with readable errors", () => {
    expect(ApplicationInput.safeParse(app()).success).toBe(true);
    const bad = (o: Record<string, unknown>) => {
      const r = ApplicationInput.safeParse(app(o));
      return r.success ? null : fieldErrors(r.error);
    };
    expect(bad({ email: "ada@gmail.com" })?.email).toMatch(/vitstudent/);
    expect(bad({ email: "ada@vitstudent.ac.in.evil.com" })?.email).toBeTruthy();
    expect(bad({ phone: "" })?.phone).toBeTruthy();
    expect(bad({ phone: "call me" })?.phone).toBeTruthy();
    expect(bad({ team: "Marketing" })?.team).toBeTruthy();
    expect(bad({ build: "x" })?.build).toBeTruthy();
    expect(bad({ why: "short" })?.why).toBeTruthy();
    expect(bad({ why: "x".repeat(2001) })?.why).toBeTruthy();
    expect(bad({ task: "too short" })?.task).toBeTruthy();
    expect(bad({ task: undefined })?.task).toBeTruthy();
  });
});

describe("guardRequest", () => {
  it("accepts same-origin JSON, and requests without an Origin header", () => {
    expect(guardRequest(request({})).ok).toBe(true);
    const noOrigin = new Request("https://thefableclub.com/x", { method: "POST", headers: { "content-type": "application/json", host: "thefableclub.com" }, body: "{}" });
    expect(guardRequest(noOrigin).ok).toBe(true);
  });
  it("rejects other origins, non-JSON and oversized bodies", () => {
    expect(guardRequest(request({}, { origin: "https://evil.example" }))).toMatchObject({ ok: false, status: 403 });
    expect(guardRequest(request({}, { origin: "not a url" }))).toMatchObject({ ok: false, status: 403 });
    expect(guardRequest(request({}, { "content-type": "text/plain" }))).toMatchObject({ ok: false, status: 415 });
    expect(guardRequest(request({}, { "content-length": "999999" }))).toMatchObject({ ok: false, status: 413 });
  });
});

describe("database error mapping", () => {
  it("maps codes to outcomes", () => {
    expect(mapDbError(409, { code: "23505" })).toMatchObject({ status: 409, code: "duplicate" });
    expect(mapDbError(409, { code: "23505" }, "applications")).toMatchObject({ message: expect.stringMatching(/already applied/) });
    expect(mapDbError(401, { code: "42501" })).toMatchObject({ status: 403, code: "closed" });
    expect(mapDbError(400, { code: "P0001" })).toMatchObject({ status: 429, code: "busy" });
    expect(mapDbError(400, { code: "23514" })).toMatchObject({ status: 422, code: "invalid" });
    expect(mapDbError(500, null)).toMatchObject({ status: 503, code: "unavailable" });
  });
});

describe("insertRow", () => {
  it("posts with the publishable key and asks for no data back", async () => {
    const f = stubDb(201);
    expect(await insertRow("registrations", { a: 1 })).toEqual({ ok: true });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://p.supabase.co/rest/v1/registrations");
    const h = init.headers as Record<string, string>;
    expect(h.Prefer).toBe("return=minimal");
    expect(h.apikey).toBe("pk");
  });
  it("fails closed without configuration and on network errors", async () => {
    expect(await insertRow("applications", {}, {} as NodeJS.ProcessEnv)).toMatchObject({ ok: false, status: 503 });
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect(await insertRow("applications", {})).toMatchObject({ ok: false, status: 503 });
  });
});

describe("API routes", () => {
  it("registration: valid -> saved, only the table columns are sent", async () => {
    const f = stubDb(201);
    const res = await postRegistration(request(reg({ phone: "" })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const sent = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent).toEqual({ event_slug: "some-event", name: "Ada Lovelace", reg_no: "25ABC1234", email: "ada@vit.ac.in", department: "CSE", year: "2nd", phone: null });
  });
  it("registration: invalid -> 422 with per-field errors, nothing stored", async () => {
    const f = stubDb(201);
    const res = await postRegistration(request(reg({ email: "x", reg_no: "1" })));
    expect(res.status).toBe(422);
    const j = await res.json();
    expect(Object.keys(j.errors)).toEqual(expect.arrayContaining(["email", "reg_no"]));
    expect(f).not.toHaveBeenCalled();
  });
  it("honeypot: pretends success and stores nothing", async () => {
    const f = stubDb(201);
    const res = await postRegistration(request(reg({ website: "http://spam.example" })));
    expect(await res.json()).toEqual({ ok: true });
    expect(f).not.toHaveBeenCalled();
  });
  it("duplicate, closed and busy come back as clear statuses", async () => {
    stubDb(409, { code: "23505" });
    expect((await postRegistration(request(reg()))).status).toBe(409);
    stubDb(401, { code: "42501" });
    expect((await postRegistration(request(reg()))).status).toBe(403);
    stubDb(400, { code: "P0001" });
    expect((await postApplication(request(app()))).status).toBe(429);
  });
  it("rejects cross-site and unreadable requests before touching the database", async () => {
    const f = stubDb(201);
    expect((await postRegistration(request(reg(), { origin: "https://evil.example" }))).status).toBe(403);
    expect((await postRegistration(request("{not json"))).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it("application: valid -> saved into the current intake, only the table columns are sent", async () => {
    const f = stubDb(201);
    const res = await postApplication(request(app({ intake: "pre-launch", status: "accepted" })));
    expect(res.status).toBe(200);
    const sent = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent).toEqual({
      name: "Ada Lovelace",
      reg_no: "25ABC1234",
      email: "ada.lovelace2025@vitstudent.ac.in",
      phone: "+91 98765 43210",
      department: "CSE",
      year: "2nd",
      team: "Agentic AI",
      build: "An agent that plans my week.",
      why: "I want to build agents with Claude.",
      task: "I would hand it my lab-record formatting, with read access to my notes only.",
      intake: "2026-27",
    });
  });
  it("application: refused while applications are not open, before touching the database", async () => {
    const f = stubDb(201);
    try {
      rec.value = { ...rec.value, status: "soon" };
      const soon = await postApplication(request(app()));
      expect(soon.status).toBe(403);
      expect((await soon.json()).message).toMatch(/not open yet/);
      rec.value = { ...rec.value, status: "open", closes: "2020-01-01" };
      expect((await postApplication(request(app()))).status).toBe(403);
      expect(f).not.toHaveBeenCalled();
    } finally {
      rec.value = { status: "open", intake: "2026-27", taskPrompt: "t" };
    }
  });
  it("application: a second one in the same intake says so", async () => {
    stubDb(409, { code: "23505" });
    const res = await postApplication(request(app()));
    expect(res.status).toBe(409);
    expect((await res.json()).message).toMatch(/already applied/);
  });
});

describe("questions", () => {
  const ask = (o: Record<string, unknown> = {}) => ({ event_slug: "some-event", question: "Is it free to attend?", ...o });
  it("validates: question length, optional name and email", () => {
    expect(QuestionInput.safeParse(ask()).success).toBe(true);
    expect(QuestionInput.safeParse(ask({ name: "", email: "" })).success).toBe(true);
    expect(QuestionInput.safeParse(ask({ question: "Hi" })).success).toBe(false);
    expect(QuestionInput.safeParse(ask({ question: "x".repeat(501) })).success).toBe(false);
    expect(QuestionInput.safeParse(ask({ email: "nope" })).success).toBe(false);
    expect(QuestionInput.safeParse(ask({ event_slug: "Bad Slug" })).success).toBe(false);
  });
  it("saves only the question columns; empty name and email become null", async () => {
    const f = stubDb(201);
    const res = await postQuestion(request(ask({ name: "", email: "", website: "" })));
    expect(res.status).toBe(200);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://p.supabase.co/rest/v1/event_questions");
    expect(JSON.parse(init.body as string)).toEqual({ event_slug: "some-event", question: "Is it free to attend?", name: null, email: null });
  });
  it("cannot set an answer or publish itself (extra fields are dropped)", async () => {
    const f = stubDb(201);
    await postQuestion(request(ask({ answer: "Yes", show_on_site: true, hidden: false })));
    const sent = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(Object.keys(sent).sort()).toEqual(["email", "event_slug", "name", "question"]);
  });
  it("closed events, spam and bots", async () => {
    stubDb(401, { code: "42501" });
    expect((await postQuestion(request(ask()))).status).toBe(403);
    stubDb(400, { code: "P0001" });
    expect((await postQuestion(request(ask()))).status).toBe(429);
    const f = stubDb(201);
    expect(await (await postQuestion(request(ask({ website: "http://spam" })))).json()).toEqual({ ok: true });
    expect(f).not.toHaveBeenCalled();
  });
});
