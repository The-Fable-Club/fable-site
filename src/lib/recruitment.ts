// Recruitment: whether the club is taking applications, and the rules for one.
// The settings live in content/club.json ("recruitment"); edit and push to change them.
//
//   status  "soon" | "open" | "closed", set by hand
//   opens   optional YYYY-MM-DD (IST): a "soon" intake opens on this day by itself
//   closes  optional YYYY-MM-DD (IST): an "open" intake closes after this day by itself
//
// The site re-reads the date at least hourly, so a dated change shows up within the
// hour without a rebuild. The form route checks the same rule on every submission.

export type RecruitmentStatus = "soon" | "open" | "closed";

export type Recruitment = {
  status: RecruitmentStatus;
  /** Which intake applications are filed under, e.g. "2026-27". One application per person per intake. */
  intake: string;
  opens?: string | null;
  closes?: string | null;
  /** The recruitment WhatsApp group (public: shared so students hear when applications open). */
  whatsapp?: string | null;
  /** The short task every applicant answers. */
  taskPrompt: string;
  /** True while the task wording is a stand-in the club has not approved. */
  taskIsPlaceholder?: boolean;
};

export function recruitmentState(r: Pick<Recruitment, "status" | "opens" | "closes">, today: string): RecruitmentStatus {
  if (r.status === "closed") return "closed";
  if (r.closes && today > r.closes) return "closed";
  if (r.opens && today < r.opens) return "soon";
  if (r.status === "soon") return r.opens && today >= r.opens ? "open" : "soon";
  return "open";
}

/** YYYY-MM-DD in India, the club's time zone. */
export const todayIST = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);

/** "12 Nov 2026" from "2026-11-12". */
export const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/** What a person submitting when applications are not open is told (and the HTTP status). */
export function closedReason(state: RecruitmentStatus): string | null {
  if (state === "open") return null;
  return state === "soon" ? "Applications are not open yet. Check back soon." : "Applications for this intake are closed.";
}
