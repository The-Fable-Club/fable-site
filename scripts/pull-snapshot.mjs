// Runs before `next dev` / `next build`: fetch the newest published release
// from Supabase (public_release view, publishable key, read-only) and save it
// to .snapshot/release.json. The site reads that file, never the database, so
// pages stay static. Validation happens in src/lib/content.ts (zod contract).
//
// On Vercel / CI a failed fetch FAILS the build, so a broken release can never
// replace a working site. Locally it falls back to content/seed/snapshot.json.
// No release published yet (fresh database) => the seed is used, with a warning.
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envFile = resolve(root, ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const strict = Boolean(process.env.VERCEL || process.env.CI);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const out = resolve(root, ".snapshot/release.json");
const seed = resolve(root, "content/seed/snapshot.json");
mkdirSync(resolve(root, ".snapshot"), { recursive: true });

function useSeed(why) {
  copyFileSync(seed, out);
  console.warn(`[snapshot] ${why} - using the committed seed (content/seed/snapshot.json)`);
}
function fail(why) {
  if (strict) {
    console.error(`[snapshot] ${why}`);
    process.exit(1);
  }
  useSeed(why);
}

if (!url || !key) {
  fail("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set");
} else {
  try {
    const res = await fetch(`${url}/rest/v1/public_release?select=id,snapshot,published_at,schema_version&order=id.desc&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`release request failed: HTTP ${res.status}`);
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      useSeed("no release has been published yet");
    } else {
      writeFileSync(out, JSON.stringify(rows[0].snapshot));
      console.log(`[snapshot] release #${rows[0].id} (published ${rows[0].published_at})`);
    }
  } catch (e) {
    fail(`could not fetch the release: ${e instanceof Error ? e.message : e}`);
  }
}
