import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content";
import { OG, OG_SIZE, OgMark, ogFonts } from "@/lib/og";

export const alt = "The Fable Club, a Claude club at VIT Chennai";
export const size = OG_SIZE;
export const contentType = "image/png";

// The link preview for the home page (and any page without its own).
export default async function Image() {
  const { club } = await getContent();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: OG.paper, color: OG.ink }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 56 }}>
          <OgMark size={300} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontFamily: "Mono", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: OG.clay }}>
              {`${club.institution} · Claude club`}
            </div>
            <div style={{ fontFamily: "Display", fontSize: 104, lineHeight: 1, marginTop: 18 }}>The Fable Club</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 76,
            padding: "0 80px",
            background: OG.clay,
            fontFamily: "Mono",
            fontSize: 24,
            letterSpacing: 2,
          }}
        >
          <span>THEFABLECLUB.COM</span>
          <span>{club.contactEmail.toUpperCase()}</span>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
