// Validation and the database insert for the two live forms (join application,
// event registration). Pure where possible so it can be tested without a network.
import { z } from "zod";

export const REG_NO = /^\d{2}[A-Za-z]{3}\d{4,5}$/;
export const YEARS = ["1st", "2nd", "3rd", "4th", "Postgraduate"] as const;
export const LEVELS = ["beginner", "everyday", "builder"] as const;
export const TRACKS = ["AI Fluency fundamentals", "Claude.ai for daily work", "Claude Code", "Agents & MCP"] as const;

const text = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, msg);
const person = {
  name: text(2, 120, "Enter your full name."),
  reg_no: z
    .string()
    .trim()
    .regex(REG_NO, "Use your VIT registration number, like 25ABC1234.")
    .transform((v) => v.toUpperCase()),
  email: z.string().trim().max(200).email("Enter a valid email address."),
  department: text(2, 120, "Enter your department or programme."),
  year: z.enum(YEARS, { message: "Choose your year." }),
  consent: z.literal(true, { message: "Please confirm so we can contact you." }),
  // Hidden field: real people leave it empty, bots fill it.
  website: z.string().max(0).optional(),
};

export const ApplicationInput = z.object({
  ...person,
  level: z.enum(LEVELS, { message: "Pick the one that fits best." }),
  tracks: z.array(z.enum(TRACKS)).max(TRACKS.length).default([]),
  why: text(20, 2000, "Tell us a little more (at least a sentence)."),
});
export type ApplicationInput = z.infer<typeof ApplicationInput>;

export const RegistrationInput = z.object({
  ...person,
  event_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\- ]{7,20}$/, "Enter a valid phone number, or leave it empty.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type RegistrationInput = z.infer<typeof RegistrationInput>;

export type FieldErrors = Record<string, string>;
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const i of error.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}

/** The row sent to Supabase (no consent/honeypot columns). */
export function applicationRow(v: ApplicationInput) {
  return { name: v.name, reg_no: v.reg_no, email: v.email, department: v.department, year: v.year, level: v.level, tracks: v.tracks, why: v.why };
}
export function registrationRow(v: RegistrationInput) {
  return { event_slug: v.event_slug, name: v.name, reg_no: v.reg_no, email: v.email, department: v.department, year: v.year, phone: v.phone ?? null };
}

export type InsertOutcome =
  | { ok: true }
  | { ok: false; status: number; code: "duplicate" | "closed" | "busy" | "invalid" | "unavailable"; message: string };

/** Map a PostgREST error to something a person can act on. */
export function mapDbError(httpStatus: number, body: { code?: string; message?: string } | null): InsertOutcome {
  const code = body?.code;
  if (code === "23505") return { ok: false, status: 409, code: "duplicate", message: "You have already registered with this email." };
  if (code === "42501") return { ok: false, status: 403, code: "closed", message: "Registration for this is not open." };
  if (code === "P0001") return { ok: false, status: 429, code: "busy", message: "Too many attempts right now. Please try again in a while." };
  if (code === "23514" || code === "22P02" || httpStatus === 400) return { ok: false, status: 422, code: "invalid", message: "Some details were not accepted. Please check them and try again." };
  return { ok: false, status: 503, code: "unavailable", message: "We could not save this right now. Please try again shortly." };
}

/** Insert one row with the publishable key; RLS only allows insert, nothing is read back. */
export async function insertRow(table: "applications" | "registrations", row: object, env = process.env): Promise<InsertOutcome> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, status: 503, code: "unavailable", message: "Submissions are not available right now." };
  try {
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
    return mapDbError(res.status, body);
  } catch {
    return { ok: false, status: 503, code: "unavailable", message: "We could not save this right now. Please try again shortly." };
  }
}

/** Reject cross-site posts and oversized bodies before doing any work. */
export function guardRequest(req: Request, maxBytes = 10_000): { ok: true } | { ok: false; status: number; message: string } {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) return { ok: false, status: 413, message: "That request is too large." };
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      /* falls through to the rejection below */
    }
    if (!host || originHost !== host) return { ok: false, status: 403, message: "Cross-site requests are not allowed." };
  }
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return { ok: false, status: 415, message: "Send JSON." };
  return { ok: true };
}
