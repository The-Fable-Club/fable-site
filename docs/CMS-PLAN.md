# CMS plan: Supabase + Publish button (no repo access)

Status: **plan only, nothing built.** Needs your OK on the decisions in section 12.

## 1. What you asked for
- Editors never need GitHub / repo access.
- Content (events, members, club text, anything else) lives in **Supabase**.
- A **Publish** button triggers **one** Vercel redeploy, which re-reads the database once.
- The live site is **static**: visitors do not hit the database per page load. Only media comes through an API/CDN.
- Secure.

## 2. How it works

```
  Editors                    Supabase                         Vercel
 ┌──────────┐  save draft  ┌──────────────────┐
 │ /admin   │─────────────▶│ working tables   │   (events, members, club…)
 │ (login)  │              │  + media bucket  │
 └────┬─────┘              └──────────────────┘
      │ [Publish]  (server action, checks login + role)
      ▼
 1. validate everything          ┌──────────────────┐
 2. build ONE snapshot (JSON) ──▶│ releases table   │ (immutable, numbered)
 3. POST the deploy hook ───────────────────────────▶ Vercel build starts
                                                       │ prebuild: fetch latest release (1 query)
                                                       │ write content/*.json
                                                       ▼
                                                  static pages on the CDN
 Visitors ──▶ Vercel CDN (HTML)   +   Supabase Storage CDN (images only)
```

**Why a snapshot per publish instead of reading the tables at build time**
- A publish is atomic: the site never builds from half-finished edits.
- Drafts stay private; the snapshot contains only what should be public.
- Rollback is trivial: re-publish an older release.
- The build needs one read, and (because the snapshot holds only public data) can use the public anon key with a read-only policy, so **no service key is needed at build time**.
- The existing site code barely changes: the build writes the same `content/*.json` shape the site already reads.

## 3. Data model (Postgres, sketch)

| Table | Purpose | Key columns |
|---|---|---|
| `club_settings` (1 row) | Tagline, about text, contact, socials, stats, phases | `data jsonb`, `updated_at` |
| `aims` | The five aims | `position`, `title`, `body`, `model` |
| `events` | Events | `slug`, `title`, `kind`, `phase`, `start_date`, `end_date`, `time`, `venue`, `summary`, `description`, `highlights text[]`, `art`, `photo_path`, `apply_url`, `seats`, `status_override`, `archived` |
| `members` | People | `slug`, `name`, `role`, `category` (portfolio), `group`, `position`, `department`, `year`, `bio`, `focus text[]`, `email`, `linkedin`, `github`, `art`, `photo_path`, `archived` |
| `media` | Uploaded images | `path`, `width`, `height`, `alt`, `uploaded_by` |
| `releases` | One row per Publish | `id` (serial), `snapshot jsonb`, `published_by`, `published_at`, `note`, `deploy_state` |
| `admins` | Who may edit | `email`, `role` (`owner` / `editor`) |
| `audit_log` | Who changed what | `actor`, `table`, `row_id`, `action`, `at` |

Every editable table also has `updated_at`. "Unpublished changes" = any `updated_at` newer than the last release.

Not content, handled separately (see decision 2): participant-hub posts, join-form applications.

## 4. Security
- **Login:** Supabase Auth with Google (the club Gmail / board Gmail accounts). Only emails in `admins` get in; everyone else is signed out.
- **Writes:** only through server-side actions that check the session email against `admins` first. RLS on every table as a second lock (`is_admin()` function); the public role has **no** access to working tables.
- **Public read:** only the latest row of `releases` (a view exposing `snapshot` only), so a leaked anon key can't read drafts, emails of admins, or the audit log.
- **Secrets:** service-role key and the Vercel deploy-hook URL live only in Vercel / `.env.local`, never in client code, never in chat.
- **Publish safety:** role check, validation with a shared schema (zod), rate limit (e.g. one publish per minute), audit entry, deploy-hook URL not exposed to the browser.
- **Media:** public-read bucket, write only for admins via short-lived signed upload URLs; type/size checks (images, ≤ 5 MB); images resized client-side to ≤ 1600 px WebP before upload.
- **Backups:** Supabase daily backups on paid plans; on free plan a weekly export job. `releases` itself is a full history of everything ever published.

## 5. Publish flow
1. Editors edit freely; changes save as drafts instantly (nothing public changes).
2. Dashboard shows **"7 unpublished changes"** and a Publish button.
3. Publish → validate (missing dates, broken links, empty names) → snapshot → insert release → call deploy hook.
4. Dashboard polls the deploy (optional Vercel token) and shows *Building… / Live / Failed*. A failed build leaves the old site up; nothing breaks.
5. **Rollback:** pick an older release, "Re-publish this version".
6. Optional: **nightly rebuild** (a Vercel cron hitting the same hook) so date-driven things roll over even if nobody publishes.

Live / Open / Past is derived from dates, as it is now (cached for an hour, no DB involved), so it doesn't need a rebuild to roll over.

## 6. Build integration
- `package.json`: `"prebuild": "node scripts/pull-content.mjs"` fetches the latest release and writes `content/*.json`.
- If Supabase is unreachable the build **fails loudly** (never silently ships empty content). A committed seed copy of `content/` is kept as an emergency fallback you can opt into.
- Local dev reads the same way (or a local file), so previews work offline.

## 7. Media
- Images in a Supabase Storage bucket; the snapshot stores their public URLs + dimensions.
- `next/image` is configured with the bucket's host; images are lazy-loaded from Supabase's CDN, not through the database.
- If you later want on-the-fly resizing, Supabase image transformations (paid) or Vercel image optimisation both work with this layout.

## 8. Admin screens (inside this Next app at `/admin`, login required, not indexed)
1. **Dashboard**: unpublished changes, Publish, last release, build status.
2. **Events**: list + calendar view, create / edit / duplicate / archive, hub posts (if decision 2 = yes), photo upload.
3. **Members**: grouped by category, drag to reorder, photo upload.
4. **Club details & aims**: text, socials, headline numbers, phases, which 3D model each aim uses.
5. **Media library**: upload, alt text, find unused.
6. **Releases**: history, diff summary, rollback.
7. **Admins** (owner only): add / remove emails, set role.

Built with the existing UI kit (shadcn forms), responsive, with unsaved-change warnings and inline validation.

## 9. What changes in the current code
- Keystatic and `/keystatic` get removed once `/admin` covers events + members + club text (kept until then so you can still edit).
- `src/lib/content.ts` keeps reading `content/*.json`; only the *source* of those files changes.
- No change to how pages look or render.

## 10. Phases
| Phase | Delivers | Needs from you |
|---|---|---|
| 0 | Supabase schema, RLS, admin allowlist, Google login | Supabase project, OAuth, admin emails |
| 1 | Pull script, release snapshots, deploy hook, bare Publish button | Deploy hook URL |
| 2 | Admin screens: events, members, club, aims, media | Decisions below |
| 3 | Releases / rollback / audit view, nightly rebuild, build-status polling | Optional Vercel token |
| 4 | (Only if wanted) hub posts + applications as live features | Decision 2 |

## 11. Costs and gotchas
- **Supabase free tier pauses a project after about a week of inactivity.** A paused DB would make the next publish/build fail. Fixes: a tiny keep-alive cron, or the Pro plan.
- Vercel Hobby deploy hooks are free; each publish uses build minutes.
- Google OAuth needs a client set up in Google Cloud Console (free).

## 12. Decisions I need from you
1. **Snapshot-per-publish** (above) rather than the build reading tables directly: OK?
2. **Participant hubs** (board posts updates to event participants): are these *content* (appear after a Publish, like everything else) or *live* (visible immediately, needs runtime reads and participant login)? Same question for **join-form applications**: store them in Supabase from the form (runtime *write*, never read by visitors)?
3. **Who can publish**: owners only, or editors too?
4. **Login**: Google only, allowlisted emails: OK?
5. **Nightly rebuild** cron: yes/no?
6. **Supabase plan**: stay on free + keep-alive, or Pro?
7. **Admin location**: inside this app at `/admin` (my recommendation) or a separate app?
8. Who are the first admins (emails)?

## 13. What I'll need (put keys in `.env.local` / Vercel yourself, don't paste them in chat)
- Supabase project URL + anon key (the service-role key goes only into Vercel / `.env.local`).
- A Vercel deploy-hook URL for the production branch.
- Google OAuth client ID/secret configured as a Supabase auth provider.
- The admin email list.
