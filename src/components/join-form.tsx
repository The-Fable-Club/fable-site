"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Hud, Ph } from "@/components/hud";
import type { Team } from "@/lib/content";
import { ApplicationInput, TEAMS, YEARS, fieldErrors } from "@/lib/submissions";
import { cn } from "@/lib/utils";

type Errors = Record<string, string>;

function Err({ errors, k }: { errors: Errors; k: string }) {
  return errors[k] ? (
    <p id={`e-${k}`} className="mt-1.5 text-sm text-destructive">
      {errors[k]}
    </p>
  ) : null;
}

/** What the picked team does and looks for, under the team buttons. */
export function TeamDetail({ team, id, plain }: { team: Team; id?: string; plain?: boolean }) {
  return (
    <div id={id} className={plain ? undefined : "border-l-2 border-clay bg-paper-raised p-5"}>
      {!plain && <p className="font-display text-2xl leading-tight">{team.name}</p>}
      <p className={cn("mt-2 max-w-[62ch] font-serif leading-relaxed text-ink-soft", plain ? "text-base" : "text-lg")}>{team.about}</p>
      {team.lookingFor.length > 0 && (
        <div className="mt-4">
          <Hud className="text-ink-faint">What we look for</Hud>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {team.lookingFor.map((x) => (
              <li key={x} className="flex gap-2.5">
                <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 bg-clay-deep" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      )}
      {team.niceToHave.length > 0 && (
        <div className="mt-4">
          <Hud className="text-ink-faint">Nice to have</Hud>
          <ul className="mt-2 grid gap-1.5 text-sm text-ink-soft">
            {team.niceToHave.map((x) => (
              <li key={x} className="flex gap-2.5">
                <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 border border-ink/50" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** One numbered part of the form. */
function Part({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-6 border-t border-ink pt-6">
      <legend className="float-left flex w-full items-baseline gap-3">
        <span className="hud text-clay-deep">{n}</span>
        <span className="font-display text-2xl leading-none">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

const labels: Record<string, string> = {
  name: "Name",
  reg_no: "Registration number",
  email: "VIT email",
  phone: "Phone / WhatsApp",
  department: "Department",
  year: "Year",
  team: "Preferred team",
  build: "Wants to build or learn",
  why: "Why I want to join",
  task: "Short task",
};

/**
 * The application form. It checks the answers with the same rules the server
 * uses (src/lib/submissions.ts), so the two can never disagree, then posts to
 * /api/applications. If saving fails, the answers can still be emailed.
 */
export function JoinForm({
  contactEmail,
  taskPrompt,
  taskIsPlaceholder,
  teams,
}: {
  contactEmail: string;
  taskPrompt: string;
  taskIsPlaceholder?: boolean;
  teams: Team[];
}) {
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [taskLen, setTaskLen] = useState(0);
  const [team, setTeam] = useState<string | null>(null);
  const picked = teams.find((t) => t.name === team);
  const status = useRef<HTMLDivElement>(null);

  // The confirmation is much shorter than the form it replaces: bring it into view, or people are left looking at the footer.
  useEffect(() => {
    if (!done || !status.current) return;
    status.current.scrollIntoView({ behavior: "smooth", block: "center" });
    status.current.focus({ preventScroll: true });
  }, [done]);

  const focusFirstError = () =>
    requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const payload = {
      name: g("name"),
      reg_no: g("reg_no"),
      email: g("email"),
      phone: g("phone"),
      department: g("department"),
      year: g("year"),
      team: g("team"),
      build: g("build"),
      why: g("why"),
      task: g("task"),
      consent: f.get("consent") === "on",
      website: g("website"),
    };
    const check = ApplicationInput.safeParse(payload);
    if (!check.success) {
      setErrors(fieldErrors(check.error));
      focusFirstError();
      return;
    }
    setErrors({});
    const summary = [
      ...Object.entries(labels)
        .filter(([k]) => !["build", "why", "task"].includes(k))
        .map(([k, l]) => `${l}: ${payload[k as keyof typeof payload]}`),
      "",
      `What I'd like to build or learn:\n${payload.build}`,
      "",
      `Why I want to join:\n${payload.why}`,
      "",
      `Short task: ${taskPrompt}\n${payload.task}`,
    ].join("\n");

    setProblem(null);
    setSending(true);
    let ok = false;
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; errors?: Errors };
      ok = data.ok;
      if (!ok && data.errors && Object.keys(data.errors).length) {
        // the server found something the browser did not: show it on the fields, keep the form
        setSending(false);
        setErrors(data.errors);
        setProblem(data.message ?? null);
        focusFirstError();
        return;
      }
      if (!ok) setProblem(data.message ?? "We could not save your application.");
    } catch {
      setProblem("We could not reach the server.");
    }
    setSending(false);
    setSent(ok);
    setDone(summary); // kept so people can still email it if saving failed
  }

  if (done) {
    const mail = `mailto:${contactEmail}?subject=${encodeURIComponent("Application: The Fable Club")}&body=${encodeURIComponent(done)}`;
    return (
      <div ref={status} role="status" tabIndex={-1} className="scroll-mt-24 border border-ink bg-paper-raised p-6 outline-none md:p-10">
        <span className="grid size-12 place-items-center bg-clay text-ink">
          <Check className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-4xl leading-tight">{sent ? "Your application is in." : "Your application is ready."}</h2>
        <p className="mt-3 max-w-[52ch] font-serif text-lg text-ink-soft">
          {sent
            ? "The core board reads every application, and you will hear from us by email within a week. The next step after that is a short chat."
            : `${problem ?? "We could not save it."} You can email it to the club instead.`}
        </p>
        <pre className="mt-6 max-h-64 overflow-auto whitespace-pre-wrap border border-ink/20 bg-paper p-4 text-sm leading-relaxed">
          {done}
        </pre>
        <div className="mt-6 flex flex-wrap gap-3">
          {!sent && (
            <a
              href={mail}
              className="inline-flex h-12 items-center gap-2 bg-ink px-6 font-medium text-paper transition-colors duration-500 ease-flow hover:bg-clay-deep"
            >
              <Mail className="size-4" aria-hidden />
              Email it to {contactEmail}
            </a>
          )}
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(done);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              } catch {
                /* clipboard unavailable: the text above can be selected */
              }
            }}
            className="inline-flex h-12 items-center gap-2 border border-ink px-6 font-medium transition-colors duration-500 ease-flow hover:bg-ink hover:text-paper"
          >
            <Copy className="size-4" aria-hidden />
            {copied ? "Copied" : "Copy answers"}
          </button>
          {!sent && (
            <button
              onClick={() => setDone(null)}
              className="h-12 px-4 font-medium underline underline-offset-4 transition-colors duration-500 ease-flow hover:text-clay-deep"
            >
              Edit answers
            </button>
          )}
        </div>
      </div>
    );
  }

  const field = (k: string) => ({
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `e-${k}` : undefined,
  });
  const input =
    "mt-1.5 h-12 w-full border border-ink/40 bg-paper px-3 text-base outline-none transition-colors duration-500 ease-flow focus:border-ink focus:ring-2 focus:ring-clay/40 aria-[invalid=true]:border-destructive";
  const area = cn(input, "h-auto py-3 leading-relaxed");

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="grid gap-12">
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Part n="01" title="About you">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="hud text-ink-faint">Full name</span>
            <input name="name" autoComplete="name" className={input} {...field("name")} />
            <Err errors={errors} k="name" />
          </label>
          <label className="block">
            <span className="hud text-ink-faint">VIT registration number</span>
            <input name="reg_no" autoComplete="off" placeholder="25ABC1234" className={cn(input, "uppercase")} {...field("reg_no")} />
            <Err errors={errors} k="reg_no" />
          </label>
          <label className="block">
            <span className="hud text-ink-faint">VIT email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@vitstudent.ac.in"
              className={input}
              {...field("email")}
            />
            <Err errors={errors} k="email" />
          </label>
          <label className="block">
            <span className="hud text-ink-faint">Phone / WhatsApp</span>
            <input name="phone" type="tel" autoComplete="tel" placeholder="+91" className={input} {...field("phone")} />
            <Err errors={errors} k="phone" />
          </label>
          <label className="block">
            <span className="hud text-ink-faint">Department / programme</span>
            <input name="department" className={input} {...field("department")} />
            <Err errors={errors} k="department" />
          </label>
          <label className="block">
            <span className="hud text-ink-faint">Year</span>
            <select name="year" defaultValue="" className={input} {...field("year")}>
              <option value="" disabled>
                Choose
              </option>
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <Err errors={errors} k="year" />
          </label>
        </div>
      </Part>

      <Part n="02" title="What you want from the club">
        <div role="radiogroup" aria-labelledby="team-label" aria-describedby={errors.team ? "e-team" : undefined}>
          <span id="team-label" className="hud text-ink-faint">
            Which team would you like to be part of?
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {TEAMS.map((t) => (
              <label
                key={t}
                className="cursor-pointer border border-ink/40 px-4 py-2.5 text-sm transition-colors duration-500 ease-flow hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-clay"
              >
                <input
                  type="radio"
                  name="team"
                  value={t}
                  className="sr-only"
                  onChange={() => setTeam(t)}
                  aria-controls="team-detail"
                  {...field("team")}
                />
                {t}
              </label>
            ))}
          </div>
          <Err errors={errors} k="team" />
          <p className="mt-3 text-sm text-ink-faint">Pick a team to see what it does and what it looks for.</p>
          <div aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {picked && (
                <motion.div
                  key={picked.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
                  className="mt-4"
                >
                  <TeamDetail team={picked} id="team-detail" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <label className="block">
          <span className="hud text-ink-faint">What would you like to build or learn?</span>
          <textarea name="build" rows={3} className={area} {...field("build")} />
          <Err errors={errors} k="build" />
        </label>
        <label className="block">
          <span className="hud text-ink-faint">Why do you want to join?</span>
          <textarea name="why" rows={4} className={area} {...field("why")} />
          <Err errors={errors} k="why" />
        </label>
      </Part>

      <Part n="03" title="A short task">
        <div className="border-l-2 border-clay bg-paper-raised p-5">
          <p className="font-serif text-lg leading-relaxed">{taskPrompt}</p>
          {taskIsPlaceholder && <Ph className="mt-3">Placeholder task: wording not final</Ph>}
          <p className="mt-3 text-sm text-ink-soft">
            There is no right answer and no code needed. A few honest sentences are plenty; we want to see how you think.
          </p>
        </div>
        <label className="block">
          <span className="flex items-baseline justify-between gap-3">
            <span className="hud text-ink-faint">Your answer</span>
            <span className="hud text-ink-faint tabular-nums">{taskLen} / 3000</span>
          </span>
          <textarea
            name="task"
            rows={7}
            maxLength={3000}
            onChange={(e) => setTaskLen(e.currentTarget.value.length)}
            className={area}
            {...field("task")}
          />
          <Err errors={errors} k="task" />
        </label>
      </Part>

      <div className="grid gap-6 border-t border-ink pt-6">
        <div>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="consent" className="mt-1 size-5 accent-[var(--color-clay-deep)]" {...field("consent")} />
            <span className="text-sm text-ink-soft">
              I’m a VIT Chennai student and happy for the club to contact me about this application.
            </span>
          </label>
          <Err errors={errors} k="consent" />
          <p className="mt-3 max-w-[60ch] text-sm text-ink-faint">
            Your answers are used only for club recruitment and are seen only by the core board.
          </p>
        </div>
        {problem && (
          <p role="alert" className="text-sm text-destructive">
            {problem}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={sending}
            className="h-14 bg-ink px-10 text-lg font-medium text-paper transition-colors duration-500 ease-flow hover:bg-clay-deep disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send my application"}
          </button>
          <Hud className="text-ink-faint">One application per person. We reply by email within a week.</Hud>
        </div>
      </div>
    </form>
  );
}
