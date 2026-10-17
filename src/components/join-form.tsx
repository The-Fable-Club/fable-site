"use client";

import { useRef, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { Hud } from "@/components/hud";
import { cn } from "@/lib/utils";

const levels = [
  { v: "beginner", t: "I’ve barely used it", d: "Phase 1 starts from zero." },
  { v: "everyday", t: "I use it, but not well", d: "Turn casual use into a method." },
  { v: "builder", t: "I want to ship things", d: "Claude Code, MCP, agents." },
] as const;

const tracks = [
  "AI Fluency fundamentals",
  "Claude.ai for daily work",
  "Claude Code",
  "Agents & MCP",
] as const;

type Errors = Partial<Record<"name" | "reg" | "email" | "dept" | "year" | "level" | "why" | "consent", string>>;

const REG = /^\d{2}[A-Za-z]{3}\d{4,5}$/;
const RECIPIENT = "omana.j@vit.ac.in"; // placeholder: faculty coordinator

function validate(f: FormData): Errors {
  const e: Errors = {};
  const s = (k: string) => String(f.get(k) ?? "").trim();
  if (s("name").length < 2) e.name = "Enter your full name.";
  if (!REG.test(s("reg"))) e.reg = "Use your VIT registration number, like 25ABC1234.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s("email"))) e.email = "Enter a valid email address.";
  if (s("dept").length < 2) e.dept = "Enter your department or programme.";
  if (!s("year")) e.year = "Choose your year.";
  if (!s("level")) e.level = "Pick the one that fits best.";
  if (s("why").length < 20) e.why = "Tell us a little more (at least a sentence).";
  if (!f.get("consent")) e.consent = "Please confirm so we can contact you.";
  return e;
}

function Err({ errors, k }: { errors: Errors; k: keyof Errors }) {
  return errors[k] ? (
    <p id={`e-${k}`} className="mt-1.5 text-sm text-destructive">
      {errors[k]}
    </p>
  ) : null;
}

export function JoinForm() {
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const err = validate(f);
    setErrors(err);
    if (Object.keys(err).length) {
      const first = form.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const picked = f.getAll("tracks").map(String);
    const summary = [
      `Name: ${g("name")}`,
      `Registration number: ${g("reg")}`,
      `Email: ${g("email")}`,
      `Department: ${g("dept")}`,
      `Year: ${g("year")}`,
      `Experience: ${levels.find((l) => l.v === g("level"))?.t}`,
      `Interested in: ${picked.length ? picked.join(", ") : "Not sure yet"}`,
      ``,
      `Why I want to join:`,
      g("why"),
    ].join("\n");
    setProblem(null);
    setSending(true);
    let ok = false;
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: g("name"),
          reg_no: g("reg"),
          email: g("email"),
          department: g("dept"),
          year: g("year"),
          level: g("level"),
          tracks: picked,
          why: g("why"),
          consent: f.get("consent") === "on",
          website: g("website"),
        }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      ok = data.ok;
      if (!ok) setProblem(data.message ?? "We could not save your application.");
    } catch {
      setProblem("We could not reach the server.");
    }
    setSending(false);
    setSent(ok);
    setDone(summary); // kept so people can still email it if saving failed
  }

  if (done) {
    const mail = `mailto:${RECIPIENT}?subject=${encodeURIComponent("Application: The Fable Club")}&body=${encodeURIComponent(done)}`;
    return (
      <div role="status" className="border border-ink bg-paper-raised p-6 md:p-10">
        <span className="grid size-12 place-items-center bg-clay text-ink">
          <Check className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-4xl leading-tight">
          {sent ? "Your application is in." : "Your application is ready."}
        </h2>
        <p className="mt-3 max-w-[52ch] font-serif text-lg text-ink-soft">
          {sent
            ? "The coordinators have received it. Here is a copy of what you sent."
            : `${problem ?? "We could not save it."} You can email it to the coordinators instead.`}
        </p>
        <pre className="mt-6 max-h-64 overflow-auto whitespace-pre-wrap border border-ink/20 bg-paper p-4 text-sm leading-relaxed">
          {done}
        </pre>
        <div className="mt-6 flex flex-wrap gap-3">
          {!sent && (
          <a
            href={mail}
            className="inline-flex h-12 items-center gap-2 bg-ink px-6 font-medium text-paper transition-colors hover:bg-clay-deep"
          >
            <Mail className="size-4" aria-hidden />
            Email the coordinator
          </a>
          )}
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(done);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              } catch {
                /* clipboard unavailable: user can select the text above */
              }
            }}
            className="inline-flex h-12 items-center gap-2 border border-ink px-6 font-medium transition-colors hover:bg-ink hover:text-paper"
          >
            <Copy className="size-4" aria-hidden />
            {copied ? "Copied" : "Copy answers"}
          </button>
          {!sent && (
          <button
            onClick={() => setDone(null)}
            className="h-12 px-4 font-medium underline underline-offset-4 hover:text-clay-deep"
          >
            Edit answers
          </button>
          )}
        </div>
      </div>
    );
  }

  const field = (k: keyof Errors) => ({
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `e-${k}` : undefined,
  });
  const input =
    "h-12 w-full border bg-paper px-3 text-base outline-none transition-colors focus:border-ink focus:ring-2 focus:ring-clay/40 aria-[invalid=true]:border-destructive";
  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="grid gap-8">
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="hud text-ink-faint">Full name</span>
          <input name="name" autoComplete="name" className={cn(input, "mt-1.5 border-ink/40")} {...field("name")} />
          <Err errors={errors} k="name" />
        </label>
        <label className="block">
          <span className="hud text-ink-faint">Registration number</span>
          <input
            name="reg"
            autoComplete="off"
            placeholder="25ABC1234"
            className={cn(input, "mt-1.5 border-ink/40 uppercase")}
            {...field("reg")}
          />
          <Err errors={errors} k="reg" />
        </label>
        <label className="block">
          <span className="hud text-ink-faint">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className={cn(input, "mt-1.5 border-ink/40")}
            {...field("email")}
          />
          <Err errors={errors} k="email" />
        </label>
        <label className="block">
          <span className="hud text-ink-faint">Department / programme</span>
          <input name="dept" className={cn(input, "mt-1.5 border-ink/40")} {...field("dept")} />
          <Err errors={errors} k="dept" />
        </label>
        <label className="block md:col-span-1">
          <span className="hud text-ink-faint">Year</span>
          <select
            name="year"
            defaultValue=""
            className={cn(input, "mt-1.5 border-ink/40")}
            {...field("year")}
          >
            <option value="" disabled>
              Choose
            </option>
            {["1st", "2nd", "3rd", "4th", "Postgraduate"].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <Err errors={errors} k="year" />
        </label>
      </div>

      <fieldset>
        <legend className="hud text-ink-faint">Where are you with Claude today?</legend>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {levels.map((l) => (
            <label
              key={l.v}
              className="group relative block cursor-pointer border border-ink/40 p-4 transition-colors hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-clay"
            >
              <input type="radio" name="level" value={l.v} className="peer sr-only" {...field("level")} />
              <span className="block font-display text-xl leading-tight">“{l.t}.”</span>
              <span className="mt-1 block text-sm opacity-75">{l.d}</span>
            </label>
          ))}
        </div>
        <Err errors={errors} k="level" />
      </fieldset>

      <fieldset>
        <legend className="hud text-ink-faint">What do you want to learn? (optional)</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {tracks.map((t) => (
            <label
              key={t}
              className="cursor-pointer border border-ink/40 px-4 py-2 text-sm transition-colors hover:border-ink has-[:checked]:border-clay-deep has-[:checked]:bg-clay has-[:checked]:text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-clay"
            >
              <input type="checkbox" name="tracks" value={t} className="sr-only" />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="hud text-ink-faint">Why do you want to join?</span>
        <textarea
          name="why"
          rows={5}
          className={cn(input, "mt-1.5 h-auto border-ink/40 py-3")}
          {...field("why")}
        />
        <Err errors={errors} k="why" />
      </label>

      <div>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consent" className="mt-1 size-5 accent-[var(--color-clay-deep)]" {...field("consent")} />
          <span className="text-sm text-ink-soft">
            I’m a VIT Chennai student and happy for the club to contact me about this application.
          </span>
        </label>
        <Err errors={errors} k="consent" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={sending}
          className="h-14 bg-ink px-10 text-lg font-medium text-paper transition-colors hover:bg-clay-deep disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send my application"}
        </button>
        <Hud className="text-ink-faint">We’ll contact you by email.</Hud>
      </div>
    </form>
  );
}
