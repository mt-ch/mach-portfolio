import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const freshFetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
  freshClient: { fetch: (...args: unknown[]) => freshFetchMock(...args) },
}));

const { getAbout, getAboutFresh } = await import("./about");

describe("getAbout", () => {
  it("returns the singleton About document", async () => {
    const about = {
      _id: "about",
      name: "Matt Chan",
      headline: "Engineer",
      email: "matt@example.com",
    };
    fetchMock.mockResolvedValueOnce(about);

    const result = await getAbout();

    expect(result).toEqual(about);
  });
});

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
