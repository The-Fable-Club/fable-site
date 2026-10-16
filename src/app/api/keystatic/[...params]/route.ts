import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../../keystatic.config";

// The CMS is on in development, and in production once the GitHub App
// credentials are set (docs/CMS.md). Until then the endpoint does not exist,
// rather than falling back to an unauthenticated mode.
const cmsEnabled =
  process.env.NODE_ENV === "development" || !!process.env.KEYSTATIC_GITHUB_CLIENT_ID;

const off = () => new Response("Not found", { status: 404 });
const handler = cmsEnabled ? makeRouteHandler({ config }) : { GET: off, POST: off };

export const GET = handler.GET;
export const POST = handler.POST;
