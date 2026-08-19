import { Index } from "@upstash/vector";

import type { CorpusChunk, CorpusChunkMetadata } from "./types";

let index: Index<CorpusChunkMetadata> | undefined;

function getIndex(): Index<CorpusChunkMetadata> {
  if (!index) {
    index = Index.fromEnv();
  }
  return index;
}

export interface CorpusChunkMatch {
  id: string;
  score: number;
  metadata: CorpusChunkMetadata;
  text: string;
}

export async function queryChunks(
  vector: number[],
  topK: number,
): Promise<CorpusChunkMatch[]> {
  const results = await getIndex().query({
    vector,
    topK,
    includeMetadata: true,
    includeData: true,
  });

  return results
    .filter((result): result is typeof result & { metadata: CorpusChunkMetadata } =>
      result.metadata != null,
    )
    .map((result) => ({
      id: String(result.id),
      score: result.score,
      metadata: result.metadata,
      text: result.data ?? "",
    }));
}

export async function upsertChunks(
  chunks: CorpusChunk[],
  vectors: number[][],
): Promise<void> {
  if (chunks.length === 0) return;
  if (chunks.length !== vectors.length) {
    throw new Error("upsertChunks: chunks and vectors length mismatch");
  }

  await getIndex().upsert(
    chunks.map((chunk, i) => ({
      id: chunk.id,
      vector: vectors[i],
      metadata: chunk.metadata,
      data: chunk.text,
    })),
  );
}

// Chunk ids are positional (`${documentId}:${index}`), so deleting by prefix
// clears every existing chunk for a document regardless of how many there
// were previously — republishing with fewer chunks never leaves stale ones.
export async function deleteDocumentChunks(documentId: string): Promise<void> {
  await getIndex().delete({ prefix: `${documentId}:` });
}
