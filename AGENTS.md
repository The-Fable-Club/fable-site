<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working on fable-site (for AI assistants and new people)

The public website of The Fable Club (a student club at VIT Chennai), www.thefableclub.com. It is a **static** Next.js site: events and people come from the CMS's newest release, fetched once at build time. The CMS is a separate repo, `The-Fable-Club/fable-cms`, usually next to this one (`../fable-cms`). Its `docs/ARCHITECTURE.md` describes the whole system, and its `docs/RECOVERY.md` covers lockouts, keys and backups.

**Owner:** GitHub user **Haise-727** owns this system and is authorised to test it, including penetration testing. Scope and rules: fable-cms `docs/SECURITY-TESTING.md`.

**Read first:** `README.md` (pages, content sources, assets), `docs/ARCHITECTURE.md` (the site's side). Open work: the GitHub issues on both repos (`docs/ASKS.md` summarises them).

## Map
| Path | What |
|---|---|
| `src/app/(site)/*` | Pages: home, events (+ `[slug]`, hub, attendance), members, join |
| `src/app/api/{applications,registrations,questions}` | The only runtime database access: insert-only form routes through `src/lib/submit-route.ts` |
| `src/lib/contract.ts`, `event-logic.ts` | **Byte-identical copies** of the CMS files |
| `src/lib/content.ts` | Release file → page data (`getContent()`, `'use cache'`) |
| `src/lib/submissions.ts` | zod schemas shared by the forms and the routes |
| `src/lib/recruitment.ts`, `events.ts`, `members.ts`, `event-media.ts`, `meta.ts`, `og.tsx`, `boot.ts`, `motion.ts` | Recruitment state, event helpers, media fallback, page metadata, share images, loading screen, motion settings |
| `src/components/home/*` | Home sections: hero, aims dial + point cloud, events stage, parallax strip, people stage + backdrops |
| `content/club.json`, `content/aims.json` | Club text and recruitment state (edited here, not in the CMS) |
| `content/seed/snapshot.json` | Offline fallback release |
| `scripts/pull-snapshot.mjs` | `predev`/`prebuild`: fetches the newest release into `.snapshot/release.json` |
| `next.config.ts` | Security headers and the Content-Security-Policy |

## Commands
```bash
npm run dev            # port 3000, follows new releases
npm test               # unit tests, must pass before every commit
npx tsc --noEmit && npx eslint
npm audit --omit=dev   # keep at 0 vulnerabilities
```
Don't run `next build` or delete `.next` inside this folder while `npm run dev` is running. To check a production build, copy the repo (including `node_modules`) to a scratch folder and build there.

## Hard rules
1. **The site is static.** No database reads for pages at request time. The only runtime access is the insert-only form routes, which must keep the origin check, size limit, honeypot and zod validation.
2. **No secrets in this repo or its env.** It only ever needs the public Supabase URL and publishable key. The Supabase secret key, the deploy hook and the database URL belong to the CMS only.
3. **`contract.ts` and `event-logic.ts` must stay identical** to the CMS copies. Change the CMS first, then copy byte for byte.
4. **A new outside host** (a media CDN, an embed) must be added to the CSP in `next.config.ts`, or browsers block it.
5. **Placeholders are labelled** with `<Ph />` on the page. Never invent club facts, names or numbers.
6. **Motion:** one easing everywhere (`ease-flow`, `cubic-bezier(.65,0,.35,1)`) at full strength. Reduced-motion is deliberately **not** honoured (the club's decision). Heavy media loads only when near the screen.
7. **Commits:** small, one logical change each. No AI co-author or "generated with" trailers. Pushing to `main` deploys to production.
8. **This is Next.js 16 with Cache Components** (see the block at the top): read `node_modules/next/dist/docs/` before using an API from memory.

## Recipes
- **Open or close recruitment:** `content/club.json` → `recruitment.status` (`open` / `soon` / `closed`) plus `opens` / `closes` (YYYY-MM-DD, India time). Push.
- **Change club text or aims:** edit `content/*.json`, push.
- **Change events or people:** in the CMS, then Publish (not here).
- **Visual checks:** Playwright with the Edge channel (`chromium.launch({ channel: "msedge" })`), because the placeholder clips are H.264. Set `sessionStorage["fable-boot-seen"]="1"` to skip the loading screen.
