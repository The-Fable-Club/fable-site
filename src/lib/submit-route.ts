import type { z } from "zod";
import { fieldErrors, guardRequest, insertRow } from "@/lib/submissions";

const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Shared handler for the two live forms: guard, validate, insert, answer. */
export async function handleSubmission<S extends z.ZodType>(
  req: Request,
  opts: { schema: S; table: "applications" | "registrations"; toRow: (v: z.infer<S>) => object },
) {
  const guard = guardRequest(req);
  if (!guard.ok) return json({ ok: false, message: guard.message }, guard.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "That request could not be read." }, 400);
  }
  // Bots fill the hidden field: say thanks and store nothing.
  if (body && typeof body === "object" && "website" in body && String((body as { website?: unknown }).website ?? "") !== "") {
    return json({ ok: true });
  }

  const parsed = opts.schema.safeParse(body);
  if (!parsed.success) return json({ ok: false, code: "invalid", message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) }, 422);

  const result = await insertRow(opts.table, opts.toRow(parsed.data));
  if (!result.ok) return json({ ok: false, code: result.code, message: result.message }, result.status);
  return json({ ok: true });
}
