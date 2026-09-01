import type { MetadataRoute } from "next";

// The minimal project shape buildSitemapEntries reads. A project is listed
// unless its resolved `noIndex` is true, in which case it is omitted entirely
// (rather than listed with a flag) so search engines never discover the URL
// through the sitemap.
export interface SitemapProject {
  slug: { current: string };
  _updatedAt: string;
  seo?: { noIndex?: boolean | null } | null;
}

export interface SitemapSiteDefaults {
  // Absolute site origin, e.g. "https://mattchan.dev". A trailing slash is
  // tolerated and stripped.
  siteUrl: string;
  // `_updatedAt` of the `about` singleton — the homepage has no document of
  // its own, so it inherits the last-edited time of the record that drives it.
  homepageLastModified: string;
}

function resolveNoIndex(project: SitemapProject): boolean {
  return project.seo?.noIndex ?? false;
}

// Pure sitemap builder. No Sanity-client or Next-runtime imports — it maps a
// list of already-fetched projects plus the site origin to the entry array
// `app/sitemap.ts` returns. The homepage entry is always first; projects
// follow in the order they were passed (the fetch query orders them).
export function buildSitemapEntries(
  projects: SitemapProject[],
  siteDefaults: SitemapSiteDefaults,
): MetadataRoute.Sitemap {
  const base = siteDefaults.siteUrl.replace(/\/+$/, "");

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: siteDefaults.homepageLastModified,
    },
  ];

  for (const project of projects) {
    if (resolveNoIndex(project)) {
      continue;
    }

    entries.push({
      url: `${base}/projects/${project.slug.current}`,
      lastModified: project._updatedAt,
    });
  }

  return entries;
}
