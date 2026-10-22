// Generates the PLACEHOLDER event videos and pictures in public/media/placeholder.
// They are made from maths (ffmpeg's geq filter) in the club palette, so there is
// no licence to worry about. Real event media comes from the CMS later.
//
//   node scripts/make-placeholder-media.mjs      (needs ffmpeg on PATH)
//
// Each clip is 6 s and loops without a visible seam: every time-dependent term
// completes a whole number of cycles in 6 s.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "public", "media", "placeholder");
mkdirSync(out, { recursive: true });

const D = 6; // seconds
const TAU = "6.2831853";
const ph = `(${TAU}*T/${D})`; // 0..2pi over the clip

// Each source is an expression f(X,Y,T) in 0..255 (the grey level); the gradient
// map below turns grey into night -> clay -> cream.
const sources = {
  // concentric rings breathing outward from the centre
  rings: `255*(0.5+0.5*sin(hypot(X-W*0.62,Y-H*0.5)/16-${ph}))*exp(-hypot(X-W*0.62,Y-H*0.5)/260)`,
  // two crossing wave fields (interference)
  waves: `255*(0.5+0.25*sin(X/38+${ph})+0.25*sin(Y/29-${ph}+X/90))*(0.35+0.65*Y/H)`,
  // a lattice of dots that pulse in a travelling wave
  dots: `255*pow(0.5+0.5*sin(${ph}-hypot(X-W/2,Y-H/2)/28),3)*pow(0.5+0.5*cos(mod(X,24)*0.26-3.14),6)*pow(0.5+0.5*cos(mod(Y,24)*0.26-3.14),6)*1.4`,
  // slow aurora bands
  aurora: `255*(0.5+0.5*sin(Y/58+sin(X/120+${ph})*1.6-${ph}))*(0.25+0.75*pow(Y/H,1.2))`,
  // diagonal scan lines drifting across a soft glow
  scan: `255*(0.55*(0.5+0.5*sin((X+Y)/22-${ph}*2))+0.45*exp(-hypot(X-W*0.3,Y-H*0.4)/220))*(0.4+0.6*X/W)`,
};

// Gradient map: grey -> night (#262624) -> clay (#d97757) -> cream (#faf9f5).
const ramp =
  "curves=r='0/0.10 0.45/0.20 0.75/0.85 1/0.98':g='0/0.10 0.45/0.14 0.75/0.47 1/0.98':b='0/0.09 0.45/0.13 0.75/0.34 1/0.96'";

const ff = (...args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: "inherit" });

Object.entries(sources).forEach(([name, expr], i) => {
  const n = i + 1;
  const mp4 = path.join(out, `ev-${n}.mp4`);
  ff(
    "-f", "lavfi", "-i", `color=c=black:s=640x360:r=24:d=${D}`,
    "-vf", `format=gray,geq=lum='${expr}',format=rgb24,${ramp},gblur=sigma=1.2,noise=alls=7:allf=t,vignette=PI/4,scale=1280:720:flags=bicubic,format=yuv420p`,
    "-c:v", "libx264", "-crf", "29", "-preset", "slow", "-an", "-movflags", "+faststart",
    mp4,
  );
  // two stills from the same clip: the first doubles as the video poster
  ff("-ss", "1.2", "-i", mp4, "-frames:v", "1", "-q:v", "4", path.join(out, `ev-${n}-a.jpg`));
  ff("-ss", "3.9", "-i", mp4, "-frames:v", "1", "-q:v", "4", path.join(out, `ev-${n}-b.jpg`));
  console.log(`ev-${n}  ${name}`);
});
