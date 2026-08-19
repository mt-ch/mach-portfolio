import { beforeEach, describe, expect, it, vi } from "vitest";

const { embedTextsMock, queryChunksMock } = vi.hoisted(() => ({
  embedTextsMock: vi.fn(),
  queryChunksMock: vi.fn(),
}));

vi.mock("@/lib/corpus/embed", () => ({ embedTexts: embedTextsMock }));
vi.mock("@/lib/corpus/vectorStore", () => ({ queryChunks: queryChunksMock }));

const { retrieveChunks, TOP_K } = await import("./retrieve");

describe("retrieveChunks", () => {
  beforeEach(() => {
    embedTextsMock.mockReset();
    queryChunksMock.mockReset();
  });

  it("embeds the message and queries the vector store with the fixed top-k", async () => {
    embedTextsMock.mockResolvedValue([[0.1, 0.2]]);
    queryChunksMock.mockResolvedValue([{ id: "a:0", score: 0.9, metadata: {}, text: "x" }]);

    const result = await retrieveChunks("has he worked with distributed systems?");

    expect(embedTextsMock).toHaveBeenCalledWith([
      "has he worked with distributed systems?",
    ]);
    expect(queryChunksMock).toHaveBeenCalledWith([0.1, 0.2], TOP_K);
    expect(result).toEqual([{ id: "a:0", score: 0.9, metadata: {}, text: "x" }]);
  });

  it("returns an empty array without querying when embedding yields no vector", async () => {
    embedTextsMock.mockResolvedValue([]);

    const result = await retrieveChunks("hello");

    expect(result).toEqual([]);
    expect(queryChunksMock).not.toHaveBeenCalled();
  });

  it("returns an empty array without querying when embedding yields an empty vector", async () => {
    embedTextsMock.mockResolvedValue([[]]);

    const result = await retrieveChunks("hello");

    expect(result).toEqual([]);
    expect(queryChunksMock).not.toHaveBeenCalled();
  });
});
