import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { SITE_URL } from "@/lib/meta";

// Public pages only: the hub pages stay out (and are noindex).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { events } = await getContent();
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/events`, priority: 0.8 },
    { url: `${SITE_URL}/join`, priority: 0.8 },
    { url: `${SITE_URL}/members`, priority: 0.6 },
    ...events.map((e) => ({ url: `${SITE_URL}/events/${e.slug}`, priority: 0.7 })),
  ];
}
