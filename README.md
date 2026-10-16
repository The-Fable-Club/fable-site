# The Fable Club — website

Landing site for The Fable Club, a Claude learning club at VIT Chennai.
Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · shadcn/ui (base-nova) · motion.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Pages
| Route | What |
|---|---|
| `/` | Landing: hero, about + aims dial, highlighted event + timeline, board strip, join |
| `/events` | Current/upcoming, full timeline, event history |
| `/events/[slug]` | Event details. Apply button + hub link only for active/upcoming events |
| `/events/[slug]/hub` | Participant hub (board → participants). 404 for past events |
| `/members` | Everyone; click a card for the bio. Deep link: `/members?m=<slug>` |
| `/join` | Recruitment form (no backend: produces an email draft) |

## Content
All content is **placeholder** and lives in `src/data/` (`club.ts`, `events.ts`, `members.ts`). Pages show "Placeholder" markers (`<Ph />`) wherever copy is not final; remove them as content is finalised.

Event `status` (`active` | `upcoming` | `past`) controls who gets an Apply button and a hub.

## Not built yet (no backend)
- Real form submission for `/join` (currently opens a `mailto:` draft).
- Hub posting/auth: the board "post" form is a local demo; hubs are public to anyone with the link.
- Apply links are `#placeholder-…`.

## Assets
- Fonts: Anthropic Sans / Serif / Mono in `src/fonts` (loaded with `next/font/local`). Confirm licence before public launch.
- Illustrations: `public/art/*.svg`. Brand images: `public/logo-*.jpg`, `public/banner-*.jpg`.
- `_reference/` (gitignored): prototype, font archives, Endfield notes.

## Claude skills
`.claude/skills/frontend-design` (from anthropics/skills).
