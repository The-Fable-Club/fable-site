"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { EventMedia } from "@/lib/event-media";

/**
 * The event page's picture or silent loop. The loop plays muted only while it is on screen
 * and the visitor hasn't asked for reduced motion; otherwise picture 1 (or the clip's still)
 * stays as a still image.
 */
export function EventMediaFigure({ media, title }: { media: EventMedia; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [play, setPlay] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!media.video || !box.current) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const io = new IntersectionObserver(([e]) => setPlay(e.isIntersecting && !still.matches), { threshold: 0.25 });
    io.observe(box.current);
    return () => io.disconnect();
  }, [media.video]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (play) v.play().catch(() => {}); // blocked autoplay (data saver) just leaves the picture
    else v.pause();
  }, [play]);

  return (
    <div ref={box} className="relative aspect-video w-full overflow-hidden bg-ink/5">
      <Image src={media.poster} alt={media.video ? "" : title} fill sizes="(min-width: 1152px) 1152px, 100vw" className="object-cover" priority />
      {media.video && (
        <video
          ref={video}
          src={media.video}
          poster={media.poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onPlaying={() => setPlaying(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
