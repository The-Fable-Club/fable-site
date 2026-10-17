import { handleSubmission } from "@/lib/submit-route";
import { ApplicationInput, applicationRow } from "@/lib/submissions";

export function POST(req: Request) {
  return handleSubmission(req, { schema: ApplicationInput, table: "applications", toRow: applicationRow });
}
