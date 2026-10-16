import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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

const description =
  "The Fable Club is a student-led AI learning and building community at VIT Chennai, focused on Claude.";

export const metadata: Metadata = {
  title: {
    default: "The Fable Club — A Claude club at VIT Chennai",
    template: "%s — The Fable Club",
  },
  description,
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
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
