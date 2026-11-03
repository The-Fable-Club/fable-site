import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content";
import { bySlug, dateLabel } from "@/lib/events";
import { OG, OG_SIZE, OgMark, ogFonts } from "@/lib/og";

export const alt = "Event at The Fable Club";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  const { events } = await getContent();
  const slugs = events.map((e) => ({ slug: e.slug }));
  return slugs.length ? slugs : [{ slug: "_none" }];
}

// Each event's link preview: kind, title, date and place, on the club's night stage.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { events } = await getContent();
  const e = bySlug(events, slug);
  const title = e?.title ?? "Events";
  const long = title.length > 42;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: OG.night, color: OG.paper }}>
        <div style={{ width: 28, height: "100%", background: OG.clay }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: "Mono", fontSize: 24, letterSpacing: 3, textTransform: "uppercase" }}>
            {e && <span style={{ background: OG.clay, color: OG.ink, padding: "6px 14px" }}>{e.kind}</span>}
            {e && <span style={{ color: OG.clay }}>{dateLabel(e)}</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Display", fontSize: long ? 72 : 96, lineHeight: 1.02, maxWidth: 980 }}>{title}</div>
            {e && (
              <div style={{ fontFamily: "Serif", fontSize: 30, marginTop: 24, color: "#c2c0b6" }}>{`${e.time} · ${e.venue}`}</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <OgMark size={64} stroke={OG.paper} />
            <span style={{ fontFamily: "Display", fontSize: 36 }}>The Fable Club</span>
            <span style={{ fontFamily: "Mono", fontSize: 22, letterSpacing: 2, marginLeft: "auto", color: "#c2c0b6" }}>THEFABLECLUB.COM</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
