import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHead, Ph } from "@/components/hud";
import { MembersGrid } from "@/components/members-grid";
import { members } from "@/data/members";

export const metadata: Metadata = {
  title: "Members",
  description: "The faculty coordinators, board and leads of The Fable Club, with contact details.",
};

export default function MembersPage() {
  return (
    <>
      <PageHead
        crumb="Members"
        title="The people who run the club."
        lede="Open a card to read a bio and get in touch. Membership questions go to the faculty coordinators or any board member."
        art="/art/hands-together.svg"
      >
        <Ph className="mt-6">Bios, departments and contacts are placeholders</Ph>
      </PageHead>
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
          <Suspense fallback={null}>
            <MembersGrid members={members} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
