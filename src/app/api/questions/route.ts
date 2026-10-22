import { handleSubmission } from "@/lib/submit-route";
import { QuestionInput, questionRow } from "@/lib/submissions";

export function POST(req: Request) {
  return handleSubmission(req, { schema: QuestionInput, table: "event_questions", toRow: questionRow });
}
