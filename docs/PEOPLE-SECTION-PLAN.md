# People section plan (Endfield "Operators" style)

Status: **plan only, nothing built** (the real board list is already loaded into the CMS content, without registration numbers). Needs your confirmation on section 6.

## 1. What the reference does
In the Endfield screenshot: a vertical strip of **round portraits** on the left (up/down arrows to scroll), a big character cut-out in the middle-right over a **unique backdrop** with giant background lettering, a **"rarity" row** top-left, then the **name**, a few tags and a **bio** underneath, plus an "All Operators" button.

## 2. Mapping to the club

| Endfield | Fable Club |
|---|---|
| Round portrait strip | One round icon per **category**: Faculty, Chairperson, Vice-Chairperson, Secretary, Co-Secretary, Technical, Web Development, Agentic AI, Operations, Finance, Creative & Communications (11) |
| Character | **Generic placeholder person card** now (silhouette, brand colours); real photo later (transparent cut-out works best, a square crop also works with a mask) |
| Backdrop | A **unique backdrop per category**, built from the club logo, the wordmark and brand shapes |
| Rarity stars | The member's **role** ("[ WEB DEVELOPMENT ]") |
| Name + tags + bio | Name large, then short bio |
| "All Operators" | **"Everyone, with bios"** → the `/members` page |
| REC 1/35 counter | **1 / 2** pager when a category has two people |

## 3. Layout (desktop)

```
┌──┬─────────────────────────────────────────────────────────────┐
│  │   (o)▲        [ ROLE ]                        ┌───────────┐ │
│  │   (O) ◀ active   FABLE  (giant outlined text) │  backdrop │ │
│  │   (o)                                         │ ┌───────┐ │ │
│  │   (o)         [ Name ]                        │ │ person│ │ │
│  │   (o)         ─────────  1 / 2  ‹ ›           │ │ card  │ │ │
│  │   (o)▼        short bio…                      │ └───────┘ │ │
│  │   [Everyone, with bios]                       └───────────┘ │
└──┴─────────────────────────────────────────────────────────────┘
```
Mobile: the round icons become a horizontal strip on top; card and bio stack below.

## 4. Motion (using the site's easing)
- Picking a category: the **backdrop slides** across and the giant background lettering parallaxes; the card slides in from the side while the old one slides out; name and bio rise in staggered.
- Round icons: the active one gets a ring and a dotted halo (as in the reference); the strip auto-scrolls to keep it centred.
- Pager (‹ ›) switches between the 1–2 people of a category with the same slide.
- Arrow keys / mouse wheel on the strip also move through categories.

## 5. Backdrops
I can make these myself as generated SVG (no stock art needed): each one is a composition of the club's sprout mark, the "The Fable Club" wordmark and shapes, in a different arrangement and palette so no two look alike. Draft concepts:
1. **Faculty**: wordmark set vertically, in oat/ink, with a ruled "ledger" grid.
2. **Chairperson**: one huge sprout mark, cropped, in clay on night.
3. **Vice-Chairperson**: the same mark mirrored and half-size, sky-blue accent.
4. **Secretary**: stacked wordmark lines like a typed page.
5. **Co-Secretary**: wordmark on a diagonal with dotted lines.
6. **Technical**: sprout nodes drawn as a circuit/graph.
7. **Web Development**: browser-window frames layered with the mark.
8. **Agentic AI**: orbiting nodes and connecting lines around the mark.
9. **Operations**: repeating tiled marks like a schedule grid.
10. **Finance**: concentric rings and tick marks.
11. **Creative & Communications**: overlapping outlined mark + wordmark in several colours.

## 6. Questions for you
1. **Categories as above**: 11 icons, with Faculty as one of them? Or leave Faculty out of the strip?
2. **Two people per category** (e.g. 2 in Technical): pager (1 / 2) on one card, or both people shown side by side on one backdrop?
3. **Backdrop direction**: purely brand-geometric (as drafted), or do you want something more illustrated, with the hand-drawn SVGs you gave me mixed in?
4. **Group labels**: the table you sent is "Board Members – Office Bearers" for all 16. I currently mark all 16 as **Board** (plus 2 faculty). OK?
5. **Keep `/members`** (the full grid with bio dialogs) behind the "Everyone, with bios" button?
6. What do you want in the card's "tags" row (Endfield has Faction / Race)? Candidates: department, year, focus areas. (No registration numbers, as you said.)

## 7. Data this needs
A `category` per member (the portfolio, already stored as `role`), a short bio per person, and later a photo. Nothing else from you yet.
