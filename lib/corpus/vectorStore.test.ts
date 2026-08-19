import { beforeEach, describe, expect, it, vi } from "vitest";

const { upsertMock, deleteMock, fromEnvMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  deleteMock: vi.fn(),
  fromEnvMock: vi.fn(),
}));

vi.mock("@upstash/vector", () => ({
  Index: { fromEnv: fromEnvMock },
}));

const { upsertChunks, deleteDocumentChunks } = await import("./vectorStore");

import type { CorpusChunk } from "./types";

describe("vectorStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromEnvMock.mockReturnValue({ upsert: upsertMock, delete: deleteMock });
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

    it("upserts each chunk with its id, vector, and metadata", async () => {
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
});
