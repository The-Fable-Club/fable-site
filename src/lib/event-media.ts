// What the home "Events" stage shows behind and under each event.
//
// Per event, up to ONE video and TWO pictures.
//   picture 1 = the stage backdrop (and the video's poster while it loads)
//   picture 2 = the thumbnail in the strip (falls back to picture 1)
//   no video  = picture 1 simply is the backdrop
// The CMS carries it since schema 2 (`event.media`, ImageKit). Older releases have only the
// single `photo`, which counts as picture 1; events with no media at all get generated
// placeholder clips (public/media/placeholder).
import type { ClubEvent } from "./events";

export type MediaInput = { video?: string; pics?: string[] };

export type EventMedia = {
  /** Looping backdrop video; absent when the stage should use `poster` as a still. */
  video?: string;
  poster: string;
  thumb: string;
  /** True while this is stand-in media, so the page can say so. */
  placeholder: boolean;
};

const base = "/media/placeholder";
export const PLACEHOLDER_MEDIA: { video?: string; a: string; b: string }[] = [
  { video: `${base}/ev-1.mp4`, a: `${base}/ev-1-a.jpg`, b: `${base}/ev-1-b.jpg` },
  { video: `${base}/ev-2.mp4`, a: `${base}/ev-2-a.jpg`, b: `${base}/ev-2-b.jpg` },
  { video: `${base}/ev-3.mp4`, a: `${base}/ev-3-a.jpg`, b: `${base}/ev-3-b.jpg` },
  // deliberately no video: shows the "picture instead of video" case
  { a: `${base}/ev-4-a.jpg`, b: `${base}/ev-4-b.jpg` },
  { video: `${base}/ev-5.mp4`, a: `${base}/ev-5-a.jpg`, b: `${base}/ev-5-b.jpg` },
];

export function resolveEventMedia(e: Pick<ClubEvent, "photo" | "media">, index: number, input?: MediaInput): EventMedia {
  const from = input ?? e.media;
  const pics = (from?.pics?.length ? from.pics : e.photo ? [e.photo] : []).filter(Boolean);
  const video = from?.video || undefined;
  if (!video && pics.length === 0) {
    const p = PLACEHOLDER_MEDIA[((index % PLACEHOLDER_MEDIA.length) + PLACEHOLDER_MEDIA.length) % PLACEHOLDER_MEDIA.length];
    return { video: p.video, poster: p.a, thumb: p.b, placeholder: true };
  }
  const fallback = PLACEHOLDER_MEDIA[0];
  const poster = pics[0] ?? fallback.a;
  return { video, poster, thumb: pics[1] ?? pics[0] ?? fallback.b, placeholder: false };
}

/** Where the stage goes after `i` (wraps), and where a step of `d` lands. */
export const step = (i: number, d: number, n: number) => (n <= 0 ? 0 : (((i + d) % n) + n) % n);
