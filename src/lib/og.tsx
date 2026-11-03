import { readFile } from "node:fs/promises";
import path from "node:path";

// Shared bits for the link-preview images (app/opengraph-image.tsx and the
// event pages' own): the club palette, the sprout mark as plain SVG, and the
// club's typefaces read from src/fonts at build time.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG = {
  paper: "#faf9f5",
  ink: "#141413",
  inkSoft: "#3d3d3a",
  clay: "#d97757",
  manilla: "#ebdbbc",
  night: "#262624",
};

// Read inside a cache so the preview routes prerender at build time (uncached file
// reads would make them dynamic); the cache hands back Uint8Arrays, Satori wants ArrayBuffers.
async function fontBytes() {
  "use cache";
  const font = (f: string) => readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "src", "fonts", f));
  return Promise.all([font("serif-display-regular.otf"), font("serif-text-regular.otf"), font("mono-regular.otf")]).then((all) =>
    all.map((b) => new Uint8Array(b)),
  );
}

export async function ogFonts() {
  const [display, serif, mono] = (await fontBytes()).map((b) => b.slice().buffer);
  return [
    { name: "Display", data: display, weight: 400 as const, style: "normal" as const },
    { name: "Serif", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

/** The sprout mark (same drawing as the logo), `size` px square. */
export function OgMark({ size, stroke = OG.ink, fill = OG.clay }: { size: number; stroke?: string; fill?: string }) {
  const nodes: [number, number][] = [
    [512, 326],
    [330, 492],
    [696, 492],
    [330, 682],
    [696, 682],
  ];
  return (
    <svg width={size} height={size} viewBox="200 180 624 660">
      <path
        d="M512 800V432M512 800L364 706M512 800L660 706M512 614L364 516M512 614L660 516"
        fill="none"
        stroke={stroke}
        strokeWidth={22}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="512" cy="326" r="106" fill="none" stroke={stroke} strokeWidth={22} />
      {nodes.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 0 ? 40 : 46} fill={fill} stroke={stroke} strokeWidth={18} />
      ))}
    </svg>
  );
}
