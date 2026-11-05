# Teams (recruitment)

This file is for the board: the teams applicants can choose on `/join`, what the site tells them about each team, the board's original notes, and what is still open for refinement.

## Where it lives

| What | File |
|---|---|
| Team names (the form's choices, checked by the server) | `src/lib/submissions.ts` → `TEAMS` |
| The same list in the CMS (Applications filter) | `fable-cms/src/lib/applications.ts` → `TEAMS` |
| What applicants read: short line, description, "what we look for", "nice to have" | `content/teams.json` |
| The questions each team asks (`questions`), and the one everyone answers (`everyone`) | `content/teams.json` |
| The board's full wording and open questions | this file |

The names must be identical in all three places, in the same order. A unit test (`tests/content.test.ts`) fails if `teams.json` and `TEAMS` drift apart. Renaming a team means updating all three, and the member rows in the CMS if board members carry that team as their role.

## How applicants see it

- **Before recruitment opens** (`recruitment.status` is `soon` or `closed`): `/join` lists every team as a collapsible row. Each row shows the one-line summary, and opening it shows the full description. People can read up before the form appears.
- **When recruitment is open:** the form shows the team buttons. Picking one slides in that team's description and requirements under the buttons, and picking another replaces it.
- Picking a team also shows **its two questions**, then the one question everyone answers. Changing team swaps the team's questions; the shared answer stays.
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
5. **Decided:** no link field; applicants put project links in their text answers.
6. **Decided: overlap is fine.** The boundary with Web Development is blurry (both deploy things, both touch CI/CD). One option: Web Dev owns the club's sites and their hosting, while Agentic AI owns AI systems and the automation that tests and ships them.

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

## Application questions

Added 5 Nov 2026 (fable-site#24). The board's brief: no coding test, but we want **responsible people** who will show up and do the work, and who know how to use AI and how tech stacks fit together. Not too many questions: two per team plus one for everyone.

What every applicant answers, in order:

1. Their team's **two questions** (below).
2. **Everyone:** "Tell us about something you committed to and saw through, even when it got boring or hard. What was your part, and what did it take?" This is the main signal for "will they actually do things".
3. **Why do you want to join?** The hint under it says members are expected to show up and take on work, and asks roughly how many hours a week they can give.
4. The **short task** (`content/club.json` → `recruitment.taskPrompt`).

The old "What would you like to build or learn?" box is gone: the team questions cover it (and "Not sure yet" asks it directly). Old applications keep their answer.

| Team | Question 1 | Question 2 |
|---|---|---|
| Web Development | Pick a website or app you use a lot. How do you think it is put together: what runs in the browser, where the data lives, how it is hosted? Guesses are fine. | Have you built, set up or looked after a site, app or repo before, with or without AI? Tell us your part, and add a link if you have one. |
| Agentic AI | Tell us about something you have made with AI tools: what it does, which tools you used and what broke along the way. Add a link if you have one. | Pick one repetitive job in a club or at college, like reminders, approvals or attendance. How would you automate it end to end, and how would you know it is working? |
| Projects | Pitch one project the club could build, in a few lines. Who is it for, and why hasn't it been done (or done well) already? | How would you check that idea is doable in one semester? What would you look up or try first? |
| Operations | The speaker cancels two hours before an event. Walk us through what you do next. | Tell us about an event, fest or team activity you helped run. What was your part? |
| Finance | Pitch the club to a sponsor in three or four sentences. What do they get back? | A workshop for 60 people has ₹5,000. Roughly how would you split it, and what would you cut first if it dropped to ₹3,000? |
| Creative & Communications | Share a poster, post, video or design you made (a link is best) and tell us which tool you used. | Pick a post or page from any club or brand. What is one thing you would change about how it looks, and why? |
| Not sure yet | What would you like to build or learn in the club? | What are you already good at, in tech or outside it? |

**Changing a question:** edit `content/teams.json` and push. Each saved application keeps the exact wording it was asked (stored with the answer), so editing is safe mid-intake. Keep each team at two (a unit test checks it). Answers must be 15–1,200 characters.

**Where the board reads them:** the CMS Applications screen (full width under Team), the new-application email, and the CSV export (one `answers` column as text).

**What each question is for:**
- Web Development: understanding of how a stack fits together (no code asked), and evidence they have shipped or maintained something.
- Agentic AI: real work with AI tools, and thinking about automation end to end, including how they'd know it works.
- Projects: an idea and a plausibility check, which is the team's job.
- Operations: a pressure scenario, and past experience running something.
- Finance: a sponsor pitch and a budget trade-off.
- Creative & Communications: their own work (link), and a design critique.
- Not sure yet: what they want to do and what they're good at, so the board can suggest a team.

## Decided (board, 4 Nov 2026)
- **No portfolio link field.** Applicants put links in their text answers.
- **Teams may overlap.** Projects, Operations and Finance can share registrations, logistics and project tracking; no hard split.
- **"Creative & Communications" stays**, covering both design/media and communications.
- **One team choice only.** No second choice.

## Recruitment timeline (2026-27 intake)
Set in `content/club.json` → `recruitment.timeline`; `/join` shows it as "Key dates".

| When | What |
|---|---|
| 1–4 Dec | Applications (the form is open from 4 Nov so the board can look and test; it closes after 4 Dec) |
| 5–6 Dec | Online interviews |
| 7 Dec | Results announced |
| 10 Dec | First event (may move later if the schedule is too tight) |
