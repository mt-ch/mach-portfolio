import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

const { getExperience } = await import("./experience");

describe("getExperience", () => {
  it("marks an entry with a null endDate as current", async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: "1",
        company: "Acme",
        title: "Engineer",
        startDate: "2024-01-01",
        endDate: null,
        order: 1,
      },
    ]);

    const [entry] = await getExperience();

    expect(entry.isCurrent).toBe(true);
    expect(entry.endDate).toBeNull();
  });

  it("marks an entry with an endDate as not current", async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: "1",
        company: "Acme",
        title: "Engineer",
        startDate: "2020-01-01",
        endDate: "2023-01-01",
        order: 1,
      },
    ]);

    const [entry] = await getExperience();

    expect(entry.isCurrent).toBe(false);
  });
});
