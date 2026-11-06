import { guardRequest, fieldErrors } from "@/lib/submissions";
import { AttendanceInput, markAttendanceRpc } from "@/lib/attendance";

const json = (body: object, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

export async function POST(req: Request) {
  const guard = guardRequest(req);
  if (!guard.ok) {
    return json({ ok: false, message: guard.message }, guard.status);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "That request could not be read." }, 400);
  }

  // Honeypot check for bots
  if (
    body &&
    typeof body === "object" &&
    "website" in body &&
    String((body as { website?: unknown }).website ?? "") !== ""
  ) {
    return json({ ok: true, message: "Attendance recorded." });
  }

  const parsed = AttendanceInput.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        code: "invalid",
        message: "Please fix the highlighted fields.",
        errors: fieldErrors(parsed.error),
      },
      422
    );
  }

  const result = await markAttendanceRpc(parsed.data);

  const status = result.ok
    ? 200
    : result.code === "device_mismatch" || result.code === "device_shared"
    ? 403
    : result.code === "already_marked"
    ? 409
    : result.code === "window_closed" || result.code === "no_active_checkpoint" || result.code === "not_in_roster" || result.code === "invalid_code" || result.code === "invalid_reg"
    ? 400
    : result.code === "unavailable"
    ? 503
    : 422;

  return json(result, status);
}
