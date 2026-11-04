# Teams (recruitment)

This file is for the board: the teams applicants can choose on `/join`, what the site tells them about each team, the board's original notes, and what is still open for refinement.

## Where it lives

| What | File |
|---|---|
| Team names (the form's choices, checked by the server) | `src/lib/submissions.ts` → `TEAMS` |
| The same list in the CMS (Applications filter) | `fable-cms/src/lib/applications.ts` → `TEAMS` |
| What applicants read: short line, description, "what we look for", "nice to have" | `content/teams.json` |
| The board's full wording and open questions | this file |

The names must be identical in all three places, in the same order. A unit test (`tests/content.test.ts`) fails if `teams.json` and `TEAMS` drift apart. Renaming a team means updating all three, and the member rows in the CMS if board members carry that team as their role.

## How applicants see it

- **Before recruitment opens** (`recruitment.status` is `soon` or `closed`): `/join` lists every team as a collapsible row. Each row shows the one-line summary, and opening it shows the full description. People can read up before the form appears.
- **When recruitment is open:** the form shows the team buttons. Picking one slides in that team's description and requirements under the buttons, and picking another replaces it.
- An applicant picks **one** team. "Not sure yet" is always an option; the board suggests a team during the short chat.

To change any text, edit `content/teams.json`, then commit. The site rebuilds on push, so this is a code change, not a CMS publish.

## The teams

### Web Development
**On the site:** builds and runs the club's websites and apps.

**Board's notes (original):**
- Should be able to build and manage deployed websites/applications for the club.
- Should be able to plan and realize applications from the club's ideas.
- Maintain the club's GitHub repositories.
- No coding NECESSARY, but should be knowledgeable about tech stacks and the connections between them.
- Design software like Figma, or just being good at UI design, would be nice (artwork for the sites/apps).
- Security penetration testing and securing.

### Agentic AI
**On the site:** builds AI systems that act on their own, and the automation around them.

**Board's direction (Haise-727):** uses AI well, with good previous work. Needs to build automated AI systems, plus CI/CD and DevOps.

**Earlier draft (AI-generated, kept for reference, not used as is):**
> The Agentic AI department is all about taking AI beyond prompts and building systems that can actually think, act, and get things done. From AI agents to multi-agent workflows, we explore how to turn ideas into working applications. If you have prior experience, with a keen interest in: Vibe Coding, The Right Way (fast AI-assisted development with tools like Claude Code, paired with solid Python/TypeScript fundamentals); Agentic Engineering (AI agents with tool calling, memory, and frameworks like LangGraph); Multi-Agent Systems; RAG & Context Engineering; AI Development (build, test and deploy reliable AI apps).

**Why the site text differs from the draft, and suggestions:**
1. The draft read like a buzzword list ("think, act, and get things done") and asked for interest. The board wants *proven* ability, so the site text asks for work people can show.
2. It added what the draft lacked: automation, CI/CD and DevOps.
3. Kept "Python or TypeScript fundamentals, enough to debug what the AI writes". That is the honest version of "vibe coding, the right way".
4. Moved RAG, vector DBs and LangGraph to "nice to have": useful, but not a reason to turn someone away.
5. **Open question:** should applicants link to a project (GitHub, a demo, a short video)? The form has no link field today. Either add one or tell Agentic AI applicants to put the link in "What would you like to build or learn?". Adding a field means a small database change (the `applications` table) plus the form.
6. **Open question:** the boundary with Web Development is blurry (both deploy things, both touch CI/CD). One option: Web Dev owns the club's sites and their hosting, while Agentic AI owns AI systems and the automation that tests and ships them.

### Projects (formerly Technical)
**On the site:** the club's planners: ideas, research and project direction.

**Board's notes (original):** ideas brainstorming; should be able to check novelty and plausibility. All-round planners for the club.

**Suggestions:** this is the thinnest description. Worth deciding with the board: does Projects *own* the club's two member projects (scoping, timelines, checking progress), or only propose them? If it owns them, add "Keeping member projects on track" to what we look for. Also worth deciding: how it differs from Operations. Projects decides *what* we build; Operations decides *when and how* events run.

Renamed from **Technical** in November 2026. The site shows any member whose role still says "Technical" as "Projects" (`src/lib/content.ts`, `toMember`), so old rows look right even before they're edited in the CMS.

### Operations
**On the site:** plans and runs events, schedules and the logistics behind them.

**Board's notes (original):**
> Looking for proactive members interested in coordination, team management, and execution of operations.
> Skills / Responsibilities: planning and coordinating events, workshops, and club activities; managing timelines, schedules, and task allocation; coordinating with different teams and ensuring smooth communication; handling logistics, resources, and event requirements; managing registrations, attendance, and participant coordination; problem-solving and handling unexpected situations; maintaining documentation, reports, and operational records; ensuring tasks are completed efficiently and deadlines are met; ability to work collaboratively and take ownership of responsibilities; strong organisational, communication, and time-management skills.
> Note: applicants should have good organisational and communication skills, along with a proactive attitude and willingness to take responsibility. Prior experience in event management, team coordination, or handling operations is an added advantage.

**Suggestion:** the full list is long for a form. The site keeps six points; the rest are covered by "coordinating" and "problem solving".

### Finance
**On the site:** sponsors, budgets and the money side of events.

**Board's notes (original):** connecting with sponsors, cost handling, logistics (food and stuff), registrations for events.

**Suggestions:** registrations and logistics overlap with Operations. The site says Finance handles registrations *with* Operations; agree who owns what. Also consider whether Finance or Operations talks to VIT's Office of Students' Welfare about event budgets.

### Creative & Communications
**On the site:** design, posters, videos and the club's look online.

**Board's notes (original):**
> Looking for creative members interested in graphic design, visual content, and media creation.
> Skills / Tools: Canva or Photoshop or Illustrator; Figma for basic UI/design work; video editing using Premiere Pro or CapCut or DaVinci Resolve; basic knowledge of colour, typography, layouts, and composition; ability to create posters, social media creatives, or event content; basic photo/video editing skills; creativity and willingness to learn new tools.
> Note: applicants should have some hands-on experience with at least one design tool such as Canva, Photoshop, Illustrator, or Figma. Video editing experience is an added advantage.

**Suggestions:** the name says "Communications" but the notes only cover design and media. If this team also writes captions, runs Instagram or handles announcements, add that. Otherwise consider renaming it to "Creative". A portfolio link would help here too (see the open question under Agentic AI).

## Still to decide
- [ ] A portfolio or project link field on the form (Agentic AI, Creative, Web Dev would use it)
- [ ] Projects vs Operations vs Finance: who owns registrations, logistics, project tracking
- [ ] "Creative & Communications" or just "Creative"
- [ ] Whether applicants may pick a second choice
