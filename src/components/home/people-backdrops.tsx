import type { ReactNode } from "react";

// One unique backdrop per member category, built from the club's own marks:
// the sprout logo, the wordmark, and the hand-drawn illustrations in
// /public/art, in a different composition and palette each time.
// Everything here is deterministic (no Math.random) so server and client
// render identical markup.

export type Backdrop = {
  /** page colour behind the artwork */
  bg: string;
  /** true = dark artwork, so text on top should be light */
  dark: boolean;
  art: ReactNode;
};

const FONT = "var(--f-display), Georgia, serif";
const NODES: [number, number][] = [
  [512, 330],
  [330, 492],
  [696, 492],
  [330, 682],
  [696, 682],
];

/** The sprout mark, centred on (x, y), scaled by s. */
function Mark({
  x,
  y,
  s = 1,
  stroke,
  fill,
  sw = 15,
  flip = false,
  opacity = 1,
}: {
  x: number;
  y: number;
  s?: number;
  stroke: string;
  fill: string;
  sw?: number;
  flip?: boolean;
  opacity?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) translate(-512 -512)`}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    >
      <path d="M512 800V372M512 800L364 706M512 800L660 706M512 614L364 516M512 614L660 516" />
      <circle cx="512" cy="326" r="106" />
      {NODES.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="46" fill={fill} />
      ))}
    </g>
  );
}

function Word({
  x,
  y,
  size,
  text = "The Fable Club",
  fill = "none",
  stroke,
  sw = 2,
  opacity = 1,
  rotate = 0,
  anchor = "start",
}: {
  x: number;
  y: number;
  size: number;
  text?: string;
  fill?: string;
  stroke?: string;
  sw?: number;
  opacity?: number;
  rotate?: number;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      textAnchor={anchor}
      style={{ fontFamily: FONT, fontSize: size }}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      opacity={opacity}
    >
      {text}
    </text>
  );
}

function Art({
  src,
  x,
  y,
  size,
  invert = false,
  opacity = 1,
  rotate = 0,
}: {
  src: string;
  x: number;
  y: number;
  size: number;
  invert?: boolean;
  opacity?: number;
  rotate?: number;
}) {
  return (
    <image
      href={src}
      x={x}
      y={y}
      width={size}
      height={size}
      opacity={opacity}
      transform={rotate ? `rotate(${rotate} ${x + size / 2} ${y + size / 2})` : undefined}
      style={invert ? { filter: "invert(1)" } : undefined}
    />
  );
}

// small deterministic pseudo-random generator
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const n1 = (v: number) => Math.round(v * 10) / 10;

const PAPER = "#faf9f5";
const INK = "#141413";
const CLAY = "#d97757";

// ---------------------------------------------------------------------------

const chairperson: Backdrop = {
  bg: "#262624",
  dark: true,
  art: (
    <>
      {[250, 330, 410, 490].map((r) => (
        <circle key={r} cx="900" cy="380" r={r} fill="none" stroke={PAPER} strokeOpacity={0.1} strokeWidth="2" />
      ))}
      <Mark x={900} y={420} s={1.9} stroke={PAPER} fill={CLAY} opacity={0.95} />
      <Word x={1150} y={725} size={44} fill={PAPER} opacity={0.5} anchor="end" />
    </>
  ),
};

const viceChair: Backdrop = {
  bg: "#ebdbbc",
  dark: false,
  art: (
    <>
      {Array.from({ length: 22 }, (_, i) => (
        <line key={i} x1={-200 + i * 90} y1="800" x2={200 + i * 90} y2="-40" stroke="#d4a27f" strokeOpacity={0.45} strokeWidth="14" />
      ))}
      <Word x={1180} y={640} size={330} text="Fable" stroke="#c6613f" sw={3} anchor="end" opacity={0.55} />
      <Mark x={330} y={470} s={1.5} stroke={INK} fill={CLAY} flip />
    </>
  ),
};

const secretary: Backdrop = {
  bg: PAPER,
  dark: false,
  art: (
    <>
      {Array.from({ length: 20 }, (_, i) => (
        <line key={i} x1="0" y1={70 + i * 38} x2="1200" y2={70 + i * 38} stroke={INK} strokeOpacity={0.08} />
      ))}
      <line x1="150" y1="0" x2="150" y2="760" stroke={CLAY} strokeOpacity={0.7} strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Word key={i} x={180} y={140 + i * 76} size={34} fill={INK} opacity={0.5 - i * 0.045} text={["The Fable Club", "The Fable", "The Fable Club, a Claude club", "The", "The Fable Club", "The Fable Club VIT", "The Fable", "The Fable Club", "The"][i]} />
      ))}
      <Art src="/art/writing.svg" x={610} y={440} size={300} opacity={0.9} />
    </>
  ),
};

const coSecretary: Backdrop = {
  bg: "#6a9bcc",
  dark: false,
  art: (
    <>
      <Word x={-40} y={520} size={400} text="Fable Club" stroke={PAPER} sw={3} rotate={-16} opacity={0.6} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <line x1={120 + i * 190} y1={650 - i * 60} x2={310 + i * 190} y2={590 - i * 70} stroke={INK} strokeOpacity={0.35} strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
          <circle cx={120 + i * 190} cy={650 - i * 60} r="12" fill={PAPER} />
        </g>
      ))}
      <Art src="/art/pointer.svg" x={610} y={440} size={300} opacity={0.9} />
    </>
  ),
};

const technical: Backdrop = {
  bg: "#1f1e1d",
  dark: true,
  art: (() => {
    const r = rng(7);
    const cols = 13;
    const rows = 8;
    const pts: [number, number][] = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) pts.push([n1(70 + i * 90), n1(70 + j * 90)]);
    const links: ReactNode[] = [];
    pts.forEach(([x, y], k) => {
      if (r() < 0.45 && x < 1100) links.push(<path key={"h" + k} d={`M${x} ${y}H${x + 90}`} stroke={r() < 0.25 ? CLAY : PAPER} strokeOpacity={0.35} strokeWidth="2" />);
      if (r() < 0.35 && y < 640) links.push(<path key={"v" + k} d={`M${x} ${y}V${y + 90}`} stroke={PAPER} strokeOpacity={0.25} strokeWidth="2" />);
    });
    return (
      <>
        {links}
        {pts.map(([x, y], k) => (
          <circle key={k} cx={x} cy={y} r={k % 11 === 0 ? 7 : 3.5} fill={k % 11 === 0 ? CLAY : PAPER} fillOpacity={k % 11 === 0 ? 1 : 0.5} />
        ))}
        <Art src="/art/code-window.svg" x={600} y={430} size={320} invert opacity={0.85} />
      </>
    );
  })(),
};

const webDev: Backdrop = {
  bg: "#e3dacc",
  dark: false,
  art: (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${80 + i * 120} ${90 + i * 70})`}>
          <rect width="620" height="400" fill={i === 2 ? PAPER : "none"} stroke={INK} strokeWidth="3" />
          <line x1="0" y1="46" x2="620" y2="46" stroke={INK} strokeWidth="3" />
          {[0, 1, 2].map((d) => (
            <circle key={d} cx={26 + d * 26} cy="23" r="7" fill={d === 0 ? CLAY : INK} fillOpacity={d === 0 ? 1 : 0.4} />
          ))}
          {i === 2 && <rect x="30" y="80" width="250" height="150" fill={CLAY} fillOpacity={0.9} />}
          {i === 2 && [0, 1, 2, 3].map((l) => <line key={l} x1="310" y1={100 + l * 38} x2={310 + 240 - l * 40} y2={100 + l * 38} stroke={INK} strokeOpacity={0.6} strokeWidth="6" strokeLinecap="round" />)}
        </g>
      ))}
      <Art src="/art/cursor.svg" x={610} y={450} size={300} opacity={0.95} />
      <Mark x={1010} y={150} s={0.55} stroke={INK} fill={CLAY} sw={20} />
    </>
  ),
};

const agentic: Backdrop = {
  bg: "#262624",
  dark: true,
  art: (() => {
    const cx = 820;
    const cy = 380;
    const orbits = [
      { rx: 200, ry: 70, rot: -20, n: 3 },
      { rx: 300, ry: 120, rot: 25, n: 4 },
      { rx: 420, ry: 170, rot: -8, n: 5 },
    ];
    const dots: ReactNode[] = [];
    orbits.forEach((o, oi) => {
      for (let k = 0; k < o.n; k++) {
        const a = ((k + oi * 0.37) / o.n) * Math.PI * 2;
        const rr = (o.rot * Math.PI) / 180;
        const x = o.rx * Math.cos(a);
        const y = o.ry * Math.sin(a);
        const px = n1(cx + x * Math.cos(rr) - y * Math.sin(rr));
        const py = n1(cy + x * Math.sin(rr) + y * Math.cos(rr));
        dots.push(
          <g key={`${oi}-${k}`}>
            <line x1={cx} y1={cy} x2={px} y2={py} stroke={PAPER} strokeOpacity={0.18} />
            <circle cx={px} cy={py} r={9} fill={k % 2 ? CLAY : PAPER} />
          </g>,
        );
      }
    });
    return (
      <>
        {orbits.map((o, i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={o.rx} ry={o.ry} transform={`rotate(${o.rot} ${cx} ${cy})`} fill="none" stroke={PAPER} strokeOpacity={0.25} strokeWidth="2" />
        ))}
        {dots}
        <Mark x={cx} y={cy + 40} s={0.6} stroke={PAPER} fill={CLAY} sw={22} />
        <Art src="/art/network.svg" x={40} y={300} size={380} invert opacity={0.22} />
      </>
    );
  })(),
};

const operations: Backdrop = {
  bg: "#bcd1ca",
  dark: false,
  art: (
    <>
      {Array.from({ length: 5 }, (_, j) =>
        Array.from({ length: 8 }, (_, i) => {
          const hot = (i * 3 + j * 5) % 7 === 0;
          return <Mark key={`${i}-${j}`} x={110 + i * 145} y={110 + j * 140} s={0.2} stroke={INK} fill={hot ? CLAY : "none"} sw={34} opacity={hot ? 1 : 0.38} />;
        }),
      )}
      <Art src="/art/steps.svg" x={610} y={430} size={320} opacity={0.9} />
    </>
  ),
};

const finance: Backdrop = {
  bg: "#ccccdc",
  dark: false,
  art: (() => {
    const cx = 860;
    const cy = 380;
    const ticks = Array.from({ length: 60 }, (_, k) => {
      const a = (k / 60) * Math.PI * 2;
      const major = k % 5 === 0;
      const r1 = major ? 330 : 345;
      return <line key={k} x1={n1(cx + Math.sin(a) * r1)} y1={n1(cy - Math.cos(a) * r1)} x2={n1(cx + Math.sin(a) * 365)} y2={n1(cy - Math.cos(a) * 365)} stroke={INK} strokeOpacity={major ? 0.7 : 0.35} strokeWidth={major ? 4 : 2} />;
    });
    return (
      <>
        {ticks}
        {[300, 230, 160].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth="2" />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={70 + i * 70} y={620 - [90, 150, 120, 230, 300, 380][i]} width="44" height={[90, 150, 120, 230, 300, 380][i]} fill={i === 5 ? CLAY : INK} fillOpacity={i === 5 ? 1 : 0.55} />
        ))}
        <Art src="/art/search.svg" x={600} y={430} size={300} opacity={0.9} />
      </>
    );
  })(),
};

const creative: Backdrop = {
  bg: CLAY,
  dark: false,
  art: (
    <>
      <Word x={60} y={560} size={290} text="The Fable" stroke={INK} sw={3} opacity={0.35} />
      <Word x={60} y={730} size={290} text="Club" stroke={PAPER} sw={3} opacity={0.7} />
      <Mark x={760} y={420} s={1.7} stroke={PAPER} fill="#262624" opacity={0.95} />
      <Mark x={850} y={380} s={1.7} stroke={INK} fill="none" sw={5} opacity={0.5} />
      <Art src="/art/party.svg" x={980} y={20} size={200} opacity={0.95} />
    </>
  ),
};

const generic: Backdrop = {
  bg: "#f0eee6",
  dark: false,
  art: (
    <>
      {Array.from({ length: 4 }, (_, j) =>
        Array.from({ length: 6 }, (_, i) => <Mark key={`${i}-${j}`} x={120 + i * 200} y={120 + j * 190} s={0.26} stroke={INK} fill={CLAY} sw={24} opacity={0.35} />),
      )}
    </>
  ),
};

const BACKDROPS: Record<string, Backdrop> = {
  Chairperson: chairperson,
  "Vice-Chairperson": viceChair,
  Secretary: secretary,
  "Co-Secretary": coSecretary,
  Technical: technical,
  "Web Development": webDev,
  "Agentic AI": agentic,
  Operations: operations,
  Finance: finance,
  "Creative & Communications": creative,
};

export function backdropFor(role: string): Backdrop {
  return BACKDROPS[role] ?? generic;
}

export function BackdropSvg({ role }: { role: string }) {
  const b = backdropFor(role);
  return (
    <svg
      viewBox="0 0 1200 760"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className="absolute inset-0 size-full"
      style={{ background: b.bg }}
    >
      {b.art}
    </svg>
  );
}
