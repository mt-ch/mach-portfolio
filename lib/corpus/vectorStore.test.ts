import { beforeEach, describe, expect, it, vi } from "vitest";

const { upsertMock, deleteMock, queryMock, infoMock, fromEnvMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  deleteMock: vi.fn(),
  queryMock: vi.fn(),
  infoMock: vi.fn(),
  fromEnvMock: vi.fn(),
}));

vi.mock("@upstash/vector", () => ({
  Index: { fromEnv: fromEnvMock },
}));

const { upsertChunks, deleteDocumentChunks, queryChunks, getVectorCount } =
  await import("./vectorStore");

import type { CorpusChunk } from "./types";

describe("vectorStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromEnvMock.mockReturnValue({
      upsert: upsertMock,
      delete: deleteMock,
      query: queryMock,
      info: infoMock,
    });
  });

  describe("upsertChunks", () => {
    it("does nothing for an empty chunk list", async () => {
      await upsertChunks([], []);

      expect(upsertMock).not.toHaveBeenCalled();
    });

    it("throws if chunks and vectors are mismatched in length", async () => {
      const chunks: CorpusChunk[] = [
        {
          id: "a:0",
          documentId: "a",
          documentType: "project",
          text: "x",
          metadata: { documentType: "project", documentId: "a" },
        },
      ];

      await expect(upsertChunks(chunks, [])).rejects.toThrow(/mismatch/);
      expect(upsertMock).not.toHaveBeenCalled();
    });

    it("upserts each chunk with its id, vector, metadata, and text as data", async () => {
      const chunks: CorpusChunk[] = [
        {
          id: "a:0",
          documentId: "a",
          documentType: "project",
          text: "some text",
          metadata: { documentType: "project", documentId: "a", slug: "a" },
        },
      ];

      await upsertChunks(chunks, [[0.1, 0.2]]);

      expect(upsertMock).toHaveBeenCalledWith([
        {
          id: "a:0",
          vector: [0.1, 0.2],
          metadata: { documentType: "project", documentId: "a", slug: "a" },
          data: "some text",
        },
      ]);
    });
  });

  describe("deleteDocumentChunks", () => {
    it("deletes by the document's chunk-id prefix, covering any prior chunk count", async () => {
      await deleteDocumentChunks("project-1");

      expect(deleteMock).toHaveBeenCalledWith({ prefix: "project-1:" });
    });
  });

  describe("queryChunks", () => {
    it("queries with the vector, topK, includeMetadata, and includeData", async () => {
      queryMock.mockResolvedValue([]);

      await queryChunks([0.1, 0.2], 4);

      expect(queryMock).toHaveBeenCalledWith({
        vector: [0.1, 0.2],
        topK: 4,
        includeMetadata: true,
        includeData: true,
      });
    });

    it("maps results to id, score, metadata, and text", async () => {
      queryMock.mockResolvedValue([
        {
          id: "a:0",
          score: 0.92,
          metadata: { documentType: "project", documentId: "a", slug: "a" },
          data: "some text",
        },
      ]);

      const result = await queryChunks([0.1, 0.2], 4);

      expect(result).toEqual([
        {
          id: "a:0",
          score: 0.92,
          metadata: { documentType: "project", documentId: "a", slug: "a" },
          text: "some text",
        },
      ]);
    });

    it("falls back to empty text when data is missing", async () => {
      queryMock.mockResolvedValue([
        {
          id: "a:0",
          score: 0.92,
          metadata: { documentType: "project", documentId: "a" },
        },
      ]);

      const result = await queryChunks([0.1, 0.2], 4);

      expect(result[0].text).toBe("");
    });

    it("drops results with no metadata", async () => {
      queryMock.mockResolvedValue([
        { id: "a:0", score: 0.92, metadata: undefined },
      ]);

      const result = await queryChunks([0.1, 0.2], 4);

      expect(result).toEqual([]);
    });

    it("drops results with null metadata", async () => {
      queryMock.mockResolvedValue([
        { id: "a:0", score: 0.92, metadata: null },
      ]);

      const result = await queryChunks([0.1, 0.2], 4);

      expect(result).toEqual([]);
    });
  });

  describe("getVectorCount", () => {
    it("returns the index's vector count", async () => {
      infoMock.mockResolvedValue({ vectorCount: 42, pendingVectorCount: 0 });

      const result = await getVectorCount();

      expect(result).toBe(42);
      expect(infoMock).toHaveBeenCalled();
    });

    it("returns zero for an empty index", async () => {
      infoMock.mockResolvedValue({ vectorCount: 0, pendingVectorCount: 0 });

      const result = await getVectorCount();

      expect(result).toBe(0);
    });
  });
});
