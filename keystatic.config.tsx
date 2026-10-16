import { collection, config, fields, singleton } from "@keystatic/core";

// Content model for the club site. Edit content at /keystatic.
// - In `npm run dev` it edits the files in ./content directly.
// - In production it signs in with GitHub and commits to the repo, which
//   makes Vercel redeploy. Setup notes: docs/CMS.md

const repo = (process.env.NEXT_PUBLIC_KEYSTATIC_REPO ?? "CLUB-ORG/fable-site") as `${string}/${string}`;

export const artOptions = [
  { label: "Code window", value: "code-window" },
  { label: "Pointing hand", value: "pointer" },
  { label: "Thinker", value: "thinker" },
  { label: "Sprouts", value: "sprouts" },
  { label: "Open book", value: "book" },
  { label: "Network", value: "network" },
  { label: "Party", value: "party" },
  { label: "Hands together", value: "hands-together" },
  { label: "Magnifier", value: "search" },
  { label: "Writing", value: "writing" },
  { label: "Steps", value: "steps" },
  { label: "Cursor", value: "cursor" },
] as const;

export const modelOptions = [
  { label: "Pages", value: "pages" },
  { label: "Open book", value: "book" },
  { label: "Blocks", value: "blocks" },
  { label: "Steps", value: "steps" },
  { label: "Network", value: "network" },
] as const;

export default config({
  // Local files in dev; GitHub in production. Set KEYSTATIC_STORAGE=github in
  // dev to test GitHub mode (needed once, to create the GitHub App).
  storage:
    process.env.NODE_ENV === "development" && process.env.KEYSTATIC_STORAGE !== "github"
      ? { kind: "local" }
      : { kind: "github", repo },

  ui: {
    brand: { name: "The Fable Club" },
    navigation: {
      Content: ["events", "members"],
      "Site text": ["club", "aims"],
    },
  },

  collections: {
    events: collection({
      label: "Events",
      slugField: "title",
      path: "content/events/*",
      format: "json",
      columns: ["kind", "start"],
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        kind: fields.text({ label: "Kind", description: "Workshop, Build night, Flagship…" }),
        phase: fields.select({
          label: "Phase",
          defaultValue: "1",
          options: [
            { label: "Kick-off (0)", value: "0" },
            { label: "1 · Foundations", value: "1" },
            { label: "2 · Building Skills", value: "2" },
            { label: "3 · Advanced & Flagship", value: "3" },
            { label: "4 · Outcomes & Handover", value: "4" },
          ],
        }),
        status: fields.select({
          label: "Status",
          description:
            "Leave on Automatic: it works out Live / Open / Past from the dates. Only override for special cases.",
          defaultValue: "auto",
          options: [
            { label: "Automatic (from dates)", value: "auto" },
            { label: "Live now", value: "active" },
            { label: "Upcoming", value: "upcoming" },
            { label: "Past", value: "past" },
          ],
        }),
        start: fields.date({ label: "Start date", validation: { isRequired: true } }),
        end: fields.date({ label: "End date", description: "Leave empty for a one-day event." }),
        time: fields.text({ label: "Time", description: "e.g. 4:00 – 6:00 pm" }),
        venue: fields.text({ label: "Venue" }),
        summary: fields.text({ label: "Summary", multiline: true, description: "One or two sentences." }),
        description: fields.text({
          label: "About this event",
          multiline: true,
          description: "Separate paragraphs with a blank line.",
        }),
        highlights: fields.array(fields.text({ label: "Highlight" }), {
          label: "What happens",
          itemLabel: (p) => p.value || "Highlight",
        }),
        art: fields.select({ label: "Illustration", defaultValue: "sprouts", options: [...artOptions] }),
        photo: fields.image({
          label: "Photo (optional)",
          description: "Shown instead of the illustration when set.",
          directory: "public/uploads/events",
          publicPath: "/uploads/events/",
        }),
        applyUrl: fields.text({
          label: "Apply link",
          description: "Only shown for live and upcoming events.",
        }),
        seats: fields.text({ label: "Seats / who can join" }),
        hub: fields.array(
          fields.object({
            kind: fields.select({
              label: "Type",
              defaultValue: "announcement",
              options: [
                { label: "Update", value: "announcement" },
                { label: "Link", value: "link" },
                { label: "File", value: "file" },
                { label: "Schedule", value: "schedule" },
              ],
            }),
            title: fields.text({ label: "Title", validation: { isRequired: true } }),
            body: fields.text({ label: "Message", multiline: true }),
            href: fields.text({ label: "Link or file URL" }),
            postedBy: fields.text({ label: "Posted by" }),
            postedAt: fields.date({ label: "Posted on" }),
          }),
          {
            label: "Participant hub posts",
            description: "Shown on the event's participant hub page. Newest first.",
            itemLabel: (p) => p.fields.title.value || "Post",
          },
        ),
      },
    }),

    members: collection({
      label: "Members",
      slugField: "name",
      path: "content/members/*",
      format: "json",
      columns: ["role", "group"],
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        role: fields.text({ label: "Role", description: "Chairperson, Technical Lead…" }),
        group: fields.select({
          label: "Group",
          defaultValue: "Leads",
          options: [
            { label: "Faculty coordinators", value: "Faculty" },
            { label: "Board", value: "Board" },
            { label: "Leads", value: "Leads" },
          ],
        }),
        order: fields.integer({
          label: "Order",
          description: "Lower numbers come first within a group.",
          defaultValue: 50,
        }),
        department: fields.text({ label: "Department" }),
        year: fields.text({ label: "Year" }),
        bio: fields.text({ label: "Bio", multiline: true }),
        focus: fields.array(fields.text({ label: "Focus area" }), {
          label: "Focus areas",
          itemLabel: (p) => p.value || "Focus",
        }),
        email: fields.text({ label: "Email" }),
        linkedin: fields.text({ label: "LinkedIn URL" }),
        github: fields.text({ label: "GitHub URL" }),
        art: fields.select({ label: "Illustration", defaultValue: "sprouts", options: [...artOptions] }),
        photo: fields.image({
          label: "Photo (optional)",
          directory: "public/uploads/members",
          publicPath: "/uploads/members/",
        }),
      },
    }),
  },

  singletons: {
    club: singleton({
      label: "Club details",
      path: "content/club",
      format: "json",
      schema: {
        tagline: fields.text({ label: "Tagline" }),
        description: fields.text({ label: "About text", multiline: true }),
        institution: fields.text({ label: "Institution" }),
        office: fields.text({ label: "Office / department" }),
        contactEmail: fields.text({ label: "Contact email" }),
        disclaimer: fields.text({ label: "Footer disclaimer" }),
        socials: fields.array(
          fields.object({
            label: fields.text({ label: "Name" }),
            href: fields.text({ label: "Link" }),
          }),
          { label: "Social links", itemLabel: (p) => p.fields.label.value || "Link" },
        ),
        stats: fields.array(
          fields.object({
            label: fields.text({ label: "Label" }),
            value: fields.text({ label: "Value", description: "Numbers count up on the page." }),
            note: fields.text({ label: "Note" }),
          }),
          { label: "Headline numbers", itemLabel: (p) => p.fields.label.value || "Stat" },
        ),
        phases: fields.array(
          fields.object({
            name: fields.text({ label: "Name" }),
            span: fields.text({ label: "Dates", description: "e.g. Oct – Nov 2026" }),
          }),
          { label: "Programme phases", itemLabel: (p) => p.fields.name.value || "Phase" },
        ),
      },
    }),

    aims: singleton({
      label: "What we’re for",
      path: "content/aims",
      format: "json",
      schema: {
        aims: fields.array(
          fields.object({
            title: fields.text({ label: "Title", validation: { isRequired: true } }),
            body: fields.text({ label: "Text", multiline: true }),
            model: fields.select({
              label: "3D model",
              description: "Which shape the 3D viewer shows for this aim.",
              defaultValue: "pages",
              options: [...modelOptions],
            }),
          }),
          { label: "Aims (in order)", itemLabel: (p) => p.fields.title.value || "Aim" },
        ),
      },
    }),
  },
});
