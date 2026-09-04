// Absolute origin the deployed site is served from, used to build canonical
// URLs, the sitemap, and robots.txt directives. Falls back to the local dev
// origin so metadata routes still render without the env var set.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mattchan.work";
