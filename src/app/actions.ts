"use server";

import { updateTag } from "next/cache";

// Development only: clears the cached CMS content after a file change.
export async function refreshContent() {
  if (process.env.NODE_ENV !== "development") return;
  updateTag("content");
}
