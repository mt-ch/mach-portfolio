import { client, freshClient } from "./client";
import { aboutQuery } from "./queries";
import type { About } from "./types";

export async function getAbout(): Promise<About | null> {
  return client.fetch(aboutQuery);
}

// Bypasses the CDN so the reindex webhook never indexes stale content from
// right after a publish. See lib/sanity/client.ts.
export async function getAboutFresh(): Promise<About | null> {
  return freshClient.fetch(aboutQuery);
}
