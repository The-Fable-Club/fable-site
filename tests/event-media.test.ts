import { describe, expect, it } from "vitest";
import { PLACEHOLDER_MEDIA, resolveEventMedia, step } from "@/lib/event-media";

describe("resolveEventMedia", () => {
  it("uses placeholder media when the event has none, cycling by position", () => {
    const m0 = resolveEventMedia({}, 0);
    expect(m0.placeholder).toBe(true);
    expect(m0.video).toBe(PLACEHOLDER_MEDIA[0].video);
    expect(resolveEventMedia({}, PLACEHOLDER_MEDIA.length).poster).toBe(m0.poster);
  });

  it("has one placeholder without a video, to show the picture-as-backdrop case", () => {
    expect(PLACEHOLDER_MEDIA.some((p) => !p.video)).toBe(true);
  });

  it("treats the event's single photo as picture 1 and shows no video", () => {
    const m = resolveEventMedia({ photo: "https://x.test/a.webp" }, 0);
    expect(m).toEqual({ video: undefined, poster: "https://x.test/a.webp", thumb: "https://x.test/a.webp", placeholder: false });
  });

  it("uses picture 2 as the thumbnail and keeps the video when there is one", () => {
    const m = resolveEventMedia({}, 2, { video: "https://x.test/v.mp4", pics: ["https://x.test/1.webp", "https://x.test/2.webp"] });
    expect(m).toEqual({ video: "https://x.test/v.mp4", poster: "https://x.test/1.webp", thumb: "https://x.test/2.webp", placeholder: false });
  });

  it("a video with no pictures still gets a poster and thumbnail", () => {
    const m = resolveEventMedia({}, 1, { video: "https://x.test/v.mp4" });
    expect(m.video).toBe("https://x.test/v.mp4");
    expect(m.poster).toBeTruthy();
    expect(m.thumb).toBeTruthy();
    expect(m.placeholder).toBe(false);
  });
});

describe("step", () => {
  it("wraps in both directions", () => {
    expect(step(0, -1, 5)).toBe(4);
    expect(step(4, 1, 5)).toBe(0);
    expect(step(2, 1, 5)).toBe(3);
  });
  it("is safe with no items", () => {
    expect(step(0, 1, 0)).toBe(0);
  });
});
