import { describe, expect, it, vi } from "vitest";

const freshFetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: vi.fn() },
  freshClient: { fetch: (...args: unknown[]) => freshFetchMock(...args) },
}));

const { getAboutFresh } = await import("./about");

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
