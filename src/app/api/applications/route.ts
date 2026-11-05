import { handleSubmission } from "@/lib/submit-route";
import { ApplicationInput, applicationRow } from "@/lib/submissions";
import { readRecruitment } from "@/lib/content";
import { closedReason, recruitmentState, todayIST } from "@/lib/recruitment";

export function POST(req: Request) {
  // Read on every submission, so a closing day takes effect at once (the pages follow within the hour).
  const r = readRecruitment();
  return handleSubmission(req, {
    schema: ApplicationInput,
    table: "applications",
    toRow: (v) => applicationRow(v, r.intake),
    closed: () => closedReason(recruitmentState(r, todayIST())),
    // the longest answers in full, written in a script that takes 3 bytes a character, still fit
    maxBytes: 32_000,
  });
}
