"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Hud } from "@/components/hud";
import { YEARS } from "@/lib/submissions";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message?: string; errors?: Record<string, string> };

const input =
  "h-12 w-full border border-ink/40 bg-paper px-3 text-base outline-none transition-colors focus:border-ink focus:ring-2 focus:ring-clay/40 aria-[invalid=true]:border-destructive";

/** Registration for one event. Posts to /api/registrations, which writes to the database. */
export function RegisterForm({ slug, title }: { slug: string; title: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const payload = {
      event_slug: slug,
      name: f.get("name"),
      reg_no: f.get("reg_no"),
      email: f.get("email"),
      department: f.get("department"),
      year: f.get("year"),
      phone: f.get("phone"),
      consent: f.get("consent") === "on",
      website: f.get("website"),
    };
    setState("sending");
    setErrors({});
    setMessage(null);
    let result: Result;
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      result = (await res.json()) as Result;
    } catch {
      result = { ok: false, message: "We could not reach the server. Check your connection and try again." };
    }
    if (result.ok) {
      setState("done");
      return;
    }
    setState("idle");
    setErrors(result.errors ?? {});
    setMessage(result.message ?? "Something went wrong. Please try again.");
    requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
  }

  if (state === "done") {
    return (
      <div role="status" id="register" className="border border-ink bg-paper-raised p-6">
        <span className="grid size-10 place-items-center bg-clay text-ink">
          <Check className="size-5" aria-hidden />
        </span>
        <h3 className="mt-4 font-display text-2xl leading-tight">You’re registered.</h3>
        <p className="mt-2 text-sm text-ink-soft">
          We’ve saved your registration for {title}. Watch the event page and the participant hub for updates.
        </p>
      </div>
    );
  }

  const bad = (k: string) => ({ "aria-invalid": errors[k] ? (true as const) : undefined, "aria-describedby": errors[k] ? `r-${k}` : undefined });
  const err = (k: string) =>
    errors[k] ? (
      <p id={`r-${k}`} className="mt-1 text-sm text-destructive">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form id="register" onSubmit={onSubmit} noValidate className="grid gap-4 border border-ink bg-paper-raised p-5">
      <Hud className="text-ink-faint">Register for this event</Hud>
      <label className="block">
        <span className="hud text-ink-faint">Full name</span>
        <input name="name" autoComplete="name" className={cn(input, "mt-1")} {...bad("name")} />
        {err("name")}
      </label>
      <label className="block">
        <span className="hud text-ink-faint">Registration number</span>
        <input name="reg_no" autoComplete="off" placeholder="25ABC1234" className={cn(input, "mt-1 uppercase")} {...bad("reg_no")} />
        {err("reg_no")}
      </label>
      <label className="block">
        <span className="hud text-ink-faint">Email</span>
        <input name="email" type="email" autoComplete="email" className={cn(input, "mt-1")} {...bad("email")} />
        {err("email")}
      </label>
      <label className="block">
        <span className="hud text-ink-faint">Department / programme</span>
        <input name="department" className={cn(input, "mt-1")} {...bad("department")} />
        {err("department")}
      </label>
      <label className="block">
        <span className="hud text-ink-faint">Year</span>
        <select name="year" defaultValue="" className={cn(input, "mt-1")} {...bad("year")}>
          <option value="" disabled>
            Choose
          </option>
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        {err("year")}
      </label>
      <label className="block">
        <span className="hud text-ink-faint">Phone (optional)</span>
        <input name="phone" type="tel" autoComplete="tel" className={cn(input, "mt-1")} {...bad("phone")} />
        {err("phone")}
      </label>
      {/* honeypot: hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consent" className="mt-1 size-5 accent-[var(--color-clay-deep)]" {...bad("consent")} />
          <span className="text-sm text-ink-soft">I’m a VIT Chennai student and happy for the club to contact me about this event.</span>
        </label>
        {err("consent")}
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={state === "sending"}
        className="h-12 bg-ink px-6 font-medium text-paper transition-colors hover:bg-clay-deep disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Register"}
      </button>
    </form>
  );
}
