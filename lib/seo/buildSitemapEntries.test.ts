import { describe, expect, it } from "vitest";

import {
  buildSitemapEntries,
  type SitemapProject,
  type SitemapSiteDefaults,
} from "./buildSitemapEntries";

function makeProject(overrides: Partial<SitemapProject> = {}): SitemapProject {
  return {
    slug: { current: "collab-canvas" },
    _updatedAt: "2026-01-02T00:00:00.000Z",
    seo: null,
    ...overrides,
  };
}

function makeSiteDefaults(
  overrides: Partial<SitemapSiteDefaults> = {},
): SitemapSiteDefaults {
  return {
    siteUrl: "https://mattchan.dev",
    homepageLastModified: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildSitemapEntries", () => {
  it("always includes the homepage entry, dated from the about doc", () => {
    const [homepage] = buildSitemapEntries([], makeSiteDefaults());

    expect(homepage).toEqual({
      url: "https://mattchan.dev/",
      lastModified: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns only the homepage when there are no projects", () => {
    const entries = buildSitemapEntries([], makeSiteDefaults());

    expect(entries).toHaveLength(1);
  });

  it("adds one entry per project, dated from its `_updatedAt`", () => {
    const entries = buildSitemapEntries(
      [
        makeProject({
          slug: { current: "alpha" },
          _updatedAt: "2026-02-10T12:00:00.000Z",
        }),
      ],
      makeSiteDefaults(),
    );

    expect(entries).toContainEqual({
      url: "https://mattchan.dev/projects/alpha",
      lastModified: "2026-02-10T12:00:00.000Z",
    });
  });

  it("excludes a project whose resolved noIndex is true", () => {
    const entries = buildSitemapEntries(
      [
        makeProject({ slug: { current: "visible" } }),
        makeProject({
          slug: { current: "hidden" },
          seo: { noIndex: true },
        }),
      ],
      makeSiteDefaults(),
    );

    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("https://mattchan.dev/projects/visible");
    expect(urls).not.toContain("https://mattchan.dev/projects/hidden");
  });

  it("treats a missing or null seo object as indexable", () => {
    const entries = buildSitemapEntries(
      [
        makeProject({ slug: { current: "no-seo" }, seo: null }),
        makeProject({ slug: { current: "empty-seo" }, seo: {} }),
        makeProject({
          slug: { current: "false-seo" },
          seo: { noIndex: false },
        }),
      ],
      makeSiteDefaults(),
    );

    expect(entries).toHaveLength(4);
  });

  it("keeps the homepage first and projects in the order passed", () => {
    const entries = buildSitemapEntries(
      [
        makeProject({ slug: { current: "first" } }),
        makeProject({ slug: { current: "second" } }),
        makeProject({ slug: { current: "third" } }),
      ],
      makeSiteDefaults(),
    );

    expect(entries.map((entry) => entry.url)).toEqual([
      "https://mattchan.dev/",
      "https://mattchan.dev/projects/first",
      "https://mattchan.dev/projects/second",
      "https://mattchan.dev/projects/third",
    ]);
  });

  it("strips a trailing slash from the site URL", () => {
    const entries = buildSitemapEntries(
      [makeProject({ slug: { current: "alpha" } })],
      makeSiteDefaults({ siteUrl: "https://mattchan.dev/" }),
    );

    expect(entries.map((entry) => entry.url)).toEqual([
      "https://mattchan.dev/",
      "https://mattchan.dev/projects/alpha",
    ]);
  });
});
