import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAboutMock,
  getExperienceMock,
  getProjectsForIndexMock,
  getKnowledgeEntriesForIndexMock,
  reindexChunksMock,
} = vi.hoisted(() => ({
  getAboutMock: vi.fn(),
  getExperienceMock: vi.fn(),
  getProjectsForIndexMock: vi.fn(),
  getKnowledgeEntriesForIndexMock: vi.fn(),
  reindexChunksMock: vi.fn(),
}));

vi.mock("@/lib/sanity", () => ({
  getAbout: getAboutMock,
  getExperience: getExperienceMock,
  getProjectsForIndex: getProjectsForIndexMock,
  getKnowledgeEntriesForIndex: getKnowledgeEntriesForIndexMock,
}));
vi.mock("./reindexDocument", () => ({ reindexChunks: reindexChunksMock }));

const { runBackfill } = await import("./backfill");

describe("runBackfill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reindexChunksMock.mockResolvedValue(1);
  });

  it("reindexes About, every Experience entry, every Project, and every Knowledge Base Entry, and totals the chunk count", async () => {
    getAboutMock.mockResolvedValueOnce({ _id: "about", name: "Matt", headline: "Eng" });
    getExperienceMock.mockResolvedValueOnce([
      { _id: "exp-1", company: "Acme", roles: [] },
      { _id: "exp-2", company: "Globex", roles: [] },
    ]);
    getProjectsForIndexMock.mockResolvedValueOnce([
      { _id: "project-1", slug: { current: "a" } },
    ]);
    getKnowledgeEntriesForIndexMock.mockResolvedValueOnce([
      { _id: "kb-1", title: "Positioning statement", body: [], tags: null },
    ]);
    reindexChunksMock
      .mockResolvedValueOnce(1) // about
      .mockResolvedValueOnce(1) // exp-1
      .mockResolvedValueOnce(2) // exp-2
      .mockResolvedValueOnce(3) // project-1
      .mockResolvedValueOnce(1); // kb-1

    const result = await runBackfill();

    expect(reindexChunksMock).toHaveBeenCalledWith("about", expect.any(Array));
    expect(reindexChunksMock).toHaveBeenCalledWith("exp-1", expect.any(Array));
    expect(reindexChunksMock).toHaveBeenCalledWith("exp-2", expect.any(Array));
    expect(reindexChunksMock).toHaveBeenCalledWith("project-1", expect.any(Array));
    expect(reindexChunksMock).toHaveBeenCalledWith("kb-1", expect.any(Array));
    expect(result).toEqual({ documentsIndexed: 5, chunksIndexed: 8 });
  });

  it("skips About when there is no About document, without erroring", async () => {
    getAboutMock.mockResolvedValueOnce(null);
    getExperienceMock.mockResolvedValueOnce([]);
    getProjectsForIndexMock.mockResolvedValueOnce([]);
    getKnowledgeEntriesForIndexMock.mockResolvedValueOnce([]);

    const result = await runBackfill();

    expect(reindexChunksMock).not.toHaveBeenCalled();
    expect(result).toEqual({ documentsIndexed: 0, chunksIndexed: 0 });
  });
});
