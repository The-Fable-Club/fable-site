// PLACEHOLDER CONTENT — dates, venues, links and resources are all samples.
// Status drives the UI: only "active" and "upcoming" events can be applied to
// and have a participant hub. "past" events are history only.

export type EventStatus = "active" | "upcoming" | "past";

export type HubItem = {
  id: string;
  kind: "announcement" | "link" | "file" | "schedule";
  title: string;
  body?: string;
  href?: string;
  postedBy: string;
  postedAt: string; // ISO date
};

export type ClubEvent = {
  slug: string;
  title: string;
  kind: string;
  phase: 0 | 1 | 2 | 3 | 4;
  status: EventStatus;
  start: string; // ISO date (YYYY-MM-DD)
  end?: string;
  time: string;
  venue: string;
  summary: string;
  description: string[];
  highlights: string[];
  art: string;
  applyUrl?: string; // only meaningful for active / upcoming
  seats?: string;
  hub?: HubItem[]; // board → participants, only for active / upcoming
};

export const events: ClubEvent[] = [
  {
    slug: "club-orientation",
    title: "Club Orientation",
    kind: "Kick-off",
    phase: 0,
    status: "past",
    start: "2026-09-26",
    time: "4:00 – 5:30 pm",
    venue: "Placeholder Hall, VIT Chennai",
    summary: "The club’s first meeting: what we teach, how the year runs and who to talk to.",
    description: [
      "A relaxed introduction to The Fable Club for anyone curious. The board walked through the year’s programme, the Anthropic Academy tracks and how build sessions work.",
    ],
    highlights: ["Programme walkthrough", "Meet the board", "Open Q&A"],
    art: "/art/hands-together.svg",
  },
  {
    slug: "claude-code-101",
    title: "Claude & Claude Code 101: Getting Started",
    kind: "Workshop",
    phase: 1,
    status: "past",
    start: "2026-10-09",
    time: "4:00 – 6:00 pm",
    venue: "Placeholder Lab 2, VIT Chennai",
    summary:
      "A first session for everyone: set up Claude and Claude Code, learn the basics and finish with a first small project.",
    description: [
      "Whatever your background, this session got every attendee set up with Claude and Claude Code and through a first small project of their own.",
      "Slides and the starter repository from the session are kept in the member archive.",
    ],
    highlights: ["Account and tool setup", "First prompts that work", "A first small project"],
    art: "/art/code-window.svg",
  },
  {
    slug: "claude-academy-sprint",
    title: "Claude Academy Sprint",
    kind: "Lab sprint",
    phase: 1,
    status: "active",
    start: "2026-10-14",
    end: "2026-11-06",
    time: "Rolling, with two guided labs a week",
    venue: "Placeholder Lab 2 + online",
    summary:
      "Guided lab time to work through Anthropic Academy courses together, with help on hand, and come out with certificates.",
    description: [
      "Pick a track, book a lab slot and work through the course with board members and mentors close by. The sprint runs for three weeks and applications stay open while it does.",
      "You will need a laptop and a Claude account; we can help you set one up on the day.",
    ],
    highlights: [
      "Track A: AI Fluency fundamentals",
      "Track B: Claude.ai for daily work",
      "Free certificates on completion",
    ],
    art: "/art/book.svg",
    applyUrl: "#placeholder-apply-academy-sprint",
    seats: "Open to all members",
    hub: [
      {
        id: "h1",
        kind: "announcement",
        title: "Sprint is live — start with Track A",
        body: "If you are new, begin with AI Fluency. Lab slots are on the schedule below; bring a charged laptop.",
        postedBy: "Events lead (placeholder)",
        postedAt: "2026-10-14",
      },
      {
        id: "h2",
        kind: "link",
        title: "Anthropic Academy course list",
        body: "The courses we are working through. Certificates are free.",
        href: "#placeholder-academy-courses",
        postedBy: "Chairperson (placeholder)",
        postedAt: "2026-10-14",
      },
      {
        id: "h3",
        kind: "schedule",
        title: "Lab slots: weeks 1 to 3",
        body: "Tue and Thu, 4:30 pm. Room details are posted here before each slot.",
        postedBy: "Secretary (placeholder)",
        postedAt: "2026-10-15",
      },
      {
        id: "h4",
        kind: "file",
        title: "Sprint checklist (PDF)",
        body: "Tick off modules as you go; show it to a board member for sign-off.",
        href: "#placeholder-checklist",
        postedBy: "Secretary (placeholder)",
        postedAt: "2026-10-15",
      },
    ],
  },
  {
    slug: "prompt-engineering-workshop",
    title: "Prompt Engineering Workshop",
    kind: "Workshop",
    phase: 1,
    status: "upcoming",
    start: "2026-11-20",
    time: "4:00 – 6:00 pm",
    venue: "Placeholder Hall, VIT Chennai",
    summary:
      "How to brief Claude well: giving context, setting constraints, showing examples and iterating instead of starting over.",
    description: [
      "A practical session on writing briefs that get dependable results. We take real tasks from the room and improve the prompts live.",
    ],
    highlights: ["Context and constraints", "Examples that steer", "Iterating on output"],
    art: "/art/pointer.svg",
    applyUrl: "#placeholder-apply-prompt-workshop",
    seats: "60 seats (placeholder)",
    hub: [
      {
        id: "h1",
        kind: "announcement",
        title: "Bring one real task",
        body: "An essay outline, a study plan, a bug. We will work on yours.",
        postedBy: "Events lead (placeholder)",
        postedAt: "2026-10-16",
      },
    ],
  },
  {
    slug: "build-night-ship-in-a-weekend",
    title: "Build Night: Ship in a Weekend",
    kind: "Build night",
    phase: 2,
    status: "upcoming",
    start: "2027-01-23",
    end: "2027-01-24",
    time: "Saturday 10 am to Sunday 5 pm",
    venue: "Placeholder Innovation Lab",
    summary:
      "Teams take an idea from nothing to a working, shareable project over a weekend, using everything from Phase 1.",
    description: [
      "Form a mixed-department team, pick an idea and ship it. Board members and mentors float between teams. Projects are shown at the end of the weekend.",
    ],
    highlights: ["Mixed-department teams", "Mentors on the floor", "Show-and-tell finish"],
    art: "/art/steps.svg",
    applyUrl: "#placeholder-apply-build-night",
    seats: "Teams of 3 to 4 (placeholder)",
    hub: [],
  },
  {
    slug: "claude-code-for-developers",
    title: "Claude Code for Developers",
    kind: "Workshop",
    phase: 2,
    status: "upcoming",
    start: "2027-02-06",
    time: "4:00 – 6:00 pm",
    venue: "Placeholder Lab 2, VIT Chennai",
    summary:
      "A deeper session for members who write code: larger codebases, planning before editing and reliable Claude Code workflows.",
    description: ["For members who already write code and want to work with Claude on real repositories."],
    highlights: ["Planning before editing", "Working in large codebases", "Reliable workflows"],
    art: "/art/code-window.svg",
    applyUrl: "#placeholder-apply-cc-dev",
    seats: "40 seats (placeholder)",
    hub: [],
  },
  {
    slug: "claude-for-research-and-writing",
    title: "Claude for Research & Writing",
    kind: "Workshop",
    phase: 2,
    status: "upcoming",
    start: "2027-02-20",
    time: "4:00 – 6:00 pm",
    venue: "Placeholder Hall, VIT Chennai",
    summary:
      "Using Claude to read faster, organise sources, draft and revise, while keeping the thinking and judgement your own.",
    description: ["Aimed at every major. Bring a paper, a reading list or a draft you are stuck on."],
    highlights: ["Reading and summarising", "Organising sources", "Drafting and revising"],
    art: "/art/writing.svg",
    applyUrl: "#placeholder-apply-research",
    seats: "60 seats (placeholder)",
    hub: [],
  },
  {
    slug: "mcp-agentic-workflows",
    title: "MCP + Agentic Workflows",
    kind: "Workshop",
    phase: 3,
    status: "upcoming",
    start: "2027-03-06",
    time: "4:00 – 6:00 pm",
    venue: "Placeholder Lab 2, VIT Chennai",
    summary:
      "Connect Claude to tools and data with the Model Context Protocol, and design workflows where Claude carries a task through several steps.",
    description: ["Hands-on: wire up an MCP server and build a small multi-step agent."],
    highlights: ["Model Context Protocol", "Multi-step workflows", "A small working agent"],
    art: "/art/network.svg",
    applyUrl: "#placeholder-apply-mcp",
    seats: "40 seats (placeholder)",
    hub: [],
  },
  {
    slug: "flagship-hackathon",
    title: "Flagship Hackathon",
    kind: "Flagship",
    phase: 3,
    status: "upcoming",
    start: "2027-03-20",
    end: "2027-03-21",
    time: "Saturday 9 am to Sunday 4 pm",
    venue: "Placeholder Main Auditorium",
    summary:
      "The club’s biggest event of the year, open to every student on campus. Teams build with Claude and present what they made.",
    description: [
      "Open to all students, members or not. Teams build with Claude over a weekend and present to a panel on Sunday.",
    ],
    highlights: ["Open to the whole campus", "Panel judging", "Prizes (placeholder)"],
    art: "/art/party.svg",
    applyUrl: "#placeholder-apply-hackathon",
    seats: "Teams of up to 4",
    hub: [],
  },
  {
    slug: "portfolio-and-interview-prep",
    title: "Portfolio & Interview Prep",
    kind: "Workshop",
    phase: 4,
    status: "upcoming",
    start: "2027-04-03",
    time: "4:00 – 6:00 pm",
    venue: "Placeholder Hall, VIT Chennai",
    summary:
      "Turn the year’s projects into resume entries and portfolio pieces, and practise talking about them in mock interviews.",
    description: ["Bring your best project. We help you frame it, then run mock interviews."],
    highlights: ["Resume entries", "Portfolio pieces", "Mock interviews"],
    art: "/art/steps.svg",
    applyUrl: "#placeholder-apply-portfolio",
    seats: "60 seats (placeholder)",
    hub: [],
  },
  {
    slug: "project-demo-day",
    title: "Project Demo Day",
    kind: "Showcase",
    phase: 4,
    status: "upcoming",
    start: "2027-04-17",
    time: "3:00 – 6:00 pm",
    venue: "Placeholder Main Auditorium",
    summary:
      "The year ends with members demonstrating their best work to the campus. The club is then handed over to the next team.",
    description: ["Members demo their best project of the year. The audience is open to the campus."],
    highlights: ["Live demos", "Campus audience", "Handover to the next team"],
    art: "/art/hands-together.svg",
    applyUrl: "#placeholder-apply-demo-day",
    seats: "Open attendance",
    hub: [],
  },
];

export const bySlug = (slug: string) => events.find((e) => e.slug === slug);
export const isOpen = (e: ClubEvent) => e.status !== "past";
export const openEvents = () =>
  events.filter(isOpen).sort((a, b) => a.start.localeCompare(b.start));
export const pastEvents = () =>
  events.filter((e) => e.status === "past").sort((a, b) => b.start.localeCompare(a.start));
export const featured = () =>
  events.find((e) => e.status === "active") ?? openEvents()[0];

const fmt = (d: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o }).format(new Date(d + "T00:00:00Z"));

export const dateLabel = (e: ClubEvent) => {
  const s = fmt(e.start, { day: "numeric", month: "short", year: "numeric" });
  if (!e.end) return s;
  const a = fmt(e.start, { day: "numeric", month: "short" });
  const b = fmt(e.end, { day: "numeric", month: "short", year: "numeric" });
  return `${a} – ${b}`;
};
export const shortDate = (d: string) => fmt(d, { day: "numeric", month: "short" });
