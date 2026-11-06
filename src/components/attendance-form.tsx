"use client";

import { useEffect, useState } from "react";

function getOrSetDeviceToken(): string {
  if (typeof window === "undefined") return "";

  const KEY = "fable_device_token";
  let token = localStorage.getItem(KEY);

  if (!token) {
    // Check cookie fallback
    const match = document.cookie.match(/(?:^|; )fable_device_token=([^;]+)/);
    if (match?.[1]) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token) {
    // Generate new random UUID or fallback
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      token = crypto.randomUUID();
    } else {
      token = "dev_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  }

  // Persist both in localStorage and cookie (1 year expiry)
  localStorage.setItem(KEY, token);
  document.cookie = `fable_device_token=${encodeURIComponent(
    token
  )}; max-age=31536000; path=/; SameSite=Lax`;

  return token;
}

export function AttendanceForm({ eventSlug }: { eventSlug: string }) {
  const [deviceToken, setDeviceToken] = useState("");
  const [regNo, setRegNo] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    code?: string;
  } | null>(null);

  useEffect(() => {
    setDeviceToken(getOrSetDeviceToken());
    // Auto-fill saved reg_no if student checked in before
    const savedReg = localStorage.getItem("fable_student_reg");
    if (savedReg) setRegNo(savedReg);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const cleanReg = regNo.trim().toUpperCase();
    const cleanCode = code.trim();

    if (!cleanReg || !cleanCode) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_slug: eventSlug,
          reg_no: cleanReg,
          code: cleanCode,
          device_token: deviceToken,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.ok) {
        localStorage.setItem("fable_student_reg", cleanReg);
        setResult({ ok: true, message: json.message || "Attendance recorded successfully!" });
        setCode("");
      } else {
        setResult({
          ok: false,
          code: json?.code,
          message: json?.message || "Could not mark attendance. Please check your details.",
        });
      }
    } catch {
      setResult({
        ok: false,
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      {result?.ok ? (
        <div className="border-2 border-ink bg-paper-raised p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-ink text-paper text-lg font-bold">
              ✓
            </span>
            <h2 className="font-display text-2xl font-semibold">Attendance Recorded!</h2>
          </div>
          <p className="mt-3 text-ink/80">{result.message}</p>
          <div className="mt-4 border-t border-ink/20 pt-3 text-xs font-mono text-ink/60">
            Registered: <span className="font-semibold text-ink">{regNo}</span> · Device Bound
          </div>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-6 border-2 border-ink px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-clay"
          >
            Mark Another Checkpoint
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6">
          {/* Honeypot field for bot suppression */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="sr-only"
            aria-hidden="true"
          />

          <label className="block">
            <span className="hud text-ink-faint">Registration number</span>
            <input
              required
              value={regNo}
              onChange={(e) => setRegNo(e.target.value.toUpperCase())}
              placeholder="24BCE1078"
              autoCapitalize="characters"
              autoComplete="off"
              className="mt-1.5 h-14 w-full border-2 border-ink bg-paper px-4 font-mono text-2xl tracking-widest text-ink focus:outline-none focus:ring-2 focus:ring-clay"
            />
            <span className="mt-1 block text-xs text-ink/50">
              Must match your EventHub or on-spot registration.
            </span>
          </label>

          <label className="block">
            <span className="hud text-ink-faint">Code on the presenter screen</span>
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="••••••"
              autoComplete="off"
              className="mt-1.5 h-14 w-full border-2 border-ink bg-paper px-4 font-mono text-2xl tracking-widest text-ink focus:outline-none focus:ring-2 focus:ring-clay"
            />
            <span className="mt-1 block text-xs text-ink/50">
              Enter the 6-digit number currently projected in the room (refreshes every 20s).
            </span>
          </label>

          {result && !result.ok && (
            <div
              role="alert"
              className="border-2 border-clay-deep bg-paper p-4 text-sm text-clay-deep"
            >
              <p className="font-semibold">{result.message}</p>
              {result.code === "device_mismatch" && (
                <p className="mt-1 text-xs text-ink/70">
                  Your registration is tied to your original device. If you changed phones, visit the door volunteer to verify manually.
                </p>
              )}
              {result.code === "device_shared" && (
                <p className="mt-1 text-xs text-ink/70">
                  Proxy attendance is blocked: this device has already checked in for another student.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !regNo.trim() || code.length !== 6}
            className="h-14 border-2 border-ink bg-ink px-10 text-lg font-medium text-paper transition-colors duration-300 hover:bg-clay-deep disabled:cursor-not-allowed disabled:bg-ink/30 disabled:text-paper/60"
          >
            {loading ? "Verifying code…" : "Mark me present"}
          </button>
        </form>
      )}
    </div>
  );
}
