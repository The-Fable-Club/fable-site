import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getContent } from "@/lib/content";
import { SITE_URL } from "@/lib/meta";
import "./globals.css";

// Anthropic type family, supplied by the club (see src/fonts). The browser gets the WOFF2
// copies (about half the size); the .otf originals stay for the link-preview images (lib/og.tsx).
const sans = localFont({
  variable: "--f-sans",
  display: "swap",
  src: [
    { path: "../fonts/sans-regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/sans-medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/sans-semibold.woff2", weight: "600", style: "normal" },
  ],
});
const display = localFont({
  variable: "--f-display",
  display: "swap",
  src: [
    { path: "../fonts/serif-display-regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/serif-display-italic.woff2", weight: "400", style: "italic" },
  ],
});
const serif = localFont({
  variable: "--f-serif",
  display: "swap",
  src: [
    { path: "../fonts/serif-text-regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/serif-text-italic.woff2", weight: "400", style: "italic" },
  ],
});
const mono = localFont({
  variable: "--f-mono",
  display: "swap",
  src: [{ path: "../fonts/mono-regular.woff2", weight: "400", style: "normal" }],
});

const HOME_TITLE = "The Fable Club — A Claude club at VIT Chennai";

// Defaults for every page. Pages set their own title and description (see lib/meta.ts);
// the link-preview image comes from app/opengraph-image.tsx unless a route has its own.
export async function generateMetadata(): Promise<Metadata> {
  const { club } = await getContent();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: HOME_TITLE, template: "%s — The Fable Club" },
    description: club.description,
    applicationName: "The Fable Club",
    openGraph: {
      type: "website",
      siteName: "The Fable Club",
      locale: "en_IN",
      title: HOME_TITLE,
      description: club.description,
      url: "/",
    },
    twitter: { card: "summary_large_image", title: HOME_TITLE, description: club.description },
  };
}

export const viewport: Viewport = {
  themeColor: "#faf9f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
