> **Interim.** Keystatic is the stopgap editor. The planned replacement (Supabase + a Publish button, no repo access) is in [CMS-PLAN.md](CMS-PLAN.md).

# Editing the site (CMS)

The site's content lives as plain files in `content/` and is edited through an admin screen at **`/keystatic`** (Keystatic). There is no database: saving in the admin changes the files, and the site shows the change.

## What you can edit

| Section | What it controls |
|---|---|
| **Events** | Every event: dates, venue, summary, apply link, illustration or photo, participant-hub posts. Status (Live / Open / Past) is worked out from the dates automatically. |
| **Members** | Faculty, board and leads: role, bio, contacts, photo, order within the group. |
| **Club details** | Tagline, about text, contact email, social links, headline numbers, programme phases. |
| **What we’re for** | The five aims and which 3D model each one shows. |

Adding an event or member = **Add** in the admin. They appear on the home page, the events/members pages and the timeline by themselves.

## Using it now (on your computer)

```bash
npm run dev          # then open http://localhost:3000/keystatic
```

Edits are written straight into `content/`. Refresh the site to see them. When happy, commit the `content/` changes (and any uploaded images in `public/uploads/`).

## Using it on the live site

On the deployed site the admin signs in with **GitHub** and saves each edit as a commit to the repo, which makes Vercel redeploy (about a minute). Anyone who can sign in needs **write access to the repo** (add board members as collaborators on the club's GitHub org).

Until the steps below are done, `/keystatic` and its API return **404 in production** (on purpose: there is no unauthenticated mode).

### One-time setup (after the repo is on the club's GitHub org)
1. Deploy the repo on Vercel.
2. Locally, create the GitHub App once: put `NEXT_PUBLIC_KEYSTATIC_REPO=<org>/<repo>` in `.env.local`, then run the dev server in GitHub mode (PowerShell: `$env:KEYSTATIC_STORAGE="github"; npm run dev`) and open `/keystatic`. Keystatic walks you through creating a GitHub App and writes `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` and `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` into `.env.local`.
   *Note: this step could not be tested yet because it needs the club's GitHub org and repo. If the wizard doesn't appear, follow Keystatic's GitHub-mode guide below.*
3. Copy those four variables and `NEXT_PUBLIC_KEYSTATIC_REPO` into the Vercel project's environment variables, then redeploy.
4. Install the GitHub App on the org's repo, and visit `https://<site>/keystatic`.

Official guide: https://keystatic.com/docs/github-mode

## How it works with the rest of the site
- `keystatic.config.tsx` defines the fields.
- `src/lib/content.ts` reads `content/` and hands typed data to the pages. It caches for an hour, so **Live / Open / Past roll over by themselves** as dates pass.
- `public/art/` holds the illustrations you can choose from; photos uploaded in the admin go to `public/uploads/`.

## Limits (and what the backend is for)
- Edits are commits, not instant: expect about a minute on the live site.
- It manages **content**. Things that need accounts or storage per visitor (applications, participant-hub posting, logins) belong to the club's own backend, which is separate and still to come.
- To change the form of the data (a new field), edit `keystatic.config.tsx` and `src/lib/content.ts`.
