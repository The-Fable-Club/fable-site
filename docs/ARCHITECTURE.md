# Site architecture

The whole system (CMS, database, deploy hook, data flows, security, tests) is described in the CMS repo: [docs/ARCHITECTURE.md](https://github.com/The-Fable-Club/fable-cms/blob/main/docs/ARCHITECTURE.md). This page is the site's side of it.

## How a page gets its data

1. `scripts/pull-snapshot.mjs` (the `predev` and `prebuild` step) fetches the newest release from the `public_release` view with the publishable key and writes `.snapshot/release.json`.
   - On Vercel or CI, a failed fetch or missing variables **fails the build**, so a bad release cannot replace a working site.
   - Locally, or when no release exists yet, it copies `content/seed/snapshot.json`.
2. `src/lib/content.ts` (`getContent()`, cached an hour with `'use cache'`) validates the file against `src/lib/contract.ts`, then maps it to page types: `toClubEvent()` (status from the dates, display strings for undecided details, registration state) and `toMember()`.
3. Pages render as static HTML. Nothing in a page reads the database at request time.

## Live routes

`/api/applications` and `/api/registrations` use `src/lib/submit-route.ts`: origin check, size limit, JSON only, honeypot, zod validation (`src/lib/submissions.ts`), then one insert with the publishable key. The database decides who may insert (see the CMS repo's migrations).

## Rules worth remembering

- Dates: exact, your own text, or to be announced. The last two can carry a hidden placeholder date that only positions the event on the timeline (never shown). An old "month only" mode still reads but is no longer offered. A non-exact date is never "Live".
- Registration state comes from the event's registration mode and status (`registrationState()`): open (our form or an outside link), soon, closed, none. Past events are always closed.
- Home announcements (`heroStrips()`): Live now, Registrations open (never the same event twice), otherwise Next up.
- An empty release still builds: no events, no people, empty states shown. `generateStaticParams` returns a placeholder slug that 404s.

## Files

`src/lib`: `contract.ts` and `event-logic.ts` (identical to the CMS copies), `content.ts`, `events.ts`, `members.ts`, `submissions.ts`, `submit-route.ts`. `src/app/(site)`: pages. `src/app/api`: the two form routes and a development-only release watcher. `scripts/pull-snapshot.mjs`. `tests/`: unit tests.
