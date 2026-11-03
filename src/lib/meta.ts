import type { Metadata } from "next";

export const SITE_URL = "https://www.thefableclub.com";

/** A page's title and description, repeated for link previews (Open Graph and X), plus its canonical path. */
export function pageMeta(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    // child metadata replaces the parent's openGraph object whole, so repeat the site-wide fields
    openGraph: { type: "website", siteName: "The Fable Club", locale: "en_IN", title: `${title} — The Fable Club`, description, url: path },
    twitter: { card: "summary_large_image", title: `${title} — The Fable Club`, description },
  };
}
