// PLACEHOLDER CONTENT — names/roles follow the TFC prototype's board list;
// bios, contacts, years and departments are samples to be replaced.

export type Member = {
  slug: string;
  name: string;
  role: string;
  group: "Faculty" | "Board" | "Leads";
  department: string;
  year?: string;
  bio: string;
  focus: string[];
  email: string;
  linkedin?: string;
  github?: string;
  art: string;
};

export const members: Member[] = [
  {
    slug: "omana-j",
    name: "Dr. Omana J",
    role: "Faculty Coordinator",
    group: "Faculty",
    department: "VIT Chennai",
    bio: "Placeholder bio. Guides the club on behalf of the Office of Students’ Welfare and is the first point of contact for membership and approvals.",
    focus: ["Mentorship", "Approvals"],
    email: "omana.j@vit.ac.in",
    art: "/art/book.svg",
  },
  {
    slug: "jeipratha-p-n",
    name: "Dr. Jeipratha P N",
    role: "Faculty Coordinator",
    group: "Faculty",
    department: "VIT Chennai",
    bio: "Placeholder bio. Supports the club’s programme and works with the board on events that involve the wider campus.",
    focus: ["Mentorship", "Campus events"],
    email: "jeiprathap.n@vit.ac.in",
    art: "/art/hands-together.svg",
  },
  {
    slug: "swatish-subramanian",
    name: "Swatish Subramanian",
    role: "Chairperson",
    group: "Board",
    department: "Placeholder department",
    year: "Placeholder year",
    bio: "Placeholder bio. Sets the club’s direction for the year and chairs the board. Ask about partnerships, the flagship hackathon or starting something new.",
    focus: ["Direction", "Partnerships", "Hackathon"],
    email: "chair@thefableclub.example",
    linkedin: "#",
    github: "#",
    art: "/art/steps.svg",
  },
  {
    slug: "sharann-m",
    name: "Sharann M",
    role: "Vice Chairperson",
    group: "Board",
    department: "Placeholder department",
    year: "Placeholder year",
    bio: "Placeholder bio. Works across every programme track and steps in wherever the chairperson cannot. Ask about the build sessions.",
    focus: ["Build sessions", "Operations"],
    email: "vice@thefableclub.example",
    linkedin: "#",
    github: "#",
    art: "/art/code-window.svg",
  },
  {
    slug: "dhriti-vaz",
    name: "Dhriti Vaz",
    role: "Secretary",
    group: "Board",
    department: "Placeholder department",
    year: "Placeholder year",
    bio: "Placeholder bio. Keeps schedules, records and the member list. Write to the secretary for attendance questions or event logistics.",
    focus: ["Schedules", "Records"],
    email: "secretary@thefableclub.example",
    linkedin: "#",
    art: "/art/writing.svg",
  },
  {
    slug: "shree-devi-s",
    name: "Shree Devi S",
    role: "Co-Secretary",
    group: "Board",
    department: "Placeholder department",
    year: "Placeholder year",
    bio: "Placeholder bio. Supports the secretary with communications and keeps participants updated before and after events.",
    focus: ["Communications", "Participants"],
    email: "cosecretary@thefableclub.example",
    linkedin: "#",
    art: "/art/pointer.svg",
  },
  {
    slug: "tech-lead",
    name: "Member Name",
    role: "Technical Lead",
    group: "Leads",
    department: "Placeholder department",
    year: "Placeholder year",
    bio: "Placeholder bio. Runs the Claude Code and agents tracks and mentors teams during build nights.",
    focus: ["Claude Code", "Agents & MCP"],
    email: "tech@thefableclub.example",
    github: "#",
    art: "/art/network.svg",
  },
  {
    slug: "design-lead",
    name: "Member Name",
    role: "Design Lead",
    group: "Leads",
    department: "Placeholder department",
    year: "Placeholder year",
    bio: "Placeholder bio. Owns the club’s look, posters and this website.",
    focus: ["Brand", "Web"],
    email: "design@thefableclub.example",
    linkedin: "#",
    art: "/art/sprouts.svg",
  },
  {
    slug: "events-lead",
    name: "Member Name",
    role: "Events Lead",
    group: "Leads",
    department: "Placeholder department",
    year: "Placeholder year",
    bio: "Placeholder bio. Plans venues, logistics and the participant hub for every event.",
    focus: ["Logistics", "Participant hub"],
    email: "events@thefableclub.example",
    linkedin: "#",
    art: "/art/party.svg",
  },
  {
    slug: "outreach-lead",
    name: "Member Name",
    role: "Outreach Lead",
    group: "Leads",
    department: "Placeholder department",
    year: "Placeholder year",
    bio: "Placeholder bio. Brings new departments into the club and handles campus communications.",
    focus: ["Outreach", "Campus"],
    email: "outreach@thefableclub.example",
    linkedin: "#",
    art: "/art/search.svg",
  },
];

export const initials = (name: string) =>
  name
    .replace(/^Dr\.\s*/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
