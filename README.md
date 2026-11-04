# The Fable Club: website

The public site for The Fable Club, a Claude learning club at VIT Chennai: **www.thefableclub.com**.
Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · shadcn/ui (base-nova) · motion.

The site is **static**. Events and people are managed in a separate CMS ([The-Fable-Club/fable-cms](https://github.com/The-Fable-Club/fable-cms)); when an editor presses Publish, Vercel rebuilds this site once from the newest release. Visitors never read the database while browsing. The only live database access is three small form routes (applications, event registrations, questions).

Full picture, data flows, security and status: **[fable-cms/docs/ARCHITECTURE.md](https://github.com/The-Fable-Club/fable-cms/blob/main/docs/ARCHITECTURE.md)**. The site's side: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Code map, rules and recipes (also what AI assistants read): [AGENTS.md](AGENTS.md). Locked out, lost a key or lost data: **[fable-cms/docs/RECOVERY.md](https://github.com/The-Fable-Club/fable-cms/blob/main/docs/RECOVERY.md)**.

```bash
npm install
cp .env.example .env.local  # two public values: the Supabase URL and publishable key
npm run dev                  # http://localhost:3000, follows new releases automatically
npm run build && npm start
npm test                     # unit tests
```

`npm run dev` and `npm run build` first fetch the newest release (`scripts/pull-snapshot.mjs`). On Vercel a failed fetch fails the build (the old site stays up); locally it falls back to `content/seed/snapshot.json`.

## Pages

| Route | What |
|---|---|
| `/` | Landing: hero (with "Live now" / "Registrations open" announcements), about and aims, events carousel and timeline, people, join |
| `/events` | Current and upcoming, the full timeline (undecided dates are marked or listed underneath), event history |
| `/events/[slug]` | Event details, **Register on EventHub** (official VIT registration), our own on-spot form, the FAQ and an ask-a-question box |
| `/e/[slug]` | Poster short link: redirects to the event page |
| `/events/[slug]/attendance` | Attendance page: **layout only**, disabled and not linked until the backend exists |
| `/events/[slug]/hub` | Participant hub (links and announcements from the organisers). Public to anyone with the link. |
| `/members` | Faculty, board, leads and members; click a card for the bio. Deep link: `/members?m=<slug>` |
| `/join` | Recruitment form: saves to the database, with an email draft as a fallback |
| `/api/applications`, `/api/registrations`, `/api/questions` | The form routes (validation, honeypot, origin check, insert only) |

## Where content comes from

| Content | Source |
|---|---|
| Events, hub posts, faculty, board, leads, members | The CMS release (`.snapshot/release.json`, fetched at build time, validated against `src/lib/contract.ts`) |
| Club text, contact, socials and the five aims | `content/club.json`, `content/aims.json` (edit and push) |
| Recruitment (open / opening soon / closed, intake, optional opening and closing days, the short task) | `content/club.json` → `recruitment`. Dated changes apply by themselves within the hour; the form route checks on every submission. Needs CMS migration 0008. |
| Offline fallback | `content/seed/snapshot.json` (refreshed by the CMS seed script) |

Event status (Live / Open / Past) is derived from the dates (`src/lib/event-logic.ts`) and refreshes within the hour without a rebuild. Many details can be undecided in the CMS (date, time, venue, seats, registration); the site shows "to be announced" and the right button state.

`src/lib/contract.ts` and `src/lib/event-logic.ts` are **copies** of the CMS files: change both repos together.

## Still placeholder

Copy and bios are placeholder text (marked with `<Ph />` on the page), board emails are placeholders, member photos and event pictures/loops come from the CMS (ImageKit) once uploaded, and until then the Events stage uses generated clips, and the 3D models in "What we're for" are procedural stand-ins. Open work is tracked in the [GitHub issues](https://github.com/The-Fable-Club/fable-site/issues); the summary is in [docs/ASKS.md](docs/ASKS.md).

## Link previews, headers, SEO

- Share images are generated at build time: `app/opengraph-image.tsx` (the site) and `app/(site)/events/[slug]/opengraph-image.tsx` (one per event), with shared bits in `lib/og.tsx`. Page titles and descriptions go through `pageMeta()` in `lib/meta.ts`.
- `app/sitemap.ts` and `app/robots.ts` list the public pages (hub and attendance pages stay out).
- Security headers and the Content-Security-Policy are in `next.config.ts`. A new outside host (an embed, a media CDN) must be added there or the browser blocks it.

## Assets

- Fonts: Anthropic Sans / Serif / Mono in `src/fonts` (`next/font/local`). Pages load the `.woff2` copies; the `.otf` originals are only read by the share-image renderer.
- Illustrations: `public/art/*.svg`. Brand images: `public/logo-*.jpg`, `public/banner-*.jpg`.
- `_reference/` (gitignored): prototype, font archives, Endfield notes.

## Interaction notes

- Left rail: icons until hovered or focused, then labels; on `/` it follows the section being scrolled. Right-edge section index.
- "What we're for": canvas point-cloud viewer (`components/home/point-cloud.tsx`); drag to orbit. Swap the generators for real models later.
- Events: on `/` a full-bleed media stage after Endfield's (the next backdrop wipes in with a clay bar on its edge, a side tab rolls the event kind; media loads only when near the screen); on `/events` the path-style carousel; both with the continuous, draggable timeline. A giant wordmark strip slides with scroll between About and Events. All motion uses one easing, `ease-flow` (`cubic-bezier(.65,0,.35,1)`), at full strength (reduced motion is deliberately not honoured).
