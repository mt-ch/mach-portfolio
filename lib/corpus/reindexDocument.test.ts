import { beforeEach, describe, expect, it, vi } from "vitest";

const { embedTextsMock, deleteDocumentChunksMock, upsertChunksMock } = vi.hoisted(() => ({
  embedTextsMock: vi.fn(),
  deleteDocumentChunksMock: vi.fn(),
  upsertChunksMock: vi.fn(),
}));

vi.mock("./embed", () => ({ embedTexts: embedTextsMock }));
vi.mock("./vectorStore", () => ({
  deleteDocumentChunks: deleteDocumentChunksMock,
  upsertChunks: upsertChunksMock,
}));

const { reindexChunks } = await import("./reindexDocument");

import type { CorpusChunk } from "./types";

function makeChunk(id: string): CorpusChunk {
  return {
    id,
    documentId: "doc-1",
    documentType: "project",
    text: `text for ${id}`,
    metadata: { documentType: "project", documentId: "doc-1" },
  };
}

describe("reindexChunks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteDocumentChunksMock.mockResolvedValue(undefined);
    upsertChunksMock.mockResolvedValue(undefined);
  });

  it("always deletes the document's existing chunks first", async () => {
    embedTextsMock.mockResolvedValueOnce([[0.1]]);

    await reindexChunks("doc-1", [makeChunk("doc-1:0")]);

    expect(deleteDocumentChunksMock).toHaveBeenCalledWith("doc-1");
  });

  it("purges a document with no chunks (e.g. deleted/unpublished) without embedding or upserting", async () => {
    const result = await reindexChunks("doc-1", []);

    expect(result).toBe(0);
    expect(deleteDocumentChunksMock).toHaveBeenCalledWith("doc-1");
    expect(embedTextsMock).not.toHaveBeenCalled();
    expect(upsertChunksMock).not.toHaveBeenCalled();
  });

  it("embeds chunk text and upserts the resulting vectors, returning the chunk count", async () => {
    const chunks = [makeChunk("doc-1:0"), makeChunk("doc-1:1")];
    embedTextsMock.mockResolvedValueOnce([[0.1], [0.2]]);

    const result = await reindexChunks("doc-1", chunks);

    expect(embedTextsMock).toHaveBeenCalledWith(["text for doc-1:0", "text for doc-1:1"]);
    expect(upsertChunksMock).toHaveBeenCalledWith(chunks, [[0.1], [0.2]]);
    expect(result).toBe(2);
  });
});
