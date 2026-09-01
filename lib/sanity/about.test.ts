import { describe, expect, it, vi } from "vitest";

import { aboutQuery } from "./queries";

const fetchMock = vi.fn();
const freshFetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
  freshClient: { fetch: (...args: unknown[]) => freshFetchMock(...args) },
}));

const { getAbout, getAboutFresh } = await import("./about");

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
});
