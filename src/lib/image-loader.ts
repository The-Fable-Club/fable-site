// next/image loader for the whole site (next.config.ts). Uploaded pictures live on ImageKit,
// which resizes and picks the format (AVIF/WebP) at the edge from the `tr` parameter, so no
// Vercel image optimisation is used and the pages stay static. Our own files (art, logo,
// placeholders) are small and served as they are; the width goes in a harmless query so each
// srcset entry is distinct.
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (src.startsWith("https://ik.imagekit.io/")) {
    const u = new URL(src);
    u.searchParams.set("tr", `w-${width},q-${quality ?? 75},f-auto`);
    return u.toString();
  }
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
