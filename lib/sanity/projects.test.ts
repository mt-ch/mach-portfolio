import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("./client", () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

const { getProject, getProjects } = await import("./projects");

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
