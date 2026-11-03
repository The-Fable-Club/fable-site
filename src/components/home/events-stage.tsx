"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useInView, type Variants } from "motion/react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Clock, MapPin, Maximize2, Play, X } from "lucide-react";
import { dateLabel, eventhubTarget, type ClubEvent } from "@/lib/events";
import { resolveEventMedia, step, type EventMedia } from "@/lib/event-media";
import { Hud, Ph } from "@/components/hud";
import { cn } from "@/lib/utils";

const FLOW = [0.65, 0, 0.35, 1] as const;
/** How long one event stays up before the stage moves on by itself (the line under the title fills over this). */
const AUTOPLAY_MS = 9000;

const text: Variants = {
  out: { opacity: 0, y: 22 },
  in: { opacity: 1, y: 0, transition: { duration: 0.75, ease: FLOW } },
  gone: { opacity: 0, y: -12, transition: { duration: 0.35, ease: FLOW } },
};
const stagger: Variants = {
  out: {},
  in: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
  gone: {},
};

const pad = (n: number) => String(n).padStart(2, "0");

function statusLabel(e: ClubEvent) {
  if (e.status === "active") return "Live now";
  return e.registration === "open" ? "Registrations open" : "Upcoming";
}

/** The one registration button an event can show, mirroring the rules the events page uses. */
function RegisterAction({ e }: { e: ClubEvent }) {
  const cls =
    "inline-flex h-12 items-center gap-2 border border-clay bg-clay px-5 font-medium text-ink transition-colors duration-500 ease-flow hover:bg-paper hover:border-paper";
  const hub = eventhubTarget(e);
  if (hub)
    return (
      <a href={hub} target="_blank" rel="noopener noreferrer" className={cls}>
        Register on EventHub
        <ArrowUpRight className="size-4" aria-hidden />
      </a>
    );
  if (e.registration === "open" && e.applyUrl)
    return (
      <a href={e.applyUrl} target="_blank" rel="noopener noreferrer" className={cls}>
        Apply
        <ArrowUpRight className="size-4" aria-hidden />
      </a>
    );
  if (e.registration === "open")
    return (
      <Link href={`/events/${e.slug}#register`} className={cls}>
        Register
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    );
  if (e.registration === "soon")
    return (
      <span className="inline-flex h-12 items-center border border-dashed border-paper/40 px-5 font-medium text-night-soft">
        Registration opening soon
      </span>
    );
  return null;
}

/**
 * One event's backdrop. The poster picture is only there once the event is near
 * (current, leaving or next in line), so the rest of the set costs nothing until
 * it is about to show; the video (when the event has one) fades in over it once
 * it is actually playing, and only the current and the leaving event keep a
 * <video> element at all. The current layer wipes in over the leaving one.
 */
function Backdrop({
  media,
  on,
  leaving,
  near,
  keepVideo,
  run,
}: {
  media: EventMedia;
  on: boolean;
  leaving: boolean;
  near: boolean;
  keepVideo: boolean;
  run: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (run && on) v.play().catch(() => {}); // blocked autoplay (data saver, low power) just leaves the poster
    else v.pause();
  }, [run, on, keepVideo]);

  return (
    <div aria-hidden className="stage-layer absolute inset-0" data-on={on ? "" : undefined} data-leaving={leaving ? "" : undefined}>
      <div className="stage-media absolute inset-0">
        {near && <Image src={media.poster} alt="" fill sizes="100vw" className="object-cover" />}
        {media.video && keepVideo && (
          <video
            ref={video}
            src={media.video}
            poster={media.poster}
            muted
            loop
            playsInline
            preload={on ? "auto" : "metadata"}
            onPlaying={() => setPlaying(true)}
            onEmptied={() => setPlaying(false)}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-[900ms] ease-flow",
              playing ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </div>
    </div>
  );
}

/** Full-size look at the event's video (or picture), opened from the stage. */
function Lightbox({
  event,
  media,
  open,
  onOpenChange,
}: {
  event: ClubEvent;
  media: EventMedia;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-black/85 duration-500 ease-flow data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup className="fixed inset-0 z-[91] grid place-items-center p-4 outline-none duration-500 ease-flow data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <div className="w-[min(94vw,68rem)]">
            <div className="mb-3 flex items-center justify-between gap-4 text-paper">
              <Dialog.Title className="font-display text-2xl leading-tight">{event.title}</Dialog.Title>
              <Dialog.Close
                aria-label="Close"
                className="grid size-11 shrink-0 place-items-center border border-paper/40 text-paper transition-colors duration-500 ease-flow hover:bg-paper hover:text-ink"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              {media.video ? (
                <video src={media.video} poster={media.poster} controls autoPlay loop playsInline className="size-full object-contain" />
              ) : (
                <Image src={media.poster} alt={event.title} fill sizes="(min-width: 1088px) 1088px, 94vw" className="object-contain" />
              )}
            </div>
            {media.placeholder && (
              <p className="mt-3">
                <Ph className="border-clay text-clay">Placeholder media</Ph>
              </p>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Home "Events" stage, after Endfield's media section: the current event fills
// the screen (looping video, or a still when it has none), its title, date and
// buttons sit bottom-left over a line that fills as the timer runs, and a strip
// of thumbnails bottom-right steps through the rest. It advances by itself,
// pauses while you hover, when it is off screen or while the viewer is open.
export function EventsStage({ events }: { events: ClubEvent[] }) {
  const root = useRef<HTMLElement>(null);
  const onScreen = useInView(root, { amount: 0.25 });
  // videos only start loading once the stage is about a screen away
  const soon = useInView(root, { once: true, margin: "100% 0px" });
  const [sel, setSel] = useState({ active: 0, prev: -1, dir: 1 });
  const [hover, setHover] = useState(false);
  const [viewer, setViewer] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const n = events.length;
  // events can change under us in dev (a new release): never point past the end
  const active = n > 0 ? Math.min(sel.active, n - 1) : 0;
  const prev = sel.prev;

  const go = useCallback((d: number) => setSel((s) => ({ active: step(s.active, d, n), prev: s.active, dir: d < 0 ? -1 : 1 })), [n]);
  const jump = useCallback(
    (i: number) => setSel((s) => (s.active === i ? s : { active: i, prev: s.active, dir: i < s.active ? -1 : 1 })),
    [],
  );

  if (n === 0) {
    return (
      <section className="grid min-h-[22rem] place-items-center bg-night px-6 py-20 text-center text-paper">
        <div>
          <Hud className="text-night-faint">Events</Hud>
          <p className="mt-3 font-display text-4xl leading-tight">Nothing is open right now.</p>
          <Link
            href="/events"
            className="mt-6 inline-flex h-12 items-center gap-2 bg-clay px-6 font-medium text-ink transition-colors duration-500 ease-flow hover:bg-paper"
          >
            Past events and history
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  const e = events[active];
  const medias = events.map((ev, i) => resolveEventMedia(ev, i));
  const media = medias[active];
  const half = Math.floor(n / 2);
  const offset = (i: number) => ((i - active + n + half) % n) - half;
  const running = onScreen && !hover && !viewer && n > 1;

  return (
    <section
      ref={root}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Highlighted and upcoming events"
      onKeyDown={(ev) => {
        if (ev.target !== ev.currentTarget) return;
        if (ev.key === "ArrowRight") go(1);
        if (ev.key === "ArrowLeft") go(-1);
      }}
      onPointerEnter={(ev) => {
        if (ev.pointerType === "mouse") setHover(true);
      }}
      onPointerLeave={() => setHover(false)}
      onTouchStart={(ev) => (touch.current = { x: ev.touches[0].clientX, y: ev.touches[0].clientY })}
      onTouchEnd={(ev) => {
        const t = touch.current;
        touch.current = null;
        if (!t) return;
        const dx = ev.changedTouches[0].clientX - t.x;
        const dy = ev.changedTouches[0].clientY - t.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
      }}
      className="relative isolate flex min-h-[41rem] flex-col justify-end overflow-hidden bg-black text-paper outline-offset-[-4px] md:h-[min(54rem,calc(100dvh-4rem))] md:min-h-[38rem]"
    >
      {/* backdrops: after the first change, the current one wipes in over the leaving one, a clay bar riding its edge */}
      <div className="absolute inset-0 isolate" data-dir={sel.dir < 0 ? "back" : "next"} data-moved={prev >= 0 ? "" : undefined}>
        {events.map((ev, i) => (
          <Backdrop
            key={ev.slug}
            media={medias[i]}
            on={i === active}
            leaving={i === prev && prev !== active}
            near={i === prev || Math.abs(offset(i)) <= 1}
            keepVideo={soon && (i === active || i === prev)}
            run={onScreen}
          />
        ))}
        {prev >= 0 && (
          <div key={`${active}-${prev}`} aria-hidden className="stage-sweep pointer-events-none absolute inset-0 z-[3]">
            <span className="stage-sweep-bar" />
          </div>
        )}
      </div>

      {/* the side tab, after Endfield's: the event's kind set vertically, rolling over on each change */}
      <div aria-hidden className="absolute inset-y-0 right-0 z-10 hidden w-16 overflow-hidden bg-clay text-ink lg:block">
        <AnimatePresence initial={false}>
          <motion.div
            key={e.slug}
            initial={{ y: sel.dir < 0 ? "-100%" : "100%" }}
            animate={{ y: 0, transition: { duration: 0.9, ease: FLOW } }}
            exit={{ y: sel.dir < 0 ? "100%" : "-100%", transition: { duration: 0.9, ease: FLOW } }}
            className="absolute inset-0 flex flex-col items-center justify-between bg-clay py-8"
          >
            <span className="font-display text-4xl uppercase leading-none [writing-mode:vertical-rl]">{e.kind}</span>
            <span className="hud tabular-nums [writing-mode:vertical-rl]">
              EVT {pad(active + 1)} / {pad(n)}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* legibility: left-weighted shade, a floor for the thumbnails, a faint scan texture */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-black/10" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/40" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,#fff_0_1px,transparent_1px_3px)]"
      />

      {/* top row: what this event is right now, and where we are in the set */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 px-6 pt-6 md:px-14 md:pt-8 lg:pr-[7.5rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={e.slug}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.6, ease: FLOW } }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="hud flex items-center gap-2 text-clay"
          >
            <span className={cn("size-2 bg-clay", e.status === "active" && "animate-pulse")} aria-hidden />
            {statusLabel(e)}
          </motion.span>
        </AnimatePresence>
        <div className="flex flex-col items-end gap-2">
          <Hud className="text-night-soft tabular-nums">
            EVT {pad(active + 1)} / {pad(n)}
          </Hud>
          {media.placeholder && <Ph className="border-clay text-clay">Placeholder media</Ph>}
        </div>
      </div>

      {/* bottom: info + buttons on the left, the strip on the right */}
      <div className="relative z-10 px-6 pb-8 md:px-14 md:pb-10 lg:pr-[7.5rem]">
        <div className="md:max-w-[min(32rem,42%)]">
          <div aria-live="polite" className="min-h-[15rem] md:min-h-[17rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={e.slug} variants={stagger} initial="out" animate="in" exit="gone">
                <motion.div variants={text} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="hud bg-paper/15 px-2 py-1 text-paper">
                    {e.kind}
                    {e.phase > 0 && ` · Phase ${e.phase}`}
                  </span>
                  <span className="hud text-clay">{dateLabel(e)}</span>
                </motion.div>
                <motion.h3
                  variants={text}
                  className="mt-4 font-display text-[clamp(2rem,1.3rem+2.6vw,3.6rem)] leading-[1.02]"
                >
                  {e.title}
                </motion.h3>
                <motion.p variants={text} className="mt-4 line-clamp-3 max-w-[44ch] font-serif text-lg leading-relaxed text-night-soft">
                  {e.summary}
                </motion.p>
                <motion.dl variants={text} className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-night-soft">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    <dt className="sr-only">When</dt>
                    <dd>{e.time}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0" aria-hidden />
                    <dt className="sr-only">Where</dt>
                    <dd>{e.venue}</dd>
                  </div>
                </motion.dl>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* the timer line: it fills over AUTOPLAY_MS, then the stage moves on */}
          <div aria-hidden className="relative mt-5 h-[2px] bg-paper/25">
            <div
              key={`${e.slug}-${active}`}
              onAnimationEnd={() => go(1)}
              className="stage-fill absolute inset-0 origin-left bg-clay"
              style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: running ? "running" : "paused", animationName: n > 1 ? undefined : "none" }}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setViewer(true)}
              aria-label={media.video ? `Watch the video for ${e.title}` : `View the picture for ${e.title}`}
              className="grid size-12 place-items-center bg-clay text-ink transition-colors duration-500 ease-flow hover:bg-paper"
            >
              {media.video ? <Play className="size-5 fill-current" aria-hidden /> : <Maximize2 className="size-5" aria-hidden />}
            </button>
            <Link
              href={`/events/${e.slug}`}
              className="inline-flex h-12 items-center gap-2 bg-paper/15 px-6 font-medium text-paper backdrop-blur-sm transition-colors duration-500 ease-flow hover:bg-paper hover:text-ink"
            >
              Details
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <RegisterAction e={e} />
          </div>
        </div>

        {/* thumbnail strip */}
        {n > 1 && (
          <div
            className="relative mt-8 h-[calc(var(--tw)*0.5625+1rem)] w-full [--pitch:10.25rem] [--tw:11rem] md:absolute md:bottom-10 md:right-0 md:mt-0 lg:right-16 md:w-[min(58%,50rem)] md:[--pitch:17.5rem] md:[--tw:18rem]"
          >
            <div
              className="absolute inset-0 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]"
              role="tablist"
              aria-label="Choose an event"
            >
            {events.map((ev, i) => {
              const o = offset(i);
              const isOn = i === active;
              const near = Math.abs(o) <= 1;
              const ordinal = i + 1;
              return (
                <button
                  key={ev.slug}
                  role="tab"
                  aria-selected={isOn}
                  tabIndex={near ? 0 : -1}
                  onClick={() => (isOn ? setViewer(true) : jump(i))}
                  className={cn(
                    "stage-thumb absolute bottom-0 left-1/2 aspect-video w-[var(--tw)] origin-bottom overflow-hidden bg-night text-left",
                    near ? "cursor-pointer" : "pointer-events-none",
                  )}
                  style={
                    {
                      "--o": o,
                      "--sc": isOn ? 1 : 0.84,
                      opacity: isOn ? 1 : near ? 0.6 : 0,
                    } as CSSProperties
                  }
                >
                  <Image src={medias[i].thumb} alt="" fill sizes="288px" className="object-cover" />
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 bg-gradient-to-t transition-colors duration-[800ms] ease-flow",
                      isOn ? "from-clay/95 via-clay/25 to-transparent" : "from-black/80 via-black/20 to-transparent",
                    )}
                  />
                  <span className="absolute inset-x-0 bottom-0 p-3">
                    {!isOn && (
                      <span aria-hidden className="hud mb-1 block text-paper/80 tabular-nums">
                        {o < 0 ? `${pad(ordinal)} / ${pad(n)} · LAST` : `NEXT · ${pad(ordinal)} / ${pad(n)}`}
                      </span>
                    )}
                    <span className={cn("line-clamp-2 block font-display leading-tight", isOn ? "text-base text-ink md:text-lg" : "text-sm text-paper md:text-base")}>
                      {ev.title}
                    </span>
                    <span className="sr-only">{`, ${ordinal} of ${n}`}</span>
                  </span>
                </button>
              );
            })}
            </div>
            <button
              type="button"
              aria-label="Previous event"
              onClick={() => go(-1)}
              className="absolute left-1 bottom-[calc(var(--tw)*0.28125-1.375rem+0.5rem)] md:left-[calc(50%-var(--tw)/2-1.375rem)] z-10 grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg transition-colors duration-500 ease-flow hover:bg-clay"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next event"
              onClick={() => go(1)}
              className="absolute right-1 bottom-[calc(var(--tw)*0.28125-1.375rem+0.5rem)] md:left-[calc(50%+var(--tw)/2-1.375rem)] md:right-auto z-10 grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg transition-colors duration-500 ease-flow hover:bg-clay"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        )}
      </div>

      <Lightbox event={e} media={media} open={viewer} onOpenChange={setViewer} />
    </section>
  );
}
