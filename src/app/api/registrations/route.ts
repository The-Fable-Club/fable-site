import { handleSubmission } from "@/lib/submit-route";
import { RegistrationInput, registrationRow } from "@/lib/submissions";

export function POST(req: Request) {
  return handleSubmission(req, { schema: RegistrationInput, table: "registrations", toRow: registrationRow });
}
