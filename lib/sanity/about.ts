import { client, freshClient } from "./client";
import { aboutForSitemapQuery, aboutQuery } from "./queries";
import type { About, AboutSitemapItem } from "./types";

export async function getAbout(): Promise<About | null> {
  return client.fetch(aboutQuery);
}

// Bypasses the CDN so the reindex webhook never indexes stale content from
// right after a publish. See lib/sanity/client.ts.
export async function getAboutFresh(): Promise<About | null> {
  return freshClient.fetch(aboutQuery);
}

// Just the singleton's last-edited time, used to date the homepage's
// sitemap entry.
export async function getAboutForSitemap(): Promise<AboutSitemapItem | null> {
  return client.fetch(aboutForSitemapQuery);
}
