import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/siteUrl";

// Renders /robots.txt. Allows every crawler everywhere; per-page opt-outs are
// handled by the `noindex` robots meta tag emitted from each route's
// metadata, not here. Points crawlers at the sitemap and declares the
// canonical host.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
