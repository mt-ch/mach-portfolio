import { describe, expect, it, vi } from "vitest";

import { aboutForSitemapQuery, aboutQuery } from "./queries";

const fetchMock = vi.fn();
const freshFetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
  freshClient: { fetch: (...args: unknown[]) => freshFetchMock(...args) },
}));

const { getAbout, getAboutForSitemap, getAboutFresh } = await import("./about");

describe("getAboutFresh", () => {
  it("returns the singleton About document via the non-CDN client", async () => {
    const about = {
      _id: "about",
      name: "Matt Chan",
      headline: "Engineer",
      email: "matt@example.com",
    };
    freshFetchMock.mockResolvedValueOnce(about);

    const result = await getAboutFresh();

    expect(freshFetchMock).toHaveBeenCalled();
    expect(result).toEqual(about);
  });
});

describe("aboutQuery Site SEO Defaults", () => {
  it("requests the Site SEO Defaults fields", () => {
    for (const field of [
      "siteName",
      "titleTemplate",
      "defaultMetaDescription",
      "defaultOgImage",
    ]) {
      expect(aboutQuery).toContain(field);
    }
  });
});

describe("aboutQuery homepage SEO", () => {
  it("selects the embedded seo projection", () => {
    for (const field of [
      "seo {",
      "metaTitle",
      "metaDescription",
      "ogImage",
      "ogImageAlt",
      "noIndex",
    ]) {
      expect(aboutQuery).toContain(field);
    }
  });
});

describe("getAboutForSitemap", () => {
  it("requests only the singleton's last-edited time", () => {
    expect(aboutForSitemapQuery).toContain("_updatedAt");
  });

  it("returns the fetched last-edited time", async () => {
    fetchMock.mockResolvedValueOnce({ _updatedAt: "2026-01-01T00:00:00.000Z" });

    const result = await getAboutForSitemap();

    expect(fetchMock).toHaveBeenCalledWith(aboutForSitemapQuery);
    expect(result).toEqual({ _updatedAt: "2026-01-01T00:00:00.000Z" });
  });
});

describe("getAbout", () => {
  it("passes the Site SEO Defaults values through from the fetch", async () => {
    const about = {
      _id: "about",
      name: "Matt Chan",
      siteName: "Matt Chan",
      titleTemplate: "%s | Matt Chan",
      defaultMetaDescription: "Design engineer portfolio",
      defaultOgImage: { _type: "image", asset: { _ref: "image-abc" } },
    };
    fetchMock.mockResolvedValueOnce(about);

    const result = await getAbout();

    expect(fetchMock).toHaveBeenCalledWith(aboutQuery);
    expect(result).toEqual(about);
  });

  it("passes the embedded homepage seo object through from the fetch", async () => {
    const about = {
      _id: "about",
      name: "Matt Chan",
      seo: {
        metaTitle: "Matt Chan — Design Engineer",
        metaDescription: "Homepage description",
        ogImage: { _type: "image", asset: { _ref: "image-home" } },
        ogImageAlt: "Portrait of Matt Chan",
        noIndex: false,
      },
    };
    fetchMock.mockResolvedValueOnce(about);

    const result = await getAbout();

    expect(result).toEqual(about);
  });
});
