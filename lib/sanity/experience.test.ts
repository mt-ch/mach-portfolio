import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const freshFetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
  freshClient: { fetch: (...args: unknown[]) => freshFetchMock(...args) },
}));

const { getExperience, getExperienceEntryById } = await import("./experience");

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

describe("getExperienceEntryById", () => {
  it("fetches an entry by id via the non-CDN client and marks it current when endDate is null", async () => {
    freshFetchMock.mockResolvedValueOnce({
      _id: "1",
      company: "Acme",
      title: "Engineer",
      startDate: "2024-01-01",
      endDate: null,
      order: 1,
    });

    const entry = await getExperienceEntryById("1");

    expect(freshFetchMock).toHaveBeenCalledWith(expect.any(String), {
      id: "1",
    });
    expect(entry?.isCurrent).toBe(true);
  });

  it("returns null when no entry matches the id", async () => {
    freshFetchMock.mockResolvedValueOnce(null);

    const entry = await getExperienceEntryById("missing");

    expect(entry).toBeNull();
  });
});
