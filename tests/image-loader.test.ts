import { describe, expect, it } from "vitest";
import imageLoader from "@/lib/image-loader";

describe("imageLoader", () => {
  it("asks ImageKit for the width, quality and best format", () => {
    expect(imageLoader({ src: "https://ik.imagekit.io/thefableclub/fable/events/x/a.webp", width: 640 })).toBe(
      "https://ik.imagekit.io/thefableclub/fable/events/x/a.webp?tr=w-640%2Cq-75%2Cf-auto",
    );
    expect(imageLoader({ src: "https://ik.imagekit.io/t/a.webp", width: 1080, quality: 60 })).toContain("tr=w-1080%2Cq-60%2Cf-auto");
  });
  it("replaces an existing tr rather than stacking", () => {
    const u = new URL(imageLoader({ src: "https://ik.imagekit.io/t/a.webp?tr=w-10", width: 320 }));
    expect(u.searchParams.getAll("tr")).toEqual(["w-320,q-75,f-auto"]);
  });
  it("serves our own files as they are, one distinct entry per width", () => {
    expect(imageLoader({ src: "/art/book.svg", width: 240 })).toBe("/art/book.svg?w=240");
    expect(imageLoader({ src: "/media/placeholder/ev-1-a.jpg", width: 3840 })).toBe("/media/placeholder/ev-1-a.jpg?w=3840");
  });
  it("does not transform look-alike hosts", () => {
    expect(imageLoader({ src: "https://ik.imagekit.io.evil.example/a.webp", width: 64 })).not.toContain("tr=");
  });
});
