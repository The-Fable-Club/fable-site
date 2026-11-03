import type { NextConfig } from "next";

// Content-Security-Policy. The pages are static and only ever talk to this site
// (the forms post to /api/*, which reach Supabase server-side). Pictures and
// clips may come from Supabase storage or ImageKit. Next's own inline scripts
// need 'unsafe-inline' (nonces would make every page dynamic); dev mode also
// needs eval and the hot-reload socket, and Vercel preview builds load the
// Vercel toolbar.
const dev = process.env.NODE_ENV !== "production";
const preview = process.env.VERCEL_ENV === "preview";
const supabase = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();
const mediaHosts = [supabase, "https://ik.imagekit.io"].filter(Boolean).join(" ");
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${preview ? " https://vercel.live" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${mediaHosts}${preview ? " https://vercel.live https://vercel.com" : ""}`,
  `media-src 'self' blob: ${mediaHosts}`,
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws: wss:" : ""}${preview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
  `frame-src ${preview ? "https://vercel.live" : "'none'"}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Poster short links: thefableclub.com/e/<slug> -> the event page.
  async redirects() {
    return [{ source: "/e/:slug", destination: "/events/:slug", permanent: false }];
  },
  // CMS content is read from ./content at runtime when pages revalidate.
  outputFileTracingIncludes: { "/**": ["./content/**/*", "./.snapshot/**/*"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
