import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import KeystaticApp from "../keystatic";

// The admin is a browser-only app, so it is rendered per request, never
// prerendered with content. Unless the CMS is enabled (dev, or production with
// GitHub credentials set) the route does not exist.
const enabled = () =>
  process.env.NODE_ENV === "development" || !!process.env.KEYSTATIC_GITHUB_CLIENT_ID;

async function Admin() {
  await connection();
  return <KeystaticApp />;
}

export default function Page() {
  if (!enabled()) notFound();
  return (
    <Suspense fallback={null}>
      <Admin />
    </Suspense>
  );
}
