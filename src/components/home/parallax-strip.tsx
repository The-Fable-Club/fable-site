"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

// A wordmark strip, after the one above Endfield's media section: the club's
// name runs off both edges and slides sideways as the page scrolls. Not on phones (fable-site#27).
const WORD = "// THE FABLE CLUB";
const GAP = " ".repeat(3);

export function ParallaxStrip() {
  const root = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  return (
    <div ref={root} aria-hidden className="hidden overflow-hidden bg-paper py-8 select-none md:block">
      <motion.p
        style={{ x }}
        className="whitespace-nowrap font-display text-[clamp(1.25rem,3.75vw,3.75rem)] uppercase leading-[0.85] tracking-tight text-ink will-change-transform"
      >
        {Array(6).fill(WORD).join(GAP)}
      </motion.p>
    </div>
  );
}
