# Backups

Snapshots of sections before big changes, so we can roll back. Not part of the build
(excluded in `tsconfig.json` and `eslint.config.mjs`).

| Folder | What it holds | Why |
|---|---|---|
| `2026-10-16_v1-before-polish-pass` | hero, aims dial + point cloud, events carousel, people strip, section index, rail, timeline, members grid, home page, globals.css | Before the easing/laser/carousel/timeline/people/CMS pass |

To roll back one file: copy it from the snapshot back to its original path (home/* → `src/components/home/`, others → `src/components/`, `page.tsx` → `src/app/`, `globals.css` → `src/app/`).
Add a new dated folder whenever a section gets a big rework.
| `2026-10-17_before-dial-rail-battery-pass` | hero, aims dial, point cloud, events carousel, people strip, section index, rail, timeline, home page (`home-page.tsx`), events page (`events-page.tsx`) | Before the synced dial, sliding rail highlight, battery optimisations, full-bleed timeline |
