import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import { Hud, PageHead } from "@/components/hud";
import { JoinForm } from "@/components/join-form";
import { getContent } from "@/lib/content";
import { dayLabel } from "@/lib/recruitment";

export const metadata: Metadata = {
  title: "Join",
  description: "Join The Fable Club: open to every VIT Chennai student, from any department. Free, with a short task and a quick chat.",
};

// Everything below comes from the club's answers (November 2026). Change it here.
const steps = [
  { t: "Apply", d: "Fill in the form, including one short task. No code needed." },
  { t: "Hear back within a week", d: "The core board reads every application and replies by email." },
  { t: "A short chat", d: "A quick conversation with the core board." },
];
const facts = [
  { t: "Who can apply", d: "Every VIT Chennai student, from any department. Beginners are welcome." },
  { t: "What members do", d: "A hands-on session every other week on building with Claude and agentic tools, and one member project." },
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
            {r.state === "open" ? (
              <JoinForm contactEmail={club.contactEmail} taskPrompt={r.taskPrompt} taskIsPlaceholder={r.taskIsPlaceholder} />
            ) : (
              <div className="relative overflow-hidden bg-night p-7 text-paper md:p-10">
                <span className="hud flex items-center gap-2 text-clay">
                  <span className="size-2 animate-pulse bg-clay" aria-hidden />
                  {r.state === "soon" ? "Opening soon" : "Closed"} · Intake {r.intake}
                </span>
                <p className="mt-5 max-w-[18ch] font-display text-[clamp(2.25rem,1.6rem+2.6vw,3.75rem)] leading-[1.02]">
                  {r.state === "soon" ? (opens ? `Applications open on ${opens}.` : "Opening date to be announced.") : "This intake is closed."}
                </p>
                <p className="mt-5 max-w-[46ch] font-serif text-lg leading-relaxed text-night-soft">
                  {r.state === "soon"
                    ? "The form will appear on this page when applications open. Join the WhatsApp group to hear the moment it does."
                    : "Thanks to everyone who applied. Follow us to hear when the next intake opens."}
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
            )}

            {/* how it works: the big version while the form is not up */}
            {r.state !== "open" && (
              <ol className="mt-12 grid gap-px border border-ink/15 bg-ink/15 md:grid-cols-3">
                {steps.map((s, i) => (
                  <li key={s.t} className="bg-paper p-6">
                    <Hud className="text-clay-deep">{String(i + 1).padStart(2, "0")}</Hud>
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
                <Hud className="text-ink-faint">How it works</Hud>
                <ol className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
                  {steps.map((s, i) => (
                    <li key={s.t} className="flex gap-4 py-4">
                      <Hud className="pt-1 text-clay-deep">{String(i + 1).padStart(2, "0")}</Hud>
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
              {r.whatsapp && r.state === "open" && (
                <a
                  href={r.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-between border border-ink px-4 py-3 text-sm font-medium transition-colors duration-500 ease-flow hover:bg-ink hover:text-paper"
                >
                  Recruitment WhatsApp group
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}
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
