import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CorpusChunkMatch } from "@/lib/assistant/corpus/vectorStore";

const { embedTextsMock, queryChunksMock } = vi.hoisted(() => ({
  embedTextsMock: vi.fn(),
  queryChunksMock: vi.fn(),
}));

vi.mock("@/lib/assistant/corpus/embed", () => ({ embedTexts: embedTextsMock }));
vi.mock("@/lib/assistant/corpus/vectorStore", () => ({ queryChunks: queryChunksMock }));

const { retrieveChunks, TOP_K } = await import("./retrieve");

function match(
  id: string,
  score: number,
  documentType: CorpusChunkMatch["metadata"]["documentType"] = "project",
): CorpusChunkMatch {
  return {
    id,
    score,
    metadata: { documentType, documentId: id },
    text: id,
  };
}

describe("retrieveChunks", () => {
  beforeEach(() => {
    embedTextsMock.mockReset();
    queryChunksMock.mockReset();
  });

  it("uses a fixed top-k of 6", () => {
    expect(TOP_K).toBe(6);
  });

  it("embeds the message and over-fetches 12 matches from the vector store", async () => {
    embedTextsMock.mockResolvedValue([[0.1, 0.2]]);
    queryChunksMock.mockResolvedValue([match("a:0", 0.9)]);

    const result = await retrieveChunks("has he worked with distributed systems?");

    expect(embedTextsMock).toHaveBeenCalledWith([
      "has he worked with distributed systems?",
    ]);
    expect(queryChunksMock).toHaveBeenCalledWith([0.1, 0.2], 12);
    expect(result).toEqual([match("a:0", 0.9)]);
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

  it("passes through unchanged when the store returned no more than TOP_K", async () => {
    embedTextsMock.mockResolvedValue([[0.1]]);
    const small = [
      match("a:0", 0.9, "knowledge"),
      match("b:0", 0.8, "knowledge"),
      match("c:0", 0.7, "knowledge"),
      match("d:0", 0.6, "knowledge"),
    ];
    queryChunksMock.mockResolvedValue(small);

    const result = await retrieveChunks("q");

    expect(result).toEqual(small);
  });

  it("trims an over-fetch to TOP_K, capping knowledge chunks at 3 and backfilling with Sanity chunks", async () => {
    embedTextsMock.mockResolvedValue([[0.1]]);
    queryChunksMock.mockResolvedValue([
      match("k1", 0.99, "knowledge"),
      match("k2", 0.98, "knowledge"),
      match("k3", 0.97, "knowledge"),
      match("k4", 0.96, "knowledge"),
      match("k5", 0.95, "knowledge"),
      match("p1", 0.94, "project"),
      match("e1", 0.93, "experience"),
      match("p2", 0.92, "project"),
      match("p3", 0.91, "project"),
      match("p4", 0.9, "project"),
      match("p5", 0.89, "project"),
      match("p6", 0.88, "project"),
    ]);

    const result = await retrieveChunks("q");

    expect(result.map((m) => m.id)).toEqual(["k1", "k2", "k3", "p1", "e1", "p2"]);
    expect(result).toHaveLength(TOP_K);
    expect(result.filter((m) => m.metadata.documentType === "knowledge")).toHaveLength(3);
  });

  it("keeps all knowledge chunks when there are 3 or fewer among the top matches", async () => {
    embedTextsMock.mockResolvedValue([[0.1]]);
    queryChunksMock.mockResolvedValue([
      match("p1", 0.99, "project"),
      match("k1", 0.98, "knowledge"),
      match("p2", 0.97, "project"),
      match("k2", 0.96, "knowledge"),
      match("p3", 0.95, "project"),
      match("p4", 0.94, "project"),
      match("p5", 0.93, "project"),
      match("p6", 0.92, "project"),
    ]);

    const result = await retrieveChunks("q");

    expect(result.map((m) => m.id)).toEqual(["p1", "k1", "p2", "k2", "p3", "p4"]);
  });
});
