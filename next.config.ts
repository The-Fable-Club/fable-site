import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
