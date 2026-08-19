import { embedTexts } from "./embed";
import type { CorpusChunk } from "./types";
import { deleteDocumentChunks, upsertChunks } from "./vectorStore";

// Delete-then-upsert: always clear the document's prior chunks first, then
// (re)embed and upsert its current chunks. Safe to call with an empty chunk
// array to purge a deleted/unpublished document.
export async function reindexChunks(
  documentId: string,
  chunks: CorpusChunk[],
): Promise<number> {
  await deleteDocumentChunks(documentId);
  if (chunks.length === 0) return 0;

  const vectors = await embedTexts(chunks.map((chunk) => chunk.text));
  await upsertChunks(chunks, vectors);
  return chunks.length;
}
