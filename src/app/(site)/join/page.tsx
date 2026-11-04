import type { Metadata } from "next";
import { pageMeta } from "@/lib/meta";
import { ArrowUpRight, Mail } from "lucide-react";
import { Hud, PageHead } from "@/components/hud";
import { JoinForm, TeamDetail } from "@/components/join-form";
import { getContent, readTeams } from "@/lib/content";
import { dayLabel } from "@/lib/recruitment";

export const metadata: Metadata = pageMeta(
  "Join",
  "Join The Fable Club: open to every VIT Chennai student, from any department. Free, with a short task and a quick chat.",
  "/join",
);

// Everything below comes from the club's answers (November 2026). Change it here.
// Used only when content/club.json has no recruitment timeline.
const defaultSteps = [
  { t: "Apply", d: "Fill in the form, including one short task. No code needed.", when: "01" },
  { t: "Hear back by email", d: "The core board reads every application and replies by email.", when: "02" },
  { t: "A short chat", d: "A quick conversation with the core board.", when: "03" },
];
const facts = [
  { t: "Who can apply", d: "Every VIT Chennai student, from any department. Beginners are welcome." },
  { t: "What members do", d: "A hands-on session every other week on building with Claude and agentic tools, and two member projects." },
  { t: "What you get", d: "A participation certificate, projects you have actually shipped for your resume, and workshops on Claude and agentic tools." },
  { t: "Cost", d: "Free." },
];
const faq = [
  { q: "Do I need to know how to code?", a: "No. Beginners are welcome." },
  { q: "I’m not in a computing department. Is this for me?", a: "Yes. Every department is welcome." },
  { q: "How often does the club meet?", a: "Every other week." },
  { q: "Is the club part of Anthropic?", a: "No. The Fable Club is an independent student club approved by VIT. We are applying for official status with Anthropic." },
];

export default async function JoinPage() {
  const { club } = await getContent();
  const r = club.recruitment;
  const opens = r.opens ? dayLabel(r.opens) : null;
  const closes = r.closes ? dayLabel(r.closes) : null;
  const instagram = club.socials.find((s) => s.label === "Instagram");
  const teams = readTeams();
  const steps = r.timeline?.length ? r.timeline.map((x) => ({ t: x.title, d: x.detail, when: x.when })) : defaultSteps;
  // what an applicant is told after sending: the steps after "apply"
  const after = r.timeline?.slice(1, 3).map((x) => `${x.title.toLowerCase()} ${x.when}`).join(", ");

  const head = {
    open: {
      title: "Apply to the club.",
      lede: `Applications for the ${r.intake} intake are open${closes ? ` until ${closes}` : ""}. Open to every VIT Chennai student, from any department, and free.`,
    },
    soon: {
      title: "Applications open soon.",
      lede: `The ${r.intake} intake opens ${opens ? `on ${opens}` : "soon; the date will be announced"}. Here is how joining works, so you are ready.`,
    },
    closed: {
      title: "Applications are closed.",
      lede: `The ${r.intake} intake is closed. Follow the club to hear when the next one opens.`,
    },
  }[r.state];

  return (
    <>
      <PageHead crumb="Join" title={head.title} lede={head.lede} art="/art/sprouts.svg" />
      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-14 md:grid-cols-[1fr_20rem] md:px-12 md:py-20">
          <div className="min-w-0">
            {/* status, dates and the ways to follow the club */}
            <div className="relative mb-14 overflow-hidden bg-night p-7 text-paper md:p-10">
              <span className="hud flex items-center gap-2 text-clay">
                <span className="size-2 animate-pulse bg-clay" aria-hidden />
                {{ open: "Applications open", soon: "Opening soon", closed: "Closed" }[r.state]} · Intake {r.intake}
              </span>
              <p className="mt-5 max-w-[18ch] font-display text-[clamp(2.25rem,1.6rem+2.6vw,3.75rem)] leading-[1.02]">
                {
                {
                  open: closes ? `Applications close on ${closes}.` : "Applications are open.",
                  soon: opens ? `Applications open on ${opens}.` : "Opening date to be announced.",
                  closed: "This intake is closed.",
                }[r.state]
              }
              </p>
              <p className="mt-5 max-w-[46ch] font-serif text-lg leading-relaxed text-night-soft">
                {
                  {
                    open: "Find your team below, then fill in the form. Join the WhatsApp group for updates on interviews and results.",
                    soon: "The form will appear on this page when applications open. Join the WhatsApp group to hear the moment it does.",
                    closed: "Thanks to everyone who applied. Follow us to hear when the next intake opens.",
                  }[r.state]
                }
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {r.whatsapp && (
                  <a
                    href={r.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2 bg-clay px-6 font-medium text-ink transition-colors duration-500 ease-flow hover:bg-paper"
                  >
                    Join the WhatsApp group
                    <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                )}
                {instagram && (
                  <a
                    href={instagram.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2 border border-paper/40 px-6 font-medium transition-colors duration-500 ease-flow hover:border-paper hover:bg-paper/10"
                  >
                    Follow on Instagram
                    <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                )}
                <a
                  href={`mailto:${club.contactEmail}`}
                  className="inline-flex h-12 items-center gap-2 border border-paper/40 px-6 font-medium transition-colors duration-500 ease-flow hover:border-paper hover:bg-paper/10"
                >
                  <Mail className="size-4" aria-hidden />
                  {club.contactEmail}
                </a>
              </div>
              {/* corner ticks */}
              <span aria-hidden className="absolute right-4 top-4 size-3 border-r border-t border-paper/40" />
              <span aria-hidden className="absolute bottom-4 right-4 size-3 border-b border-r border-paper/40" />
            </div>

            {/* the teams first, so people find where they fit before anything else (the form shows the same text when a team is picked) */}
            <div id="teams" className="mb-14 scroll-mt-24">
              <Hud className="text-ink-faint">The teams</Hud>
              <p className="mt-2 font-display text-3xl leading-tight">Find where you fit.</p>
              <div className="mt-6 divide-y divide-ink/15 border-y border-ink/15">
                {teams
                  .filter((t) => t.lookingFor.length > 0)
                  .map((t) => (
                    <details key={t.name} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                        <span>
                          <span className="block font-display text-2xl leading-tight">{t.name}</span>
                          <span className="mt-1 block text-sm text-ink-soft">{t.short}</span>
                        </span>
                        <span
                          aria-hidden
                          className="mt-2 block size-2.5 shrink-0 rotate-45 border-b-2 border-r-2 border-ink transition-transform duration-500 ease-flow group-open:translate-y-1 group-open:-rotate-[135deg]"
                        />
                      </summary>
                      <div className="mt-3">
                        <TeamDetail team={t} plain />
                      </div>
                    </details>
                  ))}
              </div>
              <p className="mt-4 text-sm text-ink-soft">Not sure yet? That&rsquo;s an option on the form too, and we&rsquo;ll help you choose.</p>
            </div>

            {r.state === "open" && (
              <div id="apply" className="scroll-mt-24">
                <JoinForm contactEmail={club.contactEmail} taskPrompt={r.taskPrompt} taskIsPlaceholder={r.taskIsPlaceholder} teams={teams} nextSteps={after} />
              </div>
            )}

            {/* how it works: the big version while the form is not up */}
            {r.state !== "open" && (
              <ol className="mt-12 grid gap-px border border-ink/15 bg-ink/15 md:grid-cols-2">
                {steps.map((s) => (
                  <li key={s.t} className="bg-paper p-6">
                    <Hud className="text-clay-deep">{s.when}</Hud>
                    <p className="mt-3 font-display text-2xl leading-tight">{s.t}</p>
                    <p className="mt-2 text-sm text-ink-soft">{s.d}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <aside className="space-y-12 md:pt-2">
            {r.state === "open" && (
              <div>
                <Hud className="text-ink-faint">Key dates</Hud>
                <ol className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
                  {steps.map((s) => (
                    <li key={s.t} className="flex gap-4 py-4">
                      <Hud className="w-16 shrink-0 pt-1 text-clay-deep">{s.when}</Hud>
                      <div>
                        <p className="font-display text-xl leading-tight">{s.t}</p>
                        <p className="mt-1 text-sm text-ink-soft">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div>
              <Hud className="text-ink-faint">The short version</Hud>
              <dl className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
                {facts.map((f) => (
                  <div key={f.t} className="py-4">
                    <dt className="font-display text-xl leading-tight">{f.t}</dt>
                    <dd className="mt-1 text-sm text-ink-soft">{f.d}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <Hud className="text-ink-faint">Questions</Hud>
              <div className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
                {faq.map((f) => (
                  <details key={f.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-medium">
                      {f.q}
                      <span
                        aria-hidden
                        className="mt-1 block size-2.5 shrink-0 rotate-45 border-b-2 border-r-2 border-ink transition-transform duration-500 ease-flow group-open:translate-y-1 group-open:-rotate-[135deg]"
                      />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
                  </details>
                ))}
              </div>
              <p className="mt-4 text-sm text-ink-soft">
                Anything else? Write to{" "}
                <a href={`mailto:${club.contactEmail}`} className="underline underline-offset-4 transition-colors duration-500 ease-flow hover:text-clay-deep">
                  {club.contactEmail}
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
