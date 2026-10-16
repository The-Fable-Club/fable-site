import type { Metadata } from "next";
import { Hud, PageHead } from "@/components/hud";
import { JoinForm } from "@/components/join-form";

export const metadata: Metadata = {
  title: "Join",
  description: "Apply to The Fable Club. Open to every VIT Chennai student, no experience needed.",
};

const bring = [
  { t: "A laptop", d: "Sessions are hands-on. You will be building, not watching." },
  { t: "A Claude account", d: "We will help you set one up in the first session." },
  { t: "Something you want to make", d: "An essay, a study system, an app, a research question." },
];

const faq = [
  {
    q: "Do I need to know how to code?",
    a: "No. Claude is taught for writing, research and studying as well as coding, and Phase 1 assumes no experience.",
  },
  {
    q: "I’m not in a computing department. Is this for me?",
    a: "Yes. Teams are mixed across departments so different skills meet on the same project.",
  },
  {
    q: "How often does the club meet?",
    a: "A two-hour build session every other week, plus ten events between October 2026 and April 2027.",
  },
  {
    q: "Is the club part of Anthropic?",
    a: "No. We are an independent student club and teach with Anthropic’s public material.",
  },
];

export default function JoinPage() {
  return (
    <>
      <PageHead
        crumb="Join"
        title="Apply to the club."
        lede="Open to every VIT Chennai student, from any department. It takes about three minutes."
        art="/art/sprouts.svg"
      />
      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-14 md:grid-cols-[1fr_20rem] md:px-12 md:py-20">
          <JoinForm />

          <aside className="space-y-12 md:pt-2">
            <div>
              <Hud className="text-ink-faint">What to bring</Hud>
              <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
                {bring.map((b) => (
                  <li key={b.t} className="py-4">
                    <p className="font-display text-xl leading-tight">{b.t}</p>
                    <p className="mt-1 text-sm text-ink-soft">{b.d}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Hud className="text-ink-faint">Questions</Hud>
              <div className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
                {faq.map((f) => (
                  <details key={f.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-medium">
                      {f.q}
                      <span aria-hidden className="mt-1 block size-2.5 shrink-0 border-b-2 border-r-2 border-ink transition-transform group-open:-rotate-[135deg] group-open:translate-y-1 rotate-45" />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
