import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

const { getAbout } = await import("./about");

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
