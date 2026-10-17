import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

// Development only. Reports a version number that changes when the content changes, so the dev
// watcher (components/dev-content-refresh.tsx) can refresh the page:
//  - the newest edit under ./content (club text, aims), and
//  - the newest published release in Supabase: when the CMS publishes, this rewrites
//    .snapshot/release.json (what `npm run dev` fetches once at start) so localhost follows it.
async function newest(dir: string): Promise<number> {
  let latest = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    latest = Math.max(latest, entry.isDirectory() ? await newest(full) : (await stat(full)).mtimeMs);
  }
  return latest;
}

const CHECK_EVERY_MS = 10_000; // the watcher polls often; Supabase only needs asking occasionally
let lastCheck = 0;
let releaseId = 0;

async function latestRelease(): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || Date.now() - lastCheck < CHECK_EVERY_MS) return releaseId;
  lastCheck = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/public_release?select=id,snapshot&order=id.desc&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const rows = (await res.json()) as { id: number; snapshot: unknown }[];
    if (res.ok && rows[0] && rows[0].id !== releaseId) {
      const dir = path.join(/* turbopackIgnore: true */ process.cwd(), ".snapshot");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "release.json"), JSON.stringify(rows[0].snapshot));
      releaseId = rows[0].id;
    }
  } catch {
    /* offline: keep what we have */
  }
  return releaseId;
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });
  const files = await newest(path.join(/* turbopackIgnore: true */ process.cwd(), "content"));
  const release = await latestRelease();
  return Response.json({ v: files + release }, { headers: { "Cache-Control": "no-store" } });
}
