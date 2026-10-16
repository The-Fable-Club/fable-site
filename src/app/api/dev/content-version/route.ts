import { readdir, stat } from "node:fs/promises";
import path from "node:path";

// Development only: reports the newest modification time under ./content so
// the dev watcher can tell when a CMS edit has happened.
async function newest(dir: string): Promise<number> {
  let latest = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    latest = Math.max(latest, entry.isDirectory() ? await newest(full) : (await stat(full)).mtimeMs);
  }
  return latest;
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });
  const v = await newest(path.join(process.cwd(), "content"));
  return Response.json({ v }, { headers: { "Cache-Control": "no-store" } });
}
