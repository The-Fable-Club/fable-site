// PLACEHOLDER CONTENT — adapted from the TFC prototype in _reference/TFC-Web.
// Replace with final copy; every page that renders this shows a "placeholder" marker.

export const club = {
  name: "The Fable Club",
  short: "TFC",
  tagline: "Learn Claude thoroughly. Then build with it.",
  institution: "VIT Chennai",
  office: "Office of Students’ Welfare",
  description:
    "The Fable Club is a student-led AI learning and building community at VIT Chennai. We help students from every department get reliably good work out of Claude, from writing, research and studying to Claude Code and building agents.",
  disclaimer:
    "An independent student club. Not affiliated with or endorsed by Anthropic.",
  contactEmail: "hello@thefableclub.example",
  socials: [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "GitHub", href: "#" },
  ],
} as const;

export const stats = [
  { label: "Build sessions", value: "2 hrs", note: "Every other week, hands-on." },
  { label: "Events this year", value: "10", note: "Workshops, a hackathon, a demo day." },
  { label: "Phases", value: "4", note: "Foundations to outcomes." },
  { label: "Open to", value: "All", note: "Every department. No prior experience." },
] as const;

export const aims = [
  {
    title: "Teach Claude for everything",
    body: "Writing, research, studying, coding and everyday problem-solving: the whole range of work a student actually does, not one narrow use case.",
    art: "/art/writing.svg",
  },
  {
    title: "Deliver Anthropic’s own curriculum",
    body: "We work through Anthropic Academy together in guided labs: AI Fluency, Claude for daily work, Claude Code, and agents with MCP.",
    art: "/art/book.svg",
  },
  {
    title: "Run a structured build programme",
    body: "Biweekly hands-on sessions and ten events a year, so every member ships real, working projects instead of collecting notes.",
    art: "/art/code-window.svg",
  },
  {
    title: "Build a portfolio and a placement pipeline",
    body: "Club projects become resume lines, mock-interview material and, in time, internship and placement outcomes.",
    art: "/art/steps.svg",
  },
  {
    title: "Grow campus-wide visibility",
    body: "A flagship hackathon open to every student on campus, and a year-end demo day where members show what they built.",
    art: "/art/party.svg",
  },
] as const;

export const phases = [
  { n: 1, name: "Foundations", span: "Oct – Nov 2026" },
  { n: 2, name: "Building Skills", span: "Jan – Feb 2027" },
  { n: 3, name: "Advanced & Flagship", span: "Mar 2027" },
  { n: 4, name: "Outcomes & Handover", span: "Apr 2027" },
] as const;
