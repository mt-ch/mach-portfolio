import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const freshFetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
  freshClient: { fetch: (...args: unknown[]) => freshFetchMock(...args) },
}));

const { getExperience, getExperienceEntryById } = await import("./experience");

describe("getExperience", () => {
  it("marks a role with a null endDate as current", async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: "1",
        company: "Acme",
        order: 1,
        roles: [
          { title: "Engineer", startDate: "2024-01-01", endDate: null },
        ],
      },
    ]);

    const [entry] = await getExperience();

    expect(entry.roles[0].isCurrent).toBe(true);
    expect(entry.roles[0].endDate).toBeNull();
  });

  it("marks a role with an endDate as not current and preserves role order", async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: "1",
        company: "Acme",
        order: 1,
        roles: [
          { title: "Senior Engineer", startDate: "2022-01-01", endDate: null },
          { title: "Engineer", startDate: "2020-01-01", endDate: "2022-01-01" },
        ],
      },
    ]);

    const [entry] = await getExperience();

    expect(entry.roles.map((role) => role.title)).toEqual([
      "Senior Engineer",
      "Engineer",
    ]);
    expect(entry.roles[0].isCurrent).toBe(true);
    expect(entry.roles[1].isCurrent).toBe(false);
  });

  it("tolerates a document with no roles", async () => {
    fetchMock.mockResolvedValueOnce([
      { _id: "1", company: "Acme", order: 1, roles: null },
    ]);

    const [entry] = await getExperience();

    expect(entry.roles).toEqual([]);
  });
});

describe("getExperienceEntryById", () => {
  it("fetches an entry by id via the non-CDN client and marks a role current when endDate is null", async () => {
    freshFetchMock.mockResolvedValueOnce({
      _id: "1",
      company: "Acme",
      order: 1,
      roles: [{ title: "Engineer", startDate: "2024-01-01", endDate: null }],
    });

    const entry = await getExperienceEntryById("1");

    expect(freshFetchMock).toHaveBeenCalledWith(expect.any(String), {
      id: "1",
    });
    expect(entry?.roles[0].isCurrent).toBe(true);
  });

  it("returns null when no entry matches the id", async () => {
    freshFetchMock.mockResolvedValueOnce(null);

    const entry = await getExperienceEntryById("missing");

    expect(entry).toBeNull();
  });
});
