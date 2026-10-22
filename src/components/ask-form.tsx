"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Hud } from "@/components/hud";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message?: string; errors?: Record<string, string> };

const input =
  "w-full border border-ink/40 bg-paper px-3 text-base outline-none transition-colors focus:border-ink focus:ring-2 focus:ring-clay/40 aria-[invalid=true]:border-destructive";

/** Ask the organisers a question about one event. No account; name and email are optional. */
export function AskForm({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [withEmail, setWithEmail] = useState(false);

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    setState("sending");
    setErrors({});
    setMessage(null);
    let result: Result;
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_slug: slug,
          question: f.get("question"),
          name: f.get("name"),
          email: withEmail ? f.get("email") : "",
          website: f.get("website"),
        }),
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
      <div role="status" className="flex items-start gap-4 border border-ink bg-paper-raised p-5">
        <span className="grid size-9 shrink-0 place-items-center bg-clay text-ink">
          <Check className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-display text-2xl leading-tight">Question sent.</p>
          <p className="mt-1 text-sm text-ink-soft">
            {withEmail ? "We'll email you the answer. " : ""}Useful answers also appear on this page.
          </p>
          <button type="button" onClick={() => setState("idle")} className="mt-3 text-sm underline underline-offset-4 hover:text-clay-deep">
            Ask another question
          </button>
        </div>
      </div>
    );
  }

  const bad = (k: string) => ({ "aria-invalid": errors[k] ? (true as const) : undefined, "aria-describedby": errors[k] ? `ask-${k}` : undefined });
  const err = (k: string) =>
    errors[k] ? (
      <p id={`ask-${k}`} className="mt-1 text-sm text-destructive">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 border border-ink bg-paper-raised p-5">
      <Hud className="text-ink-faint">Ask the organisers</Hud>
      <label className="block">
        <span className="sr-only">Your question</span>
        <textarea name="question" rows={3} maxLength={500} placeholder="Your question" className={cn(input, "py-3")} {...bad("question")} />
        {err("question")}
      </label>
      <label className="block">
        <span className="hud text-ink-faint">Name (optional)</span>
        <input name="name" autoComplete="name" maxLength={80} className={cn(input, "mt-1 h-11")} {...bad("name")} />
        {err("name")}
      </label>
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={withEmail} onChange={(e) => setWithEmail(e.target.checked)} className="mt-1 size-5 accent-[var(--color-clay-deep)]" />
        <span className="text-sm text-ink-soft">Email me the answer (your email is used once for this, then deleted)</span>
      </label>
      {withEmail && (
        <label className="block">
          <span className="hud text-ink-faint">Email</span>
          <input name="email" type="email" autoComplete="email" maxLength={200} className={cn(input, "mt-1 h-11")} {...bad("email")} />
          {err("email")}
        </label>
      )}
      {/* honeypot: hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className="h-12 bg-ink px-6 font-medium text-paper transition-colors duration-500 ease-flow hover:bg-clay-deep disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Send question"}
      </button>
      <p className="text-xs text-ink-faint">Questions are read by the organisers first. Nothing you type is shown on the site unless they answer it and choose to show it.</p>
    </form>
  );
}
