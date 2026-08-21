import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const freshFetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
  freshClient: { fetch: (...args: unknown[]) => freshFetchMock(...args) },
}));

const {
  getFeaturedProjects,
  getOtherProjects,
  getProject,
  getProjectForIndexById,
  getProjects,
  getProjectsForIndex,
} = await import("./projects");

describe("getFeaturedProjects", () => {
  it("queries featured projects ordered by the `order` field", async () => {
    const projects = [
      { _id: "1", title: "A", order: 1, featured: true },
    ];
    fetchMock.mockResolvedValueOnce(projects);

    const result = await getFeaturedProjects();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("featured == true"),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("order(order asc)"),
    );
    expect(result).toEqual(projects);
  });
});

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

describe("getOtherProjects", () => {
  it("excludes the current project and orders by the `order` field", async () => {
    const projects = [
      { _id: "2", title: "B", order: 2 },
      { _id: "3", title: "C", order: 3 },
    ];
    fetchMock.mockResolvedValueOnce(projects);

    const result = await getOtherProjects("1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("_id != $currentId"),
      { currentId: "1" },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("order(order asc)"),
      { currentId: "1" },
    );
    expect(result).toEqual(projects);
  });
});

describe("getProjectsForIndex", () => {
  it("fetches all projects including story, for corpus indexing", async () => {
    const projects = [
      { _id: "1", title: "A", slug: { current: "a" }, story: [] },
    ];
    fetchMock.mockResolvedValueOnce(projects);

    const result = await getProjectsForIndex();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("story"));
    expect(result).toEqual(projects);
  });
});

describe("getProjectForIndexById", () => {
  it("fetches a single project by id via the non-CDN client, including story, for reindexing", async () => {
    const project = { _id: "1", title: "A", slug: { current: "a" }, story: [] };
    freshFetchMock.mockResolvedValueOnce(project);

    const result = await getProjectForIndexById("1");

    expect(freshFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("story"),
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
