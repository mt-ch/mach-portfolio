import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const freshFetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
  freshClient: { fetch: (...args: unknown[]) => freshFetchMock(...args) },
}));

const { getProject, getProjectForIndexById, getProjects, getProjectsForIndex } =
  await import("./projects");

describe("getProjects", () => {
  it("queries projects ordered by the `order` field and returns the raw ordering", async () => {
    const projects = [
      { _id: "1", title: "A", order: 1 },
      { _id: "2", title: "B", order: 2 },
    ];
    fetchMock.mockResolvedValueOnce(projects);

    const result = await getProjects();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("order(order asc)"),
    );
    expect(result).toEqual(projects);
  });
});

describe("getProject", () => {
  it("fetches a project by slug", async () => {
    const project = { _id: "1", title: "A", slug: { current: "a" } };
    fetchMock.mockResolvedValueOnce(project);

    const result = await getProject("a");

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
      slug: "a",
    });
    expect(result).toEqual(project);
  });

  it("returns null when no project matches the slug", async () => {
    fetchMock.mockResolvedValueOnce(null);

    const result = await getProject("missing");

    expect(result).toBeNull();
  });
});

describe("getProjectsForIndex", () => {
  it("fetches all projects including body, for corpus indexing", async () => {
    const projects = [
      { _id: "1", title: "A", slug: { current: "a" }, body: [] },
    ];
    fetchMock.mockResolvedValueOnce(projects);

    const result = await getProjectsForIndex();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("body"));
    expect(result).toEqual(projects);
  });
});

describe("getProjectForIndexById", () => {
  it("fetches a single project by id via the non-CDN client, including body, for reindexing", async () => {
    const project = { _id: "1", title: "A", slug: { current: "a" }, body: [] };
    freshFetchMock.mockResolvedValueOnce(project);

    const result = await getProjectForIndexById("1");

    expect(freshFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("body"),
      { id: "1" },
    );
    expect(result).toEqual(project);
  });

  it("returns null when no project matches the id", async () => {
    freshFetchMock.mockResolvedValueOnce(null);

    const result = await getProjectForIndexById("missing");

    expect(result).toBeNull();
  });
});
