import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Rail } from "@/components/rail";
import { Footer } from "@/components/footer";
import { club } from "@/data/club";

// Anthropic type family, supplied by the club (see src/fonts).
const sans = localFont({
  variable: "--f-sans",
  display: "swap",
  src: [
    { path: "../fonts/sans-regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/sans-medium.otf", weight: "500", style: "normal" },
    { path: "../fonts/sans-semibold.otf", weight: "600", style: "normal" },
  ],
});
const display = localFont({
  variable: "--f-display",
  display: "swap",
  src: [
    { path: "../fonts/serif-display-regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/serif-display-italic.otf", weight: "400", style: "italic" },
  ],
});
const serif = localFont({
  variable: "--f-serif",
  display: "swap",
  src: [
    { path: "../fonts/serif-text-regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/serif-text-italic.otf", weight: "400", style: "italic" },
  ],
});
const mono = localFont({
  variable: "--f-mono",
  display: "swap",
  src: [{ path: "../fonts/mono-regular.otf", weight: "400", style: "normal" }],
});

export const metadata: Metadata = {
  title: {
    default: `${club.name} — A Claude club at ${club.institution}`,
    template: `%s — ${club.name}`,
  },
  description: club.description,
};

export const viewport: Viewport = {
  themeColor: "#faf9f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-20 focus:top-3 focus:z-[100] focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <Rail />
        <div className="with-rail">
          <main id="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
