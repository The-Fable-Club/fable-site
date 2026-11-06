# GEMINI.md — Project Guide for The Fable Club (Website)

## Project Overview

**fable-site** is the static, public-facing website for **The Fable Club** (a student-led Claude and agentic AI learning community at VIT Chennai, [www.thefableclub.com](https://www.thefableclub.com)).
Built with **Next.js 16 (App Router, Turbopack, Cache Components)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui (base-nova with @base-ui/react)**, and **Vitest**.

### Dual-Repo Ecosystem
- **`The-Fable-Club/fable-site`** (this repository): The public static frontend and form submission routes.
- **`The-Fable-Club/fable-cms`**: Admin CMS where club organizers edit events, member rosters, announcements, and review applications. When an editor clicks **Publish**, a Vercel deploy hook rebuilds this site from the published snapshot.

---

## Architecture & Data Flow

### 1. Static Content Generation (Read Path)
- **Zero browsing DB queries**: Visitors never query the database while browsing.
- **Snapshot fetching**: `scripts/pull-snapshot.mjs` runs before `next dev` (`predev`) and `next build` (`prebuild`):
  - Fetches the latest published release row from Supabase's `public_release` PostgREST view using the public anon key.
  - Writes the snapshot to `.snapshot/release.json` (gitignored).
  - On CI/Vercel: Fetch failure aborts the build (ensuring a broken release never deploys over a working site).
  - Locally / Offline: Falls back gracefully to `content/seed/snapshot.json`.
- **Validation & Transformation**:
  - `src/lib/content.ts` (`getContent()`) validates `.snapshot/release.json` against the Zod contract in `src/lib/contract.ts`.
  - Merges snapshot data with repo static files: `content/club.json` (recruitment status, socials, contact) and `content/aims.json` (five club aims).
  - Derived states (Live / Open / Past) are computed in Indian Standard Time (`Asia/Kolkata`) via `src/lib/event-logic.ts`.
  - Content is cached using Next.js 16 `"use cache"` with `cacheLife("hours")` and `cacheTag("content")`.

### 2. Live Form Submissions (Write Path)
Three API routes accept write-only submissions directly into Supabase:
- `POST /api/applications`: Membership applications (checked against `recruitment.state`).
- `POST /api/registrations`: On-site event signups.
- `POST /api/questions`: Attendee questions under an event (published as FAQs once answered in CMS).

All three routes route through `handleSubmission()` in `src/lib/submit-route.ts` & `src/lib/submissions.ts`:
1. **Request Guarding** (`guardRequest`): Rejects requests > 10 KB, non-JSON content-type, or mismatched `origin` vs `host` (CSRF prevention).
2. **State Check**: Rejects if recruitment/event is closed or not yet open.
3. **Honeypot**: Hidden `website` field. Bots filling this field receive silent `200 { ok: true }` with no DB write.
4. **Zod Validation**: Validates inputs with user-friendly error messages (e.g., student email ending in `@vitstudent.ac.in`, uppercase registration numbers like `25ABC1234`).
5. **Database Insert**: Inserts single row via PostgREST with `Prefer: return=minimal` using `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Supabase Row-Level Security (RLS) strictly permits insert-only for the anon role.
6. **Error Mapping**: PostgreSQL error codes mapped cleanly (e.g., `23505` duplicate key -> `409 Conflict`, `42501` -> `403 Closed`).

### 3. Local Development Auto-Refresh
- `src/app/api/dev/content-version/route.ts` runs only in `NODE_ENV === "development"`.
- `src/components/dev-content-refresh.tsx` polls this route. When edits occur in `content/` or a new release is published to Supabase, it automatically rewrites `.snapshot/release.json` and refreshes the browser without a server restart.

---

## Critical Rules & Invariants

1. **Contract Parity with CMS**:
   - `src/lib/contract.ts` and `src/lib/event-logic.ts` are **exact copies** of the corresponding files in `The-Fable-Club/fable-cms`.
   - Never modify these files unilaterally without making identical edits in the CMS repo and bumping `SCHEMA_VERSION` if breaking.
2. **Next.js 16 Breaking Conventions**:
   - Follow the Next.js 16 docs in `node_modules/next/dist/docs/`.
   - Heed deprecation notices and keep the generated agent comment block in `AGENTS.md` clean.
   - Use `"use cache"` and `cacheLife()` as configured in `next.config.ts` (`cacheComponents: true`, `partialPrefetching: true`).
3. **EventHub Target Guarding**:
   - Official university registration links must strictly target `https://eventhubcc.vit.ac.in`. Non-HTTPS or external hosts are rejected by both contract validation and `eventhubTarget()`.
4. **Timezone Rule**:
   - All event and recruitment timeline logic must be evaluated in `Asia/Kolkata` (IST) using `todayIST()` or `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" })`.
5. **Git Commit Policy**:
   - **NEVER** run `git commit` automatically unless the user explicitly requests it.
6. **Generated / Protected Files**:
   - Do NOT manually edit `.snapshot/release.json` (overwritten by `scripts/pull-snapshot.mjs`).
   - Do NOT edit `content/seed/snapshot.json` unless intentionally refreshing the offline fallback seed from CMS.

---

## Repository Map

```
fable-site/
├── content/
│   ├── aims.json                  # The 5 club aims and 3D model keys
│   ├── club.json                  # Club copy, highlights, contacts, socials, recruitment config
│   └── seed/snapshot.json         # Offline release fallback (generated by CMS seed)
├── docs/
│   ├── ARCHITECTURE.md            # Site architecture and data flow documentation
│   ├── CMS.md                     # Guide on how CMS edits reach this site
│   ├── ASKS.md                    # Open tasks and creative asks (3D viewer, media, copy)
│   └── PEOPLE-SECTION-PLAN.md     # Layout plan for member groups and backdrops
├── public/
│   ├── art/*.svg                  # Procedural SVG artwork and motifs
│   ├── banner-*.jpg, logo-*.jpg   # Brand assets
│   └── place-*.mp4, place-*.webp  # Video and photo placeholders for events
├── scripts/
│   ├── pull-snapshot.mjs          # Predev/prebuild release fetcher
│   └── make-placeholder-media.mjs # Utility to generate test placeholders
├── src/
│   ├── app/
│   │   ├── (site)/                # Public site route group wrapped in SiteChrome
│   │   │   ├── events/            # Events listing & timeline
│   │   │   │   └── [slug]/        # Event details, attendance placeholder, hub feed
│   │   │   ├── members/           # Faculty, Board, Leads, and Community roster
│   │   │   ├── join/              # Recruitment application form
│   │   │   └── page.tsx           # Homepage (Hero, About, Aims, Events, People, Join)
│   │   ├── api/
│   │   │   ├── applications/      # POST membership application
│   │   │   ├── registrations/     # POST event registration
│   │   │   ├── questions/         # POST event attendee question
│   │   │   └── dev/               # Development content watcher endpoint
│   │   ├── globals.css            # Tailwind v4 theme, design tokens, typography
│   │   └── layout.tsx             # Root layout loading local Anthropic fonts
│   ├── components/
│   │   ├── home/                  # Homepage-specific stages (Hero, AimsDial, EventsStage, PeopleStage, PointCloud)
│   │   ├── ui/                    # shadcn/ui components (@base-ui/react primitives)
│   │   ├── boot-screen.tsx        # Initial intro load animation
│   │   ├── site-chrome.tsx        # Outer wrapper: BootScreen, Rail, Footer, SkipLink
│   │   ├── timeline.tsx           # Continuous horizontal draggable event timeline
│   │   └── *-form.tsx             # Interactive client forms (join, register, ask)
│   ├── fonts/                     # Anthropic Sans, Serif, Display, and Mono (.otf)
│   ├── hooks/                     # Custom hooks (e.g. useActiveSection)
│   └── lib/
│       ├── boot.ts                # Loading screen calculation logic
│       ├── content.ts             # getContent() loader, cache config, and mappers
│       ├── contract.ts            # Zod schemas for CMS release snapshot (PARITY WITH CMS)
│       ├── event-logic.ts         # Pure date status math (PARITY WITH CMS)
│       ├── event-media.ts         # Media resolution for event stages & carousel
│       ├── events.ts              # Event querying helpers and EventHub security checks
│       ├── members.ts             # Member formatting and grouping helpers
│       ├── motion.ts              # Framer motion transition constants (ease-flow)
│       ├── recruitment.ts         # Recruitment window calculations (open/soon/closed)
│       ├── submissions.ts         # Form validation schemas, DB error mapping, insertRow()
│       ├── submit-route.ts        # Shared HTTP guard and execution handler for form endpoints
│       └── utils.ts               # clsx and tailwind-merge helper (cn)
└── tests/                         # Vitest unit tests (boot, content, eventhub, recruitment, submissions)
```

---

## Design System & Tokens

Defined in `src/app/globals.css`:
- **Palette**: Paper/Ink aesthetic (`--color-paper: #faf9f5`, `--color-ink: #141413`, `--color-clay: #d97757`, `--color-manilla: #ebdbbc`).
- **Typography**: Anthropic type family (`sans`, `serif`, `display`, `mono`) resolved locally via `next/font/local` in `src/app/layout.tsx`.
- **Layout & Motion**: Endfield-style fixed left navigation rail, full-height stages, sharp corners, and a single easing curve: `cubic-bezier(.65, 0, .35, 1)` (`ease-flow`).

---

## Verification & Workflow Commands

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run a specific test file
npx vitest run tests/submissions.test.ts

# Run linter
npm run lint

# Run full production build (fetches snapshot first)
npm run build

# Start local development (with live CMS release tracking)
npm run dev
```

---

## Environment Variables

Only two public variables are required (stored in `.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... (or legacy anon public key)
```
*Note: If these variables are omitted, local development seamlessly uses `content/seed/snapshot.json`, though API form submissions will return 503.*
