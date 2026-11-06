import { afterEach, describe, expect, it, vi } from "vitest";
import { AttendanceInput, markAttendanceRpc } from "@/lib/attendance";
import { POST as postAttendance } from "@/app/api/attendance/route";

const env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://p.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-test",
};

const stubRpc = (status: number, body: object | null = null) => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const f = vi.fn(async () => new Response(body ? JSON.stringify(body) : null, { status }));
  vi.stubGlobal("fetch", f);
  return f;
};

const request = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://thefableclub.com/api/attendance", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "thefableclub.com",
      origin: "https://thefableclub.com",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Attendance Input Validation", () => {
  it("accepts valid check-in data and normalizes reg_no to uppercase", () => {
    const parsed = AttendanceInput.safeParse({
      event_slug: "prompt-engineering-workshop",
      reg_no: "24bce1078",
      code: "123456",
      device_token: "device-uuid-1234567890",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.reg_no).toBe("24BCE1078");
      expect(parsed.data.code).toBe("123456");
      expect(parsed.data.event_slug).toBe("prompt-engineering-workshop");
    }
  });

  it("rejects malformed registration number", () => {
    const parsed = AttendanceInput.safeParse({
      event_slug: "test-event",
      reg_no: "invalid_reg",
      code: "123456",
      device_token: "device-uuid-1234567890",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects non-6-digit codes", () => {
    expect(
      AttendanceInput.safeParse({
        event_slug: "test-event",
        reg_no: "24BCE1078",
        code: "12345",
        device_token: "device-uuid-1234567890",
      }).success
    ).toBe(false);

    expect(
      AttendanceInput.safeParse({
        event_slug: "test-event",
        reg_no: "24BCE1078",
        code: "abcdef",
        device_token: "device-uuid-1234567890",
      }).success
    ).toBe(false);
  });

  it("rejects short or empty device token", () => {
    expect(
      AttendanceInput.safeParse({
        event_slug: "test-event",
        reg_no: "24BCE1078",
        code: "123456",
        device_token: "short",
      }).success
    ).toBe(false);
  });
});

describe("markAttendanceRpc", () => {
  it("invokes PostgREST rpc endpoint with correct headers and arguments", async () => {
    const fetchMock = stubRpc(200, { ok: true, message: "Marked present." });

    const res = await markAttendanceRpc(
      {
        event_slug: "workshop",
        reg_no: "24BCE1078",
        code: "654321",
        device_token: "device-test-token-123",
      },
      env as unknown as NodeJS.ProcessEnv
    );

    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [callUrl, callInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(callUrl).toBe("https://p.supabase.co/rest/v1/rpc/mark_attendance");
    const headers = callInit.headers as Record<string, string>;
    expect(headers["apikey"]).toBe("anon-key-test");
    expect(JSON.parse(callInit.body as string)).toEqual({
      p_event_slug: "workshop",
      p_reg_no: "24BCE1078",
      p_code: "654321",
      p_device_token: "device-test-token-123",
    });
  });

  it("handles RPC network failure gracefully", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("Network timeout");
    }));

    const res = await markAttendanceRpc(
      {
        event_slug: "workshop",
        reg_no: "24BCE1078",
        code: "654321",
        device_token: "device-test-token-123",
      },
      env as unknown as NodeJS.ProcessEnv
    );

    expect(res.ok).toBe(false);
    expect(res.code).toBe("unavailable");
  });
});

describe("POST /api/attendance", () => {
  it("rejects non-json content type", async () => {
    const res = await postAttendance(
      request("hello", { "content-type": "text/plain" })
    );
    expect(res.status).toBe(415);
  });

  it("swallows bot submissions with honeypot website filled", async () => {
    const res = await postAttendance(
      request({
        event_slug: "workshop",
        reg_no: "24BCE1078",
        code: "123456",
        device_token: "device-uuid-1234567890",
        website: "http://spambot.com",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 200 when attendance mark succeeds", async () => {
    stubRpc(200, { ok: true, message: "Marked present for Arrival." });

    const res = await postAttendance(
      request({
        event_slug: "workshop",
        reg_no: "24BCE1078",
        code: "123456",
        device_token: "device-uuid-1234567890",
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.message).toContain("Arrival");
  });

  it("returns 403 on device_mismatch", async () => {
    stubRpc(200, {
      ok: false,
      code: "device_mismatch",
      message: "Your registration is bound to a different device.",
    });

    const res = await postAttendance(
      request({
        event_slug: "workshop",
        reg_no: "24BCE1078",
        code: "123456",
        device_token: "device-uuid-1234567890",
      })
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("device_mismatch");
  });

  it("returns 403 on device_shared (anti-proxy protection)", async () => {
    stubRpc(200, {
      ok: false,
      code: "device_shared",
      message: "This device has already marked attendance for another student.",
    });

    const res = await postAttendance(
      request({
        event_slug: "workshop",
        reg_no: "24BCE1078",
        code: "123456",
        device_token: "device-uuid-1234567890",
      })
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("device_shared");
  });

  it("returns 409 on already_marked", async () => {
    stubRpc(200, {
      ok: false,
      code: "already_marked",
      message: "You have already checked in for this checkpoint.",
    });

    const res = await postAttendance(
      request({
        event_slug: "workshop",
        reg_no: "24BCE1078",
        code: "123456",
        device_token: "device-uuid-1234567890",
      })
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("already_marked");
  });

  it("returns 400 when window is closed or code is invalid", async () => {
    stubRpc(200, {
      ok: false,
      code: "invalid_code",
      message: "Incorrect code or code has expired.",
    });

    const res = await postAttendance(
      request({
        event_slug: "workshop",
        reg_no: "24BCE1078",
        code: "999999",
        device_token: "device-uuid-1234567890",
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("invalid_code");
  });
});
