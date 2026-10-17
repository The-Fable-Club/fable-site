# Editing the site

Content is **not** edited in this repo any more (the old Keystatic editor was removed on 2026-10-17). Everything that changes often is managed in the CMS at **cms.thefableclub.com** and reaches the site when someone presses **Publish**.

| To change… | Do this |
|---|---|
| An event: dates, registration, photo, hub posts | CMS -> Events, then Publish |
| Faculty, board, leads, members | CMS -> Members, then Publish |
| Who signed up (applications, registrations) | CMS -> Applications / Registrations (CSV download there) |
| Tagline, about text, stats, contact, socials, the five aims | Edit `content/club.json` / `content/aims.json` here and push |

What each person can do depends on their access level: see the CMS repo's `docs/ACCESS.md`. Publishing takes about a minute to go live.

On your own computer, `npm run dev` follows new releases automatically (it checks about every ten seconds), so a publish shows up on localhost without a restart. Localhost and the live CMS use the same database.

Changing the *shape* of the data (a new field): update `src/lib/contract.ts` here **and** in the CMS repo (they must be identical), then `src/lib/content.ts`.
