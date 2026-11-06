import { z } from "zod";
import { REG_NO } from "./submissions";

export const AttendanceInput = z.object({
  event_slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  reg_no: z
    .string()
    .trim()
    .regex(REG_NO, "Use your VIT registration number, like 24BCE1078.")
    .transform((v) => v.toUpperCase()),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code shown on the screen."),
  device_token: z
    .string()
    .trim()
    .min(10, "Invalid device token.")
    .max(100),
  website: z.string().max(0).optional(),
});

export type AttendanceInput = z.infer<typeof AttendanceInput>;

export type AttendanceRpcResult = {
  ok: boolean;
  code?: string;
  message: string;
};

/** Call Supabase RPC mark_attendance directly over PostgREST REST API. */
export async function markAttendanceRpc(
  input: {
    event_slug: string;
    reg_no: string;
    code: string;
    device_token: string;
  },
  env = process.env
): Promise<AttendanceRpcResult> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return {
      ok: false,
      code: "unavailable",
      message: "Attendance service is not available right now.",
    };
  }

  try {
    const res = await fetch(`${url}/rest/v1/rpc/mark_attendance`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_event_slug: input.event_slug,
        p_reg_no: input.reg_no,
        p_code: input.code,
        p_device_token: input.device_token,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const json = (await res.json().catch(() => null)) as AttendanceRpcResult | null;

    if (!res.ok) {
      if (res.status === 404 || res.status === 400) {
        return {
          ok: false,
          code: "rpc_error",
          message: json?.message || "Invalid request.",
        };
      }
      return {
        ok: false,
        code: "unavailable",
        message: json?.message || "Server error. Please try again shortly.",
      };
    }

    if (json && typeof json === "object" && typeof json.ok === "boolean") {
      return json;
    }

    return {
      ok: false,
      code: "unknown",
      message: "Unexpected response from server.",
    };
  } catch {
    return {
      ok: false,
      code: "unavailable",
      message: "Could not reach server. Please check your connection and try again.",
    };
  }
}
