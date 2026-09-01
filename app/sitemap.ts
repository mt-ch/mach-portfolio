import type { MetadataRoute } from "next";

import { getAboutForSitemap, getProjectsForSitemap } from "@/lib/sanity";
import { buildSitemapEntries } from "@/lib/seo/buildSitemapEntries";
import { SITE_URL } from "@/lib/seo/siteUrl";

// Renders /sitemap.xml. Fetches the projects + the about singleton, then
// delegates the pure mapping (which URLs, which dates, what to omit) to
// buildSitemapEntries.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [about, projects] = await Promise.all([
    getAboutForSitemap(),
    getProjectsForSitemap(),
  ]);

  return buildSitemapEntries(projects, {
    siteUrl: SITE_URL,
    homepageLastModified: about?._updatedAt ?? new Date().toISOString(),
  });
}
