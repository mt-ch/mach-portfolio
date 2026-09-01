import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NEXT_PUBLIC_SITE_URL = "https://mattchan.dev";

const getAboutForSitemap = vi.fn();
const getProjectsForSitemap = vi.fn();

vi.mock("@/lib/sanity", () => ({
  getAboutForSitemap: () => getAboutForSitemap(),
  getProjectsForSitemap: () => getProjectsForSitemap(),
}));

const { default: sitemap } = await import("./sitemap");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("app/sitemap", () => {
  it("lists the homepage (dated from the about doc) and every indexable project", async () => {
    getAboutForSitemap.mockResolvedValue({
      _updatedAt: "2026-01-01T00:00:00.000Z",
    });
    getProjectsForSitemap.mockResolvedValue([
      {
        _id: "1",
        slug: { current: "alpha" },
        _updatedAt: "2026-02-01T00:00:00.000Z",
        seo: null,
      },
      {
        _id: "2",
        slug: { current: "beta" },
        _updatedAt: "2026-03-01T00:00:00.000Z",
        seo: { noIndex: false },
      },
    ]);

    const entries = await sitemap();

    expect(entries).toEqual([
      { url: "https://mattchan.dev/", lastModified: "2026-01-01T00:00:00.000Z" },
      {
        url: "https://mattchan.dev/projects/alpha",
        lastModified: "2026-02-01T00:00:00.000Z",
      },
      {
        url: "https://mattchan.dev/projects/beta",
        lastModified: "2026-03-01T00:00:00.000Z",
      },
    ]);
  });

  it("omits a no-indexed project entirely", async () => {
    getAboutForSitemap.mockResolvedValue({
      _updatedAt: "2026-01-01T00:00:00.000Z",
    });
    getProjectsForSitemap.mockResolvedValue([
      {
        _id: "1",
        slug: { current: "public" },
        _updatedAt: "2026-02-01T00:00:00.000Z",
        seo: null,
      },
      {
        _id: "2",
        slug: { current: "secret" },
        _updatedAt: "2026-03-01T00:00:00.000Z",
        seo: { noIndex: true },
      },
    ]);

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://mattchan.dev/projects/public");
    expect(urls).not.toContain("https://mattchan.dev/projects/secret");
  });

  it("still renders the homepage entry when the about doc is missing", async () => {
    getAboutForSitemap.mockResolvedValue(null);
    getProjectsForSitemap.mockResolvedValue([]);

    const entries = await sitemap();

    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe("https://mattchan.dev/");
    expect(entries[0].lastModified).toBeTruthy();
  });
});
