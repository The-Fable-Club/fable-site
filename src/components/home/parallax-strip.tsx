"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

// A giant wordmark strip, after the one above Endfield's media section: the
// club's name runs off both edges and slides sideways as the page scrolls,
// with a thin outlined line under it moving the other way.
const WORD = "// THE FABLE CLUB";
const LINE = "LEARN CLAUDE THOROUGHLY ✳ THEN BUILD WITH IT ✳ VIT CHENNAI ✳ ";

export function ParallaxStrip() {
  const root = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ["start end", "end start"] });
  const big = useTransform(scrollYProgress, [0, 1], ["4%", "-38%"]);
  const small = useTransform(scrollYProgress, [0, 1], ["-30%", "0%"]);

  return (
    <div ref={root} aria-hidden className="overflow-hidden bg-paper py-10 select-none md:py-16">
      <motion.p
        style={{ x: big }}
        className="whitespace-nowrap font-display text-[clamp(5rem,15vw,15rem)] uppercase leading-[0.85] tracking-tight text-ink will-change-transform"
      >
        {WORD}&nbsp;&nbsp;{WORD}
      </motion.p>
      <motion.p
        style={{ x: small }}
        className="mt-4 whitespace-nowrap font-display text-[clamp(1.75rem,4vw,3.5rem)] uppercase leading-none text-transparent [-webkit-text-stroke:1.5px_var(--color-clay-deep)] will-change-transform"
      >
        {LINE.repeat(4)}
      </motion.p>
    </div>
  );
}
