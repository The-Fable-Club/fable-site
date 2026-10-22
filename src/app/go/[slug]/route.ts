import { connection } from "next/server";
import { countEventhubClick } from "@/lib/clicks";
import { getContent } from "@/lib/content";
import { bySlug, eventhubTarget } from "@/lib/events";

// "Register on EventHub": count the press (numbers only), then forward to that event's official EventHub page.
// Only ever forwards to the link saved on the event (and only on the real EventHub host), so it is not an open redirect.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const { events } = await getContent();
  const target = eventhubTarget(bySlug(events, slug));
  if (!target) {
    const safe = /^[a-z0-9-]{1,80}$/.test(slug) ? slug : "";
    return Response.redirect(new URL(safe ? `/events/${safe}` : "/events", req.url), 302);
  }
  await countEventhubClick(slug);
  return new Response(null, { status: 302, headers: { Location: target, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
